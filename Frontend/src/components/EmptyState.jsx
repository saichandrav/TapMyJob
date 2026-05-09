import { Bookmark, Radar, TriangleAlert } from 'lucide-react'

const variants = {
  'no-jobs': {
    icon: Radar,
    title: 'No jobs found',
    subtitle: 'Try adjusting filters to discover more matches.',
    cta: 'Reset filters',
  },
  'no-saved': {
    icon: Bookmark,
    title: 'Nothing saved yet',
    subtitle: 'Bookmark roles from Job Feed to track them here.',
    cta: 'Explore jobs',
  },
  error: {
    icon: TriangleAlert,
    title: 'Failed to load',
    subtitle: 'Something went wrong. Please try again.',
    cta: 'Retry',
  },
}

export default function EmptyState({ variant = 'no-jobs', onAction }) {
  const config = variants[variant] ?? variants['no-jobs']
  const Icon = config.icon

  return (
    <div className="rounded-[1.75rem] border border-dashed border-border bg-card/50 px-6 py-12 text-center">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-surface text-primary">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="font-display text-2xl text-text-primary">{config.title}</h3>
      <p className="mx-auto mt-2 max-w-lg text-sm text-text-muted">{config.subtitle}</p>
      {onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 rounded-2xl border border-primary/30 bg-primary px-4 py-2 text-sm font-medium text-background"
        >
          {config.cta}
        </button>
      ) : null}
    </div>
  )
}
