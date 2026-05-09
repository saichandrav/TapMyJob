import { create } from 'zustand'
import { jobs as mockJobs } from '../data/mockData.js'

const BASE_URL = 'http://localhost:3000'

const defaultFilters = {
  query: '',
  platforms: [],
  categories: [],
  locations: [],
  experience: [],
  stages: [],
  sortBy: 'newest',
}

const defaultPagination = {
  page: 1,
  pageSize: 10,
}

/**
 * Map a backend ScoredJob to the shape the existing UI expects.
 */
function mapBackendJob(job, index) {
  return {
    id: job.apply_link || `backend-${index}`,
    platformId: (job.source_platform || 'unknown').toLowerCase(),
    title: job.title || 'Unknown Title',
    company: job.company || 'Unknown Company',
    location: job.location || 'Unknown',
    experience: '',
    salary: '',
    category: '',
    skills: job.missing_skills || [],
    stage: 'new',
    postedMinutesAgo: 30,
    remote: (job.location || '').toLowerCase().includes('remote'),
    type: job.job_type || 'Full-time',
    matchScore: job.skill_match || 50,
    selectionProbability: job.selection_probability || 50,
    description: job.match_reason || job.description || '',
    sourceUrl: job.apply_link || '',
  }
}

export const useJobStore = create((set, get) => ({
  jobs: mockJobs,
  filters: defaultFilters,
  selectedJob: mockJobs[0] ?? null,
  savedJobs: mockJobs.slice(1, 8).map((job) => job.id),
  pagination: defaultPagination,
  isLoadingFromBackend: false,
  backendError: null,

  setJobs: (jobs) => set({ jobs }),

  /**
   * Fetch real jobs from the backend API.
   * Requires the user to have parsed their resume first (session must have userProfile).
   */
  fetchJobsFromBackend: async () => {
    set({ isLoadingFromBackend: true, backendError: null })
    try {
      const response = await fetch(`${BASE_URL}/api/jobs/search`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      const backendJobs = (data.jobs || []).map(mapBackendJob)

      if (backendJobs.length > 0) {
        set({
          jobs: backendJobs,
          selectedJob: backendJobs[0],
          isLoadingFromBackend: false,
        })
      } else {
        set({ isLoadingFromBackend: false })
      }
    } catch (err) {
      set({ backendError: err.message, isLoadingFromBackend: false })
    }
  },

  setFilters: (updates) =>
    set((state) => ({
      filters: { ...state.filters, ...updates },
      pagination: { ...state.pagination, page: 1 },
    })),
  resetFilters: () =>
    set({
      filters: defaultFilters,
      pagination: defaultPagination,
    }),
  setSelectedJob: (selectedJob) => set({ selectedJob }),
  toggleSavedJob: (jobId) =>
    set((state) => {
      const alreadySaved = state.savedJobs.includes(jobId)
      return {
        savedJobs: alreadySaved ? state.savedJobs.filter((id) => id !== jobId) : [...state.savedJobs, jobId],
      }
    }),
  setPagination: (updates) =>
    set((state) => ({
      pagination: { ...state.pagination, ...updates },
    })),
  nextPage: () =>
    set((state) => ({
      pagination: { ...state.pagination, page: state.pagination.page + 1 },
    })),
  prevPage: () =>
    set((state) => ({
      pagination: { ...state.pagination, page: Math.max(1, state.pagination.page - 1) },
    })),
  markJobStage: (jobId, stage) =>
    set((state) => ({
      jobs: state.jobs.map((job) => (job.id === jobId ? { ...job, stage } : job)),
      selectedJob: state.selectedJob?.id === jobId ? { ...state.selectedJob, stage } : state.selectedJob,
    })),
}))
