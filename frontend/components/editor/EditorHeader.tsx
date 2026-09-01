'use client';

import React from 'react';
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
}: EditorHeaderProps) {
  return (
    <header className="flex h-12 items-center justify-between border-b border-[#1c1a28] bg-[#0c0b11] px-4 select-none">
      {/* Left: Back arrow, Project Name, Status badge */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-[#1a1826] hover:text-white transition-colors"
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
          className="bg-transparent font-semibold text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50 rounded px-1.5 py-0.5"
        />
        <span
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
            hasChanges
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
          }`}
        >
          {hasChanges ? 'มีการเปลี่ยนแปลง' : 'บันทึกแล้ว'}
        </span>
      </div>

      {/* Center: Tools, Ratio, Crop, Speed, Undo/Redo */}
      <div className="flex items-center gap-1.5 text-xs text-gray-300">
        <button
          onClick={() => showToast('ซิงค์ซับกับเสียงอัตโนมัติแล้ว')}
          className="flex items-center gap-1.5 rounded-lg bg-[#1a1826] hover:bg-[#252236] px-2.5 py-1.5 transition-colors text-gray-300 hover:text-white"
          title="จัดตำแหน่งซับไตเติลใหม่ให้ตรงกับช่วงเสียงพูดโดยอัตโนมัติ"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-400">
            <path d="M12 2v20M17 5v14M7 9v6M2 12h2M20 12h2" />
          </svg>
          <span>รีเซ็ตซับให้ตรงกับเสียง</span>
        </button>

        {/* Aspect Ratio Selector */}
        <div className="relative flex items-center rounded-lg bg-[#1a1826] px-2 py-1 transition-colors">
          <select
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value as '16:9' | '9:16' | '1:1')}
            className="bg-transparent text-xs text-gray-300 focus:outline-none cursor-pointer pr-1"
          >
            <option value="16:9" className="bg-[#13121b]">16:9 • เต็มจอ</option>
            <option value="9:16" className="bg-[#13121b]">9:16 • แนวตั้ง</option>
            <option value="1:1" className="bg-[#13121b]">1:1 • จัตุรัส</option>
          </select>
        </div>

        <button
          onClick={() => showToast('เครื่องมือครอบภาพ')}
          className="flex items-center gap-1 rounded-lg bg-[#1a1826] hover:bg-[#252236] px-2.5 py-1.5 transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 2v14a2 2 0 0 0 2 2h14" />
            <path d="M18 22V8a2 2 0 0 0-2-2H2" />
          </svg>
          <span>ครอบ</span>
        </button>

        <div className="flex items-center rounded-lg bg-[#1a1826] px-2 py-1">
          <select
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="bg-transparent text-xs text-gray-300 focus:outline-none cursor-pointer"
          >
            <option value={0.5} className="bg-[#13121b]">0.5x</option>
            <option value={1} className="bg-[#13121b]">1x</option>
            <option value={1.25} className="bg-[#13121b]">1.25x</option>
            <option value={1.5} className="bg-[#13121b]">1.5x</option>
            <option value={2} className="bg-[#13121b]">2x</option>
          </select>
        </div>

        {/* Undo / Redo */}
        <button
          onClick={() => showToast('เลิกทำ')}
          className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-[#1a1826] text-gray-400 hover:text-white transition-colors"
          title="Undo"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 7v6h6" />
            <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
          </svg>
        </button>
        <button
          onClick={() => showToast('ทำซ้ำ')}
          className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-[#1a1826] text-gray-400 hover:text-white transition-colors"
          title="Redo"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 7v6h-6" />
            <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
          </svg>
        </button>

        <button
          onClick={onResetStyles}
          className="rounded-lg bg-[#1a1826] hover:bg-[#252236] px-2.5 py-1.5 transition-colors"
          title={selectedSubtitleId !== null ? 'รีเซ็ตสไตล์แคปชันนี้กลับเป็นสไตล์รวม' : 'รีเซ็ตสไตล์เริ่มต้นทั้งหมด'}
        >
          รีเซ็ต
        </button>
      </div>

      {/* Right: Export SRT, Save, Render Button */}
      <div className="flex items-center gap-2">
        <button
          onClick={onExportSRT}
          className="flex items-center gap-1.5 rounded-lg bg-[#1a1826] hover:bg-[#252236] px-3 py-1.5 text-xs text-gray-200 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>ส่งออก SRT</span>
        </button>

        <button
          onClick={onSave}
          className="flex items-center gap-1.5 rounded-lg bg-[#1a1826] hover:bg-[#252236] px-3 py-1.5 text-xs font-medium text-white transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-400">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
          <span>บันทึก</span>
        </button>

        <button
          onClick={onRenderVideo}
          disabled={isRendering}
          className="flex items-center gap-2 rounded-lg bg-[#7c3aed] hover:bg-[#6d28d9] text-white px-4 py-1.5 text-xs font-bold transition-all shadow-md shadow-purple-500/25 active:scale-95 disabled:opacity-50"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          <span>เรนเดอร์</span>
        </button>
      </div>
    </header>
  );
}

export default React.memo(EditorHeader);