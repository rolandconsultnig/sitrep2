import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { format } from 'date-fns'
import MapView from './MapView'

const NIGERIA_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa",
  "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo",
  "Ekiti", "Enugu", "FCT", "Gombe", "Imo", "Jigawa",
  "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara",
  "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun",
  "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"
]

const THREAT_TYPES = [
  "Kidnapping", "Armed Robbery", "Banditry", "Terrorism", "Cultism",
  "Rape / Sexual Violence", "Cybercrime", "Homicide", "Drug trafficking",
  "Human trafficking"
]

const SEVERITY_LEVELS = ["Low", "Medium", "High", "Critical"]
const TREND_OPTIONS = ["Increasing", "Stable", "Decreasing"]
const RELIABILITY_LEVELS = ["A", "B", "C", "D", "E", "F"]
const CREDIBILITY_LEVELS = ["1", "2", "3", "4", "5", "6"]

function Submissions({ user }) {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingSubmission, setEditingSubmission] = useState(null)
  const [selectedSubmission, setSelectedSubmission] = useState(null)
  const [formData, setFormData] = useState({
    report_date: new Date().toISOString().slice(0, 16),
    state: user?.state || '',
    lga_or_address: '',
    threat_domain: '',
    severity: '',
    trend: '',
    source_reliability: '',
    source_credibility: '',
    other_agency: '',
    narrative: ''
  })
  const [filters, setFilters] = useState({
    search: '',
    threat_domain: '',
    severity: '',
    start_date: '',
    end_date: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [uploadFile, setUploadFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [attachmentFile, setAttachmentFile] = useState(null)
  const [attachments, setAttachments] = useState([])
  const [uploadingAttachment, setUploadingAttachment] = useState(false)

  useEffect(() => {
    fetchSubmissions()
  }, [filters])

  const fetchSubmissions = async () => {
    try {
      const params = {}
      if (filters.search) params.search = filters.search
      if (filters.threat_domain) params.threat_domain = filters.threat_domain
      if (filters.severity) params.severity = filters.severity
      if (filters.start_date) params.start_date = new Date(filters.start_date).toISOString()
      if (filters.end_date) params.end_date = new Date(filters.end_date).toISOString()
      
      const response = await axios.get('/api/submissions', { params })
      setSubmissions(response.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load submissions')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      report_date: new Date().toISOString().slice(0, 16),
      state: user?.state || '',
      lga_or_address: '',
      threat_domain: '',
      severity: '',
      trend: '',
      source_reliability: '',
      source_credibility: '',
      other_agency: '',
      narrative: ''
    })
    setEditingSubmission(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      if (editingSubmission) {
        await axios.put(`/api/submissions/${editingSubmission.id}`, formData)
        setSuccess('Submission updated successfully!')
      } else {
        await axios.post('/api/submissions', formData)
        setSuccess('Submission created successfully!')
      }
      setShowForm(false)
      resetForm()
      fetchSubmissions()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save submission')
    }
  }

  const handleEdit = (submission) => {
    setEditingSubmission(submission)
    setFormData({
      report_date: submission.report_date ? format(new Date(submission.report_date), "yyyy-MM-dd'T'HH:mm") : '',
      state: submission.state,
      lga_or_address: submission.lga_or_address,
      threat_domain: submission.threat_domain,
      severity: submission.severity,
      trend: submission.trend || '',
      source_reliability: submission.source_reliability || '',
      source_credibility: submission.source_credibility || '',
      other_agency: submission.other_agency || '',
      narrative: submission.narrative
    })
    setShowForm(true)
  }

  const handleDelete = async (submissionId) => {
    if (!window.confirm('Are you sure you want to delete this submission?')) {
      return
    }
    try {
      await axios.delete(`/api/submissions/${submissionId}`)
      setSuccess('Submission deleted successfully!')
      fetchSubmissions()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete submission')
    }
  }

  const handleExport = async () => {
    try {
      const response = await axios.get('/api/export/submissions', {
        responseType: 'blob',
        params: {
          start_date: filters.start_date ? new Date(filters.start_date).toISOString() : undefined,
          end_date: filters.end_date ? new Date(filters.end_date).toISOString() : undefined
        }
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `submissions_${format(new Date(), 'yyyyMMdd')}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to export submissions')
    }
  }

  const handleFileUpload = async (e) => {
    e.preventDefault()
    if (!uploadFile) {
      setError('Please select a file to upload')
      return
    }

    setUploading(true)
    setError('')
    setSuccess('')

    try {
      const formData = new FormData()
      formData.append('file', uploadFile)

      const response = await axios.post('/api/submissions/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      setSuccess(`${response.data.message}`)
      if (response.data.errors && response.data.errors.length > 0) {
        setError(`Some rows had errors: ${response.data.errors.slice(0, 3).join('; ')}`)
      }
      setUploadFile(null)
      fetchSubmissions()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  const fetchAttachments = async (submissionId) => {
    try {
      const response = await axios.get(`/api/submissions/${submissionId}/attachments`)
      setAttachments(response.data)
    } catch (err) {
      setAttachments([])
    }
  }

  const handleAttachmentUpload = async (submissionId) => {
    if (!attachmentFile) {
      setError('Please select a file to attach')
      return
    }

    setUploadingAttachment(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', attachmentFile)

      await axios.post(`/api/submissions/${submissionId}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      setSuccess('File attached successfully')
      setAttachmentFile(null)
      fetchAttachments(submissionId)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to attach file')
    } finally {
      setUploadingAttachment(false)
    }
  }

  const downloadAttachment = async (submissionId, index, filename) => {
    try {
      const response = await axios.get(`/api/submissions/${submissionId}/attachments/${index}`, {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      setError('Failed to download attachment')
    }
  }

  if (loading) {
    return <div className="loading">Loading submissions...</div>
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Incident Submissions</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          {user?.permissions?.export_data && (
            <button className="btn btn-secondary" onClick={handleExport}>
              Export Excel
            </button>
          )}
          <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); resetForm() }}>
            {showForm ? 'Cancel' : 'New Submission'}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* File Upload Section */}
      <div className="card" style={{ marginBottom: '20px', backgroundColor: '#f8fafc' }}>
        <h3 style={{ marginBottom: '15px' }}>📤 Bulk Upload Submissions</h3>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
          Upload an Excel file (.xlsx) with multiple submissions. The file should have columns: 
          Report_Date, State, LGA_or_Address, Threat_Domain, Severity, Trend, Source_Reliability, Source_Credibility, Other_Agency, Narrative
        </p>
        <form onSubmit={handleFileUpload} style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setUploadFile(e.target.files[0])}
            style={{ 
              padding: '10px', 
              border: '2px dashed #ccc', 
              borderRadius: '8px',
              backgroundColor: 'white',
              cursor: 'pointer',
              flex: '1',
              minWidth: '250px'
            }}
          />
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={uploading || !uploadFile}
            style={{ minWidth: '150px' }}
          >
            {uploading ? 'Uploading...' : 'Upload File'}
          </button>
          {uploadFile && (
            <span style={{ fontSize: '14px', color: '#666' }}>
              Selected: {uploadFile.name}
            </span>
          )}
        </form>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h3>Search & Filter</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Search</label>
            <input
              type="text"
              placeholder="Search narrative, address..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Threat Type</label>
            <select
              value={filters.threat_domain}
              onChange={(e) => setFilters({ ...filters, threat_domain: e.target.value })}
            >
              <option value="">All Threats</option>
              {THREAT_TYPES.map(threat => (
                <option key={threat} value={threat}>{threat}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Severity</label>
            <select
              value={filters.severity}
              onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
            >
              <option value="">All Severities</option>
              {SEVERITY_LEVELS.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
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
        </div>
      </div>

      {submissions.length > 0 && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '12px' }}>Incident map & narratives</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary, #666)', marginBottom: '12px' }}>
            Each marker is one incident (placed by state, offset when multiple share a state). Click a pin for threat,
            severity, and full narrative.
          </p>
          <MapView data={submissions} title="" type="submissions" />
        </div>
      )}

      {showForm && (
        <div className="card">
          <h2>{editingSubmission ? 'Edit Submission' : 'New Incident Submission'}</h2>
          
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group">
                <label>Report Date *</label>
                <input
                  type="datetime-local"
                  value={formData.report_date}
                  onChange={(e) => setFormData({ ...formData, report_date: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>State *</label>
                <select
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  required
                  disabled={user?.role !== 'admin'}
                >
                  <option value="">Select State</option>
                  {NIGERIA_STATES.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>LGA or Address *</label>
                <input
                  type="text"
                  value={formData.lga_or_address}
                  onChange={(e) => setFormData({ ...formData, lga_or_address: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Threat Domain *</label>
                <select
                  value={formData.threat_domain}
                  onChange={(e) => setFormData({ ...formData, threat_domain: e.target.value })}
                  required
                >
                  <option value="">Select Threat</option>
                  {THREAT_TYPES.map(threat => (
                    <option key={threat} value={threat}>{threat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Severity *</label>
                <select
                  value={formData.severity}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                  required
                >
                  <option value="">Select Severity</option>
                  {SEVERITY_LEVELS.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Trend</label>
                <select
                  value={formData.trend}
                  onChange={(e) => setFormData({ ...formData, trend: e.target.value })}
                >
                  <option value="">Select Trend</option>
                  {TREND_OPTIONS.map(trend => (
                    <option key={trend} value={trend}>{trend}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Source Reliability</label>
                <select
                  value={formData.source_reliability}
                  onChange={(e) => setFormData({ ...formData, source_reliability: e.target.value })}
                >
                  <option value="">Select Reliability</option>
                  {RELIABILITY_LEVELS.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Source Credibility</label>
                <select
                  value={formData.source_credibility}
                  onChange={(e) => setFormData({ ...formData, source_credibility: e.target.value })}
                >
                  <option value="">Select Credibility</option>
                  {CREDIBILITY_LEVELS.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Other Agency</label>
                <input
                  type="text"
                  value={formData.other_agency}
                  onChange={(e) => setFormData({ ...formData, other_agency: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Narrative *</label>
                <textarea
                  value={formData.narrative}
                  onChange={(e) => setFormData({ ...formData, narrative: e.target.value })}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary">
              {editingSubmission ? 'Update Submission' : 'Submit'}
            </button>
          </form>
        </div>
      )}

      {/* Detail Modal */}
      {selectedSubmission && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }} onClick={() => setSelectedSubmission(null)}>
          <div className="card" style={{ maxWidth: '700px', maxHeight: '80vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Submission Details</h2>
              <button className="btn btn-secondary" onClick={() => setSelectedSubmission(null)}>Close</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '20px' }}>
              <div><strong>ID:</strong> {selectedSubmission.submission_id}</div>
              <div><strong>Date:</strong> {format(new Date(selectedSubmission.report_date), 'MMM dd, yyyy HH:mm')}</div>
              <div><strong>State:</strong> {selectedSubmission.state}</div>
              <div><strong>LGA/Address:</strong> {selectedSubmission.lga_or_address}</div>
              <div><strong>Threat:</strong> {selectedSubmission.threat_domain}</div>
              <div>
                <strong>Severity:</strong>{' '}
                <span className={`badge ${
                  selectedSubmission.severity === 'Critical' ? 'badge-red' :
                  selectedSubmission.severity === 'High' ? 'badge-amber' : 'badge-green'
                }`}>{selectedSubmission.severity}</span>
              </div>
              <div><strong>Trend:</strong> {selectedSubmission.trend || 'N/A'}</div>
              <div><strong>Source Reliability:</strong> {selectedSubmission.source_reliability || 'N/A'}</div>
              <div><strong>Source Credibility:</strong> {selectedSubmission.source_credibility || 'N/A'}</div>
              <div><strong>Other Agency:</strong> {selectedSubmission.other_agency || 'N/A'}</div>
            </div>
            <div style={{ marginTop: '20px' }}>
              <strong>Narrative:</strong>
              <p style={{ whiteSpace: 'pre-wrap', backgroundColor: '#f5f5f5', padding: '15px', borderRadius: '5px', marginTop: '10px' }}>
                {selectedSubmission.narrative}
              </p>
            </div>
            
            {/* Attachments Section */}
            <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
              <strong>📎 Attachments</strong>
              <div style={{ marginTop: '10px' }}>
                {attachments.length > 0 ? (
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {attachments.map((att, idx) => (
                      <li key={idx} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        padding: '8px 12px',
                        background: '#f8f9fa',
                        borderRadius: '6px',
                        marginBottom: '8px'
                      }}>
                        <span>
                          {att.content_type?.startsWith('image') ? '🖼️' : 
                           att.content_type?.startsWith('video') ? '🎥' : '📄'} {att.filename}
                          <span style={{ color: '#666', fontSize: '12px', marginLeft: '10px' }}>
                            ({(att.size / 1024).toFixed(1)} KB)
                          </span>
                        </span>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '4px 10px', fontSize: '12px' }}
                          onClick={() => downloadAttachment(selectedSubmission.id, idx, att.filename)}
                        >
                          Download
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ color: '#666', fontSize: '14px' }}>No attachments</p>
                )}
                
                {/* Upload new attachment */}
                {(user?.role === 'admin' || selectedSubmission.submitted_by === user?.id) && (
                  <div style={{ marginTop: '15px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                      type="file"
                      accept="image/*,video/*,.pdf,.doc,.docx"
                      onChange={(e) => setAttachmentFile(e.target.files[0])}
                      style={{ flex: 1 }}
                    />
                    <button
                      className="btn btn-primary"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                      disabled={uploadingAttachment || !attachmentFile}
                      onClick={() => handleAttachmentUpload(selectedSubmission.id)}
                    >
                      {uploadingAttachment ? 'Uploading...' : 'Attach File'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <h2>All Submissions ({submissions.length})</h2>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Date</th>
              <th>State</th>
              <th>Threat</th>
              <th>Severity</th>
              <th>LGA/Address</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((sub) => (
              <tr key={sub.id}>
                <td>{sub.submission_id}</td>
                <td>{format(new Date(sub.report_date), 'MMM dd, yyyy HH:mm')}</td>
                <td>{sub.state}</td>
                <td>{sub.threat_domain}</td>
                <td>
                  <span className={`badge ${
                    sub.severity === 'Critical' ? 'badge-red' :
                    sub.severity === 'High' ? 'badge-amber' : 'badge-green'
                  }`}>
                    {sub.severity}
                  </span>
                </td>
                <td>{sub.lga_or_address}</td>
                <td>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '3px 8px', fontSize: '11px', marginRight: '5px' }}
                    onClick={() => { setSelectedSubmission(sub); fetchAttachments(sub.id); }}
                  >
                    View
                  </button>
                  {(user?.role === 'admin' || sub.submitted_by === user?.id) && (
                    <>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '3px 8px', fontSize: '11px', marginRight: '5px' }}
                        onClick={() => handleEdit(sub)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '3px 8px', fontSize: '11px' }}
                        onClick={() => handleDelete(sub.id)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {submissions.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', color: '#666' }}>
                  No submissions found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Submissions
