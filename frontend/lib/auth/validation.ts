const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type ValidationResult =
  | { ok: true; email: string; password: string; displayName?: string }
  | { ok: false; error: string }

export function validateEmailPassword(
  email: unknown,
  password: unknown
): ValidationResult {
  if (typeof email !== 'string' || typeof password !== 'string') {
    return { ok: false, error: 'Invalid email or password.' }
  }

  const trimmedEmail = email.trim().toLowerCase()
  if (!trimmedEmail || !EMAIL_RE.test(trimmedEmail)) {
    return { ok: false, error: 'Invalid email or password.' }
  }

  if (password.length < 8) {
    return {
      ok: false,
      error: 'Password must be at least 8 characters.',
    }
  }

  return { ok: true, email: trimmedEmail, password }
}

export function validateDisplayName(
  displayName: unknown
): { ok: true; displayName: string } | { ok: false; error: string } {
  if (typeof displayName !== 'string') {
    return { ok: false, error: 'Display name is invalid.' }
  }

  const trimmed = displayName.trim()
  if (trimmed.length < 1 || trimmed.length > 80) {
    return {
      ok: false,
      error: 'Display name must be between 1 and 80 characters.',
    }
  }

  return { ok: true, displayName: trimmed }
}

/** Only allow same-origin relative paths (block open redirects). */
export function safeNextPath(next: unknown, fallback = '/dashboard'): string {
  if (typeof next !== 'string' || !next.startsWith('/') || next.startsWith('//')) {
    return fallback
  }
  return next
}
