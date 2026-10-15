"use client";

import HalftoneWordmarkFooter from "@/components/ui/halftone-wordmark-footer";
import { footerCopy, type Lang } from "./copy";

export default function Footer({ lang = "en" }: { lang?: Lang }) {
  const t = footerCopy[lang];

  const columns = [
    {
      title: t.product,
      links: [
        { label: lang === "th" ? "โปรแกรมตัดต่อ" : "Editor", href: "/editor" },
        { label: lang === "th" ? "ฟีเจอร์" : "Features", href: "/#features" },
        { label: lang === "th" ? "วิธีใช้งาน" : "Workflow", href: "/#how-it-works" },
      ],
    },
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
      meta={`©${new Date().getFullYear()} · ${t.tagline}`}
      columns={columns}
      preset="night"
      palette={{
        background: "#07060a",
        ink: "#2d2746",
        warm: "#c084fc",
      }}
      height="500px"
    />
  );
}
