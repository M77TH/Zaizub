'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { resolveMediaUrl } from '@/lib/api';
import type { VideoProject } from '@/lib/projects/projectMapper';
import {
  CardHoverChrome,
  CardThumbnailMedia,
} from './StudioCardHover';

export { resolveMediaUrl };
export type { VideoProject };

interface VideoCardProps {
  video: VideoProject;
  index?: number;
  layout?: 'grid' | 'strip';
  onDelete?: (id: string) => void;
  onRename?: (id: string, newTitle: string) => void;
  onDuplicate?: (id: string) => void;
  onRetryUpload?: (id: string) => void;
  onDismissUpload?: (id: string) => void;
}

export default function VideoCard({
  video,
  index,
  layout = 'grid',
  onDelete,
  onRename,
  onDuplicate,
  onRetryUpload,
  onDismissUpload,
}: VideoCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [title, setTitle] = useState(video.title);
  const menuRef = useRef<HTMLDivElement>(null);

  const resolvedVideoUrl = resolveMediaUrl(video.video_url);
  const resolvedThumbnailUrl = resolveMediaUrl(video.thumbnail_url);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsRenaming(false);
    if (onRename && title.trim()) {
      onRename(video.id, title.trim());
    }
  };

  const isProcessing = video.status === 'processing';
  const hasUploadError = Boolean(isProcessing && video.uploadError);
  const uploadPct =
    typeof video.uploadPercent === 'number'
      ? Math.max(4, Math.min(99, Math.round(video.uploadPercent)))
      : undefined;

  const statusMeta =
    video.status === 'done'
      ? { label: 'DONE', thLabel: 'เรนเดอร์แล้ว', color: 'text-emerald-400', dot: 'bg-emerald-400' }
      : video.status === 'processing'
      ? hasUploadError
        ? { label: 'FAILED', thLabel: 'อัปโหลดไม่สำเร็จ', color: 'text-rose-400', dot: 'bg-rose-400' }
        : { label: 'UPLOADING', thLabel: 'กำลังอัปโหลด', color: 'text-[#c4b5fd]', dot: 'bg-[#a78bfa] animate-pulse' }
      : { label: 'DRAFT', thLabel: 'แบบร่าง', color: 'text-[#c4b5fd]', dot: 'bg-[#8b5cf6]' };

  const formattedIndex =
    index !== undefined ? String(index + 1).padStart(2, '0') : '--';

  const contextMenuPopover = menuOpen && (
    <div
      className={`absolute right-0 ${
        layout === 'strip'
          ? 'top-full mt-1.5 origin-top-right anim-dropdown'
          : 'bottom-full mb-1.5 origin-bottom-right anim-dropup'
      } w-48 rounded-xl border border-[#282636] bg-[#0e0d14] p-1 shadow-[0_20px_50px_rgba(0,0,0,0.92)] z-30`}
    >
      <button
        type="button"
        onClick={() => {
          setMenuOpen(false);
          setTitle(video.title);
          setIsRenaming(true);
        }}
        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-zinc-200 rounded-lg hover:bg-white/[0.07] hover:text-white transition-colors text-left"
      >
        <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
        เปลี่ยนชื่อโปรเจกต์
      </button>
      {onDuplicate && (
        <button
          type="button"
          onClick={() => {
            setMenuOpen(false);
            onDuplicate(video.id);
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-zinc-200 rounded-lg hover:bg-white/[0.07] hover:text-white transition-colors text-left"
        >
          <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" strokeWidth="2" />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
            />
          </svg>
          ทำสำเนาโปรเจกต์
        </button>
      )}
      {onDelete && (
        <>
          <div className="my-1 border-t border-[#1e1d29]" />
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              onDelete(video.id);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-400 rounded-lg hover:bg-rose-500/10 hover:text-rose-300 transition-colors text-left"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            ลบวิดีโอ
          </button>
        </>
      )}
    </div>
  );

  // STRIP / CONTACT-SHEET LIST ROW LAYOUT
  if (layout === 'strip') {
    return (
      <div
        className={`group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 transition-[border-color,background-color,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          isProcessing
            ? hasUploadError
              ? 'border-rose-500/40 bg-[#120b10]'
              : 'border-[#8b5cf6]/45 bg-[#0e0c18] shadow-[0_0_24px_-12px_rgba(139,92,246,0.45)]'
            : 'studio-card border-[#1f1e29] bg-[#0c0b11] hover:border-[#a78bfa]/40 hover:bg-[#100d19] hover:shadow-[0_10px_28px_-10px_rgba(167,139,250,0.28),0_6px_18px_rgba(0,0,0,0.5)]'
        } ${menuOpen ? 'z-30' : ''}`}
      >
        {!isProcessing && <CardHoverChrome rounded="xl" showLeftRail />}

        <div className="relative z-[2] flex items-center gap-3.5 min-w-0 flex-1">
          <span className="font-mono text-xs font-bold text-zinc-600 group-hover:text-[#c4b5fd] transition-colors duration-200 tabular-nums w-6 flex-shrink-0">
            #{formattedIndex}
          </span>

          {/* Compact 16:9 Thumbnail Frame */}
          {isProcessing ? (
            <div className="relative h-12 w-20 sm:h-13 sm:w-24 rounded-lg overflow-hidden bg-[#08070f] border border-[#8b5cf6]/30 flex-shrink-0">
              {!hasUploadError && (
                <>
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.32),transparent_72%)] anim-upload-aura" />
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,transparent_25%,rgba(196,181,253,0.28)_50%,transparent_75%)] anim-upload-sweep" />
                </>
              )}
              {hasUploadError && (
                <div className="pointer-events-none absolute inset-0 bg-rose-950/35" />
              )}
            </div>
          ) : (
            <Link
              href={`/editor?id=${video.id}`}
              className="relative h-12 w-20 sm:h-13 sm:w-24 rounded-lg overflow-hidden bg-[#050508] border border-white/[0.08] group-hover:border-[#8b5cf6]/50 transition-colors duration-300 flex-shrink-0"
            >
              <CardThumbnailMedia
                thumbnailUrl={resolvedThumbnailUrl}
                videoUrl={resolvedVideoUrl}
                title={video.title}
                variant="strip"
              />
            </Link>
          )}

          <div className="min-w-0 flex-1">
            {isRenaming ? (
              <form onSubmit={handleRenameSubmit}>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => setIsRenaming(false)}
                  autoFocus
                  className="w-full max-w-sm px-2 py-1 text-xs bg-[#14131c] border border-[#8b5cf6] rounded-md text-white focus:outline-none"
                />
              </form>
            ) : isProcessing ? (
              <span className="block font-semibold text-sm text-zinc-100 truncate" title={video.title}>
                {video.title}
              </span>
            ) : (
              <Link
                href={`/editor?id=${video.id}`}
                className="block font-semibold text-sm text-zinc-100 group-hover:text-[#ede9fe] truncate transition-colors duration-200"
                title={video.title}
              >
                {video.title}
              </Link>
            )}
            {isProcessing && (
              <p className={`text-[11.5px] truncate mt-0.5 ${hasUploadError ? 'text-rose-300' : 'text-[#c4b5fd]'}`}>
                {hasUploadError
                  ? video.uploadError
                  : uploadPct !== undefined
                  ? `กำลังอัปโหลดและประมวลผล (${uploadPct}%)...`
                  : 'กำลังอัปโหลดและประมวลผล...'}
              </p>
            )}
          </div>
        </div>

        <div className={`relative ${menuOpen ? 'z-30' : 'z-[2]'} flex items-center justify-between sm:justify-end gap-4 pl-9 sm:pl-0 flex-shrink-0`}>
          <div className="flex items-center gap-3 font-mono text-[11px] text-zinc-500 group-hover:text-zinc-400 transition-colors duration-200 tabular-nums">
            {video.aspectRatio && (
              <span className="text-zinc-400">{video.aspectRatio}</span>
            )}
            {video.captionCount !== undefined && (
              <span>{video.captionCount} CUES</span>
            )}
            {video.duration && (
              <span className="text-zinc-300 font-semibold">{video.duration}</span>
            )}
            <span className={`inline-flex items-center gap-1.5 font-semibold ${statusMeta.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
              {statusMeta.label}
            </span>
          </div>

          {isProcessing ? (
            hasUploadError ? (
              <div className="flex items-center gap-1.5">
                {onRetryUpload && (
                  <button
                    type="button"
                    onClick={() => onRetryUpload(video.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#8b5cf6]/50 bg-[#7c3aed]/20 hover:bg-[#7c3aed] px-2.5 py-1 text-xs font-semibold text-white transition-colors cursor-pointer"
                  >
                    ลองใหม่
                  </button>
                )}
                {onDismissUpload && (
                  <button
                    type="button"
                    onClick={() => onDismissUpload(video.id)}
                    className="inline-flex items-center rounded-lg border border-white/10 bg-white/5 hover:bg-rose-500/20 px-2.5 py-1 text-xs font-medium text-zinc-300 hover:text-rose-200 transition-colors cursor-pointer"
                  >
                    ลบ
                  </button>
                )}
              </div>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#8b5cf6]/30 bg-[#171326] px-2.5 py-1 text-xs font-semibold text-[#c4b5fd]">
                กำลังโหลด...
              </span>
            )
          ) : (
            <div className="relative flex-shrink-0" ref={menuRef}>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setMenuOpen((prev) => !prev);
                }}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                aria-label="เมนูตัวเลือก"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="5" cy="12" r="1.8" />
                  <circle cx="12" cy="12" r="1.8" />
                  <circle cx="19" cy="12" r="1.8" />
                </svg>
              </button>
              {contextMenuPopover}
            </div>
          )}
        </div>
      </div>
    );
  }

  // GRID STUDIO CLIP CARD LAYOUT
  if (isProcessing) {
    return (
      <div
        className={`group relative flex flex-col rounded-2xl border transition-all duration-200 overflow-hidden ${
          hasUploadError
            ? 'border-rose-500/45 bg-[#120b10]'
            : 'border-[#8b5cf6]/45 bg-[#0d0b16] shadow-[0_0_32px_-12px_rgba(139,92,246,0.45)]'
        }`}
      >
        {/* Animated Glowing Uploading Stage (no distracting icon — moving glow communicates loading) */}
        <div className="relative aspect-video w-full overflow-hidden bg-[#08070f] border-b border-white/[0.06]">
          {resolvedVideoUrl && (
            <video
              src={`${resolvedVideoUrl}#t=0.5`}
              muted
              playsInline
              preload="metadata"
              className="w-full h-full object-cover object-[center_25%] opacity-25 blur-[2px]"
            />
          )}

          {hasUploadError ? (
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(244,63,94,0.18),transparent_70%)]" />
          ) : (
            <>
              {/* Pulsing ambient aura glow */}
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.28)_0%,rgba(124,58,237,0.1)_48%,transparent_75%)] anim-upload-aura" />
              {/* Diagonal moving sheen sweep */}
              <div className="pointer-events-none absolute inset-y-0 -inset-x-1/2 bg-[linear-gradient(110deg,transparent_28%,rgba(167,139,250,0.18)_46%,rgba(233,213,255,0.28)_50%,rgba(167,139,250,0.18)_54%,transparent_72%)] anim-upload-sweep" />
            </>
          )}

          {/* Top-Left Status Badge */}
          <div className="pointer-events-none absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 rounded-md bg-[#09080d]/75 backdrop-blur-md border border-white/10 px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider">
            <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
            <span className={statusMeta.color}>
              {hasUploadError
                ? 'FAILED'
                : uploadPct !== undefined
                ? `UPLOADING · ${uploadPct}%`
                : 'UPLOADING'}
            </span>
          </div>

          {video.duration && (
            <div className="pointer-events-none absolute top-2.5 right-2.5 inline-flex items-center rounded-md bg-black/70 backdrop-blur-md border border-white/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-zinc-200 tabular-nums">
              {video.duration}
            </div>
          )}

          {/* Bottom glowing progress sweep / fill */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] bg-white/[0.06] overflow-hidden">
            {hasUploadError ? (
              <div className="h-full w-full bg-rose-500/70" />
            ) : uploadPct !== undefined ? (
              <div
                className="relative h-full bg-gradient-to-r from-[#7c3aed] via-[#a78bfa] to-[#d8b4fe] transition-all duration-300 ease-out"
                style={{ width: `${uploadPct}%` }}
              >
                <div className="absolute inset-y-0 right-0 w-8 bg-white/40 blur-[2px]" />
              </div>
            ) : (
              <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-[#a78bfa] to-transparent anim-upload-bar" />
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-3.5 pt-3 flex flex-col justify-between flex-1 gap-3">
          <div className="min-w-0">
            <p className="font-display font-semibold text-[14px] leading-normal text-zinc-100 truncate" title={video.title}>
              {video.title}
            </p>
            <p className={`mt-1.5 text-[11.5px] truncate ${hasUploadError ? 'text-rose-300' : 'text-[#c4b5fd]/85'}`}>
              {hasUploadError ? video.uploadError : 'กำลังอัปโหลดและสร้างโปรเจกต์...'}
            </p>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-white/[0.06]">
            <span className="font-mono text-[11px] text-zinc-500 tabular-nums truncate">
              {hasUploadError ? 'ดำเนินการไม่สำเร็จ' : uploadPct !== undefined ? `${uploadPct}%` : 'รอสักครู่...'}
            </span>

            {hasUploadError ? (
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {onRetryUpload && (
                  <button
                    type="button"
                    onClick={() => onRetryUpload(video.id)}
                    className="inline-flex items-center rounded-lg bg-[#7c3aed] hover:bg-[#8b5cf6] px-2.5 py-1 text-[11.5px] font-semibold text-white transition-colors cursor-pointer"
                  >
                    ลองใหม่
                  </button>
                )}
                {onDismissUpload && (
                  <button
                    type="button"
                    onClick={() => onDismissUpload(video.id)}
                    className="inline-flex items-center rounded-lg border border-white/10 bg-white/5 hover:bg-rose-500/20 px-2.5 py-1 text-[11.5px] font-medium text-zinc-300 hover:text-rose-200 transition-colors cursor-pointer"
                  >
                    ลบออก
                  </button>
                )}
              </div>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#8b5cf6]/30 bg-[#171326] px-2.5 py-1 text-[11.5px] font-semibold text-[#c4b5fd]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#a78bfa] animate-pulse" />
                <span>กำลังโหลด</span>
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`studio-card group relative flex flex-col rounded-2xl border border-[#1f1e29] bg-[#0c0b11] hover:border-[#a78bfa]/40 hover:bg-[#100d19] hover:shadow-[0_10px_30px_-10px_rgba(167,139,250,0.28),0_8px_24px_rgba(0,0,0,0.58)] transition-[border-color,background-color,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none overflow-visible ${
        menuOpen ? 'z-30' : ''
      }`}
    >
      <CardHoverChrome rounded="2xl" />

      {/* 1. Full-Bleed Rounded Top Monitor Viewport */}
      <Link
        href={`/editor?id=${video.id}`}
        className="relative z-[2] aspect-video w-full rounded-t-[15px] overflow-hidden block cursor-pointer bg-[#050508] border-b border-white/[0.05] group-hover:border-[#a78bfa]/25 transition-colors duration-300"
      >
        <CardThumbnailMedia
          thumbnailUrl={resolvedThumbnailUrl}
          videoUrl={resolvedVideoUrl}
          title={video.title}
          variant="grid"
        />

        {/* Top & Bottom Edge Scrims for Overlay Legibility */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-black/60 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0c0b11]/90 via-black/20 to-transparent" />

        {/* Top-Left Status Badge */}
        <div className="pointer-events-none absolute top-3 left-3 z-[5] inline-flex items-center gap-1.5 rounded-md bg-[#09080d]/75 backdrop-blur-md border border-white/10 group-hover:border-white/25 transition-colors duration-200 px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider">
          <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
          <span className={statusMeta.color}>{statusMeta.label}</span>
        </div>

        {/* Top-Right Telemetry Chip (Aspect Ratio & Duration) */}
        {(video.aspectRatio || video.duration) && (
          <div className="pointer-events-none absolute top-3 right-3 z-[5] inline-flex items-center gap-1.5 rounded-md bg-black/70 backdrop-blur-md border border-white/10 group-hover:border-white/25 transition-colors duration-200 px-2 py-0.5 font-mono text-[10px] font-semibold text-zinc-100 tabular-nums">
            {video.aspectRatio && (
              <span className="text-zinc-400">{video.aspectRatio}</span>
            )}
            {video.aspectRatio && video.duration && (
              <span className="text-zinc-600">·</span>
            )}
            {video.duration && <span>{video.duration}</span>}
          </div>
        )}
      </Link>

      {/* 2. Card Content Body */}
      <div className={`relative ${menuOpen ? 'z-30' : 'z-[2]'} p-3.5 pt-3 flex flex-col justify-between flex-1 gap-3`}>
        <div className="min-w-0">
          {isRenaming ? (
            <form onSubmit={handleRenameSubmit}>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => setIsRenaming(false)}
                autoFocus
                className="w-full px-2.5 py-1.5 text-xs bg-[#14131c] border border-[#8b5cf6] rounded-lg text-white focus:outline-none"
              />
            </form>
          ) : (
            <Link
              href={`/editor?id=${video.id}`}
              className="block font-display font-semibold text-[14px] leading-normal text-zinc-100 group-hover:text-[#ede9fe] truncate transition-colors duration-200"
              title={video.title}
            >
              {video.title}
            </Link>
          )}
        </div>

        {/* 3. Footer: Metadata + Direct Actions */}
        <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-white/[0.06] group-hover:border-[#8b5cf6]/20 transition-colors duration-300">
          <div className="flex items-center gap-1.5 min-w-0 text-[11px] font-mono text-zinc-500 group-hover:text-zinc-400 transition-colors duration-200 truncate tabular-nums">
            <span className="truncate">{video.updated_at}</span>
            {video.captionCount !== undefined && (
              <>
                <span className="text-zinc-700 flex-shrink-0">·</span>
                <span className="text-zinc-400 flex-shrink-0">{video.captionCount} ซับ</span>
              </>
            )}
          </div>

          {/* Context Menu (...) */}
          <div className="relative z-30 flex-shrink-0" ref={menuRef}>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMenuOpen((prev) => !prev);
              }}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.07] transition-colors cursor-pointer"
              aria-label="เมนูตัวเลือก"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="5" cy="12" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="19" cy="12" r="2" />
              </svg>
            </button>
            {contextMenuPopover}
          </div>
        </div>
      </div>
    </div>
  );
}
