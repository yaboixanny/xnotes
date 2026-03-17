import { useState, useEffect, useRef } from 'react'
import { useAppStore } from './store/useStore'
import LandingPage from './components/LandingPage'
import HomePage from './components/HomePage'
import NotePage from './components/NotePage'

function useTheme() {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])
  return [dark, () => setDark(d => !d)]
}

function loadUser() {
  try { return JSON.parse(localStorage.getItem('xnote-user')) } catch { return null }
}

export default function App() {
  const { pages, createPage, updatePage, deletePage } = useAppStore()
  const [user, setUser] = useState(loadUser)
  const [currentId, setCurrentId] = useState(null)
  const [dark, toggleTheme] = useTheme()
  const noteBackRef = useRef(null)

  const currentPage = pages.find(p => p.id === currentId) ?? null

  function handleEnter(u) {
    setUser(u)
  }

  function handleCreate() {
    const id = createPage()
    setCurrentId(id)
  }

  function handleDelete(id) {
    deletePage(id)
    if (currentId === id) setCurrentId(null)
  }

  function handleSignOut() {
    localStorage.removeItem('xnote-user')
    setUser(null)
    setCurrentId(null)
  }

  // Landing page
  if (!user) {
    return <LandingPage onEnter={handleEnter} />
  }

  // Notes app
  return (
    <div className="app">
      <div className="topbar">
        {currentPage ? (
          <button className="topbar-back" onClick={() => noteBackRef.current?.()}>← Notes</button>
        ) : (
          <span className="topbar-brand">✕ X Note</span>
        )}
        <span className="topbar-spacer" />
        <button className="theme-toggle" onClick={toggleTheme}>
          {dark ? '☀ Light' : '⏾ Dark'}
        </button>
        <button className="topbar-signout" onClick={handleSignOut} title="Back to home">
          ⏏
        </button>
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
            user={user}
            onCreate={handleCreate}
            onOpen={setCurrentId}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  )
}
