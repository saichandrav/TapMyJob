import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Toaster } from 'react-hot-toast'
import AppShell from './layouts/AppShell.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Analytics from './pages/Analytics.jsx'
import JobFeed from './pages/JobFeed.jsx'
import SavedJobs from './pages/SavedJobs.jsx'
import Settings from './pages/Settings.jsx'
import Sources from './pages/Sources.jsx'
import Applications from './pages/Applications.jsx'
import { useScraper } from './hooks/useScraper.js'
import { useUIStore } from './store/uiStore.js'

function App() {
  useScraper()
  const activePage = useUIStore((state) => state.activePage)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    setProgress(35)
    const midTimer = window.setTimeout(() => setProgress(80), 120)
    const endTimer = window.setTimeout(() => setProgress(100), 260)
    const resetTimer = window.setTimeout(() => setProgress(0), 520)

    return () => {
      window.clearTimeout(midTimer)
      window.clearTimeout(endTimer)
      window.clearTimeout(resetTimer)
    }
  }, [activePage])

  const pageMap = {
    dashboard: Dashboard,
    'job-feed': JobFeed,
    'saved-jobs': SavedJobs,
    applications: Applications,
    analytics: Analytics,
    sources: Sources,
    settings: Settings,
  }

  const pageTitles = {
    dashboard: 'Dashboard',
    'job-feed': 'Job Feed',
    'saved-jobs': 'Saved Jobs',
    applications: 'Applications',
    analytics: 'Analytics',
    sources: 'Sources',
    settings: 'Settings',
  }

  const ActivePage = pageMap[activePage] ?? Dashboard

  return (
    <>
      <div className="pointer-events-none fixed left-0 right-0 top-0 z-[100] h-1 bg-transparent">
        <div
          className="h-full bg-primary transition-all duration-200"
          style={{ width: `${progress}%`, boxShadow: progress ? '0 0 18px rgba(108,99,255,0.7)' : 'none' }}
        />
      </div>
      <AppShell pageTitle={pageTitles[activePage] ?? 'Dashboard'}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activePage}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
          >
            <ActivePage />
          </motion.div>
        </AnimatePresence>
      </AppShell>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#16161F',
            color: '#F0F0F5',
            border: '1px solid #22222E',
            fontFamily: 'JetBrains Mono, monospace',
          },
        }}
      />
    </>
  )
}

export default App
