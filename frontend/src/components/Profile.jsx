import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { format } from 'date-fns'

const POLICE_RANKS = [
  "IGP", "DIG", "AIG", "CP", "DCP", "ACP", "CSP", "SP", "DSP", "ASP"
]

const NIGERIA_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa",
  "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo",
  "Ekiti", "Enugu", "FCT", "Gombe", "Imo", "Jigawa",
  "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara",
  "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun",
  "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"
]

function Profile({ user, onUpdate }) {
  const [profile, setProfile] = useState(null)
  const [editing, setEditing] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [formData, setFormData] = useState({})
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await axios.get('/api/users/me')
      setProfile(response.data)
      setFormData({
        full_name: response.data.full_name,
        email: response.data.email,
        lga: response.data.lga || '',
        department: response.data.department || '',
        phone_number: response.data.phone_number || ''
      })
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load profile')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      await axios.put(`/api/users/${profile.id}`, formData)
      setSuccess('Profile updated successfully!')
      setEditing(false)
      fetchProfile()
      if (onUpdate) onUpdate()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update profile')
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (passwordData.new_password !== passwordData.confirm_password) {
      setError('New passwords do not match')
      return
    }

    if (passwordData.new_password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    try {
      await axios.put('/api/users/me/password', null, {
        params: {
          current_password: passwordData.current_password,
          new_password: passwordData.new_password
        }
      })
      setSuccess('Password changed successfully!')
      setChangingPassword(false)
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' })
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to change password')
    }
  }

  if (!profile) {
    return <div className="loading">Loading profile...</div>
  }

  const getRankBadgeColor = (rank) => {
    const colors = {
      'IGP': '#8B0000',
      'DIG': '#A52A2A',
      'AIG': '#DC143C',
      'CP': '#FF4500',
      'DCP': '#FF6347',
      'ACP': '#FF8C00',
      'CSP': '#FFA500',
      'SP': '#FFD700',
      'DSP': '#ADFF2F',
      'ASP': '#90EE90'
    }
    return colors[rank] || '#666'
  }

  return (
    <div className="container">
      <h1 style={{ marginBottom: '30px' }}>My Profile</h1>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Profile Information</h2>
          {!editing && !changingPassword && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-primary" onClick={() => setEditing(true)}>
                Edit Profile
              </button>
              <button className="btn btn-secondary" onClick={() => setChangingPassword(true)}>
                Change Password
              </button>
            </div>
          )}
        </div>

        {!editing ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <strong>Service Number:</strong>
              <div style={{ marginTop: '5px', fontSize: '18px' }}>{profile.service_number}</div>
            </div>
            <div>
              <strong>Rank:</strong>
              <div style={{ marginTop: '5px' }}>
                <span 
                  className="badge" 
                  style={{ 
                    backgroundColor: getRankBadgeColor(profile.rank),
                    color: 'white',
                    fontSize: '16px',
                    padding: '8px 15px'
                  }}
                >
                  {profile.rank}
                </span>
              </div>
            </div>
            <div>
              <strong>Full Name:</strong>
              <div style={{ marginTop: '5px' }}>{profile.full_name}</div>
            </div>
            <div>
              <strong>Email:</strong>
              <div style={{ marginTop: '5px' }}>{profile.email}</div>
            </div>
            <div>
              <strong>State:</strong>
              <div style={{ marginTop: '5px' }}>{profile.state}</div>
            </div>
            <div>
              <strong>LGA:</strong>
              <div style={{ marginTop: '5px' }}>{profile.lga || 'Not specified'}</div>
            </div>
            <div>
              <strong>Department:</strong>
              <div style={{ marginTop: '5px' }}>{profile.department || 'Not specified'}</div>
            </div>
            <div>
              <strong>Phone Number:</strong>
              <div style={{ marginTop: '5px' }}>{profile.phone_number || 'Not specified'}</div>
            </div>
            <div>
              <strong>Role:</strong>
              <div style={{ marginTop: '5px' }}>
                <span className="badge badge-amber">{profile.role}</span>
              </div>
            </div>
            <div>
              <strong>Status:</strong>
              <div style={{ marginTop: '5px' }}>
                <span className={`badge ${profile.is_active === 'true' ? 'badge-green' : 'badge-amber'}`}>
                  {profile.is_active === 'true' ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <div>
              <strong>Last Login:</strong>
              <div style={{ marginTop: '5px' }}>
                {profile.last_login ? format(new Date(profile.last_login), 'MMM dd, yyyy HH:mm') : 'Never'}
              </div>
            </div>
            <div>
              <strong>Member Since:</strong>
              <div style={{ marginTop: '5px' }}>
                {format(new Date(profile.created_at), 'MMM dd, yyyy')}
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group">
                <label>Service Number</label>
                <input type="text" value={profile.service_number} disabled />
                <small style={{ color: '#666' }}>Cannot be changed</small>
              </div>
              <div className="form-group">
                <label>Rank</label>
                <input type="text" value={profile.rank} disabled />
                <small style={{ color: '#666' }}>Cannot be changed</small>
              </div>
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>State</label>
                <input type="text" value={profile.state} disabled />
                <small style={{ color: '#666' }}>Cannot be changed</small>
              </div>
              <div className="form-group">
                <label>LGA</label>
                <input
                  type="text"
                  value={formData.lga}
                  onChange={(e) => setFormData({ ...formData, lga: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Department</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="text"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button type="submit" className="btn btn-primary">
                Save Changes
              </button>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => {
                  setEditing(false)
                  setFormData({
                    full_name: profile.full_name,
                    email: profile.email,
                    lga: profile.lga || '',
                    department: profile.department || '',
                    phone_number: profile.phone_number || ''
                  })
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Password Change Form */}
      {changingPassword && (
        <div className="card">
          <h2>Change Password</h2>
          <form onSubmit={handlePasswordChange}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px', maxWidth: '400px' }}>
              <div className="form-group">
                <label>Current Password *</label>
                <input
                  type="password"
                  value={passwordData.current_password}
                  onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>New Password *</label>
                <input
                  type="password"
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                  required
                  minLength={8}
                />
                <small style={{ color: '#666' }}>Minimum 8 characters</small>
              </div>
              <div className="form-group">
                <label>Confirm New Password *</label>
                <input
                  type="password"
                  value={passwordData.confirm_password}
                  onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                  required
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button type="submit" className="btn btn-primary">
                Change Password
              </button>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => {
                  setChangingPassword(false)
                  setPasswordData({ current_password: '', new_password: '', confirm_password: '' })
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Permissions Display */}
      {profile.permissions && (
        <div className="card">
          <h2>Your Permissions</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
            {Object.entries(profile.permissions).map(([key, value]) => (
              <div key={key} style={{ 
                padding: '10px', 
                border: '1px solid #ddd', 
                borderRadius: '5px',
                backgroundColor: value ? '#d4edda' : '#f8d7da'
              }}>
                <strong>{key.replace(/_/g, ' ').toUpperCase()}</strong>
                <div style={{ marginTop: '5px' }}>
                  <span className={`badge ${value ? 'badge-green' : 'badge-amber'}`}>
                    {value ? 'Allowed' : 'Restricted'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Profile
