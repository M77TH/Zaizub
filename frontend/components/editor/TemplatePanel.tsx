'use client';

import React from 'react';
import { SubtitleStyle, SubtitleSegment } from './types';
import CustomScrollbar from '@/components/ui/CustomScrollbar';
import { useSmoothScrollElement } from '@/components/providers/SmoothScroll';

export interface SubtitleTemplate {
  id: string;
  name: string;
  category: string;
  previewText: string;
  tokens: string[];
  highlightIndex: number;
  mode: 'tiktok' | 'badge' | 'karaoke' | 'danger' | 'frosted' | 'minimal' | 'warm' | 'cinema';
  style: SubtitleStyle;
  badge?: string;
}

export const SUBTITLE_TEMPLATES: SubtitleTemplate[] = [
  {
    id: 'tiktok-viral',
    name: 'TikTok Viral',
    category: 'ยอดนิยม TikTok',
    previewText: 'วิธีทำคลิปให้ คนหยุดดู จนจบ ⚡',
    tokens: ['วิธีทำคลิปให้', 'คนหยุดดู', '100%', 'ทันที'],
    highlightIndex: 1,
    mode: 'tiktok',
    badge: 'POPULAR',
    style: {
      font_family: 'Kanit',
      font_size: 72,
      bold: true,
      italic: false,
      underline: false,
      shadow: true,
      outline: true,
      shadow_color: '#000000',
      shadow_thickness: 4,
      outline_color: '#000000',
      outline_thickness: 4,
      text_color: '#facc15',
      base_text_color: '#ffffff',
      word_highlight: true,
      preset_mode: 'tiktok',
      bg_color: '#000000',
      bg_opacity: 0,
      padding_x: 24,
      padding_y: 12,
      border_radius: 12,
      line_height: 1.35,
      letter_spacing: 0,
      uppercase: false,
      position: 'bottom',
      custom_x: 50,
      custom_y: 82,
      box_width: 86,
      animation: 'pop',
    },
  },
  {
    id: 'mrbeast-badge',
    name: 'MrBeast Badge',
    category: 'ไฮไลท์ป้ายสี',
    previewText: 'ดูให้จบ เทคนิคลับนี้ ปังแน่นอน 💥',
    tokens: ['เทคนิคลับ', 'ที่ครีเอเตอร์', 'ตัวท็อป', 'แอบใช้'],
    highlightIndex: 2,
    mode: 'badge',
    badge: 'VIRAL BADGE',
    style: {
      font_family: 'Kanit',
      font_size: 72,
      bold: true,
      italic: false,
      underline: false,
      shadow: true,
      outline: true,
      shadow_color: '#000000',
      shadow_thickness: 4,
      outline_color: '#000000',
      outline_thickness: 4,
      text_color: '#22c55e',
      base_text_color: '#ffffff',
      word_highlight: true,
      preset_mode: 'badge',
      badge_color: '#22c55e',
      bg_color: '#000000',
      bg_opacity: 0,
      padding_x: 24,
      padding_y: 12,
      border_radius: 12,
      line_height: 1.35,
      letter_spacing: 0,
      uppercase: false,
      position: 'bottom',
      custom_x: 50,
      custom_y: 82,
      box_width: 86,
      animation: 'pop',
    },
  },
  {
    id: 'submagic-karaoke',
    name: 'Karaoke Glow',
    category: 'เรืองแสง ไซเบอร์',
    previewText: 'ไฮไลท์คำ เรืองแสง สไตล์ AI 🔮',
    tokens: ['ร้องตามได้', 'เรืองแสงไซเบอร์', 'สไตล์', 'AI'],
    highlightIndex: 1,
    mode: 'karaoke',
    badge: 'NEON GLOW',
    style: {
      font_family: 'Prompt',
      font_size: 70,
      bold: true,
      italic: false,
      underline: false,
      shadow: true,
      outline: true,
      shadow_color: '#22d3ee',
      shadow_thickness: 5,
      outline_color: '#000000',
      outline_thickness: 3,
      text_color: '#22d3ee',
      base_text_color: '#ffffff',
      word_highlight: true,
      preset_mode: 'karaoke',
      bg_color: '#000000',
      bg_opacity: 0,
      padding_x: 20,
      padding_y: 10,
      border_radius: 8,
      line_height: 1.35,
      letter_spacing: 0,
      uppercase: false,
      position: 'bottom',
      custom_x: 50,
      custom_y: 82,
      box_width: 86,
      animation: 'pop',
    },
  },
  {
    id: 'danger-hook',
    name: 'Danger Red Hook',
    category: 'เตือนภัย & ดึงดูด',
    previewText: 'หยุดเลื่อนดูสิ่งนี้ ห้ามพลาดคลิปนี้ ⚠️',
    tokens: ['คำเตือน:', 'ห้ามทำแบบนี้', 'บนคลิป', 'เด็ดขาด!'],
    highlightIndex: 1,
    mode: 'danger',
    badge: 'STOP SCROLL',
    style: {
      font_family: 'Kanit',
      font_size: 72,
      bold: true,
      italic: false,
      underline: false,
      shadow: true,
      outline: true,
      shadow_color: '#000000',
      shadow_thickness: 4,
      outline_color: '#000000',
      outline_thickness: 4,
      text_color: '#ef4444',
      base_text_color: '#ffffff',
      word_highlight: true,
      preset_mode: 'danger',
      bg_color: '#000000',
      bg_opacity: 0,
      padding_x: 24,
      padding_y: 12,
      border_radius: 12,
      line_height: 1.35,
      letter_spacing: 0,
      uppercase: false,
      position: 'bottom',
      custom_x: 50,
      custom_y: 82,
      box_width: 86,
      animation: 'shake',
    },
  },
  {
    id: 'ali-abdaal',
    name: 'Ali Abdaal Studio',
    category: 'เรียบหรู น่าเชื่อถือ',
    previewText: 'สตูดิโอคลีนๆ เรียบหรู สบายตา ☕',
    tokens: ['นิสัย 1 อย่าง', 'ที่เปลี่ยนชีวิต', 'ไปตลอดกาล'],
    highlightIndex: 1,
    mode: 'frosted',
    badge: 'FROSTED',
    style: {
      font_family: 'Noto Sans Thai',
      font_size: 62,
      bold: true,
      italic: false,
      underline: false,
      shadow: true,
      outline: false,
      shadow_color: '#000000',
      shadow_thickness: 2,
      outline_color: '#000000',
      outline_thickness: 0,
      text_color: '#fde047',
      base_text_color: '#ffffff',
      word_highlight: true,
      preset_mode: 'frosted',
      bg_color: '#1e1b2e',
      bg_opacity: 0.72,
      padding_x: 22,
      padding_y: 10,
      border_radius: 12,
      line_height: 1.35,
      letter_spacing: 0,
      uppercase: false,
      position: 'bottom',
      custom_x: 50,
      custom_y: 82,
      box_width: 86,
      animation: 'fade',
    },
  },
  {
    id: 'clean-minimal',
    name: 'Minimal Clean',
    category: 'สไลด์ขึ้น เต็มประโยค',
    previewText: 'สไตล์มินิมอล เรียบหรู คมชัด สบายตา ✨',
    tokens: ['เรียบหรู', 'คมชัด', 'สบายตา', 'ทุกช็อต'],
    highlightIndex: 1,
    mode: 'minimal',
    badge: 'CLEAN',
    style: {
      font_family: 'Noto Sans Thai',
      font_size: 60,
      bold: true,
      italic: false,
      underline: false,
      shadow: true,
      outline: false,
      shadow_color: '#000000',
      shadow_thickness: 2,
      outline_color: '#000000',
      outline_thickness: 0,
      text_color: '#ffffff',
      base_text_color: '#ffffff',
      word_highlight: false,
      preset_mode: 'minimal',
      bg_color: '#000000',
      bg_opacity: 0,
      padding_x: 20,
      padding_y: 10,
      border_radius: 8,
      line_height: 1.35,
      letter_spacing: 0,
      uppercase: false,
      position: 'bottom',
      custom_x: 50,
      custom_y: 82,
      box_width: 86,
      animation: 'slide-up',
    },
  },
  {
    id: 'podcast-warm',
    name: 'Podcast Warm',
    category: 'พอดแคสต์ & คุยกัน',
    previewText: 'โทนอุ่น ฟังสบาย พอดแคสต์ 🎙️',
    tokens: ['โทนอุ่น', 'ฟังสบาย', 'สไตล์พอดแคสต์'],
    highlightIndex: 1,
    mode: 'warm',
    badge: 'PODCAST',
    style: {
      font_family: 'Prompt',
      font_size: 66,
      bold: true,
      italic: false,
      underline: false,
      shadow: true,
      outline: false,
      shadow_color: '#000000',
      shadow_thickness: 2,
      outline_color: '#000000',
      outline_thickness: 0,
      text_color: '#fbbf24',
      base_text_color: '#ffffff',
      word_highlight: true,
      preset_mode: 'warm',
      bg_color: '#000000',
      bg_opacity: 0.52,
      padding_x: 22,
      padding_y: 10,
      border_radius: 12,
      line_height: 1.35,
      letter_spacing: 0,
      uppercase: false,
      position: 'bottom',
      custom_x: 50,
      custom_y: 82,
      box_width: 86,
      animation: 'fade',
    },
  },
  {
    id: 'cinematic-movie',
    name: 'Cinematic Movie',
    category: 'ภาพยนตร์ & สารคดี',
    previewText: 'ซับภาพยนตร์ สไตล์หนัง สารคดี 🎬',
    tokens: ['ซับภาพยนตร์', 'สไตล์หนัง', 'สารคดี'],
    highlightIndex: 1,
    mode: 'cinema',
    badge: 'CINEMA',
    style: {
      font_family: 'Sarabun',
      font_size: 58,
      bold: false,
      italic: false,
      underline: false,
      shadow: true,
      outline: false,
      shadow_color: '#000000',
      shadow_thickness: 2,
      outline_color: '#000000',
      outline_thickness: 0,
      text_color: '#f8fafc',
      base_text_color: '#f8fafc',
      word_highlight: false,
      preset_mode: 'cinema',
      bg_color: '#000000',
      bg_opacity: 0,
      padding_x: 20,
      padding_y: 8,
      border_radius: 6,
      line_height: 1.35,
      letter_spacing: 0,
      uppercase: false,
      position: 'bottom',
      custom_x: 50,
      custom_y: 82,
      box_width: 86,
      animation: 'fade',
    },
  },
];

