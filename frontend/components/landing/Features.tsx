"use client";

import React from "react";
import { featuresCopy, type Lang } from "./copy";

// Corner brackets matching the isometric wireframe reference
function CornerBrackets({ color = "border-violet-400/40" }: { color?: string }) {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className={`absolute -top-1 -left-1 h-2 w-2 border-t border-l ${color}`} />
      <div className={`absolute -top-1 -right-1 h-2 w-2 border-t border-r ${color}`} />
      <div className={`absolute -bottom-1 -left-1 h-2 w-2 border-b border-l ${color}`} />
      <div className={`absolute -bottom-1 -right-1 h-2 w-2 border-b border-r ${color}`} />
    </div>
  );
}

// Consistent isometric perspective transform across cards
const ISO_PLANE = "rotateX(52deg) rotateZ(-28deg)";

export default function Features({ lang = "en" }: { lang?: Lang }) {
  const t = featuresCopy[lang];

  const uploadItem = t.items.find((i) => i.id === "upload") || t.items[0];
  const transcriptItem = t.items.find((i) => i.id === "transcript") || t.items[1];
  const templatesItem = t.items.find((i) => i.id === "templates") || t.items[2];
  const aspectItem = t.items.find((i) => i.id === "aspect") || t.items[3];
  const stylesItem = t.items.find((i) => i.id === "styles") || t.items[4];

  return (
    <section
      id="features"
      className="relative border-t border-white/[0.08] bg-[#07060a] pt-8 sm:pt-12 lg:pt-14 pb-20 sm:pb-28 lg:pb-36 scroll-mt-16 overflow-hidden"
    >
      {/* Background ambient lighting */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(139,92,246,0.07)_0%,transparent_70%)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Bento Grid: 2 Top Cards (40% / 60%), 3 Bottom Cards (33% / 33% / 33%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 lg:gap-4.5">
          {/* ======================================================== */}
          {/* Card 1 (Top Left): 3D Video Upload Plane (5 cols)        */}
          {/* ======================================================== */}
          <div className="group relative rounded-2xl border border-white/[0.08] bg-[#0e0c19]/75 p-4 sm:p-5 backdrop-blur-md transition-all duration-300 hover:border-violet-500/35 hover:shadow-[0_0_30px_rgba(139,92,246,0.12)] flex flex-col justify-between lg:col-span-5 overflow-hidden">
            {/* Ambient inner glow */}
            <div className="pointer-events-none absolute -top-12 -left-12 h-36 w-36 rounded-full bg-violet-600/10 blur-2xl group-hover:bg-violet-600/20 transition-all duration-500" />

            {/* Compact 3D Isometric Viewport */}
            <div className="relative h-36 sm:h-40 w-full flex items-center justify-center [perspective:900px] overflow-hidden select-none">
              <div
                className="relative flex items-center justify-center [transform-style:preserve-3d] transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                style={{ transform: ISO_PLANE }}
              >
                {/* 1. Floor Base Wireframe Plane */}
                <div className="relative w-44 h-28 rounded-xl border border-white/10 bg-[#0c0a18]/70 shadow-[0_16px_35px_rgba(0,0,0,0.9)] backdrop-blur-xs">
                  <CornerBrackets color="border-violet-400/50" />
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_70%_at_50%_50%,rgba(139,92,246,0.15)_0%,transparent_80%)]" />
                </div>

                {/* 2. Floor Reflection / Shadow Layer */}
                <div className="absolute w-36 h-20 rounded-lg bg-violet-500/10 blur-lg translate-y-2 pointer-events-none" />

                {/* 3. Floating 3D Upload Card Layer */}
                <div className="absolute w-40 rounded-lg border border-dashed border-violet-500/50 bg-[#120f24]/95 p-2.5 shadow-[0_12px_24px_rgba(0,0,0,0.9),0_0_16px_rgba(139,92,246,0.2)] backdrop-blur-md transition-all duration-500 ease-out -translate-y-3.5 group-hover:-translate-y-6">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-violet-500/20 text-violet-300 border border-violet-500/40">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-white block leading-tight">
                        {lang === "th" ? "เลือกวิดีโอเพื่อใส่ซับ" : "Select video to caption"}
                      </span>
                      <span className="text-[8.5px] font-mono text-zinc-400 block mt-0.5">
                        MP4 · up to 50 MB
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. Floating 3D Status Pill */}
                <div className="absolute -top-4 -right-1 rounded-full border border-violet-400/40 bg-[#1a1532]/95 px-2 py-0.5 text-[8px] font-mono text-violet-200 shadow-md flex items-center gap-1 transition-all duration-500 ease-out -translate-y-5 group-hover:-translate-y-8">
                  <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Auto-Transcribe</span>
                </div>
              </div>
            </div>

            {/* Typography (Compact: No tag badge, clean title + 1 line body) */}
            <div className="mt-2.5 pt-3 border-t border-white/[0.06]">
              <h3 className="font-display text-base sm:text-lg font-semibold tracking-tight text-white group-hover:text-violet-200 transition-colors">
                {uploadItem.title}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                {uploadItem.body}
              </p>
            </div>
          </div>

          {/* ======================================================== */}
          {/* Card 2 (Top Right): 3D Exploded Subtitle Stack (7 cols)  */}
          {/* ======================================================== */}
          <div className="group relative rounded-2xl border border-white/[0.08] bg-[#0e0c19]/75 p-4 sm:p-5 backdrop-blur-md transition-all duration-300 hover:border-violet-500/35 hover:shadow-[0_0_30px_rgba(139,92,246,0.12)] flex flex-col justify-between lg:col-span-7 overflow-hidden">
            {/* Ambient glow */}
            <div className="pointer-events-none absolute -top-12 -right-12 h-44 w-44 rounded-full bg-violet-500/10 blur-2xl group-hover:bg-violet-500/20 transition-all duration-500" />

            {/* Compact 3D Isometric Viewport */}
            <div className="relative h-36 sm:h-40 w-full flex items-center justify-center [perspective:900px] overflow-hidden select-none">
              <div
                className="relative flex items-center justify-center [transform-style:preserve-3d] transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                style={{ transform: ISO_PLANE }}
              >
                {/* 1. Floor Base Wireframe */}
                <div className="relative w-64 sm:w-76 h-28 rounded-xl border border-white/10 bg-[#0c0a18]/70 shadow-[0_16px_35px_rgba(0,0,0,0.9)] backdrop-blur-xs">
                  <CornerBrackets color="border-violet-400/50" />
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_70%_at_50%_50%,rgba(139,92,246,0.14)_0%,transparent_80%)]" />
                </div>

                {/* 2. Subtitle Layer 1 (Base Layer) */}
                <div className="absolute w-56 sm:w-64 rounded-lg border border-white/[0.06] bg-[#100e1f]/90 px-3 py-1.5 shadow-sm -translate-y-1 translate-x-1.5 transition-all duration-500 ease-out group-hover:-translate-y-2.5">
                  <div className="flex items-center justify-between text-[8px] font-mono text-zinc-500">
                    <span>#1</span>
                    <span>0:01</span>
                  </div>
                  <span className="text-[9.5px] text-zinc-400 font-medium block truncate mt-0.5">
                    {lang === "th" ? "อย่าเพิ่งเลื่อนผ่านคลิปนี้เด็ดขาด!" : "Stop scrolling right now!"}
                  </span>
                </div>

                {/* 3. Subtitle Layer 2 (Hero Active Card) */}
                <div className="absolute w-60 sm:w-68 rounded-lg border-2 border-violet-400/80 bg-[#16122c]/95 px-3 py-1.5 shadow-[0_12px_28px_rgba(0,0,0,0.9),0_0_20px_rgba(139,92,246,0.25)] backdrop-blur-md transition-all duration-500 ease-out -translate-y-5 -translate-x-1 group-hover:-translate-y-8">
                  <div className="flex items-center justify-between text-[8.5px] font-mono text-violet-300">
                    <span className="font-bold">#2 • Playing</span>
                    <span>0:03</span>
                  </div>
                  <div className="text-[10px] text-white font-medium mt-0.5 truncate">
                    {lang === "th" ? "ครีเอเตอร์ " : "Top creators are "}
                    <span className="rounded bg-yellow-400/20 px-1 py-0.2 font-bold text-yellow-300 border border-yellow-400/40">
                      {lang === "th" ? "แอบใช้เทคนิคนี้" : "hiding this 1 secret"}
                    </span>
                  </div>
                </div>

                {/* 4. Floating 3D "Live Playback" Pill */}
                <div className="absolute -top-5 -left-4 rounded-full border border-violet-400/40 bg-[#1a1436]/95 px-2.5 py-1 shadow-md flex items-center gap-1.5 transition-all duration-500 ease-out -translate-y-7 group-hover:-translate-y-11">
                  <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-violet-600 text-white text-[7px]">
                    ⏸
                  </span>
                  <span className="text-[8.5px] font-mono text-white font-semibold">
                    Live Playback 0:07 / 0:10
                  </span>
                  <div className="w-10 h-1 rounded-full bg-white/20 overflow-hidden">
                    <div className="w-3/4 h-full bg-gradient-to-r from-violet-400 to-emerald-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Typography */}
            <div className="mt-2.5 pt-3 border-t border-white/[0.06]">
              <h3 className="font-display text-base sm:text-lg font-semibold tracking-tight text-white group-hover:text-violet-200 transition-colors">
                {transcriptItem.title}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                {transcriptItem.body}
              </p>
            </div>
          </div>

          {/* ======================================================== */}
          {/* Card 3 (Bottom Left): 3D Template Slabs Stack (4 cols)   */}
          {/* ======================================================== */}
          <div className="group relative rounded-2xl border border-white/[0.08] bg-[#0e0c19]/75 p-4 sm:p-5 backdrop-blur-md transition-all duration-300 hover:border-violet-500/35 hover:shadow-[0_0_30px_rgba(139,92,246,0.12)] flex flex-col justify-between sm:col-span-6 lg:col-span-4 overflow-hidden">
            {/* Compact 3D Isometric Viewport */}
            <div className="relative h-28 sm:h-32 w-full flex items-center justify-center [perspective:900px] overflow-hidden select-none">
              <div
                className="relative flex items-center justify-center [transform-style:preserve-3d] transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                style={{ transform: ISO_PLANE }}
              >
                {/* 1. Floor Base Wireframe */}
                <div className="relative w-38 h-26 rounded-xl border border-white/10 bg-[#0c0a18]/70 shadow-lg">
                  <CornerBrackets color="border-violet-400/50" />
                </div>

                {/* 2. Template Slab 1: MrBeast Badge */}
                <div className="absolute w-34 rounded-lg border border-white/[0.06] bg-[#100e20]/90 p-2 shadow-sm -translate-y-1 transition-all duration-500 ease-out group-hover:-translate-y-2">
                  <span className="text-[8px] font-medium text-zinc-400 block leading-tight">MrBeast Badge</span>
                  <span className="inline-block rounded bg-emerald-500 px-1 py-0.2 text-[8px] font-bold text-black mt-0.5">
                    The secret
                  </span>
                </div>

                {/* 3. Template Slab 2: Karaoke Glow */}
                <div className="absolute w-34 rounded-lg border border-white/[0.08] bg-[#141026]/95 p-2 shadow-md -translate-y-3.5 transition-all duration-500 ease-out group-hover:-translate-y-5.5">
                  <span className="text-[8px] font-medium text-zinc-300 block leading-tight">Karaoke Glow</span>
                  <span className="text-[8.5px] font-bold text-[#22d3ee] drop-shadow-[0_0_6px_#22d3ee] block mt-0.5">
                    Sing every word
                  </span>
                </div>

                {/* 4. Template Slab 3: TikTok Viral */}
                <div className="absolute w-36 rounded-lg border-2 border-violet-400/80 bg-[#1a1434]/98 p-2 shadow-[0_10px_22px_rgba(0,0,0,0.9),0_0_15px_rgba(139,92,246,0.25)] -translate-y-6 transition-all duration-500 ease-out group-hover:-translate-y-9">
                  <div className="flex items-center justify-between text-[8px] font-semibold text-white">
                    <span>TikTok Viral</span>
                    <span className="flex h-3 w-3 items-center justify-center rounded-full bg-violet-500 text-[7px] text-white">✓</span>
                  </div>
                  <span className="font-bold text-[10px] text-[#facc15] block mt-0.5">
                    How <span className="underline">to</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Typography */}
            <div className="mt-2.5 pt-3 border-t border-white/[0.06]">
              <h3 className="font-display text-sm sm:text-base font-semibold tracking-tight text-white group-hover:text-violet-200 transition-colors">
                {templatesItem.title}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                {templatesItem.body}
              </p>
            </div>
          </div>

          {/* ======================================================== */}
          {/* Card 4 (Bottom Center): 3D Phone & Multi-Ratio (4 cols)  */}
          {/* ======================================================== */}
          <div className="group relative rounded-2xl border border-white/[0.08] bg-[#0e0c19]/75 p-4 sm:p-5 backdrop-blur-md transition-all duration-300 hover:border-violet-500/35 hover:shadow-[0_0_30px_rgba(139,92,246,0.12)] flex flex-col justify-between sm:col-span-6 lg:col-span-4 overflow-hidden">
            {/* Compact 3D Isometric Viewport */}
            <div className="relative h-28 sm:h-32 w-full flex items-center justify-center [perspective:900px] overflow-hidden select-none">
              <div
                className="relative flex items-center justify-center [transform-style:preserve-3d] transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                style={{ transform: ISO_PLANE }}
              >
                {/* 1. Floor Base Wireframe */}
                <div className="relative w-38 h-26 rounded-xl border border-white/10 bg-[#0c0a18]/70 shadow-lg">
                  <CornerBrackets color="border-violet-400/50" />
                </div>

                {/* 2. 3D Smartphone */}
                <div className="absolute w-20 h-26 rounded-xl border border-white/25 bg-gradient-to-b from-[#1f1932] to-[#0c0a16] shadow-[0_10px_20px_rgba(0,0,0,0.9),0_0_12px_rgba(139,92,246,0.2)] p-1 flex flex-col justify-between -translate-y-3 transition-all duration-500 ease-out group-hover:-translate-y-5.5">
                  <div className="w-6 h-0.5 rounded-full bg-white/25 mx-auto" />
                  <div className="rounded border border-dashed border-violet-400/80 bg-violet-500/15 p-0.8 text-center my-auto">
                    <span className="text-[6.5px] font-mono text-violet-300 font-bold block">SAFE ZONE</span>
                    <span className="text-[7px] font-bold text-white block">9:16</span>
                  </div>
                  <div className="flex flex-col gap-0.5 opacity-40 px-0.5">
                    <span className="w-4 h-0.5 rounded bg-zinc-400" />
                  </div>
                </div>

                {/* 3. Floating 3D Ratio Pills */}
                <div className="absolute -top-5 rounded-md border border-white/15 bg-[#141026]/95 px-1 py-0.5 shadow-md flex items-center gap-0.5 font-mono text-[7px] -translate-y-5 transition-all duration-500 ease-out group-hover:-translate-y-8">
                  <span className="rounded bg-violet-600 px-1 py-0.2 font-bold text-white">9:16</span>
                  <span className="px-0.8 text-zinc-400">16:9</span>
                  <span className="px-0.8 text-zinc-400">1:1</span>
                </div>

                {/* 4. Floating Render Button Badge */}
                <div className="absolute -bottom-4 rounded-full bg-violet-600 px-2 py-0.5 text-[7.5px] font-semibold text-white shadow-sm -translate-y-5 transition-all duration-500 ease-out group-hover:-translate-y-7.5">
                  ▶ Render
                </div>
              </div>
            </div>

            {/* Typography */}
            <div className="mt-2.5 pt-3 border-t border-white/[0.06]">
              <h3 className="font-display text-sm sm:text-base font-semibold tracking-tight text-white group-hover:text-violet-200 transition-colors">
                {aspectItem.title}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                {aspectItem.body}
              </p>
            </div>
          </div>

          {/* ======================================================== */}
          {/* Card 5 (Bottom Right): 3D Styles Inspector (4 cols)      */}
          {/* ======================================================== */}
          <div className="group relative rounded-2xl border border-white/[0.08] bg-[#0e0c19]/75 p-4 sm:p-5 backdrop-blur-md transition-all duration-300 hover:border-violet-500/35 hover:shadow-[0_0_30px_rgba(139,92,246,0.12)] flex flex-col justify-between sm:col-span-12 lg:col-span-4 overflow-hidden">
            {/* Compact 3D Isometric Viewport */}
            <div className="relative h-28 sm:h-32 w-full flex items-center justify-center [perspective:900px] overflow-hidden select-none">
              <div
                className="relative flex items-center justify-center [transform-style:preserve-3d] transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                style={{ transform: ISO_PLANE }}
              >
                {/* 1. Floor Base with Concentric Rings */}
                <div className="relative w-38 h-26 rounded-xl border border-white/10 bg-[#0c0a18]/70 shadow-lg flex items-center justify-center">
                  <CornerBrackets color="border-violet-400/50" />
                  <div className="w-22 h-14 rounded-full border border-violet-500/20" />
                  <div className="w-12 h-8 rounded-full border border-violet-500/30 absolute" />
                </div>

                {/* 2. Floating 3D Styles Card */}
                <div className="absolute w-36 rounded-lg border border-white/15 bg-[#16122e]/98 p-2.5 shadow-[0_12px_24px_rgba(0,0,0,0.95),0_0_15px_rgba(139,92,246,0.2)] backdrop-blur-md -translate-y-4 transition-all duration-500 ease-out group-hover:-translate-y-8">
                  <div className="flex items-center gap-1 text-white font-semibold text-[9px] border-b border-white/[0.08] pb-1">
                    <svg className="w-2.5 h-2.5 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                    <span>Styles</span>
                  </div>

                  {/* Size Slider row */}
                  <div className="flex items-center justify-between gap-1 my-1.5">
                    <span className="text-[8px] font-medium text-zinc-300">T Size</span>
                    <div className="flex-1 h-0.5 rounded-full bg-white/15 relative mx-1">
                      <div className="w-3/5 h-full rounded-full bg-violet-500" />
                      <div className="absolute top-1/2 -translate-y-1/2 left-[60%] -translate-x-1/2 w-2 h-2 rounded-full bg-violet-400 shadow-sm border border-white" />
                    </div>
                    <span className="text-[7.5px] font-mono text-zinc-400 bg-white/[0.06] px-1 py-0.2 rounded">
                      64px
                    </span>
                  </div>

                  {/* Color dots row */}
                  <div className="flex items-center justify-between pt-1 border-t border-white/[0.06]">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#facc15] ring-1.5 ring-violet-400 ring-offset-0.5 ring-offset-[#16122e]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-white border border-white/20" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#22d3ee] border border-white/20" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ef4444] border border-white/20" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#22c55e] border border-white/20" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ec4899] border border-white/20" />
                  </div>
                </div>
              </div>
            </div>

            {/* Typography */}
            <div className="mt-2.5 pt-3 border-t border-white/[0.06]">
              <h3 className="font-display text-sm sm:text-base font-semibold tracking-tight text-white group-hover:text-violet-200 transition-colors">
                {stylesItem.title}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                {stylesItem.body}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
