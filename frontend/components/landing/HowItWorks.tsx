"use client";

import { howItWorksCopy, type Lang } from "./copy";

export default function HowItWorks({ lang = "en" }: { lang?: Lang }) {
  const t = howItWorksCopy[lang];

  return (
    <section id="how-it-works" className="border-t border-line py-24 relative overflow-hidden">
      {/* Subtle glow background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" aria-hidden />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            {t.title}
          </h2>
          <p className="mt-3 text-sm text-ink-muted sm:text-base">
            {t.subtitle}
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-8">
          {t.steps.map((s, i) => (
            <div
              key={s.n}
              className="group relative rounded-2xl border border-white/[0.04] bg-surface/30 p-7 backdrop-blur-sm transition-all duration-300 hover:border-accent/30 hover:bg-surface/60 hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 font-mono text-sm font-semibold text-accent-soft border border-accent/20 group-hover:scale-110 transition-transform">
                  {s.n}
                </span>
                <span className="text-[11px] font-medium text-ink-faint uppercase tracking-wider">
                  Step {i + 1}
                </span>
              </div>
              <h3 className="mt-5 font-display text-xl font-semibold text-ink group-hover:text-white transition-colors">
                {s.title}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-ink-muted">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
