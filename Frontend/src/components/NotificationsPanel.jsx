import { AlertCircle, Bell, BriefcaseBusiness, CalendarClock, CheckCheck, Settings2, X } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'
import { useUIStore } from '../store/uiStore.js'

function formatGroupDate(createdAt, today, yesterday) {
  const input = new Date(createdAt)
  input.setHours(0, 0, 0, 0)

  if (input.getTime() === today.getTime()) {
    return 'Today'
  }

  if (input.getTime() === yesterday.getTime()) {
    return 'Yesterday'
  }

  return 'Earlier'
}

function formatTimestamp(createdAt) {
  const date = new Date(createdAt)
  const diffMinutes = Math.max(1, Math.round((Date.now() - date.getTime()) / 60000))

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`
  }

  const diffHours = Math.max(1, Math.round(diffMinutes / 60))
  if (diffHours < 24) {
    return `${diffHours}h ago`
  }

  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date)
}

function getIcon(type) {
  switch (type) {
    case 'new-job':
      return BriefcaseBusiness
    case 'error':
      return AlertCircle
    case 'system':
    default:
      return Settings2
  }
}

function NotificationGroup({ title, items, onItemClick }) {
  if (items.length === 0) {
    return null
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.24em] text-text-muted">
        <CalendarClock className="h-4 w-4" />
        {title}
      </div>

      <div className="space-y-2">
        {items.map((notification) => {
          const Icon = getIcon(notification.type)

          return (
            <button
              key={notification.id}
              type="button"
              onClick={() => onItemClick(notification.id)}
              className={`w-full rounded-3xl border px-4 py-4 text-left transition ${
                notification.read
                  ? 'border-border bg-card hover:border-primary/30 hover:bg-gray-100'
                  : 'border-violet-500/30 bg-violet-500/10 hover:border-violet-400/40 hover:bg-violet-500/15'
              }`}
              style={{ borderLeftWidth: '3px', borderLeftColor: notification.read ? undefined : '#8b5cf6' }}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-border bg-background text-text-primary">
                  <Icon className="h-4 w-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-text-primary">{notification.title}</div>
                      <p className="mt-1 text-sm text-text-muted">{notification.message}</p>
                    </div>

                    {!notification.read ? <span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" /> : null}
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3 font-mono text-xs text-text-muted">
                    <span>{formatTimestamp(notification.createdAt)}</span>
                    <span className="capitalize">{notification.type.replace('-', ' ')}</span>
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}

export default function NotificationsPanel({ open, onClose }) {
  const notifications = useUIStore((state) => state.notifications)
  const markAllNotificationsRead = useUIStore((state) => state.markAllNotificationsRead)
  const markNotificationRead = useUIStore((state) => state.markNotificationRead)
  const panelRef = useRef(null)

  useEffect(() => {
    if (!open) {
      return undefined
    }

    const onPointerDown = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose()
      }
    }

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose, open])

  const groupedNotifications = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)

    const groups = {
      Today: [],
      Yesterday: [],
      Earlier: [],
    }

    notifications.forEach((notification) => {
      const group = formatGroupDate(notification.createdAt, today, yesterday)
      groups[group].push(notification)
    })

    return groups
  }, [notifications])

  const unreadCount = notifications.filter((notification) => !notification.read).length

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-60 bg-black/65 backdrop-blur-sm">
      <aside
        ref={panelRef}
        className="absolute right-0 top-0 flex h-full w-full max-w-[28rem] flex-col border-l border-border bg-surface/98 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <div className="font-display text-2xl text-text-primary">Notifications</div>
            <p className="mt-1 text-sm text-text-muted">{unreadCount} unread updates across jobs, scraper health, and system events.</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border bg-card p-2 text-text-muted transition hover:text-text-primary"
            aria-label="Close notifications"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-text-muted">
            <Bell className="h-4 w-4" />
            Live feed
          </div>

          <button
            type="button"
            onClick={markAllNotificationsRead}
            className="inline-flex items-center gap-2 rounded-2xl border border-border bg-background px-3 py-2 text-sm text-text-primary transition hover:border-primary/40 hover:bg-gray-100"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="space-y-6">
            <NotificationGroup title="Today" items={groupedNotifications.Today} onItemClick={markNotificationRead} />
            <NotificationGroup title="Yesterday" items={groupedNotifications.Yesterday} onItemClick={markNotificationRead} />
            <NotificationGroup title="Earlier" items={groupedNotifications.Earlier} onItemClick={markNotificationRead} />

            {notifications.length === 0 ? (
              <div className="rounded-[1.75rem] border border-dashed border-border bg-card/50 px-6 py-12 text-center text-sm text-text-muted">
                No notifications yet.
              </div>
            ) : null}
          </div>
        </div>
      </aside>
    </div>
  )
}
