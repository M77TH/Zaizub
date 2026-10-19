'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { toUserFacingAuthError } from '@/lib/auth/errors'
import {
  safeNextPath,
  validateDisplayName,
  validateEmailPassword,
} from '@/lib/auth/validation'

export type AuthActionState =
  | { error: string; success?: undefined }
  | { success: true; message?: string; error?: undefined }
  | null

async function getEmailRedirectTo(nextPath?: string) {
  const headerStore = await headers()
  const origin = headerStore.get('origin')

  const buildUrl = (base: string) => {
    const url = new URL('/auth/callback', base)
    if (nextPath) {
      url.searchParams.set('next', nextPath)
    }
    return url.toString()
  }

  if (origin) {
    return buildUrl(origin)
  }

  const host = headerStore.get('x-forwarded-host') || headerStore.get('host')
  const proto = headerStore.get('x-forwarded-proto') || 'http'
  if (host) {
    return buildUrl(`${proto}://${host}`)
  }

  const fallback =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
    'http://localhost:3000'
  return buildUrl(fallback)
}

export async function login(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = validateEmailPassword(
    formData.get('email'),
    formData.get('password')
  )
  if (!parsed.ok) {
    return { error: parsed.error }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.email,
    password: parsed.password,
  })

  if (error) {
    return { error: toUserFacingAuthError(error) }
  }

  redirect(safeNextPath(formData.get('next')))
}

export async function register(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = validateEmailPassword(
    formData.get('email'),
    formData.get('password')
  )
  if (!parsed.ok) {
    return { error: parsed.error }
  }

  const displayNameRaw = formData.get('displayName')
  let displayName: string | undefined
  if (typeof displayNameRaw === 'string' && displayNameRaw.trim()) {
    const nameResult = validateDisplayName(displayNameRaw)
    if (!nameResult.ok) {
      return { error: nameResult.error }
    }
    displayName = nameResult.displayName
  }

  const supabase = await createClient()
  const emailRedirectTo = await getEmailRedirectTo()

  const { data, error } = await supabase.auth.signUp({
    email: parsed.email,
    password: parsed.password,
    options: {
      emailRedirectTo,
      data: displayName ? { display_name: displayName } : undefined,
    },
  })

  if (error) {
    return { error: toUserFacingAuthError(error) }
  }

  // Email confirmation enabled: no session until user confirms.
  if (!data.session) {
    return {
      success: true,
      message: 'Check your email to confirm your account before signing in.',
    }
  }

  redirect('/my-video')
}

export async function logout(): Promise<never> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function updateProfile(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const nameResult = validateDisplayName(formData.get('displayName'))
  if (!nameResult.ok) {
    return { error: nameResult.error }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be signed in to update your profile.' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: nameResult.displayName,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) {
    return { error: 'Unable to update profile. Please try again.' }
  }

  return { success: true, message: 'Profile updated.' }
}

export async function resetPassword(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const emailRaw = formData.get('email')
  if (typeof emailRaw !== 'string' || !emailRaw.trim()) {
    return { error: 'Please enter your email address.' }
  }
  const email = emailRaw.trim().toLowerCase()
  const supabase = await createClient()
  const emailRedirectTo = await getEmailRedirectTo('/reset-password')

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: emailRedirectTo,
  })

  if (error) {
    return { error: toUserFacingAuthError(error) }
  }

  return {
    success: true,
    message: 'Check your email for the password reset instructions.',
  }
}

export async function updatePassword(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const passwordRaw = formData.get('password')
  const confirmPasswordRaw = formData.get('confirmPassword')

  if (typeof passwordRaw !== 'string' || !passwordRaw) {
    return { error: 'Please enter your new password.' }
  }

  if (passwordRaw.length < 8) {
    return { error: 'Password must be at least 8 characters.' }
  }

  if (typeof confirmPasswordRaw !== 'string' || !confirmPasswordRaw) {
    return { error: 'Please confirm your new password.' }
  }

  if (passwordRaw !== confirmPasswordRaw) {
    return { error: 'Passwords do not match.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return {
      error:
        'Your password reset session has expired. Please request a new link.',
    }
  }

  const { error } = await supabase.auth.updateUser({
    password: passwordRaw,
  })

  if (error) {
    return { error: toUserFacingAuthError(error) }
  }

  return {
    success: true,
    message: 'Your password has been successfully updated.',
  }
}
