import { useEffect, useRef } from 'react'
import { useSourceStore } from '../store/sourceStore.js'
import { useUIStore } from '../store/uiStore.js'

const statuses = ['syncing', 'healthy', 'synced']

export function useScraper(intervalMs = 8000) {
  const sources = useSourceStore((state) => state.sources)
  const setSyncStatus = useSourceStore((state) => state.setSyncStatus)
  const setLastSynced = useSourceStore((state) => state.setLastSynced)
  const updateSource = useSourceStore((state) => state.updateSource)
  const addNotification = useUIStore((state) => state.addNotification)
  const tickRef = useRef(0)
  const sourcesRef = useRef(sources)

  useEffect(() => {
    sourcesRef.current = sources
  }, [sources])

  useEffect(() => {
    const syncNow = () => {
      const currentSources = sourcesRef.current
      const source = currentSources[tickRef.current % currentSources.length]

      if (!source) {
        return
      }

      const nextStatus = statuses[tickRef.current % statuses.length]
      const nextLastSynced = nextStatus === 'syncing' ? 'Syncing now' : 'Just now'

      updateSource(source.id, {
        status: nextStatus,
        lastSync: nextLastSynced,
      })
      setSyncStatus(nextStatus)
      setLastSynced(nextLastSynced)
      addNotification({
        type: nextStatus === 'syncing' ? 'info' : 'success',
        title: `${source.name} refreshed`,
        message: `${source.jobCount} jobs checked from ${source.name.toLowerCase()}.`,
      })

      tickRef.current += 1
    }

    syncNow()
    const timer = window.setInterval(syncNow, intervalMs)

    return () => window.clearInterval(timer)
  }, [addNotification, intervalMs, setLastSynced, setSyncStatus, updateSource])

  return { sources }
}
