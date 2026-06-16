import { useState } from 'react'
import { LayoutDashboard, BarChart2, Target, PiggyBank } from 'lucide-react'
import Dashboard from './pages/Dashboard'
import Analytics from './pages/Analytics'
import Budgets from './pages/Budgets'
import Potjes from './pages/Potjes'
import { ToastProvider } from './hooks/useToast'
import './index.css'

const PAGES = [
  { key: 'dashboard', label: 'Overzicht', icon: LayoutDashboard, component: Dashboard },
  { key: 'analytics', label: 'Analyse',   icon: BarChart2,       component: Analytics },
  { key: 'budgets',   label: 'Budgetten', icon: Target,          component: Budgets },
  { key: 'potjes',    label: 'Potjes',    icon: PiggyBank,       component: Potjes },
]

export default function App() {
  const [page, setPage] = useState('dashboard')
  const current = PAGES.find(p => p.key === page)
  const PageComponent = current.component

  return (
    <ToastProvider>
      <div className="app-shell">
        <header className="topbar">
          <span className="topbar-brand">Pock<span>it</span></span>
          <span className="text-muted" style={{ fontSize: '.78rem' }}>
            {new Date().toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' })}
          </span>
        </header>

        <main style={{ flex: 1 }}>
          <PageComponent />
        </main>

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
