import React from 'react'
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend, Tooltip } from 'recharts'

function StateRadarChart({ data, title }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
        No state data available
      </div>
    )
  }

  // Process data for radar chart - top 8 states
  const chartData = data
    .slice(0, 8)
    .map(item => ({
      state: item.state || 'Unknown',
      incidents: item.total_reports || item.count || 0,
      critical: item.high_severity_count || 0,
      fullMark: 100
    }))

  return (
    <div>
      {title && <h3 style={{ marginBottom: '15px', fontSize: '18px', fontWeight: '600' }}>{title}</h3>}
      <ResponsiveContainer width="100%" height={350}>
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis 
            dataKey="state" 
            tick={{ fontSize: 11, fill: '#374151' }}
          />
          <PolarRadiusAxis 
            angle={30} 
            domain={[0, 'auto']}
            tick={{ fontSize: 10, fill: '#9ca3af' }}
          />
          <Radar 
            name="Total Incidents" 
            dataKey="incidents" 
            stroke="#6366f1" 
            fill="#6366f1" 
            fillOpacity={0.5}
            strokeWidth={2}
          />
          <Radar 
            name="Critical" 
            dataKey="critical" 
            stroke="#ef4444" 
            fill="#ef4444" 
            fillOpacity={0.3}
            strokeWidth={2}
          />
          <Legend 
            verticalAlign="bottom"
            formatter={(value) => <span style={{ color: '#333', fontSize: '13px' }}>{value}</span>}
          />
          <Tooltip 
            contentStyle={{ 
              borderRadius: '8px', 
              border: 'none', 
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)' 
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default StateRadarChart
