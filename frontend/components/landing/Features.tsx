"use client";

import { featuresCopy, type Lang } from "./copy";

const featureIcons: Record<string, JSX.Element> = {
  sync: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  ),
  languages: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20M2 12h20" />
    </svg>
  ),
  styles: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      <path d="M19 3v4M21 5h-4" />
    </svg>
  ),
  aspect: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M9 3v18M15 3v18" />
    </svg>
  ),
  speakers: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  brand: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m19 11-8-8-8.6 8.6a2 2 0 0 0 0 2.8l5.2 5.2c.8.8 2 .8 2.8 0L19 11Z" />
      <path d="m5 2 5 5M2 5l5 5M22 19l-3-3M19 22l-3-3" />
    </svg>
  ),
};

export default function Features({ lang = "en" }: { lang?: Lang }) {
  const t = featuresCopy[lang];

  return (
    <section id="features" className="border-t border-line bg-surface/20 py-24 relative">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="max-w-xl">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            {t.title}
          </h2>
          <p className="mt-3 text-sm text-ink-muted sm:text-base">
            {t.subtitle}
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {t.items.map((f) => (
            <div
              key={f.id}
              className="group relative rounded-2xl border border-white/[0.05] bg-bg/80 p-7 backdrop-blur-sm transition-all duration-300 hover:border-accent/40 hover:bg-surface/50 hover:shadow-[0_0_25px_rgba(139,92,246,0.12)] hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent-soft border border-accent/15 transition-transform duration-300 group-hover:scale-110 group-hover:bg-accent/20">
                  {featureIcons[f.id] || featureIcons.sync}
                </div>
                <span className="rounded-full bg-white/[0.04] px-2.5 py-0.5 text-[11px] font-medium text-ink-faint border border-white/5">
                  {f.tag}
                </span>
              </div>

              <h3 className="mt-5 font-display text-lg font-semibold text-ink group-hover:text-white transition-colors">
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
