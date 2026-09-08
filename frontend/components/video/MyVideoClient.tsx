'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import VideoCard, { VideoProject } from './VideoCard';
import UploadVideoModal from './UploadVideoModal';
import DeleteConfirmModal from './DeleteConfirmModal';
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
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<VideoProject | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDeletePrompt = (id: string) => {
    const target = videos.find((v) => v.id === id);
    if (target) {
      setVideoToDelete(target);
    }
  };

  const handleConfirmDelete = async () => {
    if (!videoToDelete) return;
    const target = videoToDelete;
    const targetId = target.id;
    try {
      setIsDeleting(true);
      // Optimistic update
      setVideos((prev) => prev.filter((v) => v.id !== targetId));
      const res = await deleteProjectAction(targetId);
      if (res?.error) {
        console.error('Failed to delete project:', res.error);
        // Revert optimistic update
        setVideos((prev) => [target, ...prev]);
      }
    } catch (err) {
      console.error('Failed to delete project:', err);
      setVideos((prev) => [target, ...prev]);
    } finally {
      setIsDeleting(false);
      setVideoToDelete(null);
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
    <div className="relative min-h-[calc(100vh-65px)] bg-transparent text-gray-200">
      <div className="relative z-10 w-full px-4 sm:px-8 md:px-12 py-8 sm:py-10">
        {/* 1. Top Section: Header Title + Action CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/[0.06]">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              วิดีโอของฉัน
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              จัดการ แก้ไข และสร้างวิดีโอของคุณทั้งหมดได้ที่นี่
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="group relative inline-flex items-center justify-center gap-2.5 px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] hover:from-[#9333ea] hover:to-[#6d28d9] shadow-[0_4px_25px_rgba(139,92,246,0.35)] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center group-hover:rotate-90 transition-transform duration-300">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              สร้างวิดีโอใหม่
            </button>
          </div>
        </div>

        {/* 2. Control Toolbar: View/Filter Tabs + Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8">
          {/* Status Tabs (View Filter) */}
          <div className="inline-flex items-center p-1 rounded-xl border border-white/[0.07] bg-[#13111f]/90 backdrop-blur-md shadow-inner overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
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
              className={`flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
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
              className={`flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
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

        {/* 2. Control Toolbar: View/Filter Tabs + Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8">
          {/* Status Tabs (View Filter) */}
          <div className="inline-flex items-center p-1 rounded-xl border border-white/[0.07] bg-[#13111f]/90 backdrop-blur-md shadow-inner overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
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
              className={`flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
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
              className={`flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
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

        {/* 3. Grid of Cards or Empty State */}
        {filteredVideos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
            {filteredVideos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                onDelete={handleDeletePrompt}
                onRename={handleRename}
                onDuplicate={handleDuplicate}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/[0.08] bg-[#110f1c]/40 px-6 py-16 text-center backdrop-blur-sm">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4 text-purple-400 shadow-[0_0_25px_rgba(139,92,246,0.15)]">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-1">
              {searchQuery ? 'ไม่พบวิดีโอที่ค้นหา' : 'ยังไม่มีวิดีโอ'}
            </h3>
            <p className="text-sm text-zinc-400 max-w-sm mb-6">
              {searchQuery
                ? `ไม่พบผลลัพธ์สำหรับ "${searchQuery}" ลองค้นหาด้วยคำอื่น`
                : 'เริ่มต้นสร้างโปรเจกต์วิดีโอใหม่และใส่คำบรรยายอัตโนมัติได้ทันที'}
            </p>
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-300 bg-white/[0.06] hover:bg-white/10 transition-colors border border-white/10"
              >
                ล้างการค้นหา
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] hover:from-[#9333ea] hover:to-[#6d28d9] shadow-[0_4px_20px_rgba(139,92,246,0.3)] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                สร้างวิดีโอแรกของคุณ
              </button>
            )}
          </div>
        )}
      </div>

      {/* Upload Video Modal */}
      <UploadVideoModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />

      {/* Custom Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!videoToDelete}
        title={videoToDelete?.title}
        isDeleting={isDeleting}
        onClose={() => {
          if (!isDeleting) setVideoToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
