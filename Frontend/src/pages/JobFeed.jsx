import {
  Bookmark,
  BriefcaseBusiness,
  ChevronDown,
  ExternalLink,
  Filter,
  Grid3X3,
  List,
  MapPin,
  Search,
  SlidersHorizontal,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { JobCard } from '../components/jobs/JobCard.jsx'
import { platforms as platformConfigs } from '../data/platforms.js'
import { useDebounce } from '../hooks/useDebounce.js'
import { useJobs } from '../hooks/useJobs.js'
import { useUIStore } from '../store/uiStore.js'

const platformLabelMap = platformConfigs.reduce((accumulator, platform) => {
  accumulator[platform.id] = platform.name
  return accumulator
}, {})

const filterPlatforms = [
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'naukri', label: 'Naukri' },
  { id: 'indeed', label: 'Indeed' },
  { id: 'google', label: 'Google' },
  { id: 'microsoft', label: 'Microsoft' },
  { id: 'amazon', label: 'Amazon' },
  { id: 'infosys', label: 'Infosys' },
  { id: 'tcs', label: 'TCS' },
  { id: 'wipro', label: 'Wipro' },
  { id: 'accenture', label: 'Accenture' },
]

const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote']
const experienceLevels = ['Entry', 'Mid', 'Senior', 'Lead']
const datePostedOptions = ['Today', 'This week', 'This month']

const datePostedToMinutes = {
  Today: 24 * 60,
  'This week': 7 * 24 * 60,
  'This month': 30 * 24 * 60,
}

function getCompanyInitials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('')
}


function formatSalary(job) {
  if (job.salary) {
    return job.salary
  }

  if (job.salaryMin || job.salaryMax) {
    const minValue = job.salaryMin ? `₹${job.salaryMin}` : ''
    const maxValue = job.salaryMax ? `₹${job.salaryMax}` : ''

    if (minValue && maxValue) {
      return `${minValue} - ${maxValue}`
    }

    return minValue || maxValue || 'Not disclosed'
  }

  return 'Not disclosed'
}

function formatPostedTime(job) {
  const minutes = job.postedMinutesAgo ?? job.postedAtMinutesAgo ?? 120

  if (minutes < 60) {
    return `${minutes}m ago`
  }

  const hours = Math.max(1, Math.round(minutes / 60))
  return `${hours}h ago`
}

function CompanyMark({ company, logoUrl }) {
  if (logoUrl) {
    return <img src={logoUrl} alt={`${company} logo`} className="h-10 w-10 rounded-lg border border-border object-cover" />
  }

  const initials = getCompanyInitials(company)

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-primary/80 to-secondary/70 text-sm font-semibold text-background">
      {initials || 'HR'}
    </div>
  )
}

function DetailSection({ title, children, className = '' }) {
  return (
    <section className={`rounded-3xl border border-border bg-card p-5 ${className}`}>
      <div className="font-display text-lg text-text-primary">{title}</div>
      <div className="mt-4">{children}</div>
    </section>
  )
}

