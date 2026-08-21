'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { register, type AuthActionState } from '@/app/actions/auth'

const initialState: AuthActionState = null

export default function RegisterForm() {
  const [state, formAction, pending] = useActionState(register, initialState)

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 selection:bg-purple-500/30">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg h-[500px] bg-purple-900/20 blur-[120px] rounded-full pointer-events-none -z-0" />

      <div className="w-full max-w-md bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-8 relative z-10 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
            สร้างบัญชีใหม่
          </h1>
          <p className="text-gray-400">เริ่มต้นใช้งาน AI Subtitles ได้ฟรี</p>
        </div>

        <form action={formAction} className="space-y-4">
          <div>
            <label
              htmlFor="displayName"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              ชื่อที่แสดง (ไม่บังคับ)
            </label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              autoComplete="nickname"
              maxLength={80}
              className="w-full bg-[#0a0a0a] border border-gray-700 text-white rounded-xl px-4 py-3 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
              placeholder="ชื่อของคุณ"
            />
          </div>

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
              autoComplete="new-password"
              required
              minLength={8}
              className="w-full bg-[#0a0a0a] border border-gray-700 text-white rounded-xl px-4 py-3 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
              placeholder="อย่างน้อย 8 ตัวอักษร"
            />
          </div>

          {state?.error && (
            <div className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20">
              {state.error}
            </div>
          )}

          {state?.success && state.message && (
            <div className="text-green-400 text-sm bg-green-400/10 p-3 rounded-lg border border-green-400/20">
              {state.message}
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
            {pending ? 'กำลังสร้างบัญชี...' : 'สมัครสมาชิก'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-400">
          มีบัญชีอยู่แล้วใช่ไหม?{' '}
          <Link
            href="/login"
            className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
          >
            เข้าสู่ระบบเลย
          </Link>
        </p>
      </div>
    </div>
  )
}
