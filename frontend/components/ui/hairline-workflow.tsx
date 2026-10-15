"use client";

import * as React from "react";
import {
  Upload,
  Play,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface HairlineFigureProps
  extends React.ComponentPropsWithoutRef<"div"> {
  intensity?: number;
  theme?: "dark" | "light";
}

export interface HairlineWorkflowShowcaseProps
  extends React.ComponentPropsWithoutRef<"div"> {
  intensity?: number;
  theme?: "dark" | "light";
  lang?: "en" | "th";
  borderless?: boolean;
}

// Custom hook for smooth pointer-tracking isometric tilt
function useIsometricTilt(intensity = 1) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [coords, setCoords] = React.useState({
    tiltX: 0,
    tiltY: 0,
    normX: 0.5,
    normY: 0.5,
    isHovered: false,
  });

  const handlePointerMove = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const normX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const normY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
      const tiltX = (normX - 0.5) * 2; // -1 to 1
      const tiltY = (normY - 0.5) * 2; // -1 to 1

      setCoords({ tiltX, tiltY, normX, normY, isHovered: true });
    },
    []
  );

  const handlePointerEnter = React.useCallback(() => {
    setCoords((prev) => ({ ...prev, isHovered: true }));
  }, []);

  const handlePointerLeave = React.useCallback(() => {
    setCoords({
      tiltX: 0,
      tiltY: 0,
      normX: 0.5,
      normY: 0.5,
      isHovered: false,
    });
  }, []);

  // Compute 3D stage rotation angles (facing right towards user & content)
  const baseRotX = 6;
  const baseRotY = 12;
  const baseRotZ = 0;

  const rotX = baseRotX - coords.tiltY * 8 * intensity;
  const rotY = baseRotY + coords.tiltX * 10 * intensity;
  const rotZ = baseRotZ - coords.tiltX * 1.5 * intensity;

  const stageTransform = `rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) rotateZ(${rotZ.toFixed(2)}deg)`;

  return {
    containerRef,
    handlePointerMove,
    handlePointerEnter,
    handlePointerLeave,
    isHovered: coords.isHovered,
    normX: coords.normX,
    normY: coords.normY,
    stageTransform,
  };
}

