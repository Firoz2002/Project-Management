import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'
import { z } from 'zod'

const updateSchema = z.object({
  title:        z.string().min(2).max(200).optional(),
  projectId:    z.string().optional(),
  assigneeId:   z.string().optional(),
  estimatedHrs: z.number().min(0).optional(),
  actualHrs:    z.number().min(0).optional(),
  status:       z.enum(['NOT_STARTED','IN_PROGRESS','REVIEW','COMPLETE','BLOCKED']).optional(),
  priority:     z.enum(['LOW','MEDIUM','HIGH','CRITICAL']).optional(),
  dueDate:      z.string().optional(),
  notes:        z.string().max(2000).optional().nullable(),
  tags:         z.array(z.string()).optional(),
  dependsOn:    z.array(z.string()).optional(),
})

const taskInclude = {
  assignee: { select: { id: true, name: true, initials: true } },
  project:  { select: { id: true, name: true } },
  dependsOnTasks: {
    include: { dependsOnTask: { select: { id: true, title: true } } },
  },
  timeLogs: {
    include: { user: { select: { id: true, name: true, initials: true } } },
    orderBy: { date: 'desc' },
  },
  comments: {
    include: { user: { select: { id: true, name: true, initials: true } } },
    orderBy: { createdAt: 'desc' },
  },
}

// ── GET /api/tasks/:id ────────────────────────────────────────
export async function GET(request, { params }) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: taskInclude,
    })

    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

    return NextResponse.json(task)
  } catch (error) {
    console.error('[GET /api/tasks/:id]', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// ── PUT /api/tasks/:id ────────────────────────────────────────
export async function PUT(request, { params }) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const body   = await request.json()
    const parsed = updateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
    }

    const { dependsOn, ...data } = parsed.data
    if (data.dueDate) data.dueDate = new Date(data.dueDate)

    // Update dependencies if provided
    if (dependsOn !== undefined) {
      await prisma.taskDependency.deleteMany({ where: { dependentTaskId: params.id } })
      if (dependsOn.length > 0) {
        await prisma.taskDependency.createMany({
          data: dependsOn.map(depId => ({
            dependentTaskId: params.id,
            dependsOnTaskId: depId,
          })),
          skipDuplicates: true,
        })
      }
    }

    const task = await prisma.task.update({
      where: { id: params.id },
      data,
      include: taskInclude,
    })

    return NextResponse.json(task)
  } catch (error) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }
    console.error('[PUT /api/tasks/:id]', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// ── PATCH /api/tasks/:id  (quick status/hours update) ─────────
export async function PATCH(request, { params }) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const body = await request.json()

    const allowed = ['status', 'actualHrs', 'completionPct', 'notes']
    const data = Object.fromEntries(
      Object.entries(body).filter(([k]) => allowed.includes(k))
    )

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 })
    }

    const task = await prisma.task.update({
      where: { id: params.id },
      data,
      include: {
        assignee: { select: { id: true, name: true, initials: true } },
        project:  { select: { id: true, name: true } },
        dependsOnTasks: { include: { dependsOnTask: { select: { id: true, title: true } } } },
      },
    })

    return NextResponse.json(task)
  } catch (error) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }
    console.error('[PATCH /api/tasks/:id]', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// ── DELETE /api/tasks/:id ─────────────────────────────────────
export async function DELETE(request, { params }) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    await prisma.task.delete({ where: { id: params.id } })

    return NextResponse.json({ ok: true, id: params.id })
  } catch (error) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }
    console.error('[DELETE /api/tasks/:id]', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
