import React from 'react'
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import { format, parseISO, isValid } from 'date-fns'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Nigeria state coordinates (approximate centers)
const NIGERIA_STATE_COORDS = {
  "Abia": [5.5320, 7.4860],
  "Adamawa": [9.3265, 12.3984],
  "Akwa Ibom": [5.0079, 7.8498],
  "Anambra": [6.2109, 7.0697],
  "Bauchi": [10.3103, 9.8439],
  "Bayelsa": [4.9267, 6.2644],
  "Benue": [7.3369, 8.7404],
  "Borno": [11.8333, 13.1500],
  "Cross River": [5.8702, 8.5988],
  "Delta": [5.7049, 5.9339],
  "Ebonyi": [6.2649, 8.0137],
  "Edo": [6.3400, 5.6170],
  "Ekiti": [7.6233, 5.2209],
  "Enugu": [6.4584, 7.5464],
  "FCT": [9.0765, 7.3986],
  "Gombe": [10.2897, 11.1710],
  "Imo": [5.4920, 7.0260],
  "Jigawa": [12.2280, 9.5616],
  "Kaduna": [10.5264, 7.4381],
  "Kano": [12.0022, 8.5919],
  "Katsina": [12.9855, 7.6172],
  "Kebbi": [12.4500, 4.1994],
  "Kogi": [7.8027, 6.7333],
  "Kwara": [8.5000, 4.5500],
  "Lagos": [6.5244, 3.3792],
  "Nasarawa": [8.4998, 8.5153],
  "Niger": [9.0819, 6.0096],
  "Ogun": [6.9980, 3.4737],
  "Ondo": [7.2574, 5.2058],
  "Osun": [7.5624, 4.5200],
  "Oyo": [7.3775, 3.9470],
  "Plateau": [9.8965, 8.8583],
  "Rivers": [4.8396, 7.0026],
  "Sokoto": [13.0059, 5.2476],
  "Taraba": [8.7560, 10.7733],
  "Yobe": [11.7480, 11.9660],
  "Zamfara": [12.1222, 6.2236]
}

// Color mapping for severity/risk
const getColor = (severity, riskFlag) => {
  if (riskFlag === 'RED' || severity === 'Critical') return '#ff0000'
  if (riskFlag === 'AMBER' || severity === 'High') return '#ffaa00'
  if (severity === 'Medium') return '#ffff00'
  return '#00c851' // Green for Low
}

// Size mapping based on count
const getRadius = (count) => {
  if (count >= 10) return 15
  if (count >= 5) return 12
  if (count >= 3) return 10
  if (count >= 1) return 8
  return 5
}

/** Spread pins around state centroid so overlapping incidents remain clickable */
function jitteredPosition(baseLat, baseLng, indexInState) {
  const golden = 2.39996322972865332
  const angle = indexInState * golden
  const ring = Math.floor(indexInState / 8) + 1
  const r = 0.007 * ring
  return [baseLat + r * Math.cos(angle), baseLng + r * Math.sin(angle)]
}

function formatReportDate(raw) {
  if (!raw) return ''
  try {
    const d = typeof raw === 'string' ? parseISO(raw) : new Date(raw)
    return isValid(d) ? format(d, 'MMM d, yyyy HH:mm') : String(raw)
  } catch {
    return String(raw)
  }
}

