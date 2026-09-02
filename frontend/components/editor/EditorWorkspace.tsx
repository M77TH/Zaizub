'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import EditorHeader from './EditorHeader';
import TranscriptPanel from './TranscriptPanel';
import VideoPlayer from './VideoPlayer';
import TransportControls from './TransportControls';
import StylePanel from './StylePanel';
import TemplatePanel, { SubtitleTemplate } from './TemplatePanel';
import EditorTabs, { EditorTabType } from './EditorTabs';
import {
  SubtitleSegment,
  SubtitleStyle,
  DEFAULT_STYLES,
  DEFAULT_SUBTITLES,
  normaliseSubtitles,
} from './types';
import { apiUrl, API_BASE_URL } from '@/lib/api';

/** Pure utility function for formatting time codes */
export function formatTime(timeInSeconds: number): string {
  if (isNaN(timeInSeconds) || timeInSeconds < 0) return '0:00';
  const mins = Math.floor(timeInSeconds / 60);
  const secs = Math.floor(timeInSeconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export function VideoEditorPage() {
  // State
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [videoFilename, setVideoFilename] = useState<string>('sample_video.mp4');
  const [subtitles, setSubtitles] = useState<SubtitleSegment[]>(DEFAULT_SUBTITLES);
  const [history, setHistory] = useState<SubtitleSegment[][]>([DEFAULT_SUBTITLES]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const isUndoRedoAction = useRef<boolean>(false);

  const pushHistory = useCallback((newSubs: SubtitleSegment[]) => {
    if (isUndoRedoAction.current) return;
    setHistory((prev) => {
      const trimmed = prev.slice(0, historyIndex + 1);
      return [...trimmed, newSubs];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      isUndoRedoAction.current = true;
      const prevSubs = history[historyIndex - 1];
      setSubtitles(prevSubs);
      setHistoryIndex((prev) => prev - 1);
      setHasChanges(true);
      setTimeout(() => { isUndoRedoAction.current = false; }, 50);
    }
  }, [historyIndex, history]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isUndoRedoAction.current = true;
      const nextSubs = history[historyIndex + 1];
      setSubtitles(nextSubs);
      setHistoryIndex((prev) => prev + 1);
      setHasChanges(true);
      setTimeout(() => { isUndoRedoAction.current = false; }, 50);
    }
  }, [historyIndex, history]);

  const [globalStyles, setGlobalStyles] = useState<SubtitleStyle>(DEFAULT_STYLES);
  const [selectedSubtitleId, setSelectedSubtitleId] = useState<number | string | null>(null);

  const [projectName, setProjectName] = useState<string>('โปรเจกต์ 28/8/2569');
  const [hasChanges, setHasChanges] = useState<boolean>(true);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('9:16');
  const [speed, setSpeed] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<EditorTabType>('styles');

  // Playback state
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(9.1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Status & modal states
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [renderProgress, setRenderProgress] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Responsive default panel widths helper based on device screen resolution
  const getDefaultPanelWidths = useCallback((screenWidth: number) => {
    if (screenWidth >= 1600) {
      // Large Desktop / Widescreen PC
      return { left: 320, right: 340 };
    } else if (screenWidth >= 1366) {
      // Standard Laptop / Medium PC
      return { left: 300, right: 330 };
    } else if (screenWidth >= 1024) {
      // Small Laptop / Tablet / iPad Landscape
      return { left: 270, right: 290 };
    } else if (screenWidth >= 768) {
      // Tablet / iPad Portrait
      return { left: 240, right: 260 };
    }
    // Mobile fallback (phone will have dedicated UI)
    return { left: 280, right: 300 };
  }, []);

  // Panel widths state with device-aware default & localStorage persistence
  const [leftPanelWidth, setLeftPanelWidth] = useState<number>(300);
  const [rightPanelWidth, setRightPanelWidth] = useState<number>(330);

  // Load persisted or device-adaptive panel widths
  useEffect(() => {
    try {
      const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1440;
      const defaults = getDefaultPanelWidths(screenWidth);

      const savedLeft = localStorage.getItem('zaizub_left_panel_width');
      const savedRight = localStorage.getItem('zaizub_right_panel_width');

      if (savedLeft) {
        const num = Number(savedLeft);
        if (num >= 200 && num <= 600) setLeftPanelWidth(num);
        else setLeftPanelWidth(defaults.left);
      } else {
        setLeftPanelWidth(defaults.left);
      }

      if (savedRight) {
        const num = Number(savedRight);
        if (num >= 240 && num <= 600) setRightPanelWidth(num);
        else setRightPanelWidth(defaults.right);
      } else {
        setRightPanelWidth(defaults.right);
      }
    } catch {}
  }, [getDefaultPanelWidths]);

  const handleLeftResizeStart = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onPointerMove = (moveEvent: PointerEvent) => {
      const maxAllowed = Math.min(540, window.innerWidth * 0.4);
      const newWidth = Math.max(200, Math.min(maxAllowed, moveEvent.clientX));
      setLeftPanelWidth(newWidth);
    };

    const onPointerUp = () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      setLeftPanelWidth((w) => {
        try { localStorage.setItem('zaizub_left_panel_width', String(w)); } catch {}
        return w;
      });
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  }, []);

  const handleRightResizeStart = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onPointerMove = (moveEvent: PointerEvent) => {
      // 48px is the width of EditorTabs toolbar strip
      const maxAllowed = Math.min(540, window.innerWidth * 0.4);
      const newWidth = Math.max(240, Math.min(maxAllowed, window.innerWidth - moveEvent.clientX - 48));
      setRightPanelWidth(newWidth);
    };

    const onPointerUp = () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      setRightPanelWidth((w) => {
        try { localStorage.setItem('zaizub_right_panel_width', String(w)); } catch {}
        return w;
      });
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  }, []);

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Toast notification helper
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  // Selected subtitle and active styles for StylePanel
  const selectedSubtitle = useMemo(
    () => subtitles.find((s) => s.id === selectedSubtitleId),
    [subtitles, selectedSubtitleId]
  );
  const selectedSubtitleIndex = useMemo(
    () => (selectedSubtitle ? subtitles.findIndex((s) => s.id === selectedSubtitleId) : -1),
    [subtitles, selectedSubtitle, selectedSubtitleId]
  );
  const styles = selectedSubtitle?.style ?? globalStyles;

  // Change style: if a specific subtitle is selected, change only that subtitle's style; otherwise change globalStyles
  const setStyles = useCallback((nextStyles: SubtitleStyle) => {
    if (selectedSubtitleId !== null) {
      setSubtitles((current) =>
        current.map((s) =>
          s.id === selectedSubtitleId ? { ...s, style: nextStyles, isEdited: true } : s
        )
      );
    } else {
      setGlobalStyles(nextStyles);
    }
    setHasChanges(true);
  }, [selectedSubtitleId]);

  // Reset a specific subtitle's style override back to global styles
  const handleResetToGlobal = useCallback((id?: number | string | null) => {
    const targetId = id ?? selectedSubtitleId;
    if (targetId !== null && targetId !== undefined) {
      setSubtitles((current) =>
        current.map((s) => (s.id === targetId ? { ...s, style: undefined, isEdited: false } : s))
      );
      showToast('คืนค่าสไตล์รวม (Global) ให้แคปชันนี้แล้ว');
      setHasChanges(true);
    }
  }, [selectedSubtitleId, showToast]);

  // Apply a subtitle style template to selected subtitle or globally
  const handleApplyTemplate = useCallback((template: SubtitleTemplate) => {
    if (selectedSubtitleId !== null) {
      setSubtitles((current) =>
        current.map((s) =>
          s.id === selectedSubtitleId ? { ...s, style: { ...template.style }, isEdited: true } : s
        )
      );
      showToast(`นำเทมเพลต "${template.name}" ไปใช้กับแคปชันที่เลือกแล้ว`);
    } else {
      setGlobalStyles({ ...template.style });
      showToast(`นำเทมเพลต "${template.name}" ไปใช้กับซับไตเติลทั้งหมดแล้ว`);
    }
    setHasChanges(true);
  }, [selectedSubtitleId, showToast]);

  // Read initial data from sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem('subtitle_project');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.video_url) {
          const isFullUrl =
            parsed.video_url.startsWith('http://') ||
            parsed.video_url.startsWith('https://') ||
            parsed.video_url.startsWith('blob:') ||
            parsed.video_url.startsWith('data:');
          const finalUrl = isFullUrl
            ? parsed.video_url
            : `${API_BASE_URL}${parsed.video_url.startsWith('/') ? '' : '/'}${parsed.video_url}`;
          setVideoUrl(finalUrl);
        }
        if (parsed.video_filename) setVideoFilename(parsed.video_filename);
        if (parsed.globalStyles || parsed.styles) setGlobalStyles(parsed.globalStyles || parsed.styles);
        const storedSubtitles = normaliseSubtitles(parsed.subtitles ?? parsed.segments ?? parsed.captions);
        if (storedSubtitles.length > 0) setSubtitles(storedSubtitles);
      } catch (err) {
        console.error('Failed to parse stored subtitle_project:', err);
      }
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
  }, []);

  // 60fps ultra-smooth playback tracking for butter-smooth progress bars
  useEffect(() => {
    let animFrameId: number;
    const updateSmoothTime = () => {
      if (videoRef.current && !videoRef.current.paused) {
        setCurrentTime(videoRef.current.currentTime);
        animFrameId = requestAnimationFrame(updateSmoothTime);
      }
    };

    if (isPlaying) {
      animFrameId = requestAnimationFrame(updateSmoothTime);
    }

    return () => {
      if (animFrameId) cancelAnimationFrame(animFrameId);
    };
  }, [isPlaying]);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      const vidDuration = videoRef.current.duration;
      if (!isNaN(vidDuration) && vidDuration > 0) setDuration(vidDuration);

      const vidWidth = videoRef.current.videoWidth;
      const vidHeight = videoRef.current.videoHeight;
      if (vidWidth > 0 && vidHeight > 0) {
        const ratio = vidWidth / vidHeight;
        // Determine closest ratio:
        // Square: ~0.95 to ~1.05
        // Vertical (9:16): ratio < 0.85
        // Landscape (16:9): ratio >= 1.2
        if (Math.abs(ratio - 1) < 0.12) {
          setAspectRatio('1:1');
        } else if (ratio < 0.9) {
          setAspectRatio('9:16');
        } else {
          setAspectRatio('16:9');
        }
      }
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (videoRef.current) {
        videoRef.current.muted = next;
      }
      return next;
    });
  }, []);

  const seekVideo = useCallback((time: number) => {
    if (videoRef.current) {
      const targetTime = Math.max(0, Math.min(time, duration));
      videoRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
    }
  }, [duration]);

  // Global Player Keyboard Controls:
  // - Space: play/pause
  // - 'm' / 'M': toggle mute
  // - ArrowLeft / ArrowUp: jump to previous subtitle card
  // - ArrowRight / ArrowDown: jump to next subtitle card
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't hijack keystrokes if the user is typing in an input, textarea, or contentEditable element
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleMute();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (subtitles.length === 0) return;

        const currentT = videoRef.current ? videoRef.current.currentTime : currentTime;
        
        // 1. Determine starting index from selected card or playback time
        let currentIndex = -1;
        if (selectedSubtitleId !== null) {
          currentIndex = subtitles.findIndex((s) => s.id === selectedSubtitleId);
        }

        // If no selected card, find matching or previous card
        if (currentIndex === -1) {
          currentIndex = subtitles.findIndex((s) => currentT >= s.start && currentT < s.end);
        }

        // If playhead is in a gap, find the card that immediately preceded current time
        if (currentIndex === -1) {
          for (let i = subtitles.length - 1; i >= 0; i--) {
            if (subtitles[i].start <= currentT) {
              currentIndex = i;
              break;
            }
          }
        }

        // If playhead is before first card
        if (currentIndex === -1) {
          currentIndex = 0;
        }

        // If the video is well past the card start (> 0.4s into this card), jump back to start of current card first;
        // otherwise jump to the previous card.
        const currentSub = subtitles[currentIndex];
        let targetIndex: number;
        if (currentSub && currentT - currentSub.start > 0.5) {
          targetIndex = currentIndex;
        } else {
          targetIndex = Math.max(0, currentIndex - 1);
        }

        const targetSub = subtitles[targetIndex];
        if (targetSub) {
          setSelectedSubtitleId(targetSub.id);
          seekVideo(targetSub.start);
        }
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        if (subtitles.length === 0) return;

        const currentT = videoRef.current ? videoRef.current.currentTime : currentTime;

        // 1. Determine starting index from selected card or playback time
        let currentIndex = -1;
        if (selectedSubtitleId !== null) {
          currentIndex = subtitles.findIndex((s) => s.id === selectedSubtitleId);
        }

        // If no selected card, find card containing currentT
        if (currentIndex === -1) {
          currentIndex = subtitles.findIndex((s) => currentT >= s.start && currentT < s.end);
        }

        // If playhead is in a gap or at the end edge of a card, find the card that just finished or is next
        if (currentIndex === -1) {
          for (let i = 0; i < subtitles.length; i++) {
            if (subtitles[i].start > currentT) {
              currentIndex = i - 1;
              break;
            }
          }
        }

        // If currentT is past the last card
        if (currentIndex === -1) {
          currentIndex = subtitles.length - 1;
        }

        // Advance to next card
        const targetIndex = Math.min(subtitles.length - 1, currentIndex + 1);
        const targetSub = subtitles[targetIndex];
        if (targetSub) {
          setSelectedSubtitleId(targetSub.id);
          seekVideo(targetSub.start);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [togglePlay, toggleMute, seekVideo, currentTime, subtitles, selectedSubtitleId]);

  // Active subtitle for current playback time
  const activeSubtitle = useMemo(() => {
    return subtitles.find(
      (sub, index) =>
        currentTime >= sub.start &&
        (index === subtitles.length - 1 ? currentTime <= sub.end : currentTime < sub.end)
    );
  }, [subtitles, currentTime]);

  // Subtitle actions
  const handleTextChange = useCallback((id: number, newText: string) => {
    setSubtitles((prev) => {
      const next = prev.map((sub) => (sub.id === id ? { ...sub, text: newText, isEdited: true } : sub));
      pushHistory(next);
      return next;
    });
    setHasChanges(true);
  }, [pushHistory]);

  const handleDeleteSegment = useCallback((id: number) => {
    setSubtitles((prev) => {
      const next = prev.filter((sub) => sub.id !== id);
      pushHistory(next);
      return next;
    });
    setSelectedSubtitleId((current) => (current === id ? null : current));
    setHasChanges(true);
    showToast('ลบส่วนซับไตเติ้ลเรียบร้อย');
  }, [pushHistory, showToast]);

  const handleSplitSegment = useCallback((id: number) => {
    const segment = subtitles.find((s) => s.id === id);
    if (!segment) return;
    const currentT = videoRef.current?.currentTime ?? currentTime;
    if (currentT <= segment.start || currentT >= segment.end) {
      showToast('กรุณาเลื่อนวิดีโอมายังช่วงเวลาที่ต้องการตัดแบ่ง');
      return;
    }

    const firstHalf: SubtitleSegment = { ...segment, end: parseFloat(currentT.toFixed(2)), isEdited: true };
    const secondHalf: SubtitleSegment = {
      id: Date.now(),
      start: parseFloat(currentT.toFixed(2)),
      end: segment.end,
      text: segment.text,
      isEdited: true,
    };

    setSubtitles((prev) => {
      const next = prev.map((s) => (s.id === id ? firstHalf : s)).concat(secondHalf).sort((a, b) => a.start - b.start);
      pushHistory(next);
      return next;
    });
    setHasChanges(true);
    showToast('ตัดแบ่งเซกเมนต์เรียบร้อย');
  }, [subtitles, currentTime, pushHistory, showToast]);

  // Video upload
  const handleDirectUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    showToast('กำลังอัปโหลดและประมวลผลเสียง...');
    const localUrl = URL.createObjectURL(file);
    setVideoUrl(localUrl);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(apiUrl('/api/v1/extract-audio'), {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('API request failed');
      const data = await res.json();
      if (data.video_filename) setVideoFilename(data.video_filename);
      const extracted = normaliseSubtitles(data.subtitles ?? data.segments ?? data.captions);
      if (extracted.length > 0) setSubtitles(extracted);
      showToast('แยกเสียงและสร้างซับสำเร็จ!');
    } catch (err) {
      console.warn('Backend unavailable:', err);
      showToast('ใช้ข้อมูลตัวอย่าง (Backend ไม่ตอบสนอง)');
    }
  }, [showToast]);

  // Export SRT
  const handleExportSRT = useCallback(() => {
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
      srtContent += `${i + 1}\n${formatSrtTime(sub.start)} --> ${formatSrtTime(sub.end)}\n${sub.text}\n\n`;
    });

    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.replace(/\s+/g, '_')}.srt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('ส่งออกไฟล์ .SRT สำเร็จ');
  }, [subtitles, projectName, showToast]);

  // Save project
  const handleSave = useCallback(() => {
    sessionStorage.setItem(
      'subtitle_project',
      JSON.stringify({
        video_url: videoUrl,
        video_filename: videoFilename,
        subtitles,
        globalStyles,
      })
    );
    setHasChanges(false);
    showToast('บันทึกโปรเจกต์เรียบร้อย');
  }, [videoUrl, videoFilename, subtitles, globalStyles, showToast]);

  // Render Video
  const handleRenderVideo = useCallback(async () => {
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
          style: s.style,
        })),
        styles: {
          ...globalStyles,
          position: globalStyles.position,
          animation: globalStyles.animation,
        },
      };

      const res = await fetch(apiUrl('/api/v1/render-video'), {
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('Render error:', err);
      showToast(`เกิดข้อผิดพลาดในการเรนเดอร์: ${message}`);
    } finally {
      setIsRendering(false);
      setRenderProgress('');
    }
  }, [videoFilename, subtitles, globalStyles, showToast]);

  const handleResetStyles = useCallback(() => {
    if (selectedSubtitleId !== null) {
      handleResetToGlobal(selectedSubtitleId);
    } else {
      setGlobalStyles(DEFAULT_STYLES);
      setSubtitles((prev) => prev.map((s) => ({ ...s, style: undefined, isEdited: false })));
      showToast('รีเซ็ตสไตล์เริ่มต้นทั้งหมดแล้ว');
    }
  }, [selectedSubtitleId, handleResetToGlobal, showToast]);

  const handleSetSpeed = useCallback((s: number) => {
    setSpeed(s);
    if (videoRef.current) videoRef.current.playbackRate = s;
  }, []);

  // Filtered subtitles
  const filteredSubtitles = useMemo(() => {
    if (!searchQuery.trim()) return subtitles;
    return subtitles.filter((s) => s.text.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [subtitles, searchQuery]);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#0a090f] text-gray-200 select-none font-sans">
      {/* Render Progress Modal */}
      {isRendering && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md">
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-purple-500/25 bg-[#13121b] p-8 text-center shadow-[0_0_50px_rgba(139,92,246,0.25)]">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
            <p className="text-lg font-bold text-white">กำลังเรนเดอร์วิดีโอ</p>
            <p className="text-xs text-gray-400 max-w-xs">{renderProgress}</p>
          </div>
        </div>
      )}

      {/* 1. TOP NAVBAR */}
      <EditorHeader
        projectName={projectName}
        setProjectName={setProjectName}
        hasChanges={hasChanges}
        setHasChanges={setHasChanges}
        aspectRatio={aspectRatio}
        setAspectRatio={setAspectRatio}
        speed={speed}
        setSpeed={handleSetSpeed}
        selectedSubtitleId={selectedSubtitleId}
        onResetStyles={handleResetStyles}
        onExportSRT={handleExportSRT}
        onSave={handleSave}
        onRenderVideo={handleRenderVideo}
        isRendering={isRendering}
        showToast={showToast}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
      />

      {/* 2. MAIN 3-COLUMN WORKSPACE WITH DRAGGABLE RESIZABLE PANELS */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: Transcript Sidebar */}
        <TranscriptPanel
          width={leftPanelWidth}
          subtitles={subtitles}
          filteredSubtitles={filteredSubtitles}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedSubtitleId={selectedSubtitleId}
          setSelectedSubtitleId={setSelectedSubtitleId}
          activeSubtitle={activeSubtitle}
          currentTime={currentTime}
          duration={duration}
          isPlaying={isPlaying}
          seekVideo={seekVideo}
          onTextChange={handleTextChange}
          onDeleteSegment={handleDeleteSegment}
          onSplitSegment={handleSplitSegment}
          formatTime={formatTime}
        />

        {/* LEFT RESIZE DIVIDER */}
        <div
          onPointerDown={handleLeftResizeStart}
          className="relative w-[1px] flex-shrink-0 cursor-col-resize select-none bg-[#1c1a28] hover:bg-purple-500/60 active:bg-purple-500 transition-colors z-20"
          title="ลากเพื่อปรับขนาดแถบซับไตเติ้ล"
        >
          <div className="absolute inset-y-0 -left-1 -right-1" />
        </div>

        {/* CENTER: Video Player + Transport Toolbar */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#0a090f]">
          <VideoPlayer
            videoUrl={videoUrl}
            videoRef={videoRef}
            fileInputRef={fileInputRef}
            aspectRatio={aspectRatio}
            togglePlay={togglePlay}
            handleTimeUpdate={handleTimeUpdate}
            handleLoadedMetadata={handleLoadedMetadata}
            handleDirectUpload={handleDirectUpload}
            activeSubtitle={activeSubtitle}
            selectedSubtitle={selectedSubtitle}
            selectedSubtitleId={selectedSubtitleId}
            setSelectedSubtitleId={setSelectedSubtitleId}
            globalStyles={globalStyles}
            setStyles={setStyles}
            subtitles={subtitles}
          />
          <TransportControls
            currentTime={currentTime}
            duration={duration}
            seekVideo={seekVideo}
            isPlaying={isPlaying}
            togglePlay={togglePlay}
            volume={volume}
            setVolume={setVolume}
            isMuted={isMuted}
            setIsMuted={setIsMuted}
            videoRef={videoRef}
            formatTime={formatTime}
          />
        </div>

        {/* RIGHT RESIZE DIVIDER */}
        <div
          onPointerDown={handleRightResizeStart}
          className="relative w-[1px] flex-shrink-0 cursor-col-resize select-none bg-[#1c1a28] hover:bg-purple-500/60 active:bg-purple-500 transition-colors z-20"
          title="ลากเพื่อปรับขนาดแถบสไตล์"
        >
          <div className="absolute inset-y-0 -left-1 -right-1" />
        </div>

        {/* RIGHT: Style Inspector / Template Panel + Tab Strip */}
        <div className="relative flex min-h-0 overflow-hidden bg-[#13121b]">
          {activeTab === 'styles' ? (
            <StylePanel
              width={rightPanelWidth}
              styles={styles}
              setStyles={setStyles}
              selectedSubtitle={selectedSubtitle}
              selectedSubtitleId={selectedSubtitleId}
              selectedSubtitleIndex={selectedSubtitleIndex}
              setSelectedSubtitleId={setSelectedSubtitleId}
              handleResetToGlobal={handleResetToGlobal}
              subtitles={subtitles}
            />
          ) : (
            <TemplatePanel
              width={rightPanelWidth}
              onApplyTemplate={handleApplyTemplate}
              selectedSubtitle={selectedSubtitle}
              selectedSubtitleIndex={selectedSubtitleIndex}
            />
          )}
          <EditorTabs activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
      </div>
    </div>
  );
}

export default VideoEditorPage;