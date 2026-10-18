'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { login, type AuthActionState } from '@/app/actions/auth'
import { createClient } from '@/lib/supabase/client'
import AuthStudioShell from '@/components/auth/AuthStudioShell'

const initialState: AuthActionState = null

export default function LoginForm() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/my-video'
  const callbackError = searchParams.get('error')
  const [state, formAction, pending] = useActionState(login, initialState)
  const [showPassword, setShowPassword] = useState(false)
  const [googlePending, setGooglePending] = useState(false)

  const handleGoogleLogin = async () => {
    if (googlePending) return
    setGooglePending(true)
    const supabase = createClient()
    try {
      const redirectTo = new URL('/auth/callback', window.location.origin)
      if (next) {
        redirectTo.searchParams.set('next', next)
      }
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo.toString(),
          queryParams: {
            prompt: 'select_account',
          },
        },
      })
      if (error) throw error
    } catch (error: unknown) {
      setGooglePending(false)
      if (process.env.NODE_ENV !== 'production') {
        console.error(
          'Google login error:',
          error instanceof Error ? error.message : error
        )
      }
    }
  }

  const hasError = Boolean(state?.error || callbackError)

  return (
    <AuthStudioShell mode="login">
      {(lang) => (
        <div>
          <form action={formAction} className="space-y-3.5" noValidate={false}>
            <input type="hidden" name="next" value={next} />

            {/* Email Input */}
            <div className="space-y-1.5 text-left">
              <label
                htmlFor="email"
                className="block text-xs font-medium text-zinc-300"
              >
                {lang === 'en' ? 'Email' : 'อีเมล'}
              </label>
              <div
                className={`group relative flex items-center rounded-xl bg-white/[0.04] hover:bg-white/[0.055] focus-within:bg-white/[0.06] border transition-all ${
                  hasError
                    ? 'border-red-500/60 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-500/25'
                    : 'border-white/[0.1] hover:border-white/[0.18] focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/30'
                }`}
              >
                <span className="pl-4 text-zinc-400 group-focus-within:text-violet-400 transition-colors pointer-events-none flex items-center">
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
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  aria-required="true"
                  aria-invalid={hasError ? 'true' : undefined}
                  aria-describedby={hasError ? 'auth-error-msg' : undefined}
                  className="w-full h-12 bg-transparent px-3.5 text-[14px] text-[#f4f2f8] placeholder:text-zinc-400 outline-none"
                  placeholder={
                    lang === 'en' ? 'name@example.com' : 'อีเมลของคุณ'
                  }
                />
              </div>
            </div>

            {/* Password Input & Forgot Password Link */}
            <div className="space-y-1.5 text-left">
              <label
                htmlFor="password"
                className="block text-xs font-medium text-zinc-300"
              >
                {lang === 'en' ? 'Password' : 'รหัสผ่าน'}
              </label>
              <div
                className={`group relative flex items-center rounded-xl bg-white/[0.04] hover:bg-white/[0.055] focus-within:bg-white/[0.06] border transition-all ${
                  hasError
                    ? 'border-red-500/60 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-500/25'
                    : 'border-white/[0.1] hover:border-white/[0.18] focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/30'
                }`}
              >
                <span className="pl-4 text-zinc-400 group-focus-within:text-violet-400 transition-colors pointer-events-none flex items-center">
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
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  minLength={8}
                  aria-required="true"
                  aria-invalid={hasError ? 'true' : undefined}
                  aria-describedby={hasError ? 'auth-error-msg' : undefined}
                  className="w-full h-12 bg-transparent pl-3.5 pr-11 text-[14px] text-[#f4f2f8] placeholder:text-zinc-400 outline-none"
                  placeholder={
                    lang === 'en'
                      ? 'Enter your password'
                      : 'กรอกรหัสผ่านของคุณ'
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-zinc-400 hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:text-violet-400"
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

              {/* Forgot Password Link (Directly below password input) */}
              <div className="flex justify-end pt-1">
                <Link
                  href="/forgot-password"
                  className="text-xs text-zinc-400 hover:text-violet-400 transition-colors focus-visible:outline-none focus-visible:underline focus-visible:text-violet-400"
                >
                  {lang === 'en' ? 'Forgot password?' : 'ลืมรหัสผ่านใช่ไหม?'}
                </Link>
              </div>
            </div>

            {hasError && (
              <div
                id="auth-error-msg"
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
                    (lang === 'en'
                      ? 'Unable to complete sign-in. Please try again.'
                      : 'ไม่สามารถเข้าสู่ระบบได้ กรุณาลองใหม่อีกครั้ง')}
                </span>
              </div>
            )}

            {/* Primary Sign In Button */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={pending || googlePending}
                className={`relative w-full h-12 px-4 rounded-xl text-[14px] font-semibold text-white transition-all border border-purple-300/25 shadow-[0_1px_2px_rgba(0,0,0,0.4),0_0_24px_rgba(139,92,246,0.22),inset_0_1px_0_rgba(255,255,255,0.22)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07060a] ${
                  pending
                    ? 'bg-[#6d28d9]/50 cursor-not-allowed'
                    : 'bg-gradient-to-b from-[#8b5cf6] to-[#6d28d9] hover:from-[#9366f9] hover:to-[#7c3aed] active:scale-[0.99] cursor-pointer'
                }`}
              >
                {pending ? (
                  <span className="inline-flex items-center gap-2">
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
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                    <span>
                      {lang === 'en' ? 'Signing in...' : 'กำลังเข้าสู่ระบบ...'}
                    </span>
                  </span>
                ) : lang === 'en' ? (
                  'Sign in'
                ) : (
                  'เข้าสู่ระบบ'
                )}
              </button>
            </div>
          </form>

          {/* Hairline Divider */}
          <div className="flex items-center gap-3.5 my-6">
            <div className="h-px flex-1 bg-white/[0.08]" />
            <span className="text-xs text-zinc-400 uppercase tracking-wider font-mono">
              {lang === 'en' ? 'or' : 'หรือ'}
            </span>
            <div className="h-px flex-1 bg-white/[0.08]" />
          </div>

          {/* Google OAuth Button */}
          <button
            onClick={handleGoogleLogin}
            type="button"
            disabled={pending || googlePending}
            className={`w-full h-12 flex items-center justify-center gap-3 rounded-xl bg-white/[0.045] hover:bg-white/[0.08] border border-white/[0.1] hover:border-white/[0.18] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] px-4 text-[14px] font-medium text-[#f4f2f8] transition-all active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07060a] ${
              googlePending
                ? 'opacity-70 cursor-wait'
                : 'cursor-pointer'
            }`}
          >
            {googlePending ? (
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
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
            ) : (
              <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            <span>
              {googlePending
                ? lang === 'en'
                  ? 'Connecting to Google...'
                  : 'กำลังเชื่อมต่อ Google...'
                : lang === 'en'
                  ? 'Continue with Google'
                  : 'ดำเนินการต่อด้วย Google'}
            </span>
          </button>

          {/* Single Clean Account Switch Prompt */}
          <p className="mt-6 text-center text-[13px] text-zinc-400">
            {lang === 'en' ? "Don't have an account?" : 'ยังไม่มีบัญชีใช่ไหม?'}{' '}
            <Link
              href={
                next && next !== '/my-video'
                  ? `/register?next=${encodeURIComponent(next)}`
                  : '/register'
              }
              className="text-[#f4f2f8] hover:text-violet-400 font-medium transition-colors focus-visible:outline-none focus-visible:underline"
            >
              {lang === 'en' ? 'Sign up' : 'สมัครสมาชิก'}
            </Link>
          </p>
        </div>
      )}
    </AuthStudioShell>
  )
}
