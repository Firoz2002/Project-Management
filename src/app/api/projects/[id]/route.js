import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'
import { z } from 'zod'

const updateSchema = z.object({
  name:          z.string().min(2).max(120).optional(),
  category:      z.enum(['PRODUCT_DEVELOPMENT','MARKETING','OPERATIONS','ENGINEERING','CONSULTING','DESIGN','RESEARCH']).optional(),
  status:        z.enum(['NOT_STARTED','PLANNING','IN_PROGRESS','COMPLETE','BLOCKED','ON_HOLD']).optional(),
  priority:      z.enum(['LOW','MEDIUM','HIGH','CRITICAL']).optional(),
  ownerId:       z.string().optional(),
  startDate:     z.string().optional(),
  dueDate:       z.string().optional(),
  completionPct: z.number().int().min(0).max(100).optional(),
  description:   z.string().max(2000).optional().nullable(),
  riskLevel:     z.enum(['LOW','MEDIUM','HIGH']).optional(),
})

// ── GET /api/projects/:id ─────────────────────────────────────
export async function GET(request, { params }) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        owner: { select: { id: true, name: true, initials: true, role: true } },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, initials: true } },
            dependsOnTasks: {
              include: { dependsOnTask: { select: { id: true, title: true } } },
            },
            timeLogs: { orderBy: { date: 'desc' }, take: 5 },
          },
          orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
        },
      },
    })

    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    return NextResponse.json(project)
  } catch (error) {
    console.error('[GET /api/projects/:id]', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// ── PUT /api/projects/:id ─────────────────────────────────────
export async function PUT(request, { params }) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const body   = await request.json()
    const parsed = updateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
    }

    const data = { ...parsed.data }
    if (data.startDate) data.startDate = new Date(data.startDate)
    if (data.dueDate)   data.dueDate   = new Date(data.dueDate)

    const project = await prisma.project.update({
      where: { id: params.id },
      data,
      include: {
        owner: { select: { id: true, name: true, initials: true } },
        tasks: { select: { id: true, status: true, dueDate: true } },
      },
    })

    return NextResponse.json(project)
  } catch (error) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    console.error('[PUT /api/projects/:id]', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// ── DELETE /api/projects/:id ──────────────────────────────────
export async function DELETE(request, { params }) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    await prisma.project.delete({ where: { id: params.id } })

    return NextResponse.json({ ok: true, id: params.id })
  } catch (error) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    console.error('[DELETE /api/projects/:id]', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
