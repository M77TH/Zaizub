export type Lang = "en" | "th";

export const heroCopy = {
  en: {
    eyebrow: "AI captions, zero typing",
    headlineTop: "AI captions. More views.",
    headlineAccent: "Make clips go viral",
    sub: "AI automatically transcribes and designs captions for you. Save time, finish editing fast, and post to any platform.",
    linkPlaceholder: "Paste a video link",
    generate: "Generate",
    generating: "Generating",
    done: "Captions ready",
    note: "Free for your first 5 minutes of video — no card needed.",
  },
  th: {
    eyebrow: "แคปชั่น AI ไม่ต้องพิมพ์เอง",
    headlineTop: "เพิ่มยอดวิวด้วยซับ AI",
    headlineAccent: "ดันคลิปติดฟีด",
    sub: "AI ถอดเสียงและดีไซน์ซับไตเติ้ลให้อัตโนมัติ ประหยัดเวลา ทำคลิปเสร็จไว พร้อมโพสต์ได้ทุกแพลตฟอร์ม",
    linkPlaceholder: "แปะลิงก์วิดีโอ",
    generate: "สร้าง",
    generating: "กำลังสร้าง",
    done: "ซับพร้อมแล้ว",
    note: "ใช้ฟรี 5 นาทีแรก ไม่ต้องผูกบัตร",
  },
};

export const howItWorksCopy = {
  en: {
    title: "From raw clip to captioned in three steps",
    subtitle: "Turn hours of tedious subtitle timing into seconds with automated AI precision.",
    steps: [
      {
        n: "01",
        title: "Drop in your footage",
        body: "Paste a link or upload a raw clip. Zaizub pulls the audio and starts listening straight away.",
      },
      {
        n: "02",
        title: "AI writes and times it",
        body: "Speech becomes text, word by word, matched to the exact frame it's spoken on — Thai and English both.",
      },
      {
        n: "03",
        title: "Export, ready to post",
        body: "Pick a caption style, burn it in, and export at the crop TikTok, Reels, and Shorts actually want.",
      },
    ],
  },
  th: {
    title: "จากคลิปดิบสู่ซับไตเติ้ลสวยเป๊ะใน 3 ขั้นตอน",
    subtitle: "เปลี่ยนงานตัดต่อซับที่เสียเวลาหลายชั่วโมงให้เสร็จในไม่กี่วินาทีด้วยพลัง AI",
    steps: [
      {
        n: "01",
        title: "อัปโหลดหรือแปะลิงก์คลิป",
        body: "วางลิงก์วิดีโอหรือลากไฟล์มาใส่ Zaizub จะดึงเสียงและเริ่มประมวลผลทันที",
      },
      {
        n: "02",
        title: "AI ถอดเสียงและจับจังหวะเป๊ะ",
        body: "แปลงเสียงพูดเป็นข้อความทีละคำ ซิงค์ตรงกับจังหวะพูดเป๊ะๆ ทั้งภาษาไทยและภาษาอังกฤษ",
      },
      {
        n: "03",
        title: "เลือกสไตล์ แล้วพร้อมโพสต์",
        body: "เลือกสไตล์ซับไตเติลสุดฮิต ฝังซับและดาวน์โหลดคลิปในขนาดที่เหมาะกับ TikTok, Reels และ Shorts ทันที",
      },
    ],
  },
};

