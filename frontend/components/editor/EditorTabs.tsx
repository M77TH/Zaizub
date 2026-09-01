'use client';

import React from 'react';

export type EditorTabType = 'styles' | 'template';

interface EditorTabsProps {
  activeTab: EditorTabType;
  setActiveTab: (tab: EditorTabType) => void;
}

function EditorTabs({ activeTab, setActiveTab }: EditorTabsProps) {
  return (
    <div className="flex w-12 flex-col items-center justify-start border-l border-[#1c1a28] bg-[#0c0b11] py-3 gap-2 select-none">
      {/* 1. Styles Tab (Adjustment Sliders Icon) */}
      <button
        type="button"
        onClick={() => setActiveTab('styles')}
        className={`group relative flex h-9 w-9 items-center justify-center rounded-lg transition-all ${
          activeTab === 'styles'
            ? 'bg-[#2d2250] text-[#c4b5fd] shadow-sm'
            : 'text-gray-400 hover:text-white hover:bg-[#1a1827]'
        }`}
        title="สไตล์ (Styles)"
        aria-label="Styles"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" x2="20" y1="21" y2="21" />
          <line x1="4" x2="20" y1="3" y2="3" />
          <line x1="4" x2="20" y1="12" y2="12" />
          <circle cx="9" cy="12" r="2" fill="currentColor" />
          <circle cx="16" cy="3" r="2" fill="currentColor" />
          <circle cx="12" cy="21" r="2" fill="currentColor" />
        </svg>
      </button>

      {/* 2. Templates Tab (Grid Layout Icon) */}
      <button
        type="button"
        onClick={() => setActiveTab('template')}
        className={`group relative flex h-9 w-9 items-center justify-center rounded-lg transition-all ${
          activeTab === 'template'
            ? 'bg-[#2d2250] text-[#c4b5fd] shadow-sm'
            : 'text-gray-400 hover:text-white hover:bg-[#1a1827]'
        }`}
        title="เทมเพลต (Templates)"
        aria-label="Templates"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="7" height="7" x="3" y="3" rx="1.5" />
          <rect width="7" height="7" x="14" y="3" rx="1.5" />
          <rect width="7" height="7" x="14" y="14" rx="1.5" />
          <rect width="7" height="7" x="3" y="14" rx="1.5" />
        </svg>
      </button>
    </div>
  );
}

export default React.memo(EditorTabs);