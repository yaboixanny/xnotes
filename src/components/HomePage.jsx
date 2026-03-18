import { useState, useEffect, useRef, useCallback } from 'react'
import {
  DndContext, PointerSensor, useSensor, useSensors,
  DragOverlay, rectIntersection,
} from '@dnd-kit/core'
import {
  SortableContext, useSortable, rectSortingStrategy, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const SECTIONS_KEY   = 'note-sections'
const ORDERS_KEY     = 'note-card-orders'
const COLLAPSED_KEY  = 'note-sections-collapsed'

function loadCollapsed() {
  try { return JSON.parse(localStorage.getItem(COLLAPSED_KEY)) || {} } catch { return {} }
}
function saveCollapsed(c) { localStorage.setItem(COLLAPSED_KEY, JSON.stringify(c)) }
const CARD_ACCENTS = ['#4a6cf7', '#e05c97', '#f0a030', '#3ecf8e', '#a855f7', '#0ea5e9']

function getAccent(id) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash)
  return CARD_ACCENTS[Math.abs(hash) % CARD_ACCENTS.length]
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function calcProgress(page) {
  const checkDone  = page.checklist.filter(i => i.checked).length
  const checkTotal = page.checklist.length
  const kanbanDone  = page.kanban.completed.length
  const kanbanTotal = page.kanban.todo.length + page.kanban.working.length + page.kanban.completed.length
  const total = checkTotal + kanbanTotal
  if (total === 0) return null
  return Math.round(((checkDone + kanbanDone) / total) * 100)
}

function progressColor(pct) {
  if (pct < 33) return '#ef4444'
  if (pct < 66) return '#f0a030'
  return '#10b981'
}

function overallProgress(pages) {
  let done = 0, total = 0
  for (const p of pages) {
    done  += p.checklist.filter(i => i.checked).length + p.kanban.completed.length
    total += p.checklist.length + p.kanban.todo.length + p.kanban.working.length + p.kanban.completed.length
  }
  if (total === 0) return null
  return Math.round((done / total) * 100)
}

function loadSections() {
  try {
    const s = JSON.parse(localStorage.getItem(SECTIONS_KEY))
    if (Array.isArray(s) && s.length) return s
  } catch {}
  return ['General']
}
function saveSections(s) { localStorage.setItem(SECTIONS_KEY, JSON.stringify(s)) }

function loadOrders() {
  try { return JSON.parse(localStorage.getItem(ORDERS_KEY)) || {} } catch { return {} }
}
function saveOrders(o) { localStorage.setItem(ORDERS_KEY, JSON.stringify(o)) }

// Apply stored order to a list of pages within a section
function applySectionOrder(order, cards) {
  if (!order?.length) return cards
  const byId = Object.fromEntries(cards.map(c => [c.id, c]))
  const ordered = order.map(id => byId[id]).filter(Boolean)
  const rest    = cards.filter(c => !order.includes(c.id))
  return [...ordered, ...rest]
}

// ── Weather ──────────────────────────────────────────────
const WMO = {
  0: ['Clear', '☀️'], 1: ['Mostly Clear', '🌤️'], 2: ['Partly Cloudy', '⛅'], 3: ['Overcast', '☁️'],
  45: ['Foggy', '🌫️'], 48: ['Foggy', '🌫️'],
  51: ['Light Drizzle', '🌦️'], 53: ['Drizzle', '🌦️'], 55: ['Heavy Drizzle', '🌧️'],
  61: ['Light Rain', '🌧️'], 63: ['Rain', '🌧️'], 65: ['Heavy Rain', '🌧️'],
  71: ['Light Snow', '🌨️'], 73: ['Snow', '❄️'], 75: ['Heavy Snow', '❄️'],
  80: ['Showers', '🌦️'], 81: ['Showers', '🌧️'], 82: ['Heavy Showers', '🌧️'],
  95: ['Thunderstorm', '⛈️'], 96: ['Thunderstorm', '⛈️'], 99: ['Thunderstorm', '⛈️'],
}

