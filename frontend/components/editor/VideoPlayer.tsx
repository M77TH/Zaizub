'use client';

import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import {
  SubtitleSegment,
  SubtitleStyle,
  normalizeSubtitleStyle,
  getSubtitleTokensWithTiming,
  needsSpaceBetweenWords,
  tokenizeSubtitleText,
} from './types';
import SafeZoneOverlay from './SafeZoneOverlay';
import {
  AspectRatioType,
  DEFAULT_PLATFORM_BY_ASPECT,
  SAFE_ZONE_PRESETS,
  SafeZonePlatformId,
  evaluateSubtitleSafeZone,
  getPresetsForAspectRatio,
} from './safeZones';

interface VideoPlayerProps {
  videoUrl: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  fileInputRef?: React.RefObject<HTMLInputElement | null>;
  aspectRatio: '16:9' | '9:16' | '1:1';
  togglePlay: () => void;
  handleTimeUpdate: () => void;
  handleLoadedMetadata: () => void;
  handleDirectUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  activeSubtitle?: SubtitleSegment;
  selectedSubtitle?: SubtitleSegment;
  selectedSubtitleId: number | string | null;
  setSelectedSubtitleId: React.Dispatch<React.SetStateAction<number | string | null>>;
  globalStyles: SubtitleStyle;
  setStyles?: (styles: SubtitleStyle) => void;
  subtitles?: SubtitleSegment[];
  isPlaying?: boolean;
  currentTime?: number;
  onPlaybackStateChange?: (playing: boolean) => void;
}

