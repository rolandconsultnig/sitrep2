import React from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

function WeeklyTrendChart({ data, title }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
        No trend data available
      </div>
    )
  }

  const chartData = data.map((item, index) => ({
    name: item.week || item.date || `Period ${index + 1}`,
    incidents: item.count || item.total || item.week_total || item.total_reports || 0,
    critical: item.critical || item.high_severity_count || 0,
    resolved: item.resolved || 0,
  }))

  return (
    <div>
      {title && <h3 style={{ marginBottom: '15px', fontSize: '18px', fontWeight: '600' }}>{title}</h3>}
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorIncidents" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="colorCritical" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12, fill: '#6b7280' }}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: '#6b7280' }}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <Tooltip 
            contentStyle={{ 
              borderRadius: '8px', 
              border: 'none', 
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              backgroundColor: 'white'
            }}
          />
          <Legend 
            verticalAlign="top" 
            height={36}
            formatter={(value) => <span style={{ color: '#333', fontSize: '13px' }}>{value}</span>}
          />
          <Area 
            type="monotone" 
            dataKey="incidents" 
            stroke="#6366f1" 
            fillOpacity={1} 
            fill="url(#colorIncidents)" 
            name="Total Incidents"
            strokeWidth={2}
          />
          <Area 
            type="monotone" 
            dataKey="critical" 
            stroke="#ef4444" 
            fillOpacity={1} 
            fill="url(#colorCritical)" 
            name="Critical"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export default WeeklyTrendChart
