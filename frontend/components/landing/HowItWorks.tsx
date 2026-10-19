"use client";

import * as React from "react";
import { Upload, Play, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { howItWorksCopy, type Lang } from "./copy";

// ============================================================================
// TYPES & HOOKS
// ============================================================================

export interface WorkflowFigureProps
  extends React.ComponentPropsWithoutRef<"div"> {
  intensity?: number;
}

// Custom hook for stable isometric perspective with smooth hover zoom (calm, no pointer tracking)
function useIsometricTilt(intensity = 1) {
  const [isHovered, setIsHovered] = React.useState(false);

  const handlePointerEnter = React.useCallback(() => {
    setIsHovered(true);
  }, []);

  const handlePointerLeave = React.useCallback(() => {
    setIsHovered(false);
  }, []);

  // Stable, calm isometric base angles
  const baseRotX = 5.5;
  const baseRotY = 11;

  // On hover: subtle scale zoom (1.04x)
  const zoom = isHovered ? 1.04 : 1;
  const stageTransform = `rotateX(${baseRotX}deg) rotateY(${baseRotY}deg) scale(${zoom})`;

  return {
    handlePointerEnter,
    handlePointerLeave,
    isHovered,
    stageTransform,
  };
}

// ============================================================================
// 1. ISOMETRIC UPLOAD FIGURE (WorkflowUploadFigure)
// ============================================================================
export const WorkflowUploadFigure = React.forwardRef<HTMLDivElement, WorkflowFigureProps>(
  ({ className, intensity = 1, ...props }, ref) => {
    const { handlePointerEnter, handlePointerLeave, isHovered, stageTransform } =
      useIsometricTilt(intensity);

    return (
      <div
        ref={ref}
        className={cn(
          "relative w-full h-[155px] sm:h-[165px] select-none flex items-center justify-center transition-all duration-300",
          className
        )}
        style={{ perspective: "1200px" }}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        {...props}
      >
        <div
          className="relative w-[245px] sm:w-[265px] h-[148px] sm:h-[156px] transition-transform duration-300 ease-out"
          style={{
            transformStyle: "preserve-3d",
            transform: stageTransform,
          }}
        >
          <div
            className={cn(
              "w-full h-full will-change-transform [transform-style:preserve-3d] transition-transform duration-300",
              !isHovered && "anim-workflow-float-1"
            )}
          >
            <div
              className={cn(
                "absolute inset-0 rounded-2xl border bg-[#0e0c19]/95 p-2.5 sm:p-3 backdrop-blur-sm transform-gpu [backface-visibility:hidden] transition-all duration-300 ease-out flex flex-col",
                isHovered ? "border-purple-400/30" : "border-white/[0.12]"
              )}
              style={{
                transform: `translateZ(${isHovered ? 16 : 8}px)`,
                boxShadow: isHovered
                  ? "0 22px 45px -10px rgba(0,0,0,0.9), 0 0 22px rgba(139,92,246,0.24)"
                  : "0 15px 35px -10px rgba(0,0,0,0.85), 0 0 10px rgba(139,92,246,0.08)",
              }}
            >
              <div className="flex-1 w-full rounded-xl border border-dashed border-white/20 bg-white/[0.02] hover:border-purple-400/40 hover:bg-purple-500/[0.04] p-3 text-center flex flex-col items-center justify-center transition-all">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 shadow-[0_0_14px_rgba(168,85,247,0.3)] transition-transform duration-300"
                  style={{
                    transform: isHovered ? "translateY(-1.5px) scale(1.06)" : "none",
                  }}
                >
                  <Upload className="h-4 w-4" />
                </div>

                <p className="mt-2 text-xs font-semibold text-white tracking-tight">
                  Drag and drop your video here
                </p>
                <p className="mt-0.5 text-[9px] text-zinc-400 font-mono">
                  MP4 • up to 50 MB
                </p>

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
WorkflowUploadFigure.displayName = "WorkflowUploadFigure";

// ============================================================================
// 2. ISOMETRIC STYLING FIGURE (WorkflowStylingFigure)
// ============================================================================
export const WorkflowStylingFigure = React.forwardRef<HTMLDivElement, WorkflowFigureProps>(
  ({ className, intensity = 1, ...props }, ref) => {
    const { handlePointerEnter, handlePointerLeave, isHovered, stageTransform } =
      useIsometricTilt(intensity);

    const swatches = [
      { color: "#FACC15", label: "Yellow" },
      { color: "#FFFFFF", label: "White" },
      { color: "#06B6D4", label: "Cyan" },
      { color: "#EF4444", label: "Red" },
      { color: "#22C55E", label: "Green" },
      { color: "#A855F7", label: "Purple" },
    ];

    const [activeSwatchIndex, setActiveSwatchIndex] = React.useState(4);
    const [sliderPercent, setSliderPercent] = React.useState(69);
    const computedFontSize = Math.round(48 + (sliderPercent / 100) * 32);

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
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        {...props}
      >
        <div
          className="relative w-[245px] sm:w-[265px] h-[148px] sm:h-[156px] transition-transform duration-300 ease-out"
          style={{
            transformStyle: "preserve-3d",
            transform: stageTransform,
          }}
        >
          <div
            className={cn(
              "w-full h-full will-change-transform [transform-style:preserve-3d] transition-transform duration-300",
              !isHovered && "anim-workflow-float-2"
            )}
          >
            <div
              className={cn(
                "absolute inset-0 rounded-2xl border bg-[#0e0c19]/95 p-3.5 sm:p-4 backdrop-blur-sm transform-gpu [backface-visibility:hidden] transition-all duration-300 ease-out flex flex-col justify-center gap-3.5",
                isHovered ? "border-purple-400/30" : "border-white/[0.12]"
              )}
              style={{
                transform: `translateZ(${isHovered ? 16 : 8}px)`,
                boxShadow: isHovered
                  ? "0 22px 45px -10px rgba(0,0,0,0.9), 0 0 22px rgba(168,85,247,0.22)"
                  : "0 15px 35px -10px rgba(0,0,0,0.85), 0 0 10px rgba(168,85,247,0.08)",
              }}
            >
              {/* Font Size Slider */}
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

              {/* Highlight Color Swatches */}
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
  }
);
WorkflowStylingFigure.displayName = "WorkflowStylingFigure";

// ============================================================================
// 3. ISOMETRIC RENDER FIGURE (WorkflowRenderFigure)
// ============================================================================
export const WorkflowRenderFigure = React.forwardRef<HTMLDivElement, WorkflowFigureProps>(
  ({ className, intensity = 1, ...props }, ref) => {
    const { handlePointerEnter, handlePointerLeave, isHovered, stageTransform } =
      useIsometricTilt(intensity);

    return (
      <div
        ref={ref}
        className={cn(
          "relative w-full h-[155px] sm:h-[165px] select-none flex items-center justify-center transition-all duration-300",
          className
        )}
        style={{ perspective: "1200px" }}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        {...props}
      >
        <div
          className="relative w-[245px] sm:w-[265px] h-[148px] sm:h-[156px] transition-transform duration-300 ease-out"
          style={{
            transformStyle: "preserve-3d",
            transform: stageTransform,
          }}
        >
          <div
            className={cn(
              "w-full h-full will-change-transform [transform-style:preserve-3d] transition-transform duration-300",
              !isHovered && "anim-workflow-float-3"
            )}
          >
            <div
              className={cn(
                "absolute inset-0 rounded-2xl border bg-[#0e0c19]/95 p-3 sm:p-3.5 backdrop-blur-sm transform-gpu [backface-visibility:hidden] transition-all duration-300 ease-out flex flex-col justify-between",
                isHovered ? "border-purple-400/30" : "border-white/[0.12]"
              )}
              style={{
                transform: `translateZ(${isHovered ? 16 : 8}px)`,
                boxShadow: isHovered
                  ? "0 22px 45px -10px rgba(0,0,0,0.9), 0 0 22px rgba(168,85,247,0.22)"
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

                <button
                  type="button"
                  className="h-7 px-2.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 flex items-center gap-1 text-zinc-200 hover:text-white text-[9.5px] font-semibold transition-all cursor-pointer shrink-0"
                >
                  <Download className="h-3 w-3" />
                  <span>Save</span>
                </button>
              </div>

              {/* Bottom: Direct Post with Platform Logos */}
              <div className="pt-2 border-t border-white/[0.06]">
                <div className="grid grid-cols-3 gap-2">
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
WorkflowRenderFigure.displayName = "WorkflowRenderFigure";

// ============================================================================
// MAIN HOW IT WORKS SECTION
// ============================================================================
export default function HowItWorks({ lang = "en" }: { lang?: Lang }) {
  const t = howItWorksCopy[lang] || howItWorksCopy.en;
  const steps = t.steps;

  const figures = [
    <WorkflowUploadFigure key="upload" intensity={1} />,
    <WorkflowStylingFigure key="styling" intensity={1} />,
    <WorkflowRenderFigure key="render" intensity={1} />,
  ];

  return (
    <section
      id="how-it-works"
      className="min-h-[calc(100svh-3.75rem)] min-h-[calc(100dvh-3.75rem)] min-h-[calc(100vh-3.75rem)] flex flex-col justify-center py-8 sm:py-10 lg:py-12 relative overflow-hidden bg-bg scroll-mt-16"
    >
      {/* Background ambient lighting matching Hero and EditorMockup */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_35%,rgba(139,92,246,0.06)_0%,rgba(124,58,237,0.02)_40%,transparent_70%)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 w-full">
        <div className="w-full flex flex-col gap-5 sm:gap-7 lg:gap-9">
          {steps.map((step, idx) => (
            <div
              key={step.num || idx}
              className="group relative py-2 sm:py-3 transition-all duration-300"
            >
              {/* 2-Column Layout: Left column fitted to card, Right description closer and expanded */}
              <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] lg:grid-cols-[295px_1fr] gap-5 sm:gap-6 lg:gap-8 items-center">
                {/* LEFT COLUMN: Interactive Isometric 3D Figure */}
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
      </div>
    </section>
  );
}
