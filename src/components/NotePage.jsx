import { useState, useRef, useEffect } from 'react'
import Section from './Section'
import Headline from './Headline'
import Notes from './Notes'
import Checklist from './Checklist'
import Timeline from './Timeline'
import Kanban from './Kanban'
import Goals from './Goals'

function draftKey(id) { return `note-draft-${id}` }

function loadDraft(page) {
  try {
    const stored = localStorage.getItem(draftKey(page.id))
    if (stored) return JSON.parse(stored)
  } catch {}
  return page
}

function saveDraft(draft) {
  localStorage.setItem(draftKey(draft.id), JSON.stringify(draft))
}

function clearDraft(id) {
  localStorage.removeItem(draftKey(id))
}

export default function NotePage({ page, onSave, onBack, registerBack }) {
  const [draft, setDraft] = useState(() => loadDraft(page))
  const savedRef = useRef(page)

  const isDirty = JSON.stringify(draft) !== JSON.stringify(savedRef.current)

  // When switching to a different note, load its draft (or saved state)
  useEffect(() => {
    const d = loadDraft(page)
    setDraft(d)
    savedRef.current = page
  }, [page.id])

  // Persist draft to localStorage on every change
  useEffect(() => {
    if (isDirty) saveDraft(draft)
  }, [draft])

  // Expose handleBack to topbar
  useEffect(() => {
    registerBack?.(handleBack)
  })

  function update(patch) {
    setDraft(d => ({ ...d, ...patch }))
  }

  function updateKanban(patch) {
    setDraft(d => ({ ...d, kanban: { ...d.kanban, ...patch } }))
  }

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
        discard()
        onBack()
      }
    } else {
      onBack()
    }
  }

  return (
    <div className="page">
      <Headline
        value={draft.headline}
        onChange={v => update({ headline: v })}
      />

      <Section title="Notes">
        <Notes
          notes={draft.quickNotes}
          onChange={quickNotes => update({ quickNotes })}
        />
      </Section>

      <Section title="Checklist">
        <Checklist
          items={draft.checklist}
          onChange={checklist => update({ checklist })}
        />
      </Section>

      <Section title="Broader Notes">
        <textarea
          className="broad-notes"
          placeholder="Write anything here…"
          value={draft.broadNotes}
          onChange={e => update({ broadNotes: e.target.value })}
        />
      </Section>

      <Section title="Timeline">
        <Timeline
          events={draft.timeline}
          onChange={timeline => update({ timeline })}
        />
      </Section>

      <Section title="Goals & Progress">
        <Goals
          goals={draft.goals}
          onChange={goals => update({ goals })}
        />
      </Section>

      <Section title="Board">
        <Kanban
          kanban={draft.kanban}
          onChange={updateKanban}
        />
      </Section>

      {/* Save / Discard bar */}
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
