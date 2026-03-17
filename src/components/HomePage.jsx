import { useState, useEffect, useRef } from 'react'
import {
  DndContext, PointerSensor, useSensor, useSensors,
  DragOverlay, useDroppable, useDraggable, rectIntersection,
} from '@dnd-kit/core'

const SECTIONS_KEY = 'note-sections'
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
  if (pct < 33) return '#ef4444'
  if (pct < 66) return '#f0a030'
  return '#10b981'
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

function loadSections() {
  try {
    const s = JSON.parse(localStorage.getItem(SECTIONS_KEY))
    if (Array.isArray(s) && s.length) return s
  } catch {}
  return ['General']
}

function saveSections(s) {
  localStorage.setItem(SECTIONS_KEY, JSON.stringify(s))
}

export default function HomePage({ pages, user, onCreate, onOpen, onDelete, onUpdate }) {
  const [sections, setSections] = useState(loadSections)
  const [activeCard, setActiveCard] = useState(null)
  const [addingSection, setAddingSection] = useState(false)
  const [newSectionName, setNewSectionName] = useState('')
  const addInputRef = useRef(null)

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  // Ensure all note categories exist as sections
  useEffect(() => {
    const cats = pages.map(p => p.category || 'General')
    const missing = cats.filter(c => !sections.includes(c))
    if (missing.length) {
      const updated = [...sections, ...new Set(missing)]
      setSections(updated)
      saveSections(updated)
    }
  }, [pages])

  useEffect(() => {
    if (addingSection) addInputRef.current?.focus()
  }, [addingSection])

  function addSection() {
    const name = newSectionName.trim()
    if (name && !sections.includes(name)) {
      const updated = [...sections, name]
      setSections(updated)
      saveSections(updated)
    }
    setNewSectionName('')
    setAddingSection(false)
  }

  function renameSection(oldName, newName) {
    const trimmed = newName.trim()
    if (!trimmed || trimmed === oldName || sections.includes(trimmed)) return
    const updated = sections.map(s => s === oldName ? trimmed : s)
    setSections(updated)
    saveSections(updated)
    pages.filter(p => (p.category || 'General') === oldName)
      .forEach(p => onUpdate(p.id, { category: trimmed }))
  }

  function deleteSection(name) {
    if (name === 'General') return
    const updated = sections.filter(s => s !== name)
    setSections(updated)
    saveSections(updated)
    pages.filter(p => (p.category || 'General') === name)
      .forEach(p => onUpdate(p.id, { category: 'General' }))
  }

  function handleDragStart({ active }) {
    setActiveCard(pages.find(p => p.id === active.id) ?? null)
  }

  function handleDragEnd({ active, over }) {
    setActiveCard(null)
    if (!over) return
    const card = pages.find(p => p.id === active.id)
    if (!card) return
    const targetSection = over.id
    if (sections.includes(targetSection) && (card.category || 'General') !== targetSection) {
      onUpdate(active.id, { category: targetSection })
    }
  }

  const overall = overallProgress(pages)

  // Group notes by section
  const grouped = {}
  for (const s of sections) grouped[s] = []
  for (const page of [...pages].reverse()) {
    const cat = page.category || 'General'
    if (grouped[cat] !== undefined) grouped[cat].push(page)
    else grouped['General'].push(page)
  }

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

      {/* Stats */}
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
                  <div className="overall-progress-fill" style={{ width: `${overall}%`, background: progressColor(overall) }} />
                </div>
                <span className="home-stat-pct" style={{ color: progressColor(overall) }}>{overall}%</span>
              </div>
            </>
          )}
        </div>
      )}

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
        <DndContext
          sensors={sensors}
          collisionDetection={rectIntersection}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="home-sections">
            {sections.map(section => (
              <DroppableSection
                key={section}
                name={section}
                cards={grouped[section] || []}
                onOpen={onOpen}
                onDelete={onDelete}
                onRename={renameSection}
                onDeleteSection={deleteSection}
                canDelete={section !== 'General'}
              />
            ))}

            {addingSection ? (
              <div className="add-section-row">
                <input
                  ref={addInputRef}
                  className="add-section-input"
                  placeholder="Section name…"
                  value={newSectionName}
                  onChange={e => setNewSectionName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') addSection()
                    if (e.key === 'Escape') { setAddingSection(false); setNewSectionName('') }
                  }}
                />
                <button className="btn-add-section-confirm" onClick={addSection}>Add</button>
                <button className="btn-add-section-cancel" onClick={() => { setAddingSection(false); setNewSectionName('') }}>Cancel</button>
              </div>
            ) : (
              <button className="btn-add-section" onClick={() => setAddingSection(true)}>
                + Add section
              </button>
            )}
          </div>

          <DragOverlay>
            {activeCard && (
              <div style={{ opacity: 0.85, transform: 'rotate(1.5deg)', pointerEvents: 'none' }}>
                <NoteCard page={activeCard} accent={getAccent(activeCard.id)} onOpen={() => {}} onDelete={() => {}} index={0} overlay />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  )
}

