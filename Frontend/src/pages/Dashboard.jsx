import { Bookmark, CheckCircle2, TrendingUp } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { useJobs } from '../hooks/useJobs.js'
import { useSourceStore } from '../store/sourceStore.js'
import { useUIStore } from '../store/uiStore.js'

const platformColors = {
  linkedin: '#4f8cff',
  naukri: '#ff5f6d',
  indeed: '#7c6cff',
  google: '#34d399',
  microsoft: '#22d3ee',
  tcs: '#f59e0b',
}

const activityFeed = [
  'HireRadar found 47 new React jobs on LinkedIn · 5m ago',
  'Fresh DevOps openings surfaced from Naukri · 11m ago',
  'Indeed posted 18 backend roles in Bangalore · 18m ago',
  'Google Careers added 6 machine learning roles · 31m ago',
  'Microsoft sync completed for Azure and AI roles · 42m ago',
]

function StatCard({ label, value, subtitle, icon, accent = 'border-primary' }) {
  return (
    <div className={`rounded-3xl border border-border border-l-4 ${accent} bg-card p-5 shadow-card-glow`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-display text-4xl leading-none text-text-primary">{value}</div>
          <div className="mt-3 font-mono text-xs uppercase tracking-[0.22em] text-text-muted">{label}</div>
          <div className="mt-2 text-sm text-text-muted">{subtitle}</div>
        </div>
        {icon ? <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-background text-primary">{icon}</div> : null}
      </div>
    </div>
  )
}

function MiniJobCard({ job, isLast = false }) {
  const sourceLabel = job.platformId === 'linkedin' ? 'LinkedIn' : job.platformId === 'naukri' ? 'Naukri' : 'Indeed'
  const sourceTone =
    job.platformId === 'linkedin'
      ? 'border-blue-500/40 bg-blue-50 text-blue-600'
      : job.platformId === 'naukri'
        ? 'border-red-500/40 bg-red-50 text-red-600'
        : 'border-indigo-500/40 bg-indigo-50 text-indigo-600'

  return (
    <div className={`rounded-2xl border border-border bg-surface p-4 transition hover:border-primary/40 hover:bg-gray-50 ${!isLast ? 'mb-3' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-primary/80 to-secondary/70 text-xs font-semibold text-background">
          {job.company
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((word) => word[0]?.toUpperCase())
            .join('')}
        </div>

        <div className="min-w-0 flex-1">
          <div className="font-display text-sm font-semibold leading-tight text-primary">{job.title}</div>
          <div className="mt-1 text-xs text-text-muted">
            {job.company} · {job.location}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm text-secondary">{job.salary}</span>
            <span className={`rounded-full border px-2.5 py-1 text-[10px] font-medium ${sourceTone}`}>{sourceLabel}</span>
            <span className="font-mono text-[11px] text-text-muted">{Math.max(1, Math.round((Date.now() - job.postedMinutesAgo * 60 * 1000) / 60000))}m ago</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function SourceRow({ source }) {
  const isSyncing = source.status === 'syncing'
  const online = source.status === 'synced' || source.status === 'healthy' || source.status === 'online'

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface/90 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${isSyncing ? 'bg-secondary animate-pulse' : online ? 'bg-emerald-400' : 'bg-text-muted'}`} />
          <div className="truncate text-sm font-medium text-text-primary">{source.name}</div>
          <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] ${isSyncing ? 'border-secondary/30 bg-secondary/10 text-secondary' : 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'}`}>
            {isSyncing ? 'Syncing' : 'Online'}
          </span>
        </div>
        <div className="mt-1 text-xs text-text-muted">
          Last sync {source.lastSync} · {source.jobCount} jobs
        </div>
      </div>
    </div>
  )
}

function SafeChartContainer({ children }) {
  const ref = useRef(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!ref.current) return undefined
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
    <div ref={ref} className="mt-5 h-64 w-full min-w-0">
      {ready ? children : <div className="h-full rounded-2xl border border-border bg-card/40" />}
    </div>
  )
}

export default function Dashboard() {
  const { jobs, savedJobs } = useJobs()
  const sources = useSourceStore((state) => state.sources)
  const setActivePage = useUIStore((state) => state.setActivePage)

  const stats = useMemo(
    () => [
      {
        label: 'Total Jobs Found',
        value: jobs.length,
        subtitle: 'across all platforms',
        icon: <TrendingUp className="h-4 w-4 text-secondary" />,
      },
      {
        label: 'New Today',
        value: jobs.filter((job) => job.stage === 'new').length,
        subtitle: 'fresh opportunities',
        icon: <span className="h-3 w-3 rounded-full bg-secondary shadow-[0_0_0_6px_rgba(0,217,163,0.12)] animate-pulse" />,
      },
      {
        label: 'Applied',
        value: jobs.filter((job) => job.stage === 'applied').length,
        subtitle: 'applications tracked',
        icon: <CheckCircle2 className="h-4 w-4 text-secondary" />,
      },
      {
        label: 'Saved',
        value: savedJobs.length,
        subtitle: 'on your shortlist',
        icon: <Bookmark className="h-4 w-4 text-secondary" />,
      },
    ],
    [jobs, savedJobs.length],
  )

  const recentMatches = useMemo(() => jobs.slice(0, 5), [jobs])

  const donutData = useMemo(() => {
    const totals = jobs.reduce((accumulator, job) => {
      accumulator[job.platformId] = (accumulator[job.platformId] ?? 0) + 1
      return accumulator
    }, {})

    return Object.entries(totals).map(([platformId, value]) => ({
      name: platformId,
      value,
      color: platformColors[platformId] ?? '#6C63FF',
    }))
  }, [jobs])

  const sourceStatusRows = useMemo(
    () =>
      ['linkedin', 'naukri', 'indeed', 'google', 'microsoft', 'infosys', 'tcs'].map((sourceId) => {
        const fromStore = sources.find((source) => source.id === sourceId)
        const fallback =
          sourceId === 'infosys'
            ? { name: 'Infosys', lastSync: '24 min ago', jobCount: 18, status: 'online' }
            : sourceId === 'google'
              ? { name: 'Google Careers', lastSync: '8 min ago', jobCount: 5, status: 'online' }
              : sourceId === 'microsoft'
                ? { name: 'Microsoft', lastSync: 'Syncing now', jobCount: 4, status: 'syncing' }
                : sourceId === 'tcs'
                  ? { name: 'TCS', lastSync: '21 min ago', jobCount: 4, status: 'online' }
                  : null

        return fromStore
          ? {
              ...fromStore,
              name:
                sourceId === 'google' ? 'Google Careers' : sourceId === 'microsoft' ? 'Microsoft' : fromStore.name,
              status: sourceId === 'microsoft' ? 'syncing' : 'online',
            }
          : fallback
      }),
    [sources],
  )

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          const isPulse = stat.label === 'New Today'

          return (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              subtitle={stat.subtitle}
              icon={Icon}
              iconClassName={isPulse ? 'text-secondary' : stat.iconClassName}
            />
          )
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[60%_40%]">
        <div className="space-y-6">
          <div className="rounded-[1.75rem] border border-border bg-surface/90 p-6 shadow-card-glow">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="font-display text-2xl italic text-text-primary">Recent Matches</div>
                <p className="mt-1 text-sm text-text-muted">Newest opportunities surfaced by HireRadar.</p>
              </div>
              <button type="button" onClick={() => setActivePage('job-feed')} className="text-sm text-secondary transition hover:opacity-80">
                View all jobs →
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {recentMatches.map((job) => (
                <MiniJobCard key={job.id} job={job} />
              ))}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-border bg-surface/90 p-6 shadow-card-glow">
            <div className="font-display text-2xl text-text-primary">Activity feed</div>
            <div className="mt-5 space-y-3">
              {activityFeed.map((entry) => (
                <div key={entry} className="rounded-2xl border border-border bg-card px-4 py-3 font-mono text-xs text-text-muted">
                  {entry}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[1.75rem] border border-border bg-surface/90 p-6 shadow-card-glow">
            <div className="font-display text-2xl text-text-primary">Sources Status</div>
            <div className="mt-5 space-y-3">
              {sourceStatusRows.map((source) => (
                <SourceRow key={source.id ?? source.name} source={source} />
              ))}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-border bg-surface/90 p-6 shadow-card-glow">
            <div className="font-display text-2xl text-text-primary">Jobs by platform</div>
            <SafeChartContainer>
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220} debounce={80}>
                <PieChart>
                  <Pie
                    data={donutData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={70}
                    outerRadius={92}
                    paddingAngle={4}
                    stroke="none"
                    isAnimationActive={false}
                  >
                    {donutData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </SafeChartContainer>
            <div className="mt-4 flex flex-wrap gap-2">
              {donutData.map((entry) => (
                <span key={entry.name} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-text-muted">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                  {entry.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
