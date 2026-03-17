export default function Section({ title, children, action }) {
  return (
    <div className="section">
      <div className="section-header">
        <h2 className="section-title">{title}</h2>
        {action && <div className="section-action">{action}</div>}
      </div>
      <div className="section-body">{children}</div>
    </div>
  )
}
