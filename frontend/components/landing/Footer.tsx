"use client";

import HalftoneWordmarkFooter from "@/components/ui/halftone-wordmark-footer";
import { footerCopy, type Lang } from "./copy";

export default function Footer({ lang = "en" }: { lang?: Lang }) {
  const t = footerCopy[lang];

  const columns = [
    {
      title: lang === "th" ? "ผลิตภัณฑ์" : "Product",
      links: [
        { label: lang === "th" ? "โปรแกรมตัดต่อ" : "Editor", href: "/editor" },
        { label: lang === "th" ? "ฟีเจอร์" : "Features", href: "/#features" },
        { label: lang === "th" ? "วิธีใช้งาน" : "Workflow", href: "/#how-it-works" },
      ],
    },
    {
      title: lang === "th" ? "กฎหมาย" : "Legal",
      links: [
        { label: t.privacy, href: "#" },
        { label: t.terms, href: "#" },
        { label: lang === "th" ? "ความปลอดภัย" : "Security", href: "#" },
      ],
    },
    {
      title: lang === "th" ? "ติดต่อ" : "Contact",
      links: [
        { label: "contact@zaizub.com", href: "mailto:contact@zaizub.com" },
        { label: lang === "th" ? "สนับสนุน" : "Support", href: "mailto:support@zaizub.com" },
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
        ink: "#f4f2f8",
        warm: "#8b5cf6",
      }}
      height="520px"
    />
  );
}
