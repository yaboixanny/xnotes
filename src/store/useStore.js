import { useState, useEffect } from 'react'

const STORAGE_KEY = 'note-app-data'
const VERSION = 2

function newPage(id) {
  return {
    id,
    headline: '',
    broadNotes: '',
    quickNotes: [],
    checklist: [],
    timeline: [],
    kanban: { todo: [], working: [], completed: [] },
    goals: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

function migrate(raw) {
  // v1 was a single flat note; convert to pages array
  if (!raw.version || raw.version < 2) {
    const hasContent =
      raw.headline || raw.broadNotes ||
      raw.notes?.length || raw.checklist?.length ||
      raw.timeline?.length || raw.goals?.length
    const pages = hasContent
      ? [{
          ...newPage(crypto.randomUUID()),
          headline: raw.headline || '',
          broadNotes: raw.broadNotes || '',
          quickNotes: raw.notes || [],
          checklist: raw.checklist || [],
          timeline: raw.timeline || [],
          kanban: { todo: [], working: [], completed: [], ...raw.kanban },
          goals: raw.goals || [],
        }]
      : []
    return { version: VERSION, pages }
  }
  return raw
}

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    return migrate(raw)
  } catch {
    return { version: VERSION, pages: [] }
  }
}

export function useAppStore() {
  const [state, setState] = useState(load)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  function createPage() {
    const page = newPage(crypto.randomUUID())
    setState(s => ({ ...s, pages: [...s.pages, page] }))
    return page.id
  }

  function updatePage(id, patch) {
    setState(s => ({
      ...s,
      pages: s.pages.map(p =>
        p.id === id ? { ...p, ...patch, updatedAt: Date.now() } : p
      ),
    }))
  }

  function updateKanban(id, patch) {
    setState(s => ({
      ...s,
      pages: s.pages.map(p =>
        p.id === id
          ? { ...p, kanban: { ...p.kanban, ...patch }, updatedAt: Date.now() }
          : p
      ),
    }))
  }

  function deletePage(id) {
    setState(s => ({ ...s, pages: s.pages.filter(p => p.id !== id) }))
  }

  return { pages: state.pages, createPage, updatePage, updateKanban, deletePage }
}
