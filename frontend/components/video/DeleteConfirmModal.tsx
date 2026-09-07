'use client';

import React, { useEffect } from 'react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title?: string;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export default function DeleteConfirmModal({
  isOpen,
  title,
  onClose,
  onConfirm,
  isDeleting = false,
}: DeleteConfirmModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isDeleting]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={!isDeleting ? onClose : undefined}
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#151226]/95 p-6 shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-200 text-center">
        {/* Warning Icon with red glow */}
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.2)]">
          <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </div>

        {/* Modal Title & Message */}
        <h3 className="text-lg font-bold text-white tracking-tight mb-2">
          ยืนยันการลบวิดีโอ
        </h3>
        <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
          คุณแน่ใจหรือไม่ว่าต้องการลบวิดีโอ{' '}
          {title ? (
            <span className="font-semibold text-zinc-200 break-words underline decoration-rose-500/30">
              &ldquo;{title}&rdquo;
            </span>
          ) : (
            'นี้'
          )}
          ? <br />
          <span className="text-xs text-rose-400/80 mt-1 inline-block">
            *การกระทำนี้ไม่สามารถย้อนกลับได้
          </span>
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-semibold text-zinc-300 hover:bg-white/[0.09] hover:text-white transition-all disabled:opacity-50"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 px-4 py-2.5 text-sm font-bold text-white hover:from-rose-500 hover:to-rose-600 shadow-[0_4px_20px_rgba(244,63,94,0.35)] transition-all disabled:opacity-60 active:scale-[0.98]"
          >
            {isDeleting ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                กำลังลบ...
              </>
            ) : (
              'ลบวิดีโอ'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
