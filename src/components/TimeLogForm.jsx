'use client'

import { useState } from 'react'
import { api } from '@/lib/api'

export default function TimeLogForm({ taskId, taskTitle, onSaved, onCancel }) {
  const [form, setForm] = useState({
    hours:       '',
    date:        new Date().toISOString().split('T')[0],
    description: '',
  })
  const [error,  setError]  = useState('')
  const [saving, setSaving] = useState(false)

  const set = (f, v) => setForm(prev => ({ ...prev, [f]: v }))

  const handleSubmit = async () => {
    setError('')
    const hours = Number(form.hours)
    if (!form.hours || isNaN(hours) || hours < 0.25 || hours > 24) {
      setError('Hours must be between 0.25 and 24'); return
    }
    if (!form.date) { setError('Date is required'); return }

    setSaving(true)
    try {
      const log = await api.post('/api/timelogs', {
        taskId,
        hours,
        date:        form.date,
        description: form.description || null,
      })
      onSaved(log)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="modal-body space-y-4">
        {taskTitle && (
          <div className="bg-navy-50 rounded-lg px-4 py-2 text-sm">
            <span className="text-gray-500">Logging time for: </span>
            <span className="font-semibold text-navy">{taskTitle}</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Hours Worked *</label>
            <input type="number" className="form-input" value={form.hours}
              onChange={e => set('hours', e.target.value)}
              min="0.25" max="24" step="0.25" placeholder="e.g. 2.5" />
            <p className="text-xs text-gray-400 mt-1">Min: 0.25h &nbsp;·&nbsp; Max: 24h</p>
          </div>
          <div>
            <label className="form-label">Date *</label>
            <input type="date" className="form-input" value={form.date}
              onChange={e => set('date', e.target.value)} />
          </div>
        </div>

        <div>
          <label className="form-label">Description <span className="text-gray-400 normal-case font-normal">(optional)</span></label>
          <textarea className="form-textarea" rows={2} value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="What did you work on?" maxLength={500} />
        </div>
      </div>

      <div className="modal-footer">
        <button className="btn-outline btn" onClick={onCancel} disabled={saving}>Cancel</button>
        <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
          {saving ? 'Logging…' : 'Log Time'}
        </button>
      </div>
    </>
  )
}
