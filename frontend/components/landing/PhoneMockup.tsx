"use client";

import { useState, useRef, useEffect } from "react";
import type { Lang } from "./copy";

export default function PhoneMockup({
  videoSrc = "/video_preview/video_1.mp4",
  backVideoSrc = "/video_preview/video_2.mp4",
  lang = "en",
  pulseKey,
}: {
  lang?: Lang;
  pulseKey?: number;
  /** Primary demo clip */
  videoSrc?: string;
  /** Secondary demo clip */
  backVideoSrc?: string;
}) {
  const [activeIndex, setActiveIndex] = useState<0 | 1>(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isPulsing, setIsPulsing] = useState(false);
  const [isInView, setIsInView] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const video1Ref = useRef<HTMLVideoElement>(null);
  const video2Ref = useRef<HTMLVideoElement>(null);

  // Trigger subtle purple glow when user interacts with Hero generate button/link
  useEffect(() => {
    if (pulseKey && pulseKey > 0) {
      setIsPulsing(true);
      const timer = setTimeout(() => setIsPulsing(false), 800);
      return () => clearTimeout(timer);
    }
  }, [pulseKey]);

  // Pause videos and animations when scrolled offscreen or when tab is hidden
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    let isIntersecting = true;

    const syncPlayback = () => {
      const active = isIntersecting && !document.hidden;
      setIsInView(active);

      const v1 = video1Ref.current;
      const v2 = video2Ref.current;

      if (!active) {
        if (v1) v1.pause();
        if (v2) v2.pause();
      } else {
        if (v1) {
          v1.defaultMuted = true;
          v1.muted = activeIndex === 0 ? isMuted : true;
          v1.play().catch(() => {});
        }
        if (v2) {
          v2.defaultMuted = true;
          v2.muted = activeIndex === 1 ? isMuted : true;
          v2.play().catch(() => {});
        }
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        isIntersecting = entry.isIntersecting;
        syncPlayback();
      },
      { threshold: 0.05, rootMargin: "100px 0px" }
    );

    observer.observe(el);
    document.addEventListener("visibilitychange", syncPlayback);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", syncPlayback);
    };
  }, [activeIndex, isMuted]);

  // Audio synchronization: only active front clip can be unmuted
  useEffect(() => {
    if (!isInView) return;
    const v1 = video1Ref.current;
    const v2 = video2Ref.current;

    if (v1) {
      v1.defaultMuted = true;
      v1.muted = activeIndex === 0 ? isMuted : true;
      v1.play().catch(() => {});
    }

    if (v2) {
      v2.defaultMuted = true;
      v2.muted = activeIndex === 1 ? isMuted : true;
      v2.play().catch(() => {});
    }
  }, [activeIndex, isMuted, isInView]);

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  const clips = [
    {
      id: 0,
      src: videoSrc,
      ref: video1Ref,
    },
    {
      id: 1,
      src: backVideoSrc,
      ref: video2Ref,
    },
  ];

  return (
    <div ref={containerRef} className="relative flex flex-col items-center justify-center pt-3 pb-2 sm:pt-6 sm:pb-4 lg:py-4">
      {/* Phone Stage Wrapper */}
      <div className="relative h-[330px] w-[175px] min-[390px]:h-[370px] min-[390px]:w-[195px] sm:h-[390px] sm:w-[205px] lg:h-[360px] lg:w-[190px] xl:h-[400px] xl:w-[210px]">
        {clips.map((clip) => {
          const isFront = activeIndex === clip.id;

          return (
            <div
              key={clip.id}
              onClick={() => {
                if (!isFront) setActiveIndex(clip.id as 0 | 1);
              }}
              className={`group/phone absolute inset-0 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                isFront
                  ? "z-20 -translate-x-10 -translate-y-2 min-[390px]:-translate-x-12 min-[390px]:-translate-y-2.5 sm:-translate-x-14 sm:-translate-y-3 md:-translate-x-15 md:-translate-y-3 lg:-translate-x-16 lg:-translate-y-3.5 xl:-translate-x-20 xl:-translate-y-4 2xl:-translate-x-22 2xl:-translate-y-4 scale-100 cursor-default"
                  : "z-10 translate-x-10 translate-y-1.5 min-[390px]:translate-x-12 min-[390px]:translate-y-2 sm:translate-x-14 sm:translate-y-2 md:translate-x-15 md:translate-y-2 lg:translate-x-16 lg:translate-y-2.5 xl:translate-x-20 xl:translate-y-3 2xl:translate-x-22 2xl:translate-y-3 scale-[0.96] opacity-90 hover:opacity-100 cursor-pointer"
              }`}
            >
              {/* Device Frame */}
              <div
                style={{
                  animationPlayState: isInView ? "running" : "paused",
                }}
                className={`h-full w-full rounded-[2.2rem] bg-[#07060a] p-1.5 shadow-[0_24px_60px_rgba(0,0,0,0.95),0_0_20px_rgba(139,92,246,0.14)] ring-1 will-change-transform transform-gpu [backface-visibility:hidden] transition-all duration-500 ${
                  isFront
                    ? isPulsing
                      ? "ring-purple-400/90 shadow-[0_28px_70px_rgba(0,0,0,0.98),0_0_36px_rgba(139,92,246,0.35)]"
                      : "ring-white/12 hover:ring-purple-400/35 hover:shadow-[0_28px_70px_rgba(0,0,0,0.98),0_0_26px_rgba(139,92,246,0.22)] animate-phoneIdleFront"
                    : "ring-white/[0.08] hover:ring-purple-400/30 hover:scale-[1.01] animate-phoneIdleBack"
                }`}
              >
                {/* Screen Bezel & Container */}
                <div className="relative h-full w-full overflow-hidden rounded-[1.92rem] bg-[#0b0914] border border-white/[0.08]">
                  {/* Real Demo Video */}
                  <video
                    ref={clip.ref}
                    className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
                      isFront ? "opacity-100" : "opacity-90"
                    }`}
                    src={clip.src}
                    autoPlay
                    muted={isFront ? isMuted : true}
                    loop
                    playsInline
                    preload="auto"
                  />

                  {/* Sleek Dynamic Island */}
                  <div className="pointer-events-none absolute top-2 sm:top-2.5 left-1/2 -translate-x-1/2 z-30 flex h-2.5 sm:h-3 w-12 sm:w-13.5 items-center justify-end rounded-full bg-black/95 px-1.5 ring-1 ring-white/[0.08] shadow-sm">
                    <div className="h-1 sm:h-1.5 w-1 sm:w-1.5 rounded-full bg-[#181528] ring-1 ring-purple-500/30" />
                  </div>

                  {/* Delicate Screen Glass Sheen */}
                  <div className="pointer-events-none absolute inset-0 z-20 rounded-[1.72rem] bg-gradient-to-tr from-transparent via-white/[0.02] to-white/[0.06] mix-blend-overlay" />

                  {/* Bottom Home Indicator */}
                  <div className="pointer-events-none absolute bottom-1.5 left-1/2 -translate-x-1/2 z-30 h-1 w-10 sm:w-12 rounded-full bg-white/25 backdrop-blur-sm" />

                  {/* Sound Toggle (Only on Active Front Phone) */}
                  {isFront && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMute();
                      }}
                      aria-label={
                        isMuted
                          ? lang === "th"
                            ? "เปิดเสียง"
                            : "Unmute video"
                          : lang === "th"
                            ? "ปิดเสียง"
                            : "Mute video"
                      }
                      className="group/sound absolute bottom-3 right-2 sm:bottom-3.5 sm:right-2.5 z-30 flex items-center gap-1.5 rounded-full bg-black/75 px-2 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-mono font-medium text-white/90 backdrop-blur-md border border-white/15 hover:border-purple-400/50 hover:bg-black/90 transition-all shadow-[0_2px_12px_rgba(0,0,0,0.7)] cursor-pointer"
                    >
                      {isMuted ? (
                        <>
                          <svg
                            className="h-3 w-3 text-white/70 group-hover/sound:text-white transition-colors"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                            <line x1="23" y1="9" x2="17" y2="15" />
                            <line x1="17" y1="9" x2="23" y2="15" />
                          </svg>
                          <span>{lang === "th" ? "เปิดเสียง" : "Muted"}</span>
                        </>
                      ) : (
                        <>
                          <svg
                            className="h-3 w-3 text-purple-400 animate-pulse"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                          </svg>
                          <span className="text-purple-300">
                            {lang === "th" ? "เสียงเปิด" : "Sound on"}
                          </span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
