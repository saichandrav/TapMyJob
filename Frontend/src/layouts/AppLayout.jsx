import {
  BarChart2,
  Bell,
  Bookmark,
  ChevronDown,
  Globe,
  LayoutDashboard,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Rss,
  Search,
  Send,
  Settings,
  X,
} from 'lucide-react'
import { createContext, useContext, useEffect, useRef, useState } from 'react'

const SidebarContext = createContext(null)

export function useSidebar() {
  const context = useContext(SidebarContext)

  if (!context) {
    throw new Error('useSidebar must be used within AppLayout')
  }

  return context
}

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Job Feed', icon: Rss },
  { label: 'Saved Jobs', icon: Bookmark },
  { label: 'Applications', icon: Send },
  { label: 'Analytics', icon: BarChart2 },
  { label: 'Sources', icon: Globe },
  { label: 'Settings', icon: Settings },
]

function RadarMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-secondary" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" opacity="0.35" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
      <path d="M12 4v16M4 12h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />
      <path d="M12 12l6-5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="18" cy="7" r="1.25" fill="currentColor" />
    </svg>
  )
}

function AppShellButton({ className = '', children, ...props }) {
  return (
    <button
      className={`flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 text-sm text-text-primary transition hover:border-primary/50 hover:bg-gray-100 ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function AppLayout({ pageTitle, children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const searchInputRef = useRef(null)
  const dropdownRef = useRef(null)

  const sidebarWidth = sidebarCollapsed ? '4rem' : '15rem'

  useEffect(() => {
    const onKeyDown = (event) => {
      const isCommandShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k'

      if (isCommandShortcut) {
        event.preventDefault()
        setSearchOpen(true)
      }

      if (event.key === 'Escape') {
        setSearchOpen(false)
        setMobileSidebarOpen(false)
        setDropdownOpen(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)

    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus()
    }
  }, [searchOpen])

  useEffect(() => {
    const onPointerDown = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', onPointerDown)

    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [])

  const sidebarContextValue = {
    sidebarCollapsed,
    mobileSidebarOpen,
    setSidebarCollapsed,
    setMobileSidebarOpen,
    toggleSidebar: () => setSidebarCollapsed((current) => !current),
    openMobileSidebar: () => setMobileSidebarOpen(true),
    closeMobileSidebar: () => setMobileSidebarOpen(false),
  }

  return (
    <SidebarContext.Provider value={sidebarContextValue}>
      <div className="min-h-screen bg-background text-text-primary" style={{ '--sidebar-width': sidebarWidth }}>
        <aside
          className={`fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-border bg-surface/95 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] backdrop-blur-xl transition-[width] duration-300 lg:flex`}
          style={{ width: sidebarWidth }}
        >
          <div className={`flex items-center gap-3 border-b border-border px-4 ${sidebarCollapsed ? 'h-14 justify-center' : 'h-14'}`}>
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 shadow-accent-glow">
              <RadarMark />
            </div>
            {!sidebarCollapsed ? (
              <div className="min-w-0">
                <div className="font-display text-lg tracking-wide text-text-primary">HireRadar</div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-text-muted">Job intelligence</div>
              </div>
            ) : null}
          </div>

          <nav className="flex-1 px-3 py-4">
            <div className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isCollapsed = sidebarCollapsed

                return (
                  <button
                    key={item.label}
                    title={isCollapsed ? item.label : undefined}
                    className={`group relative flex w-full items-center rounded-2xl border border-transparent px-3 py-3 text-sm font-medium text-text-muted transition hover:border-border hover:bg-gray-100 hover:text-text-primary ${
                      isCollapsed ? 'justify-center' : 'gap-3'
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0 text-text-muted transition group-hover:text-primary" />
                    {!isCollapsed ? <span className="truncate">{item.label}</span> : null}
                    {isCollapsed ? (
                      <span className="pointer-events-none absolute left-full top-1/2 ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-lg border border-border bg-card px-2.5 py-1 text-xs text-text-primary shadow-card-glow group-hover:block">
                        {item.label}
                      </span>
                    ) : null}
                  </button>
                )
              })}
            </div>
          </nav>

          <div className="border-t border-border p-3">
            <button
              type="button"
              onClick={() => setSidebarCollapsed((current) => !current)}
              className={`flex w-full items-center rounded-2xl border border-border bg-card px-3 py-3 text-sm text-text-primary transition hover:border-primary/40 hover:bg-gray-100 ${
                sidebarCollapsed ? 'justify-center' : 'justify-between'
              }`}
            >
              <span className="flex items-center gap-3">
                {sidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
                {!sidebarCollapsed ? <span>Collapse sidebar</span> : null}
              </span>
              {!sidebarCollapsed ? <span className="text-xs uppercase tracking-[0.2em] text-text-muted">Ctrl+[</span> : null}
            </button>
          </div>
        </aside>

        <div className={`fixed inset-0 z-40 bg-black/65 backdrop-blur-sm transition-opacity lg:hidden ${mobileSidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`} onClick={() => setMobileSidebarOpen(false)} />

        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-border bg-surface/98 shadow-2xl backdrop-blur-xl transition-transform duration-300 lg:hidden ${
            mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex h-14 items-center justify-between border-b border-border px-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 shadow-accent-glow">
                <RadarMark />
              </div>
              <div>
                <div className="font-display text-lg tracking-wide text-text-primary">HireRadar</div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-text-muted">Job intelligence</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              className="rounded-full border border-border bg-card p-2 text-text-muted transition hover:text-text-primary"
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <nav className="flex-1 px-3 py-4">
            <div className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon

                return (
                  <button
                    key={item.label}
                    className="flex w-full items-center gap-3 rounded-2xl border border-transparent px-3 py-3 text-sm font-medium text-text-muted transition hover:border-border hover:bg-gray-100 hover:text-text-primary"
                  >
                    <Icon className="h-5 w-5 shrink-0 text-text-muted transition group-hover:text-primary" />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </div>
          </nav>

          <div className="border-t border-border p-3">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border border-border bg-card px-3 py-3 text-sm text-text-primary transition hover:border-primary/40 hover:bg-gray-100"
            >
              <PanelLeftClose className="h-5 w-5" />
              Close drawer
            </button>
          </div>
        </aside>

        <div className="min-h-screen pt-14 transition-[margin-left] duration-300 lg:ml-(--sidebar-width)">
          <header className="fixed left-0 right-0 top-0 z-30 h-14 border-b border-border bg-background/80 backdrop-blur-xl lg:left-(--sidebar-width)">
            <div className="flex h-full items-center gap-3 px-4 sm:px-6">
              <div className="flex items-center gap-2 lg:hidden">
                <AppShellButton type="button" onClick={() => setMobileSidebarOpen(true)} className="px-3">
                  <Menu className="h-4 w-4" />
                </AppShellButton>
              </div>

              <div className="min-w-0 flex-1">
                <div className="truncate font-display text-lg text-text-primary">{pageTitle}</div>
              </div>

              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="hidden min-w-[16rem] items-center gap-3 rounded-2xl border border-border bg-card px-4 py-2 text-left text-sm text-text-muted transition hover:border-primary/40 hover:bg-gray-100 md:flex"
              >
                <Search className="h-4 w-4 shrink-0 text-text-muted" />
                <span className="flex-1">Search jobs, companies, or sources</span>
                <span className="rounded-lg border border-border bg-surface px-2 py-1 font-mono text-[11px] text-text-muted">Ctrl K</span>
              </button>

              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-card text-text-muted transition hover:border-primary/40 hover:bg-gray-100 md:hidden"
                aria-label="Search"
              >
                <Search className="h-4 w-4" />
              </button>

              <button
                type="button"
                className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-card text-text-muted transition hover:border-primary/40 hover:bg-gray-100"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger" />
              </button>

              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen((current) => !current)}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card px-2 py-1.5 transition hover:border-primary/40 hover:bg-gray-100"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-primary to-secondary text-sm font-semibold text-background">
                    AV
                  </div>
                  <div className="hidden text-left sm:block">
                    <div className="text-sm font-medium text-text-primary">Avery</div>
                    <div className="text-xs text-text-muted">Lead operator</div>
                  </div>
                  <ChevronDown className="hidden h-4 w-4 text-text-muted sm:block" />
                </button>

                {dropdownOpen ? (
                  <div className="absolute right-0 mt-3 w-56 rounded-2xl border border-border bg-surface p-2 shadow-card-glow">
                    <button className="flex w-full items-center rounded-xl px-3 py-2 text-left text-sm text-text-muted transition hover:bg-gray-100 hover:text-text-primary">
                      Profile
                    </button>
                    <button className="flex w-full items-center rounded-xl px-3 py-2 text-left text-sm text-text-muted transition hover:bg-gray-100 hover:text-text-primary">
                      Preferences
                    </button>
                    <button className="flex w-full items-center rounded-xl px-3 py-2 text-left text-sm text-text-muted transition hover:bg-gray-100 hover:text-text-primary">
                      Sign out
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="hidden items-center lg:flex">
                <div className="font-mono text-sm text-text-muted">Last synced 2 min ago</div>
              </div>
            </div>
          </header>

          <main className="px-4 py-6 sm:px-6">
            <div className="mb-6 flex items-center justify-between gap-4 lg:hidden">
              <div className="font-mono text-sm text-text-muted">Last synced 2 min ago</div>
            </div>
            {children}
          </main>
        </div>

        {searchOpen ? (
          <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 pt-24 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-3xl border border-border bg-surface p-4 shadow-2xl animate-fade-slide-up">
              <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3">
                <Search className="h-4 w-4 text-text-muted" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search jobs, companies, sources, or commands"
                  className="w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="rounded-full border border-border p-2 text-text-muted transition hover:text-text-primary"
                  aria-label="Close search"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {['Open Job Feed', 'Review Saved Jobs', 'Scan new sources', 'View analytics'].map((item) => (
                  <button
                    key={item}
                    type="button"
                    className="rounded-2xl border border-border bg-card px-4 py-3 text-left text-sm text-text-muted transition hover:border-primary/40 hover:bg-gray-100 hover:text-text-primary"
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-text-muted">
                <span>Press Esc to close</span>
                <span className="font-mono">Cmd/Ctrl + K</span>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </SidebarContext.Provider>
  )
}

export default AppLayout