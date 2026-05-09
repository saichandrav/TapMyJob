import { Cog, Plus, RotateCw } from 'lucide-react'
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { platforms as platformCatalog } from '../data/platforms.js'
import { useSourceStore } from '../store/sourceStore.js'

const statusStyles = {
  online: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
  error: 'border-danger/20 bg-danger/10 text-danger',
  'rate-limited': 'border-warning/20 bg-warning/10 text-warning',
  syncing: 'border-secondary/20 bg-secondary/10 text-secondary',
}

const logs = [
  { level: 'info', timestamp: '09:42:15', message: 'LinkedIn crawler started a delta sync for backend roles.' },
  { level: 'success', timestamp: '09:41:03', message: 'Naukri returned 148 new listings across Bangalore and Remote.' },
  { level: 'warn', timestamp: '09:39:26', message: 'Glassdoor hit a temporary rate limit, retry scheduled in 12 minutes.' },
  { level: 'success', timestamp: '09:37:51', message: 'Microsoft careers page finished a sync with 24 fresh jobs.' },
  { level: 'error', timestamp: '09:35:10', message: 'Shine parser failed on a malformed JSON payload, auto-retrying.' },
  { level: 'info', timestamp: '09:32:08', message: 'Infosys source refreshed keyword filters for React and DevOps.' },
]

const frequencyOptions = ['Every hour', 'Every 6h', 'Daily']

function statusTone(status) {
  return statusStyles[status] ?? statusStyles.online
}

function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('')
}

function ToggleSwitch({ enabled, onClick }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={onClick}
      className={`relative inline-flex h-7 w-12 items-center rounded-full border transition ${
        enabled ? 'border-primary/40 bg-primary/15' : 'border-border bg-background'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-text-primary transition-transform ${enabled ? 'translate-x-6 bg-secondary' : 'translate-x-1 bg-text-muted'}`}
      />
    </button>
  )
}

