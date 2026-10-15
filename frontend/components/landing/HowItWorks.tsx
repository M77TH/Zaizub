"use client";

import type { Lang } from "./copy";
import { HairlineWorkflowShowcase } from "@/components/ui/hairline-workflow";

export default function HowItWorks({ lang = "en" }: { lang?: Lang }) {
  return (
    <section
      id="how-it-works"
      className="border-t border-line min-h-[calc(100svh-3.75rem)] min-h-[calc(100dvh-3.75rem)] min-h-[calc(100vh-3.75rem)] flex flex-col justify-center py-8 sm:py-10 lg:py-12 relative overflow-hidden bg-bg scroll-mt-16"
    >
      {/* Background ambient lighting matching Hero and EditorMockup */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_35%,rgba(139,92,246,0.06)_0%,rgba(124,58,237,0.02)_40%,transparent_70%)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 w-full">
        {/* 3-Row Interactive Isometric Hairline Workflow Showcase */}
        <HairlineWorkflowShowcase lang={lang} intensity={1} />
      </div>
    </section>
  );
}
