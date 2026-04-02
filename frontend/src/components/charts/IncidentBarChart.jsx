import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

function IncidentBarChart({ data, title }) {
  if (!data || data.length === 0) {
    return <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No data available for chart</div>
  }

  return (
    <div style={{ marginBottom: '30px' }}>
      {title && <h3 style={{ marginBottom: '15px', fontSize: '18px' }}>{title}</h3>}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="crime_type" angle={-45} textAnchor="end" height={100} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="count" fill="#0066cc" name="Incident Count" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default IncidentBarChart
