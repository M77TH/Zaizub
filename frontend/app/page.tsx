"use client";

import { useState } from "react";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import Features from "@/components/landing/Features";
import Pricing from "@/components/landing/Pricing";
import Footer from "@/components/landing/Footer";
import CustomScrollbar from "@/components/ui/CustomScrollbar";
import type { Lang } from "@/components/landing/copy";

export default function Home() {
  const [lang, setLang] = useState<Lang>("en");

  return (
    <main className="min-h-screen bg-bg">
      <Navbar lang={lang} setLang={setLang} />
      <Hero lang={lang} />
      <HowItWorks lang={lang} />
      <Features lang={lang} />
      <Pricing lang={lang} />
      <Footer lang={lang} />
      <CustomScrollbar />
    </main>
  );
}
