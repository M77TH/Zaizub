'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

export interface VideoProject {
  id: string;
  title: string;
  status: 'done' | 'draft' | 'processing';
  duration?: string;
  video_url?: string;
  thumbnail_url?: string;
  updated_at: string;
}

interface VideoCardProps {
  video: VideoProject;
  onDelete?: (id: string) => void;
  onRename?: (id: string, newTitle: string) => void;
  onDuplicate?: (id: string) => void;
}

export default function VideoCard({
  video,
  onDelete,
  onRename,
  onDuplicate,
}: VideoCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [title, setTitle] = useState(video.title);
  const [isHovered, setIsHovered] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
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

  const statusConfig = {
    done: {
      label: 'สำเร็จ',
      badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      dot: 'bg-emerald-400',
    },
    draft: {
      label: 'ฉบับร่าง',
      badge: 'bg-zinc-800/80 text-zinc-300 border-white/10',
      dot: 'bg-zinc-400',
    },
    processing: {
      label: 'กำลังประมวลผล',
      badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
      dot: 'bg-purple-400 animate-pulse',
    },
  };

  const status = statusConfig[video.status] || statusConfig.draft;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative rounded-2xl border border-white/[0.08] bg-[#12111a]/90 backdrop-blur-sm overflow-hidden hover:border-[#8b5cf6]/50 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-all duration-200 flex flex-col hover:-translate-y-0.5"
    >
      {/* 1. Video Preview Area */}
      <Link
        href={`/editor?id=${video.id}`}
        className="relative aspect-video w-full overflow-hidden block cursor-pointer bg-[#0d0c13]"
      >
        {video.thumbnail_url ? (
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          /* Empty clean preview when there is no clip */
          <div className="w-full h-full bg-[#13121d]" />
        )}

        {/* Status Badge Tag */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-medium border backdrop-blur-md ${status.badge}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
        </div>

        {/* Duration Pill */}
        {video.duration && (
          <div className="absolute bottom-2.5 right-2.5 z-10">
            <span className="px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-[11px] font-mono text-zinc-300 border border-white/10">
              {video.duration}
            </span>
          </div>
        )}
      </Link>

      {/* 2. Card Footer & Details */}
      <div className="p-4 flex flex-col justify-between flex-1 bg-[#12111c]">
        <div className="flex items-start justify-between gap-3">
          {/* Video Title */}
          {isRenaming ? (
            <form onSubmit={handleRenameSubmit} className="flex-1">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => setIsRenaming(false)}
                autoFocus
                className="w-full px-2.5 py-1 text-xs bg-[#1a1827] border border-[#7c3aed] rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
              />
            </form>
          ) : (
            <Link
              href={`/editor?id=${video.id}`}
              className="font-medium text-sm text-gray-100 hover:text-white line-clamp-1 transition-colors group-hover:text-purple-300"
              title={video.title}
            >
              {video.title}
            </Link>
          )}

          {/* Context Options (...) Button */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMenuOpen((prev) => !prev);
              }}
              className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors focus:outline-none"
              aria-label="เมนูตัวเลือก"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="5" cy="12" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="19" cy="12" r="2" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {menuOpen && (
              <div className="absolute right-0 bottom-full mb-1 w-44 rounded-xl border border-white/10 bg-[#191629] p-1.5 shadow-2xl z-30 animate-in fade-in zoom-in-95 duration-100">
                <Link
                  href={`/editor?id=${video.id}`}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-200 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
                >
                  <svg className="w-3.5 h-3.5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  เปิดใน Editor
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setIsRenaming(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-200 rounded-lg hover:bg-white/10 hover:text-white transition-colors text-left"
                >
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  เปลี่ยนชื่อ
                </button>
                {onDuplicate && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onDuplicate(video.id);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-200 rounded-lg hover:bg-white/10 hover:text-white transition-colors text-left"
                  >
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    ทำสำเนา (Duplicate)
                  </button>
                )}
                <div className="my-1 border-t border-white/[0.08]" />
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(video.id);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-400 rounded-lg hover:bg-rose-500/15 hover:text-rose-300 transition-colors text-left"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    ลบวิดีโอ
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Card Metadata Footer */}
        <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-between text-xs text-gray-500 font-mono">
          <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
            <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {video.updated_at}
          </span>

          <Link
            href={`/editor?id=${video.id}`}
            className="text-[11px] font-medium text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
          >
            แก้ไข
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
