'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/lib/api';
import { saveProjectAction } from '@/app/actions/project';

interface UploadVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ModeTab = 'file' | 'link';
type UploadState = 'idle' | 'uploading' | 'transcribing' | 'success' | 'error';

export default function UploadVideoModal({ isOpen, onClose }: UploadVideoModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [activeMode, setActiveMode] = useState<ModeTab>('file');
  const [videoLink, setVideoLink] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [uploadPercent, setUploadPercent] = useState<number>(0);
  const [loadedBytes, setLoadedBytes] = useState<number>(0);
  const [totalBytes, setTotalBytes] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [transcribingSeconds, setTranscribingSeconds] = useState<number>(0);
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
    setLoadedBytes(0);
    setTotalBytes(0);
    setErrorMessage('');
    setTranscribingSeconds(0);
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

  const validateFile = (file: File): string | null => {
    const validExtensions = ['.mp4', '.mov', '.webm', '.m4v'];
    const lowerName = file.name.toLowerCase();
    const isValidExt = validExtensions.some((ext) => lowerName.endsWith(ext));
    const isValidMime = file.type.startsWith('video/') || isValidExt;

    if (!isValidMime) {
      return 'รองรับเฉพาะไฟล์วิดีโอ (MP4, MOV, WebM) เท่านั้น';
    }
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      return 'ขนาดไฟล์เกินกำหนด (สูงสุดไม่เกิน 100 MB)';
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

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    const kb = bytes / 1024;
    return `${kb.toFixed(0)} KB`;
  };

  const startUpload = (file: File) => {
    setUploadState('uploading');
    setUploadPercent(1); // Immediate visual feedback that upload started
    setLoadedBytes(0);
    setTotalBytes(file.size);
    setErrorMessage('');

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;

    // Animate progress smoothly towards target percentage
    let currentAnimPercent = 0;
    const animInterval = setInterval(() => {
      // If we haven't reached 100%, increment smoothly
      setUploadPercent((prev) => {
        if (prev >= 100) {
          clearInterval(animInterval);
          return 100;
        }
        // If upload xhr is still going, smoothly creep up
        return prev + 1;
      });
    }, 150);

    // Track upload progress
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && e.total > 0) {
        const pct = Math.min(100, Math.round((e.loaded / e.total) * 100));
        setUploadPercent((prev) => Math.max(prev, pct));
        setLoadedBytes(e.loaded);
        setTotalBytes(e.total);

        // When bytes hit 100%, transition smoothly to server AI transcribing
        if (e.loaded >= e.total) {
          clearInterval(animInterval);
          setUploadPercent(100);
          setTimeout(() => {
            setUploadState('transcribing');
            setTranscribingSeconds(0);
            setUploadPercent(0);

            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = setInterval(() => {
              setTranscribingSeconds((sec) => sec + 1);
              setUploadPercent((prev) => {
                // Smooth progressive creep up to 98% until server responds
                if (prev < 40) return prev + 3;
                if (prev < 70) return prev + 2;
                if (prev < 90) return prev + 1;
                if (prev < 98) return prev + 0.5;
                return 98;
              });
            }, 300);
          }, 350);
        }
      }
    };

    xhr.onload = async () => {
      clearInterval(animInterval);
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
        } catch {}
        setUploadState('error');
        setErrorMessage(detail);
      }
    };

    xhr.addEventListener('error', () => {
      clearInterval(animInterval);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setUploadState('error');
      setErrorMessage('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ (โปรดตรวจสอบว่า Backend ทำงานอยู่)');
    });

    xhr.addEventListener('abort', () => {
      clearInterval(animInterval);
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
    setTranscribingSeconds(0);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTranscribingSeconds((sec) => sec + 1);
      setUploadPercent((prev) => {
        // Fast start (download phase), then steady creep (transcribing phase) up to 98%
        if (prev < 30) return prev + 4;
        if (prev < 60) return prev + 2;
        if (prev < 85) return prev + 1;
        if (prev < 98) return prev + 0.4;
        return 98;
      });
    }, 300);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-[subFadeIn_0.2s_ease-out]">
      <div
        className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-purple-500/20 bg-[#100e18] p-6 sm:p-8 text-gray-200 shadow-[0_0_60px_rgba(139,92,246,0.2)] transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ambient background */}
        <div className="absolute top-0 right-1/4 -z-10 h-48 w-48 rounded-full bg-purple-600/15 blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-5 border-b border-white/5">
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <span>สร้างวิดีโอใหม่</span>
              <span className="rounded-full bg-purple-500/15 border border-purple-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-purple-300">
                AI Auto-Caption
              </span>
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              อัปโหลดไฟล์วิดีโอหรือใส่ลิงก์เพื่อถอดเสียงและสร้างซับไตเติ้ลอัตโนมัติ
            </p>
          </div>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
            title="ปิด"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Navigation Tabs (Upload File vs Video Link) */}
        {uploadState === 'idle' || uploadState === 'error' ? (
          <div className="mt-5 flex rounded-xl bg-white/[0.04] p-1 border border-white/[0.06]">
            <button
              type="button"
              onClick={() => {
                setActiveMode('file');
                setErrorMessage('');
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeMode === 'file'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span>อัปโหลดไฟล์</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveMode('link');
                setErrorMessage('');
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeMode === 'link'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              <span>ลิงก์วิดีโอ (URL)</span>
            </button>
          </div>
        ) : null}

        {/* Error message alert */}
        {errorMessage && (
          <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-950/30 px-3.5 py-2.5 text-xs text-rose-300">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span className="flex-1">{errorMessage}</span>
          </div>
        )}

        {/* Main Content Area */}
        <div className="mt-5">
          {uploadState === 'idle' || uploadState === 'error' ? (
            activeMode === 'file' ? (
              /* Tab 1: File Dropzone */
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-200 ${
                  isDragging
                    ? 'border-purple-400 bg-purple-500/10 scale-[1.01]'
                    : 'border-white/10 bg-white/[0.02] hover:border-purple-500/40 hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-600/15 border border-purple-500/20 text-purple-400 mb-4 transition-transform group-hover:scale-105">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <p className="text-base font-semibold text-white">
                  ลากและวางไฟล์วิดีโอที่นี่ หรือ <span className="text-purple-400 underline underline-offset-2">เลือกไฟล์</span>
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  รองรับไฟล์ MP4, MOV, WebM ขนาดสูงสุดไม่เกิน 100 MB
                </p>
              </div>
            ) : (
              /* Tab 2: Link Input Form */
              <form onSubmit={handleProcessLink} className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                  <label className="block text-xs font-semibold text-gray-300 mb-2">
                    วางลิงก์วิดีโอ (YouTube, TikTok หรือ Direct MP4 URL)
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="url"
                      value={videoLink}
                      onChange={(e) => setVideoLink(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=... หรือ https://..."
                      className="w-full rounded-xl border border-white/10 bg-[#0d0c13] px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors"
                      autoFocus
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-2.5">
                    ระบบจะดาวน์โหลดคลิป แยกเสียง และถอดคำบรรยายด้วย AI ให้คุณโดยอัตโนมัติ
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={!videoLink.trim()}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 py-3 text-sm font-bold text-white shadow-[0_0_25px_rgba(139,92,246,0.35)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  <span>ดึงวิดีโอและสร้างซับไตเติ้ล</span>
                </button>
              </form>
            )
          ) : (
            /* Upload Progress & AI Transcribing Overlay View */
            <div className="rounded-2xl border border-purple-500/20 bg-white/[0.03] p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/20 text-purple-300 flex-shrink-0">
                  {uploadState === 'uploading' && (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-bounce">
                      <line x1="12" y1="19" x2="12" y2="5" />
                      <polyline points="5 12 12 5 19 12" />
                    </svg>
                  )}
                  {uploadState === 'transcribing' && (
                    <div className="h-6 w-6 rounded-full border-2 border-purple-400 border-t-transparent animate-spin" />
                  )}
                  {uploadState === 'success' && (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-400">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-white truncate max-w-[260px] sm:max-w-xs">
                      {selectedFile ? selectedFile.name : videoLink || 'วิดีโอจากลิงก์'}
                    </p>
                    <span className="text-xs font-bold text-purple-300 tabular-nums">
                      {uploadState === 'success'
                        ? '100%'
                        : `${Math.round(uploadPercent)}%`}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {uploadState === 'uploading'
                      ? `อัปโหลด ${formatFileSize(loadedBytes)} จาก ${formatFileSize(totalBytes)}`
                      : uploadState === 'transcribing'
                      ? `AI กำลังถอดเสียงและสร้างซับไตเติ้ล (${transcribingSeconds} วิ)...`
                      : 'เตรียมเปิดพื้นที่ทำงานใน Editor...'}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-black/50 border border-white/10">
                <div
                  className={`h-full transition-all duration-200 ease-out rounded-full shadow-[0_0_12px_rgba(168,85,247,0.5)] ${
                    uploadState === 'success'
                      ? 'bg-emerald-500 w-full'
                      : 'bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-400'
                  }`}
                  style={{ width: `${uploadState === 'success' ? 100 : Math.max(4, Math.round(uploadPercent))}%` }}
                />
              </div>

              {/* Step indicator footer */}
              <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${uploadState === 'uploading' ? 'bg-purple-400 animate-ping' : 'bg-emerald-400'}`} />
                  <span className={uploadState === 'uploading' ? 'text-purple-300 font-medium' : ''}>
                    {activeMode === 'link' ? '1. ดึงข้อมูลวิดีโอ' : '1. อัปโหลดวิดีโอ'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${uploadState === 'transcribing' ? 'bg-purple-400 animate-ping' : uploadState === 'success' ? 'bg-emerald-400' : 'bg-gray-600'}`} />
                  <span className={uploadState === 'transcribing' ? 'text-purple-300 font-medium' : ''}>2. AI ถอดเสียงซับไตเติ้ล</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${uploadState === 'success' ? 'bg-emerald-400 animate-ping' : 'bg-gray-600'}`} />
                  <span className={uploadState === 'success' ? 'text-emerald-300 font-medium' : ''}>3. เข้าสู่ Editor</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/webm"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelection(file);
            e.target.value = '';
          }}
        />

        {/* Modal Actions */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-xs font-medium text-gray-300 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
          >
            {uploadState === 'uploading' || uploadState === 'transcribing' ? 'ยกเลิก' : 'ปิด'}
          </button>
        </div>
      </div>
    </div>
  );
}
