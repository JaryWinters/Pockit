import { useState } from 'react'
import { X } from 'lucide-react'

const CATEGORIES_EXPENSE = [
  'Boodschappen', 'Fastfood & afhaal', 'Hypotheek', 'Verzekeringen',
  'Internet', 'Water', 'Energie', 'Streaming', 'Huwelijk',
  'Renovatie', 'Vakantie', 'Kleding', 'Gezondheid', 'Cadeaus',
  'Andere'
]
const CATEGORIES_INCOME = ['Loon', 'IVT', 'Maaltijdcheques', 'Andere inkomsten']

export default function TransactionForm({ onSave, onClose, initial }) {
  const [type, setType] = useState(initial?.type || 'expense')
  const [desc, setDesc] = useState(initial?.beschrijving || '')
  const [amount, setAmount] = useState(initial?.bedrag ? String(initial.bedrag) : '')
  const [cat, setCat] = useState(initial?.categorie || '')
  const [date, setDate] = useState(initial?.date || new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState(initial?.notitie || '')
  const [saving, setSaving] = useState(false)

  const cats = type === 'expense' ? CATEGORIES_EXPENSE : CATEGORIES_INCOME

  async function handleSubmit() {
    if (!desc.trim() || !amount || !cat) return
    setSaving(true)
    await onSave({
      type,
      beschrijving: desc.trim(),
      bedrag: parseFloat(amount),
      categorie: cat,
      date,
      notitie: note.trim(),
    })
    setSaving(false)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="flex-between" style={{ marginBottom: '1rem' }}>
          <h2 className="modal-title" style={{ margin: 0 }}>
            {initial ? 'Bewerken' : 'Nieuwe transactie'}
          </h2>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="type-toggle">
          <button
            className={`type-btn ${type === 'expense' ? 'active expense' : ''}`}
            onClick={() => { setType('expense'); setCat('') }}
          >— Uitgave</button>
          <button
            className={`type-btn ${type === 'income' ? 'active income' : ''}`}
            onClick={() => { setType('income'); setCat('') }}
          >+ Inkomst</button>
        </div>

        <div className="form-group">
          <label className="form-label">Omschrijving</label>
          <input className="form-input" placeholder="bv. Aldi weekboodschappen"
            value={desc} onChange={e => setDesc(e.target.value)} />
        </div>

        <div className="form-group">
          <label className="form-label">Bedrag (€)</label>
          <input className="form-input" type="number" min="0" step="0.01"
            placeholder="0,00" value={amount} onChange={e => setAmount(e.target.value)} />
        </div>

        <div className="form-group">
          <label className="form-label">Categorie</label>
          <select className="form-select" value={cat} onChange={e => setCat(e.target.value)}>
            <option value="">Kies een categorie</option>
            {cats.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Datum</label>
          <input className="form-input" type="date" value={date}
            onChange={e => setDate(e.target.value)} />
        </div>

        <div className="form-group">
          <label className="form-label">Notitie (optioneel)</label>
          <textarea className="form-textarea" placeholder="Extra info..."
            value={note} onChange={e => setNote(e.target.value)} />
        </div>

        <div className="form-actions">
          <button className="btn btn-ghost" onClick={onClose}>Annuleer</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving || !desc || !amount || !cat}>
            {saving ? 'Opslaan...' : 'Opslaan'}
          </button>
        </div>
      </div>
    </div>
  )
}
