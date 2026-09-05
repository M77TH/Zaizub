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
  CaptionLengthMode,
  regroupSubtitles,
} from './types';
import { apiUrl, API_BASE_URL } from '@/lib/api';
import { saveProjectAction } from '@/app/actions/project';

/** Pure utility function for formatting time codes */
export function formatTime(timeInSeconds: number): string {
  if (isNaN(timeInSeconds) || timeInSeconds < 0) return '0:00';
  const mins = Math.floor(timeInSeconds / 60);
  const secs = Math.floor(timeInSeconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

interface VideoEditorPageProps {
  initialProject?: any;
}

export function VideoEditorPage({ initialProject }: VideoEditorPageProps = {}) {
  // State
  const [projectId, setProjectId] = useState<string | null>(initialProject?.id || null);
  const [videoUrl, setVideoUrl] = useState<string>(initialProject?.video_url || '');
  const [videoFilename, setVideoFilename] = useState<string>(initialProject?.video_filename || 'sample_video.mp4');
  const [subtitles, setSubtitles] = useState<SubtitleSegment[]>(
    initialProject?.subtitles?.length ? normaliseSubtitles(initialProject.subtitles) : DEFAULT_SUBTITLES
  );
  const [history, setHistory] = useState<SubtitleSegment[][]>([
    initialProject?.subtitles?.length ? normaliseSubtitles(initialProject.subtitles) : DEFAULT_SUBTITLES
  ]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Keep references to history state for instant, synchronous access
  const historyRef = useRef<SubtitleSegment[][]>([DEFAULT_SUBTITLES]);
  const historyIndexRef = useRef<number>(0);
  const isUndoRedoAction = useRef<boolean>(false);
  const textDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const originalSubtitlesRef = useRef<SubtitleSegment[]>([]);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState<boolean>(false);

  // Sync refs with state
  historyRef.current = history;
  historyIndexRef.current = historyIndex;

  // High-performance, capped history push
  const pushHistory = useCallback((newSubs: SubtitleSegment[]) => {
    if (isUndoRedoAction.current) return;
    const currentIdx = historyIndexRef.current;
    const currentHist = historyRef.current;
    const trimmed = currentHist.slice(0, currentIdx + 1);
    
    // Cap history to 50 items to prevent RAM buildup & performance degradation
    const maxHistory = 50;
    const nextHist = [...trimmed, newSubs].slice(-maxHistory);
    const nextIdx = nextHist.length - 1;

    historyRef.current = nextHist;
    historyIndexRef.current = nextIdx;
    setHistory(nextHist);
    setHistoryIndex(nextIdx);
  }, []);

  // Instant zero-latency Undo
  const handleUndo = useCallback(() => {
    // Flush any pending text debounce immediately
    if (textDebounceTimerRef.current) {
      clearTimeout(textDebounceTimerRef.current);
      textDebounceTimerRef.current = null;
    }

    const currentIdx = historyIndexRef.current;
    const currentHist = historyRef.current;

    if (currentIdx > 0) {
      isUndoRedoAction.current = true;
      const targetIdx = currentIdx - 1;
      const prevSubs = currentHist[targetIdx];

      historyIndexRef.current = targetIdx;
      setHistoryIndex(targetIdx);
      setSubtitles(prevSubs);
      setHasChanges(true);

      // Reset action flag immediately after microtask
      Promise.resolve().then(() => {
        isUndoRedoAction.current = false;
      });
    }
  }, []);

  // Instant zero-latency Redo
  const handleRedo = useCallback(() => {
    // Flush any pending text debounce immediately
    if (textDebounceTimerRef.current) {
      clearTimeout(textDebounceTimerRef.current);
      textDebounceTimerRef.current = null;
    }

    const currentIdx = historyIndexRef.current;
    const currentHist = historyRef.current;

    if (currentIdx < currentHist.length - 1) {
      isUndoRedoAction.current = true;
      const targetIdx = currentIdx + 1;
      const nextSubs = currentHist[targetIdx];

      historyIndexRef.current = targetIdx;
      setHistoryIndex(targetIdx);
      setSubtitles(nextSubs);
      setHasChanges(true);

      // Reset action flag immediately after microtask
      Promise.resolve().then(() => {
        isUndoRedoAction.current = false;
      });
    }
  }, []);

  const [globalStyles, setGlobalStyles] = useState<SubtitleStyle>(
    initialProject?.styles && Object.keys(initialProject.styles).length ? initialProject.styles : DEFAULT_STYLES
  );
  const [selectedSubtitleId, setSelectedSubtitleId] = useState<number | string | null>(null);
  const [isSyncOn, setIsSyncOn] = useState<boolean>(true);
  const [captionLengthMode, setCaptionLengthMode] = useState<CaptionLengthMode>('custom');
  const [customWordCount, setCustomWordCount] = useState<number>(4);

  const [projectName, setProjectName] = useState<string>(
    initialProject?.title || `โปรเจกต์ ${new Date().toLocaleDateString('th-TH')}`
  );
  const [hasChanges, setHasChanges] = useState<boolean>(!initialProject);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('9:16');
  const [speed, setSpeed] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<EditorTabType>('styles');
  const [mobileView, setMobileView] = useState<'player' | 'subtitles' | 'styles' | 'templates'>('player');

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
  const [leftPanelWidth, setLeftPanelWidth] = useState<number | undefined>(undefined);
  const [rightPanelWidth, setRightPanelWidth] = useState<number | undefined>(undefined);

  // Load persisted or device-adaptive panel widths
  useEffect(() => {
    try {
      const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1440;
      if (screenWidth < 768) {
        // Mobile phone: do not force fixed pixel width
        setLeftPanelWidth(undefined);
        setRightPanelWidth(undefined);
        return;
      }

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

  // Auto-save draft on exit / navigation
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Sync to sessionStorage immediately
      try {
        sessionStorage.setItem(
          'subtitle_project',
          JSON.stringify({
            video_url: videoUrl,
            video_filename: videoFilename,
            subtitles,
            globalStyles,
          })
        );
      } catch {}
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [videoUrl, videoFilename, subtitles, globalStyles]);

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

  // Read initial data from sessionStorage on mount (if not opened via project id)
  useEffect(() => {
    if (initialProject) return; // Already initialized from Supabase
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
        if (storedSubtitles.length > 0) {
          originalSubtitlesRef.current = JSON.parse(JSON.stringify(storedSubtitles));
          setSubtitles(storedSubtitles);
          historyRef.current = [storedSubtitles];
          historyIndexRef.current = 0;
          setHistory([storedSubtitles]);
          setHistoryIndex(0);
        }
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
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      // 1. ESCAPE: Always unselect card and blur active input/textarea
      if (e.key === 'Escape') {
        e.preventDefault();
        setSelectedSubtitleId(null);
        if (target && typeof target.blur === 'function') {
          target.blur();
        }
        return;
      }

      // 2. ENTER (when NOT inside textarea/input): Select the current playing card
      if (e.key === 'Enter' && !isInput) {
        e.preventDefault();
        if (subtitles.length === 0) return;
        const currentT = videoRef.current ? videoRef.current.currentTime : currentTime;
        const currentCard = subtitles.find((s) => currentT >= s.start && currentT < s.end);
        if (currentCard) {
          setSelectedSubtitleId(currentCard.id);
          seekVideo(currentCard.start);
          setTimeout(() => {
            const el = document.querySelector(`[data-subtitle-id="${currentCard.id}"] textarea`) as HTMLTextAreaElement | null;
            if (el) {
              el.focus({ preventScroll: true });
              const len = el.value.length;
              el.setSelectionRange(len, len);
            }
          }, 50);
        } else if (subtitles[0]) {
          setSelectedSubtitleId(subtitles[0].id);
          seekVideo(subtitles[0].start);
        }
        return;
      }

      // Don't hijack other player keystrokes if the user is typing in an input or textarea
      if (isInput) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if ((e.code === 'KeyM' || e.key.toLowerCase() === 'm') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        toggleMute();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        setIsSyncOn(false);
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

        // ArrowLeft can rewind to start of current card if > 0.5s into it; ArrowUp always goes directly to previous card
        const currentSub = subtitles[currentIndex];
        let targetIndex: number;
        if (e.key === 'ArrowLeft' && currentSub && currentT - currentSub.start > 0.5) {
          targetIndex = currentIndex;
        } else {
          targetIndex = Math.max(0, currentIndex - 1);
        }

        const targetSub = subtitles[targetIndex];
        if (targetSub) {
          setSelectedSubtitleId(targetSub.id);
          seekVideo(targetSub.start);
          requestAnimationFrame(() => {
            const cardEl = document.querySelector(`[data-subtitle-id="${targetSub.id}"]`) as HTMLElement | null;
            if (cardEl && (!document.activeElement || document.activeElement === document.body || document.activeElement.hasAttribute('data-subtitle-id'))) {
              cardEl.focus({ preventScroll: true });
            }
          });
        }
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsSyncOn(false);
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
          requestAnimationFrame(() => {
            const cardEl = document.querySelector(`[data-subtitle-id="${targetSub.id}"]`) as HTMLElement | null;
            if (cardEl && (!document.activeElement || document.activeElement === document.body || document.activeElement.hasAttribute('data-subtitle-id'))) {
              cardEl.focus({ preventScroll: true });
            }
          });
        }
      } else if ((e.code === 'KeyC' || e.key.toLowerCase() === 'c') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // C key -> Split active card at video playhead
        e.preventDefault();
        const activeCard = subtitles.find(
          (s) => currentTime > s.start + 0.1 && currentTime < s.end - 0.1
        ) || (selectedSubtitleId !== null ? subtitles.find(s => s.id === selectedSubtitleId) : null);
        if (activeCard) {
          handleSplitSegment(activeCard.id);
        }
      } else if ((e.code === 'KeyL' || e.key.toLowerCase() === 'l' || e.key === 'ส' || e.key === 'ศ') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // L key -> Toggle Lock / Auto-Scroll Follow Playhead Sync
        e.preventDefault();
        setIsSyncOn((prev) => {
          const next = !prev;
          showToast(next ? 'เปิดซิงค์เลื่อนตามวิดีโอ (Lock Sync ON) [L]' : 'ปลดล็อกการซิงค์ (Lock Sync OFF) [L]');
          return next;
        });
      } else if ((e.ctrlKey || e.metaKey) && (e.code === 'KeyZ' || e.key.toLowerCase() === 'z')) {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && (e.code === 'KeyY' || e.key.toLowerCase() === 'y')) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [togglePlay, toggleMute, seekVideo, currentTime, subtitles, selectedSubtitleId, showToast]);

  // Active subtitle for current playback time
  const activeSubtitle = useMemo(() => {
    return subtitles.find(
      (sub, index) =>
        currentTime >= sub.start &&
        (index === subtitles.length - 1 ? currentTime <= sub.end : currentTime < sub.end)
    );
  }, [subtitles, currentTime]);

  // When clip is running (playing) with Auto-Scroll / Lock Sync ON,
  // sync the selected caption to the active running caption
  useEffect(() => {
    if (isPlaying && isSyncOn && activeSubtitle?.id !== undefined) {
      setSelectedSubtitleId(activeSubtitle.id);
    }
  }, [isPlaying, isSyncOn, activeSubtitle?.id]);

  // Subtitle actions (Debounces text typing into smart batches, while cuts/splits/deletes push instantly)
  const handleTextChange = useCallback((id: number, newText: string) => {
    setSubtitles((prev) => {
      const next = prev.map((sub) => (sub.id === id ? { ...sub, text: newText, isEdited: true } : sub));
      
      // Batch keystrokes: push to history 350ms after user pauses typing (standard IDE/Pro-editor behavior)
      if (textDebounceTimerRef.current) {
        clearTimeout(textDebounceTimerRef.current);
      }
      textDebounceTimerRef.current = setTimeout(() => {
        pushHistory(next);
        textDebounceTimerRef.current = null;
      }, 350);

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
    if (currentT <= segment.start + 0.1 || currentT >= segment.end - 0.1) {
      return;
    }

    const fullText = (segment.text || '').trim();
    const totalDuration = segment.end - segment.start;
    const elapsed = currentT - segment.start;
    const ratio = Math.max(0.05, Math.min(0.95, elapsed / totalDuration));

    // Split text based on time elapsed
    let splitCharIndex = Math.round(fullText.length * ratio);
    // Prefer word boundaries (spaces) if available nearby
    const spaceNear = fullText.indexOf(' ', Math.max(0, splitCharIndex - 5));
    if (spaceNear !== -1 && Math.abs(spaceNear - splitCharIndex) <= 6) {
      splitCharIndex = spaceNear;
    }

    const firstText = fullText.slice(0, splitCharIndex).trim();
    const secondText = fullText.slice(splitCharIndex).trim();

    const firstHalf: SubtitleSegment = {
      ...segment,
      end: parseFloat(currentT.toFixed(2)),
      text: firstText || fullText,
      isEdited: true,
    };
    const secondHalf: SubtitleSegment = {
      ...segment,
      id: Date.now(),
      start: parseFloat(currentT.toFixed(2)),
      end: segment.end,
      text: secondText || fullText,
      isEdited: true,
    };

    setSubtitles((prev) => {
      const next = prev.map((s) => (s.id === id ? firstHalf : s)).concat(secondHalf).sort((a, b) => a.start - b.start);
      pushHistory(next);
      return next;
    });
    setSelectedSubtitleId(secondHalf.id);
    setHasChanges(true);
  }, [subtitles, currentTime, pushHistory]);

  // Version 1: Split at Cursor position (Enter key in subtitle card)
  const handleSplitAtCursor = useCallback((id: number, cursorIndex: number) => {
    const segment = subtitles.find((s) => s.id === id);
    if (!segment) return;

    const fullText = segment.text || '';
    if (cursorIndex <= 0 || cursorIndex >= fullText.length) return;

    const firstText = fullText.slice(0, cursorIndex).trimEnd();
    const secondText = fullText.slice(cursorIndex).trimStart();
    if (!firstText || !secondText) return;

    const totalDuration = segment.end - segment.start;
    const currentT = videoRef.current ? videoRef.current.currentTime : currentTime;

    // If playhead is currently inside this card (with 0.2s margin), use playhead for audio alignment;
    // otherwise split proportionally based on character length
    let splitTime: number;
    if (currentT >= segment.start + 0.2 && currentT <= segment.end - 0.2) {
      splitTime = parseFloat(currentT.toFixed(2));
    } else {
      const ratio = firstText.length / (firstText.length + secondText.length);
      splitTime = parseFloat((segment.start + totalDuration * ratio).toFixed(2));
    }

    // Ensure strictly valid intervals
    splitTime = Math.max(segment.start + 0.1, Math.min(segment.end - 0.1, splitTime));

    const newSecondId = Date.now();
    const firstHalf: SubtitleSegment = {
      ...segment,
      end: splitTime,
      text: firstText,
      isEdited: true,
    };
    const secondHalf: SubtitleSegment = {
      ...segment,
      id: newSecondId,
      start: splitTime,
      text: secondText,
      isEdited: true,
    };

    setSubtitles((prev) => {
      const next = prev
        .map((s) => (s.id === id ? firstHalf : s))
        .concat(secondHalf)
        .sort((a, b) => a.start - b.start);
      pushHistory(next);
      return next;
    });

    setSelectedSubtitleId(newSecondId);
    seekVideo(splitTime);
    setHasChanges(true);

    // Auto-focus the new card's textarea at index 0
    setTimeout(() => {
      const newCard = document.querySelector(`[data-subtitle-id="${newSecondId}"] textarea`) as HTMLTextAreaElement | null;
      if (newCard) {
        newCard.focus({ preventScroll: true });
        newCard.setSelectionRange(0, 0);
      }
    }, 50);
  }, [subtitles, currentTime, pushHistory, seekVideo]);

  // Version 1: Merge with Previous Card (Backspace key at index 0 of card)
  const handleMergeWithPrevious = useCallback((id: number) => {
    const currentIndex = subtitles.findIndex((s) => s.id === id);
    if (currentIndex <= 0) return;

    const prevCard = subtitles[currentIndex - 1];
    const currentCard = subtitles[currentIndex];
    if (!prevCard || !currentCard) return;

    const originalPrevLength = (prevCard.text || '').length;
    const mergedText = `${(prevCard.text || '').trim()} ${(currentCard.text || '').trim()}`.trim();

    const mergedCard: SubtitleSegment = {
      ...prevCard,
      end: currentCard.end,
      text: mergedText,
      isEdited: true,
    };

    setSubtitles((prev) => {
      const next = prev
        .filter((s) => s.id !== id)
        .map((s) => (s.id === prevCard.id ? mergedCard : s));
      pushHistory(next);
      return next;
    });

    setSelectedSubtitleId(prevCard.id);
    setHasChanges(true);

    // Position cursor at junction where the text was merged
    setTimeout(() => {
      const prevCardEl = document.querySelector(`[data-subtitle-id="${prevCard.id}"] textarea`) as HTMLTextAreaElement | null;
      if (prevCardEl) {
        prevCardEl.focus({ preventScroll: true });
        const cursorPosition = originalPrevLength > 0 ? originalPrevLength + 1 : 0;
        prevCardEl.setSelectionRange(cursorPosition, cursorPosition);
      }
    }, 50);
  }, [subtitles, pushHistory]);

  // Move / Shift Subtitle Clip Timing (drag or nudge timeline pill)
  const handleMoveSegment = useCallback((id: number, newStart: number, commitHistory = true) => {
    setSubtitles((prev) => {
      const targetIndex = prev.findIndex((s) => s.id === id);
      if (targetIndex === -1) return prev;

      const currentCard = prev[targetIndex];
      const clipDuration = currentCard.end - currentCard.start;
      const prevCard = targetIndex > 0 ? prev[targetIndex - 1] : null;
      const nextCard = targetIndex < prev.length - 1 ? prev[targetIndex + 1] : null;

      // Minimum clamp: either 0 or previous card's end + 0.05s
      const minStart = prevCard ? prevCard.end + 0.05 : 0;
      // Maximum clamp: either duration - clipDuration or next card's start - 0.05s - clipDuration
      const maxEnd = nextCard ? nextCard.start - 0.05 : duration;
      const maxStart = Math.max(minStart, maxEnd - clipDuration);

      const clampedStart = Math.max(minStart, Math.min(maxStart, newStart));
      const clampedEnd = clampedStart + clipDuration;

      const roundedStart = parseFloat(clampedStart.toFixed(2));
      const roundedEnd = parseFloat(clampedEnd.toFixed(2));

      const updatedCard: SubtitleSegment = {
        ...currentCard,
        start: roundedStart,
        end: roundedEnd,
        isEdited: true,
      };

      const next = prev.map((s) => (s.id === id ? updatedCard : s));
      if (commitHistory) {
        pushHistory(next);
      }
      return next;
    });

    seekVideo(newStart);
    setHasChanges(true);
  }, [duration, pushHistory, seekVideo]);

  // Dynamic Caption Length regrouping (Normal full sentences, short 3-words, or custom X words)
  const handleRegroupSubtitles = useCallback((mode: CaptionLengthMode, wordCount?: number) => {
    const targetCount = wordCount ?? customWordCount;
    setCaptionLengthMode(mode);
    if (wordCount !== undefined) {
      setCustomWordCount(wordCount);
    }
    setSubtitles((prev) => {
      const next = regroupSubtitles(prev, mode, targetCount);
      if (next.length > 0) {
        pushHistory(next);
        const label = mode === 'normal' ? 'ประโยคปกติ' : mode === 'short' ? 'คำสั้น (3 คำ)' : `${targetCount} คำต่อการ์ด`;
        showToast(`จัดความยาวแคปชันเป็น "${label}" แล้ว`);
        return next;
      }
      return prev;
    });
    setHasChanges(true);
  }, [customWordCount, pushHistory, showToast]);

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
      if (data.video_url) {
        const isFullUrl =
          data.video_url.startsWith('http://') ||
          data.video_url.startsWith('https://') ||
          data.video_url.startsWith('blob:') ||
          data.video_url.startsWith('data:');
        const finalUrl = isFullUrl
          ? data.video_url
          : `${API_BASE_URL}${data.video_url.startsWith('/') ? '' : '/'}${data.video_url}`;
        setVideoUrl(finalUrl);
      }
      if (data.video_filename) setVideoFilename(data.video_filename);
      const extracted = normaliseSubtitles(data.subtitles ?? data.segments ?? data.captions);
      if (extracted.length > 0) {
        originalSubtitlesRef.current = JSON.parse(JSON.stringify(extracted));
        setSubtitles(extracted);
        setHistory([extracted]);
        setHistoryIndex(0);
      }
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

  // Save project to Supabase & sessionStorage
  const handleSave = useCallback(async () => {
    // 1. Keep in sessionStorage for immediate local offline backup
    sessionStorage.setItem(
      'subtitle_project',
      JSON.stringify({
        video_url: videoUrl,
        video_filename: videoFilename,
        subtitles,
        globalStyles,
      })
    );

    // 2. Persist to Supabase Database
    showToast('กำลังบันทึกโปรเจกต์...');
    const result = await saveProjectAction({
      id: projectId || undefined,
      title: projectName,
      status: 'draft',
      duration: duration ? formatTime(duration) : undefined,
      video_url: videoUrl,
      video_filename: videoFilename,
      subtitles: subtitles,
      styles: globalStyles,
    });

    if (result.success && result.projectId) {
      setProjectId(result.projectId);
      setHasChanges(false);
      showToast('บันทึกโปรเจกต์ลงคลาวด์เรียบร้อยแล้ว');
      // Update browser URL without reloading so subsequent saves update the same project
      if (typeof window !== 'undefined' && !window.location.search.includes(result.projectId)) {
        window.history.replaceState(null, '', `/editor?id=${result.projectId}`);
      }
    } else {
      // If error or unauthenticated, local save was still performed
      setHasChanges(false);
      showToast(result.error || 'บันทึกฉบับร่างไว้ในเบราว์เซอร์แล้ว');
    }
  }, [projectId, projectName, duration, videoUrl, videoFilename, subtitles, globalStyles, showToast]);

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

      // Mark status as 'done' in Supabase
      saveProjectAction({
        id: projectId || undefined,
        title: projectName,
        status: 'done',
        duration: duration ? formatTime(duration) : undefined,
        video_url: videoUrl,
        video_filename: videoFilename,
        subtitles: subtitles,
        styles: globalStyles,
      }).then((res) => {
        if (res?.success && res.projectId) {
          setProjectId(res.projectId);
        }
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('Render error:', err);
      showToast(`เกิดข้อผิดพลาดในการเรนเดอร์: ${message}`);
    } finally {
      setIsRendering(false);
      setRenderProgress('');
    }
  }, [projectId, projectName, duration, videoUrl, videoFilename, subtitles, globalStyles, showToast]);

  // Open confirmation modal when Reset is clicked
  const handleResetClick = useCallback(() => {
    setIsResetConfirmOpen(true);
  }, []);

  // Reset both captions and styles back to original/default
  const handleConfirmReset = useCallback(() => {
    setIsResetConfirmOpen(false);

    // 1. Reset Global Styles
    setGlobalStyles(DEFAULT_STYLES);

    // 2. Reset Subtitles: if original transcription exists, revert to it; otherwise clear custom styles
    let resetSubs: SubtitleSegment[] = [];
    if (originalSubtitlesRef.current && originalSubtitlesRef.current.length > 0) {
      resetSubs = JSON.parse(JSON.stringify(originalSubtitlesRef.current));
    } else {
      resetSubs = subtitles.map((s) => ({ ...s, style: undefined, isEdited: false }));
    }

    setSubtitles(resetSubs);
    pushHistory(resetSubs);
    setSelectedSubtitleId(null);
    setHasChanges(true);
  }, [subtitles, pushHistory]);

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

      {/* Reset Confirmation Overlay Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-rose-500/30 bg-[#14121f] p-6 max-w-sm w-full text-center shadow-[0_0_50px_rgba(244,63,94,0.2)] animate-in zoom-in-95 duration-150">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/30">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-white">ยืนยันการรีเซ็ตทั้งหมด?</h3>
              <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                การดำเนินการนี้จะรีเซ็ต<span className="text-rose-300 font-semibold">ข้อความแคปชันและสไตล์ทั้งหมด</span>กลับเป็นค่าเริ่มต้นเดิมของวิดีโอ
              </p>
            </div>
            <div className="flex w-full items-center gap-2.5 mt-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="flex-1 h-9 rounded-xl bg-[#1f1c2e] hover:bg-[#2a263d] text-xs font-semibold text-gray-300 hover:text-white transition-all active:scale-95"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="flex-1 h-9 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow-lg shadow-rose-600/30 transition-all active:scale-95"
              >
                รีเซ็ตทั้งหมด
              </button>
            </div>
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
        onResetStyles={handleResetClick}
        onExportSRT={handleExportSRT}
        onSave={handleSave}
        onRenderVideo={handleRenderVideo}
        isRendering={isRendering}
        showToast={showToast}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        captionLengthMode={captionLengthMode}
        customWordCount={customWordCount}
        onRegroupSubtitles={handleRegroupSubtitles}
      />

      {/* 2. MAIN WORKSPACE WITH DESKTOP 3-COLUMN OR PHONE ADAPTIVE VIEW */}
      <div className="flex flex-1 overflow-hidden relative w-full">
        {/* LEFT: Transcript / Caption List */}
        <div
          className={`h-full ${
            mobileView === 'subtitles' ? 'flex flex-1 w-full z-20' : 'hidden md:flex flex-shrink-0'
          }`}
        >
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
            isSyncOn={isSyncOn}
            setIsSyncOn={setIsSyncOn}
            seekVideo={seekVideo}
            onTextChange={handleTextChange}
            onDeleteSegment={handleDeleteSegment}
            onSplitSegment={handleSplitSegment}
            onSplitAtCursor={handleSplitAtCursor}
            onMergeWithPrevious={handleMergeWithPrevious}
            onMoveSegment={handleMoveSegment}
            formatTime={formatTime}
          />
        </div>

        {/* LEFT RESIZE DIVIDER (Desktop only) */}
        <div
          onPointerDown={handleLeftResizeStart}
          className="hidden md:block relative w-[1px] flex-shrink-0 cursor-col-resize select-none bg-[#1c1a28] hover:bg-purple-500/60 active:bg-purple-500 transition-colors z-20"
          title="ลากเพื่อปรับขนาดแถบรายการซับ"
        >
          <div className="absolute inset-y-0 -left-1 -right-1" />
        </div>

        {/* CENTER: Video Player + Transport Toolbar */}
        <div
          className={`min-w-0 flex-col overflow-hidden bg-[#0a090f] ${
            mobileView === 'player' ? 'flex flex-1 w-full z-20' : 'hidden md:flex md:flex-1'
          }`}
        >
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
            isPlaying={isPlaying}
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

        {/* RIGHT RESIZE DIVIDER (Desktop only) */}
        <div
          onPointerDown={handleRightResizeStart}
          className="hidden md:block relative w-[1px] flex-shrink-0 cursor-col-resize select-none bg-[#1c1a28] hover:bg-purple-500/60 active:bg-purple-500 transition-colors z-20"
          title="ลากเพื่อปรับขนาดแถบสไตล์"
        >
          <div className="absolute inset-y-0 -left-1 -right-1" />
        </div>

        {/* RIGHT: Style Inspector / Template Panel + Tab Strip */}
        <div
          className={`min-h-0 overflow-hidden bg-[#13121b] ${
            mobileView === 'styles' || mobileView === 'templates'
              ? 'flex flex-1 w-full z-20'
              : 'hidden md:relative md:flex flex-shrink-0'
          }`}
        >
          {(mobileView === 'templates' || (mobileView !== 'styles' && activeTab === 'template')) ? (
            <TemplatePanel
              width={rightPanelWidth}
              onApplyTemplate={handleApplyTemplate}
              selectedSubtitle={selectedSubtitle}
              selectedSubtitleIndex={selectedSubtitleIndex}
            />
          ) : (
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
          )}
          <div className="hidden md:flex">
            <EditorTabs activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>
        </div>
      </div>

      {/* 3. MOBILE BOTTOM NAVIGATION BAR (Visible on mobile/tablets < 768px) */}
      <div className="flex md:hidden h-14 w-full items-center justify-around border-t border-[#1c1a28] bg-[#0d0c14]/95 backdrop-blur-xl px-2 py-1 z-30 select-none flex-shrink-0">
        <button
          type="button"
          onClick={() => setMobileView('player')}
          className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 rounded-xl transition-all ${
            mobileView === 'player'
              ? 'text-purple-400 font-bold bg-purple-500/15'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          <span className="text-[10px]">วิดีโอ</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileView('subtitles')}
          className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 rounded-xl transition-all ${
            mobileView === 'subtitles'
              ? 'text-purple-400 font-bold bg-purple-500/15'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span className="text-[10px]">แคปชัน</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setMobileView('styles');
            setActiveTab('styles');
          }}
          className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 rounded-xl transition-all ${
            mobileView === 'styles'
              ? 'text-purple-400 font-bold bg-purple-500/15'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="4" x2="20" y1="21" y2="21" />
            <line x1="4" x2="20" y1="3" y2="3" />
            <line x1="4" x2="20" y1="12" y2="12" />
            <circle cx="9" cy="12" r="2" />
            <circle cx="16" cy="3" r="2" />
            <circle cx="12" cy="21" r="2" />
          </svg>
          <span className="text-[10px]">สไตล์</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setMobileView('templates');
            setActiveTab('template');
          }}
          className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 rounded-xl transition-all ${
            mobileView === 'templates'
              ? 'text-purple-400 font-bold bg-purple-500/15'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
          </svg>
          <span className="text-[10px]">เทมเพลต</span>
        </button>
      </div>
    </div>
  );
}

export default VideoEditorPage;