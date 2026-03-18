import { useState, useEffect } from 'react'
import { supabase } from './store/supabase'
import { signOut } from './store/auth'
import { useAppStore } from './store/useStore'
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
  const [session, setSession] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [view, setView] = useState('landing')
  const [currentId, setCurrentId] = useState(null)
  const [dark, toggleTheme] = useTheme()
  const userId = session?.user?.id
  const userName = session?.user?.user_metadata?.name || session?.user?.email?.split('@')[0] || 'Writer'

  const { pages, loading, createPage, updatePage, deletePage } = useAppStore(userId)

  // Restore session on load, listen for auth changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setView(session ? 'app' : 'landing')
      setAuthReady(true)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (!session) { setView('landing'); setCurrentId(null) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleSignOut() {
    await signOut()
    setCurrentId(null)
    setView('landing')
  }

  function goToLanding() {
    setCurrentId(null)
    setView('landing')
  }

  async function handleCreate(category) {
    try {
      const id = await createPage()
      if (category && category !== 'General') await updatePage(id, { category })
      setCurrentId(id)
    } catch (err) {
      console.error('Failed to create note:', err)
    }
  }

  function handleDelete(id) {
    deletePage(id)
    if (currentId === id) setCurrentId(null)
  }

  const currentPage = pages.find(p => p.id === currentId) ?? null

  if (!authReady) return <div className="app-loading">Loading…</div>

  if (view === 'landing') {
    return (
      <LandingPage
        isLoggedIn={!!session}
        onSessionStart={() => setView('app')}
        onOpenApp={() => setView('app')}
      />
    )
  }

  return (
    <div className="app">
      <div className="topbar">
        {currentPage ? (
          <button className="topbar-back" onClick={() => setCurrentId(null)}>← Notes</button>
        ) : (
          <button className="topbar-brand-btn" onClick={goToLanding}>✕ X Note</button>
        )}
        <span className="topbar-spacer" />
        <button className="theme-toggle" onClick={toggleTheme}>
          {dark ? '☀ Light' : '⏾ Dark'}
        </button>
        <UserMenu
          name={userName}
          email={session?.user?.email}
          onGoHome={goToLanding}
          onSignOut={handleSignOut}
        />
      </div>

<div className="page-wrap">
        {currentPage ? (
          <NotePage
            page={currentPage}
            onSave={draft => updatePage(currentPage.id, draft)}
            onBack={() => setCurrentId(null)}
          />
        ) : (
          <HomePage
            pages={pages}
            loading={loading}
            user={{ name: userName }}
            onCreate={handleCreate}
            onOpen={setCurrentId}
            onDelete={handleDelete}
            onUpdate={(id, patch) => updatePage(id, patch)}
          />
        )}
      </div>
    </div>
  )
}
