import { ExternalLink, Bookmark } from 'lucide-react'

const platformStyles = {
  LinkedIn: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
  Naukri: 'border-red-500/30 bg-red-500/10 text-red-300',
  Indeed: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300',
  Google: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  Microsoft: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
}

const initialsPalette = [
  'from-primary/80 to-secondary/70',
  'from-cyan-500/80 to-blue-500/70',
  'from-emerald-500/80 to-teal-500/70',
  'from-fuchsia-500/80 to-violet-500/70',
  'from-amber-500/80 to-orange-500/70',
]

function getInitials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('')
}

function getPaletteIndex(value = '') {
  let hash = 0

  for (const character of value) {
    hash = (hash * 31 + character.charCodeAt(0)) % 997
  }

  return hash % initialsPalette.length
}

function formatSalary(job) {
  if (job?.salary) {
    return job.salary
  }

  if (job?.salaryMin || job?.salaryMax) {
    const minValue = job.salaryMin ? `₹${job.salaryMin}` : null
    const maxValue = job.salaryMax ? `₹${job.salaryMax}` : null

    if (minValue && maxValue) {
      return `${minValue} - ${maxValue}`
    }

    return minValue ?? maxValue ?? 'Not disclosed'
  }

  return 'Not disclosed'
}

function formatPostedAt(postedAt) {
  if (!postedAt) {
    return 'Just now'
  }

  if (typeof postedAt === 'string') {
    return postedAt
  }

  const postedDate = postedAt instanceof Date ? postedAt : new Date(postedAt)

  if (Number.isNaN(postedDate.getTime())) {
    return 'Just now'
  }

  const diffMinutes = Math.max(1, Math.round((Date.now() - postedDate.getTime()) / 60000))

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`
  }

  const diffHours = Math.max(1, Math.round(diffMinutes / 60))
  if (diffHours < 24) {
    return `${diffHours}h ago`
  }

  const diffDays = Math.max(1, Math.round(diffHours / 24))
  return `${diffDays}d ago`
}

function CompanyLogo({ name, logoUrl, platform }) {
  const initials = getInitials(name || platform)
  const palette = initialsPalette[getPaletteIndex(name || platform)]

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={`${name || platform} logo`}
        className="h-10 w-10 rounded-lg border border-border object-cover"
      />
    )
  }

  return (
    <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br ${palette} text-sm font-semibold text-background`}>
      {initials || 'HR'}
    </div>
  )
}

function PlatformBadge({ platform, source }) {
  const label = platform || source || 'Unknown'
  const variant = platformStyles[label] ?? 'border-border bg-surface text-text-muted'

  return <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${variant}`}>{label}</span>
}

export function JobCardSkeleton({ variant = 'grid', className = '' }) {
  const isList = variant === 'list'

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-border bg-card ${
        isList ? 'p-4 sm:p-5' : 'p-4'
      } ${className}`}
    >
      <div className="absolute inset-0 animate-shimmer bg-[linear-gradient(110deg,transparent_25%,rgba(255,255,255,0.06)_50%,transparent_75%)] bg-size-[200%_100%]" />

      <div className={`relative flex gap-4 ${isList ? 'items-start' : 'flex-col'}`}>
        <div className="h-10 w-10 rounded-lg bg-surface" />

        <div className="min-w-0 flex-1 space-y-3">
          <div className="h-4 w-3/5 rounded-full bg-surface" />
          <div className="h-3 w-2/5 rounded-full bg-surface" />
          <div className="flex flex-wrap gap-2">
            <div className="h-5 w-20 rounded-full bg-surface" />
            <div className="h-5 w-24 rounded-full bg-surface" />
            <div className="h-5 w-16 rounded-full bg-surface" />
          </div>
          <div className="h-3 w-24 rounded-full bg-surface" />
          <div className="flex items-center gap-2">
            <div className="h-8 w-20 rounded-xl bg-surface" />
            <div className="h-8 w-20 rounded-xl bg-surface" />
            <div className="h-8 w-8 rounded-xl bg-surface" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function JobCard({
  job,
  variant = 'grid',
  onBookmarkToggle,
  onQuickView,
  className = '',
}) {
  if (!job) {
    return <JobCardSkeleton variant={variant} className={className} />
  }

  const isList = variant === 'list'
  const platform = job.platform || job.source || 'Unknown'
  const salary = formatSalary(job)
  const timeLabel = formatPostedAt(job.postedAt)
  const remoteLabel = job.isRemote ? 'Remote' : null

  return (
    <article
      className={`group relative overflow-hidden rounded-xl border border-border bg-card transition-all duration-200 hover:border-primary/40 hover:shadow-[0_0_20px_rgba(108,99,255,0.15)] ${className}`}
    >
      {job.isNew ? (
        <span className="absolute right-3 top-3 z-10 rounded-full border border-secondary/30 bg-secondary/15 px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-secondary">
          NEW
        </span>
      ) : null}

      <div className={`relative p-4 sm:p-5 ${isList ? 'flex gap-4' : 'flex flex-col'}`}>
        <div className={`flex gap-4 ${isList ? 'min-w-0 flex-1 items-start' : 'flex-col'}`}>
          <CompanyLogo name={job.company} logoUrl={job.logoUrl} platform={platform} />

          <div className="min-w-0 flex-1 space-y-3">
            <div className="space-y-1">
              <h3 className="font-display text-base font-semibold leading-tight text-primary">
                {job.title}
              </h3>
              <p className="text-sm text-text-muted">{job.company}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm text-text-muted">
              <span>{job.location}</span>
              {remoteLabel ? (
                <span className="rounded-full border border-secondary/25 bg-secondary/10 px-2.5 py-1 text-[11px] font-medium text-secondary">
                  {remoteLabel}
                </span>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <PlatformBadge platform={job.platform} source={job.source} />
            </div>

            <div className="font-mono text-sm text-secondary">
              {salary === 'Not disclosed' ? <span className="text-text-muted">Not disclosed</span> : salary}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {(job.skills ?? []).map((skill) => (
                <span key={skill} className="rounded-full border border-border bg-surface px-2 py-1 font-mono text-[11px] text-text-muted">
                  {skill}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <span className="font-mono text-[11px] text-text-muted">{timeLabel}</span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onBookmarkToggle}
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border transition ${
                    job.isSaved
                      ? 'border-primary/40 bg-primary/15 text-primary'
                      : 'border-border bg-surface text-text-muted hover:border-primary/40 hover:text-primary'
                  }`}
                  aria-label={job.isSaved ? 'Remove from saved jobs' : 'Save job'}
                >
                  <Bookmark className="h-4 w-4" fill={job.isSaved ? 'currentColor' : 'none'} />
                </button>

                <button
                  type="button"
                  onClick={onQuickView}
                  className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-primary transition hover:border-primary/40 hover:bg-gray-100"
                >
                  Quick View
                </button>

                {job.jobUrl ? (
                  <a
                    href={job.jobUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-text-muted transition hover:border-primary/40 hover:text-primary"
                    aria-label="Open job posting"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

export default JobCard