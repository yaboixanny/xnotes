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
import Timeline from './Timeline'
import Kanban from './Kanban'

const DEFAULT_ORDER = ['notes', 'checklist', 'broadNotes', 'timeline', 'kanban']

const CATEGORIES = ['General', 'Projects', 'Clients', 'Travel', 'Personal', 'Work']

function getSections(draft, update, updateKanban) {
  return {
    notes: {
      title: 'Notes',
      content: <Notes notes={draft.quickNotes} onChange={quickNotes => update({ quickNotes })} />,
    },
    checklist: {
      title: 'Checklist',
      content: <Checklist items={draft.checklist} onChange={checklist => update({ checklist })} />,
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
    timeline: {
      title: 'Timeline',
      content: <Timeline events={draft.timeline} onChange={timeline => update({ timeline })} />,
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
  const sections = getSections(draft, update, updateKanban)

  return (
    <div className="page">
      <div className="page-meta-row">
        <select
          className="category-select"
          value={draft.category || 'General'}
          onChange={e => update({ category: e.target.value })}
        >
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
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
