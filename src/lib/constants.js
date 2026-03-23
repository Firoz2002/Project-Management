// ─────────────────────────────────────────────────────────────
// Shared constants — used by both client & server
// ─────────────────────────────────────────────────────────────

export const PROJECT_STATUSES = [
  { value: 'NOT_STARTED', label: 'Not Started' },
  { value: 'PLANNING',    label: 'Planning'    },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETE',    label: 'Complete'    },
  { value: 'BLOCKED',     label: 'Blocked'     },
  { value: 'ON_HOLD',     label: 'On Hold'     },
]

export const TASK_STATUSES = [
  { value: 'NOT_STARTED', label: 'Not Started' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'REVIEW',      label: 'Review'      },
  { value: 'COMPLETE',    label: 'Complete'    },
  { value: 'BLOCKED',     label: 'Blocked'     },
]

export const PRIORITIES = [
  { value: 'LOW',      label: 'Low'      },
  { value: 'MEDIUM',   label: 'Medium'   },
  { value: 'HIGH',     label: 'High'     },
  { value: 'CRITICAL', label: 'Critical' },
]

export const RISK_LEVELS = [
  { value: 'LOW',    label: 'Low'    },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH',   label: 'High'   },
]

export const CATEGORIES = [
  { value: 'PRODUCT_DEVELOPMENT', label: 'Product Development' },
  { value: 'MARKETING',           label: 'Marketing'           },
  { value: 'OPERATIONS',          label: 'Operations'          },
  { value: 'ENGINEERING',         label: 'Engineering'         },
  { value: 'CONSULTING',          label: 'Consulting'          },
  { value: 'DESIGN',              label: 'Design'              },
  { value: 'RESEARCH',            label: 'Research'            },
]

// ── Colour utilities ──────────────────────────────────────

export const statusColors = {
  NOT_STARTED: { bg: 'bg-gray-100',   text: 'text-gray-700',   border: 'border-gray-300'  },
  PLANNING:    { bg: 'bg-blue-100',   text: 'text-blue-700',   border: 'border-blue-300'  },
  IN_PROGRESS: { bg: 'bg-navy-50',    text: 'text-navy-light', border: 'border-navy-100'  },
  COMPLETE:    { bg: 'bg-green-100',  text: 'text-green-700',  border: 'border-green-300' },
  BLOCKED:     { bg: 'bg-red-100',    text: 'text-red-700',    border: 'border-red-300'   },
  ON_HOLD:     { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300'},
  REVIEW:      { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300'},
}

export const priorityColors = {
  LOW:      { bg: 'bg-teal-50',   text: 'text-teal-700',   border: 'border-teal-200'  },
  MEDIUM:   { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200'},
  HIGH:     { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200'},
  CRITICAL: { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200'   },
}

export const riskColors = {
  LOW:    'text-green-700',
  MEDIUM: 'text-yellow-700',
  HIGH:   'text-red-700',
}

// ── Helpers ───────────────────────────────────────────────

export function labelFor(list, value) {
  return list.find(i => i.value === value)?.label ?? value
}

export function isOverdue(dueDate, status) {
  if (!dueDate || status === 'COMPLETE') return false
  return new Date(dueDate) < new Date()
}

export function isDueSoon(dueDate, status) {
  if (!dueDate || status === 'COMPLETE') return false
  const diff = (new Date(dueDate) - new Date()) / 86400000
  return diff >= 0 && diff <= 3
}

export function formatDate(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function progressColor(pct) {
  if (pct === 100) return '#2E7D32'
  if (pct >= 60)   return '#1A237E'
  if (pct >= 30)   return '#E65100'
  return '#9E9E9E'
}
