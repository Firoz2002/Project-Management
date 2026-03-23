'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { setToken, setUser } from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password) { setError('Email and password are required'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim().toLowerCase(), password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Login failed'); return }

      setToken(data.token)
      setUser(data.user)
      router.push('/')
    } catch {
      setError('Network error. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)', backgroundSize: '48px 48px' }}
      />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-brand-orange rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg viewBox="0 0 16 16" className="w-8 h-8 fill-white">
              <polygon points="8,2 14,14 2,14" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">PRABISHA</h1>
          <p className="text-white/50 text-sm mt-1">Project Management System</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-modal p-8">
          <h2 className="text-lg font-bold text-navy mb-6">Sign in to your account</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label className="form-label">Email address</label>
              <input
                type="email" className="form-input" value={email} autoComplete="email"
                onChange={e => { setEmail(e.target.value); setError('') }}
                placeholder="you@prabisha.com" autoFocus
              />
            </div>

            <div>
              <label className="form-label">Password</label>
              <input
                type="password" className="form-input" value={password} autoComplete="current-password"
                onChange={e => { setPassword(e.target.value); setError('') }}
                placeholder="••••••••"
              />
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full py-2.5 mt-2">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            Default password: <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono">Prabisha@2026</code>
          </p>
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          © {new Date().getFullYear()} Prabisha Consulting Ltd. Internal use only.
        </p>
      </div>
    </div>
  )
}