interface TemplatePanelProps {
  width?: number;
  onApplyTemplate: (template: SubtitleTemplate) => void;
  selectedSubtitle?: SubtitleSegment;
  selectedSubtitleIndex: number;
  currentStyle?: SubtitleStyle;
}

const THREE_D_STROKE =
  '0 3px 0 #000000, -1px -1px 0 #000000, 1px -1px 0 #000000, -1px 1px 0 #000000, 1px 1px 0 #000000';

function TemplatePanel({
  width,
  onApplyTemplate,
  selectedSubtitle,
  selectedSubtitleIndex,
  currentStyle,
}: TemplatePanelProps) {
  const { ref: templateScrollRef } = useSmoothScrollElement<HTMLDivElement>();

  return (
    <div
      className="relative flex flex-col min-h-0 flex-1 md:flex-shrink-0 overflow-hidden select-none bg-[#0a090e] w-full md:w-auto"
      style={typeof window !== 'undefined' && window.innerWidth >= 768 && width ? { width: `${width}px` } : undefined}
    >
      {/* 1. Fixed Header Bar */}
      <div className="flex h-10 flex-shrink-0 items-center justify-between border-b border-[#1b1a24] bg-[#09080d] px-3.5 select-none">
        <h2 className="font-display text-xs font-bold text-white tracking-tight">เทมเพลตครีเอเตอร์</h2>
        <span className="font-mono text-[10px] font-semibold text-zinc-400">
          {selectedSubtitle ? `#${selectedSubtitleIndex + 1} SELECTED` : 'ALL CLIPS'}
        </span>
      </div>

      {/* 2. Scrollable Templates List (Pure Calibration Specimens) */}
      <div className="relative flex-1 min-h-0 overflow-hidden">
        <div ref={templateScrollRef} className="panel-scroll-area h-full overflow-y-auto p-3 space-y-2.5 custom-scrollbar text-xs">
          {SUBTITLE_TEMPLATES.map((tmpl) => {
            const isActive = Boolean(
              currentStyle &&
                (currentStyle.preset_mode === tmpl.mode ||
                  (currentStyle.font_family === tmpl.style.font_family &&
                    currentStyle.text_color.toLowerCase() === tmpl.style.text_color.toLowerCase() &&
                    currentStyle.animation === tmpl.style.animation &&
                    currentStyle.outline === tmpl.style.outline))
            );

            return (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => onApplyTemplate(tmpl)}
                className={`group relative w-full flex flex-col justify-between rounded-xl p-2.5 transition-colors duration-150 text-left border cursor-pointer ${
                  isActive
                    ? 'bg-[#151221] border-[#8b5cf6]/70'
                    : 'bg-[#0f0e15] hover:bg-[#14131b] border-[#1d1c26] hover:border-white/25'
                }`}
              >
                {/* Top Metadata Header */}
                <div className="flex items-center justify-between mb-2 px-0.5 gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-display font-bold text-white text-xs truncate">{tmpl.name}</span>
                    <span className="text-[10px] text-zinc-500 truncate">
                      · {tmpl.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 font-mono text-[9px]">
                    <span className={tmpl.style.word_highlight ? 'text-[#c4b5fd]' : 'text-zinc-500'}>
                      {tmpl.style.word_highlight ? 'WORD' : 'LINE'}
                    </span>
                    {tmpl.badge && (
                      <span className="text-zinc-500">{tmpl.badge}</span>
                    )}
                    {isActive && (
                      <span className="h-1.5 w-1.5 rounded-[1px] bg-[#a78bfa]" />
                    )}
                  </div>
                </div>

                {/* Clean Obsidian Specimen Box (No dot wallpaper, no colored fog blobs) */}
                <div className="relative flex h-12 w-full items-center justify-center rounded-lg bg-[#050508] border border-[#1a1922] px-2.5 overflow-hidden">

                  <div
                    style={{
                      fontFamily: `"${tmpl.style.font_family}", "Noto Sans Thai", sans-serif`,
                    }}
                    className={`relative z-10 inline-flex items-center justify-center gap-x-1.5 leading-tight flex-nowrap ${
                      tmpl.mode === 'frosted'
                        ? 'rounded-lg px-2.5 py-1 border border-white/20 bg-white/[0.08] backdrop-blur-md'
                        : tmpl.mode === 'warm'
                        ? 'rounded-lg px-2.5 py-1 bg-black/55 border border-white/15'
                        : ''
                    }`}
                  >
                    {tmpl.tokens.map((token, idx) => {
                      const isCurrent = idx === tmpl.highlightIndex;

                      // 1. MrBeast Badge Mode
                      if (tmpl.mode === 'badge') {
                        return (
                          <span
                            key={idx}
                            style={
                              isCurrent
                                ? {
                                    backgroundColor: '#22c55e',
                                    color: '#000000',
                                    padding: '1px 6px',
                                    borderRadius: '5px',
                                    boxShadow: '0 2px 8px rgba(34,197,94,0.55), 0 1.5px 0 #000000',
                                    fontWeight: 900,
                                    transform: 'translateY(-1px) scale(1.06)',
                                  }
                                : {
                                    color: '#ffffff',
                                    textShadow: THREE_D_STROKE,
                                    fontWeight: 800,
                                  }
                            }
                            className="inline-block text-[12px]"
                          >
                            {token}
                          </span>
                        );
                      }

                      // 2. Karaoke Neon Glow Mode
                      if (tmpl.mode === 'karaoke') {
                        return (
                          <span
                            key={idx}
                            style={
                              isCurrent
                                ? {
                                    color: '#22d3ee',
                                    textShadow:
                                      '0 0 10px #22d3ee, 0 0 20px rgba(34,211,238,0.9), 0 1.5px 3px #000000',
                                    fontWeight: 900,
                                    transform: 'translateY(-1px) scale(1.06)',
                                  }
                                : idx < tmpl.highlightIndex
                                ? {
                                    color: '#ffffff',
                                    textShadow: '0 0 5px rgba(34,211,238,0.4), 0 1px 2px #000',
                                    fontWeight: 700,
                                  }
                                : {
                                    color: 'rgba(255,255,255,0.35)',
                                    fontWeight: 600,
                                  }
                            }
                            className="inline-block text-[12px]"
                          >
                            {token}
                          </span>
                        );
                      }

                      // 3. Danger Red Hook Mode
                      if (tmpl.mode === 'danger') {
                        return (
                          <span
                            key={idx}
                            style={
                              isCurrent
                                ? {
                                    color: '#ef4444',
                                    textShadow: `0 0 10px rgba(239,68,68,0.85), ${THREE_D_STROKE}`,
                                    fontWeight: 900,
                                    transform: 'translateY(-1px) scale(1.06)',
                                  }
                                : {
                                    color: '#ffffff',
                                    textShadow: THREE_D_STROKE,
                                    fontWeight: 800,
                                  }
                            }
                            className="inline-block text-[12px]"
                          >
                            {token}
                          </span>
                        );
                      }

                      // 4. Frosted / Warm Studio Mode
                      if (tmpl.mode === 'frosted' || tmpl.mode === 'warm') {
                        return (
                          <span
                            key={idx}
                            style={{
                              color: isCurrent ? tmpl.style.text_color : '#ffffff',
                              textShadow: isCurrent
                                ? `0 0 8px ${tmpl.style.text_color}88`
                                : '0 1px 2px rgba(0,0,0,0.7)',
                              fontWeight: isCurrent ? 800 : 600,
                            }}
                            className="inline-block text-[12px]"
                          >
                            {token}
                          </span>
                        );
                      }

                      // 5. Minimal / Cinema Mode
                      if (tmpl.mode === 'minimal' || tmpl.mode === 'cinema') {
                        return (
                          <span
                            key={idx}
                            style={{
                              color: '#ffffff',
                              textShadow: '0 2px 4px rgba(0,0,0,0.85)',
                              fontWeight: tmpl.style.bold ? 700 : 500,
                            }}
                            className="inline-block text-[12px]"
                          >
                            {token}
                          </span>
                        );
                      }

                      // Default: TikTok Viral 3D Stroke + Yellow Pop Word
                      return (
                        <span
                          key={idx}
                          style={{
                            color: isCurrent ? tmpl.style.text_color : '#ffffff',
                            textShadow: THREE_D_STROKE,
                            fontWeight: 900,
                            transform: isCurrent ? 'translateY(-1px) scale(1.06)' : undefined,
                          }}
                          className="inline-block text-[12px]"
                        >
                          {token}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        <CustomScrollbar scrollRef={templateScrollRef} />
      </div>
    </div>
  );
}

export default React.memo(TemplatePanel);
