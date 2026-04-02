import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

const THREAT_COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
  '#f43f5e', '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4'
]

function ThreatDonutChart({ data, title }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
        No threat data available
      </div>
    )
  }

  // Group by threat type
  const threatCounts = data.reduce((acc, item) => {
    const threat = item.threat || item.threat_domain || item.crime_type || 'Unknown'
    acc[threat] = (acc[threat] || 0) + (item.total_reports || item.count || 1)
    return acc
  }, {})

  const chartData = Object.entries(threatCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10) // Top 10

  const total = chartData.reduce((sum, item) => sum + item.value, 0)

  return (
    <div>
      {title && <h3 style={{ marginBottom: '15px', fontSize: '18px', fontWeight: '600' }}>{title}</h3>}
      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={100}
            fill="#8884d8"
            paddingAngle={2}
            dataKey="value"
            strokeWidth={0}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={THREAT_COLORS[index % THREAT_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value, name) => [`${value} reports`, name]}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={80}
            wrapperStyle={{ paddingTop: '20px' }}
            formatter={(value) => (
              <span style={{ color: '#333', fontSize: '12px' }}>
                {value.length > 20 ? value.substring(0, 20) + '...' : value}
              </span>
            )}
          />
          {/* Center text */}
          <text x="50%" y="42%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: '28px', fontWeight: 'bold', fill: '#333' }}>
            {total}
          </text>
          <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: '12px', fill: '#666' }}>
            Total Reports
          </text>
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export default ThreatDonutChart
