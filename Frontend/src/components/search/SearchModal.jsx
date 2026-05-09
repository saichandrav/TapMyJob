import { Building2, Clock3, Search, Tag } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useJobs } from '../../hooks/useJobs.js'
import { useJobStore } from '../../store/jobStore.js'
import { useUIStore } from '../../store/uiStore.js'

const RECENT_SEARCHES_KEY = 'hireradar_recent_searches'

function getUniqueValues(items) {
  return [...new Set(items.filter(Boolean))]
}

function getCompanyCounts(jobs) {
  return Object.entries(
    jobs.reduce((accumulator, job) => {
      accumulator[job.company] = (accumulator[job.company] ?? 0) + 1
      return accumulator
    }, {}),
  )
    .sort((left, right) => right[1] - left[1])
    .map(([name, jobCount]) => ({ name, jobCount }))
}

function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('')
}

function ResultRow({ active, onClick, children, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
        active ? 'border-primary/50 bg-surface' : 'border-border bg-card hover:border-primary/30 hover:bg-gray-100'
      } ${className}`}
    >
      {children}
    </button>
  )
}

export default function SearchModal({ open, onClose }) {
  const { jobs } = useJobs({ pageSize: 1000 })
  const setFilters = useJobStore((state) => state.setFilters)
  const setSelectedJob = useJobStore((state) => state.setSelectedJob)
  const setActivePage = useUIStore((state) => state.setActivePage)
  const [mounted, setMounted] = useState(open)
  const [visible, setVisible] = useState(open)
  const [query, setQuery] = useState('')
  const [recentSearches, setRecentSearches] = useState([])
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef(null)
  const closeTimerRef = useRef(null)

  useEffect(() => {
    const storedRecentSearches = window.localStorage.getItem(RECENT_SEARCHES_KEY)

    if (storedRecentSearches) {
      try {
        const parsed = JSON.parse(storedRecentSearches)
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed)
        }
      } catch {
        setRecentSearches([])
      }
    } else {
      setRecentSearches(['React Engineer', 'Remote jobs', 'DevOps', 'Python'])
    }
  }, [])

  useEffect(() => {
    if (open) {
      setMounted(true)
      window.requestAnimationFrame(() => setVisible(true))
      setQuery('')
      setActiveIndex(0)
    } else if (mounted) {
      setVisible(false)
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = window.setTimeout(() => setMounted(false), 180)
    }

    return () => window.clearTimeout(closeTimerRef.current)
  }, [mounted, open])

  useEffect(() => {
    if (!open) {
      return
    }

    const onPointerDown = (event) => {
      const modal = event.target.closest('[data-search-modal]')

      if (!modal) {
        onClose()
      }
    }

    window.addEventListener('mousedown', onPointerDown)

    return () => window.removeEventListener('mousedown', onPointerDown)
  }, [onClose, open])

  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
    }
  }, [open])

  const searchValue = query.trim().toLowerCase()

  const matchingJobs = useMemo(() => {
    const filtered = jobs.filter((job) => {
      if (!searchValue) {
        return true
      }

      return [job.title, job.company, job.location, ...(job.skills ?? [])].join(' ').toLowerCase().includes(searchValue)
    })

    return filtered.slice(0, 6)
  }, [jobs, searchValue])

  const companyResults = useMemo(() => {
    const counts = getCompanyCounts(jobs)

    return counts.filter((company) => !searchValue || company.name.toLowerCase().includes(searchValue)).slice(0, 6)
  }, [jobs, searchValue])

  const skillResults = useMemo(() => {
    const skills = getUniqueValues(jobs.flatMap((job) => job.skills ?? []))

    return skills.filter((skill) => !searchValue || skill.toLowerCase().includes(searchValue)).slice(0, 8)
  }, [jobs, searchValue])

  const recentResults = useMemo(() => {
    if (searchValue) {
      return []
    }

    return recentSearches.slice(0, 6).map((item) => ({ label: item }))
  }, [recentSearches, searchValue])

  const flattenedResults = useMemo(() => {
    const rows = []

    if (!searchValue) {
      recentResults.forEach((item) => rows.push({ type: 'recent', label: item.label, searchTerm: item.label }))
    }

    matchingJobs.forEach((job) =>
      rows.push({
        type: 'job',
        id: job.id,
        label: job.title,
        searchTerm: `${job.title} ${job.company}`,
        job,
      }),
    )

    companyResults.forEach((company) =>
      rows.push({
        type: 'company',
        label: company.name,
        searchTerm: company.name,
        company,
      }),
    )

    skillResults.forEach((skill) =>
      rows.push({
        type: 'skill',
        label: skill,
        searchTerm: skill,
      }),
    )

    return rows
  }, [companyResults, matchingJobs, recentResults, searchValue, skillResults])

  useEffect(() => {
    setActiveIndex((current) => {
      if (flattenedResults.length === 0) {
        return 0
      }

      return Math.min(current, flattenedResults.length - 1)
    })
  }, [flattenedResults.length])

  const commitSearch = (value) => {
    const trimmed = value.trim()

    if (!trimmed) {
      return
    }

    setFilters({ query: trimmed })
    setActivePage('job-feed')
    setRecentSearches((current) => {
      const next = [trimmed, ...current.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())].slice(0, 6)
      window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next))
      return next
    })
    onClose()
  }

  const handleSelectResult = (result) => {
    commitSearch(result.searchTerm)

    if (result.type === 'job' && result.job) {
      setSelectedJob(result.job)
    }

    if (result.type === 'company' || result.type === 'skill' || result.type === 'recent') {
      setFilters({ query: result.searchTerm })
      setActivePage('job-feed')
    }
  }

  useEffect(() => {
    if (!open) {
      return
    }

    const onKeyDown = (event) => {
      if (!mounted) {
        return
      }

      const key = event.key.toLowerCase()
      const resultsLength = flattenedResults.length

      if (key === 'escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (key === 'arrowdown') {
        event.preventDefault()
        setActiveIndex((current) => (resultsLength === 0 ? 0 : (current + 1) % resultsLength))
        return
      }

      if (key === 'arrowup') {
        event.preventDefault()
        setActiveIndex((current) => (resultsLength === 0 ? 0 : (current - 1 + resultsLength) % resultsLength))
        return
      }

      if (key === 'enter') {
        event.preventDefault()
        const activeResult = flattenedResults[activeIndex]

        if (activeResult) {
          handleSelectResult(activeResult)
        } else if (query.trim()) {
          commitSearch(query.trim())
        }
      }
    }

    window.addEventListener('keydown', onKeyDown)

    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeIndex, flattenedResults, handleSelectResult, mounted, onClose, open, query])

  if (!mounted) {
    return null
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 pt-20 backdrop-blur-sm transition-all duration-200 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      aria-hidden={!open}
    >
      <div
        data-search-modal
        className={`w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl transition-all duration-200 ${
          visible ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-2 opacity-0'
        }`}
      >
        <div className="border-b border-border px-5 py-4">
          <div className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3">
            <Search className="h-5 w-5 shrink-0 text-text-muted" />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setActiveIndex(0)
              }}
              placeholder="Search jobs, companies, skills"
              className="w-full bg-transparent font-body text-lg text-text-primary outline-none placeholder:text-text-muted"
            />
          </div>
        </div>

        <div className="max-h-120 overflow-y-auto px-3 py-4">
          {!searchValue ? (
            <section className="px-2 pb-4">
              <div className="mb-3 flex items-center gap-2 font-mono text-sm text-text-muted">
                <Clock3 className="h-4 w-4" />
                Recent Searches
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {recentResults.map((item, index) => {
                  const active = flattenedResults[index]?.type === 'recent' && activeIndex === index

                  return (
                    <ResultRow key={item.label} active={active} onClick={() => handleSelectResult({ type: 'recent', searchTerm: item.label })}>
                      <div className="font-mono text-sm text-text-primary">{item.label}</div>
                    </ResultRow>
                  )
                })}
              </div>
            </section>
          ) : null}

          <section className="px-2 pb-4">
            <div className="mb-3 font-mono text-sm text-text-muted">Jobs</div>
            <div className="space-y-2">
              {matchingJobs.map((job, jobIndex) => {
                const globalIndex = flattenedResults.findIndex((item) => item.type === 'job' && item.id === job.id)
                const active = activeIndex === globalIndex
                const sourceLabel = job.platformId === 'linkedin' ? 'LinkedIn' : job.platformId === 'naukri' ? 'Naukri' : 'Indeed'

                return (
                  <ResultRow key={job.id} active={active} onClick={() => handleSelectResult({ type: 'job', searchTerm: `${job.title} ${job.company}`, job })}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-text-primary">{job.title}</div>
                        <div className="mt-1 text-xs text-text-muted">
                          {job.company} · {job.location}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="font-mono text-sm text-secondary">{job.salary}</span>
                          <span className="rounded-full border border-border bg-background px-2 py-1 text-[11px] text-text-muted">{sourceLabel}</span>
                          <span className="font-mono text-[11px] text-text-muted">{Math.max(1, 120 - jobIndex * 11)}m ago</span>
                        </div>
                      </div>
                    </div>
                  </ResultRow>
                )
              })}
            </div>
          </section>

          <section className="px-2 pb-4">
            <div className="mb-3 font-mono text-sm text-text-muted">Companies</div>
            <div className="space-y-2">
              {companyResults.map((company) => {
                const globalIndex = flattenedResults.findIndex((item) => item.type === 'company' && item.label === company.name)
                const active = activeIndex === globalIndex

                return (
                  <ResultRow key={company.name} active={active} onClick={() => handleSelectResult({ type: 'company', searchTerm: company.name, company })}>
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Building2 className="h-4 w-4 text-secondary" />
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background text-xs font-semibold text-text-primary">
                          {initials(company.name)}
                        </div>
                        <div>
                          <div className="text-sm text-text-primary">{company.name}</div>
                          <div className="text-xs text-text-muted">Career page results</div>
                        </div>
                      </div>
                      <div className="font-mono text-xs text-text-muted">{company.jobCount} jobs</div>
                    </div>
                  </ResultRow>
                )
              })}
            </div>
          </section>

          <section className="px-2 pb-2">
            <div className="mb-3 font-mono text-sm text-text-muted">Skills</div>
            <div className="flex flex-wrap gap-2">
              {skillResults.map((skill) => {
                const globalIndex = flattenedResults.findIndex((item) => item.type === 'skill' && item.label === skill)
                const active = activeIndex === globalIndex

                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => handleSelectResult({ type: 'skill', searchTerm: skill })}
                    className={`rounded-full border px-3 py-1.5 font-mono text-sm transition ${
                      active ? 'border-primary/50 bg-surface text-text-primary' : 'border-border bg-card text-text-muted hover:border-primary/30 hover:text-text-primary'
                    }`}
                  >
                    <Tag className="mr-2 inline-block h-3.5 w-3.5" />
                    {skill}
                  </button>
                )
              })}
            </div>
          </section>
        </div>

        <div className="flex items-center justify-between border-t border-border px-5 py-3 font-mono text-xs text-text-muted">
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  )
}