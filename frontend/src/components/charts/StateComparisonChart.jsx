import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

function StateComparisonChart({ data, title, dataKey = 'total_reports' }) {
  if (!data || data.length === 0) {
    return <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No data available for chart</div>
  }

  // Limit to top 10 for readability
  const topData = [...data].sort((a, b) => (b[dataKey] || 0) - (a[dataKey] || 0)).slice(0, 10)

  const chartData = topData.map(item => ({
    name: item.state || item.crime_type,
    reports: item[dataKey] || item.count || 0,
    highSeverity: item.high_severity_count || 0
  }))

  return (
    <div style={{ marginBottom: '30px' }}>
      {title && <h3 style={{ marginBottom: '15px', fontSize: '18px' }}>{title}</h3>}
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="reports" fill="#0066cc" name="Total Reports" />
          <Bar dataKey="highSeverity" fill="#ff4444" name="High Severity" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default StateComparisonChart
