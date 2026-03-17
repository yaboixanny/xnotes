import { useState, useRef, useEffect } from 'react'
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
import Goals from './Goals'

const DEFAULT_ORDER = ['notes', 'checklist', 'broadNotes', 'timeline', 'goals', 'kanban']

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
    goals: {
      title: 'Goals & Progress',
      content: <Goals goals={draft.goals} onChange={goals => update({ goals })} />,
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
export default function NotePage({ page, onSave, onBack, registerBack }) {
  const [draft, setDraft] = useState(() => loadDraft(page))
  const savedRef = useRef(page)

  const isDirty = JSON.stringify(draft) !== JSON.stringify(savedRef.current)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  useEffect(() => {
    const d = loadDraft(page)
    setDraft(d)
    savedRef.current = page
  }, [page.id])

  useEffect(() => {
    if (isDirty) saveDraft(draft)
  }, [draft])

  useEffect(() => { registerBack?.(handleBack) })

  function update(patch) { setDraft(d => ({ ...d, ...patch })) }
  function updateKanban(patch) { setDraft(d => ({ ...d, kanban: { ...d.kanban, ...patch } })) }

  function save() {
    onSave(draft)
    savedRef.current = draft
    clearDraft(draft.id)
  }

  function discard() {
    clearDraft(page.id)
    setDraft(savedRef.current)
  }

  function handleBack() {
    if (isDirty) {
      if (window.confirm('You have unsaved changes. Discard and go back?')) {
        discard(); onBack()
      }
    } else {
      onBack()
    }
  }

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

      <div className={`save-bar${isDirty ? ' save-bar-visible' : ''}`}>
        <span className="save-bar-label">Unsaved changes</span>
        <div className="save-bar-actions">
          <button className="save-bar-discard" onClick={discard}>Discard</button>
          <button className="save-bar-save" onClick={save}>Save</button>
        </div>
      </div>
    </div>
  )
}
