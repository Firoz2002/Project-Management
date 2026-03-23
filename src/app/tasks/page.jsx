'use client'

import { useState, useEffect, useCallback } from 'react'
import Layout from '@/components/Layout'
import Modal from '@/components/Modal'
import TaskForm from '@/components/TaskForm'
import TimeLogForm from '@/components/TimeLogForm'
import { api } from '@/lib/api'
import {
  statusColors, priorityColors, TASK_STATUSES, PRIORITIES,
  labelFor, isOverdue, isDueSoon, formatDate,
} from '@/lib/constants'

export default function TasksPage() {
  const [tasks,    setTasks]    = useState([])
  const [projects, setProjects] = useState([])
  const [users,    setUsers]    = useState([])
  const [loading,  setLoading]  = useState(true)

  // Filters
  const [search,    setSearch]    = useState('')
  const [projF,     setProjF]     = useState('')
  const [statusF,   setStatusF]   = useState('')
  const [priorityF, setPriorityF] = useState('')
  const [assigneeF, setAssigneeF] = useState('')

  // Sort
  const [sortKey, setSortKey] = useState('dueDate')
  const [sortDir, setSortDir] = useState(1)

  // Modals
  const [taskModal,    setTaskModal]    = useState(null)  // null | 'create' | task-obj
  const [timeModal,    setTimeModal]    = useState(null)  // null | task-obj
  const [quickStatus,  setQuickStatus]  = useState({})    // taskId → saving bool

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (projF)     params.set('projectId',  projF)
      if (statusF)   params.set('status',     statusF)
      if (priorityF) params.set('priority',   priorityF)
      if (assigneeF) params.set('assigneeId', assigneeF)
      if (search)    params.set('search',     search)

      const [t, p, u] = await Promise.all([
        api.get(`/api/tasks?${params}`),
        projects.length ? Promise.resolve(projects) : api.get('/api/projects'),
        users.length    ? Promise.resolve(users)    : api.get('/api/users'),
      ])
      setTasks(t)
      if (!projects.length) setProjects(p)
      if (!users.length)    setUsers(u)
    } finally {
      setLoading(false)
    }
  }, [projF, statusF, priorityF, assigneeF, search])

  useEffect(() => { load() }, [load])

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d * -1)
    else { setSortKey(key); setSortDir(1) }
  }

  const sorted = [...tasks].sort((a, b) => {
    const av = a[sortKey] ?? '', bv = b[sortKey] ?? ''
    return typeof av === 'string'
      ? av.localeCompare(bv) * sortDir
      : (Number(av) - Number(bv)) * sortDir
  })

  const updateStatus = async (task, newStatus) => {
    setQuickStatus(s => ({ ...s, [task.id]: true }))
    try {
      const updated = await api.patch(`/api/tasks/${task.id}`, { status: newStatus })
      setTasks(prev => prev.map(t => t.id === updated.id ? updated : t))
    } catch { /* ignore */ } finally {
      setQuickStatus(s => ({ ...s, [task.id]: false }))
    }
  }

  const handleDelete = async (task) => {
    if (!confirm(`Delete task "${task.title}"?`)) return
    await api.delete(`/api/tasks/${task.id}`)
    setTasks(prev => prev.filter(t => t.id !== task.id))
  }

  const handleSaved = () => { setTaskModal(null); load() }
  const handleTimeLogged = () => { setTimeModal(null); load() }

  const resetFilters = () => {
    setSearch(''); setProjF(''); setStatusF(''); setPriorityF(''); setAssigneeF('')
  }

  const totalEst = tasks.reduce((s, t) => s + (t.estimatedHrs || 0), 0)
  const totalAct = tasks.reduce((s, t) => s + (t.actualHrs    || 0), 0)
  const SortBtn = ({ col, label }) => (
    <th onClick={() => handleSort(col)} className="text-left">
      {label} <span className="opacity-50">{sortKey === col ? (sortDir === 1 ? '↑' : '↓') : '↕'}</span>
    </th>
  )

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-navy">All Tasks</h1>
          <p className="text-sm text-gray-500 mt-0.5">{tasks.length} tasks · Est: {Math.round(totalEst)}h · Logged: {Math.round(totalAct)}h</p>
        </div>
        <button className="btn-orange" onClick={() => setTaskModal('create')}>+ New Task</button>
      </div>

      {/* Filters */}
      <div className="card px-4 py-3 mb-4 flex flex-wrap gap-3 items-center">
        <input className="form-input !w-44 text-xs" placeholder="Search tasks…"
          value={search} onChange={e => setSearch(e.target.value)} />

        <select className="form-select !w-40 text-xs" value={projF} onChange={e => setProjF(e.target.value)}>
          <option value="">All Projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.id}: {p.name.substring(0,28)}…</option>)}
        </select>

        <select className="form-select !w-36 text-xs" value={statusF} onChange={e => setStatusF(e.target.value)}>
          <option value="">All Statuses</option>
          {TASK_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>

        <select className="form-select !w-32 text-xs" value={priorityF} onChange={e => setPriorityF(e.target.value)}>
          <option value="">All Priorities</option>
          {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>

        <select className="form-select !w-36 text-xs" value={assigneeF} onChange={e => setAssigneeF(e.target.value)}>
          <option value="">All Assignees</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>

        <button className="btn-ghost btn-sm" onClick={resetFilters}>Reset</button>

        {/* Legend */}
        <div className="ml-auto flex gap-3 text-[11px] text-gray-400">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block"/>&nbsp;Overdue</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-300 inline-block"/>&nbsp;Blocked</span>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <SortBtn col="id"           label="ID"       />
                <SortBtn col="title"        label="Task"     />
                <th>Project</th>
                <SortBtn col="assigneeId"   label="Assignee" />
                <SortBtn col="priority"     label="Priority" />
                <th>Status</th>
                <SortBtn col="dueDate"      label="Due Date" />
                <SortBtn col="estimatedHrs" label="Est."     />
                <SortBtn col="actualHrs"    label="Logged"   />
                <th>Depends On</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={11} className="text-center py-12 text-gray-400">Loading tasks…</td></tr>
              ) : sorted.length === 0 ? (
                <tr><td colSpan={11} className="text-center py-12 text-gray-400">No tasks match the current filters.</td></tr>
              ) : sorted.map(task => {
                const over  = isOverdue(task.dueDate, task.status)
                const soon  = isDueSoon(task.dueDate, task.status)
                const blk   = task.status === 'BLOCKED'
                const sc    = statusColors[task.status]   || statusColors.NOT_STARTED
                const pc    = priorityColors[task.priority] || priorityColors.MEDIUM
                const ovhrs = task.actualHrs > task.estimatedHrs

                return (
                  <tr key={task.id}
                    className={blk ? 'row-blocked' : over ? 'row-overdue' : ''}>
                    <td>
                      <span className="font-mono text-[11px] text-gray-400">{task.id}</span>
                    </td>
                    <td className="max-w-[260px]">
                      <p className="font-semibold text-navy text-xs leading-tight">{task.title}</p>
                      {task.notes && (
                        <p className="text-[11px] text-gray-400 mt-0.5 italic truncate max-w-[240px]">{task.notes}</p>
                      )}
                      {task.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-0.5 mt-1">
                          {task.tags.map(tag => <span key={tag} className="tag">{tag}</span>)}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="text-[11px] font-bold text-navy">{task.project?.id}</span>
                      <p className="text-[10px] text-gray-400 max-w-[100px] truncate">{task.project?.name}</p>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-navy-50 flex items-center justify-center text-[10px] font-bold text-navy flex-shrink-0">
                          {task.assignee?.initials}
                        </div>
                        <span className="text-xs whitespace-nowrap">{task.assignee?.name}</span>
                      </div>
                    </td>
                    <td><span className={`badge ${pc.bg} ${pc.text}`}>{labelFor(PRIORITIES, task.priority)}</span></td>
                    <td>
                      <select
                        disabled={quickStatus[task.id]}
                        value={task.status}
                        onChange={e => updateStatus(task, e.target.value)}
                        className={`text-xs rounded-lg border px-2 py-1 font-semibold cursor-pointer
                                    focus:outline-none focus:ring-2 focus:ring-navy
                                    ${sc.bg} ${sc.text} ${sc.border}`}
                      >
                        {TASK_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </td>
                    <td>
                      <span className={`text-xs font-medium whitespace-nowrap
                                        ${over ? 'text-red-600 font-bold' : soon ? 'text-yellow-600 font-semibold' : 'text-gray-700'}`}>
                        {formatDate(task.dueDate)}
                      </span>
                      {over && <p className="text-[10px] text-red-500 font-bold">OVERDUE</p>}
                      {soon && !over && <p className="text-[10px] text-yellow-600">Due soon</p>}
                    </td>
                    <td className="text-right">
                      <span className="text-xs font-semibold">{task.estimatedHrs}h</span>
                    </td>
                    <td className="text-right">
                      <span className={`text-xs font-semibold ${ovhrs ? 'text-red-600' : 'text-gray-600'}`}>
                        {task.actualHrs}h
                      </span>
                      {ovhrs && (
                        <p className="text-[10px] text-red-500">+{Math.round((task.actualHrs - task.estimatedHrs) * 10) / 10}h over</p>
                      )}
                    </td>
                    <td>
                      {task.dependsOnTasks?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {task.dependsOnTasks.map(d => (
                            <span key={d.dependsOnTaskId} className="text-[10px] font-mono bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">
                              {d.dependsOnTask?.id || d.dependsOnTaskId}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => setTimeModal(task)}
                          className="text-[11px] text-brand-teal hover:underline px-1.5 py-1 rounded hover:bg-teal-50 whitespace-nowrap">
                          + Time
                        </button>
                        <button onClick={() => setTaskModal(task)}
                          className="text-[11px] text-navy hover:underline px-1.5 py-1 rounded hover:bg-navy-50">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(task)}
                          className="text-[11px] text-red-500 hover:underline px-1.5 py-1 rounded hover:bg-red-50">
                          Del
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Task */}
      <Modal open={taskModal !== null} onClose={() => setTaskModal(null)}
        title={taskModal === 'create' ? 'New Task' : 'Edit Task'} size="lg">
        <TaskForm
          task={taskModal === 'create' ? null : taskModal}
          projects={projects} users={users}
          onSaved={handleSaved} onCancel={() => setTaskModal(null)}
        />
      </Modal>

      {/* Log Time */}
      <Modal open={timeModal !== null} onClose={() => setTimeModal(null)} title="Log Time" size="sm">
        <TimeLogForm
          taskId={timeModal?.id} taskTitle={timeModal?.title}
          onSaved={handleTimeLogged} onCancel={() => setTimeModal(null)}
        />
      </Modal>
    </Layout>
  )
}
