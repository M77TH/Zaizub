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
  isPlaying = false,
  isSyncOn: propIsSyncOn,
  setIsSyncOn: propSetIsSyncOn,
  seekVideo,
  onTextChange,
  onDeleteSegment,
  onSplitSegment,
  onSplitAtCursor,
  onMergeWithPrevious,
  onMoveSegment,
  formatTime,
}: TranscriptPanelProps) {
  // Hook handles: wheel smooth scroll, stopPropagation (blocks Lenis), scrollTo imperative handle
  const { ref: transcriptScrollRef, scrollTo: smoothScrollTo } = useSmoothScrollElement<HTMLDivElement>();

  const [internalIsSyncOn, setInternalIsSyncOn] = useState<boolean>(true);
  const isSyncOn = propIsSyncOn !== undefined ? propIsSyncOn : internalIsSyncOn;
  const setIsSyncOn = propSetIsSyncOn !== undefined ? propSetIsSyncOn : setInternalIsSyncOn;
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
    isSyncOnRef.current = false;
    setIsSyncOn(false);
  }, [setIsSyncOn]);

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

  // Interactive Timeline Scrubber inside Subtitle Card (Scrubs playhead through this card)
  const [scrubbingSubId, setScrubbingSubId] = useState<number | null>(null);

  const handlePillPointerDown = useCallback((e: React.PointerEvent, sub: SubtitleSegment) => {
    e.stopPropagation();
    if (e.button !== 0) return;

    setSelectedSubtitleId(sub.id);
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

    // Immediate seek on pointerdown (click)
    updateSeekFromPointer(e.clientX);

    const onPointerMove = (moveEvt: PointerEvent) => {
      updateSeekFromPointer(moveEvt.clientX);
    };

    const onPointerUp = (upEvt: PointerEvent) => {
      setScrubbingSubId(null);
      setSelectedSubtitleId(sub.id);
      targetEl.releasePointerCapture(upEvt.pointerId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  }, [seekVideo, setSelectedSubtitleId]);

  /** Scroll the target card to the top of the panel with smooth ease gliding. */
  const scrollToActive = useCallback((targetSpecificId?: number | string | null, smooth: boolean = true) => {
    const targetId = targetSpecificId ?? activeSubtitle?.id ?? selectedSubtitleId;
    if (targetId === null || targetId === undefined || !transcriptScrollRef.current) return;

    const container = transcriptScrollRef.current;
    const el = container.querySelector(`[data-subtitle-id="${targetId}"]`) as HTMLElement | null;
    if (!el) return;

    // Exact viewport delta calculation between card top and container top
    const containerRect = container.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const topOffset = 10; // matches p-2.5 padding of scroll container
    const targetTop = container.scrollTop + (elRect.top - containerRect.top) - topOffset;

    isProgrammaticScrollRef.current = true;
    smoothScrollTo.current(Math.max(0, targetTop), smooth);
    setTimeout(() => { isProgrammaticScrollRef.current = false; }, smooth ? 350 : 50);
  }, [activeSubtitle?.id, selectedSubtitleId, smoothScrollTo]);

  /**
   * Ensure a target subtitle card is within the visible frame of the transcript scroll area.
   * If the card is already comfortably in view, do nothing.
   * If it is below or cut off at the bottom, scroll down to bring it into view (with padding).
   * If it is above or cut off at the top, scroll up to bring it into view (with padding).
   */
  const scrollCardIntoView = useCallback((targetSpecificId?: number | string | null, smooth: boolean = true) => {
    const targetId = targetSpecificId ?? selectedSubtitleId ?? activeSubtitle?.id;
    if (targetId === null || targetId === undefined || !transcriptScrollRef.current) return;

    const container = transcriptScrollRef.current;
    const el = container.querySelector(`[data-subtitle-id="${targetId}"]`) as HTMLElement | null;
    if (!el) return;

    const topPadding = 48; // padding from top so header/prev card has room
    const bottomPadding = 48; // padding from bottom so next card has room

    const containerRect = container.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const cardTop = container.scrollTop + (elRect.top - containerRect.top);
    const cardHeight = el.offsetHeight;
    const cardBottom = cardTop + cardHeight;

    const viewTop = container.scrollTop + topPadding;
    const viewBottom = container.scrollTop + container.clientHeight - bottomPadding;

    // Check if card is cut off or outside the visible window
    const isAbove = cardTop < viewTop;
    const isBelow = cardBottom > viewBottom;

    if (!isAbove && !isBelow) {
      // The card is already comfortably inside the frame! No scroll needed.
      return;
    }

    let targetTop: number;
    if (isAbove || cardHeight > (container.clientHeight - topPadding - bottomPadding)) {
      // Bring card top into view, offset by topPadding
      targetTop = Math.max(0, cardTop - topPadding);
    } else {
      // Bring card bottom into view, offset by bottomPadding
      targetTop = Math.max(0, cardBottom - container.clientHeight + bottomPadding);
    }

    isProgrammaticScrollRef.current = true;
    smoothScrollTo.current(targetTop, smooth);
    setTimeout(() => { isProgrammaticScrollRef.current = false; }, smooth ? 350 : 50);
  }, [selectedSubtitleId, activeSubtitle?.id, smoothScrollTo]);

  // Keep selected card in frame / locked to top whenever selectedSubtitleId changes
  useEffect(() => {
    if (selectedSubtitleId !== null && selectedSubtitleId !== undefined) {
      const raf = requestAnimationFrame(() => {
        if (isSyncOn) {
          scrollToActive(selectedSubtitleId, true);
        } else {
          scrollCardIntoView(selectedSubtitleId, true);
        }
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [selectedSubtitleId, isSyncOn, scrollToActive, scrollCardIntoView]);

  // When sync is turned back ON (e.g. via 'L' shortcut or clicking the lock button),
  // smoothly scroll the current playing/active or selected card to the top
  const prevIsSyncOnRef = useRef<boolean>(isSyncOn);
  useEffect(() => {
    if (isSyncOn && !prevIsSyncOnRef.current) {
      let targetId = activeSubtitle?.id ?? selectedSubtitleId;
      if (!targetId && subtitles.length > 0) {
        const currentSegment = subtitles.find(s => currentTime >= s.start && currentTime <= s.end)
          || subtitles.find(s => s.start >= currentTime)
          || subtitles[subtitles.length - 1];
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

  // When Lock Sync is ON, whenever active card changes (playback or scrubbing timeline),
  // automatically glide the active card to the top of the transcript list
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
      className="relative flex min-h-0 flex-1 md:flex-shrink-0 flex-col overflow-hidden bg-[#13121b] w-full md:w-auto"
      style={typeof window !== 'undefined' && window.innerWidth >= 768 && width ? { width: `${width}px` } : undefined}
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
            title={isSyncOn ? 'ซิงค์เลื่อนตามวิดีโอ (Lock Sync ON) [กด L เพื่อเปิด/ปิด]' : 'ปิดการซิงค์ (Lock Sync OFF) [กด L เพื่อเปิด/ปิด]'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="8" />
              <line x1="12" y1="2" x2="12" y2="6" />
              <line x1="12" y1="18" x2="12" y2="22" />
              <line x1="2" y1="12" x2="6" y2="12" />
              <line x1="18" y1="12" x2="22" y2="12" />
            </svg>
          </button>

          {/* Delete Mode Toggle button (Borderless) */}
          <button
            onClick={() => {
              setIsDeleteMode((prev) => !prev);
            }}
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
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    setSelectedSubtitleId(null);
                    if (document.activeElement instanceof HTMLElement) {
                      document.activeElement.blur();
                    }
                  } else if (e.key === 'Enter' && e.target === e.currentTarget) {
                    // Enter on focused card container -> enter editing mode
                    e.preventDefault();
                    const textarea = e.currentTarget.querySelector('textarea');
                    if (textarea) {
                      textarea.focus({ preventScroll: true });
                    }
                  } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                    turnSyncOff();
                  }
                }}
                onClick={(e) => {
                  const isClickOnTextarea = e.target instanceof HTMLTextAreaElement;
                  if (isSelected && !isClickOnTextarea) {
                    setSelectedSubtitleId(null);
                    if (document.activeElement instanceof HTMLElement) {
                      document.activeElement.blur();
                    }
                    return;
                  }

                  setSelectedSubtitleId(sub.id);
                  seekVideo(sub.start);

                  if (!isSelected) {
                    // Automatically place blinking cursor into textarea if clicked outside without triggering browser layout jump
                    const textarea = e.currentTarget.querySelector('textarea');
                    if (textarea && document.activeElement !== textarea) {
                      textarea.focus({ preventScroll: true });
                      const len = textarea.value.length;
                      textarea.setSelectionRange(len, len);
                    }
                  }
                }}
                key={sub.id}
                className={`relative rounded-2xl p-3.5 transition-colors duration-200 cursor-pointer overflow-hidden ${
                  isSelected && isPlayingThis
                    ? 'bg-[#382663] text-white shadow-lg'
                    : isSelected
                    ? 'bg-[#2d2250] text-white shadow-md'
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
                    {/* Word Count Indicator */}
                    {(() => {
                      const trimmed = (sub.text || '').trim();
                      const count = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
                      return (
                        <span
                          className={`text-[10px] tabular-nums font-mono px-1.5 py-0.2 rounded transition-colors ${
                            isSelected || isPlayingThis
                              ? 'bg-purple-500/25 text-purple-200 border border-purple-400/30'
                              : 'bg-white/[0.04] text-gray-400 border border-white/[0.05]'
                          }`}
                          title={`${count} คำในการ์ดนี้`}
                        >
                          {count} คำ
                        </span>
                      );
                    })()}

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

                {/* Subtitle text (Dynamic Auto-Sizing with Version 1 Enter Split & Backspace Merge) */}
                <div className="relative z-10 my-2.5">
                  <textarea
                    value={sub.text}
                    onFocus={() => {
                      setSelectedSubtitleId(sub.id);
                      seekVideo(sub.start);
                    }}
                    onChange={(e) => onTextChange(sub.id, e.target.value)}
                    onKeyDown={(e) => {
                      // 1. Enter key -> Split at cursor (Version 1 Main Method)
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        const target = e.currentTarget;
                        const cursorIndex = target.selectionStart;
                        if (cursorIndex > 0 && cursorIndex < (sub.text || '').length) {
                          onSplitAtCursor?.(sub.id, cursorIndex);
                        }
                      }
                      // 2. Backspace key at start of card (index 0) -> Merge with previous card
                      else if (e.key === 'Backspace') {
                        const target = e.currentTarget;
                        if (target.selectionStart === 0 && target.selectionEnd === 0) {
                          e.preventDefault();
                          onMergeWithPrevious?.(sub.id);
                        }
                      }
                      // 3. ArrowDown on last line -> Move to next card
                      else if (e.key === 'ArrowDown') {
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
                      }
                      // 4. ArrowUp on first line -> Move to previous card
                      else if (e.key === 'ArrowUp') {
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
                      }
                      // 5. Escape key inside textarea -> Unselect card and exit editing
                      else if (e.key === 'Escape') {
                        e.preventDefault();
                        setSelectedSubtitleId(null);
                        e.currentTarget.blur();
                      }
                    }}
                    rows={Math.max(1, sub.text.split('\n').length)}
                    className="block w-full bg-transparent text-[14px] font-medium leading-relaxed text-white focus:outline-none rounded px-1 py-0 resize-none cursor-text [field-sizing:content] overflow-hidden tracking-[0.01em] placeholder-white/40"
                  />

                  {/* Touch/Mobile-friendly Cut Accessory Bar (Visible only on mobile when card is selected) */}
                  {isSelected && (
                    <div className="flex md:hidden items-center justify-end gap-1.5 mt-1.5 pt-1.5 border-t border-white/5 animate-in fade-in duration-100">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const container = e.currentTarget.closest('[data-subtitle-id]');
                          const textarea = container?.querySelector('textarea');
                          const cursorIndex = textarea?.selectionStart ?? Math.floor((sub.text || '').length / 2);
                          if (cursorIndex > 0 && cursorIndex < (sub.text || '').length) {
                            onSplitAtCursor?.(sub.id, cursorIndex);
                          } else {
                            // Fallback: split in the middle if no cursor
                            onSplitSegment?.(sub.id);
                          }
                        }}
                        className="flex items-center gap-1 rounded-lg bg-purple-600/25 border border-purple-500/40 px-2 py-1 text-[11px] font-semibold text-purple-200 active:scale-95"
                        title="ตัดการ์ดที่ตำแหน่งเคอร์เซอร์"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="6" cy="6" r="3" />
                          <circle cx="6" cy="18" r="3" />
                          <line x1="20" y1="4" x2="8.12" y2="15.88" />
                          <line x1="14.47" y1="14.48" x2="20" y2="20" />
                          <line x1="8.12" y1="8.12" x2="12" y2="12" />
                        </svg>
                        <span>ตัดคำที่นี่</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Timestamp Row with Soundwave Equalizer & Live Progress inside Pill */}
                <div className="relative z-10 flex items-center justify-between">
                  <div
                    onPointerDown={(e) => handlePillPointerDown(e, sub)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedSubtitleId(sub.id);
                    }}
                    className={`group/pill relative overflow-hidden rounded-lg px-2.5 py-1 text-[11px] tabular-nums antialiased select-none cursor-pointer transition-all ${
                      scrubbingSubId === sub.id
                        ? 'ring-1.5 ring-purple-400/80 bg-[#2d2250] text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]'
                        : isSelected || isPlayingThis
                        ? 'bg-[#2d2250] text-[#c4b5fd] font-semibold shadow-sm hover:ring-1 hover:ring-purple-400/40'
                        : isPastThis
                        ? 'bg-[#231b3e]/60 text-gray-400 opacity-60 hover:opacity-100 hover:bg-[#2d2250]/80 hover:text-gray-200'
                        : 'bg-[#231b3e]/80 text-[#c4b5fd]/80 hover:opacity-100 hover:bg-[#2d2250] hover:text-white'
                    }`}
                    title="คลิกหรือลากเมาส์เพื่อเลื่อนตำแหน่งเวลาในแคปชันนี้ (Click/Drag to scrub)"
                  >
                    {/* Live Progress Fill Bar inside timestamp button */}
                    {segmentProgress > 0 && (
                      <span
                        className={`absolute inset-y-0 left-0 pointer-events-none transition-none ${
                          scrubbingSubId === sub.id
                            ? 'bg-[#8b5cf6]/60'
                            : isPastThis
                            ? 'bg-[#4c1d95]/40'
                            : 'bg-[#7c3aed]/50'
                        }`}
                        style={{ width: `${segmentProgress}%` }}
                      />
                    )}

                    {/* Timestamp Inner Content: Soundwave Equalizer + Millisecond Text */}
                    <div className="relative z-10 flex items-center gap-1.5 pointer-events-none">

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
                  </div>

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