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
}: EditorHeaderProps) {
  const [isRatioOpen, setIsRatioOpen] = useState(false);
  const [isSpeedOpen, setIsSpeedOpen] = useState(false);

  const ratioDropdownRef = useRef<HTMLDivElement>(null);
  const speedDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click (supports both mouse and touch taps)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent | PointerEvent) => {
      if (ratioDropdownRef.current && !ratioDropdownRef.current.contains(event.target as Node)) {
        setIsRatioOpen(false);
      }
      if (speedDropdownRef.current && !speedDropdownRef.current.contains(event.target as Node)) {
        setIsSpeedOpen(false);
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
          href="/"
          className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-400 hover:bg-[#1c1a29] hover:text-white transition-all active:scale-95 flex-shrink-0"
          title="กลับสู่หน้าหลัก"
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

      {/* Center: Tools, Ratio, Speed, Undo/Redo - Clean Pill Group matching Zaizub Theme */}
      <div className="flex items-center gap-0.5 sm:gap-1 p-0.5 sm:p-1 rounded-2xl bg-[#13111c] border border-[#232032] shadow-inner text-xs flex-shrink-0 overflow-visible">
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
            className={`flex h-8 items-center gap-1 sm:gap-1.5 rounded-xl px-2 sm:px-2.5 transition-all text-xs font-medium border ${
              isRatioOpen
                ? 'bg-[#211b38] border-purple-500/50 text-white shadow-[0_0_12px_rgba(168,85,247,0.25)]'
                : 'bg-[#1a1727] hover:bg-[#231f36] border-transparent hover:border-purple-500/30 text-gray-200'
            }`}
            title="เปลี่ยนสัดส่วนวิดีโอ"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-400 flex-shrink-0">
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
              className={`text-gray-400 transition-transform duration-200 ${isRatioOpen ? 'rotate-180 text-purple-300' : ''}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {isRatioOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-48 max-w-[90vw] rounded-xl bg-[#141220] border border-purple-500/40 p-1.5 shadow-[0_15px_40px_rgba(0,0,0,0.95)] z-[100] animate-in fade-in zoom-in-95 duration-100 space-y-1">
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
                      ? 'bg-purple-600/25 text-purple-200 font-semibold border border-purple-500/30'
                      : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-400">
                      {opt.icon}
                    </svg>
                    <div>
                      <div className="leading-tight">{opt.label}</div>
                      <div className="text-[9px] text-gray-500 leading-none mt-0.5">{opt.desc}</div>
                    </div>
                  </div>
                  {aspectRatio === opt.value && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-purple-400">
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
            className={`flex h-8 items-center gap-1.5 rounded-xl px-2.5 transition-all text-xs font-medium border ${
              isSpeedOpen
                ? 'bg-[#211b38] border-purple-500/50 text-white shadow-[0_0_12px_rgba(168,85,247,0.25)]'
                : 'bg-[#1a1727] hover:bg-[#231f36] border-transparent hover:border-purple-500/30 text-gray-200'
            }`}
            title="ความเร็วการเล่นวิดีโอ"
          >
            {/* Speedometer Gauge Icon */}
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-400 flex-shrink-0">
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
              className={`text-gray-400 transition-transform duration-200 ${isSpeedOpen ? 'rotate-180 text-purple-300' : ''}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {isSpeedOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-32 rounded-xl bg-[#141220] border border-purple-500/40 p-1 shadow-[0_15px_40px_rgba(0,0,0,0.95)] z-[100] animate-in fade-in zoom-in-95 duration-100 space-y-0.5">
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
                      ? 'bg-purple-600/25 text-purple-200 font-semibold border border-purple-500/30'
                      : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span>{s === 1 ? '1.0x (ปกติ)' : `${s}x`}</span>
                  {speed === s && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-purple-400">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="h-4 w-[1px] bg-[#28243a]" />

        {/* Undo / Redo */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
            canUndo
              ? 'text-gray-300 hover:bg-[#231f36] hover:text-white active:scale-95'
              : 'text-gray-600 cursor-not-allowed opacity-40'
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
          className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
            canRedo
              ? 'text-gray-300 hover:bg-[#231f36] hover:text-white active:scale-95'
              : 'text-gray-600 cursor-not-allowed opacity-40'
          }`}
          title="ทำซ้ำ (Redo)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 7v6h-6" />
            <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
          </svg>
        </button>

        {/* Reset */}
        <button
          onClick={onResetStyles}
          className="flex h-8 items-center rounded-xl bg-[#1a1727] hover:bg-rose-950/30 hover:border-rose-500/30 border border-transparent px-2 sm:px-3 text-gray-300 hover:text-rose-300 transition-all font-medium active:scale-95 text-[11px] sm:text-xs"
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