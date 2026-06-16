import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react'
import { format, addMonths, subMonths } from 'date-fns'
import { nl } from 'date-fns/locale'
import { getTransactions, addTransaction, updateTransaction, deleteTransaction, getBudgets } from '../lib/supabase'
import TransactionForm from '../components/TransactionForm'
import { useToast } from '../hooks/useToast'

function fmt(n) { return '€' + Number(n).toFixed(2).replace('.', ',') }

export default function Dashboard() {
  const toast = useToast()
  const [month, setMonth] = useState(new Date())
  const [txs, setTxs] = useState([])
  const [budgets, setBudgets] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const [t, b] = await Promise.all([
        getTransactions({ month: month.getMonth() + 1, year: month.getFullYear() }),
        getBudgets()
      ])
      setTxs(t); setBudgets(b)
    } catch (e) { toast('Fout bij laden: ' + e.message, 'error') }
    setLoading(false)
  }

  useEffect(() => { load() }, [month])

  const income  = txs.filter(t => t.type === 'income').reduce((s, t) => s + +t.bedrag, 0)
  const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + +t.bedrag, 0)
  const balance = income - expense

  // per category spending
  const bycat = txs.filter(t => t.type === 'expense').reduce((acc, t) => {
    acc[t.categorie] = (acc[t.categorie] || 0) + +t.bedrag; return acc
  }, {})

  async function handleSave(data) {
    try {
      if (editing) {
        const updated = await updateTransaction(editing.id, data)
        setTxs(t => t.map(x => x.id === updated.id ? updated : x))
        toast('Transactie bijgewerkt', 'success')
      } else {
        const created = await addTransaction(data)
        setTxs(t => [created, ...t])
        toast('Transactie toegevoegd', 'success')
      }
    } catch (e) { toast('Fout: ' + e.message, 'error') }
    setShowForm(false); setEditing(null)
  }

  async function handleDelete(id) {
    if (!confirm('Transactie verwijderen?')) return
    try {
      await deleteTransaction(id)
      setTxs(t => t.filter(x => x.id !== id))
      toast('Verwijderd', 'success')
    } catch (e) { toast('Fout: ' + e.message, 'error') }
  }

  const EMOJI = { 'Boodschappen':'🛒','Fastfood & afhaal':'🍔','Hypotheek':'🏠','Verzekeringen':'🛡️','Internet':'📡','Water':'💧','Energie':'⚡','Streaming':'📺','Huwelijk':'💍','Renovatie':'🔨','Vakantie':'✈️','Kleding':'👕','Gezondheid':'💊','Cadeaus':'🎁','Loon':'💰','IVT':'💰','Maaltijdcheques':'🍽️','Andere inkomsten':'💰','Andere':'📌' }

  return (
    <div className="page">
      {/* Month nav */}
      <div className="flex-between" style={{ marginBottom: '1.1rem' }}>
        <div className="month-nav">
          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setMonth(m => subMonths(m, 1))}>
            <ChevronLeft size={18} />
          </button>
          <span className="month-label">{format(month, 'MMMM yyyy', { locale: nl })}</span>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setMonth(m => addMonths(m, 1))}>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stat-grid">
        <div className="stat-tile">
          <div className="stat-label">Inkomsten</div>
          <div className="stat-value green">{fmt(income)}</div>
        </div>
        <div className="stat-tile">
          <div className="stat-label">Uitgaven</div>
          <div className="stat-value red">{fmt(expense)}</div>
        </div>
        <div className="stat-tile" style={{ gridColumn: 'span 2' }}>
          <div className="stat-label">Over deze maand</div>
          <div className={`stat-value ${balance >= 0 ? 'green' : 'red'}`}>{fmt(balance)}</div>
        </div>
      </div>

      {/* Budget overview */}
      {budgets.length > 0 && (
        <div className="card" style={{ marginBottom: '.75rem' }}>
          <div className="card-title">Budgetten deze maand</div>
          {budgets.map(b => {
            const spent = bycat[b.category] || 0
            const pct = Math.min((spent / b.monthly_limit) * 100, 100)
            const cls = pct >= 100 ? 'over' : pct >= 80 ? 'warn' : 'ok'
            return (
              <div key={b.id} className="budget-row">
                <div className="budget-row-head">
                  <span className="budget-row-name">{b.category}</span>
                  <span className="budget-row-nums">
                    <strong>{fmt(spent)}</strong> / {fmt(b.monthly_limit)}
                  </span>
                </div>
                <div className="progress-wrap">
                  <div className="progress-bar-bg">
                    <div className={`progress-bar-fill ${cls}`} style={{ width: pct + '%' }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Transaction list */}
      <div className="section-head">
        <h2>Transacties</h2>
        <span className="text-muted">{txs.length} stuks</span>
      </div>

      {loading ? (
        <div className="empty"><div className="empty-icon">⏳</div>Laden...</div>
      ) : txs.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">💸</div>
          Nog geen transacties deze maand.<br />Tik + om er een toe te voegen.
        </div>
      ) : (
        <div className="tx-list">
          {txs.map(tx => (
            <div key={tx.id} className="tx-row">
              <div className={`tx-icon ${tx.type}`}>
                {EMOJI[tx.categorie] || (tx.type === 'income' ? '💰' : '💸')}
              </div>
              <div className="tx-meta">
                <div className="tx-desc">{tx.beschrijving}</div>
                <div className="tx-cat">{tx.categorie} · {tx.date}</div>
              </div>
              <div className="tx-amount" style={{ textAlign: 'right' }}>
                <div className={tx.type}>{tx.type === 'expense' ? '−' : '+'}{fmt(tx.bedrag)}</div>
                <div style={{ display: 'flex', gap: '.3rem', marginTop: '.3rem', justifyContent: 'flex-end' }}>
                  <button className="btn btn-ghost btn-sm btn-icon"
                    onClick={() => { setEditing(tx); setShowForm(true) }}>
                    <Pencil size={13} />
                  </button>
                  <button className="btn btn-danger btn-sm btn-icon"
                    onClick={() => handleDelete(tx.id)}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FAB */}
      <button className="fab" onClick={() => { setEditing(null); setShowForm(true) }}>＋</button>

      {showForm && (
        <TransactionForm
          initial={editing}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null) }}
        />
      )}
    </div>
  )
}
