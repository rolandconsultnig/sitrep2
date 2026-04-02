import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

const SEVERITY_COLORS = {
  'Critical': '#dc2626',
  'High': '#f97316',
  'Medium': '#eab308',
  'Low': '#22c55e',
  'Unknown': '#6b7280'
}

function SeverityPieChart({ data, title }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
        No severity data available
      </div>
    )
  }

  // Count by severity
  const severityCounts = data.reduce((acc, item) => {
    const severity = item.severity || item.severity_flag || 'Unknown'
    acc[severity] = (acc[severity] || 0) + (item.count || 1)
    return acc
  }, {})

  const chartData = Object.entries(severityCounts).map(([name, value]) => ({
    name,
    value
  }))

  const total = chartData.reduce((sum, item) => sum + item.value, 0)

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    if (percent < 0.05) return null

    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight="bold">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  return (
    <div>
      {title && <h3 style={{ marginBottom: '15px', fontSize: '18px', fontWeight: '600' }}>{title}</h3>}
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={100}
            innerRadius={0}
            fill="#8884d8"
            dataKey="value"
            strokeWidth={2}
            stroke="#fff"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={SEVERITY_COLORS[entry.name] || '#6b7280'} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value, name) => [`${value} incidents (${((value/total)*100).toFixed(1)}%)`, name]}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            formatter={(value) => <span style={{ color: '#333', fontSize: '13px' }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export default SeverityPieChart
