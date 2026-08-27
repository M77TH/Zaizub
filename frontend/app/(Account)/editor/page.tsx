'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';

interface SubtitleSegment {
  id: number;
  start: number; // in seconds
  end: number;   // in seconds
  text: string;
  isEdited?: boolean;
}

interface SubtitleStyle {
  font_family: string;
  font_size: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  shadow: boolean;
  outline: boolean;
  shadow_color: string;
  shadow_thickness: number;
  text_color: string;
  bg_color: string;
  bg_opacity: number;
  padding_x: number;
  padding_y: number;
  border_radius: number;
  position: 'bottom' | 'center' | 'custom';
  animation: 'none' | 'fade' | 'pop' | 'typewriter';
}

const DEFAULT_STYLES: SubtitleStyle = {
  font_family: 'Noto Sans Thai',
  font_size: 70,
  bold: true,
  italic: false,
  underline: false,
  shadow: true,
  outline: false,
  shadow_color: '#000000',
  shadow_thickness: 2,
  text_color: '#ffffff',
  bg_color: '#000000',
  bg_opacity: 0.7,
  padding_x: 24,
  padding_y: 12,
  border_radius: 12,
  position: 'bottom',
  animation: 'none',
};

const DEFAULT_SUBTITLES: SubtitleSegment[] = [
  {
    id: 1,
    start: 0.0,
    end: 9.1,
    text: 'จงจำความแข็งแกร่งแท้จริง\nใส่สมองเอาไว้ซะ\nว่าฉันคือผู้แข็งแกร่งที่สุด',
    isEdited: true,
  },
  {
    id: 2,
    start: 9.5,
    end: 14.0,
    text: 'ยินดีต้อนรับสู่ระบบสร้างซับไตเติ้ลอัตโนมัติ Zaizub',
    isEdited: false,
  },
];

