import { ExternalLink, RefreshCw } from 'lucide-react'
import { useSourceStore } from '../store/sourceStore.js'

export default function SourcesPage() {
  const { sources, syncStatus, lastSynced, setSyncStatus, setLastSynced, updateSource } = useSourceStore()

  const refreshAll = () => {
    setSyncStatus('syncing')
    setLastSynced('Syncing now')

    sources.forEach((source, index) => {
      updateSource(source.id, {
        status: index % 2 === 0 ? 'synced' : 'healthy',
        lastSync: index === 0 ? 'Just now' : source.lastSync,
      })
    })
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[1.75rem] border border-border bg-surface/90 p-6 shadow-card-glow">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="font-display text-2xl text-text-primary">Sources</div>
            <p className="mt-1 text-sm text-text-muted">Monitor every connected job board and employer source.</p>
          </div>

          <button
            type="button"
            onClick={refreshAll}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-text-primary transition hover:border-primary/40 hover:bg-white/5"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh all
          </button>
        </div>

        <div className="mt-4 text-sm text-text-muted">
          Sync status: <span className="text-text-primary">{syncStatus}</span> · Last synced <span className="font-mono">{lastSynced}</span>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sources.map((source) => (
            <div key={source.id} className="rounded-3xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-background text-sm font-semibold text-text-primary">
                      {source.logo}
                    </span>
                    <div>
                      <div className="text-base font-medium text-text-primary">{source.name}</div>
                      <div className="text-xs text-text-muted">{source.category}</div>
                    </div>
                  </div>
                </div>
                <span className="rounded-full border border-border bg-background px-2.5 py-1 text-xs capitalize text-text-muted">
                  {source.status}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-text-muted">
                <div className="rounded-2xl border border-border bg-background p-3">{source.jobCount} jobs</div>
                <div className="rounded-2xl border border-border bg-background p-3">{source.lastSync}</div>
              </div>

              <a
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-sm text-secondary transition hover:opacity-80"
              >
                Open source <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
