'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import CustomScrollbar from '@/components/ui/CustomScrollbar';

export interface FontOption {
  name: string;
  label: string;
  category?: 'thai' | 'latin' | 'custom';
  badge?: string;
  preview?: string;
  isCustom?: boolean;
}

const PRESET_FONTS: FontOption[] = [
  { name: 'Kanit', label: 'Kanit (คณิต)', category: 'thai', badge: 'หนาโมเดิร์น', preview: 'สวัสดีชาวโลก วิดีโอซับไตเติล 123 ABC' },
  { name: 'Prompt', label: 'Prompt (พร้อมท์)', category: 'thai', badge: 'ยอดนิยม', preview: 'สวัสดีชาวโลก วิดีโอซับไตเติล 123 ABC' },
  { name: 'Chonburi', label: 'Chonburi (ชลบุรี)', category: 'thai', badge: 'พาดหัว/หนาหรู', preview: 'สวัสดีชาวโลก วิดีโอซับไตเติล 123 ABC' },
  { name: 'Itim', label: 'Itim (ไอติม)', category: 'thai', badge: 'น่ารัก/สดใส', preview: 'สวัสดีชาวโลก วิดีโอซับไตเติล 123 ABC' },
  { name: 'Mali', label: 'Mali (มะลิ)', category: 'thai', badge: 'ลายมือน่ารัก', preview: 'สวัสดีชาวโลก วิดีโอซับไตเติล 123 ABC' },
  { name: 'Chakra Petch', label: 'Chakra Petch (จักรเพชร)', category: 'thai', badge: 'เกมมิ่ง/ไซเบอร์', preview: 'สวัสดีชาวโลก วิดีโอซับไตเติล 123 ABC' },
  { name: 'Pattaya', label: 'Pattaya (พัทยา)', category: 'thai', badge: 'พู่กันเรโทร', preview: 'สวัสดีชาวโลก วิดีโอซับไตเติล 123 ABC' },
  { name: 'Charm', label: 'Charm (ชาร์ม)', category: 'thai', badge: 'ลายมือวิจิตร', preview: 'สวัสดีชาวโลก วิดีโอซับไตเติล 123 ABC' },
  { name: 'Sarabun', label: 'Sarabun (สารบรรณ)', category: 'thai', badge: 'ทางการ/มีหัว', preview: 'สวัสดีชาวโลก วิดีโอซับไตเติล 123 ABC' },
  { name: 'Trirong', label: 'Trirong (ไตรรงค์)', category: 'thai', badge: 'คลาสสิก/มีหัว', preview: 'สวัสดีชาวโลก วิดีโอซับไตเติล 123 ABC' },
  { name: 'Pridi', label: 'Pridi (ปรีดี)', category: 'thai', badge: 'ตัวหนามีเชิง', preview: 'สวัสดีชาวโลก วิดีโอซับไตเติล 123 ABC' },
  { name: 'Mitr', label: 'Mitr (มิตร)', category: 'thai', badge: 'มินิมอลสบายตา', preview: 'สวัสดีชาวโลก วิดีโอซับไตเติล 123 ABC' },
  { name: 'Anuphan', label: 'Anuphan (อนุพันธ์)', category: 'thai', badge: 'มินิมอลไม่มีหัว', preview: 'สวัสดีชาวโลก วิดีโอซับไตเติล 123 ABC' },
  { name: 'Bai Jamjuree', label: 'Bai Jamjuree (จามจุรี)', category: 'thai', badge: 'เหลี่ยมเท่', preview: 'สวัสดีชาวโลก วิดีโอซับไตเติล 123 ABC' },
  { name: 'Krub', label: 'Krub (ครับ)', category: 'thai', badge: 'เหลี่ยมมนสะอาด', preview: 'สวัสดีชาวโลก วิดีโอซับไตเติล 123 ABC' },
  { name: 'Athiti', label: 'Athiti (อธิษฐาน)', category: 'thai', badge: 'โค้งมนนุ่มนวล', preview: 'สวัสดีชาวโลก วิดีโอซับไตเติล 123 ABC' },
  { name: 'Noto Sans Thai', label: 'Noto Sans Thai', category: 'thai', badge: 'มาตรฐานสากล', preview: 'สวัสดีชาวโลก วิดีโอซับไตเติล 123 ABC' },
  { name: 'Impact', label: 'Impact', category: 'latin', badge: 'Ultra Bold', preview: 'The quick brown fox jumps 123 ABC' },
  { name: 'Inter', label: 'Inter', category: 'latin', badge: 'Clean Sans', preview: 'The quick brown fox jumps 123 ABC' },
  { name: 'Arial', label: 'Arial', category: 'latin', badge: 'Standard', preview: 'The quick brown fox jumps 123 ABC' },
];

interface FontSelectorProps {
  value: string;
  onChange: (fontName: string) => void;
}

