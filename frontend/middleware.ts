import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const protectedPaths = ['/dashboard', '/profile']
const authPaths = ['/login', '/register', '/signup']

export async function middleware(request: NextRequest) {
  const { user, supabaseResponse } = await updateSession(request)
  const { pathname } = request.nextUrl

  const isProtected = protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  )
  const isAuthPage = authPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  )

  if (isProtected && !user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthPage && user) {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = '/dashboard'
    dashboardUrl.search = ''
    return NextResponse.redirect(dashboardUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
    '/login',
    '/register',
    '/signup',
  ],
}
