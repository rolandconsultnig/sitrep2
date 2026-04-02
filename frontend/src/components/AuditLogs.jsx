import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { format } from 'date-fns'

function AuditLogs({ user }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    action: '',
    resource_type: '',
    start_date: '',
    end_date: '',
    limit: 100
  })

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchLogs()
    }
  }, [filters, user])

  const fetchLogs = async () => {
    try {
      const params = { limit: filters.limit }
      if (filters.action) params.action = filters.action
      if (filters.resource_type) params.resource_type = filters.resource_type
      if (filters.start_date) params.start_date = new Date(filters.start_date).toISOString()
      if (filters.end_date) params.end_date = new Date(filters.end_date).toISOString()

      const response = await axios.get('/api/audit-logs', { params })
      setLogs(response.data.logs || [])
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }

  if (user?.role !== 'admin') {
    return <div className="alert alert-error">Access denied. Admin only.</div>
  }

  if (loading) {
    return <div className="loading">Loading audit logs...</div>
  }

  const getActionColor = (action) => {
    const colors = {
      'CREATE': '#00c851',
      'UPDATE': '#ffbb33',
      'DELETE': '#ff4444',
      'LOGIN': '#33b5e5',
      'LOGOUT': '#aa66cc',
      'VIEW': '#2BBBAD',
      'EXPORT': '#4285F4',
      'SHARE': '#ff8800'
    }
    return colors[action] || '#666'
  }

  return (
    <div className="container">
      <h1 style={{ marginBottom: '30px' }}>Audit Logs</h1>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Filters */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h3>Filters</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Action</label>
            <select
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
            >
              <option value="">All Actions</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
              <option value="LOGIN">LOGIN</option>
              <option value="LOGOUT">LOGOUT</option>
              <option value="VIEW">VIEW</option>
              <option value="EXPORT">EXPORT</option>
              <option value="SHARE">SHARE</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Resource Type</label>
            <select
              value={filters.resource_type}
              onChange={(e) => setFilters({ ...filters, resource_type: e.target.value })}
            >
              <option value="">All Types</option>
              <option value="USER">USER</option>
              <option value="SUBMISSION">SUBMISSION</option>
              <option value="REPORT">REPORT</option>
              <option value="AGENCY">AGENCY</option>
              <option value="COLLABORATION">COLLABORATION</option>
              <option value="ANALYTICS">ANALYTICS</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Start Date</label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>End Date</label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Limit</label>
            <select
              value={filters.limit}
              onChange={(e) => setFilters({ ...filters, limit: parseInt(e.target.value) })}
            >
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="200">200</option>
              <option value="500">500</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Logs ({logs.length})</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Action</th>
              <th>Resource</th>
              <th>Resource ID</th>
              <th>IP Address</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm:ss')}</td>
                <td>{log.username}</td>
                <td>
                  <span 
                    className="badge" 
                    style={{ backgroundColor: getActionColor(log.action), color: 'white' }}
                  >
                    {log.action}
                  </span>
                </td>
                <td>{log.resource_type}</td>
                <td>{log.resource_id || '-'}</td>
                <td>{log.ip_address || '-'}</td>
                <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {log.details ? JSON.stringify(log.details).substring(0, 50) : '-'}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', color: '#666' }}>
                  No audit logs found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AuditLogs
