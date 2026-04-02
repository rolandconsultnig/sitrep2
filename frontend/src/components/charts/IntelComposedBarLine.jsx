import React, { useMemo } from 'react'
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

/**
 * Incident summary: bars for volume, line for a derived emphasis score.
 */
function IntelComposedBarLine({ data, title }) {
  const chartData = useMemo(() => {
    if (!data?.length) return []
    return data.map((item) => {
      const count = item.count || 0
      const sev = (item.severity_flag || '').toUpperCase()
      let weight = 1
      if (sev === 'RED' || item.severity === 'Critical') weight = 4
      else if (sev === 'AMBER' || item.severity === 'High') weight = 2.5
      else if (sev === 'GREEN') weight = 1
      return {
        name:
          (item.crime_type || item.threat || 'Type').length > 18
            ? `${(item.crime_type || item.threat || '').slice(0, 16)}…`
            : item.crime_type || item.threat || 'Incident',
        count,
        emphasis: Math.round(count * weight * 10) / 10,
      }
    })
  }, [data])

  if (!chartData.length) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No incident data</div>
    )
  }

  return (
    <div>
      {title ? (
        <h3 style={{ marginBottom: '12px', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          {title}
        </h3>
      ) : null}
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={chartData} margin={{ top: 8, right: 16, left: 4, bottom: 48 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
          <XAxis
            dataKey="name"
            angle={-35}
            textAnchor="end"
            height={70}
            interval={0}
            tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
            allowDecimals={false}
            label={{ value: 'Count', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 11 }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 10, fill: '#1976d2' }}
            label={{ value: 'Intensity', angle: 90, position: 'insideRight', fill: '#1976d2', fontSize: 11 }}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 10,
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar
            yAxisId="left"
            dataKey="count"
            name="Report count"
            fill="url(#intelBarGrad)"
            radius={[6, 6, 0, 0]}
            maxBarSize={48}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="emphasis"
            name="Weighted intensity"
            stroke="#1976d2"
            strokeWidth={2}
            dot={{ r: 3, fill: '#1976d2' }}
          />
          <defs>
            <linearGradient id="intelBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#228B22" />
              <stop offset="100%" stopColor="#004d00" />
            </linearGradient>
          </defs>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

export default IntelComposedBarLine
