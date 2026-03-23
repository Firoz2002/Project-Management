import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'
import { z } from 'zod'

const createSchema = z.object({
  name:          z.string().min(2).max(120),
  category:      z.enum(['PRODUCT_DEVELOPMENT','MARKETING','OPERATIONS','ENGINEERING','CONSULTING','DESIGN','RESEARCH']),
  status:        z.enum(['NOT_STARTED','PLANNING','IN_PROGRESS','COMPLETE','BLOCKED','ON_HOLD']).default('NOT_STARTED'),
  priority:      z.enum(['LOW','MEDIUM','HIGH','CRITICAL']).default('MEDIUM'),
  ownerId:       z.string().min(1),
  startDate:     z.string(),
  dueDate:       z.string(),
  completionPct: z.number().int().min(0).max(100).default(0),
  description:   z.string().max(2000).optional().nullable(),
  riskLevel:     z.enum(['LOW','MEDIUM','HIGH']).default('MEDIUM'),
})

// ── Auto-generate project ID (P001, P002, …) ─────────────────
async function nextProjectId() {
  const last = await prisma.project.findFirst({ orderBy: { id: 'desc' } })
  if (!last) return 'P001'
  const num = parseInt(last.id.replace(/\D/g, ''), 10) + 1
  return `P${String(num).padStart(3, '0')}`
}

// ── GET /api/projects ─────────────────────────────────────────
export async function GET(request) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const status   = searchParams.get('status')
    const priority = searchParams.get('priority')
    const category = searchParams.get('category')

    const where = {}
    if (status)   where.status   = status
    if (priority) where.priority = priority
    if (category) where.category = category

    const projects = await prisma.project.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true, initials: true } },
        tasks: {
          select: {
            id: true, status: true, priority: true,
            dueDate: true, estimatedHrs: true, actualHrs: true,
          },
        },
      },
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
    })

    return NextResponse.json(projects)
  } catch (error) {
    console.error('[GET /api/projects]', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// ── POST /api/projects ────────────────────────────────────────
export async function POST(request) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const body   = await request.json()
    const parsed = createSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
    }

    const data = parsed.data
    const id   = await nextProjectId()

    const project = await prisma.project.create({
      data: {
        id,
        ...data,
        startDate: new Date(data.startDate),
        dueDate:   new Date(data.dueDate),
      },
      include: {
        owner: { select: { id: true, name: true, initials: true } },
        tasks: true,
      },
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('[POST /api/projects]', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
