'use client';

import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { SubtitleSegment, SubtitleStyle } from './types';

interface VideoPlayerProps {
  videoUrl: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  aspectRatio: '16:9' | '9:16' | '1:1';
  togglePlay: () => void;
  handleTimeUpdate: () => void;
  handleLoadedMetadata: () => void;
  handleDirectUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  activeSubtitle?: SubtitleSegment;
  selectedSubtitle?: SubtitleSegment;
  selectedSubtitleId: number | string | null;
  setSelectedSubtitleId: React.Dispatch<React.SetStateAction<number | string | null>>;
  globalStyles: SubtitleStyle;
  setStyles?: (styles: SubtitleStyle) => void;
  subtitles?: SubtitleSegment[];
}

function VideoPlayer({
  videoUrl,
  videoRef,
  fileInputRef,
  aspectRatio,
  togglePlay,
  handleTimeUpdate,
  handleLoadedMetadata,
  handleDirectUpload,
  activeSubtitle,
  selectedSubtitle,
  selectedSubtitleId,
  setSelectedSubtitleId,
  globalStyles,
  setStyles,
  subtitles,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [showCenterGuide, setShowCenterGuide] = useState<boolean>(false);

  // Track last active subtitle to prevent flicker during gaps between segments
  const lastActiveRef = useRef<SubtitleSegment | undefined>(undefined);

  // When activeSubtitle changes (new segment or gap), update the ref
  useEffect(() => {
    if (activeSubtitle) {
      lastActiveRef.current = activeSubtitle;
    }
  }, [activeSubtitle]);

  // Priority: 1. activeSubtitle (currently playing) -> 2. last active (hold during gaps) -> 3. selectedSubtitle -> 4. first subtitle (preview)
  const displaySubtitle = useMemo(() => {
    if (activeSubtitle) return activeSubtitle;
    // During a gap between segments, keep showing the last active subtitle briefly
    // instead of falling back to selectedSubtitle/subtitles[0] which causes flicker
    if (lastActiveRef.current) return lastActiveRef.current;
    return selectedSubtitle || (subtitles && subtitles.length > 0 ? subtitles[0] : undefined);
  }, [activeSubtitle, selectedSubtitle, subtitles]);

  // Unique key for each caption to trigger clean CSS animation re-play
  const captionKey = displaySubtitle ? `caption-${displaySubtitle.id}-${displaySubtitle.text}` : '';

  const activeEffectiveStyle = displaySubtitle?.style ?? globalStyles;

  // Calculate X and Y coordinates (Percentage based 0 - 100%)
  const posX = activeEffectiveStyle.custom_x ?? 50;
  const posY = activeEffectiveStyle.custom_y ?? (
    activeEffectiveStyle.position === 'center' ? 50 :
    activeEffectiveStyle.position === 'custom' ? 12 : 85
  );

  const [resizeHUD, setResizeHUD] = useState<string>('');
  const hasMovedRef = useRef<boolean>(false);

  // Dragging / Move handler (Accurate delta-based tracking with pointer capture)
  const handleDragStart = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return; // Left click only
    if (isResizing) return;
    e.preventDefault();
    e.stopPropagation();

    const target = e.currentTarget as HTMLElement;
    const container = containerRef.current;
    if (!container) return;

    try {
      target.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture unsupported
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

      if (Math.abs(moveEvent.clientX - startPointerX) > 2 || Math.abs(moveEvent.clientY - startPointerY) > 2) {
        hasMovedRef.current = true;
      }

      let rawX = startX + deltaX;
      let rawY = startY + deltaY;

      // Magnetic snap to center X (within 3% range)
      if (Math.abs(rawX - 50) < 3) {
        rawX = 50;
        setShowCenterGuide(true);
      } else {
        setShowCenterGuide(false);
      }

      // Clamp smoothly inside video boundary (6% to 94%)
      const clampedX = Math.round(Math.max(6, Math.min(94, rawX)) * 10) / 10;
      const clampedY = Math.round(Math.max(6, Math.min(94, rawY)) * 10) / 10;

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
  }, [activeEffectiveStyle, isResizing, posX, posY, setStyles]);

  // 4-Side and 4-Corner Free Resize / Expansion Handler (Multi-directional)
  const handleResizeStart = useCallback((e: React.PointerEvent, handle: 'n' | 's' | 'e' | 'w' | 'nw' | 'ne' | 'se' | 'sw') => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    const target = e.currentTarget as HTMLElement;
    const container = containerRef.current;
    const subtitleEl = target.closest('[data-subtitle-overlay]') as HTMLElement;
    if (!container || !subtitleEl) return;

    try {
      target.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture unsupported
    }

    const containerRect = container.getBoundingClientRect();
    const centerX = subtitleEl.getBoundingClientRect().left + subtitleEl.getBoundingClientRect().width / 2;
    const centerY = subtitleEl.getBoundingClientRect().top + subtitleEl.getBoundingClientRect().height / 2;

    const startDistY = Math.max(15, Math.abs(e.clientY - centerY));
    const initialFontSize = activeEffectiveStyle.font_size || 70;

    setIsResizing(true);
    document.body.style.cursor =
      handle === 'e' || handle === 'w' ? 'ew-resize' :
      handle === 'n' || handle === 's' ? 'ns-resize' :
      handle === 'nw' || handle === 'se' ? 'nwse-resize' : 'nesw-resize';
    document.body.style.userSelect = 'none';

    const onPointerMove = (moveEvent: PointerEvent) => {
      // 1. Horizontal Width Only (Left / Right Side handles)
      if (handle === 'e' || handle === 'w') {
        const currentDistX = Math.abs(moveEvent.clientX - centerX);
        const newWidthPx = currentDistX * 2;
        const widthPercent = Math.min(95, Math.max(20, Math.round((newWidthPx / containerRect.width) * 100)));
        setResizeHUD(`ความกว้าง: ${widthPercent}%`);
        setStyles?.({
          ...activeEffectiveStyle,
          box_width: widthPercent,
        });
        return;
      }

      // 2. Vertical Height / Font Only (Top / Bottom Side handles)
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

      // 3. Corner Handles: Freely expand in ALL directions simultaneously (X moves width, Y moves height/font)
      const currentDistX = Math.abs(moveEvent.clientX - centerX);
      const newWidthPx = currentDistX * 2;
      const widthPercent = Math.min(95, Math.max(20, Math.round((newWidthPx / containerRect.width) * 100)));

      const currentDistY = Math.abs(moveEvent.clientY - centerY);
      const scaleY = currentDistY / startDistY;
      const calculatedSize = Math.round(initialFontSize * scaleY);
      const clampedSize = Math.max(24, Math.min(130, calculatedSize));

      setResizeHUD(`ฟอนต์: ${clampedSize}px | กว้าง: ${widthPercent}%`);
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
  }, [activeEffectiveStyle, setStyles]);

  const activeOverlayStyle = useMemo(() => {
    const textShadowValues = [];
    if (activeEffectiveStyle.shadow) {
      textShadowValues.push(
        `${activeEffectiveStyle.shadow_thickness}px ${activeEffectiveStyle.shadow_thickness}px ${activeEffectiveStyle.shadow_thickness * 2}px ${activeEffectiveStyle.shadow_color}`
      );
    }
    if (activeEffectiveStyle.outline) {
      textShadowValues.push(
        `-1px -1px 0 ${activeEffectiveStyle.shadow_color}, 1px -1px 0 ${activeEffectiveStyle.shadow_color}, -1px 1px 0 ${activeEffectiveStyle.shadow_color}, 1px 1px 0 ${activeEffectiveStyle.shadow_color}`
      );
    }

    let bgRgba = 'transparent';
    if (activeEffectiveStyle.bg_opacity > 0) {
      const hex = activeEffectiveStyle.bg_color.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16) || 0;
      const g = parseInt(hex.substring(2, 4), 16) || 0;
      const b = parseInt(hex.substring(4, 6), 16) || 0;
      bgRgba = `rgba(${r}, ${g}, ${b}, ${activeEffectiveStyle.bg_opacity})`;
    }

    const baseScale = aspectRatio === '9:16' ? 0.32 : aspectRatio === '1:1' ? 0.38 : 0.44;
    const computedFontSize = Math.round(Math.max(12, (activeEffectiveStyle.font_size || 52) * baseScale));

    return {
      fontFamily: `"${activeEffectiveStyle.font_family || 'Noto Sans Thai'}", "Noto Sans Thai", "Prompt", sans-serif`,
      fontSize: `${computedFontSize}px`,
      fontWeight: activeEffectiveStyle.bold ? 700 : 400,
      fontStyle: activeEffectiveStyle.italic ? 'italic' : 'normal',
      textDecoration: activeEffectiveStyle.underline ? 'underline' : 'none',
      color: activeEffectiveStyle.text_color,
      textShadow: textShadowValues.join(', ') || 'none',
      backgroundColor: bgRgba,
      padding: `${activeEffectiveStyle.padding_y}px ${activeEffectiveStyle.padding_x}px`,
      borderRadius: `${activeEffectiveStyle.border_radius}px`,
      textAlign: 'center' as const,
      lineHeight: 1.35,
      whiteSpace: 'pre-wrap' as const,
      wordBreak: 'break-word' as const,
      display: 'inline-block' as const,
      width: '100%',
    };
  }, [activeEffectiveStyle, aspectRatio]);

  const activeAnimationClass = useMemo(() => {
    if (activeEffectiveStyle.animation === 'fade') return 'anim-fade';
    if (activeEffectiveStyle.animation === 'pop') return 'anim-pop';
    return '';
  }, [activeEffectiveStyle.animation]);

  const isSelected = selectedSubtitleId === null || (activeSubtitle && selectedSubtitleId === activeSubtitle.id);

  return (
    <div className="relative flex flex-1 items-center justify-center p-4">
      <div
        ref={containerRef}
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
              className="mt-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 px-4 py-2 text-xs font-bold text-white transition-all shadow-[0_0_20px_rgba(139,92,246,0.35)]"
            >
              เลือกไฟล์วิดีโอ
            </button>
          </div>
        )}

        {/* Purple Neon Center Guide Line during drag */}
        {showCenterGuide && (
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1.5px] bg-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.9)] pointer-events-none z-30" />
        )}

        {/* Subtitle Draggable & 4-Side Resizable Real-time Preview Overlay */}
        {displaySubtitle && (
          <div
            data-subtitle-overlay="true"
            onPointerDown={handleDragStart}
            onClick={(e) => {
              e.stopPropagation();
              // Preserve current editing stage (Global vs Individual)
            }}
            style={{
              left: `${posX}%`,
              top: `${posY}%`,
              transform: 'translate(-50%, -50%)',
              width: activeEffectiveStyle.box_width ? `${activeEffectiveStyle.box_width}%` : undefined,
              maxWidth: '95%',
              touchAction: 'none',
            }}
            className={`group absolute select-none cursor-grab active:cursor-grabbing ${
              isDragging || isResizing ? 'shadow-2xl z-40' : 'z-20'
            }`}
            title="ลากเพื่อย้ายตำแหน่ง หรือลากขอบทั้ง 4 ด้านเพื่อขยายขนาดกล่อง"
          >
            {/* Live Tooltip HUD during Drag / Resize */}
            {(isDragging || isResizing) && (
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 rounded-full bg-[#14111d]/90 backdrop-blur border border-purple-500/30 px-2.5 py-0.5 text-[9px] tabular-nums antialiased text-purple-200 whitespace-nowrap shadow-[0_0_15px_rgba(139,92,246,0.3)] pointer-events-none z-50">
                {isResizing
                  ? resizeHUD || `ขนาดฟอนต์: ${activeEffectiveStyle.font_size}px`
                  : `X: ${posX}% | Y: ${posY}% ${posX === 50 ? '· กึ่งกลาง' : ''}`}
              </div>
            )}

            {/* Purple Bounding Box & 4-Side + 4-Corner Handles (Shown on Hover or active Drag/Resize) */}
            <div
              className={`absolute -inset-1.5 border border-dashed border-purple-400/80 rounded-lg pointer-events-none z-30 transition-opacity duration-150 ${
                isDragging || isResizing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}
            >
              {/* 4 Corner Handles (Circular White Dots) */}
              <span
                onPointerDown={(e) => handleResizeStart(e, 'nw')}
                className="block absolute -top-1.5 -left-1.5 h-3 w-3 rounded-full bg-white border border-black/80 shadow-md cursor-nwse-resize pointer-events-auto transition-transform hover:scale-125"
                title="ขยายมุมบนซ้าย"
              />
              <span
                onPointerDown={(e) => handleResizeStart(e, 'ne')}
                className="block absolute -top-1.5 -right-1.5 h-3 w-3 rounded-full bg-white border border-black/80 shadow-md cursor-nesw-resize pointer-events-auto transition-transform hover:scale-125"
                title="ขยายมุมบนขวา"
              />
              <span
                onPointerDown={(e) => handleResizeStart(e, 'sw')}
                className="block absolute -bottom-1.5 -left-1.5 h-3 w-3 rounded-full bg-white border border-black/80 shadow-md cursor-nesw-resize pointer-events-auto transition-transform hover:scale-125"
                title="ขยายมุมล่างซ้าย"
              />
              <span
                onPointerDown={(e) => handleResizeStart(e, 'se')}
                className="block absolute -bottom-1.5 -right-1.5 h-3 w-3 rounded-full bg-white border border-black/80 shadow-md cursor-nwse-resize pointer-events-auto transition-transform hover:scale-125"
                title="ขยายมุมล่างขวา"
              />

              {/* 4 Side Pill Handles (Crisp White) */}
              {/* Left Side Pill Handle (Width) */}
              <span
                onPointerDown={(e) => handleResizeStart(e, 'w')}
                className="block absolute top-1/2 -left-1.5 -translate-y-1/2 h-6 w-1.5 rounded-full bg-white border border-black/80 shadow-md cursor-ew-resize pointer-events-auto transition-transform hover:scale-125"
                title="ลากเพื่อขยาย/ลดความกว้างซ้าย"
              />
              {/* Right Side Pill Handle (Width) */}
              <span
                onPointerDown={(e) => handleResizeStart(e, 'e')}
                className="block absolute top-1/2 -right-1.5 -translate-y-1/2 h-6 w-1.5 rounded-full bg-white border border-black/80 shadow-md cursor-ew-resize pointer-events-auto transition-transform hover:scale-125"
                title="ลากเพื่อขยาย/ลดความกว้างขวา"
              />
              {/* Top Side Pill Handle (Height / Font) */}
              <span
                onPointerDown={(e) => handleResizeStart(e, 'n')}
                className="block absolute left-1/2 -top-1.5 -translate-x-1/2 w-6 h-1.5 rounded-full bg-white border border-black/80 shadow-md cursor-ns-resize pointer-events-auto transition-transform hover:scale-125"
                title="ลากเพื่อขยาย/ลดความสูงบน"
              />
              {/* Bottom Side Pill Handle (Height / Font) */}
              <span
                onPointerDown={(e) => handleResizeStart(e, 's')}
                className="block absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-6 h-1.5 rounded-full bg-white border border-black/80 shadow-md cursor-ns-resize pointer-events-auto transition-transform hover:scale-125"
                title="ลากเพื่อขยาย/ลดความสูงล่าง"
              />
            </div>

            <div key={captionKey} style={activeOverlayStyle} className={activeAnimationClass}>
              {displaySubtitle.text}
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleDirectUpload}
          className="hidden"
        />
      </div>
    </div>
  );
}

export default React.memo(VideoPlayer);