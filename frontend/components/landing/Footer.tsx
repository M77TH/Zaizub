"use client";

import HalftoneWordmarkFooter from "@/components/ui/halftone-wordmark-footer";
import { footerCopy, type Lang } from "./copy";

export default function Footer({ lang = "en" }: { lang?: Lang }) {
  const t = footerCopy[lang];

  const links = [
    { label: t.terms, href: "#" },
    { label: t.privacy, href: "#" },
    { label: t.support, href: "#" },
  ];

  return (
    <HalftoneWordmarkFooter
      wordmark="zaizub"
      label="Zaizub"
      links={links}
      preset="night"
      palette={{
        background: "#07060a",
        ink: "#2d2746",
        warm: "#c084fc",
      }}
      height="260px"
    />
  );
}
