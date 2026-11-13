'use client';

import React, { useMemo } from 'react';
import {
  SubtitleSegment,
  SubtitleStyle,
  SubtitlePosition,
  SubtitleAnimation,
  SubtitlePresetMode,
  normalizeSubtitleStyle,
  tokenizeSubtitleText,
  needsSpaceBetweenWords,
} from './types';
import FontSelector from './FontSelector';
import CustomScrollbar from '@/components/ui/CustomScrollbar';
import { useSmoothScrollElement } from '@/components/providers/SmoothScroll';

interface StylePanelProps {
  width?: number;
  styles: SubtitleStyle;
  setStyles: (styles: SubtitleStyle) => void;
  selectedSubtitle?: SubtitleSegment;
  selectedSubtitleId: number | string | null;
  selectedSubtitleIndex: number;
  setSelectedSubtitleId: React.Dispatch<React.SetStateAction<number | string | null>>;
  handleResetToGlobal: (id?: number | string | null) => void;
  subtitles: SubtitleSegment[];
}

const POSITION_OPTIONS: { id: SubtitlePosition; label: string; y: number; align: 'bottom' | 'center' | 'top' }[] = [
  { id: 'bottom', label: 'ล่าง', y: 82, align: 'bottom' },
  { id: 'center', label: 'กลาง', y: 50, align: 'center' },
  { id: 'custom', label: 'บน', y: 12, align: 'top' },
];

const ANIMATION_OPTIONS: { id: SubtitleAnimation; label: string; tag: string }[] = [
  { id: 'none', label: 'ไม่มี', tag: 'STATIC' },
  { id: 'pop', label: 'Pop / เด้ง', tag: 'VIRAL' },
  { id: 'bounce', label: 'Bounce เด้งสูง', tag: 'ENERGY' },
  { id: 'fade', label: 'Fade นุ่มนวล', tag: 'SMOOTH' },
  { id: 'slide-up', label: 'Slide ขึ้น', tag: 'RISE' },
  { id: 'typewriter', label: 'พิมพ์ดีด', tag: 'TYPE' },
  { id: 'shake', label: 'Shake สั่น', tag: 'HOOK' },
];

const PRESET_MODE_OPTIONS: { id: SubtitlePresetMode; label: string }[] = [
  { id: 'tiktok', label: '3D Viral' },
  { id: 'badge', label: 'ป้ายสีคำ' },
  { id: 'karaoke', label: 'Neon Glow' },
  { id: 'default', label: 'คลาสสิก' },
];

