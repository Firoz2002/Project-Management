'use client'

import { useState, useEffect, useCallback } from 'react'
import Layout from '@/components/Layout'
import Modal from '@/components/Modal'
import ProjectForm from '@/components/ProjectForm'
import { api } from '@/lib/api'
import {
  statusColors, priorityColors, riskColors,
  labelFor, isOverdue, isDueSoon, formatDate, progressColor,
  PROJECT_STATUSES, PRIORITIES,
} from '@/lib/constants'

export default function OverviewPage() {
  const [kpis,      setKpis]      = useState(null)
  const [projects,  setProjects]  = useState([])
  const [users,     setUsers]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [modal,     setModal]     = useState(null)  // null | 'create' | project-object
  const [statusF,   setStatusF]   = useState('')
  const [priorityF, setPriorityF] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusF)   params.set('status',   statusF)
      if (priorityF) params.set('priority', priorityF)
      const [k, p, u] = await Promise.all([
        api.get('/api/dashboard'),
        api.get(`/api/projects?${params}`),
        users.length ? Promise.resolve(users) : api.get('/api/users'),
      ])
      setKpis(k)
      setProjects(p)
      if (u.length && !users.length) setUsers(u)
    } finally {
      setLoading(false)
    }
  }, [statusF, priorityF])

  useEffect(() => { load() }, [load])

  const handleSaved = (saved) => {
    setModal(null)
    load()
  }

  const handleDelete = async (project) => {
    if (!confirm(`Delete project "${project.name}"? All tasks will also be deleted.`)) return
    await api.delete(`/api/projects/${project.id}`)
    load()
  }

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-navy">Overview</h1>
          <p className="text-sm text-gray-500 mt-0.5">Prabisha Consulting — Active Portfolio</p>
        </div>
        <button className="btn-orange" onClick={() => setModal('create')}>
          + New Project
        </button>
      </div>

      {/* KPI Row */}
      {kpis && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {[
            { label: 'Total Projects',  value: kpis.projects.total,       color: 'text-navy'          },
            { label: 'In Progress',     value: kpis.projects.inProgress,  color: 'text-navy'          },
            { label: 'Blocked Tasks',   value: kpis.tasks.blocked,        color: 'text-red-600'       },
            { label: 'Overdue Tasks',   value: kpis.tasks.overdue,        color: 'text-red-600'       },
            { label: 'Total Tasks',     value: kpis.tasks.total,          color: 'text-brand-teal'    },
            { label: 'Est. Hours',      value: `${kpis.hours.estimated}h`, color: 'text-brand-gold'   },
          ].map(k => (
            <div key={k.label} className="card px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-1">{k.label}</p>
              <p className={`text-2xl font-extrabold ${k.color}`}>{k.value}</p>
              {k.label === 'Total Tasks' && (
                <p className="text-[11px] text-gray-400 mt-0.5">{kpis.tasks.complete} complete</p>
              )}
              {k.label === 'Est. Hours' && (
                <p className="text-[11px] text-gray-400 mt-0.5">{kpis.hours.logged}h logged</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <select className="form-select !w-auto text-xs" value={statusF} onChange={e => setStatusF(e.target.value)}>
          <option value="">All Statuses</option>
          {PROJECT_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select className="form-select !w-auto text-xs" value={priorityF} onChange={e => setPriorityF(e.target.value)}>
          <option value="">All Priorities</option>
          {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        {(statusF || priorityF) && (
          <button className="btn-ghost btn-sm" onClick={() => { setStatusF(''); setPriorityF('') }}>
            Reset
          </button>
        )}
        <span className="text-xs text-gray-400 ml-auto">{projects.length} projects</span>
      </div>

      {/* Project Grid */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading projects…</div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📁</p>
          <p className="font-medium">No projects found</p>
          <button className="btn-primary mt-4" onClick={() => setModal('create')}>Create First Project</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map(p => {
            const sc   = statusColors[p.status]   || statusColors.NOT_STARTED
            const pc   = priorityColors[p.priority] || priorityColors.MEDIUM
            const rc   = riskColors[p.riskLevel] || 'text-gray-500'
            const tasks = p.tasks || []
            const done  = tasks.filter(t => t.status === 'COMPLETE').length
            const over  = tasks.filter(t => isOverdue(t.dueDate, t.status)).length
            const blk   = tasks.filter(t => t.status === 'BLOCKED').length
            const fill  = progressColor(p.completionPct)
            const projOver = isOverdue(p.dueDate, p.status)

            return (
              <div key={p.id} className="card overflow-hidden hover:shadow-md transition">
                {/* Card header */}
                <div className="px-4 pt-4 pb-3 border-b border-gray-100">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{p.id} · {p.category.replace(/_/g, ' ')}</p>
                      <h3 className="text-sm font-bold text-navy mt-0.5 leading-tight">{p.name}</h3>
                    </div>
                    <span className={`badge ${pc.bg} ${pc.text} flex-shrink-0`}>{labelFor(PRIORITIES, p.priority)}</span>
                  </div>
                </div>

                {/* Body */}
                <div className="px-4 py-3">
                  {p.description && (
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">{p.description}</p>
                  )}

                  {/* Meta row */}
                  <div className="grid grid-cols-2 gap-y-2 text-xs mb-3">
                    <div>
                      <span className="text-gray-400">Owner</span>
                      <p className="font-semibold text-gray-700 truncate">{p.owner?.name}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Due Date</span>
                      <p className={`font-semibold ${projOver ? 'text-red-600' : isDueSoon(p.dueDate, p.status) ? 'text-yellow-600' : 'text-gray-700'}`}>
                        {formatDate(p.dueDate)}{projOver ? ' ⚠' : isDueSoon(p.dueDate, p.status) ? ' ⏰' : ''}
                      </p>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mb-3">
                    <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                      <span>Completion</span>
                      <span className="font-bold" style={{ color: fill }}>{p.completionPct}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${p.completionPct}%`, background: fill }} />
                    </div>
                  </div>

                  {/* Task stats */}
                  <div className="flex items-center gap-3 text-[11px] text-gray-500">
                    <span>{tasks.length} tasks</span>
                    <span className="text-green-600">✓ {done} done</span>
                    {over > 0 && <span className="text-red-600">⚠ {over} overdue</span>}
                    {blk > 0  && <span className="text-red-600">🚫 {blk} blocked</span>}
                  </div>
                </div>

                {/* Footer */}
                <div className="px-4 py-2.5 bg-gray-50 flex items-center justify-between gap-2 border-t border-gray-100">
                  <div className="flex gap-2">
                    <span className={`badge ${sc.bg} ${sc.text}`}>{labelFor(PROJECT_STATUSES, p.status)}</span>
                    <span className={`text-xs font-semibold ${rc}`}>Risk: {p.riskLevel}</span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      className="text-xs text-navy hover:underline px-2 py-1 rounded hover:bg-navy-50"
                      onClick={() => setModal(p)}
                    >Edit</button>
                    <button
                      className="text-xs text-red-500 hover:underline px-2 py-1 rounded hover:bg-red-50"
                      onClick={() => handleDelete(p)}
                    >Delete</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={modal === 'create' ? 'New Project' : 'Edit Project'}
        size="lg"
      >
        <ProjectForm
          project={modal === 'create' ? null : modal}
          users={users}
          onSaved={handleSaved}
          onCancel={() => setModal(null)}
        />
      </Modal>
    </Layout>
  )
}
