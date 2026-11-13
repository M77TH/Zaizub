'use client';

import React from 'react';

const CARD_INNER_RADIUS = {
  xl: 'rounded-[11px]',
  '2xl': 'rounded-[15px]',
} as const;

const MONITOR_VARIANT_CONFIG = {
  grid: {
    compact: false,
    playCenterClass: '-translate-y-2',
    reticleBoxClass: 'inset-x-[16%] top-9 bottom-12',
    cornerSizeClass: 'w-3.5 h-3.5',
    showActionBar: true,
  },
  spotlight: {
    compact: false,
    playCenterClass: '',
    reticleBoxClass: 'inset-x-5 top-8 bottom-8',
    cornerSizeClass: 'w-3 h-3',
    showActionBar: false,
  },
  strip: {
    compact: true,
    playCenterClass: '',
    reticleBoxClass: 'studio-reticle-compact inset-1.5',
    cornerSizeClass: 'w-2 h-2',
    showActionBar: false,
  },
} as const;

export type MonitorVariant = keyof typeof MONITOR_VARIANT_CONFIG;

/**
 * Shared hover lighting layers: subtle top ambient glow, a flowing neon border beam
 * tracing the perimeter on hover, and an optional left active-track rail.
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
          className="studio-card-rail pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full bg-gradient-to-b from-[#38bdf8] via-[#a78bfa] to-[#7c3aed] shadow-[0_0_12px_rgba(139,92,246,0.85)] z-[10]"
        />
      )}
    </>
  );
}

/**
 * Bottom gradient scrub line animated horizontally on card hover.
 */
export function StudioScrubBar({ zIndexClass = 'z-[4]' }: { zIndexClass?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-x-0 bottom-0 h-[2px] overflow-hidden ${zIndexClass}`}>
      <div className="studio-card-scrub h-full bg-gradient-to-r from-[#7c3aed] via-[#c4b5fd] to-[#38bdf8] shadow-[0_0_10px_rgba(167,139,250,0.9)]" />
    </div>
  );
}

/**
 * Shared studio monitor viewport: zero-zoom image/video presentation with locking
 * viewfinder corner brackets, frosted play reveal, and a slide-in action bar.
 */
export function CardThumbnailMedia({
  thumbnailUrl,
  videoUrl,
  title,
  variant = 'grid',
  presetLabel,
  emptyFallback,
}: {
  thumbnailUrl: string;
  videoUrl: string;
  title: string;
  variant?: MonitorVariant;
  presetLabel?: string;
  emptyFallback?: React.ReactNode;
}) {
  const config = MONITOR_VARIANT_CONFIG[variant];
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

      {/* Subtle focal scrim so viewfinder reticle + play badge pop cleanly on bright frames */}
      <div
        aria-hidden="true"
        className="studio-card-vignette pointer-events-none absolute inset-0 z-[1]"
      />

      {/* Viewfinder corner brackets locking inward onto the monitor target */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute ${config.reticleBoxClass} z-[2]`}
      >
        <span
          className={`studio-reticle-corner studio-reticle-tl absolute top-0 left-0 ${config.cornerSizeClass} border-t-[1.5px] border-l-[1.5px] border-[#e9d5ff]/95`}
        />
        <span
          className={`studio-reticle-corner studio-reticle-tr absolute top-0 right-0 ${config.cornerSizeClass} border-t-[1.5px] border-r-[1.5px] border-[#e9d5ff]/95`}
        />
        <span
          className={`studio-reticle-corner studio-reticle-bl absolute bottom-0 left-0 ${config.cornerSizeClass} border-b-[1.5px] border-l-[1.5px] border-[#a78bfa]/95`}
        />
        <span
          className={`studio-reticle-corner studio-reticle-br absolute bottom-0 right-0 ${config.cornerSizeClass} border-b-[1.5px] border-r-[1.5px] border-[#a78bfa]/95`}
        />
      </div>

      {/* Center frosted glass play reveal (no scale zoom) */}
      <div
        className={`pointer-events-none absolute inset-0 flex items-center justify-center z-[2] ${config.playCenterClass}`}
      >
        <span
          className={`studio-card-play flex items-center justify-center rounded-full border border-white/25 bg-[#0a0814]/75 text-white backdrop-blur-md ${
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

      {/* Bottom frosted studio action bar sliding up inside the grid viewport */}
      {config.showActionBar && (
        <div
          aria-hidden="true"
          className="studio-card-actionbar pointer-events-none absolute inset-x-0 bottom-0 z-[3] flex items-center justify-between gap-2 border-t border-[#a78bfa]/40 bg-[#090714]/88 backdrop-blur-md px-3 py-2"
        >
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold tracking-wider text-[#c4b5fd] truncate">
            <span className="h-1.5 w-1.5 rounded-full bg-[#38bdf8] shadow-[0_0_8px_#38bdf8]" />
            <span>{presetLabel || 'STUDIO CUT'}</span>
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#f3e8ff] flex-shrink-0">
            <span>เปิดแก้ไข</span>
            <svg className="w-3 h-3 text-[#c4b5fd]" fill="none" stroke="currentColor" strokeWidth="2.4" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </span>
        </div>
      )}

      <StudioScrubBar />
    </>
  );
}
