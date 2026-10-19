'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { resetPassword, type AuthActionState } from '@/app/actions/auth'
import AuthStudioShell from '@/components/auth/AuthStudioShell'

const initialState: AuthActionState = null

export default function ForgotPasswordForm() {
  const searchParams = useSearchParams()
  const queryError = searchParams.get('error')
  const [state, formAction, pending] = useActionState(resetPassword, initialState)
  const hasError = Boolean(state?.error || queryError)
  const isSuccess = Boolean(state?.success)
  const successMessage = state && 'success' in state && state.success ? state.message : undefined

  return (
    <AuthStudioShell mode="forgot-password" hideHeader={isSuccess}>
      {(lang) => (
        <div>
          {isSuccess ? (
            <div className="space-y-5 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h9" />
                  <polyline points="22,6 12,13 2,6" />
                  <polyline points="16 19 19 22 23 17" />
                </svg>
              </div>

              <div className="space-y-2">
                <h2 className="text-base font-semibold text-white">
                  {lang === 'en'
                    ? 'Check your inbox'
                    : 'ตรวจสอบกล่องจดหมายของคุณ'}
                </h2>
                <p className="text-xs leading-relaxed text-[#8c879e]">
                  {successMessage ||
                    (lang === 'en'
                      ? 'If an account exists for that email, we have sent recovery instructions.'
                      : 'หากมีบัญชีนี้ในระบบ เราได้จัดส่งลิงก์สำหรับรีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว')}
                </p>
              </div>

              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center rounded-xl bg-violet-600 hover:bg-violet-500 h-11 text-[14px] font-medium text-white shadow-[0_4px_16px_rgba(139,92,246,0.35)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60"
              >
                {lang === 'en' ? 'Back to sign in' : 'กลับสู่หน้าเข้าสู่ระบบ'}
              </Link>
            </div>
          ) : (
            <form action={formAction} className="space-y-4" noValidate={false}>
              {/* Email Input */}
              <div className="space-y-1.5 text-left">
                <label
                  htmlFor="recovery-email"
                  className="block text-xs font-medium text-zinc-300"
                >
                  {lang === 'en' ? 'Email address' : 'อีเมล'}
                </label>
                <div
                  className={`group relative flex items-center rounded-xl overflow-hidden bg-white/[0.04] hover:bg-white/[0.055] focus-within:bg-white/[0.06] border transition-all ${
                    hasError
                      ? 'border-red-500/60 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-500/25'
                      : 'border-white/[0.1] hover:border-white/[0.18] focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/30'
                  }`}
                >
                  <span className="pointer-events-none absolute left-3.5 z-10 flex items-center text-zinc-400 group-focus-within:text-violet-400 transition-colors">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <rect width="20" height="16" x="2" y="4" rx="3" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </span>
                  <input
                    id="recovery-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    aria-required="true"
                    aria-invalid={hasError ? 'true' : undefined}
                    aria-describedby={hasError ? 'recovery-error-msg' : undefined}
                    className="w-full h-12 bg-transparent rounded-xl pl-10.5 pr-4 text-[14px] text-[#f4f2f8] placeholder:text-zinc-400 outline-none"
                    placeholder={
                      lang === 'en' ? 'name@example.com' : 'อีเมลของคุณ'
                    }
                  />
                </div>
              </div>

              {hasError && (
                <div
                  id="recovery-error-msg"
                  role="alert"
                  className="text-red-300 text-[13px] bg-red-500/10 px-4 py-3 rounded-xl border border-red-500/25 flex items-center gap-2"
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="flex-shrink-0 text-red-400"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>
                    {state?.error ||
                      queryError ||
                      (lang === 'en'
                        ? 'Unable to process recovery request. Please try again.'
                        : 'ไม่สามารถดำเนินการได้ กรุณาลองใหม่อีกครั้ง')}
                  </span>
                </div>
              )}

              {/* Submit CTA Button */}
              <button
                type="submit"
                disabled={pending}
                className="w-full h-12 rounded-xl bg-violet-600 hover:bg-violet-500 active:scale-[0.99] text-white font-medium text-[14px] transition-all duration-150 flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(139,92,246,0.35)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                {pending ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="3"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>
                      {lang === 'en' ? 'Sending link...' : 'กำลังส่งลิงก์...'}
                    </span>
                  </>
                ) : (
                  <span>
                    {lang === 'en'
                      ? 'Send recovery link'
                      : 'ส่งลิงก์รีเซ็ตรหัสผ่าน'}
                  </span>
                )}
              </button>

              {/* Back to sign in link */}
              <div className="pt-2 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:text-violet-400"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                  <span>
                    {lang === 'en' ? 'Back to sign in' : 'กลับสู่หน้าเข้าสู่ระบบ'}
                  </span>
                </Link>
              </div>
            </form>
          )}
        </div>
      )}
    </AuthStudioShell>
  )
}
