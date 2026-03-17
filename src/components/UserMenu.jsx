import { useState, useEffect, useRef } from 'react'

export default function UserMenu({ name, email, onGoHome, onSignOut }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const initials = (name || 'W')
    .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="user-menu" ref={ref}>
      <button className="user-avatar" onClick={() => setOpen(o => !o)}>
        {initials}
      </button>

      {open && (
        <div className="user-dropdown">
          <div className="user-dropdown-header">
            <div className="user-dropdown-avatar">{initials}</div>
            <div>
              <div className="user-dropdown-name">{name}</div>
              <div className="user-dropdown-sub">{email}</div>
            </div>
          </div>

          <div className="user-dropdown-divider" />

          <button className="user-dropdown-item" onClick={() => { onGoHome(); setOpen(false) }}>
            <span>⌂</span> Back to homepage
          </button>

          <div className="user-dropdown-divider" />

          <button className="user-dropdown-item user-dropdown-signout" onClick={() => { onSignOut(); setOpen(false) }}>
            <span>→</span> Sign out
          </button>
        </div>
      )}
    </div>
  )
}
