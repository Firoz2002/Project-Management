// ─────────────────────────────────────────────────────────────
// Authentication Utilities
// JWT via jose (Edge-runtime compatible)
// Passwords via bcryptjs
// ─────────────────────────────────────────────────────────────

import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'

const getSecret = () => {
  const s = process.env.JWT_SECRET
  if (!s) throw new Error('JWT_SECRET is not set in environment variables')
  return new TextEncoder().encode(s)
}

const EXPIRY = process.env.JWT_EXPIRY || '7d'

// ── Password ─────────────────────────────────────────────────

export async function hashPassword(plain) {
  return bcrypt.hash(plain, 12)
}

export async function verifyPassword(plain, hashed) {
  return bcrypt.compare(plain, hashed)
}

// ── JWT ───────────────────────────────────────────────────────

export async function signToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(getSecret())
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload
  } catch {
    return null
  }
}

// ── Request Auth Extraction ───────────────────────────────────
// Reads token from:
//   1. Authorization: Bearer <token> header (API calls from browser)
//   2. pm_token cookie (page navigation checked by middleware)

export async function verifyAuth(request) {
  // Try Authorization header first
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    const payload = await verifyToken(token)
    if (payload) return payload
  }

  // Try cookie fallback
  const cookieToken = request.cookies.get('pm_token')?.value
  if (cookieToken) {
    return verifyToken(cookieToken)
  }

  return null
}
