'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

interface EditorHeaderProps {
  projectName: string;
  setProjectName: (name: string) => void;
  hasChanges: boolean;
  setHasChanges: (val: boolean) => void;
  aspectRatio: '16:9' | '9:16' | '1:1';
  setAspectRatio: (val: '16:9' | '9:16' | '1:1') => void;
  speed: number;
  setSpeed: (val: number) => void;
  selectedSubtitleId: number | string | null;
  onResetStyles: () => void;
  onExportSRT: () => void;
  onSave: () => void;
  onRenderVideo: () => void;
  isRendering: boolean;
  showToast: (msg: string) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  captionLengthMode?: 'normal' | 'short' | 'custom';
  customWordCount?: number;
  onRegroupSubtitles?: (mode: 'normal' | 'short' | 'custom', wordCount?: number) => void;
}

function EditorHeader({
  projectName,
  setProjectName,
  hasChanges,
  setHasChanges,
  aspectRatio,
  setAspectRatio,
  speed,
  setSpeed,
  selectedSubtitleId,
  onResetStyles,
  onExportSRT,
  onSave,
  onRenderVideo,
  isRendering,
  showToast,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  captionLengthMode = 'custom',
  customWordCount = 4,
  onRegroupSubtitles,
}: EditorHeaderProps) {
  const [isRatioOpen, setIsRatioOpen] = useState(false);
  const [isSpeedOpen, setIsSpeedOpen] = useState(false);
  const [isCaptionLengthOpen, setIsCaptionLengthOpen] = useState(false);
  const [tempWordCount, setTempWordCount] = useState<number>(customWordCount);

  const ratioDropdownRef = useRef<HTMLDivElement>(null);
  const speedDropdownRef = useRef<HTMLDivElement>(null);
  const captionLengthDropdownRef = useRef<HTMLDivElement>(null);

  // Keep local temp word count synced with prop
  useEffect(() => {
    setTempWordCount(customWordCount);
  }, [customWordCount]);

  // Close dropdowns on outside click (supports both mouse and touch taps)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent | PointerEvent) => {
      if (ratioDropdownRef.current && !ratioDropdownRef.current.contains(event.target as Node)) {
        setIsRatioOpen(false);
      }
      if (speedDropdownRef.current && !speedDropdownRef.current.contains(event.target as Node)) {
        setIsSpeedOpen(false);
      }
      if (captionLengthDropdownRef.current && !captionLengthDropdownRef.current.contains(event.target as Node)) {
        setIsCaptionLengthOpen(false);
      }
    };

    document.addEventListener('pointerdown', handleClickOutside);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
    };
  }, []);
  return (
    <header className="relative flex h-12 items-center justify-between border-b border-[#1c1a28] bg-[#0c0b11]/95 backdrop-blur-md px-2 sm:px-4 select-none z-50 gap-1.5 sm:gap-2 overflow-visible">
      {/* Left: Back arrow, Project Name, Status badge */}
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 min-w-0">
        <Link
          href="/my-video"
          className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 hover:bg-[#1c1a29] hover:text-white transition-all active:scale-95 flex-shrink-0"
          title="กลับสู่หน้าวิดีโอของฉัน"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <input
          type="text"
          value={projectName}
          onChange={(e) => {
            setProjectName(e.target.value);
            setHasChanges(true);
          }}
          className="bg-transparent font-medium text-xs sm:text-sm text-gray-200 hover:text-white focus:text-white focus:outline-none focus:ring-1 focus:ring-purple-500/40 rounded px-1.5 py-0.5 w-[85px] sm:w-[150px] md:w-[200px] transition-colors truncate"
        />
        <span
          className={`hidden md:inline-flex rounded-full px-2 py-0.5 text-[9px] font-medium tracking-wide transition-colors ${
            hasChanges
              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/25'
              : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/25'
          }`}
        >
          {hasChanges ? 'ยังไม่บันทึก' : 'บันทึกแล้ว'}
        </span>
      </div>

      {/* Center: Tools, Ratio, Speed, Undo/Redo - Unified Segmented Pill Theme */}
      <div className="flex items-center gap-1 rounded-xl bg-[#1a1827] p-1 text-xs flex-shrink-0 overflow-visible">
        {/* Caption Length Dropdown (Normal sentence vs Custom words) */}
        <div className="relative" ref={captionLengthDropdownRef}>
          <button
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            onClick={() => {
              setIsCaptionLengthOpen((prev) => !prev);
              setIsRatioOpen(false);
              setIsSpeedOpen(false);
            }}
            className={`flex h-7 sm:h-8 items-center gap-1.5 rounded-lg px-2.5 sm:px-3 text-xs font-semibold transition-all ${
              isCaptionLengthOpen
                ? 'bg-[#2d2250] text-[#c4b5fd] shadow-sm'
                : 'text-white/80 hover:text-white hover:bg-white/[0.04]'
            }`}
            title="ปรับความยาวแคปชัน (คำต่อการ์ด / จังหวะประโยค)"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={isCaptionLengthOpen ? 'text-[#c4b5fd]' : 'text-purple-400'}>
              <rect x="3" y="4" width="18" height="16" rx="3" />
              <path d="M7 9h10" />
              <path d="M7 15h6" />
            </svg>
            <div className="flex items-baseline gap-1 hidden sm:flex">
              <span className="text-[10px] text-[#a78bfa] font-semibold uppercase tracking-wider">คำต่อการ์ด:</span>
              <span className="font-semibold text-xs">
                {captionLengthMode === 'normal'
                  ? 'ประโยคเต็ม'
                  : captionLengthMode === 'short'
                  ? '3 คำ'
                  : `${customWordCount} คำ`}
              </span>
            </div>
            <span className="font-semibold sm:hidden">
              {captionLengthMode === 'normal' ? 'ประโยค' : `${customWordCount}คำ`}
            </span>
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className={`transition-transform duration-200 ${isCaptionLengthOpen ? 'rotate-180 text-[#c4b5fd]' : 'text-gray-400'}`}
            >
              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {isCaptionLengthOpen && (
            <div
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute left-0 top-full mt-2 w-80 rounded-2xl bg-[#141220] border border-[#2d2250] p-3.5 shadow-2xl shadow-black/80 z-[999] backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150 space-y-3"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#2d2250] text-[#c4b5fd]">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="16" rx="3" />
                      <path d="M7 9h10M7 15h6" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block leading-tight">จำนวนคำต่อการ์ด</span>
                    <span className="text-[10px] text-gray-400 leading-none">แบ่งซับไตเติลตามจังหวะคำ</span>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-[#2d2250] text-[#c4b5fd]">
                  AI Auto
                </span>
              </div>

              {/* Mode Preset Cards */}
              <div className="grid grid-cols-2 gap-2">
                {/* 1. Sentence Mode */}
                <button
                  type="button"
                  onClick={() => {
                    onRegroupSubtitles?.('normal');
                    setIsCaptionLengthOpen(false);
                  }}
                  className={`group relative flex flex-col p-2.5 rounded-xl border text-left transition-all ${
                    captionLengthMode === 'normal'
                      ? 'bg-[#2d2250] text-white border-purple-500/50 shadow-sm'
                      : 'bg-[#181528] border-white/5 hover:border-purple-500/30 hover:bg-[#201c36]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">ประโยคปกติ</span>
                    <span className={`h-2 w-2 rounded-full ${captionLengthMode === 'normal' ? 'bg-[#c4b5fd] shadow-[0_0_6px_#c084fc]' : 'bg-gray-600'}`} />
                  </div>
                  <span className="text-[10px] text-gray-400 leading-tight">ตามจังหวะพูดธรรมชาติ</span>
                  <div className="mt-2 text-[9px] px-1.5 py-0.5 rounded bg-black/30 text-[#c4b5fd] font-mono w-fit">
                    ~8-12 คำ/การ์ด
                  </div>
                </button>

                {/* 2. Punchy TikTok Mode (Short) */}
                <button
                  type="button"
                  onClick={() => {
                    setTempWordCount(3);
                    onRegroupSubtitles?.('short', 3);
                    setIsCaptionLengthOpen(false);
                  }}
                  className={`group relative flex flex-col p-2.5 rounded-xl border text-left transition-all ${
                    captionLengthMode === 'short'
                      ? 'bg-[#2d2250] text-white border-purple-500/50 shadow-sm'
                      : 'bg-[#181528] border-white/5 hover:border-purple-500/30 hover:bg-[#201c36]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">คำสั้นกระชับ</span>
                    <span className={`h-2 w-2 rounded-full ${captionLengthMode === 'short' ? 'bg-[#c4b5fd] shadow-[0_0_6px_#c084fc]' : 'bg-gray-600'}`} />
                  </div>
                  <span className="text-[10px] text-gray-400 leading-tight">เหมาะกับ Reels/TikTok</span>
                  <div className="mt-2 text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/30 w-fit">
                    ⚡ ยอดฮิต (3 คำ)
                  </div>
                </button>
              </div>

              {/* Custom Word Count Section */}
              <div className="rounded-xl bg-[#181528] border border-white/[0.06] p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-gray-200">กำหนดคำเอง</span>
                    <span className="text-[10px] text-gray-400">(Custom)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-base font-black text-[#c4b5fd] tabular-nums font-mono">
                      {tempWordCount}
                    </span>
                    <span className="text-[11px] font-semibold text-gray-400">คำ/การ์ด</span>
                  </div>
                </div>

                {/* Quick select pills */}
                <div className="grid grid-cols-6 gap-1">
                  {[1, 2, 3, 4, 6, 8].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => {
                        setTempWordCount(n);
                        onRegroupSubtitles?.('custom', n);
                        setIsCaptionLengthOpen(false);
                      }}
                      className={`h-7 rounded-lg text-xs font-bold transition-all ${
                        captionLengthMode === 'custom' && customWordCount === n
                          ? 'bg-[#2d2250] text-[#c4b5fd] shadow-sm border border-purple-500/40'
                          : 'bg-[#221e38] text-gray-300 hover:bg-[#2c264a] hover:text-white border border-transparent'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>

                {/* Stepper + Slider Control */}
                <div className="pt-1.5 border-t border-white/5 space-y-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const next = Math.max(1, tempWordCount - 1);
                        setTempWordCount(next);
                        onRegroupSubtitles?.('custom', next);
                      }}
                      className="h-7 w-8 rounded-lg bg-[#241f3b] hover:bg-[#312a52] text-white font-bold text-sm transition-all flex items-center justify-center border border-white/5 active:scale-90"
                      title="ลดจำนวนคำ"
                    >
                      -
                    </button>

                    <div className="relative flex-1 flex items-center">
                      <input
                        type="range"
                        min="1"
                        max="12"
                        step="1"
                        value={tempWordCount}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setTempWordCount(val);
                          onRegroupSubtitles?.('custom', val);
                        }}
                        className="w-full h-1.5 bg-[#25203b] rounded-lg appearance-none cursor-pointer accent-purple-400 focus:outline-none"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const next = Math.min(12, tempWordCount + 1);
                        setTempWordCount(next);
                        onRegroupSubtitles?.('custom', next);
                      }}
                      className="h-7 w-8 rounded-lg bg-[#241f3b] hover:bg-[#312a52] text-white font-bold text-sm transition-all flex items-center justify-center border border-white/5 active:scale-90"
                      title="เพิ่มจำนวนคำ"
                    >
                      +
                    </button>
                  </div>

                  {/* Live Visual Preview Pill Box */}
                  <div className="flex items-center justify-between bg-[#12101e] rounded-lg px-2.5 py-1.5 text-[11px] border border-white/5">
                    <span className="text-gray-400">ตัวอย่าง:</span>
                    <div className="flex items-center gap-1 font-medium">
                      {Array.from({ length: Math.min(tempWordCount, 5) }).map((_, idx) => (
                        <span key={idx} className="px-1.5 py-0.5 rounded bg-[#2d2250] text-[#c4b5fd] font-mono text-[10px] border border-purple-500/30">
                          {idx === 0 ? 'สวัสดี' : idx === 1 ? 'ครับ' : idx === 2 ? 'ทุกคน' : idx === 3 ? 'วัน' : 'นี้'}
                        </span>
                      ))}
                      {tempWordCount > 5 && (
                        <span className="text-gray-400 text-[10px]">+{tempWordCount - 5}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Custom Aspect Ratio Dropdown */}
        <div className="relative" ref={ratioDropdownRef}>
          <button
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            onClick={() => {
              setIsRatioOpen((prev) => !prev);
              setIsSpeedOpen(false);
            }}
            className={`flex h-7 sm:h-8 items-center gap-1.5 rounded-lg px-2.5 sm:px-3 text-xs font-semibold transition-all ${
              isRatioOpen
                ? 'bg-[#2d2250] text-[#c4b5fd] shadow-sm'
                : 'text-white/80 hover:text-white hover:bg-white/[0.04]'
            }`}
            title="เปลี่ยนสัดส่วนวิดีโอ"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={isRatioOpen ? 'text-[#c4b5fd]' : 'text-purple-400'}>
              {aspectRatio === '9:16' ? (
                <rect x="7" y="2" width="10" height="20" rx="2" />
              ) : aspectRatio === '16:9' ? (
                <rect x="2" y="5" width="20" height="14" rx="2" />
              ) : (
                <rect x="4" y="4" width="16" height="16" rx="2" />
              )}
            </svg>
            <span className="font-semibold">
              {aspectRatio}
            </span>
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className={`transition-transform duration-200 ${isRatioOpen ? 'rotate-180 text-[#c4b5fd]' : 'text-gray-400'}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {isRatioOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-48 max-w-[90vw] rounded-xl bg-[#141220] border border-[#2d2250] p-1.5 shadow-2xl shadow-black/80 z-[100] animate-in fade-in zoom-in-95 duration-100 space-y-1">
              {[
                { value: '9:16', label: '9:16 แนวตั้ง', desc: 'Reels / TikTok', icon: <rect x="8" y="3" width="8" height="18" rx="1.5" /> },
                { value: '16:9', label: '16:9 แนวนอน', desc: 'YouTube / Widescreen', icon: <rect x="3" y="6" width="18" height="12" rx="1.5" /> },
                { value: '1:1', label: '1:1 จัตุรัส', desc: 'Square Post', icon: <rect x="4" y="4" width="16" height="16" rx="1.5" /> },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setAspectRatio(opt.value as '16:9' | '9:16' | '1:1');
                    setIsRatioOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors ${
                    aspectRatio === opt.value
                      ? 'bg-[#2d2250] text-[#c4b5fd] font-semibold'
                      : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#c4b5fd]">
                      {opt.icon}
                    </svg>
                    <div>
                      <div className="leading-tight">{opt.label}</div>
                      <div className="text-[9px] text-gray-500 leading-none mt-0.5">{opt.desc}</div>
                    </div>
                  </div>
                  {aspectRatio === opt.value && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#c4b5fd]">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Custom Playback Speed Dropdown */}
        <div className="relative" ref={speedDropdownRef}>
          <button
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            onClick={() => {
              setIsSpeedOpen((prev) => !prev);
              setIsRatioOpen(false);
            }}
            className={`flex h-7 sm:h-8 items-center gap-1.5 rounded-lg px-2.5 sm:px-3 text-xs font-semibold transition-all ${
              isSpeedOpen
                ? 'bg-[#2d2250] text-[#c4b5fd] shadow-sm'
                : 'text-white/80 hover:text-white hover:bg-white/[0.04]'
            }`}
            title="ความเร็วการเล่นวิดีโอ"
          >
            {/* Speedometer Gauge Icon */}
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={isSpeedOpen ? 'text-[#c4b5fd]' : 'text-purple-400'}>
              <path d="M12 14v-4" />
              <path d="M3.34 19a10 10 0 1 1 17.32 0" />
            </svg>
            <span>{speed}x</span>
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className={`transition-transform duration-200 ${isSpeedOpen ? 'rotate-180 text-[#c4b5fd]' : 'text-gray-400'}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {isSpeedOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-32 rounded-xl bg-[#141220] border border-[#2d2250] p-1 shadow-2xl shadow-black/80 z-[100] animate-in fade-in zoom-in-95 duration-100 space-y-0.5">
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setSpeed(s);
                    setIsSpeedOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                    speed === s
                      ? 'bg-[#2d2250] text-[#c4b5fd] font-semibold'
                      : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span>{s === 1 ? '1.0x (ปกติ)' : `${s}x`}</span>
                  {speed === s && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#c4b5fd]">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="h-4 w-[1px] bg-white/[0.08]" />

        {/* Undo / Redo */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`flex h-7 sm:h-8 w-7 sm:w-8 items-center justify-center rounded-lg transition-all ${
            canUndo
              ? 'text-white/80 hover:text-white hover:bg-white/[0.04] active:scale-95'
              : 'text-white/20 cursor-not-allowed'
          }`}
          title="เลิกทำ (Undo)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 7v6h6" />
            <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
          </svg>
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`flex h-7 sm:h-8 w-7 sm:w-8 items-center justify-center rounded-lg transition-all ${
            canRedo
              ? 'text-white/80 hover:text-white hover:bg-white/[0.04] active:scale-95'
              : 'text-white/20 cursor-not-allowed'
          }`}
          title="ทำซ้ำ (Redo)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 7v6h-6" />
            <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
          </svg>
        </button>

        <div className="h-4 w-[1px] bg-white/[0.08]" />

        {/* Reset */}
        <button
          onClick={onResetStyles}
          className="flex h-7 sm:h-8 items-center rounded-lg px-2.5 sm:px-3 text-xs font-semibold text-white/80 hover:text-rose-300 hover:bg-rose-500/15 transition-all active:scale-95"
          title={selectedSubtitleId !== null ? 'รีเซ็ตสไตล์แคปชันนี้กลับเป็นสไตล์รวม' : 'รีเซ็ตสไตล์เริ่มต้นทั้งหมด'}
        >
          รีเซ็ต
        </button>
      </div>

      {/* Right: Export SRT, Save, Render Button */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        <button
          onClick={onExportSRT}
          className="flex h-8 items-center gap-1.5 rounded-xl bg-[#151322] hover:bg-[#1f1c32] border border-[#262238] px-2.5 sm:px-3 text-xs text-gray-300 hover:text-white transition-all active:scale-95 shadow-sm"
          title="ส่งออก SRT"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span className="font-medium hidden md:inline">ส่งออก SRT</span>
        </button>

        <button
          onClick={onSave}
          className="flex h-8 items-center gap-1.5 rounded-xl bg-[#151322] hover:bg-[#1f1c32] border border-[#262238] px-2.5 sm:px-3 text-xs font-medium text-gray-300 hover:text-white transition-all active:scale-95 shadow-sm"
          title="บันทึกโปรเจกต์"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-400">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
          <span className="hidden sm:inline">บันทึก</span>
        </button>

        <button
          onClick={onRenderVideo}
          disabled={isRendering}
          className="flex h-8 items-center gap-1.5 sm:gap-2 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white px-3 sm:px-4 text-xs font-bold transition-all shadow-md shadow-purple-500/25 active:scale-95 disabled:opacity-50"
          title="เรนเดอร์วิดีโอ"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          <span>เรนเดอร์</span>
        </button>
      </div>
    </header>
  );
}

export default React.memo(EditorHeader);