import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/actions/auth'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/dashboard')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .maybeSingle()

  const displayName = profile?.display_name || user.email

  return (
    <main className="min-h-screen bg-[#050505] text-gray-200">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[400px] bg-purple-900/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between gap-4 mb-10">
          <div>
            <p className="text-sm text-purple-300 mb-2">Dashboard</p>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              สวัสดี, {displayName}
            </h1>
            <p className="text-gray-400 mt-2">{user.email}</p>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
            >
              ออกจากระบบ
            </button>
          </form>
        </div>

        <div className="space-y-4">
          <p className="text-gray-400">
            คุณเข้าสู่ระบบแล้ว เซสชันถูกเก็บในคุกกี้และตรวจสอบฝั่งเซิร์ฟเวอร์
          </p>
          <Link
            href="/profile"
            className="inline-flex px-5 py-3 text-sm font-semibold text-white bg-purple-600 rounded-xl hover:bg-purple-500 transition-colors"
          >
            ไปที่โปรไฟล์
          </Link>
        </div>
      </div>
    </main>
  )
}
