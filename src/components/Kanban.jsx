import { useState } from 'react'
import { v4 as uuid } from 'uuid'
import {
  DndContext,
  rectIntersection,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const COLUMNS = [
  { id: 'todo', label: 'To Do' },
  { id: 'working', label: 'Working On' },
  { id: 'completed', label: 'Completed' },
]

const COL_IDS = new Set(COLUMNS.map(c => c.id))

export default function Kanban({ kanban, onChange }) {
  const [activeCard, setActiveCard] = useState(null)
  const [inputs, setInputs] = useState({ todo: '', working: '', completed: '' })

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function addCard(colId) {
    const text = inputs[colId].trim()
    if (!text) return
    onChange({ [colId]: [...kanban[colId], { id: uuid(), text }] })
    setInputs(prev => ({ ...prev, [colId]: '' }))
  }

  function deleteCard(colId, cardId) {
    onChange({ [colId]: kanban[colId].filter(c => c.id !== cardId) })
  }

  function findColumn(id) {
    return COLUMNS.find(col => kanban[col.id].some(c => c.id === id))?.id
  }

  function handleDragStart({ active }) {
    const colId = findColumn(active.id)
    setActiveCard(colId ? kanban[colId].find(c => c.id === active.id) : null)
  }

  function handleDragEnd({ active, over }) {
    setActiveCard(null)
    if (!over) return

    const fromCol = findColumn(active.id)
    if (!fromCol) return

    // over.id is either a column id (dropped on empty space) or a card id
    const toCol = COL_IDS.has(over.id) ? over.id : findColumn(over.id)
    if (!toCol) return

    if (fromCol === toCol) {
      const items = kanban[fromCol]
      const oldIdx = items.findIndex(c => c.id === active.id)
      const newIdx = items.findIndex(c => c.id === over.id)
      if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
        onChange({ [fromCol]: arrayMove(items, oldIdx, newIdx) })
      }
    } else {
      const card = kanban[fromCol].find(c => c.id === active.id)
      onChange({
        [fromCol]: kanban[fromCol].filter(c => c.id !== active.id),
        [toCol]: [...kanban[toCol], card],
      })
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="kanban">
        {COLUMNS.map(col => (
          <KanbanColumn
            key={col.id}
            col={col}
            cards={kanban[col.id]}
            input={inputs[col.id]}
            onInputChange={val => setInputs(prev => ({ ...prev, [col.id]: val }))}
            onAdd={() => addCard(col.id)}
            onDelete={cardId => deleteCard(col.id, cardId)}
          />
        ))}
      </div>
      <DragOverlay>
        {activeCard && <KanbanCard card={activeCard} overlay />}
      </DragOverlay>
    </DndContext>
  )
}

function KanbanColumn({ col, cards, input, onInputChange, onAdd, onDelete }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id })

  return (
    <div
      ref={setNodeRef}
      className={`kanban-col kanban-col-${col.id}${isOver ? ' kanban-col-over' : ''}`}
    >
      <div className="kanban-col-header">
        <span className="kanban-col-title">{col.label}</span>
        <span className="kanban-count">{cards.length}</span>
      </div>

      <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
        <div className="kanban-cards">
          {cards.map(card => (
            <KanbanCard key={card.id} card={card} onDelete={() => onDelete(card.id)} />
          ))}
          {isOver && cards.length === 0 && (
            <div className="kanban-drop-hint">Drop here</div>
          )}
        </div>
      </SortableContext>

      <div className="add-row">
        <input
          className="text-input"
          placeholder="Add card…"
          value={input}
          onChange={e => onInputChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onAdd()}
        />
        <button className="btn-add" onClick={onAdd}>+</button>
      </div>
    </div>
  )
}

function KanbanCard({ card, onDelete, overlay }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
  })

  return (
    <div
      ref={setNodeRef}
      style={overlay ? {} : {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
      }}
      className={`kanban-card${overlay ? ' kanban-card-overlay' : ''}`}
      {...attributes}
      {...listeners}
    >
      <span>{card.text}</span>
      {onDelete && (
        <button className="btn-delete" onClick={e => { e.stopPropagation(); onDelete() }}>×</button>
      )}
    </div>
  )
}
