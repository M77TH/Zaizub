'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { needsSpaceBetweenWords } from './types';

interface EditorHeaderProps {
  projectName: string;
  setProjectName: (name: string) => void;
  hasChanges: boolean;
  setHasChanges: (val: boolean) => void;
  saveStatus?: 'saved' | 'saving' | 'unsaved';
  aspectRatio: '16:9' | '9:16' | '1:1';
  setAspectRatio: (val: '16:9' | '9:16' | '1:1') => void;
  speed: number;
  setSpeed: (val: number) => void;
  selectedSubtitleId: number | string | null;
  onResetStyles: () => void;
  onExportSRT: () => void;
  onExportSubtitle?: (format: 'srt' | 'vtt' | 'txt') => void;
  onCopyTranscript?: () => void;
  onSave?: () => void;
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

const SAMPLE_CAPTION_WORDS = [
  'วิธีทำ',
  'คลิปสั้น',
  'ให้คน',
  'หยุดดู',
  'จนจบ',
  'ภายใน',
  '3',
  'วินาที',
  'แรก',
  'แบบ',
  'มืออาชีพ',
  'ทันที',
] as const;

type HeaderMenu = 'ratio' | 'speed' | 'captionLength' | 'export' | null;

const EXPORT_FORMAT_OPTIONS: ReadonlyArray<{
  format: 'srt' | 'vtt' | 'txt';
  ext: string;
  label: string;
  desc: string;
}> = [
  { format: 'srt', ext: '.SRT', label: 'ไฟล์ซับไตเติล', desc: 'Premiere · CapCut · YouTube' },
  { format: 'vtt', ext: '.VTT', label: 'เว็บซับไตเติล', desc: 'HTML5 Player · Web Video' },
  { format: 'txt', ext: '.TXT', label: 'ข้อความล้วน', desc: 'สคริปต์บทพูด ไม่มีไทม์โค้ด' },
];

const ASPECT_RATIO_OPTIONS: ReadonlyArray<{
  value: '9:16' | '16:9' | '1:1';
  label: string;
  desc: string;
}> = [
  { value: '9:16', label: '9:16 แนวตั้ง', desc: 'TikTok / Reels / Shorts' },
  { value: '16:9', label: '16:9 แนวนอน', desc: 'YouTube / Widescreen' },
  { value: '1:1', label: '1:1 จัตุรัส', desc: 'Square Post' },
];

function AspectRatioIcon({
  ratio,
  size = 12,
  className = '',
}: {
  ratio: '16:9' | '9:16' | '1:1';
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.1"
      className={className}
    >
      {ratio === '9:16' ? (
        <rect x="7" y="2" width="10" height="20" rx="2" />
      ) : ratio === '16:9' ? (
        <rect x="2" y="5" width="20" height="14" rx="2" />
      ) : (
        <rect x="4" y="4" width="16" height="16" rx="2" />
      )}
    </svg>
  );
}

function EditorHeader({
  projectName,
  setProjectName,
  hasChanges,
  setHasChanges,
  saveStatus = 'saved',
  aspectRatio,
  setAspectRatio,
  speed,
  setSpeed,
  selectedSubtitleId,
  onResetStyles,
  onExportSRT,
  onExportSubtitle,
  onCopyTranscript,
  onSave,
  onRenderVideo,
  isRendering,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  captionLengthMode = 'custom',
  customWordCount = 4,
  onRegroupSubtitles,
}: EditorHeaderProps) {
  const [openMenu, setOpenMenu] = useState<HeaderMenu>(null);

  const ratioDropdownRef = useRef<HTMLDivElement>(null);
  const speedDropdownRef = useRef<HTMLDivElement>(null);
  const captionLengthDropdownRef = useRef<HTMLDivElement>(null);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  const isRatioOpen = openMenu === 'ratio';
  const isSpeedOpen = openMenu === 'speed';
  const isCaptionLengthOpen = openMenu === 'captionLength';
  const isExportOpen = openMenu === 'export';

  const toggleMenu = (menu: Exclude<HeaderMenu, null>) => {
    setOpenMenu((prev) => (prev === menu ? null : menu));
  };

  useEffect(() => {
    const handleClickOutside = (event: PointerEvent) => {
      const target = event.target as Node;
      const refs = [
        ratioDropdownRef.current,
        speedDropdownRef.current,
        captionLengthDropdownRef.current,
        exportDropdownRef.current,
      ];
      if (!refs.some((ref) => ref && ref.contains(target))) {
        setOpenMenu(null);
      }
    };

    document.addEventListener('pointerdown', handleClickOutside);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
    };
  }, []);

