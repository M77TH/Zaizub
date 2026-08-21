export default function ZaiZubLogo() {
  return (
    <div className="flex items-center gap-3">
      {/* ไอคอนโลโก้ */}
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
        
        {/* กรอบวิดีโอ/ซับไตเติ้ล */}
        <rect x="4" y="8" width="32" height="24" rx="6" stroke="url(#purpleGlow)" strokeWidth="3" />
        
        {/* สัญลักษณ์ตัว Z ตรงกลางคล้าย Waveform / Play */}
        <path d="M12 16 L24 16 L16 24 L28 24" stroke="url(#purpleGlow)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        
        {/* ประกายดาว AI */}
        <path d="M30 6 C30 9 33 12 36 12 C33 12 30 15 30 18 C30 15 27 12 24 12 C27 12 30 9 30 6 Z" fill="url(#purpleGlow)" />
      </svg>
      
      {/* ตัวหนังสือโลโก้ */}
      <span className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-500 tracking-tight">
        ZaiZub
      </span>
    </div>
  );
}