import { useState, useEffect, useRef } from 'react'
import { useAppStore } from './store/useStore'
import { getAccount, getSession, signOut } from './store/auth'
import LandingPage from './components/LandingPage'
import HomePage from './components/HomePage'
import NotePage from './components/NotePage'
import UserMenu from './components/UserMenu'

function useTheme() {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])
  return [dark, () => setDark(d => !d)]
}

export default function App() {
  const { pages, createPage, updatePage, deletePage } = useAppStore()
  const [session, setSession] = useState(getSession)   // active login — cleared on sign out
  const [view, setView] = useState(getSession() ? 'app' : 'landing')
  const [currentId, setCurrentId] = useState(null)
  const [dark, toggleTheme] = useTheme()
  const noteBackRef = useRef(null)

  const currentPage = pages.find(p => p.id === currentId) ?? null
  const account = getAccount()

  function handleSessionStart(s) {
    setSession(s)
    setView('app')
  }

  function handleSignOut() {
    signOut()           // clears session only — account + notes stay
    setSession(null)
    setCurrentId(null)
    setView('landing')
  }

  function goToLanding() {
    setCurrentId(null)
    setView('landing')
  }

  function handleCreate() {
    const id = createPage()
    setCurrentId(id)
  }

  function handleDelete(id) {
    deletePage(id)
    if (currentId === id) setCurrentId(null)
  }

  if (view === 'landing') {
    return (
      <LandingPage
        hasAccount={!!account}
        isLoggedIn={!!session}
        onSessionStart={handleSessionStart}
        onOpenApp={() => setView('app')}
      />
    )
  }

  return (
    <div className="app">
      <div className="topbar">
        {currentPage ? (
          <button className="topbar-back" onClick={() => noteBackRef.current?.()}>← Notes</button>
        ) : (
          <button className="topbar-brand-btn" onClick={goToLanding}>✕ X Note</button>
        )}
        <span className="topbar-spacer" />
        <button className="theme-toggle" onClick={toggleTheme}>
          {dark ? '☀ Light' : '⏾ Dark'}
        </button>
        <UserMenu session={session} onGoHome={goToLanding} onSignOut={handleSignOut} />
      </div>

      <div className="page-wrap">
        {currentPage ? (
          <NotePage
            page={currentPage}
            onSave={draft => updatePage(currentPage.id, draft)}
            onBack={() => setCurrentId(null)}
            registerBack={fn => { noteBackRef.current = fn }}
          />
        ) : (
          <HomePage
            pages={pages}
            user={session}
            onCreate={handleCreate}
            onOpen={setCurrentId}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  )
}
