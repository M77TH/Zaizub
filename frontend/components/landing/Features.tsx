"use client";

import React from "react";
import Image from "next/image";
import { featuresCopy, type Lang } from "./copy";

interface FeatureCardProps {
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  imageWidth: number;
  imageHeight: number;
  className?: string;
  stageHeight?: string;
  priority?: boolean;
}

function FeatureCard({
  title,
  description,
  imageSrc,
  imageAlt,
  imageWidth,
  imageHeight,
  className = "",
  stageHeight = "h-[195px] sm:h-[215px] lg:h-[225px]",
  priority = false,
}: FeatureCardProps) {
  return (
    <div
      className={`group relative flex flex-col justify-between overflow-hidden rounded-[22px] border border-white/[0.08] bg-[#0b0916] transition-all duration-500 ease-out hover:-translate-y-1 hover:border-purple-400/40 hover:shadow-[0_12px_36px_-8px_rgba(139,92,246,0.22)] ${className}`}
      style={{
        background:
          "radial-gradient(85% 75% at 20% 15%, rgba(139, 92, 246, 0.14) 0%, rgba(76, 29, 149, 0.04) 55%, #0b0916 100%)",
        boxShadow:
          "inset 0 1px 0 0 rgba(255, 255, 255, 0.08), 0 16px 36px -12px rgba(0, 0, 0, 0.75)",
      }}
    >
      {/* Upper 60-65%: Volumetric 3D Isometric Visual Stage */}
      <div
        className={`relative w-full ${stageHeight} flex items-center justify-center overflow-hidden select-none`}
      >
        <div className="relative h-full w-full flex items-center justify-center transition-transform duration-500 ease-out group-hover:scale-[1.03]">
          <Image
            src={imageSrc}
            alt={imageAlt}
            width={imageWidth}
            height={imageHeight}
            className="h-full w-full object-cover object-top select-none pointer-events-none"
            priority={priority}
          />
        </div>
      </div>

      {/* Bottom Typography: Seamless flow with zero horizontal divider lines */}
      <div className="relative z-10 flex flex-col justify-start px-5 pb-5 pt-3 sm:px-6 sm:pb-6">
        <h3 className="text-[17px] sm:text-[18px] font-semibold tracking-tight text-white leading-snug antialiased transition-colors duration-300 group-hover:text-purple-200">
          {title}
        </h3>
        <p className="mt-1.5 text-[13px] sm:text-[13.5px] text-slate-400 leading-relaxed font-normal antialiased">
          {description}
        </p>
      </div>
    </div>
  );
}

export default function Features({ lang = "en" }: { lang?: Lang }) {
  const t = featuresCopy[lang] || featuresCopy.en;
  const items = t.items;

  return (
    <section
      id="features"
      className="relative border-t border-line min-h-[calc(100svh-3.75rem)] min-h-[calc(100dvh-3.75rem)] min-h-[calc(100vh-3.75rem)] flex flex-col justify-center py-10 sm:py-12 lg:py-14 bg-bg overflow-hidden text-white scroll-mt-16"
    >
      {/* Background ambient lighting matching Hero and EditorMockup */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_35%,rgba(139,92,246,0.06)_0%,rgba(124,58,237,0.02)_40%,transparent_70%)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 w-full">
        {/* Top Row: 40% / 60% Bento Split */}
        <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-12">
          {/* Card 1: Drop & Auto-Transcribe (40% width) */}
          <FeatureCard
            className="lg:col-span-5"
            stageHeight="h-[200px] sm:h-[225px] lg:h-[235px]"
            title={items[0]?.title || "Drop & Auto-Transcribe"}
            description={
              items[0]?.body ||
              "Upload MP4 up to 50 MB for instant timed caption cards."
            }
            imageSrc="/images/features/drop-and-transcribe.png"
            imageAlt={items[0]?.title || "Drop & Auto-Transcribe"}
            imageWidth={436}
            imageHeight={252}
            priority
          />

          {/* Card 2: Card-by-Card Subtitle Editor (60% width) */}
          <FeatureCard
            className="lg:col-span-7"
            stageHeight="h-[200px] sm:h-[225px] lg:h-[235px]"
            title={items[1]?.title || "Card-by-Card Subtitle Editor"}
            description={
              items[1]?.body ||
              "Numbered caption cards synchronized with live video playback."
            }
            imageSrc="/images/features/card-editor.png"
            imageAlt={items[1]?.title || "Card-by-Card Subtitle Editor"}
            imageWidth={486}
            imageHeight={255}
            priority
          />
        </div>

        {/* Bottom Row: 3 Equal Cards */}
        <div className="mt-4 sm:mt-5 grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-3">
          {/* Card 3: Viral Creator Presets */}
          <FeatureCard
            stageHeight="h-[185px] sm:h-[205px] lg:h-[215px]"
            title={items[2]?.title || "Viral Creator Presets"}
            description={
              items[2]?.body ||
              "One-click presets: TikTok Viral, MrBeast Badge, and Karaoke Glow."
            }
            imageSrc="/images/features/viral-presets.png"
            imageAlt={items[2]?.title || "Viral Creator Presets"}
            imageWidth={300}
            imageHeight={232}
          />

          {/* Card 4: 9:16, 16:9 & 1:1 Preview */}
          <FeatureCard
            stageHeight="h-[185px] sm:h-[205px] lg:h-[215px]"
            title={items[3]?.title || "9:16, 16:9 & 1:1 Preview"}
            description={
              items[3]?.body ||
              "Instant aspect switching for TikTok, Reels, Shorts, and YouTube."
            }
            imageSrc="/images/features/multi-ratio.png"
            imageAlt={items[3]?.title || "9:16, 16:9 & 1:1 Preview"}
            imageWidth={302}
            imageHeight={232}
          />

          {/* Card 5: Font Size & Highlight Colors */}
          <FeatureCard
            stageHeight="h-[185px] sm:h-[205px] lg:h-[215px]"
            title={items[4]?.title || "Font Size & Highlight Colors"}
            description={
              items[4]?.body ||
              "Quick font size slider and high-contrast signature highlight colors."
            }
            imageSrc="/images/features/styles-colors.png"
            imageAlt={items[4]?.title || "Font Size & Highlight Colors"}
            imageWidth={302}
            imageHeight={232}
          />
        </div>
      </div>
    </section>
  );
}