function WeatherWidget() {
  const [weather, setWeather] = useState(null)
  const [status, setStatus]   = useState('loading')

  const doFetch = useCallback(() => {
    setStatus('loading')
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const { latitude: lat, longitude: lon } = coords
          const [wRes, gRes] = await Promise.all([
            fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&temperature_unit=celsius`),
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`),
          ])
          const wData = await wRes.json()
          const gData = await gRes.json()
          const cw    = wData.current_weather
          const [condition, emoji] = WMO[cw.weathercode] ?? ['Unknown', '🌡️']
          const city = gData.address?.city || gData.address?.town || gData.address?.village || gData.address?.county || 'Your Location'
          setWeather({ temp: Math.round(cw.temperature), condition, emoji, city, wind: Math.round(cw.windspeed) })
          setStatus('ok')
        } catch {
          setStatus('error')
        }
      },
      () => setStatus('denied'),
      { timeout: 8000 }
    )
  }, [])

  useEffect(() => {
    doFetch()
    const interval = setInterval(doFetch, 60 * 60 * 1000) // refresh every hour
    return () => clearInterval(interval)
  }, [doFetch])

  return (
    <div className="weather-widget">
      {status === 'loading' && !weather && (
        <div className="weather-loading">Fetching weather…</div>
      )}
      {status === 'denied' && (
        <div className="weather-error">Location access denied</div>
      )}
      {status === 'error' && !weather && (
        <div className="weather-error">Couldn't load weather <button className="weather-refresh" onClick={doFetch}>↻</button></div>
      )}
      {weather && (
        <div className="weather-content">
          <span className="weather-emoji">{weather.emoji}</span>
          <div className="weather-info">
            <span className="weather-temp">{weather.temp}°C</span>
            <span className="weather-condition">{weather.condition}</span>
            <span className="weather-city">{weather.city}</span>
          </div>
          <span className="weather-wind">💨 {weather.wind} km/h</span>
          <button className="weather-refresh" onClick={doFetch} title="Refresh">↻</button>
        </div>
      )}
    </div>
  )
}

