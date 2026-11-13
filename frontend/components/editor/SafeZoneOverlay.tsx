'use client';

import React from 'react';
import type { RightRailGlyph, SafeZonePreset, SafeZoneWarning } from './safeZones';

interface SafeZoneOverlayProps {
  preset: SafeZonePreset;
  warning: SafeZoneWarning;
  dimPercent: number;
}

function renderRailIcon(glyph: RightRailGlyph, key: number) {
  switch (glyph) {
    case 'avatar':
      return (
        <div
          key={key}
          className="relative flex h-6 w-6 items-center justify-center rounded-full border border-white/55 bg-white/15"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" className="text-white/80">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c1.5-4 14.5-4 16 0" />
          </svg>
          <span className="absolute -bottom-1 h-2.5 w-2.5 rounded-full bg-rose-500 text-[7px] font-bold leading-[10px] text-white text-center">
            +
          </span>
        </div>
      );
    case 'heart':
      return (
        <div
          key={key}
          className="flex h-5 w-5 items-center justify-center rounded-full bg-black/40 border border-white/15 text-white/75"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21s-7-4.35-9.5-8.5C.6 9.3 2.5 5 6.8 5c2.2 0 4.1 1.2 5.2 3 1.1-1.8 3-3 5.2-3 4.3 0 6.2 4.3 4.3 7.5C19 16.65 12 21 12 21z" />
          </svg>
        </div>
      );
    case 'thumbUp':
      return (
        <div
          key={key}
          className="flex h-5 w-5 items-center justify-center rounded-full bg-black/40 border border-white/15 text-white/75"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M7 10v11H3V10h4zm3 11h7.5a2 2 0 0 0 2-1.6l1.3-6.5A2 2 0 0 0 18.8 10H14V5.5A2.5 2.5 0 0 0 11.5 3L7 10" />
          </svg>
        </div>
      );
    case 'thumbDown':
      return (
        <div
          key={key}
          className="flex h-5 w-5 items-center justify-center rounded-full bg-black/40 border border-white/15 text-white/75"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M7 14V3H3v11h4zm3-11h7.5a2 2 0 0 1 2 1.6l1.3 6.5A2 2 0 0 1 18.8 14H14v4.5A2.5 2.5 0 0 1 11.5 21L7 14" />
          </svg>
        </div>
      );
    case 'comment':
      return (
        <div
          key={key}
          className="flex h-5 w-5 items-center justify-center rounded-full bg-black/40 border border-white/15 text-white/75"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 12c0 4.4-4 8-9 8-1.5 0-3-.3-4.2-.9L3 20l1.2-3.9C3.4 14.9 3 13.5 3 12c0-4.4 4-8 9-8s9 3.6 9 8z" />
          </svg>
        </div>
      );
    case 'bookmark':
      return (
        <div
          key={key}
          className="flex h-5 w-5 items-center justify-center rounded-full bg-black/40 border border-white/15 text-white/75"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" />
          </svg>
        </div>
      );
    case 'share':
      return (
        <div
          key={key}
          className="flex h-5 w-5 items-center justify-center rounded-full bg-black/40 border border-white/15 text-white/75"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
            <path d="M16 6l-4-4-4 4M12 2v13" />
          </svg>
        </div>
      );
    case 'remix':
      return (
        <div
          key={key}
          className="flex h-5 w-5 items-center justify-center rounded-full bg-black/40 border border-white/15 text-white/75"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
            <path d="M17 2l4 4-4 4" />
            <path d="M3 11V9a4 4 0 0 1 4-4h14" />
            <path d="M7 22l-4-4 4-4" />
            <path d="M21 13v2a4 4 0 0 1-4 4H3" />
          </svg>
        </div>
      );
    case 'more':
      return (
        <div
          key={key}
          className="flex h-5 w-5 items-center justify-center rounded-full bg-black/40 border border-white/15 text-white/75 text-[10px] font-bold"
        >
          ···
        </div>
      );
    case 'disc':
      return (
        <div
          key={key}
          className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white/40 bg-zinc-900/90"
        >
          <span className="h-2 w-2 rounded-full bg-cyan-300/80" />
        </div>
      );
    case 'audio':
    default:
      return (
        <div
          key={key}
          className="flex h-5 w-5 items-center justify-center rounded-md border border-white/45 bg-black/55 text-white/80"
        >
          <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 18V5l11-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="17" cy="16" r="3" />
          </svg>
        </div>
      );
  }
}

