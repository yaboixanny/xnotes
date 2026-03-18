import { useState, useRef, useEffect, useCallback } from 'react'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Section from './Section'
import Headline from './Headline'
import Notes from './Notes'
import Checklist from './Checklist'
import Kanban from './Kanban'

const DEFAULT_ORDER = ['notes', 'checklist', 'broadNotes', 'kanban']

const CATEGORIES = ['General', 'Projects', 'Clients', 'Travel', 'Personal', 'Work']

function getSections(draft, update, updateKanban, updateChecklist) {
  return {
    notes: {
      title: 'Notes',
      content: <Notes notes={draft.quickNotes} onChange={quickNotes => update({ quickNotes })} />,
    },
    checklist: {
      title: 'Checklist',
      content: <Checklist items={draft.checklist} onChange={updateChecklist} />,
    },
    broadNotes: {
      title: 'Broader Notes',
      content: (
        <textarea
          className="broad-notes"
          placeholder="Write anything here…"
          value={draft.broadNotes}
          onChange={e => update({ broadNotes: e.target.value })}
        />
      ),
    },
    kanban: {
      title: 'Board',
      content: <Kanban kanban={draft.kanban} onChange={updateKanban} />,
    },
  }
}

// ── Sortable section wrapper ──────────────────────────────
function SortableSection({ id, title, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 10 : 'auto',
      }}
    >
      <Section title={title} dragHandleProps={{ ...attributes, ...listeners }}>
        {children}
      </Section>
    </div>
  )
}

// ── Draft helpers ─────────────────────────────────────────
function draftKey(id) { return `note-draft-${id}` }
function loadDraft(page) {
  try {
    const stored = localStorage.getItem(draftKey(page.id))
    if (stored) return JSON.parse(stored)
  } catch {}
  return page
}
function saveDraft(draft) { localStorage.setItem(draftKey(draft.id), JSON.stringify(draft)) }
function clearDraft(id) { localStorage.removeItem(draftKey(id)) }

// ── NotePage ──────────────────────────────────────────────
export default function NotePage({ page, onSave, onBack }) {
  const [draft, setDraft] = useState(() => loadDraft(page))
  const [saveStatus, setSaveStatus] = useState('saved') // 'saved' | 'saving' | 'pending'
  const saveTimer = useRef(null)
  const latestDraft = useRef(draft)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  useEffect(() => {
    const d = loadDraft(page)
    setDraft(d)
    latestDraft.current = d
    setSaveStatus('saved')
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [page.id])

  const triggerSave = useCallback(() => {
    setSaveStatus('saving')
    onSave(latestDraft.current)
    clearDraft(latestDraft.current.id)
    setTimeout(() => setSaveStatus('saved'), 800)
  }, [onSave])

  function update(patch) {
    setDraft(d => {
      const next = { ...d, ...patch }
      latestDraft.current = next
      saveDraft(next)
      return next
    })
    setSaveStatus('pending')
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(triggerSave, 1500)
  }

  function updateKanban(patch) {
    update({ kanban: { ...latestDraft.current.kanban, ...patch } })
  }

  function updateChecklist(newChecklist) {
    const old = latestDraft.current.checklist
    const kanban = latestDraft.current.kanban

    // Collect all existing kanban card ids
    const inKanban = id =>
      kanban.todo.some(c => c.id === id) ||
      kanban.working.some(c => c.id === id) ||
      kanban.completed.some(c => c.id === id)

    let todo = [...kanban.todo]
    let working = [...kanban.working]
    let completed = [...kanban.completed]

    for (const item of newChecklist) {
      const prev = old.find(o => o.id === item.id)

      if (!prev) {
        // Newly added — put in todo (if not already in kanban somehow)
        if (!inKanban(item.id)) {
          todo = [...todo, { id: item.id, text: item.text }]
        }
        continue
      }

      // Rename — update text in whichever column it's in
      if (prev.text !== item.text) {
        const rename = cards => cards.map(c => c.id === item.id ? { ...c, text: item.text } : c)
        todo = rename(todo)
        working = rename(working)
        completed = rename(completed)
      }

      // Checked → move to completed
      if (!prev.checked && item.checked) {
        const card = todo.find(c => c.id === item.id) || working.find(c => c.id === item.id)
        if (card) {
          todo = todo.filter(c => c.id !== item.id)
          working = working.filter(c => c.id !== item.id)
          completed = [...completed, card]
        }
      }

      // Unchecked → move back to todo
      if (prev.checked && !item.checked) {
        const card = completed.find(c => c.id === item.id)
        if (card) {
          completed = completed.filter(c => c.id !== item.id)
          todo = [...todo, card]
        }
      }
    }

    // Deleted items — remove from all columns
    const newIds = new Set(newChecklist.map(i => i.id))
    const remove = cards => cards.filter(c => !old.find(o => o.id === c.id) || newIds.has(c.id))
    todo = remove(todo)
    working = remove(working)
    completed = remove(completed)

    update({ checklist: newChecklist, kanban: { todo, working, completed } })
  }

  useEffect(() => () => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
  }, [])

  function handleDragEnd({ active, over }) {
    if (!over || active.id === over.id) return
    const order = draft.sectionOrder || DEFAULT_ORDER
    const oldIdx = order.indexOf(active.id)
    const newIdx = order.indexOf(over.id)
    if (oldIdx !== -1 && newIdx !== -1) {
      update({ sectionOrder: arrayMove(order, oldIdx, newIdx) })
    }
  }

  const order = draft.sectionOrder || DEFAULT_ORDER
  const sections = getSections(draft, update, updateKanban, updateChecklist)

  return (
    <div className="page">
      <div className="page-meta-row">
        <span className={`autosave-status autosave-${saveStatus}`}>
          {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'pending' ? '●' : 'Saved ✓'}
        </span>
      </div>

      <Headline value={draft.headline} onChange={v => update({ headline: v })} />

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          {order.map(id => {
            const s = sections[id]
            if (!s) return null
            return (
              <SortableSection key={id} id={id} title={s.title}>
                {s.content}
              </SortableSection>
            )
          })}
        </SortableContext>
      </DndContext>
    </div>
  )
}
