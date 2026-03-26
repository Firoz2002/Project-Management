'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { setToken, setUser } from '@/lib/api'

// Define the roles to match your Enum
const USER_ROLES = [
  'ADMIN',
  'MANAGER',
  'DEVELOPER',
  'DESIGNER',
  'CONTENT',
  'MARKETING',
  'CONSULTANT'
]

export default function RegisterPage() {
  const router = useRouter()
  
  // Form State
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('DEVELOPER') // Default role
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  // UI State
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Basic Validation
    if (!name.trim() || !email.trim() || !password || !role) {
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
          password,
          role // Sending the selected role
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
      console.error('Registration error:', err)
      setError('Network error. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-4">
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

            {/* Role Selection Dropdown */}
            <div>
              <label className="form-label">User Role</label>
              <select 
                className="form-input appearance-none bg-no-repeat bg-[right_0.5rem_center]" 
                value={role}
                onChange={e => setRole(e.target.value)}
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundSize: '1.25rem' }}
              >
                {USER_ROLES.map(r => (
                  <option key={r} value={r}>
                    {r.charAt(0) + r.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
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