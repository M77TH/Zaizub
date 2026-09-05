import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const protectedPaths = ['/profile', '/my-video', '/editor']
const authPaths = ['/login', '/register', '/signup']

export async function proxy(request: NextRequest) {
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
    const myVideoUrl = request.nextUrl.clone()
    myVideoUrl.pathname = '/my-video'
    myVideoUrl.search = ''
    return NextResponse.redirect(myVideoUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/profile/:path*',
    '/my-video/:path*',
    '/editor/:path*',
    '/login',
    '/register',
    '/signup',
  ],
}