// ── Market ───────────────────────────────────────────────
function MarketWidget() {
  const [data,   setData]   = useState(null)
  const [status, setStatus] = useState('loading')

  const doFetch = useCallback(async () => {
    try {
      // USD→CAD + BTC via Coinbase (free, no key)
      // WTI via a free commodities endpoint
      const [fxRes, btcRes, oilRes] = await Promise.all([
        fetch('https://api.coinbase.com/v2/exchange-rates?currency=USD'),
        fetch('https://api.coinbase.com/v2/prices/BTC-USD/spot'),
        fetch('https://query1.finance.yahoo.com/v8/finance/chart/CL%3DF?interval=1d&range=1d'),
      ])
      const fxData  = await fxRes.json()
      const btcData = await btcRes.json()
      const oilData = await oilRes.json()

      const cad    = parseFloat(fxData.data.rates.CAD).toFixed(4)
      const btc    = Math.round(parseFloat(btcData.data.amount)).toLocaleString()
      const oilMeta = oilData.chart?.result?.[0]?.meta
      const oil    = oilMeta?.regularMarketPrice?.toFixed(2) ?? '—'

      setData({ cad, btc, oil })
      setStatus('ok')
    } catch {
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    doFetch()
    const interval = setInterval(doFetch, 60 * 60 * 1000)
    return () => clearInterval(interval)
  }, [doFetch])

  return (
    <div className="market-widget">
      {status === 'loading' && !data && <div className="weather-loading">Loading markets…</div>}
      {status === 'error'   && !data && <div className="weather-error">Couldn't load markets</div>}
      {data && (
        <div className="market-rows">
          <div className="market-row">
            <span className="market-label">USD → CAD</span>
            <span className="market-value">{data.cad}</span>
          </div>
          <div className="market-row">
            <span className="market-label">BTC</span>
            <span className="market-value">${data.btc}</span>
          </div>
          <div className="market-row">
            <span className="market-label">WTI Crude</span>
            <span className="market-value">${data.oil}</span>
          </div>
          <button className="weather-refresh market-refresh" onClick={doFetch} title="Refresh">↻</button>
        </div>
      )}
    </div>
  )
}

// ── News ─────────────────────────────────────────────────
const NEWS_SOURCES = [
  { id: 'bbc',        label: 'BBC News',      rss: 'https://feeds.bbci.co.uk/news/rss.xml' },
  { id: 'guardian',   label: 'The Guardian',  rss: 'https://www.theguardian.com/world/rss' },
  { id: 'cnn',        label: 'CNN',           rss: 'http://rss.cnn.com/rss/edition.rss' },
  { id: 'reuters',    label: 'Reuters',       rss: 'https://feeds.reuters.com/reuters/topNews' },
  { id: 'techcrunch', label: 'TechCrunch',    rss: 'https://techcrunch.com/feed/' },
  { id: 'ars',        label: 'Ars Technica',  rss: 'https://feeds.arstechnica.com/arstechnica/index' },
  { id: 'hn',         label: 'Hacker News',   rss: null },
]
const NEWS_SOURCE_KEY = 'news-source'

async function fetchSource(source) {
  if (source.id === 'hn') {
    const res  = await fetch('https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=5')
    const data = await res.json()
    return data.hits.map(h => ({
      title: h.title,
      url:   h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
      meta:  `${h.points} pts · ${h.author}`,
    }))
  }
  const res  = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(source.rss)}&count=5`)
  const data = await res.json()
  if (data.status !== 'ok') throw new Error('feed error')
  return data.items.map(i => ({
    title: i.title,
    url:   i.link,
    meta:  new Date(i.pubDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
  }))
}

function NewsWidget() {
  const [sourceId, setSourceId] = useState(() => localStorage.getItem(NEWS_SOURCE_KEY) || 'bbc')
  const [stories,  setStories]  = useState([])
  const [status,   setStatus]   = useState('loading')

  const source = NEWS_SOURCES.find(s => s.id === sourceId) || NEWS_SOURCES[0]

  useEffect(() => {
    setStatus('loading')
    setStories([])
    fetchSource(source)
      .then(items => { setStories(items); setStatus('ok') })
      .catch(() => setStatus('error'))
  }, [source.id])

  function changeSource(id) {
    localStorage.setItem(NEWS_SOURCE_KEY, id)
    setSourceId(id)
  }

  return (
    <div className="news-widget">
      <div className="news-header">
        <span className="news-title">Top Stories</span>
        <select
          className="news-source-select"
          value={sourceId}
          onChange={e => changeSource(e.target.value)}
        >
          {NEWS_SOURCES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>
      {status === 'loading' && <div className="news-loading">Loading stories…</div>}
      {status === 'error'   && <div className="news-loading">Couldn't load — try another source</div>}
      {status === 'ok' && (
        <ol className="news-list">
          {stories.map((s, i) => (
            <li key={i} className="news-item">
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="news-link">
                {s.title}
              </a>
              <span className="news-meta">{s.meta}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

export default function HomePage({ pages, user, onCreate, onOpen, onDelete, onUpdate }) {
  const [sections,    setSections]    = useState(loadSections)
  const [cardOrders,  setCardOrders]  = useState(loadOrders)
  const [collapsed,   setCollapsed]   = useState(loadCollapsed)
  const [activeCard,  setActiveCard]  = useState(null)
  const [addingSection, setAddingSection] = useState(false)
  const [newSectionName, setNewSectionName] = useState('')
  const addInputRef = useRef(null)

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  // Ensure all note categories exist as sections
  useEffect(() => {
    const cats    = pages.map(p => p.category || 'General')
    const missing = cats.filter(c => !sections.includes(c))
    if (missing.length) {
      const updated = [...sections, ...new Set(missing)]
      setSections(updated)
      saveSections(updated)
    }
  }, [pages])

  useEffect(() => { if (addingSection) addInputRef.current?.focus() }, [addingSection])

  // ── Section management ──────────────────────────────────
  function addSection() {
    const name = newSectionName.trim()
    if (name && !sections.includes(name)) {
      const updated = [...sections, name]
      setSections(updated)
      saveSections(updated)
    }
    setNewSectionName('')
    setAddingSection(false)
  }

  function renameSection(oldName, newName) {
    const trimmed = newName.trim()
    if (!trimmed || trimmed === oldName || sections.includes(trimmed)) return
    const updated = sections.map(s => s === oldName ? trimmed : s)
    setSections(updated)
    saveSections(updated)
    // Transfer order key
    setCardOrders(prev => {
      const next = { ...prev, [trimmed]: prev[oldName] }
      delete next[oldName]
      saveOrders(next)
      return next
    })
    pages.filter(p => (p.category || 'General') === oldName)
      .forEach(p => onUpdate(p.id, { category: trimmed }))
  }

  function deleteSection(name) {
    if (name === 'General') return
    const updated = sections.filter(s => s !== name)
    setSections(updated)
    saveSections(updated)
    pages.filter(p => (p.category || 'General') === name)
      .forEach(p => onUpdate(p.id, { category: 'General' }))
  }

  function toggleCollapse(name) {
    setCollapsed(prev => {
      const next = { ...prev, [name]: !prev[name] }
      saveCollapsed(next)
      return next
    })
  }

  // ── Build ordered groups ────────────────────────────────
  const rawGrouped = {}
  for (const s of sections) rawGrouped[s] = []
  for (const page of [...pages].reverse()) {
    const cat = page.category || 'General'
    if (rawGrouped[cat] !== undefined) rawGrouped[cat].push(page)
    else rawGrouped['General'].push(page)
  }
  const grouped = {}
  for (const s of sections) {
    grouped[s] = applySectionOrder(cardOrders[s], rawGrouped[s])
  }

  // ── DnD ────────────────────────────────────────────────
  function handleDragStart({ active }) {
    if (sections.includes(active.id)) {
      setActiveCard(null) // dragging a section
    } else {
      setActiveCard(pages.find(p => p.id === active.id) ?? null)
    }
  }

  function handleDragEnd({ active, over }) {
    if (!over || active.id === over.id) return

    // ── Section reorder ──
    if (sections.includes(active.id)) {
      setActiveCard(null)
      const oldIdx = sections.indexOf(active.id)
      const newIdx = sections.indexOf(over.id)
      if (oldIdx !== -1 && newIdx !== -1) {
        const updated = arrayMove(sections, oldIdx, newIdx)
        setSections(updated)
        saveSections(updated)
      }
      return
    }

    // ── Card drag ──
    setActiveCard(null)
    const card = pages.find(p => p.id === active.id)
    if (!card) return
    const fromSection = card.category || 'General'

    // Dropped on a section (empty area) → cross-section move
    if (sections.includes(over.id)) {
      if (fromSection !== over.id) {
        onUpdate(active.id, { category: over.id })
        setCardOrders(prev => {
          const fromOrder = (prev[fromSection] || grouped[fromSection].map(p => p.id)).filter(id => id !== active.id)
          const toOrder   = [...(prev[over.id] || grouped[over.id].map(p => p.id)), active.id]
          const next = { ...prev, [fromSection]: fromOrder, [over.id]: toOrder }
          saveOrders(next)
          return next
        })
      }
      return
    }

    // Dropped on a card
    const overCard = pages.find(p => p.id === over.id)
    if (!overCard) return
    const toSection = overCard.category || 'General'

    if (fromSection === toSection) {
      setCardOrders(prev => {
        const ids    = grouped[fromSection].map(p => p.id)
        const oldIdx = ids.indexOf(active.id)
        const newIdx = ids.indexOf(over.id)
        if (oldIdx === -1 || newIdx === -1) return prev
        const next = { ...prev, [fromSection]: arrayMove(ids, oldIdx, newIdx) }
        saveOrders(next)
        return next
      })
    } else {
      onUpdate(active.id, { category: toSection })
      setCardOrders(prev => {
        const fromOrder = (prev[fromSection] || grouped[fromSection].map(p => p.id)).filter(id => id !== active.id)
        const toIds    = prev[toSection] || grouped[toSection].map(p => p.id)
        const insertAt = toIds.indexOf(over.id)
        const toOrder  = insertAt === -1
          ? [...toIds, active.id]
          : [...toIds.slice(0, insertAt), active.id, ...toIds.slice(insertAt)]
        const next = { ...prev, [fromSection]: fromOrder, [toSection]: toOrder }
        saveOrders(next)
        return next
      })
    }
  }

  const overall = overallProgress(pages)

  return (
    <div className="home">
      {/* Hero */}
      <div className="home-hero">
        <div className="home-hero-text">
          <p className="home-greeting">{greeting()}{user?.name ? `, ${user.name}` : ''}</p>
          <h1 className="home-title">My Notes</h1>
          <p className="home-date">{today}</p>
        </div>
        <div className="home-hero-right">
          <div className="home-hero-widgets">
            <WeatherWidget />
            <MarketWidget />
          </div>
          <button className="btn-new-note" onClick={onCreate}>
            <span className="btn-new-note-icon">+</span>
            New Note
          </button>
        </div>
      </div>

      {/* Stats */}
      {pages.length > 0 && (
        <div className="home-stats">
          <div className="home-stat">
            <span className="home-stat-value">{pages.length}</span>
            <span className="home-stat-label">Notes</span>
          </div>
          <div className="home-stat-divider" />
          <div className="home-stat">
            <span className="home-stat-value">
              {pages.reduce((n, p) => n + p.checklist.filter(i => i.checked).length, 0)}
              <span className="home-stat-of">/{pages.reduce((n, p) => n + p.checklist.length, 0)}</span>
            </span>
            <span className="home-stat-label">Tasks done</span>
          </div>
          {overall !== null && (
            <>
              <div className="home-stat-divider" />
              <div className="home-stat home-stat-progress">
                <span className="home-stat-label">Overall progress</span>
                <div className="overall-progress-track">
                  <div className="overall-progress-fill" style={{ width: `${overall}%`, background: progressColor(overall) }} />
                </div>
                <span className="home-stat-pct" style={{ color: progressColor(overall) }}>{overall}%</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Todo summary */}
      {pages.length > 0 && <TodoSummary pages={pages} onOpen={onOpen} />}

      {/* News */}
      <NewsWidget />

      {pages.length === 0 ? (
        <div className="home-empty">
          <div className="home-empty-icon">✦</div>
          <p className="home-empty-title">Nothing here yet</p>
          <p className="home-empty-sub">Create your first note to get started.</p>
          <button className="btn-new-note" onClick={onCreate}>
            <span className="btn-new-note-icon">+</span>
            New Note
          </button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={rectIntersection}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="home-sections">
            <SortableContext items={sections} strategy={verticalListSortingStrategy}>
            {sections.map(section => (
              <DroppableSection
                key={section}
                name={section}
                cards={grouped[section] || []}
                isCollapsed={!!collapsed[section]}
                onToggleCollapse={() => toggleCollapse(section)}
                onOpen={onOpen}
                onDelete={onDelete}
                onRename={renameSection}
                onDeleteSection={deleteSection}
                onCreateInSection={() => onCreate(section)}
                canDelete={section !== 'General'}
              />
            ))}
            </SortableContext>

            {addingSection ? (
              <div className="add-section-row">
                <input
                  ref={addInputRef}
                  className="add-section-input"
                  placeholder="Section name…"
                  value={newSectionName}
                  onChange={e => setNewSectionName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') addSection()
                    if (e.key === 'Escape') { setAddingSection(false); setNewSectionName('') }
                  }}
                />
                <button className="btn-add-section-confirm" onClick={addSection}>Add</button>
                <button className="btn-add-section-cancel" onClick={() => { setAddingSection(false); setNewSectionName('') }}>Cancel</button>
              </div>
            ) : (
              <button className="btn-add-section" onClick={() => setAddingSection(true)}>
                + Add section
              </button>
            )}
          </div>

          <DragOverlay>
            {activeCard && (
              <div style={{ opacity: 0.85, transform: 'rotate(1.5deg)', pointerEvents: 'none' }}>
                <NoteCard page={activeCard} accent={getAccent(activeCard.id)} onOpen={() => {}} onDelete={() => {}} index={0} overlay />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  )
}

// ── Sortable + droppable section ────────────────────────
function DroppableSection({ name, cards, isCollapsed, onToggleCollapse, onOpen, onDelete, onRename, onDeleteSection, onCreateInSection, canDelete }) {
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging, isOver,
  } = useSortable({ id: name })

  const [editing, setEditing]  = useState(false)
  const [editName, setEditName] = useState(name)
  const inputRef = useRef(null)

  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])

  function submitRename() {
    onRename(name, editName)
    setEditing(false)
  }

  return (
    <div
      ref={setNodeRef}
      className={`home-section${isOver ? ' drop-over' : ''}${isDragging ? ' section-dragging' : ''}${isCollapsed ? ' section-collapsed' : ''}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <div className="home-section-header">
        <span className="section-folder-handle" {...attributes} {...listeners} title="Drag to reorder">⠿</span>
        {editing ? (
          <input
            ref={inputRef}
            className="home-section-label-input"
            value={editName}
            onChange={e => setEditName(e.target.value)}
            onBlur={submitRename}
            onKeyDown={e => {
              if (e.key === 'Enter') submitRename()
              if (e.key === 'Escape') { setEditName(name); setEditing(false) }
            }}
          />
        ) : (
          <span className="home-section-label" onClick={() => { setEditName(name); setEditing(true) }} title="Click to rename">
            {name}
          </span>
        )}
        <span className="home-section-count">{cards.length}</span>
        <button className="btn-section-add" onClick={onCreateInSection} title="New note in this section">+</button>
        {canDelete && (
          <button className="btn-section-delete" onClick={() => onDeleteSection(name)} title="Delete section">×</button>
        )}
        <button className="btn-section-collapse" onClick={onToggleCollapse} title={isCollapsed ? 'Expand' : 'Collapse'}>
          {isCollapsed ? '▸' : '▾'}
        </button>
      </div>

      {!isCollapsed && (
        <SortableContext items={cards.map(c => c.id)} strategy={rectSortingStrategy}>
          <div className="home-grid">
            {cards.length === 0 && <div className="home-section-empty">Drop notes here</div>}
            {cards.map((page, i) => (
              <SortableCard
                key={page.id}
                page={page}
                index={i}
                accent={getAccent(page.id)}
                onOpen={() => onOpen(page.id)}
                onDelete={() => onDelete(page.id)}
              />
            ))}
          </div>
        </SortableContext>
      )}
    </div>
  )
}

