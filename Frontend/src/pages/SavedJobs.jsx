import { Bookmark, CheckCheck, Download, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { JobCard } from '../components/jobs/JobCard.jsx'
import { useJobs } from '../hooks/useJobs.js'
import { platforms as platformConfigs } from '../data/platforms.js'

const tabs = [
  { id: 'saved', label: 'Saved' },
  { id: 'applied', label: 'Applied' },
  { id: 'interviews', label: 'Interviews' },
  { id: 'offers', label: 'Offers' },
  { id: 'rejected', label: 'Rejected' },
]

const platformLabelMap = platformConfigs.reduce((accumulator, platform) => {
  accumulator[platform.id] = platform.name
  return accumulator
}, {})

function getTabForJob(job) {
  switch (job.stage) {
    case 'applied':
      return 'applied'
    case 'interview':
      return 'interviews'
    case 'offer':
      return 'offers'
    case 'rejected':
      return 'rejected'
    default:
      return 'saved'
  }
}

function buildCardJob(job) {
  return {
    ...job,
    platform: platformLabelMap[job.platformId] ?? job.platformId,
    isRemote: job.remote,
    isSaved: true,
    isNew: job.stage === 'new',
    source: job.platformId,
    postedAt: `${job.postedMinutesAgo}m ago`,
    logoUrl: job.logoUrl,
    jobUrl: job.sourceUrl,
  }
}

function exportJobsCsv(jobs) {
  const rows = [
    ['Title', 'Company', 'Stage', 'Location', 'Salary', 'Platform'],
    ...jobs.map((job) => [
      job.title,
      job.company,
      job.stage,
      job.location,
      job.salary,
      platformLabelMap[job.platformId] ?? job.platformId,
    ]),
  ]

  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(','))
    .join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `saved-jobs-${new Date().toISOString().slice(0, 10)}.csv`
  anchor.click()
  URL.revokeObjectURL(url)
}

function EmptyState() {
  return (
    <div className="rounded-[1.75rem] border border-dashed border-border bg-[#111118] px-6 py-14 text-center shadow-card-glow">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-border bg-card text-secondary">
        <Bookmark className="h-9 w-9" />
      </div>
      <div className="mt-6 font-display text-2xl text-text-primary">No saved jobs yet. Start exploring →</div>
      <p className="mx-auto mt-2 max-w-xl text-sm text-text-muted">
        Shortlist jobs from the feed, track the ones worth revisiting, and move them into the pipeline when you are ready.
      </p>

      <div className="mt-10 flex items-end justify-center gap-4">
        <div className="h-24 w-28 rounded-[1.5rem] border border-border bg-card p-3 shadow-card-glow">
          <div className="h-3 w-16 rounded-full bg-surface" />
          <div className="mt-3 h-3 w-20 rounded-full bg-surface" />
          <div className="mt-4 h-8 rounded-2xl bg-gradient-to-r from-primary/30 to-secondary/30" />
        </div>
        <div className="mb-5 h-16 w-20 -rotate-6 rounded-[1.25rem] border border-border bg-card/80 p-3 opacity-80">
          <div className="h-3 w-10 rounded-full bg-surface" />
          <div className="mt-3 h-3 w-12 rounded-full bg-surface" />
        </div>
        <div className="mb-2 h-20 w-24 rotate-6 rounded-[1.4rem] border border-border bg-card/80 p-3 opacity-90">
          <div className="h-3 w-14 rounded-full bg-surface" />
          <div className="mt-3 h-3 w-10 rounded-full bg-surface" />
        </div>
      </div>
    </div>
  )
}

