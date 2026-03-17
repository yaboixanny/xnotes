import { useState } from 'react'
import { v4 as uuid } from 'uuid'

export default function Timeline({ events, onChange }) {
  const [input, setInput] = useState('')
  const [date, setDate] = useState('')

  function addEvent() {
    const text = input.trim()
    if (!text) return
    onChange(
      [...events, { id: uuid(), text, date: date || null, createdAt: Date.now() }].sort(
        (a, b) => (a.date || '') > (b.date || '') ? 1 : -1
      )
    )
    setInput('')
    setDate('')
  }

  function deleteEvent(id) {
    onChange(events.filter(e => e.id !== id))
  }

  return (
    <div className="timeline">
      {events.map((event, i) => (
        <div key={event.id} className="timeline-item">
          <div className="timeline-connector">
            <div className="timeline-dot" />
            {i < events.length - 1 && <div className="timeline-line" />}
          </div>
          <div className="timeline-content">
            {event.date && <span className="timeline-date">{event.date}</span>}
            <span className="timeline-text">{event.text}</span>
            <button className="btn-delete" onClick={() => deleteEvent(event.id)}>×</button>
          </div>
        </div>
      ))}
      <div className="add-row">
        <input
          type="date"
          className="date-input"
          value={date}
          onChange={e => setDate(e.target.value)}
        />
        <input
          className="text-input"
          placeholder="Add event…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addEvent()}
        />
        <button className="btn-add" onClick={addEvent}>+</button>
      </div>
    </div>
  )
}
