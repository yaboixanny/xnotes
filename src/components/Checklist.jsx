import { useState } from 'react'
import { v4 as uuid } from 'uuid'

export default function Checklist({ items, onChange }) {
  const [input, setInput] = useState('')

  function addItem() {
    const text = input.trim()
    if (!text) return
    onChange([...items, { id: uuid(), text, checked: false }])
    setInput('')
  }

  function toggle(id) {
    onChange(items.map(i => (i.id === id ? { ...i, checked: !i.checked } : i)))
  }

  function deleteItem(id) {
    onChange(items.filter(i => i.id !== id))
  }

  const done = items.filter(i => i.checked).length

  return (
    <div className="checklist">
      {items.length > 0 && (
        <div className="checklist-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${(done / items.length) * 100}%` }}
            />
          </div>
          <span className="progress-label">{done}/{items.length}</span>
        </div>
      )}
      {items.map(item => (
        <div key={item.id} className="checklist-item">
          <input
            type="checkbox"
            checked={item.checked}
            onChange={() => toggle(item.id)}
          />
          <span className={item.checked ? 'checked-text' : ''}>{item.text}</span>
          <button className="btn-delete" onClick={() => deleteItem(item.id)}>×</button>
        </div>
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
