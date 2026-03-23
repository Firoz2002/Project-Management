'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { setToken, setUser } from '@/lib/api'

export default function RegisterPage() {
  const router = useRouter()
  
  // Form State
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  // UI State
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Basic Validation
    if (!name.trim() || !email.trim() || !password) {
      setError('All fields are required')
      return
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: name.trim(),
          email: email.trim().toLowerCase(), 
          password 
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Registration failed')
        return
      }

      // Auto-login after successful registration
      setToken(data.token)
      setUser(data.user)
      router.push('/')
      
    } catch (err) {
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
          <h2 className="text-lg font-bold text-navy mb-6">Create an account</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label className="form-label">Full Name</label>
              <input
                type="text" className="form-input" value={name}
                onChange={e => { setName(e.target.value); setError('') }}
                placeholder="John Doe" autoFocus
              />
            </div>

            <div>
              <label className="form-label">Email address</label>
              <input
                type="email" className="form-input" value={email} autoComplete="email"
                onChange={e => { setEmail(e.target.value); setError('') }}
                placeholder="you@prabisha.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Password</label>
                <input
                  type="password" className="form-input" value={password} autoComplete="new-password"
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="form-label">Confirm</label>
                <input
                  type="password" className="form-input" value={confirmPassword} autoComplete="new-password"
                  onChange={e => { setConfirmPassword(e.target.value); setError('') }}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full py-2.5 mt-2">
              {loading ? 'Creating account…' : 'Register'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-brand-orange font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          © {new Date().getFullYear()} Prabisha Consulting Ltd. Internal use only.
        </p>
      </div>
    </div>
  )
}