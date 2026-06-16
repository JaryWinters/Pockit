import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { format, subMonths } from 'date-fns'
import { nl } from 'date-fns/locale'
import { getTransactions } from '../lib/supabase'
import { useToast } from '../hooks/useToast'

const COLORS = ['#5a4fcf','#2d9e6b','#d94f4f','#d4830a','#0ea5e9','#8b5cf6','#ec4899','#14b8a6','#f59e0b','#64748b']
function fmt(n) { return '€' + Number(n).toFixed(0) }

export default function Analytics() {
  const toast = useToast()
  const [data, setData] = useState([]) // last 6 months
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const months = Array.from({ length: 6 }, (_, i) => subMonths(new Date(), i))
        const results = await Promise.all(months.map(m =>
          getTransactions({ month: m.getMonth() + 1, year: m.getFullYear() })
        ))
        setData(months.map((m, i) => ({
          name: format(m, 'MMM', { locale: nl }),
          inkomsten: results[i].filter(t => t.type === 'income').reduce((s, t) => s + +t.bedrag, 0),
          uitgaven:  results[i].filter(t => t.type === 'expense').reduce((s, t) => s + +t.bedrag, 0),
          txs: results[i]
        })).reverse())
      } catch (e) { toast('Fout: ' + e.message, 'error') }
      setLoading(false)
    }
    load()
  }, [])

  // Category breakdown for current month (last item)
  const currentTxs = data[data.length - 1]?.txs || []
  const catData = Object.entries(
    currentTxs.filter(t => t.type === 'expense').reduce((acc, t) => {
      acc[t.categorie] = (acc[t.categorie] || 0) + +t.bedrag; return acc
    }, {})
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)

  const totalExpense = catData.reduce((s, c) => s + c.value, 0)

  if (loading) return <div className="page"><div className="empty"><div className="empty-icon">⏳</div>Laden...</div></div>

  return (
    <div className="page">
      <div className="section-head" style={{ marginTop: 0 }}>
        <h2>Inkomsten vs Uitgaven</h2>
        <span className="text-muted">6 maanden</span>
      </div>

      <div className="card">
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={fmt} />
              <Tooltip formatter={(v) => fmt(v)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="inkomsten" fill="#2d9e6b" radius={[4,4,0,0]} />
              <Bar dataKey="uitgaven"  fill="#d94f4f" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {catData.length > 0 && <>
        <div className="section-head">
          <h2>Uitgaven per categorie</h2>
          <span className="text-muted">deze maand</span>
        </div>
        <div className="card">
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={catData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                  dataKey="value" nameKey="name">
                  {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => fmt(v)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Category breakdown list */}
          <hr className="divider" />
          {catData.map((c, i) => (
            <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: '.65rem', marginBottom: '.55rem' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: '.85rem' }}>{c.name}</span>
              <span style={{ fontSize: '.85rem', fontWeight: 600 }}>{fmt(c.value)}</span>
              <span className="text-muted" style={{ minWidth: 38, textAlign: 'right' }}>
                {((c.value / totalExpense) * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </>}

      {catData.length === 0 && (
        <div className="empty">
          <div className="empty-icon">📊</div>
          Nog geen uitgaven deze maand om te analyseren.
        </div>
      )}
    </div>
  )
}
