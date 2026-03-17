import { useState, useEffect, useMemo } from 'react'

function buildReminders(pages) {
  const items = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (const page of pages) {
    const note = page.headline || 'Untitled'

    // Upcoming timeline events (next 60 days)
    for (const ev of page.timeline) {
      if (!ev.date) continue
      const evDate = new Date(ev.date + 'T00:00:00')
      const days = Math.ceil((evDate - today) / 86400000)
      if (days < 0 || days > 60) continue
      items.push({ type: 'event', icon: '📅', text: ev.text, note, days, priority: days })
    }

    // Unchecked checklist items
    for (const item of page.checklist.filter(i => !i.checked)) {
      items.push({ type: 'task', icon: '✅', text: item.text, note, priority: 100 })
    }

    // Kanban todo cards
    for (const card of page.kanban.todo) {
      items.push({ type: 'todo', icon: '📌', text: card.text, note, priority: 200 })
    }
  }

  return items.sort((a, b) => a.priority - b.priority)
}

function daysLabel(days) {
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  return `In ${days} days`
}

const BOT_INTROS = [
  "Hey, don't forget —",
  "Heads up!",
  "Still on your list:",
  "Quick reminder:",
  "Psst —",
  "You've got this! But first:",
]

export default function ReminderBot({ pages }) {
  const [appeared, setAppeared] = useState(false)
  const [open, setOpen] = useState(false)
  const [idx, setIdx] = useState(0)
  const [excited, setExcited] = useState(false)

  const reminders = useMemo(() => buildReminders(pages), [pages])

  // Appear after a short delay
  useEffect(() => {
    const t = setTimeout(() => {
      setAppeared(true)
      if (reminders.length > 0) {
        setTimeout(() => { setOpen(true); setExcited(true) }, 600)
      }
    }, 2800)
    return () => clearTimeout(t)
  }, [])

  // Clear excited state
  useEffect(() => {
    if (!excited) return
    const t = setTimeout(() => setExcited(false), 1000)
    return () => clearTimeout(t)
  }, [excited])

  // Auto-cycle reminders every 7s
  useEffect(() => {
    if (!open || reminders.length <= 1) return
    const t = setInterval(() => {
      setIdx(i => (i + 1) % reminders.length)
    }, 7000)
    return () => clearInterval(t)
  }, [open, reminders.length])

  function toggleOpen() {
    if (!open && reminders.length > 0) setExcited(true)
    setOpen(o => !o)
  }

  function prev() { setIdx(i => (i - 1 + reminders.length) % reminders.length) }
  function next() { setIdx(i => (i + 1) % reminders.length) }

  const reminder = reminders[idx] ?? null
  const intro = BOT_INTROS[idx % BOT_INTROS.length]

  if (!appeared) return null

  return (
    <div className={`bot-wrap${open ? ' bot-wrap-open' : ''}`}>
      {/* Speech bubble */}
      {open && reminder && (
        <div className="bot-bubble">
          <button className="bot-bubble-close" onClick={() => setOpen(false)}>×</button>
          <p className="bot-bubble-intro">{intro}</p>
          <p className="bot-bubble-text">
            {reminder.icon} {reminder.text}
            {reminder.type === 'event' && (
              <span className={`bot-days-badge${reminder.days <= 2 ? ' urgent' : ''}`}>
                {daysLabel(reminder.days)}
              </span>
            )}
          </p>
          <p className="bot-bubble-note">in <strong>{reminder.note}</strong></p>
          {reminders.length > 1 && (
            <div className="bot-nav">
              <button onClick={prev}>‹</button>
              <span>{idx + 1} / {reminders.length}</span>
              <button onClick={next}>›</button>
            </div>
          )}
        </div>
      )}

      {/* Bot character */}
      <button
        className={`bot-btn${excited ? ' bot-excited' : ''}`}
        onClick={toggleOpen}
        title={reminders.length > 0 ? `${reminders.length} reminder${reminders.length > 1 ? 's' : ''}` : 'No reminders'}
        aria-label="Reminder bot"
      >
        {reminders.length > 0 && !open && (
          <span className="bot-badge">{reminders.length}</span>
        )}
        <BotSVG />
      </button>
    </div>
  )
}

function BotSVG() {
  return (
    <svg viewBox="0 0 52 62" width="52" height="62" xmlns="http://www.w3.org/2000/svg" className="bot-svg">
      {/* Antenna stem */}
      <rect x="24" y="1" width="4" height="14" rx="2" className="bot-accent" />
      {/* Antenna tip */}
      <circle cx="26" cy="1" r="5" className="bot-accent-dim" />
      <circle cx="26" cy="1" r="3" className="bot-accent" />

      {/* Head */}
      <rect x="2" y="13" width="48" height="46" rx="14" className="bot-accent" />

      {/* Visor / screen */}
      <rect x="9" y="21" width="34" height="26" rx="8" fill="rgba(0,0,0,0.18)" />

      {/* Left eye group */}
      <g className="bot-eye-left" style={{ transformOrigin: '18px 33px' }}>
        <circle cx="18" cy="33" r="6.5" fill="white" opacity="0.95" />
        <circle cx="18" cy="33" r="3" fill="#0d0f14" />
        <circle cx="19.5" cy="31.5" r="1.2" fill="white" />
      </g>

      {/* Right eye group */}
      <g className="bot-eye-right" style={{ transformOrigin: '34px 33px' }}>
        <circle cx="34" cy="33" r="6.5" fill="white" opacity="0.95" />
        <circle cx="34" cy="33" r="3" fill="#0d0f14" />
        <circle cx="35.5" cy="31.5" r="1.2" fill="white" />
      </g>

      {/* Mouth */}
      <rect x="17" y="43" width="18" height="4" rx="2" fill="rgba(255,255,255,0.3)" />
      <rect x="20" y="44" width="3" height="2" rx="1" fill="rgba(255,255,255,0.5)" />
      <rect x="24.5" y="44" width="3" height="2" rx="1" fill="rgba(255,255,255,0.5)" />
      <rect x="29" y="44" width="3" height="2" rx="1" fill="rgba(255,255,255,0.5)" />

      {/* Ear panels */}
      <rect x="0" y="27" width="5" height="12" rx="2.5" className="bot-accent-panel" />
      <rect x="47" y="27" width="5" height="12" rx="2.5" className="bot-accent-panel" />
    </svg>
  )
}
