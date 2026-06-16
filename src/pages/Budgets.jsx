import { useState, useEffect } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { getBudgets, upsertBudget, deleteBudget, isConfigured } from '../lib/supabase'
import { useToast } from '../hooks/useToast'

const CATEGORIES = [
  'Boodschappen', 'Fastfood & afhaal', 'Hypotheek', 'Verzekeringen',
  'Internet', 'Water', 'Energie', 'Streaming', 'Huwelijk',
  'Renovatie', 'Vakantie', 'Kleding', 'Gezondheid', 'Cadeaus', 'Andere'
]

function fmt(n) { return '€' + Number(n).toFixed(2).replace('.', ',') }

function BudgetModal({ initial, onSave, onClose }) {
  const [cat, setCat] = useState(initial?.category || '')
  const [limit, setLimit] = useState(initial?.monthly_limit ? String(initial.monthly_limit) : '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!cat || !limit) return
    setSaving(true)
    await onSave({ id: initial?.id, category: cat, monthly_limit: parseFloat(limit) })
    setSaving(false)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="flex-between" style={{ marginBottom: '1rem' }}>
          <h2 className="modal-title" style={{ margin: 0 }}>{initial ? 'Budget bewerken' : 'Budget toevoegen'}</h2>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="form-group">
          <label className="form-label">Categorie</label>
          <select className="form-select" value={cat} onChange={e => setCat(e.target.value)} disabled={!!initial}>
            <option value="">Kies een categorie</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Maandlimiet (€)</label>
          <input className="form-input" type="number" min="0" step="0.01"
            placeholder="0,00" value={limit} onChange={e => setLimit(e.target.value)} />
        </div>
        <div className="form-actions">
          <button className="btn btn-ghost" onClick={onClose}>Annuleer</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || !cat || !limit}>
            {saving ? 'Opslaan...' : 'Opslaan'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Budgets() {
  const toast = useToast()
  const [budgets, setBudgets] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    if (!isConfigured) { setLoading(false); return }
    try { setBudgets(await getBudgets()) }
    catch (e) { toast('Fout: ' + e.message, 'error') }
    setLoading(false)
  }

  async function handleSave(data) {
    try {
      const saved = await upsertBudget(data)
      setBudgets(b => {
        const existing = b.findIndex(x => x.id === saved.id)
        if (existing >= 0) { const n = [...b]; n[existing] = saved; return n }
        return [...b, saved]
      })
      toast('Budget opgeslagen', 'success')
    } catch (e) { toast('Fout: ' + e.message, 'error') }
    setShowModal(false); setEditing(null)
  }

  async function handleDelete(id) {
    if (!confirm('Budget verwijderen?')) return
    try {
      await deleteBudget(id)
      setBudgets(b => b.filter(x => x.id !== id))
      toast('Verwijderd', 'success')
    } catch (e) { toast('Fout: ' + e.message, 'error') }
  }

  const totalBudgeted = budgets.reduce((s, b) => s + +b.monthly_limit, 0)

  return (
    <div className="page">
      <div className="flex-between" style={{ marginBottom: '1rem' }}>
        <div>
          <div className="text-muted">Totaal gebudgetteerd</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--accent)' }}>{fmt(totalBudgeted)}/maand</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setShowModal(true) }}>
          <Plus size={16} /> Budget
        </button>
      </div>

      {loading ? (
        <div className="empty"><div className="empty-icon">⏳</div>Laden...</div>
      ) : budgets.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">🎯</div>
          Nog geen budgetten ingesteld.<br />Voeg er een toe om je uitgaven te bewaken.
        </div>
      ) : (
        <div className="card">
          <div className="card-title">Maandbudgetten</div>
          {budgets.map(b => (
            <div key={b.id} className="budget-row">
              <div className="flex-between">
                <div>
                  <div className="budget-row-name">{b.category}</div>
                  <div className="text-muted mt-1">{fmt(b.monthly_limit)} / maand</div>
                </div>
                <div style={{ display: 'flex', gap: '.4rem' }}>
                  <button className="btn btn-ghost btn-sm"
                    onClick={() => { setEditing(b); setShowModal(true) }}>Bewerken</button>
                  <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(b.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Suggested budgets based on conversation */}
      <div className="section-head" style={{ marginTop: '1.5rem' }}>
        <h2>💡 Suggesties op basis van jouw situatie</h2>
      </div>
      <div className="card">
        {[
          { cat: 'Hypotheek', amount: 899.58 },
          { cat: 'Verzekeringen', amount: 47.48 },
          { cat: 'Internet', amount: 51.55 },
          { cat: 'Water', amount: 33.33 },
          { cat: 'Energie', amount: 125.00 },
          { cat: 'Streaming', amount: 25.00 },
          { cat: 'Boodschappen', amount: 280.00 },
          { cat: 'Fastfood & afhaal', amount: 230.00 },
          { cat: 'Huwelijk', amount: 350.00 },
        ].map(s => (
          <div key={s.cat} className="budget-row">
            <div className="flex-between">
              <div>
                <div className="budget-row-name">{s.cat}</div>
                <div className="text-muted mt-1">{fmt(s.amount)} / maand</div>
              </div>
              <button className="btn btn-ghost btn-sm"
                onClick={() => handleSave({ category: s.cat, monthly_limit: s.amount })}>
                Overnemen
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <BudgetModal
          initial={editing}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditing(null) }}
        />
      )}
    </div>
  )
}
