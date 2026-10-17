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

  const handleGoogleLogin = async () => {
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
        },
      })
      if (error) throw error
    } catch (error: unknown) {
      if (process.env.NODE_ENV !== 'production') {
        console.error(
          'Google login error:',
          error instanceof Error ? error.message : error
        )
      }
    }
  }

  return (
    <AuthStudioShell mode="login">
      {(lang) => (
        <div>
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="next" value={next} />

            {/* Email Input with Leading Icon */}
            <div>
              <label
                htmlFor="email"
                className="block text-[11px] font-medium tracking-wide text-[#9a95ab] mb-1.5"
              >
                {lang === 'en' ? 'Email address' : 'อีเมล'}
              </label>
              <div className="group relative flex items-center rounded-xl bg-[#131022]/85 border border-white/[0.08] hover:border-white/[0.14] focus-within:border-[#8b5cf6]/70 focus-within:bg-[#17132b] focus-within:shadow-[0_6px_22px_-6px_rgba(139,92,246,0.28)] transition-all">
                <span className="pl-3.5 text-[#6b6779] group-focus-within:text-[#a78bfa] transition-colors pointer-events-none">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
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
                  className="w-full bg-transparent px-3 py-2.5 text-[13.5px] text-white placeholder:text-[#565268] outline-none"
                  placeholder={
                    lang === 'en' ? 'name@example.com' : 'กรอกอีเมลของคุณ'
                  }
                />
              </div>
            </div>

            {/* Password Input with Leading Lock Icon & Eye Toggle */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-[11px] font-medium tracking-wide text-[#9a95ab]"
                >
                  {lang === 'en' ? 'Password' : 'รหัสผ่าน'}
                </label>
              </div>
              <div className="group relative flex items-center rounded-xl bg-[#131022]/85 border border-white/[0.08] hover:border-white/[0.14] focus-within:border-[#8b5cf6]/70 focus-within:bg-[#17132b] focus-within:shadow-[0_6px_22px_-6px_rgba(139,92,246,0.28)] transition-all">
                <span className="pl-3.5 text-[#6b6779] group-focus-within:text-[#a78bfa] transition-colors pointer-events-none">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
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
                  className="w-full bg-transparent pl-3 pr-10 py-2.5 text-[13.5px] text-white placeholder:text-[#565268] outline-none"
                  placeholder={
                    lang === 'en' ? 'Enter your password' : 'กรอกรหัสผ่านของคุณ'
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#6b6779] hover:text-white transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {(state?.error || callbackError) && (
              <div className="text-red-300 text-xs bg-red-500/10 px-3.5 py-2.5 rounded-xl border border-red-500/20">
                {state?.error ||
                  (lang === 'en'
                    ? 'Unable to complete sign-in. Please try again.'
                    : 'ไม่สามารถเข้าสู่ระบบได้ กรุณาลองใหม่อีกครั้ง')}
              </div>
            )}

            {/* Primary CTA Button with Diffused Underglow matching Reference 1 */}
            <div className="pt-1.5">
              <button
                type="submit"
                disabled={pending}
                className={`relative w-full py-3 px-4 rounded-xl text-[13.5px] font-semibold tracking-wide text-white transition-all border border-purple-300/25 shadow-[0_10px_28px_-6px_rgba(139,92,246,0.55),0_4px_12px_rgba(109,40,217,0.35)] ${
                  pending
                    ? 'bg-[#6d28d9]/50 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#8b5cf6] via-[#7c3aed] to-[#6d28d9] hover:from-[#9333ea] hover:via-[#8b5cf6] hover:to-[#7c3aed] hover:shadow-[0_12px_32px_-4px_rgba(139,92,246,0.7)] active:scale-[0.99] cursor-pointer'
                }`}
              >
                {pending
                  ? lang === 'en'
                    ? 'Signing in...'
                    : 'กำลังเข้าสู่ระบบ...'
                  : lang === 'en'
                    ? 'Get started'
                    : 'เข้าสู่ระบบ'}
              </button>
            </div>
          </form>

          {/* Center-Node Divider matching Reference 1 */}
          <div className="flex items-center gap-3 my-6">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/[0.09] to-white/[0.12]" />
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-white/[0.08] bg-[#120f20]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8b5cf6]/70" />
              <span className="font-mono text-[9.5px] uppercase tracking-widest text-[#7c7691]">
                {lang === 'en' ? 'or' : 'หรือ'}
              </span>
            </div>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent via-white/[0.09] to-white/[0.12]" />
          </div>

          {/* Google OAuth Button */}
          <button
            onClick={handleGoogleLogin}
            type="button"
            className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-[#131022]/90 hover:bg-[#1b1730] border border-white/[0.09] hover:border-white/[0.18] py-2.5 px-4 text-[13px] font-medium text-[#e4e1ec] hover:text-white transition-all active:scale-[0.99] cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
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
            <span>
              {lang === 'en' ? 'Continue with Google' : 'ดำเนินการต่อด้วย Google'}
            </span>
          </button>

          <p className="mt-6 text-center text-xs text-[#7c7691]">
            {lang === 'en' ? "Don't have an account?" : 'ยังไม่มีบัญชีใช่ไหม?'}{' '}
            <Link
              href={
                next && next !== '/my-video'
                  ? `/register?next=${encodeURIComponent(next)}`
                  : '/register'
              }
              className="text-white hover:text-[#c4b5fd] font-semibold transition-colors"
            >
              {lang === 'en' ? 'Sign up' : 'สมัครสมาชิก'}
            </Link>
          </p>
        </div>
      )}
    </AuthStudioShell>
  )
}
