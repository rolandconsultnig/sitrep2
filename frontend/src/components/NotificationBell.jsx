import React, { useState, useEffect, useRef } from 'react'

function NotificationBell({ user }) {
  const [notifications, setNotifications] = useState([])
  const [showPanel, setShowPanel] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const panelRef = useRef(null)
  const wsRef = useRef(null)

  useEffect(() => {
    // Connect to WebSocket for real-time notifications
    const token = localStorage.getItem('token')
    if (!token) return

    const wsUrl = import.meta.env.VITE_API_URL 
      ? import.meta.env.VITE_API_URL.replace('https://', 'wss://').replace('http://', 'ws://') + '/ws'
      : `ws://localhost:8000/ws`

    try {
      wsRef.current = new WebSocket(`${wsUrl}?token=${token}`)
      
      wsRef.current.onopen = () => {
        console.log('WebSocket connected for notifications')
      }

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          if (data.type === 'new_submission' || data.type === 'red_alert') {
            const newNotification = {
              id: Date.now(),
              type: data.type,
              message: data.type === 'red_alert' 
                ? `🚨 RED ALERT: ${data.data?.threat || 'Critical incident'} in ${data.data?.state || 'Unknown'}`
                : `📝 New submission: ${data.data?.threat || 'Incident'} in ${data.data?.state || 'Unknown'}`,
              timestamp: new Date().toISOString(),
              read: false,
              data: data.data
            }
            
            setNotifications(prev => [newNotification, ...prev].slice(0, 50))
            setUnreadCount(prev => prev + 1)
            
            // Play sound for RED alerts
            if (data.type === 'red_alert') {
              playAlertSound()
            }
          }
        } catch (e) {
          console.error('Error parsing WebSocket message:', e)
        }
      }

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error)
      }

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected')
      }
    } catch (e) {
      console.error('WebSocket connection failed:', e)
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setShowPanel(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const playAlertSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 800
      oscillator.type = 'sine'
      gainNode.gain.value = 0.3
      
      oscillator.start()
      setTimeout(() => {
        oscillator.stop()
        audioContext.close()
      }, 200)
    } catch (e) {
      // Audio not supported
    }
  }

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  const clearAll = () => {
    setNotifications([])
    setUnreadCount(0)
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date
    
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return date.toLocaleDateString()
  }

  return (
    <div style={{ position: 'relative' }} ref={panelRef}>
      {/* Bell Icon */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        style={{
          background: 'rgba(255,255,255,0.1)',
          border: 'none',
          borderRadius: '8px',
          padding: '10px 14px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: 'white',
          fontSize: '18px',
          position: 'relative',
          transition: 'all 0.3s ease'
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            background: '#dc3545',
            color: 'white',
            fontSize: '11px',
            fontWeight: '700',
            padding: '2px 6px',
            borderRadius: '10px',
            minWidth: '18px',
            textAlign: 'center',
            animation: 'pulse 2s infinite'
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {showPanel && (
        <div style={{
          position: 'absolute',
          top: '50px',
          right: '0',
          width: '380px',
          maxHeight: '500px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          zIndex: 1001,
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            padding: '15px 20px',
            background: 'linear-gradient(135deg, #004d00 0%, #008000 100%)',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>🔔 Notifications</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    color: 'white',
                    padding: '5px 10px',
                    borderRadius: '5px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    color: 'white',
                    padding: '5px 10px',
                    borderRadius: '5px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: '#666'
              }}>
                <div style={{ fontSize: '40px', marginBottom: '10px' }}>🔕</div>
                <p>No notifications yet</p>
                <p style={{ fontSize: '12px', color: '#999' }}>
                  Real-time alerts will appear here
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  style={{
                    padding: '15px 20px',
                    borderBottom: '1px solid #eee',
                    background: notification.read ? 'white' : '#f0fff0',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onClick={() => {
                    setNotifications(prev => 
                      prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
                    )
                    if (!notification.read) {
                      setUnreadCount(prev => Math.max(0, prev - 1))
                    }
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '5px'
                  }}>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: notification.read ? '400' : '600',
                      color: notification.type === 'red_alert' ? '#dc3545' : '#333'
                    }}>
                      {notification.message}
                    </span>
                    {!notification.read && (
                      <span style={{
                        width: '8px',
                        height: '8px',
                        background: '#008000',
                        borderRadius: '50%',
                        flexShrink: 0,
                        marginLeft: '10px',
                        marginTop: '5px'
                      }} />
                    )}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#999'
                  }}>
                    {formatTime(notification.timestamp)}
                    {notification.data?.severity && (
                      <span style={{
                        marginLeft: '10px',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontSize: '10px',
                        fontWeight: '600',
                        background: notification.data.severity === 'Critical' ? '#dc3545' :
                                   notification.data.severity === 'High' ? '#ff9800' : '#4caf50',
                        color: 'white'
                      }}>
                        {notification.data.severity}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell
