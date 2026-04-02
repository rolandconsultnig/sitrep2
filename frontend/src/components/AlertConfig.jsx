import React, { useState, useEffect } from 'react'
import axios from 'axios'

const NIGERIA_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa",
  "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo",
  "Ekiti", "Enugu", "FCT", "Gombe", "Imo", "Jigawa",
  "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara",
  "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun",
  "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"
]

function AlertConfig({ user }) {
  const [config, setConfig] = useState({
    email_enabled: 'true',
    sms_enabled: 'false',
    phone_number: '',
    alert_on_critical: 'true',
    alert_on_high: 'true',
    alert_on_medium: 'false',
    alert_on_low: 'false',
    alert_states: [],
    daily_digest: 'false',
    digest_time: '08:00'
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const response = await axios.get('/api/alert-config')
      setConfig(response.data)
    } catch (err) {
      setError('Failed to load alert configuration')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      await axios.put('/api/alert-config', config)
      setSuccess('Alert configuration saved successfully!')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save configuration')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = (field) => {
    setConfig(prev => ({
      ...prev,
      [field]: prev[field] === 'true' ? 'false' : 'true'
    }))
  }

  const handleStateToggle = (state) => {
    setConfig(prev => {
      const states = prev.alert_states || []
      if (states.includes(state)) {
        return { ...prev, alert_states: states.filter(s => s !== state) }
      } else {
        return { ...prev, alert_states: [...states, state] }
      }
    })
  }

  const selectAllStates = () => {
    setConfig(prev => ({ ...prev, alert_states: [...NIGERIA_STATES] }))
  }

  const clearAllStates = () => {
    setConfig(prev => ({ ...prev, alert_states: [] }))
  }

  if (loading) {
    return <div className="loading">Loading configuration...</div>
  }

  return (
    <div className="container">
      <h1>🔔 Alert Configuration</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        Configure how and when you receive alerts for security incidents.
      </p>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit}>
        {/* Notification Channels */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '20px', color: '#1a5f2a' }}>📧 Notification Channels</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <div style={{ 
              padding: '20px', 
              background: config.email_enabled === 'true' ? 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)' : '#f5f5f5',
              borderRadius: '12px',
              border: config.email_enabled === 'true' ? '2px solid #2e7d32' : '2px solid #ddd',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }} onClick={() => handleToggle('email_enabled')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span style={{ fontSize: '32px' }}>📧</span>
                <div>
                  <h4 style={{ margin: 0 }}>Email Alerts</h4>
                  <p style={{ margin: '5px 0 0', color: '#666', fontSize: '14px' }}>
                    Receive alerts via email to {user?.email}
                  </p>
                </div>
                <div style={{ 
                  marginLeft: 'auto',
                  width: '50px',
                  height: '26px',
                  background: config.email_enabled === 'true' ? '#2e7d32' : '#ccc',
                  borderRadius: '13px',
                  position: 'relative',
                  transition: 'background 0.3s'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '3px',
                    left: config.email_enabled === 'true' ? '27px' : '3px',
                    width: '20px',
                    height: '20px',
                    background: 'white',
                    borderRadius: '50%',
                    transition: 'left 0.3s',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }} />
                </div>
              </div>
            </div>

            <div style={{ 
              padding: '20px', 
              background: config.sms_enabled === 'true' ? 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)' : '#f5f5f5',
              borderRadius: '12px',
              border: config.sms_enabled === 'true' ? '2px solid #2e7d32' : '2px solid #ddd',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }} onClick={() => handleToggle('sms_enabled')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span style={{ fontSize: '32px' }}>📱</span>
                <div>
                  <h4 style={{ margin: 0 }}>SMS Alerts</h4>
                  <p style={{ margin: '5px 0 0', color: '#666', fontSize: '14px' }}>
                    Receive SMS alerts to your phone
                  </p>
                </div>
                <div style={{ 
                  marginLeft: 'auto',
                  width: '50px',
                  height: '26px',
                  background: config.sms_enabled === 'true' ? '#2e7d32' : '#ccc',
                  borderRadius: '13px',
                  position: 'relative',
                  transition: 'background 0.3s'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '3px',
                    left: config.sms_enabled === 'true' ? '27px' : '3px',
                    width: '20px',
                    height: '20px',
                    background: 'white',
                    borderRadius: '50%',
                    transition: 'left 0.3s',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }} />
                </div>
              </div>
            </div>
          </div>

          {config.sms_enabled === 'true' && (
            <div style={{ marginTop: '20px' }}>
              <label className="form-label">Phone Number for SMS</label>
              <input
                type="tel"
                className="form-input"
                value={config.phone_number || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, phone_number: e.target.value }))}
                placeholder="+234 XXX XXX XXXX"
                style={{ maxWidth: '300px' }}
              />
            </div>
          )}
        </div>

        {/* Severity Levels */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '20px', color: '#1a5f2a' }}>⚠️ Alert Severity Levels</h3>
          <p style={{ color: '#666', marginBottom: '15px', fontSize: '14px' }}>
            Choose which severity levels trigger alerts:
          </p>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
            {[
              { key: 'alert_on_critical', label: 'Critical', color: '#d32f2f', bg: '#ffebee' },
              { key: 'alert_on_high', label: 'High', color: '#f57c00', bg: '#fff3e0' },
              { key: 'alert_on_medium', label: 'Medium', color: '#fbc02d', bg: '#fffde7' },
              { key: 'alert_on_low', label: 'Low', color: '#388e3c', bg: '#e8f5e9' }
            ].map(({ key, label, color, bg }) => (
              <div
                key={key}
                onClick={() => handleToggle(key)}
                style={{
                  padding: '12px 24px',
                  background: config[key] === 'true' ? bg : '#f5f5f5',
                  border: `2px solid ${config[key] === 'true' ? color : '#ddd'}`,
                  borderRadius: '25px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: `2px solid ${color}`,
                  background: config[key] === 'true' ? color : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {config[key] === 'true' && <span style={{ color: 'white', fontSize: '12px' }}>✓</span>}
                </div>
                <span style={{ fontWeight: '500', color: config[key] === 'true' ? color : '#666' }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* States to Monitor */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, color: '#1a5f2a' }}>🗺️ States to Monitor</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={selectAllStates}>
                Select All
              </button>
              <button type="button" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={clearAllStates}>
                Clear All
              </button>
            </div>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
            gap: '10px',
            maxHeight: '300px',
            overflowY: 'auto',
            padding: '10px',
            background: '#f8f9fa',
            borderRadius: '8px'
          }}>
            {NIGERIA_STATES.map(state => (
              <div
                key={state}
                onClick={() => handleStateToggle(state)}
                style={{
                  padding: '8px 12px',
                  background: (config.alert_states || []).includes(state) ? '#2e7d32' : 'white',
                  color: (config.alert_states || []).includes(state) ? 'white' : '#333',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  textAlign: 'center',
                  border: '1px solid #ddd',
                  transition: 'all 0.2s ease'
                }}
              >
                {state}
              </div>
            ))}
          </div>
          <p style={{ color: '#666', fontSize: '13px', marginTop: '10px' }}>
            Selected: {(config.alert_states || []).length} of {NIGERIA_STATES.length} states
          </p>
        </div>

        {/* Daily Digest */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '20px', color: '#1a5f2a' }}>📊 Daily Digest</h3>
          
          <div style={{ 
            padding: '20px', 
            background: config.daily_digest === 'true' ? 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)' : '#f5f5f5',
            borderRadius: '12px',
            border: config.daily_digest === 'true' ? '2px solid #2e7d32' : '2px solid #ddd',
            cursor: 'pointer',
            marginBottom: '15px'
          }} onClick={() => handleToggle('daily_digest')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ fontSize: '32px' }}>📅</span>
              <div>
                <h4 style={{ margin: 0 }}>Enable Daily Summary</h4>
                <p style={{ margin: '5px 0 0', color: '#666', fontSize: '14px' }}>
                  Receive a daily summary of all incidents at a scheduled time
                </p>
              </div>
              <div style={{ 
                marginLeft: 'auto',
                width: '50px',
                height: '26px',
                background: config.daily_digest === 'true' ? '#2e7d32' : '#ccc',
                borderRadius: '13px',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '3px',
                  left: config.daily_digest === 'true' ? '27px' : '3px',
                  width: '20px',
                  height: '20px',
                  background: 'white',
                  borderRadius: '50%',
                  transition: 'left 0.3s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }} />
              </div>
            </div>
          </div>

          {config.daily_digest === 'true' && (
            <div>
              <label className="form-label">Digest Time</label>
              <input
                type="time"
                className="form-input"
                value={config.digest_time || '08:00'}
                onChange={(e) => setConfig(prev => ({ ...prev, digest_time: e.target.value }))}
                style={{ maxWidth: '150px' }}
              />
            </div>
          )}
        </div>

        {/* Save Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
          <button type="button" className="btn btn-secondary" onClick={fetchConfig}>
            Reset
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default AlertConfig