export default function VideoEditorPage() {
  // State
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [videoFilename, setVideoFilename] = useState<string>('sample_video.mp4');
  const [subtitles, setSubtitles] = useState<SubtitleSegment[]>(DEFAULT_SUBTITLES);
  const [styles, setStyles] = useState<SubtitleStyle>(DEFAULT_STYLES);
  const [projectName, setProjectName] = useState<string>('โปรเจกต์ 28/8/2569');
  const [hasChanges, setHasChanges] = useState<boolean>(true);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [speed, setSpeed] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'text' | 'fx' | 'audio' | 'video' | 'caption' | 'settings'>('text');

  // Video playback state
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(9.1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Status & modal states
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [renderProgress, setRenderProgress] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);

  // Show temporary toast notification
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Format seconds to mm:ss or hh:mm:ss
  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds)) return '0:00';
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Format seconds to precise timecode (00:00:00)
  const formatDetailedTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds)) return '00:00:00';
    const hrs = Math.floor(timeInSeconds / 3600);
    const mins = Math.floor((timeInSeconds % 3600) / 60);
    const secs = Math.floor(timeInSeconds % 60);
    const frames = Math.floor((timeInSeconds % 1) * 30);
    return `${hrs < 10 ? '0' : ''}${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}:${frames < 10 ? '0' : ''}${frames}`;
  };

  // Read initial data from sessionStorage (e.g. from Landing Page Hero generate)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('subtitle_project');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.video_url) {
            // Ensure full URL if relative path returned by backend
            const finalUrl = parsed.video_url.startsWith('http')
              ? parsed.video_url
              : `http://localhost:8000${parsed.video_url}`;
            setVideoUrl(finalUrl);
          }
          if (parsed.video_filename) {
            setVideoFilename(parsed.video_filename);
          }
          if (Array.isArray(parsed.subtitles) && parsed.subtitles.length > 0) {
            setSubtitles(
              parsed.subtitles.map((s: any, idx: number) => ({
                id: s.id || idx + 1,
                start: typeof s.start === 'number' ? s.start : parseFloat(s.start) || 0,
                end: typeof s.end === 'number' ? s.end : parseFloat(s.end) || 3,
                text: s.text || '',
                isEdited: false,
              }))
            );
          }
        } catch (err) {
          console.error('Failed to parse stored subtitle_project:', err);
        }
      }
    }
  }, []);

  // Update video current time on timeupdate
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  // Handle video loaded metadata
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const vidDuration = videoRef.current.duration;
      if (!isNaN(vidDuration) && vidDuration > 0) {
        setDuration(vidDuration);
      }
    }
  };

  // Play / Pause toggle
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  // Seek video
  const seekVideo = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(time, duration));
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  // Handle timeline click
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || duration <= 0) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    seekVideo(percentage * duration);
  };

  // Active subtitle for current playback time
  const activeSubtitle = useMemo(() => {
    return subtitles.find(
      (sub) => currentTime >= sub.start && currentTime <= sub.end
    );
  }, [subtitles, currentTime]);

  // Subtitle actions
  const handleTextChange = (id: number, newText: string) => {
    setSubtitles((prev) =>
      prev.map((sub) => (sub.id === id ? { ...sub, text: newText, isEdited: true } : sub))
    );
    setHasChanges(true);
  };

  const handleDeleteSegment = (id: number) => {
    setSubtitles((prev) => prev.filter((sub) => sub.id !== id));
    setHasChanges(true);
    showToast('ลบส่วนซับไตเติ้ลเรียบร้อย');
  };

  const handleAddSegment = (afterIndex?: number) => {
    const newStart = currentTime;
    const newEnd = Math.min(duration, currentTime + 3.0);
    const newSegment: SubtitleSegment = {
      id: Date.now(),
      start: parseFloat(newStart.toFixed(2)),
      end: parseFloat(newEnd.toFixed(2)),
      text: 'ข้อความซับไตเติ้ลใหม่',
      isEdited: true,
    };

    setSubtitles((prev) => {
      const copy = [...prev];
      if (typeof afterIndex === 'number' && afterIndex >= 0) {
        copy.splice(afterIndex + 1, 0, newSegment);
      } else {
        copy.push(newSegment);
      }
      return copy.sort((a, b) => a.start - b.start);
    });
    setHasChanges(true);
    showToast('เพิ่มส่วนซับไตเติ้ลแล้ว');
  };

  const handleSplitSegment = (id: number) => {
    const segment = subtitles.find((s) => s.id === id);
    if (!segment) return;
    if (currentTime <= segment.start || currentTime >= segment.end) {
      showToast('กรุณาเลื่อนวิดีโอมายังช่วงเวลาที่ต้องการตัดแบ่ง');
      return;
    }

    const firstHalf: SubtitleSegment = {
      ...segment,
      end: parseFloat(currentTime.toFixed(2)),
      isEdited: true,
    };

    const secondHalf: SubtitleSegment = {
      id: Date.now(),
      start: parseFloat(currentTime.toFixed(2)),
      end: segment.end,
      text: segment.text,
      isEdited: true,
    };

    setSubtitles((prev) =>
      prev
        .map((s) => (s.id === id ? firstHalf : s))
        .concat(secondHalf)
        .sort((a, b) => a.start - b.start)
    );
    setHasChanges(true);
    showToast('ตัดแบ่งเซกเมนต์เรียบร้อย');
  };

  // Direct video upload within editor
  const handleDirectUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    showToast('กำลังอัปโหลดและประมวลผลเสียง...');

    const localUrl = URL.createObjectURL(file);
    setVideoUrl(localUrl);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('http://localhost:8000/api/v1/extract-audio', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('API request failed');
      const data = await res.json();

      if (data.video_filename) {
        setVideoFilename(data.video_filename);
      }
      if (Array.isArray(data.subtitles) && data.subtitles.length > 0) {
        setSubtitles(
          data.subtitles.map((s: any, idx: number) => ({
            id: s.id || idx + 1,
            start: typeof s.start === 'number' ? s.start : parseFloat(s.start) || 0,
            end: typeof s.end === 'number' ? s.end : parseFloat(s.end) || 3,
            text: s.text || '',
            isEdited: false,
          }))
        );
      }
      showToast('แยกเสียงและสร้างซับสำเร็จ!');
    } catch (err) {
      console.warn('Backend unavailable, using local mock subtitles:', err);
      showToast('ใช้ข้อมูลตัวอย่าง (Backend ไม่ตอบสนอง)');
    } finally {
      setIsUploading(false);
    }
  };

  // Export SRT
  const handleExportSRT = () => {
    if (subtitles.length === 0) {
      showToast('ไม่มีซับไตเติ้ลสำหรับส่งออก');
      return;
    }

    const formatSrtTime = (seconds: number) => {
      const hrs = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);
      const ms = Math.floor((seconds % 1) * 1000);
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
    };

    let srtContent = '';
    subtitles.forEach((sub, i) => {
      srtContent += `${i + 1}\n`;
      srtContent += `${formatSrtTime(sub.start)} --> ${formatSrtTime(sub.end)}\n`;
      srtContent += `${sub.text}\n\n`;
    });

    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.replace(/\s+/g, '_')}.srt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('ส่งออกไฟล์ .SRT สำเร็จ');
  };

  // Save project
  const handleSave = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(
        'subtitle_project',
        JSON.stringify({
          video_url: videoUrl,
          video_filename: videoFilename,
          subtitles,
          styles,
        })
      );
    }
    setHasChanges(false);
    showToast('บันทึกโปรเจกต์เรียบร้อย');
  };

  // Render Video (API Call 2)
  const handleRenderVideo = async () => {
    setIsRendering(true);
    setRenderProgress('กำลังสร้างไฟล์ .ass และฝังซับไตเติ้ลด้วย FFmpeg...');

    try {
      const payload = {
        video_filename: videoFilename,
        subtitles: subtitles.map((s) => ({
          id: s.id,
          start: s.start,
          end: s.end,
          text: s.text,
        })),
        styles: {
          ...styles,
          position: styles.position,
          animation: styles.animation,
        },
      };

      const res = await fetch('http://localhost:8000/api/v1/render-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || `Render failed with status ${res.status}`);
      }

      setRenderProgress('ดาวน์โหลดวิดีโอที่เรนเดอร์เสร็จแล้ว...');
      const blob = await res.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `rendered_${videoFilename}`;
      a.click();
      URL.revokeObjectURL(downloadUrl);

      showToast('เรนเดอร์วิดีโอสำเร็จและเริ่มดาวน์โหลดแล้ว!');
      setHasChanges(false);
    } catch (err: any) {
      console.error('Render error:', err);
      alert(`เกิดข้อผิดพลาดในการเรนเดอร์: ${err.message || err}`);
    } finally {
      setIsRendering(false);
      setRenderProgress('');
    }
  };

  // Filtered subtitles by search query
  const filteredSubtitles = useMemo(() => {
    if (!searchQuery.trim()) return subtitles;
    return subtitles.filter((s) =>
      s.text.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [subtitles, searchQuery]);

  // CSS for real-time overlay
  const overlayStyle = useMemo(() => {
    const textShadowValues = [];
    if (styles.shadow) {
      textShadowValues.push(
        `${styles.shadow_thickness}px ${styles.shadow_thickness}px ${styles.shadow_thickness * 2}px ${styles.shadow_color}`
      );
    }
    if (styles.outline) {
      textShadowValues.push(
        `-1px -1px 0 ${styles.shadow_color}, 1px -1px 0 ${styles.shadow_color}, -1px 1px 0 ${styles.shadow_color}, 1px 1px 0 ${styles.shadow_color}`
      );
    }

    // Convert hex bg to rgba with opacity
    let bgRgba = 'transparent';
    if (styles.bg_opacity > 0) {
      const hex = styles.bg_color.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16) || 0;
      const g = parseInt(hex.substring(2, 4), 16) || 0;
      const b = parseInt(hex.substring(4, 6), 16) || 0;
      bgRgba = `rgba(${r}, ${g}, ${b}, ${styles.bg_opacity})`;
    }

    return {
      fontFamily: styles.font_family,
      fontSize: `${Math.max(16, styles.font_size * 0.45)}px`, // responsive scale for player
      fontWeight: styles.bold ? 700 : 400,
      fontStyle: styles.italic ? 'italic' : 'normal',
      textDecoration: styles.underline ? 'underline' : 'none',
      color: styles.text_color,
      textShadow: textShadowValues.join(', ') || 'none',
      backgroundColor: bgRgba,
      padding: `${styles.padding_y}px ${styles.padding_x}px`,
      borderRadius: `${styles.border_radius}px`,
      textAlign: 'center' as const,
      lineHeight: 1.35,
      whiteSpace: 'pre-wrap' as const,
    };
  }, [styles]);

  // Overlay position classes
  const positionClasses = useMemo(() => {
    if (styles.position === 'center') {
      return 'top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2';
    }
    if (styles.position === 'custom') {
      return 'top-8 left-1/2 -translate-x-1/2';
    }
    return 'bottom-8 left-1/2 -translate-x-1/2';
  }, [styles.position]);

  // Overlay animation class
  const animationClass = useMemo(() => {
    if (styles.animation === 'fade') return 'anim-fade';
    if (styles.animation === 'pop') return 'anim-pop';
    return '';
  }, [styles.animation]);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#0a0a0a] text-gray-200 select-none font-sans">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 z-50 -translate-x-1/2 rounded-full bg-cyan-500/90 px-4 py-2 text-xs font-semibold text-black shadow-lg backdrop-blur-md transition-all">
          {toastMessage}
        </div>
      )}

      {/* Render loading overlay modal */}
      {isRendering && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-[#121212] p-8 text-center shadow-2xl">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent"></div>
            <p className="text-lg font-bold text-white">กำลังเรนเดอร์วิดีโอ</p>
            <p className="text-xs text-gray-400 max-w-xs">{renderProgress}</p>
          </div>
        </div>
      )}

      {/* 1. TOP NAVBAR */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-[#1f1f1f] bg-[#0a0a0a] px-4">
        {/* Left: Back arrow, Project Name, Status badge */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
            title="กลับสู่หน้าหลัก"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <input
            type="text"
            value={projectName}
            onChange={(e) => {
              setProjectName(e.target.value);
              setHasChanges(true);
            }}
            className="bg-transparent font-semibold text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-400/50 rounded px-1.5 py-0.5"
          />
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
              hasChanges
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}
          >
            {hasChanges ? 'มีการเปลี่ยนแปลง' : 'บันทึกแล้ว'}
          </span>
        </div>

        {/* Center: Tools, Ratio, Crop, Speed, Undo/Redo */}
        <div className="flex items-center gap-1.5 text-xs text-gray-300">
          <button
            onClick={() => showToast('ซิงค์ซับกับเสียงอัตโนมัติแล้ว')}
            className="flex items-center gap-1.5 rounded-lg bg-white/5 hover:bg-white/10 px-3 py-1.5 transition-colors border border-white/5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v20M17 5v14M7 9v6M2 12h2M20 12h2" />
            </svg>
            <span>รีเซ็ตซับให้ตรงกับเสียง</span>
          </button>

          {/* Aspect Ratio Selector */}
          <div className="relative flex items-center rounded-lg bg-white/5 px-2 py-1 border border-white/5">
            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value as any)}
              className="bg-transparent text-xs text-gray-300 focus:outline-none cursor-pointer pr-1"
            >
              <option value="16:9" className="bg-[#121212]">16:9 • เต็มจอ</option>
              <option value="9:16" className="bg-[#121212]">9:16 • แนวตั้ง</option>
              <option value="1:1" className="bg-[#121212]">1:1 • จัตุรัส</option>
            </select>
          </div>

          <button
            onClick={() => showToast('เครื่องมือครอบภาพ')}
            className="flex items-center gap-1 rounded-lg bg-white/5 hover:bg-white/10 px-2.5 py-1.5 transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2v14a2 2 0 0 0 2 2h14" />
              <path d="M18 22V8a2 2 0 0 0-2-2H2" />
            </svg>
            <span>ครอบ</span>
          </button>

          <div className="flex items-center rounded-lg bg-white/5 px-2 py-1">
            <select
              value={speed}
              onChange={(e) => {
                const s = parseFloat(e.target.value);
                setSpeed(s);
                if (videoRef.current) videoRef.current.playbackRate = s;
              }}
              className="bg-transparent text-xs text-gray-300 focus:outline-none cursor-pointer"
            >
              <option value={0.5} className="bg-[#121212]">0.5x</option>
              <option value={1} className="bg-[#121212]">1x</option>
              <option value={1.25} className="bg-[#121212]">1.25x</option>
              <option value={1.5} className="bg-[#121212]">1.5x</option>
              <option value={2} className="bg-[#121212]">2x</option>
            </select>
          </div>

          {/* Undo / Redo */}
          <button
            onClick={() => showToast('เลิกทำ')}
            className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            title="Undo"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 7v6h6" />
              <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
            </svg>
          </button>
          <button
            onClick={() => showToast('ทำซ้ำ')}
            className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            title="Redo"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 7v6h-6" />
              <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
            </svg>
          </button>

          <button
            onClick={() => {
              setStyles(DEFAULT_STYLES);
              showToast('รีเซ็ตสไตล์เริ่มต้น');
            }}
            className="rounded-lg bg-white/5 hover:bg-white/10 px-2.5 py-1.5 transition-colors"
          >
            รีเซ็ต
          </button>
        </div>

        {/* Right: Export SRT, Save, Render Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportSRT}
            className="flex items-center gap-1.5 rounded-lg bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs text-gray-200 border border-white/10 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>ส่งออก SRT</span>
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/15 px-3 py-1.5 text-xs font-medium text-white border border-white/15 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            <span>บันทึก</span>
          </button>

          {/* Render Prominent Button */}
          <button
            onClick={handleRenderVideo}
            disabled={isRendering}
            className="flex items-center gap-2 rounded-lg bg-white hover:bg-gray-100 text-black px-4 py-1.5 text-xs font-bold transition-all shadow-[0_0_20px_rgba(255,255,255,0.25)] active:scale-95 disabled:opacity-50"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            <span>เรนเดอร์</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN 3-COLUMN WORKSPACE */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT COLUMN: Transcript Sidebar */}
        <div className="flex w-72 flex-col border-r border-[#1f1f1f] bg-[#0c0c0c]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#1f1f1f] p-3">
            <div>
              <h2 className="text-sm font-bold text-white">Transcript</h2>
              <p className="text-[11px] text-gray-400">{subtitles.length} เซกเมนต์</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  const q = prompt('ค้นหาคำในซับไตเติ้ล:', searchQuery);
                  if (q !== null) setSearchQuery(q);
                }}
                className="flex h-7 w-7 items-center justify-center rounded text-gray-400 hover:bg-white/10 hover:text-white"
                title="ค้นหา"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>
            </div>
          </div>

          {/* Add section button at top */}
          <div className="p-2 border-b border-[#181818]">
            <button
              onClick={() => handleAddSegment(0)}
              className="w-full rounded-lg border border-dashed border-white/15 py-1.5 text-xs text-gray-400 hover:border-cyan-400/40 hover:bg-white/5 hover:text-white transition-colors"
            >
              + เพิ่มส่วน
            </button>
          </div>

          {/* Subtitle segments list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2.5 custom-scrollbar">
            {filteredSubtitles.map((sub, index) => {
              const isActive = currentTime >= sub.start && currentTime <= sub.end;
              const subDuration = (sub.end - sub.start).toFixed(1);

              return (
                <div
                  key={sub.id}
                  className={`rounded-xl border p-3 transition-all ${
                    isActive
                      ? 'border-cyan-500/50 bg-[#151515] shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                      : 'border-[#1e1e1e] bg-[#111111] hover:border-white/15'
                  }`}
                >
                  {/* Card top: #index, edited badge, delete button */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-mono font-bold text-gray-400">
                        #{index + 1}
                      </span>
                      {sub.isEdited && (
                        <span className="rounded bg-amber-500/20 px-1.5 py-0.2 text-[9px] font-medium text-amber-300">
                          แก้ไขแล้ว
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleSplitSegment(sub.id)}
                        className="text-gray-500 hover:text-cyan-300 p-1 transition-colors"
                        title="ตัดแบ่งเซกเมนต์ที่เวลาปัจจุบัน"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="6" cy="6" r="3" />
                          <circle cx="6" cy="18" r="3" />
                          <line x1="20" y1="4" x2="8.12" y2="15.88" />
                          <line x1="14.47" y1="14.48" x2="20" y2="20" />
                          <line x1="8.12" y1="8.12" x2="12" y2="12" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteSegment(sub.id)}
                        className="text-gray-500 hover:text-red-400 p-1 transition-colors"
                        title="ลบส่วนนี้"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Subtitle text area */}
                  <textarea
                    value={sub.text}
                    onChange={(e) => handleTextChange(sub.id, e.target.value)}
                    rows={Math.max(2, sub.text.split('\n').length)}
                    className="w-full bg-transparent text-xs text-white leading-relaxed focus:outline-none focus:ring-1 focus:ring-cyan-500/40 rounded p-1 resize-none"
                  />

                  {/* Card bottom: Timestamp button & duration */}
                  <div className="mt-2 flex items-center justify-between pt-1 border-t border-white/5">
                    <button
                      onClick={() => seekVideo(sub.start)}
                      className="rounded bg-[#1a1a1a] px-2 py-0.5 font-mono text-[10px] text-gray-300 hover:bg-cyan-500/20 hover:text-cyan-300 transition-colors"
                      title="คลิกเพื่อเลื่อนวิดีโอมาที่นี่"
                    >
                      {formatTime(sub.start)} - {formatTime(sub.end)}
                    </button>
                    <span className="font-mono text-[10px] text-gray-500">{subDuration}s</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add section button at bottom */}
          <div className="p-2 border-t border-[#181818]">
            <button
              onClick={() => handleAddSegment()}
              className="w-full rounded-lg border border-dashed border-white/15 py-1.5 text-xs text-gray-400 hover:border-cyan-400/40 hover:bg-white/5 hover:text-white transition-colors"
            >
              + เพิ่มส่วน
            </button>
          </div>
        </div>

        {/* CENTER COLUMN: Video Player & Real-time HTML Overlay */}
        <div className="flex flex-1 flex-col bg-[#050505] overflow-hidden">
          {/* Main Video Screen Container */}
          <div className="relative flex flex-1 items-center justify-center p-4">
            <div
              className={`relative overflow-hidden rounded-2xl bg-black shadow-2xl border border-[#1a1a1a] transition-all duration-300 ${
                aspectRatio === '16:9'
                  ? 'aspect-video w-full max-w-4xl max-h-[70vh]'
                  : aspectRatio === '9:16'
                  ? 'aspect-[9/16] h-full max-h-[70vh]'
                  : 'aspect-square h-full max-h-[70vh]'
              }`}
            >
              {/* Video Element */}
              {videoUrl ? (
                <video
                  ref={videoRef}
                  src={videoUrl}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onClick={togglePlay}
                  className="h-full w-full object-contain cursor-pointer"
                  playsInline
                />
              ) : (
                /* Fallback upload zone inside player */
                <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-gray-400">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <polygon points="23 7 16 12 23 17 23 7" />
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-300">ยังไม่มีวิดีโอที่โหลดอยู่</p>
                    <p className="text-xs text-gray-500">อัปโหลดไฟล์วิดีโอ MP4 หรือ MOV เพื่อเริ่มต้น</p>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 px-4 py-2 text-xs font-bold text-black transition-all"
                  >
                    เลือกไฟล์วิดีโอ
                  </button>
                </div>
              )}

              {/* CRUCIAL: Absolute HTML Overlay <div> for Subtitle Preview */}
              {activeSubtitle && (
                <div
                  className={`pointer-events-none absolute ${positionClasses} max-w-[90%] transition-all duration-100`}
                >
                  <div style={overlayStyle} className={animationClass}>
                    {activeSubtitle.text}
                  </div>
                </div>
              )}

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleDirectUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Transport Bar (Immediately under video) */}
          <div className="flex items-center justify-between border-t border-[#181818] bg-[#0c0c0c] px-4 py-2">
            <div className="flex items-center gap-3">
              {/* Play / Pause button */}
              <button
                onClick={togglePlay}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                {isPlaying ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                )}
              </button>

              {/* Volume toggle & slider */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const next = !isMuted;
                    setIsMuted(next);
                    if (videoRef.current) videoRef.current.muted = next;
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  {isMuted || volume === 0 ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="1" y1="1" x2="23" y2="23" />
                      <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                    </svg>
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setVolume(v);
                    setIsMuted(false);
                    if (videoRef.current) {
                      videoRef.current.volume = v;
                      videoRef.current.muted = false;
                    }
                  }}
                  className="h-1 w-16 accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Time display */}
              <span className="font-mono text-xs text-gray-300">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            {/* Change video button & Fullscreen */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="rounded bg-white/5 hover:bg-white/10 px-2.5 py-1 text-[11px] text-gray-300 border border-white/10 transition-colors"
              >
                เปลี่ยนวิดีโอ
              </button>
              <button
                onClick={() => {
                  if (videoRef.current) {
                    if (document.fullscreenElement) {
                      document.exitFullscreen();
                    } else {
                      videoRef.current.requestFullscreen();
                    }
                  }
                }}
                className="text-gray-400 hover:text-white p-1"
                title="เต็มจอ"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                </svg>
              </button>
            </div>
          </div>

          {/* Precision Controls Toolbar */}
          <div className="flex items-center justify-between border-t border-[#181818] bg-[#090909] px-4 py-1.5 text-xs text-gray-400">
            <span className="font-mono text-[11px] text-gray-300">
              {formatDetailedTime(currentTime)} / {formatDetailedTime(duration)}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const prev = [...subtitles].reverse().find((s) => s.start < currentTime - 0.1);
                  if (prev) seekVideo(prev.start);
                }}
                className="hover:text-white"
                title="เซกเมนต์ก่อนหน้า"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="19 20 9 12 19 4 19 20" />
                  <line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth="2" />
                </svg>
              </button>
              <button onClick={togglePlay} className="hover:text-white">
                {isPlaying ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                )}
              </button>
              <button
                onClick={() => {
                  const next = subtitles.find((s) => s.start > currentTime + 0.1);
                  if (next) seekVideo(next.start);
                }}
                className="hover:text-white"
                title="เซกเมนต์ถัดไป"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 4 15 12 5 20 5 4" />
                  <line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2" />
                </svg>
              </button>
            </div>

            {/* Timeline zoom slider */}
            <div className="flex items-center gap-2 text-[11px]">
              <button onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}>-</button>
              <input
                type="range"
                min="50"
                max="200"
                value={zoomLevel}
                onChange={(e) => setZoomLevel(parseInt(e.target.value))}
                className="h-1 w-16 accent-cyan-400"
              />
              <button onClick={() => setZoomLevel((z) => Math.min(200, z + 10))}>+</button>
              <span>{zoomLevel}%</span>
            </div>
          </div>

          {/* 3. BOTTOM TIMELINE */}
          <div
            ref={timelineRef}
            onClick={handleTimelineClick}
            className="relative h-28 border-t border-[#1f1f1f] bg-[#0d0d0d] p-2 cursor-pointer select-none overflow-x-auto"
          >
            {/* Time ruler */}
            <div className="flex h-5 border-b border-white/10 text-[9px] font-mono text-gray-500">
              {Array.from({ length: Math.ceil(duration) + 1 }).map((_, i) => (
                <div
                  key={i}
                  className="border-l border-white/10 pl-1"
                  style={{ width: `${(1 / duration) * 100}%` }}
                >
                  {i}s
                </div>
              ))}
            </div>

            {/* Subtitle track blocks */}
            <div className="relative mt-2 h-14 rounded-lg bg-[#141414] border border-white/5 overflow-hidden">
              {subtitles.map((sub, i) => {
                const leftPct = (sub.start / duration) * 100;
                const widthPct = Math.max(2, ((sub.end - sub.start) / duration) * 100);
                const isActive = currentTime >= sub.start && currentTime <= sub.end;

                return (
                  <div
                    key={sub.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      seekVideo(sub.start);
                    }}
                    style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                    className={`absolute top-1 bottom-1 flex items-center justify-center rounded-md px-1.5 text-[10px] font-medium truncate cursor-pointer transition-all ${
                      isActive
                        ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20 border border-white/10'
                    }`}
                    title={`${formatTime(sub.start)} - ${formatTime(sub.end)}: ${sub.text}`}
                  >
                    {sub.text}
                  </div>
                );
              })}

              {/* Scrubber / Playhead */}
              <div
                style={{ left: `${(currentTime / duration) * 100}%` }}
                className="pointer-events-none absolute top-0 bottom-0 z-20 w-0.5 bg-red-500"
              >
                <div className="h-2 w-2 -translate-x-[3px] rounded-full bg-red-500" />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Style Editor + Tab Strip */}
        <div className="flex border-l border-[#1f1f1f] bg-[#0c0c0c]">
          {/* Main Style Controls Panel */}
          <div className="w-80 overflow-y-auto p-4 space-y-4 custom-scrollbar text-xs">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-[#1f1f1f]">
              <div className="flex items-center gap-1.5 text-cyan-400 font-medium">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                <span>กำลังแก้: สไตล์ทั้งคลิป</span>
              </div>
              <button className="text-gray-500 hover:text-gray-300">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              </button>
            </div>

            {/* 1. ฟอนต์ (Font Family) */}
            <div>
              <label className="block text-gray-400 mb-1.5">ฟอนต์</label>
              <select
                value={styles.font_family}
                onChange={(e) => {
                  setStyles({ ...styles, font_family: e.target.value });
                  setHasChanges(true);
                }}
                className="w-full rounded-lg border border-[#222] bg-[#141414] p-2 text-white focus:border-cyan-400 focus:outline-none"
              >
                <option value="Noto Sans Thai">Noto Sans Thai - ตัวอย่าง</option>
                <option value="Sarabun">Sarabun (สารบรรณ)</option>
                <option value="Kanit">Kanit (คณิต)</option>
                <option value="Prompt">Prompt (พร้อม)</option>
                <option value="Inter">Inter</option>
                <option value="Arial">Arial</option>
                <option value="Impact">Impact</option>
              </select>
            </div>

            {/* 2. ขนาด (Font Size) */}
            <div>
              <div className="flex justify-between text-gray-400 mb-1">
                <span>ขนาด</span>
                <span className="font-mono text-white">{styles.font_size}px</span>
              </div>
              <input
                type="range"
                min="24"
                max="120"
                value={styles.font_size}
                onChange={(e) => {
                  setStyles({ ...styles, font_size: parseInt(e.target.value) });
                  setHasChanges(true);
                }}
                className="w-full h-1 bg-[#222] rounded accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* 3. รูปแบบตัวอักษร (Text Styles) */}
            <div>
              <label className="block text-gray-400 mb-1.5">รูปแบบตัวอักษร</label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setStyles({ ...styles, bold: !styles.bold });
                    setHasChanges(true);
                  }}
                  className={`flex-1 rounded py-1 font-bold transition-colors ${
                    styles.bold ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400' : 'bg-[#141414] text-gray-400 hover:text-white'
                  }`}
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStyles({ ...styles, italic: !styles.italic });
                    setHasChanges(true);
                  }}
                  className={`flex-1 rounded py-1 italic transition-colors ${
                    styles.italic ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400' : 'bg-[#141414] text-gray-400 hover:text-white'
                  }`}
                >
                  I
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStyles({ ...styles, underline: !styles.underline });
                    setHasChanges(true);
                  }}
                  className={`flex-1 rounded py-1 underline transition-colors ${
                    styles.underline ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400' : 'bg-[#141414] text-gray-400 hover:text-white'
                  }`}
                >
                  U
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStyles({ ...styles, shadow: !styles.shadow });
                    setHasChanges(true);
                  }}
                  className={`flex-1 rounded py-1 text-[11px] transition-colors ${
                    styles.shadow ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400' : 'bg-[#141414] text-gray-400 hover:text-white'
                  }`}
                >
                  เงา
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStyles({ ...styles, outline: !styles.outline });
                    setHasChanges(true);
                  }}
                  className={`flex-1 rounded py-1 text-[11px] transition-colors ${
                    styles.outline ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400' : 'bg-[#141414] text-gray-400 hover:text-white'
                  }`}
                >
                  ขอบ
                </button>
              </div>
            </div>

            {/* 4. สีเงา (Shadow Color) */}
            <div>
              <label className="block text-gray-400 mb-1.5">สีเงา</label>
              <div className="flex items-center gap-1.5">
                {['#000000', '#ef4444', '#3b82f6', '#eab308', '#22c55e', '#ffffff'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setStyles({ ...styles, shadow_color: c, shadow: true });
                      setHasChanges(true);
                    }}
                    style={{ backgroundColor: c }}
                    className={`h-6 w-6 rounded-full border ${
                      styles.shadow_color === c ? 'ring-2 ring-cyan-400 border-white' : 'border-white/20'
                    }`}
                  />
                ))}
                <label className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-gray-600 text-gray-400 hover:border-white hover:text-white cursor-pointer">
                  +
                  <input
                    type="color"
                    value={styles.shadow_color}
                    onChange={(e) => {
                      setStyles({ ...styles, shadow_color: e.target.value, shadow: true });
                      setHasChanges(true);
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* 5. ความหนาเงา (Shadow thickness) */}
            <div>
              <div className="flex justify-between text-gray-400 mb-1">
                <span>ความหนาเงา</span>
                <span className="font-mono text-white">{styles.shadow_thickness}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={styles.shadow_thickness}
                onChange={(e) => {
                  setStyles({ ...styles, shadow_thickness: parseInt(e.target.value) });
                  setHasChanges(true);
                }}
                className="w-full h-1 bg-[#222] rounded accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* 6. สีตัวอักษร (Text Color) */}
            <div>
              <label className="block text-gray-400 mb-1.5">สีตัวอักษร</label>
              <div className="flex items-center gap-1.5">
                {['#ffffff', '#facc15', '#4ade80', '#f472b6', '#22d3ee', '#fb923c'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setStyles({ ...styles, text_color: c });
                      setHasChanges(true);
                    }}
                    style={{ backgroundColor: c }}
                    className={`h-6 w-6 rounded-full border ${
                      styles.text_color === c ? 'ring-2 ring-cyan-400 border-white' : 'border-white/20'
                    }`}
                  />
                ))}
                <label className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-gray-600 text-gray-400 hover:border-white hover:text-white cursor-pointer">
                  +
                  <input
                    type="color"
                    value={styles.text_color}
                    onChange={(e) => {
                      setStyles({ ...styles, text_color: e.target.value });
                      setHasChanges(true);
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* 7. พื้นหลัง (Background) */}
            <div>
              <label className="block text-gray-400 mb-1.5">พื้นหลัง</label>
              <div className="flex items-center gap-1.5 mb-2">
                {['#000000', '#1e293b', '#581c87', '#7f1d1d'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setStyles({ ...styles, bg_color: c, bg_opacity: 0.7 });
                      setHasChanges(true);
                    }}
                    style={{ backgroundColor: c }}
                    className={`h-6 w-6 rounded border ${
                      styles.bg_color === c && styles.bg_opacity > 0 ? 'ring-2 ring-cyan-400 border-white' : 'border-white/20'
                    }`}
                  />
                ))}
                {/* Transparent toggle */}
                <button
                  type="button"
                  onClick={() => {
                    setStyles({ ...styles, bg_opacity: 0 });
                    setHasChanges(true);
                  }}
                  className={`rounded px-2 py-0.5 text-[10px] border ${
                    styles.bg_opacity === 0 ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400' : 'bg-[#141414] text-gray-400 border-white/10'
                  }`}
                >
                  โปร่งใส
                </button>
                <label className="flex h-6 w-6 items-center justify-center rounded border border-dashed border-gray-600 text-gray-400 hover:border-white hover:text-white cursor-pointer">
                  +
                  <input
                    type="color"
                    value={styles.bg_color}
                    onChange={(e) => {
                      setStyles({ ...styles, bg_color: e.target.value, bg_opacity: 0.7 });
                      setHasChanges(true);
                    }}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Background sliders */}
              <div className="space-y-2 pt-1">
                <div>
                  <div className="flex justify-between text-[11px] text-gray-400 mb-0.5">
                    <span>ความทึบ</span>
                    <span>{Math.round(styles.bg_opacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={styles.bg_opacity}
                    onChange={(e) => {
                      setStyles({ ...styles, bg_opacity: parseFloat(e.target.value) });
                      setHasChanges(true);
                    }}
                    className="w-full h-1 bg-[#222] rounded accent-cyan-400 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-gray-400 mb-0.5">
                    <span>ความกว้าง (Padding X)</span>
                    <span>{styles.padding_x}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="48"
                    value={styles.padding_x}
                    onChange={(e) => {
                      setStyles({ ...styles, padding_x: parseInt(e.target.value) });
                      setHasChanges(true);
                    }}
                    className="w-full h-1 bg-[#222] rounded accent-cyan-400 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-gray-400 mb-0.5">
                    <span>ความสูง (Padding Y)</span>
                    <span>{styles.padding_y}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="32"
                    value={styles.padding_y}
                    onChange={(e) => {
                      setStyles({ ...styles, padding_y: parseInt(e.target.value) });
                      setHasChanges(true);
                    }}
                    className="w-full h-1 bg-[#222] rounded accent-cyan-400 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-gray-400 mb-0.5">
                    <span>มุมโค้ง</span>
                    <span>{styles.border_radius}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="24"
                    value={styles.border_radius}
                    onChange={(e) => {
                      setStyles({ ...styles, border_radius: parseInt(e.target.value) });
                      setHasChanges(true);
                    }}
                    className="w-full h-1 bg-[#222] rounded accent-cyan-400 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* 8. ตำแหน่ง (Position) */}
            <div>
              <label className="block text-gray-400 mb-1.5">ตำแหน่ง</label>
              <div className="flex rounded-lg bg-[#141414] p-1 border border-[#222]">
                <button
                  type="button"
                  onClick={() => {
                    setStyles({ ...styles, position: 'bottom' });
                    setHasChanges(true);
                  }}
                  className={`flex-1 rounded py-1 text-xs transition-colors ${
                    styles.position === 'bottom' ? 'bg-cyan-500/20 text-cyan-300 font-medium' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  ล่าง
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStyles({ ...styles, position: 'center' });
                    setHasChanges(true);
                  }}
                  className={`flex-1 rounded py-1 text-xs transition-colors ${
                    styles.position === 'center' ? 'bg-cyan-500/20 text-cyan-300 font-medium' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  กลาง
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStyles({ ...styles, position: 'custom' });
                    setHasChanges(true);
                  }}
                  className={`flex-1 rounded py-1 text-xs transition-colors ${
                    styles.position === 'custom' ? 'bg-cyan-500/20 text-cyan-300 font-medium' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  กำหนดเอง
                </button>
              </div>
            </div>

            {/* 9. อนิเมชั่นคำ (Animation) */}
            <div>
              <label className="block text-gray-400 mb-1.5">อนิเมชั่นคำ</label>
              <select
                value={styles.animation}
                onChange={(e) => {
                  setStyles({ ...styles, animation: e.target.value as any });
                  setHasChanges(true);
                }}
                className="w-full rounded-lg border border-[#222] bg-[#141414] p-2 text-white focus:border-cyan-400 focus:outline-none"
              >
                <option value="none">ไม่มี (None)</option>
                <option value="fade">เลือนเข้า (Fade In)</option>
                <option value="pop">เด้งเข้า (Pop In)</option>
                <option value="typewriter">พิมพ์ดีด (Typewriter)</option>
              </select>
            </div>
          </div>

          {/* Far Right Vertical Tab Icon Strip */}
          <div className="flex w-12 flex-col items-center border-l border-[#1f1f1f] bg-[#080808] py-3 gap-4 text-gray-500">
            <button
              onClick={() => setActiveTab('text')}
              className={`flex h-8 w-8 items-center justify-center rounded-lg font-serif font-bold text-base transition-colors ${
                activeTab === 'text' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40' : 'hover:text-white'
              }`}
              title="ข้อความ / ฟอนต์"
            >
              T
            </button>
            <button
              onClick={() => {
                setActiveTab('fx');
                showToast('ฟีเจอร์เอฟเฟกต์พิเศษ');
              }}
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                activeTab === 'fx' ? 'bg-cyan-500/20 text-cyan-300' : 'hover:text-white'
              }`}
              title="เอฟเฟกต์"
            >
              ✨
            </button>
            <button
              onClick={() => {
                setActiveTab('audio');
                showToast('ฟีเจอร์เสียง');
              }}
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                activeTab === 'audio' ? 'bg-cyan-500/20 text-cyan-300' : 'hover:text-white'
              }`}
              title="เสียง"
            >
              🎵
            </button>
            <button
              onClick={() => {
                setActiveTab('video');
                showToast('ฟีเจอร์วิดีโอ');
              }}
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                activeTab === 'video' ? 'bg-cyan-500/20 text-cyan-300' : 'hover:text-white'
              }`}
              title="วิดีโอ"
            >
              📹
            </button>
            <button
              onClick={() => {
                setActiveTab('caption');
                showToast('ฟีเจอร์คำบรรยาย');
              }}
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                activeTab === 'caption' ? 'bg-cyan-500/20 text-cyan-300' : 'hover:text-white'
              }`}
              title="คำบรรยาย"
            >
              💬
            </button>
            <button
              onClick={() => {
                setActiveTab('settings');
                showToast('การตั้งค่าเลเยอร์');
              }}
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                activeTab === 'settings' ? 'bg-cyan-500/20 text-cyan-300' : 'hover:text-white'
              }`}
              title="การตั้งค่า"
            >
              ⚙️
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

