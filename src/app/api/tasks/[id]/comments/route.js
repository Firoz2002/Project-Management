import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'

export async function GET(request, { params }) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const comments = await prisma.comment.findMany({
      where:   { taskId: params.id },
      include: { user: { select: { id: true, name: true, initials: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error('[GET /api/tasks/:id/comments]', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
