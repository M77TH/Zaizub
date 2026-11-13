'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import VideoCard, { VideoProject, resolveMediaUrl } from './VideoCard';
import {
  CardHoverChrome,
  CardThumbnailMedia,
  StudioScrubBar,
} from './StudioCardHover';
import UploadVideoModal from './UploadVideoModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import { apiUrl } from '@/lib/api';
import {
  PendingUploadJob,
  getPendingUploads,
  removePendingUpload,
} from '@/lib/pendingUploadQueue';
import {
  formatDurationClock,
  parseDurationSeconds,
} from '@/lib/projects/projectMapper';
import {
  deleteProjectAction,
  renameProjectAction,
  duplicateProjectAction,
  saveProjectAction,
} from '@/app/actions/project';

interface QueuedCardState {
  job: PendingUploadJob;
  percent: number;
  error?: string;
  previewUrl?: string;
}

const inFlightQueueIds = new Set<string>();

interface MyVideoClientProps {
  initialVideos?: VideoProject[];
  userName?: string;
}

export default function MyVideoClient({
  initialVideos = [],
}: MyVideoClientProps) {
  const [videos, setVideos] = useState<VideoProject[]>(initialVideos);
  const [queueItems, setQueueItems] = useState<QueuedCardState[]>([]);
  const [sessionUploadedIds, setSessionUploadedIds] = useState<Set<string>>(() => new Set());
  const [activeTab, setActiveTab] = useState<'all' | 'done' | 'draft'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'title'>('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'strip'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<VideoProject | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const mountedRef = useRef(true);
  const activeTimersRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());
  const activeRequestsRef = useRef<Map<string, { abort: () => void }>>(new Map());
  const previewUrlsRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    setVideos(initialVideos);
  }, [initialVideos]);

  const clearJobHandles = useCallback((jobId: string) => {
    const timer = activeTimersRef.current.get(jobId);
    if (timer) {
      clearInterval(timer);
      activeTimersRef.current.delete(jobId);
    }
    const req = activeRequestsRef.current.get(jobId);
    if (req) {
      activeRequestsRef.current.delete(jobId);
    }
  }, []);

  const revokeJobPreview = useCallback((jobId: string) => {
    const url = previewUrlsRef.current.get(jobId);
    if (url) {
      URL.revokeObjectURL(url);
      previewUrlsRef.current.delete(jobId);
    }
  }, []);

  const updateQueueItem = useCallback(
    (jobId: string, updater: (prev: QueuedCardState) => QueuedCardState) => {
      if (!mountedRef.current) return;
      setQueueItems((prev) =>
        prev.map((item) => (item.job.id === jobId ? updater(item) : item))
      );
    },
    []
  );

  const finalizeQueuedJob = useCallback(
    async (
      job: PendingUploadJob,
      data: Record<string, unknown>,
      fallbackTitle: string
    ) => {
      const rawSubs = data.subtitles ?? data.segments ?? data.captions ?? [];
      const subs = Array.isArray(rawSubs) ? rawSubs : [];

      const lastSub =
        subs.length > 0
          ? (subs[subs.length - 1] as { end?: number | string } | undefined)
          : undefined;
      const resolvedDuration =
        parseDurationSeconds(data.duration as number | string | undefined) ??
        parseDurationSeconds(lastSub?.end) ??
        parseDurationSeconds(job.durationSeconds);

      const resolvedTitle =
        (typeof data.title === 'string' && data.title.trim()) || fallbackTitle;

      updateQueueItem(job.id, (item) => ({
        ...item,
        percent: Math.max(item.percent, 98),
        error: undefined,
      }));

      try {
        const saveRes = await saveProjectAction({
          title: resolvedTitle,
          status: 'draft',
          duration: resolvedDuration,
          video_url: typeof data.video_url === 'string' ? data.video_url : undefined,
          thumbnail_url:
            typeof data.thumbnail_url === 'string' ? data.thumbnail_url : undefined,
          video_filename:
            typeof data.video_filename === 'string' ? data.video_filename : undefined,
          subtitles: subs,
          styles: {},
        });

        if (!saveRes.success || !saveRes.projectId) {
          inFlightQueueIds.delete(job.id);
          updateQueueItem(job.id, (item) => ({
            ...item,
            error: saveRes.error || 'ไม่สามารถบันทึกโปรเจกต์ได้',
          }));
          return;
        }

        const realId = saveRes.projectId;
        await removePendingUpload(job.id);
        revokeJobPreview(job.id);
        inFlightQueueIds.delete(job.id);

        if (!mountedRef.current) return;

        const firstLine =
          subs.length > 0 && typeof (subs[0] as { text?: unknown })?.text === 'string'
            ? String((subs[0] as { text: string }).text).trim().slice(0, 64) || undefined
            : undefined;

        const completedCard: VideoProject = {
          id: realId,
          title: resolvedTitle,
          status: 'draft',
          duration: formatDurationClock(resolvedDuration),
          video_url: typeof data.video_url === 'string' ? data.video_url : undefined,
          thumbnail_url:
            typeof data.thumbnail_url === 'string' ? data.thumbnail_url : undefined,
          captionCount: subs.length > 0 ? subs.length : undefined,
          sampleLine: firstLine,
          updated_at: 'เมื่อสักครู่',
        };

        setSessionUploadedIds((prev) => {
          const next = new Set(prev);
          next.add(realId);
          return next;
        });
        setVideos((prev) =>
          prev.some((v) => v.id === realId) ? prev : [completedCard, ...prev]
        );
        setQueueItems((prev) => prev.filter((item) => item.job.id !== job.id));
      } catch (err) {
        inFlightQueueIds.delete(job.id);
        updateQueueItem(job.id, (item) => ({
          ...item,
          error: err instanceof Error ? err.message : 'ไม่สามารถบันทึกโปรเจกต์ได้',
        }));
      }
    },
    [revokeJobPreview, updateQueueItem]
  );

  const processQueuedJob = useCallback(
    (job: PendingUploadJob) => {
      if (inFlightQueueIds.has(job.id)) return;
      inFlightQueueIds.add(job.id);
      clearJobHandles(job.id);

      let previewUrl = previewUrlsRef.current.get(job.id);
      if (!previewUrl && job.mode === 'file' && job.file) {
        previewUrl = URL.createObjectURL(job.file);
        previewUrlsRef.current.set(job.id, previewUrl);
      }

      if (mountedRef.current) {
        setQueueItems((prev) => {
          const nextState: QueuedCardState = {
            job,
            percent: job.mode === 'file' ? 4 : 10,
            error: undefined,
            previewUrl,
          };
          if (prev.some((item) => item.job.id === job.id)) {
            return prev.map((item) => (item.job.id === job.id ? nextState : item));
          }
          return [nextState, ...prev];
        });
      }

      const startAsymptoticTimer = (estimatedSeconds: number) => {
        let elapsed = 0;
        const timer = setInterval(() => {
          elapsed += 1;
          updateQueueItem(job.id, (item) => {
            const target = Math.min(95, Math.round((elapsed / estimatedSeconds) * 92));
            let nextPct = item.percent;
            if (nextPct < target) {
              nextPct = nextPct + Math.max(1, Math.round((target - nextPct) * 0.3));
            } else if (nextPct < 95 && elapsed % 2 === 0) {
              nextPct = nextPct + 1;
            }
            return { ...item, percent: Math.min(95, nextPct) };
          });
        }, 1000);
        activeTimersRef.current.set(job.id, timer);
      };

      if (job.mode === 'file') {
        if (!job.file) {
          inFlightQueueIds.delete(job.id);
          updateQueueItem(job.id, (item) => ({
            ...item,
            error: 'ไม่พบไฟล์วิดีโอในคิวอัปโหลด',
          }));
          return;
        }

        const uploadFile = new File([job.file], job.fileName || 'video.mp4', {
          type: job.fileType || 'video/mp4',
        });
        const xhr = new XMLHttpRequest();
        activeRequestsRef.current.set(job.id, { abort: () => xhr.abort() });

        xhr.upload.onprogress = (e) => {
          if (!e.lengthComputable) return;
          const mapped = Math.max(4, Math.min(65, Math.round((e.loaded / e.total) * 65)));
          updateQueueItem(job.id, (item) => ({
            ...item,
            percent: Math.max(item.percent, mapped),
          }));

          if (e.loaded >= e.total && !activeTimersRef.current.has(job.id)) {
            const estimatedSeconds = Math.max(
              6,
              Math.min(35, Math.round((uploadFile.size / (1024 * 1024)) * 0.8) + 4)
            );
            startAsymptoticTimer(estimatedSeconds);
          }
        };

        xhr.onload = async () => {
          clearJobHandles(job.id);
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const parsed = JSON.parse(xhr.responseText) as Record<string, unknown>;
              await finalizeQueuedJob(job, parsed, job.title);
            } catch {
              inFlightQueueIds.delete(job.id);
              updateQueueItem(job.id, (item) => ({
                ...item,
                error: 'ไม่สามารถแปลงข้อมูลที่ได้รับจากเซิร์ฟเวอร์',
              }));
            }
          } else {
            let detail = 'การอัปโหลดหรือถอดเสียงล้มเหลว';
            try {
              const errRes = JSON.parse(xhr.responseText) as { detail?: string };
              if (errRes.detail) detail = errRes.detail;
            } catch {
              // ignore JSON parse failure on error payload
            }
            inFlightQueueIds.delete(job.id);
            updateQueueItem(job.id, (item) => ({ ...item, error: detail }));
          }
        };

        xhr.onerror = () => {
          clearJobHandles(job.id);
          inFlightQueueIds.delete(job.id);
          updateQueueItem(job.id, (item) => ({
            ...item,
            error: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ (โปรดตรวจสอบว่า Backend ทำงานอยู่)',
          }));
        };

        xhr.onabort = () => {
          clearJobHandles(job.id);
          inFlightQueueIds.delete(job.id);
        };

        const formData = new FormData();
        formData.append('file', uploadFile);
        xhr.open('POST', apiUrl('/api/v1/extract-audio'));
        xhr.send(formData);
        return;
      }

      // Link mode
      if (!job.url) {
        inFlightQueueIds.delete(job.id);
        updateQueueItem(job.id, (item) => ({
          ...item,
          error: 'ไม่พบลิงก์วิดีโอในคิวอัปโหลด',
        }));
        return;
      }

      const controller = new AbortController();
      activeRequestsRef.current.set(job.id, { abort: () => controller.abort() });
      startAsymptoticTimer(25);

      void (async () => {
        try {
          const res = await fetch(apiUrl('/api/v1/process-link'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: job.url }),
            signal: controller.signal,
          });
          clearJobHandles(job.id);

          if (!res.ok) {
            const errJson = (await res.json().catch(() => ({}))) as { detail?: string };
            throw new Error(errJson.detail || `Server returned status ${res.status}`);
          }

          const data = (await res.json()) as Record<string, unknown>;
          await finalizeQueuedJob(job, data, job.title);
        } catch (err) {
          clearJobHandles(job.id);
          inFlightQueueIds.delete(job.id);
          if (err instanceof Error && err.name === 'AbortError') {
            return;
          }
          updateQueueItem(job.id, (item) => ({
            ...item,
            error: err instanceof Error ? err.message : 'ไม่สามารถดึงข้อมูลจากลิงก์วิดีโอได้',
          }));
        }
      })();
    },
    [clearJobHandles, finalizeQueuedJob, updateQueueItem]
  );

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;
    const timersRef = activeTimersRef;
    const requestsRef = activeRequestsRef;
    const previewsRef = previewUrlsRef;

    const drainQueue = async () => {
      try {
        const jobs = await getPendingUploads();
        if (cancelled || !mountedRef.current || jobs.length === 0) return;

        for (const job of jobs) {
          if (cancelled || !mountedRef.current) break;
          processQueuedJob(job);
        }
      } catch {
        // Ignore IndexedDB unavailability
      }
    };

    void drainQueue();

    return () => {
      cancelled = true;
      mountedRef.current = false;
      for (const timer of timersRef.current.values()) {
        clearInterval(timer);
      }
      timersRef.current.clear();
      for (const req of requestsRef.current.values()) {
        req.abort();
      }
      requestsRef.current.clear();
      for (const url of previewsRef.current.values()) {
        URL.revokeObjectURL(url);
      }
      previewsRef.current.clear();
    };
  }, [processQueuedJob]);

  const handleRetryUpload = useCallback(
    (jobId: string) => {
      const target = queueItems.find((item) => item.job.id === jobId);
      if (target) {
        processQueuedJob(target.job);
      }
    },
    [processQueuedJob, queueItems]
  );

  const handleDismissUpload = useCallback(
    (jobId: string) => {
      const req = activeRequestsRef.current.get(jobId);
      if (req) req.abort();
      clearJobHandles(jobId);
      revokeJobPreview(jobId);
      inFlightQueueIds.delete(jobId);
      void removePendingUpload(jobId);
      setQueueItems((prev) => prev.filter((item) => item.job.id !== jobId));
    },
    [clearJobHandles, revokeJobPreview]
  );

  const isDone = (status?: string) => status === 'done' || status === 'completed';

  const queuedVideoProjects = useMemo<VideoProject[]>(
    () =>
      queueItems.map((item) => ({
        id: item.job.id,
        title: item.job.title,
        status: 'processing',
        duration: formatDurationClock(item.job.durationSeconds),
        video_url: item.previewUrl,
        updated_at: item.error ? 'ไม่สำเร็จ' : 'กำลังอัปโหลด',
        uploadPercent: item.percent,
        uploadError: item.error,
      })),
    [queueItems]
  );

  const mergedVideos = useMemo(() => {
    const seen = new Set<string>();
    const combined: VideoProject[] = [];
    for (const vid of [...queuedVideoProjects, ...videos]) {
      if (seen.has(vid.id)) continue;
      seen.add(vid.id);
      combined.push(vid);
    }
    return combined;
  }, [queuedVideoProjects, videos]);

  const filteredVideos = useMemo(() => {
    const filtered = mergedVideos.filter((vid) => {
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

    if (sortBy === 'title') {
      return [...filtered].sort((a, b) => (a.title || '').localeCompare(b.title || '', 'th'));
    }
    return filtered;
  }, [mergedVideos, activeTab, sortBy, searchQuery]);

  const counts = useMemo(
    () => ({
      all: mergedVideos.length,
      done: mergedVideos.filter((v) => isDone(v.status)).length,
      draft: mergedVideos.filter((v) => !isDone(v.status)).length,
    }),
    [mergedVideos]
  );

  // Pin the most recently edited clip in LATEST CUT across all 3 views (all / done / draft),
  // while keeping queued/session-uploaded clips inline inside the gallery list.
  const spotlightVideo = useMemo(
    () =>
      mergedVideos.find(
        (v) => v.status !== 'processing' && !sessionUploadedIds.has(v.id)
      ) ?? null,
    [mergedVideos, sessionUploadedIds]
  );

  const shouldExcludeSpotlightFromGrid =
    Boolean(spotlightVideo) &&
    activeTab === 'all' &&
    sortBy === 'recent' &&
    !searchQuery.trim();

  const remainingVideos =
    spotlightVideo && shouldExcludeSpotlightFromGrid
      ? filteredVideos.filter((v) => v.id !== spotlightVideo.id)
      : filteredVideos;

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
      setVideos((prev) => prev.filter((v) => v.id !== targetId));
      const res = await deleteProjectAction(targetId);
      if (res?.error) {
        console.error('Failed to delete project:', res.error);
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
    const previous = videos.find((v) => v.id === id);
    setVideos((prev) =>
      prev.map((v) => (v.id === id ? { ...v, title: newTitle } : v))
    );
    const res = await renameProjectAction(id, newTitle);
    if (res?.error && previous) {
      console.error('Failed to rename project:', res.error);
      setVideos((prev) =>
        prev.map((v) => (v.id === id ? previous : v))
      );
    }
  };

  const handleDuplicate = async (id: string) => {
    const target = videos.find((v) => v.id === id);
    if (!target) return;
    const tempId = `temp-${Date.now()}`;
    const duplicated: VideoProject = {
      ...target,
      id: tempId,
      title: `${target.title} (สำเนา)`,
      status: 'draft',
      updated_at: 'เมื่อสักครู่',
    };
    setVideos((prev) => [duplicated, ...prev]);

    const res = await duplicateProjectAction(id);
    if (res?.success && res.project) {
      setVideos((prev) =>
        prev.map((v) => (v.id === tempId ? res.project! : v))
      );
    } else {
      setVideos((prev) => prev.filter((v) => v.id !== tempId));
      if (res?.error) {
        console.error('Failed to duplicate project:', res.error);
      }
    }
  };

  const spotlightThumb = resolveMediaUrl(spotlightVideo?.thumbnail_url);
  const spotlightSrc = resolveMediaUrl(spotlightVideo?.video_url);

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#070709] text-zinc-200">
      <div className="w-full max-w-[1480px] mx-auto px-4 sm:px-8 md:px-10 py-6 sm:py-8">
        {/* 1. EDITORIAL ARCHIVE MASTHEAD */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 pb-5 border-b border-[#1c1b24]">
          <h1 className="font-display text-3xl sm:text-[40px] leading-[1.08] font-extrabold text-white tracking-[-0.03em]">
            คลังวิดิโอ
          </h1>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="group inline-flex items-center gap-2.5 rounded-lg bg-[#7c3aed] hover:bg-[#8b5cf6] text-white px-5 py-3 text-xs sm:text-sm font-bold tracking-tight transition-colors duration-150 cursor-pointer active:scale-[0.98]"
            >
              <svg
                className="w-4 h-4 transition-transform duration-200 group-hover:rotate-90"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              <span>สร้างโปรเจกต์ใหม่</span>
            </button>
          </div>
        </div>

        {/* 2. LATEST SESSION SPOTLIGHT (Compact Studio Cut Bar) */}
        {spotlightVideo && (
          <section className="mt-4 mb-6">
            <div
              className="studio-card group/spotlight relative flex flex-col sm:flex-row items-stretch rounded-xl border border-[#22202d] bg-[#0b0a0f] hover:border-[#8b5cf6]/25 hover:bg-[#100d19] hover:shadow-[0_10px_30px_-10px_rgba(167,139,250,0.28),0_10px_26px_rgba(0,0,0,0.56)] transition-[border-color,background-color,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none overflow-visible"
            >
              <CardHoverChrome rounded="xl" beamMode="wide" />

              {/* Left Compact 1:1 Monitor Thumbnail */}
              <Link
                href={`/editor?id=${spotlightVideo.id}`}
                className="relative z-[2] mx-auto mt-3 sm:m-0 w-40 h-40 md:w-[164px] md:h-[164px] aspect-square flex-shrink-0 self-center bg-[#040406] rounded-lg sm:rounded-none sm:rounded-l-[11px] border sm:border-0 sm:border-r border-[#1c1b24] sm:group-hover/spotlight:border-[#a78bfa]/30 transition-colors duration-300 overflow-hidden block"
              >
                <CardThumbnailMedia
                  thumbnailUrl={spotlightThumb}
                  videoUrl={spotlightSrc}
                  title={spotlightVideo.title}
                  variant="spotlight"
                  showScrubBar={false}
                  emptyFallback={
                    <div className="w-full h-full flex items-center justify-center text-zinc-700 group-hover/spotlight:text-purple-300 transition-colors duration-300">
                      <span className="font-mono text-[10px] uppercase tracking-widest">NO VIDEO SIGNAL</span>
                    </div>
                  }
                />

                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                <div className="pointer-events-none absolute top-3.5 left-3.5 z-[5] font-mono text-[9px] font-bold tracking-wider text-zinc-200 bg-black/75 border border-white/10 group-hover/spotlight:border-white/25 transition-colors px-1.5 py-0.5 rounded">
                  PRV // {spotlightVideo.aspectRatio || '9:16'}
                  {spotlightVideo.duration ? ` · ${spotlightVideo.duration}` : ''}
                </div>

                {spotlightVideo.sampleLine && (
                  <div className="pointer-events-none absolute inset-x-5 bottom-3 z-[5] flex justify-center">
                    <span
                      className="max-w-full truncate font-bold text-[11px] text-[#e9d5ff] tracking-tight"
                      style={{
                        textShadow:
                          '0 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
                      }}
                    >
                      {spotlightVideo.sampleLine}
                    </span>
                  </div>
                )}
              </Link>

              {/* Right Compact Spec & Action Strip */}
              <div className="relative z-[2] flex-1 min-w-0 p-3.5 sm:px-4 sm:py-3 flex flex-col justify-between gap-2.5">
                <div>
                  <div className="flex items-center justify-between gap-2 font-mono text-[10px]">
                    <div className="flex items-center gap-2 uppercase tracking-[0.14em] text-[#c4b5fd] font-bold truncate">
                      <span className="h-1.5 w-1.5 rounded-[1px] bg-[#8b5cf6] flex-shrink-0" />
                      <span className="truncate">LATEST CUT // เปิดค้างไว้ล่าสุด</span>
                    </div>
                    <div className="flex items-center gap-2.5 flex-shrink-0">
                      <span className="text-zinc-600 tabular-nums hidden sm:inline">CLIP #01</span>
                      <span
                        className={`font-bold ${
                          isDone(spotlightVideo.status) ? 'text-emerald-400' : 'text-[#c4b5fd]'
                        }`}
                      >
                        {isDone(spotlightVideo.status) ? '● RENDERED' : '○ DRAFT'}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/editor?id=${spotlightVideo.id}`}
                    className="block mt-1.5 font-display text-base sm:text-lg font-extrabold text-white group-hover/spotlight:text-[#e9d5ff] hover:text-[#c4b5fd] tracking-tight truncate transition-colors duration-200"
                    title={spotlightVideo.title}
                  >
                    {spotlightVideo.title}
                  </Link>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-[#191822]">
                  {/* Inline Compact Specs */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10.5px] text-zinc-400 tabular-nums">
                    <span className="text-zinc-200 font-semibold">{spotlightVideo.aspectRatio || 'AUTO'}</span>
                    <span className="text-zinc-700">/</span>
                    <span className="text-zinc-200 font-semibold">{spotlightVideo.duration || '--:--'}</span>
                    <span className="text-zinc-700">/</span>
                    <span>
                      {spotlightVideo.captionCount !== undefined
                        ? `${spotlightVideo.captionCount} คิว`
                        : 'กำลังเตรียม'}
                    </span>
                    <span className="text-zinc-700 hidden sm:inline">/</span>
                    <span className="hidden sm:inline truncate max-w-[180px]">
                      {spotlightVideo.presetLabel || 'CUSTOM'} · {spotlightVideo.updated_at}
                    </span>
                  </div>

                  {/* Compact Action Buttons */}
                  <div className="flex items-center gap-1.5 ml-auto">
                    <Link
                      href={`/editor?id=${spotlightVideo.id}`}
                      className="group/cta inline-flex items-center gap-1.5 rounded-lg bg-[#7c3aed] hover:bg-[#8b5cf6] group-hover/spotlight:bg-[#8b5cf6] group-hover/spotlight:shadow-[0_0_18px_-4px_rgba(196,181,253,0.55)] text-white px-3 py-1.5 text-xs font-bold transition-all duration-300"
                    >
                      <span>เปิดแก้ไขต่อ</span>
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        className="transition-transform duration-200 group-hover/spotlight:translate-x-0.5 group-hover/cta:translate-x-1"
                      >
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDuplicate(spotlightVideo.id)}
                      className="rounded-lg border border-[#242230] bg-[#121118] hover:border-white/30 hover:text-white px-2.5 py-1.5 text-xs font-semibold text-zinc-300 transition-colors cursor-pointer"
                    >
                      ทำสำเนา
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePrompt(spotlightVideo.id)}
                      className="rounded-lg border border-[#242230] bg-[#121118] hover:border-rose-500/40 hover:text-rose-300 px-2.5 py-1.5 text-xs font-semibold text-zinc-400 transition-colors cursor-pointer"
                    >
                      ลบ
                    </button>
                  </div>
                </div>
              </div>

              <div className="pointer-events-none absolute inset-0 rounded-[11px] overflow-hidden z-[5]">
                <StudioScrubBar />
              </div>
            </div>
          </section>
        )}

        {/* 3. ARCHITECTURAL FILTER RAIL & SEARCH TOOLBAR */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#1c1b24] pb-0 mb-7">
          {/* Underline Tabs */}
          <div className="flex items-center gap-6 overflow-x-auto">
            {([
              { id: 'all', label: 'ทั้งหมด', count: counts.all },
              { id: 'done', label: 'เรนเดอร์สำเร็จ', count: counts.done },
              { id: 'draft', label: 'แบบร่าง', count: counts.draft },
            ] as const).map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 pb-3 text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer focus:outline-none focus-visible:text-white focus-visible:ring-1 focus-visible:ring-[#a78bfa]/70 focus-visible:rounded-md ${
                    isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-200'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`font-mono text-[11px] tabular-nums ${
                      isActive ? 'text-[#c4b5fd]' : 'text-zinc-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                  {isActive && (
                    <span className="absolute bottom-0 inset-x-0 h-[2px] bg-[#8b5cf6]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Controls: Sort + View Mode + Search */}
          <div className="flex flex-wrap items-center gap-2.5 pb-3">
            {/* Sort */}
            <div className="inline-flex items-center rounded-lg border border-[#21202c] bg-[#0c0b10] p-0.5 text-[11px] font-mono">
              <button
                type="button"
                onClick={() => setSortBy('recent')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  sortBy === 'recent' ? 'bg-[#1c1a27] text-white font-bold' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                ล่าสุด
              </button>
              <button
                type="button"
                onClick={() => setSortBy('title')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  sortBy === 'title' ? 'bg-[#1c1a27] text-white font-bold' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                ก-ฮ
              </button>
            </div>

            {/* Grid / Strip View Toggle */}
            <div className="inline-flex items-center rounded-lg border border-[#21202c] bg-[#0c0b10] p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-[#1c1a27] text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
                title="มุมมองการ์ด (Contact Grid)"
                aria-label="มุมมองการ์ด"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('strip')}
                className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'strip' ? 'bg-[#1c1a27] text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
                title="มุมมองแถว (Cue Strip List)"
                aria-label="มุมมองแถว"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <circle cx="4" cy="6" r="1" fill="currentColor" />
                  <circle cx="4" cy="12" r="1" fill="currentColor" />
                  <circle cx="4" cy="18" r="1" fill="currentColor" />
                </svg>
              </button>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="ค้นหาชื่อโปรเจกต์..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 rounded-lg border border-[#21202c] bg-[#0c0b10] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/40 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-zinc-500 hover:text-white"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 4. REEL GRID / STRIP OR EMPTY STATE */}
        {filteredVideos.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#242230] bg-[#0b0a0f] px-6 py-16 text-center">
            <div className="w-12 h-12 rounded-lg border border-[#282636] bg-[#121118] flex items-center justify-center mb-4 text-zinc-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="5" width="18" height="14" rx="2" strokeWidth="1.6" />
                <polygon points="10 9 15 12 10 15 10 9" fill="currentColor" stroke="none" />
              </svg>
            </div>
            <h3 className="font-display text-base font-bold text-white mb-1">
              {searchQuery ? 'ไม่พบคลิปที่ค้นหา' : 'คลังคลิปของคุณยังว่างอยู่'}
            </h3>
            <p className="text-xs text-zinc-500 max-w-sm mb-6">
              {searchQuery
                ? `ไม่พบผลลัพธ์สำหรับ "${searchQuery}" ลองค้นหาด้วยคำอื่น`
                : 'นำเข้าวิดีโอ MP4 / MOV หรือวางลิงก์เพื่อถอดเสียงและแต่งซับไตเติลได้ทันที'}
            </p>
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-zinc-300 bg-[#14131c] hover:text-white border border-[#242230] transition-colors"
              >
                ล้างการค้นหา
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-xs text-white bg-[#7c3aed] hover:bg-[#8b5cf6] transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                </svg>
                อัปโหลดวิดีโอแรกของคุณ
              </button>
            )}
          </div>
        ) : remainingVideos.length > 0 ? (
          viewMode === 'strip' ? (
            <div className="space-y-2">
              {remainingVideos.map((video, idx) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  index={shouldExcludeSpotlightFromGrid ? idx + 1 : idx}
                  layout="strip"
                  onDelete={handleDeletePrompt}
                  onRename={handleRename}
                  onDuplicate={handleDuplicate}
                  onRetryUpload={handleRetryUpload}
                  onDismissUpload={handleDismissUpload}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {remainingVideos.map((video, idx) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  index={shouldExcludeSpotlightFromGrid ? idx + 1 : idx}
                  layout="grid"
                  onDelete={handleDeletePrompt}
                  onRename={handleRename}
                  onDuplicate={handleDuplicate}
                  onRetryUpload={handleRetryUpload}
                  onDismissUpload={handleDismissUpload}
                />
              ))}
            </div>
          )
        ) : null}
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
