'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { register, type AuthActionState } from '@/app/actions/auth'
import { createClient } from '@/lib/supabase/client' // 1. นำเข้า Supabase Client

const initialState: AuthActionState = null

export default function RegisterForm() {
  const [state, formAction, pending] = useActionState(register, initialState)

  // 2. ฟังก์ชันจัดการล็อกอินด้วย Google
  const handleGoogleLogin = async () => {
    const supabase = createClient()
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // ตั้งค่าให้เด้งไปหน้า generator หลังจากล็อกอินสำเร็จ
          redirectTo: `${window.location.origin}/dashboard`,
        },
      })
      if (error) throw error
    } catch (error: unknown) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Google login error:', error instanceof Error ? error.message : error)
      }
    }
  }

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

        {/* --- ส่วนที่เพิ่มใหม่ 1: ปุ่ม Google Auth --- */}
        <button
          onClick={handleGoogleLogin}
          type="button"
          className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-semibold py-3 px-4 rounded-xl hover:bg-gray-100 transition-colors mb-6 shadow-sm"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          สมัครด้วย Google
        </button>

        {/* --- ส่วนที่เพิ่มใหม่ 2: เส้นคั่น --- */}
        <div className="relative flex items-center py-2 mb-6">
          <div className="flex-grow border-t border-gray-700"></div>
          <span className="flex-shrink-0 mx-4 text-gray-500 text-sm">หรือใช้อีเมล</span>
          <div className="flex-grow border-t border-gray-700"></div>
        </div>

        {/* ฟอร์มเดิมที่ทำงานผ่าน Server Actions */}
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