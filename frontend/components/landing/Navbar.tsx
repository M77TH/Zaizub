"use client";

import { useState } from "react";
import { useLenis } from "./SmoothScroll";
import type { Lang } from "./copy";

export default function Navbar({
  lang,
  setLang,
}: {
  lang: Lang;
  setLang: (l: Lang) => void;
}) {
  const { lenis } = useLenis();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const links =
    lang === "en"
      ? ["How it works", "Features", "Pricing"]
      : ["วิธีใช้งาน", "ฟีเจอร์", "ราคา"];
  const ids = ["how-it-works", "features", "pricing"];

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);

    if (targetId === "top") {
      if (lenis) {
        lenis.scrollTo(0, { duration: 1.2 });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }

    const element = document.getElementById(targetId);
    if (element) {
      if (lenis) {
        lenis.scrollTo(element, { offset: -70, duration: 1.2 });
      } else {
        const top = element.getBoundingClientRect().top + window.scrollY - 70;
        window.scrollTo({ top, behavior: "smooth" });
      }
    }
  };

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-line/10 bg-bg/25 backdrop-blur-md">
      <nav className="relative mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10" aria-label="Main Navigation">
        <a
          href="#top"
          onClick={(e) => scrollToSection(e, "top")}
          className="focus-ring rounded font-display text-lg font-semibold tracking-tight text-ink hover:text-white transition-colors"
        >
          Zaizub
        </a>

        {/* Desktop Navigation Links */}
        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 md:flex">
          {links.map((label, i) => (
            <a
              key={label}
              href={`#${ids[i]}`}
              onClick={(e) => scrollToSection(e, ids[i])}
              className="text-sm text-ink-muted transition-colors hover:text-ink focus-ring rounded"
            >
              {label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3 sm:gap-5">
          {/* Desktop Language Switcher */}
          <div className="mr-1 hidden items-center gap-1 text-sm sm:flex rounded-lg border border-white/5 bg-white/[0.03] p-0.5" role="group" aria-label="Language Selector">
            <button
              type="button"
              onClick={() => setLang("en")}
              aria-pressed={lang === "en"}
              className={`focus-ring rounded-md px-2 py-0.5 text-xs font-medium transition-all ${
                lang === "en" ? "bg-accent/20 text-accent-soft shadow-sm" : "text-ink-muted hover:text-ink"
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang("th")}
              aria-pressed={lang === "th"}
              className={`focus-ring rounded-md px-2 py-0.5 text-xs font-medium transition-all ${
                lang === "th" ? "bg-accent/20 text-accent-soft shadow-sm" : "text-ink-muted hover:text-ink"
              }`}
            >
              TH
            </button>
          </div>

          <a
            href="/login"
            className="hidden text-sm text-ink-muted transition-colors hover:text-ink sm:inline focus-ring rounded"
          >
            {lang === "en" ? "Log in" : "เข้าสู่ระบบ"}
          </a>

          <a
            href="/register"
            onClick={(e) => scrollToSection(e, "top")}
            className="focus-ring rounded-xl bg-gradient-to-b from-accent-soft to-accent-deep px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-white shadow-[0_0_20px_rgba(130,80,255,0.3)] transition-transform hover:scale-[1.03]"
          >
            {lang === "en" ? "Start free" : "เริ่มใช้ฟรี"}
          </a>

          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="focus-ring flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-ink-muted hover:text-ink md:hidden"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="border-b border-line bg-bg/95 backdrop-blur-xl px-6 py-6 md:hidden animate-[uploadOverlayIn_200ms_ease-out]">
          <div className="flex flex-col gap-4">
            {links.map((label, i) => (
              <a
                key={label}
                href={`#${ids[i]}`}
                onClick={(e) => scrollToSection(e, ids[i])}
                className="text-base font-medium text-ink-muted hover:text-ink transition-colors py-1"
              >
                {label}
              </a>
            ))}

            <hr className="border-white/5 my-1" />

            <div className="flex items-center justify-between py-1">
              <span className="text-sm text-ink-muted">{lang === "en" ? "Language" : "ภาษา"}</span>
              <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] p-1">
                <button
                  type="button"
                  onClick={() => setLang("en")}
                  className={`rounded px-2.5 py-1 text-xs font-medium ${
                    lang === "en" ? "bg-accent text-white" : "text-ink-muted"
                  }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setLang("th")}
                  className={`rounded px-2.5 py-1 text-xs font-medium ${
                    lang === "th" ? "bg-accent text-white" : "text-ink-muted"
                  }`}
                >
                  TH
                </button>
              </div>
            </div>

            <a
              href="/login"
              className="mt-2 text-sm text-center text-ink-muted py-2 hover:text-ink"
            >
              {lang === "en" ? "Log in" : "เข้าสู่ระบบ"}
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