export default function JobFeed() {
  const {
    jobs,
    filters,
    toggleSavedJob,
    setFilters,
    resetFilters,
    savedJobs,
  } = useJobs({ pageSize: 1000 })
  const setActivePage = useUIStore((state) => state.setActivePage)
  const [layoutMode, setLayoutMode] = useState('list')
  const [showFilters, setShowFilters] = useState(false)
  const [searchDraft, setSearchDraft] = useState(filters.query)
  const [localDraft, setLocalDraft] = useState({
    ...filters,
    salaryRange: filters.salaryRange ?? [0, 100],
    datePosted: filters.datePosted ?? '',
    skillsText: filters.skillsText ?? '',
  })

  const debouncedSearch = useDebounce(searchDraft, 250)

  useEffect(() => {
    setFilters({ query: debouncedSearch })
  }, [debouncedSearch, setFilters])

  const derivedJobs = useMemo(() => {
    const now = Date.now()

    return jobs.filter((job) => {
      const matchesQuery =
        !filters.query ||
        [job.title, job.company, job.location, job.platformId, job.category, ...(job.skills ?? [])]
          .join(' ')
          .toLowerCase()
          .includes(filters.query.toLowerCase())

      const matchesPlatforms =
        !filters.platforms?.length ||
        filters.platforms.some((platformId) => {
          const platformName = platformLabelMap[job.platformId] ?? job.platformId
          return platformId === job.platformId || platformId === platformName.toLowerCase()
        })

      const matchesJobType =
        !localDraft.jobTypes?.length ||
        localDraft.jobTypes.length === 0 ||
        localDraft.jobTypes.includes(job.type) ||
        (localDraft.jobTypes.includes('Remote') && job.isRemote)

      const experienceLabel = job.experience?.toLowerCase() ?? ''
      const matchesExperience =
        !localDraft.experienceLevel ||
        (localDraft.experienceLevel === 'Entry' && /0-2|entry|fresher/.test(experienceLabel)) ||
        (localDraft.experienceLevel === 'Mid' && /2-5|3-6|mid/.test(experienceLabel)) ||
        (localDraft.experienceLevel === 'Senior' && /5-8|6-10|senior/.test(experienceLabel)) ||
        (localDraft.experienceLevel === 'Lead' && /8-12|lead|staff/.test(experienceLabel))

      const [salaryMin, salaryMax] = localDraft.salaryRange ?? [0, 100]
      const jobSalaryValue = Number.parseInt((job.salary || '').match(/\d+/)?.[0] ?? '0', 10)
      const matchesSalary = jobSalaryValue === 0 || (jobSalaryValue >= salaryMin && jobSalaryValue <= salaryMax)

      const matchesDatePosted =
        !localDraft.datePosted ||
        ((now - job.postedMinutesAgo * 60 * 1000) / 60000) <= datePostedToMinutes[localDraft.datePosted]

      const selectedSkills = localDraft.skills ?? []
      const matchesSkills =
        selectedSkills.length === 0 ||
        selectedSkills.every((skill) => (job.skills ?? []).some((jobSkill) => jobSkill.toLowerCase().includes(skill.toLowerCase())))

      return matchesQuery && matchesPlatforms && matchesJobType && matchesExperience && matchesSalary && matchesDatePosted && matchesSkills
    })
  }, [filters.platforms, filters.query, jobs, localDraft.datePosted, localDraft.experienceLevel, localDraft.jobTypes, localDraft.salaryRange, localDraft.skills])

  const totalJobs = derivedJobs.length

  const visibleCards = useMemo(() => derivedJobs.slice(0, 24), [derivedJobs])
  const savedJobIds = useMemo(() => new Set(savedJobs), [savedJobs])

  const applyFilters = () => {
    setFilters({
      platforms: localDraft.platforms ?? [],
      categories: [],
      locations: [],
      experience: [],
      stages: [],
      salaryRange: localDraft.salaryRange,
      datePosted: localDraft.datePosted,
      skills: localDraft.skills ?? [],
      jobTypes: localDraft.jobTypes ?? [],
    })
    if (searchDraft !== filters.query) {
      setFilters({ query: searchDraft })
    }
    setActivePage('job-feed')
    toast.success('Filters applied')
  }

  const clearAll = () => {
    resetFilters()
    setSearchDraft('')
    setLocalDraft({
      platforms: [],
      jobTypes: [],
      experienceLevel: '',
      salaryRange: [0, 100],
      datePosted: '',
      skills: [],
    })
    toast('Filters cleared')
  }

  const toggleDraftPlatform = (platformId) => {
    setLocalDraft((current) => ({
      ...current,
      platforms: current.platforms?.includes(platformId)
        ? current.platforms.filter((item) => item !== platformId)
        : [...(current.platforms ?? []), platformId],
    }))
  }

  const toggleJobType = (jobType) => {
    setLocalDraft((current) => ({
      ...current,
      jobTypes: current.jobTypes?.includes(jobType)
        ? current.jobTypes.filter((item) => item !== jobType)
        : [...(current.jobTypes ?? []), jobType],
    }))
  }

  const toggleSkill = (skill) => {
    const normalizedSkill = skill.trim()
    if (!normalizedSkill) {
      return
    }

    setLocalDraft((current) => ({
      ...current,
      skills: current.skills?.includes(normalizedSkill)
        ? current.skills.filter((item) => item !== normalizedSkill)
        : [...(current.skills ?? []), normalizedSkill],
    }))
  }

  const addSkillFromInput = (event) => {
    if (event.key !== 'Enter') {
      return
    }

    event.preventDefault()
    const skill = event.currentTarget.value.trim()

    if (!skill) {
      return
    }

    toggleSkill(skill)
    event.currentTarget.value = ''
  }

  return (
    <>
      <div className={`grid min-h-[calc(100vh-7rem)] gap-6 ${showFilters ? 'md:grid-cols-[280px_minmax(0,1fr)]' : 'grid-cols-1'}`}>
        {showFilters && (
          <aside className="rounded-3xl border border-border bg-surface/95 p-5 shadow-card-glow lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)] lg:overflow-y-auto">
        <div className="space-y-6">
          <label className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-text-muted">
            <Search className="h-4 w-4 shrink-0" />
            <input
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Search jobs, skills, companies"
              className="w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
            />
          </label>

          <div>
            <div className="font-display text-2xl text-text-primary">Filters</div>
            <p className="mt-1 text-xs text-text-muted">Refine by source, seniority, salary, and tags.</p>
          </div>

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-text-primary">
              <Filter className="h-4 w-4 text-secondary" />
              Platforms
            </div>

            <div className="grid grid-cols-4 gap-2">
              {filterPlatforms.map((platform) => {
                const isActive = (localDraft.platforms ?? []).includes(platform.id)
                return (
                  <button
                    key={platform.id}
                    type="button"
                    onClick={() => toggleDraftPlatform(platform.id)}
                    className={`flex flex-col items-center justify-center gap-1 rounded-xl border py-2 px-1 text-xs transition ${
                      isActive
                        ? 'border-primary/40 bg-primary/10 text-primary'
                        : 'border-border bg-card text-text-muted hover:border-primary/30 hover:text-text-primary'
                    }`}
                  >
                    <span className={`flex h-6 w-6 items-center justify-center rounded-lg border text-[9px] font-semibold uppercase ${
                      isActive ? 'border-primary/30 bg-primary/20 text-primary' : 'border-border bg-background text-text-primary'
                    }`}>
                      {getCompanyInitials(platform.label)}
                    </span>
                    <span className="w-full truncate text-center text-[10px] leading-tight">{platform.label}</span>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-text-primary">
              <SlidersHorizontal className="h-4 w-4 text-secondary" />
              Job Type
            </div>

            <div className="flex flex-wrap gap-2">
              {jobTypes.map((jobType) => {
                const active = (localDraft.jobTypes ?? []).includes(jobType)

                return (
                  <button
                    key={jobType}
                    type="button"
                    onClick={() => toggleJobType(jobType)}
                    className={`rounded-full border px-3 py-2 text-xs transition ${
                      active ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border bg-card text-text-muted hover:border-primary/40 hover:text-text-primary'
                    }`}
                  >
                    {jobType}
                  </button>
                )
              })}
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-text-primary">
              <BriefcaseBusiness className="h-4 w-4 text-secondary" />
              Experience Level
            </div>

            <select
              value={localDraft.experienceLevel}
              onChange={(event) => setLocalDraft((current) => ({ ...current, experienceLevel: event.target.value }))}
              className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-text-primary outline-none focus:border-primary/40"
            >
              <option value="">Any experience</option>
              {experienceLevels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-text-primary">
              <MapPin className="h-4 w-4 text-secondary" />
              Salary Range
            </div>

            <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span>₹0L</span>
                <span>₹100L+</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={localDraft.salaryRange?.[1] ?? 100}
                onChange={(event) =>
                  setLocalDraft((current) => ({
                    ...current,
                    salaryRange: [current.salaryRange?.[0] ?? 0, Number(event.target.value)],
                  }))
                }
                className="w-full accent-primary"
              />
              <div className="font-mono text-xs text-text-muted">
                Up to ₹{localDraft.salaryRange?.[1] ?? 100}L
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-text-primary">
              <ChevronDown className="h-4 w-4 text-secondary" />
              Date Posted
            </div>

            <select
              value={localDraft.datePosted}
              onChange={(event) => setLocalDraft((current) => ({ ...current, datePosted: event.target.value }))}
              className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-text-primary outline-none focus:border-primary/40"
            >
              <option value="">Any time</option>
              {datePostedOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-text-primary">
              <Bookmark className="h-4 w-4 text-secondary" />
              Skills tags
            </div>

            <input
              type="text"
              placeholder="Press Enter to add a tag"
              onKeyDown={addSkillFromInput}
              className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-primary/40"
            />

            <div className="flex flex-wrap gap-2">
              {(localDraft.skills ?? []).map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleSkill(skill)}
                  className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 font-mono text-[11px] text-primary"
                >
                  {skill} ×
                </button>
              ))}
            </div>
          </section>

          <div className="grid gap-3 pt-2">
            <button
              type="button"
              onClick={clearAll}
              className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-text-primary transition hover:border-danger/40 hover:text-danger"
            >
              Clear all filters
            </button>
            <button
              type="button"
              onClick={applyFilters}
              className="rounded-2xl border border-primary/30 bg-primary px-4 py-3 text-sm font-medium text-background transition hover:shadow-accent-glow"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </aside>
      )}

      <main className="min-w-0 space-y-5">
        <section className="rounded-3xl border border-border bg-surface/95 p-4 shadow-card-glow">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-text-muted">
              <span className="text-text-primary">{totalJobs} jobs found</span>
              <span className="mx-2 text-border">|</span>
              <button type="button" className="inline-flex items-center gap-1 text-text-muted transition hover:text-text-primary">
                Sort by: Relevance <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 self-start rounded-2xl border border-border bg-card p-1">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${
                  showFilters ? 'bg-primary/10 text-primary' : 'text-text-muted hover:text-text-primary'
                }`}
              >
                <Filter className="h-4 w-4" /> Filters
              </button>
              <div className="mx-1 h-4 w-px bg-border"></div>
              <button
                type="button"
                onClick={() => setLayoutMode('grid')}
                className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${
                  layoutMode === 'grid' ? 'bg-primary/10 text-primary' : 'text-text-muted hover:text-text-primary'
                }`}
              >
                <Grid3X3 className="h-4 w-4" /> Grid
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode('list')}
                className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${
                  layoutMode === 'list' ? 'bg-primary/10 text-primary' : 'text-text-muted hover:text-text-primary'
                }`}
              >
                <List className="h-4 w-4" /> List
              </button>
            </div>
          </div>
        </section>

        <section className={`grid gap-4 ${layoutMode === 'grid' ? 'sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3' : 'grid-cols-1'}`}>
          {visibleCards.map((job) => (
            <JobCard
              key={job.id}
              job={{
                ...job,
                platform: platformLabelMap[job.platformId] ?? job.platformId,
                isRemote: job.remote,
                isSaved: savedJobIds.has(job.id),
                isNew: job.stage === 'new',
                salary: job.salary,
                salaryMin: job.salaryMin,
                salaryMax: job.salaryMax,
                source: job.platformId,
                postedAt: `${formatPostedTime(job)}`,
                logoUrl: job.logoUrl,
                jobUrl: job.sourceUrl,
              }}
              variant={layoutMode}
              onBookmarkToggle={() => {
                toggleSavedJob(job.id)
                toast.success(savedJobIds.has(job.id) ? 'Job removed' : 'Job saved')
              }}
            />
          ))}
        </section>

        {visibleCards.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card/60 p-10 text-center text-sm text-text-muted">
            No jobs match the current filters.
          </div>
        ) : null}
      </main>
    </div>


    </>
  )
}