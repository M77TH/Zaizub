'use client';

import React, { useState } from 'react';

const CARD_INNER_RADIUS = {
  xl: 'rounded-[11px]',
  '2xl': 'rounded-[15px]',
} as const;

const MONITOR_VARIANT_CONFIG = {
  grid: {
    compact: false,
    reticleBoxClass: 'inset-1.5',
    cornerSizeClass: 'w-3 h-3',
    topCornerRadiusClass: 'rounded-tl-[5px]',
    topRightCornerRadiusClass: 'rounded-tr-[5px]',
    bottomCornerRadiusClass: '',
    bottomRightCornerRadiusClass: '',
  },
  spotlight: {
    compact: false,
    reticleBoxClass: 'inset-1.5',
    cornerSizeClass: 'w-3 h-3',
    topCornerRadiusClass: 'rounded-tl-[3px]',
    topRightCornerRadiusClass: 'rounded-tr-[3px] sm:rounded-tr-none',
    bottomCornerRadiusClass: 'rounded-bl-[3px]',
    bottomRightCornerRadiusClass: 'rounded-br-[3px] sm:rounded-br-none',
  },
  strip: {
    compact: true,
    reticleBoxClass: 'studio-reticle-compact inset-1',
    cornerSizeClass: 'w-2 h-2',
    topCornerRadiusClass: 'rounded-tl-[3px]',
    topRightCornerRadiusClass: 'rounded-tr-[3px]',
    bottomCornerRadiusClass: 'rounded-bl-[3px]',
    bottomRightCornerRadiusClass: 'rounded-br-[3px]',
  },
} as const;

export type MonitorVariant = keyof typeof MONITOR_VARIANT_CONFIG;

/**
 * Shared hover lighting layers: subtle top purple wash, flowing light-purple
 * border beam around the perimeter, and an optional left active-track rail.
 */
export function CardHoverChrome({
  rounded = '2xl',
  showLeftRail = false,
}: {
  rounded?: keyof typeof CARD_INNER_RADIUS;
  showLeftRail?: boolean;
}) {
  const innerRadius = CARD_INNER_RADIUS[rounded];

  return (
    <>
      <div
        aria-hidden="true"
        className={`studio-card-ambient pointer-events-none absolute inset-0 ${innerRadius} z-[1]`}
      />
      <div
        aria-hidden="true"
        className={`studio-beam-mask pointer-events-none absolute inset-0 ${innerRadius} overflow-hidden z-[10]`}
      >
        <div className="studio-beam-spinner" />
      </div>
      {showLeftRail && (
        <div
          aria-hidden="true"
          className="studio-card-rail pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full bg-gradient-to-b from-[#c084fc] via-[#a78bfa] to-[#7c3aed] shadow-[0_0_10px_rgba(139,92,246,0.7)] z-[10]"
        />
      )}
    </>
  );
}

/**
 * Bottom light-purple scrub line animated horizontally on card hover.
 */
export function StudioScrubBar({ zIndexClass = 'z-[4]' }: { zIndexClass?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-x-0 bottom-0 h-[2px] overflow-hidden ${zIndexClass}`}>
      <div className="studio-card-scrub h-full bg-gradient-to-r from-[#7c3aed] via-[#a78bfa] to-[#c084fc] shadow-[0_0_8px_rgba(139,92,246,0.7)]" />
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
  emptyFallback,
}: {
  thumbnailUrl: string;
  videoUrl: string;
  title: string;
  variant?: MonitorVariant;
  emptyFallback?: React.ReactNode;
}) {
  const [failedThumbUrl, setFailedThumbUrl] = useState<string | null>(null);
  const [failedVideoUrl, setFailedVideoUrl] = useState<string | null>(null);

  const config = MONITOR_VARIANT_CONFIG[variant];
  const mediaClass =
    'studio-card-media w-full h-full object-cover object-[center_25%]';

  const showThumbnail = Boolean(thumbnailUrl && failedThumbUrl !== thumbnailUrl);
  const showVideo = Boolean(!showThumbnail && videoUrl && failedVideoUrl !== videoUrl);

  return (
    <>
      {showThumbnail ? (
        <img
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

      {/* Viewfinder brackets tucked into the true frame corners */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute ${config.reticleBoxClass} z-[2]`}
      >
        <span
          className={`studio-reticle-corner studio-reticle-tl absolute top-0 left-0 ${config.cornerSizeClass} ${config.topCornerRadiusClass} border-t-[1.5px] border-l-[1.5px] border-[#a78bfa]/90`}
        />
        <span
          className={`studio-reticle-corner studio-reticle-tr absolute top-0 right-0 ${config.cornerSizeClass} ${config.topRightCornerRadiusClass} border-t-[1.5px] border-r-[1.5px] border-[#a78bfa]/90`}
        />
        <span
          className={`studio-reticle-corner studio-reticle-bl absolute bottom-0 left-0 ${config.cornerSizeClass} ${config.bottomCornerRadiusClass} border-b-[1.5px] border-l-[1.5px] border-[#c084fc]/90`}
        />
        <span
          className={`studio-reticle-corner studio-reticle-br absolute bottom-0 right-0 ${config.cornerSizeClass} ${config.bottomRightCornerRadiusClass} border-b-[1.5px] border-r-[1.5px] border-[#c084fc]/90`}
        />
      </div>

      {/* Center frosted glass play reveal (no scale zoom) */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-[2]">
        <span
          className={`studio-card-play flex items-center justify-center rounded-full border border-[#a78bfa]/40 bg-[#0a0814]/75 text-[#d8b4fe] backdrop-blur-md ${
            config.compact ? 'h-6 w-6' : 'h-10 w-10'
          }`}
        >
          <svg
            className={config.compact ? 'w-2.5 h-2.5' : 'w-4 h-4'}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <polygon points="6 4 20 12 6 20 6 4" />
          </svg>
        </span>
      </div>

      <StudioScrubBar />
    </>
  );
}
