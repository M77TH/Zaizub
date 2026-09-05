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

  // Filtering videos based on active tab and search query
  const filteredVideos = useMemo(() => {
    return videos.filter((vid) => {
      const matchesTab =
        activeTab === 'all' ? true : vid.status === activeTab;
      const matchesSearch = vid.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase().trim());
      return matchesTab && matchesSearch;
    });
  }, [videos, activeTab, searchQuery]);

  const counts = useMemo(() => {
    return {
      all: videos.length,
      done: videos.filter((v) => v.status === 'done').length,
      draft: videos.filter((v) => v.status === 'draft').length,
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

          {/* Action CTAs (Hidden for now) */}
          {/* <div className="flex items-center gap-3">
            <Link
              href="/editor"
              className="group relative inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] hover:from-[#9333ea] hover:to-[#6d28d9] transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
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



        {/* 3. Grid of Cards or Empty State */}
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
