export default function Section({ title, children, action, dragHandleProps }) {
  return (
    <div className="section">
      <div className="section-header">
        <h2 className="section-title">{title}</h2>
        {dragHandleProps && (
          <span className="section-drag-handle" {...dragHandleProps} title="Drag to reorder">
            ⠿
          </span>
        )}
        {action && <div className="section-action">{action}</div>}
      </div>
      <div className="section-body">{children}</div>
    </div>
  )
}
