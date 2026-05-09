import confetti from 'canvas-confetti'
import {
  ArrowRight,
  CalendarClock,
  GripVertical,
  Link2,
  MapPin,
  Plus,
  UserRound,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { DndContext, DragOverlay, PointerSensor, useDraggable, useDroppable, useSensor, useSensors } from '@dnd-kit/core'
import { useJobs } from '../hooks/useJobs.js'
import { platforms as platformConfigs } from '../data/platforms.js'

const columns = [
  { id: 'wishlist', label: 'Wishlist' },
  { id: 'applied', label: 'Applied' },
  { id: 'phone-screen', label: 'Phone Screen' },
  { id: 'technical', label: 'Technical' },
  { id: 'final-round', label: 'Final Round' },
  { id: 'offer', label: 'Offer' },
  { id: 'rejected', label: 'Rejected' },
]

const stageAccentMap = {
  wishlist: '#8b5cf6',
  applied: '#06b6d4',
  'phone-screen': '#6366f1',
  technical: '#10b981',
  'final-round': '#f59e0b',
  offer: '#22c55e',
  rejected: '#ef4444',
}

const platformLabelMap = platformConfigs.reduce((accumulator, platform) => {
  accumulator[platform.id] = platform.name
  return accumulator
}, {})

function hashSeed(value) {
  return [...String(value)].reduce((accumulator, character) => accumulator + character.charCodeAt(0), 0)
}

function formatDateLabel(date) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date)
}

function formatDateTime(dateValue) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(dateValue))
}

function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('')
}

function mapStageToStore(stage) {
  switch (stage) {
    case 'wishlist':
      return 'saved'
    case 'applied':
      return 'applied'
    case 'phone-screen':
    case 'technical':
    case 'final-round':
      return 'interview'
    case 'offer':
      return 'offer'
    default:
      return 'new'
  }
}

function deriveStage(job, index) {
  const seed = hashSeed(`${job.id}:${index}`)

  if (job.stage === 'offer') {
    return seed % 4 === 0 ? 'final-round' : 'offer'
  }

  if (job.stage === 'interview') {
    return seed % 3 === 0 ? 'phone-screen' : seed % 2 === 0 ? 'technical' : 'final-round'
  }

  if (job.stage === 'applied') {
    return seed % 4 === 0 ? 'phone-screen' : 'applied'
  }

  if (job.stage === 'saved' || job.stage === 'new') {
    return seed % 5 === 0 ? 'rejected' : 'wishlist'
  }

  return columns[seed % columns.length].id
}

function buildApplication(job, index) {
  const stage = deriveStage(job, index)
  const appliedAt = new Date(Date.now() - (index + 1) * 86400000)

  return {
    id: `app-${job.id}`,
    jobId: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    platformId: job.platformId,
    logoUrl: job.logoUrl,
    salary: job.salary,
    stage,
    appliedAt: appliedAt.toISOString(),
    nextAction: stage === 'offer' ? 'Review compensation and negotiate' : stage === 'rejected' ? 'Archive and update notes' : 'Follow up with recruiter',
    reminder: stage === 'wishlist' ? 'Shortlist this role before Friday' : stage === 'applied' ? 'Check application status next Monday' : 'Prepare for next interview step',
    contacts: [
      `${job.company.split(' ')[0]} Recruiter`,
      'Hiring Manager',
    ],
    documents: [
      'Resume v4.2',
      'Cover Letter',
      'Portfolio PDF',
    ],
    notes: `Strong fit for ${job.category.toLowerCase()} with focus on ${job.skills?.slice(0, 2).join(' and ') ?? 'core stack'}.`,
    timeline: [
      { label: 'Applied', date: formatDateLabel(appliedAt), detail: `${platformLabelMap[job.platformId] ?? job.platformId} submission received.` },
      { label: 'Recruiter screen', date: formatDateLabel(new Date(appliedAt.getTime() + 3 * 86400000)), detail: 'Awaiting initial recruiter response.' },
      { label: 'Next step', date: formatDateLabel(new Date(appliedAt.getTime() + 7 * 86400000)), detail: 'Technical interview prep and follow-up.' },
    ],
    nextSteps: [
      'Send follow-up note',
      'Review role scorecard',
      'Prep talking points',
    ],
  }
}

function getCardAccent(stage) {
  return stageAccentMap[stage] ?? '#8b5cf6'
}

