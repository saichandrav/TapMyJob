import { Filter, RotateCcw, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { locations, experienceLevels } from '../data/mockData.js'
import { platforms } from '../data/platforms.js'
import { useDebounce } from '../hooks/useDebounce.js'
import { useJobs } from '../hooks/useJobs.js'

function ToggleChip({ active, children, ...props }) {
  return (
    <button
      type="button"
      className={`rounded-full border px-3 py-1.5 text-xs transition ${
        active
          ? 'border-primary/40 bg-primary/10 text-primary'
          : 'border-border bg-card text-text-muted hover:border-primary/40 hover:text-text-primary'
      }`}
      {...props}
    >
      {children}
    </button>
  )
}

function JobCard({ job, saved, onSelect, onSave }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full rounded-3xl border border-border bg-surface/80 p-5 text-left transition hover:border-primary/40 hover:bg-white/5"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-base font-medium text-text-primary">{job.title}</div>
          <div className="mt-1 text-sm text-text-muted">{job.company} · {job.location}</div>
        </div>
        <span className="rounded-full border border-secondary/20 bg-secondary/10 px-2.5 py-1 text-xs text-secondary">
          {job.matchScore}%
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {job.skills.slice(0, 4).map((skill) => (
          <span key={skill} className="rounded-full border border-border bg-card px-3 py-1 text-xs text-text-muted">
            {skill}
          </span>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 text-xs text-text-muted">
        <span>{job.salary}</span>
        <span className="capitalize">{job.stage}</span>
      </div>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          onSave(job.id)
        }}
        className="mt-4 rounded-2xl border border-border bg-card px-3 py-2 text-xs text-text-primary transition hover:border-primary/40 hover:bg-white/5"
      >
        {saved ? 'Unsave job' : 'Save job'}
      </button>
    </button>
  )
}

export default function JobFeedPage() {
  const { filters, paginatedJobs, totalItems, totalPages, pagination, setFilters, setSelectedJob, toggleSavedJob, setPagination, resetFilters, savedJobs } = useJobs({ pageSize: 8 })
  const [query, setQuery] = useState(filters.query)
  const debouncedQuery = useDebounce(query, 250)

  useEffect(() => {
    setFilters({ query: debouncedQuery })
  }, [debouncedQuery, setFilters])

  const savedJobIds = useMemo(() => new Set(savedJobs), [savedJobs])
  const toggleArrayValue = (values, value) => (values.includes(value) ? values.filter((item) => item !== value) : [...values, value])

  return (
    <div className="space-y-6">
      <section className="rounded-[1.75rem] border border-border bg-surface/90 p-6 shadow-card-glow">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="font-display text-2xl text-text-primary">Job feed</div>
            <p className="mt-1 text-sm text-text-muted">Filter the crawler output and pin the strongest matches.</p>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:w-[36rem] xl:grid-cols-3">
            <label className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-text-muted">
              <Search className="h-4 w-4" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search title, company, skill"
                className="w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
              />
            </label>

            <label className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-text-muted">
              <Filter className="h-4 w-4" />
              <select
                value={filters.sortBy}
                onChange={(event) => setFilters({ sortBy: event.target.value })}
                className="w-full bg-transparent text-sm text-text-primary outline-none"
              >
                <option value="newest">Newest</option>
                <option value="salary-high">Salary high</option>
                <option value="salary-low">Salary low</option>
                <option value="company">Company A-Z</option>
              </select>
            </label>

            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-text-primary transition hover:border-primary/40 hover:bg-white/5"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {platforms.map((platform) => (
            <ToggleChip
              key={platform.id}
              active={filters.platforms.includes(platform.id)}
              onClick={() => setFilters({ platforms: toggleArrayValue(filters.platforms, platform.id) })}
            >
              {platform.id}
            </ToggleChip>
          ))}
          {locations.map((location) => (
            <ToggleChip
              key={location}
              active={filters.locations.includes(location)}
              onClick={() => setFilters({ locations: toggleArrayValue(filters.locations, location) })}
            >
              {location}
            </ToggleChip>
          ))}
          {experienceLevels.map((level) => (
            <ToggleChip
              key={level}
              active={filters.experience.includes(level)}
              onClick={() => setFilters({ experience: toggleArrayValue(filters.experience, level) })}
            >
              {level}
            </ToggleChip>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 text-sm text-text-muted">
            <span>{totalItems} results</span>
            <span>
              Page {pagination.page} of {totalPages}
            </span>
          </div>

          <div className="space-y-3">
            {paginatedJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                saved={savedJobIds.has(job.id)}
                onSelect={() => setSelectedJob(job)}
                onSave={toggleSavedJob}
              />
            ))}

            {paginatedJobs.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border bg-card/50 p-10 text-center text-sm text-text-muted">
                No jobs match the current filters.
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => setPagination({ page: Math.max(1, pagination.page - 1) })}
              className="rounded-2xl border border-border bg-card px-4 py-2 text-sm text-text-primary transition hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={pagination.page >= totalPages}
              onClick={() => setPagination({ page: Math.min(totalPages, pagination.page + 1) })}
              className="rounded-2xl border border-border bg-card px-4 py-2 text-sm text-text-primary transition hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>

        <aside className="rounded-[1.75rem] border border-border bg-surface/90 p-6 shadow-card-glow">
          <div className="font-display text-xl text-text-primary">Applied filters</div>
          <div className="mt-4 space-y-3 text-sm text-text-muted">
            <div className="rounded-2xl border border-border bg-card p-4">Query: {filters.query || 'All jobs'}</div>
            <div className="rounded-2xl border border-border bg-card p-4">Platforms: {filters.platforms.length || 'Any'}</div>
            <div className="rounded-2xl border border-border bg-card p-4">Locations: {filters.locations.length || 'Any'}</div>
            <div className="rounded-2xl border border-border bg-card p-4">Experience: {filters.experience.length || 'Any'}</div>
          </div>
        </aside>
      </section>
    </div>
  )
}
