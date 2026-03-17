import { useState } from 'react'
import { v4 as uuid } from 'uuid'

export default function Goals({ goals, onChange }) {
  const [input, setInput] = useState('')
  const [target, setTarget] = useState('')
  const [unit, setUnit] = useState('')

  function addGoal() {
    const text = input.trim()
    if (!text) return
    onChange([
      ...goals,
      {
        id: uuid(),
        text,
        target: Number(target) || 100,
        unit: unit || '%',
        current: 0,
        entries: [],
      },
    ])
    setInput('')
    setTarget('')
    setUnit('')
  }

  function deleteGoal(id) {
    onChange(goals.filter(g => g.id !== id))
  }

  function updateCurrent(id, value) {
    onChange(
      goals.map(g =>
        g.id === id
          ? { ...g, current: Math.min(Math.max(0, Number(value)), g.target) }
          : g
      )
    )
  }

  function addEntry(id, entryText) {
    onChange(
      goals.map(g =>
        g.id === id
          ? { ...g, entries: [...g.entries, { id: uuid(), text: entryText, date: new Date().toLocaleDateString() }] }
          : g
      )
    )
  }

  return (
    <div className="goals">
      {goals.map(goal => (
        <GoalItem
          key={goal.id}
          goal={goal}
          onDelete={() => deleteGoal(goal.id)}
          onUpdateCurrent={val => updateCurrent(goal.id, val)}
          onAddEntry={text => addEntry(goal.id, text)}
        />
      ))}
      <div className="goal-add-form">
        <input
          className="text-input"
          placeholder="Goal name…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addGoal()}
        />
        <input
          className="text-input goal-target"
          placeholder="Target (e.g. 10)"
          type="number"
          value={target}
          onChange={e => setTarget(e.target.value)}
        />
        <input
          className="text-input goal-unit"
          placeholder="Unit (e.g. kg)"
          value={unit}
          onChange={e => setUnit(e.target.value)}
        />
        <button className="btn-add" onClick={addGoal}>+</button>
      </div>
    </div>
  )
}

function GoalItem({ goal, onDelete, onUpdateCurrent, onAddEntry }) {
  const [entryInput, setEntryInput] = useState('')
  const [expanded, setExpanded] = useState(false)
  const pct = Math.round((goal.current / goal.target) * 100)

  function submitEntry() {
    const text = entryInput.trim()
    if (!text) return
    onAddEntry(text)
    setEntryInput('')
  }

  return (
    <div className="goal-item">
      <div className="goal-header">
        <div className="goal-title-row">
          <span className="goal-name">{goal.text}</span>
          <button className="btn-delete" onClick={onDelete}>×</button>
        </div>
        <div className="goal-progress-row">
          <input
            type="number"
            className="goal-current-input"
            value={goal.current}
            min={0}
            max={goal.target}
            onChange={e => onUpdateCurrent(e.target.value)}
          />
          <span className="goal-divider">/</span>
          <span className="goal-target-label">{goal.target} {goal.unit}</span>
          <span className="goal-pct">{pct}%</span>
        </div>
        <div className="goal-bar-track">
          <div
            className="goal-bar-fill"
            style={{ width: `${pct}%`, background: pct >= 100 ? 'var(--green)' : 'var(--accent)' }}
          />
        </div>
      </div>

      <div className="goal-entries-toggle" onClick={() => setExpanded(!expanded)}>
        {expanded ? '▾' : '▸'} Tracking log ({goal.entries.length})
      </div>

      {expanded && (
        <div className="goal-entries">
          {goal.entries.map(e => (
            <div key={e.id} className="goal-entry">
              <span className="goal-entry-date">{e.date}</span>
              <span>{e.text}</span>
            </div>
          ))}
          <div className="add-row">
            <input
              className="text-input"
              placeholder="Log an update…"
              value={entryInput}
              onChange={ev => setEntryInput(ev.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitEntry()}
            />
            <button className="btn-add" onClick={submitEntry}>+</button>
          </div>
        </div>
      )}
    </div>
  )
}
