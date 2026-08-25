"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import Features from "@/components/Features";
import Pricing from "@/components/Pricing";
import Footer from "@/components/Footer";
import CustomScrollbar from "@/components/CustomScrollbar";
import type { Lang } from "@/components/copy";

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
