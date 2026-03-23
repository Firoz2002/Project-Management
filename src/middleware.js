import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

// 1. Added register paths here
const PUBLIC_PATHS = ['/login', '/register', '/api/auth/login', '/api/auth/register']

function getSecret() {
  const s = process.env.JWT_SECRET
  if (!s) throw new Error('JWT_SECRET is not configured')
  return new TextEncoder().encode(s)
}

export async function middleware(request) {
  const { pathname } = request.nextUrl

  // Allow public paths and static assets
  if (
    PUBLIC_PATHS.some(p => pathname.startsWith(p)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next()
  }

  // Get token from Header or Cookie
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7)
    : request.cookies.get('pm_token')?.value

  // ── API Routes: check Authorization header ────────────────
  if (pathname.startsWith('/api/')) {
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      await jwtVerify(token, getSecret())
      return NextResponse.next()
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
  }

  // ── Page Routes: check cookie ─────────────────────────────
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    await jwtVerify(token, getSecret())
    return NextResponse.next()
  } catch (err) {
    // If token is invalid, clear cookie and send to login
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('pm_token')
    return response
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}