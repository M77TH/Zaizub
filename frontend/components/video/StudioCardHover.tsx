'use client';

import React, { useEffect, useRef, useState } from 'react';

const CARD_OUTER_RADIUS = {
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
} as const;

const CARD_INNER_RADIUS = {
  xl: 'rounded-[11px]',
  '2xl': 'rounded-[15px]',
} as const;

const MONITOR_VARIANT_CONFIG = {
  grid: {
    compact: false,
    reticleBoxClass: 'inset-[7px]',
    cornerSizeClass: 'w-2.5 h-2.5',
    topCornerRadiusClass: 'rounded-tl-[8px]',
    topRightCornerRadiusClass: 'rounded-tr-[8px]',
    bottomCornerRadiusClass: 'rounded-bl-[2px]',
    bottomRightCornerRadiusClass: 'rounded-br-[2px]',
    playSizeClass: 'h-10 w-10',
    playIconClass: 'w-4 h-4',
  },
  spotlight: {
    compact: false,
    reticleBoxClass: 'inset-[7px]',
    cornerSizeClass: 'w-2.5 h-2.5',
    topCornerRadiusClass: 'rounded-tl-[1px] sm:rounded-tl-[4px]',
    topRightCornerRadiusClass: 'rounded-tr-[1px] sm:rounded-tr-none',
    bottomCornerRadiusClass: 'rounded-bl-[1px] sm:rounded-bl-[4px]',
    bottomRightCornerRadiusClass: 'rounded-br-[1px] sm:rounded-br-none',
    playSizeClass: 'h-9 w-9',
    playIconClass: 'w-3.5 h-3.5',
  },
  strip: {
    compact: true,
    reticleBoxClass: 'studio-reticle-compact inset-1',
    cornerSizeClass: 'w-1.5 h-1.5',
    topCornerRadiusClass: 'rounded-tl-[3px]',
    topRightCornerRadiusClass: 'rounded-tr-[3px]',
    bottomCornerRadiusClass: 'rounded-bl-[3px]',
    bottomRightCornerRadiusClass: 'rounded-br-[3px]',
    playSizeClass: 'h-5 w-5',
    playIconClass: 'w-2.5 h-2.5',
  },
} as const;

export type MonitorVariant = keyof typeof MONITOR_VARIANT_CONFIG;

/**
 * Shared hover lighting layers: subtle top purple wash and flowing light-purple
 * border beam positioned directly over the 1px card perimeter.
 */
export function CardHoverChrome({
  rounded = '2xl',
  beamMode = 'orbit',
}: {
  rounded?: keyof typeof CARD_INNER_RADIUS;
  beamMode?: 'orbit' | 'wide';
}) {
  const outerRadius = CARD_OUTER_RADIUS[rounded];
  const innerRadius = CARD_INNER_RADIUS[rounded];

  return (
    <>
      <div
        aria-hidden="true"
        className={`studio-card-ambient pointer-events-none absolute inset-0 ${innerRadius} z-[1]`}
      />
      <div
        aria-hidden="true"
        className={`studio-beam-mask pointer-events-none absolute -inset-px ${outerRadius} overflow-hidden z-[10]`}
      >
        <div
          className={
            beamMode === 'wide' ? 'studio-beam-glider' : 'studio-beam-spinner'
          }
        />
      </div>
    </>
  );
}

/**
 * Bottom light-purple scrub line animated horizontally on card hover.
 */
export function StudioScrubBar({
  zIndexClass = 'z-[4]',
}: {
  zIndexClass?: string;
}) {
  return (
    <div
      className={`pointer-events-none absolute inset-x-0 bottom-0 h-[1.5px] overflow-hidden ${zIndexClass}`}
    >
      <div className="studio-card-scrub h-full bg-gradient-to-r from-[#7c3aed]/55 via-[#8b5cf6]/65 to-[#a78bfa]/55 shadow-[0_0_4px_rgba(139,92,246,0.28)]" />
    </div>
  );
}

/**
 * Shared studio monitor viewport: zero-zoom image/video presentation with corner
 * viewfinder brackets, frosted play reveal, and graceful fallback on load errors.
 */