function DnDApplicationCard({ application, onOpen }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: application.id,
    data: { stage: application.stage },
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        opacity: isDragging ? 0.5 : 1,
      }}
      {...attributes}
      {...listeners}
      onClick={() => onOpen(application)}
      className="group cursor-grab rounded-2xl border border-border bg-card px-4 py-3 shadow-[0_12px_34px_rgba(0,0,0,0.22)] transition hover:border-primary/30 hover:bg-white/5 active:cursor-grabbing"
      style={{ borderLeftWidth: '3px', borderLeftColor: getCardAccent(application.stage) }}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-xs font-semibold text-text-primary">
          {initials(application.company) || 'HR'}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-text-primary">{application.title}</div>
              <div className="truncate text-xs text-text-muted">{application.company}</div>
            </div>
            <GripVertical className="h-4 w-4 text-text-muted opacity-0 transition group-hover:opacity-100" />
          </div>

          <div className="mt-2 flex items-center gap-2 text-xs text-text-muted">
            <CalendarClock className="h-3.5 w-3.5" />
            <span className="font-mono">{formatDateLabel(new Date(application.appliedAt))}</span>
          </div>

          <div className="mt-2 rounded-xl border border-border bg-[#111118] px-3 py-2 text-xs text-text-muted">
            {application.nextAction}
          </div>
        </div>
      </div>
    </div>
  )
}

