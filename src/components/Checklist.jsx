import { useState, useRef, useEffect } from 'react'
import { v4 as uuid } from 'uuid'

function toDateStr(d) { return d.toISOString().split('T')[0] }
function today() { return toDateStr(new Date()) }
function tomorrow() { const d = new Date(); d.setDate(d.getDate() + 1); return toDateStr(d) }
function formatDate(str) {
  if (!str) return null
  const t = today(), tm = tomorrow()
  if (str === t) return 'Today'
  if (str === tm) return 'Tomorrow'
  const d = new Date(str + 'T00:00:00')
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function DatePicker({ value, onChange, onClose }) {
  const ref = useRef(null)

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div className="date-picker" ref={ref}>
      <button className="date-option" onClick={() => { onChange(today()); onClose() }}>Today</button>
      <button className="date-option" onClick={() => { onChange(tomorrow()); onClose() }}>Tomorrow</button>
      <input
        type="date"
        className="date-option-custom"
        defaultValue={value || ''}
        onChange={e => { if (e.target.value) { onChange(e.target.value); onClose() } }}
      />
      {value && (
        <button className="date-option date-option-clear" onClick={() => { onChange(null); onClose() }}>Clear</button>
      )}
    </div>
  )
}

function ChecklistItem({ item, onToggle, onDelete, onEdit, onDateChange }) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(item.text)
  const [showDate, setShowDate] = useState(false)

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

  const dateLabel = formatDate(item.date)
  const isOverdue = item.date && !item.checked && item.date < today()

  return (
    <div className="checklist-item">
      <input type="checkbox" checked={item.checked} onChange={onToggle} />
      <div className="checklist-item-body">
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
        <div className="checklist-item-meta">
          <button
            className={`checklist-date-btn${dateLabel ? ' has-date' : ''}${isOverdue ? ' overdue' : ''}`}
            onClick={() => setShowDate(v => !v)}
            title="Set due date"
          >
            {dateLabel ? `📅 ${dateLabel}` : '+ date'}
          </button>
          {showDate && (
            <DatePicker
              value={item.date}
              onChange={onDateChange}
              onClose={() => setShowDate(false)}
            />
          )}
        </div>
      </div>
      <button className="btn-delete" onClick={onDelete}>×</button>
    </div>
  )
}

export default function Checklist({ items, onChange }) {
  const [input, setInput] = useState('')

  function addItem() {
    const text = input.trim()
    if (!text) return
    onChange([...items, { id: uuid(), text, checked: false, date: null }])
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

  function setDate(id, date) {
    onChange(items.map(i => i.id === id ? { ...i, date } : i))
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
          onDateChange={date => setDate(item.id, date)}
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
