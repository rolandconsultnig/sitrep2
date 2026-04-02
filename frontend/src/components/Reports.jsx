import React, { useState } from 'react'
import axios from 'axios'
import { format } from 'date-fns'
import IncidentBarChart from './charts/IncidentBarChart'
import TrendLineChart from './charts/TrendLineChart'
import StateComparisonChart from './charts/StateComparisonChart'
import RiskPieChart from './charts/RiskPieChart'
import TimeSeriesChart from './charts/TimeSeriesChart'
import MapView from './MapView'

function Reports({ user }) {
  const [reportType, setReportType] = useState('daily-sitrep')
  const [reportData, setReportData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [year, setYear] = useState(new Date().getFullYear())
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  const downloadPdf = async () => {
    if (!['daily-sitrep', 'weekly-sitrep'].includes(reportType)) {
      return
    }
    
    setDownloadingPdf(true)
    try {
      const params = {}
      if (reportType === 'daily-sitrep') {
        params.report_date = new Date(date).toISOString()
      } else {
        const selectedDate = new Date(date)
        const dayOfWeek = selectedDate.getDay()
        const diff = selectedDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
        const weekStart = new Date(selectedDate.setDate(diff))
        params.week_start = weekStart.toISOString()
      }
      
      const response = await axios.get(`/api/reports/${reportType}/pdf`, {
        params,
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${reportType}_${format(new Date(date), 'yyyyMMdd')}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError('Failed to download PDF')
    } finally {
      setDownloadingPdf(false)
    }
  }

  const fetchReport = async () => {
    setLoading(true)
    setError('')
    setReportData(null)

    try {
      let response
      const params = {}

      if (reportType === 'daily-sitrep' || reportType === 'daily-risk-matrix') {
        params.report_date = new Date(date).toISOString()
      } else if (reportType === 'weekly-sitrep' || reportType === 'weekly-risk-matrix') {
        const selectedDate = new Date(date)
        const dayOfWeek = selectedDate.getDay()
        const diff = selectedDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
        const weekStart = new Date(selectedDate.setDate(diff))
        params.week_start = weekStart.toISOString()
      } else if (reportType === 'monthly-sitrep') {
        const selectedDate = new Date(date)
        params.month_start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1).toISOString()
      } else if (reportType === 'quarterly-sitrep') {
        const selectedDate = new Date(date)
        params.quarter_start = selectedDate.toISOString()
      } else if (reportType === 'bi-annual-sitrep') {
        const selectedDate = new Date(date)
        params.period_start = selectedDate.toISOString()
      } else if (reportType === 'yearly-sitrep') {
        params.year = year
      }

      switch (reportType) {
        case 'daily-sitrep':
          response = await axios.get('/api/reports/daily-sitrep', { params })
          break
        case 'weekly-sitrep':
          response = await axios.get('/api/reports/weekly-sitrep', { params })
          break
        case 'monthly-sitrep':
          response = await axios.get('/api/reports/monthly-sitrep', { params })
          break
        case 'quarterly-sitrep':
          response = await axios.get('/api/reports/quarterly-sitrep', { params })
          break
        case 'bi-annual-sitrep':
          response = await axios.get('/api/reports/bi-annual-sitrep', { params })
          break
        case 'yearly-sitrep':
          response = await axios.get('/api/reports/yearly-sitrep', { params })
          break
        case 'daily-risk-matrix':
          response = await axios.get('/api/reports/daily-risk-matrix', { params })
          break
        case 'weekly-risk-matrix':
          response = await axios.get('/api/reports/weekly-risk-matrix', { params })
          break
        default:
          throw new Error('Invalid report type')
      }

      setReportData(response.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load report')
    } finally {
      setLoading(false)
    }
  }

  const renderReport = () => {
    if (!reportData) return null

    // Daily SITREP
    if (reportType === 'daily-sitrep') {
      return (
        <div>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Submissions (24h)</h3>
              <div className="value">{reportData.total_submissions_24h || 0}</div>
            </div>
            <div className="stat-card">
              <h3>RED Alerts</h3>
              <div className="value" style={{ color: '#ff4444' }}>
                {reportData.red_alerts_count || 0}
              </div>
            </div>
            <div className="stat-card">
              <h3>Reporting Date</h3>
              <div className="value" style={{ fontSize: '18px' }}>
                {format(new Date(reportData.reporting_date), 'MMM dd, yyyy')}
              </div>
            </div>
          </div>

          <div className="card">
            <h2>Key Intelligence Highlights</h2>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {reportData.key_intelligence_highlights?.map((highlight, idx) => (
                <li key={idx} style={{ padding: '10px', borderLeft: '3px solid #0066cc', marginBottom: '10px' }}>
                  {highlight}
                </li>
              ))}
            </ul>
          </div>

          <div className="card" style={{ marginBottom: '30px' }}>
            <h2>Incident Map - Nigeria</h2>
            <MapView 
              data={reportData.incident_summary || []} 
              title="Incident Locations by State"
              type="incidents"
            />
          </div>

          <div className="card" style={{ marginBottom: '30px' }}>
            <h2>Incident Summary - Visual Analysis</h2>
            <IncidentBarChart 
              data={reportData.incident_summary || []} 
              title="Incidents by Crime Type"
            />
          </div>

          <div className="card">
            <h2>Incident Summary - Detailed Table</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>Crime Type</th>
                  <th>Count</th>
                  <th>Severity Flag</th>
                </tr>
              </thead>
              <tbody>
                {reportData.incident_summary?.map((incident, idx) => (
                  <tr key={idx}>
                    <td>{incident.crime_type}</td>
                    <td>{incident.count}</td>
                    <td>
                      <span className={`badge badge-${incident.severity_flag.toLowerCase()}`}>
                        {incident.severity_flag}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card">
            <h2>Top 5 RED Alerts</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>State</th>
                  <th>Threat</th>
                  <th>High Severity</th>
                  <th>Total Reports</th>
                  <th>Recommended Action</th>
                  <th>Responsible Unit</th>
                </tr>
              </thead>
              <tbody>
                {reportData.top_5_red_alerts?.map((alert) => (
                  <tr key={alert.rank}>
                    <td>{alert.rank}</td>
                    <td>{alert.state}</td>
                    <td>{alert.threat}</td>
                    <td>{alert.high_severity_count}</td>
                    <td>{alert.total_reports}</td>
                    <td>{alert.recommended_first_action}</td>
                    <td>{alert.responsible_unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )
    }

    // Weekly SITREP
    if (reportType === 'weekly-sitrep') {
      return (
        <div>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Reports (Week)</h3>
              <div className="value">{reportData.total_reports_week || 0}</div>
            </div>
            <div className="stat-card">
              <h3>RED Alerts</h3>
              <div className="value" style={{ color: '#ff4444' }}>
                {reportData.red_alerts_count || 0}
              </div>
            </div>
            <div className="stat-card">
              <h3>Week Period</h3>
              <div className="value" style={{ fontSize: '14px' }}>
                {format(new Date(reportData.week_start), 'MMM dd')} - {format(new Date(reportData.week_end), 'MMM dd, yyyy')}
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: '30px' }}>
            <h2>Weekly Trend Analysis</h2>
            <TrendLineChart 
              data={reportData.weekly_trend_analysis || []} 
              title="Crime Trends Over Week"
              dataKey="week_total"
              name="Week Total"
            />
          </div>

          <div className="card" style={{ marginBottom: '30px' }}>
            <h2>Risk Map - Nigeria</h2>
            <MapView 
              data={reportData.state_risk_profiling || []} 
              title="Risk Profile by State"
              type="risk"
            />
          </div>

          <div className="card" style={{ marginBottom: '30px' }}>
            <h2>State Risk Distribution</h2>
            <RiskPieChart 
              data={reportData.state_risk_profiling || []} 
              title="Risk Rating Distribution"
            />
          </div>

          <div className="card" style={{ marginBottom: '30px' }}>
            <h2>State Risk Profiling - Visual Comparison</h2>
            <StateComparisonChart 
              data={reportData.state_risk_profiling || []} 
              title="States by Risk Profile"
              dataKey="risk_rating"
            />
          </div>

          <div className="card">
            <h2>State Risk Profiling - Detailed Table</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>State</th>
                  <th>Dominant Crime</th>
                  <th>Risk Rating</th>
                </tr>
              </thead>
              <tbody>
                {reportData.state_risk_profiling?.map((profile, idx) => (
                  <tr key={idx}>
                    <td>{profile.state}</td>
                    <td>{profile.dominant_crime}</td>
                    <td>
                      <span className={`badge badge-${profile.risk_rating.toLowerCase()}`}>
                        {profile.risk_rating}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )
    }

    // Monthly SITREP
    if (reportType === 'monthly-sitrep') {
      return (
        <div>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Reports (Month)</h3>
              <div className="value">{reportData.total_reports_month || 0}</div>
            </div>
            <div className="stat-card">
              <h3>RED Alerts</h3>
              <div className="value" style={{ color: '#ff4444' }}>
                {reportData.red_alerts_count || 0}
              </div>
            </div>
            <div className="stat-card">
              <h3>Month Period</h3>
              <div className="value" style={{ fontSize: '14px' }}>
                {format(new Date(reportData.month_start), 'MMM yyyy')}
              </div>
            </div>
            {reportData.comparative_analysis && (
              <div className="stat-card">
                <h3>Change from Previous Month</h3>
                <div className="value" style={{ 
                  color: reportData.comparative_analysis.change > 0 ? '#ff4444' : '#00c851',
                  fontSize: '18px'
                }}>
                  {reportData.comparative_analysis.change > 0 ? '+' : ''}{reportData.comparative_analysis.change}
                  <span style={{ fontSize: '12px', display: 'block' }}>
                    ({reportData.comparative_analysis.percent_change}%)
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="card" style={{ marginBottom: '30px' }}>
            <h2>Monthly Trend Analysis</h2>
            <TrendLineChart 
              data={reportData.monthly_trend_analysis || []} 
              title="Crime Trends Over Month"
              dataKey="week_total"
              name="Month Total"
            />
          </div>

          <div className="card" style={{ marginBottom: '30px' }}>
            <h2>Threat Map - Nigeria</h2>
            <MapView 
              data={reportData.top_threats || []} 
              title="Threat Locations by State"
              type="threats"
            />
          </div>

          <div className="card" style={{ marginBottom: '30px' }}>
            <h2>Top Threats - Visual Comparison</h2>
            <StateComparisonChart 
              data={reportData.top_threats || []} 
              title="Top Threats by State"
              dataKey="total_reports"
            />
          </div>

          <div className="card">
            <h2>Top Threats</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>State</th>
                  <th>Threat</th>
                  <th>Total Reports</th>
                  <th>High Severity</th>
                  <th>Responsible Unit</th>
                </tr>
              </thead>
              <tbody>
                {reportData.top_threats?.map((threat) => (
                  <tr key={threat.rank}>
                    <td>{threat.rank}</td>
                    <td>{threat.state}</td>
                    <td>{threat.threat}</td>
                    <td>{threat.total_reports}</td>
                    <td>{threat.high_severity_count}</td>
                    <td>{threat.responsible_unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card">
            <h2>State Risk Profiling</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>State</th>
                  <th>Dominant Crime</th>
                  <th>Risk Rating</th>
                </tr>
              </thead>
              <tbody>
                {reportData.state_risk_profiling?.map((profile, idx) => (
                  <tr key={idx}>
                    <td>{profile.state}</td>
                    <td>{profile.dominant_crime}</td>
                    <td>
                      <span className={`badge badge-${profile.risk_rating.toLowerCase()}`}>
                        {profile.risk_rating}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )
    }

    // Quarterly SITREP
    if (reportType === 'quarterly-sitrep') {
      return (
        <div>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Reports (Q{reportData.quarter_number})</h3>
              <div className="value">{reportData.total_reports_quarter || 0}</div>
            </div>
            <div className="stat-card">
              <h3>RED Alerts</h3>
              <div className="value" style={{ color: '#ff4444' }}>
                {reportData.red_alerts_count || 0}
              </div>
            </div>
            <div className="stat-card">
              <h3>Quarter Period</h3>
              <div className="value" style={{ fontSize: '14px' }}>
                {format(new Date(reportData.quarter_start), 'MMM dd')} - {format(new Date(reportData.quarter_end), 'MMM dd, yyyy')}
              </div>
            </div>
            {reportData.comparative_analysis && (
              <div className="stat-card">
                <h3>Change from Previous Quarter</h3>
                <div className="value" style={{ 
                  color: reportData.comparative_analysis.change > 0 ? '#ff4444' : '#00c851',
                  fontSize: '18px'
                }}>
                  {reportData.comparative_analysis.change > 0 ? '+' : ''}{reportData.comparative_analysis.change}
                  <span style={{ fontSize: '12px', display: 'block' }}>
                    ({reportData.comparative_analysis.percent_change}%)
                  </span>
                </div>
              </div>
            )}
          </div>

          {reportData.strategic_recommendations && reportData.strategic_recommendations.length > 0 && (
            <div className="card">
              <h2>Strategic Recommendations</h2>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {reportData.strategic_recommendations.map((rec, idx) => (
                  <li key={idx} style={{ padding: '10px', borderLeft: '3px solid #ffaa00', marginBottom: '10px' }}>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="card" style={{ marginBottom: '30px' }}>
            <h2>Quarterly Trend Analysis</h2>
            <TrendLineChart 
              data={reportData.quarterly_trend_analysis || []} 
              title="Crime Trends Over Quarter"
              dataKey="week_total"
              name="Quarter Total"
            />
          </div>

          <div className="card" style={{ marginBottom: '30px' }}>
            <h2>Threat Map - Nigeria</h2>
            <MapView 
              data={reportData.top_threats || []} 
              title="Threat Locations by State"
              type="threats"
            />
          </div>

          <div className="card" style={{ marginBottom: '30px' }}>
            <h2>Top Threats - Visual Comparison</h2>
            <StateComparisonChart 
              data={reportData.top_threats || []} 
              title="Top Threats by State"
              dataKey="total_reports"
            />
          </div>

          <div className="card">
            <h2>Top Threats</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>State</th>
                  <th>Threat</th>
                  <th>Total Reports</th>
                  <th>High Severity</th>
                  <th>Responsible Unit</th>
                </tr>
              </thead>
              <tbody>
                {reportData.top_threats?.map((threat) => (
                  <tr key={threat.rank}>
                    <td>{threat.rank}</td>
                    <td>{threat.state}</td>
                    <td>{threat.threat}</td>
                    <td>{threat.total_reports}</td>
                    <td>{threat.high_severity_count}</td>
                    <td>{threat.responsible_unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )
    }

    // Bi-Annual SITREP
    if (reportType === 'bi-annual-sitrep') {
      return (
        <div>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Reports ({reportData.period_name})</h3>
              <div className="value">{reportData.total_reports_period || 0}</div>
            </div>
            <div className="stat-card">
              <h3>RED Alerts</h3>
              <div className="value" style={{ color: '#ff4444' }}>
                {reportData.red_alerts_count || 0}
              </div>
            </div>
            <div className="stat-card">
              <h3>Period</h3>
              <div className="value" style={{ fontSize: '14px' }}>
                {format(new Date(reportData.period_start), 'MMM yyyy')} - {format(new Date(reportData.period_end), 'MMM yyyy')}
              </div>
            </div>
            {reportData.performance_metrics && (
              <>
                <div className="stat-card">
                  <h3>Avg Daily Incidents</h3>
                  <div className="value" style={{ fontSize: '18px' }}>
                    {reportData.performance_metrics.average_daily_incidents || 0}
                  </div>
                </div>
                <div className="stat-card">
                  <h3>High Severity %</h3>
                  <div className="value" style={{ fontSize: '18px' }}>
                    {reportData.performance_metrics.high_severity_percentage || 0}%
                  </div>
                </div>
              </>
            )}
          </div>

          {reportData.strategic_recommendations && reportData.strategic_recommendations.length > 0 && (
            <div className="card">
              <h2>Strategic Recommendations</h2>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {reportData.strategic_recommendations.map((rec, idx) => (
                  <li key={idx} style={{ padding: '10px', borderLeft: '3px solid #ffaa00', marginBottom: '10px' }}>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="card" style={{ marginBottom: '30px' }}>
            <h2>Trend Analysis</h2>
            <TrendLineChart 
              data={reportData.trend_analysis || []} 
              title="Crime Trends Over Period"
              dataKey="week_total"
              name="Period Total"
            />
          </div>
        </div>
      )
    }

    // Yearly SITREP
    if (reportType === 'yearly-sitrep') {
      return (
        <div>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Reports ({reportData.year})</h3>
              <div className="value">{reportData.total_reports_year || 0}</div>
            </div>
            <div className="stat-card">
              <h3>RED Alerts</h3>
              <div className="value" style={{ color: '#ff4444' }}>
                {reportData.red_alerts_count || 0}
              </div>
            </div>
            {reportData.performance_metrics && (
              <>
                <div className="stat-card">
                  <h3>Avg Daily</h3>
                  <div className="value" style={{ fontSize: '18px' }}>
                    {reportData.performance_metrics.average_daily_incidents || 0}
                  </div>
                </div>
                <div className="stat-card">
                  <h3>Avg Monthly</h3>
                  <div className="value" style={{ fontSize: '18px' }}>
                    {reportData.performance_metrics.average_monthly_incidents || 0}
                  </div>
                </div>
                <div className="stat-card">
                  <h3>High Severity %</h3>
                  <div className="value" style={{ fontSize: '18px' }}>
                    {reportData.performance_metrics.high_severity_percentage || 0}%
                  </div>
                </div>
                <div className="stat-card">
                  <h3>States Covered</h3>
                  <div className="value" style={{ fontSize: '18px' }}>
                    {reportData.performance_metrics.states_covered || 0}
                  </div>
                </div>
              </>
            )}
          </div>

          {reportData.annual_summary && (
            <div className="card">
              <h2>Annual Summary</h2>
              <div style={{ whiteSpace: 'pre-line', lineHeight: '1.8' }}>
                {reportData.annual_summary}
              </div>
            </div>
          )}

          {reportData.strategic_recommendations && reportData.strategic_recommendations.length > 0 && (
            <div className="card">
              <h2>Strategic Recommendations</h2>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {reportData.strategic_recommendations.map((rec, idx) => (
                  <li key={idx} style={{ padding: '10px', borderLeft: '3px solid #ffaa00', marginBottom: '10px' }}>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="card" style={{ marginBottom: '30px' }}>
            <h2>Annual Trend Analysis</h2>
            <TrendLineChart 
              data={reportData.annual_trend_analysis || []} 
              title="Crime Trends Over Year"
              dataKey="week_total"
              name="Year Total"
            />
          </div>

          <div className="card" style={{ marginBottom: '30px' }}>
            <h2>Threat Map - Nigeria</h2>
            <MapView 
              data={reportData.top_threats || []} 
              title="Threat Locations by State"
              type="threats"
            />
          </div>

          <div className="card" style={{ marginBottom: '30px' }}>
            <h2>Top Threats - Visual Comparison</h2>
            <StateComparisonChart 
              data={reportData.top_threats || []} 
              title="Top Threats by State"
              dataKey="total_reports"
            />
          </div>

          <div className="card">
            <h2>Top Threats</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>State</th>
                  <th>Threat</th>
                  <th>Total Reports</th>
                  <th>High Severity</th>
                  <th>Responsible Unit</th>
                </tr>
              </thead>
              <tbody>
                {reportData.top_threats?.map((threat) => (
                  <tr key={threat.rank}>
                    <td>{threat.rank}</td>
                    <td>{threat.state}</td>
                    <td>{threat.threat}</td>
                    <td>{threat.total_reports}</td>
                    <td>{threat.high_severity_count}</td>
                    <td>{threat.responsible_unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )
    }

    // Risk Matrix
    if (reportType === 'daily-risk-matrix' || reportType === 'weekly-risk-matrix') {
      return (
        <>
          <div className="card" style={{ marginBottom: '30px' }}>
            <h2>{reportType === 'daily-risk-matrix' ? 'Daily' : 'Weekly'} Risk Matrix - Visual Analysis</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <StateComparisonChart 
                data={reportData || []} 
                title="Risk by State"
                dataKey="total_reports"
              />
              <RiskPieChart 
                data={reportData || []} 
                title="Risk Flag Distribution"
              />
            </div>
          </div>
          <div className="card">
            <h2>{reportType === 'daily-risk-matrix' ? 'Daily' : 'Weekly'} Risk Matrix - Detailed Table</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>State</th>
                  <th>Threat</th>
                  <th>Total Reports</th>
                  <th>High Severity Count</th>
                  <th>Risk Flag</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.state}</td>
                    <td>{item.threat}</td>
                    <td>{item.total_reports}</td>
                    <td>{item.high_severity_count}</td>
                    <td>
                      <span className={`badge badge-${item.risk_flag.toLowerCase()}`}>
                        {item.risk_flag}
                      </span>
                    </td>
                  </tr>
                ))}
                {reportData.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: '#666' }}>
                      No data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )
    }
  }

  return (
    <div className="container">
      <h1 style={{ marginBottom: '30px' }}>Intelligence Situation Reports</h1>

      <div className="card">
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ marginBottom: 0, minWidth: '200px' }}>
            <label>Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              style={{ width: '100%' }}
            >
              <optgroup label="Daily Reports">
                <option value="daily-sitrep">Daily SITREP</option>
                <option value="daily-risk-matrix">Daily Risk Matrix</option>
              </optgroup>
              <optgroup label="Weekly Reports">
                <option value="weekly-sitrep">Weekly SITREP</option>
                <option value="weekly-risk-matrix">Weekly Risk Matrix</option>
              </optgroup>
              <optgroup label="Periodic Reports">
                <option value="monthly-sitrep">Monthly SITREP</option>
                <option value="quarterly-sitrep">Quarterly SITREP</option>
                <option value="bi-annual-sitrep">Bi-Annual SITREP</option>
                <option value="yearly-sitrep">Yearly SITREP</option>
              </optgroup>
            </select>
          </div>

          {(reportType === 'daily-sitrep' || reportType === 'daily-risk-matrix' || 
            reportType === 'weekly-sitrep' || reportType === 'weekly-risk-matrix' ||
            reportType === 'monthly-sitrep' || reportType === 'quarterly-sitrep' ||
            reportType === 'bi-annual-sitrep') && (
            <div className="form-group" style={{ marginBottom: 0, minWidth: '200px' }}>
              <label>Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
          )}

          {reportType === 'yearly-sitrep' && (
            <div className="form-group" style={{ marginBottom: 0, minWidth: '200px' }}>
              <label>Year</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                min="2020"
                max={new Date().getFullYear()}
                style={{ width: '100%' }}
              />
            </div>
          )}

          <button className="btn btn-primary" onClick={fetchReport} disabled={loading}>
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
          
          {['daily-sitrep', 'weekly-sitrep'].includes(reportType) && reportData && (
            <button 
              className="btn btn-success" 
              onClick={downloadPdf} 
              disabled={downloadingPdf}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              📄 {downloadingPdf ? 'Downloading...' : 'Download PDF'}
            </button>
          )}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading && <div className="loading">Generating report...</div>}

      {reportData && !loading && renderReport()}
    </div>
  )
}

export default Reports
