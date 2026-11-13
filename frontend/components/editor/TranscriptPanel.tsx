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
  isSyncOn?: boolean;
  setIsSyncOn?: React.Dispatch<React.SetStateAction<boolean>>;
  seekVideo: (time: number) => void;
  onTextChange: (id: number, text: string) => void;
  onDeleteSegment: (id: number) => void;
  onSplitSegment: (id: number) => void;
  onSplitAtCursor?: (id: number, cursorIndex: number) => void;
  onMergeWithPrevious?: (id: number) => void;
  onMoveSegment?: (id: number, newStart: number, commitHistory?: boolean) => void;
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
  isSyncOn: propIsSyncOn,
  setIsSyncOn: propSetIsSyncOn,
  seekVideo,
  onTextChange,
  onDeleteSegment,
  onSplitSegment,
  onSplitAtCursor,
  onMergeWithPrevious,
  formatTime,
}: TranscriptPanelProps) {
  const { ref: transcriptScrollRef, scrollTo: smoothScrollTo } = useSmoothScrollElement<HTMLDivElement>();

  const [internalIsSyncOn, setInternalIsSyncOn] = useState<boolean>(true);
  const isSyncOn = propIsSyncOn !== undefined ? propIsSyncOn : internalIsSyncOn;
  const setIsSyncOn = propSetIsSyncOn !== undefined ? propSetIsSyncOn : setInternalIsSyncOn;
  const isSyncOnRef = useRef<boolean>(true);
  const syncBtnClickingRef = useRef<boolean>(false);
  const isProgrammaticScrollRef = useRef<boolean>(false);

  const [isDeleteMode, setIsDeleteMode] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchResultIndex, setSearchResultIndex] = useState<number>(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isSearchOpen]);

  useEffect(() => {
    isSyncOnRef.current = isSyncOn;
  }, [isSyncOn]);

  const turnSyncOff = useCallback(() => {
    isSyncOnRef.current = false;
    setIsSyncOn(false);
  }, [setIsSyncOn]);

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
  }, [turnSyncOff, transcriptScrollRef]);

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
  }, [turnSyncOff, transcriptScrollRef]);

  const [scrubbingSubId, setScrubbingSubId] = useState<number | null>(null);

  const handlePillPointerDown = useCallback(
    (e: React.PointerEvent, sub: SubtitleSegment) => {
      e.stopPropagation();
      if (e.button !== 0) return;

      // Scrubbing timeline pill views/seeks this card without hijacking per-card edit scope
      setSelectedSubtitleId((curr) => (curr !== null && curr !== sub.id ? null : curr));
      setScrubbingSubId(sub.id);

      const targetEl = e.currentTarget as HTMLElement;
      targetEl.setPointerCapture(e.pointerId);

      const updateSeekFromPointer = (clientX: number) => {
        const rect = targetEl.getBoundingClientRect();
        if (rect.width <= 0) return;
        const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        const effectiveEnd = Math.max(sub.start + 0.1, sub.end);
        const cardDuration = effectiveEnd - sub.start;
        const targetTime = sub.start + cardDuration * ratio;
        seekVideo(targetTime);
      };

      updateSeekFromPointer(e.clientX);

      const onPointerMove = (moveEvt: PointerEvent) => {
        updateSeekFromPointer(moveEvt.clientX);
      };

      const onPointerUp = (upEvt: PointerEvent) => {
        setScrubbingSubId(null);
        targetEl.releasePointerCapture(upEvt.pointerId);
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerUp);
      };

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);
    },
    [seekVideo, setSelectedSubtitleId]
  );

  const scrollToActive = useCallback(
    (targetSpecificId?: number | string | null, smooth: boolean = true) => {
      const targetId = targetSpecificId ?? activeSubtitle?.id ?? selectedSubtitleId;
      if (targetId === null || targetId === undefined || !transcriptScrollRef.current) return;

      const container = transcriptScrollRef.current;
      const el = container.querySelector(`[data-subtitle-id="${targetId}"]`) as HTMLElement | null;
      if (!el) return;

      const containerRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const topOffset = 10;
      const targetTop = container.scrollTop + (elRect.top - containerRect.top) - topOffset;

      isProgrammaticScrollRef.current = true;
      smoothScrollTo.current(Math.max(0, targetTop), smooth);
      setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, smooth ? 350 : 50);
    },
    [activeSubtitle?.id, selectedSubtitleId, smoothScrollTo, transcriptScrollRef]
  );

  useEffect(() => {
    if (!isSyncOn) return;
    if (selectedSubtitleId !== null && selectedSubtitleId !== undefined) {
      const raf = requestAnimationFrame(() => {
        scrollToActive(selectedSubtitleId, true);
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [selectedSubtitleId, isSyncOn, scrollToActive]);

  const prevIsSyncOnRef = useRef<boolean>(isSyncOn);
  useEffect(() => {
    if (isSyncOn && !prevIsSyncOnRef.current) {
      let targetId = activeSubtitle?.id ?? selectedSubtitleId;
      if (!targetId && subtitles.length > 0) {
        const currentSegment =
          subtitles.find((s) => currentTime >= s.start && currentTime <= s.end) ||
          subtitles.find((s) => s.start >= currentTime) ||
          subtitles[subtitles.length - 1];
        targetId = currentSegment?.id;
      }
      if (targetId) {
        requestAnimationFrame(() => {
          scrollToActive(targetId, true);
        });
      }
    }
    prevIsSyncOnRef.current = isSyncOn;
  }, [isSyncOn, activeSubtitle?.id, selectedSubtitleId, subtitles, currentTime, scrollToActive]);

  useEffect(() => {
    if (!isSyncOn) return;
    if (activeSubtitle?.id !== undefined) {
      scrollToActive(activeSubtitle.id, true);
    }
  }, [activeSubtitle?.id, isSyncOn, scrollToActive]);

  const navigatePrev = useCallback(() => {
    if (filteredSubtitles.length === 0) return;
    const prevIdx = (searchResultIndex - 1 + filteredSubtitles.length) % filteredSubtitles.length;
    setSearchResultIndex(prevIdx);
    const target = filteredSubtitles[prevIdx];
    if (target) {
      setSelectedSubtitleId((curr) => (curr !== null && curr !== target.id ? null : curr));
      seekVideo(target.start);
      requestAnimationFrame(() => scrollToActive(target.id, true));
    }
  }, [filteredSubtitles, searchResultIndex, setSelectedSubtitleId, seekVideo, scrollToActive]);

  const navigateNext = useCallback(() => {
    if (filteredSubtitles.length === 0) return;
    const nextIdx = (searchResultIndex + 1) % filteredSubtitles.length;
    setSearchResultIndex(nextIdx);
    const target = filteredSubtitles[nextIdx];
    if (target) {
      setSelectedSubtitleId((curr) => (curr !== null && curr !== target.id ? null : curr));
      seekVideo(target.start);
      requestAnimationFrame(() => scrollToActive(target.id, true));
    }
  }, [filteredSubtitles, searchResultIndex, setSelectedSubtitleId, seekVideo, scrollToActive]);

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
      className="relative flex min-h-0 flex-1 md:flex-shrink-0 flex-col overflow-hidden bg-[#0a090e] w-full md:w-auto select-none"
      style={typeof window !== 'undefined' && window.innerWidth >= 768 && width ? { width: `${width}px` } : undefined}
    >
      {/* 1. CONSOLE CUE HEADER */}
      <div className="flex h-10 flex-shrink-0 items-center justify-between border-b border-[#1b1a24] px-3 bg-[#09080d]">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="font-display text-xs font-bold text-white tracking-tight truncate">
            รายการซับไตเติล
          </h2>
          <span className="font-mono font-bold text-zinc-400 tabular-nums text-[10.5px]">
            [{subtitles.length}]
          </span>
          {activeSubtitle && (
            <span className="font-mono text-[10px] font-bold text-[#c4b5fd] tabular-nums">
              #{subtitles.findIndex((s) => s.id === activeSubtitle.id) + 1}
            </span>
          )}
        </div>

        {/* Action Well */}
        <div className="flex items-center gap-1 rounded-md bg-[#111017] p-0.5 border border-[#201e2b]">
          {/* Sync / Follow Playhead Button */}
          <button
            type="button"
            onMouseDown={() => {
              syncBtnClickingRef.current = true;
              setTimeout(() => {
                syncBtnClickingRef.current = false;
              }, 300);
            }}
            onClick={() => {
              const next = !isSyncOnRef.current;
              isSyncOnRef.current = next;
              setIsSyncOn(next);
              if (next) {
                let targetId = activeSubtitle?.id ?? selectedSubtitleId;
                if (!targetId && subtitles.length > 0) {
                  const currentSegment =
                    subtitles.find((s) => currentTime >= s.start && currentTime <= s.end) ||
                    subtitles.find((s) => s.start >= currentTime) ||
                    subtitles[subtitles.length - 1];
                  targetId = currentSegment?.id;
                }
                requestAnimationFrame(() => {
                  if (targetId) {
                    scrollToActive(targetId, true);
                  }
                });
              }
            }}
            className={`flex h-6 w-6 items-center justify-center rounded transition-colors cursor-pointer ${
              isSyncOn
                ? 'bg-[#221e33] text-[#c4b5fd]'
                : 'text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-200'
            }`}
            title={
              isSyncOn
                ? 'ซิงค์เลื่อนตามวิดีโอ (Lock Sync ON) [กด L เพื่อเปิด/ปิด]'
                : 'ปิดการซิงค์ (Lock Sync OFF) [กด L เพื่อเปิด/ปิด]'
            }
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="8" />
              <line x1="12" y1="2" x2="12" y2="6" />
              <line x1="12" y1="18" x2="12" y2="22" />
              <line x1="2" y1="12" x2="6" y2="12" />
              <line x1="18" y1="12" x2="22" y2="12" />
            </svg>
          </button>

          {/* Delete Mode Toggle Button */}
          <button
            type="button"
            onClick={() => setIsDeleteMode((prev) => !prev)}
            className={`flex h-6.5 w-6.5 items-center justify-center rounded-lg transition-all border cursor-pointer ${
              isDeleteMode
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/35 shadow-sm'
                : 'border-transparent text-zinc-400 hover:bg-rose-500/15 hover:text-rose-300'
            }`}
            title={isDeleteMode ? 'ปิดโหมดลบ (Exit Delete Mode)' : 'เปิดโหมดลบการ์ดซับ (Delete Mode)'}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>

          {/* Search Toggle Button */}
          <button
            type="button"
            onClick={() => {
              setIsSearchOpen((prev) => {
                if (prev) {
                  setSearchQuery('');
                  setSearchResultIndex(0);
                }
                return !prev;
              });
            }}
            className={`flex h-6.5 w-6.5 items-center justify-center rounded-lg transition-all border cursor-pointer ${
              isSearchOpen
                ? 'bg-[#2d2250] text-[#e9d5ff] border-purple-500/40 shadow-sm'
                : 'border-transparent text-zinc-400 hover:bg-white/[0.05] hover:text-white'
            }`}
            title={isSearchOpen ? 'ปิดการค้นหา' : 'ค้นหาในซับไตเติล'}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        </div>
      </div>

      {/* 2. COLLAPSIBLE STUDIO SEARCH BAR */}
      <div
        className={`overflow-hidden border-b border-[#1c1a28] bg-[#0a090f] transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isSearchOpen
            ? 'max-h-14 opacity-100 px-3 py-2'
            : 'max-h-0 opacity-0 px-3 py-0 border-transparent pointer-events-none'
        }`}
      >
        <div className="flex w-full items-center gap-1.5">
          <div className="group relative flex flex-1 items-center rounded-xl bg-[#141222] border border-white/[0.08] focus-within:border-purple-500/60 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all">
            <svg
              className="ml-2.5 text-[#a78bfa] pointer-events-none flex-shrink-0"
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
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
              placeholder="ค้นหาคำพูดในซับไตเติล..."
              className="w-full bg-transparent px-2.5 py-1.5 text-xs text-[#f4f2f8] placeholder:text-zinc-500 outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchResultIndex(0);
                }}
                className="mr-2 text-zinc-400 hover:text-white cursor-pointer"
                title="ล้างข้อความค้นหา"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          {searchQuery && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <span className="font-mono text-[10px] tabular-nums text-[#c4b5fd] bg-white/[0.05] border border-white/[0.08] px-1.5 py-0.5 rounded font-semibold whitespace-nowrap">
                {filteredSubtitles.length > 0
                  ? `${searchResultIndex + 1}/${filteredSubtitles.length}`
                  : '0/0'}
              </span>
              <button
                type="button"
                onClick={navigatePrev}
                disabled={filteredSubtitles.length === 0}
                className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#141222] border border-white/[0.06] text-zinc-400 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
                title="ผลลัพธ์ก่อนหน้า"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="18 15 12 9 6 15" />
                </svg>
              </button>
              <button
                type="button"
                onClick={navigateNext}
                disabled={filteredSubtitles.length === 0}
                className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#141222] border border-white/[0.06] text-zinc-400 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
                title="ผลลัพธ์ถัดไป"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. SUBTITLES SCROLL LIST AREA */}
      <div ref={outerDivRef} className="relative min-h-0 flex-1 overflow-hidden">
        <div
          ref={transcriptScrollRef}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedSubtitleId(null);
            }
          }}
          className="panel-scroll-area h-full overflow-y-auto p-2.5 space-y-2 custom-scrollbar cursor-default"
        >
          {filteredSubtitles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-500/10 border border-purple-500/20 text-[#a78bfa] mb-3 shadow-[0_0_20px_rgba(139,92,246,0.15)]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <p className="text-xs font-semibold text-white">
                {searchQuery ? 'ไม่พบข้อความซับที่ค้นหา' : 'ยังไม่มีรายการซับไตเติล'}
              </p>
              <p className="text-[11px] text-zinc-500 mt-1">
                {searchQuery ? `ไม่พบผลลัพธ์สำหรับ "${searchQuery}"` : 'อัปโหลดวิดีโอเพื่อให้ AI ถอดเสียงอัตโนมัติ'}
              </p>
            </div>
          ) : (
            filteredSubtitles.map((sub, index) => {
              const isPlayingThis = activeSubtitle?.id === sub.id;
              const isSelected = selectedSubtitleId === sub.id;
              const subDuration = (sub.end - sub.start).toFixed(1);
              const isLastSegment = index === filteredSubtitles.length - 1;
              const effectiveEnd =
                isLastSegment && duration > 0 ? Math.min(sub.end, duration) : sub.end;
              const segmentDuration = Math.max(effectiveEnd - sub.start, 0.01);

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

              // Compute word count
              let wordCount = 0;
              if (sub.words && sub.words.length > 0) {
                wordCount = sub.words.length;
              } else {
                const trimmed = (sub.text || '').trim();
                if (trimmed) {
                  if (trimmed.includes(' ')) {
                    wordCount = trimmed.split(/\s+/).filter(Boolean).length;
                  } else if (typeof Intl !== 'undefined' && (Intl as any).Segmenter) {
                    try {
                      const segmenter = new (Intl as any).Segmenter('th', { granularity: 'word' });
                      wordCount = (Array.from(segmenter.segment(trimmed)) as any[]).filter(
                        (s) => s.isWordLike && s.segment.trim().length > 0
                      ).length;
                    } catch {
                      wordCount = 1;
                    }
                  } else {
                    wordCount = 1;
                  }
                }
              }

              return (
                <div
                  data-subtitle-id={sub.id}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      setSelectedSubtitleId(null);
                      if (document.activeElement instanceof HTMLElement) {
                        document.activeElement.blur();
                      }
                    } else if (e.key === 'Enter' && e.target === e.currentTarget) {
                      e.preventDefault();
                      const textarea = e.currentTarget.querySelector('textarea');
                      if (textarea) {
                        textarea.focus({ preventScroll: true });
                      }
                    } else if (
                      e.key === 'ArrowDown' ||
                      e.key === 'ArrowUp' ||
                      e.key === 'ArrowLeft' ||
                      e.key === 'ArrowRight'
                    ) {
                      turnSyncOff();
                    }
                  }}
                  onClick={(e) => {
                    const isClickOnTextarea = e.target instanceof HTMLTextAreaElement;
                    if (isSelected && isClickOnTextarea) {
                      return;
                    }
                    // Clicking a card previews/seeks to it without forcing per-card edit scope;
                    // exit active edit scope if the user clicks elsewhere to view a card.
                    if (selectedSubtitleId !== null) {
                      setSelectedSubtitleId(null);
                      if (document.activeElement instanceof HTMLElement) {
                        document.activeElement.blur();
                      }
                    }
                    seekVideo(sub.start);
                  }}
                  key={sub.id}
                  className={`group/card relative rounded-xl p-2.5 sm:p-3 transition-colors duration-150 cursor-pointer overflow-hidden border outline-none ${
                    isSelected && isPlayingThis
                      ? 'bg-[#171324] border-[#a78bfa]/75'
                      : isSelected
                      ? 'bg-[#14111e] border-[#8b5cf6]/65'
                      : isPlayingThis
                      ? 'bg-[#151221] border-[#8b5cf6]/50'
                      : 'bg-[#0f0e15] hover:bg-[#13121b] border-[#1d1c26] hover:border-white/20'
                  }`}
                >
                  {/* Razor Left Active Bar */}
                  {(isSelected || isPlayingThis) && (
                    <span
                      className={`absolute left-0 top-0 bottom-0 w-[2.5px] ${
                        isPlayingThis ? 'bg-[#a78bfa]' : 'bg-[#7c3aed]'
                      }`}
                    />
                  )}

                  {/* Card Top Row: #Index & Meta */}
                  <div className="relative z-10 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-mono text-[10px] tabular-nums">
                      <span
                        className={`font-bold ${
                          isPlayingThis
                            ? 'text-[#c4b5fd]'
                            : isSelected
                            ? 'text-white'
                            : 'text-zinc-500'
                        }`}
                      >
                        #{String(index + 1).padStart(2, '0')}
                      </span>
                      {isPlayingThis && (
                        <span className="font-bold tracking-wider text-[#a78bfa]">
                          · PLAY
                        </span>
                      )}
                      {sub.style && (
                        <span
                          className="font-semibold text-[#c4b5fd]"
                          title="แคปชันนี้ใช้สไตล์เฉพาะส่วน"
                        >
                          · CUSTOM STYLE
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className="tabular-nums font-mono text-[10px] text-zinc-500"
                        title={`${wordCount} คำในการ์ดนี้`}
                      >
                        {wordCount} คำ
                      </span>

                      {(Boolean(sub.isEdited) || Boolean(sub.style)) && (
                        <span
                          className="h-1.5 w-1.5 rounded-[1px] bg-[#8b5cf6]"
                          title="การ์ดนี้มีการแก้ไขเฉพาะส่วนแล้ว"
                        />
                      )}

                      {/* Explicit Edit Scope Toggle Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const cardEl = e.currentTarget.closest('[data-subtitle-id]');
                          if (isSelected) {
                            setSelectedSubtitleId(null);
                            if (document.activeElement instanceof HTMLElement) {
                              document.activeElement.blur();
                            }
                            return;
                          }
                          setSelectedSubtitleId(sub.id);
                          seekVideo(sub.start);
                          requestAnimationFrame(() => {
                            const textarea = cardEl?.querySelector('textarea') as HTMLTextAreaElement | null;
                            if (textarea) {
                              textarea.focus({ preventScroll: true });
                              const len = textarea.value.length;
                              textarea.setSelectionRange(len, len);
                            }
                          });
                        }}
                        className={`flex h-5 items-center gap-1 rounded-md border px-1.5 text-[10px] font-semibold transition-all active:scale-95 cursor-pointer ${
                          isSelected
                            ? 'bg-[#7c3aed] hover:bg-[#6d28d9] border-[#a78bfa]/70 text-white shadow-[0_0_10px_rgba(124,58,237,0.35)]'
                            : 'bg-[#161325] hover:bg-[#2d2250] border-white/[0.08] hover:border-purple-400/45 text-zinc-300 hover:text-[#e9d5ff]'
                        }`}
                        title={
                          isSelected
                            ? 'คลิกเพื่อออกจากการแก้ไขเฉพาะการ์ดนี้'
                            : 'คลิกเพื่อแก้ไขข้อความและกำหนดสไตล์เฉพาะการ์ดนี้'
                        }
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                        </svg>
                        <span>แก้ไข</span>
                      </button>

                      {/* Delete Button (Only visible when Header Delete Mode is active) */}
                      {isDeleteMode && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSegment(sub.id);
                          }}
                          className="flex h-5 w-5 items-center justify-center rounded-md transition-all active:scale-90 cursor-pointer bg-rose-500/20 text-rose-300 hover:bg-rose-500/35 hover:text-white border border-rose-500/30"
                          title="ลบการ์ดซับนี้"
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Middle: Editable Textarea ONLY when explicitly editing this card; otherwise clickable preview text */}
                  <div className="relative z-10 my-2">
                    {isSelected ? (
                      <textarea
                        value={sub.text}
                        onChange={(e) => onTextChange(sub.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            const target = e.currentTarget;
                            const cursorIndex = target.selectionStart;
                            if (cursorIndex > 0 && cursorIndex < (sub.text || '').length) {
                              onSplitAtCursor?.(sub.id, cursorIndex);
                            }
                          } else if (e.key === 'Backspace') {
                            const target = e.currentTarget;
                            if (target.selectionStart === 0 && target.selectionEnd === 0) {
                              e.preventDefault();
                              onMergeWithPrevious?.(sub.id);
                            }
                          } else if (e.key === 'ArrowDown') {
                            const target = e.currentTarget;
                            const val = target.value;
                            const isLastLine = !val.slice(target.selectionEnd).includes('\n');
                            if (isLastLine) {
                              turnSyncOff();
                              const currentIdx = filteredSubtitles.findIndex((s) => s.id === sub.id);
                              if (currentIdx !== -1 && currentIdx < filteredSubtitles.length - 1) {
                                e.preventDefault();
                                const nextSub = filteredSubtitles[currentIdx + 1];
                                setSelectedSubtitleId(nextSub.id);
                                seekVideo(nextSub.start);
                                requestAnimationFrame(() => {
                                  const nextTextarea = transcriptScrollRef.current?.querySelector(
                                    `[data-subtitle-id="${nextSub.id}"] textarea`
                                  ) as HTMLTextAreaElement | null;
                                  if (nextTextarea) {
                                    nextTextarea.focus({ preventScroll: true });
                                    const len = nextTextarea.value.length;
                                    nextTextarea.setSelectionRange(len, len);
                                  }
                                });
                              }
                            }
                          } else if (e.key === 'ArrowUp') {
                            const target = e.currentTarget;
                            const val = target.value;
                            const isFirstLine = !val.slice(0, target.selectionStart).includes('\n');
                            if (isFirstLine) {
                              turnSyncOff();
                              const currentIdx = filteredSubtitles.findIndex((s) => s.id === sub.id);
                              if (currentIdx > 0) {
                                e.preventDefault();
                                const prevSub = filteredSubtitles[currentIdx - 1];
                                setSelectedSubtitleId(prevSub.id);
                                seekVideo(prevSub.start);
                                requestAnimationFrame(() => {
                                  const prevTextarea = transcriptScrollRef.current?.querySelector(
                                    `[data-subtitle-id="${prevSub.id}"] textarea`
                                  ) as HTMLTextAreaElement | null;
                                  if (prevTextarea) {
                                    prevTextarea.focus({ preventScroll: true });
                                    const len = prevTextarea.value.length;
                                    prevTextarea.setSelectionRange(len, len);
                                  }
                                });
                              }
                            }
                          } else if (e.key === 'Escape') {
                            e.preventDefault();
                            setSelectedSubtitleId(null);
                            e.currentTarget.blur();
                          }
                        }}
                        rows={Math.max(1, sub.text.split('\n').length)}
                        className="block w-full bg-transparent text-[13.5px] sm:text-[14px] leading-relaxed focus:outline-none rounded-lg px-1 py-0.5 resize-none cursor-text [field-sizing:content] overflow-hidden tracking-[0.01em] placeholder-zinc-500 transition-colors text-white font-semibold"
                      />
                    ) : (
                      <div
                        className={`block w-full text-[13.5px] sm:text-[14px] leading-relaxed rounded-lg px-1 py-0.5 tracking-[0.01em] whitespace-pre-wrap break-words transition-colors ${
                          isPlayingThis
                            ? 'text-white font-semibold'
                            : isPastThis
                            ? 'text-zinc-300 font-medium'
                            : 'text-zinc-200 font-medium'
                        }`}
                      >
                        {sub.text}
                      </div>
                    )}
                  </div>

                  {/* Bottom Row: Full-Width Interactive Studio Waveform Scrubber Track */}
                  <div className="relative z-10 flex items-center gap-2 pt-0.5">
                    <div
                      onPointerDown={(e) => handlePillPointerDown(e, sub)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSubtitleId((curr) => (curr !== null && curr !== sub.id ? null : curr));
                      }}
                      className={`group/pill relative flex-1 overflow-hidden rounded-xl px-2.5 py-1.5 font-mono text-[10.5px] tabular-nums select-none cursor-pointer transition-all border ${
                        scrubbingSubId === sub.id
                          ? 'ring-1.5 ring-purple-400/80 bg-[#2d2250] text-white border-purple-400/60 shadow-[0_0_15px_rgba(168,85,247,0.45)]'
                          : isSelected || isPlayingThis
                          ? 'bg-[#120f20] text-[#e9d5ff] border-purple-500/40 font-semibold shadow-inner hover:border-purple-400/65'
                          : isPastThis
                          ? 'bg-[#0b0912] text-zinc-400 border-white/[0.05] opacity-80 hover:opacity-100 hover:border-white/[0.12] hover:text-zinc-200'
                          : 'bg-[#0b0912] text-[#c4b5fd]/90 border-white/[0.06] hover:border-purple-500/35 hover:text-white'
                      }`}
                      title="คลิกหรือลากเมาส์เพื่อเลื่อนเวลาในแคปชันนี้"
                    >
                      {/* Subtle Micro-Waveform Track Background inside Scrubber */}
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-y-1 right-2 left-1/2 flex items-center justify-end gap-[2px] opacity-25"
                      >
                        {[35, 70, 45, 85, 55, 95, 60, 40, 75, 50, 80, 45, 65, 35].map((h, i) => (
                          <span
                            key={i}
                            className={`w-[1.5px] rounded-full ${
                              isPlayingThis ? 'bg-purple-300' : 'bg-zinc-500'
                            }`}
                            style={{ height: `${h}%` }}
                          />
                        ))}
                      </div>

                      {/* Live Clean Scrub Progress Fill */}
                      {segmentProgress > 0 && (
                        <span
                          className={`absolute inset-y-0 left-0 pointer-events-none transition-none ${
                            scrubbingSubId === sub.id
                              ? 'bg-[#a78bfa]/30 border-r border-[#a78bfa]'
                              : isPastThis
                              ? 'bg-white/[0.04]'
                              : 'bg-[#8b5cf6]/25 border-r border-[#a78bfa]'
                          }`}
                          style={{ width: `${segmentProgress}%` }}
                        />
                      )}

                      <div className="relative z-10 flex items-center justify-between gap-1.5 pointer-events-none">
                        <div className="flex items-center gap-1.5">
                          {(isPlayingThis || isSelected) && (
                            <span className="flex items-end gap-[2px] h-3 mr-0.5">
                              <span
                                className={`w-[2px] bg-[#c4b5fd] rounded-full ${
                                  isPlayingThis
                                    ? 'animate-[equalizer_0.8s_ease-in-out_infinite]'
                                    : 'h-2'
                                }`}
                              />
                              <span
                                className={`w-[2px] bg-[#c4b5fd] rounded-full ${
                                  isPlayingThis
                                    ? 'animate-[equalizer_0.8s_ease-in-out_0.2s_infinite]'
                                    : 'h-3'
                                }`}
                              />
                              <span
                                className={`w-[2px] bg-[#c4b5fd] rounded-full ${
                                  isPlayingThis
                                    ? 'animate-[equalizer_0.8s_ease-in-out_0.4s_infinite]'
                                    : 'h-1.5'
                                }`}
                              />
                            </span>
                          )}
                          <span>
                            {formatTime(sub.start)} → {formatTime(effectiveEnd)}
                          </span>
                        </div>

                        <span
                          className={`font-mono text-[10px] tabular-nums font-bold px-1.5 py-0.2 rounded ${
                            isSelected || isPlayingThis
                              ? 'bg-black/35 text-[#e9d5ff]'
                              : 'text-zinc-500'
                          }`}
                        >
                          {subDuration}s
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          const container = e.currentTarget.closest('[data-subtitle-id]');
                          const textarea = container?.querySelector('textarea') as HTMLTextAreaElement | null;
                          const cursorIndex =
                            textarea?.selectionStart ?? Math.floor((sub.text || '').length / 2);
                          if (cursorIndex > 0 && cursorIndex < (sub.text || '').length) {
                            onSplitAtCursor?.(sub.id, cursorIndex);
                          } else {
                            onSplitSegment?.(sub.id);
                          }
                        }}
                        className="inline-flex items-center gap-1 rounded-lg bg-[#1d1832] hover:bg-[#2d2250] border border-purple-400/30 px-2 py-1 text-[9.5px] text-zinc-300 hover:text-white font-mono flex-shrink-0 transition-colors cursor-pointer"
                        title="ตัดแบ่งการ์ดที่เคอร์เซอร์ (หรือกดปุ่ม Enter ในกล่องข้อความ)"
                      >
                        <span className="text-[#c4b5fd] font-bold">↵</span> ตัดคำ
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
        <CustomScrollbar scrollRef={transcriptScrollRef} />
      </div>
    </div>
  );
}

export default React.memo(TranscriptPanel);
