'use client'

import { useActionState, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { updatePassword, type AuthActionState } from '@/app/actions/auth'
import { createClient } from '@/lib/supabase/client'
import AuthStudioShell from '@/components/auth/AuthStudioShell'

const initialState: AuthActionState = null

interface ResetPasswordFormProps {
  initialUser: { email: string } | null
}

export default function ResetPasswordForm({
  initialUser,
}: ResetPasswordFormProps) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(updatePassword, initialState)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [clientError, setClientError] = useState<string | null>(null)

  // Auth session check: either verified on server or verified on client via Supabase
  const [hasSession, setHasSession] = useState<boolean>(Boolean(initialUser))
  const [isCheckingSession, setIsCheckingSession] = useState<boolean>(!initialUser)

  useEffect(() => {
    if (initialUser) {
      setHasSession(true)
      setIsCheckingSession(false)
      return
    }

    const supabase = createClient()

    // 1. Check existing session / recovery session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setHasSession(true)
        setIsCheckingSession(false)
      } else {
        // Give a brief window for hash parsing if URL contains #access_token
        const timer = setTimeout(() => {
          supabase.auth.getUser().then(({ data: { user } }) => {
            setHasSession(Boolean(user))
            setIsCheckingSession(false)
          })
        }, 500)
        return () => clearTimeout(timer)
      }
    })

    // 2. Listen for auth state change (e.g. PASSWORD_RECOVERY event)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setHasSession(true)
        setIsCheckingSession(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [initialUser])

  const isSuccess = Boolean(state?.success)
  const successMessage =
    state && 'success' in state && state.success ? state.message : undefined
  const errorMessage = clientError || state?.error

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    setClientError(null)

    if (password.length < 8) {
      e.preventDefault()
      setClientError('Password must be at least 8 characters.')
      return
    }

    if (password !== confirmPassword) {
      e.preventDefault()
      setClientError('Passwords do not match.')
      return
    }
  }

  const shouldHideHeader = isCheckingSession || !hasSession || isSuccess

  return (
    <AuthStudioShell mode="reset-password" hideHeader={shouldHideHeader}>
      {(lang) => (
        <div>
          {isCheckingSession ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <svg
                className="animate-spin h-6 w-6 text-violet-400"
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
              <p className="text-xs text-zinc-400">
                {lang === 'en'
                  ? 'Verifying reset link...'
                  : 'กำลังตรวจสอบลิงก์รีเซ็ตรหัสผ่าน...'}
              </p>
            </div>
          ) : !hasSession ? (
            /* Expired or invalid session card */
            <div className="space-y-6 text-center py-2">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/25 text-red-400 shadow-[0_0_28px_rgba(239,68,68,0.2)]">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>

              <div className="space-y-2">
                <h2 className="font-display text-[22px] font-semibold text-[#f4f2f8] tracking-tight">
                  {lang === 'en'
                    ? 'Reset link expired or invalid'
                    : 'ลิงก์รีเซ็ตรหัสผ่านหมดอายุหรือไม่ถูกต้อง'}
                </h2>
                <p className="text-[14px] leading-relaxed text-[#8c879e] max-w-sm mx-auto">
                  {lang === 'en'
                    ? 'For your security, password reset links can only be used once and expire quickly. Please request a new link.'
                    : 'เพื่อความปลอดภัย ลิงก์สำหรับตั้งรหัสผ่านใหม่สามารถใช้ได้เพียงครั้งเดียวและมีอายุจำกัด กรุณาขอลิงก์ใหม่อีกครั้ง'}
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href="/forgot-password"
                  className="inline-flex w-full h-12 items-center justify-center rounded-xl bg-gradient-to-b from-[#8b5cf6] to-[#6d28d9] hover:from-[#9366f9] hover:to-[#7c3aed] text-[14px] font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.4),0_0_24px_rgba(139,92,246,0.22),inset_0_1px_0_rgba(255,255,255,0.22)] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                >
                  {lang === 'en'
                    ? 'Request a new reset link'
                    : 'ขอลิงก์รีเซ็ตรหัสผ่านใหม่'}
                </Link>
              </div>

              <div className="pt-2 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
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
            </div>
          ) : isSuccess ? (
            /* Success confirmation card */
            <div className="space-y-6 text-center py-2">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 shadow-[0_0_28px_rgba(16,185,129,0.2)]">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>

              <div className="space-y-2">
                <h2 className="font-display text-[22px] font-semibold text-[#f4f2f8] tracking-tight">
                  {lang === 'en'
                    ? 'Password updated successfully'
                    : 'ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว'}
                </h2>
                <p className="text-[14px] leading-relaxed text-[#8c879e] max-w-sm mx-auto">
                  {successMessage ||
                    (lang === 'en'
                      ? 'Your password has been changed. You are already signed in.'
                      : 'รหัสผ่านของคุณถูกเปลี่ยนเรียบร้อยแล้ว บัญชีของคุณพร้อมใช้งาน')}
                </p>
              </div>

              <div className="pt-2 space-y-2.5">
                <button
                  type="button"
                  onClick={() => router.push('/my-video')}
                  className="inline-flex w-full h-12 items-center justify-center rounded-xl bg-gradient-to-b from-[#8b5cf6] to-[#6d28d9] hover:from-[#9366f9] hover:to-[#7c3aed] text-[14px] font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.4),0_0_24px_rgba(139,92,246,0.22),inset_0_1px_0_rgba(255,255,255,0.22)] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                >
                  {lang === 'en'
                    ? 'Continue to workspace'
                    : 'เข้าสู่พื้นที่ทำงาน'}
                </button>

                <Link
                  href="/login"
                  className="inline-flex w-full h-11 items-center justify-center rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[13px] font-medium text-zinc-300 hover:text-white transition-all"
                >
                  {lang === 'en' ? 'Back to sign in' : 'กลับสู่หน้าเข้าสู่ระบบ'}
                </Link>
              </div>
            </div>
          ) : (
            /* Password Reset Form */
            <form
              action={formAction}
              onSubmit={handleSubmit}
              className="space-y-4"
              noValidate={false}
            >
              {/* New Password Input */}
              <div className="space-y-1.5 text-left">
                <label
                  htmlFor="new-password"
                  className="block text-xs font-medium text-zinc-300"
                >
                  {lang === 'en' ? 'New password' : 'รหัสผ่านใหม่'}
                </label>
                <div
                  className={`group relative flex items-center rounded-xl overflow-hidden bg-white/[0.04] hover:bg-white/[0.055] focus-within:bg-white/[0.06] border transition-all ${
                    errorMessage
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
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    id="new-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (clientError) setClientError(null)
                    }}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    aria-required="true"
                    aria-invalid={errorMessage ? 'true' : undefined}
                    aria-describedby={
                      errorMessage ? 'reset-error-msg' : undefined
                    }
                    className="w-full h-12 bg-transparent rounded-xl pl-10.5 pr-11 text-[14px] text-[#f4f2f8] placeholder:text-zinc-400 outline-none"
                    placeholder={
                      lang === 'en'
                        ? 'At least 8 characters'
                        : 'อย่างน้อย 8 ตัวอักษร'
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 z-10 flex items-center pr-3.5 text-zinc-400 hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:text-violet-400"
                    aria-label={
                      showPassword
                        ? lang === 'en'
                          ? 'Hide password'
                          : 'ซ่อนรหัสผ่าน'
                        : lang === 'en'
                          ? 'Show password'
                          : 'แสดงรหัสผ่าน'
                    }
                  >
                    {showPassword ? (
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
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
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
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password Input */}
              <div className="space-y-1.5 text-left">
                <label
                  htmlFor="confirm-password"
                  className="block text-xs font-medium text-zinc-300"
                >
                  {lang === 'en' ? 'Confirm password' : 'ยืนยันรหัสผ่านใหม่'}
                </label>
                <div
                  className={`group relative flex items-center rounded-xl overflow-hidden bg-white/[0.04] hover:bg-white/[0.055] focus-within:bg-white/[0.06] border transition-all ${
                    errorMessage
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
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    id="confirm-password"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)
                      if (clientError) setClientError(null)
                    }}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    aria-required="true"
                    aria-invalid={errorMessage ? 'true' : undefined}
                    aria-describedby={
                      errorMessage ? 'reset-error-msg' : undefined
                    }
                    className="w-full h-12 bg-transparent rounded-xl pl-10.5 pr-11 text-[14px] text-[#f4f2f8] placeholder:text-zinc-400 outline-none"
                    placeholder={
                      lang === 'en'
                        ? 'Re-enter your new password'
                        : 'กรอกรหัสผ่านใหม่อีกครั้ง'
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 z-10 flex items-center pr-3.5 text-zinc-400 hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:text-violet-400"
                    aria-label={
                      showConfirmPassword
                        ? lang === 'en'
                          ? 'Hide password'
                          : 'ซ่อนรหัสผ่าน'
                        : lang === 'en'
                          ? 'Show password'
                          : 'แสดงรหัสผ่าน'
                    }
                  >
                    {showConfirmPassword ? (
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
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
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
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Password requirement hint */}
              <div className="flex items-center gap-2 text-[12px] text-zinc-400 pt-0.5">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={
                    password.length >= 8 ? 'text-emerald-400' : 'text-zinc-500'
                  }
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                <span>
                  {lang === 'en'
                    ? 'Password must be at least 8 characters'
                    : 'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร'}
                </span>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div
                  id="reset-error-msg"
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
                    {errorMessage ||
                      (lang === 'en'
                        ? 'Unable to update password. Please try again.'
                        : 'ไม่สามารถเปลี่ยนรหัสผ่านได้ กรุณาลองใหม่อีกครั้ง')}
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
                      {lang === 'en'
                        ? 'Updating password...'
                        : 'กำลังบันทึกรหัสผ่านใหม่...'}
                    </span>
                  </>
                ) : (
                  <span>
                    {lang === 'en'
                      ? 'Update password'
                      : 'บันทึกรหัสผ่านใหม่'}
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
