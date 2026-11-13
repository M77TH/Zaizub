'use client';

import React from 'react';

export type EditorTabType = 'styles' | 'template';

interface EditorTabsProps {
  activeTab: EditorTabType;
  setActiveTab: (tab: EditorTabType) => void;
}

function EditorTabs({ activeTab, setActiveTab }: EditorTabsProps) {
  return (
    <div className="flex w-13 flex-col items-center justify-start border-l border-[#1c1a28] bg-[#0c0b11] py-3 px-1.5 gap-2 select-none">
      {/* 1. Styles Tab (Adjustment Sliders Icon) */}
      <button
        type="button"
        onClick={() => setActiveTab('styles')}
        className={`group relative flex flex-col w-10 py-2 items-center justify-center gap-1 rounded-xl transition-all border ${
          activeTab === 'styles'
            ? 'bg-[#2d2250] text-[#e9d5ff] border-purple-500/40 shadow-[0_0_15px_rgba(139,92,246,0.2)]'
            : 'text-slate-400 border-transparent hover:text-white hover:bg-[#141222]'
        }`}
        title="ปรับแต่งสไตล์ (Styles)"
        aria-label="Styles"
      >
        {activeTab === 'styles' && (
          <span className="absolute -left-1.5 top-2.5 bottom-2.5 w-0.5 rounded-r-full bg-[#8b5cf6] shadow-[0_0_8px_rgba(139,92,246,0.9)]" />
        )}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" x2="20" y1="21" y2="21" />
          <line x1="4" x2="20" y1="3" y2="3" />
          <line x1="4" x2="20" y1="12" y2="12" />
          <circle cx="9" cy="12" r="2" fill="currentColor" />
          <circle cx="16" cy="3" r="2" fill="currentColor" />
          <circle cx="12" cy="21" r="2" fill="currentColor" />
        </svg>
        <span className="text-[9px] font-semibold leading-none tracking-tight">สไตล์</span>
      </button>

      {/* 2. Templates Tab (Grid Layout Icon) */}
      <button
        type="button"
        onClick={() => setActiveTab('template')}
        className={`group relative flex flex-col w-10 py-2 items-center justify-center gap-1 rounded-xl transition-all border ${
          activeTab === 'template'
            ? 'bg-[#2d2250] text-[#e9d5ff] border-purple-500/40 shadow-[0_0_15px_rgba(139,92,246,0.2)]'
            : 'text-slate-400 border-transparent hover:text-white hover:bg-[#141222]'
        }`}
        title="เทมเพลตสำเร็จรูป (Templates)"
        aria-label="Templates"
      >
        {activeTab === 'template' && (
          <span className="absolute -left-1.5 top-2.5 bottom-2.5 w-0.5 rounded-r-full bg-[#8b5cf6] shadow-[0_0_8px_rgba(139,92,246,0.9)]" />
        )}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="7" height="7" x="3" y="3" rx="1.5" />
          <rect width="7" height="7" x="14" y="3" rx="1.5" />
          <rect width="7" height="7" x="14" y="14" rx="1.5" />
          <rect width="7" height="7" x="3" y="14" rx="1.5" />
        </svg>
        <span className="text-[9px] font-semibold leading-none tracking-tight">เทมเพลต</span>
      </button>
    </div>
  );
}

export default React.memo(EditorTabs);
