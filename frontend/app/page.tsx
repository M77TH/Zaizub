import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 font-sans selection:bg-purple-500/30 overflow-hidden relative">
      {/* 1. Navbar */}
      <nav className="w-full flex justify-between items-center px-6 py-6 max-w-7xl mx-auto relative z-10">
        
        {/* โลโก้ ZaiZub (SVG) */}
        <div className="flex items-center gap-3">
          <svg 
            width="40" 
            height="40" 
            viewBox="0 0 40 40" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]"
          >
            <defs>
              <linearGradient id="purpleGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#c026d3" /> {/* Fuchsia */}
                <stop offset="100%" stopColor="#9333ea" /> {/* Purple */}
              </linearGradient>
            </defs>
            <rect x="4" y="8" width="32" height="24" rx="6" stroke="url(#purpleGlow)" strokeWidth="3" />
            <path d="M12 16 L24 16 L16 24 L28 24" stroke="url(#purpleGlow)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M30 6 C30 9 33 12 36 12 C33 12 30 15 30 18 C30 15 27 12 24 12 C27 12 30 9 30 6 Z" fill="url(#purpleGlow)" />
          </svg>
          <span className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-500 tracking-tight">
            ZaiZub
          </span>
        </div>

        <div>
          <Link
            href="/login"
            className="px-5 py-2.5 text-sm font-medium text-white bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all duration-300"
          >
            เข้าสู่ระบบ
          </Link>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <main className="flex flex-col items-center justify-center text-center px-4 pt-24 pb-32 max-w-4xl mx-auto mt-10 relative z-10">
        
        {/* Badge แจ้งสถานะ */}
        <div className="inline-flex items-center px-4 py-1.5 mb-8 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm shadow-[0_0_15px_rgba(168,85,247,0.15)]">
          <span className="flex w-2 h-2 rounded-full bg-purple-500 mr-2 animate-pulse"></span>
          พร้อมให้บริการประมวลผลด้วย AI ขั้นสูง
        </div>

        {/* หัวข้อหลัก */}
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 text-white leading-tight">
          สร้างซับไตเติ้ลอัตโนมัติ <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-500 to-purple-600">
            ภายในไม่กี่วินาที
          </span>
        </h1>

        {/* คำอธิบาย */}
        <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl leading-relaxed">
          ยกระดับวิดีโอของคุณด้วย AI ถอดความที่รวดเร็วและแม่นยำ รองรับภาษาไทยสมบูรณ์แบบ จัดการง่ายผ่านระบบ Cloud ที่ปลอดภัยและเสถียร
        </p>

        {/* ปุ่ม Call to Action */}
        <div className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto">
          <Link
            href="/generator"
            className="px-8 py-4 text-base font-semibold text-white bg-purple-600 rounded-full hover:bg-purple-500 shadow-[0_0_20px_rgba(147,51,234,0.4)] hover:shadow-[0_0_30px_rgba(147,51,234,0.6)] transition-all duration-300"
          >
            เริ่มต้นใช้งานฟรี
          </Link>
          <Link
            href="/generator"
            className="px-8 py-4 text-base font-semibold text-gray-300 bg-transparent border border-gray-700 rounded-full hover:bg-white/5 transition-all duration-300"
          >
            ทดลองแบบไม่ต้องล็อกอิน
          </Link>
        </div>
      </main>

      {/* 3. Background Glow Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[500px] bg-purple-900/20 blur-[120px] rounded-full pointer-events-none -z-0"></div>
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-fuchsia-900/10 blur-[100px] rounded-full pointer-events-none -z-0"></div>
    </div>
  );
}