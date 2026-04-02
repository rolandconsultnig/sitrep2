import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

function TrendLineChart({ data, title, dataKey = 'week_total', name = 'Count' }) {
  if (!data || data.length === 0) {
    return <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No data available for chart</div>
  }

  const chartData = data.map((item, idx) => ({
    name: item.crime_type,
    value: item[dataKey] || item.week_total || 0,
    trend: item.trend_direction
  }))

  return (
    <div style={{ marginBottom: '30px' }}>
      {title && <h3 style={{ marginBottom: '15px', fontSize: '18px' }}>{title}</h3>}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="value" stroke="#0066cc" strokeWidth={2} name={name} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default TrendLineChart