export const featuresCopy = {
  en: {
    title: "Everything that keeps someone watching to the end",
    subtitle: "Engineered specifically for short-form content creators looking to maximize retention.",
    items: [
      {
        id: "sync",
        title: "Word-level sync",
        body: "Every word lands on the frame it's spoken, not the sentence — the difference between captions that feel cheap and ones that feel produced.",
        tag: "Frame-Perfect",
      },
      {
        id: "languages",
        title: "Thai + English, natively",
        body: "Built for mixed-language speech, slang, and Thai tone marks, not a generic translation model.",
        tag: "Bilingual AI",
      },
      {
        id: "styles",
        title: "Styles that already work",
        body: "A library of proven caption looks pulled from what's actually going viral right now on TikTok and Reels.",
        tag: "Viral Templates",
      },
      {
        id: "aspect",
        title: "Cut for every platform",
        body: "One clip, three exports: 9:16 for Reels and Shorts, 1:1 for feed, full frame for YouTube — captions reflow automatically.",
        tag: "Multi-Ratio",
      },
      {
        id: "speakers",
        title: "Speaker-aware",
        body: "Multiple voices get distinct caption colors automatically, so interviews and podcasts stay easy to follow.",
        tag: "Multi-Speaker",
      },
      {
        id: "brand",
        title: "Brand kit",
        body: "Lock in your custom fonts, colors, and positioning once — every video after that matches your aesthetic.",
        tag: "Custom Presets",
      },
    ],
  },
  th: {
    title: "ทุกฟีเจอร์ที่ช่วยให้คนดูคลิปคุณจนจบ",
    subtitle: "ออกแบบมาโดยเฉพาะสำหรับครีเอเตอร์สายคลิปสั้นที่ต้องการเพิ่มยอดวิวและ Retention",
    items: [
      {
        id: "sync",
        title: "ซิงค์เป๊ะระดับคำ",
        body: "คำขึ้นตรงกับเสี้ยววินาทีที่พูด ไม่ใช่ขึ้นมาเป็นประโยคยาวๆ ทำให้คลิปดูโปรและดึงดูดสายตา",
        tag: "แม่นยำสูง",
      },
      {
        id: "languages",
        title: "รองรับไทย + อังกฤษแบบธรรมชาติ",
        body: "รองรับคำสแลง ภาษาพูดผสมผสาน และวรรณยุกต์ไทยได้อย่างถูกต้อง ไม่ใช่แค่การแปลทับศัพท์",
        tag: "ภาษาไทย 100%",
      },
      {
        id: "styles",
        title: "สไตล์ซับยอดนิยมที่ไวรัลจริง",
        body: "คลังสไตล์ซับแบบที่กำลังฮิตบน TikTok, Reels และ Shorts ให้คลิปของคุณดูน่าสนใจทันที",
        tag: "สไตล์ไวรัล",
      },
      {
        id: "aspect",
        title: "ปรับขนาดได้ทุกแพลตฟอร์ม",
        body: "คลิปเดียวแปลงได้ครบ: 9:16 สำหรับ Reels/Shorts, 1:1 สำหรับฟีด และ 16:9 สำหรับ YouTube ซับจัดวางใหม่อัตโนมัติ",
        tag: "ทุกอัตราส่วน",
      },
      {
        id: "speakers",
        title: "แยกผู้พูดอัตโนมัติ",
        body: "จำแนกเสียงคนพูดหลายคนและใส่สีซับแยกกัน ช่วยให้คลิปสัมภาษณ์และพอดแคสต์ดูง่ายขึ้น",
        tag: "จำแนกเสียง",
      },
      {
        id: "brand",
        title: "บันทึกสไตล์แบรนด์ของคุณ",
        body: "ตั้งค่าฟอนต์ สี และตำแหน่งซับประจำช่องไว้ครั้งเดียว นำไปใช้กับทุกคลิปได้ทันทีโดยไม่ต้องตั้งใหม่",
        tag: "คิตแบรนด์",
      },
    ],
  },
};

export const pricingCopy = {
  en: {
    title: "Simple pricing, built for creators",
    subtitle: "Start free. Upgrade once captions are helping you grow your audience.",
    monthly: "/mo",
    mostPopular: "Most Popular",
    tiers: [
      {
        name: "Free",
        price: "฿0",
        period: "",
        tagline: "Try it on your next clip",
        features: [
          "5 minutes of video / month",
          "Auto captions with 2 preset styles",
          "720p export quality",
          "Zaizub watermark",
        ],
        cta: "Start for free",
        highlighted: false,
      },
      {
        name: "Creator",
        price: "฿299",
        period: "/mo",
        tagline: "For channels posting weekly",
        features: [
          "300 minutes of video / month",
          "All viral styles + custom brand kit",
          "1080p full HD, no watermark",
          "Thai + English auto-detect & sync",
          "Fast priority render queue",
        ],
        cta: "Start 7-day free trial",
        highlighted: true,
      },
      {
        name: "Studio",
        price: "฿999",
        period: "/mo",
        tagline: "For teams, agencies & daily posters",
        features: [
          "Unlimited minutes",
          "Multi-speaker detection & colors",
          "4K ultra export quality",
          "Top-tier priority render queue",
          "Dedicated priority support",
        ],
        cta: "Contact team",
        highlighted: false,
      },
    ],
  },
  th: {
    title: "แพ็กเกจราคาเรียบง่าย คุ้มค่าสำหรับครีเอเตอร์",
    subtitle: "เริ่มต้นใช้งานฟรี และอัปเกรดเมื่อคุณต้องการผลิตคลิปคุณภาพสูงขึ้น",
    monthly: "/เดือน",
    mostPopular: "ยอดนิยมที่สุด",
    tiers: [
      {
        name: "Free",
        price: "฿0",
        period: "",
        tagline: "ทดลองใช้งานกับคลิปแรกของคุณ",
        features: [
          "วิดีโอ 5 นาที / เดือน",
          "ซับไตเติลอัตโนมัติ 2 สไตล์",
          "ดาวน์โหลดความชัด 720p",
          "มีลายน้ำ Zaizub",
        ],
        cta: "เริ่มต้นใช้ฟรี",
        highlighted: false,
      },
      {
        name: "Creator",
        price: "฿299",
        period: "/เดือน",
        tagline: "เหมาะสำหรับช่องที่ลงคลิปเป็นประจำ",
        features: [
          "วิดีโอ 300 นาที / เดือน",
          "ปลดล็อกทุกสไตล์ซับ + คิตแบรนด์",
          "ความชัด 1080p ไม่มีลายน้ำ",
          "ตรวจจับภาษาไทย + อังกฤษอัตโนมัติ",
          "คิวเรนเดอร์ความเร็วสูง",
        ],
        cta: "ทดลองใช้ฟรี 7 วัน",
        highlighted: true,
      },
      {
        name: "Studio",
        price: "฿999",
        period: "/เดือน",
        tagline: "สำหรับทีม ครีเอเตอร์มืออาชีพ และเอเจนซี่",
        features: [
          "สร้างซับได้ไม่จำกัดนาที",
          "แยกสีตามผู้พูดอัตโนมัติ",
          "ดาวน์โหลดความคมชัดระดับ 4K",
          "คิวเรนเดอร์ลำดับแรกสุด (Top Priority)",
          "บริการดูแลพิเศษแบบส่วนตัว",
        ],
        cta: "ติดต่อทีมงาน",
        highlighted: false,
      },
    ],
  },
};

export const footerCopy = {
  en: {
    tagline: "Zaizub. Made for creators in Thailand & worldwide.",
    privacy: "Privacy",
    terms: "Terms",
    contact: "Contact",
  },
  th: {
    tagline: "Zaizub. สร้างขึ้นเพื่อครีเอเตอร์ในไทยและทั่วโลก",
    privacy: "นโยบายความเป็นส่วนตัว",
    terms: "ข้อกำหนดการใช้งาน",
    contact: "ติดต่อเรา",
  },
};

export type CaptionLine = { time: string; words: string[] };

export const captionReel: Record<Lang, CaptionLine[]> = {
  en: [
    { time: "00:01", words: ["wait", "for", "it—"] },
    { time: "00:03", words: ["this", "is", "insane", "🔥"] },
    { time: "00:05", words: ["captions,", "auto-synced"] },
    { time: "00:07", words: ["in", "under", "60", "seconds"] },
  ],
  th: [
    { time: "00:01", words: ["รอ", "แป๊บ…"] },
    { time: "00:03", words: ["อันนี้", "เดือดมาก", "🔥"] },
    { time: "00:05", words: ["ซับไตเติล", "ซิงค์อัตโนมัติ"] },
    { time: "00:07", words: ["ใน", "60", "วินาที"] },
  ],
};
