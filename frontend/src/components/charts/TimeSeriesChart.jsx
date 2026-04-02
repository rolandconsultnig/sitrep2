import React from 'react'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

function TimeSeriesChart({ data, title, type = 'line' }) {
  if (!data || data.length === 0) {
    return <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No data available for chart</div>
  }

  const ChartComponent = type === 'area' ? AreaChart : LineChart
  const DataComponent = type === 'area' ? Area : Line

  return (
    <div style={{ marginBottom: '30px' }}>
      {title && <h3 style={{ marginBottom: '15px', fontSize: '18px' }}>{title}</h3>}
      <ResponsiveContainer width="100%" height={300}>
        <ChartComponent data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <DataComponent 
            type="monotone" 
            dataKey="value" 
            stroke="#0066cc" 
            fill={type === 'area' ? '#0066cc' : undefined}
            fillOpacity={type === 'area' ? 0.3 : undefined}
            strokeWidth={2} 
            name="Count" 
          />
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  )
}

export default TimeSeriesChart
