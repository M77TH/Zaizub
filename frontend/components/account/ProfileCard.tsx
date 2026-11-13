'use client';

import React, { useState, useRef, useEffect, useTransition } from 'react';
import { logout } from '@/app/actions/auth';

interface ProfileCardProps {
  displayName: string;
  email: string;
}

export default function ProfileCard({ displayName, email }: ProfileCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close dropdown on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const initial = displayName ? displayName[0].toUpperCase() : email ? email[0].toUpperCase() : 'U';

  const handleLogout = () => {
    startTransition(async () => {
      await logout();
    });
  };

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      {/* Profile Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className={`group flex items-center justify-between gap-2.5 px-2.5 py-1.5 rounded-lg bg-[#0d0c12] hover:bg-[#14131c] border transition-colors duration-150 cursor-pointer select-none text-left focus:outline-none ${
          isOpen ? 'border-white/30 bg-[#14131c]' : 'border-[#21202c] hover:border-white/20'
        }`}
      >
        <div className="w-7 h-7 rounded-md bg-[#1c1a27] border border-white/[0.1] flex items-center justify-center text-white font-mono font-bold text-xs flex-shrink-0">
          {initial}
        </div>

        <div className="flex flex-col text-left max-w-[130px] sm:max-w-[170px] min-w-0">
          <span className="text-xs font-semibold text-white truncate leading-tight">
            {displayName || 'User'}
          </span>
          <span className="text-[10.5px] font-mono text-zinc-500 truncate leading-tight">
            {email}
          </span>
        </div>

        {/* Chevron Arrow */}
        <svg
          className={`w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-200 transition-transform duration-150 ml-0.5 flex-shrink-0 ${
            isOpen ? 'rotate-180 text-white' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Options Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-1.5 min-w-full rounded-xl bg-[#0e0d14] border border-[#252432] shadow-[0_18px_40px_rgba(0,0,0,0.85)] p-1 z-50 origin-top-right anim-dropdown"
          role="menu"
          aria-orientation="vertical"
        >
          <button
            type="button"
            onClick={handleLogout}
            disabled={isPending}
            className="group w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/[0.08] active:bg-white/[0.12] transition-colors text-left cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            role="menuitem"
          >
            {isPending ? (
              <svg
                className="w-4 h-4 animate-spin text-zinc-400 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
            ) : (
              <svg
                className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.75"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            )}
            <span>{isPending ? 'Logging out...' : 'Log out'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
