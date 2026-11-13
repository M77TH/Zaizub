'use client';

import React from 'react';

const CARD_INNER_RADIUS = {
  xl: 'rounded-[11px]',
  '2xl': 'rounded-[15px]',
} as const;

/**
 * Updates CSS pointer spotlight coordinates directly on the card element to keep
 * cursor-following hover illumination smooth without React re-renders.
 */
export function handleCardPointerMove(e: React.MouseEvent<HTMLElement>) {
  const rect = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--spot-x', `${e.clientX - rect.left}px`);
  e.currentTarget.style.setProperty('--spot-y', `${e.clientY - rect.top}px`);
}

/**
 * Shared hover lighting layers (interior cursor spotlight, masked 1px border trace,
 * top specular rim, and optional left active-track indicator) without lift or zoom.
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
        className={`studio-card-surface-glow pointer-events-none absolute inset-0 ${innerRadius} z-[1]`}
      />
      <div
        aria-hidden="true"
        className={`studio-card-border-glow pointer-events-none absolute inset-0 ${innerRadius} z-[10]`}
      />
      <div
        aria-hidden="true"
        className="studio-card-top-rim pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#c4b5fd]/55 to-transparent z-[10]"
      />
      {showLeftRail && (
        <div
          aria-hidden="true"
          className="studio-card-rail pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full bg-gradient-to-b from-[#c4b5fd] via-[#8b5cf6] to-[#7c3aed] shadow-[0_0_12px_rgba(139,92,246,0.7)] z-[10]"
        />
      )}
    </>
  );
}

/**
 * Shared studio monitor thumbnail frame with exposure lift, one-shot diagonal sheen,
 * frosted play reveal, and bottom timeline scrub bar (strictly zero zoom).
 */
export function CardThumbnailMedia({
  thumbnailUrl,
  videoUrl,
  title,
  compact = false,
  emptyFallback,
}: {
  thumbnailUrl: string;
  videoUrl: string;
  title: string;
  compact?: boolean;
  emptyFallback?: React.ReactNode;
}) {
  const mediaClass =
    'studio-card-media w-full h-full object-cover object-[center_25%]';

  return (
    <>
      {thumbnailUrl ? (
        <img src={thumbnailUrl} alt={title} className={mediaClass} />
      ) : videoUrl ? (
        <video
          src={`${videoUrl}#t=0.5`}
          muted
          playsInline
          preload="metadata"
          className={mediaClass}
        />
      ) : (
        emptyFallback ?? (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0d0c14] to-[#060609] text-zinc-700 [.studio-card:hover_&]:text-purple-400 transition-colors duration-300">
            <svg
              className={compact ? 'w-4 h-4' : 'w-8 h-8'}
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

      {/* Subtle diagonal glass specular sweep across monitor on card hover */}
      <div
        aria-hidden="true"
        className="studio-card-sheen pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/[0.11] to-transparent"
      />

      {/* Soft violet ambient rim inside monitor frame */}
      <div
        aria-hidden="true"
        className="studio-card-vignette pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.16),transparent_70%)]"
      />

      {/* Center frosted glass play reveal (no scale zoom) */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span
          className={`studio-card-play flex items-center justify-center rounded-full border border-white/25 bg-[#0b0a14]/70 text-white backdrop-blur-md ${
            compact ? 'h-7 w-7' : 'h-10 w-10'
          }`}
        >
          <svg
            className={compact ? 'w-3 h-3' : 'w-4 h-4'}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <polygon points="6 4 20 12 6 20 6 4" />
          </svg>
        </span>
      </div>

      {/* Bottom violet timeline scrub accent */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] overflow-hidden">
        <div className="studio-card-scrub h-full bg-gradient-to-r from-[#7c3aed] via-[#c4b5fd] to-[#a78bfa] shadow-[0_0_10px_rgba(167,139,250,0.85)]" />
      </div>
    </>
  );
}
