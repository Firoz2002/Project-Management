'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { clearToken, getUser } from '@/lib/api'

const NAV = [
  { href: '/',          label: 'Overview',       icon: GridIcon   },
  { href: '/projects',  label: 'Projects',        icon: FolderIcon },
  { href: '/tasks',     label: 'All Tasks',        icon: TaskIcon   },
  { href: '/resources', label: 'Resources',        icon: TeamIcon   },
  { href: '/standup',   label: 'Daily Standup',    icon: StandupIcon},
]

export default function Layout({ children }) {
  const pathname = usePathname()
  const router   = useRouter()
  const [user, setUser]           = useState(null)
  const [sidebarOpen, setSidebar] = useState(true)

  useEffect(() => { setUser(getUser()) }, [])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    clearToken()
    router.push('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* ── Sidebar ─────────────────────────────────── */}
      <aside
        className={`flex flex-col flex-shrink-0 transition-all duration-300
                    ${sidebarOpen ? 'w-56' : 'w-16'}
                    bg-navy text-white`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10 min-h-[57px]">
          <div className="w-8 h-8 bg-brand-orange rounded-lg flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 16 16" className="w-4 h-4 fill-white">
              <polygon points="8,2 14,14 2,14" />
            </svg>
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <div className="text-sm font-bold tracking-wide leading-tight">PRABISHA</div>
              <div className="text-[10px] text-white/50 leading-tight">Project Management</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition
                            ${active
                              ? 'bg-white/15 text-white'
                              : 'text-white/65 hover:bg-white/10 hover:text-white'}`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {sidebarOpen && <span className="truncate">{label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* User + collapse */}
        <div className="border-t border-white/10 px-2 py-3 space-y-1">
          {sidebarOpen && user && (
            <div className="flex items-center gap-2 px-3 py-2">
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold flex-shrink-0">
                {user.initials}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                <p className="text-[10px] text-white/50 capitalize truncate">{user.role?.toLowerCase()}</p>
              </div>
            </div>
          )}
          <button onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/10 transition"
          >
            <LogoutIcon className="w-4 h-4 flex-shrink-0" />
            {sidebarOpen && 'Sign out'}
          </button>
          <button onClick={() => setSidebar(v => !v)}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/10 transition"
          >
            {sidebarOpen
              ? <><ChevronLeftIcon className="w-4 h-4" /><span>Collapse</span></>
              : <ChevronRightIcon className="w-4 h-4" />
            }
          </button>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 min-h-[57px]">
          <div className="text-sm text-gray-500">
            {new Date().toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <span className="text-xs text-gray-500">
                Logged in as <strong className="text-navy">{user.name}</strong>
              </span>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

// ── Icon components ───────────────────────────────────────────
function GridIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>
}
function FolderIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/>
  </svg>
}
function TaskIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
  </svg>
}
function TeamIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-5a4 4 0 11-8 0 4 4 0 018 0zm6 2a3 3 0 11-6 0 3 3 0 016 0zM3 17a3 3 0 116 0"/>
  </svg>
}
function StandupIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
  </svg>
}
function LogoutIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h6a2 2 0 012 2v1"/>
  </svg>
}
function ChevronLeftIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
  </svg>
}
function ChevronRightIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
  </svg>
}
