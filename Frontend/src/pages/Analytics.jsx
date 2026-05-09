import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Component, useEffect, useMemo, useRef, useState } from 'react'
import { useJobs } from '../hooks/useJobs.js'
import { useSourceStore } from '../store/sourceStore.js'

const GRID_COLOR = '#E5E7EB'
const AXIS_COLOR = '#6B7280'
const PALETTE = ['#8b5cf6', '#10b981', '#6366f1', '#f59e0b', '#06b6d4', '#ec4899', '#14b8a6', '#a855f7']

const RANGE_OPTIONS = [
  { id: '7d', label: '7d', days: 7 },
  { id: '30d', label: '30d', days: 30 },
  { id: '90d', label: '90d', days: 90 },
  { id: 'custom', label: 'Custom', days: 45 },
]

const HOUR_LABELS = ['12a', '4a', '8a', '12p', '4p', '8p']
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function hashSeed(value) {
  return [...String(value)].reduce((accumulator, char) => accumulator + char.charCodeAt(0), 0)
}

function formatShortDate(date) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date)
}

function formatLongDate(date) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

function getSalaryMidpoint(salary) {
  const values = salary.match(/\d+/g)?.map((value) => Number.parseInt(value, 10)) ?? []

  if (values.length === 0) {
    return 0
  }

  return values.length === 1 ? values[0] : Math.round((values[0] + values[1]) / 2)
}

function getLocationType(job) {
  const seed = hashSeed(job.id)

  if (job.remote || seed % 7 === 0) {
    return 'Remote'
  }

  if (seed % 5 === 0) {
    return 'Hybrid'
  }

  return 'Onsite'
}

function valueToHeatColor(value, maxValue) {
  if (value === 0) {
    return '#F3F4F6'
  }

  const ratio = maxValue === 0 ? 0 : value / maxValue

  if (ratio < 0.25) return '#EDE9FE'
  if (ratio < 0.5) return '#C4B5FD'
  if (ratio < 0.75) return '#8B5CF6'

  return '#6D28D9'
}