function DroppableSection({ name, cards, onOpen, onDelete, onRename, onDeleteSection, canDelete }) {
  const { setNodeRef, isOver } = useDroppable({ id: name })
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(name)
  const inputRef = useRef(null)

  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])

  function submitRename() {
    onRename(name, editName)
    setEditing(false)
  }

  return (
    <div ref={setNodeRef} className={`home-section${isOver ? ' drop-over' : ''}`}>
      <div className="home-section-header">
        {editing ? (
          <input
            ref={inputRef}
            className="home-section-label-input"
            value={editName}
            onChange={e => setEditName(e.target.value)}
            onBlur={submitRename}
            onKeyDown={e => {
              if (e.key === 'Enter') submitRename()
              if (e.key === 'Escape') { setEditName(name); setEditing(false) }
            }}
          />
        ) : (
          <span
            className="home-section-label"
            onClick={() => { setEditName(name); setEditing(true) }}
            title="Click to rename"
          >
            {name}
          </span>
        )}
        <span className="home-section-count">{cards.length}</span>
        {canDelete && (
          <button className="btn-section-delete" onClick={() => onDeleteSection(name)} title="Delete section">×</button>
        )}
      </div>
      <div className="home-grid">
        {cards.length === 0 && (
          <div className="home-section-empty">Drop notes here</div>
        )}
        {cards.map((page, i) => (
          <DraggableCard
            key={page.id}
            page={page}
            index={i}
            accent={getAccent(page.id)}
            onOpen={() => onOpen(page.id)}
            onDelete={() => onDelete(page.id)}
          />
        ))}
      </div>
    </div>
  )
}

function DraggableCard({ page, accent, index, onOpen, onDelete }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: page.id })

  return (
    <div ref={setNodeRef} style={{ opacity: isDragging ? 0.3 : 1 }}>
      <NoteCard
        page={page}
        accent={accent}
        index={index}
        onOpen={onOpen}
        onDelete={onDelete}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  )
}

function NoteCard({ page, accent, index, onOpen, onDelete, dragHandleProps, overlay }) {
  const tasksDone = page.checklist.filter(i => i.checked).length
  const totalTasks = page.checklist.length
  const totalKanban = page.kanban.todo.length + page.kanban.working.length + page.kanban.completed.length

  const updated = new Date(page.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

  const chips = [
    totalTasks > 0 && `${tasksDone}/${totalTasks} tasks`,
    page.quickNotes.length > 0 && `${page.quickNotes.length} notes`,
    totalKanban > 0 && `${totalKanban} cards`,
  ].filter(Boolean)

  const pct = calcProgress(page)
  const color = pct !== null ? progressColor(pct) : null

  return (
    <div
      className="note-card"
      onClick={onOpen}
      style={{ '--card-accent': accent, animationDelay: overlay ? '0s' : `${0.04 + index * 0.06}s` }}
    >
      <div className="note-card-accent-bar" />
      <div className="note-card-body">
        <div className="note-card-top">
          <h2 className="note-card-title">{page.headline || 'Untitled'}</h2>
          <button className="btn-delete note-card-delete" onClick={e => { e.stopPropagation(); onDelete() }}>×</button>
        </div>

        {page.broadNotes ? (
          <p className="note-card-preview">{page.broadNotes.slice(0, 100)}{page.broadNotes.length > 100 ? '…' : ''}</p>
        ) : (
          <p className="note-card-preview note-card-empty-preview">No notes yet…</p>
        )}

        {pct !== null && (
          <div className="card-progress">
            <div className="card-progress-track">
              <div className="card-progress-fill" style={{ width: `${pct}%`, background: color }} />
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

      {dragHandleProps && (
        <span
          className="note-card-drag-handle"
          {...dragHandleProps}
          onClick={e => e.stopPropagation()}
          title="Drag to move section"
        >⠿</span>
      )}
    </div>
  )
}
