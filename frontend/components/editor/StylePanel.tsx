'use client';

import React from 'react';
import { SubtitleSegment, SubtitleStyle, SubtitlePosition, SubtitleAnimation } from './types';
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

const POSITION_OPTIONS: { id: SubtitlePosition; label: string }[] = [
  { id: 'bottom', label: 'ล่าง' },
  { id: 'center', label: 'กลาง' },
  { id: 'custom', label: 'บน' },
];

const ANIMATION_OPTIONS: { id: SubtitleAnimation; label: string }[] = [
  { id: 'none', label: 'ไม่มี' },
  { id: 'fade', label: 'Fade In/Out' },
  { id: 'pop', label: 'Pop / Zoom' },
  { id: 'typewriter', label: 'พิมพ์ดีด' },
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

  return (
    <div
      style={width ? { width: `${width}px` } : undefined}
      className={`relative flex flex-col min-h-0 flex-shrink-0 overflow-hidden select-none bg-[#13121b] ${width ? '' : 'w-80'}`}
    >
      {/* 1. Header Bar with Panel Name & Compact Mode Switcher */}
      <div className="flex h-12 flex-shrink-0 items-center justify-between border-b border-[#1c1a28] bg-[#13121b] pl-3.5 pr-2 select-none">
        <h2 className="text-sm font-semibold text-white">สไตล์</h2>

        {/* Mode Switcher Tabs in Header Right */}
        <div className="flex items-center gap-1 rounded-xl bg-[#1a1827] p-1 ml-auto">
          <button
            type="button"
            onClick={() => setSelectedSubtitleId(null)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              selectedSubtitleId === null
                ? 'bg-[#2d2250] text-[#c4b5fd] shadow-sm'
                : 'text-white/80 hover:text-white hover:bg-white/[0.04]'
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
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              selectedSubtitleId !== null
                ? 'bg-[#2d2250] text-[#c4b5fd] shadow-sm'
                : 'text-white/80 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            เฉพาะส่วน
          </button>
        </div>
      </div>

      {/* 2. Scrollable Inspector Content */}
      <div className="relative flex-1 min-h-0 overflow-hidden">
        <div ref={styleScrollRef} className="panel-scroll-area h-full overflow-y-auto p-3.5 space-y-3.5 custom-scrollbar text-sm">

          {/* Active Target Banner */}
          {selectedSubtitleId === null ? (
            <div className="flex items-center justify-between rounded-xl bg-[#1a1827] px-3.5 h-10 text-sm">
              <div className="flex items-center gap-2">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#c4b5fd] flex-shrink-0">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span className="font-bold text-sm text-white">กำลังแก้ไข : ซับไตเติลทั้งหมด</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-xl bg-[#1a1827] px-3.5 h-10 text-sm">
              <div className="flex items-center gap-2">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#c4b5fd] flex-shrink-0">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span className="font-bold text-sm text-white">กำลังแก้ไข : #{selectedSubtitleIndex + 1}</span>
              </div>
              <button
                type="button"
                onClick={() => handleResetToGlobal(selectedSubtitleId)}
                className="text-xs text-[#c4b5fd] hover:text-white transition-colors font-semibold"
                title="รีเซ็ตสไตล์ของประโยคนี้ให้เหมือนทั้งคลิป"
              >
                รีเซ็ต
              </button>
            </div>
          )}

        {/* 1. Font Family with Custom Dropdown & Upload */}
        <div>
          <label className="block text-white mb-1.5 text-sm font-medium">ฟอนต์</label>
          <FontSelector
            value={styles.font_family}
            onChange={(fontName) => setStyles({ ...styles, font_family: fontName })}
          />
        </div>

        {/* 2. Font Size */}
        <div>
          <div className="flex justify-between text-white mb-1.5 text-sm font-medium">
            <span>ขนาด</span>
            <span className="text-sm tabular-nums font-semibold text-[#c4b5fd] antialiased">{styles.font_size}px</span>
          </div>
          <input
            type="range"
            min="24"
            max="120"
            value={styles.font_size}
            onChange={(e) => setStyles({ ...styles, font_size: parseInt(e.target.value) })}
            className="w-full h-1.5 bg-[#1c1a28] rounded accent-purple-400 cursor-pointer"
          />
        </div>

        {/* 3. Text Styles */}
        <div>
          <label className="block text-white mb-1.5 text-sm font-medium">รูปแบบตัวอักษร</label>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setStyles({ ...styles, bold: !styles.bold })}
              className={`flex-1 rounded-lg h-9 font-bold text-sm transition-all ${
                styles.bold ? 'bg-[#2d2250] text-[#c4b5fd] shadow-sm' : 'bg-[#1a1827] text-white/80 hover:text-white hover:bg-[#252236]'
              }`}
            >
              B
            </button>
            <button
              type="button"
              onClick={() => setStyles({ ...styles, italic: !styles.italic })}
              className={`flex-1 rounded-lg h-9 italic text-sm transition-all ${
                styles.italic ? 'bg-[#2d2250] text-[#c4b5fd] shadow-sm' : 'bg-[#1a1827] text-white/80 hover:text-white hover:bg-[#252236]'
              }`}
            >
              I
            </button>
            <button
              type="button"
              onClick={() => setStyles({ ...styles, underline: !styles.underline })}
              className={`flex-1 rounded-lg h-9 underline text-sm transition-all ${
                styles.underline ? 'bg-[#2d2250] text-[#c4b5fd] shadow-sm' : 'bg-[#1a1827] text-white/80 hover:text-white hover:bg-[#252236]'
              }`}
            >
              U
            </button>
            <button
              type="button"
              onClick={() => setStyles({ ...styles, shadow: !styles.shadow })}
              className={`flex-1 rounded-lg h-9 text-xs transition-all ${
                styles.shadow ? 'bg-[#2d2250] text-[#c4b5fd] font-semibold shadow-sm' : 'bg-[#1a1827] text-white/80 hover:text-white hover:bg-[#252236]'
              }`}
            >
              เงา
            </button>
            <button
              type="button"
              onClick={() => setStyles({ ...styles, outline: !styles.outline })}
              className={`flex-1 rounded-lg h-9 text-xs transition-all ${
                styles.outline ? 'bg-[#2d2250] text-[#c4b5fd] font-semibold shadow-sm' : 'bg-[#1a1827] text-white/80 hover:text-white hover:bg-[#252236]'
              }`}
            >
              ขอบ
            </button>
          </div>
        </div>

        {/* 4. Shadow Controls (Shown only when styles.shadow is enabled) */}
        {styles.shadow && (
          <div className="space-y-2.5 rounded-xl bg-[#1a1827] p-3">
            <div>
              <label className="block text-white mb-2.5 text-xs font-medium">สีเงา</label>
              <div className="flex items-center gap-2">
                {['#000000', '#ef4444', '#3b82f6', '#eab308', '#22c55e', '#ffffff'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setStyles({ ...styles, shadow_color: c, shadow: true })}
                    style={{ backgroundColor: c }}
                    className={`h-5 w-5 rounded-full transition-all ${
                      styles.shadow_color === c ? 'ring-2 ring-[#a78bfa] scale-105' : 'hover:scale-105'
                    }`}
                  />
                ))}
                {(() => {
                  const presets = ['#000000', '#ef4444', '#3b82f6', '#eab308', '#22c55e', '#ffffff'];
                  const isCustom = !presets.includes(styles.shadow_color);
                  return (
                    <label
                      className={`flex h-5 w-5 items-center justify-center rounded-full cursor-pointer text-xs transition-all ${
                        isCustom
                          ? 'ring-2 ring-[#a78bfa] scale-105'
                          : 'bg-[#252236] text-purple-400 hover:bg-[#2e2a44] hover:text-white'
                      }`}
                      style={isCustom ? { backgroundColor: styles.shadow_color } : {}}
                      title="เลือกสีเอง"
                    >
                      {!isCustom && '+'}
                      <input
                        type="color"
                        value={styles.shadow_color}
                        onChange={(e) => setStyles({ ...styles, shadow_color: e.target.value, shadow: true })}
                        className="hidden"
                      />
                    </label>
                  );
                })()}
              </div>
            </div>

            <div>
              <div className="flex justify-between text-white mb-1 text-xs">
                <span>ความหนาเงา</span>
                <span className="text-xs tabular-nums font-medium text-[#c4b5fd] antialiased">{styles.shadow_thickness}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={styles.shadow_thickness}
                onChange={(e) => setStyles({ ...styles, shadow_thickness: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-[#1c1a28] rounded accent-purple-400 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* 5. Outline / Border Controls (Shown only when styles.outline is enabled) */}
        {styles.outline && (
          <div className="space-y-2.5 rounded-xl bg-[#1a1827] p-3">
            <div>
              <label className="block text-white mb-2.5 text-xs font-medium">สีขอบตัวอักษร</label>
              <div className="flex items-center gap-2">
                {['#000000', '#ffffff', '#ef4444', '#eab308', '#3b82f6', '#22c55e'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setStyles({ ...styles, shadow_color: c, outline: true })}
                    style={{ backgroundColor: c }}
                    className={`h-5 w-5 rounded-full transition-all ${
                      styles.shadow_color === c ? 'ring-2 ring-[#a78bfa] scale-105' : 'hover:scale-105'
                    }`}
                  />
                ))}
                {(() => {
                  const presets = ['#000000', '#ffffff', '#ef4444', '#eab308', '#3b82f6', '#22c55e'];
                  const isCustom = !presets.includes(styles.shadow_color);
                  return (
                    <label
                      className={`flex h-5 w-5 items-center justify-center rounded-full cursor-pointer text-xs transition-all ${
                        isCustom
                          ? 'ring-2 ring-[#a78bfa] scale-105'
                          : 'bg-[#252236] text-purple-400 hover:bg-[#2e2a44] hover:text-white'
                      }`}
                      style={isCustom ? { backgroundColor: styles.shadow_color } : {}}
                      title="เลือกสีเอง"
                    >
                      {!isCustom && '+'}
                      <input
                        type="color"
                        value={styles.shadow_color}
                        onChange={(e) => setStyles({ ...styles, shadow_color: e.target.value, outline: true })}
                        className="hidden"
                      />
                    </label>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* 6. Text Color */}
        <div>
          <label className="block text-white mb-2.5 text-sm font-medium">สีตัวอักษร</label>
          <div className="flex items-center gap-2">
            {['#ffffff', '#facc15', '#4ade80', '#f472b6', '#22d3ee', '#fb923c'].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setStyles({ ...styles, text_color: c })}
                style={{ backgroundColor: c }}
                className={`h-5 w-5 rounded-full transition-all ${
                  styles.text_color === c ? 'ring-2 ring-[#a78bfa] scale-105' : 'hover:scale-105'
                }`}
              />
            ))}
            {(() => {
              const presets = ['#ffffff', '#facc15', '#4ade80', '#f472b6', '#22d3ee', '#fb923c'];
              const isCustom = !presets.includes(styles.text_color);
              return (
                <label
                  className={`flex h-5 w-5 items-center justify-center rounded-full cursor-pointer text-xs transition-all ${
                    isCustom
                      ? 'ring-2 ring-[#a78bfa] scale-105'
                      : 'bg-[#252236] text-purple-400 hover:bg-[#2e2a44] hover:text-white'
                  }`}
                  style={isCustom ? { backgroundColor: styles.text_color } : {}}
                  title="เลือกสีเอง"
                >
                  {!isCustom && '+'}
                  <input
                    type="color"
                    value={styles.text_color}
                    onChange={(e) => setStyles({ ...styles, text_color: e.target.value })}
                    className="hidden"
                  />
                </label>
              );
            })()}
          </div>
        </div>

        {/* 7. Background & Opacity */}
        <div>
          <label className="block text-white mb-1.5 text-sm font-medium">พื้นหลัง</label>
          <div className="flex items-center gap-2 mb-2">
            {['#000000', '#1e293b', '#581c87', '#7f1d1d'].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setStyles({ ...styles, bg_color: c, bg_opacity: 0.7 })}
                style={{ backgroundColor: c }}
                className={`h-5 w-5 rounded transition-all ${
                  styles.bg_color === c && styles.bg_opacity > 0 ? 'ring-2 ring-[#a78bfa] scale-105' : 'hover:scale-105'
                }`}
              />
            ))}
            <button
              type="button"
              onClick={() => setStyles({ ...styles, bg_opacity: 0 })}
              className={`rounded-lg px-2.5 py-1 text-xs transition-all ${
                styles.bg_opacity === 0 ? 'bg-[#2d2250] text-[#c4b5fd] font-semibold shadow-sm' : 'bg-[#1a1827] text-white/80 hover:text-white hover:bg-[#252236]'
              }`}
            >
              โปร่งใส
            </button>
            <label className="flex h-5 w-5 items-center justify-center rounded bg-[#252236] text-purple-400 hover:bg-[#2e2a44] hover:text-white cursor-pointer text-xs">
              +
              <input
                type="color"
                value={styles.bg_color}
                onChange={(e) => setStyles({ ...styles, bg_color: e.target.value, bg_opacity: 0.7 })}
                className="hidden"
              />
            </label>
          </div>

          <div className="flex justify-between text-white mb-1.5 text-sm font-medium">
            <span>ความโปร่งใสพื้นหลัง</span>
            <span className="text-sm tabular-nums font-semibold text-[#c4b5fd] antialiased">{Math.round(styles.bg_opacity * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={styles.bg_opacity}
            onChange={(e) => setStyles({ ...styles, bg_opacity: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-[#1c1a28] rounded accent-purple-400 cursor-pointer"
          />
        </div>

        {/* Position */}
        <div>
          <div className="flex items-center justify-between text-white mb-1.5 text-sm font-medium">
            <label>ตำแหน่ง</label>
            <span className="text-xs text-gray-400">สามารถลากบนจอได้</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {POSITION_OPTIONS.map((pos) => {
              const isActive =
                styles.position === pos.id ||
                (pos.id === 'bottom' && styles.custom_y === 85) ||
                (pos.id === 'center' && styles.custom_y === 50) ||
                (pos.id === 'custom' && styles.custom_y === 12);

              return (
                <button
                  key={pos.id}
                  type="button"
                  onClick={() => {
                    const targetY = pos.id === 'bottom' ? 85 : pos.id === 'center' ? 50 : 12;
                    setStyles({
                      ...styles,
                      position: pos.id,
                      custom_x: 50,
                      custom_y: targetY,
                    });
                  }}
                  className={`rounded-lg py-2 text-center text-sm transition-all ${
                    isActive
                      ? 'bg-[#2d2250] text-[#c4b5fd] font-semibold shadow-sm'
                      : 'bg-[#1a1827] text-white/80 hover:text-white hover:bg-[#252236]'
                  }`}
                >
                  {pos.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 10. Animation */}
        <div>
          <label className="block text-white mb-1.5 text-sm font-medium">แอนิเมชัน</label>
          <div className="grid grid-cols-2 gap-1.5">
            {ANIMATION_OPTIONS.map((anim) => (
              <button
                key={anim.id}
                type="button"
                onClick={() => setStyles({ ...styles, animation: anim.id })}
                className={`rounded-lg py-2 text-center text-sm transition-all ${
                  styles.animation === anim.id
                    ? 'bg-[#2d2250] text-[#c4b5fd] font-semibold shadow-sm'
                    : 'bg-[#1a1827] text-white/80 hover:text-white hover:bg-[#252236]'
                }`}
              >
                {anim.label}
              </button>
            ))}
          </div>
        </div>
        </div>
        <CustomScrollbar scrollRef={styleScrollRef} />
      </div>
    </div>
  );
}

export default React.memo(StylePanel);