import { useState } from 'react'

export default function Headline({ value, onChange }) {
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <input
        className="headline-input"
        value={value}
        autoFocus
        placeholder="Page title..."
        onChange={e => onChange(e.target.value)}
        onBlur={() => setEditing(false)}
        onKeyDown={e => e.key === 'Enter' && setEditing(false)}
      />
    )
  }

  return (
    <h1 className="headline" onClick={() => setEditing(true)}>
      {value || <span className="placeholder">Click to add a title…</span>}
    </h1>
  )
}