// ============================================================================
// 1. ISOMETRIC UPLOAD FIGURE (HairlineUpload)
// Matches existing upload modal UI from Hero.tsx (Upload your video, drag & drop, Browse files)
// ============================================================================
export const HairlineUpload = React.forwardRef<HTMLDivElement, HairlineFigureProps>(
  ({ className, intensity = 1, theme = "dark", ...props }, ref) => {
    const {
      containerRef,
      handlePointerMove,
      handlePointerEnter,
      handlePointerLeave,
      isHovered,
      stageTransform,
    } = useIsometricTilt(intensity);

    return (
      <div
        ref={ref}
        className={cn(
          "relative w-full h-[155px] sm:h-[165px] select-none flex items-center justify-center transition-all duration-300",
          className
        )}
        style={{ perspective: "1200px" }}
        onPointerMove={handlePointerMove}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        {...props}
      >
        <div ref={containerRef} className="absolute inset-0 pointer-events-none" />

        {/* 3D Isometric Projection Stage */}
        <div
          className="relative w-[245px] sm:w-[265px] h-[148px] sm:h-[156px] transition-transform duration-300 ease-out"
          style={{
            transformStyle: "preserve-3d",
            transform: stageTransform,
          }}
        >
          {/* Floating Motion Wrapper (uses anim-float-1 when idle) */}
          <div
            className={cn(
              "w-full h-full will-change-transform [transform-style:preserve-3d] transition-transform duration-300",
              !isHovered && "anim-float-1"
            )}
          >
            {/* FLOATING CARD: Matches the existing Upload Dialog from Hero.tsx */}
            <div
              className="absolute inset-0 rounded-2xl border border-white/[0.12] bg-[#0e0c19]/95 p-2.5 sm:p-3 backdrop-blur-2xl transition-all duration-300 ease-out flex flex-col"
              style={{
                transform: `translateZ(${isHovered ? 26 : 10}px)`,
                boxShadow: isHovered
                  ? "0 25px 50px -12px rgba(0,0,0,0.9), 0 0 20px rgba(139,92,246,0.22)"
                  : "0 15px 35px -10px rgba(0,0,0,0.85), 0 0 10px rgba(139,92,246,0.08)",
              }}
            >
              {/* Dashed Dropzone Box (Expanded to full card) */}
              <div className="flex-1 w-full rounded-xl border border-dashed border-white/20 bg-white/[0.02] hover:border-purple-400/40 hover:bg-purple-500/[0.04] p-3 text-center flex flex-col items-center justify-center transition-all">
                {/* Upload arrow icon inside rounded purple square */}
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 shadow-[0_0_14px_rgba(168,85,247,0.3)] transition-transform duration-300"
                  style={{
                    transform: isHovered ? "translateY(-1.5px) scale(1.06)" : "none",
                  }}
                >
                  <Upload className="h-4 w-4" />
                </div>

                {/* Drop text */}
                <p className="mt-2 text-xs font-semibold text-white tracking-tight">
                  Drag and drop your video here
                </p>
                <p className="mt-0.5 text-[9px] text-zinc-400 font-mono">
                  MP4 • up to 50 MB
                </p>

                {/* Browse files button */}
                <button
                  type="button"
                  className="mt-2.5 rounded-lg bg-gradient-to-r from-[#8b5cf6] via-[#7c3aed] to-[#6d28d9] hover:from-[#9061f9] hover:to-[#7c3aed] border border-purple-400/40 px-3.5 py-1 text-[10px] font-semibold text-white shadow-[0_0_12px_rgba(139,92,246,0.3)] transition-all cursor-pointer hover:scale-105 active:scale-95"
                >
                  Browse files
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
HairlineUpload.displayName = "HairlineUpload";

// ============================================================================
// 2. ISOMETRIC STYLING FIGURE (HairlineStyling)
// Matches existing Styles Popover from EditorMockup.tsx (media_1792075614557_7471d200.png)
// ============================================================================
export const HairlineStyling = React.forwardRef<
  HTMLDivElement,
  HairlineFigureProps
>(({ className, intensity = 1, theme = "dark", ...props }, ref) => {
  const {
    containerRef,
    handlePointerMove,
    handlePointerEnter,
    handlePointerLeave,
    isHovered,
    stageTransform,
  } = useIsometricTilt(intensity);

  // 6 Circular highlight color swatches matching Zaizub AI editor
  const swatches = [
    { color: "#FACC15", label: "Yellow" },
    { color: "#FFFFFF", label: "White" },
    { color: "#06B6D4", label: "Cyan" },
    { color: "#EF4444", label: "Red" },
    { color: "#22C55E", label: "Green" },
    { color: "#A855F7", label: "Purple" },
  ];

  // Active swatch index controlled strictly on click (defaults to Green #22C55E)
  const [activeSwatchIndex, setActiveSwatchIndex] = React.useState(4);

  // Slider progress percentage controlled strictly on click (defaults to ~70px)
  const [sliderPercent, setSliderPercent] = React.useState(69);
  const computedFontSize = Math.round(48 + (sliderPercent / 100) * 32);

  // Handle click on size progress bar
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setSliderPercent(Math.max(15, Math.min(100, Math.round(x * 100))));
  };

  return (
    <div
      ref={ref}
      className={cn(
        "relative w-full h-[155px] sm:h-[165px] select-none flex items-center justify-center transition-all duration-300",
        className
      )}
      style={{ perspective: "1200px" }}
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      {...props}
    >
      <div ref={containerRef} className="absolute inset-0 pointer-events-none" />

      {/* 3D Isometric Projection Stage */}
      <div
        className="relative w-[245px] sm:w-[265px] h-[148px] sm:h-[156px] transition-transform duration-300 ease-out"
        style={{
          transformStyle: "preserve-3d",
          transform: stageTransform,
        }}
      >
        {/* Floating Motion Wrapper (uses anim-float-2 when idle) */}
        <div
          className={cn(
            "w-full h-full will-change-transform [transform-style:preserve-3d] transition-transform duration-300",
            !isHovered && "anim-float-2"
          )}
        >
          {/* FLOATING CARD: Styles Popover Inspector & Controls (Matching Image 2 Reference) */}
          <div
            className="absolute inset-0 rounded-2xl border border-white/[0.12] bg-[#0e0c19]/95 p-3.5 sm:p-4 backdrop-blur-2xl transition-all duration-300 ease-out flex flex-col justify-center gap-3.5"
            style={{
              transform: `translateZ(${isHovered ? 26 : 10}px)`,
              boxShadow: isHovered
                ? "0 25px 50px -12px rgba(0,0,0,0.9), 0 0 20px rgba(168,85,247,0.22)"
                : "0 15px 35px -10px rgba(0,0,0,0.85), 0 0 10px rgba(168,85,247,0.08)",
            }}
          >

            {/* Middle: Font Size Slider (Matching Image 2 Layout) */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs font-medium text-white">
                <span className="text-zinc-300 text-[10px] flex items-center gap-1.5">
                  <span className="font-bold text-purple-400 font-mono text-xs">T</span>
                  <span>Size</span>
                </span>
                <span className="tabular-nums font-semibold text-[#c4b5fd] bg-white/[0.05] border border-white/[0.08] px-1.5 py-0.5 rounded text-[10px]">
                  {computedFontSize}px
                </span>
              </div>

              {/* Size progress bar (click to adjust size) */}
              <div
                onClick={handleProgressClick}
                className="relative h-2 w-full rounded-full bg-[#1d1a2c] overflow-hidden cursor-pointer hover:bg-[#25213b] transition-colors"
                title="Click to adjust font size"
              >
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-violet-500 rounded-full transition-all duration-150 shadow-[0_0_8px_rgba(168,85,247,0.4)] pointer-events-none"
                  style={{ width: `${sliderPercent}%` }}
                />
              </div>
            </div>

            {/* Bottom: Highlight Color Swatches (Matching Image 2 Layout) */}
            <div className="flex flex-col gap-1.5 pt-2 border-t border-white/[0.06]">
              <div className="flex items-center justify-between text-xs font-medium text-white">
                <span className="text-zinc-300 text-[10px] flex items-center gap-1.5">
                  <span
                    className="h-2.5 w-2.5 rounded-full transition-colors border border-black/40"
                    style={{ backgroundColor: swatches[activeSwatchIndex].color }}
                  />
                  <span>Highlight Color</span>
                </span>
                <span className="font-mono text-[9px] text-zinc-400 bg-white/[0.05] border border-white/[0.08] px-1.5 py-0.5 rounded uppercase">
                  {swatches[activeSwatchIndex].color}
                </span>
              </div>

              <div className="flex items-center justify-between gap-1 pt-0.5">
                {swatches.map((swatch, idx) => {
                  const isActive = idx === activeSwatchIndex;
                  return (
                    <button
                      type="button"
                      key={swatch.color}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveSwatchIndex(idx);
                      }}
                      className="relative flex items-center justify-center transition-transform duration-200 cursor-pointer p-0.5 rounded-full hover:scale-110 active:scale-95"
                      style={{
                        transform: isActive ? "scale(1.2)" : "scale(1)",
                      }}
                      title={swatch.label}
                    >
                      <span
                        className="h-3.5 w-3.5 rounded-full transition-all block"
                        style={{
                          backgroundColor: swatch.color,
                          boxShadow: isActive
                            ? `0 0 10px ${swatch.color}`
                            : "none",
                          outline: isActive
                            ? "2px solid rgba(255,255,255,0.9)"
                            : "1px solid rgba(255,255,255,0.15)",
                          outlineOffset: "1px",
                        }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
      </div>
    </div>
  </div>
);
});
HairlineStyling.displayName = "HairlineStyling";

// ============================================================================
// 3. ISOMETRIC RENDER FIGURE (HairlineRender)
// Matches existing Live Playback & Render Action Button from EditorMockup.tsx
// ============================================================================
export const HairlineRender = React.forwardRef<HTMLDivElement, HairlineFigureProps>(
  ({ className, intensity = 1, theme = "dark", ...props }, ref) => {
    const {
      containerRef,
      handlePointerMove,
      handlePointerEnter,
      handlePointerLeave,
      isHovered,
      stageTransform,
    } = useIsometricTilt(intensity);

    return (
      <div
        ref={ref}
        className={cn(
          "relative w-full h-[155px] sm:h-[165px] select-none flex items-center justify-center transition-all duration-300",
          className
        )}
        style={{ perspective: "1200px" }}
        onPointerMove={handlePointerMove}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        {...props}
      >
        <div ref={containerRef} className="absolute inset-0 pointer-events-none" />

        {/* 3D Isometric Projection Stage */}
        <div
          className="relative w-[245px] sm:w-[265px] h-[148px] sm:h-[156px] transition-transform duration-300 ease-out"
          style={{
            transformStyle: "preserve-3d",
            transform: stageTransform,
          }}
        >
          {/* Floating Motion Wrapper (uses anim-float-3 when idle) */}
          <div
            className={cn(
              "w-full h-full will-change-transform [transform-style:preserve-3d] transition-transform duration-300",
              !isHovered && "anim-float-3"
            )}
          >
            {/* FLOATING CARD: Rendered Video & 1-Click Platform Channels */}
            <div
              className="absolute inset-0 rounded-2xl border border-white/[0.12] bg-[#0e0c19]/95 p-3 sm:p-3.5 backdrop-blur-2xl transition-all duration-300 ease-out flex flex-col justify-between"
              style={{
                transform: `translateZ(${isHovered ? 26 : 10}px)`,
                boxShadow: isHovered
                  ? "0 25px 50px -12px rgba(0,0,0,0.9), 0 0 20px rgba(168,85,247,0.22)"
                  : "0 15px 35px -10px rgba(0,0,0,0.85), 0 0 10px rgba(168,85,247,0.08)",
              }}
            >
              {/* Top: Rendered Clip Preview with Download / Save Button */}
              <div className="rounded-xl border border-white/[0.08] bg-[#141222]/90 p-2.5 flex items-center justify-between shadow-inner transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.25)] shrink-0">
                    <Play className="h-3.5 w-3.5 fill-emerald-300 ml-0.5" />
                  </div>
                  <div className="flex flex-col text-left min-w-0">
                    <span className="text-[11px] font-semibold text-white truncate">
                      demo_render.mp4
                    </span>
                    <span className="text-[9px] text-zinc-400 font-mono">
                      14.2 MB
                    </span>
                  </div>
                </div>

                {/* Save / Download Icon Button */}
                <button
                  type="button"
                  className="h-7 px-2.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 flex items-center gap-1 text-zinc-200 hover:text-white text-[9.5px] font-semibold transition-all cursor-pointer shrink-0"
                >
                  <Download className="h-3 w-3" />
                  <span>Save</span>
                </button>
              </div>

              {/* Bottom: Direct Post with Platform Logos (Expanded Icon Tiles) */}
              <div className="pt-2 border-t border-white/[0.06]">
                <div className="grid grid-cols-3 gap-2">
                  {/* TikTok */}
                  <button
                    type="button"
                    className="flex items-center justify-center py-2.5 sm:py-3 rounded-xl bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/25 hover:border-pink-500/40 text-pink-300 shadow-[0_0_12px_rgba(236,72,153,0.12)] transition-all cursor-pointer hover:scale-105 active:scale-95"
                    title="Share to TikTok"
                    aria-label="Share to TikTok"
                  >
                    <svg className="h-4.5 w-4.5 sm:h-5 sm:w-5 fill-current" viewBox="0 0 24 24">
                      <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.068-.102a2.895 2.895 0 0 1 2.373-4.509c.35 0 .684.062.996.175V9.406a6.34 6.34 0 0 0-.996-.079C5.972 9.327 3 12.298 3 15.961 3 19.624 5.972 22.595 9.477 22.595c3.504 0 6.476-2.971 6.476-6.634V8.583a8.163 8.163 0 0 0 4.636 1.43V6.686h-1Z" />
                    </svg>
                  </button>

                  {/* Reels */}
                  <button
                    type="button"
                    className="flex items-center justify-center py-2.5 sm:py-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/25 hover:border-purple-500/40 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.12)] transition-all cursor-pointer hover:scale-105 active:scale-95"
                    title="Share to Instagram Reels"
                    aria-label="Share to Instagram Reels"
                  >
                    <svg className="h-4.5 w-4.5 sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                    </svg>
                  </button>

                  {/* Shorts */}
                  <button
                    type="button"
                    className="flex items-center justify-center py-2.5 sm:py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 hover:border-red-500/40 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.12)] transition-all cursor-pointer hover:scale-105 active:scale-95"
                    title="Share to YouTube Shorts"
                    aria-label="Share to YouTube Shorts"
                  >
                    <svg className="h-4.5 w-4.5 sm:h-5 sm:w-5 fill-current" viewBox="0 0 24 24">
                      <path d="M17.77 10.32l-1.2-.5-1.1-.46 1.15-.55c1.52-.73 2.15-2.58 1.4-4.08-.73-1.5-2.6-2.12-4.1-1.38L6.4 7.15C5.1 7.78 4.3 9.07 4.3 10.5c0 1.45.8 2.73 2.1 3.37l1.2.5 1.1.46-1.15.55c-1.52.73-2.15 2.58-1.4 4.08.73 1.5 2.6 2.12 4.1 1.38l7.52-3.8c1.3-.63 2.1-1.92 2.1-3.35 0-1.45-.8-2.73-2.1-3.37zM10 14.65V9.35l4.5 2.65L10 14.65z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
  }
);
HairlineRender.displayName = "HairlineRender";

// ============================================================================
// 4. COMBINED 3-ROW WORKFLOW SHOWCASE COMPONENT
// ============================================================================

export interface WorkflowStepData {
  num: string;
  title: string;
  description: string;
}

const defaultWorkflowSteps: Record<"en" | "th", WorkflowStepData[]> = {
  en: [
    {
      num: "01",
      title: "UPLOAD",
      description:
        "Upload vertical 9:16 shorts, 16:9 videos, or 1:1 square clips up to 50 MB. Our AI speech-to-text engine extracts word-level timestamps and generates your editable subtitle timeline in seconds.",
    },
    {
      num: "02",
      title: "EDITING",
      description:
        "Switch between battle-tested presets like TikTok Viral, MrBeast Badge, and Karaoke Glow in one click. Fine-tune font scale, word-by-word active highlight colors, and dynamic pop animations in real time.",
    },
    {
      num: "03",
      title: "RENDER",
      description:
        "Preview your synced captions at 60 FPS with live playback scrubbing. Hit Render to burn crisp, lag-free animated subtitles directly into your MP4—ready to post straight to TikTok, Reels, and Shorts.",
    },
  ],
  th: [
    {
      num: "01",
      title: "อัปโหลด",
      description:
        "รองรับวิดีโอ 9:16, 16:9 และ 1:1 ไฟล์ MP4 ขนาดไม่เกิน 50 MB ระบบ AI สกัดเสียงพูดคมชัดระดับสตูดิโอ พร้อมล็อกไทม์สแตมป์คำต่อคำระดับมิลลิวินาทีให้ทันที",
    },
    {
      num: "02",
      title: "ปรับแต่ง",
      description:
        "เลือกพรีเซ็ตยอดฮิตอย่าง TikTok Viral, MrBeast Badge หรือ Karaoke Glow ได้ในคลิกเดียว ปรับขนาดฟอนต์ สีไฮไลต์ตามจังหวะคำพูด และเอฟเฟกต์เด้งได้อย่างอิสระ",
    },
    {
      num: "03",
      title: "เรนเดอร์",
      description:
        "พรีวิวซับพร้อมคลิปแบบ 60 FPS ลื่นไหลไม่มีสะดุด กด Render เพื่อฝังซับไตเติลคุณภาพสูง 1080p เข้ากับคลิป พร้อมนำไปโพสต์ลง TikTok, Reels และ Shorts ได้ทันที",
    },
  ],
};

export const HairlineWorkflowShowcase = React.forwardRef<
  HTMLDivElement,
  HairlineWorkflowShowcaseProps
>(({ className, intensity = 1, theme = "dark", lang = "en", borderless = false, ...props }, ref) => {
  const steps = defaultWorkflowSteps[lang] || defaultWorkflowSteps.en;

  const figures = [
    <HairlineUpload key="upload" intensity={intensity} theme={theme} />,
    <HairlineStyling key="styling" intensity={intensity} theme={theme} />,
    <HairlineRender key="render" intensity={intensity} theme={theme} />,
  ];

  return (
    <div
      ref={ref}
      className={cn("w-full flex flex-col gap-5 sm:gap-7 lg:gap-9", className)}
      {...props}
    >
      {steps.map((step, idx) => (
        <div
          key={step.num || idx}
          className="group relative py-2 sm:py-3 transition-all duration-300"
        >
          {/* 2-Column Layout: Left column fitted to card, Right description closer and expanded */}
          <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] lg:grid-cols-[295px_1fr] gap-5 sm:gap-6 lg:gap-8 items-center">
            {/* LEFT COLUMN: Interactive Isometric 3D Hairline Graphic */}
            <div className="w-full flex items-center justify-center">
              {figures[idx]}
            </div>

            {/* RIGHT COLUMN: Clean Unified Display Heading & Description */}
            <div className="flex flex-col justify-center">
              <h3 className="font-display text-2xl sm:text-3xl lg:text-[32px] font-extrabold tracking-tight text-white flex items-center gap-2.5 sm:gap-3">
                <span className="text-[#a78bfa] select-none tabular-nums">
                  {step.num}
                </span>
                <span className="text-white">
                  {step.title}
                </span>
              </h3>

              <p className="mt-2.5 text-sm sm:text-[15px] text-zinc-400 leading-relaxed max-w-xl font-normal">
                {step.description}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});
HairlineWorkflowShowcase.displayName = "HairlineWorkflowShowcase";
