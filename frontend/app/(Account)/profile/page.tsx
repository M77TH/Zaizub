import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/actions/auth'
import ProfileForm from './profile-form'

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/profile')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .maybeSingle()

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-gray-200">
      <div className="relative z-10 max-w-3xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between gap-4 mb-10">
          <div>
            <p className="text-sm text-purple-300 mb-2">Profile</p>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              โปรไฟล์ของคุณ
            </h1>
            <p className="text-gray-400 mt-2">{user.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/my-video"
              className="px-4 py-2 text-sm font-medium text-white bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
            >
              My Videos
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
              >
                ออกจากระบบ
              </button>
            </form>
          </div>
        </div>

        <ProfileForm displayName={profile?.display_name ?? ''} />
      </div>
    </main>
  )
}
