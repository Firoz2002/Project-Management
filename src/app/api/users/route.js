import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'
import { z } from 'zod'
import { hashPassword } from '@/lib/auth'

// ── GET /api/users ────────────────────────────────────────────
export async function GET(request) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const users = await prisma.user.findMany({
      where:   { isActive: true },
      select:  { id: true, name: true, email: true, role: true, initials: true, isActive: true },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('[GET /api/users]', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// ── POST /api/users (ADMIN only) ──────────────────────────────
const createSchema = z.object({
  name:     z.string().min(2).max(80),
  email:    z.string().email(),
  password: z.string().min(8),
  role:     z.enum(['ADMIN','MANAGER','DEVELOPER','DESIGNER','CONTENT','MARKETING','CONSULTANT']),
  initials: z.string().min(1).max(4),
})

export async function POST(request) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    if (auth.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden — Admin only' }, { status: 403 })

    const body   = await request.json()
    const parsed = createSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
    }

    const { password, ...data } = parsed.data
    const hashed = await hashPassword(password)

    const user = await prisma.user.create({
      data:   { ...data, password: hashed },
      select: { id: true, name: true, email: true, role: true, initials: true },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }
    console.error('[POST /api/users]', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
