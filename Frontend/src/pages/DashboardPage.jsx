import { ArrowRight, Bookmark, Sparkles } from 'lucide-react'
import { useMemo } from 'react'
import { useJobs } from '../hooks/useJobs.js'
import { useSourceStore } from '../store/sourceStore.js'
import { useUIStore } from '../store/uiStore.js'

function MetricCard({ label, value, hint }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-card-glow">
      <div className="text-sm text-text-muted">{label}</div>
      <div className="mt-3 font-display text-3xl text-text-primary">{value}</div>
      <div className="mt-2 text-xs text-secondary">{hint}</div>
    </div>
  )
}

function JobRow({ job, isSaved, onSelect, onToggleSave }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full rounded-3xl border border-border bg-surface/80 p-4 text-left transition hover:border-primary/40 hover:bg-white/5"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-text-primary">{job.title}</div>
          <div className="mt-1 text-xs text-text-muted">
            {job.company} · {job.location} · {job.experience}
          </div>
        </div>
        <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs text-primary">
          {job.matchScore}% match
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 text-xs text-text-muted">
        <span>{job.salary}</span>
        <span>{job.skills.slice(0, 3).join(' · ')}</span>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <span className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-text-muted">
          {job.platformId}
        </span>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onToggleSave(job.id)
          }}
          className="ml-auto rounded-full border border-border px-3 py-1.5 text-xs text-text-muted transition hover:border-primary/40 hover:text-text-primary"
        >
          {isSaved ? 'Saved' : 'Save job'}
        </button>
      </div>
    </button>
  )
}

export default function DashboardPage() {
  const { filteredJobs, savedJobObjects, selectedJob, setSelectedJob, toggleSavedJob } = useJobs({ pageSize: 6 })
  const sources = useSourceStore((state) => state.sources)
  const setActivePage = useUIStore((state) => state.setActivePage)

  const stats = useMemo(
    () => [
      { label: 'Active jobs', value: filteredJobs.length, hint: '+12% from last sync' },
      { label: 'Saved jobs', value: savedJobObjects.length, hint: 'Jobs on your shortlist' },
      { label: 'Connected sources', value: sources.length, hint: 'Scrapers online' },
      { label: 'Selected job', value: selectedJob?.matchScore ?? 0, hint: 'Match score on current focus' },
    ],
    [filteredJobs.length, savedJobObjects.length, selectedJob?.matchScore, sources.length],
  )

  const previewJobs = filteredJobs.slice(0, 6)

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <MetricCard key={stat.label} {...stat} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[1.75rem] border border-border bg-surface/90 p-6 shadow-card-glow">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <div className="font-display text-2xl text-text-primary">Live job stream</div>
              <p className="mt-1 text-sm text-text-muted">Recent matches pulled from the radar feed.</p>
            </div>
            <button
              type="button"
              onClick={() => setActivePage('job-feed')}
              className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2 text-sm text-text-primary transition hover:border-primary/40 hover:bg-white/5"
            >
              Open feed <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            {previewJobs.map((job) => (
              <JobRow
                key={job.id}
                job={job}
                isSaved={savedJobObjects.some((savedJob) => savedJob.id === job.id)}
                onSelect={() => setSelectedJob(job)}
                onToggleSave={toggleSavedJob}
              />
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[1.75rem] border border-border bg-surface/90 p-6 shadow-card-glow">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="font-display text-xl text-text-primary">Current focus</div>
                <p className="mt-1 text-sm text-text-muted">High-priority match surfaced by the scraper.</p>
              </div>
              <Sparkles className="h-5 w-5 text-secondary" />
            </div>

            {selectedJob ? (
              <div className="mt-5 space-y-4 rounded-3xl border border-border bg-card p-5">
                <div>
                  <div className="text-lg font-medium text-text-primary">{selectedJob.title}</div>
                  <div className="mt-1 text-sm text-text-muted">
                    {selectedJob.company} · {selectedJob.location}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {selectedJob.skills.map((skill) => (
                    <span key={skill} className="rounded-full border border-border bg-background px-3 py-1 text-xs text-text-muted">
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm text-text-muted">
                  <div className="rounded-2xl border border-border bg-background p-3">{selectedJob.salary}</div>
                  <div className="rounded-2xl border border-border bg-background p-3">{selectedJob.experience}</div>
                  <div className="rounded-2xl border border-border bg-background p-3 capitalize">{selectedJob.stage}</div>
                  <div className="rounded-2xl border border-border bg-background p-3">{selectedJob.platformId}</div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleSavedJob(selectedJob.id)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-2 text-sm text-primary transition hover:bg-primary/15"
                >
                  <Bookmark className="h-4 w-4" />
                  Save or unsave
                </button>
              </div>
            ) : (
              <div className="mt-5 rounded-3xl border border-dashed border-border bg-card/50 p-6 text-sm text-text-muted">
                No job selected yet.
              </div>
            )}
          </div>

          <div className="rounded-[1.75rem] border border-border bg-surface/90 p-6 shadow-card-glow">
            <div className="font-display text-xl text-text-primary">Saved shortlist</div>
            <div className="mt-4 space-y-3">
              {savedJobObjects.slice(0, 3).map((job) => (
                <div key={job.id} className="rounded-2xl border border-border bg-card p-4">
                  <div className="text-sm text-text-primary">{job.title}</div>
                  <div className="mt-1 text-xs text-text-muted">{job.company} · {job.location}</div>
                </div>
              ))}
              {savedJobObjects.length === 0 ? <div className="text-sm text-text-muted">No saved jobs yet.</div> : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