// ── Sortable card wrapper ───────────────────────────────
function SortableCard({ page, accent, index, onOpen, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: page.id })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
      }}
    >
      <NoteCard
        page={page}
        accent={accent}
        index={index}
        onOpen={onOpen}
        onDelete={onDelete}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  )
}

// ── Todo Summary ───────────────────────────────────────
function TodoSummary({ pages, onOpen }) {
  const [expanded, setExpanded] = useState(false)

  const todos = []
  for (const page of pages) {
    for (const item of page.checklist.filter(i => !i.checked)) {
      todos.push({ text: item.text, note: page.headline || 'Untitled', noteId: page.id, type: 'task' })
    }
    for (const card of page.kanban.todo) {
      if (!page.checklist.find(i => i.id === card.id)) {
        todos.push({ text: card.text, note: page.headline || 'Untitled', noteId: page.id, type: 'kanban' })
      }
    }
  }

  if (todos.length === 0) return null

  const LIMIT = 5
  const visible = expanded ? todos : todos.slice(0, LIMIT)
  const hidden  = todos.length - LIMIT

  return (
    <div className="todo-summary">
      <div className="todo-summary-header">
        <span className="todo-summary-title">To Do</span>
        <span className="todo-summary-count">{todos.length} item{todos.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="todo-summary-list">
        {visible.map((item, i) => (
          <div key={i} className="todo-summary-item" onClick={() => onOpen(item.noteId)}>
            <span className="todo-summary-dot" />
            <span className="todo-summary-text">{item.text}</span>
            <span className="todo-summary-note">{item.note}</span>
          </div>
        ))}
      </div>
      {todos.length > LIMIT && (
        <button className="todo-summary-toggle" onClick={() => setExpanded(e => !e)}>
          {expanded ? '↑ Show less' : `↓ Show ${hidden} more`}
        </button>
      )}
    </div>
  )
}

// ── Note card ───────────────────────────────────────────
function NoteCard({ page, accent, index, onOpen, onDelete, dragHandleProps, overlay }) {
  const tasksDone  = page.checklist.filter(i => i.checked).length
  const totalTasks = page.checklist.length
  const totalKanban = page.kanban.todo.length + page.kanban.working.length + page.kanban.completed.length
  const updated = new Date(page.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

  const chips = [
    totalTasks  > 0 && `${tasksDone}/${totalTasks} tasks`,
    page.quickNotes.length > 0 && `${page.quickNotes.length} notes`,
    totalKanban > 0 && `${totalKanban} cards`,
  ].filter(Boolean)

  const pct   = calcProgress(page)
  const color = pct !== null ? progressColor(pct) : null

  return (
    <div
      className="note-card"
      onClick={onOpen}
      style={{ '--card-accent': accent, animationDelay: overlay ? '0s' : `${0.04 + index * 0.06}s` }}
    >
      <div className="note-card-accent-bar" />
      <div className="note-card-body">
        <div className="note-card-top">
          <h2 className="note-card-title">{page.headline || 'Untitled'}</h2>
          <button className="btn-delete note-card-delete" onClick={e => { e.stopPropagation(); onDelete() }}>×</button>
        </div>

        {page.broadNotes ? (
          <p className="note-card-preview">{page.broadNotes.slice(0, 100)}{page.broadNotes.length > 100 ? '…' : ''}</p>
        ) : (
          <p className="note-card-preview note-card-empty-preview">No notes yet…</p>
        )}

        {pct !== null && (
          <div className="card-progress">
            <div className="card-progress-track">
              <div className="card-progress-fill" style={{ width: `${pct}%`, background: color }} />
            </div>
            <span className="card-progress-pct" style={{ color }}>{pct}%</span>
          </div>
        )}

        <div className="note-card-footer">
          <div className="note-card-chips">
            {chips.map(c => <span key={c} className="note-chip">{c}</span>)}
          </div>
          <span className="note-card-date">{updated}</span>
        </div>
      </div>

      {dragHandleProps && (
        <span
          className="note-card-drag-handle"
          {...dragHandleProps}
          onClick={e => e.stopPropagation()}
          title="Drag to reorder"
        >⠿</span>
      )}
    </div>
  )
}
