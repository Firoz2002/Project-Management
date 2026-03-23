import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'

export async function GET(request) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where:  { id: auth.sub },
      select: { id: true, name: true, email: true, role: true, initials: true, isActive: true },
    })

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    return NextResponse.json(user)
  } catch (error) {
    console.error('[GET /api/auth/me]', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
