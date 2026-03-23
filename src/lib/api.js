// ─────────────────────────────────────────────────────────────
// Client-side API Helper
// Auto-attaches JWT from localStorage
// Handles auth errors (redirects to login)
// ─────────────────────────────────────────────────────────────

const getToken = () => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('pm_token')
}

export const setToken = (token) => {
  if (typeof window === 'undefined') return
  localStorage.setItem('pm_token', token)
  // Also set cookie for middleware page-route protection
  document.cookie = `pm_token=${token}; path=/; max-age=${7 * 24 * 3600}; SameSite=Lax`
}

export const clearToken = () => {
  if (typeof window === 'undefined') return
  localStorage.removeItem('pm_token')
  localStorage.removeItem('pm_user')
  document.cookie = 'pm_token=; path=/; max-age=0'
}

export const getUser = () => {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('pm_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const setUser = (user) => {
  if (typeof window === 'undefined') return
  localStorage.setItem('pm_user', JSON.stringify(user))
}

// ── Core fetch wrapper ─────────────────────────────────────

async function apiFetch(url, options = {}) {
  const token = getToken()

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  // Session expired → redirect to login
  if (res.status === 401) {
    clearToken()
    //if (typeof window !== 'undefined') window.location.href = '/login'
    throw new Error('Session expired. Please log in again.')
  }

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(data.error || data.message || `Request failed (${res.status})`)
  }

  return data
}

// ── Named exports ──────────────────────────────────────────

export const api = {
  get:    (url)       => apiFetch(url),
  post:   (url, body) => apiFetch(url, { method: 'POST',   body: JSON.stringify(body) }),
  put:    (url, body) => apiFetch(url, { method: 'PUT',    body: JSON.stringify(body) }),
  patch:  (url, body) => apiFetch(url, { method: 'PATCH',  body: JSON.stringify(body) }),
  delete: (url)       => apiFetch(url, { method: 'DELETE' }),
}
