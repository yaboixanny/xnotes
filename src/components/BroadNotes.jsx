import { useState } from 'react'
import { v4 as uuid } from 'uuid'

export default function BroadNotes({ value, onChange }) {
  const notes = Array.isArray(value) ? value : []
  const [expanded, setExpanded] = useState({})

  function addNote() {
    const id = uuid()
    onChange([...notes, { id, title: '', body: '' }])
    setExpanded(e => ({ ...e, [id]: true }))
  }

  function updateNote(id, patch) {
    onChange(notes.map(n => n.id === id ? { ...n, ...patch } : n))
  }

  function deleteNote(id) {
    onChange(notes.filter(n => n.id !== id))
  }

  function toggle(id) {
    setExpanded(e => ({ ...e, [id]: !e[id] }))
  }

  return (
    <div className="broad-notes-list">
      {notes.map(note => (
        <BroadNoteCard
          key={note.id}
          note={note}
          isOpen={!!expanded[note.id]}
          onToggle={() => toggle(note.id)}
          onUpdate={patch => updateNote(note.id, patch)}
          onDelete={() => deleteNote(note.id)}
        />
      ))}
      <button className="btn-add-broad" onClick={addNote}>+ Add note</button>
    </div>
  )
}

function BroadNoteCard({ note, isOpen, onToggle, onUpdate, onDelete }) {
  return (
    <div className={`broad-note-card${isOpen ? ' open' : ''}`}>
      <div className="broad-note-header" onClick={onToggle}>
        <span className="broad-note-chevron">{isOpen ? '▾' : '▸'}</span>
        <input
          className="broad-note-title-input"
          placeholder="Untitled note"
          value={note.title}
          onClick={e => e.stopPropagation()}
          onChange={e => onUpdate({ title: e.target.value })}
        />
        <button
          className="btn-delete"
          onClick={e => { e.stopPropagation(); onDelete() }}
        >×</button>
      </div>
      {isOpen && (
        <textarea
          className="broad-note-body"
          placeholder="Write anything here…"
          value={note.body}
          onChange={e => onUpdate({ body: e.target.value })}
          autoFocus
        />
      )}
    </div>
  )
}
