import { useState, useEffect } from 'react'
import { Plus, Trash2, X, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'
import { getPotjes, upsertPotje, deletePotje, addPotjeMutatie, getPotjeMutaties } from '../lib/supabase'
import { useToast } from '../hooks/useToast'

function fmt(n) { return '€' + Number(n).toFixed(2).replace('.', ',') }

function PotjeModal({ initial, onSave, onClose }) {
  const [naam, setNaam] = useState(initial?.naam || '')
  const [emoji, setEmoji] = useState(initial?.emoji || '🪣')
  const [doel, setDoel] = useState(initial?.doelbedrag ? String(initial.doelbedrag) : '')
  const [huidig, setHuidig] = useState(initial?.huidig_bedrag ? String(initial.huidig_bedrag) : '0')
  const [saving, setSaving] = useState(false)

  const EMOJIS = ['🪣','💍','✈️','🔨','🏖️','🚗','📱','🎓','🏠','💊','🎁','🐶','💡','🎮','🌱']

  async function handleSave() {
    if (!naam || !doel) return
    setSaving(true)
    await onSave({
      id: initial?.id,
      naam: naam.trim(),
      emoji,
      doelbedrag: parseFloat(doel),
      huidig_bedrag: parseFloat(huidig) || 0,
    })
    setSaving(false)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="flex-between" style={{ marginBottom: '1rem' }}>
          <h2 className="modal-title" style={{ margin: 0 }}>{initial ? 'Potje bewerken' : 'Nieuw potje'}</h2>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="form-group">
          <label className="form-label">Emoji</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem' }}>
            {EMOJIS.map(e => (
              <button key={e} onClick={() => setEmoji(e)}
                style={{ fontSize: '1.3rem', padding: '.25rem .4rem', borderRadius: 8,
                  border: `2px solid ${emoji === e ? 'var(--accent)' : 'var(--border)'}`,
                  background: emoji === e ? 'var(--accent-bg)' : 'var(--white)', cursor: 'pointer' }}>
                {e}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Naam</label>
          <input className="form-input" placeholder="bv. Huwelijk 2026"
            value={naam} onChange={e => setNaam(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Doelbedrag (€)</label>
          <input className="form-input" type="number" min="0" step="0.01"
            placeholder="0,00" value={doel} onChange={e => setDoel(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Huidig bedrag (€)</label>
          <input className="form-input" type="number" min="0" step="0.01"
            placeholder="0,00" value={huidig} onChange={e => setHuidig(e.target.value)} />
        </div>

        <div className="form-actions">
          <button className="btn btn-ghost" onClick={onClose}>Annuleer</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || !naam || !doel}>
            {saving ? 'Opslaan...' : 'Opslaan'}
          </button>
        </div>
      </div>
    </div>
  )
}

function MutatieModal({ potje, onClose, onDone }) {
  const toast = useToast()
  const [type, setType] = useState('toevoegen')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!amount) return
    setSaving(true)
    try {
      const delta = type === 'toevoegen' ? +amount : -amount
      const newBedrag = Math.max(0, potje.huidig_bedrag + delta)
      await Promise.all([
        addPotjeMutatie({ potje_id: potje.id, type, bedrag: +amount, notitie: note, datum: new Date().toISOString().slice(0,10) }),
        upsertPotje({ ...potje, huidig_bedrag: newBedrag })
      ])
      toast(`${type === 'toevoegen' ? '+' : '-'}${fmt(+amount)} bij ${potje.naam}`, 'success')
      onDone(newBedrag)
    } catch (e) { toast('Fout: ' + e.message, 'error') }
    setSaving(false)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="flex-between" style={{ marginBottom: '1rem' }}>
          <h2 className="modal-title" style={{ margin: 0 }}>{potje.emoji} {potje.naam}</h2>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="type-toggle">
          <button className={`type-btn ${type === 'toevoegen' ? 'active income' : ''}`}
            onClick={() => setType('toevoegen')}>+ Toevoegen</button>
          <button className={`type-btn ${type === 'opnemen' ? 'active expense' : ''}`}
            onClick={() => setType('opnemen')}>− Opnemen</button>
        </div>
        <div className="form-group">
          <label className="form-label">Bedrag (€)</label>
          <input className="form-input" type="number" min="0" step="0.01"
            placeholder="0,00" value={amount} onChange={e => setAmount(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Notitie (optioneel)</label>
          <input className="form-input" placeholder="Reden of omschrijving"
            value={note} onChange={e => setNote(e.target.value)} />
        </div>
        <div className="form-actions">
          <button className="btn btn-ghost" onClick={onClose}>Annuleer</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || !amount}>
            {saving ? 'Opslaan...' : 'Bevestigen'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Potjes() {
  const toast = useToast()
  const [potjes, setPotjes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [mutating, setMutating] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    try { setPotjes(await getPotjes()) }
    catch (e) { toast('Fout: ' + e.message, 'error') }
    setLoading(false)
  }

  async function handleSave(data) {
    try {
      const saved = await upsertPotje(data)
      setPotjes(p => {
        const i = p.findIndex(x => x.id === saved.id)
        if (i >= 0) { const n = [...p]; n[i] = saved; return n }
        return [...p, saved]
      })
      toast('Potje opgeslagen', 'success')
    } catch (e) { toast('Fout: ' + e.message, 'error') }
    setShowModal(false); setEditing(null)
  }

  async function handleDelete(id) {
    if (!confirm('Potje verwijderen?')) return
    try {
      await deletePotje(id)
      setPotjes(p => p.filter(x => x.id !== id))
      toast('Verwijderd', 'success')
    } catch (e) { toast('Fout: ' + e.message, 'error') }
  }

  return (
    <div className="page">
      <div className="flex-between" style={{ marginBottom: '1rem' }}>
        <div>
          <div className="text-muted">Totaal gespaard</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--green)' }}>
            {fmt(potjes.reduce((s, p) => s + +p.huidig_bedrag, 0))}
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setShowModal(true) }}>
          <Plus size={16} /> Potje
        </button>
      </div>

      {loading ? (
        <div className="empty"><div className="empty-icon">⏳</div>Laden...</div>
      ) : potjes.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">🪣</div>
          Nog geen spaarpotjes.<br />Maak er een aan voor je huwelijk, renovatie of vakantie.
        </div>
      ) : (
        <div className="potje-grid">
          {potjes.map(p => {
            const pct = Math.min((p.huidig_bedrag / p.doelbedrag) * 100, 100)
            const cls = pct >= 100 ? 'ok' : pct >= 50 ? 'warn' : 'ok'
            const resterend = Math.max(0, p.doelbedrag - p.huidig_bedrag)
            return (
              <div key={p.id} className="potje-card">
                <div className="potje-head">
                  <div>
                    <div className="potje-name">{p.naam}</div>
                    <div className="text-muted mt-1">Doel: {fmt(p.doelbedrag)}</div>
                  </div>
                  <div className="potje-emoji">{p.emoji}</div>
                </div>

                <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '.4rem' }}>
                  {fmt(p.huidig_bedrag)}
                </div>

                <div className="progress-bar-bg">
                  <div className={`progress-bar-fill ${pct >= 100 ? 'ok' : 'ok'}`}
                    style={{ width: pct + '%', background: pct >= 100 ? 'var(--green)' : 'var(--accent)' }} />
                </div>

                <div className="potje-amounts">
                  <span>{pct.toFixed(0)}% bereikt</span>
                  {resterend > 0 && <span>Nog <strong>{fmt(resterend)}</strong> te gaan</span>}
                  {resterend === 0 && <span className="badge badge-green">✓ Doel bereikt!</span>}
                </div>

                <div style={{ display: 'flex', gap: '.5rem', marginTop: '.85rem' }}>
                  <button className="btn btn-ghost btn-sm" style={{ flex: 1 }}
                    onClick={() => setMutating(p)}>
                    Bijwerken
                  </button>
                  <button className="btn btn-ghost btn-sm"
                    onClick={() => { setEditing(p); setShowModal(true) }}>Bewerken</button>
                  <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(p.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <PotjeModal initial={editing} onSave={handleSave} onClose={() => { setShowModal(false); setEditing(null) }} />
      )}
      {mutating && (
        <MutatieModal
          potje={mutating}
          onClose={() => setMutating(null)}
          onDone={(newBedrag) => {
            setPotjes(p => p.map(x => x.id === mutating.id ? { ...x, huidig_bedrag: newBedrag } : x))
            setMutating(null)
          }}
        />
      )}
    </div>
  )
}
