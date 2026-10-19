"use client";

import dynamic from "next/dynamic";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import CustomScrollbar from "@/components/ui/CustomScrollbar";
import { useLanguage } from "@/components/providers/LanguageProvider";

const EditorMockup = dynamic(() => import("@/components/landing/EditorMockup"));
const HowItWorks = dynamic(() => import("@/components/landing/HowItWorks"));
const Features = dynamic(() => import("@/components/landing/Features"));
const Footer = dynamic(() => import("@/components/landing/Footer"));

export default function Home() {
  const { lang, setLang } = useLanguage();

  return (
    <main className="min-h-screen bg-bg">
      <Navbar lang={lang} setLang={setLang} />
      <Hero lang={lang} />
      <EditorMockup lang={lang} />
      <HowItWorks lang={lang} />
      <Features lang={lang} />
      <Footer lang={lang} />
      <CustomScrollbar />
    </main>
  );
}

