'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import EditorHeader from './EditorHeader';
import TranscriptPanel from './TranscriptPanel';
import VideoPlayer from './VideoPlayer';
import TransportControls from './TransportControls';
import StylePanel from './StylePanel';
import TemplatePanel, { SubtitleTemplate } from './TemplatePanel';
import type { EditorTabType } from './EditorTabs';
import {
  SubtitleSegment,
  SubtitleStyle,
  DEFAULT_STYLES,
  DEFAULT_SUBTITLES,
  normaliseSubtitles,
  normalizeSubtitleStyle,
  getSubtitleTokensWithTiming,
  CaptionLengthMode,
  regroupSubtitles,
  shiftSegmentWords,
  splitSegmentByTime,
  splitSegmentAtCursor,
  mergeSegmentPair,
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

function formatSubtitleTimestamp(seconds: number, decimalSep: ',' | '.'): string {
  const totalMs = Math.max(0, Math.round(seconds * 1000));
  const hrs = Math.floor(totalMs / 3_600_000);
  const mins = Math.floor((totalMs % 3_600_000) / 60_000);
  const secs = Math.floor((totalMs % 60_000) / 1000);
  const ms = totalMs % 1000;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}${decimalSep}${String(ms).padStart(3, '0')}`;
}

/** Triggers a reliable browser download and delays revoking the object URL so large blobs complete cleanly. */
function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

interface VideoEditorPageProps {
  initialProject?: any;
}

export function VideoEditorPage({ initialProject }: VideoEditorPageProps = {}) {
  // State
  const initialSubtitlesRaw = initialProject?.subtitles?.items ?? initialProject?.subtitles;
  const initialStylesRaw = initialProject?.subtitles?.styles ?? initialProject?.styles;
  const initialFilenameRaw = initialProject?.subtitles?.video_filename ?? initialProject?.video_filename ?? 'sample_video.mp4';
  const initialSubtitlesParsed = initialSubtitlesRaw ? normaliseSubtitles(initialSubtitlesRaw) : DEFAULT_SUBTITLES;

  const formatVideoUrl = (url?: string) => {
    if (!url) return '';
    if (
      url.startsWith('http://') ||
      url.startsWith('https://') ||
      url.startsWith('blob:') ||
      url.startsWith('data:')
    ) {
      return url;
    }
    return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const [projectId, setProjectId] = useState<string | null>(initialProject?.id || null);
  const [videoUrl, setVideoUrl] = useState<string>(formatVideoUrl(initialProject?.video_url));
  const [thumbnailUrl, setThumbnailUrl] = useState<string>(initialProject?.thumbnail_url || '');
  const [videoFilename, setVideoFilename] = useState<string>(initialFilenameRaw);
  const [subtitles, setSubtitles] = useState<SubtitleSegment[]>(initialSubtitlesParsed);
  const [history, setHistory] = useState<SubtitleSegment[][]>([initialSubtitlesParsed]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Keep references to history state for instant, synchronous access
  const historyRef = useRef<SubtitleSegment[][]>([initialSubtitlesParsed]);
  const historyIndexRef = useRef<number>(0);
  const isUndoRedoAction = useRef<boolean>(false);
  const textDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const originalSubtitlesRef = useRef<SubtitleSegment[]>(initialSubtitlesParsed);
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

  const parsedInitialStyles = useMemo(() => {
    if (initialStylesRaw && Object.keys(initialStylesRaw).length) {
      return normalizeSubtitleStyle(initialStylesRaw);
    }
    return DEFAULT_STYLES;
  }, [initialStylesRaw]);

  const [globalStyles, setGlobalStyles] = useState<SubtitleStyle>(parsedInitialStyles);
  const [selectedSubtitleId, setSelectedSubtitleId] = useState<number | string | null>(null);
  const [isSyncOn, setIsSyncOn] = useState<boolean>(true);
  const [captionLengthMode, setCaptionLengthMode] = useState<CaptionLengthMode>(
    parsedInitialStyles.caption_length_mode || 'custom'
  );
  const [customWordCount, setCustomWordCount] = useState<number>(
    parsedInitialStyles.custom_word_count || 4
  );

  const [projectName, setProjectName] = useState<string>(
    initialProject?.title || `โปรเจกต์ ${new Date().toLocaleDateString('th-TH')}`
  );
  const [hasChanges, setHasChanges] = useState<boolean>(!initialProject);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>(
    parsedInitialStyles.aspect_ratio || '9:16'
  );
  const hasSavedAspectRatioRef = useRef<boolean>(Boolean(initialStylesRaw?.aspect_ratio));

  const handleSetAspectRatio = useCallback((nextRatio: '16:9' | '9:16' | '1:1') => {
    hasSavedAspectRatioRef.current = true;
    setAspectRatio(nextRatio);
    setGlobalStyles((prev) => ({ ...prev, aspect_ratio: nextRatio }));
    setHasChanges(true);
  }, []);
  const [speed, setSpeed] = useState<number>(1);
  const speedRef = useRef<number>(1);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<EditorTabType>('styles');
  const [mobileView, setMobileView] = useState<'player' | 'subtitles' | 'styles' | 'templates'>('player');

  // Playback state
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(
    initialProject?.duration ? Number(initialProject.duration) : 9.1
  );
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Status & modal states
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Toast notification helper
  const showToast = useCallback((msg: string, durationMs = 3000) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, durationMs);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

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

  // Tracking save status for Header indicator ('saved' | 'saving' | 'unsaved')
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const projectIdRef = useRef<string | null>(projectId);
  useEffect(() => {
    projectIdRef.current = projectId;
  }, [projectId]);

  // Core background save routine that persists to Supabase and sessionStorage
  const performSave = useCallback(
    async (isBackground = true) => {
      try {
        if (!isBackground) {
          showToast('กำลังบันทึกโปรเจกต์...');
        }
        setSaveStatus('saving');

        const normalizedStyles = normalizeSubtitleStyle({
          ...globalStyles,
          aspect_ratio: aspectRatio,
          caption_length_mode: captionLengthMode,
          custom_word_count: customWordCount,
        });

        // 1. Sync to sessionStorage immediately
        try {
          sessionStorage.setItem(
            'subtitle_project',
            JSON.stringify({
              video_url: videoUrl,
              video_filename: videoFilename,
              subtitles,
              globalStyles: normalizedStyles,
              projectName,
            })
          );
        } catch {}

        // 2. Persist to Supabase Database
        const result = await saveProjectAction({
          id: projectIdRef.current || undefined,
          title: projectName || 'โปรเจกต์ไม่มีชื่อ',
          status: 'draft',
          duration: duration ? String(duration) : undefined,
          video_url: videoUrl,
          thumbnail_url: thumbnailUrl || undefined,
          video_filename: videoFilename,
          subtitles: subtitles,
          styles: normalizedStyles,
        });

        if (result.success && result.projectId) {
          setProjectId(result.projectId);
          projectIdRef.current = result.projectId;
          setHasChanges(false);
          setSaveStatus('saved');
          if (!isBackground) {
            showToast('บันทึกโปรเจกต์ลงคลาวด์เรียบร้อยแล้ว');
          }
          if (typeof window !== 'undefined' && !window.location.search.includes(result.projectId)) {
            window.history.replaceState(null, '', `/editor?id=${result.projectId}`);
          }
        } else {
          setHasChanges(false);
          setSaveStatus('saved');
          if (!isBackground) {
            showToast(result.error || 'บันทึกฉบับร่างไว้ในเบราว์เซอร์แล้ว');
          }
        }
      } catch (err) {
        console.error('Auto-save error:', err);
        setSaveStatus('unsaved');
      }
    },
    [videoUrl, videoFilename, subtitles, globalStyles, aspectRatio, captionLengthMode, customWordCount, projectName, duration, thumbnailUrl, showToast]
  );

  // Debounced auto-save whenever changes occur (1.5s after user stops typing or adjusting styles)
  useEffect(() => {
    if (!hasChanges) return;
    setSaveStatus('unsaved');

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      performSave(true);
    }, 1500);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [hasChanges, performSave]);

  // Flush save on page unload / close
  useEffect(() => {
    const handleBeforeUnload = () => {
      try {
        const normalizedStyles = normalizeSubtitleStyle({
          ...globalStyles,
          aspect_ratio: aspectRatio,
          caption_length_mode: captionLengthMode,
          custom_word_count: customWordCount,
        });
        sessionStorage.setItem(
          'subtitle_project',
          JSON.stringify({
            video_url: videoUrl,
            video_filename: videoFilename,
            subtitles,
            globalStyles: normalizedStyles,
            projectName,
          })
        );
      } catch {}
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [videoUrl, videoFilename, subtitles, globalStyles, aspectRatio, captionLengthMode, customWordCount, projectName]);

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
      const maxAllowed = Math.min(540, window.innerWidth * 0.4);
      const newWidth = Math.max(240, Math.min(maxAllowed, window.innerWidth - moveEvent.clientX - 16));
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
  const handleApplyTemplate = useCallback(
    (template: SubtitleTemplate) => {
      const normalizedTemplate = normalizeSubtitleStyle({
        ...template.style,
        aspect_ratio: aspectRatio,
        caption_length_mode: captionLengthMode,
        custom_word_count: customWordCount,
      });

      if (selectedSubtitleId !== null) {
        setSubtitles((current) =>
          current.map((s) =>
            s.id === selectedSubtitleId ? { ...s, style: { ...normalizedTemplate }, isEdited: true } : s
          )
        );
        showToast(`นำเทมเพลต "${template.name}" ไปใช้กับแคปชันที่เลือกแล้ว`);
      } else {
        setGlobalStyles({ ...normalizedTemplate });
        // Clear per-segment custom overrides only when applying a global template if desired?
        // Actually keep segment-specific overrides only if user intentionally edited style, or clear style overrides so global template shows uniformly:
        setSubtitles((current) => current.map((s) => (s.style ? { ...s, style: undefined } : s)));
        showToast(`นำเทมเพลต "${template.name}" ไปใช้กับซับไตเติลทั้งหมดแล้ว`);
      }
      setHasChanges(true);
    },
    [selectedSubtitleId, aspectRatio, captionLengthMode, customWordCount, showToast]
  );

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
        if (parsed.globalStyles || parsed.styles) {
          const loadedStyles = normalizeSubtitleStyle(parsed.globalStyles || parsed.styles);
          setGlobalStyles(loadedStyles);
          if (parsed.globalStyles?.aspect_ratio || parsed.styles?.aspect_ratio) {
            setAspectRatio(loadedStyles.aspect_ratio || '9:16');
            hasSavedAspectRatioRef.current = true;
          }
          if (loadedStyles.caption_length_mode) {
            setCaptionLengthMode(loadedStyles.caption_length_mode);
          }
          if (loadedStyles.custom_word_count) {
            setCustomWordCount(loadedStyles.custom_word_count);
          }
        }
        const storedSubtitles = normaliseSubtitles(parsed.subtitles ?? parsed.segments ?? parsed.captions);
        if (storedSubtitles.length > 0) {
          originalSubtitlesRef.current = JSON.parse(JSON.stringify(storedSubtitles));
          setSubtitles(storedSubtitles);
          historyRef.current = [storedSubtitles];
          historyIndexRef.current = 0;
          setHistory([storedSubtitles]);
          setHistoryIndex(0);
        }
        if (parsed.projectName || parsed.title) {
          setProjectName(parsed.projectName || parsed.title);
        }
        if (parsed.id && !projectId) {
          setProjectId(parsed.id);
          projectIdRef.current = parsed.id;
        } else if (!parsed.id && !initialProject) {
          // If fresh upload without a Supabase project ID yet, trigger background save immediately
          setTimeout(() => {
            performSave(true);
          }, 400);
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

  const handlePlaybackStateChange = useCallback((playing: boolean) => {
    setIsPlaying(playing);
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speedRef.current;
      const vidDuration = videoRef.current.duration;
      if (!isNaN(vidDuration) && vidDuration > 0) setDuration(vidDuration);

      const vidWidth = videoRef.current.videoWidth;
      const vidHeight = videoRef.current.videoHeight;
      if (vidWidth > 0 && vidHeight > 0 && !hasSavedAspectRatioRef.current) {
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

  useEffect(() => {
    const vid = videoRef.current;
    if (vid && vid.readyState >= 1) {
      handleLoadedMetadata();
    }
  }, [videoUrl, handleLoadedMetadata]);

  const togglePlay = useCallback(() => {
    if (!videoRef.current || !videoUrl) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn('Video play prevented or source not ready:', err);
        setIsPlaying(false);
      });
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [videoUrl]);

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
          seekVideo(targetSub.start);
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
          seekVideo(targetSub.start);
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
  }, [togglePlay, toggleMute, seekVideo, currentTime, subtitles, selectedSubtitleId, showToast, handleUndo, handleRedo]);

  // Active subtitle for current playback time; if adjacent cards overlap slightly, switch to the incoming card immediately
  const activeSubtitle = useMemo(() => {
    for (let i = subtitles.length - 1; i >= 0; i--) {
      const sub = subtitles[i];
      const isLast = i === subtitles.length - 1;
      if (currentTime >= sub.start && (isLast ? currentTime <= sub.end : currentTime < sub.end)) {
        return sub;
      }
    }
    return undefined;
  }, [subtitles, currentTime]);

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

    const [firstHalf, secondHalf] = splitSegmentByTime(segment, currentT, Date.now());

    setSubtitles((prev) => {
      const next = prev.map((s) => (s.id === id ? firstHalf : s)).concat(secondHalf).sort((a, b) => a.start - b.start);
      pushHistory(next);
      return next;
    });
    if (selectedSubtitleId === id) {
      setSelectedSubtitleId(secondHalf.id);
    }
    setHasChanges(true);
  }, [subtitles, currentTime, selectedSubtitleId, pushHistory]);

  // Version 1: Split at Cursor position (Enter key in subtitle card)
  const handleSplitAtCursor = useCallback((id: number, cursorIndex: number) => {
    const segment = subtitles.find((s) => s.id === id);
    if (!segment) return;

    const currentT = videoRef.current ? videoRef.current.currentTime : currentTime;
    const newSecondId = Date.now();
    const parts = splitSegmentAtCursor(segment, cursorIndex, currentT, newSecondId);
    if (!parts) return;
    const [firstHalf, secondHalf] = parts;

    setSubtitles((prev) => {
      const next = prev
        .map((s) => (s.id === id ? firstHalf : s))
        .concat(secondHalf)
        .sort((a, b) => a.start - b.start);
      pushHistory(next);
      return next;
    });

    setSelectedSubtitleId(newSecondId);
    seekVideo(secondHalf.start);
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

    const { mergedCard, cursorPosition } = mergeSegmentPair(prevCard, currentCard);

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
      const shiftedWords = shiftSegmentWords(currentCard, roundedStart, roundedEnd);

      const updatedCard: SubtitleSegment = {
        ...currentCard,
        start: roundedStart,
        end: roundedEnd,
        words: shiftedWords ?? currentCard.words,
        isEdited: true,
      };

      const next = prev.map((s) => (s.id === id ? updatedCard : s));
      if (commitHistory) {
        pushHistory(next);
      }
      return next;
    });

    seekVideo(Math.max(0, newStart));
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
        if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current.currentTime = 0;
        }
        setIsPlaying(false);
        setCurrentTime(0);
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

  // Export Subtitles (.srt / .vtt / .txt)
  const handleExportSubtitle = useCallback((format: 'srt' | 'vtt' | 'txt') => {
    if (subtitles.length === 0) {
      showToast('ไม่มีซับไตเติ้ลสำหรับส่งออก');
      return;
    }

    let content = '';
    if (format === 'txt') {
      content = subtitles.map((sub) => sub.text).join('\n');
    } else {
      const sep = format === 'vtt' ? '.' : ',';
      const body = subtitles
        .map(
          (sub, i) =>
            `${i + 1}\n${formatSubtitleTimestamp(sub.start, sep)} --> ${formatSubtitleTimestamp(sub.end, sep)}\n${sub.text}`
        )
        .join('\n\n');
      content = format === 'vtt' ? `WEBVTT\n\n${body}\n` : `${body}\n`;
    }

    const safeName =
      projectName.replace(/[\\/:*?"<>|]+/g, '-').trim().replace(/\s+/g, '_') || 'subtitles';
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    triggerBlobDownload(blob, `${safeName}.${format}`);
    showToast(`ส่งออกไฟล์ .${format.toUpperCase()} สำเร็จ`);
  }, [subtitles, projectName, showToast]);

  const handleExportSRT = useCallback(() => {
    handleExportSubtitle('srt');
  }, [handleExportSubtitle]);

  const handleCopyTranscript = useCallback(async () => {
    if (subtitles.length === 0) {
      showToast('ไม่มีซับไตเติ้ลสำหรับคัดลอก');
      return;
    }
    try {
      await navigator.clipboard.writeText(subtitles.map((sub) => sub.text).join('\n'));
      showToast('คัดลอกข้อความซับทั้งหมดแล้ว');
    } catch {
      showToast('ไม่สามารถคัดลอกข้อความได้');
    }
  }, [subtitles, showToast]);

  // Manual save project to Supabase & sessionStorage
  const handleSave = useCallback(async () => {
    await performSave(false);
  }, [performSave]);

  // Render Video
  const handleRenderVideo = useCallback(async () => {
    setIsRendering(true);

    try {
      // Determine effective filename (fallback to videoUrl basename if videoFilename is generic)
      let effectiveFilename = videoFilename;
      if (!effectiveFilename || effectiveFilename === 'sample_video.mp4') {
        if (videoUrl) {
          const urlParts = videoUrl.split('?')[0].split('/');
          const lastPart = urlParts[urlParts.length - 1];
          if (lastPart && (lastPart.endsWith('.mp4') || lastPart.endsWith('.webm') || lastPart.endsWith('.mov'))) {
            effectiveFilename = lastPart;
          }
        }
      }

      if (!videoUrl && (!effectiveFilename || effectiveFilename === 'sample_video.mp4')) {
        showToast('ไม่พบไฟล์วิดีโอสำหรับเรนเดอร์ กรุณาอัปโหลดวิดีโอใหม่อีกครั้ง', 5000);
        return;
      }

      const vidEl = videoRef.current;
      const vidW = vidEl ? vidEl.videoWidth : undefined;
      const vidH = vidEl ? vidEl.videoHeight : undefined;

      // Accurately measure the actual displayed video stage dimensions on the user's screen
      let prevW: number | undefined = undefined;
      let prevH: number | undefined = undefined;
      const stageEl = (document.querySelector('[data-canvas-stage]') || document.querySelector('[data-subtitle-overlay]')?.parentElement) as HTMLElement | null;
      if (stageEl && stageEl.clientWidth > 0 && stageEl.clientHeight > 0) {
        prevW = stageEl.clientWidth;
        prevH = stageEl.clientHeight;
      } else if (vidEl) {
        const rect = vidEl.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          prevW = Math.round(rect.width);
          prevH = Math.round(rect.height);
        }
      }

      const fullGlobalStyles = normalizeSubtitleStyle({
        ...globalStyles,
        aspect_ratio: aspectRatio,
        caption_length_mode: captionLengthMode,
        custom_word_count: customWordCount,
      });

      const payload = {
        video_filename: effectiveFilename,
        video_url: videoUrl,
        video_width: vidW,
        video_height: vidH,
        preview_width: prevW,
        preview_height: prevH,
        aspect_ratio: aspectRatio,
        subtitles: subtitles.map((s) => ({
          id: s.id,
          start: s.start,
          end: s.end,
          text: s.text,
          words: getSubtitleTokensWithTiming(s),
          style: s.style
            ? normalizeSubtitleStyle({ ...fullGlobalStyles, ...s.style }, fullGlobalStyles)
            : undefined,
        })),
        styles: fullGlobalStyles,
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

      const blob = await res.blob();
      // Name the file after the project (fall back to the video name); strip characters filesystems reject
      const exportName =
        projectName.replace(/[\\/:*?"<>|]+/g, '-').trim().replace(/\s+/g, '_') ||
        videoFilename.replace(/\.[^.]+$/, '') ||
        'rendered_video';
      triggerBlobDownload(blob, `${exportName}.mp4`);

      showToast('เรนเดอร์วิดีโอสำเร็จและเริ่มดาวน์โหลดแล้ว!');
      setHasChanges(false);

      // Mark status as 'done' in Supabase
      saveProjectAction({
        id: projectId || undefined,
        title: projectName,
        status: 'done',
        duration: duration ? formatTime(duration) : undefined,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl || undefined,
        video_filename: videoFilename,
        subtitles: subtitles,
        styles: fullGlobalStyles,
      }).then((res) => {
        if (res?.success && res.projectId) {
          setProjectId(res.projectId);
        }
      });
    } catch (err: unknown) {
      const rawMsg = err instanceof Error ? err.message : String(err);
      const isNetworkErr =
        err instanceof TypeError || /failed to fetch|networkerror|load failed/i.test(rawMsg);
      const message = isNetworkErr
        ? `ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์เรนเดอร์ (${API_BASE_URL}) ได้ กรุณาตรวจสอบว่า Backend API กำลังทำงานอยู่`
        : rawMsg;
      console.error('Render error:', err);
      showToast(`เกิดข้อผิดพลาดในการเรนเดอร์: ${message}`, 6000);
    } finally {
      setIsRendering(false);
    }
  }, [projectId, projectName, duration, videoUrl, thumbnailUrl, videoFilename, aspectRatio, captionLengthMode, customWordCount, subtitles, globalStyles, showToast]);

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
    showToast('รีเซ็ตข้อความและสไตล์กลับเป็นค่าเริ่มต้นแล้ว');
  }, [subtitles, pushHistory, showToast]);

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
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-[#070709] text-zinc-200 select-none font-sans">
      {/* Studio Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-16 md:bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-2.5 rounded-lg border border-[#2a2838] bg-[#100f16] px-4 py-2 text-xs font-semibold text-white shadow-[0_16px_40px_rgba(0,0,0,0.85)]">
            <span className="h-1.5 w-1.5 rounded-[1px] bg-[#a78bfa]" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Render Progress Modal */}
      {isRendering && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative overflow-hidden flex flex-col items-center gap-4 rounded-2xl border border-[#262433] bg-[#0b0a10] p-8 max-w-sm w-full text-center shadow-[0_30px_90px_rgba(0,0,0,0.95)]">
            <div className="relative flex h-12 w-12 items-center justify-center">
              <div className="absolute inset-0 animate-spin rounded-full border-2 border-[#a78bfa] border-t-transparent" />
              <div className="h-8 w-8 rounded-lg bg-[#161420] border border-[#2b283a] flex items-center justify-center text-[#c4b5fd]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </div>
            </div>
            <div>
              <p className="font-display text-lg font-extrabold text-white">กำลังเรนเดอร์วิดีโอ...</p>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Overlay Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="relative overflow-hidden flex flex-col items-center gap-4 rounded-2xl border border-[#262433] bg-[#0b0a10] p-6 max-w-sm w-full text-center shadow-[0_30px_90px_rgba(0,0,0,0.95)] animate-in zoom-in-95 duration-150">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/25">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-white">ยืนยันการรีเซ็ตทั้งหมด?</h3>
              <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                การดำเนินการนี้จะรีเซ็ต<span className="text-rose-300 font-semibold">ข้อความแคปชันและสไตล์ทั้งหมด</span>กลับเป็นค่าเริ่มต้นเดิมของวิดีโอ
              </p>
            </div>
            <div className="flex w-full items-center gap-2.5 mt-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="flex-1 h-9 rounded-lg bg-[#14131c] hover:bg-[#1c1b27] border border-[#252333] text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="flex-1 h-9 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white transition-colors"
              >
                รีเซ็ตทั้งหมด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. TOP CONSOLE BAR */}
      <EditorHeader
        projectName={projectName}
        setProjectName={setProjectName}
        hasChanges={hasChanges}
        setHasChanges={setHasChanges}
        saveStatus={saveStatus}
        aspectRatio={aspectRatio}
        setAspectRatio={handleSetAspectRatio}
        speed={speed}
        setSpeed={handleSetSpeed}
        selectedSubtitleId={selectedSubtitleId}
        onResetStyles={handleResetClick}
        onExportSRT={handleExportSRT}
        onExportSubtitle={handleExportSubtitle}
        onCopyTranscript={handleCopyTranscript}
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

      {/* 2. FLUSH ARCHITECTURAL CUTTING CONSOLE */}
      <div className="flex flex-1 overflow-hidden relative w-full z-10">
        {/* LEFT PANE: Script Cue Queue */}
        <div
          className={`h-full overflow-hidden border-r border-[#1b1a24] bg-[#0a090e] ${
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

        {/* LEFT PRECISION SEAM RESIZER (Desktop only) */}
        <div
          onPointerDown={handleLeftResizeStart}
          className="hidden md:block relative w-[5px] -mx-[2px] flex-shrink-0 cursor-col-resize select-none group z-30"
          title="ลากเพื่อปรับขนาดแถบรายการซับ"
        >
          <div className="mx-auto h-full w-[1px] bg-transparent group-hover:bg-[#8b5cf6] group-active:bg-[#a78bfa] transition-colors" />
        </div>

        {/* CENTER PANE: Reference Video Monitor + NLE Timeline Deck */}
        <div
          className={`min-w-0 flex-col overflow-hidden bg-[#050508] ${
            mobileView === 'player' ? 'flex flex-1 w-full z-20' : 'hidden md:flex md:flex-1'
          }`}
        >
          <VideoPlayer
            videoUrl={videoUrl}
            videoRef={videoRef}
            aspectRatio={aspectRatio}
            togglePlay={togglePlay}
            handleTimeUpdate={handleTimeUpdate}
            handleLoadedMetadata={handleLoadedMetadata}
            activeSubtitle={activeSubtitle}
            selectedSubtitle={selectedSubtitle}
            selectedSubtitleId={selectedSubtitleId}
            setSelectedSubtitleId={setSelectedSubtitleId}
            globalStyles={globalStyles}
            setStyles={setStyles}
            subtitles={subtitles}
            isPlaying={isPlaying}
            currentTime={currentTime}
            onPlaybackStateChange={handlePlaybackStateChange}
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
            subtitles={subtitles}
          />
        </div>

        {/* RIGHT PRECISION SEAM RESIZER (Desktop only) */}
        <div
          onPointerDown={handleRightResizeStart}
          className="hidden md:block relative w-[5px] -mx-[2px] flex-shrink-0 cursor-col-resize select-none group z-30"
          title="ลากเพื่อปรับขนาดแถบสไตล์"
        >
          <div className="mx-auto h-full w-[1px] bg-transparent group-hover:bg-[#8b5cf6] group-active:bg-[#a78bfa] transition-colors" />
        </div>

        {/* RIGHT PANE: Style Inspector / Viral Templates */}
        <div
          className={`min-h-0 flex-col overflow-hidden border-l border-[#1b1a24] bg-[#0a090e] ${
            mobileView === 'styles' || mobileView === 'templates'
              ? 'flex flex-1 w-full z-20'
              : 'hidden md:relative md:flex flex-shrink-0'
          }`}
        >
          {/* Desktop Flat Underline Inspector Tabs */}
          <div className="hidden md:grid grid-cols-2 bg-[#09080d] border-b border-[#1b1a24] flex-shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('styles')}
              className={`relative flex items-center justify-center gap-1.5 h-10 text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'styles'
                  ? 'text-white'
                  : 'text-zinc-500 hover:text-zinc-200'
              }`}
            >
              <span>ปรับแต่งสไตล์</span>
              {activeTab === 'styles' && (
                <span className="absolute bottom-0 inset-x-3 h-[2px] bg-[#8b5cf6]" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('template')}
              className={`relative flex items-center justify-center gap-1.5 h-10 text-xs font-bold transition-colors border-l border-[#181720] cursor-pointer ${
                activeTab === 'template'
                  ? 'text-white'
                  : 'text-zinc-500 hover:text-zinc-200'
              }`}
            >
              <span>เทมเพลตครีเอเตอร์</span>
              {activeTab === 'template' && (
                <span className="absolute bottom-0 inset-x-3 h-[2px] bg-[#8b5cf6]" />
              )}
            </button>
          </div>

          <div className="flex flex-1 min-h-0 overflow-hidden">
            {(mobileView === 'templates' || (mobileView !== 'styles' && activeTab === 'template')) ? (
              <TemplatePanel
                width={rightPanelWidth}
                onApplyTemplate={handleApplyTemplate}
                selectedSubtitle={selectedSubtitle}
                selectedSubtitleIndex={selectedSubtitleIndex}
                currentStyle={styles}
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
          </div>
        </div>
      </div>

      {/* 3. MOBILE BOTTOM NAVIGATION BAR (Visible on mobile/tablets < 768px) */}
      <div className="flex md:hidden h-14 w-full items-stretch justify-around border-t border-[#1c1a28] bg-[#07060d]/95 backdrop-blur-xl px-1 z-30 select-none flex-shrink-0">
        <button
          type="button"
          onClick={() => setMobileView('player')}
          className={`flex flex-col items-center justify-center gap-1 flex-1 transition-all border-t-2 ${
            mobileView === 'player'
              ? 'border-purple-400 text-[#e9d5ff] font-bold bg-purple-500/10'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          <span className="text-[10px]">วิดีโอ</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileView('subtitles')}
          className={`flex flex-col items-center justify-center gap-1 flex-1 transition-all border-t-2 ${
            mobileView === 'subtitles'
              ? 'border-purple-400 text-[#e9d5ff] font-bold bg-purple-500/10'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
          className={`flex flex-col items-center justify-center gap-1 flex-1 transition-all border-t-2 ${
            mobileView === 'styles'
              ? 'border-purple-400 text-[#e9d5ff] font-bold bg-purple-500/10'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
          className={`flex flex-col items-center justify-center gap-1 flex-1 transition-all border-t-2 ${
            mobileView === 'templates'
              ? 'border-purple-400 text-[#e9d5ff] font-bold bg-purple-500/10'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
