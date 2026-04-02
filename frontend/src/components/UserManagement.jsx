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

function UserManagement({ user }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    rank: '',
    service_number: '',
    state: '',
    lga: '',
    department: '',
    phone_number: '',
    role: 'officer'
  })
  const [filters, setFilters] = useState({
    state: '',
    rank: '',
    is_active: 'true'
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [filters])

  const fetchUsers = async () => {
    try {
      const params = {}
      if (filters.state) params.state = filters.state
      if (filters.rank) params.rank = filters.rank
      if (filters.is_active) params.is_active = filters.is_active

      const response = await axios.get('/api/users', { params })
      setUsers(response.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      if (editingUser) {
        // Update user
        const updateData = { ...formData }
        delete updateData.password
        delete updateData.username
        delete updateData.service_number

        await axios.put(`/api/users/${editingUser.id}`, updateData)
        setSuccess('User updated successfully!')
      } else {
        // Create user
        await axios.post('/api/users/register', formData)
        setSuccess('User created successfully!')
      }

      setShowForm(false)
      setEditingUser(null)
      setFormData({
        username: '',
        email: '',
        password: '',
        full_name: '',
        rank: '',
        service_number: '',
        state: '',
        lga: '',
        department: '',
        phone_number: '',
        role: 'officer'
      })
      fetchUsers()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save user')
    }
  }

  const handleEdit = (userToEdit) => {
    setEditingUser(userToEdit)
    setFormData({
      username: userToEdit.username,
      email: userToEdit.email,
      password: '',
      full_name: userToEdit.full_name,
      rank: userToEdit.rank,
      service_number: userToEdit.service_number,
      state: userToEdit.state,
      lga: userToEdit.lga || '',
      department: userToEdit.department || '',
      phone_number: userToEdit.phone_number || '',
      role: userToEdit.role
    })
    setShowForm(true)
  }

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to deactivate this user?')) {
      return
    }

    try {
      await axios.delete(`/api/users/${userId}`)
      setSuccess('User deactivated successfully!')
      fetchUsers()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to deactivate user')
    }
  }

  const handleActivate = async (userId) => {
    try {
      await axios.put(`/api/users/${userId}/activate`)
      setSuccess('User activated successfully!')
      fetchUsers()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to activate user')
    }
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

  if (loading) {
    return <div className="loading">Loading users...</div>
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>User Management</h1>
        {user?.permissions?.create_users && (
          <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setEditingUser(null) }}>
            {showForm ? 'Cancel' : 'New User'}
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Filters */}
      <div className="card">
        <h3>Filters</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>State</label>
            <select
              value={filters.state}
              onChange={(e) => setFilters({ ...filters, state: e.target.value })}
            >
              <option value="">All States</option>
              {NIGERIA_STATES.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Rank</label>
            <select
              value={filters.rank}
              onChange={(e) => setFilters({ ...filters, rank: e.target.value })}
            >
              <option value="">All Ranks</option>
              {POLICE_RANKS.map(rank => (
                <option key={rank} value={rank}>{rank}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Status</label>
            <select
              value={filters.is_active}
              onChange={(e) => setFilters({ ...filters, is_active: e.target.value })}
            >
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* User Form */}
      {showForm && (
        <div className="card">
          <h2>{editingUser ? 'Edit User' : 'Create New User'}</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group">
                <label>Username *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  disabled={!!editingUser}
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

              {!editingUser && (
                <div className="form-group">
                  <label>Password *</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!editingUser}
                  />
                </div>
              )}

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
                <label>Rank *</label>
                <select
                  value={formData.rank}
                  onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
                  required
                >
                  <option value="">Select Rank</option>
                  {POLICE_RANKS.map(rank => (
                    <option key={rank} value={rank}>{rank}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Service Number *</label>
                <input
                  type="text"
                  value={formData.service_number}
                  onChange={(e) => setFormData({ ...formData, service_number: e.target.value })}
                  required
                  disabled={!!editingUser}
                />
              </div>

              <div className="form-group">
                <label>State *</label>
                <select
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  required
                >
                  <option value="">Select State</option>
                  {NIGERIA_STATES.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
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

            <button type="submit" className="btn btn-primary">
              {editingUser ? 'Update User' : 'Create User'}
            </button>
          </form>
        </div>
      )}

      {/* Users List */}
      <div className="card">
        <h2>Users ({users.length})</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Service #</th>
              <th>Name</th>
              <th>Rank</th>
              <th>State</th>
              <th>Department</th>
              <th>Status</th>
              <th>Last Login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.service_number}</td>
                <td>{u.full_name}</td>
                <td>
                  <span 
                    className="badge" 
                    style={{ 
                      backgroundColor: getRankBadgeColor(u.rank),
                      color: 'white'
                    }}
                  >
                    {u.rank}
                  </span>
                </td>
                <td>{u.state}</td>
                <td>{u.department || 'N/A'}</td>
                <td>
                  <span className={`badge ${u.is_active === 'true' ? 'badge-green' : 'badge-amber'}`}>
                    {u.is_active === 'true' ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  {u.last_login ? format(new Date(u.last_login), 'MMM dd, yyyy HH:mm') : 'Never'}
                </td>
                <td>
                  {user?.permissions?.modify_users && (
                    <>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '5px 10px', fontSize: '12px', marginRight: '5px' }}
                        onClick={() => handleEdit(u)}
                      >
                        Edit
                      </button>
                      {u.is_active === 'true' ? (
                        <button 
                          className="btn btn-danger" 
                          style={{ padding: '5px 10px', fontSize: '12px' }}
                          onClick={() => handleDelete(u.id)}
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button 
                          className="btn btn-success" 
                          style={{ padding: '5px 10px', fontSize: '12px' }}
                          onClick={() => handleActivate(u.id)}
                        >
                          Activate
                        </button>
                      )}
                    </>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', color: '#666' }}>
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default UserManagement
