import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'
import { z } from 'zod'

const createSchema = z.object({
  taskId:      z.string().min(1),
  hours:       z.number().min(0.25).max(24),
  date:        z.string(),
  description: z.string().max(500).optional().nullable(),
})

// ── POST /api/timelogs ─────────────────────────────────────────
export async function POST(request) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const body   = await request.json()
    const parsed = createSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
    }

    const { taskId, hours, date, description } = parsed.data

    // Create log and update task actualHrs in one transaction
    const [log] = await prisma.$transaction([
      prisma.timeLog.create({
        data: {
          taskId,
          userId:      auth.sub,
          hours,
          date:        new Date(date),
          description: description || null,
        },
        include: {
          user: { select: { id: true, name: true, initials: true } },
          task: { select: { id: true, title: true } },
        },
      }),
      prisma.task.update({
        where: { id: taskId },
        data:  { actualHrs: { increment: hours } },
      }),
    ])

    return NextResponse.json(log, { status: 201 })
  } catch (error) {
    console.error('[POST /api/timelogs]', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// ── GET /api/timelogs?taskId=xxx ──────────────────────────────
export async function GET(request) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')

    const where = taskId ? { taskId } : {}

    const logs = await prisma.timeLog.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, initials: true } },
        task: { select: { id: true, title: true, projectId: true } },
      },
      orderBy: { date: 'desc' },
      take: 100,
    })

    return NextResponse.json(logs)
  } catch (error) {
    console.error('[GET /api/timelogs]', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
