"use client";

import { pricingCopy, type Lang } from "./copy";

export default function Pricing({ lang = "en" }: { lang?: Lang }) {
  const t = pricingCopy[lang];

  return (
    <section id="pricing" className="border-t border-line py-24 relative overflow-hidden">
      <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
        <div className="max-w-xl">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            {t.title}
          </h2>
          <p className="mt-3 text-sm text-ink-muted sm:text-base">
            {t.subtitle}
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-3 items-stretch">
          {t.tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative flex flex-col justify-between rounded-3xl border p-8 transition-all duration-300 ${
                tier.highlighted
                  ? "border-violet-500/40 bg-gradient-to-b from-violet-900/30 via-surface/80 to-surface shadow-[0_0_40px_rgba(109,40,217,0.22)] scale-[1.02] lg:-translate-y-1"
                  : "border-white/[0.06] bg-surface/40 hover:border-white/15"
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-violet-500 to-purple-700 px-3.5 py-1 text-xs font-semibold text-white shadow-lg shadow-purple-900/40">
                  {t.mostPopular}
                </div>
              )}

              <div>
                <h3 className="font-display text-xl font-semibold text-ink">{tier.name}</h3>
                <p className="mt-1.5 text-xs text-ink-muted">{tier.tagline}</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-bold tracking-tight text-ink">
                    {tier.price}
                  </span>
                  {tier.period && (
                    <span className="text-sm font-normal text-ink-muted">{tier.period}</span>
                  )}
                </div>

                <hr className="border-white/5 my-6" />

                <ul className="space-y-3.5">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-ink-muted">
                      <svg className="mt-0.5 h-4 w-4 flex-none text-accent-soft" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 pt-4">
                <a
                  href="#top"
                  className={`focus-ring block w-full rounded-xl py-3 text-center text-sm font-medium transition-all ${
                    tier.highlighted
                      ? "bg-gradient-to-b from-violet-500 to-purple-700 text-white shadow-[0_0_20px_rgba(109,40,217,0.45)] hover:brightness-110 hover:scale-[1.02]"
                      : "border border-white/10 bg-white/[0.03] text-ink hover:bg-white/10 hover:border-white/20"
                  }`}
                >
                  {tier.cta}
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
