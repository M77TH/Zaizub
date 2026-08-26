"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type { Lang } from "./copy";
import { captionReel } from "./copy";

export default function PhoneMockup({
  lang,
  pulseKey,
  videoSrc,
  backVideoSrc,
}: {
  lang: Lang;
  pulseKey: number;
  /** Swap in a real rendered clip for the main front phone, e.g. "/demo.mp4" */
  videoSrc?: string;
  /** Swap in a real rendered clip for the secondary back phone, e.g. "/demo-back.mp4" */
  backVideoSrc?: string;
}) {
  const lines = captionReel[lang] || captionReel.en;
  const [lineIndex, setLineIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setLineIndex((i) => (i + 1) % lines.length);
    }, 2200);
    return () => clearInterval(id);
  }, [lang, pulseKey, lines.length]);

  const active = lines[lineIndex] || lines[0] || { time: "00:01", words: [] };

  return (
    <div className="relative flex min-h-[440px] w-full items-center justify-center py-6 sm:min-h-[560px] sm:py-8">
      {/* ambient glow behind the phones */}
      <div className="absolute h-[500px] w-[500px] rounded-full bg-accent/25 blur-3xl" aria-hidden />

      {/* Shared wrapper for precise centering and a separated phone composition */}
      <div
        className="relative h-[380px] w-[200px] sm:h-[480px] sm:w-[250px]"
      >
        {/* back phone — right & lower down */}
        <div
          className="absolute inset-0 z-10 translate-x-10 translate-y-4 rotate-6 animate-floatSlow rounded-[2.4rem] bg-black p-2.5 shadow-2xl ring-1 ring-purple-500/20 [scale:1] will-change-[scale,filter] transition-[filter,scale,box-shadow] duration-700 ease-in-out hover:brightness-110 hover:[scale:1.01] hover:shadow-purple-500/15 sm:translate-x-24 sm:translate-y-8 sm:rotate-6"
        >
          <div className="relative h-full w-full overflow-hidden rounded-[1.9rem] bg-gradient-to-br from-[#130b20] via-[#201032] to-[#0a0712]">
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
                <div className="absolute inset-0 animate-blobDrift bg-[radial-gradient(60%_50%_at_70%_25%,rgba(233,78,161,0.5)_0%,transparent_60%),radial-gradient(50%_40%_at_20%_75%,rgba(139,92,246,0.45)_0%,transparent_60%)] [animation-delay:-5s]" />
                <div className="absolute inset-0 bg-black/25" />
              </>
            )}

            {/* back phone status header */}
            <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-3 font-mono text-[10px] text-white/60">
              <span>00:04</span>
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-magenta" />
                AI MODE
              </span>
            </div>

            {/* back phone waveform */}
            <div className="absolute inset-x-0 bottom-24 flex h-6 items-end justify-center gap-[3px] px-10 opacity-75">
              {Array.from({ length: 18 }).map((_, i) => (
                <span
                  key={i}
                  className="w-[3px] animate-waveform rounded-full bg-magenta/60"
                  style={{
                    height: `${25 + ((i * 41) % 65)}%`,
                    animationDelay: `${(i % 5) * 0.12}s`,
                  }}
                />
              ))}
            </div>

            {/* back phone bottom caption tag */}
            <div className="absolute inset-x-0 bottom-8 flex justify-center px-4">
              <div className="rounded-lg bg-black/60 px-3.5 py-1.5 text-center font-display text-[13px] font-semibold text-white/90 backdrop-blur-md ring-1 ring-white/15">
                ✨ AI Captions
              </div>
            </div>
          </div>
        </div>

        {/* front phone — left & higher up */}
        <div
          className="absolute inset-0 z-20 -translate-x-10 -translate-y-4 -rotate-[8deg] animate-floatSlow rounded-[2.4rem] bg-black p-2.5 shadow-2xl ring-2 ring-purple-500/30 [scale:1] will-change-[scale,filter] transition-[filter,scale,box-shadow] duration-700 ease-in-out hover:brightness-110 hover:[scale:1.01] hover:shadow-purple-500/20 sm:-translate-x-24 sm:-translate-y-8 sm:-rotate-[8deg]"
        >
          <div className="relative h-full w-full overflow-hidden rounded-[1.9rem] bg-gradient-to-br from-[#1a1024] via-[#241534] to-[#0c0a12]">
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
                {/* placeholder "footage" — swap for a <video> once you have a render */}
                <div className="absolute inset-0 animate-blobDrift bg-[radial-gradient(60%_50%_at_30%_20%,rgba(139,92,246,0.55)_0%,transparent_60%),radial-gradient(50%_40%_at_75%_75%,rgba(233,78,161,0.4)_0%,transparent_60%)]" />
                <div className="absolute inset-0 bg-black/20" />
              </>
            )}

            {/* status chrome */}
            <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-3 font-mono text-[10px] text-white/70">
              <span>{active.time}</span>
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                REC
              </span>
            </div>

            {/* waveform */}
            <div className="absolute inset-x-0 bottom-24 flex h-6 items-end justify-center gap-[3px] px-10">
              {Array.from({ length: 22 }).map((_, i) => (
                <span
                  key={i}
                  className="w-[3px] animate-waveform rounded-full bg-white/40"
                  style={{
                    height: `${30 + ((i * 37) % 60)}%`,
                    animationDelay: `${(i % 6) * 0.09}s`,
                  }}
                />
              ))}
            </div>

            {/* karaoke caption */}
            <div className="absolute inset-x-0 bottom-9 flex justify-center px-5">
              <p
                key={lineIndex}
                data-active="true"
                className="caption-line flex flex-wrap justify-center gap-x-1.5 rounded-lg bg-black/50 px-3 py-1.5 text-center font-display text-[15px] font-semibold leading-tight backdrop-blur-md ring-1 ring-white/10"
                style={{ "--caption-idle": "#c9c3d6" } as CSSProperties}
              >
                {active.words.map((w, i) => (
                  <span
                    key={i}
                    className="caption-word"
                    style={{ animationDelay: `${i * 0.18}s` }}
                  >
                    {w}
                  </span>
                ))}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