function MapView({ data, title, type = 'incidents' }) {
  // Default center: Nigeria (centered on the country)
  const center = [9.0820, 8.6753]
  const zoom = 6.5
  
  // Nigeria bounds for constraining the map view
  const nigeriaBounds = [[4.2, 2.6], [13.9, 14.7]]

  // Process data for map markers
  const markers = React.useMemo(() => {
    if (!data || data.length === 0) return []

    if (type === 'incidents') {
      // For incident summary data - group by state if needed
      const stateMap = {}
      data.forEach(item => {
        // If data has state field, use it; otherwise aggregate by crime type location
        const state = item.state || 'FCT' // Default to FCT if no state
        if (!stateMap[state]) {
          stateMap[state] = {
            state: state,
            count: 0,
            severity: 'Low',
            crimes: []
          }
        }
        stateMap[state].count += item.count || 0
        stateMap[state].crimes.push(item.crime_type || 'Unknown')
        if (item.severity_flag === 'RED' || item.severity_flag === 'High') {
          stateMap[state].severity = 'High'
        }
      })

      return Object.values(stateMap).map(item => {
        const coords = NIGERIA_STATE_COORDS[item.state]
        if (!coords) return null

        return {
          position: coords,
          state: item.state,
          count: item.count,
          severity: item.severity,
          popup: `${item.state}: ${item.count} incidents - ${item.crimes.join(', ')}`
        }
      }).filter(Boolean)
    } else if (type === 'alerts') {
      // For RED alerts data
      return data.map(item => {
        const state = item.state
        const coords = NIGERIA_STATE_COORDS[state]
        if (!coords) return null

        return {
          position: coords,
          state: state,
          count: item.total_reports || 0,
          severity: item.high_severity_count > 0 ? 'High' : 'Medium',
          riskFlag: 'RED',
          threat: item.threat,
          popup: `${state}: ${item.total_reports || 0} reports - ${item.threat || 'Threat'}`
        }
      }).filter(Boolean)
    } else if (type === 'risk') {
      // For risk profiling data
      return data.map(item => {
        const state = item.state
        const coords = NIGERIA_STATE_COORDS[state]
        if (!coords) return null

        return {
          position: coords,
          state: state,
          riskRating: item.risk_rating || 'GREEN',
          dominantCrime: item.dominant_crime,
          popup: `${state}: Risk ${item.risk_rating || 'GREEN'} - ${item.dominant_crime || 'N/A'}`
        }
      }).filter(Boolean)
    } else if (type === 'threats') {
      // For top threats data
      return data.map(item => {
        const state = item.state
        const coords = NIGERIA_STATE_COORDS[state]
        if (!coords) return null

        return {
          position: coords,
          state: state,
          count: item.total_reports || 0,
          threat: item.threat,
          severity: item.high_severity_count > 0 ? 'High' : 'Medium',
          popup: `${state}: ${item.threat || 'Threat'} - ${item.total_reports || 0} reports`
        }
      }).filter(Boolean)
    } else if (type === 'submissions') {
      const perStateIndex = {}
      return data
        .map((sub) => {
          const state = sub.state || 'FCT'
          const base = NIGERIA_STATE_COORDS[state]
          if (!base) return null
          const idx = perStateIndex[state] ?? 0
          perStateIndex[state] = idx + 1
          const position = jitteredPosition(base[0], base[1], idx)
          return {
            variant: 'submission',
            position,
            id: sub.id,
            state,
            severity: sub.severity || 'Low',
            threat: sub.threat_domain || '—',
            narrative: (sub.narrative && String(sub.narrative).trim()) || 'No narrative provided.',
            lga: sub.lga_or_address || '—',
            reportDateLabel: formatReportDate(sub.report_date),
            submissionId: sub.submission_id || String(sub.id),
          }
        })
        .filter(Boolean)
    }

    return []
  }, [data, type])

  // Generate state markers for all states when showing base map
  const allStateMarkers = React.useMemo(() => {
    return Object.entries(NIGERIA_STATE_COORDS).map(([state, coords]) => ({
      position: coords,
      state: state,
      isBaseMarker: true
    }))
  }, [])

  const hasData = data && data.length > 0

  return (
    <div style={{ marginBottom: '30px' }}>
      {title && <h3 style={{ marginBottom: '15px', fontSize: '18px' }}>{title}</h3>}
      <div style={{ height: '500px', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ddd' }}>
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
          maxBounds={nigeriaBounds}
          maxBoundsViscosity={1.0}
          minZoom={5}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Show all state markers as base layer when no data */}
          {!hasData && allStateMarkers.map((marker, idx) => (
            <CircleMarker
              key={`base-${idx}`}
              center={marker.position}
              radius={6}
              pathOptions={{
                color: '#6366f1',
                fillColor: '#6366f1',
                fillOpacity: 0.4,
                weight: 2
              }}
            >
              <Popup>
                <div>
                  <strong>{marker.state}</strong>
                  <br />
                  No incidents reported
                </div>
              </Popup>
              <Tooltip>{marker.state}</Tooltip>
            </CircleMarker>
          ))}

          {/* Show data markers when data is available */}
          {hasData &&
            markers.map((marker, idx) =>
              marker.variant === 'submission' ? (
                <Marker key={marker.id ?? marker.submissionId ?? idx} position={marker.position}>
                  <Popup maxWidth={340} minWidth={260}>
                    <div style={{ fontSize: '13px', lineHeight: 1.45 }}>
                      <div style={{ fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary, #111)' }}>
                        {marker.submissionId}
                      </div>
                      <div style={{ marginBottom: '4px' }}>
                        <strong>State:</strong> {marker.state} · <strong>Severity:</strong> {marker.severity}
                      </div>
                      <div style={{ marginBottom: '4px' }}>
                        <strong>Threat:</strong> {marker.threat}
                      </div>
                      <div style={{ marginBottom: '4px', fontSize: '12px', color: 'var(--text-secondary, #555)' }}>
                        <strong>LGA / location:</strong> {marker.lga}
                      </div>
                      {marker.reportDateLabel ? (
                        <div style={{ marginBottom: '8px', fontSize: '12px', color: 'var(--text-muted, #666)' }}>
                          <strong>Reported:</strong> {marker.reportDateLabel}
                        </div>
                      ) : null}
                      <div
                        style={{
                          borderTop: '1px solid #e5e7eb',
                          paddingTop: '8px',
                          marginTop: '4px',
                          maxHeight: '200px',
                          overflowY: 'auto',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                        }}
                      >
                        <strong>Narrative</strong>
                        <div style={{ marginTop: '4px' }}>{marker.narrative}</div>
                      </div>
                    </div>
                  </Popup>
                  <Tooltip direction="top" offset={[0, -6]} opacity={0.92}>
                    {marker.submissionId} · {marker.severity}
                  </Tooltip>
                </Marker>
              ) : (
                <CircleMarker
                  key={idx}
                  center={marker.position}
                  radius={getRadius(marker.count || 1)}
                  pathOptions={{
                    color: getColor(marker.severity, marker.riskRating || marker.riskFlag),
                    fillColor: getColor(marker.severity, marker.riskRating || marker.riskFlag),
                    fillOpacity: 0.6,
                    weight: 2,
                  }}
                >
                  <Popup>
                    <div>
                      <strong>{marker.state}</strong>
                      <br />
                      {marker.popup}
                      {marker.threat && (
                        <>
                          <br />
                          Threat: {marker.threat}
                        </>
                      )}
                      {marker.dominantCrime && (
                        <>
                          <br />
                          Dominant Crime: {marker.dominantCrime}
                        </>
                      )}
                    </div>
                  </Popup>
                  <Tooltip>
                    {marker.state}: {marker.count || marker.riskRating || 'N/A'}
                  </Tooltip>
                </CircleMarker>
              )
            )}
        </MapContainer>
      </div>
      <div style={{ marginTop: '10px', fontSize: '12px', color: '#666', display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center' }}>
          <span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#ff0000', borderRadius: '50%', marginRight: '5px' }}></span>
          High Risk / Critical
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center' }}>
          <span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#ffaa00', borderRadius: '50%', marginRight: '5px' }}></span>
          Medium Risk / High
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center' }}>
          <span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#ffff00', borderRadius: '50%', marginRight: '5px' }}></span>
          Medium
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center' }}>
          <span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#00c851', borderRadius: '50%', marginRight: '5px' }}></span>
          Low Risk
        </span>
        {!hasData && (
          <span style={{ display: 'inline-flex', alignItems: 'center' }}>
            <span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#6366f1', borderRadius: '50%', marginRight: '5px' }}></span>
            State Location
          </span>
        )}
        {type === 'submissions' && hasData && (
          <span style={{ display: 'inline-flex', alignItems: 'center', maxWidth: '480px' }}>
            <span style={{ marginRight: '6px' }} aria-hidden>
              📍
            </span>
            Each pin is one incident (state centroid with offset). Open popup for narrative.
          </span>
        )}
      </div>
    </div>
  )
}

export default MapView
