import { useState, useEffect, useRef } from 'react'
import { useAppStore } from './store/useStore'
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

export default function App() {
  const { pages, createPage, updatePage, updateKanban, deletePage } = useAppStore()
  const [currentId, setCurrentId] = useState(null)
  const [dark, toggleTheme] = useTheme()

  const currentPage = pages.find(p => p.id === currentId) ?? null
  const noteBackRef = useRef(null) // set by NotePage so topbar can trigger it

  function handleCreate() {
    const id = createPage()
    setCurrentId(id)
  }

  function handleDelete(id) {
    deletePage(id)
    if (currentId === id) setCurrentId(null)
  }

  return (
    <div className="app">
      <div className="topbar">
        {currentPage ? (
          <button className="topbar-back" onClick={() => noteBackRef.current?.()}>← Notes</button>
        ) : (
          <span className="topbar-brand">✦ Notes</span>
        )}
        <span className="topbar-spacer" />
        <button className="theme-toggle" onClick={toggleTheme}>
          {dark ? '☀ Light' : '⏾ Dark'}
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
            onCreate={handleCreate}
            onOpen={setCurrentId}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  )
}
