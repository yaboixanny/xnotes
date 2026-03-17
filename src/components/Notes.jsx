import { useState } from 'react'
import { v4 as uuid } from 'uuid'

export default function Notes({ notes, onChange }) {
  const [input, setInput] = useState('')

  function addNote() {
    const text = input.trim()
    if (!text) return
    onChange([...notes, { id: uuid(), text, createdAt: Date.now() }])
    setInput('')
  }

  function deleteNote(id) {
    onChange(notes.filter(n => n.id !== id))
  }

  function editNote(id, text) {
    onChange(notes.map(n => (n.id === id ? { ...n, text } : n)))
  }

  return (
    <div className="notes-list">
      {notes.map(note => (
        <NoteItem key={note.id} note={note} onEdit={editNote} onDelete={deleteNote} />
      ))}
      <div className="add-row">
        <input
          className="text-input"
          placeholder="Add a note…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addNote()}
        />
        <button className="btn-add" onClick={addNote}>+</button>
      </div>
    </div>
  )
}

function NoteItem({ note, onEdit, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(note.text)

  function save() {
    onEdit(note.id, val.trim() || note.text)
    setEditing(false)
  }

  return (
    <div className="note-item">
      {editing ? (
        <input
          className="text-input"
          value={val}
          autoFocus
          onChange={e => setVal(e.target.value)}
          onBlur={save}
          onKeyDown={e => e.key === 'Enter' && save()}
        />
      ) : (
        <span className="note-text" onClick={() => setEditing(true)}>{note.text}</span>
      )}
      <button className="btn-delete" onClick={() => onDelete(note.id)}>×</button>
    </div>
  )
}
