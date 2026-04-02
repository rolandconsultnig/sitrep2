import React, { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.heat'

// Nigeria state coordinates
const NIGERIA_STATE_COORDS = {
  "Abia": [5.4527, 7.5248],
  "Adamawa": [9.3265, 12.3984],
  "Akwa Ibom": [5.0377, 7.9128],
  "Anambra": [6.2209, 7.0675],
  "Bauchi": [10.3158, 9.8442],
  "Bayelsa": [4.7719, 6.0699],
  "Benue": [7.3369, 8.7404],
  "Borno": [11.8333, 13.1510],
  "Cross River": [5.9631, 8.3300],
  "Delta": [5.7040, 5.9339],
  "Ebonyi": [6.2649, 8.0137],
  "Edo": [6.6342, 5.9304],
  "Ekiti": [7.7190, 5.3110],
  "Enugu": [6.5364, 7.4356],
  "FCT": [9.0765, 7.3986],
  "Gombe": [10.2897, 11.1673],
  "Imo": [5.5720, 7.0588],
  "Jigawa": [12.2280, 9.5616],
  "Kaduna": [10.5222, 7.4383],
  "Kano": [12.0022, 8.5920],
  "Katsina": [13.0059, 7.6000],
  "Kebbi": [12.4539, 4.1994],
  "Kogi": [7.7337, 6.6906],
  "Kwara": [8.9669, 4.3874],
  "Lagos": [6.5244, 3.3792],
  "Nasarawa": [8.5380, 8.3220],
  "Niger": [9.9309, 5.5983],
  "Ogun": [7.1608, 3.3500],
  "Ondo": [7.2500, 5.1931],
  "Osun": [7.5629, 4.5200],
  "Oyo": [7.8500, 3.9333],
  "Plateau": [9.2182, 9.5175],
  "Rivers": [4.8581, 6.9209],
  "Sokoto": [13.0533, 5.2476],
  "Taraba": [7.9994, 10.7740],
  "Yobe": [12.2939, 11.4390],
  "Zamfara": [12.1222, 6.2236]
}

// Heat map layer component
function HeatLayer({ points, options }) {
  const map = useMap()
  
  useEffect(() => {
    if (!points || points.length === 0) return
    
    const heat = L.heatLayer(points, {
      radius: options?.radius || 35,
      blur: options?.blur || 25,
      maxZoom: options?.maxZoom || 10,
      max: options?.max || 1.0,
      gradient: options?.gradient || {
        0.0: '#00ff00',
        0.25: '#80ff00',
        0.5: '#ffff00',
        0.75: '#ff8000',
        1.0: '#ff0000'
      }
    })
    
    heat.addTo(map)
    
    return () => {
      map.removeLayer(heat)
    }
  }, [map, points, options])
  
  return null
}

function HeatMapView({ data, title = 'Incident Heat Map' }) {
  const center = [9.0820, 8.6753]
  const zoom = 6
  const nigeriaBounds = [[4.2, 2.6], [13.9, 14.7]]
  
  // Convert data to heat map points [lat, lng, intensity]
  const heatPoints = useMemo(() => {
    if (!data || data.length === 0) {
      // Return default points for all states with low intensity
      return Object.values(NIGERIA_STATE_COORDS).map(coords => [...coords, 0.1])
    }
    
    // Aggregate by state
    const stateData = {}
    data.forEach(item => {
      const state = item.state
      if (!stateData[state]) {
        stateData[state] = { count: 0, severity: 0 }
      }
      stateData[state].count += 1
      // Add severity weight
      if (item.severity === 'Critical') stateData[state].severity += 4
      else if (item.severity === 'High') stateData[state].severity += 3
      else if (item.severity === 'Medium') stateData[state].severity += 2
      else stateData[state].severity += 1
    })
    
    // Find max for normalization
    const maxCount = Math.max(...Object.values(stateData).map(s => s.count), 1)
    
    // Generate heat points
    const points = []
    Object.entries(stateData).forEach(([state, info]) => {
      const coords = NIGERIA_STATE_COORDS[state]
      if (coords) {
        const intensity = Math.min(info.count / maxCount + (info.severity / (info.count * 4)) * 0.3, 1)
        points.push([coords[0], coords[1], intensity])
      }
    })
    
    return points
  }, [data])
  
  // Calculate statistics
  const stats = useMemo(() => {
    if (!data || data.length === 0) return { total: 0, critical: 0, high: 0, states: 0 }
    
    const uniqueStates = new Set(data.map(d => d.state))
    return {
      total: data.length,
      critical: data.filter(d => d.severity === 'Critical').length,
      high: data.filter(d => d.severity === 'High').length,
      states: uniqueStates.size
    }
  }, [data])

  return (
    <div className="card" style={{ marginBottom: '1.25rem' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <h2 style={{ margin: 0, borderBottom: 'none', paddingBottom: 0, fontSize: '1.05rem', color: 'var(--text-primary)' }}>🔥 {title}</h2>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--green-primary)' }}>{stats.total}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Incidents</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--red-alert)' }}>{stats.critical}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Critical</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--amber-alert)' }}>{stats.high}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>High</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--green-medium)' }}>{stats.states}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>States Affected</div>
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px', 
        marginBottom: '15px',
        padding: '10px 15px',
        background: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)',
        borderRadius: '8px'
      }}>
        <span style={{ fontSize: '13px', fontWeight: '600', color: '#004d00' }}>Intensity:</span>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center',
          background: 'linear-gradient(to right, #00ff00, #80ff00, #ffff00, #ff8000, #ff0000)',
          width: '200px',
          height: '12px',
          borderRadius: '6px'
        }} />
        <span style={{ fontSize: '12px', color: '#666' }}>Low</span>
        <span style={{ fontSize: '12px', color: '#666', marginLeft: 'auto' }}>High</span>
      </div>
      
      <div style={{ 
        height: '500px', 
        width: '100%', 
        borderRadius: '12px', 
        overflow: 'hidden', 
        border: '2px solid #90EE90'
      }}>
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
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <HeatLayer 
            points={heatPoints}
            options={{
              radius: 40,
              blur: 30,
              maxZoom: 10,
              max: 1.0
            }}
          />
        </MapContainer>
      </div>
    </div>
  )
}

export default HeatMapView
