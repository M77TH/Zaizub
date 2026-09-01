'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SubtitleSegment } from './types';
import CustomScrollbar from '@/components/ui/CustomScrollbar';
import { useSmoothScrollElement } from '@/components/providers/SmoothScroll';

interface TranscriptPanelProps {
  width?: number;
  subtitles: SubtitleSegment[];
  filteredSubtitles: SubtitleSegment[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedSubtitleId: number | string | null;
  setSelectedSubtitleId: React.Dispatch<React.SetStateAction<number | string | null>>;
  activeSubtitle?: SubtitleSegment;
  currentTime?: number;
  duration?: number;
  isPlaying?: boolean;
  seekVideo: (time: number) => void;
  onTextChange: (id: number, text: string) => void;
  onDeleteSegment: (id: number) => void;
  onSplitSegment: (id: number) => void;
  formatTime: (time: number) => string;
}

function TranscriptPanel({
  width,
  subtitles,
  filteredSubtitles,
  searchQuery,
  setSearchQuery,
  selectedSubtitleId,
  setSelectedSubtitleId,
  activeSubtitle,
  currentTime = 0,
  duration = 0,
  isPlaying = false,
  seekVideo,
  onTextChange,
  onDeleteSegment,
  onSplitSegment,
  formatTime,
}: TranscriptPanelProps) {
  // Hook handles: wheel smooth scroll, stopPropagation (blocks Lenis), scrollTo imperative handle
  const { ref: transcriptScrollRef, scrollTo: smoothScrollTo } = useSmoothScrollElement<HTMLDivElement>();

  const [isSyncOn, setIsSyncOn] = useState<boolean>(true);
  const isSyncOnRef = useRef<boolean>(true);          // mirrors state, always fresh in listeners
  const syncBtnClickingRef = useRef<boolean>(false);  // blocks wheel listener during button click
  const isProgrammaticScrollRef = useRef<boolean>(false); // blocks wheel listener during our own scroll

  const [isDeleteMode, setIsDeleteMode] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchResultIndex, setSearchResultIndex] = useState<number>(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const currentTargetId = (selectedSubtitleId ?? activeSubtitle?.id) as number | null;

  // Auto-focus search input on open
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isSearchOpen]);

  // Keep ref in sync with state
  useEffect(() => { isSyncOnRef.current = isSyncOn; }, [isSyncOn]);

  /** Turn sync OFF — idempotent */
  const turnSyncOff = useCallback(() => {
    if (isSyncOnRef.current) {
      isSyncOnRef.current = false;
      setIsSyncOn(false);
    }
  }, []);

  // Extra wheel listener purely for sync-off detection.
  // The hook already handles stopPropagation + smooth scroll — we just piggyback for intent detection.
  useEffect(() => {
    const container = transcriptScrollRef.current;
    if (!container) return;
    const onWheel = () => {
      if (!isProgrammaticScrollRef.current && !syncBtnClickingRef.current) turnSyncOff();
    };
    const onTouchMove = () => {
      if (!isProgrammaticScrollRef.current && !syncBtnClickingRef.current) turnSyncOff();
    };
    container.addEventListener('wheel', onWheel, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: true });
    return () => {
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('touchmove', onTouchMove);
    };
  }, [turnSyncOff]);

  // Detect custom scrollbar thumb drag (outside the scroll container)
  const outerDivRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const outer = outerDivRef.current;
    const inner = transcriptScrollRef.current;
    if (!outer || !inner) return;
    const onThumbDrag = (e: PointerEvent) => {
      if (isProgrammaticScrollRef.current || syncBtnClickingRef.current) return;
      if (!inner.contains(e.target as Node)) turnSyncOff();
    };
    outer.addEventListener('pointerdown', onThumbDrag);
    return () => outer.removeEventListener('pointerdown', onThumbDrag);
  }, [turnSyncOff]);

  /** Scroll the active card to the top of the panel with smooth ease gliding. */
  const scrollToActive = useCallback((targetSpecificId?: number | string | null, smooth: boolean = true) => {
    const targetId = targetSpecificId ?? activeSubtitle?.id ?? selectedSubtitleId;
    if (targetId === null || targetId === undefined || !transcriptScrollRef.current) return;

    const container = transcriptScrollRef.current;
    const el = container.querySelector(`[data-subtitle-id="${targetId}"]`) as HTMLElement | null;
    if (!el) return;

    const containerRect = container.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const targetTop = elRect.top - containerRect.top + container.scrollTop - 12;

    isProgrammaticScrollRef.current = true;
    smoothScrollTo.current(Math.max(0, targetTop), smooth);
    setTimeout(() => { isProgrammaticScrollRef.current = false; }, smooth ? 350 : 50);
  }, [activeSubtitle?.id, selectedSubtitleId, smoothScrollTo]);

  // Auto-scroll ONLY when active card ID is valid and changes during video playback with sync ON
  useEffect(() => {
    if (isSyncOn && activeSubtitle?.id !== undefined) {
      scrollToActive(activeSubtitle.id, true);
    }
  }, [activeSubtitle?.id, isSyncOn, scrollToActive]);

  const navigatePrev = useCallback(() => {
    if (filteredSubtitles.length === 0) return;
    const prevIdx = (searchResultIndex - 1 + filteredSubtitles.length) % filteredSubtitles.length;
    setSearchResultIndex(prevIdx);
    const target = filteredSubtitles[prevIdx];
    if (target) {
      setSelectedSubtitleId(target.id);
      seekVideo(target.start);
    }
  }, [filteredSubtitles, searchResultIndex, setSelectedSubtitleId, seekVideo]);

  const navigateNext = useCallback(() => {
    if (filteredSubtitles.length === 0) return;
    const nextIdx = (searchResultIndex + 1) % filteredSubtitles.length;
    setSearchResultIndex(nextIdx);
    const target = filteredSubtitles[nextIdx];
    if (target) {
      setSelectedSubtitleId(target.id);
      seekVideo(target.start);
    }
  }, [filteredSubtitles, searchResultIndex, setSelectedSubtitleId, seekVideo]);

  // Handle global Escape key to deselect card and return to global style mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSearchOpen && selectedSubtitleId !== null) {
        setSelectedSubtitleId(null);
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, selectedSubtitleId, setSelectedSubtitleId]);

  return (
    <div
      style={width ? { width: `${width}px` } : undefined}
      className={`relative flex min-h-0 flex-shrink-0 flex-col overflow-hidden bg-[#13121b] ${width ? '' : 'w-72'}`}
    >
      {/* Header */}
      <div className="flex h-12 items-center justify-between border-b border-[#1c1a28] px-3 bg-[#13121b]">
        <div>
          <h2 className="text-sm font-bold text-white">ซับไตเติล</h2>
        </div>
        <div className="flex items-center gap-1">
          {/* Sync / Follow Playhead button (Target Crosshair Icon) */}
          <button
            onMouseDown={() => {
              // Mark that the sync button is being clicked so the wheel listener ignores it
              syncBtnClickingRef.current = true;
              setTimeout(() => { syncBtnClickingRef.current = false; }, 300);
            }}
            onClick={() => {
              const next = !isSyncOnRef.current;
              isSyncOnRef.current = next;
              setIsSyncOn(next);
              if (next) {
                // Determine current target subtitle based on currentTime
                let targetId = activeSubtitle?.id ?? selectedSubtitleId;
                if (!targetId && subtitles.length > 0) {
                  const currentSegment = subtitles.find(s => currentTime >= s.start && currentTime <= s.end)
                    || subtitles.find(s => s.start >= currentTime)
                    || subtitles[subtitles.length - 1];
                  targetId = currentSegment?.id;
                }
                requestAnimationFrame(() => {
                  if (targetId) {
                    scrollToActive(targetId, true);
                  }
                });
              }
            }}
            className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
              isSyncOn
                ? 'bg-[#2d2250] text-[#c4b5fd] font-bold shadow-sm'
                : 'text-gray-400 hover:bg-[#1a1827] hover:text-gray-200'
            }`}
            title={isSyncOn ? 'ซิงค์เลื่อนตามวิดีโอ (Sync ON - เลื่อนเพื่อปิดอัตโนมัติ)' : 'ปิดการซิงค์ (Sync OFF - คลิกเพื่อเปิดและเลื่อนกลับมาที่ท่อนปัจจุบัน)'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="8" />
              <line x1="12" y1="2" x2="12" y2="6" />
              <line x1="12" y1="18" x2="12" y2="22" />
              <line x1="2" y1="12" x2="6" y2="12" />
              <line x1="18" y1="12" x2="22" y2="12" />
            </svg>
          </button>

          {/* Cut / Split button */}
          <button
            onClick={() => {
              if (currentTargetId !== null) {
                onSplitSegment(currentTargetId);
              }
            }}
            disabled={currentTargetId === null}
            className="flex h-7 w-7 items-center justify-center rounded text-gray-400 hover:bg-[#1a1827] hover:text-white transition-colors disabled:opacity-40"
            title="ตัดแบ่งเซกเมนต์ที่เวลาปัจจุบัน (Split)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="6" cy="6" r="3" />
              <circle cx="6" cy="18" r="3" />
              <line x1="20" y1="4" x2="8.12" y2="15.88" />
              <line x1="14.47" y1="14.48" x2="20" y2="20" />
              <line x1="8.12" y1="8.12" x2="12" y2="12" />
            </svg>
          </button>

          {/* Delete Mode Toggle button (Borderless) */}
          <button
            onClick={() => setIsDeleteMode((prev) => !prev)}
            className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
              isDeleteMode
                ? 'bg-rose-500/25 text-rose-300'
                : 'text-gray-400 hover:bg-rose-500/15 hover:text-rose-300'
            }`}
            title={isDeleteMode ? 'ปิดโหมดลบ (Exit Delete Mode)' : 'เปิดโหมดลบเซกเมนต์ (Delete Mode)'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>

          {/* Search Toggle button */}
          <button
            onClick={() => {
              setIsSearchOpen((prev) => {
                if (prev) {
                  setSearchQuery('');
                  setSearchResultIndex(0);
                }
                return !prev;
              });
            }}
            className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
              isSearchOpen
                ? 'bg-[#2d2250] text-[#c4b5fd] font-bold shadow-sm'
                : 'text-gray-400 hover:bg-[#1a1827] hover:text-white'
            }`}
            title={isSearchOpen ? 'ปิดการค้นหา' : 'ค้นหาในซับไตเติ้ล'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        </div>
      </div>

      {/* Collapsible Animated Search Bar under Header */}
      <div
        className={`overflow-hidden border-b border-[#1c1a28] bg-[#0c0b11] transition-all duration-200 ease-in-out ${
          isSearchOpen ? 'max-h-14 opacity-100 px-3 py-2' : 'max-h-0 opacity-0 px-3 py-0 border-transparent pointer-events-none'
        }`}
      >
        <div className="flex w-full items-center gap-1.5">
          <div className="relative flex flex-1 items-center">
            <svg
              className="absolute left-2.5 text-purple-400 pointer-events-none"
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchResultIndex(0);
              }}
              placeholder="ค้นหาข้อความซับ..."
              className="w-full rounded-md bg-[#1a1827] pl-8 pr-2.5 py-1 text-xs text-white placeholder-gray-400 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchResultIndex(0);
                }}
                className="absolute right-2 text-gray-400 hover:text-white"
                title="ล้างข้อความค้นหา"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          {/* Search Result Counter and Navigation Arrows */}
          {searchQuery && (
            <div className="flex items-center gap-1">
              <span className="text-[11px] tabular-nums text-[#c4b5fd] font-medium whitespace-nowrap">
                {filteredSubtitles.length > 0
                  ? `${searchResultIndex + 1}/${filteredSubtitles.length}`
                  : '0/0'}
              </span>
              <button
                onClick={navigatePrev}
                disabled={filteredSubtitles.length === 0}
                className="flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-[#1a1827] hover:text-white disabled:opacity-30 transition-colors"
                title="ผลลัพธ์ก่อนหน้า"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="18 15 12 9 6 15" />
                </svg>
              </button>
              <button
                onClick={navigateNext}
                disabled={filteredSubtitles.length === 0}
                className="flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-[#1a1827] hover:text-white disabled:opacity-30 transition-colors"
                title="ผลลัพธ์ถัดไป"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Subtitles Scroll List Area */}
      <div
        ref={outerDivRef}
        className="relative min-h-0 flex-1 overflow-hidden"
      >
        <div
          ref={transcriptScrollRef}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedSubtitleId(null);
            }
          }}
          className="panel-scroll-area h-full overflow-y-auto p-2.5 space-y-2.5 custom-scrollbar cursor-default"
        >
          {filteredSubtitles.map((sub, index) => {
            const isPlayingThis = activeSubtitle?.id === sub.id;
            const isSelected = selectedSubtitleId === sub.id;
            const subDuration = (sub.end - sub.start).toFixed(1);
            const isLastSegment = index === filteredSubtitles.length - 1;
            const effectiveEnd = (isLastSegment && duration > 0) ? Math.min(sub.end, duration) : sub.end;
            const segmentDuration = Math.max(effectiveEnd - sub.start, 0.01);
            
            // Check if segment is done (past current time, or reached end of segment / end of video)
            const isPastThis =
              currentTime >= effectiveEnd - 0.1 ||
              currentTime >= sub.end - 0.1 ||
              (duration > 0 && currentTime >= duration - 0.2 && isLastSegment);
            
            let segmentProgress = 0;
            if (isPastThis) {
              segmentProgress = 100;
            } else if (isPlayingThis) {
              const rawProgress = ((currentTime - sub.start) / segmentDuration) * 100;
              segmentProgress = rawProgress >= 93 ? 100 : Math.min(100, Math.max(0, rawProgress));
            }

            return (
              <div
                data-subtitle-id={sub.id}
                onClick={(e) => {
                  const isClickOnTextarea = e.target instanceof HTMLTextAreaElement;
                  if (isSelected && !isClickOnTextarea) {
                    setSelectedSubtitleId(null);
                    if (document.activeElement instanceof HTMLElement) {
                      document.activeElement.blur();
                    }
                    return;
                  }

                  if (!isSelected) {
                    setSelectedSubtitleId(sub.id);
                    seekVideo(sub.start);
                    // Automatically place blinking cursor into textarea if clicked outside
                    const textarea = e.currentTarget.querySelector('textarea');
                    if (textarea && document.activeElement !== textarea) {
                      textarea.focus();
                      const len = textarea.value.length;
                      textarea.setSelectionRange(len, len);
                    }
                  }
                }}
                key={sub.id}
                className={`relative rounded-2xl p-3.5 transition-all duration-200 cursor-pointer overflow-hidden ${
                  isSelected && isPlayingThis
                    ? 'bg-[#382663] text-white shadow-lg scale-[1.01]'
                    : isSelected
                    ? 'bg-[#2d2250] text-white shadow-md scale-[1.01]'
                    : isPlayingThis
                    ? 'bg-[#231b3d] text-white shadow-sm'
                    : 'bg-[#1a1827] hover:bg-[#221f33] text-gray-100 shadow-sm'
                }`}
              >
                {/* Card top row: Index & Selected Tag on Left, Subtle Edit Indicator & Delete on Right */}
                <div className="relative z-10 flex h-4 items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs tabular-nums font-bold antialiased ${isSelected || isPlayingThis ? 'text-white' : 'text-[#a78bfa]'}`}>
                      #{index + 1}
                    </span>
                    {isSelected && (
                      <span className="flex items-center justify-center text-white/90" title="กำลังแก้ไขส่วนนี้">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="3" />
                          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                        </svg>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Subtle Edited Indicator */}
                    {(sub.isEdited || sub.style) && (
                      <span className={`text-[10px] font-semibold ${isSelected || isPlayingThis ? 'text-white/90' : 'text-[#c4b5fd]/80'}`} title="แก้ไขแล้ว">
                        แก้ไขแล้ว
                      </span>
                    )}

                    {/* Delete button */}
                    {isDeleteMode && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSegment(sub.id);
                        }}
                        className="flex h-4 w-4 items-center justify-center rounded text-white/80 hover:bg-rose-500/30 hover:text-white transition-colors active:scale-90"
                        title="ลบส่วนนี้"
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Subtitle text (Dynamic Auto-Sizing with Enhanced Legibility) */}
                <div className="relative z-10 my-2.5">
                  <textarea
                    value={sub.text}
                    onFocus={() => {
                      setSelectedSubtitleId(sub.id);
                      seekVideo(sub.start);
                    }}
                    onChange={(e) => onTextChange(sub.id, e.target.value)}
                    rows={Math.max(1, sub.text.split('\n').length)}
                    className="block w-full bg-transparent text-[14px] font-medium leading-relaxed text-white focus:outline-none rounded px-1 py-0 resize-none cursor-text [field-sizing:content] overflow-hidden tracking-[0.01em] placeholder-white/40"
                  />
                </div>

                {/* Timestamp Row with Soundwave Equalizer & Live Progress inside Pill */}
                <div className="relative z-10 flex items-center justify-between">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      seekVideo(sub.start);
                    }}
                    className={`relative overflow-hidden rounded-lg px-2.5 py-1 text-[11px] tabular-nums antialiased transition-colors ${
                      isSelected || isPlayingThis
                        ? 'bg-black text-white font-semibold shadow-inner'
                        : isPastThis
                        ? 'bg-black/30 text-gray-400 opacity-30'
                        : 'bg-black/30 text-white opacity-50 hover:opacity-100 hover:bg-black/45'
                    }`}
                    title="คลิกเพื่อเลื่อนวิดีโอมาที่นี่"
                  >
                    {/* Live Progress Fill Bar inside timestamp button */}
                    {segmentProgress > 0 && (
                      <span
                        className={`absolute inset-y-0 left-0 will-change-[width] pointer-events-none ${
                          isPastThis ? 'bg-[#382663]' : 'bg-[#7c3aed]'
                        }`}
                        style={{ width: `${segmentProgress}%` }}
                      />
                    )}

                    {/* Timestamp Inner Content: Soundwave Equalizer Icon + Millisecond Text */}
                    <div className="relative z-10 flex items-center gap-1.5">
                      {(isPlayingThis || isSelected) && (
                        <span className="flex items-end gap-[2px] h-3 mr-0.5" title="กำลังเล่น / เล่นเสียงเซกเมนต์นี้">
                          <span
                            className={`w-[2px] bg-[#c4b5fd] rounded-full ${
                              isPlayingThis ? 'animate-[equalizer_0.8s_ease-in-out_infinite]' : 'h-2'
                            }`}
                          />
                          <span
                            className={`w-[2px] bg-[#c4b5fd] rounded-full ${
                              isPlayingThis ? 'animate-[equalizer_0.8s_ease-in-out_0.2s_infinite]' : 'h-3'
                            }`}
                          />
                          <span
                            className={`w-[2px] bg-[#c4b5fd] rounded-full ${
                              isPlayingThis ? 'animate-[equalizer_0.8s_ease-in-out_0.4s_infinite]' : 'h-1.5'
                            }`}
                          />
                        </span>
                      )}
                      <span>
                        {formatTime(sub.start)} - {formatTime(effectiveEnd)}
                      </span>
                    </div>
                  </button>

                  <span className={`text-[11px] tabular-nums font-semibold antialiased ${isSelected || isPlayingThis ? 'text-white/80' : 'text-[#a78bfa]/70'}`}>
                    {subDuration}s
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <CustomScrollbar scrollRef={transcriptScrollRef} />
      </div>
    </div>
  );
}

export default React.memo(TranscriptPanel);