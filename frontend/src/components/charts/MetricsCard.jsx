import React from 'react'

const VARIANTS = {
  indigo: 'intel-kpi--indigo',
  red: 'intel-kpi--red',
  orange: 'intel-kpi--orange',
  amber: 'intel-kpi--amber',
  green: 'intel-kpi--green',
  violet: 'intel-kpi--violet',
}

function MetricsCard({ title, value, subtitle, icon, variant = 'indigo' }) {
  const vClass = VARIANTS[variant] || VARIANTS.indigo
  return (
    <div className={`intel-kpi ${vClass}`}>
      {icon ? <span className="intel-kpi__icon">{icon}</span> : null}
      <div className="intel-kpi__inner">
        <p className="intel-kpi__label">{title}</p>
        <p className="intel-kpi__value">{value}</p>
        {subtitle ? <p className="intel-kpi__sub">{subtitle}</p> : null}
      </div>
    </div>
  )
}

export default MetricsCard
