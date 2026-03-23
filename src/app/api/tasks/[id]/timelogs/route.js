import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'

export async function GET(request, { params }) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const logs = await prisma.timeLog.findMany({
      where:   { taskId: params.id },
      include: { user: { select: { id: true, name: true, initials: true } } },
      orderBy: { date: 'desc' },
    })

    const totalHours = logs.reduce((sum, l) => sum + l.hours, 0)

    return NextResponse.json({ logs, totalHours: Math.round(totalHours * 10) / 10 })
  } catch (error) {
    console.error('[GET /api/tasks/:id/timelogs]', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
