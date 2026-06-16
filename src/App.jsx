import { useState, useEffect } from 'react'
import { LayoutDashboard, BarChart2, Target, PiggyBank, Sun, Moon, AlertTriangle } from 'lucide-react'
import Dashboard from './pages/Dashboard'
import Analytics from './pages/Analytics'
import Budgets from './pages/Budgets'
import Potjes from './pages/Potjes'
import { ToastProvider } from './hooks/useToast'
import { isConfigured } from './lib/supabase'
import './index.css'

const PAGES = [
  { key: 'dashboard', label: 'Overzicht',  icon: LayoutDashboard, component: Dashboard },
  { key: 'analytics', label: 'Analyse',    icon: BarChart2,       component: Analytics },
  { key: 'budgets',   label: 'Budgetten',  icon: Target,          component: Budgets },
  { key: 'potjes',    label: 'Potjes',     icon: PiggyBank,       component: Potjes },
]

export default function App() {
  const [page, setPage] = useState('dashboard')
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('pockit-theme')
    return saved ? saved === 'dark' : true // dark by default
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    localStorage.setItem('pockit-theme', dark ? 'dark' : 'light')
  }, [dark])

  const current = PAGES.find(p => p.key === page)
  const PageComponent = current.component

  return (
    <ToastProvider>
      <div className="app-shell">

        {/* ── Top bar ── */}
        <header className="topbar">
          <span className="topbar-brand">Pock<span>it</span></span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span className="text-muted" style={{ fontSize: '.78rem' }}>
              {new Date().toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' })}
            </span>
            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setDark(d => !d)}
              title="Dark/light mode wisselen">
              {dark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          </div>
        </header>

        {/* ── Config warning ── */}
        {!isConfigured && (
          <div className="config-warning">
            <AlertTriangle size={16} />
            Supabase is nog niet geconfigureerd — stel de GitHub Secrets in of maak een <code>.env.local</code> aan.
          </div>
        )}

        {/* ── Desktop: sidebar + content | Mobile: content + bottom nav ── */}
        <div className="layout-body">

          {/* Sidebar (desktop only) */}
          <nav className="sidebar">
            <div className="sidebar-inner">
              {PAGES.map(p => {
                const Icon = p.icon
                return (
                  <button key={p.key}
                    className={`sidebar-item ${page === p.key ? 'active' : ''}`}
                    onClick={() => setPage(p.key)}>
                    <Icon size={20} />
                    <span>{p.label}</span>
                  </button>
                )
              })}
            </div>
          </nav>

          {/* Main content */}
          <main className="main-content">
            <PageComponent />
          </main>

        </div>

        {/* Bottom nav (mobile only) */}
        <nav className="bottom-nav">
          {PAGES.map(p => {
            const Icon = p.icon
            return (
              <button key={p.key} className={`nav-item ${page === p.key ? 'active' : ''}`}
                onClick={() => setPage(p.key)}>
                <Icon />
                {p.label}
              </button>
            )
          })}
        </nav>

      </div>
    </ToastProvider>
  )
}
