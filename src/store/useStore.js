import { useState, useEffect } from 'react'
import { supabase } from './supabase'

// ── DB ↔ App field mapping ──────────────────────────────
function dbToPage(row) {
  return {
    id: row.id,
    headline: row.headline || '',
    broadNotes: row.broad_notes || '',
    quickNotes: row.quick_notes || [],
    checklist: row.checklist || [],
    timeline: row.timeline || [],
    kanban: row.kanban || { todo: [], working: [], completed: [] },
    goals: row.goals || [],
    sectionOrder: row.section_order || null,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  }
}

function pageToDb(patch) {
  const map = {
    headline:     'headline',
    broadNotes:   'broad_notes',
    quickNotes:   'quick_notes',
    checklist:    'checklist',
    timeline:     'timeline',
    kanban:       'kanban',
    goals:        'goals',
    sectionOrder: 'section_order',
  }
  const result = {}
  for (const [appKey, dbKey] of Object.entries(map)) {
    if (patch[appKey] !== undefined) result[dbKey] = patch[appKey]
  }
  return result
}

// ── Hook ────────────────────────────────────────────────
export function useAppStore(userId) {
  const [pages, setPages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) { setPages([]); setLoading(false); return }
    fetchPages()
  }, [userId])

  async function fetchPages() {
    setLoading(true)
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('created_at', { ascending: true })
    if (!error && data) setPages(data.map(dbToPage))
    setLoading(false)
  }

  async function createPage() {
    const { data, error } = await supabase
      .from('notes')
      .insert([{ user_id: userId }])
      .select()
      .single()
    if (error) throw error
    const page = dbToPage(data)
    setPages(prev => [...prev, page])
    return page.id
  }

  async function updatePage(id, patch) {
    const dbPatch = pageToDb(patch)
    dbPatch.updated_at = new Date().toISOString()
    const { error } = await supabase.from('notes').update(dbPatch).eq('id', id)
    if (error) throw error
    setPages(prev =>
      prev.map(p => p.id === id ? { ...p, ...patch, updatedAt: Date.now() } : p)
    )
  }

  async function deletePage(id) {
    await supabase.from('notes').delete().eq('id', id)
    setPages(prev => prev.filter(p => p.id !== id))
  }

  return { pages, loading, createPage, updatePage, deletePage }
}
