'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { TASK_STATUSES, PRIORITIES } from '@/lib/constants'

const EMPTY = {
  projectId: '', title: '', assigneeId: '', estimatedHrs: '',
  actualHrs: '0', status: 'NOT_STARTED', priority: 'MEDIUM',
  dueDate: '', notes: '', tags: '', dependsOn: [],
}

export default function TaskForm({ task, projects, users, defaultProjectId, onSaved, onCancel }) {
  const isEdit = Boolean(task?.id)
  const [form, setForm]     = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [allTasks, setAllTasks] = useState([])

  // Load tasks for dependency picker when project changes
  useEffect(() => {
    if (!form.projectId) { setAllTasks([]); return }
    api.get(`/api/tasks?projectId=${form.projectId}`)
      .then(tasks => setAllTasks(tasks.filter(t => t.id !== task?.id)))
      .catch(() => {})
  }, [form.projectId, task?.id])

  useEffect(() => {
    if (task) {
      setForm({
        projectId:    task.projectId    || task.project?.id || '',
        title:        task.title        || '',
        assigneeId:   task.assigneeId   || task.assignee?.id || '',
        estimatedHrs: task.estimatedHrs != null ? String(task.estimatedHrs) : '',
        actualHrs:    task.actualHrs    != null ? String(task.actualHrs)    : '0',
        status:       task.status       || 'NOT_STARTED',
        priority:     task.priority     || 'MEDIUM',
        dueDate:      task.dueDate      ? task.dueDate.split('T')[0] : '',
        notes:        task.notes        || '',
        tags:         (task.tags || []).join(', '),
        dependsOn:    (task.dependsOnTasks || []).map(d => d.dependsOnTaskId || d.dependsOnTask?.id).filter(Boolean),
      })
    } else {
      setForm({ ...EMPTY, projectId: defaultProjectId || '', dueDate: new Date().toISOString().split('T')[0] })
    }
    setErrors({})
  }, [task, defaultProjectId])

  const set = (field, value) => {
    setForm(f => ({ ...f, [field]: value }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: null }))
  }

  const toggleDep = (id) => {
    setForm(f => ({
      ...f,
      dependsOn: f.dependsOn.includes(id)
        ? f.dependsOn.filter(d => d !== id)
        : [...f.dependsOn, id],
    }))
  }

  const validate = () => {
    const e = {}
    if (!form.projectId)              e.projectId    = 'Project is required'
    if (!form.title.trim())           e.title        = 'Task title is required'
    if (!form.assigneeId)             e.assigneeId   = 'Assignee is required'
    if (!form.dueDate)                e.dueDate      = 'Due date is required'
    if (form.estimatedHrs === '' || isNaN(Number(form.estimatedHrs)) || Number(form.estimatedHrs) < 0)
      e.estimatedHrs = 'Valid estimated hours required (0 or more)'
    if (isNaN(Number(form.actualHrs)) || Number(form.actualHrs) < 0)
      e.actualHrs = 'Valid actual hours required (0 or more)'
    return e
  }

  const handleSubmit = async () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }

    setSaving(true)
    try {
      const tags = form.tags
        .split(',')
        .map(t => t.trim().toLowerCase().replace(/\s+/g, '-'))
        .filter(Boolean)

      const payload = {
        ...form,
        estimatedHrs: Number(form.estimatedHrs),
        actualHrs:    Number(form.actualHrs),
        tags,
      }
      delete payload.tags  // we rebuild above
      payload.tags = tags

      const saved = isEdit
        ? await api.put(`/api/tasks/${task.id}`, payload)
        : await api.post('/api/tasks', payload)
      onSaved(saved)
    } catch (err) {
      setErrors({ _global: err.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="modal-body space-y-4 max-h-[70vh] overflow-y-auto">
        {errors._global && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            {errors._global}
          </div>
        )}

        {/* Project */}
        <div>
          <label className="form-label">Project *</label>
          <select className="form-select" value={form.projectId}
            onChange={e => set('projectId', e.target.value)}>
            <option value="">— Select project —</option>
            {(projects || []).map(p => (
              <option key={p.id} value={p.id}>{p.id}: {p.name}</option>
            ))}
          </select>
          {errors.projectId && <p className="form-error">{errors.projectId}</p>}
        </div>

        {/* Title */}
        <div>
          <label className="form-label">Task Title *</label>
          <input className="form-input" value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="e.g. Homepage redesign v2 (Figma)" maxLength={200} />
          {errors.title && <p className="form-error">{errors.title}</p>}
        </div>

        {/* Assignee + Priority */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Assignee *</label>
            <select className="form-select" value={form.assigneeId}
              onChange={e => set('assigneeId', e.target.value)}>
              <option value="">— Select assignee —</option>
              {(users || []).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            {errors.assigneeId && <p className="form-error">{errors.assigneeId}</p>}
          </div>
          <div>
            <label className="form-label">Priority *</label>
            <select className="form-select" value={form.priority}
              onChange={e => set('priority', e.target.value)}>
              {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
        </div>

        {/* Status + Due Date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Status *</label>
            <select className="form-select" value={form.status}
              onChange={e => set('status', e.target.value)}>
              {TASK_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Due Date *</label>
            <input type="date" className="form-input" value={form.dueDate}
              onChange={e => set('dueDate', e.target.value)} />
            {errors.dueDate && <p className="form-error">{errors.dueDate}</p>}
          </div>
        </div>

        {/* Hours */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Estimated Hours *</label>
            <input type="number" className="form-input" value={form.estimatedHrs} min="0" step="0.5"
              onChange={e => set('estimatedHrs', e.target.value)} placeholder="e.g. 16" />
            {errors.estimatedHrs && <p className="form-error">{errors.estimatedHrs}</p>}
          </div>
          <div>
            <label className="form-label">Actual Hours Logged</label>
            <input type="number" className="form-input" value={form.actualHrs} min="0" step="0.5"
              onChange={e => set('actualHrs', e.target.value)} placeholder="0" />
            {errors.actualHrs && <p className="form-error">{errors.actualHrs}</p>}
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="form-label">Tags <span className="text-gray-400 normal-case font-normal">(comma-separated)</span></label>
          <input className="form-input" value={form.tags}
            onChange={e => set('tags', e.target.value)}
            placeholder="e.g. frontend, design, api" />
        </div>

        {/* Dependencies */}
        {allTasks.length > 0 && (
          <div>
            <label className="form-label">Depends On <span className="text-gray-400 normal-case font-normal">(blocks this task)</span></label>
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-40 overflow-y-auto">
              {allTasks.map(t => (
                <label key={t.id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox" className="accent-navy"
                    checked={form.dependsOn.includes(t.id)}
                    onChange={() => toggleDep(t.id)} />
                  <span className="text-xs font-mono text-gray-400 w-10 flex-shrink-0">{t.id}</span>
                  <span className="text-sm text-gray-700 truncate">{t.title}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="form-label">Notes</label>
          <textarea className="form-textarea" rows={3} value={form.notes}
            onChange={e => set('notes', e.target.value)}
            placeholder="Any blockers, context, or handover notes..." maxLength={2000} />
        </div>
      </div>

      <div className="modal-footer">
        <button className="btn-outline btn" onClick={onCancel} disabled={saving}>Cancel</button>
        <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
          {saving ? 'Saving…' : isEdit ? 'Update Task' : 'Create Task'}
        </button>
      </div>
    </>
  )
}
