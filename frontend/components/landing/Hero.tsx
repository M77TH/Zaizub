"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { ChangeEvent, DragEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { heroCopy } from "./copy";
import type { Lang } from "./copy";
import PhoneMockup from "./PhoneMockup";
import InteractiveDots from "./InteractiveDots";
import { apiUrl } from "@/lib/api";

export default function Hero({ lang }: { lang: Lang }) {
  const router = useRouter();
  const t = heroCopy[lang];
  const upload = lang === "en"
    ? {
      title: "Upload your video",
      description: "Add a clip and let AI create your captions.",
      close: "Close upload dialog",
      release: "Release to upload",
      drop: "Drag and drop your video here",
      formats: "MP4 · up to 50 MB",
      browse: "Browse files",
      alreadyAttached: "Remove the current video before uploading another.",
      remove: "Remove uploaded file",
      uploading: "Uploading video...",
    }
    : {
      title: "อัปโหลดวิดีโอของคุณ",
      description: "เพิ่มคลิปแล้วให้ AI สร้างซับไตเติ้ลให้คุณ",
      close: "ปิดหน้าต่างอัปโหลด",
      release: "ปล่อยไฟล์เพื่ออัปโหลด",
      drop: "ลากและวางวิดีโอที่นี่",
      formats: "MP4 · ขนาดไม่เกิน 50 MB",
      browse: "เลือกไฟล์",
      alreadyAttached: "กรุณาลบวิดีโอปัจจุบันก่อนอัปโหลดไฟล์ใหม่",
      remove: "ลบไฟล์ที่อัปโหลด",
      uploading: "กำลังอัปโหลดวิดีโอ...",
    };
  const [link, setLink] = useState("");
  const [linkError, setLinkError] = useState(false);
  const [sourceHintOpen, setSourceHintOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "generating">("idle");
  const [pulseKey, setPulseKey] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [uploadStage, setUploadStage] = useState<"idle" | "uploading" | "complete" | "error">("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<"type" | "size" | "">("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTimerRef = useRef<number | null>(null);
  const statusTimerRef = useRef<number | null>(null);

  const uploadErrorText = uploadError === "type"
    ? (lang === "en" ? "Only video files can be uploaded." : "อัปโหลดได้เฉพาะไฟล์วิดีโอเท่านั้น")
    : uploadError === "size"
      ? (lang === "en" ? "Video must be 50 MB or smaller." : "ไฟล์วิดีโอต้องมีขนาดไม่เกิน 50 MB")
      : "";

  const linkIsValid = (() => {
    if (!link.trim()) return false;
    try {
      const url = new URL(link.trim());
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  })();

  const sourceReady = file ? uploadStage === "complete" : Boolean(link.trim());
  const linkErrorText = lang === "en" ? "Please enter a valid video link." : "กรุณาใส่ลิงก์วิดีโอที่ถูกต้อง";
  const sourceHint = lang === "en" ? "Add a video or link first" : "กรุณาเพิ่มวิดีโอหรือลิงก์ก่อน";

  const scrollToHero = useCallback(() => {
    const hero = document.getElementById("top");
    if (!hero) return;
    const top = hero.getBoundingClientRect().top + window.scrollY;
    window.requestAnimationFrame(() => window.scrollTo({ top, behavior: "smooth" }));
  }, []);

  const openUpload = useCallback(() => {
    setIsClosing(false);
    setUploadOpen(true);
  }, []);

  const closeUpload = useCallback(() => {
    setIsDragging(false);
    setUploadOpen((open) => {
      if (open) setIsClosing(true);
      return open;
    });
  }, []);

  const forceCloseUpload = useCallback(() => {
    setIsDragging(false);
    setIsClosing(false);
    setUploadOpen(false);
  }, []);

  const clearUploadTimer = useCallback(() => {
    if (uploadTimerRef.current !== null) {
      window.clearInterval(uploadTimerRef.current);
      uploadTimerRef.current = null;
    }
  }, []);

  const isVideoFile = (checkFile: File) => {
    if (checkFile.type && checkFile.type.startsWith("video/")) return true;
    return /\.(mp4|mov|webm|m4v|mkv|avi|wmv|flv)$/i.test(checkFile.name);
  };

  const selectFile = useCallback((nextFile: File | undefined) => {
    forceCloseUpload();
    clearUploadTimer();

    if (!nextFile || !isVideoFile(nextFile) || nextFile.size > 50 * 1024 * 1024) {
      setFile(null);
      setDuration(null);
      setUploadProgress(0);
      setUploadStage("error");
      setUploadError(!nextFile || !isVideoFile(nextFile) ? "type" : "size");
      return;
    }

    setFile(nextFile);
    setLink("");
    setUploadError("");
    setUploadStage("uploading");
    setUploadProgress(0);

    const animationDuration = Math.min(1400, Math.max(250, (nextFile.size / (50 * 1024 * 1024)) * 1400));
    const steps = Math.ceil(animationDuration / 100);
    const progressStep = 100 / steps;

    uploadTimerRef.current = window.setInterval(() => {
      setUploadProgress((current) => {
        const next = Math.min(current + progressStep, 100);
        if (next >= 100) {
          clearUploadTimer();
          setUploadStage("complete");
        }
        return next;
      });
    }, 120);

    setDuration(null);
    const video = document.createElement("video");
    const objectUrl = URL.createObjectURL(nextFile);
    video.preload = "metadata";

    const revokeUrl = () => {
      URL.revokeObjectURL(objectUrl);
    };

    video.onloadedmetadata = () => {
      setDuration(video.duration);
      revokeUrl();
    };
    video.onerror = () => {
      revokeUrl();
    };
    video.src = objectUrl;
  }, [file, clearUploadTimer, forceCloseUpload]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      clearUploadTimer();
      if (statusTimerRef.current !== null) {
        window.clearTimeout(statusTimerRef.current);
      }
    };
  }, [clearUploadTimer]);

  // Handle drag-and-drop on entire window
  useEffect(() => {
    const isFileDrag = (event: globalThis.DragEvent) => Array.from(event.dataTransfer?.types ?? []).includes("Files");
    const isHeaderDrag = (event: globalThis.DragEvent) => event.target instanceof Element && Boolean(event.target.closest("header"));

    const handlePageDragEnter = (event: globalThis.DragEvent) => {
      if (!isFileDrag(event)) return;
      if (file) return;
      if (isHeaderDrag(event)) return;
      event.preventDefault();
      openUpload();
      setIsDragging(true);
    };

    const handlePageDragOver = (event: globalThis.DragEvent) => {
      if (!isFileDrag(event)) return;
      if (file) return;
      if (isHeaderDrag(event)) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
      setIsDragging(true);
    };

    const handlePageDragLeave = (event: globalThis.DragEvent) => {
      if (file) return;
      const x = event.clientX;
      const y = event.clientY;
      const leftDocument = !event.relatedTarget || !document.documentElement.contains(event.relatedTarget as Node);
      const isOutOfBounds = x <= 0 || y <= 0 || x >= window.innerWidth || y >= window.innerHeight;
      if (leftDocument || isOutOfBounds) {
        setIsDragging(false);
        closeUpload();
      }
    };

    const handlePageDragEnd = () => {
      forceCloseUpload();
    };

    const handlePageDrop = (event: globalThis.DragEvent) => {
      if (!isFileDrag(event)) return;
      event.preventDefault();
      forceCloseUpload();
      if (file) return;
      scrollToHero();
      selectFile(event.dataTransfer?.files?.[0]);
    };

    window.addEventListener("dragenter", handlePageDragEnter);
    window.addEventListener("dragover", handlePageDragOver);
    window.addEventListener("dragleave", handlePageDragLeave);
    window.addEventListener("dragend", handlePageDragEnd);
    window.addEventListener("drop", handlePageDrop);

    return () => {
      window.removeEventListener("dragenter", handlePageDragEnter);
      window.removeEventListener("dragover", handlePageDragOver);
      window.removeEventListener("dragleave", handlePageDragLeave);
      window.removeEventListener("dragend", handlePageDragEnd);
      window.removeEventListener("drop", handlePageDrop);
    };
  }, [file, openUpload, closeUpload, forceCloseUpload, scrollToHero, selectFile]);

  // Handle Escape key to close modal
  useEffect(() => {
    if (!uploadOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeUpload();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [uploadOpen, closeUpload]);

  // Safety fallback to unmount overlay after close animation ends
  useEffect(() => {
    if (!isClosing) return;
    const timer = window.setTimeout(() => {
      setUploadOpen(false);
      setIsClosing(false);
    }, 320);
    return () => window.clearTimeout(timer);
  }, [isClosing]);

  function formatDuration(seconds: number) {
    const totalSeconds = Math.round(seconds);
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    if (lang === "th") {
      if (minutes === 0) return `${remainingSeconds} วินาที`;
      return remainingSeconds === 0
        ? `${minutes} นาที`
        : `${minutes} นาที ${remainingSeconds} วินาที`;
    }
    if (minutes === 0) return `${remainingSeconds} sec`;
    return remainingSeconds === 0
      ? `${minutes} min`
      : `${minutes} min ${remainingSeconds} sec`;
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    selectFile(e.target.files?.[0]);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    forceCloseUpload();
    if (file) return;
    scrollToHero();
    selectFile(e.dataTransfer.files[0]);
  }

  function handleOverlayDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    forceCloseUpload();
    if (file) return;
    scrollToHero();
    selectFile(e.dataTransfer.files[0]);
  }

  function handleDragEnter(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }

  function handleOverlayDragLeave(e: DragEvent<HTMLDivElement>) {
    const nextTarget = e.relatedTarget as Node | null;
    if (nextTarget && e.currentTarget.contains(nextTarget)) return;
    const x = e.clientX;
    const y = e.clientY;
    if (x > 0 && y > 0 && x < window.innerWidth && y < window.innerHeight) return;
    setIsDragging(false);
    closeUpload();
  }

  async function handleGenerate(e: FormEvent) {
    e.preventDefault();
    if (status === "generating") return;
    if (!file && !linkIsValid) {
      setLinkError(true);
      return;
    }
    if (!sourceReady) return;

    setStatus("generating");
    setPulseKey((k) => k + 1);

    try {
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(apiUrl("/api/v1/extract-audio"), {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          throw new Error(`API extraction failed with status ${res.status}`);
        }

        const data = await res.json();
        sessionStorage.setItem("subtitle_project", JSON.stringify(data));
        router.push("/editor");
      } else if (linkIsValid) {
        const res = await fetch(apiUrl("/api/v1/process-link"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: link.trim() }),
        });

        if (!res.ok) {
          throw new Error(`API process-link failed with status ${res.status}`);
        }

        const data = await res.json();
        sessionStorage.setItem("subtitle_project", JSON.stringify(data));
        router.push("/editor");
      }
    } catch (err) {
      console.warn("Backend error or unreachable, fallback to editor session:", err);
      if (file) {
        const localUrl = URL.createObjectURL(file);
        sessionStorage.setItem(
          "subtitle_project",
          JSON.stringify({
            video_url: localUrl,
            video_filename: file.name,
            subtitles: [
              {
                id: 1,
                start: 0.0,
                end: Math.min(5.0, duration || 5.0),
                text: "ยินดีต้อนรับสู่ระบบสร้างซับไตเติ้ล Zaizub",
              },
            ],
          })
        );
        router.push("/editor");
      } else {
        setLinkError(true);
      }
    } finally {
      setStatus("idle");
    }
  }

  const handleResetFile = () => {
    clearUploadTimer();
    setFile(null);
    setDuration(null);
    setUploadStage("idle");
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <section id="top" className="relative overflow-visible overflow-x-clip min-h-[100svh] flex flex-col justify-center">
      <div className="absolute inset-0 bg-hero-glow" aria-hidden />
      <InteractiveDots />

      <div className="relative z-10 mx-auto grid max-w-7xl w-full grid-cols-1 items-center gap-8 px-4 pt-20 pb-8 sm:gap-12 sm:px-6 sm:pt-24 sm:pb-12 lg:grid-cols-12 lg:gap-10 xl:gap-16 lg:px-10 lg:pt-24 lg:pb-12">
        <div className="lg:col-span-7">
          <h1
            className={`font-display font-extrabold tracking-tight text-white ${lang === "th"
                ? "text-3xl leading-[1.25] sm:text-5xl sm:leading-[1.2] lg:text-[54px] xl:text-[62px] lg:leading-[1.15] tracking-[-0.03em]"
                : "text-[28px] leading-[1.15] min-[400px]:text-3xl sm:text-5xl sm:leading-[1.12] lg:text-[48px] xl:text-[56px] 2xl:text-[62px] lg:leading-[1.08] tracking-[-0.035em]"
              }`}
          >
            <span className="block whitespace-nowrap text-white">
              {t.headlineTop}
            </span>
            <span className="block whitespace-nowrap bg-gradient-to-r from-[#d8b4fe] via-[#a78bfa] to-[#818cf8] bg-clip-text text-transparent">
              {t.headlineAccent}
            </span>
          </h1>

          <p
            className={`mt-6 whitespace-pre-line text-base leading-relaxed text-zinc-400 sm:text-lg ${lang === "th" ? "max-w-none" : "max-w-xl"
              }`}
          >
            {t.sub}
          </p>

          <form
            id="generate"
            onSubmit={handleGenerate}
            className="relative mt-8 sm:mt-9 flex w-full max-w-2xl flex-col gap-3"
          >
            <label className="sr-only" htmlFor="upload">
              {lang === "en" ? "Upload a video file" : "อัปโหลดไฟล์วิดีโอ"}
            </label>
            <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileChange} className="hidden" />

            <div className="flex h-12 min-w-0 flex-1 items-center gap-2 overflow-visible rounded-full border border-white/[0.08] bg-surface/80 p-1.5 backdrop-blur-md shadow-[0_12px_40px_rgba(0,0,0,0.6),0_0_20px_rgba(124,58,237,0.08)]">
              {file ? (                <button
                  id="upload"
                  type="button"
                  onClick={openUpload}
                  className={`group focus-ring flex h-9 w-9 flex-none items-center justify-center rounded-full transition-all duration-300 ${
                    uploadStage === "error"
                      ? "bg-red-400/10 text-red-300 hover:bg-red-400/20 hover:scale-105"
                      : uploadStage === "uploading"
                        ? "bg-accent/15 text-accent-soft"
                      : "bg-accent/15 text-accent-soft hover:bg-accent/25 hover:scale-105"
                  }`}
                  aria-label={uploadStage === "uploading" ? (lang === "en" ? "Uploading video..." : "กำลังอัปโหลดวิดีโอ...") : lang === "en" ? "Change uploaded video" : "เปลี่ยนไฟล์วิดีโอที่อัปโหลด"}
                  title={uploadStage === "uploading" ? (lang === "en" ? "Uploading video..." : "กำลังอัปโหลดวิดีโอ...") : lang === "en" ? "Change uploaded video" : "เปลี่ยนไฟล์วิดีโอที่อัปโหลด"}
                >
                  {/* Checkmark — upload complete state (no circle border) */}
                  <svg
                    className={`absolute transition-[opacity,transform] duration-500 ease-out ${uploadStage === "complete" ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden
                  >
                    <path d="m7 12.5 3.2 3.2L17.5 8.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {/* Animated progress ring — uploading state */}
                  <svg
                    className={`absolute transition-[opacity,transform] duration-500 ease-out ${uploadStage === "uploading" ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden
                  >
                    <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" />
                    <circle
                      cx="12"
                      cy="12"
                      r="8.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeDasharray="53.4"
                      strokeDashoffset={`${53.4 - (53.4 * uploadProgress) / 100}`}
                      transform="rotate(-90 12 12)"
                      className="transition-[stroke-dashoffset] duration-150"
                    />
                  </svg>
                  {/* Upload (+) icon — idle/error state, also doubles as change-file affordance */}
                  <svg
                    className={`absolute transition-[opacity,transform] duration-500 ease-out ${uploadStage === "error" ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
              ) : (
                <button
                  id="upload"
                  type="button"
                  onClick={openUpload}
                  className="group focus-ring flex h-9 w-9 flex-none items-center justify-center rounded-full text-purple-400/80 hover:text-purple-200 hover:bg-white/[0.06] transition-all duration-300 hover:rotate-90 hover:scale-110 active:scale-95"
                  aria-label={lang === "en" ? "Upload a video file" : "อัปโหลดไฟล์วิดีโอ"}
                  title={lang === "en" ? "Upload a video file" : "อัปโหลดไฟล์วิดีโอ"}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_8px_rgba(168,85,247,0.4)] group-hover:drop-shadow-[0_0_12px_rgba(168,85,247,0.7)] transition-all" aria-hidden>
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
              )}
              <span className="self-center h-5 w-px flex-none bg-white/10" aria-hidden />

              {file && uploadStage !== "complete" ? (
                <div className="min-w-0 flex-1 overflow-hidden px-2 text-xs text-ink-faint">{uploadStage === "error" ? uploadErrorText : upload.uploading}</div>
              ) : file ? (
                <div className="min-w-0 flex-1 overflow-hidden px-2">
                  <p className="truncate text-xs text-ink" title={file.name}>{file.name}</p>
                  <p className="text-[10px] text-ink-faint">
                    {(file.size / 1024 / 1024).toFixed(1)} MB{duration !== null ? ` · ${formatDuration(duration)}` : ""}
                  </p>
                </div>
              ) : (
                <input
                  value={link}
                  onChange={(e) => { setLink(e.target.value); setLinkError(false); }}
                  type="text"
                  placeholder={t.linkPlaceholder}
                  className="focus-ring h-full min-h-0 flex-1 bg-transparent px-2.5 text-sm text-ink placeholder:text-ink-muted focus:outline-none"
                />
              )}
              {file && (
                <button
                  type="button"
                  onClick={handleResetFile}
                  className="focus-ring mr-2 flex h-7 w-7 flex-none items-center justify-center rounded-full text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
                  aria-label={upload.remove}
                  title={upload.remove}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
              <span className="group relative z-50 flex-none" onMouseEnter={() => !sourceReady && setSourceHintOpen(true)} onMouseLeave={() => setSourceHintOpen(false)}>
                <button
                  type="submit"
                  onClick={(event) => {
                    if (!sourceReady) {
                      event.preventDefault();
                      setSourceHintOpen(true);
                    }
                  }}
                  className={`peer focus-ring relative flex h-9 w-32 items-center justify-center rounded-full border overflow-hidden select-none transition-all duration-300 ${
                    sourceReady
                      ? "border-purple-400/40 shadow-[0_0_16px_rgba(139,92,246,0.25),inset_0_1px_1px_rgba(255,255,255,0.25)] hover:brightness-110 active:scale-95 cursor-pointer"
                      : "border-white/[0.08] bg-white/[0.02] cursor-not-allowed"
                  }`}
                >
                  {/* Inactive purple dot with luminous halo glow */}
                  <span
                    className={`pointer-events-none absolute left-[14px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-purple-400 transition-all duration-200 ${
                      sourceReady
                        ? "opacity-0 scale-125"
                        : "opacity-100 scale-100 shadow-[0_0_8px_rgba(168,85,247,0.9),0_0_16px_rgba(147,51,234,0.4)]"
                    }`}
                    aria-hidden
                  />

                  {/* Spreading purple gradient blooming radially from the exact dot origin (18px, 50%) */}
                  <span
                    className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-r from-[#8b5cf6] via-[#7c3aed] to-[#6d28d9] shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)] transition-[clip-path] duration-[260ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
                    style={{
                      clipPath: sourceReady
                        ? "circle(160px at 18px 50%)"
                        : "circle(4px at 18px 50%)",
                      WebkitClipPath: sourceReady
                        ? "circle(160px at 18px 50%)"
                        : "circle(4px at 18px 50%)",
                    }}
                    aria-hidden
                  />

                  <span
                    className={`relative z-10 flex items-center justify-center gap-1.5 transition-all duration-[260ms] ease-out ${
                      sourceReady ? "pl-0 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]" : "pl-3 text-white/40"
                    }`}
                  >
                    {status === "generating" && (
                      <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                    )}
                    <span className="text-xs font-semibold tracking-wide">
                      {status === "generating" ? t.generating : t.generate}
                    </span>
                  </span>
                </button>
                {!sourceReady && sourceHintOpen && (
                  <span className="pointer-events-none absolute left-1/2 top-[calc(100%+14px)] z-[9999] -translate-x-1/2 whitespace-nowrap rounded-lg border border-black/20 bg-surface-2 px-3 py-1.5 text-[11px] font-medium text-white/60 shadow-xl shadow-black/30">
                    {sourceHint}
                  </span>
                )}
              </span>
            </div>

            {linkError && (
              <p className="pointer-events-none absolute left-0 top-full mt-2 flex items-center gap-1.5 rounded-lg bg-red-400/10 px-3 py-1.5 text-xs text-red-200/70 ring-1 ring-red-400/10">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="flex-none text-red-300" aria-hidden>
                  <path d="m12 3 9 16H3L12 3Z" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                  <path d="M12 9v4m0 3h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                {linkErrorText}
              </p>
            )}

            {uploadOpen && (
              <div
                className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-6 backdrop-blur-md ${isClosing ? "animate-[uploadOverlayOut_300ms_ease-out_both] pointer-events-none" : "animate-[uploadOverlayIn_300ms_ease-out_both]"}`}
                onAnimationEnd={(event) => {
                  if (isClosing && event.target === event.currentTarget) {
                    setUploadOpen(false);
                    setIsClosing(false);
                  }
                }}
                onDragOver={(event) => event.preventDefault()}
                onDragLeave={handleOverlayDragLeave}
                onDragEnd={handleOverlayDragLeave}
                onDrop={handleOverlayDrop}
                onClick={closeUpload}
              >
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="upload-modal-title"
                  data-upload-modal
                  className={`w-full max-w-md rounded-3xl border border-[#221e33] bg-[#0a090f]/95 p-6 shadow-[0_35px_90px_-15px_rgba(0,0,0,0.95),0_0_60px_rgba(139,92,246,0.2)] ring-1 ring-white/10 backdrop-blur-2xl ${isClosing ? "animate-[uploadModalOut_300ms_ease-out_both] pointer-events-none" : "animate-[uploadModalIn_300ms_ease-out_both]"}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <p id="upload-modal-title" className="text-base font-bold text-white tracking-tight">{upload.title}</p>
                      <p className="mt-1 text-xs text-zinc-400">{upload.description}</p>
                    </div>
                    <button type="button" onClick={closeUpload} className="focus-ring rounded-xl p-1 text-xl leading-none text-white/40 hover:text-white hover:bg-white/10 transition-colors" aria-label={upload.close}>×</button>
                  </div>

                  <div
                    className={`rounded-2xl border border-dashed px-5 py-8 text-center transition-all duration-200 ${file ? "border-white/10 bg-white/[0.01]" : isDragging ? "scale-[1.02] border-purple-400 bg-purple-500/10 shadow-[0_0_35px_rgba(139,92,246,0.25)]" : "border-white/20 bg-white/[0.02] hover:border-purple-400/35 hover:bg-purple-500/[0.04]"}`}
                    onDragEnter={file ? undefined : handleDragEnter}
                    onDragOver={file ? undefined : (e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={file ? undefined : handleDragLeave}
                    onDrop={file ? undefined : handleDrop}
                  >
                    <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/15 border border-purple-500/25 text-purple-300 transition-all duration-200 ${isDragging ? "scale-110 -rotate-6 bg-purple-500/25 border-purple-400/40 text-purple-200" : ""}`} aria-hidden>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 16V4m0 0L8 8m4-4 4 4M5 20h14" />
                      </svg>
                    </div>
                    <p className="mt-4 text-sm font-semibold text-white">{file ? upload.alreadyAttached : isDragging ? upload.release : upload.drop}</p>
                    <p className="mt-1 text-xs text-white/50 font-mono">{upload.formats}</p>
                    {uploadErrorText && <p className="mt-3 text-xs text-red-400">{uploadErrorText}</p>}
                    <button
                      type="button"
                      disabled={Boolean(file)}
                      onClick={() => fileInputRef.current?.click()}
                      className="focus-ring mt-5 rounded-xl bg-gradient-to-r from-[#8b5cf6] via-[#7c3aed] to-[#6d28d9] hover:from-[#9061f9] hover:to-[#7c3aed] border border-purple-400/40 px-5 py-2 text-xs font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.5),0_0_14px_rgba(139,92,246,0.25)] transition-all hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      {upload.browse}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="lg:col-span-5 flex items-center justify-center lg:justify-end">
          <PhoneMockup lang={lang} pulseKey={pulseKey} />
        </div>
      </div>
    </section>
  );
}
