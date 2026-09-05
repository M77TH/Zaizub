'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import VideoCard, { VideoProject } from './VideoCard';
import {
  deleteProjectAction,
  renameProjectAction,
  duplicateProjectAction,
} from '@/app/actions/project';

interface MyVideoClientProps {
  initialVideos?: VideoProject[];
  userName?: string;
}

export default function MyVideoClient({
  initialVideos = [],
  userName = 'Creator',
}: MyVideoClientProps) {
  const [videos, setVideos] = useState<VideoProject[]>(initialVideos);
  const [activeTab, setActiveTab] = useState<'all' | 'done' | 'draft'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Sync state if initialVideos changes
  useEffect(() => {
    setVideos(initialVideos);
  }, [initialVideos]);

  // Helper to determine if status is done/completed
  const isDone = (status?: string) => status === 'done' || status === 'completed';

  // Filtering videos based on active tab and search query
  const filteredVideos = useMemo(() => {
    return videos.filter((vid) => {
      const matchesTab =
        activeTab === 'all'
          ? true
          : activeTab === 'done'
          ? isDone(vid.status)
          : !isDone(vid.status);
      const matchesSearch = (vid.title || '')
        .toLowerCase()
        .includes(searchQuery.toLowerCase().trim());
      return matchesTab && matchesSearch;
    });
  }, [videos, activeTab, searchQuery]);

  const counts = useMemo(() => {
    return {
      all: videos.length,
      done: videos.filter((v) => isDone(v.status)).length,
      draft: videos.filter((v) => !isDone(v.status)).length,
    };
  }, [videos]);

  const handleDelete = async (id: string) => {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบวิดีโอนี้?')) {
      // Optimistic update
      setVideos((prev) => prev.filter((v) => v.id !== id));
      await deleteProjectAction(id);
    }
  };

  const handleRename = async (id: string, newTitle: string) => {
    // Optimistic update
    setVideos((prev) =>
      prev.map((v) => (v.id === id ? { ...v, title: newTitle } : v))
    );
    await renameProjectAction(id, newTitle);
  };

  const handleDuplicate = async (id: string) => {
    const target = videos.find((v) => v.id === id);
    if (!target) return;
    const duplicated: VideoProject = {
      ...target,
      id: `vid-${Date.now()}`,
      title: `${target.title} (สำเนา)`,
      status: 'draft',
      updated_at: 'เมื่อสักครู่',
    };
    setVideos((prev) => [duplicated, ...prev]);
    await duplicateProjectAction(id);
  };

  return (
    <div className="relative min-h-[calc(100vh-61px)] bg-transparent text-gray-200">
      <div className="relative z-10 mx-auto max-w-7xl px-6 py-10 lg:px-10">
        {/* 1. Top Section: Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-white/[0.06]">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              วิดีโอของฉัน
            </h1>
          </div>

          {/* Action CTAs (Hidden) */}
          {/* <div className="flex items-center gap-3">
            <Link
              href="/editor"
              className="group relative inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] hover:from-[#9333ea] hover:to-[#6d28d9] shadow-[0_4px_25px_rgba(139,92,246,0.35)] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center group-hover:rotate-90 transition-transform duration-300">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              สร้างวิดีโอใหม่
            </Link>
          </div> */}
        </div>

        {/* 2. Control Toolbar: View/Filter Tabs + Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8">
          {/* Status Tabs (View Filter) */}
          <div className="inline-flex items-center p-1 rounded-xl border border-white/[0.07] bg-[#13111f]/90 backdrop-blur-md shadow-inner">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'all'
                  ? 'bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] text-white shadow-[0_2px_12px_rgba(124,58,237,0.4)]'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]'
              }`}
            >
              ทั้งหมด
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                  activeTab === 'all' ? 'bg-black/25 text-white' : 'bg-white/[0.08] text-gray-400'
                }`}
              >
                {counts.all}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('done')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'done'
                  ? 'bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] text-white shadow-[0_2px_12px_rgba(124,58,237,0.4)]'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]'
              }`}
            >
              สำเร็จ
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                  activeTab === 'done' ? 'bg-black/25 text-white' : 'bg-white/[0.08] text-gray-400'
                }`}
              >
                {counts.done}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('draft')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'draft'
                  ? 'bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] text-white shadow-[0_2px_12px_rgba(124,58,237,0.4)]'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/[0.04]'
              }`}
            >
              ฉบับร่าง
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                  activeTab === 'draft' ? 'bg-black/25 text-white' : 'bg-white/[0.08] text-gray-400'
                }`}
              >
                {counts.draft}
              </span>
            </button>
          </div>

          {/* Search Input Box */}
          <div className="relative w-full sm:w-72 md:w-80">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="ค้นหาชื่อวิดีโอหรือโปรเจกต์..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2 rounded-xl border border-white/[0.08] bg-[#12111c] text-xs sm:text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-purple-500/80 focus:ring-2 focus:ring-purple-500/20 transition-all shadow-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-200 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* 3. Grid of Cards */}
        {filteredVideos.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                onDelete={handleDelete}
                onRename={handleRename}
                onDuplicate={handleDuplicate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
