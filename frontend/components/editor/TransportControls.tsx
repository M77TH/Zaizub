'use client';

import React, { useMemo } from 'react';
import { SubtitleSegment } from './types';

interface TransportControlsProps {
  currentTime: number;
  duration: number;
  seekVideo: (time: number) => void;
  isPlaying: boolean;
  togglePlay: () => void;
  volume: number;
  setVolume: (v: number) => void;
  isMuted: boolean;
  setIsMuted: (m: boolean) => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  formatTime: (time: number) => string;
  subtitles?: SubtitleSegment[];
}

function TransportControls({
  currentTime,
  duration,
  seekVideo,
  isPlaying,
  togglePlay,
  volume,
  setVolume,
  isMuted,
  setIsMuted,
  videoRef,
  formatTime,
  subtitles = [],
}: TransportControlsProps) {
  const handleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const progressRatio = duration > 0 ? Math.max(0, Math.min(1, currentTime / duration)) : 0;
  const progressPercent = progressRatio * 100;
  const effectiveVolume = isMuted ? 0 : volume;

  const activeIndex = useMemo(
    () =>
      subtitles.findIndex(
        (s, idx) =>
          currentTime >= s.start &&
          (idx === subtitles.length - 1 ? currentTime <= s.end : currentTime < s.end)
      ),
    [subtitles, currentTime]
  );

  // Format with tenth-of-a-second precision for studio feel (e.g. 0:02.4)
  const formatPreciseTime = (sec: number) => {
    if (isNaN(sec) || sec < 0) return '0:00.0';
    const base = formatTime(sec);
    const tenths = Math.floor((sec % 1) * 10);
    return `${base}.${tenths}`;
  };

  return (
    <div className="border-t border-[#1b1a24] bg-[#09080d] px-3 sm:px-5 pt-2.5 pb-3 space-y-2.5 select-none">
      {/* ROW 1: Transport Controls & Studio Readouts */}
      <div className="grid grid-cols-3 items-center">
        {/* 1. Left: Digital Timecode & Cue Readout */}
        <div className="flex items-center justify-start gap-2">
          <div className="inline-flex items-center gap-2 rounded-md bg-[#111017] border border-[#21202c] px-2.5 py-1 text-[11px] font-mono tabular-nums">
            <span
              className={`h-1.5 w-1.5 rounded-[1px] ${
                isPlaying ? 'bg-[#8b5cf6] animate-pulse' : 'bg-zinc-600'
              }`}
            />
            <span className="text-white font-bold">{formatPreciseTime(currentTime)}</span>
            <span className="text-zinc-600">/</span>
            <span className="text-zinc-500">{formatTime(duration)}</span>
          </div>

          {activeIndex !== -1 ? (
            <span className="hidden lg:inline-flex items-center gap-1.5 rounded-md bg-[#161420] border border-[#282538] px-2 py-1 text-[10px] font-mono font-bold text-[#c4b5fd] tabular-nums">
              #{activeIndex + 1}
            </span>
          ) : (
            <span className="hidden xl:inline-flex items-center px-1.5 text-[10px] font-mono text-zinc-600 tabular-nums">
              {subtitles.length} CUES
            </span>
          )}
        </div>

        {/* 2. Center: Hardware Tactile Transport Keys */}
        <div className="flex items-center justify-center">
          <div className="inline-flex items-center gap-1 rounded-lg bg-[#111017] border border-[#21202c] p-1">
            {/* Rewind 15s */}
            <button
              type="button"
              onClick={() => seekVideo(Math.max(0, currentTime - 15))}
              className="hidden sm:flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-white/[0.06] hover:text-white transition-colors cursor-pointer"
              title="ย้อนกลับ 15 วินาที"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <rect x="4" y="4" width="2.5" height="16" rx="0.5" />
                <polygon points="20 4 8 12 20 20 20 4" />
              </svg>
            </button>

            {/* Rewind 5s */}
            <button
              type="button"
              onClick={() => seekVideo(Math.max(0, currentTime - 5))}
              className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-white/[0.06] hover:text-white transition-colors cursor-pointer"
              title="ย้อนกลับ 5 วินาที (← หรือ ↑)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </button>

            {/* Play / Pause Keycap */}
            <button
              type="button"
              onClick={togglePlay}
              className="flex h-7.5 w-10 items-center justify-center rounded-md bg-[#f5f4f8] hover:bg-[#8b5cf6] text-[#070709] hover:text-white active:scale-95 transition-colors cursor-pointer mx-0.5"
              title={isPlaying ? 'หยุดชั่วคราว (Space)' : 'เล่นวิดีโอ (Space)'}
            >
              {isPlaying ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="0.5" />
                  <rect x="14" y="4" width="4" height="16" rx="0.5" />
                </svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              )}
            </button>

            {/* Forward 5s */}
            <button
              type="button"
              onClick={() => seekVideo(Math.min(duration, currentTime + 5))}
              className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-white/[0.06] hover:text-white transition-colors cursor-pointer"
              title="ข้ามไปข้างหน้า 5 วินาที (→ หรือ ↓)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
              </svg>
            </button>

            {/* Forward 15s */}
            <button
              type="button"
              onClick={() => seekVideo(Math.min(duration, currentTime + 15))}
              className="hidden sm:flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-white/[0.06] hover:text-white transition-colors cursor-pointer"
              title="ข้ามไปข้างหน้า 15 วินาที"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="4 4 16 12 4 20 4 4" />
                <rect x="17.5" y="4" width="2.5" height="16" rx="0.5" />
              </svg>
            </button>
          </div>
        </div>

        {/* 3. Right: Volume & Fullscreen Controls */}
        <div className="flex items-center justify-end gap-1.5">
          <div className="flex items-center gap-1.5 rounded-lg bg-[#111017] border border-[#21202c] px-2.5 py-1">
            <button
              type="button"
              onClick={() => {
                const next = !isMuted;
                setIsMuted(next);
                if (videoRef.current) videoRef.current.muted = next;
              }}
              className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:text-white transition-colors"
              title={isMuted ? 'เปิดเสียง (M)' : 'ปิดเสียง (M)'}
            >
              {isMuted || volume === 0 ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-400">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={effectiveVolume}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setVolume(val);
                setIsMuted(false);
                if (videoRef.current) {
                  videoRef.current.volume = val;
                  videoRef.current.muted = false;
                }
              }}
              className="hidden sm:block volume-seek h-1.5 w-16 rounded-full cursor-pointer accent-purple-400"
              style={{
                background: `linear-gradient(to right, #8b5cf6 ${effectiveVolume * 100}%, #1d1a2c ${effectiveVolume * 100}%)`,
              }}
              aria-label="ระดับเสียง"
            />
          </div>

          <button
            type="button"
            onClick={handleFullscreen}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#111017] border border-[#21202c] text-zinc-400 hover:border-white/30 hover:text-white transition-colors active:scale-95 cursor-pointer"
            title="เต็มจอ"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3H5a2 2 0 0 0-2 2v3" />
              <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
              <path d="M3 16v3a2 2 0 0 0 2 2h3" />
              <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
            </svg>
          </button>
        </div>
      </div>

      {/* ROW 2: Simple Video Progress Bar */}
      <div className="group/timeline relative flex h-6 w-full items-center">
        {/* Track Rail */}
        <div className="relative h-1.5 group-hover/timeline:h-2 transition-[height] duration-150 w-full rounded-full bg-[#1a1826]">
          {/* Played Fill */}
          <div
            style={{ width: `${progressPercent}%` }}
            className="h-full rounded-full bg-[#8b5cf6]"
          />

          {/* Scrub Thumb */}
          <div
            style={{ left: `${progressPercent}%` }}
            className="pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-white border-2 border-[#8b5cf6] shadow-sm transition-transform duration-150 group-hover/timeline:scale-115"
          />
        </div>

        {/* Native Range Input Overlay for Smooth Seeking & Scrubbing */}
        <input
          type="range"
          min="0"
          max={Math.max(duration, 0.01)}
          step="0.01"
          value={Math.min(currentTime, duration || 0)}
          onChange={(event) => seekVideo(Number(event.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
          aria-label="แถบความคืบหน้าวิดีโอ"
          title="คลิกหรือลากเพื่อเลื่อนเวลา"
        />
      </div>
    </div>
  );
}

export default React.memo(TransportControls);
