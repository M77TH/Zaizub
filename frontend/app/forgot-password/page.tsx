import { Suspense } from 'react'
import ForgotPasswordForm from './forgot-password-form'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#07060a] flex items-center justify-center text-ink-muted text-sm">
          Loading...
        </div>
      }
    >
      <ForgotPasswordForm />
    </Suspense>
  )
}
