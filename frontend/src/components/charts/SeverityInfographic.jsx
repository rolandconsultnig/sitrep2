import React, { useMemo } from 'react'

const ORDER = ['Critical', 'High', 'Medium', 'Low', 'Unknown']
const COLORS = {
  Critical: '#b91c1c',
  High: '#ea580c',
  Medium: '#ca8a04',
  Low: '#15803d',
  Unknown: '#64748b',
}

/**
 * Horizontal proportional strip + legend from raw submissions.
 */
function SeverityInfographic({ submissions, title }) {
  const { segments, total } = useMemo(() => {
    const counts = { Critical: 0, High: 0, Medium: 0, Low: 0, Unknown: 0 }
    ;(submissions || []).forEach((s) => {
      const k = ORDER.includes(s.severity) ? s.severity : 'Unknown'
      counts[k] += 1
    })
    const t = Object.values(counts).reduce((a, b) => a + b, 0)
    const segs = ORDER.filter((k) => counts[k] > 0).map((k) => ({
      key: k,
      count: counts[k],
      pct: t ? (counts[k] / t) * 100 : 0,
      color: COLORS[k],
    }))
    return { segments: segs, total: t }
  }, [submissions])

  if (!total) {
    return (
      <div style={{ padding: '28px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        No severity data from recent submissions
      </div>
    )
  }

  return (
    <div className="intel-severity-strip">
      {title ? (
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h3>
      ) : null}
      <div className="intel-severity-bar" role="img" aria-label="Severity distribution">
        {segments.map((s) => (
          <div
            key={s.key}
            className="intel-severity-bar__seg"
            style={{ width: `${s.pct}%`, background: s.color }}
            title={`${s.key}: ${s.count}`}
          />
        ))}
      </div>
      <div className="intel-severity-legend">
        {segments.map((s) => (
          <span key={s.key}>
            <span className="intel-severity-dot" style={{ background: s.color }} />
            {s.key}: <strong>{s.count}</strong> ({s.pct.toFixed(1)}%)
          </span>
        ))}
      </div>
    </div>
  )
}

export default SeverityInfographic