export function CardThumbnailMedia({
  thumbnailUrl,
  videoUrl,
  title,
  variant = 'grid',
  showScrubBar = true,
  emptyFallback,
}: {
  thumbnailUrl: string;
  videoUrl: string;
  title: string;
  variant?: MonitorVariant;
  showScrubBar?: boolean;
  emptyFallback?: React.ReactNode;
}) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [failedThumbUrl, setFailedThumbUrl] = useState<string | null>(null);
  const [failedVideoUrl, setFailedVideoUrl] = useState<string | null>(null);

  const config = MONITOR_VARIANT_CONFIG[variant];
  const mediaClass =
    'studio-card-media w-full h-full object-cover object-[center_25%] text-transparent select-none';

  const showThumbnail = Boolean(thumbnailUrl && failedThumbUrl !== thumbnailUrl);
  const showVideo = Boolean(!showThumbnail && videoUrl && failedVideoUrl !== videoUrl);

  useEffect(() => {
    const el = imgRef.current;
    if (!showThumbnail || !el) return;
    // Catch cached/pre-hydration image load failures that settled before onError bound
    if (el.complete && el.naturalWidth === 0) {
      let cancelled = false;
      queueMicrotask(() => {
        if (!cancelled) {
          setFailedThumbUrl(thumbnailUrl);
        }
      });
      return () => {
        cancelled = true;
      };
    }
  }, [showThumbnail, thumbnailUrl]);

  return (
    <>
      {showThumbnail ? (
        <img
          ref={imgRef}
          src={thumbnailUrl}
          alt={title}
          onError={() => setFailedThumbUrl(thumbnailUrl)}
          className={mediaClass}
        />
      ) : showVideo ? (
        <video
          src={`${videoUrl}#t=0.5`}
          muted
          playsInline
          preload="metadata"
          onError={() => setFailedVideoUrl(videoUrl)}
          className={mediaClass}
        />
      ) : (
        emptyFallback ?? (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0d0c14] to-[#060609] text-zinc-700 group-hover:text-purple-400 transition-colors duration-300">
            <svg
              className={config.compact ? 'w-4 h-4' : 'w-8 h-8'}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <rect x="3" y="5" width="18" height="14" rx="2" strokeWidth="1.4" />
              <polygon points="10 9 15 12 10 15 10 9" fill="currentColor" stroke="none" />
            </svg>
          </div>
        )
      )}

      {/* Subtle focal scrim behind play icon & corner brackets */}
      <div
        aria-hidden="true"
        className="studio-card-vignette pointer-events-none absolute inset-0 z-[1]"
      />

      {/* Viewfinder brackets tucked cleanly inside corner radii */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute ${config.reticleBoxClass} z-[2]`}
      >
        <span
          className={`studio-reticle-corner studio-reticle-tl absolute top-0 left-0 ${config.cornerSizeClass} ${config.topCornerRadiusClass} border-t-[1.5px] border-l-[1.5px] border-[#a78bfa]/60`}
        />
        <span
          className={`studio-reticle-corner studio-reticle-tr absolute top-0 right-0 ${config.cornerSizeClass} ${config.topRightCornerRadiusClass} border-t-[1.5px] border-r-[1.5px] border-[#a78bfa]/60`}
        />
        <span
          className={`studio-reticle-corner studio-reticle-bl absolute bottom-0 left-0 ${config.cornerSizeClass} ${config.bottomCornerRadiusClass} border-b-[1.5px] border-l-[1.5px] border-[#a78bfa]/55`}
        />
        <span
          className={`studio-reticle-corner studio-reticle-br absolute bottom-0 right-0 ${config.cornerSizeClass} ${config.bottomRightCornerRadiusClass} border-b-[1.5px] border-r-[1.5px] border-[#a78bfa]/55`}
        />
      </div>

      {/* Center frosted glass play reveal (no scale zoom) */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-[2]">
        <span
          className={`studio-card-play flex items-center justify-center rounded-full border border-[#a78bfa]/25 bg-[#0a0814]/75 text-[#c4b5fd]/85 backdrop-blur-md ${config.playSizeClass}`}
        >
          <svg
            className={config.playIconClass}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <polygon points="6 4 20 12 6 20 6 4" />
          </svg>
        </span>
      </div>

      {showScrubBar && <StudioScrubBar />}
    </>
  );
}
