"use client";

import PhoneMockup from "./PhoneMockup";
import type { Lang } from "./copy";

const copy = {
  en: {
    eyebrow: "See it in action",
    heading: "Captions that look as good as your content",
    body: "Watch the AI generate word-by-word karaoke-style captions in real time - styled, synced, and ready to post.",
    pill1: "Word-by-word sync",
    pill2: "Viral styles",
    pill3: "Auto-detect language",
  },
  th: {
    eyebrow: "See it in action",
    heading: "Captions that look as good as your content",
    body: "Watch the AI generate word-by-word karaoke-style captions in real time - styled, synced, and ready to post.",
    pill1: "Word-by-word sync",
    pill2: "Viral styles",
    pill3: "Auto-detect language",
  },
} satisfies Record<Lang, { eyebrow: string; heading: string; body: string; pill1: string; pill2: string; pill3: string }>;

export default function PhoneShowcase({ lang = "en" }: { lang?: Lang }) {
  const t = copy[lang];

  return (
    <section className="border-t border-line py-24 relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(55% 60% at 60% 50%, rgba(109,40,217,0.14) 0%, transparent 70%), radial-gradient(35% 40% at 20% 30%, rgba(139,92,246,0.08) 0%, transparent 60%)",
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3.5 py-1 text-xs font-medium text-violet-300">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" aria-hidden />
              {t.eyebrow}
            </span>

            <h2 className="mt-5 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              {t.heading}
            </h2>

            <p className="mt-4 text-sm leading-relaxed text-ink-muted sm:text-base max-w-md">
              {t.body}
            </p>

            <div className="mt-8 flex flex-wrap gap-2.5">
              {[t.pill1, t.pill2, t.pill3].map((pill) => (
                <span
                  key={pill}
                  className="flex items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-1.5 text-xs text-ink-muted"
                >
                  <svg className="h-3.5 w-3.5 text-violet-400 flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {pill}
                </span>
              ))}
            </div>
          </div>

          <div className="order-1 lg:order-2 flex justify-center">
            <PhoneMockup lang={lang} pulseKey={0} />
          </div>
        </div>
      </div>
    </section>
  );
}