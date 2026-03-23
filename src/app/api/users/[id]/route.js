import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'
import { z } from 'zod'

const updateSchema = z.object({
  name:     z.string().min(2).max(80).optional(),
  role:     z.enum(['ADMIN','MANAGER','DEVELOPER','DESIGNER','CONTENT','MARKETING','CONSULTANT']).optional(),
  initials: z.string().min(1).max(4).optional(),
  isActive: z.boolean().optional(),
})

// ── GET /api/users/:id ────────────────────────────────────────
export async function GET(request, { params }) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where:  { id: params.id },
      select: { id: true, name: true, email: true, role: true, initials: true, isActive: true, createdAt: true },
    })

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    return NextResponse.json(user)
  } catch (error) {
    console.error('[GET /api/users/:id]', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// ── PUT /api/users/:id (ADMIN only) ──────────────────────────
export async function PUT(request, { params }) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    if (auth.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body   = await request.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
    }

    const user = await prisma.user.update({
      where:  { id: params.id },
      data:   parsed.data,
      select: { id: true, name: true, email: true, role: true, initials: true, isActive: true },
    })

    return NextResponse.json(user)
  } catch (error) {
    if (error.code === 'P2025') return NextResponse.json({ error: 'User not found' }, { status: 404 })
    console.error('[PUT /api/users/:id]', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
