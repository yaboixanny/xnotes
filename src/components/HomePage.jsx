import { useState } from 'react'

const CARD_ACCENTS = ['#4a6cf7', '#e05c97', '#f0a030', '#3ecf8e', '#a855f7', '#0ea5e9']

function getAccent(id) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash)
  return CARD_ACCENTS[Math.abs(hash) % CARD_ACCENTS.length]
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function calcProgress(page) {
  const checkDone = page.checklist.filter(i => i.checked).length
  const checkTotal = page.checklist.length
  const kanbanDone = page.kanban.completed.length
  const kanbanTotal = page.kanban.todo.length + page.kanban.working.length + page.kanban.completed.length
  const total = checkTotal + kanbanTotal
  if (total === 0) return null
  return Math.round(((checkDone + kanbanDone) / total) * 100)
}

function progressColor(pct) {
  if (pct < 33) return '#e05252'
  if (pct < 66) return '#f0a030'
  return '#3ecf8e'
}

function overallProgress(pages) {
  let done = 0, total = 0
  for (const p of pages) {
    done += p.checklist.filter(i => i.checked).length + p.kanban.completed.length
    total += p.checklist.length + p.kanban.todo.length + p.kanban.working.length + p.kanban.completed.length
  }
  if (total === 0) return null
  return Math.round((done / total) * 100)
}

export default function HomePage({ pages, user, onCreate, onOpen, onDelete }) {
  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  const overall = overallProgress(pages)

  // Group by category
  const groups = {}
  for (const page of [...pages].reverse()) {
    const cat = page.category || 'General'
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(page)
  }
  const categoryOrder = Object.keys(groups).sort((a, b) =>
    a === 'General' ? -1 : b === 'General' ? 1 : a.localeCompare(b)
  )

  return (
    <div className="home">
      {/* Hero */}
      <div className="home-hero">
        <div className="home-hero-text">
          <p className="home-greeting">{greeting()}{user?.name ? `, ${user.name}` : ''}</p>
          <h1 className="home-title">My Notes</h1>
          <p className="home-date">{today}</p>
        </div>
        <button className="btn-new-note" onClick={onCreate}>
          <span className="btn-new-note-icon">+</span>
          New Note
        </button>
      </div>

      {/* Stats + overall progress */}
      {pages.length > 0 && (
        <div className="home-stats">
          <div className="home-stat">
            <span className="home-stat-value">{pages.length}</span>
            <span className="home-stat-label">Notes</span>
          </div>
          <div className="home-stat-divider" />
          <div className="home-stat">
            <span className="home-stat-value">
              {pages.reduce((n, p) => n + p.checklist.filter(i => i.checked).length, 0)}
              <span className="home-stat-of">/{pages.reduce((n, p) => n + p.checklist.length, 0)}</span>
            </span>
            <span className="home-stat-label">Tasks done</span>
          </div>
          {overall !== null && (
            <>
              <div className="home-stat-divider" />
              <div className="home-stat home-stat-progress">
                <span className="home-stat-label">Overall progress</span>
                <div className="overall-progress-track">
                  <div
                    className="overall-progress-fill"
                    style={{ width: `${overall}%`, background: progressColor(overall) }}
                  />
                </div>
                <span className="home-stat-pct" style={{ color: progressColor(overall) }}>{overall}%</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Notes grouped by category */}
      {pages.length === 0 ? (
        <div className="home-empty">
          <div className="home-empty-icon">✦</div>
          <p className="home-empty-title">Nothing here yet</p>
          <p className="home-empty-sub">Create your first note to get started.</p>
          <button className="btn-new-note" onClick={onCreate}>
            <span className="btn-new-note-icon">+</span>
            New Note
          </button>
        </div>
      ) : (
        categoryOrder.map(cat => (
          <div key={cat} className="home-category">
            <p className="home-section-label">{cat}</p>
            <div className="home-grid">
              {groups[cat].map(page => (
                <NoteCard
                  key={page.id}
                  page={page}
                  accent={getAccent(page.id)}
                  onOpen={() => onOpen(page.id)}
                  onDelete={() => onDelete(page.id)}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function NoteCard({ page, accent, onOpen, onDelete }) {
  const tasksDone = page.checklist.filter(i => i.checked).length
  const totalTasks = page.checklist.length
  const totalKanban =
    page.kanban.todo.length + page.kanban.working.length + page.kanban.completed.length

  const updated = new Date(page.updatedAt).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric',
  })

  const chips = [
    totalTasks > 0 && `${tasksDone}/${totalTasks} tasks`,
    page.quickNotes.length > 0 && `${page.quickNotes.length} notes`,
    totalKanban > 0 && `${totalKanban} cards`,
  ].filter(Boolean)

  const pct = calcProgress(page)
  const color = pct !== null ? progressColor(pct) : null

  return (
    <div className="note-card" onClick={onOpen} style={{ '--card-accent': accent }}>
      <div className="note-card-accent-bar" />
      <div className="note-card-body">
        <div className="note-card-top">
          <h2 className="note-card-title">{page.headline || 'Untitled'}</h2>
          <button
            className="btn-delete note-card-delete"
            onClick={e => { e.stopPropagation(); onDelete() }}
          >×</button>
        </div>

        {page.broadNotes ? (
          <p className="note-card-preview">
            {page.broadNotes.slice(0, 100)}{page.broadNotes.length > 100 ? '…' : ''}
          </p>
        ) : (
          <p className="note-card-preview note-card-empty-preview">No notes yet…</p>
        )}

        {pct !== null && (
          <div className="card-progress">
            <div className="card-progress-track">
              <div
                className="card-progress-fill"
                style={{ width: `${pct}%`, background: color }}
              />
            </div>
            <span className="card-progress-pct" style={{ color }}>{pct}%</span>
          </div>
        )}

        <div className="note-card-footer">
          <div className="note-card-chips">
            {chips.map(c => <span key={c} className="note-chip">{c}</span>)}
          </div>
          <span className="note-card-date">{updated}</span>
        </div>
      </div>
    </div>
  )
}
