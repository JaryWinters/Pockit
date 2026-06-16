import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Guard: als de env-variabelen ontbreken (bv. lokaal zonder .env.local),
// gooien we een duidelijke fout in plaats van een vage 401
if (!supabaseUrl || !supabaseKey || supabaseUrl === 'undefined') {
  console.error(
    '[Pockit] Supabase credentials ontbreken.\n' +
    'Maak een .env.local aan met VITE_SUPABASE_URL en VITE_SUPABASE_ANON_KEY,\n' +
    'of stel de GitHub Secrets in voor de deploy workflow.'
  )
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder'
)

export const isConfigured = !!(
  supabaseUrl && supabaseKey &&
  supabaseUrl !== 'undefined' &&
  supabaseKey !== 'undefined' &&
  supabaseUrl !== 'https://placeholder.supabase.co'
)

// ── Transactions ──────────────────────────────────────────────
export async function getTransactions({ month, year } = {}) {
  let query = supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false })

  if (month !== undefined && year !== undefined) {
    const from = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const to   = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    query = query.gte('date', from).lte('date', to)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function addTransaction(tx) {
  const { data, error } = await supabase
    .from('transactions').insert([tx]).select().single()
  if (error) throw error
  return data
}

export async function deleteTransaction(id) {
  const { error } = await supabase.from('transactions').delete().eq('id', id)
  if (error) throw error
}

export async function updateTransaction(id, updates) {
  const { data, error } = await supabase
    .from('transactions').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

// ── Budgets ───────────────────────────────────────────────────
export async function getBudgets() {
  const { data, error } = await supabase
    .from('budgets').select('*').order('category')
  if (error) throw error
  return data
}

export async function upsertBudget(budget) {
  const { data, error } = await supabase
    .from('budgets').upsert([budget], { onConflict: 'category' }).select().single()
  if (error) throw error
  return data
}

export async function deleteBudget(id) {
  const { error } = await supabase.from('budgets').delete().eq('id', id)
  if (error) throw error
}

// ── Potjes ────────────────────────────────────────────────────
export async function getPotjes() {
  const { data, error } = await supabase
    .from('potjes').select('*').order('naam')
  if (error) throw error
  return data
}

export async function upsertPotje(potje) {
  const { data, error } = await supabase
    .from('potjes').upsert([potje]).select().single()
  if (error) throw error
  return data
}

export async function deletePotje(id) {
  const { error } = await supabase.from('potjes').delete().eq('id', id)
  if (error) throw error
}

export async function addPotjeMutatie(mutatie) {
  const { data, error } = await supabase
    .from('potje_mutaties').insert([mutatie]).select().single()
  if (error) throw error
  return data
}

export async function getPotjeMutaties(potjeId) {
  const { data, error } = await supabase
    .from('potje_mutaties').select('*').eq('potje_id', potjeId)
    .order('datum', { ascending: false })
  if (error) throw error
  return data
}
