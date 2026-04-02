import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { format } from 'date-fns'
import IncidentBarChart from './charts/IncidentBarChart'
import StateComparisonChart from './charts/StateComparisonChart'
import RiskPieChart from './charts/RiskPieChart'
import SeverityPieChart from './charts/SeverityPieChart'
import ThreatDonutChart from './charts/ThreatDonutChart'
import WeeklyTrendChart from './charts/WeeklyTrendChart'
import StateRadarChart from './charts/StateRadarChart'
import HorizontalBarChart from './charts/HorizontalBarChart'
import MetricsCard from './charts/MetricsCard'
import SubmissionTimelineChart from './charts/SubmissionTimelineChart'
import SeverityInfographic from './charts/SeverityInfographic'
import IntelComposedBarLine from './charts/IntelComposedBarLine'
import MapView from './MapView'
import HeatMapView from './HeatMapView'
import './Dashboard.css'

const HIGHLIGHT_VARIANTS = ['a', 'b', 'c', 'd']

function Dashboard({ user }) {
  const [dailySitrep, setDailySitrep] = useState(null)
  const [weeklySitrep, setWeeklySitrep] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError('')
    try {
      const [dailyRes, weeklyRes, submissionsRes] = await Promise.all([
        axios.get('/api/reports/daily-sitrep', {
          params: { dashboard_window_days: 14 },
        }),
        axios.get('/api/reports/weekly-sitrep').catch(() => ({ data: null })),
        axios.get('/api/submissions', { params: { limit: 2000 } }).catch(() => ({ data: [] })),
      ])
      setDailySitrep(dailyRes.data)
      setWeeklySitrep(weeklyRes.data)
      setSubmissions(submissionsRes.data || [])
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData(false)
  }, [fetchDashboardData])

  if (loading) {
    return (
      <div className="container intel-loading">
        <div className="intel-loading__spinner" aria-hidden />
        <p>Loading intelligence dashboard…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container">
        <div className="alert alert-error">{error}</div>
      </div>
    )
  }

  const criticalCount = submissions.filter((s) => s.severity === 'Critical').length
  const highCount = submissions.filter((s) => s.severity === 'High').length
  const statesWithIncidents = new Set(submissions.map((s) => s.state)).size
  const mediumCount = submissions.filter((s) => s.severity === 'Medium').length

  const periodShort =
    dailySitrep?.aggregation_days != null
      ? `last ${dailySitrep.aggregation_days}d`
      : '24h'
  const periodHint =
    dailySitrep?.aggregation_days != null
      ? `Rolling ${dailySitrep.aggregation_days}-day window (matches seeded mock data)`
      : 'From daily SITREP rollup'

  return (
    <div className="container intel-dashboard">
      <header className="intel-hero">
        <div className="intel-hero__inner">
          <div>
            <div className="intel-hero__badge">
              <span aria-hidden>◆</span> Live situational picture
            </div>
            <h1 className="intel-hero__title">Intelligence Command Center</h1>
            <p className="intel-hero__subtitle">
              Unified view of incident volume, severity, geographic risk, and analytical highlights drawn from the
              latest SITREP feed{user?.full_name ? ` — ${user.full_name}` : ''}.
            </p>
          </div>
          <div className="intel-hero__actions">
            <span className="intel-hero__time">Updated {format(new Date(), 'MMM d, yyyy · HH:mm')}</span>
            <button type="button" className="intel-btn-refresh" disabled={refreshing} onClick={() => fetchDashboardData(true)}>
              {refreshing ? 'Refreshing…' : '↻ Refresh data'}
            </button>
          </div>
        </div>
      </header>

      {user?.role && user.role !== 'admin' ? (
        <div className="intel-scope-notice" role="status">
          Scope: <strong>{user.state || 'your state'}</strong> only. The API returns only this state&apos;s submissions for
          your role. For national totals and all mock incidents, sign in as <strong>admin</strong> and ensure the API
          uses the same database you seeded (<code>python seed_mock_submissions.py</code> from <code>backend/</code>).
        </div>
      ) : null}

      <section className="intel-section" aria-labelledby="sec-pulse">
        <div className="intel-section__head">
          <h2 id="sec-pulse" className="intel-section__title">
            <span aria-hidden>📡</span> Operational pulse
          </h2>
          <p className="intel-section__hint">Key counters ({periodHint})</p>
        </div>
        <div className="intel-bento">
          <MetricsCard
            title={`Incidents (${periodShort})`}
            value={dailySitrep?.total_submissions_24h ?? 0}
            subtitle={periodHint}
            icon="📊"
            variant="indigo"
          />
          <MetricsCard
            title="RED alerts"
            value={dailySitrep?.red_alerts_count ?? 0}
            subtitle="Escalated jurisdictions"
            icon="🚨"
            variant="red"
          />
          <MetricsCard
            title="Critical"
            value={criticalCount}
            subtitle="Sample set · recent submissions"
            icon="⚠️"
            variant="orange"
          />
          <MetricsCard
            title="High"
            value={highCount}
            subtitle="Priority follow-up"
            icon="🔶"
            variant="amber"
          />
          <MetricsCard
            title="Active states"
            value={statesWithIncidents}
            subtitle="Unique states in feed"
            icon="🗺️"
            variant="green"
          />
          <MetricsCard
            title="Crime categories"
            value={dailySitrep?.incident_summary?.length ?? 0}
            subtitle={mediumCount ? `${mediumCount} medium in sample` : 'Distinct incident types'}
            icon="📋"
            variant="violet"
          />
        </div>
      </section>

      <section className="intel-section" aria-labelledby="sec-timeline">
        <div className="intel-section__head">
          <h2 id="sec-timeline" className="intel-section__title">
            <span aria-hidden>📈</span> Volume &amp; trajectory
          </h2>
          <p className="intel-section__hint">14-day activity from submissions + composition infographic</p>
        </div>
        <div className="intel-grid-2">
          <div className="intel-panel">
            <div className="intel-panel__head">
              <div className="intel-panel__icon" aria-hidden>
                📉
              </div>
              <div>
                <h3 className="intel-panel__title">Submission timeline</h3>
                <p className="intel-panel__desc">Daily totals with critical and high overlays</p>
              </div>
            </div>
            <div className="intel-panel__body">
              <SubmissionTimelineChart submissions={submissions} days={14} />
            </div>
          </div>
          <div className="intel-panel">
            <div className="intel-panel__head">
              <div className="intel-panel__icon" aria-hidden>
                ⬛
              </div>
              <div>
                <h3 className="intel-panel__title">Severity mix (sample)</h3>
                <p className="intel-panel__desc">Proportional strip from recent submission records</p>
              </div>
            </div>
            <div className="intel-panel__body">
              <SeverityInfographic submissions={submissions} />
            </div>
          </div>
        </div>
      </section>

      <section className="intel-section" aria-labelledby="sec-composition">
        <div className="intel-section__head">
          <h2 id="sec-composition" className="intel-section__title">
            <span aria-hidden>🥧</span> Composition &amp; threat profile
          </h2>
          <p className="intel-section__hint">Distribution charts from aggregated SITREP fields</p>
        </div>
        <div className="intel-chart-grid intel-chart-grid--3">
          <div className="intel-panel">
            <div className="intel-panel__head">
              <div className="intel-panel__icon" aria-hidden>🎯</div>
              <div>
                <h3 className="intel-panel__title">Severity distribution</h3>
                <p className="intel-panel__desc">Incident summary by severity flag</p>
              </div>
            </div>
            <div className="intel-panel__body">
              <SeverityPieChart data={dailySitrep?.incident_summary || []} title="" />
            </div>
          </div>
          <div className="intel-panel">
            <div className="intel-panel__head">
              <div className="intel-panel__icon" aria-hidden>◎</div>
              <div>
                <h3 className="intel-panel__title">Threat breakdown</h3>
                <p className="intel-panel__desc">Donut of dominant threat types</p>
              </div>
            </div>
            <div className="intel-panel__body">
              <ThreatDonutChart data={dailySitrep?.top_5_red_alerts || dailySitrep?.incident_summary || []} title="" />
            </div>
          </div>
          <div className="intel-panel">
            <div className="intel-panel__head">
              <div className="intel-panel__icon" aria-hidden>⚡</div>
              <div>
                <h3 className="intel-panel__title">Risk rating</h3>
                <p className="intel-panel__desc">RED / AMBER / GREEN from alert rows</p>
              </div>
            </div>
            <div className="intel-panel__body">
              <RiskPieChart data={dailySitrep?.top_5_red_alerts || []} title="" />
            </div>
          </div>
        </div>
      </section>

      <section className="intel-section" aria-labelledby="sec-analytics">
        <div className="intel-section__head">
          <h2 id="sec-analytics" className="intel-section__title">
            <span aria-hidden>📊</span> Analytical charts
          </h2>
          <p className="intel-section__hint">Bars, ranked states, trends, and multi-axis radar</p>
        </div>
        <div className="intel-panel intel-geo-block">
          <div className="intel-panel__head">
            <div className="intel-panel__icon" aria-hidden>▤</div>
            <div>
              <h3 className="intel-panel__title">Volume vs. weighted intensity</h3>
              <p className="intel-panel__desc">Bar count with a derived emphasis line (severity-aware)</p>
            </div>
          </div>
          <div className="intel-panel__body">
            <IntelComposedBarLine data={dailySitrep?.incident_summary || []} title="" />
          </div>
        </div>
        <div className="intel-chart-grid intel-chart-grid--2" style={{ marginTop: '1.25rem' }}>
          <div className="intel-panel">
            <div className="intel-panel__head">
              <div className="intel-panel__icon" aria-hidden>▮</div>
              <div>
                <h3 className="intel-panel__title">Incidents by crime type</h3>
                <p className="intel-panel__desc">Classic vertical bar comparison</p>
              </div>
            </div>
            <div className="intel-panel__body">
              <IncidentBarChart data={dailySitrep?.incident_summary || []} title="" />
            </div>
          </div>
          <div className="intel-panel">
            <div className="intel-panel__head">
              <div className="intel-panel__icon" aria-hidden>▭</div>
              <div>
                <h3 className="intel-panel__title">Top states by reports</h3>
                <p className="intel-panel__desc">Ranked horizontal bars</p>
              </div>
            </div>
            <div className="intel-panel__body">
              <HorizontalBarChart data={dailySitrep?.top_5_red_alerts || []} title="" />
            </div>
          </div>
        </div>
        <div className="intel-chart-grid intel-chart-grid--2" style={{ marginTop: '1.25rem' }}>
          <div className="intel-panel">
            <div className="intel-panel__head">
              <div className="intel-panel__icon" aria-hidden>〰</div>
              <div>
                <h3 className="intel-panel__title">Weekly / period trends</h3>
                <p className="intel-panel__desc">Stacked area view of incident movement</p>
              </div>
            </div>
            <div className="intel-panel__body">
              <WeeklyTrendChart data={weeklySitrep?.weekly_trend_analysis || dailySitrep?.incident_summary || []} title="" />
            </div>
          </div>
          <div className="intel-panel">
            <div className="intel-panel__head">
              <div className="intel-panel__icon" aria-hidden>✧</div>
              <div>
                <h3 className="intel-panel__title">State threat radar</h3>
                <p className="intel-panel__desc">Top jurisdictions — incidents vs. critical proxy</p>
              </div>
            </div>
            <div className="intel-panel__body">
              <StateRadarChart data={dailySitrep?.top_5_red_alerts || []} title="" />
            </div>
          </div>
        </div>
      </section>

      <section className="intel-section" aria-labelledby="sec-geo">
        <div className="intel-section__head">
          <h2 id="sec-geo" className="intel-section__title">
            <span aria-hidden>🗺️</span> Geospatial intelligence
          </h2>
          <p className="intel-section__hint">Map layers and density heat</p>
        </div>
        <div className="intel-panel intel-geo-block">
          <div className="intel-panel__head">
            <div className="intel-panel__icon" aria-hidden>📌</div>
            <div>
              <h3 className="intel-panel__title">Incident pins & narratives</h3>
              <p className="intel-panel__desc">
                One marker per submission in the current feed; click for narrative, threat, severity, and LGA
              </p>
            </div>
          </div>
          <div className="intel-panel__body">
            <MapView data={submissions} title="" type="submissions" />
          </div>
        </div>
        <div className="intel-panel intel-geo-block">
          <div className="intel-panel__head">
            <div className="intel-panel__icon" aria-hidden>📍</div>
            <div>
              <h3 className="intel-panel__title">RED-alert summary map</h3>
              <p className="intel-panel__desc">Aggregated focus states from SITREP roll-up</p>
            </div>
          </div>
          <div className="intel-panel__body">
            <MapView data={dailySitrep?.top_5_red_alerts || []} title="" type="alerts" />
          </div>
        </div>
        {dailySitrep?.state_risk_profiling && dailySitrep.state_risk_profiling.length > 0 ? (
          <div className="intel-panel intel-geo-block">
            <div className="intel-panel__head">
              <div className="intel-panel__icon" aria-hidden>🎯</div>
              <div>
                <h3 className="intel-panel__title">State risk profile map</h3>
                <p className="intel-panel__desc">Risk profiling overlay</p>
              </div>
            </div>
            <div className="intel-panel__body">
              <MapView data={dailySitrep.state_risk_profiling} title="" type="risk" />
            </div>
          </div>
        ) : null}
        <HeatMapView data={submissions} title="Incident heat map" />
        <div className="intel-panel" style={{ marginTop: '1.25rem' }}>
          <div className="intel-panel__head">
            <div className="intel-panel__icon" aria-hidden>⧉</div>
            <div>
              <h3 className="intel-panel__title">State-wise comparison</h3>
              <p className="intel-panel__desc">Total vs. high-severity counts</p>
            </div>
          </div>
          <div className="intel-panel__body">
            <StateComparisonChart data={dailySitrep?.top_5_red_alerts || []} title="" />
          </div>
        </div>
      </section>

      {dailySitrep?.key_intelligence_highlights && dailySitrep.key_intelligence_highlights.length > 0 ? (
        <section className="intel-section" aria-labelledby="sec-highlights">
          <div className="intel-section__head">
            <h2 id="sec-highlights" className="intel-section__title">
              <span aria-hidden>💡</span> Key intelligence highlights
            </h2>
            <p className="intel-section__hint">Narrative takeaways from the current report</p>
          </div>
          <div className="intel-highlight-grid">
            {dailySitrep.key_intelligence_highlights.map((highlight, idx) => (
              <div
                key={idx}
                className={`intel-highlight-card intel-highlight-card--${HIGHLIGHT_VARIANTS[idx % HIGHLIGHT_VARIANTS.length]}`}
              >
                <span className="intel-highlight-card__num">{idx + 1}</span>
                <p className="intel-highlight-card__text">{highlight}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="intel-section" aria-labelledby="sec-tables">
        <div className="intel-section__head">
          <h2 id="sec-tables" className="intel-section__title">
            <span aria-hidden>📑</span> Data tables
          </h2>
          <p className="intel-section__hint">Sortable-style presentation of rollups</p>
        </div>
        <div className="intel-grid-2">
          <div className="intel-panel">
            <div className="intel-panel__head">
              <div className="intel-panel__icon" aria-hidden>≡</div>
              <div>
                <h3 className="intel-panel__title">Incident summary</h3>
                <p className="intel-panel__desc">Crime type · count · severity flag</p>
              </div>
            </div>
            <div className="intel-table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Crime type</th>
                    <th>Count</th>
                    <th>Severity</th>
                  </tr>
                </thead>
                <tbody>
                  {dailySitrep?.incident_summary?.map((incident, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{incident.crime_type}</td>
                      <td>
                        <span
                          style={{
                            background: 'var(--blue-lightest)',
                            color: 'var(--blue-dark)',
                            padding: '4px 12px',
                            borderRadius: 12,
                            fontWeight: 700,
                            fontSize: '13px',
                          }}
                        >
                          {incident.count}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${(incident.severity_flag || 'green').toLowerCase()}`}>
                          {incident.severity_flag || 'GREEN'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!dailySitrep?.incident_summary || dailySitrep.incident_summary.length === 0) && (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                        No incidents in summary
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="intel-panel">
            <div className="intel-panel__head">
              <div className="intel-panel__icon" aria-hidden>🚨</div>
              <div>
                <h3 className="intel-panel__title">Top RED alerts</h3>
                <p className="intel-panel__desc">Ranked states and recommended first actions</p>
              </div>
            </div>
            <div className="intel-table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>State</th>
                    <th>Threat</th>
                    <th>Reports</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {dailySitrep?.top_5_red_alerts?.map((alert) => (
                    <tr key={alert.rank}>
                      <td>
                        <span
                          style={{
                            background: 'var(--gray-lightest)',
                            color: 'var(--red-alert)',
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '13px',
                          }}
                        >
                          {alert.rank}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700 }}>{alert.state}</td>
                      <td>{alert.threat}</td>
                      <td>
                        <span
                          style={{
                            background: 'var(--yellow-lightest)',
                            color: 'var(--red-alert)',
                            padding: '4px 12px',
                            borderRadius: 12,
                            fontWeight: 700,
                            fontSize: '13px',
                          }}
                        >
                          {alert.total_reports}
                        </span>
                      </td>
                      <td style={{ fontSize: '13px', maxWidth: 220 }}>{alert.recommended_first_action}</td>
                    </tr>
                  ))}
                  {(!dailySitrep?.top_5_red_alerts || dailySitrep.top_5_red_alerts.length === 0) && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                        No RED alerts
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Dashboard
