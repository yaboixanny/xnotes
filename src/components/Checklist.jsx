import { useState } from 'react'
import { v4 as uuid } from 'uuid'

function ChecklistItem({ item, onToggle, onDelete, onEdit }) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(item.text)

  function startEdit() {
    if (item.checked) return
    setText(item.text)
    setEditing(true)
  }

  function submit() {
    const trimmed = text.trim()
    if (trimmed && trimmed !== item.text) onEdit(trimmed)
    else setText(item.text)
    setEditing(false)
  }

  return (
    <div className="checklist-item">
      <input type="checkbox" checked={item.checked} onChange={onToggle} />
      {editing ? (
        <input
          className="checklist-edit-input"
          value={text}
          onChange={e => setText(e.target.value)}
          onBlur={submit}
          onKeyDown={e => {
            if (e.key === 'Enter') submit()
            if (e.key === 'Escape') { setText(item.text); setEditing(false) }
          }}
          autoFocus
        />
      ) : (
        <span
          className={item.checked ? 'checked-text' : ''}
          onDoubleClick={startEdit}
          title={item.checked ? '' : 'Double-click to edit'}
        >
          {item.text}
        </span>
      )}
      <button className="btn-delete" onClick={onDelete}>×</button>
    </div>
  )
}

export default function Checklist({ items, onChange }) {
  const [input, setInput] = useState('')

  function addItem() {
    const text = input.trim()
    if (!text) return
    onChange([...items, { id: uuid(), text, checked: false }])
    setInput('')
  }

  function toggle(id) {
    onChange(items.map(i => i.id === id ? { ...i, checked: !i.checked } : i))
  }

  function deleteItem(id) {
    onChange(items.filter(i => i.id !== id))
  }

  function editItem(id, newText) {
    onChange(items.map(i => i.id === id ? { ...i, text: newText } : i))
  }

  const done = items.filter(i => i.checked).length

  return (
    <div className="checklist">
      {items.length > 0 && (
        <div className="checklist-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${(done / items.length) * 100}%` }} />
          </div>
          <span className="progress-label">{done}/{items.length}</span>
        </div>
      )}
      {items.map(item => (
        <ChecklistItem
          key={item.id}
          item={item}
          onToggle={() => toggle(item.id)}
          onDelete={() => deleteItem(item.id)}
          onEdit={text => editItem(item.id, text)}
        />
      ))}
      <div className="add-row">
        <input
          className="text-input"
          placeholder="Add item…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addItem()}
        />
        <button className="btn-add" onClick={addItem}>+</button>
      </div>
    </div>
  )
}
