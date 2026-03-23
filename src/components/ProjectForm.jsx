'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { PROJECT_STATUSES, PRIORITIES, RISK_LEVELS, CATEGORIES } from '@/lib/constants'

const EMPTY = {
  name: '', category: 'PRODUCT_DEVELOPMENT', status: 'NOT_STARTED',
  priority: 'MEDIUM', ownerId: '', startDate: '', dueDate: '',
  completionPct: 0, description: '', riskLevel: 'MEDIUM',
}

export default function ProjectForm({ project, users, onSaved, onCancel }) {
  const isEdit = Boolean(project?.id)
  const [form, setForm]     = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (project) {
      setForm({
        name:          project.name          || '',
        category:      project.category      || 'PRODUCT_DEVELOPMENT',
        status:        project.status        || 'NOT_STARTED',
        priority:      project.priority      || 'MEDIUM',
        ownerId:       project.ownerId       || project.owner?.id || '',
        startDate:     project.startDate     ? project.startDate.split('T')[0] : '',
        dueDate:       project.dueDate       ? project.dueDate.split('T')[0]   : '',
        completionPct: project.completionPct ?? 0,
        description:   project.description   || '',
        riskLevel:     project.riskLevel      || 'MEDIUM',
      })
    } else {
      setForm({ ...EMPTY, startDate: new Date().toISOString().split('T')[0] })
    }
    setErrors({})
  }, [project])

  const set = (field, value) => {
    setForm(f => ({ ...f, [field]: value }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: null }))
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim())    e.name     = 'Project name is required'
    if (!form.ownerId)        e.ownerId  = 'Owner is required'
    if (!form.startDate)      e.startDate = 'Start date is required'
    if (!form.dueDate)        e.dueDate   = 'Due date is required'
    if (form.startDate && form.dueDate && form.startDate > form.dueDate)
      e.dueDate = 'Due date must be after start date'
    if (form.completionPct < 0 || form.completionPct > 100)
      e.completionPct = 'Must be 0–100'
    return e
  }

  const handleSubmit = async () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }

    setSaving(true)
    try {
      const payload = { ...form, completionPct: Number(form.completionPct) }
      const saved = isEdit
        ? await api.put(`/api/projects/${project.id}`, payload)
        : await api.post('/api/projects', payload)
      onSaved(saved)
    } catch (err) {
      setErrors({ _global: err.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="modal-body space-y-4">
        {errors._global && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            {errors._global}
          </div>
        )}

        {/* Name */}
        <div>
          <label className="form-label">Project Name *</label>
          <input className="form-input" value={form.name}
            onChange={e => set('name', e.target.value)} placeholder="e.g. GrowthOS Build" maxLength={120} />
          {errors.name && <p className="form-error">{errors.name}</p>}
        </div>

        {/* Category + Priority */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Category *</label>
            <select className="form-select" value={form.category} onChange={e => set('category', e.target.value)}>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Priority *</label>
            <select className="form-select" value={form.priority} onChange={e => set('priority', e.target.value)}>
              {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
        </div>

        {/* Status + Risk */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Status *</label>
            <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
              {PROJECT_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Risk Level *</label>
            <select className="form-select" value={form.riskLevel} onChange={e => set('riskLevel', e.target.value)}>
              {RISK_LEVELS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
        </div>

        {/* Owner */}
        <div>
          <label className="form-label">Project Owner *</label>
          <select className="form-select" value={form.ownerId} onChange={e => set('ownerId', e.target.value)}>
            <option value="">— Select owner —</option>
            {(users || []).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          {errors.ownerId && <p className="form-error">{errors.ownerId}</p>}
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Start Date *</label>
            <input type="date" className="form-input" value={form.startDate}
              onChange={e => set('startDate', e.target.value)} />
            {errors.startDate && <p className="form-error">{errors.startDate}</p>}
          </div>
          <div>
            <label className="form-label">Due Date *</label>
            <input type="date" className="form-input" value={form.dueDate}
              onChange={e => set('dueDate', e.target.value)} />
            {errors.dueDate && <p className="form-error">{errors.dueDate}</p>}
          </div>
        </div>

        {/* Completion % */}
        <div>
          <label className="form-label">Completion % &nbsp;<span className="text-navy font-bold">{form.completionPct}%</span></label>
          <input type="range" min="0" max="100" step="5"
            className="w-full accent-navy" value={form.completionPct}
            onChange={e => set('completionPct', parseInt(e.target.value))} />
          {errors.completionPct && <p className="form-error">{errors.completionPct}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="form-label">Description</label>
          <textarea className="form-textarea" rows={3} value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="Brief description of the project scope and goals..." maxLength={2000} />
        </div>
      </div>

      <div className="modal-footer">
        <button className="btn-outline btn" onClick={onCancel} disabled={saving}>Cancel</button>
        <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
          {saving ? 'Saving…' : isEdit ? 'Update Project' : 'Create Project'}
        </button>
      </div>
    </>
  )
}