export default function SavedJobs() {
  const { savedJobObjects, toggleSavedJob, setSelectedJob, markJobStage } = useJobs({ pageSize: 1000 })
  const [activeTab, setActiveTab] = useState('saved')
  const [selectedIds, setSelectedIds] = useState([])

  const tabCounts = useMemo(
    () =>
      tabs.reduce((accumulator, tab) => {
        accumulator[tab.id] = savedJobObjects.filter((job) => getTabForJob(job) === tab.id).length
        return accumulator
      }, {}),
    [savedJobObjects],
  )

  const visibleJobs = useMemo(
    () => savedJobObjects.filter((job) => getTabForJob(job) === activeTab),
    [activeTab, savedJobObjects],
  )

  const selectedJobs = useMemo(
    () => visibleJobs.filter((job) => selectedIds.includes(job.id)),
    [selectedIds, visibleJobs],
  )

  const toggleSelection = (jobId) => {
    setSelectedIds((current) =>
      current.includes(jobId) ? current.filter((id) => id !== jobId) : [...current, jobId],
    )
  }

  const clearSelection = () => setSelectedIds([])

  const handleDelete = () => {
    selectedIds.forEach((jobId) => toggleSavedJob(jobId))
    clearSelection()
  }

  const handleMoveToApplied = () => {
    selectedIds.forEach((jobId) => markJobStage(jobId, 'applied'))
    clearSelection()
  }

  const handleExportCsv = () => {
    exportJobsCsv(selectedJobs)
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[1.75rem] border border-border bg-surface/90 p-6 shadow-card-glow">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="font-display text-3xl text-text-primary">Saved Jobs</div>
            <p className="mt-2 max-w-2xl text-sm text-text-muted">
              Keep the jobs you want to revisit, sort them by funnel stage, and bulk move them into the application pipeline.
            </p>
          </div>

          <div className="rounded-full border border-border bg-[#111118] px-4 py-2 text-sm text-text-muted">
            {savedJobObjects.length} saved total
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const active = tab.id === activeTab

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id)
                  setSelectedIds([])
                }}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
                  active
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-border bg-[#111118] text-text-muted hover:border-primary/30 hover:text-text-primary'
                }`}
              >
                <span>{tab.label}</span>
                <span className="rounded-full border border-border bg-background px-2 py-0.5 font-mono text-[11px] text-text-muted">
                  {tabCounts[tab.id] ?? 0}
                </span>
              </button>
            )
          })}
        </div>

        {selectedIds.length > 0 ? (
          <div className="mt-5 flex flex-col gap-3 rounded-3xl border border-secondary/20 bg-secondary/10 p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 text-sm text-secondary">
              <CheckCheck className="h-4 w-4" />
              {selectedIds.length} selected
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center gap-2 rounded-2xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger transition hover:bg-danger/15"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
              <button
                type="button"
                onClick={handleMoveToApplied}
                className="inline-flex items-center gap-2 rounded-2xl border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary transition hover:bg-primary/15"
              >
                Move to Applied
              </button>
              <button
                type="button"
                onClick={handleExportCsv}
                className="inline-flex items-center gap-2 rounded-2xl border border-border bg-[#111118] px-3 py-2 text-sm text-text-primary transition hover:border-primary/30 hover:bg-white/5"
              >
                <Download className="h-4 w-4" /> Export CSV
              </button>
            </div>
          </div>
        ) : null}

        {savedJobObjects.length === 0 ? (
          <div className="mt-6">
            <EmptyState />
          </div>
        ) : visibleJobs.length === 0 ? (
          <div className="mt-6 rounded-[1.75rem] border border-dashed border-border bg-[#111118] px-6 py-10 text-center text-sm text-text-muted">
            No jobs in this tab yet.
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleJobs.map((job) => {
              const selected = selectedIds.includes(job.id)

              return (
                <div key={job.id} className="relative">
                  <button
                    type="button"
                    onClick={() => toggleSelection(job.id)}
                    className={`absolute left-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full border transition ${
                      selected
                        ? 'border-primary bg-primary text-background'
                        : 'border-border bg-card text-text-muted hover:border-primary/40 hover:text-text-primary'
                    }`}
                    aria-label={selected ? 'Deselect job' : 'Select job'}
                  >
                    {selected ? <CheckCheck className="h-4 w-4" /> : <span className="h-2.5 w-2.5 rounded-full bg-current" />}
                  </button>

                  <JobCard
                    job={buildCardJob(job)}
                    variant="grid"
                    onBookmarkToggle={() => toggleSavedJob(job.id)}
                    onQuickView={() => setSelectedJob(job)}
                    className={`h-full ${selected ? 'ring-2 ring-primary/40' : ''}`}
                  />
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}