function CardButton({ children, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-text-primary transition hover:border-primary/40 hover:bg-white/5 ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

function ModalShell({ title, subtitle, onClose, children, maxWidth = 'max-w-2xl' }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 pt-16 backdrop-blur-sm">
      <div className={`w-full ${maxWidth} rounded-3xl border border-border bg-surface p-6 shadow-2xl`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-display text-2xl text-text-primary">{title}</div>
            <div className="mt-1 font-display italic text-sm text-text-muted">{subtitle}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border bg-card p-2 text-text-muted transition hover:text-text-primary"
          >
            ×
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  )
}

export default function Sources() {
  const { sources, updateSource, setSources } = useSourceStore()
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [configModalOpen, setConfigModalOpen] = useState(false)
  const [activeSource, setActiveSource] = useState(null)
  const [keywords, setKeywords] = useState(['React', 'Node.js'])
  const [keywordInput, setKeywordInput] = useState('')
  const [newSource, setNewSource] = useState({
    name: '',
    url: '',
    frequency: 'Every 6h',
  })

  const platformCards = useMemo(
    () =>
      platformCatalog.map((platform) => ({
        ...platform,
        enabled: sources.find((source) => source.id === platform.id)?.enabled ?? platform.enabled ?? true,
        status: sources.find((source) => source.id === platform.id)?.status ?? platform.status,
        jobCount: sources.find((source) => source.id === platform.id)?.jobCount ?? platform.jobCount,
        lastSync: sources.find((source) => source.id === platform.id)?.lastSync ?? platform.lastSync,
      })),
    [sources],
  )

  const toggleSource = (sourceId) => {
    const current = sources.find((source) => source.id === sourceId)

    if (!current) {
      return
    }

    updateSource(sourceId, {
      enabled: !current.enabled,
      status: current.enabled ? 'error' : 'syncing',
      lastSync: current.enabled ? current.lastSync : 'Syncing now',
    })
  }

  const openConfig = (source) => {
    setActiveSource(source)
    setKeywords(['React', 'Node.js'])
    setConfigModalOpen(true)
  }

  const syncNow = (sourceId) => {
    const sourceName = sources.find((source) => source.id === sourceId)?.name ?? 'Source'
    updateSource(sourceId, {
      status: 'syncing',
      lastSync: 'Syncing now',
    })
    toast.success(`${sourceName} sync started`)

    window.setTimeout(() => {
      updateSource(sourceId, {
        status: 'online',
        lastSync: 'Just now',
        jobCount: (sources.find((source) => source.id === sourceId)?.jobCount ?? 0) + 12,
      })
    }, 900)
  }

  const addKeyword = () => {
    const trimmed = keywordInput.trim()

    if (!trimmed || keywords.includes(trimmed)) {
      setKeywordInput('')
      return
    }

    setKeywords((current) => [...current, trimmed])
    setKeywordInput('')
  }

  const submitNewSource = (event) => {
    event.preventDefault()

    const slug = newSource.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
    if (!slug) {
      return
    }

    const created = {
      id: slug,
      name: newSource.name.trim(),
      logo: initials(newSource.name),
      color: '#6C63FF',
      category: newSource.url.includes('/careers') ? 'Company Career Page' : 'Job Board',
      url: newSource.url,
      jobCount: 0,
      status: 'syncing',
      lastSync: 'Syncing now',
      enabled: true,
    }

    setSources([...sources, created])
    setAddModalOpen(false)
    setNewSource({ name: '', url: '', frequency: 'Every 6h' })
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'error':
        return 'Error'
      case 'rate-limited':
        return 'Rate Limited'
      case 'syncing':
        return 'Syncing'
      default:
        return 'Online'
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[1.75rem] border border-border bg-surface/90 p-6 shadow-card-glow">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="font-display text-3xl text-text-primary">Scraping Sources</div>
            <div className="font-display italic text-sm text-text-muted">Manage every board and career page that feeds HireRadar.</div>
          </div>

          <CardButton onClick={() => setAddModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Source
          </CardButton>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {platformCards.map((platform) => (
          <article key={platform.id} className="rounded-3xl border border-border bg-card p-5 shadow-card-glow transition hover:border-primary/40 hover:shadow-[0_0_20px_rgba(108,99,255,0.15)]">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border text-sm font-semibold text-background"
                  style={{ backgroundColor: platform.color }}
                >
                  {platform.logo}
                </div>
                <div>
                  <div className="font-display text-xl text-text-primary">{platform.name}</div>
                  <div className="mt-1 text-xs uppercase tracking-[0.2em] text-text-muted">{platform.category}</div>
                </div>
              </div>

              <ToggleSwitch enabled={platform.enabled} onClick={() => toggleSource(platform.id)} />
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 text-sm">
              <span className={`rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] ${statusTone(platform.status)}`}>
                {getStatusText(platform.status)}
              </span>
              <div className="text-xs text-text-muted">Last sync: {platform.lastSync}</div>
            </div>

            <div className="mt-3 text-sm text-text-muted">{platform.jobCount.toLocaleString()} jobs scraped</div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <CardButton onClick={() => syncNow(platform.id)} className="flex-1 py-2.5 text-sm">
                <RotateCw className="h-4 w-4" />
                Sync Now
              </CardButton>

              <button
                type="button"
                onClick={() => openConfig(platform)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-background text-text-muted transition hover:border-primary/40 hover:text-text-primary"
                aria-label="Open source config"
              >
                <Cog className="h-4 w-4" />
              </button>
            </div>
          </article>
        ))}
      </section>

      <section className="rounded-[1.75rem] border border-border bg-surface/90 p-6 shadow-card-glow">
        <div className="font-display text-2xl text-text-primary">Scraping Logs</div>
        <div className="mt-4 rounded-3xl border border-border bg-[#0b0b10] p-4 font-mono text-sm">
          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {logs.map((log) => (
              <div key={`${log.timestamp}-${log.message}`} className="flex gap-3 text-xs leading-6">
                <span className="shrink-0 text-text-muted">[{log.timestamp}]</span>
                <span
                  className={
                    log.level === 'success'
                      ? 'text-emerald-300'
                      : log.level === 'warn'
                        ? 'text-warning'
                        : log.level === 'error'
                          ? 'text-danger'
                          : 'text-text-muted'
                  }
                >
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {addModalOpen ? (
        <ModalShell title="Add Source" subtitle="Register a new job source and configure its crawl cadence." onClose={() => setAddModalOpen(false)}>
          <form className="grid gap-4" onSubmit={submitNewSource}>
            <label className="grid gap-2 text-sm text-text-muted">
              Company / Platform name
              <input
                value={newSource.name}
                onChange={(event) => setNewSource((current) => ({ ...current, name: event.target.value }))}
                className="rounded-2xl border border-border bg-card px-4 py-3 text-text-primary outline-none placeholder:text-text-muted focus:border-primary/40"
                placeholder="e.g. Amazon Careers"
              />
            </label>

            <label className="grid gap-2 text-sm text-text-muted">
              Careers page URL
              <input
                value={newSource.url}
                onChange={(event) => setNewSource((current) => ({ ...current, url: event.target.value }))}
                className="rounded-2xl border border-border bg-card px-4 py-3 text-text-primary outline-none placeholder:text-text-muted focus:border-primary/40"
                placeholder="https://..."
              />
            </label>

            <label className="grid gap-2 text-sm text-text-muted">
              Scraping frequency
              <select
                value={newSource.frequency}
                onChange={(event) => setNewSource((current) => ({ ...current, frequency: event.target.value }))}
                className="rounded-2xl border border-border bg-card px-4 py-3 text-text-primary outline-none focus:border-primary/40"
              >
                {frequencyOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-2 text-sm text-text-muted">
              Keywords to track
              <div className="flex flex-wrap gap-2 rounded-2xl border border-border bg-card p-3">
                {keywords.map((keyword) => (
                  <button
                    key={keyword}
                    type="button"
                    onClick={() => setKeywords((current) => current.filter((item) => item !== keyword))}
                    className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 font-mono text-[11px] text-primary"
                  >
                    {keyword} ×
                  </button>
                ))}
                <input
                  value={keywordInput}
                  onChange={(event) => setKeywordInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      addKeyword()
                    }
                  }}
                  className="min-w-40 flex-1 bg-transparent px-2 py-1 text-sm text-text-primary outline-none placeholder:text-text-muted"
                  placeholder="Press Enter to add"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button type="submit" className="rounded-2xl border border-primary/30 bg-primary px-5 py-3 text-sm font-medium text-background transition hover:shadow-accent-glow">
                Submit
              </button>
            </div>
          </form>
        </ModalShell>
      ) : null}

      {configModalOpen && activeSource ? (
        <ModalShell
          title={`${activeSource.name} Config`}
          subtitle="Tune source-specific scraping behavior and keyword matching."
          onClose={() => setConfigModalOpen(false)}
          maxWidth="max-w-3xl"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border text-background" style={{ backgroundColor: activeSource.color }}>
                  {activeSource.logo}
                </div>
                <div>
                  <div className="font-display text-xl text-text-primary">{activeSource.name}</div>
                  <div className="text-xs text-text-muted">{activeSource.category}</div>
                </div>
              </div>
              <div className="mt-4 text-sm text-text-muted">
                Source URL: <span className="text-text-primary">{activeSource.url}</span>
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-card p-4">
              <div className="flex items-center justify-between text-sm text-text-muted">
                <span>Enabled</span>
                <ToggleSwitch enabled={activeSource.enabled} onClick={() => toggleSource(activeSource.id)} />
              </div>
              <div className="mt-4 space-y-2 text-sm text-text-muted">
                <div>Status: <span className="text-text-primary">{getStatusText(activeSource.status)}</span></div>
                <div>Last sync: <span className="text-text-primary">{activeSource.lastSync}</span></div>
                <div>Jobs scraped: <span className="text-text-primary">{activeSource.jobCount.toLocaleString()}</span></div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm text-text-muted">
              Keywords to track
              <div className="flex flex-wrap gap-2 rounded-2xl border border-border bg-card p-3">
                {keywords.map((keyword) => (
                  <span key={keyword} className="rounded-full border border-border bg-background px-3 py-1 font-mono text-[11px] text-text-muted">
                    {keyword}
                  </span>
                ))}
              </div>
            </label>
            <label className="grid gap-2 text-sm text-text-muted">
              Scraping cadence
              <select className="rounded-2xl border border-border bg-card px-4 py-3 text-text-primary outline-none focus:border-primary/40">
                {frequencyOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-5 flex justify-end gap-3">
            <button type="button" onClick={() => setConfigModalOpen(false)} className="rounded-2xl border border-border bg-card px-5 py-3 text-sm text-text-primary transition hover:border-primary/40">
              Close
            </button>
            <button type="button" className="rounded-2xl border border-primary/30 bg-primary px-5 py-3 text-sm font-medium text-background transition hover:shadow-accent-glow">
              Save config
            </button>
          </div>
        </ModalShell>
      ) : null}
    </div>
  )
}