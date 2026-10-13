"use client";

import type { Lang } from "./copy";

export default function PhoneMockup({
  videoSrc,
  backVideoSrc,
}: {
  lang?: Lang;
  pulseKey?: number;
  /** Swap in a real rendered clip for the main front phone, e.g. "/demo.mp4" */
  videoSrc?: string;
  /** Swap in a real rendered clip for the secondary back phone, e.g. "/demo-back.mp4" */
  backVideoSrc?: string;
}) {
  return (
    <div className="relative flex min-h-[320px] w-full items-center justify-center py-2 sm:min-h-[360px] lg:min-h-[380px] xl:min-h-[420px] sm:py-4">
      {/* Shared wrapper for phone compositions */}
      <div className="relative h-[290px] w-[150px] sm:h-[330px] sm:w-[170px] lg:h-[350px] lg:w-[180px] xl:h-[385px] xl:w-[200px]">
        {/* Back phone: Sleek obsidian device frame with clean blank screen */}
        <div className="group/back absolute inset-0 z-10 translate-x-8 translate-y-3 transition-transform duration-500 ease-out hover:scale-[1.01] sm:translate-x-14 sm:translate-y-6">
          <div className="h-full w-full animate-phoneIdleBack rounded-[1.85rem] bg-[#07060a] p-1 shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_16px_rgba(139,92,246,0.12)] ring-1 ring-white/10 will-change-transform transform-gpu [backface-visibility:hidden] transition-[box-shadow,ring-color] duration-500 group-hover/back:shadow-[0_24px_60px_rgba(0,0,0,0.95),0_0_22px_rgba(139,92,246,0.18)] group-hover/back:ring-purple-400/30">
            <div className="relative h-full w-full overflow-hidden rounded-[1.6rem] bg-gradient-to-b from-[#1c162b] via-[#140f20] to-[#0b0914] border border-white/[0.06]">
              {backVideoSrc || videoSrc ? (
                <video
                  className="absolute inset-0 h-full w-full object-cover opacity-90"
                  src={backVideoSrc || videoSrc}
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              ) : (
                <>
                  {/* Subtle studio glow on blank screen matching Editor Mockup */}
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_35%,rgba(139,92,246,0.14)_0%,transparent_75%)]" />
                  <div className="absolute inset-0 bg-black/20" />
                </>
              )}
            </div>
          </div>
        </div>

        {/* Front phone: Sleek obsidian device frame with clean blank screen */}
        <div className="group/front absolute inset-0 z-20 -translate-x-8 -translate-y-3 transition-transform duration-500 ease-out hover:scale-[1.01] sm:-translate-x-14 sm:-translate-y-6">
          <div className="h-full w-full animate-phoneIdleFront rounded-[1.85rem] bg-[#08070d] p-1 shadow-[0_24px_60px_rgba(0,0,0,0.95),0_0_20px_rgba(139,92,246,0.14)] ring-1 ring-white/10 will-change-transform transform-gpu [backface-visibility:hidden] transition-[box-shadow,ring-color] duration-500 group-hover/front:shadow-[0_28px_70px_rgba(0,0,0,0.98),0_0_26px_rgba(139,92,246,0.22)] group-hover/front:ring-purple-400/40">
            <div className="relative h-full w-full overflow-hidden rounded-[1.6rem] bg-gradient-to-b from-[#1e172f] via-[#151023] to-[#0c0a15] border border-white/[0.08]">
              {videoSrc ? (
                <video
                  className="absolute inset-0 h-full w-full object-cover"
                  src={videoSrc}
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              ) : (
                <>
                  {/* Subtle studio glow on blank screen matching Editor Mockup */}
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_35%,rgba(139,92,246,0.16)_0%,transparent_75%)]" />
                  <div className="absolute inset-0 bg-black/15" />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
