import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, signToken } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
})

export async function POST(request) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid email or password format' },
        { status: 400 }
      )
    }

    const { email, password } = parsed.data

    const user = await prisma.user.findUnique({
      where: { email: email },
      select: { id: true, name: true, email: true, password: true, role: true, initials: true, isActive: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const valid = await verifyPassword(password, user.password)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const token = await signToken({
      sub:      user.id,
      name:     user.name,
      email:    user.email,
      role:     user.role,
      initials: user.initials,
    })

    const { password: _pw, ...safeUser } = user

    const response = NextResponse.json({ token, user: safeUser }, { status: 200 })

    // Set httpOnly cookie for middleware checks
    response.cookies.set('pm_token', token, {
      httpOnly: false, // must be false so JS can also read it
      sameSite: 'lax',
      path:     '/',
      maxAge:   7 * 24 * 3600,
      secure:   process.env.NODE_ENV === 'production',
    })

    return response
  } catch (error) {
    console.error('[POST /api/auth/login]', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
