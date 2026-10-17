"use client";

import { useState } from "react";
import Link from "next/link";
import { useLenis } from "@/components/providers/SmoothScroll";
import ZaiZubLogo from "@/components/logo/Logo-v3";
import { useLanguage } from "@/components/providers/LanguageProvider";
import type { Lang } from "./copy";

export default function Navbar({
  lang: propLang,
  setLang: propSetLang,
}: {
  lang?: Lang;
  setLang?: (l: Lang) => void;
} = {}) {
  const langContext = useLanguage();
  const lang = propLang ?? langContext.lang;
  const setLang = propSetLang ?? langContext.setLang;
  const { lenis } = useLenis();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const links =
    lang === "en"
      ? ["Demo", "How it works", "Features"]
      : ["เดโม", "วิธีใช้งาน", "ฟีเจอร์"];
  const ids = ["editor-mockup", "how-it-works", "features"];

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);

    if (targetId === "top" || targetId === "generate") {
      if (lenis) {
        lenis.scrollTo(0, { duration: 1.1 });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      if (targetId === "generate") {
        setTimeout(() => {
          const input = document.querySelector<HTMLInputElement>("#generate input[type='text']");
          if (input) input.focus();
        }, 400);
      }
      return;
    }

    const element = document.getElementById(targetId);
    if (element) {
      if (lenis) {
        lenis.resize();
        // Elements have scroll-mt-16 (64px) which Lenis reads automatically from scrollMarginTop.
        // offset: 0 aligns the section's top edge exactly at the 64px navbar bottom.
        lenis.scrollTo(element, { offset: 0, duration: 1.1, force: true });
      } else {
        const top = element.getBoundingClientRect().top + window.scrollY - 64;
        window.scrollTo({ top, behavior: "smooth" });
      }
    }
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.05] bg-[#07060a]/40 backdrop-blur-xl">
      <nav
        className="relative mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6 lg:px-10"
        aria-label="Main Navigation"
      >
        {/* Left: Brand Logo + Name */}
        <a
          href="#top"
          onClick={(e) => scrollToSection(e, "top")}
          className="group flex items-center gap-2.5 focus-ring rounded-full px-1.5 py-1 transition-transform active:scale-95"
          aria-label="Zaizub Home"
        >
          <div className="relative flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
            <ZaiZubLogo size={26} />
          </div>
          <span className="font-display text-[17px] font-bold tracking-tight text-white group-hover:text-purple-200 transition-colors">
            Zaizub
          </span>
        </a>

        {/* Center: Clean Unboxed Studio Navigation Links */}
        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-7 lg:gap-8 md:flex">
          {links.map((label, i) => (
            <a
              key={label}
              href={`#${ids[i]}`}
              onClick={(e) => scrollToSection(e, ids[i])}
              className="text-[13px] font-medium text-zinc-400 hover:text-white transition-colors duration-200 focus-ring rounded-lg py-1 px-1"
            >
              {label}
            </a>
          ))}
        </div>

        {/* Right: Controls & CTAs */}
        <div className="flex items-center gap-3 sm:gap-3.5">

          {/* Language Toggle — simple text button, click to switch */}
          <button
            type="button"
            onClick={() => setLang(lang === "en" ? "th" : "en")}
            className="focus-ring text-[13px] font-medium text-zinc-400 hover:text-white transition-colors py-1 px-1 rounded-lg"
            aria-label={lang === "en" ? "Switch language to Thai" : "เปลี่ยนภาษาเป็น English"}
          >
            {lang === "en" ? "English" : "ไทย"}
          </button>

          {/* Vertical divider line between English and Log in */}
          <span className="hidden sm:inline-block h-3.5 w-px bg-white/15" aria-hidden="true" />

          <Link
            href="/login"
            className="hidden text-[13px] font-medium text-zinc-400 hover:text-white transition-colors sm:inline-flex px-2 py-1 focus-ring rounded-lg"
          >
            {lang === "en" ? "Log in" : "เข้าสู่ระบบ"}
          </Link>

          <a
            href="#top"
            onClick={(e) => scrollToSection(e, "generate")}
            className="group focus-ring rounded-full bg-gradient-to-r from-[#8b5cf6] via-[#7c3aed] to-[#6d28d9] hover:from-[#9333ea] hover:to-[#7c3aed] border border-purple-400/30 px-4 py-1.5 text-xs font-semibold text-white shadow-[0_0_14px_rgba(139,92,246,0.22)] hover:shadow-[0_0_20px_rgba(139,92,246,0.35)] hover:scale-[1.02] active:scale-95 transition-all duration-200"
          >
            <span>{lang === "en" ? "Try it free" : "ทดลองใช้ฟรี"}</span>
          </a>

          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="focus-ring flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-[#12101e]/80 text-zinc-400 hover:text-white hover:bg-white/[0.08] md:hidden transition-colors"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="border-b border-white/[0.08] bg-[#0c0a15]/95 backdrop-blur-2xl px-6 py-6 md:hidden animate-[uploadOverlayIn_200ms_ease-out]">
          <div className="flex flex-col gap-2">
            {links.map((label, i) => (
              <a
                key={label}
                href={`#${ids[i]}`}
                onClick={(e) => scrollToSection(e, ids[i])}
                className="text-sm font-medium text-zinc-300 hover:text-white transition-colors py-2 px-3 rounded-xl hover:bg-white/[0.05]"
              >
                {label}
              </a>
            ))}

            <hr className="border-white/[0.08] my-2" />

            <div className="flex items-center justify-between py-1">
              <span className="text-sm text-zinc-400">{lang === "en" ? "Language" : "ภาษา"}</span>
              <div className="flex items-center rounded-lg border border-white/[0.08] bg-[#12101e] p-0.5">
                <button
                  type="button"
                  onClick={() => setLang("en")}
                  className={`rounded-md px-3 py-1 text-xs font-semibold ${
                    lang === "en" ? "bg-white/10 text-white shadow-sm" : "text-zinc-400"
                  }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setLang("th")}
                  className={`rounded-md px-3 py-1 text-xs font-semibold ${
                    lang === "th" ? "bg-white/10 text-white shadow-sm" : "text-zinc-400"
                  }`}
                >
                  TH
                </button>
              </div>
            </div>

            <Link
              href="/login"
              className="mt-2 text-sm text-center text-zinc-300 py-2.5 rounded-full border border-white/[0.08] bg-white/[0.02] hover:text-white hover:bg-white/[0.06] font-semibold transition-colors"
            >
              {lang === "en" ? "Log in" : "เข้าสู่ระบบ"}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
