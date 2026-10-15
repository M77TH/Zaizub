"use client";

import HalftoneWordmarkFooter from "@/components/ui/halftone-wordmark-footer";
import { footerCopy, type Lang } from "./copy";

export default function Footer({ lang = "en" }: { lang?: Lang }) {
  const t = footerCopy[lang];

  const columns = [
    {
      title: t.legal,
      links: [
        { label: t.privacy, href: "#" },
        { label: t.terms, href: "#" },
      ],
    },
    {
      title: t.social,
      links: [
        { label: "Instagram", href: "#" },
        { label: "Discord", href: "#" },
      ],
    },
    {
      title: t.contact,
      links: [
        { label: t.support, href: "#" },
      ],
    },
  ];

  return (
    <HalftoneWordmarkFooter
      wordmark="zaizub"
      label="Zaizub"
      columns={columns}
      preset="night"
      palette={{
        background: "#07060a",
        ink: "#5d4f91",
        warm: "#d8b4fe",
      }}
      height="540px"
    />
  );
}
