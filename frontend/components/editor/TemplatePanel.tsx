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
  style: SubtitleStyle;
  badge?: string;
}

export const SUBTITLE_TEMPLATES: SubtitleTemplate[] = [
  {
    id: 'tiktok-viral',
    name: 'TikTok Viral',
    category: 'ยอดนิยม TikTok',
    previewText: 'วิธีทำคลิปให้ คนหยุดดู จนจบ ⚡',
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
      text_color: '#facc15',
      bg_color: '#000000',
      bg_opacity: 0,
      padding_x: 24,
      padding_y: 12,
      border_radius: 12,
      position: 'bottom',
      animation: 'pop',
    },
  },
  {
    id: 'mrbeast-badge',
    name: 'MrBeast Badge',
    category: 'ทรงพลัง',
    previewText: 'ดูให้จบ เทคนิคลับนี้ ปังแน่นอน 💥',
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
      text_color: '#22c55e',
      bg_color: '#000000',
      bg_opacity: 0,
      padding_x: 24,
      padding_y: 12,
      border_radius: 12,
      position: 'bottom',
      animation: 'pop',
    },
  },
  {
    id: 'submagic-karaoke',
    name: 'Karaoke Glow',
    category: 'เรืองแสง ไซเบอร์',
    previewText: 'ไฮไลท์คำ เรืองแสง สไตล์ AI 🔮',
    badge: 'AI CREATOR',
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
      text_color: '#22d3ee',
      bg_color: '#000000',
      bg_opacity: 0,
      padding_x: 20,
      padding_y: 10,
      border_radius: 8,
      position: 'bottom',
      animation: 'pop',
    },
  },
  {
    id: 'danger-hook',
    name: 'Danger Red Hook',
    category: 'เตือนภัย & ดึงดูด',
    previewText: 'หยุดเลื่อนดูสิ่งนี้ ห้ามพลาดคลิปนี้ ⚠️',
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
      text_color: '#ef4444',
      bg_color: '#000000',
      bg_opacity: 0,
      padding_x: 24,
      padding_y: 12,
      border_radius: 12,
      position: 'bottom',
      animation: 'shake',
    },
  },
  {
    id: 'ali-abdaal',
    name: 'Ali Abdaal Studio',
    category: 'เรียบหรู น่าเชื่อถือ',
    previewText: 'สตูดิโอคลีนๆ เรียบหรู สบายตา ☕',
    badge: 'MINIMAL',
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
      text_color: '#fde047',
      bg_color: 'rgba(255, 255, 255, 0.08)',
      bg_opacity: 0.85,
      padding_x: 22,
      padding_y: 10,
      border_radius: 12,
      position: 'bottom',
      animation: 'fade',
    },
  },
  {
    id: 'clean-minimal',
    name: 'Minimal Clean',
    category: 'สไลด์ขึ้น เต็มประโยค',
    previewText: 'สไตล์มินิมอล เรียบหรู คมชัด สบายตา ✨',
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
      text_color: '#ffffff',
      bg_color: '#000000',
      bg_opacity: 0,
      padding_x: 20,
      padding_y: 10,
      border_radius: 8,
      position: 'bottom',
      animation: 'slide-up',
    },
  },
  {
    id: 'podcast-warm',
    name: 'Podcast Warm',
    category: 'พอดแคสต์ & คุยกัน',
    previewText: 'โทนอุ่น ฟังสบาย พอดแคสต์ 🎙️',
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
      text_color: '#fbbf24',
      bg_color: '#000000',
      bg_opacity: 0.45,
      padding_x: 22,
      padding_y: 10,
      border_radius: 12,
      position: 'bottom',
      animation: 'fade',
    },
  },
  {
    id: 'cinematic-movie',
    name: 'Cinematic Movie',
    category: 'ภาพยนตร์ & สารคดี',
    previewText: 'ซับภาพยนตร์ สไตล์หนัง สารคดี 🎬',
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
      text_color: '#f8fafc',
      bg_color: '#000000',
      bg_opacity: 0,
      padding_x: 20,
      padding_y: 8,
      border_radius: 6,
      position: 'bottom',
      animation: 'fade',
    },
  },
  {
    id: 'viral-hook',
    name: 'Viral Hook',
    category: 'ดึงดูดสายตา',
    previewText: 'หยุดเลื่อนดูสิ่งนี้ ห้ามพลาด 🚨',
    badge: 'VIRAL HOOK',
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
      text_color: '#ef4444',
      bg_color: '#000000',
      bg_opacity: 0,
      padding_x: 20,
      padding_y: 10,
      border_radius: 8,
      position: 'bottom',
      animation: 'pop',
    },
  },
];

