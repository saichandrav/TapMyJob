import { create } from 'zustand'
import { platforms as mockPlatforms } from '../data/platforms.js'

export const useSourceStore = create((set) => ({
  sources: mockPlatforms,
  syncStatus: 'healthy',
  lastSynced: '2 min ago',
  setSources: (sources) => set({ sources }),
  setSyncStatus: (syncStatus) => set({ syncStatus }),
  setLastSynced: (lastSynced) => set({ lastSynced }),
  updateSource: (sourceId, updates) =>
    set((state) => ({
      sources: state.sources.map((source) => (source.id === sourceId ? { ...source, ...updates } : source)),
    })),
  refreshSources: (updates) =>
    set((state) => ({
      sources: state.sources.map((source) => ({
        ...source,
        ...updates?.[source.id],
      })),
    })),
}))
