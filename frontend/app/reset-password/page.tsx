import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import ResetPasswordForm from './reset-password-form'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ResetPasswordPage() {
  let initialUser: { email: string } | null = null

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      initialUser = { email: user.email ?? '' }
    }
  } catch {
    // If server session check fails, ResetPasswordForm checks client-side token/hash
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#07060a] flex items-center justify-center text-zinc-400 text-sm">
          Loading...
        </div>
      }
    >
      <ResetPasswordForm initialUser={initialUser} />
    </Suspense>
  )
}
