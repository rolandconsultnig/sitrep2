import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

const COLORS = {
  'RED': '#ff4444',
  'AMBER': '#ffaa00',
  'GREEN': '#00c851',
  'red': '#ff4444',
  'amber': '#ffaa00',
  'green': '#00c851'
}

function RiskPieChart({ data, title }) {
  if (!data || data.length === 0) {
    return <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No data available for chart</div>
  }

  // Group by risk rating
  const riskData = data.reduce((acc, item) => {
    const rating = item.risk_rating || item.risk_flag || 'UNKNOWN'
    const key = rating.toUpperCase()
    if (!acc[key]) {
      acc[key] = { name: rating, value: 0 }
    }
    acc[key].value += 1
    return acc
  }, {})

  const chartData = Object.values(riskData)

  return (
    <div style={{ marginBottom: '30px' }}>
      {title && <h3 style={{ marginBottom: '15px', fontSize: '18px' }}>{title}</h3>}
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#8884d8'} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export default RiskPieChart
