'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { api } from '@/lib/api'
import { priorityColors, labelFor, PRIORITIES, isOverdue, isDueSoon, formatDate } from '@/lib/constants'

export default function StandupPage() {
  const [tasks,   setTasks]   = useState([])
  const [loading, setLoading] = useState(true)
  const today = new Date()

  useEffect(() => {
    api.get('/api/tasks')
      .then(t => setTasks(t))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Layout><div className="text-center py-16 text-gray-400">Loading…</div></Layout>

  const active     = tasks.filter(t => t.status !== 'COMPLETE')
  const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS')
  const blocked    = tasks.filter(t => t.status === 'BLOCKED')
  const overdue    = tasks.filter(t => isOverdue(t.dueDate, t.status))
  const dueSoon    = tasks.filter(t => isDueSoon(t.dueDate, t.status) && !isOverdue(t.dueDate, t.status))
  const recent     = tasks.filter(t => t.status === 'COMPLETE').slice(-8).reverse()

  const cols = [
    { key: 'inprog',   label: `In Progress`,       count: inProgress.length, items: inProgress, color: 'bg-navy-50 border-navy text-navy',           dot: 'bg-navy'         },
    { key: 'blocked',  label: `Blocked`,            count: blocked.length,    items: blocked,    color: 'bg-red-50 border-red-400 text-red-700',       dot: 'bg-red-500'      },
    { key: 'overdue',  label: `Overdue`,            count: overdue.length,    items: overdue,    color: 'bg-orange-50 border-orange-400 text-orange-700', dot: 'bg-orange-500' },
    { key: 'soon',     label: `Due This Week`,      count: dueSoon.length,    items: dueSoon,    color: 'bg-yellow-50 border-yellow-400 text-yellow-700', dot: 'bg-yellow-500' },
    { key: 'complete', label: `Recently Completed`, count: recent.length,     items: recent,     color: 'bg-green-50 border-green-400 text-green-700',  dot: 'bg-green-500'    },
  ]

  return (
    <Layout>
      {/* Banner */}
      <div className="bg-navy rounded-xl px-6 py-5 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-white/60 text-sm">Daily Standup</p>
          <p className="text-white text-xl font-bold mt-0.5">
            {today.toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
          </p>
        </div>
        <div className="flex gap-6 text-center">
          {[
            { v: inProgress.length, l: 'In Progress' },
            { v: blocked.length,    l: 'Blocked',    c: blocked.length > 0 ? 'text-red-300' : 'text-white' },
            { v: overdue.length,    l: 'Overdue',    c: overdue.length > 0  ? 'text-orange-300' : 'text-white' },
            { v: active.length,     l: 'Active Total' },
          ].map(s => (
            <div key={s.l}>
              <p className={`text-2xl font-extrabold ${s.c || 'text-white'}`}>{s.v}</p>
              <p className="text-white/50 text-[11px] uppercase">{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-4">
        {cols.map(col => (
          <div key={col.key} className="card overflow-hidden">
            {/* Col header */}
            <div className={`px-4 py-3 border-b-2 flex items-center gap-2 ${col.color}`}>
              <span className={`w-2 h-2 rounded-full ${col.dot}`} />
              <span className="font-bold text-sm">{col.label}</span>
              <span className="ml-auto bg-white/70 rounded-full px-2 py-0.5 text-xs font-bold">{col.count}</span>
            </div>

            {/* Items */}
            {col.items.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-400">All clear ✓</div>
            ) : (
              <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
                {col.items.slice(0, 10).map(task => {
                  const pc = priorityColors[task.priority] || priorityColors.MEDIUM
                  return (
                    <div key={task.id} className="px-4 py-3">
                      <p className="text-xs font-semibold text-navy leading-tight mb-1">{task.title}</p>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                        <span className="font-mono text-gray-400">{task.project?.id || task.projectId}</span>
                        <span>·</span>
                        <span className="font-medium">{task.assignee?.name}</span>
                        <span>·</span>
                        <span className={`badge ${pc.bg} ${pc.text} text-[10px] px-1.5 py-0`}>
                          {labelFor(PRIORITIES, task.priority)}
                        </span>
                        <span className={isOverdue(task.dueDate, task.status) ? 'text-red-600 font-bold' : ''}>
                          {formatDate(task.dueDate)}
                        </span>
                      </div>
                      {task.notes && (
                        <p className="text-[11px] text-gray-400 mt-1 italic truncate">{task.notes}</p>
                      )}
                    </div>
                  )
                })}
                {col.items.length > 10 && (
                  <div className="px-4 py-2 text-center text-xs text-gray-400">
                    +{col.items.length - 10} more
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </Layout>
  )
}
