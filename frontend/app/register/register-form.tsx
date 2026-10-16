'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { register, type AuthActionState } from '@/app/actions/auth'
import { createClient } from '@/lib/supabase/client'
import AuthStudioShell from '@/components/auth/AuthStudioShell'

const initialState: AuthActionState = null

export default function RegisterForm() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/my-video'
  const [state, formAction, pending] = useActionState(register, initialState)
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
    <AuthStudioShell mode="register">
      {(lang) => (
        <div>
          <form action={formAction} className="space-y-3.5">
            <div>
              <label
                htmlFor="displayName"
                className="block text-xs font-medium text-[#d4d0e0] mb-1.5"
              >
                {lang === 'en'
                  ? 'Display name (optional)'
                  : 'ชื่อที่แสดง (ไม่บังคับ)'}
              </label>
              <input
                id="displayName"
                name="displayName"
                type="text"
                autoComplete="nickname"
                maxLength={80}
                className="w-full rounded-xl bg-[#151324]/90 border border-white/[0.09] px-3.5 py-2.5 text-sm text-white placeholder:text-[#5e5a6e] outline-none transition-all focus:border-[#8b5cf6] focus:bg-[#18152b] focus:ring-2 focus:ring-[#8b5cf6]/20"
                placeholder={
                  lang === 'en' ? 'Your creator name' : 'ชื่อของคุณ'
                }
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-[#d4d0e0] mb-1.5"
              >
                {lang === 'en' ? 'Email' : 'อีเมล'}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full rounded-xl bg-[#151324]/90 border border-white/[0.09] px-3.5 py-2.5 text-sm text-white placeholder:text-[#5e5a6e] outline-none transition-all focus:border-[#8b5cf6] focus:bg-[#18152b] focus:ring-2 focus:ring-[#8b5cf6]/20"
                placeholder={
                  lang === 'en' ? 'Your email address' : 'กรอกอีเมลของคุณ'
                }
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-[#d4d0e0] mb-1.5"
              >
                {lang === 'en' ? 'Password' : 'รหัสผ่าน'}
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  className="w-full rounded-xl bg-[#151324]/90 border border-white/[0.09] pl-3.5 pr-10 py-2.5 text-sm text-white placeholder:text-[#5e5a6e] outline-none transition-all focus:border-[#8b5cf6] focus:bg-[#18152b] focus:ring-2 focus:ring-[#8b5cf6]/20"
                  placeholder={
                    lang === 'en'
                      ? 'At least 8 characters'
                      : 'อย่างน้อย 8 ตัวอักษร'
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#6b6779] hover:text-white transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
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
                      strokeWidth="2"
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

            {state?.error && (
              <div className="text-red-300 text-xs bg-red-500/10 px-3.5 py-2.5 rounded-xl border border-red-500/20">
                {state.error}
              </div>
            )}

            {state?.success && state.message && (
              <div className="text-emerald-300 text-xs bg-emerald-500/10 px-3.5 py-2.5 rounded-xl border border-emerald-500/20">
                {state.message}
              </div>
            )}

            <button
              type="submit"
              disabled={pending}
              className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white transition-all border border-purple-400/30 shadow-[0_4px_20px_rgba(124,58,237,0.38)] ${
                pending
                  ? 'bg-[#6d28d9]/50 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#8b5cf6] via-[#7c3aed] to-[#6d28d9] hover:from-[#9333ea] hover:to-[#7c3aed] hover:shadow-[0_4px_26px_rgba(139,92,246,0.55)] active:scale-[0.99] cursor-pointer'
              }`}
            >
              {pending
                ? lang === 'en'
                  ? 'Creating account...'
                  : 'กำลังสร้างบัญชี...'
                : lang === 'en'
                  ? 'Create account'
                  : 'สมัครสมาชิก'}
            </button>
          </form>

          {/* OR Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="h-px flex-1 bg-white/[0.07]" />
            <span className="font-mono text-[10.5px] uppercase tracking-widest text-[#6b6779]">
              {lang === 'en' ? 'OR' : 'หรือ'}
            </span>
            <div className="h-px flex-1 bg-white/[0.07]" />
          </div>

          {/* Google OAuth Button */}
          <button
            onClick={handleGoogleLogin}
            type="button"
            className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-[#141222]/90 hover:bg-[#1c192e] border border-white/[0.1] hover:border-white/[0.18] py-2.5 px-4 text-sm font-medium text-white transition-all active:scale-[0.99] cursor-pointer"
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

          <p className="mt-5 text-center text-xs text-[#8e899e]">
            {lang === 'en' ? 'Already have an account?' : 'มีบัญชีอยู่แล้วใช่ไหม?'}{' '}
            <Link
              href={
                next && next !== '/my-video'
                  ? `/login?next=${encodeURIComponent(next)}`
                  : '/login'
              }
              className="text-white hover:text-purple-300 font-semibold transition-colors"
            >
              {lang === 'en' ? 'Sign in' : 'เข้าสู่ระบบ'}
            </Link>
          </p>
        </div>
      )}
    </AuthStudioShell>
  )
}