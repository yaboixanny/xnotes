import { useState, useRef, useEffect } from 'react'
import { createAccount, login } from '../store/auth'

export default function LandingPage({ hasAccount, isLoggedIn, onSessionStart, onOpenApp }) {
  const [modalOpen, setModalOpen] = useState(false)

  function handleCTA() {
    if (isLoggedIn) { onOpenApp(); return }
    setModalOpen(true)
  }

  const ctaLabel = isLoggedIn ? 'Open App →' : hasAccount ? 'Log In →' : 'Start Writing — It\'s Free'

  return (
    <div className="lp">
      <LPNav onLogin={handleCTA} isLoggedIn={isLoggedIn} hasAccount={hasAccount} />
      <Hero onCTA={handleCTA} ctaLabel={ctaLabel} />
      <ValueProps />
      <CrossOut />
      <LiveDemo />
      <Comparison />
      <FinalCTA onCTA={handleCTA} ctaLabel={ctaLabel} />
      <LPFooter />
      {modalOpen && (
        <AuthModal
          hasAccount={hasAccount}
          onSessionStart={onSessionStart}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  )
}

/* ── Nav ── */
function LPNav({ onLogin, isLoggedIn, hasAccount }) {
  return (
    <nav className="lp-nav">
      <span className="lp-logo">✕ <span>X Note</span></span>
      <div className="lp-nav-links">
        <a href="#features">Features</a>
        <a href="#compare">Compare</a>
        <button className="lp-nav-login" onClick={onLogin}>
          {isLoggedIn ? 'Open App →' : hasAccount ? 'Log in →' : 'Get started →'}
        </button>
      </div>
    </nav>
  )
}

/* ── Hero ── */
function Hero({ onCTA, ctaLabel }) {
  return (
    <section className="lp-hero">
      <div className="lp-hero-content">
        <div className="lp-badge">Now in Beta</div>
        <h1 className="lp-hero-headline">
          Capture at the<br />
          <span className="lp-accent">speed of thought.</span>
        </h1>
        <p className="lp-hero-sub">
          No folders. No loading screens. Just your notes, instantly.<br />
          The minimalist workspace for people who actually want to get things done.
        </p>
        <button className="lp-cta-btn" onClick={onCTA}>
          {ctaLabel}
        </button>
        <p className="lp-hero-footnote">No account required. Works offline.</p>
      </div>

      {/* Fake editor mockup */}
      <div className="lp-mockup">
        <div className="lp-mockup-bar">
          <span /><span /><span />
        </div>
        <div className="lp-mockup-body">
          <div className="lp-mockup-title">Morning thoughts<span className="lp-cursor" /></div>
          <div className="lp-mockup-line w80" />
          <div className="lp-mockup-line w60" />
          <div className="lp-mockup-line w90" />
          <div className="lp-mockup-line w45" />
          <div className="lp-mockup-spacer" />
          <div className="lp-mockup-check">
            <span className="lp-check checked" /> Ship the landing page
          </div>
          <div className="lp-mockup-check">
            <span className="lp-check" /> Review PR feedback
          </div>
          <div className="lp-mockup-check">
            <span className="lp-check" /> Coffee
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Value Props ── */
const VALUES = [
  {
    problem: 'Bloated UI',
    icon: '⚡',
    title: 'Zero Friction',
    desc: 'Open the app and start typing. No "New Page" buttons, no onboarding wizards.',
  },
  {
    problem: 'Slow Search',
    icon: '⌕',
    title: 'Instant Recall',
    desc: 'Find any thought in under 100ms. Your notes are indexed the moment you write them.',
  },
  {
    problem: 'Cloud Lag',
    icon: '◈',
    title: 'Local First',
    desc: 'Your data lives on your device first. Private, fast, and works completely offline.',
  },
]

function ValueProps() {
  return (
    <section className="lp-values" id="features">
      <p className="lp-section-label">Why X Note</p>
      <h2 className="lp-section-title">Built for one thing.</h2>
      <div className="lp-values-grid">
        {VALUES.map(v => (
          <div key={v.title} className="lp-value-card">
            <div className="lp-value-problem">Previously: {v.problem}</div>
            <div className="lp-value-icon">{v.icon}</div>
            <h3 className="lp-value-title">{v.title}</h3>
            <p className="lp-value-desc">{v.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ── Cross Out the Noise ── */
const CROSSED = [
  'Complex Databases',
  'Endless Folders',
  'Proprietary Formats',
  'Subscription Fatigue',
]

function CrossOut() {
  return (
    <section className="lp-crossout">
      <div className="lp-crossout-inner">
        <div className="lp-crossout-x">✕</div>
        <h2 className="lp-crossout-title">
          We took everything you hate about note-taking apps<br />
          and <span className="lp-accent">X'd them out.</span>
        </h2>
        <ul className="lp-crossout-list">
          {CROSSED.map(item => (
            <li key={item} className="lp-crossout-item">{item}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/* ── Live Demo ── */
function LiveDemo() {
  const [text, setText] = useState('')
  const [toast, setToast] = useState(false)
  const timerRef = useRef(null)

  function handleType(e) {
    setText(e.target.value)
    clearTimeout(timerRef.current)
    if (e.target.value) {
      setToast(true)
      timerRef.current = setTimeout(() => setToast(false), 1800)
    } else {
      setToast(false)
    }
  }

  useEffect(() => () => clearTimeout(timerRef.current), [])

  return (
    <section className="lp-demo">
      <p className="lp-section-label">Try it now</p>
      <h2 className="lp-section-title">Type a quick idea.</h2>
      <p className="lp-demo-sub">No sign-up. No loading. Just type.</p>
      <div className="lp-demo-box">
        <textarea
          className="lp-demo-input"
          placeholder="What's on your mind right now…"
          value={text}
          onChange={handleType}
          rows={4}
        />
        <div className={`lp-demo-toast${toast ? ' lp-demo-toast-visible' : ''}`}>
          ✓ Saved locally
        </div>
      </div>
    </section>
  )
}

/* ── Comparison ── */
const ROWS = [
  ['Launch Time', '< 1 second', '5 – 10 seconds'],
  ['Learning Curve', 'None', '3-hour YouTube tutorial'],
  ['File Size', '5 MB', '500 MB+'],
  ['Works Offline', '✓', '✗'],
  ['Focus', 'Writing', 'Project management'],
  ['Price', 'Free', '$8–15 / month'],
]

function Comparison() {
  return (
    <section className="lp-compare" id="compare">
      <p className="lp-section-label">Honest comparison</p>
      <h2 className="lp-section-title">X Note vs. The Giants</h2>
      <div className="lp-table-wrap">
        <table className="lp-table">
          <thead>
            <tr>
              <th>Feature</th>
              <th className="lp-th-us">✕ X Note</th>
              <th>"The Others"</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map(([feat, us, them]) => (
              <tr key={feat}>
                <td>{feat}</td>
                <td className="lp-td-us">{us}</td>
                <td className="lp-td-them">{them}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

/* ── Final CTA ── */
function FinalCTA({ onCTA, ctaLabel }) {
  return (
    <section className="lp-final">
      <h2 className="lp-final-title">Ready to simplify<br />your brain?</h2>
      <button className="lp-cta-btn" onClick={onCTA}>
        {ctaLabel}
      </button>
      <p className="lp-final-note">
        Available on Mac, Windows &amp; iOS · Markdown-ready · Forever simple.
      </p>
    </section>
  )
}

/* ── Footer ── */
function LPFooter() {
  return (
    <footer className="lp-footer">
      <span className="lp-logo">✕ X Note</span>
      <span className="lp-footer-copy">Built for thinkers.</span>
    </footer>
  )
}

/* ── Auth Modal (Create Account or Login) ── */
function AuthModal({ hasAccount, onSessionStart, onClose }) {
  const [mode, setMode] = useState(hasAccount ? 'login' : 'create')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    setError('')
    if (!password) { setError('Password is required.'); return }

    setLoading(true)
    try {
      if (mode === 'create') {
        if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
        if (password !== confirm) { setError('Passwords do not match.'); return }
        const session = await createAccount(name, password)
        onSessionStart(session)
      } else {
        const session = await login(password)
        if (!session) { setError('Incorrect password. Try again.'); return }
        onSessionStart(session)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="lp-modal-overlay" onClick={onClose}>
      <div className="lp-modal" onClick={e => e.stopPropagation()}>
        <div className="lp-modal-logo">✕</div>

        {mode === 'create' ? (
          <>
            <h2 className="lp-modal-title">Create your account</h2>
            <p className="lp-modal-sub">Your notes are stored locally and protected by your password.</p>
            <input
              className="lp-modal-input"
              placeholder="Your name (optional)"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
            <input
              className="lp-modal-input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
            <input
              className="lp-modal-input"
              type="password"
              placeholder="Confirm password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </>
        ) : (
          <>
            <h2 className="lp-modal-title">Welcome back</h2>
            <p className="lp-modal-sub">Enter your password to access your notes.</p>
            <input
              className="lp-modal-input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              autoFocus
            />
          </>
        )}

        {error && <p className="lp-modal-error">{error}</p>}

        <button className="lp-modal-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Just a moment…' : mode === 'create' ? 'Create Account →' : 'Log In →'}
        </button>

        <button className="lp-modal-switch" onClick={() => { setMode(m => m === 'login' ? 'create' : 'login'); setError('') }}>
          {mode === 'login' ? 'No account yet? Create one' : 'Already have an account? Log in'}
        </button>

        <p className="lp-modal-note">Password is hashed locally · No servers · Always private</p>
      </div>
    </div>
  )
}
