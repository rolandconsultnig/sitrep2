import React, { useMemo } from 'react'
import { format, subDays, eachDayOfInterval, parseISO, isValid } from 'date-fns'
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

function parseDate(raw) {
  if (!raw) return null
  const d = typeof raw === 'string' ? parseISO(raw) : new Date(raw)
  return isValid(d) ? d : null
}

/**
 * Timeline of submission counts from raw submissions (last N days).
 */
function SubmissionTimelineChart({ submissions, title, days = 14 }) {
  const chartData = useMemo(() => {
    const end = new Date()
    const start = subDays(end, days - 1)
    const dayKeys = eachDayOfInterval({ start, end }).map((d) => format(d, 'yyyy-MM-dd'))

    const buckets = {}
    dayKeys.forEach((k) => {
      buckets[k] = {
        key: k,
        label: format(parseISO(`${k}T12:00:00`), 'MMM d'),
        total: 0,
        critical: 0,
        high: 0,
      }
    })

    ;(submissions || []).forEach((s) => {
      const d = parseDate(s.report_date || s.created_at)
      if (!d) return
      const k = format(d, 'yyyy-MM-dd')
      if (!buckets[k]) return
      buckets[k].total += 1
      if (s.severity === 'Critical') buckets[k].critical += 1
      if (s.severity === 'High') buckets[k].high += 1
    })

    return dayKeys.map((k) => buckets[k])
  }, [submissions, days])

  if (!chartData.length) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        No submission timeline data
      </div>
    )
  }

  const hasActivity = chartData.some((d) => d.total > 0)
  if (!hasActivity) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        No incidents in the selected window — chart will populate as reports arrive.
      </div>
    )
  }

  return (
    <div>
      {title ? (
        <h3 style={{ marginBottom: '12px', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          {title}
        </h3>
      ) : null}
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="intelTimelineTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#008000" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#008000" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              borderRadius: 10,
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Area
            type="monotone"
            dataKey="total"
            name="All severities"
            stroke="#006400"
            strokeWidth={2}
            fill="url(#intelTimelineTotal)"
          />
          <Line
            type="monotone"
            dataKey="critical"
            name="Critical"
            stroke="#dc2626"
            strokeWidth={2}
            dot={{ r: 3, fill: '#dc2626' }}
          />
          <Line
            type="monotone"
            dataKey="high"
            name="High"
            stroke="#ea580c"
            strokeWidth={2}
            dot={{ r: 2, fill: '#ea580c' }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

export default SubmissionTimelineChart
