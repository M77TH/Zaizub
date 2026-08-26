"use client";

import { footerCopy, type Lang } from "./copy";

export default function Footer({ lang = "en" }: { lang?: Lang }) {
  const t = footerCopy[lang];

  return (
    <footer className="border-t border-line py-12 bg-bg relative">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 sm:flex-row lg:px-10">
        <div className="flex items-center gap-2">
          <span className="font-display text-base font-semibold text-ink">Zaizub</span>
          <span className="text-xs text-ink-faint">•</span>
          <p className="text-xs text-ink-muted">
            © {new Date().getFullYear()} {t.tagline}
          </p>
        </div>

        <nav aria-label="Footer Navigation" className="flex items-center gap-6 text-xs text-ink-muted">
          <a
            href="#top"
            className="hover:text-ink transition-colors focus-ring rounded"
          >
            {t.privacy}
          </a>
          <a
            href="#top"
            className="hover:text-ink transition-colors focus-ring rounded"
          >
            {t.terms}
          </a>
          <a
            href="mailto:contact@zaizub.com"
            className="hover:text-ink transition-colors focus-ring rounded"
          >
            {t.contact}
          </a>
        </nav>
      </div>
    </footer>
  );
}
