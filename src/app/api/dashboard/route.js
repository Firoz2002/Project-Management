import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'

export async function GET(request) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const now = new Date()

    const [
      totalProjects,
      projectsByStatus,
      totalTasks,
      tasksByStatus,
      overdueTasks,
      blockedTasks,
      dueSoonTasks,
      hoursData,
    ] = await Promise.all([
      prisma.project.count(),

      prisma.project.groupBy({ by: ['status'], _count: { _all: true } }),

      prisma.task.count(),

      prisma.task.groupBy({ by: ['status'], _count: { _all: true } }),

      prisma.task.count({
        where: {
          dueDate: { lt: now },
          status:  { notIn: ['COMPLETE'] },
        },
      }),

      prisma.task.count({ where: { status: 'BLOCKED' } }),

      prisma.task.count({
        where: {
          dueDate: { gte: now, lte: new Date(now.getTime() + 3 * 86400000) },
          status:  { notIn: ['COMPLETE'] },
        },
      }),

      prisma.task.aggregate({
        _sum: { estimatedHrs: true, actualHrs: true },
      }),
    ])

    const statusMap = {}
    projectsByStatus.forEach(r => { statusMap[r.status] = r._count._all })

    const taskStatusMap = {}
    tasksByStatus.forEach(r => { taskStatusMap[r.status] = r._count._all })

    return NextResponse.json({
      projects: {
        total:      totalProjects,
        byStatus:   statusMap,
        inProgress: statusMap['IN_PROGRESS'] || 0,
        complete:   statusMap['COMPLETE']    || 0,
        blocked:    statusMap['BLOCKED']     || 0,
      },
      tasks: {
        total:      totalTasks,
        byStatus:   taskStatusMap,
        complete:   taskStatusMap['COMPLETE']    || 0,
        inProgress: taskStatusMap['IN_PROGRESS'] || 0,
        overdue:    overdueTasks,
        blocked:    blockedTasks,
        dueSoon:    dueSoonTasks,
      },
      hours: {
        estimated: Math.round((hoursData._sum.estimatedHrs || 0) * 10) / 10,
        logged:    Math.round((hoursData._sum.actualHrs    || 0) * 10) / 10,
      },
    })
  } catch (error) {
    console.error('[GET /api/dashboard]', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
