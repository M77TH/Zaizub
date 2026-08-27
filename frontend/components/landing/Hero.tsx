"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";
import type { ChangeEvent, DragEvent, FormEvent } from "react";
import { heroCopy } from "./copy";
import type { Lang } from "./copy";
import PhoneMockup from "./PhoneMockup";
import InteractiveDots from "./InteractiveDots";

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
      formats: "MP4, MOV, or WebM · up to 50 MB",
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
      formats: "MP4, MOV หรือ WebM · ขนาดไม่เกิน 50 MB",
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
    setIsClosing(true);
  }, []);

  const clearUploadTimer = useCallback(() => {
    if (uploadTimerRef.current !== null) {
      window.clearInterval(uploadTimerRef.current);
      uploadTimerRef.current = null;
    }
  }, []);

  const selectFile = useCallback((nextFile: File | undefined) => {
    if (file) return;
    clearUploadTimer();

    if (!nextFile || !nextFile.type.startsWith("video/") || nextFile.size > 50 * 1024 * 1024) {
      setFile(null);
      setDuration(null);
      setUploadProgress(0);
      setUploadStage("error");
      setUploadError(!nextFile || !nextFile.type.startsWith("video/") ? "type" : "size");
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
    closeUpload();
  }, [file, clearUploadTimer, closeUpload]);

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
      openUpload();
      setIsDragging(true);
    };

    const handlePageDragLeave = (event: globalThis.DragEvent) => {
      const leftDocument = !event.relatedTarget || !document.documentElement.contains(event.relatedTarget as Node);
      if (!leftDocument || file) return;
      setIsDragging(false);
      closeUpload();
    };

    const handlePageDragEnd = () => {
      if (file) return;
      setIsDragging(false);
      closeUpload();
    };

    const handlePageDrop = (event: globalThis.DragEvent) => {
      if (!isFileDrag(event)) return;
      if (file) return;
      event.preventDefault();
      setIsDragging(false);
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
  }, [file, openUpload, closeUpload, scrollToHero, selectFile]);

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
    setIsDragging(false);
    if (file) return;
    scrollToHero();
    selectFile(e.dataTransfer.files[0]);
  }

  function handleOverlayDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
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
      let response;

      // กรณีที่ 1: ส่งลิ้งก์วิดีโอ (เช่น YouTube แบบในภาพ)
      if (link) {
        response = await fetch("http://localhost:8000/api/v1/process-link", { // แก้ URL เป็น Endpoint จริงของคุณ
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: link }),
        });
      } 
      // กรณีที่ 2: ส่งไฟล์วิดีโออัปโหลด
      else if (file) {
        const formData = new FormData();
        formData.append("file", file);
        
        response = await fetch("http://localhost:8000/api/v1/extract-audio", {
          method: "POST",
          body: formData,
        });
      }

      if (!response || !response.ok) {
        throw new Error("เกิดข้อผิดพลาดในการส่งข้อมูลไปยัง Backend");
      }

      const data = await response.json();
      
      // เมื่อสำเร็จ สามารถใช้ data.subtitles บันทึกลง State Management (Zustand/Context) 
      // หรือแนบไปกับ URL แล้วสั่งเปลี่ยนหน้าไปที่ Editor
      console.log("Success:", data);
      
      // เด้งไปหน้า Editor (ปรับ path ให้ตรงกับโปรเจกต์ของคุณ)
      router.push("/editor"); 

    } catch (error) {
      console.error("Backend Error:", error);
      // TODO: เพิ่ม State แจ้งเตือนผู้ใช้กรณี API พัง
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
    <section id="top" className="relative min-h-svh overflow-hidden">
      <div className="absolute inset-0 bg-hero-glow" aria-hidden />
      <InteractiveDots />

      <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 pb-16 pt-24 sm:gap-16 sm:px-6 sm:pb-24 sm:pt-28 lg:grid-cols-2 lg:px-10 lg:pb-32 lg:pt-36">
        <div>
          <h1
            className={`font-display text-3xl font-bold leading-tight tracking-tight text-ink ${lang === "th"
                ? "tracking-[-0.04em] leading-[1.3] sm:text-5xl sm:leading-[1.3] lg:text-6xl lg:tracking-[-0.06em]"
                : "tracking-[-0.04em] leading-[1.3] sm:text-4xl sm:leading-[1.3] lg:text-5xl lg:leading-[1.3]"
              }`}
          >
            {t.headlineTop}
            <br />
            <span className="bg-gradient-to-r from-accent-soft via-accent to-magenta bg-clip-text text-transparent">
              {t.headlineAccent}
            </span>
          </h1>

          <p
            className={`mt-5 whitespace-pre-line text-sm leading-relaxed text-ink-muted sm:text-base ${lang === "th" ? "max-w-none" : "max-w-md"
              }`}
          >
            {t.sub}
          </p>

          <form
            id="generate"
            onSubmit={handleGenerate}
            className="relative mt-9 flex w-full max-w-2xl flex-col gap-3 sm:flex-row sm:items-center"
          >
            <label className="sr-only" htmlFor="upload">
              {lang === "en" ? "Upload a video file" : "อัปโหลดไฟล์วิดีโอ"}
            </label>
            <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileChange} className="hidden" />
            <div className="flex h-12 min-w-0 flex-1 items-center gap-2 overflow-visible rounded-xl border border-white/[0.03] bg-surface/60 pl-1.5 pr-1.5 backdrop-blur-md">
              {file ? (
                <span className={`flex h-9 w-9 flex-none items-center justify-center rounded-xl transition-[background-color,color,transform] duration-300 ${uploadStage === "error" ? "bg-red-400/10 text-red-300" : "bg-accent/15 text-accent-soft"}`} aria-label={uploadStage === "uploading" ? "Uploading" : uploadStage === "complete" ? "Upload complete" : "Upload error"}>
                  <span className="relative flex h-5 w-5 items-center justify-center" aria-hidden>
                    <svg className={`absolute transition-[opacity,transform] duration-500 ease-out ${uploadStage === "uploading" ? "scale-100 opacity-100" : "scale-50 opacity-0"}`} width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" />
                      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="53.4" strokeDashoffset={`${53.4 - (53.4 * uploadProgress) / 100}`} transform="rotate(-90 12 12)" className="transition-[stroke-dashoffset] duration-150" />
                    </svg>
                    <svg className={`absolute transition-[opacity,transform,color] duration-500 ease-out ${uploadStage === "complete" ? "scale-100 text-accent-soft opacity-100" : "scale-50 opacity-0"}`} width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="m7 12.5 3.2 3.2L17.5 8.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <svg className={`absolute transition-[opacity,transform] duration-500 ease-out ${uploadStage === "error" ? "scale-100 opacity-100" : "scale-50 opacity-0"}`} width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M12 4 3.5 19h17L12 4Zm0 6v4m0 3h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </span>
              ) : (
                <button
                  id="upload"
                  type="button"
                  onClick={() => {
                    if (file) return;
                    openUpload();
                  }}
                  className="focus-ring flex h-10 w-10 flex-none items-center justify-center rounded-lg text-accent-soft transition-[background-color,color,transform] duration-300 hover:rotate-90 hover:bg-white/5 hover:text-ink"
                  aria-label={lang === "en" ? "Upload a video file" : "อัปโหลดไฟล์วิดีโอ"}
                >
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              )}
              <span className="self-center h-7 w-px flex-none bg-white/5" aria-hidden />

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
                <input value={link} onChange={(e) => { setLink(e.target.value); setLinkError(false); }} type="text" placeholder={t.linkPlaceholder} className="focus-ring h-12 flex-1 bg-transparent px-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none" />
              )}
              {file && (
                <button
                  type="button"
                  onClick={handleResetFile}
                  className="focus-ring mr-3 flex h-8 w-8 flex-none items-center justify-center rounded-full text-lg text-ink-faint hover:bg-white/5 hover:text-ink"
                  aria-label={upload.remove}
                >
                  ×
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
                  className={`peer focus-ring relative flex h-9 w-32 items-center justify-center gap-1.5 rounded-xl bg-white/[0.02] px-5 text-sm font-medium transition-[color,transform,opacity,box-shadow] duration-700 ease-in-out disabled:cursor-not-allowed ${sourceReady ? "scale-100 text-white shadow-glow hover:scale-[1.03]" : "scale-[0.98] text-white/20"}`}
                >
                  <span className={`absolute inset-0 rounded-xl bg-gradient-to-b from-accent-soft to-accent-deep transition-opacity duration-700 ease-in-out ${sourceReady ? "opacity-100" : "opacity-0"}`} aria-hidden />
                  {sourceReady && <span className="pointer-events-none absolute -inset-1 rounded-xl bg-accent/15 blur-lg animate-[buttonAura_3.6s_ease-in-out_infinite]" aria-hidden />}
                  <span className="relative z-10 flex items-center gap-1.5">
                    {status === "generating" ? t.generating : t.generate}
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className={`transition-[color,opacity,filter] duration-700 ease-in-out ${sourceReady ? "animate-[sparkleGlow_2.4s_ease-in-out_infinite] text-white opacity-100" : "text-white/20 opacity-70"}`} aria-hidden>
                      <path
                        d="M7.45284 2.71266C7.8276 1.76244 9.1724 1.76245 9.54716 2.71267L10.7085 5.65732C10.8229 5.94743 11.0526 6.17707 11.3427 6.29148L14.2873 7.45284C15.2376 7.8276 15.2376 9.1724 14.2873 9.54716L11.3427 10.7085C11.0526 10.8229 10.8229 11.0526 10.7085 11.3427L9.54716 14.2873C9.1724 15.2376 7.8276 15.2376 7.45284 14.2873L6.29148 11.3427C6.17707 11.0526 5.94743 10.8229 5.65732 10.7085L2.71266 9.54716C1.76244 9.1724 1.76245 7.8276 2.71267 7.45284L5.65732 6.29148C5.94743 6.17707 6.17707 5.94743 6.17707 5.65732L7.45284 2.71266Z"
                        fill="currentColor"
                      />
                      <path
                        opacity="0.55"
                        d="M16.9245 13.3916C17.1305 12.8695 17.8695 12.8695 18.0755 13.3916L18.9761 15.6753C19.039 15.8348 19.1652 15.961 19.3247 16.0239L21.6084 16.9245C22.1305 17.1305 22.1305 17.8695 21.6084 18.0755L19.3247 18.9761C19.1652 19.039 19.039 19.1652 18.9761 19.3247L18.0755 21.6084C17.8695 22.1305 17.1305 22.1305 16.9245 21.6084L16.0239 19.3247C15.961 19.1652 15.8348 19.039 15.6753 18.9761L13.3916 18.0755C12.8695 17.8695 12.8695 17.1305 13.3916 16.9245L15.6753 16.0239C15.8348 15.961 15.961 15.8348 16.0239 15.6753L16.9245 13.3916Z"
                        fill="currentColor"
                      />
                    </svg>
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
                className={`fixed inset-0 z-30 flex items-center justify-center bg-black/60 px-6 backdrop-blur-sm ${isClosing ? "upload-overlay-closing pointer-events-none" : "animate-[uploadOverlayIn_300ms_ease-out_both]"}`}
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
                  className={`w-full max-w-md rounded-3xl border border-white/10 bg-[#100c18] p-5 ${isClosing ? "upload-modal-closing pointer-events-none" : "animate-[uploadModalIn_300ms_ease-out_both]"}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <p id="upload-modal-title" className="text-base font-semibold text-ink">{upload.title}</p>
                      <p className="mt-1 text-sm text-ink-faint">{upload.description}</p>
                    </div>
                    <button type="button" onClick={closeUpload} className="focus-ring rounded-full px-2 text-xl leading-none text-ink-faint hover:text-ink" aria-label={upload.close}>×</button>
                  </div>

                  <div
                    className={`cursor-pointer rounded-2xl border border-dashed px-5 py-9 text-center transition-[border-color,background-color,transform,box-shadow] duration-200 ease-out ${file ? "border-white/10 bg-white/[0.01]" : isDragging ? "scale-[1.02] animate-[dropZonePulse_1.4s_ease-in-out_infinite] border-accent bg-accent/10 shadow-[0_0_35px_rgba(139,92,246,0.25)]" : "border-white/15 bg-white/[0.02]"}`}
                    onClick={() => { if (!file) fileInputRef.current?.click(); }}
                    onDragEnter={file ? undefined : handleDragEnter}
                    onDragOver={file ? undefined : (e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={file ? undefined : handleDragLeave}
                    onDrop={file ? undefined : handleDrop}
                  >
                    <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent-soft transition-[transform,background-color] duration-200 ${isDragging ? "scale-110 -rotate-6 bg-accent/25" : ""}`} aria-hidden>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M12 16V4m0 0L8 8m4-4 4 4M5 20h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <p className="mt-4 text-sm font-medium text-ink">{file ? upload.alreadyAttached : isDragging ? upload.release : upload.drop}</p>
                    <p className="mt-1 text-xs text-ink-faint">{upload.formats}</p>
                    {uploadErrorText && <p className="mt-3 text-xs text-red-300">{uploadErrorText}</p>}
                    <button
                      type="button"
                      disabled={Boolean(file)}
                      onClick={() => fileInputRef.current?.click()}
                      className="focus-ring mt-5 rounded-xl bg-gradient-to-b from-accent-soft to-accent-deep px-4 py-2 text-sm font-medium text-white transition-[filter] duration-200 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      {upload.browse}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        <PhoneMockup lang={lang} pulseKey={pulseKey} />
      </div>
    </section>
  );
}
