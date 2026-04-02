import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const params = new URLSearchParams()
      params.append('username', username)
      params.append('password', password)

      const response = await axios.post('/token', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })

      localStorage.setItem('token', response.data.access_token)
      await onLogin()
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const features = [
    { icon: '📊', title: 'Real-Time Analytics', desc: 'Monitor security incidents across all 36 states with live dashboards' },
    { icon: '🚨', title: 'Threat Intelligence', desc: 'AI-powered risk assessment and predictive hotspot analysis' },
    { icon: '📝', title: 'SITREP Generation', desc: 'Automated daily, weekly, monthly, and annual situation reports' },
    { icon: '🗺️', title: 'Geospatial Mapping', desc: 'Interactive maps showing incident locations and threat patterns' },
    { icon: '🔔', title: 'Alert System', desc: 'Real-time notifications for RED alerts and critical incidents' },
    { icon: '📈', title: 'Performance Metrics', desc: 'Track response times, resolution rates, and operational efficiency' },
  ]

  return (
    <div style={{ 
      minHeight: '100vh',
      background: '#ffffff'
    }}>
      {/* Header */}
      <header style={{
        padding: '15px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '3px solid #006400',
        background: 'white',
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <img 
            src="/npf-logo.jpg" 
            alt="NPF Logo" 
            style={{
              width: '120px',
              height: '120px',
              objectFit: 'contain',
              borderRadius: '8px'
            }}
          />
          <div>
            <h1 style={{ color: '#006400', margin: 0, fontSize: '24px', fontWeight: '700' }}>NPF Smart SITREP</h1>
            <p style={{ color: '#666', margin: 0, fontSize: '12px' }}>Nigeria Police Force Intelligence System</p>
          </div>
        </div>
        <div style={{ 
          color: '#0d47a1', 
          fontSize: '14px',
          background: '#e3f2fd',
          padding: '10px 20px',
          borderRadius: '8px',
          border: '1px solid #90caf9',
          fontWeight: '500'
        }}>
          🔒 Secure Government Portal
        </div>
      </header>

      {/* Main Content */}
      <div style={{ 
        display: 'flex', 
        minHeight: 'calc(100vh - 91px)',
        padding: '40px'
      }}>
        {/* Left Side - Info */}
        <div style={{ flex: 1, paddingRight: '60px', color: '#333' }}>
          <div style={{ maxWidth: '600px' }}>
            <h2 style={{ 
              fontSize: '42px', 
              fontWeight: '700', 
              marginBottom: '20px',
              lineHeight: '1.2'
            }}>
              Situational Intelligence<br />
              <span style={{ color: '#2e7d32' }}>Reporting System</span>
            </h2>
            
            <p style={{ 
              fontSize: '18px', 
              color: '#666', 
              marginBottom: '40px',
              lineHeight: '1.6'
            }}>
              A comprehensive digital platform for the Nigeria Police Force to collect, analyze, 
              and report security incidents nationwide. Empowering data-driven decision making 
              for enhanced public safety.
            </p>

            {/* Stats */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: '20px',
              marginBottom: '40px'
            }}>
              <div style={{ 
                background: 'white', 
                padding: '20px', 
                borderRadius: '12px',
                textAlign: 'center',
                boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                borderTop: '4px solid #006400'
              }}>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#006400' }}>36+</div>
                <div style={{ fontSize: '14px', color: '#666' }}>States Covered</div>
              </div>
              <div style={{ 
                background: 'white', 
                padding: '20px', 
                borderRadius: '12px',
                textAlign: 'center',
                boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                borderTop: '4px solid #ffc107'
              }}>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#d4a000' }}>24/7</div>
                <div style={{ fontSize: '14px', color: '#666' }}>Real-Time Monitoring</div>
              </div>
              <div style={{ 
                background: 'white', 
                padding: '20px', 
                borderRadius: '12px',
                textAlign: 'center',
                boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                borderTop: '4px solid #1976d2'
              }}>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#1976d2' }}>AI</div>
                <div style={{ fontSize: '14px', color: '#666' }}>Powered Analytics</div>
              </div>
            </div>

            {/* Features Grid */}
            <h3 style={{ fontSize: '18px', marginBottom: '20px', color: '#1a5f2a' }}>
              Key Capabilities
            </h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)', 
              gap: '15px' 
            }}>
              {features.map((feature, index) => (
                <div key={index} style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: '12px',
                  padding: '15px',
                  background: 'white',
                  borderRadius: '10px',
                  border: '1px solid #e0e0e0',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}>
                  <span style={{ fontSize: '28px' }}>{feature.icon}</span>
                  <div>
                    <div style={{ fontWeight: '600', marginBottom: '4px', color: '#1a5f2a' }}>{feature.title}</div>
                    <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.4' }}>
                      {feature.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div style={{ 
          width: '420px',
          display: 'flex',
          alignItems: 'center'
        }}>
          <div style={{ 
            background: 'white', 
            borderRadius: '20px', 
            padding: '40px',
            width: '100%',
            boxShadow: '0 25px 50px rgba(0,0,0,0.3)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <img 
                src="/npf-logo.jpg" 
                alt="NPF Logo" 
                style={{
                  width: '180px',
                  height: '180px',
                  objectFit: 'contain',
                  margin: '0 auto 15px',
                  display: 'block'
                }}
              />
              <h2 style={{ margin: '0 0 5px', color: '#006400', fontSize: '24px', fontWeight: '700' }}>
                Officer Login
              </h2>
              <p style={{ margin: 0, color: '#1976d2', fontSize: '14px' }}>
                Access your SITREP dashboard
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              {error && (
                <div style={{
                  background: '#fff5f5',
                  border: '1px solid #fc8181',
                  color: '#c53030',
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  fontSize: '14px'
                }}>
                  {error}
                </div>
              )}
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: '600',
                  color: '#004d00',
                  fontSize: '14px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Username / Service Number
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="Enter your username"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '2px solid #90EE90',
                    borderRadius: '10px',
                    fontSize: '15px',
                    transition: 'all 0.3s ease',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '25px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: '600',
                  color: '#004d00',
                  fontSize: '14px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '2px solid #90EE90',
                    borderRadius: '10px',
                    fontSize: '15px',
                    transition: 'all 0.3s ease',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: loading ? '#a0aec0' : 'linear-gradient(135deg, #006400 0%, #008000 50%, #228B22 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  boxShadow: '0 4px 20px rgba(0, 100, 0, 0.3)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>

            <div style={{ 
              marginTop: '25px', 
              paddingTop: '20px', 
              borderTop: '2px solid #E8F5E9',
              textAlign: 'center'
            }}>
              <p style={{ color: '#228B22', fontSize: '13px', margin: 0 }}>
                🔐 Secure authentication with encrypted credentials
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{
        padding: '15px 40px',
        borderTop: '3px solid #006400',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: '#666',
        fontSize: '13px',
        background: 'white'
      }}>
        <div>© 2026 Nigeria Police Force. All rights reserved.</div>
        <div style={{ display: 'flex', gap: '20px' }}>
          <span style={{ cursor: 'pointer' }}>Privacy Policy</span>
          <span style={{ cursor: 'pointer' }}>Terms of Service</span>
          <span style={{ cursor: 'pointer' }}>Contact Support</span>
        </div>
      </footer>
    </div>
  )
}

export default Login
