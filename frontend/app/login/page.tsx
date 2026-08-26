import { Suspense } from 'react'
import LoginForm from './login-form'

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#050505] flex items-center justify-center text-gray-400">
          Loading...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
