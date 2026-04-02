import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import Submissions from './components/Submissions'
import Reports from './components/Reports'
import Config from './components/Config'
import RealtimeDashboard from './components/RealtimeDashboard'
import UserManagement from './components/UserManagement'
import Profile from './components/Profile'
import AuditLogs from './components/AuditLogs'
import ErrorBoundary from './components/ErrorBoundary'
import NotificationBell from './components/NotificationBell'
import AlertConfig from './components/AlertConfig'
import ThemeToggle from './components/ThemeToggle'
import { ThemeProvider } from './context/ThemeContext'
import './index.css'

// Configure axios base URL - use environment variable in production, proxy in development
axios.defaults.baseURL = import.meta.env.VITE_API_URL || ''

// Add token to requests
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Handle 401 errors
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

function Navbar({ user, onLogout }) {
  return (
    <div className="navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <img src="/npf-logo.jpg" alt="NPF Logo" style={{ width: '90px', height: '90px', objectFit: 'contain' }} />
        <h1 style={{ margin: 0 }}>NPF Smart SITREP</h1>
      </div>
      <nav>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/realtime-dashboard">Real-Time</Link>
        <Link to="/submissions">Submissions</Link>
        <Link to="/reports">Reports</Link>
        {user?.permissions?.create_users && <Link to="/users">Users</Link>}
        {user?.role === 'admin' && <Link to="/audit-logs">Audit Logs</Link>}
        {user?.role === 'admin' && <Link to="/config">Config</Link>}
        <Link to="/alerts">Alerts</Link>
        <NotificationBell user={user} />
        <ThemeToggle />
        <span style={{ marginLeft: '15px', padding: '8px 12px', background: '#e3f2fd', borderRadius: '8px', color: '#1976d2', fontWeight: '500' }}>
          {user?.full_name} ({user?.rank || 'N/A'}) - {user?.state}
        </span>
        <Link to="/profile" style={{ marginLeft: '10px' }}>Profile</Link>
        <button className="btn btn-secondary" onClick={onLogout} style={{ marginLeft: '10px' }}>
          Logout
        </button>
      </nav>
    </div>
  )
}

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" />
}

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      fetchUser()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUser = async () => {
    try {
      const response = await axios.get('/api/users/me')
      setUser(response.data)
    } catch (error) {
      localStorage.removeItem('token')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await axios.post('/api/logout')
    } catch (err) {
      // Continue with logout even if API call fails
    }
    localStorage.removeItem('token')
    setUser(null)
    window.location.href = '/login'
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <ThemeProvider>
    <ErrorBoundary>
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to="/dashboard" />
            ) : (
              <Login onLogin={fetchUser} />
            )
          }
        />
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <Navbar user={user} onLogout={handleLogout} />
              <Routes>
                <Route path="/dashboard" element={<Dashboard user={user} />} />
                <Route path="/realtime-dashboard" element={<RealtimeDashboard user={user} />} />
                <Route path="/submissions" element={<Submissions user={user} />} />
                <Route path="/reports" element={<Reports user={user} />} />
                <Route path="/users" element={<UserManagement user={user} />} />
                <Route path="/audit-logs" element={<AuditLogs user={user} />} />
                <Route path="/profile" element={<Profile user={user} onUpdate={fetchUser} />} />
                <Route path="/config" element={<Config user={user} />} />
                <Route path="/alerts" element={<AlertConfig user={user} />} />
                <Route path="/" element={<Navigate to="/dashboard" />} />
              </Routes>
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
    </ErrorBoundary>
    </ThemeProvider>
  )
}

export default App
