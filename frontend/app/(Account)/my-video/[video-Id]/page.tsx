import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function MyVideoPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/dashboard')
  }

  return (
    <main className="min-h-screen bg-[#050505] text-gray-200 flex items-center justify-center px-6">
      <p className="text-gray-400">Video detail coming soon.</p>
    </main>
  )
}
