"use client";

import * as React from "react";
import { HairlineWorkflowShowcase } from "./hairline-workflow";

export default function HairlineWorkflowDemo() {
  const [lang, setLang] = React.useState<"en" | "th">("en");

  return (
    <main className="min-h-screen bg-[#08070c] text-zinc-100 py-16 sm:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_25%,rgba(139,92,246,0.08)_0%,transparent_70%)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-5xl">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12 sm:mb-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3.5 py-1 text-xs font-medium text-zinc-400 backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
              <span className="tracking-widest uppercase text-[10px] font-semibold text-purple-300">
                INTERACTIVE 3D WORKFLOW
              </span>
            </div>

            <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              {lang === "en"
                ? "From raw clip to viral captions in 3 steps"
                : "จากคลิปดิบสู่ซับไวรัลเป๊ะใน 3 ขั้นตอน"}
            </h1>
            <p className="mt-3 text-sm sm:text-base text-zinc-400 leading-relaxed max-w-xl">
              {lang === "en"
                ? "Hover over each isometric card to inspect layered wireframes, dynamic audio waveforms, live inspector sliders, and real-time playback controls."
                : "นำเมาส์ไปชี้ที่การ์ดเพื่อดูเลเยอร์ 3D แบบ Isometric ที่ยกตัวขึ้น พร้อมแถบไทม์ไลน์และตัวควบคุมการทำงานแบบเรียลไทม์"}
            </p>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center rounded-lg border border-white/10 bg-white/[0.03] p-1 text-xs font-mono shrink-0">
            <button
              type="button"
              onClick={() => setLang("en")}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                lang === "en"
                  ? "bg-purple-600/30 text-purple-300 font-semibold border border-purple-500/40"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang("th")}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                lang === "th"
                  ? "bg-purple-600/30 text-purple-300 font-semibold border border-purple-500/40"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              TH
            </button>
          </div>
        </div>

        {/* 3-Row Interactive Isometric Showcase */}
        <HairlineWorkflowShowcase lang={lang} intensity={1} />
      </div>
    </main>
  );
}
