import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#ef4444', '#f97316']

function HorizontalBarChart({ data, title, dataKey = 'total_reports' }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
        No data available
      </div>
    )
  }

  const chartData = data
    .slice(0, 8)
    .map(item => ({
      name: item.state || item.threat || item.crime_type || 'Unknown',
      value: item[dataKey] || item.total_reports || item.count || 0,
      critical: item.high_severity_count || 0
    }))
    .sort((a, b) => b.value - a.value)

  return (
    <div>
      {title && <h3 style={{ marginBottom: '15px', fontSize: '18px', fontWeight: '600' }}>{title}</h3>}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart 
          data={chartData} 
          layout="vertical"
          margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
          <XAxis 
            type="number"
            tick={{ fontSize: 12, fill: '#6b7280' }}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis 
            type="category"
            dataKey="name"
            tick={{ fontSize: 12, fill: '#374151' }}
            axisLine={{ stroke: '#e5e7eb' }}
            width={75}
          />
          <Tooltip 
            contentStyle={{ 
              borderRadius: '8px', 
              border: 'none', 
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)' 
            }}
            formatter={(value) => [`${value} reports`, 'Total']}
          />
          <Bar 
            dataKey="value" 
            radius={[0, 4, 4, 0]}
            barSize={20}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default HorizontalBarChart
