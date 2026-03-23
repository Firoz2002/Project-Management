// ─────────────────────────────────────────────────────────────
// Next.js Middleware — Route Protection
// Runs at the edge before every request
// ─────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const PUBLIC_PATHS = ['/login', '/api/auth/login']

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

  // ── API Routes: check Authorization header ────────────────
  if (pathname.startsWith('/api/')) {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : request.cookies.get('pm_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorised — no token provided' }, { status: 401 })
    }

    try {
      await jwtVerify(token, getSecret())
      return NextResponse.next()
    } catch {
      return NextResponse.json({ error: 'Unauthorised — invalid or expired token' }, { status: 401 })
    }
  }

  // ── Page Routes: check cookie ─────────────────────────────
  const token = request.cookies.get('pm_token')?.value

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    await jwtVerify(token, getSecret())
    return NextResponse.next()
  } catch {
    const res = NextResponse.redirect(new URL('/login', request.url))
    res.cookies.delete('pm_token')
    return res
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