interface TemplatePanelProps {
  width?: number;
  onApplyTemplate: (template: SubtitleTemplate) => void;
  selectedSubtitle?: SubtitleSegment;
  selectedSubtitleIndex: number;
}

function TemplatePanel({
  width,
  onApplyTemplate,
  selectedSubtitle,
  selectedSubtitleIndex,
}: TemplatePanelProps) {
  const { ref: templateScrollRef } = useSmoothScrollElement<HTMLDivElement>();

  return (
    <div
      className="relative flex flex-col min-h-0 flex-1 md:flex-shrink-0 overflow-hidden select-none bg-[#13121b] w-full md:w-auto"
      style={typeof window !== 'undefined' && window.innerWidth >= 768 && width ? { width: `${width}px` } : undefined}
    >
      {/* 1. Fixed Header Bar */}
      <div className="flex h-12 flex-shrink-0 items-center justify-between border-b border-[#1c1a28] bg-[#13121b] px-4 select-none">
        <h2 className="text-sm font-semibold text-white">เทมเพลต</h2>
        <span className="text-[10px] text-purple-300/80">
          {selectedSubtitle ? `แคปชัน #${selectedSubtitleIndex + 1}` : 'ทั้งคลิป'}
        </span>
      </div>

      {/* 2. Scrollable Templates List */}
      <div className="relative flex-1 min-h-0 overflow-hidden">
        <div ref={templateScrollRef} className="panel-scroll-area h-full overflow-y-auto p-3 space-y-2.5 custom-scrollbar text-xs">
          {SUBTITLE_TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.id}
              onClick={() => onApplyTemplate(tmpl)}
              className="group relative flex flex-col justify-between rounded-xl bg-[#1a1827] hover:bg-[#252236] p-3 transition-all text-left active:scale-[0.99] shadow-md hover:shadow-xl"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-white text-xs">{tmpl.name}</span>
                {tmpl.badge ? (
                  <span className="rounded-full bg-[#2d2250] px-2 py-0.5 text-[9px] font-semibold text-[#c4b5fd] shadow-sm">
                    {tmpl.badge}
                  </span>
                ) : (
                  <span className="text-[10px] text-gray-400">{tmpl.category}</span>
                )}
              </div>

              {/* Template Preview Card */}
              <div className="flex h-12 w-full items-center justify-center rounded-lg bg-[#0c0b11] px-3 overflow-hidden">
                <span
                  style={{
                    color: tmpl.style.text_color,
                    fontWeight: tmpl.style.bold ? 700 : 400,
                    textShadow: tmpl.style.shadow
                      ? `0 0 ${tmpl.style.shadow_thickness * 2}px ${tmpl.style.shadow_color}`
                      : undefined,
                    backgroundColor:
                      tmpl.style.bg_opacity > 0 ? tmpl.style.bg_color : 'transparent',
                  }}
                  className="text-xs truncate"
                >
                  {tmpl.previewText}
                </span>
              </div>
            </button>
          ))}
        </div>
        <CustomScrollbar scrollRef={templateScrollRef} />
      </div>
    </div>
  );
}

export default React.memo(TemplatePanel);
