import { create } from 'zustand'
import { jobs as mockJobs } from '../data/mockData.js'

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

export const useJobStore = create((set) => ({
  jobs: mockJobs,
  filters: defaultFilters,
  selectedJob: mockJobs[0] ?? null,
  savedJobs: mockJobs.slice(1, 8).map((job) => job.id),
  pagination: defaultPagination,
  setJobs: (jobs) => set({ jobs }),
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