export default function SafeZoneOverlay({
  preset,
  warning,
  dimPercent,
}: SafeZoneOverlayProps) {
  const { safe } = preset;
  const safeTop = safe.top;
  const safeLeft = safe.left;
  const safeRight = 100 - safe.right;
  const safeBottom = 100 - safe.bottom;
  const safeWidth = Math.max(10, safeRight - safeLeft);
  const safeHeight = Math.max(10, safeBottom - safeTop);

  // Even-odd polygon cuts out the bright central Safe Window while shading & hatching unsafe margins uniformly.
  const outerCutoutClip = `polygon(evenodd, 0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, ${safeLeft}% ${safeTop}%, ${safeLeft}% ${safeBottom}%, ${safeRight}% ${safeBottom}%, ${safeRight}% ${safeTop}%, ${safeLeft}% ${safeTop}%)`;

  const maskDarkAlpha = Math.min(0.68, 0.36 + (dimPercent / 100) * 0.35);

  return (
    <div
      data-safe-zone-overlay="true"
      className="pointer-events-none absolute inset-0 z-[25] overflow-hidden select-none"
    >
      {/* 1. Darkened + Diagonal Hatched Blocked UI Zone Cutout (Outside Safe Frame) */}
      <div
        style={{
          clipPath: outerCutoutClip,
          backgroundColor: `rgba(6, 5, 11, ${maskDarkAlpha.toFixed(2)})`,
          backgroundImage:
            'repeating-linear-gradient(-45deg, rgba(244, 63, 94, 0.16) 0px, rgba(244, 63, 94, 0.16) 1px, transparent 1px, transparent 8px)',
        }}
        className="absolute inset-0"
      />

      {/* 2. Top UI Ghost Header Zone */}
      {preset.topBarLabel && (
        <div
          style={{ height: `${safeTop}%` }}
          className="absolute top-0 left-0 right-0 flex items-center justify-center border-b border-rose-400/35 px-3"
        >
          <span className="rounded bg-black/55 border border-white/15 px-2 py-0.5 font-mono text-[8px] sm:text-[9px] text-white/80 tracking-wide truncate max-w-[92%]">
            {preset.topBarLabel}
          </span>
        </div>
      )}

      {/* 3. Right Social Action Rail (TikTok / Reels / Shorts) */}
      {preset.rightRail && (
        <div
          style={{
            top: `${preset.rightRail.top}%`,
            bottom: `${preset.rightRail.bottom}%`,
            width: `${preset.rightRail.width}%`,
          }}
          className="absolute right-0 flex flex-col items-center justify-around py-1.5 border-l border-rose-400/35 bg-rose-500/10"
        >
          {preset.rightRail.items.map((item, idx) => renderRailIcon(item, idx))}
        </div>
      )}

      {/* 4. Bottom Platform Metadata / Controls Zone */}
      <div
        style={{
          height: `${safe.bottom}%`,
          right: preset.rightRail ? `${preset.rightRail.width}%` : '0%',
        }}
        className="absolute bottom-0 left-0 flex flex-col justify-end border-t border-rose-400/35 px-2.5 pb-2 pt-1.5 gap-1"
      >
        {preset.aspectRatio === '9:16' ? (
          <>
            {/* Subtle skeleton representation of @creator + caption bars */}
            <div className="flex items-center gap-1.5 opacity-80">
              <span className="h-2 w-16 rounded-full bg-white/35" />
              {(preset.id === 'reels' || preset.id === 'shorts') && (
                <span className="h-2.5 w-8 rounded bg-white/25 border border-white/30" />
              )}
            </div>
            <div className="h-1.5 w-3/4 rounded-full bg-white/25" />
            <div className="h-1.5 w-1/2 rounded-full bg-white/20" />
          </>
        ) : (
          /* Landscape / Square player scrub bar & controls preview */
          <div className="flex flex-col gap-1.5">
            <div className="relative h-1 w-full rounded-full bg-white/25 overflow-hidden">
              <div
                className={`h-full w-1/3 rounded-full ${
                  preset.id === 'youtube' ? 'bg-red-500/85' : 'bg-white/70'
                }`}
              />
            </div>
            <div className="flex items-center justify-between text-white/65">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-[1px] bg-white/60" />
                <span className="h-1.5 w-10 rounded-full bg-white/30" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-3 rounded-[2px] border border-white/40" />
                <span className="h-2 w-2 rounded-[1px] border border-white/40" />
              </div>
            </div>
          </div>
        )}
        <div className="mt-0.5 flex items-center justify-between gap-1.5">
          <span className="rounded bg-black/65 border border-white/15 px-1.5 py-0.5 font-mono text-[8px] text-zinc-200 truncate">
            {preset.bottomBarLabel}
          </span>
        </div>
        {preset.id === 'shorts' && (
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-red-500/75" />
        )}
      </div>

      {/* 5. Optional Secondary Guide (4:5 Feed Crop on Reels / 90% Action Safe on 16:9) */}
      {preset.secondaryGuide && (
        <div
          style={{
            top: `${preset.secondaryGuide.top ?? 0}%`,
            bottom: `${preset.secondaryGuide.bottom ?? 0}%`,
            left: `${preset.secondaryGuide.left ?? 0}%`,
            right: `${preset.secondaryGuide.right ?? 0}%`,
          }}
          className={`absolute border-dotted border-amber-300/65 flex items-start justify-end pr-2 pt-0.5 ${
            preset.secondaryGuide.left !== undefined || preset.secondaryGuide.right !== undefined
              ? 'border'
              : 'border-y'
          }`}
        >
          <span className="rounded bg-black/75 px-1 py-0.5 font-mono text-[7.5px] font-semibold text-amber-200">
            {preset.secondaryGuide.label}
          </span>
        </div>
      )}

      {/* 6. Crisp High-Contrast Inner Safe Area Boundary */}
      <div
        style={{
          top: `${safeTop}%`,
          left: `${safeLeft}%`,
          width: `${safeWidth}%`,
          height: `${safeHeight}%`,
          boxShadow: '0 0 0 1px rgba(0,0,0,0.72), inset 0 0 0 1px rgba(0,0,0,0.45)',
        }}
        className={`absolute rounded-lg border-[1.5px] border-dashed transition-colors ${
          warning.isOverlapping
            ? 'border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.28)]'
            : 'border-cyan-300/90 shadow-[0_0_16px_rgba(34,211,238,0.18)]'
        }`}
      >
        {/* Solid L-Corner Alignment Ticks */}
        <span className="absolute -top-[1.5px] -left-[1.5px] h-2.5 w-2.5 border-t-2 border-l-2 border-white rounded-tl-[2px]" />
        <span className="absolute -top-[1.5px] -right-[1.5px] h-2.5 w-2.5 border-t-2 border-r-2 border-white rounded-tr-[2px]" />
        <span className="absolute -bottom-[1.5px] -left-[1.5px] h-2.5 w-2.5 border-b-2 border-l-2 border-white rounded-bl-[2px]" />
        <span className="absolute -bottom-[1.5px] -right-[1.5px] h-2.5 w-2.5 border-b-2 border-r-2 border-white rounded-br-[2px]" />

        {/* Top-Left Platform Safe Zone Badge */}
        <div className="absolute top-1.5 left-1.5 right-1.5 flex flex-wrap items-center justify-between gap-1">
          <span
            className="inline-flex items-center gap-1 rounded bg-black/75 border px-1.5 py-0.5 font-mono text-[8.5px] font-bold tracking-wide text-white shadow-sm"
            style={{ borderColor: `${preset.accentHex}88` }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: preset.accentHex }}
            />
            SAFE · {preset.shortName.toUpperCase()}
          </span>

          {warning.isOverlapping && warning.message && (
            <span className="inline-flex items-center gap-1 rounded bg-amber-500/90 px-1.5 py-0.5 font-mono text-[8px] font-bold text-black shadow-sm">
              ⚠ {warning.message}
            </span>
          )}
        </div>

        {/* Exact Margin Telemetry Hints on Frame Edges */}
        <span className="hidden sm:inline-block absolute -top-2.5 left-1/2 -translate-x-1/2 rounded bg-black/80 px-1 font-mono text-[7.5px] text-cyan-200 tabular-nums">
          TOP {safe.top}%
        </span>
        <span className="hidden sm:inline-block absolute -bottom-2.5 left-1/2 -translate-x-1/2 rounded bg-black/80 px-1 font-mono text-[7.5px] text-cyan-200 tabular-nums">
          BOTTOM {safe.bottom}%
        </span>
      </div>
    </div>
  );
}
