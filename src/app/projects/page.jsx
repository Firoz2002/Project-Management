'use client'

import { useState, useEffect, useCallback } from 'react'
import Layout from '@/components/Layout'
import Modal from '@/components/Modal'
import ProjectForm from '@/components/ProjectForm'
import TaskForm from '@/components/TaskForm'
import TimeLogForm from '@/components/TimeLogForm'
import { api } from '@/lib/api'
import {
  statusColors, priorityColors, TASK_STATUSES, PRIORITIES, PROJECT_STATUSES, CATEGORIES,
  labelFor, isOverdue, isDueSoon, formatDate, progressColor,
} from '@/lib/constants'

export default function ProjectsPage() {
  const [projects,   setProjects]   = useState([])
  const [users,      setUsers]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [expanded,   setExpanded]   = useState({})

  const [projModal,  setProjModal]  = useState(null)
  const [taskModal,  setTaskModal]  = useState(null)
  const [timeModal,  setTimeModal]  = useState(null)
  const [defaultPid, setDefaultPid] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [p, u] = await Promise.all([
        api.get('/api/projects'),
        users.length ? Promise.resolve(users) : api.get('/api/users'),
      ])
      setProjects(p)
      if (!users.length) setUsers(u)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const toggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  const handleProjSaved  = () => { setProjModal(null);  load() }
  const handleTaskSaved  = () => { setTaskModal(null);  load() }
  const handleTimeSaved  = () => { setTimeModal(null);  load() }

  const updateTaskStatus = async (task, newStatus) => {
    await api.patch(`/api/tasks/${task.id}`, { status: newStatus })
    load()
  }

  const handleDeleteTask = async (task) => {
    if (!confirm(`Delete task "${task.title}"?`)) return
    await api.delete(`/api/tasks/${task.id}`)
    load()
  }

  const handleDeleteProject = async (project) => {
    if (!confirm(`Delete project "${project.name}"? All tasks will be deleted.`)) return
    await api.delete(`/api/projects/${project.id}`)
    load()
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-navy">Projects</h1>
          <p className="text-sm text-gray-500 mt-0.5">{projects.length} projects in portfolio</p>
        </div>
        <button className="btn-orange" onClick={() => setProjModal('create')}>+ New Project</button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading…</div>
      ) : (
        <div className="space-y-3">
          {projects.map(project => {
            const sc    = statusColors[project.status]   || statusColors.NOT_STARTED
            const pc    = priorityColors[project.priority] || priorityColors.MEDIUM
            const fill  = progressColor(project.completionPct)
            const tasks = project.tasks || []
            const open  = expanded[project.id]

            return (
              <div key={project.id} className="card overflow-hidden">
                {/* Project Row */}
                <div className="px-5 py-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition"
                  onClick={() => toggle(project.id)}>

                  {/* Chevron */}
                  <span className={`text-gray-400 text-xs transition-transform ${open ? 'rotate-90' : ''}`}>▶</span>

                  {/* ID + Name */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-[10px] font-mono font-bold text-gray-400">{project.id}</span>
                      <span className="text-sm font-bold text-navy truncate">{project.name}</span>
                      <span className="text-[11px] text-gray-400">{project.category.replace(/_/g,' ')}</span>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="hidden sm:flex items-center gap-2 w-32">
                    <div className="progress-bar flex-1">
                      <div className="progress-fill" style={{ width: `${project.completionPct}%`, background: fill }} />
                    </div>
                    <span className="text-xs font-bold" style={{ color: fill }}>{project.completionPct}%</span>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`badge ${sc.bg} ${sc.text}`}>{labelFor(PROJECT_STATUSES, project.status)}</span>
                    <span className={`badge ${pc.bg} ${pc.text}`}>{labelFor(PRIORITIES, project.priority)}</span>
                    <span className="text-[11px] text-gray-400">{tasks.length} tasks</span>
                  </div>

                  {/* Action buttons — stop propagation */}
                  <div className="flex gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    <button onClick={() => { setDefaultPid(project.id); setTaskModal('create') }}
                      className="btn-ghost btn-sm text-[11px]">+ Task</button>
                    <button onClick={() => setProjModal(project)}
                      className="btn-ghost btn-sm text-[11px]">Edit</button>
                    <button onClick={() => handleDeleteProject(project)}
                      className="btn-ghost btn-sm text-[11px] text-red-500 hover:bg-red-50">Del</button>
                  </div>
                </div>

                {/* Expanded Task List */}
                {open && (
                  <div className="border-t border-gray-100">
                    {tasks.length === 0 ? (
                      <div className="px-5 py-6 text-center text-sm text-gray-400">
                        No tasks yet.
                        <button className="text-navy underline ml-1"
                          onClick={() => { setDefaultPid(project.id); setTaskModal('create') }}>
                          Add the first task
                        </button>
                      </div>
                    ) : (
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="text-left px-5 py-2 font-semibold text-gray-500 w-16">ID</th>
                            <th className="text-left px-3 py-2 font-semibold text-gray-500">Task</th>
                            <th className="text-left px-3 py-2 font-semibold text-gray-500 hidden md:table-cell">Assignee</th>
                            <th className="text-left px-3 py-2 font-semibold text-gray-500 hidden lg:table-cell">Priority</th>
                            <th className="text-left px-3 py-2 font-semibold text-gray-500">Status</th>
                            <th className="text-left px-3 py-2 font-semibold text-gray-500 hidden sm:table-cell">Due</th>
                            <th className="text-right px-3 py-2 font-semibold text-gray-500 hidden md:table-cell">Hrs</th>
                            <th className="text-left px-5 py-2 font-semibold text-gray-500">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {tasks.map(task => {
                            const over = isOverdue(task.dueDate, task.status)
                            const sc2  = statusColors[task.status] || statusColors.NOT_STARTED
                            const pc2  = priorityColors[task.priority] || priorityColors.MEDIUM
                            return (
                              <tr key={task.id}
                                className={`hover:bg-gray-50 ${task.status==='BLOCKED'?'bg-red-50/30':''} ${over?'bg-red-50/20':''}`}>
                                <td className="px-5 py-2">
                                  <span className="font-mono text-gray-400">{task.id}</span>
                                </td>
                                <td className="px-3 py-2 max-w-[220px]">
                                  <p className="font-semibold text-navy leading-tight truncate">{task.title}</p>
                                  {task.notes && <p className="text-gray-400 italic truncate text-[10px]">{task.notes}</p>}
                                </td>
                                <td className="px-3 py-2 hidden md:table-cell whitespace-nowrap">
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-5 h-5 rounded-full bg-navy-50 flex items-center justify-center text-[9px] font-bold text-navy">
                                      {task.assignee?.initials}
                                    </span>
                                    <span>{task.assignee?.name}</span>
                                  </div>
                                </td>
                                <td className="px-3 py-2 hidden lg:table-cell">
                                  <span className={`badge ${pc2.bg} ${pc2.text}`}>{labelFor(PRIORITIES, task.priority)}</span>
                                </td>
                                <td className="px-3 py-2">
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
                                <td className="px-3 py-2 hidden sm:table-cell whitespace-nowrap">
                                  <span className={over ? 'text-red-600 font-bold' : ''}>{formatDate(task.dueDate)}</span>
                                </td>
                                <td className="px-3 py-2 text-right hidden md:table-cell whitespace-nowrap">
                                  <span className={task.actualHrs > task.estimatedHrs ? 'text-red-600 font-semibold' : 'text-gray-500'}>
                                    {task.actualHrs}/{task.estimatedHrs}h
                                  </span>
                                </td>
                                <td className="px-5 py-2">
                                  <div className="flex gap-1">
                                    <button onClick={() => setTimeModal(task)}
                                      className="text-brand-teal hover:underline">+Time</button>
                                    <button onClick={() => setTaskModal(task)}
                                      className="text-navy hover:underline">Edit</button>
                                    <button onClick={() => handleDeleteTask(task)}
                                      className="text-red-500 hover:underline">Del</button>
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modals */}
      <Modal open={projModal !== null} onClose={() => setProjModal(null)}
        title={projModal === 'create' ? 'New Project' : 'Edit Project'} size="lg">
        <ProjectForm
          project={projModal === 'create' ? null : projModal}
          users={users} onSaved={handleProjSaved} onCancel={() => setProjModal(null)}
        />
      </Modal>

      <Modal open={taskModal !== null} onClose={() => setTaskModal(null)}
        title={taskModal === 'create' ? 'New Task' : 'Edit Task'} size="lg">
        <TaskForm
          task={taskModal === 'create' ? null : taskModal}
          projects={projects} users={users}
          defaultProjectId={defaultPid}
          onSaved={handleTaskSaved} onCancel={() => setTaskModal(null)}
        />
      </Modal>

      <Modal open={timeModal !== null} onClose={() => setTimeModal(null)} title="Log Time" size="sm">
        <TimeLogForm
          taskId={timeModal?.id} taskTitle={timeModal?.title}
          onSaved={handleTimeSaved} onCancel={() => setTimeModal(null)}
        />
      </Modal>
    </Layout>
  )
}