function ChartCard({ title, description, children, className = '', action }) {
  return (
    <section className={`rounded-[1.75rem] border border-border bg-surface p-5 shadow-card-glow ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-xl text-text-primary">{title}</h2>
          <p className="mt-1 text-sm text-text-muted">{description}</p>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  )
}

function ChartTooltip({ active, label, payload }) {
  if (!active || !payload?.length) {
    return null
  }

  return (
    <div className="rounded-2xl border border-border bg-surface px-3 py-2 shadow-card-glow">
      <div className="font-mono text-xs text-text-muted">{label}</div>
      <div className="mt-2 space-y-1 font-mono text-sm text-text-primary">
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span>{entry.name ?? entry.dataKey}: {entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function LegendDots({ payload }) {
  if (!payload?.length) {
    return null
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-mono text-text-muted">
      {payload.map((entry) => (
        <div key={entry.value} className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span>{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

function PillToggle({ options, value, onChange }) {
  return (
    <div className="inline-flex flex-wrap gap-2 rounded-full border border-border bg-surface p-1">
      {options.map((option) => {
        const active = option.id === value

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              active ? 'bg-primary text-background shadow-md shadow-primary/20' : 'text-text-muted hover:bg-gray-100 hover:text-text-primary'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

function StatChip({ label, value, accent }) {
  return (
    <div className="rounded-2xl border border-border bg-gray-50 px-4 py-3">
      <div className="text-xs font-mono text-text-muted">{label}</div>
      <div className="mt-1 flex items-baseline gap-2">
        <div className="font-display text-2xl text-text-primary">{value}</div>
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: accent }} />
      </div>
    </div>
  )
}

function tokenizeSkills(jobs) {
  return jobs.flatMap((job) => job.skills ?? [])
}

class ChartErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false })
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full min-h-[220px] items-center justify-center rounded-2xl border border-border bg-card/50 text-sm text-text-muted">
          Chart temporarily unavailable.
        </div>
      )
    }

    return this.props.children
  }
}

function SafeChartContainer({ className = '', minHeight = 220, children, resetKey }) {
  const ref = useRef(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!ref.current) {
      return undefined
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const { width, height } = entry.contentRect
      setReady(width > 0 && height > 0)
    })

    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className={`min-w-0 ${className}`} style={{ minHeight }}>
      <ChartErrorBoundary resetKey={resetKey}>
        {ready ? children : <div className="h-full min-h-[220px] rounded-2xl border border-border bg-card/40" />}
      </ChartErrorBoundary>
    </div>
  )
}

export default function Analytics() {
  const { jobs } = useJobs({ pageSize: 1000 })
  const sources = useSourceStore((state) => state.sources)
  const [rangeId, setRangeId] = useState('30d')

  const analytics = useMemo(() => {
    const days = RANGE_OPTIONS.find((option) => option.id === rangeId)?.days ?? 30
    const platformMap = new Map(sources.map((source, index) => [source.id, { ...source, color: source.color ?? PALETTE[index % PALETTE.length] }]))
    const activePlatforms = sources.filter((source) => jobs.some((job) => job.platformId === source.id))
    const dateAxis = Array.from({ length: days }, (_, index) => {
      const date = new Date()
      date.setDate(date.getDate() - (days - 1 - index))
      return {
        label: formatShortDate(date),
        fullLabel: formatLongDate(date),
      }
    })

    const lineSeries = dateAxis.map((entry) => ({
      ...entry,
      total: 0,
      ...Object.fromEntries(activePlatforms.map((platform) => [platform.name, 0])),
    }))

    jobs.forEach((job) => {
      const platform = platformMap.get(job.platformId)
      if (!platform) {
        return
      }

      const seed = hashSeed(`${job.id}-${job.company}-${job.title}`)
      const dayIndex = seed % days
      lineSeries[dayIndex][platform.name] += 1
      lineSeries[dayIndex].total += 1
    })

    const platformCounts = activePlatforms
      .map((platform) => ({
        name: platform.name,
        value: jobs.filter((job) => job.platformId === platform.id).length,
        color: platform.color ?? PALETTE[0],
      }))
      .filter((item) => item.value > 0)
      .sort((left, right) => right.value - left.value)

    const titleCounts = Object.entries(
      jobs.reduce((accumulator, job) => {
        accumulator[job.title] = (accumulator[job.title] ?? 0) + 1
        return accumulator
      }, {}),
    )
      .map(([name, value]) => ({ name, value }))
      .sort((left, right) => right.value - left.value)
      .slice(0, 8)

    const companyCounts = Object.entries(
      jobs.reduce((accumulator, job) => {
        accumulator[job.company] = (accumulator[job.company] ?? 0) + 1
        return accumulator
      }, {}),
    )
      .map(([name, value]) => ({ name, value }))
      .sort((left, right) => right.value - left.value)
      .slice(0, 8)

    const skillCounts = Object.entries(
      tokenizeSkills(jobs).reduce((accumulator, skill) => {
        accumulator[skill] = (accumulator[skill] ?? 0) + 1
        return accumulator
      }, {}),
    )
      .map(([name, value]) => ({ name, value }))
      .sort((left, right) => right.value - left.value)
      .slice(0, 16)

    const heatmap = Array.from({ length: 7 }, (_, dayIndex) =>
      Array.from({ length: HOUR_LABELS.length }, (_, hourIndex) => ({
        dayIndex,
        hourIndex,
        day: DAY_LABELS[dayIndex],
        hour: HOUR_LABELS[hourIndex],
        value: 0,
      })),
    )

    jobs.forEach((job) => {
      const seed = hashSeed(job.id)
      const dayIndex = seed % 7
      const hourIndex = Math.floor(seed / 7) % HOUR_LABELS.length
      heatmap[dayIndex][hourIndex].value += 1
    })

    const flattenedHeatmap = heatmap.flat()
    const maxHeatmapValue = Math.max(...flattenedHeatmap.map((cell) => cell.value), 1)

    const salaryHistogram = [0, 0, 0, 0, 0, 0, 0]
    jobs.forEach((job) => {
      const midpoint = getSalaryMidpoint(job.salary)
      const bucket = Math.min(salaryHistogram.length - 1, Math.max(0, Math.floor(midpoint / 10) - 1))
      salaryHistogram[bucket] += 1
    })

    const salaryBins = salaryHistogram.map((value, index) => {
      const lower = index * 10
      const upper = index === salaryHistogram.length - 1 ? '70+' : `${lower + 10}`
      return {
        range: index === salaryHistogram.length - 1 ? `70L+` : `${lower}L-${upper}L`,
        value,
      }
    })

    const locationMix = jobs.reduce(
      (accumulator, job) => {
        const type = getLocationType(job)
        accumulator[type] += 1
        return accumulator
      },
      { Remote: 0, Hybrid: 0, Onsite: 0 },
    )

    const locationPie = Object.entries(locationMix).map(([name, value], index) => ({
      name,
      value,
      color: [PALETTE[1], PALETTE[2], PALETTE[0]][index],
    }))

    return {
      days,
      activePlatforms,
      lineSeries,
      platformCounts,
      titleCounts,
      companyCounts,
      skillCounts,
      heatmap,
      maxHeatmapValue,
      salaryBins,
      locationPie,
    }
  }, [jobs, rangeId, sources])

  const totalJobs = jobs.length
  const remoteJobs = jobs.filter((job) => job.remote).length
  const uniqueSkills = new Set(tokenizeSkills(jobs)).size
  const activeSources = sources.filter((source) => source.enabled).length

  return (
    <div className="space-y-6">
      <section className="rounded-[1.75rem] border border-border bg-surface/90 p-6 shadow-card-glow">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="font-display text-3xl text-text-primary">Market Insights</div>
            <p className="mt-2 max-w-2xl text-sm text-text-muted">
              Track platform coverage, hiring intensity, compensation bands, and skills demand across the live mock job market.
            </p>
          </div>

          <PillToggle options={RANGE_OPTIONS} value={rangeId} onChange={setRangeId} />
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <StatChip label="Jobs indexed" value={totalJobs} accent="#8b5cf6" />
          <StatChip label="Remote roles" value={remoteJobs} accent="#34d399" />
          <StatChip label="Unique skills" value={uniqueSkills} accent="#6366f1" />
          <StatChip label="Active sources" value={activeSources} accent="#f59e0b" />
        </div>
      </section>

      <ChartCard title="Jobs Found Over Time" description="Multi-line volume by platform across the selected date range." className="overflow-hidden" >
        <SafeChartContainer className="h-96 rounded-3xl border border-border bg-surface p-4" minHeight={300} resetKey={`line-${rangeId}`}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={280} debounce={80}>
            <LineChart data={analytics.lineSeries} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={GRID_COLOR} strokeDasharray="4 6" />
              <XAxis dataKey="label" tick={{ fill: AXIS_COLOR, fontSize: 11, fontFamily: 'var(--font-mono)' }} axisLine={{ stroke: GRID_COLOR }} tickLine={false} />
              <YAxis tick={{ fill: AXIS_COLOR, fontSize: 11, fontFamily: 'var(--font-mono)' }} axisLine={{ stroke: GRID_COLOR }} tickLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Legend content={<LegendDots />} />
              {analytics.activePlatforms.map((platform, index) => (
                <Line
                  key={platform.id}
                  type="monotone"
                  dataKey={platform.name}
                  name={platform.name}
                  stroke={platform.color ?? PALETTE[index % PALETTE.length]}
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 5 }}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </SafeChartContainer>
      </ChartCard>

      <div className="grid gap-6 xl:grid-cols-3">
        <ChartCard title="Jobs by Platform" description="Color-coded market share for each source.">
          <SafeChartContainer className="h-[21rem] rounded-3xl border border-border bg-surface p-4" minHeight={280} resetKey={`platform-${rangeId}`}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={280} debounce={80}>
              <PieChart>
                <Tooltip content={<ChartTooltip />} />
                <Legend content={<LegendDots />} />
                <Pie
                  data={analytics.platformCounts}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={3}
                  stroke="none"
                  isAnimationActive={false}
                >
                  {analytics.platformCounts.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </SafeChartContainer>
        </ChartCard>

        <ChartCard title="Top Job Titles" description="Horizontal bars ranked by frequency.">
          <SafeChartContainer className="h-[21rem] rounded-3xl border border-border bg-surface p-4" minHeight={280} resetKey={`titles-${rangeId}`}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={280} debounce={80}>
              <BarChart data={analytics.titleCounts} layout="vertical" margin={{ top: 6, right: 18, left: 18, bottom: 6 }}>
                <CartesianGrid stroke={GRID_COLOR} strokeDasharray="4 6" horizontal={false} />
                <XAxis type="number" tick={{ fill: AXIS_COLOR, fontSize: 11, fontFamily: 'var(--font-mono)' }} axisLine={{ stroke: GRID_COLOR }} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fill: AXIS_COLOR, fontSize: 11, fontFamily: 'var(--font-mono)' }} axisLine={{ stroke: GRID_COLOR }} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Legend content={<LegendDots />} />
                <Bar dataKey="value" name="Jobs" radius={[0, 12, 12, 0]} isAnimationActive={false}>
                  {analytics.titleCounts.map((entry, index) => (
                    <Cell key={entry.name} fill={PALETTE[index % PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </SafeChartContainer>
        </ChartCard>

        <ChartCard title="Top Companies Hiring" description="Which employers appear most often in the feed.">
          <SafeChartContainer className="h-[21rem] rounded-3xl border border-border bg-surface p-4" minHeight={280} resetKey={`companies-${rangeId}`}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={280} debounce={80}>
              <BarChart data={analytics.companyCounts} layout="vertical" margin={{ top: 6, right: 18, left: 18, bottom: 6 }}>
                <CartesianGrid stroke={GRID_COLOR} strokeDasharray="4 6" horizontal={false} />
                <XAxis type="number" tick={{ fill: AXIS_COLOR, fontSize: 11, fontFamily: 'var(--font-mono)' }} axisLine={{ stroke: GRID_COLOR }} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fill: AXIS_COLOR, fontSize: 11, fontFamily: 'var(--font-mono)' }} axisLine={{ stroke: GRID_COLOR }} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Legend content={<LegendDots />} />
                <Bar dataKey="value" name="Jobs" radius={[0, 12, 12, 0]} isAnimationActive={false}>
                  {analytics.companyCounts.map((entry, index) => (
                    <Cell key={entry.name} fill={PALETTE[(index + 2) % PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </SafeChartContainer>
        </ChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <ChartCard title="Top Skills in Demand" description="Word-cloud style emphasis using scaled font sizes in violet shades.">
          <div className="min-h-[22rem] rounded-3xl border border-border bg-surface p-5">
            <div className="flex min-h-72 flex-wrap content-center gap-3">
              {analytics.skillCounts.map((skill, index) => {
                const minFont = 14
                const maxFont = 34
                const highest = Math.max(...analytics.skillCounts.map((entry) => entry.value), 1)
                const size = minFont + ((skill.value - 1) / Math.max(highest - 1, 1)) * (maxFont - minFont)
                const violetTones = ['#4c1d95', '#5b21b6', '#6d28d9', '#7c3aed', '#8b5cf6']

                return (
                  <button
                    key={skill.name}
                    type="button"
                    className="rounded-full border border-border bg-card px-3 py-2 text-left transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-gray-100"
                    title={`${skill.name}: ${skill.value}`}
                    style={{ fontSize: `${size}px`, color: violetTones[index % violetTones.length] }}
                  >
                    <span className="font-display leading-none">{skill.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </ChartCard>

        <ChartCard title="Jobs Posted by Day/Hour" description="Heatmap of posting pressure across the week, similar to a contribution graph.">
          <div className="rounded-3xl border border-border bg-surface p-5">
            <div className="mb-4 flex items-center justify-between gap-3 text-xs font-mono text-text-muted">
              <span>Day of week</span>
              <div className="flex items-center gap-2">
                {['low', 'mid', 'high'].map((label, index) => (
                  <div key={label} className="flex items-center gap-1">
                    <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: [valueToHeatColor(0, 1), '#C4B5FD', '#5B21B6'][index] }} />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-[auto_repeat(6,minmax(0,1fr))] gap-2">
              <div />
              {HOUR_LABELS.map((hour) => (
                <div key={hour} className="px-1 pb-2 text-center font-mono text-[11px] text-text-muted">
                  {hour}
                </div>
              ))}

              {analytics.heatmap.map((row) => (
                <div key={row[0].day} className="contents">
                  <div className="flex items-center pr-2 font-mono text-[11px] text-text-muted">
                    {row[0].day}
                  </div>
                  {row.map((cell) => (
                    <button
                      key={`${cell.day}-${cell.hour}`}
                      type="button"
                      title={`${cell.day} ${cell.hour}: ${cell.value} jobs`}
                      className="aspect-square rounded-md border border-border transition hover:scale-[1.04]"
                      style={{ backgroundColor: valueToHeatColor(cell.value, analytics.maxHeatmapValue) }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Salary Distribution" description="Histogram of salary bands from the current feed.">
          <SafeChartContainer className="h-[22rem] rounded-3xl border border-border bg-surface p-4" minHeight={300} resetKey={`salary-${rangeId}`}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={300} debounce={80}>
              <BarChart data={analytics.salaryBins} margin={{ top: 6, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={GRID_COLOR} strokeDasharray="4 6" />
                <XAxis dataKey="range" tick={{ fill: AXIS_COLOR, fontSize: 11, fontFamily: 'var(--font-mono)' }} axisLine={{ stroke: GRID_COLOR }} tickLine={false} />
                <YAxis tick={{ fill: AXIS_COLOR, fontSize: 11, fontFamily: 'var(--font-mono)' }} axisLine={{ stroke: GRID_COLOR }} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Legend content={<LegendDots />} />
                <Bar dataKey="value" name="Jobs" radius={[12, 12, 0, 0]} isAnimationActive={false}>
                  {analytics.salaryBins.map((entry, index) => (
                    <Cell key={entry.range} fill={PALETTE[(index + 1) % PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </SafeChartContainer>
        </ChartCard>

        <ChartCard title="Remote vs Onsite vs Hybrid" description="Location mix inferred from the current job set.">
          <SafeChartContainer className="h-[22rem] rounded-3xl border border-border bg-surface p-4" minHeight={300} resetKey={`mix-${rangeId}`}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={300} debounce={80}>
              <PieChart>
                <Tooltip content={<ChartTooltip />} />
                <Legend content={<LegendDots />} />
                <Pie
                  data={analytics.locationPie}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={95}
                  innerRadius={42}
                  stroke="none"
                  paddingAngle={3}
                  isAnimationActive={false}
                >
                  {analytics.locationPie.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </SafeChartContainer>
        </ChartCard>
      </div>
    </div>
  )
}