const AUTH_ERROR_MAP: Record<string, string> = {
  invalid_credentials: 'Invalid email or password.',
  invalid_grant: 'Invalid email or password.',
  user_already_exists: 'Unable to create account.',
  email_exists: 'Unable to create account.',
  weak_password: 'Password must be at least 8 characters.',
  over_request_rate_limit: 'Too many attempts. Please try again later.',
  over_email_send_rate_limit: 'Too many attempts. Please try again later.',
  signup_disabled: 'Unable to create account.',
  email_not_confirmed: 'Please confirm your email before signing in.',
}

const MESSAGE_HINTS: Array<{ match: RegExp; message: string }> = [
  {
    match: /invalid login credentials|invalid email or password/i,
    message: 'Invalid email or password.',
  },
  {
    match: /user already registered|already been registered/i,
    message: 'Unable to create account.',
  },
  {
    match: /email not confirmed/i,
    message: 'Please confirm your email before signing in.',
  },
  {
    match: /password/i,
    message: 'Password must be at least 8 characters.',
  },
]

const DEFAULT_ERROR = 'Something went wrong. Please try again.'

export function toUserFacingAuthError(error: {
  code?: string
  message?: string
} | null): string {
  if (!error) return DEFAULT_ERROR

  if (error.code && AUTH_ERROR_MAP[error.code]) {
    return AUTH_ERROR_MAP[error.code]
  }

  if (error.message) {
    for (const hint of MESSAGE_HINTS) {
      if (hint.match.test(error.message)) {
        return hint.message
      }
    }
  }

  return DEFAULT_ERROR
}
