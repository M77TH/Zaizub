import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const authError = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  const nextParam = searchParams.get('next')

  const next =
    nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//')
      ? nextParam
      : '/my-video'

  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https'
  const redirectOrigin = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : origin

  // Handle direct auth errors from provider or Supabase (e.g. expired link)
  if (authError) {
    const errorMsg =
      errorDescription ||
      (authError === 'access_denied'
        ? 'Reset link is invalid or has expired. Please request a new one.'
        : authError)

    if (next === '/reset-password') {
      return NextResponse.redirect(
        `${redirectOrigin}/forgot-password?error=${encodeURIComponent(errorMsg)}`
      )
    }
    return NextResponse.redirect(
      `${redirectOrigin}/login?error=${encodeURIComponent(errorMsg)}`
    )
  }

  const supabase = await createClient()

  // 1. PKCE flow with code
  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    if (!exchangeError) {
      return NextResponse.redirect(`${redirectOrigin}${next}`)
    }

    if (next === '/reset-password') {
      return NextResponse.redirect(
        `${redirectOrigin}/forgot-password?error=${encodeURIComponent(
          'Your reset link has expired or is invalid. Please request a new one.'
        )}`
      )
    }
  }

  // 2. Email OTP / token_hash flow
  if (token_hash && type) {
    const { error: verifyError } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    if (!verifyError) {
      return NextResponse.redirect(`${redirectOrigin}${next}`)
    }

    if (next === '/reset-password') {
      return NextResponse.redirect(
        `${redirectOrigin}/forgot-password?error=${encodeURIComponent(
          'Your reset link has expired or is invalid. Please request a new one.'
        )}`
      )
    }
  }

  return NextResponse.redirect(`${redirectOrigin}/login?error=auth_callback`)
}