  return (
    <header className="relative flex h-12 items-center justify-between md:grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] border-b border-[#1b1a24] bg-[#09080d] px-2.5 sm:px-4 select-none z-50 gap-2 overflow-visible">
      {/* 1. LEFT: Back Navigation & Project Title */}
      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 md:justify-self-start md:max-w-full">
        <Link
          href="/my-video"
          className="group flex h-8 w-8 items-center justify-center rounded-lg border border-[#22202d] bg-[#100f16] text-zinc-400 hover:border-[#8b5cf6]/60 hover:text-white transition-colors flex-shrink-0"
          title="กลับสู่คลังฟุตเทจ"
          aria-label="กลับสู่คลังฟุตเทจ"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-transform duration-150 group-hover:-translate-x-0.5"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>

        <div className="hidden sm:block h-4 w-[1px] bg-[#1e1d28] flex-shrink-0" />

        {/* Project Title Input */}
        <div className="relative flex items-center min-w-0 flex-1 md:flex-initial rounded-md border border-transparent hover:border-[#242230] focus-within:border-white/35 focus-within:bg-[#100f16] px-2 py-0.5 transition-colors">
          <input
            type="text"
            value={projectName}
            onChange={(e) => {
              setProjectName(e.target.value);
              setHasChanges(true);
            }}
            aria-label="ชื่อโปรเจกต์"
            className="font-display bg-transparent font-bold text-xs sm:text-[13px] text-white placeholder-zinc-500 focus:outline-none py-0.5 w-[90px] sm:w-[140px] xl:w-[190px] max-w-full truncate"
          />
        </div>
      </div>

      {/* 2. CENTER: Hardware Control Well */}
      <div className="flex items-center gap-1 rounded-lg bg-[#100f16] p-1 border border-[#201e2b] text-xs flex-shrink-0 overflow-visible md:justify-self-center">
        {/* A. Caption Pacing / Words-per-Card Dropdown */}
        <div className="relative" ref={captionLengthDropdownRef}>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => toggleMenu('captionLength')}
            className={`flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition-colors border cursor-pointer ${
              isCaptionLengthOpen
                ? 'bg-[#1f1d2b] text-white border-[#343146]'
                : 'border-transparent text-zinc-300 hover:text-white hover:bg-white/[0.04]'
            }`}
            title="ปรับความยาวแคปชัน (คำต่อการ์ด / จังหวะประโยค)"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={isCaptionLengthOpen ? 'text-[#a78bfa]' : 'text-zinc-400'}
            >
              <rect x="3" y="4" width="18" height="16" rx="3" />
              <path d="M7 9h10" />
              <path d="M7 15h6" />
            </svg>
            <span className="hidden xl:inline text-[11px] text-zinc-400 font-medium">คำต่อการ์ด:</span>
            <span className="font-mono text-[11px] font-semibold text-[#c4b5fd]">
              {captionLengthMode === 'normal'
                ? 'ประโยค'
                : captionLengthMode === 'short'
                ? '3 คำ'
                : `${customWordCount} คำ`}
            </span>
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className={`transition-transform duration-200 ${
                isCaptionLengthOpen ? 'rotate-180 text-[#a78bfa]' : 'text-zinc-500'
              }`}
            >
              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {isCaptionLengthOpen && (
            <div
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute left-0 top-full mt-2 w-72 max-w-[calc(100vw-24px)] rounded-xl bg-[#0b0a10] border border-[#262433] p-3 shadow-[0_24px_60px_rgba(0,0,0,0.92)] z-[999] origin-top-left anim-dropdown space-y-2.5"
            >
              {/* Popover Header */}
              <div className="flex items-baseline justify-between px-0.5 pb-2 border-b border-white/[0.06]">
                <div>
                  <span className="text-xs font-semibold text-white block leading-tight">
                    จังหวะคำต่อการ์ด
                  </span>
                  <span className="text-[10.5px] text-zinc-500 block mt-0.5 leading-tight">
                    จัดกลุ่มคำพูดอัตโนมัติตามเสียง
                  </span>
                </div>
                <span className="font-mono text-[11px] font-semibold text-[#c4b5fd] tabular-nums">
                  {captionLengthMode === 'normal'
                    ? 'ประโยค'
                    : captionLengthMode === 'short'
                    ? '3 คำ'
                    : `${customWordCount} คำ`}
                </span>
              </div>

              {/* Mode Presets */}
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    onRegroupSubtitles?.('normal');
                    setOpenMenu(null);
                  }}
                  className={`flex flex-col rounded-lg border px-2.5 py-2 text-left transition-colors cursor-pointer ${
                    captionLengthMode === 'normal'
                      ? 'bg-[#1c1630] border-[#8b5cf6]/70 text-white'
                      : 'bg-[#111018] border-[#211f2d] text-zinc-300 hover:border-[#343146] hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold leading-tight">ประโยคเต็ม</span>
                    {captionLengthMode === 'normal' && (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" className="text-[#a78bfa] flex-shrink-0">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <span className="mt-1 text-[10.5px] text-zinc-400 leading-tight">
                    ตามจังหวะพูด
                  </span>
                  <span className="mt-1 font-mono text-[10px] text-zinc-500 leading-none">
                    ~8–12 คำ
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onRegroupSubtitles?.('short', 3);
                    setOpenMenu(null);
                  }}
                  className={`flex flex-col rounded-lg border px-2.5 py-2 text-left transition-colors cursor-pointer ${
                    captionLengthMode === 'short'
                      ? 'bg-[#1c1630] border-[#8b5cf6]/70 text-white'
                      : 'bg-[#111018] border-[#211f2d] text-zinc-300 hover:border-[#343146] hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold leading-tight">คำสั้นไวรัล</span>
                    {captionLengthMode === 'short' && (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" className="text-[#a78bfa] flex-shrink-0">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <span className="mt-1 text-[10.5px] text-zinc-400 leading-tight">
                    TikTok / Reels
                  </span>
                  <span className="mt-1 font-mono text-[10px] text-[#a78bfa] leading-none">
                    3 คำต่อการ์ด
                  </span>
                </button>
              </div>

              {/* Custom Word Count Section */}
              <div className="border-t border-white/[0.06] pt-2.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-zinc-300">กำหนดจำนวนคำเอง</span>
                  <div className="flex items-center rounded-md bg-[#111018] border border-[#22202d] p-0.5">
                    <button
                      type="button"
                      disabled={customWordCount <= 1}
                      onClick={() => {
                        const next = Math.max(1, customWordCount - 1);
                        onRegroupSubtitles?.('custom', next);
                      }}
                      className="flex h-5 w-5 items-center justify-center rounded text-zinc-300 hover:bg-white/[0.07] hover:text-white disabled:opacity-35 disabled:pointer-events-none transition-colors font-mono text-xs cursor-pointer"
                      title="ลดจำนวนคำ"
                      aria-label="ลดจำนวนคำ"
                    >
                      −
                    </button>
                    <span className="min-w-[44px] px-1.5 text-center font-mono text-[11px] font-semibold tabular-nums text-[#c4b5fd]">
                      {customWordCount} คำ
                    </span>
                    <button
                      type="button"
                      disabled={customWordCount >= 12}
                      onClick={() => {
                        const next = Math.min(12, customWordCount + 1);
                        onRegroupSubtitles?.('custom', next);
                      }}
                      className="flex h-5 w-5 items-center justify-center rounded text-zinc-300 hover:bg-white/[0.07] hover:text-white disabled:opacity-35 disabled:pointer-events-none transition-colors font-mono text-xs cursor-pointer"
                      title="เพิ่มจำนวนคำ"
                      aria-label="เพิ่มจำนวนคำ"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Unified Segmented Quick Select */}
                <div className="grid grid-cols-6 gap-0.5 rounded-lg bg-[#111018] border border-[#211f2d] p-0.5">
                  {[1, 2, 3, 4, 6, 8].map((n) => {
                    const isSelected = captionLengthMode === 'custom' && customWordCount === n;
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => {
                          onRegroupSubtitles?.('custom', n);
                          setOpenMenu(null);
                        }}
                        className={`h-7 rounded-md font-mono text-xs font-semibold transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#7c3aed] text-white'
                            : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                        }`}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>

                {/* Clean Subtitle-Style Live Preview */}
                {(() => {
                  const count = Math.max(1, Math.min(12, customWordCount));
                  const visible = SAMPLE_CAPTION_WORDS.slice(0, Math.min(count, 6));
                  const highlightIdx = Math.min(1, visible.length - 1);
                  return (
                    <div className="rounded-lg bg-[#07060a] border border-white/[0.05] px-2.5 py-2 text-center">
                      <div className="text-[10px] text-zinc-500 mb-0.5">
                        ตัวอย่างต่อ 1 การ์ด
                      </div>
                      <div className="text-xs font-medium text-zinc-300 leading-relaxed truncate">
                        {visible.map((word, idx) => (
                          <span
                            key={idx}
                            className={idx === highlightIdx ? 'text-[#c4b5fd] font-semibold' : undefined}
                          >
                            {idx > 0 && needsSpaceBetweenWords(visible[idx - 1], word) ? ' ' : ''}
                            {word}
                          </span>
                        ))}
                        {count > 6 && (
                          <span className="ml-1 font-mono text-[10px] text-zinc-500">
                            +{count - 6} คำ
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>

        <div className="h-4 w-[1px] bg-white/[0.08]" />

        {/* B. Aspect Ratio: Compact Universal Dropdown */}
        <div className="relative" ref={ratioDropdownRef}>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => toggleMenu('ratio')}
            className={`flex h-7 items-center gap-1.5 rounded-md px-2 sm:px-2.5 text-xs font-mono font-semibold transition-colors border cursor-pointer ${
              isRatioOpen
                ? 'bg-[#1f1d2b] text-white border-[#343146]'
                : 'border-transparent text-zinc-200 hover:text-white hover:bg-white/[0.04]'
            }`}
            title="เปลี่ยนสัดส่วนวิดีโอ"
            aria-expanded={isRatioOpen}
            aria-haspopup="menu"
          >
            <AspectRatioIcon
              ratio={aspectRatio}
              size={12}
              className={isRatioOpen ? 'text-[#a78bfa]' : 'text-[#a78bfa]/90'}
            />
            <span>{aspectRatio}</span>
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className={`transition-transform duration-200 ${
                isRatioOpen ? 'rotate-180 text-[#a78bfa]' : 'text-zinc-500'
              }`}
            >
              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {isRatioOpen && (
            <div
              role="menu"
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute top-full left-0 mt-2 w-52 max-w-[90vw] rounded-xl bg-[#0b0a10] border border-[#262433] p-1.5 shadow-[0_24px_60px_rgba(0,0,0,0.92)] z-[999] origin-top-left anim-dropdown space-y-0.5"
            >
              <div className="px-2.5 pt-1 pb-1.5 mb-1 border-b border-white/[0.06]">
                <span className="text-[11px] font-semibold text-zinc-400">สัดส่วนเฟรมวิดีโอ</span>
              </div>
              {ASPECT_RATIO_OPTIONS.map((opt) => {
                const isSelected = aspectRatio === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="menuitemradio"
                    aria-checked={isSelected}
                    onClick={() => {
                      setAspectRatio(opt.value);
                      setOpenMenu(null);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition-colors border cursor-pointer ${
                      isSelected
                        ? 'bg-[#1c1630] text-white border-[#8b5cf6]/70 font-semibold'
                        : 'border-transparent text-zinc-300 hover:bg-white/[0.04] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <AspectRatioIcon
                        ratio={opt.value}
                        size={13}
                        className={isSelected ? 'text-[#a78bfa]' : 'text-zinc-500'}
                      />
                      <div>
                        <div className="leading-tight font-mono">{opt.label}</div>
                        <div className="text-[10px] text-zinc-500 leading-none mt-0.5 font-sans">
                          {opt.desc}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        className="text-[#a78bfa] flex-shrink-0"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="h-4 w-[1px] bg-white/[0.08]" />

        {/* C. Playback Speed Selector */}
        <div className="relative" ref={speedDropdownRef}>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => toggleMenu('speed')}
            className={`flex h-7 items-center gap-1 rounded-md px-2 sm:px-2.5 text-xs font-mono font-semibold tabular-nums transition-colors border cursor-pointer ${
              isSpeedOpen
                ? 'bg-[#1f1d2b] text-white border-[#343146]'
                : 'border-transparent text-zinc-300 hover:text-white hover:bg-white/[0.04]'
            }`}
            title="ความเร็วการเล่นวิดีโอ"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={isSpeedOpen ? 'text-[#a78bfa]' : 'text-zinc-400'}
            >
              <path d="M12 14v-4" />
              <path d="M3.34 19a10 10 0 1 1 17.32 0" />
            </svg>
            <span>{speed}x</span>
          </button>

          {isSpeedOpen && (
            <div className="absolute top-full left-0 mt-2 w-36 rounded-xl bg-[#0b0a10] border border-[#262433] p-1.5 shadow-[0_24px_60px_rgba(0,0,0,0.92)] z-[100] origin-top-left anim-dropdown space-y-0.5">
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setSpeed(s);
                    setOpenMenu(null);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-mono transition-colors cursor-pointer border ${
                    speed === s
                      ? 'bg-[#1f1d2b] text-white border-[#343146] font-semibold'
                      : 'border-transparent text-zinc-300 hover:bg-white/[0.04] hover:text-white'
                  }`}
                >
                  <span>{s === 1 ? '1.0x (ปกติ)' : `${s}x`}</span>
                  {speed === s && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#a78bfa]">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="h-4 w-[1px] bg-white/[0.08]" />

        {/* D. Undo / Redo */}
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
            canUndo
              ? 'text-zinc-300 hover:text-white hover:bg-white/[0.05] active:scale-95 cursor-pointer'
              : 'text-zinc-600 cursor-not-allowed'
          }`}
          title="เลิกทำ (Ctrl+Z)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 7v6h6" />
            <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
          </svg>
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
            canRedo
              ? 'text-zinc-300 hover:text-white hover:bg-white/[0.05] active:scale-95 cursor-pointer'
              : 'text-zinc-600 cursor-not-allowed'
          }`}
          title="ทำซ้ำ (Ctrl+Y)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 7v6h-6" />
            <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
          </svg>
        </button>

        <div className="hidden sm:block h-4 w-[1px] bg-white/[0.08]" />

        {/* E. Reset */}
        <button
          type="button"
          onClick={onResetStyles}
          className="hidden sm:flex h-7 items-center gap-1 rounded-md px-2.5 text-xs font-semibold text-zinc-400 hover:text-rose-300 hover:bg-rose-500/15 transition-colors active:scale-95 cursor-pointer"
          title={selectedSubtitleId !== null ? 'รีเซ็ตแคปชันและสไตล์ทั้งหมด' : 'รีเซ็ตค่าเริ่มต้นทั้งหมด'}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          <span className="hidden md:inline">รีเซ็ต</span>
        </button>
      </div>

      {/* 3. RIGHT: Inline Save Status & Unified Primary Render Split Button */}
      <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0 md:justify-self-end">
        {/* Restraint Inline Save Status Trigger */}
        <button
          type="button"
          onClick={() => onSave?.()}
          title="คลิกเพื่อบันทึกโปรเจกต์ทันที"
          className={`hidden md:inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[10px] font-semibold tracking-wider uppercase transition-colors cursor-pointer flex-shrink-0 ${
            saveStatus === 'saving'
              ? 'text-zinc-300'
              : hasChanges || saveStatus === 'unsaved'
              ? 'text-[#c4b5fd] hover:bg-[#8b5cf6]/10'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-[1px] ${
              saveStatus === 'saving'
                ? 'bg-[#8b5cf6] animate-pulse'
                : hasChanges || saveStatus === 'unsaved'
                ? 'bg-[#a78bfa]'
                : 'bg-emerald-400'
            }`}
          />
          <span>
            {saveStatus === 'saving'
              ? 'SAVING'
              : hasChanges || saveStatus === 'unsaved'
              ? 'UNSAVED'
              : 'SAVED'}
          </span>
        </button>

        <div className="relative" ref={exportDropdownRef}>
          <div
            className={`flex h-8 items-stretch rounded-lg border transition-colors ${
              isRendering
                ? 'bg-[#262138] border-[#3a3354]'
                : 'bg-[#7c3aed] border-[#a78bfa]/35'
            }`}
          >
            {/* Left Hitbox: Immediate Render & Download MP4 */}
            <button
              type="button"
              onClick={onRenderVideo}
              disabled={isRendering}
              className={`flex items-center gap-2 rounded-l-[7px] px-3 sm:px-3.5 text-xs font-bold transition-colors ${
                isRendering
                  ? 'text-zinc-300 cursor-wait'
                  : 'text-white hover:bg-[#8b5cf6] active:bg-[#6d28d9] cursor-pointer'
              }`}
              title="เรนเดอร์และดาวน์โหลดวิดีโอ MP4"
            >
              {isRendering ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-[#c4b5fd]" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  <span>กำลังเรนเดอร์...</span>
                </>
              ) : (
                <>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  <span>เรนเดอร์ MP4</span>
                </>
              )}
            </button>

            {/* Hairline Divider Between Render Hitbox & Dropdown Section */}
            <span
              aria-hidden="true"
              className={`my-1.5 w-[1px] flex-shrink-0 ${
                isRendering ? 'bg-white/15' : 'bg-white/25'
              }`}
            />

            {/* Right Hitbox: Downward Arrow Opening Export Options */}
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => toggleMenu('export')}
              aria-expanded={isExportOpen}
              aria-haspopup="menu"
              aria-label="ตัวเลือกส่งออก (.SRT / .VTT / .TXT / คัดลอก)"
              title="ตัวเลือกส่งออก (.SRT / .VTT / .TXT / คัดลอก)"
              className={`flex items-center justify-center rounded-r-[7px] px-2 transition-colors cursor-pointer ${
                isRendering
                  ? 'text-zinc-300 hover:bg-white/10'
                  : isExportOpen
                  ? 'bg-[#6d28d9] text-white'
                  : 'text-white/90 hover:bg-[#8b5cf6] hover:text-white active:bg-[#6d28d9]'
              }`}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className={`transition-transform duration-200 ${
                  isExportOpen ? 'rotate-180' : ''
                }`}
              >
                <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {isExportOpen && (
            <div
              role="menu"
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute right-0 top-full mt-2 w-60 max-w-[calc(100vw-24px)] rounded-xl bg-[#0b0a10] border border-[#262433] p-1.5 shadow-[0_24px_60px_rgba(0,0,0,0.92)] z-[999] origin-top-right anim-dropdown"
            >
              <div className="px-2.5 pt-1 pb-1.5 mb-1 border-b border-white/[0.06]">
                <span className="text-[11px] font-semibold text-zinc-400">
                  ส่งออกไฟล์และข้อความ
                </span>
              </div>

              <div className="space-y-0.5">
                {EXPORT_FORMAT_OPTIONS.map((opt) => (
                  <button
                    key={opt.format}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      if (onExportSubtitle) {
                        onExportSubtitle(opt.format);
                      } else if (opt.format === 'srt') {
                        onExportSRT();
                      }
                      setOpenMenu(null);
                    }}
                    className="group flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-[#191626] text-zinc-200 hover:text-white cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-medium leading-tight">{opt.label}</div>
                      <div className="text-[10.5px] text-zinc-500 group-hover:text-zinc-400 leading-tight mt-0.5 truncate">
                        {opt.desc}
                      </div>
                    </div>
                    <span className="flex-shrink-0 font-mono text-[10.5px] font-semibold text-[#c4b5fd] bg-[#141220] border border-[#2a2540] group-hover:border-[#8b5cf6]/50 px-1.5 py-0.5 rounded">
                      {opt.ext}
                    </span>
                  </button>
                ))}
              </div>

              {onCopyTranscript && (
                <>
                  <div className="my-1 border-t border-white/[0.06]" />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      onCopyTranscript();
                      setOpenMenu(null);
                    }}
                    className="group flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-[#191626] text-zinc-200 hover:text-white cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-medium leading-tight">คัดลอกข้อความทั้งหมด</div>
                      <div className="text-[10.5px] text-zinc-500 group-hover:text-zinc-400 leading-tight mt-0.5">
                        วางลงแคปชันโซเชียลได้ทันที
                      </div>
                    </div>
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="flex-shrink-0 text-zinc-500 group-hover:text-[#a78bfa] transition-colors"
                    >
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default React.memo(EditorHeader);
