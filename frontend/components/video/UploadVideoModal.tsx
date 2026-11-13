'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/lib/api';
import { saveProjectAction } from '@/app/actions/project';

interface UploadVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type UploadState = 'idle' | 'uploading' | 'transcribing' | 'success' | 'error';

export default function UploadVideoModal({ isOpen, onClose }: UploadVideoModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [videoLink, setVideoLink] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [uploadPercent, setUploadPercent] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const resetState = useCallback(() => {
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setSelectedFile(null);
    setVideoLink('');
    setUploadState('idle');
    setUploadPercent(0);
    setErrorMessage('');
    setIsDragging(false);
  }, []);

  const handleClose = useCallback(() => {
    if (uploadState === 'uploading' || uploadState === 'transcribing') {
      const confirmCancel = window.confirm('ต้องการยกเลิกการประมวลผลและออกจากหน้านี้หรือไม่?');
      if (!confirmCancel) return;
    }
    resetState();
    onClose();
  }, [uploadState, resetState, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  const validateFile = (file: File): string | null => {
    const validExtensions = ['.mp4', '.mov', '.webm', '.m4v'];
    const lowerName = file.name.toLowerCase();
    const isValidExt = validExtensions.some((ext) => lowerName.endsWith(ext));
    const isValidMime = file.type.startsWith('video/') || isValidExt;

    if (!isValidMime) {
      return 'รองรับเฉพาะไฟล์วิดีโอ (MP4, MOV, WebM) เท่านั้น';
    }
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return 'ขนาดไฟล์เกินกำหนด (สูงสุดไม่เกิน 50 MB สำหรับแผนฟรี)';
    }
    return null;
  };

  const handleFileSelection = (file: File) => {
    const error = validateFile(file);
    if (error) {
      setErrorMessage(error);
      return;
    }
    setErrorMessage('');
    setSelectedFile(file);
    startUpload(file);
  };

  const startUpload = (file: File) => {
    setUploadState('uploading');
    setUploadPercent(0);
    setErrorMessage('');

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;

    // 1. Real Upload Progress (0% - 100% strictly matched to network bytes)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && e.total > 0) {
        const pct = Math.min(100, Math.round((e.loaded / e.total) * 100));
        setUploadPercent(pct);

        // When bytes finish reaching server (100% uploaded)
        if (e.loaded >= e.total) {
          setUploadPercent(100);
          setTimeout(() => {
            setUploadState('transcribing');
            setUploadPercent(0);

            // Estimate duration: ~0.8s per MB, clamped between 5s and 35s
            const estimatedSeconds = Math.max(6, Math.min(35, Math.round((file.size / (1024 * 1024)) * 0.8) + 4));

            if (timerRef.current) clearInterval(timerRef.current);
            let elapsed = 0;
            timerRef.current = setInterval(() => {
              elapsed += 1;

              // Smooth asymptotic progress that slows down naturally as it nears 95% without fake sudden stuck
              setUploadPercent((prev) => {
                const target = Math.min(95, Math.round((elapsed / estimatedSeconds) * 92));
                if (prev < target) {
                  return prev + Math.max(1, Math.round((target - prev) * 0.3));
                }
                if (prev < 95 && elapsed % 2 === 0) {
                  return prev + 1;
                }
                return prev;
              });
            }, 1000);
          }, 300);
        }
      }
    };

    xhr.onload = async () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          setUploadPercent(100);
          setUploadState('success');

          // Calculate duration from subtitles if available
          let durationVal: string | undefined = undefined;
          const subs = response.subtitles ?? response.segments ?? response.captions ?? [];
          if (Array.isArray(subs) && subs.length > 0) {
            const lastSub = subs[subs.length - 1];
            if (lastSub?.end) {
              durationVal = String(lastSub.end);
            }
          }

          // Use source file name (without extension), fallback to formatted date
          const formattedDate = new Date().toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          });
          const resolvedFileTitle = file.name.replace(/\.[^/.]+$/, '').trim() || `โปรเจกต์ ${formattedDate}`;
          response.title = resolvedFileTitle;
          response.projectName = resolvedFileTitle;

          // Persist directly to Supabase so it immediately appears in /my-video
          let targetUrl = '/editor';
          try {
            const saveRes = await saveProjectAction({
              title: resolvedFileTitle,
              status: 'draft',
              duration: durationVal,
              video_url: response.video_url,
              thumbnail_url: response.thumbnail_url,
              video_filename: response.video_filename,
              subtitles: subs,
              styles: {},
            });

            if (saveRes.success && saveRes.projectId) {
              response.id = saveRes.projectId;
              targetUrl = `/editor?id=${saveRes.projectId}`;
            }
          } catch (saveErr) {
            console.warn('Initial project cloud save notice:', saveErr);
          }

          sessionStorage.setItem('subtitle_project', JSON.stringify(response));

          setTimeout(() => {
            resetState();
            onClose();
            router.push(targetUrl);
          }, 600);
        } catch (err) {
          console.error('Failed to parse upload response:', err);
          setUploadState('error');
          setErrorMessage('ไม่สามารถแปลงข้อมูลที่ได้รับจากเซิร์ฟเวอร์');
        }
      } else {
        let detail = 'การอัปโหลดหรือถอดเสียงล้มเหลว';
        try {
          const errRes = JSON.parse(xhr.responseText);
          if (errRes.detail) detail = errRes.detail;
        } catch { }
        setUploadState('error');
        setErrorMessage(detail);
      }
    };

    xhr.addEventListener('error', () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setUploadState('error');
      setErrorMessage('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ (โปรดตรวจสอบว่า Backend ทำงานอยู่)');
    });

    xhr.addEventListener('abort', () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setUploadState('idle');
    });

    const formData = new FormData();
    formData.append('file', file);

    xhr.open('POST', apiUrl('/api/v1/extract-audio'));
    xhr.send(formData);
  };

  const handleProcessLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = videoLink.trim();
    if (!trimmed) {
      setErrorMessage('กรุณากรอกลิงก์วิดีโอ (YouTube, TikTok หรือ Direct URL)');
      return;
    }

    try {
      new URL(trimmed);
    } catch {
      setErrorMessage('กรุณากรอก URL ลิงก์ที่ถูกต้อง');
      return;
    }

    setErrorMessage('');
    setUploadState('transcribing');
    setUploadPercent(0);

    if (timerRef.current) clearInterval(timerRef.current);
    let linkElapsed = 0;
    timerRef.current = setInterval(() => {
      linkElapsed += 1;

      // Smooth progression up to 95%
      setUploadPercent((prev) => {
        const target = Math.min(95, Math.round((linkElapsed / 25) * 92));
        if (prev < target) {
          return prev + Math.max(1, Math.round((target - prev) * 0.3));
        }
        if (prev < 95 && linkElapsed % 2 === 0) {
          return prev + 1;
        }
        return prev;
      });
    }, 1000);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch(apiUrl('/api/v1/process-link'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
        signal: controller.signal,
      });

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || `Server returned status ${res.status}`);
      }

      const data = await res.json();
      setUploadPercent(100);
      setUploadState('success');

      // Calculate duration from subtitles if available
      let durationVal: string | undefined = undefined;
      const subs = data.subtitles ?? data.segments ?? data.captions ?? [];
      if (Array.isArray(subs) && subs.length > 0) {
        const lastSub = subs[subs.length - 1];
        if (lastSub?.end) {
          durationVal = String(lastSub.end);
        }
      }

      // Use extracted video title from link, fallback to formatted creation date
      const formattedDate = new Date().toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      const resolvedTitle = (data.title && String(data.title).trim()) || `โปรเจกต์ ${formattedDate}`;
      data.title = resolvedTitle;
      data.projectName = resolvedTitle;

      // Persist directly to Supabase so it immediately appears in /my-video
      let targetUrl = '/editor';
      try {
        const saveRes = await saveProjectAction({
          title: resolvedTitle,
          status: 'draft',
          duration: durationVal,
          video_url: data.video_url,
          thumbnail_url: data.thumbnail_url,
          video_filename: data.video_filename,
          subtitles: subs,
          styles: {},
        });

        if (saveRes.success && saveRes.projectId) {
          data.id = saveRes.projectId;
          targetUrl = `/editor?id=${saveRes.projectId}`;
        }
      } catch (saveErr) {
        console.warn('Initial link project cloud save notice:', saveErr);
      }

      sessionStorage.setItem('subtitle_project', JSON.stringify(data));

      setTimeout(() => {
        resetState();
        onClose();
        router.push(targetUrl);
      }, 600);
    } catch (err: unknown) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (err instanceof Error && err.name === 'AbortError') {
        setUploadState('idle');
        return;
      }
      const msg = err instanceof Error ? err.message : String(err);
      setUploadState('error');
      setErrorMessage(`ไม่สามารถประมวลผลลิงก์วิดีโอได้: ${msg}`);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (uploadState === 'uploading' || uploadState === 'transcribing') return;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (uploadState === 'uploading' || uploadState === 'transcribing') return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelection(files[0]);
    }
  };

  if (!isOpen) return null;

  const isBusy = uploadState === 'uploading' || uploadState === 'transcribing';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-modal-title"
      onClick={handleClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md anim-backdrop"
    >
      <div
        className="relative w-full max-w-[540px] overflow-hidden rounded-2xl border border-[#262433] bg-[#0b0a10] p-5 sm:p-6 text-zinc-200 shadow-[0_32px_90px_rgba(0,0,0,0.92),0_0_0_1px_rgba(139,92,246,0.08)] anim-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle top ambient violet hairline */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#8b5cf6]/60 to-transparent" />

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-b from-[#1d1830] to-[#12101d] border border-[#2f284a] text-[#a78bfa] shadow-[0_6px_18px_-6px_rgba(124,58,237,0.45)]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2.5" />
                <polygon points="10 9 16 12 10 15 10 9" fill="currentColor" stroke="none" />
              </svg>
            </div>
            <div className="min-w-0">
              <h3 id="upload-modal-title" className="font-display text-[17px] font-bold text-white tracking-tight leading-snug">
                นำเข้าวิดีโอใหม่
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5 truncate">
                อัปโหลดไฟล์ MP4 / MOV หรือวางลิงก์เพื่อสร้างซับไตเติลอัตโนมัติ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-[#22202d] bg-[#121118] text-zinc-400 hover:border-[#343146] hover:bg-[#191724] hover:text-white transition-colors cursor-pointer"
            title="ปิด (Esc)"
            aria-label="ปิดหน้าต่าง"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Error message alert */}
        {errorMessage && (
          <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-rose-500/35 bg-rose-950/30 px-3.5 py-2.5 text-xs text-rose-300">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span className="flex-1">{errorMessage}</span>
          </div>
        )}

        {/* Main Content Area */}
        <div className="mt-4">
          {uploadState === 'idle' || uploadState === 'error' ? (
            <div>
              {/* Studio File Dropzone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`group relative flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-7 text-center cursor-pointer transition-all duration-200 overflow-hidden ${
                  isDragging
                    ? 'border-[#8b5cf6] bg-[#141024] ring-2 ring-[#8b5cf6]/25 scale-[1.005]'
                    : 'border-[#2c293b] bg-[#08070c] hover:border-[#8b5cf6]/60 hover:bg-[#0e0c16]'
                }`}
              >
                {/* Ambient spotlight glow on hover / drag */}
                <div
                  className={`pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.14),transparent_70%)] transition-opacity duration-300 ${
                    isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
                />

                <div
                  className={`relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-b from-[#1f1a33] to-[#12101d] border text-[#a78bfa] mb-3.5 shadow-[0_10px_28px_-8px_rgba(124,58,237,0.45)] transition-all duration-200 group-hover:-translate-y-0.5 ${
                    isDragging
                      ? 'border-[#8b5cf6] text-[#c4b5fd] scale-105'
                      : 'border-[#31294f] group-hover:border-[#8b5cf6]/60'
                  }`}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>

                <p className="relative text-[15px] font-bold text-white tracking-tight">
                  {isDragging ? 'ปล่อยไฟล์เพื่อเริ่มนำเข้าทันที' : 'ลากไฟล์วิดีโอมาวางที่นี่'}
                </p>

                <div className="relative mt-2 flex items-center justify-center gap-2 text-xs text-zinc-400">
                  <span>หรือ</span>
                  <span className="inline-flex items-center gap-1 rounded-md border border-[#302a4a] bg-[#181525] px-2.5 py-1 text-xs font-semibold text-[#c4b5fd] group-hover:bg-[#7c3aed] group-hover:border-[#8b5cf6] group-hover:text-white transition-colors">
                    เลือกไฟล์จากเครื่อง
                  </span>
                </div>

                {/* Spec chips */}
                <div className="relative mt-5 flex flex-wrap items-center justify-center gap-1.5 font-mono text-[10.5px] text-zinc-400">
                  {['MP4', 'MOV', 'WebM'].map((ext) => (
                    <span
                      key={ext}
                      className="rounded-md border border-[#22202e] bg-[#111018] px-2 py-0.5 text-zinc-300"
                    >
                      {ext}
                    </span>
                  ))}
                  <span className="text-zinc-600 mx-0.5">·</span>
                  <span className="text-zinc-400">สูงสุด 50 MB</span>
                </div>
              </div>

              {/* Divider */}
              <div className="my-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/[0.07]" />
                <span className="text-[11px] font-medium text-zinc-500">หรือวางลิงก์วิดีโอ</span>
                <div className="h-px flex-1 bg-white/[0.07]" />
              </div>

              {/* Link Input Below Upload */}
              <form onSubmit={handleProcessLink} className="space-y-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1 flex items-center">
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="pointer-events-none absolute left-3.5 text-zinc-500"
                    >
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                    <input
                      type="url"
                      value={videoLink}
                      onChange={(e) => {
                        setVideoLink(e.target.value);
                        if (errorMessage) setErrorMessage('');
                      }}
                      placeholder="https://www.youtube.com/watch?v=... หรือลิงก์ TikTok / MP4"
                      aria-label="ลิงก์วิดีโอ (URL)"
                      className="w-full h-10 rounded-xl border border-[#262434] bg-[#08070c] pl-10 pr-9 text-sm text-white placeholder-zinc-600 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20 focus:outline-none transition-all"
                    />
                    {videoLink && (
                      <button
                        type="button"
                        onClick={() => setVideoLink('')}
                        className="absolute right-2.5 flex h-6 w-6 items-center justify-center rounded-md text-zinc-500 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                        aria-label="ล้างลิงก์"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={!videoLink.trim()}
                    className="flex h-10 flex-shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#7c3aed] hover:bg-[#8b5cf6] px-4 text-xs font-bold text-white shadow-[0_8px_24px_-8px_rgba(124,58,237,0.65)] transition-all disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed cursor-pointer active:scale-[0.99]"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    <span>นำเข้าลิงก์</span>
                  </button>
                </div>

                <p className="text-[11px] text-zinc-500 pl-0.5">
                  รองรับลิงก์จาก YouTube, TikTok หรือ Direct MP4 URL
                </p>
              </form>
            </div>
          ) : (
            /* Upload Progress & Transcribing Overlay View */
            <div className="rounded-xl border border-[#252333] bg-[#08070c] p-5">
              <div className="flex items-center gap-3.5 mb-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#151322] border border-[#2c2744] text-[#a78bfa] flex-shrink-0">
                  {uploadState === 'uploading' && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="19" x2="12" y2="5" />
                      <polyline points="5 12 12 5 19 12" />
                    </svg>
                  )}
                  {uploadState === 'transcribing' && (
                    <div className="h-5 w-5 rounded-full border-2 border-[#a78bfa] border-t-transparent animate-spin" />
                  )}
                  {uploadState === 'success' && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-400">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-white truncate">
                      {selectedFile ? selectedFile.name : videoLink || 'วิดีโอจากลิงก์'}
                    </p>
                    <span className="font-mono text-xs font-bold text-[#c4b5fd] tabular-nums flex-shrink-0">
                      {uploadState === 'success'
                        ? '100%'
                        : `${Math.round(uploadPercent)}%`}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5 truncate">
                    {uploadState === 'uploading'
                      ? 'กำลังอัปโหลด...'
                      : uploadState === 'transcribing'
                        ? 'กำลังประมวลผล...'
                        : 'เสร็จสมบูรณ์'}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-[#151420] border border-[#252333]">
                <div
                  className={`h-full transition-all duration-200 ease-out rounded-full ${
                    uploadState === 'success'
                      ? 'bg-emerald-500 w-full'
                      : 'bg-gradient-to-r from-[#7c3aed] to-[#a78bfa]'
                  }`}
                  style={{ width: `${uploadState === 'success' ? 100 : Math.max(4, Math.round(uploadPercent))}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/webm,video/x-m4v,.mp4,.mov,.webm,.m4v"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelection(file);
            e.target.value = '';
          }}
        />

        {/* Cancel Action only when actively processing */}
        {isBusy && (
          <div className="mt-4 flex items-center justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border border-[#262434] bg-[#121118] px-3.5 py-1.5 text-xs font-medium text-zinc-300 hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-200 transition-colors cursor-pointer"
            >
              ยกเลิกการประมวลผล
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
