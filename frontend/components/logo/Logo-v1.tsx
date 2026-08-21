export default function ZaiZubLogo() {
  return (
    <div className="flex items-center gap-3">
      {/* ไอคอนโลโก้ */}
      <svg 
        className="w-20 h-20"
        viewBox="0 0 40 40" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"

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
      </svg>
    </div>
  );
}