export default function FontSelector({ value, onChange }: FontSelectorProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [customFonts, setCustomFonts] = useState<FontOption[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const fontScrollRef = useRef<HTMLDivElement>(null);

  // Lazy-load the extended 17-Thai-font catalog only inside the editor
  useEffect(() => {
    const id = 'zaizub-editor-thai-fonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Anuphan:wght@400;600;700&family=Athiti:wght@400;600;700&family=Bai+Jamjuree:wght@400;600;700&family=Chakra+Petch:wght@400;600;700&family=Charm:wght@400;700&family=Chonburi&family=Itim&family=Krub:wght@400;600;700&family=Mali:wght@400;600;700&family=Mitr:wght@400;600&family=Pattaya&family=Pridi:wght@400;600;700&family=Sarabun:ital,wght@0,400;0,600;0,700;1,400&family=Trirong:wght@400;600;700&display=swap';
    document.head.appendChild(link);
  }, []);

  // Smooth mouse-wheel scrolling that attaches reliably whenever the dropdown opens
  useEffect(() => {
    if (!isOpen) return;
    const el = fontScrollRef.current;
    if (!el) return;

    let target = el.scrollTop;
    let rafId: number | null = null;

    const animate = () => {
      const diff = target - el.scrollTop;
      if (Math.abs(diff) < 0.5) {
        el.scrollTop = target;
        rafId = null;
        return;
      }
      el.scrollTop += diff * 0.22;
      rafId = requestAnimationFrame(animate);
    };

    const onWheel = (e: WheelEvent) => {
      e.stopPropagation();
      e.stopImmediatePropagation();
      e.preventDefault();
      target = Math.max(0, Math.min(el.scrollHeight - el.clientHeight, target + e.deltaY));
      if (rafId === null) rafId = requestAnimationFrame(animate);
    };

    el.addEventListener('wheel', onWheel, { passive: false, capture: true });
    return () => {
      el.removeEventListener('wheel', onWheel, { capture: true });
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [isOpen]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Handle Custom Font Upload (.ttf, .otf, .woff, .woff2)
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!['ttf', 'otf', 'woff', 'woff2'].includes(extension || '')) {
      setUploadError('รองรับเฉพาะไฟล์ .ttf, .otf, .woff, .woff2');
      return;
    }

    try {
      const cleanFontName = file.name.replace(/\.[^/.]+$/, '').trim();
      const arrayBuffer = await file.arrayBuffer();

      const fontFace = new FontFace(cleanFontName, arrayBuffer);
      const loadedFace = await fontFace.load();
      document.fonts.add(loadedFace);

      const newCustomFont: FontOption = {
        name: cleanFontName,
        label: cleanFontName,
        category: 'custom',
        preview: 'ตัวอย่างฟอนต์ที่คุณอัปโหลด 123 ABC',
        isCustom: true,
      };

      setCustomFonts((prev) => {
        const filtered = prev.filter((f) => f.name !== cleanFontName);
        return [newCustomFont, ...filtered];
      });

      onChange(cleanFontName);
      setIsOpen(false);
    } catch (err) {
      console.error('Error loading custom font:', err);
      setUploadError('ไม่สามารถโหลดฟอนต์นี้ได้ กรุณาลองไฟล์อื่น');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [onChange]);

  const allFonts = useMemo(() => {
    return [...customFonts, ...PRESET_FONTS];
  }, [customFonts]);

  const filteredFonts = useMemo(() => {
    if (!searchQuery.trim()) return allFonts;
    const q = searchQuery.toLowerCase();
    return allFonts.filter((f) => f.name.toLowerCase().includes(q) || f.label.toLowerCase().includes(q));
  }, [allFonts, searchQuery]);

  const currentFont = allFonts.find((f) => f.name === value) || {
    name: value || 'Noto Sans Thai',
    label: value || 'Noto Sans Thai',
    preview: 'สวัสดีชาวโลก วิดีโอซับไตเติล 123 ABC',
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".ttf,.otf,.woff,.woff2"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Main Dropdown Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex h-10 items-center justify-between rounded-xl px-3.5 text-left transition-all border shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] ${
          isOpen
            ? 'bg-[#1a172b] border-purple-400/50 ring-2 ring-purple-500/15'
            : 'bg-[#141222] hover:bg-[#1a172b] border-white/[0.08] hover:border-purple-400/35'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 pr-1">
          <span
            style={{ fontFamily: `"${currentFont.name}", "Noto Sans Thai", sans-serif` }}
            className="truncate text-white font-semibold text-xs sm:text-sm"
          >
            {currentFont.label}
          </span>
          {currentFont.badge && (
            <span className="hidden sm:inline-flex items-center rounded-md bg-[#2d2250] border border-purple-500/30 px-1.5 py-0.5 text-[9px] font-semibold text-[#c4b5fd] flex-shrink-0">
              {currentFont.badge}
            </span>
          )}
        </div>

        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          className={`flex-shrink-0 text-slate-400 ml-2 transition-transform duration-150 ${isOpen ? 'rotate-180 text-purple-300' : ''}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-full z-50 rounded-2xl bg-[#0e0c19]/98 border border-[#221e33] ring-1 ring-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.9)] backdrop-blur-2xl overflow-hidden origin-top anim-dropdown">
          {/* Top Search & Upload Bar */}
          <div className="p-2 bg-[#0e0c19] border-b border-[#1c1a28]">
            <div className="relative flex items-center bg-[#141222] border border-white/[0.08] focus-within:border-purple-400/50 rounded-xl px-2.5 py-1.5 transition-colors">
              {/* Search Icon */}
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                className="text-purple-400 pointer-events-none flex-shrink-0 mr-2"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>

              {/* Search Input */}
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    if (searchQuery) {
                      e.stopPropagation();
                      setSearchQuery('');
                    } else {
                      setIsOpen(false);
                    }
                  }
                }}
                placeholder="ค้นหาชื่อฟอนต์..."
                className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
              />

              {/* Clear Search Button */}
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="flex h-5 w-5 items-center justify-center rounded-md text-slate-400 hover:text-white text-xs mr-1"
                  title="ล้างคำค้นหา"
                >
                  ×
                </button>
              )}

              {/* Right-Side Upload Icon Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-6 items-center gap-1 rounded-lg bg-[#2d2250] hover:bg-[#3b2d68] border border-purple-500/30 px-2 text-[10px] font-semibold text-[#e9d5ff] transition-colors flex-shrink-0 ml-1"
                title="อัปโหลดฟอนต์ (.ttf, .otf, .woff)"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span>อัปโหลด</span>
              </button>
            </div>

            {uploadError && (
              <p className="text-[10px] text-rose-400 px-1 pt-1.5 leading-tight">{uploadError}</p>
            )}
          </div>

          {/* SmoothScroll + CustomScrollbar Font List Container */}
          <div className="relative min-h-0 h-[360px] overflow-hidden select-none">
            <div
              ref={fontScrollRef}
              className="panel-scroll-area h-full overflow-y-auto p-1.5 space-y-1 custom-scrollbar"
            >
              {filteredFonts.length === 0 ? (
                <div className="py-8 px-3 text-center space-y-1.5">
                  <p className="text-xs text-slate-400">ไม่พบฟอนต์ &ldquo;{searchQuery}&rdquo;</p>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-[11px] text-purple-400 hover:text-purple-300 underline"
                  >
                    ล้างคำค้นหา
                  </button>
                </div>
              ) : (
                filteredFonts.map((font) => {
                  const isSelected = value === font.name;

                  return (
                    <button
                      key={font.name}
                      type="button"
                      onClick={() => {
                        onChange(font.name);
                        setIsOpen(false);
                      }}
                      className={`w-full flex flex-col justify-center rounded-xl p-2 px-2.5 text-left transition-all border ${
                        isSelected
                          ? 'bg-[#2d2250] text-[#e9d5ff] border-purple-500/40 font-semibold shadow-sm'
                          : 'text-white border-transparent hover:bg-[#1a172b] hover:border-white/[0.06]'
                      }`}
                    >
                      {/* Top Row: Font Name + Style Badge + Custom Badge + Checkmark */}
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-1.5 min-w-0 pr-1">
                          <span
                            style={{ fontFamily: `"${font.name}", "Noto Sans Thai", sans-serif` }}
                            className="text-[12.5px] font-semibold text-white truncate"
                          >
                            {font.label}
                          </span>
                          {font.badge && (
                            <span
                              className={`rounded-md px-1.5 py-0.5 text-[9px] font-sans font-medium ${
                                isSelected
                                  ? 'bg-purple-500/30 text-[#e9d5ff] border border-purple-400/30'
                                  : 'bg-[#141222] text-[#c4b5fd] border border-white/[0.06]'
                              }`}
                            >
                              {font.badge}
                            </span>
                          )}
                          {font.isCustom && (
                            <span className="rounded-md bg-emerald-500/20 border border-emerald-500/30 px-1.5 py-0.5 text-[9px] font-mono text-emerald-300">
                              Custom
                            </span>
                          )}
                        </div>

                        {isSelected && (
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#7c3aed] text-white flex-shrink-0 ml-1 shadow-[0_0_8px_rgba(124,58,237,0.6)]">
                            <svg
                              width="10"
                              height="10"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </span>
                        )}
                      </div>

                      {/* Bottom Row: Compact & Distinct Example Text */}
                      <span
                        style={{ fontFamily: `"${font.name}", "Noto Sans Thai", sans-serif` }}
                        className={`text-[11.5px] truncate mt-0.5 leading-snug tracking-wide ${
                          isSelected ? 'text-purple-100/90' : 'text-slate-400'
                        }`}
                      >
                        {font.preview || 'สวัสดีชาวโลก วิดีโอซับไตเติล 123 ABC'}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            {/* Integrated Custom Scrollbar for Smooth Mouse Dragging */}
            <CustomScrollbar scrollRef={fontScrollRef} />
          </div>
        </div>
      )}
    </div>
  );
}