function StylePanel({
  width,
  styles,
  setStyles,
  selectedSubtitle,
  selectedSubtitleId,
  selectedSubtitleIndex,
  setSelectedSubtitleId,
  handleResetToGlobal,
  subtitles,
}: StylePanelProps) {
  const { ref: styleScrollRef } = useSmoothScrollElement<HTMLDivElement>();

  const currentStyle = useMemo(() => normalizeSubtitleStyle(styles), [styles]);

  const fontSizeRatio = Math.max(0, Math.min(1, (currentStyle.font_size - 24) / (120 - 24)));
  const outlineThicknessRatio = Math.max(0, Math.min(1, ((currentStyle.outline_thickness ?? 3) - 1) / 7));
  const shadowThicknessRatio = Math.max(0, Math.min(1, currentStyle.shadow_thickness / 10));
  const bgOpacityRatio = Math.max(0, Math.min(1, currentStyle.bg_opacity));

  // Build live preview textShadow matching VideoPlayer & ass_generator
  const livePreviewShadow = useMemo(() => {
    const sc = currentStyle.shadow_color || '#000000';
    const oc = currentStyle.outline_color || sc || '#000000';
    const ot = Math.max(1, Math.min(3, Math.round((currentStyle.outline_thickness ?? 3) * 0.55)));
    const st = Math.max(1, Math.round(currentStyle.shadow_thickness * 0.75));
    const isNeon =
      currentStyle.preset_mode === 'karaoke' ||
      (currentStyle.shadow &&
        sc.toLowerCase() === currentStyle.text_color.toLowerCase() &&
        sc.toLowerCase() !== '#ffffff' &&
        sc.toLowerCase() !== '#000000');

    if (isNeon) {
      return `0 0 ${st * 3}px ${currentStyle.text_color}, 0 0 ${st * 5}px ${currentStyle.text_color}, 0 2px 4px #000000`;
    }
    if (currentStyle.outline && currentStyle.shadow) {
      return `0 ${st}px 0 ${sc}, -${ot}px -${ot}px 0 ${oc}, ${ot}px -${ot}px 0 ${oc}, -${ot}px ${ot}px 0 ${oc}, ${ot}px ${ot}px 0 ${oc}`;
    }
    if (currentStyle.outline) {
      return `-${ot}px -${ot}px 0 ${oc}, ${ot}px -${ot}px 0 ${oc}, -${ot}px ${ot}px 0 ${oc}, ${ot}px ${ot}px 0 ${oc}`;
    }
    if (currentStyle.shadow) {
      return `0 ${st}px ${st * 2}px ${sc}`;
    }
    return 'none';
  }, [currentStyle]);

  const livePreviewBg = useMemo(() => {
    if (currentStyle.bg_opacity <= 0) return 'transparent';
    const hex = currentStyle.bg_color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.substring(2, 4), 16) || 0;
    const b = parseInt(hex.substring(4, 6), 16) || 0;
    return `rgba(${r}, ${g}, ${b}, ${currentStyle.bg_opacity})`;
  }, [currentStyle.bg_color, currentStyle.bg_opacity]);

  const previewTokens = useMemo(() => {
    if (selectedSubtitle?.text) {
      const words = tokenizeSubtitleText(selectedSubtitle.text).slice(0, 4);
      if (words.length > 0) return words;
    }
    return ['วิธีทำคลิปให้', 'คนหยุดดู', '100%'];
  }, [selectedSubtitle?.text]);

  return (
    <div
      className="relative flex flex-col min-h-0 flex-1 md:flex-shrink-0 overflow-hidden select-none bg-[#0a090e] w-full md:w-auto"
      style={typeof window !== 'undefined' && window.innerWidth >= 768 && width ? { width: `${width}px` } : undefined}
    >
      {/* 1. Header Bar with Panel Name & Scope Switcher */}
      <div className="flex h-10 flex-shrink-0 items-center justify-between border-b border-[#1b1a24] bg-[#09080d] px-3 select-none">
        <h2 className="font-display text-xs font-bold text-white">ปรับแต่งสไตล์</h2>

        {/* Mode Switcher Tabs in Header Right */}
        <div className="flex items-center gap-0.5 rounded-md bg-[#111017] border border-[#201e2b] p-0.5 ml-auto">
          <button
            type="button"
            onClick={() => setSelectedSubtitleId(null)}
            className={`rounded px-2 py-0.5 text-[10.5px] font-semibold transition-colors cursor-pointer ${
              selectedSubtitleId === null
                ? 'bg-[#211f2e] text-white'
                : 'text-zinc-500 hover:text-zinc-200'
            }`}
          >
            ทั้งคลิป
          </button>
          <button
            type="button"
            onClick={() => {
              if (selectedSubtitleId === null && subtitles.length > 0) {
                setSelectedSubtitleId(subtitles[0].id);
              }
            }}
            className={`rounded px-2 py-0.5 text-[10.5px] font-semibold transition-colors cursor-pointer ${
              selectedSubtitleId !== null
                ? 'bg-[#211f2e] text-[#c4b5fd]'
                : 'text-zinc-500 hover:text-zinc-200'
            }`}
          >
            เฉพาะส่วน
          </button>
        </div>
      </div>

      {/* 2. Scrollable Inspector Content */}
      <div className="relative flex-1 min-h-0 overflow-hidden">
        <div ref={styleScrollRef} className="panel-scroll-area h-full overflow-y-auto p-3 space-y-3 custom-scrollbar text-xs">
          {/* CLEAN CALIBRATION SPECIMEN BOX (Zero dot-grid / zero colored radial aura) */}
          <div className="relative overflow-hidden rounded-xl bg-[#050508] border border-[#1d1c26] p-2.5">
            {/* Top Row inside Specimen Card */}
            <div className="relative z-10 flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold text-zinc-400 truncate">
                {selectedSubtitleId === null
                  ? 'SPECIMEN // ALL CLIPS'
                  : `SPECIMEN // CUE #${selectedSubtitleIndex + 1}`}
              </span>
              {selectedSubtitleId !== null ? (
                <button
                  type="button"
                  onClick={() => handleResetToGlobal(selectedSubtitleId)}
                  className="flex items-center gap-1 rounded bg-[#14131c] hover:bg-white/[0.08] border border-[#252333] px-1.5 py-0.5 text-[9.5px] font-semibold text-zinc-300 transition-colors cursor-pointer"
                  title="รีเซ็ตสไตล์ของประโยคนี้ให้เหมือนทั้งคลิป"
                >
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                  </svg>
                  <span>คืนค่า</span>
                </button>
              ) : (
                <span className="text-[9.5px] font-mono text-zinc-500">
                  {currentStyle.font_family}
                </span>
              )}
            </div>

            {/* Live Styled Token Preview Box */}
            <div className="relative z-10 flex h-12 w-full items-center justify-center rounded-lg bg-black border border-[#171620] px-2 overflow-hidden">
              <div
                style={{
                  fontFamily: `"${currentStyle.font_family}", "Noto Sans Thai", sans-serif`,
                  fontWeight: currentStyle.bold ? 800 : 500,
                  fontStyle: currentStyle.italic ? 'italic' : 'normal',
                  textDecoration: currentStyle.underline ? 'underline' : 'none',
                  textShadow: livePreviewShadow,
                  backgroundColor: livePreviewBg,
                }}
                className="rounded-lg px-2.5 py-1 text-[13px] truncate whitespace-nowrap"
              >
                {previewTokens.map((word, idx) => {
                  const hasSpaceAfter =
                    idx < previewTokens.length - 1 &&
                    needsSpaceBetweenWords(word, previewTokens[idx + 1]);
                  const activeIdx = Math.min(1, previewTokens.length - 1);
                  const isCurrentWord = idx === activeIdx;
                  const useWordHL = Boolean(currentStyle.word_highlight) && previewTokens.length > 1;
                  const isBadgeMode = useWordHL && currentStyle.preset_mode === 'badge';
                  const isKaraokeDim = useWordHL && currentStyle.preset_mode === 'karaoke' && idx > activeIdx;

                  const wordStyle: React.CSSProperties = isBadgeMode && isCurrentWord
                    ? {
                        backgroundColor: currentStyle.badge_color || currentStyle.text_color,
                        color: '#000000',
                        padding: '1px 6px',
                        borderRadius: '5px',
                        textShadow: 'none',
                        transform: 'translateY(-1px) scale(1.06)',
                      }
                    : {
                        color: !useWordHL || isCurrentWord ? currentStyle.text_color : currentStyle.base_text_color || '#ffffff',
                        opacity: isKaraokeDim ? 0.45 : 1,
                        transform: useWordHL && isCurrentWord ? 'translateY(-1px) scale(1.06)' : undefined,
                      };

                  return (
                    <React.Fragment key={idx}>
                      <span
                        style={wordStyle}
                        className="inline-block transition-transform"
                      >
                        {word}
                      </span>
                      {hasSpaceAfter ? ' ' : null}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>

          {/* CARD 1: TYPOGRAPHY & TEXT STYLES */}
          <div className="rounded-xl bg-[#0f0e15] border border-[#1d1c26] p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="text-[#a78bfa]">
                  <path d="M4 7V4h16v3M9 20h6M12 4v16" />
                </svg>
                ตัวอักษร & ฟอนต์
              </span>
              <span className="text-[9.5px] font-mono text-zinc-500">TYPOGRAPHY</span>
            </div>

            {/* 1. Font Family with Custom Dropdown & Upload */}
            <div>
              <label className="block text-zinc-400 mb-1.5 text-xs font-medium">รูปแบบฟอนต์</label>
              <FontSelector
                value={currentStyle.font_family}
                onChange={(fontName) => setStyles({ ...currentStyle, font_family: fontName })}
              />
            </div>

            {/* 2. Font Size */}
            <div>
              <div className="flex items-center justify-between text-zinc-400 mb-1.5 text-xs font-medium">
                <span>ขนาดตัวอักษร</span>
                <span className="rounded bg-[#09080d] border border-[#252333] px-1.5 py-0.5 text-[10px] font-mono font-semibold text-[#c4b5fd] tabular-nums">
                  {currentStyle.font_size}px
                </span>
              </div>
              <input
                type="range"
                min="24"
                max="120"
                value={currentStyle.font_size}
                onChange={(e) => setStyles({ ...currentStyle, font_size: parseInt(e.target.value) })}
                className="w-full h-1.5 rounded-sm accent-[#8b5cf6] cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #8b5cf6 ${fontSizeRatio * 100}%, #1c1b24 ${fontSizeRatio * 100}%)`,
                }}
              />
            </div>

            {/* 3. Text Formatting Well (B / I / U / Shadow / Outline) */}
            <div>
              <label className="block text-zinc-400 mb-1.5 text-xs font-medium">เอฟเฟกต์ตัวอักษร</label>
              <div className="grid grid-cols-5 gap-1 rounded-lg bg-[#09080d] border border-[#1f1e29] p-1">
                <button
                  type="button"
                  onClick={() => setStyles({ ...currentStyle, bold: !currentStyle.bold })}
                  className={`rounded-md h-8 font-bold text-xs transition-colors border cursor-pointer ${
                    currentStyle.bold
                      ? 'bg-[#7c3aed] text-white border-[#8b5cf6]'
                      : 'text-zinc-400 border-transparent hover:text-white hover:bg-white/[0.04]'
                  }`}
                  title="ตัวหนา (Bold)"
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={() => setStyles({ ...currentStyle, italic: !currentStyle.italic })}
                  className={`rounded-md h-8 italic font-serif text-xs transition-colors border cursor-pointer ${
                    currentStyle.italic
                      ? 'bg-[#7c3aed] text-white border-[#8b5cf6]'
                      : 'text-zinc-400 border-transparent hover:text-white hover:bg-white/[0.04]'
                  }`}
                  title="ตัวเอียง (Italic)"
                >
                  I
                </button>
                <button
                  type="button"
                  onClick={() => setStyles({ ...currentStyle, underline: !currentStyle.underline })}
                  className={`rounded-md h-8 underline text-xs transition-colors border cursor-pointer ${
                    currentStyle.underline
                      ? 'bg-[#7c3aed] text-white border-[#8b5cf6]'
                      : 'text-zinc-400 border-transparent hover:text-white hover:bg-white/[0.04]'
                  }`}
                  title="ขีดเส้นใต้ (Underline)"
                >
                  U
                </button>
                <button
                  type="button"
                  onClick={() => setStyles({ ...currentStyle, shadow: !currentStyle.shadow })}
                  className={`rounded-md h-8 text-[11px] font-semibold transition-colors border cursor-pointer ${
                    currentStyle.shadow
                      ? 'bg-[#7c3aed] text-white border-[#8b5cf6]'
                      : 'text-zinc-400 border-transparent hover:text-white hover:bg-white/[0.04]'
                  }`}
                  title="เงาตกกระทบ (Drop Shadow)"
                >
                  เงา
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setStyles({
                      ...currentStyle,
                      outline: !currentStyle.outline,
                      outline_thickness: !currentStyle.outline ? Math.max(2, currentStyle.outline_thickness || 3) : 0,
                    })
                  }
                  className={`rounded-md h-8 text-[11px] font-semibold transition-colors border cursor-pointer ${
                    currentStyle.outline
                      ? 'bg-[#7c3aed] text-white border-[#8b5cf6]'
                      : 'text-zinc-400 border-transparent hover:text-white hover:bg-white/[0.04]'
                  }`}
                  title="ขอบตัวอักษร (Stroke Outline)"
                >
                  ขอบ
                </button>
              </div>
            </div>
          </div>

          {/* CARD 2: COLORS, WORD HIGHLIGHT & STROKE */}
          <div className="rounded-xl bg-[#0f0e15] border border-[#1d1c26] p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="text-[#a78bfa]">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                สีไฮไลต์ & พื้นผิว
              </span>
              <span className="text-[9.5px] font-mono text-zinc-500">COLOR & STROKE</span>
            </div>

            {/* Word Highlight Mode Toggle */}
            <div className="space-y-2 rounded-lg bg-[#09080d] border border-[#1f1e29] p-2.5">
              <div className="flex items-center justify-between">
                <label className="text-zinc-300 text-xs font-medium">โหมดไฮไลต์คำพูด</label>
                <span className={`text-[9.5px] font-mono font-semibold ${currentStyle.word_highlight ? 'text-[#c4b5fd]' : 'text-zinc-500'}`}>
                  {currentStyle.word_highlight ? 'ทีละคำ · SYNC' : 'ทั้งประโยค'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1 rounded-md bg-[#121118] p-0.5 border border-[#1f1e29]">
                <button
                  type="button"
                  onClick={() => setStyles({ ...currentStyle, word_highlight: true })}
                  className={`rounded-[5px] py-1.5 text-[11px] font-semibold transition-colors border cursor-pointer ${
                    currentStyle.word_highlight
                      ? 'bg-[#211d32] text-white border-[#6d28d9]/60'
                      : 'text-zinc-500 border-transparent hover:text-zinc-200'
                  }`}
                >
                  ไฮไลต์ทีละคำ
                </button>
                <button
                  type="button"
                  onClick={() => setStyles({ ...currentStyle, word_highlight: false })}
                  className={`rounded-[5px] py-1.5 text-[11px] font-semibold transition-colors border cursor-pointer ${
                    !currentStyle.word_highlight
                      ? 'bg-[#211d32] text-white border-[#6d28d9]/60'
                      : 'text-zinc-500 border-transparent hover:text-zinc-200'
                  }`}
                >
                  สีเดียวทั้งประโยค
                </button>
              </div>

              {currentStyle.word_highlight && (
                <div className="pt-1">
                  <label className="block text-[10.5px] text-zinc-400 mb-1">สไตล์เอฟเฟกต์คำ</label>
                  <div className="grid grid-cols-4 gap-1">
                    {PRESET_MODE_OPTIONS.map((pm) => {
                      const activePm = (currentStyle.preset_mode || 'default') === pm.id;
                      return (
                        <button
                          key={pm.id}
                          type="button"
                          onClick={() =>
                            setStyles({
                              ...currentStyle,
                              preset_mode: pm.id,
                              badge_color: pm.id === 'badge' ? currentStyle.badge_color || currentStyle.text_color || '#22c55e' : currentStyle.badge_color,
                            })
                          }
                          className={`rounded-md py-1 px-1 text-[10px] font-semibold transition-colors border truncate cursor-pointer ${
                            activePm
                              ? 'bg-[#7c3aed] text-white border-[#8b5cf6]'
                              : 'bg-[#121118] text-zinc-400 border-[#22202e] hover:text-white hover:border-[#343146]'
                          }`}
                        >
                          {pm.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Active Word / Text Color */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-zinc-300 text-xs font-medium">
                  {currentStyle.word_highlight ? 'สีคำที่กำลังพูด (Highlight)' : 'สีตัวอักษรทั้งประโยค'}
                </label>
                <span className="rounded bg-[#09080d] border border-[#252333] px-1.5 py-0.5 text-[10px] font-mono text-[#c4b5fd] uppercase">
                  {currentStyle.text_color}
                </span>
              </div>
              <div className="flex items-center justify-between gap-1.5 rounded-lg bg-[#09080d] border border-[#1f1e29] p-2">
                {['#ffffff', '#facc15', '#4ade80', '#22d3ee', '#f472b6', '#fb923c', '#ef4444'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() =>
                      setStyles({
                        ...currentStyle,
                        text_color: c,
                        badge_color: currentStyle.preset_mode === 'badge' ? c : currentStyle.badge_color,
                      })
                    }
                    style={{ backgroundColor: c }}
                    className={`h-6 w-6 rounded-[5px] border border-black/40 transition-transform cursor-pointer ${
                      currentStyle.text_color.toLowerCase() === c
                        ? 'ring-2 ring-[#a78bfa] ring-offset-2 ring-offset-[#09080d] scale-105'
                        : 'hover:scale-105 opacity-85 hover:opacity-100'
                    }`}
                    title={c}
                  />
                ))}
                {(() => {
                  const presets = ['#ffffff', '#facc15', '#4ade80', '#22d3ee', '#f472b6', '#fb923c', '#ef4444'];
                  const isCustom = !presets.includes(currentStyle.text_color.toLowerCase());
                  return (
                    <label
                      className={`flex h-6 w-6 items-center justify-center rounded-[5px] cursor-pointer text-xs font-bold transition-colors border ${
                        isCustom
                          ? 'ring-2 ring-[#a78bfa] ring-offset-2 ring-offset-[#09080d] scale-105 border-white/30'
                          : 'bg-[#15141d] border-[#292738] text-zinc-300 hover:bg-[#1f1d2b] hover:text-white'
                      }`}
                      style={isCustom ? { backgroundColor: currentStyle.text_color } : {}}
                      title="เลือกสีตัวอักษรเอง"
                    >
                      {!isCustom && '+'}
                      <input
                        type="color"
                        value={currentStyle.text_color}
                        onChange={(e) =>
                          setStyles({
                            ...currentStyle,
                            text_color: e.target.value,
                            badge_color:
                              currentStyle.preset_mode === 'badge' ? e.target.value : currentStyle.badge_color,
                          })
                        }
                        className="hidden"
                      />
                    </label>
                  );
                })()}
              </div>
            </div>

            {/* Base Text Color (when word highlight is ON) */}
            {currentStyle.word_highlight && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-zinc-300 text-xs font-medium">สีคำปกติ (Base Text)</label>
                  <span className="rounded bg-[#09080d] border border-[#252333] px-1.5 py-0.5 text-[10px] font-mono text-zinc-300 uppercase">
                    {currentStyle.base_text_color || '#ffffff'}
                  </span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-[#09080d] border border-[#1f1e29] p-2">
                  {['#ffffff', '#e2e8f0', '#fef08a', '#cbd5e1', '#d8b4fe'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setStyles({ ...currentStyle, base_text_color: c })}
                      style={{ backgroundColor: c }}
                      className={`h-5 w-5 rounded-[4px] border border-black/40 transition-transform cursor-pointer ${
                        (currentStyle.base_text_color || '#ffffff').toLowerCase() === c
                          ? 'ring-2 ring-[#a78bfa] ring-offset-1 ring-offset-[#09080d] scale-105'
                          : 'hover:scale-105 opacity-85 hover:opacity-100'
                      }`}
                      title={c}
                    />
                  ))}
                  <label
                    className="ml-auto flex h-5 px-2 items-center justify-center rounded-[4px] cursor-pointer text-[10px] font-mono bg-[#15141d] border border-[#292738] text-zinc-300 hover:text-white hover:bg-[#1f1d2b]"
                    title="เลือกสีคำปกติเอง"
                  >
                    + เอง
                    <input
                      type="color"
                      value={currentStyle.base_text_color || '#ffffff'}
                      onChange={(e) => setStyles({ ...currentStyle, base_text_color: e.target.value })}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Conditional Shadow / Outline Controls */}
            {(currentStyle.shadow || currentStyle.outline) && (
              <div className="space-y-3 rounded-lg bg-[#09080d] border border-[#1f1e29] p-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-zinc-300 text-xs font-medium">
                      {currentStyle.shadow && currentStyle.outline
                        ? 'สีเงา & ขอบตัวอักษร'
                        : currentStyle.outline
                        ? 'สีขอบตัวอักษร'
                        : 'สีเงาตัวอักษร'}
                    </label>
                    <span className="rounded bg-[#121118] border border-[#252333] px-1.5 py-0.5 text-[10px] font-mono text-zinc-300 uppercase">
                      {currentStyle.outline ? currentStyle.outline_color || currentStyle.shadow_color : currentStyle.shadow_color}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {['#000000', '#ffffff', '#ef4444', '#eab308', '#22d3ee', '#22c55e'].map((c) => {
                      const activeCol = (currentStyle.outline ? currentStyle.outline_color || currentStyle.shadow_color : currentStyle.shadow_color).toLowerCase();
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setStyles({ ...currentStyle, shadow_color: c, outline_color: c })}
                          style={{ backgroundColor: c }}
                          className={`h-5 w-5 rounded-[4px] border border-white/20 transition-transform cursor-pointer ${
                            activeCol === c
                              ? 'ring-2 ring-[#a78bfa] ring-offset-1 ring-offset-[#09080d] scale-105'
                              : 'hover:scale-105 opacity-85 hover:opacity-100'
                          }`}
                        />
                      );
                    })}
                    {(() => {
                      const presets = ['#000000', '#ffffff', '#ef4444', '#eab308', '#22d3ee', '#22c55e'];
                      const activeCol = (currentStyle.outline ? currentStyle.outline_color || currentStyle.shadow_color : currentStyle.shadow_color);
                      const isCustom = !presets.includes(activeCol.toLowerCase());
                      return (
                        <label
                          className={`flex h-5 w-5 items-center justify-center rounded-[4px] cursor-pointer text-xs font-bold transition-colors border ${
                            isCustom
                              ? 'ring-2 ring-[#a78bfa] scale-105 border-white/30'
                              : 'bg-[#15141d] border-[#292738] text-zinc-300 hover:bg-[#1f1d2b] hover:text-white'
                          }`}
                          style={isCustom ? { backgroundColor: activeCol } : {}}
                          title="เลือกสีเอง"
                        >
                          {!isCustom && '+'}
                          <input
                            type="color"
                            value={activeCol}
                            onChange={(e) =>
                              setStyles({ ...currentStyle, shadow_color: e.target.value, outline_color: e.target.value })
                            }
                            className="hidden"
                          />
                        </label>
                      );
                    })()}
                  </div>
                </div>

                {currentStyle.outline && (
                  <div>
                    <div className="flex items-center justify-between text-zinc-300 mb-1.5 text-xs">
                      <span>ความหนาขอบตัวอักษร</span>
                      <span className="rounded bg-[#121118] border border-[#252333] px-1.5 py-0.5 text-[10px] font-mono text-[#c4b5fd] tabular-nums">
                        {currentStyle.outline_thickness ?? 3}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="8"
                      value={currentStyle.outline_thickness ?? 3}
                      onChange={(e) => setStyles({ ...currentStyle, outline_thickness: parseInt(e.target.value) })}
                      className="w-full h-1.5 rounded-sm accent-[#8b5cf6] cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #8b5cf6 ${outlineThicknessRatio * 100}%, #1c1b24 ${outlineThicknessRatio * 100}%)`,
                      }}
                    />
                  </div>
                )}

                {currentStyle.shadow && (
                  <div>
                    <div className="flex items-center justify-between text-zinc-300 mb-1.5 text-xs">
                      <span>ความหนาเงา</span>
                      <span className="rounded bg-[#121118] border border-[#252333] px-1.5 py-0.5 text-[10px] font-mono text-[#c4b5fd] tabular-nums">
                        {currentStyle.shadow_thickness}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={currentStyle.shadow_thickness}
                      onChange={(e) => setStyles({ ...currentStyle, shadow_thickness: parseInt(e.target.value) })}
                      className="w-full h-1.5 rounded-sm accent-[#8b5cf6] cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #8b5cf6 ${shadowThicknessRatio * 100}%, #1c1b24 ${shadowThicknessRatio * 100}%)`,
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Background & Opacity */}
            <div className="pt-2 border-t border-[#1d1c26] space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-zinc-300 text-xs font-medium">พื้นหลังกล่องข้อความ</label>
                <button
                  type="button"
                  onClick={() => setStyles({ ...currentStyle, bg_opacity: currentStyle.bg_opacity === 0 ? 0.7 : 0 })}
                  className={`rounded-md px-2 py-0.5 text-[10px] font-mono font-semibold transition-colors border cursor-pointer ${
                    currentStyle.bg_opacity === 0
                      ? 'bg-[#211d32] text-[#c4b5fd] border-[#8b5cf6]/50'
                      : 'bg-[#09080d] text-zinc-400 border-[#252333] hover:text-white'
                  }`}
                >
                  {currentStyle.bg_opacity === 0 ? 'โปร่งใส (ปิด)' : 'ปิดพื้นหลัง'}
                </button>
              </div>

              <div className="flex items-center gap-2">
                {['#000000', '#1e293b', '#581c87', '#7f1d1d'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() =>
                      setStyles({
                        ...currentStyle,
                        bg_color: c,
                        bg_opacity: currentStyle.bg_opacity > 0 ? currentStyle.bg_opacity : 0.7,
                      })
                    }
                    style={{ backgroundColor: c }}
                    className={`h-6 w-6 rounded-[5px] border border-white/20 transition-transform cursor-pointer ${
                      currentStyle.bg_color === c && currentStyle.bg_opacity > 0
                        ? 'ring-2 ring-[#a78bfa] ring-offset-2 ring-offset-[#0f0e15] scale-105'
                        : 'hover:scale-105 opacity-80 hover:opacity-100'
                    }`}
                  />
                ))}
                <label
                  className="flex h-6 w-6 items-center justify-center rounded-[5px] bg-[#15141d] border border-[#292738] text-zinc-300 hover:bg-[#1f1d2b] hover:text-white cursor-pointer text-xs font-bold transition-colors"
                  title="เลือกสีพื้นหลังเอง"
                >
                  +
                  <input
                    type="color"
                    value={currentStyle.bg_color}
                    onChange={(e) =>
                      setStyles({
                        ...currentStyle,
                        bg_color: e.target.value,
                        bg_opacity: currentStyle.bg_opacity > 0 ? currentStyle.bg_opacity : 0.7,
                      })
                    }
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <div className="flex items-center justify-between text-zinc-300 mb-1.5 text-xs font-medium">
                  <span>ความทึบแสงพื้นหลัง</span>
                  <span className="rounded bg-[#09080d] border border-[#252333] px-1.5 py-0.5 text-[10px] font-mono font-semibold text-[#c4b5fd] tabular-nums">
                    {Math.round(currentStyle.bg_opacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={currentStyle.bg_opacity}
                  onChange={(e) => setStyles({ ...currentStyle, bg_opacity: parseFloat(e.target.value) })}
                  className="w-full h-1.5 rounded-sm accent-[#8b5cf6] cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #8b5cf6 ${bgOpacityRatio * 100}%, #1c1b24 ${bgOpacityRatio * 100}%)`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* CARD 3: POSITION & ANIMATION */}
          <div className="rounded-xl bg-[#0f0e15] border border-[#1d1c26] p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="text-[#a78bfa]">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                ตำแหน่ง & แอนิเมชัน
              </span>
              <span className="text-[9.5px] font-mono text-zinc-500">MOTION</span>
            </div>

            {/* Position */}
            <div>
              <div className="flex items-center justify-between text-zinc-300 mb-1.5 text-xs font-medium">
                <label>ตำแหน่งซับไตเติล</label>
                <span className="text-[10px] text-zinc-500">ลากปรับบนจอวิดีโอได้</span>
              </div>
              <div className="grid grid-cols-3 gap-1 rounded-lg bg-[#09080d] border border-[#1f1e29] p-1">
                {POSITION_OPTIONS.map((pos) => {
                  const isActive =
                    currentStyle.position === pos.id ||
                    (pos.id === 'bottom' && (currentStyle.custom_y === 82 || currentStyle.custom_y === 85)) ||
                    (pos.id === 'center' && currentStyle.custom_y === 50) ||
                    (pos.id === 'custom' && currentStyle.custom_y === 12);

                  return (
                    <button
                      key={pos.id}
                      type="button"
                      onClick={() => {
                        setStyles({
                          ...currentStyle,
                          position: pos.id,
                          custom_x: 50,
                          custom_y: pos.y,
                        });
                      }}
                      className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition-colors border cursor-pointer ${
                        isActive
                          ? 'bg-[#7c3aed] text-white border-[#8b5cf6]'
                          : 'text-zinc-400 border-transparent hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      <span className="inline-flex h-3.5 w-3 rounded-[2px] border border-current/60 p-[1.5px] items-center justify-center">
                        <span
                          className={`block w-full h-[2px] rounded-full bg-current ${
                            pos.align === 'top'
                              ? 'self-start'
                              : pos.align === 'center'
                              ? 'self-center'
                              : 'self-end'
                          }`}
                        />
                      </span>
                      <span>{pos.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Animation */}
            <div>
              <label className="block text-zinc-300 mb-1.5 text-xs font-medium">แอนิเมชันเปิดตัว</label>
              <div className="grid grid-cols-2 gap-1.5">
                {ANIMATION_OPTIONS.map((anim) => {
                  const isSelected = currentStyle.animation === anim.id;
                  return (
                    <button
                      key={anim.id}
                      type="button"
                      onClick={() => setStyles({ ...currentStyle, animation: anim.id })}
                      className={`flex items-center justify-between rounded-lg py-2 px-2.5 text-left text-xs font-semibold transition-colors border cursor-pointer ${
                        isSelected
                          ? 'bg-[#191429] text-white border-[#8b5cf6]/70'
                          : 'bg-[#09080d] text-zinc-300 border-[#1f1e29] hover:text-white hover:border-[#323042]'
                      }`}
                    >
                      <span className="truncate">{anim.label}</span>
                      <span
                        className={`text-[8.5px] font-mono px-1 py-0.2 rounded ${
                          isSelected
                            ? 'bg-[#8b5cf6]/25 text-[#c4b5fd]'
                            : 'bg-[#14131c] text-zinc-500'
                        }`}
                      >
                        {anim.tag}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        <CustomScrollbar scrollRef={styleScrollRef} />
      </div>
    </div>
  );
}

export default React.memo(StylePanel);
