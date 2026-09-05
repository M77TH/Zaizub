'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { login, type AuthActionState } from '@/app/actions/auth'

const initialState: AuthActionState = null

export default function LoginForm() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/my-video'
  const callbackError = searchParams.get('error')
  const [state, formAction, pending] = useActionState(login, initialState)

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 selection:bg-purple-500/30">
      <div className="w-full max-w-md bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-8 relative z-10 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
            เข้าสู่ระบบ
          </h1>
          <p className="text-gray-400">ยินดีต้อนรับกลับสู่ ZaiZub</p>
        </div>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="next" value={next} />

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              อีเมล
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full bg-[#0a0a0a] border border-gray-700 text-white rounded-xl px-4 py-3 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              รหัสผ่าน
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={8}
              className="w-full bg-[#0a0a0a] border border-gray-700 text-white rounded-xl px-4 py-3 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
              placeholder="••••••••"
            />
          </div>

          {(state?.error || callbackError) && (
            <div className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20">
              {state?.error ||
                'Unable to complete sign-in. Please try again.'}
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            className={`w-full py-3 rounded-xl text-white font-semibold transition-all shadow-[0_0_15px_rgba(147,51,234,0.3)] ${
              pending
                ? 'bg-purple-600/50 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-500 hover:shadow-[0_0_25px_rgba(147,51,234,0.5)]'
            }`}
          >
            {pending ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-400">
          ยังไม่มีบัญชี?{' '}
          <Link
            href="/register"
            className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
          >
            สมัครสมาชิก
          </Link>
        </p>
      </div>
    </div>
  )
}
