'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import Modal from '@/components/Modal'
import TaskForm from '@/components/TaskForm'
import TimeLogForm from '@/components/TimeLogForm'
import { api } from '@/lib/api'
import {
  statusColors, priorityColors, TASK_STATUSES,
  labelFor, PRIORITIES, isOverdue, isDueSoon, formatDate,
} from '@/lib/constants'

export default function TaskDetailPage() {
  const { id }   = useParams()
  const router   = useRouter()

  const [task,       setTask]       = useState(null)
  const [projects,   setProjects]   = useState([])
  const [users,      setUsers]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [editModal,  setEditModal]  = useState(false)
  const [timeModal,  setTimeModal]  = useState(false)
  const [comment,    setComment]    = useState('')
  const [posting,    setPosting]    = useState(false)

  const load = useCallback(async () => {
    try {
      const [t, p, u] = await Promise.all([
        api.get(`/api/tasks/${id}`),
        projects.length ? Promise.resolve(projects) : api.get('/api/projects'),
        users.length    ? Promise.resolve(users)    : api.get('/api/users'),
      ])
      setTask(t)
      if (!projects.length) setProjects(p)
      if (!users.length)    setUsers(u)
    } catch { router.push('/tasks') }
    finally  { setLoading(false) }
  }, [id])

  useEffect(() => { load() }, [load])

  const postComment = async () => {
    if (!comment.trim()) return
    setPosting(true)
    try {
      await api.post('/api/comments', { taskId: id, content: comment.trim() })
      setComment('')
      load()
    } finally { setPosting(false) }
  }

  const updateStatus = async (newStatus) => {
    const updated = await api.patch(`/api/tasks/${id}`, { status: newStatus })
    setTask(updated)
  }

  if (loading) return <Layout><div className="text-center py-16 text-gray-400">Loading…</div></Layout>
  if (!task)   return null

  const over  = isOverdue(task.dueDate, task.status)
  const soon  = isDueSoon(task.dueDate, task.status)
  const sc    = statusColors[task.status]   || statusColors.NOT_STARTED
  const pc    = priorityColors[task.priority] || priorityColors.MEDIUM
  const ovhrs = task.actualHrs > task.estimatedHrs

  return (
    <Layout>
      {/* Back */}
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-navy mb-5 transition">
        ← Back
      </button>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* ── Left column: main detail ── */}
        <div className="xl:col-span-2 space-y-5">

          {/* Header card */}
          <div className="card px-6 py-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{task.id}</span>
                  <span className="text-xs text-gray-400">in</span>
                  <span className="text-xs font-bold text-navy">{task.project?.name}</span>
                </div>
                <h1 className="text-lg font-bold text-navy leading-snug">{task.title}</h1>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button className="btn-outline btn-sm" onClick={() => setEditModal(true)}>Edit</button>
                <button className="btn-primary btn-sm" onClick={() => setTimeModal(true)}>+ Log Time</button>
              </div>
            </div>

            {/* Status selector */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <select
                value={task.status}
                onChange={e => updateStatus(e.target.value)}
                className={`text-sm rounded-lg border px-3 py-1.5 font-semibold cursor-pointer
                            focus:outline-none focus:ring-2 focus:ring-navy
                            ${sc.bg} ${sc.text} ${sc.border}`}
              >
                {TASK_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <span className={`badge ${pc.bg} ${pc.text}`}>{labelFor(PRIORITIES, task.priority)}</span>
              <span className={`text-sm font-medium ${over ? 'text-red-600 font-bold' : soon ? 'text-yellow-600' : 'text-gray-600'}`}>
                Due: {formatDate(task.dueDate)}{over ? ' ⚠ OVERDUE' : soon ? ' ⏰ Due soon' : ''}
              </span>
            </div>

            {/* Meta grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-t border-gray-100">
              <div>
                <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Assignee</p>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-navy-50 flex items-center justify-center text-xs font-bold text-navy">
                    {task.assignee?.initials}
                  </div>
                  <span className="text-sm font-semibold">{task.assignee?.name}</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Estimated</p>
                <p className="text-xl font-bold text-navy">{task.estimatedHrs}h</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Logged</p>
                <p className={`text-xl font-bold ${ovhrs ? 'text-red-600' : 'text-brand-teal'}`}>
                  {task.actualHrs}h
                </p>
                {ovhrs && (
                  <p className="text-[10px] text-red-500 font-semibold">
                    +{Math.round((task.actualHrs - task.estimatedHrs) * 10) / 10}h over budget
                  </p>
                )}
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Remaining</p>
                <p className={`text-xl font-bold ${ovhrs ? 'text-red-600' : 'text-gray-700'}`}>
                  {Math.max(0, Math.round((task.estimatedHrs - task.actualHrs) * 10) / 10)}h
                </p>
              </div>
            </div>

            {/* Hours progress bar */}
            <div className="mt-2">
              <div className="progress-bar">
                <div className="progress-fill"
                  style={{
                    width: `${Math.min(100, Math.round((task.actualHrs / Math.max(task.estimatedHrs, 0.01)) * 100))}%`,
                    background: ovhrs ? '#DC2626' : '#1A237E',
                  }}
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                {Math.min(100, Math.round((task.actualHrs / Math.max(task.estimatedHrs, 0.01)) * 100))}% of estimated hours used
              </p>
            </div>
          </div>

          {/* Notes */}
          {task.notes && (
            <div className="card px-6 py-4">
              <p className="text-[10px] font-bold uppercase text-gray-400 mb-2">Notes</p>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{task.notes}</p>
            </div>
          )}

          {/* Tags */}
          {task.tags?.length > 0 && (
            <div className="card px-6 py-4">
              <p className="text-[10px] font-bold uppercase text-gray-400 mb-2">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {task.tags.map(t => <span key={t} className="tag text-xs">{t}</span>)}
              </div>
            </div>
          )}

          {/* Dependencies */}
          {task.dependsOnTasks?.length > 0 && (
            <div className="card px-6 py-4">
              <p className="text-[10px] font-bold uppercase text-gray-400 mb-3">Depends On</p>
              <div className="space-y-2">
                {task.dependsOnTasks.map(dep => (
                  <div key={dep.dependsOnTaskId}
                    className="flex items-center gap-3 bg-purple-50 rounded-lg px-3 py-2">
                    <span className="font-mono text-xs text-purple-700 font-bold">
                      {dep.dependsOnTask?.id || dep.dependsOnTaskId}
                    </span>
                    <span className="text-sm text-purple-800">{dep.dependsOnTask?.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          <div className="card px-6 py-5">
            <p className="text-[10px] font-bold uppercase text-gray-400 mb-4">
              Comments ({task.comments?.length || 0})
            </p>

            {/* Comment input */}
            <div className="flex gap-3 mb-5">
              <textarea
                className="form-textarea flex-1" rows={2}
                placeholder="Add a comment, update, or blocker note…"
                value={comment} onChange={e => setComment(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) postComment() }}
              />
              <button className="btn-primary btn-sm self-end" onClick={postComment} disabled={posting || !comment.trim()}>
                {posting ? '…' : 'Post'}
              </button>
            </div>

            {/* Comment list */}
            {task.comments?.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No comments yet.</p>
            ) : (
              <div className="space-y-4">
                {task.comments?.map(c => (
                  <div key={c.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-navy-50 flex items-center justify-center text-xs font-bold text-navy flex-shrink-0 mt-0.5">
                      {c.user.initials}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-navy">{c.user.name}</span>
                        <span className="text-[11px] text-gray-400">
                          {new Date(c.createdAt).toLocaleDateString('en-GB', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right column: time log history ── */}
        <div className="space-y-5">
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase text-gray-400">Time Log History</p>
              <button className="btn-ghost btn-sm text-xs" onClick={() => setTimeModal(true)}>+ Log Time</button>
            </div>

            {!task.timeLogs?.length ? (
              <div className="px-5 py-8 text-center text-sm text-gray-400">No time logged yet.</div>
            ) : (
              <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
                {task.timeLogs.map(log => (
                  <div key={log.id} className="px-5 py-3">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-navy-50 flex items-center justify-center text-[10px] font-bold text-navy">
                          {log.user?.initials}
                        </div>
                        <span className="text-xs font-semibold text-gray-700">{log.user?.name}</span>
                      </div>
                      <span className="text-sm font-bold text-brand-teal">{log.hours}h</span>
                    </div>
                    <p className="text-[11px] text-gray-400 ml-8">
                      {formatDate(log.date)}
                      {log.description && ` · ${log.description}`}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {task.timeLogs?.length > 0 && (
              <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-between text-xs">
                <span className="text-gray-500">{task.timeLogs.length} entries</span>
                <span className="font-bold text-navy">
                  Total: {Math.round(task.timeLogs.reduce((s, l) => s + l.hours, 0) * 10) / 10}h
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Task Modal */}
      <Modal open={editModal} onClose={() => setEditModal(false)} title="Edit Task" size="lg">
        <TaskForm
          task={task} projects={projects} users={users}
          onSaved={(saved) => { setTask(saved); setEditModal(false) }}
          onCancel={() => setEditModal(false)}
        />
      </Modal>

      {/* Log Time Modal */}
      <Modal open={timeModal} onClose={() => setTimeModal(false)} title="Log Time" size="sm">
        <TimeLogForm
          taskId={task.id} taskTitle={task.title}
          onSaved={() => { setTimeModal(false); load() }}
          onCancel={() => setTimeModal(false)}
        />
      </Modal>
    </Layout>
  )
}
