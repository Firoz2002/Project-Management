'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Layout from '@/components/Layout'
import Modal from '@/components/Modal'
import ProjectForm from '@/components/ProjectForm'
import TaskForm from '@/components/TaskForm'
import TimeLogForm from '@/components/TimeLogForm'
import { api } from '@/lib/api'
import {
  statusColors, priorityColors, PROJECT_STATUSES, TASK_STATUSES, PRIORITIES,
  labelFor, isOverdue, isDueSoon, formatDate, progressColor,
} from '@/lib/constants'

export default function ProjectDetailPage() {
  const { id }  = useParams()
  const router  = useRouter()

  const [project,    setProject]    = useState(null)
  const [projects,   setProjects]   = useState([])
  const [users,      setUsers]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [editModal,  setEditModal]  = useState(false)
  const [taskModal,  setTaskModal]  = useState(null)   // null | 'create' | task
  const [timeModal,  setTimeModal]  = useState(null)   // null | task

  const load = useCallback(async () => {
    try {
      const [proj, projs, u] = await Promise.all([
        api.get(`/api/projects/${id}`),
        projects.length ? Promise.resolve(projects) : api.get('/api/projects'),
        users.length    ? Promise.resolve(users)    : api.get('/api/users'),
      ])
      setProject(proj)
      if (!projects.length) setProjects(projs)
      if (!users.length)    setUsers(u)
    } catch { router.push('/projects') }
    finally  { setLoading(false) }
  }, [id])

  useEffect(() => { load() }, [load])

  const updateTaskStatus = async (task, newStatus) => {
    await api.patch(`/api/tasks/${task.id}`, { status: newStatus })
    load()
  }

  const deleteTask = async (task) => {
    if (!confirm(`Delete task "${task.title}"?`)) return
    await api.delete(`/api/tasks/${task.id}`)
    load()
  }

  if (loading) return <Layout><div className="text-center py-16 text-gray-400">Loading…</div></Layout>
  if (!project) return null

  const sc   = statusColors[project.status]   || statusColors.NOT_STARTED
  const pc   = priorityColors[project.priority] || priorityColors.MEDIUM
  const fill = progressColor(project.completionPct)
  const tasks = project.tasks || []

  const stats = {
    total:      tasks.length,
    complete:   tasks.filter(t => t.status === 'COMPLETE').length,
    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    blocked:    tasks.filter(t => t.status === 'BLOCKED').length,
    overdue:    tasks.filter(t => isOverdue(t.dueDate, t.status)).length,
    estHrs:     tasks.reduce((s, t) => s + (t.estimatedHrs || 0), 0),
    actHrs:     tasks.reduce((s, t) => s + (t.actualHrs    || 0), 0),
  }

  return (
    <Layout>
      {/* Back */}
      <button onClick={() => router.push('/projects')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-navy mb-5 transition">
        ← All Projects
      </button>

      {/* Project header */}
      <div className="card px-6 py-5 mb-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{project.id}</span>
              <span className="text-xs text-gray-400">{project.category.replace(/_/g, ' ')}</span>
            </div>
            <h1 className="text-xl font-bold text-navy">{project.name}</h1>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button className="btn-outline btn-sm" onClick={() => setEditModal(true)}>Edit Project</button>
            <button className="btn-orange btn-sm" onClick={() => setTaskModal('create')}>+ New Task</button>
          </div>
        </div>

        {/* Badges row */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className={`badge ${sc.bg} ${sc.text}`}>{labelFor(PROJECT_STATUSES, project.status)}</span>
          <span className={`badge ${pc.bg} ${pc.text}`}>{labelFor(PRIORITIES, project.priority)}</span>
          <span className="badge bg-gray-100 text-gray-700">Risk: {project.riskLevel}</span>
          {project.owner && (
            <span className="badge bg-navy-50 text-navy">Owner: {project.owner.name}</span>
          )}
        </div>

        {/* Description */}
        {project.description && (
          <p className="text-sm text-gray-600 leading-relaxed mb-4 border-l-2 border-navy-50 pl-3">{project.description}</p>
        )}

        {/* Dates + progress */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
          <div>
            <p className="text-[10px] font-bold uppercase text-gray-400 mb-0.5">Start Date</p>
            <p className="text-sm font-semibold">{formatDate(project.startDate)}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-gray-400 mb-0.5">Due Date</p>
            <p className={`text-sm font-semibold ${isOverdue(project.dueDate, project.status) ? 'text-red-600' : ''}`}>
              {formatDate(project.dueDate)}{isOverdue(project.dueDate, project.status) ? ' ⚠' : ''}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-gray-400 mb-0.5">Hours Est./Logged</p>
            <p className="text-sm font-semibold">{Math.round(stats.estHrs)}h / {Math.round(stats.actHrs)}h</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Completion</p>
            <div className="flex items-center gap-2">
              <div className="progress-bar flex-1"><div className="progress-fill" style={{ width: `${project.completionPct}%`, background: fill }} /></div>
              <span className="text-sm font-bold" style={{ color: fill }}>{project.completionPct}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Task stats row */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-5">
        {[
          { l: 'Total',      v: stats.total,      c: 'text-navy'        },
          { l: 'Complete',   v: stats.complete,   c: 'text-green-600'   },
          { l: 'In Progress',v: stats.inProgress, c: 'text-navy'        },
          { l: 'Blocked',    v: stats.blocked,    c: stats.blocked  > 0 ? 'text-red-600'    : 'text-gray-400' },
          { l: 'Overdue',    v: stats.overdue,    c: stats.overdue  > 0 ? 'text-red-600'    : 'text-gray-400' },
          { l: 'Est. Hours', v: `${Math.round(stats.estHrs)}h`, c: 'text-brand-gold' },
        ].map(s => (
          <div key={s.l} className="card px-4 py-3">
            <p className="text-[10px] font-bold uppercase text-gray-400">{s.l}</p>
            <p className={`text-xl font-extrabold mt-0.5 ${s.c}`}>{s.v}</p>
          </div>
        ))}
      </div>

      {/* Tasks table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm font-bold text-navy">Tasks</p>
          <button className="btn-orange btn-sm" onClick={() => setTaskModal('create')}>+ New Task</button>
        </div>

        {tasks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-3">No tasks yet.</p>
            <button className="btn-primary btn-sm" onClick={() => setTaskModal('create')}>Add First Task</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Task</th>
                  <th>Assignee</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Due Date</th>
                  <th className="text-right">Est. / Logged</th>
                  <th>Depends On</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => {
                  const over = isOverdue(task.dueDate, task.status)
                  const soon = isDueSoon(task.dueDate, task.status)
                  const sc2  = statusColors[task.status]     || statusColors.NOT_STARTED
                  const pc2  = priorityColors[task.priority] || priorityColors.MEDIUM
                  const ovh  = task.actualHrs > task.estimatedHrs

                  return (
                    <tr key={task.id}
                      className={task.status === 'BLOCKED' ? 'row-blocked' : over ? 'row-overdue' : ''}>
                      <td>
                        <Link href={`/tasks/${task.id}`} className="font-mono text-[11px] text-navy hover:underline">
                          {task.id}
                        </Link>
                      </td>
                      <td className="max-w-xs">
                        <Link href={`/tasks/${task.id}`} className="font-semibold text-navy hover:underline text-xs">
                          {task.title}
                        </Link>
                        {task.notes && <p className="text-[11px] text-gray-400 italic truncate">{task.notes}</p>}
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <span className="w-6 h-6 rounded-full bg-navy-50 flex items-center justify-center text-[10px] font-bold text-navy">
                            {task.assignee?.initials}
                          </span>
                          <span className="text-xs">{task.assignee?.name}</span>
                        </div>
                      </td>
                      <td><span className={`badge ${pc2.bg} ${pc2.text}`}>{labelFor(PRIORITIES, task.priority)}</span></td>
                      <td>
                        <select
                          value={task.status}
                          onChange={e => updateTaskStatus(task, e.target.value)}
                          className={`text-[11px] rounded border px-1.5 py-0.5 font-semibold cursor-pointer
                                      focus:outline-none focus:ring-1 focus:ring-navy
                                      ${sc2.bg} ${sc2.text} ${sc2.border}`}
                        >
                          {TASK_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                      </td>
                      <td>
                        <span className={`text-xs ${over ? 'text-red-600 font-bold' : soon ? 'text-yellow-600 font-semibold' : ''}`}>
                          {formatDate(task.dueDate)}
                        </span>
                        {over && <p className="text-[10px] text-red-500 font-bold">OVERDUE</p>}
                      </td>
                      <td className="text-right">
                        <span className={`text-xs font-semibold ${ovh ? 'text-red-600' : 'text-gray-600'}`}>
                          {task.estimatedHrs}h / {task.actualHrs}h
                        </span>
                      </td>
                      <td>
                        {task.dependsOnTasks?.length > 0 ? (
                          task.dependsOnTasks.map(d => (
                            <span key={d.dependsOnTaskId} className="text-[10px] font-mono bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded mr-1">
                              {d.dependsOnTask?.id || d.dependsOnTaskId}
                            </span>
                          ))
                        ) : <span className="text-gray-300 text-xs">—</span>}
                      </td>
                      <td>
                        <div className="flex gap-1">
                          <button onClick={() => setTimeModal(task)}
                            className="text-[11px] text-brand-teal hover:underline px-1 py-0.5 rounded">+Time</button>
                          <button onClick={() => setTaskModal(task)}
                            className="text-[11px] text-navy hover:underline px-1 py-0.5 rounded">Edit</button>
                          <button onClick={() => deleteTask(task)}
                            className="text-[11px] text-red-500 hover:underline px-1 py-0.5 rounded">Del</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <Modal open={editModal} onClose={() => setEditModal(false)} title="Edit Project" size="lg">
        <ProjectForm
          project={project} users={users}
          onSaved={(saved) => { setProject(saved); setEditModal(false); load() }}
          onCancel={() => setEditModal(false)}
        />
      </Modal>

      <Modal open={taskModal !== null} onClose={() => setTaskModal(null)}
        title={taskModal === 'create' ? 'New Task' : 'Edit Task'} size="lg">
        <TaskForm
          task={taskModal === 'create' ? null : taskModal}
          projects={projects} users={users}
          defaultProjectId={id}
          onSaved={() => { setTaskModal(null); load() }}
          onCancel={() => setTaskModal(null)}
        />
      </Modal>

      <Modal open={timeModal !== null} onClose={() => setTimeModal(null)} title="Log Time" size="sm">
        <TimeLogForm
          taskId={timeModal?.id} taskTitle={timeModal?.title}
          onSaved={() => { setTimeModal(null); load() }}
          onCancel={() => setTimeModal(null)}
        />
      </Modal>
    </Layout>
  )
}
