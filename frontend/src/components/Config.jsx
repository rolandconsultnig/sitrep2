import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { format } from 'date-fns'

function Config({ user }) {
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const response = await axios.get('/api/config')
      setConfig(response.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load config')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      await axios.put('/api/config', config)
      setSuccess('Configuration updated successfully!')
      fetchConfig()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update config')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="loading">Loading configuration...</div>
  }

  if (user?.role !== 'admin') {
    return <div className="alert alert-error">Access denied. Admin only.</div>
  }

  return (
    <div className="container">
      <h1 style={{ marginBottom: '30px' }}>System Configuration</h1>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card">
        <h2>Report Settings</h2>
        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="form-group">
              <label>Daily Report Date</label>
              <input
                type="datetime-local"
                value={config?.daily_report_date 
                  ? format(new Date(config.daily_report_date), "yyyy-MM-dd'T'HH:mm")
                  : ''}
                onChange={(e) => setConfig({ 
                  ...config, 
                  daily_report_date: new Date(e.target.value).toISOString() 
                })}
              />
            </div>

            <div className="form-group">
              <label>Daily Window (days)</label>
              <input
                type="number"
                value={config?.daily_window_days || 1}
                onChange={(e) => setConfig({ 
                  ...config, 
                  daily_window_days: parseInt(e.target.value) 
                })}
                min="1"
              />
            </div>

            <div className="form-group">
              <label>Week Start Date</label>
              <input
                type="datetime-local"
                value={config?.week_start_date 
                  ? format(new Date(config.week_start_date), "yyyy-MM-dd'T'HH:mm")
                  : ''}
                onChange={(e) => setConfig({ 
                  ...config, 
                  week_start_date: new Date(e.target.value).toISOString() 
                })}
              />
            </div>

            <div className="form-group">
              <label>Week End Date</label>
              <input
                type="datetime-local"
                value={config?.week_end_date 
                  ? format(new Date(config.week_end_date), "yyyy-MM-dd'T'HH:mm")
                  : ''}
                onChange={(e) => setConfig({ 
                  ...config, 
                  week_end_date: new Date(e.target.value).toISOString() 
                })}
              />
            </div>

            <div className="form-group">
              <label>High Severity Threshold</label>
              <input
                type="number"
                value={config?.high_severity_threshold || 3}
                onChange={(e) => setConfig({ 
                  ...config, 
                  high_severity_threshold: parseInt(e.target.value) 
                })}
                min="1"
              />
              <small style={{ color: '#666' }}>Minimum high severity incidents for RED flag</small>
            </div>

            <div className="form-group">
              <label>RED Alert Threshold</label>
              <input
                type="number"
                value={config?.red_alert_threshold || 5}
                onChange={(e) => setConfig({ 
                  ...config, 
                  red_alert_threshold: parseInt(e.target.value) 
                })}
                min="1"
              />
              <small style={{ color: '#666' }}>Minimum total reports for RED alert</small>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Config
