'use client';

import React from 'react';

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

  return (
    <div className="border-t border-[#1c1a28] bg-[#0c0b11] px-6 pt-3 pb-2.5 space-y-2 select-none">
      {/* Scrubber / Progress Bar on top */}
      <div className="group relative flex items-center h-3 cursor-pointer">
        <input
          type="range"
          min="0"
          max={Math.max(duration, 0.01)}
          step="0.01"
          value={Math.min(currentTime, duration || 0)}
          onChange={(event) => seekVideo(Number(event.target.value))}
          className="progress-seek w-full h-1 group-hover:h-1.5 transition-all rounded-full cursor-pointer accent-purple-400"
          style={{
            background: `linear-gradient(to right, #7c3aed ${(duration > 0 ? currentTime / duration : 0) * 100}%, #1a1826 ${(duration > 0 ? currentTime / duration : 0) * 100}%)`,
          }}
          aria-label="ตำแหน่งวิดีโอ"
        />
      </div>

      {/* Controls Row - 3-Column Grid for Exact Middle Centering */}
      <div className="grid grid-cols-3 items-center">
        {/* 1. Left: Timecode Display */}
        <div className="flex items-center justify-start gap-2">
          <span className="text-xs font-mono font-medium text-gray-300 tabular-nums">
            <span className="text-white font-semibold">{formatTime(currentTime)}</span> <span className="text-gray-500">/</span> {formatTime(duration)}
          </span>
        </div>

        {/* 2. Center: Media Playback Controls (Exact Middle) */}
        <div className="flex items-center justify-center gap-1">
          {/* Rewind 15s (|◀ icon) */}
          <button
            onClick={() => seekVideo(Math.max(0, currentTime - 15))}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-[#1a1826] hover:text-white transition-colors"
            title="ย้อนกลับ 15 วินาที"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <rect x="4" y="4" width="2.5" height="16" rx="0.5" />
              <polygon points="20 4 8 12 20 20 20 4" />
            </svg>
          </button>

          {/* Rewind 5s (↺ clean loop arrow) */}
          <button
            onClick={() => seekVideo(Math.max(0, currentTime - 5))}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-[#1a1826] hover:text-white transition-colors"
            title="ย้อนกลับ 5 วินาที"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>

          {/* Play / Pause Toggle (Centered Prominent Play Button) */}
          <button
            onClick={togglePlay}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white hover:brightness-110 active:scale-95 transition-all shadow-md shadow-purple-900/30 mx-0.5"
            title={isPlaying ? 'หยุดชั่วคราว (Space)' : 'เล่น (Space)'}
          >
            {isPlaying ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            )}
          </button>

          {/* Forward 5s (↻ clean loop arrow) */}
          <button
            onClick={() => seekVideo(Math.min(duration, currentTime + 5))}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-[#1a1826] hover:text-white transition-colors"
            title="ข้ามไปข้างหน้า 5 วินาที"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
            </svg>
          </button>

          {/* Forward 15s (▶| icon) */}
          <button
            onClick={() => seekVideo(Math.min(duration, currentTime + 15))}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-[#1a1826] hover:text-white transition-colors"
            title="ข้ามไปข้างหน้า 15 วินาที"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="4 4 16 12 4 20 4 4" />
              <rect x="17.5" y="4" width="2.5" height="16" rx="0.5" />
            </svg>
          </button>
        </div>

        {/* 3. Right: Volume & Fullscreen Controls */}
        <div className="flex items-center justify-end gap-2">
          {/* Volume Control */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                const next = !isMuted;
                setIsMuted(next);
                if (videoRef.current) videoRef.current.muted = next;
              }}
              className="flex h-7 w-7 items-center justify-center text-gray-400 hover:text-white transition-colors"
              title={isMuted ? 'เปิดเสียง' : 'ปิดเสียง'}
            >
              {isMuted || volume === 0 ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setVolume(val);
                setIsMuted(false);
                if (videoRef.current) {
                  videoRef.current.volume = val;
                  videoRef.current.muted = false;
                }
              }}
              className="volume-seek h-1 w-16 rounded cursor-pointer accent-purple-400"
              style={{
                background: `linear-gradient(to right, #7c3aed ${(isMuted ? 0 : volume) * 100}%, #1c1a28 ${(isMuted ? 0 : volume) * 100}%)`,
              }}
              aria-label="ระดับเสียง"
            />
          </div>

          {/* Fullscreen Toggle */}
          <button
            onClick={handleFullscreen}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-[#1a1826] hover:text-white transition-colors"
            title="เต็มจอ"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3H5a2 2 0 0 0-2 2v3" />
              <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
              <path d="M3 16v3a2 2 0 0 0 2 2h3" />
              <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default React.memo(TransportControls);