function Column({ column, applications, onAdd, onOpen }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  return (
    <section
      ref={setNodeRef}
      className={`flex min-h-136 flex-col rounded-[1.75rem] border border-border bg-[#111118] p-4 transition ${
        isOver ? 'border-primary/50 shadow-[0_0_0_1px_rgba(139,92,246,0.4)]' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-display text-lg text-text-primary">{column.label}</div>
          <div className="mt-1 h-1.5 w-16 rounded-full" style={{ backgroundColor: getCardAccent(column.id) }} />
        </div>

        <span className="rounded-full border border-border bg-card px-2.5 py-1 font-mono text-[11px] text-text-muted">
          {applications.length}
        </span>
      </div>

      <button
        type="button"
        onClick={() => onAdd(column.id)}
        className="mt-4 inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 text-sm text-text-primary transition hover:border-primary/40 hover:bg-white/5"
      >
        <Plus className="h-4 w-4" /> Add job
      </button>

      <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
        {applications.length > 0 ? (
          applications.map((application) => <DnDApplicationCard key={application.id} application={application} onOpen={onOpen} />)
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 px-4 py-10 text-center text-xs text-text-muted">
            Drop cards here or add a new one.
          </div>
        )}
      </div>
    </section>
  )
}

function DrawerSection({ title, children }) {
  return (
    <section className="rounded-3xl border border-border bg-card p-4">
      <div className="font-display text-lg text-text-primary">{title}</div>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function AddApplicationModal({ open, stage, onClose, onCreate }) {
  const [form, setForm] = useState({ title: '', company: '', location: 'Remote', reminder: '', nextAction: '' })

  useEffect(() => {
    if (open) {
      setForm({ title: '', company: '', location: 'Remote', reminder: '', nextAction: '' })
    }
  }, [open])

  if (!open) {
    return null
  }

  const submit = (event) => {
    event.preventDefault()
    onCreate({ ...form, stage })
  }

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[1.75rem] border border-border bg-surface p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-display text-2xl text-text-primary">Add job</div>
            <p className="mt-1 text-sm text-text-muted">Create a new application in {columns.find((column) => column.id === stage)?.label ?? 'Wishlist'}.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-border bg-card p-2 text-text-muted transition hover:text-text-primary">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="mt-5 space-y-4">
          <label className="block space-y-2 text-sm text-text-muted">
            <span>Title</span>
            <input
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              className="w-full rounded-2xl border border-border bg-[#111118] px-4 py-3 text-text-primary outline-none placeholder:text-text-muted"
              placeholder="Senior React Engineer"
            />
          </label>
          <label className="block space-y-2 text-sm text-text-muted">
            <span>Company</span>
            <input
              value={form.company}
              onChange={(event) => setForm((current) => ({ ...current, company: event.target.value }))}
              className="w-full rounded-2xl border border-border bg-[#111118] px-4 py-3 text-text-primary outline-none placeholder:text-text-muted"
              placeholder="Acme Corp"
            />
          </label>
          <label className="block space-y-2 text-sm text-text-muted">
            <span>Location</span>
            <input
              value={form.location}
              onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
              className="w-full rounded-2xl border border-border bg-[#111118] px-4 py-3 text-text-primary outline-none placeholder:text-text-muted"
              placeholder="Remote"
            />
          </label>
          <label className="block space-y-2 text-sm text-text-muted">
            <span>Next action</span>
            <input
              value={form.nextAction}
              onChange={(event) => setForm((current) => ({ ...current, nextAction: event.target.value }))}
              className="w-full rounded-2xl border border-border bg-[#111118] px-4 py-3 text-text-primary outline-none placeholder:text-text-muted"
              placeholder="Follow up with recruiter"
            />
          </label>
          <label className="block space-y-2 text-sm text-text-muted">
            <span>Reminder</span>
            <input
              value={form.reminder}
              onChange={(event) => setForm((current) => ({ ...current, reminder: event.target.value }))}
              className="w-full rounded-2xl border border-border bg-[#111118] px-4 py-3 text-text-primary outline-none placeholder:text-text-muted"
              placeholder="Prep for interview"
            />
          </label>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-text-primary transition hover:bg-white/5">
              Cancel
            </button>
            <button type="submit" className="rounded-2xl border border-primary/30 bg-primary px-4 py-3 text-sm font-medium text-background transition hover:shadow-accent-glow">
              Create application
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Applications() {
  const { jobs, setSelectedJob, markJobStage } = useJobs({ pageSize: 1000 })
  const [applications, setApplications] = useState(() => jobs.slice(0, 21).map((job, index) => buildApplication(job, index)))
  const [activeId, setActiveId] = useState(null)
  const [selectedApplicationId, setSelectedApplicationId] = useState(null)
  const [addStage, setAddStage] = useState(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const applicationsById = useMemo(
    () => applications.reduce((accumulator, application) => {
      accumulator[application.id] = application
      return accumulator
    }, {}),
    [applications],
  )

  const groupedApplications = useMemo(
    () =>
      columns.map((column) => ({
        ...column,
        applications: applications.filter((application) => application.stage === column.id),
      })),
    [applications],
  )

  const selectedApplication = selectedApplicationId ? applicationsById[selectedApplicationId] ?? null : null
  const activeApplication = activeId ? applicationsById[activeId] ?? null : null

  useEffect(() => {
    if (selectedApplicationId && !applicationsById[selectedApplicationId]) {
      setSelectedApplicationId(null)
    }
  }, [applicationsById, selectedApplicationId])

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setSelectedApplicationId(null)
        setAddStage(null)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const updateApplication = (applicationId, updates) => {
    setApplications((current) => current.map((application) => (application.id === applicationId ? { ...application, ...updates } : application)))
  }

  const moveApplication = (applicationId, stage) => {
    const previous = applicationsById[applicationId]

    if (!previous || previous.stage === stage) {
      return
    }

    setApplications((current) => current.map((application) => (application.id === applicationId ? { ...application, stage } : application)))
    markJobStage(previous.jobId, mapStageToStore(stage))

    if (stage === 'offer') {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.7 },
        colors: ['#8b5cf6', '#34d399', '#6366f1', '#f59e0b'],
      })
    }
  }

  const handleDragStart = (event) => {
    setActiveId(event.active.id)
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) {
      return
    }

    const targetStage = columns.some((column) => column.id === over.id) ? over.id : applicationsById[over.id]?.stage

    if (!targetStage) {
      return
    }

    moveApplication(active.id, targetStage)
  }

  const handleAddApplication = (stage, payload) => {
    const created = {
      id: `app-${Date.now()}`,
      jobId: `manual-${Date.now()}`,
      title: payload.title || 'New job',
      company: payload.company || 'New company',
      location: payload.location || 'Remote',
      platformId: 'manual',
      logoUrl: null,
      salary: 'Not disclosed',
      stage,
      appliedAt: new Date().toISOString(),
      nextAction: payload.nextAction || 'Follow up with recruiter',
      reminder: payload.reminder || 'Review the opportunity',
      contacts: ['Recruiter'],
      documents: ['Resume v1'],
      notes: 'Manually added from the applications board.',
      timeline: [{ label: 'Created', date: formatDateLabel(new Date()), detail: 'Added manually to the board.' }],
      nextSteps: ['Complete the application'],
    }

    setApplications((current) => [created, ...current])
    setSelectedApplicationId(created.id)
    setAddStage(null)
  }

  const selectedApplicationAccent = selectedApplication ? getCardAccent(selectedApplication.stage) : '#8b5cf6'

  return (
    <div className="space-y-6">
      <section className="rounded-[1.75rem] border border-border bg-surface/90 p-6 shadow-card-glow">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="font-display text-3xl text-text-primary">Applications</div>
            <p className="mt-2 max-w-2xl text-sm text-text-muted">
              Track every opportunity from wishlist to offer in a draggable board with full application context.
            </p>
          </div>

          <div className="rounded-full border border-border bg-[#111118] px-4 py-2 text-sm text-text-muted">
            {applications.length} applications
          </div>
        </div>
      </section>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_390px]">
          <div className="grid gap-4 2xl:grid-cols-2">
            {groupedApplications.map((column) => (
              <Column
                key={column.id}
                column={column}
                applications={column.applications}
                onAdd={setAddStage}
                onOpen={(application) => {
                  setSelectedApplicationId(application.id)
                  setSelectedJob(jobs.find((job) => job.id === application.jobId) ?? null)
                }}
              />
            ))}
          </div>

          <aside className="hidden rounded-[1.75rem] border border-border bg-[#111118] p-5 shadow-card-glow xl:block xl:sticky xl:top-20 xl:h-[calc(100vh-6rem)] xl:overflow-y-auto">
            {selectedApplication ? (
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-background text-sm font-semibold text-text-primary"
                    style={{ borderColor: `${selectedApplicationAccent}40` }}
                  >
                    {initials(selectedApplication.company) || 'HR'}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="font-display text-xl font-semibold leading-tight text-text-primary">{selectedApplication.title}</div>
                    <div className="mt-1 text-sm text-text-muted">{selectedApplication.company}</div>
                    <div className="mt-2 flex items-center gap-2 text-sm text-text-muted">
                      <MapPin className="h-4 w-4" /> {selectedApplication.location}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedApplicationId(null)}
                    className="rounded-full border border-border bg-card px-3 py-2 text-xs text-text-muted transition hover:text-text-primary"
                  >
                    Close
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl border border-border bg-card p-4">
                    <div className="text-xs font-mono text-text-muted">Applied</div>
                    <div className="mt-1 font-mono text-sm text-text-primary">{formatDateTime(selectedApplication.appliedAt)}</div>
                  </div>
                  <div className="rounded-3xl border border-border bg-card p-4">
                    <div className="text-xs font-mono text-text-muted">Current stage</div>
                    <div className="mt-1 font-mono text-sm capitalize text-text-primary">{selectedApplication.stage.replace('-', ' ')}</div>
                  </div>
                </div>

                <DrawerSection title="Timeline">
                  <div className="space-y-4">
                    {selectedApplication.timeline.map((entry, index) => (
                      <div key={`${entry.label}-${index}`} className="flex gap-3">
                        <div className="mt-1 h-3 w-3 rounded-full" style={{ backgroundColor: selectedApplicationAccent }} />
                        <div>
                          <div className="text-sm text-text-primary">{entry.label}</div>
                          <div className="font-mono text-xs text-text-muted">{entry.date}</div>
                          <p className="mt-1 text-sm text-text-muted">{entry.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </DrawerSection>

                <DrawerSection title="Notes">
                  <textarea
                    value={selectedApplication.notes}
                    onChange={(event) => updateApplication(selectedApplication.id, { notes: event.target.value })}
                    rows={5}
                    className="w-full rounded-2xl border border-border bg-[#111118] px-4 py-3 text-sm text-text-primary outline-none placeholder:text-text-muted"
                    placeholder="Capture notes about the role, interview, or recruiter conversation."
                  />
                </DrawerSection>

                <DrawerSection title="Contacts">
                  <div className="flex flex-wrap gap-2">
                    {selectedApplication.contacts.map((contact) => (
                      <span key={contact} className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs text-text-muted">
                        <UserRound className="h-3.5 w-3.5" /> {contact}
                      </span>
                    ))}
                  </div>
                </DrawerSection>

                <DrawerSection title="Next steps">
                  <div className="space-y-2 text-sm text-text-muted">
                    {selectedApplication.nextSteps.map((step) => (
                      <div key={step} className="flex items-center gap-2 rounded-2xl border border-border bg-background px-3 py-2">
                        <ArrowRight className="h-4 w-4 text-secondary" />
                        {step}
                      </div>
                    ))}
                  </div>
                </DrawerSection>

                <DrawerSection title="Documents attached">
                  <div className="space-y-2">
                    {selectedApplication.documents.map((document) => (
                      <div key={document} className="flex items-center justify-between rounded-2xl border border-border bg-background px-3 py-2 text-sm text-text-muted">
                        <span className="flex items-center gap-2 text-text-primary">
                          <Link2 className="h-4 w-4 text-secondary" /> {document}
                        </span>
                        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-text-muted">Attached</span>
                      </div>
                    ))}
                  </div>
                </DrawerSection>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-border bg-card/60 p-8 text-center text-sm text-text-muted">
                Select an application to inspect the full timeline, notes, and documents.
              </div>
            )}
          </aside>
        </div>

        <DragOverlay>
          {activeApplication ? (
            <div className="w-[20rem] rounded-2xl border border-border bg-card px-4 py-3 shadow-2xl" style={{ borderLeftWidth: '3px', borderLeftColor: getCardAccent(activeApplication.stage) }}>
              <div className="text-sm font-medium text-text-primary">{activeApplication.title}</div>
              <div className="mt-1 text-xs text-text-muted">{activeApplication.company}</div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {addStage ? (
        <AddApplicationModal open={Boolean(addStage)} stage={addStage} onClose={() => setAddStage(null)} onCreate={(payload) => handleAddApplication(addStage, payload)} />
      ) : null}
    </div>
  )
}