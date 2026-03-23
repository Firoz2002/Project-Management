import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'
import { z } from 'zod'

const createSchema = z.object({
  projectId:    z.string().min(1),
  title:        z.string().min(2).max(200),
  assigneeId:   z.string().min(1),
  estimatedHrs: z.number().min(0).default(0),
  actualHrs:    z.number().min(0).default(0),
  status:       z.enum(['NOT_STARTED','IN_PROGRESS','REVIEW','COMPLETE','BLOCKED']).default('NOT_STARTED'),
  priority:     z.enum(['LOW','MEDIUM','HIGH','CRITICAL']).default('MEDIUM'),
  dueDate:      z.string(),
  notes:        z.string().max(2000).optional().nullable(),
  tags:         z.array(z.string()).default([]),
  dependsOn:    z.array(z.string()).default([]),  // array of task IDs
})

async function nextTaskId() {
  const last = await prisma.task.findFirst({ orderBy: { id: 'desc' } })
  if (!last) return 'T001'
  const num = parseInt(last.id.replace(/\D/g, ''), 10) + 1
  return `T${String(num).padStart(3, '0')}`
}

// ── GET /api/tasks ────────────────────────────────────────────
export async function GET(request) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const projectId  = searchParams.get('projectId')
    const assigneeId = searchParams.get('assigneeId')
    const status     = searchParams.get('status')
    const priority   = searchParams.get('priority')
    const search     = searchParams.get('search')

    const where = {}
    if (projectId)  where.projectId  = projectId
    if (assigneeId) where.assigneeId = assigneeId
    if (status)     where.status     = status
    if (priority)   where.priority   = priority
    if (search)     where.title      = { contains: search, mode: 'insensitive' }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, initials: true } },
        project:  { select: { id: true, name: true } },
        dependsOnTasks: {
          include: { dependsOnTask: { select: { id: true, title: true } } },
        },
      },
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('[GET /api/tasks]', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// ── POST /api/tasks ───────────────────────────────────────────
export async function POST(request) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const body   = await request.json()
    const parsed = createSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
    }

    const { dependsOn, ...data } = parsed.data
    const id = await nextTaskId()

    const task = await prisma.task.create({
      data: {
        id,
        ...data,
        dueDate: new Date(data.dueDate),
        ...(dependsOn.length > 0 && {
          dependsOnTasks: {
            create: dependsOn.map(depId => ({ dependsOnTaskId: depId })),
          },
        }),
      },
      include: {
        assignee: { select: { id: true, name: true, initials: true } },
        project:  { select: { id: true, name: true } },
        dependsOnTasks: {
          include: { dependsOnTask: { select: { id: true, title: true } } },
        },
      },
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('[POST /api/tasks]', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
