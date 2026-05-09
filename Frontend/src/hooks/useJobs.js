import { useMemo } from 'react'
import { useJobStore } from '../store/jobStore.js'

const compareByNewest = (leftJob, rightJob) => rightJob.postedMinutesAgo - leftJob.postedMinutesAgo
const compareByHighestSalary = (leftJob, rightJob) => {
  const leftSalary = Number.parseInt(leftJob.salary.match(/\d+/g)?.[0] ?? '0', 10)
  const rightSalary = Number.parseInt(rightJob.salary.match(/\d+/g)?.[0] ?? '0', 10)

  return rightSalary - leftSalary
}

export function useJobs(options = {}) {
  const jobs = useJobStore((state) => state.jobs)
  const filters = useJobStore((state) => state.filters)
  const selectedJob = useJobStore((state) => state.selectedJob)
  const savedJobs = useJobStore((state) => state.savedJobs)
  const pagination = useJobStore((state) => state.pagination)
  const setFilters = useJobStore((state) => state.setFilters)
  const resetFilters = useJobStore((state) => state.resetFilters)
  const setSelectedJob = useJobStore((state) => state.setSelectedJob)
  const toggleSavedJob = useJobStore((state) => state.toggleSavedJob)
  const setPagination = useJobStore((state) => state.setPagination)
  const nextPage = useJobStore((state) => state.nextPage)
  const prevPage = useJobStore((state) => state.prevPage)
  const markJobStage = useJobStore((state) => state.markJobStage)

  const pageSize = options.pageSize ?? pagination.pageSize

  const filteredJobs = useMemo(() => {
    const normalizedQuery = filters.query.trim().toLowerCase()

    const matchedJobs = jobs.filter((job) => {
      const matchesQuery =
        !normalizedQuery ||
        [job.title, job.company, job.location, job.category, job.platformId, ...job.skills].join(' ').toLowerCase().includes(normalizedQuery)
      const matchesPlatform = filters.platforms.length === 0 || filters.platforms.includes(job.platformId)
      const matchesCategory = filters.categories.length === 0 || filters.categories.includes(job.category)
      const matchesLocation = filters.locations.length === 0 || filters.locations.includes(job.location)
      const matchesExperience = filters.experience.length === 0 || filters.experience.includes(job.experience)
      const matchesStage = filters.stages.length === 0 || filters.stages.includes(job.stage)

      return matchesQuery && matchesPlatform && matchesCategory && matchesLocation && matchesExperience && matchesStage
    })

    switch (filters.sortBy) {
      case 'salary-high':
        return [...matchedJobs].sort(compareByHighestSalary)
      case 'salary-low':
        return [...matchedJobs].sort((leftJob, rightJob) => compareByHighestSalary(rightJob, leftJob))
      case 'company':
        return [...matchedJobs].sort((leftJob, rightJob) => leftJob.company.localeCompare(rightJob.company))
      case 'newest':
      default:
        return [...matchedJobs].sort(compareByNewest)
    }
  }, [filters.categories, filters.experience, filters.locations, filters.platforms, filters.query, filters.sortBy, filters.stages, jobs])

  const totalItems = filteredJobs.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const currentPage = Math.min(pagination.page, totalPages)
  const startIndex = (currentPage - 1) * pageSize
  const paginatedJobs = filteredJobs.slice(startIndex, startIndex + pageSize)
  const savedJobObjects = savedJobs.map((savedJobId) => jobs.find((job) => job.id === savedJobId)).filter(Boolean)

  return {
    jobs,
    filters,
    selectedJob,
    savedJobs,
    savedJobObjects,
    pagination: { ...pagination, page: currentPage, pageSize },
    totalItems,
    totalPages,
    filteredJobs,
    paginatedJobs,
    setFilters,
    resetFilters,
    setSelectedJob,
    toggleSavedJob,
    setPagination,
    nextPage,
    prevPage,
    markJobStage,
  }
}
