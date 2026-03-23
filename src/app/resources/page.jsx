'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { api } from '@/lib/api'
import { statusColors, priorityColors, labelFor, PRIORITIES, TASK_STATUSES, isOverdue, formatDate } from '@/lib/constants'

export default function ResourcesPage() {
  const [users,   setUsers]   = useState([])
  const [tasks,   setTasks]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.get('/api/users'), api.get('/api/tasks')])
      .then(([u, t]) => { setUsers(u); setTasks(t) })
      .finally(() => setLoading(false))
  }, [])

  const tasksByUser = (userId) => tasks.filter(t => t.assigneeId === userId && t.status !== 'COMPLETE')
  const doneByUser  = (userId) => tasks.filter(t => t.assigneeId === userId && t.status === 'COMPLETE').length

  if (loading) return <Layout><div className="text-center py-16 text-gray-400">Loading…</div></Layout>

  return (
    <Layout>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-navy">Resources</h1>
        <p className="text-sm text-gray-500 mt-0.5">Team workload & allocation</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {users.map(user => {
          const active    = tasksByUser(user.id)
          const done      = doneByUser(user.id)
          const blocked   = active.filter(t => t.status === 'BLOCKED').length
          const overdue   = active.filter(t => isOverdue(t.dueDate, t.status)).length
          const totalEst  = active.reduce((s, t) => s + (t.estimatedHrs || 0), 0)
          const totalAct  = tasks.filter(t => t.assigneeId === user.id).reduce((s, t) => s + (t.actualHrs || 0), 0)

          // Rough workload %: assume 160h capacity per month
          const wPct  = Math.min(Math.round((totalEst / 160) * 100), 100)
          const wColor = wPct > 90 ? '#DC2626' : wPct > 65 ? '#E65100' : '#2E7D32'

          const sorted = [...active].sort((a, b) => {
            const po = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
            return (po[a.priority] || 4) - (po[b.priority] || 4)
          })

          return (
            <div key={user.id} className="card overflow-hidden">
              {/* Header */}
              <div className="bg-navy px-5 py-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                  {user.initials}
                </div>
                <div>
                  <p className="font-bold text-white leading-tight">{user.name}</p>
                  <p className="text-white/50 text-xs capitalize">{user.role?.toLowerCase()}</p>
                </div>
              </div>

              <div className="px-5 py-4">
                {/* Stats row */}
                <div className="grid grid-cols-4 gap-2 mb-4 text-center">
                  {[
                    { val: active.length, label: 'Active',  color: 'text-navy'     },
                    { val: done,          label: 'Done',    color: 'text-green-600' },
                    { val: blocked,       label: 'Blocked', color: blocked  > 0 ? 'text-red-600' : 'text-gray-400' },
                    { val: overdue,       label: 'Overdue', color: overdue  > 0 ? 'text-red-600' : 'text-gray-400' },
                  ].map(s => (
                    <div key={s.label}>
                      <p className={`text-xl font-extrabold ${s.color}`}>{s.val}</p>
                      <p className="text-[10px] text-gray-400 uppercase">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Workload bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Estimated workload</span>
                    <span className="font-bold" style={{ color: wColor }}>{Math.round(totalEst)}h remaining</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${wPct}%`, background: wColor }} />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">{Math.round(totalAct)}h logged so far</p>
                </div>

                {/* Task list */}
                {sorted.length === 0 ? (
                  <p className="text-center text-sm text-gray-400 py-4">No active tasks 🎉</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {sorted.slice(0, 10).map(task => {
                      const over = isOverdue(task.dueDate, task.status)
                      const sc   = statusColors[task.status] || statusColors.NOT_STARTED
                      const pc   = priorityColors[task.priority] || priorityColors.MEDIUM
                      return (
                        <div key={task.id}
                          className={`flex items-start gap-2 rounded-lg px-3 py-2 border
                                      ${task.status === 'BLOCKED' ? 'bg-red-50 border-red-100' :
                                        over ? 'bg-yellow-50 border-yellow-100' :
                                        'bg-gray-50 border-gray-100'}`}>
                          <div>
                            <p className="text-xs font-semibold text-navy leading-tight line-clamp-2">{task.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`badge ${pc.bg} ${pc.text} text-[10px] px-1.5 py-0`}>
                                {labelFor(PRIORITIES, task.priority)}
                              </span>
                              <span className={`badge ${sc.bg} ${sc.text} text-[10px] px-1.5 py-0`}>
                                {labelFor(TASK_STATUSES, task.status)}
                              </span>
                              <span className={`text-[10px] ${over ? 'text-red-600 font-bold' : 'text-gray-400'}`}>
                                {formatDate(task.dueDate)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    {sorted.length > 10 && (
                      <p className="text-center text-xs text-gray-400">+{sorted.length - 10} more tasks</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </Layout>
  )
}