function VideoPlayer({
  videoUrl,
  videoRef,
  aspectRatio,
  togglePlay,
  handleTimeUpdate,
  handleLoadedMetadata,
  activeSubtitle,
  selectedSubtitle,
  globalStyles,
  setStyles,
  subtitles,
  isPlaying = false,
  currentTime = 0,
  onPlaybackStateChange,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoStageRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [showCenterGuide, setShowCenterGuide] = useState<boolean>(false);
  const [showSafeZones, setShowSafeZones] = useState<boolean>(false);
  const [isSafeZoneMenuOpen, setIsSafeZoneMenuOpen] = useState<boolean>(false);
  const [safeZoneDim, setSafeZoneDim] = useState<number>(40);
  const [platformByAspect, setPlatformByAspect] = useState<Record<AspectRatioType, SafeZonePlatformId>>(
    DEFAULT_PLATFORM_BY_ASPECT
  );
  const safeZoneMenuRef = useRef<HTMLDivElement | null>(null);
  const [videoError, setVideoError] = useState<boolean>(false);

  useEffect(() => {
    if (!isSafeZoneMenuOpen) return;
    const handleOutsidePointer = (ev: PointerEvent) => {
      if (safeZoneMenuRef.current && !safeZoneMenuRef.current.contains(ev.target as Node)) {
        setIsSafeZoneMenuOpen(false);
      }
    };
    const handleKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        setIsSafeZoneMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleOutsidePointer);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handleOutsidePointer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSafeZoneMenuOpen]);
  const [parentDimensions, setParentDimensions] = useState<{ width: number; height: number }>({
    width: 800,
    height: 600,
  });

  const onVideoLoaded = useCallback(() => {
    handleLoadedMetadata();
  }, [handleLoadedMetadata]);

  useEffect(() => {
    const vid = videoRef.current;
    if (vid && vid.readyState >= 1) {
      handleLoadedMetadata();
    }
  }, [videoUrl, handleLoadedMetadata, videoRef]);

  useEffect(() => {
    setVideoError(false);
  }, [videoUrl]);

  const lastActiveRef = useRef<SubtitleSegment | undefined>(undefined);

  useEffect(() => {
    if (activeSubtitle) {
      lastActiveRef.current = activeSubtitle;
    }
  }, [activeSubtitle]);

  const displaySubtitle = useMemo(() => {
    if (isPlaying) {
      return activeSubtitle;
    }
    if (activeSubtitle) return activeSubtitle;
    return selectedSubtitle || (subtitles && subtitles.length > 0 ? subtitles[0] : undefined);
  }, [isPlaying, activeSubtitle, selectedSubtitle, subtitles]);

  const captionKey = displaySubtitle
    ? `caption-${displaySubtitle.id}-${displaySubtitle.text}`
    : '';

  const activeEffectiveStyle = useMemo(
    () =>
      normalizeSubtitleStyle(
        displaySubtitle?.style ? { ...globalStyles, ...displaySubtitle.style } : globalStyles,
        normalizeSubtitleStyle(globalStyles)
      ),
    [displaySubtitle?.style, globalStyles]
  );

  const posX = activeEffectiveStyle.custom_x ?? 50;
  const posY =
    activeEffectiveStyle.custom_y ??
    (activeEffectiveStyle.position === 'center'
      ? 50
      : activeEffectiveStyle.position === 'custom'
      ? 12
      : 82);

  const activeSafeZonePreset = SAFE_ZONE_PRESETS[platformByAspect[aspectRatio]];
  const aspectSafeZonePresets = getPresetsForAspectRatio(aspectRatio);
  const safeZoneWarning = evaluateSubtitleSafeZone(posX, posY, activeSafeZonePreset);

  const handleSelectSafeZonePlatform = useCallback(
    (id: SafeZonePlatformId) => {
      setPlatformByAspect((prev) => ({
        ...prev,
        [aspectRatio]: id,
      }));
      setShowSafeZones(true);
    },
    [aspectRatio]
  );

  const handleDimChange = useCallback((nextDim: number) => {
    const clamped = Math.max(0, Math.min(75, nextDim));
    setSafeZoneDim(clamped);
    if (clamped > 0) {
      setShowSafeZones(true);
    }
  }, []);

  const [resizeHUD, setResizeHUD] = useState<string>('');
  const hasMovedRef = useRef<boolean>(false);

  // Compute word tokens and exact timestamps matching the backend renderer 1:1
  const captionTokensWithTiming = useMemo(() => {
    if (!displaySubtitle) return [];
    return getSubtitleTokensWithTiming(displaySubtitle);
  }, [displaySubtitle]);

  const captionTokens = useMemo(
    () => captionTokensWithTiming.map((t) => t.word),
    [captionTokensWithTiming]
  );

  const activeWordIndex = useMemo(() => {
    if (!displaySubtitle || captionTokensWithTiming.length <= 1) return 0;
    if (currentTime <= captionTokensWithTiming[0].start) return 0;
    const lastIdx = captionTokensWithTiming.length - 1;
    if (currentTime >= captionTokensWithTiming[lastIdx].start) return lastIdx;

    const matchedIdx = captionTokensWithTiming.findIndex(
      (t) => currentTime >= t.start && currentTime < t.end
    );
    if (matchedIdx !== -1) return matchedIdx;

    // Fallback to nearest preceding token if between rounded timestamp bounds
    for (let i = lastIdx; i >= 0; i--) {
      if (currentTime >= captionTokensWithTiming[i].start) return i;
    }
    return 0;
  }, [displaySubtitle, captionTokensWithTiming, currentTime]);

  const handleDragStart = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      if (isResizing) return;
      e.preventDefault();
      e.stopPropagation();

      const target = e.currentTarget as HTMLElement;
      const container = containerRef.current || videoStageRef.current;
      if (!container) return;

      try {
        target.setPointerCapture(e.pointerId);
      } catch {
        // Ignore
      }

      hasMovedRef.current = false;
      const startPointerX = e.clientX;
      const startPointerY = e.clientY;
      const startX = posX;
      const startY = posY;

      setIsDragging(true);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';

      const onPointerMove = (moveEvent: PointerEvent) => {
        const rect = container.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        const deltaX = ((moveEvent.clientX - startPointerX) / rect.width) * 100;
        const deltaY = ((moveEvent.clientY - startPointerY) / rect.height) * 100;

        if (
          Math.abs(moveEvent.clientX - startPointerX) > 2 ||
          Math.abs(moveEvent.clientY - startPointerY) > 2
        ) {
          hasMovedRef.current = true;
        }

        let rawX = startX + deltaX;
        const rawY = startY + deltaY;

        if (Math.abs(rawX - 50) < 3) {
          rawX = 50;
          setShowCenterGuide(true);
        } else {
          setShowCenterGuide(false);
        }

        const clampedX = Math.round(Math.max(4, Math.min(96, rawX)) * 10) / 10;
        const clampedY = Math.round(Math.max(4, Math.min(96, rawY)) * 10) / 10;

        setStyles?.({
          ...activeEffectiveStyle,
          position: 'custom',
          custom_x: clampedX,
          custom_y: clampedY,
        });
      };

      const onPointerUp = (upEvent: PointerEvent) => {
        try {
          target.releasePointerCapture(upEvent.pointerId);
        } catch {
          // Ignore
        }
        setIsDragging(false);
        setShowCenterGuide(false);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerUp);
      };

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);
    },
    [activeEffectiveStyle, isResizing, posX, posY, setStyles]
  );

  const handleResizeStart = useCallback(
    (e: React.PointerEvent, handle: 'n' | 's' | 'e' | 'w' | 'nw' | 'ne' | 'se' | 'sw') => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();

      const target = e.currentTarget as HTMLElement;
      const container = containerRef.current || videoStageRef.current;
      const subtitleEl = target.closest('[data-subtitle-overlay]') as HTMLElement;
      if (!container || !subtitleEl) return;

      try {
        target.setPointerCapture(e.pointerId);
      } catch {
        // Ignore
      }

      const containerRect = container.getBoundingClientRect();
      const centerX =
        subtitleEl.getBoundingClientRect().left + subtitleEl.getBoundingClientRect().width / 2;
      const centerY =
        subtitleEl.getBoundingClientRect().top + subtitleEl.getBoundingClientRect().height / 2;

      const startDistY = Math.max(15, Math.abs(e.clientY - centerY));
      const initialFontSize = activeEffectiveStyle.font_size || 70;

      setIsResizing(true);
      document.body.style.cursor =
        handle === 'e' || handle === 'w'
          ? 'ew-resize'
          : handle === 'n' || handle === 's'
          ? 'ns-resize'
          : handle === 'nw' || handle === 'se'
          ? 'nwse-resize'
          : 'nesw-resize';
      document.body.style.userSelect = 'none';

      const onPointerMove = (moveEvent: PointerEvent) => {
        if (handle === 'e' || handle === 'w') {
          const currentDistX = Math.abs(moveEvent.clientX - centerX);
          const newWidthPx = currentDistX * 2;
          const widthPercent = Math.min(
            96,
            Math.max(15, Math.round((newWidthPx / containerRect.width) * 100))
          );
          setResizeHUD(`ความกว้าง: ${widthPercent}%`);
          setStyles?.({
            ...activeEffectiveStyle,
            box_width: widthPercent,
          });
          return;
        }

        if (handle === 'n' || handle === 's') {
          const currentDistY = Math.abs(moveEvent.clientY - centerY);
          const scaleY = currentDistY / startDistY;
          const calculatedSize = Math.round(initialFontSize * scaleY);
          const clampedSize = Math.max(24, Math.min(130, calculatedSize));
          setResizeHUD(`ขนาดฟอนต์: ${clampedSize}px`);
          setStyles?.({
            ...activeEffectiveStyle,
            font_size: clampedSize,
          });
          return;
        }

        const currentDistX = Math.abs(moveEvent.clientX - centerX);
        const newWidthPx = currentDistX * 2;
        const widthPercent = Math.min(
          95,
          Math.max(20, Math.round((newWidthPx / containerRect.width) * 100))
        );

        const currentDistY = Math.abs(moveEvent.clientY - centerY);
        const scaleY = currentDistY / startDistY;
        const calculatedSize = Math.round(initialFontSize * scaleY);
        const clampedSize = Math.max(24, Math.min(130, calculatedSize));

        setResizeHUD(`ฟอนต์: ${clampedSize}px · กว้าง: ${widthPercent}%`);
        setStyles?.({
          ...activeEffectiveStyle,
          font_size: clampedSize,
          box_width: widthPercent,
        });
      };

      const onPointerUp = (upEvent: PointerEvent) => {
        try {
          target.releasePointerCapture(upEvent.pointerId);
        } catch {
          // Ignore
        }
        setIsResizing(false);
        setResizeHUD('');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerUp);
      };

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);
    },
    [activeEffectiveStyle, setStyles]
  );

  // Size of the video stage itself (aspect-fitted inside the wrapper). Text scale must follow THIS, not the
  // wrapper: the export scales text by video height, so using the wrapper made landscape previews too big.
  const stageDims = useMemo(() => {
    const padX = 28;
    const padY = 24;
    const availW = Math.max(200, parentDimensions.width - padX);
    const availH = Math.max(200, parentDimensions.height - padY);

    let targetRatio = 16 / 9;
    if (aspectRatio === '9:16') {
      targetRatio = 9 / 16;
    } else if (aspectRatio === '1:1') {
      targetRatio = 1;
    }

    let computedW = availW;
    let computedH = computedW / targetRatio;

    if (computedH > availH) {
      computedH = availH;
      computedW = computedH * targetRatio;
    }

    return { width: Math.round(computedW), height: Math.round(computedH) };
  }, [aspectRatio, parentDimensions]);

  const stageScaleRatio = useMemo(() => {
    const containerH = stageDims.height > 0 ? stageDims.height : 550;
    const referenceVideoH = aspectRatio === '9:16' ? 1920 : 1080;
    return containerH / referenceVideoH;
  }, [aspectRatio, stageDims.height]);

  const activeOverlayStyle = useMemo(() => {
    let bgRgba = 'transparent';
    if (activeEffectiveStyle.bg_opacity > 0) {
      const hex = activeEffectiveStyle.bg_color.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16) || 0;
      const g = parseInt(hex.substring(2, 4), 16) || 0;
      const b = parseInt(hex.substring(4, 6), 16) || 0;
      bgRgba = `rgba(${r}, ${g}, ${b}, ${activeEffectiveStyle.bg_opacity})`;
    }

    const scaleRatio = stageScaleRatio;
    const computedFontSize = Math.round(
      Math.max(10, (activeEffectiveStyle.font_size || 56) * scaleRatio)
    );

    const scaledPaddingY = Math.round(
      Math.max(2, (activeEffectiveStyle.padding_y ?? 8) * scaleRatio)
    );
    const scaledPaddingX = Math.round(
      Math.max(4, (activeEffectiveStyle.padding_x ?? 16) * scaleRatio)
    );
    const scaledBorderRadius = Math.round(
      Math.max(0, (activeEffectiveStyle.border_radius ?? 12) * scaleRatio)
    );
    const scaledOutlineThickness = Math.max(
      1,
      Math.round((activeEffectiveStyle.outline_thickness ?? 3) * scaleRatio * 1.4) / 1.4
    );
    const scaledShadowThickness = Math.max(
      1,
      Math.round((activeEffectiveStyle.shadow_thickness ?? 3) * scaleRatio)
    );

    const shadowCol = activeEffectiveStyle.shadow_color || '#000000';
    const outlineCol = activeEffectiveStyle.outline_color || shadowCol || '#000000';
    const isNeonGlow =
      activeEffectiveStyle.preset_mode === 'karaoke' ||
      (activeEffectiveStyle.shadow &&
        shadowCol.toLowerCase() === activeEffectiveStyle.text_color?.toLowerCase() &&
        shadowCol.toLowerCase() !== '#ffffff' &&
        shadowCol.toLowerCase() !== '#000000');

    let computedTextShadow = 'none';
    if (isNeonGlow) {
      const glowColor = activeEffectiveStyle.text_color || shadowCol;
      computedTextShadow = `0 0 ${Math.max(4, scaledShadowThickness * 3)}px ${glowColor}, 0 0 ${Math.max(
        8,
        scaledShadowThickness * 6
      )}px ${glowColor}, 0 2px 4px #000000`;
    } else if (activeEffectiveStyle.outline && activeEffectiveStyle.shadow) {
      const ot = scaledOutlineThickness;
      computedTextShadow = `0 ${scaledShadowThickness}px ${Math.max(1, scaledShadowThickness)}px ${shadowCol}, -${ot}px -${ot}px 0 ${outlineCol}, ${ot}px -${ot}px 0 ${outlineCol}, -${ot}px ${ot}px 0 ${outlineCol}, ${ot}px ${ot}px 0 ${outlineCol}`;
    } else if (activeEffectiveStyle.outline) {
      const ot = scaledOutlineThickness;
      computedTextShadow = `-${ot}px -${ot}px 0 ${outlineCol}, ${ot}px -${ot}px 0 ${outlineCol}, -${ot}px ${ot}px 0 ${outlineCol}, ${ot}px ${ot}px 0 ${outlineCol}`;
    } else if (activeEffectiveStyle.shadow) {
      computedTextShadow = `${scaledShadowThickness}px ${scaledShadowThickness}px ${scaledShadowThickness * 2}px ${shadowCol}`;
    }

    return {
      fontFamily: `"${activeEffectiveStyle.font_family || 'Kanit'}", "Noto Sans Thai", "Prompt", sans-serif`,
      fontSize: `${computedFontSize}px`,
      fontWeight: activeEffectiveStyle.bold ? 800 : 500,
      fontStyle: activeEffectiveStyle.italic ? 'italic' : 'normal',
      textDecoration: activeEffectiveStyle.underline ? 'underline' : 'none',
      letterSpacing: activeEffectiveStyle.letter_spacing
        ? `${(activeEffectiveStyle.letter_spacing * scaleRatio).toFixed(2)}px`
        : undefined,
      textTransform: activeEffectiveStyle.uppercase ? ('uppercase' as const) : ('none' as const),
      color: activeEffectiveStyle.text_color,
      textShadow: computedTextShadow,
      backgroundColor: bgRgba,
      backdropFilter:
        activeEffectiveStyle.preset_mode === 'frosted' && activeEffectiveStyle.bg_opacity > 0
          ? 'blur(10px)'
          : undefined,
      border:
        activeEffectiveStyle.preset_mode === 'frosted' && activeEffectiveStyle.bg_opacity > 0
          ? '1px solid rgba(255,255,255,0.16)'
          : undefined,
      padding: `${scaledPaddingY}px ${scaledPaddingX}px`,
      borderRadius: `${scaledBorderRadius}px`,
      textAlign: 'center' as const,
      lineHeight: activeEffectiveStyle.line_height || 1.35,
      whiteSpace: 'pre-wrap' as const,
      wordBreak: 'normal' as const,
      overflowWrap: 'break-word' as const,
      display: 'inline-block' as const,
      width: '100%',
    };
  }, [activeEffectiveStyle, stageScaleRatio]);

  const activeAnimationClass = useMemo(() => {
    if (activeEffectiveStyle.animation === 'fade') return 'anim-fade';
    if (activeEffectiveStyle.animation === 'pop') return 'anim-pop';
    if (activeEffectiveStyle.animation === 'slide-up') return 'cap-enter-rise';
    if (activeEffectiveStyle.animation === 'bounce') return 'cap-enter-bounce';
    if (activeEffectiveStyle.animation === 'shake') return 'cap-phrase-shake';
    if (activeEffectiveStyle.animation === 'typewriter') return 'cap-enter-type';
    return '';
  }, [activeEffectiveStyle.animation]);

  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setParentDimensions({ width, height });
        }
      }
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Provide explicit pixel width & height so the stage animates smoothly between aspect ratios.
  const containerDimensions = useMemo(
    () => ({ width: `${stageDims.width}px`, height: `${stageDims.height}px` }),
    [stageDims]
  );

  const isWordHighlightEnabled = Boolean(activeEffectiveStyle.word_highlight);
  const isMultiWordHighlight =
    (isWordHighlightEnabled || activeEffectiveStyle.animation === 'typewriter') &&
    captionTokens.length > 1;

  return (
    <div className="relative flex flex-1 flex-col min-h-0 overflow-hidden select-none bg-[#050508]">
      {/* 1. FLUSH MONITOR TELEMETRY BAR */}
      <div className="relative z-30 flex h-9 flex-shrink-0 items-center justify-between border-b border-[#181720] bg-[#08070c] px-3 sm:px-4 text-[10px] font-mono">
        <div className="flex items-center gap-2.5">
          <span
            className={`inline-flex items-center gap-1.5 font-bold tracking-wider uppercase ${
              isPlaying ? 'text-[#c4b5fd]' : 'text-zinc-400'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-[1px] ${
                isPlaying ? 'bg-[#8b5cf6] animate-pulse' : 'bg-zinc-600'
              }`}
            />
            {isPlaying ? 'LIVE' : 'MON'}
          </span>
          <span className="text-zinc-700">|</span>
          <span className="text-zinc-300 font-semibold tabular-nums">
            {aspectRatio === '9:16'
              ? '9:16 · 1080×1920'
              : aspectRatio === '16:9'
              ? '16:9 · 1920×1080'
              : '1:1 · 1080×1080'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden xl:flex items-center gap-1.5 text-zinc-500">
            <span className="text-zinc-300">{activeEffectiveStyle.font_family}</span>
            <span>·</span>
            <span className="tabular-nums">{activeEffectiveStyle.font_size}px</span>
            <span>·</span>
            <span
              className={
                isWordHighlightEnabled || activeEffectiveStyle.animation === 'typewriter'
                  ? 'text-[#c4b5fd]'
                  : 'text-zinc-500'
              }
            >
              {isWordHighlightEnabled
                ? 'WORD SYNC'
                : activeEffectiveStyle.animation === 'typewriter'
                ? 'TYPEWRITER'
                : 'FULL LINE'}
            </span>
          </div>

          <div ref={safeZoneMenuRef} className="relative">
            <div
              className={`inline-flex h-6 items-stretch rounded-md border transition-colors ${
                showSafeZones
                  ? 'bg-[#7c3aed] border-[#8b5cf6]'
                  : 'bg-[#100f16] border-[#22202d]'
              }`}
            >
              <button
                type="button"
                onClick={() => setShowSafeZones((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 rounded-l-[5px] px-2 text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                  showSafeZones
                    ? 'text-white hover:bg-[#8b5cf6]'
                    : 'text-zinc-400 hover:text-white hover:bg-[#191724]'
                }`}
                title="เปิด/ปิดกรอบระยะปลอดภัย (Safe Zone)"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                  <rect x="3" y="3" width="18" height="18" rx="1.5" strokeDasharray="4 2" />
                </svg>
                <span>
                  {showSafeZones
                    ? `SAFE · ${activeSafeZonePreset.shortName.toUpperCase()}`
                    : 'SAFE ZONE'}
                </span>
                {showSafeZones && safeZoneWarning.isOverlapping && (
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-amber-400"
                    title={safeZoneWarning.message || 'ซับอาจถูก UI บัง'}
                  />
                )}
              </button>

              <span
                aria-hidden="true"
                className={`my-1 w-[1px] ${showSafeZones ? 'bg-white/25' : 'bg-[#2a2738]'}`}
              />

              <button
                type="button"
                onClick={() => setIsSafeZoneMenuOpen((prev) => !prev)}
                aria-expanded={isSafeZoneMenuOpen}
                aria-haspopup="menu"
                aria-label="เลือกแพลตฟอร์มและปรับลดแสง Safe Zone"
                title="เลือกแพลตฟอร์มและปรับลดแสงพรีวิว"
                className={`inline-flex items-center justify-center rounded-r-[5px] px-1.5 transition-colors cursor-pointer ${
                  showSafeZones
                    ? isSafeZoneMenuOpen
                      ? 'bg-[#6d28d9] text-white'
                      : 'text-white/90 hover:bg-[#8b5cf6]'
                    : isSafeZoneMenuOpen
                    ? 'bg-[#1f1c2e] text-white'
                    : 'text-zinc-400 hover:text-white hover:bg-[#191724]'
                }`}
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className={`transition-transform duration-150 ${
                    isSafeZoneMenuOpen ? 'rotate-180' : ''
                  }`}
                >
                  <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            {isSafeZoneMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full mt-1.5 w-72 max-w-[calc(100vw-24px)] max-h-[75vh] overflow-y-auto rounded-xl border border-[#262433] bg-[#0b0a10]/98 backdrop-blur-xl p-2.5 shadow-[0_24px_60px_rgba(0,0,0,0.95)] z-50 font-sans origin-top-right anim-dropdown"
              >
                <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-white/[0.06]">
                  <div>
                    <p className="text-[11px] font-bold text-white leading-tight">
                      แพลตฟอร์ม Safe Zone
                    </p>
                    <p className="text-[10px] font-mono text-zinc-400 mt-0.5">
                      สัดส่วน {aspectRatio} · {activeSafeZonePreset.resolutionLabel}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSafeZones((prev) => !prev)}
                    className={`rounded-md px-2 py-1 text-[10px] font-bold transition-colors border cursor-pointer ${
                      showSafeZones
                        ? 'bg-[#7c3aed] text-white border-[#8b5cf6]'
                        : 'bg-[#14131d] text-zinc-300 border-[#282538] hover:text-white'
                    }`}
                  >
                    {showSafeZones ? 'กำลังแสดง' : 'ปิดอยู่'}
                  </button>
                </div>

                <div className="space-y-1">
                  {aspectSafeZonePresets.map((preset) => {
                    const isSelected = preset.id === activeSafeZonePreset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        role="menuitemradio"
                        aria-checked={isSelected}
                        onClick={() => handleSelectSafeZonePlatform(preset.id)}
                        className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left transition-colors border cursor-pointer ${
                          isSelected
                            ? 'bg-[#191529] border-[#7c3aed]/70 text-white'
                            : 'bg-transparent border-transparent text-zinc-300 hover:bg-[#14131c] hover:text-white'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 text-xs font-semibold leading-tight">
                            <span
                              className="h-2 w-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: preset.accentHex }}
                            />
                            <span className="truncate">{preset.name}</span>
                          </div>
                          <p className="text-[10px] text-zinc-400 mt-0.5 truncate">
                            {preset.description}
                          </p>
                        </div>
                        {isSelected && (
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            className="flex-shrink-0 text-[#a78bfa]"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-2.5 pt-2.5 border-t border-white/[0.06]">
                  <div className="flex items-center justify-between text-[11px] mb-1.5">
                    <span className="font-semibold text-zinc-200">ลดแสงวิดีโอพรีวิว</span>
                    <span className="font-mono text-[10px] text-[#c4b5fd] tabular-nums">
                      {safeZoneDim}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={75}
                    step={5}
                    value={safeZoneDim}
                    onChange={(e) => handleDimChange(Number(e.target.value))}
                    aria-label="ลดแสงวิดีโอพรีวิว"
                    className="w-full h-1.5 rounded-lg appearance-none bg-[#1e1b2c] accent-[#8b5cf6] cursor-pointer"
                  />
                  <div className="mt-2 flex items-center gap-1.5">
                    {[0, 25, 40, 60].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleDimChange(val)}
                        className={`flex-1 rounded py-1 font-mono text-[10px] font-semibold transition-colors border cursor-pointer ${
                          safeZoneDim === val
                            ? 'bg-[#7c3aed]/25 text-[#e9d5ff] border-[#8b5cf6]/70'
                            : 'bg-[#12111a] text-zinc-400 border-[#242133] hover:text-white'
                        }`}
                      >
                        {val}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. REFERENCE COLORIST STAGE WELL */}
      <div
        ref={wrapperRef}
        className="relative flex flex-1 min-h-0 items-center justify-center p-3 sm:p-5 overflow-hidden bg-[#050508]"
      >
      {/* 3. Aspect-Ratio Adaptive Video Stage Card */}
      <div
        ref={containerRef}
        style={containerDimensions}
        className="group/stage relative z-10 overflow-hidden rounded-lg bg-black shadow-[0_24px_64px_rgba(0,0,0,0.92)] border border-[#242230] hover:border-white/30 transition-[width,height,border-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex items-center justify-center will-change-[width,height]"
      >
        {/* Crisp 1px Optical Viewfinder Corner Ticks */}
        <div className="pointer-events-none absolute top-2 left-2 w-2.5 h-2.5 border-t border-l border-white/25 z-20" />
        <div className="pointer-events-none absolute top-2 right-2 w-2.5 h-2.5 border-t border-r border-white/25 z-20" />
        <div className="pointer-events-none absolute bottom-2 left-2 w-2.5 h-2.5 border-b border-l border-white/25 z-20" />
        <div className="pointer-events-none absolute bottom-2 right-2 w-2.5 h-2.5 border-b border-r border-white/25 z-20" />

        {/* Preview Light Dimmer Under Subtitles so Safe Zones & Captions Stand Out */}
        {showSafeZones && safeZoneDim > 0 && (
          <div
            data-safe-zone-dim="true"
            style={{ opacity: safeZoneDim / 100 }}
            className="pointer-events-none absolute inset-0 z-[12] bg-black transition-opacity duration-150"
          />
        )}

        {/* Video Element or Rich Interactive Studio Stage Backdrop */}
        {videoUrl && !videoError ? (
          <>
            <video
              ref={videoRef}
              src={videoUrl}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={onVideoLoaded}
              onPlay={() => onPlaybackStateChange?.(true)}
              onPause={() => onPlaybackStateChange?.(false)}
              onEnded={() => {
                handleTimeUpdate();
                onPlaybackStateChange?.(false);
              }}
              onClick={togglePlay}
              onError={(e) => {
                console.warn('Video source error:', videoUrl, e);
                setVideoError(true);
              }}
              className="h-full w-full object-contain cursor-pointer transition-transform duration-300"
              playsInline
              preload="metadata"
            />

            {/* Tactile Pause Stage Overlay */}
            {!isPlaying && !isDragging && !isResizing && (
              <div
                onClick={togglePlay}
                className="absolute inset-0 z-10 flex items-center justify-center bg-black/25 opacity-0 group-hover/stage:opacity-100 transition-opacity duration-150 cursor-pointer"
                title="คลิกเพื่อเล่น (Space)"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#0c0b10]/90 border border-white/25 text-white shadow-xl hover:bg-[#7c3aed] hover:text-white hover:border-[#a78bfa] transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
                    <polygon points="6 3 20 12 6 21 6 3" />
                  </svg>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Clean Architectural Wireframe Monitor When No Video Loaded */
          <div className="relative flex h-full w-full flex-col items-center justify-center p-6 text-center overflow-hidden bg-[#060609]">
            <div className="relative z-10 flex flex-col items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-[#252333] bg-[#0e0d14] text-zinc-400 mb-3">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <polygon points="23 7 16 12 23 17 23 7" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
              </div>
              <span className="font-mono text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500 mb-1.5">
                NO SOURCE SIGNAL
              </span>
              <p className="text-xs text-zinc-400 max-w-[220px] leading-relaxed mb-4">
                ปรับแต่งฟอนต์ สี และลากจัดวางตำแหน่งซับไตเติลบนสเตจได้ทันที
              </p>
              <Link
                href="/my-video"
                className="pointer-events-auto inline-flex items-center gap-1.5 rounded-lg border border-[#2a2838] bg-[#121118] hover:border-white/40 hover:text-white px-3 py-1.5 text-[11px] font-semibold text-zinc-300 transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                <span>กลับสู่คลังฟุตเทจ</span>
              </Link>
            </div>
          </div>
        )}

        {/* Canvas Subtitle Stage Layer */}
        <div
          ref={videoStageRef}
          data-canvas-stage="true"
          className="absolute inset-0 pointer-events-none overflow-hidden"
        >
          {/* Luminous Violet Center Guide Line during drag */}
          {showCenterGuide && (
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1.5px] bg-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.9)] pointer-events-none z-30" />
          )}

          {/* Draggable & 8-Handle Resizable Real-time Subtitle Overlay */}
          {displaySubtitle && (
            <div
              data-subtitle-overlay="true"
              onPointerDown={handleDragStart}
              onClick={(e) => {
                e.stopPropagation();
              }}
              style={{
                left: `${posX}%`,
                top: `${posY}%`,
                transform: 'translate(-50%, -50%)',
                width: activeEffectiveStyle.box_width
                  ? `${activeEffectiveStyle.box_width}%`
                  : undefined,
                maxWidth: '95%',
                touchAction: 'none',
                pointerEvents: 'auto',
              }}
              className={`group absolute select-none cursor-grab active:cursor-grabbing ${
                isDragging || isResizing ? 'shadow-2xl z-40' : 'z-20'
              }`}
              title="ลากเพื่อย้ายตำแหน่ง หรือลากขอบทั้ง 4 ด้านเพื่อปรับขนาดซับไตเติล"
            >
              {/* Live Studio HUD Pill during Drag / Resize */}
              {(isDragging || isResizing) && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 rounded-full bg-[#0e0c19]/95 backdrop-blur-md border border-purple-400/45 px-3 py-0.5 font-mono text-[10px] font-semibold tabular-nums text-[#e9d5ff] whitespace-nowrap shadow-[0_8px_24px_rgba(0,0,0,0.85),0_0_16px_rgba(139,92,246,0.35)] pointer-events-none z-50">
                  {isResizing
                    ? resizeHUD || `ขนาดฟอนต์: ${activeEffectiveStyle.font_size}px`
                    : `X: ${posX}% · Y: ${posY}%${posX === 50 ? ' (กึ่งกลาง)' : ''}`}
                </div>
              )}

              {/* Bounding Box & 8 Resize Handles */}
              <div
                className={`absolute -inset-1.5 border border-dashed border-purple-400/85 rounded-xl pointer-events-none z-30 transition-opacity duration-150 shadow-[0_0_15px_rgba(139,92,246,0.2)] ${
                  isDragging || isResizing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
              >
                {/* 4 Corner Handles */}
                <span
                  onPointerDown={(e) => handleResizeStart(e, 'nw')}
                  className="block absolute -top-1.5 -left-1.5 h-3 w-3 rounded-full bg-white border-2 border-[#7c3aed] shadow-md cursor-nwse-resize pointer-events-auto transition-transform hover:scale-125"
                  title="ขยายมุมบนซ้าย"
                />
                <span
                  onPointerDown={(e) => handleResizeStart(e, 'ne')}
                  className="block absolute -top-1.5 -right-1.5 h-3 w-3 rounded-full bg-white border-2 border-[#7c3aed] shadow-md cursor-nesw-resize pointer-events-auto transition-transform hover:scale-125"
                  title="ขยายมุมบนขวา"
                />
                <span
                  onPointerDown={(e) => handleResizeStart(e, 'sw')}
                  className="block absolute -bottom-1.5 -left-1.5 h-3 w-3 rounded-full bg-white border-2 border-[#7c3aed] shadow-md cursor-nesw-resize pointer-events-auto transition-transform hover:scale-125"
                  title="ขยายมุมล่างซ้าย"
                />
                <span
                  onPointerDown={(e) => handleResizeStart(e, 'se')}
                  className="block absolute -bottom-1.5 -right-1.5 h-3 w-3 rounded-full bg-white border-2 border-[#7c3aed] shadow-md cursor-nwse-resize pointer-events-auto transition-transform hover:scale-125"
                  title="ขยายมุมล่างขวา"
                />

                {/* 4 Side Pill Handles */}
                <span
                  onPointerDown={(e) => handleResizeStart(e, 'w')}
                  className="block absolute top-1/2 -left-1.5 -translate-y-1/2 h-6 w-1.5 rounded-full bg-white border border-[#7c3aed] shadow-md cursor-ew-resize pointer-events-auto transition-transform hover:scale-125"
                  title="ลากเพื่อปรับความกว้างซ้าย"
                />
                <span
                  onPointerDown={(e) => handleResizeStart(e, 'e')}
                  className="block absolute top-1/2 -right-1.5 -translate-y-1/2 h-6 w-1.5 rounded-full bg-white border border-[#7c3aed] shadow-md cursor-ew-resize pointer-events-auto transition-transform hover:scale-125"
                  title="ลากเพื่อปรับความกว้างขวา"
                />
                <span
                  onPointerDown={(e) => handleResizeStart(e, 'n')}
                  className="block absolute left-1/2 -top-1.5 -translate-x-1/2 w-6 h-1.5 rounded-full bg-white border border-[#7c3aed] shadow-md cursor-ns-resize pointer-events-auto transition-transform hover:scale-125"
                  title="ลากเพื่อปรับขนาดฟอนต์ด้านบน"
                />
                <span
                  onPointerDown={(e) => handleResizeStart(e, 's')}
                  className="block absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-6 h-1.5 rounded-full bg-white border border-[#7c3aed] shadow-md cursor-ns-resize pointer-events-auto transition-transform hover:scale-125"
                  title="ลากเพื่อปรับขนาดฟอนต์ด้านล่าง"
                />
              </div>

              {/* Word-by-Word Viral Token Renderer (matches EditorMockup.tsx & ass_generator.py 1:1) */}
              <div key={captionKey} style={activeOverlayStyle} className={activeAnimationClass}>
                {isMultiWordHighlight ? (
                  <span className="whitespace-normal">
                    {captionTokens.map((token, idx) => {
                      const nextToken = idx < captionTokens.length - 1 ? captionTokens[idx + 1] : '';
                      const separator = nextToken
                        ? needsSpaceBetweenWords(token, nextToken)
                          ? ' '
                          : <wbr />
                        : null;
                      const isWordActive = isWordHighlightEnabled && idx === activeWordIndex;
                      const isFutureKaraoke =
                        isWordHighlightEnabled &&
                        activeEffectiveStyle.preset_mode === 'karaoke' &&
                        idx > activeWordIndex;
                      const isBadgeWord =
                        isWordHighlightEnabled &&
                        activeEffectiveStyle.preset_mode === 'badge' &&
                        isWordActive;
                      const isTypewriterHidden =
                        activeEffectiveStyle.animation === 'typewriter' && idx > activeWordIndex;

                      if (isTypewriterHidden) {
                        return (
                          <React.Fragment key={idx}>
                            <span className="inline-block opacity-0">{token}</span>
                            {separator}
                          </React.Fragment>
                        );
                      }

                      if (isBadgeWord) {
                        const badgeBg =
                          activeEffectiveStyle.badge_color || activeEffectiveStyle.text_color || '#22c55e';
                        return (
                          <React.Fragment key={idx}>
                            <span
                              style={{
                                backgroundColor: badgeBg,
                                color: '#000000',
                                padding: `${Math.max(1, Math.round(3 * stageScaleRatio))}px ${Math.max(
                                  4,
                                  Math.round(10 * stageScaleRatio)
                                )}px`,
                                borderRadius: `${Math.max(4, Math.round(8 * stageScaleRatio))}px`,
                                textShadow: 'none',
                                transform: 'translateY(-1px) scale(1.06)',
                              }}
                              className="inline-block transition-transform duration-150"
                            >
                              {token}
                            </span>
                            {separator}
                          </React.Fragment>
                        );
                      }

                      return (
                        <React.Fragment key={idx}>
                          <span
                            style={{
                              color:
                                isWordActive || !isWordHighlightEnabled
                                  ? activeEffectiveStyle.text_color
                                  : activeEffectiveStyle.base_text_color || '#ffffff',
                              opacity: isFutureKaraoke ? 0.45 : 1,
                              transform: isWordActive ? 'translateY(-1px) scale(1.06)' : undefined,
                            }}
                            className="inline-block transition-transform duration-150"
                          >
                            {token}
                          </span>
                          {separator}
                        </React.Fragment>
                      );
                    })}
                  </span>
                ) : (
                  <span className="whitespace-normal">
                    {displaySubtitle.text.split('\n').map((line, lineIdx, linesArr) => {
                      const lineTokens = tokenizeSubtitleText(line);
                      return (
                        <React.Fragment key={lineIdx}>
                          {lineTokens.map((tok, tokIdx) => {
                            const nextTok = lineTokens[tokIdx + 1];
                            const separator = nextTok ? (
                              needsSpaceBetweenWords(tok, nextTok) ? (
                                ' '
                              ) : (
                                <wbr />
                              )
                            ) : null;
                            return (
                              <React.Fragment key={`${lineIdx}-${tokIdx}`}>
                                {tok}
                                {separator}
                              </React.Fragment>
                            );
                          })}
                          {lineIdx < linesArr.length - 1 ? <br /> : null}
                        </React.Fragment>
                      );
                    })}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Platform-Accurate Safe Zone Spotlight & UI Guide Overlay */}
        {showSafeZones && (
          <SafeZoneOverlay
            preset={activeSafeZonePreset}
            warning={safeZoneWarning}
            dimPercent={safeZoneDim}
          />
        )}
      </div>
      </div>
    </div>
  );
}

export default React.memo(VideoPlayer);
