import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { format } from 'date-fns'

function RealtimeDashboard({ user }) {
  const [stats, setStats] = useState({
    totalToday: 0,
    redAlerts: 0,
    highSeverity: 0,
    statesActive: 0
  })
  const [recentSubmissions, setRecentSubmissions] = useState([])
  const [hotspots, setHotspots] = useState([])
  const [anomalies, setAnomalies] = useState([])
  const [performance, setPerformance] = useState(null)
  const [notifications, setNotifications] = useState([])
  const wsRef = useRef(null)

  useEffect(() => {
    // Load initial data
    loadDashboardData()
    loadAnalytics()

    // Connect to WebSocket for real-time updates
    connectWebSocket()

    // Refresh data every 30 seconds
    const interval = setInterval(() => {
      loadDashboardData()
      loadAnalytics()
    }, 30000)

    return () => {
      clearInterval(interval)
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  const connectWebSocket = () => {
    try {
      const origin = import.meta.env.VITE_API_URL
        ? import.meta.env.VITE_API_URL.replace('https://', 'wss://').replace('http://', 'ws://')
        : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`
      const wsUrl = `${origin}/ws/${user.id}`
      const ws = new WebSocket(wsUrl)
      
      ws.onopen = () => {
        console.log('WebSocket connected')
      }
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)
        handleRealtimeUpdate(data)
      }
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }
      
      ws.onclose = () => {
        console.log('WebSocket disconnected')
        // Reconnect after 5 seconds
        setTimeout(connectWebSocket, 5000)
      }
      
      wsRef.current = ws
    } catch (error) {
      console.error('Failed to connect WebSocket:', error)
    }
  }

  const handleRealtimeUpdate = (data) => {
    if (data.type === 'new_submission') {
      addNotification({
        type: 'info',
        message: `New incident: ${data.data.threat} in ${data.data.state}`,
        timestamp: new Date()
      })
      loadDashboardData()
    } else if (data.type === 'red_alert') {
      addNotification({
        type: 'alert',
        message: `RED ALERT: ${data.data.threat} in ${data.data.state}`,
        timestamp: new Date()
      })
      loadDashboardData()
    } else if (data.type === 'stats_update') {
      loadDashboardData()
    }
  }

  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev].slice(0, 10))
    // Auto-remove after 10 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n !== notification))
    }, 10000)
  }

  const loadDashboardData = async () => {
    try {
      // Get today's stats
      const dailyResponse = await axios.get('/api/reports/daily-sitrep', {
        params: { dashboard_window_days: 14 },
      })
      
      setStats({
        totalToday: dailyResponse.data.total_submissions_24h || 0,
        redAlerts: dailyResponse.data.red_alerts_count || 0,
        highSeverity: dailyResponse.data.top_5_red_alerts?.reduce((sum, a) => sum + a.high_severity_count, 0) || 0,
        statesActive: new Set(dailyResponse.data.top_5_red_alerts?.map(a => a.state) || []).size
      })

      // Get recent submissions
      const submissionsResponse = await axios.get('/api/submissions', {
        params: { limit: 10 }
      })
      setRecentSubmissions(submissionsResponse.data.slice(0, 10))
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    }
  }

  const loadAnalytics = async () => {
    try {
      // Get hotspot predictions
      const hotspotsResponse = await axios.get('/api/analytics/hotspots', {
        params: { days_ahead: 7 }
      })
      setHotspots(hotspotsResponse.data.predictions || [])

      // Get anomalies
      const anomaliesResponse = await axios.get('/api/analytics/anomalies', {
        params: { hours: 24 }
      })
      setAnomalies(anomaliesResponse.data.anomalies || [])

      // Get performance metrics
      const performanceResponse = await axios.get('/api/analytics/performance', {
        params: { days: 30 }
      })
      setPerformance(performanceResponse.data)
    } catch (error) {
      console.error('Failed to load analytics:', error)
    }
  }

  return (
    <div className="container">
      <h1 style={{ marginBottom: '30px' }}>Real-Time Intelligence Dashboard</h1>

      {/* Notifications */}
      <div style={{ position: 'fixed', top: '80px', right: '20px', zIndex: 1000, maxWidth: '400px' }}>
        {notifications.map((notif, idx) => (
          <div
            key={idx}
            className={`alert ${notif.type === 'alert' ? 'alert-error' : 'alert-success'}`}
            style={{ marginBottom: '10px', animation: 'slideIn 0.3s' }}
          >
            <strong>{notif.type === 'alert' ? '⚠️' : 'ℹ️'}</strong> {notif.message}
            <small style={{ display: 'block', marginTop: '5px', opacity: 0.7 }}>
              {format(notif.timestamp, 'HH:mm:ss')}
            </small>
          </div>
        ))}
      </div>

      {/* Key Stats */}
      <div className="stats-grid">
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <h3>Incidents Today</h3>
          <div className="value" style={{ fontSize: '48px' }}>{stats.totalToday}</div>
        </div>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
          <h3>RED Alerts</h3>
          <div className="value" style={{ fontSize: '48px' }}>{stats.redAlerts}</div>
        </div>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
          <h3>High Severity</h3>
          <div className="value" style={{ fontSize: '48px' }}>{stats.highSeverity}</div>
        </div>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
          <h3>Active States</h3>
          <div className="value" style={{ fontSize: '48px' }}>{stats.statesActive}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
        {/* Recent Submissions */}
        <div className="card">
          <h2>Recent Submissions</h2>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {recentSubmissions.map((sub) => (
              <div key={sub.id} style={{ 
                padding: '15px', 
                borderBottom: '1px solid #eee',
                borderLeft: `4px solid ${
                  sub.severity === 'Critical' ? '#ff4444' :
                  sub.severity === 'High' ? '#ffaa00' : '#00c851'
                }`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <strong>{sub.threat_domain}</strong>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                      {sub.state} • {format(new Date(sub.report_date), 'MMM dd, HH:mm')}
                    </div>
                  </div>
                  <span className={`badge badge-${sub.severity === 'Critical' ? 'red' : sub.severity === 'High' ? 'amber' : 'green'}`}>
                    {sub.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Predicted Hotspots */}
        <div className="card">
          <h2>Predicted Hotspots (Next 7 Days)</h2>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {hotspots.length > 0 ? (
              hotspots.map((spot, idx) => (
                <div key={idx} style={{ 
                  padding: '15px', 
                  borderBottom: '1px solid #eee',
                  borderLeft: `4px solid ${spot.risk_level === 'HIGH' ? '#ff4444' : spot.risk_level === 'MEDIUM' ? '#ffaa00' : '#00c851'}`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <strong>{spot.state}</strong>
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                        {spot.threat} • Predicted: {spot.predicted_count} incidents
                      </div>
                    </div>
                    <span className={`badge badge-${spot.risk_level.toLowerCase()}`}>
                      {spot.risk_level}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                No predictions available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Anomalies */}
      {anomalies.length > 0 && (
        <div className="card" style={{ marginTop: '20px', borderLeft: '4px solid #ff4444' }}>
          <h2>⚠️ Detected Anomalies</h2>
          {anomalies.map((anomaly, idx) => (
            <div key={idx} style={{ padding: '15px', borderBottom: '1px solid #eee' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <strong>{anomaly.type.replace('_', ' ').toUpperCase()}</strong>
                  <div style={{ marginTop: '5px' }}>{anomaly.description}</div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                    State: {anomaly.state}
                  </div>
                </div>
                <span className={`badge badge-${anomaly.severity.toLowerCase()}`}>
                  {anomaly.severity}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Performance Metrics */}
      {performance && (
        <div className="card" style={{ marginTop: '20px' }}>
          <h2>Performance Metrics (Last 30 Days)</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Incidents</h3>
              <div className="value">{performance.total_incidents || 0}</div>
            </div>
            <div className="stat-card">
              <h3>Avg Daily</h3>
              <div className="value">{performance.average_daily_incidents || 0}</div>
            </div>
            <div className="stat-card">
              <h3>High Severity %</h3>
              <div className="value">{performance.high_severity_percentage || 0}%</div>
            </div>
            <div className="stat-card">
              <h3>States Covered</h3>
              <div className="value">{performance.states_covered || 0}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RealtimeDashboard
