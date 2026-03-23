import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({
  taskId:  z.string().min(1),
  content: z.string().min(1).max(2000),
})

export async function POST(request) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const body   = await request.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
    }

    const comment = await prisma.comment.create({
      data: { taskId: parsed.data.taskId, userId: auth.sub, content: parsed.data.content },
      include: { user: { select: { id: true, name: true, initials: true } } },
    })

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error('[POST /api/comments]', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
