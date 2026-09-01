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

async function getEmailRedirectTo() {
  const headerStore = await headers()
  const origin = headerStore.get('origin')
  if (origin) {
    return `${origin}/auth/callback`
  }

  const host = headerStore.get('x-forwarded-host') || headerStore.get('host')
  const proto = headerStore.get('x-forwarded-proto') || 'http'
  if (host) {
    return `${proto}://${host}/auth/callback`
  }

  const fallback =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
    'http://localhost:3000'
  return `${fallback}/auth/callback`
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

  redirect('/dashboard')
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
