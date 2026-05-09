import { useMemo, useState } from 'react'
import { CloudCog, Palette, Sparkles, Upload, WandSparkles, Zap } from 'lucide-react'

const tabs = [
  { id: 'profile', label: 'Profile', icon: WandSparkles },
  { id: 'optimizer', label: 'ATS Optimizer', icon: Zap },
  { id: 'scraping', label: 'Scraping', icon: CloudCog },
  { id: 'appearance', label: 'Appearance', icon: Palette },
]

const roleSuggestions = ['Frontend Engineer', 'Full Stack Engineer', 'Platform Engineer', 'React Native Developer', 'Data Engineer']
const locationSuggestions = ['Remote', 'Bangalore', 'Hyderabad', 'Mumbai', 'Delhi NCR']
const companySuggestions = ['Google', 'Microsoft', 'Razorpay', 'Flipkart', 'Amazon', 'TCS']
const accentOptions = ['#8b5cf6', '#34d399', '#6366f1', '#f59e0b', '#06b6d4', '#ec4899']
const experienceOptions = ['Entry', 'Mid', 'Senior', 'Lead']
const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote']

function TagInput({ label, value, onChange, placeholder, suggestions = [] }) {
  const [draft, setDraft] = useState('')

  const addTag = (tag) => {
    const normalized = tag.trim()

    if (!normalized || value.some((item) => item.toLowerCase() === normalized.toLowerCase())) {
      return
    }

    onChange([...value, normalized])
  }

  return (
    <div className="space-y-2">
      <div className="text-sm text-text-muted">{label}</div>
      <div className="rounded-2xl border border-border bg-gray-100 px-3 py-3">
        <div className="flex flex-wrap gap-2">
          {value.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onChange(value.filter((item) => item !== tag))}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-text-primary transition hover:border-danger/40 hover:text-danger"
            >
              {tag}
            </button>
          ))}

          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ',') {
                event.preventDefault()
                addTag(draft)
                setDraft('')
              }
            }}
            placeholder={placeholder}
            className="min-w-0 flex-1 bg-transparent px-1 py-1 text-sm text-text-primary outline-none placeholder:text-text-muted"
          />
        </div>
      </div>

      {suggestions.length ? (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => addTag(suggestion)}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-text-muted transition hover:border-primary/40 hover:text-text-primary"
            >
              + {suggestion}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function ToggleRow({ label, description, checked, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-border bg-gray-100 px-4 py-4">
      <div>
        <div className="text-sm font-medium text-text-primary">{label}</div>
        <p className="mt-1 text-sm text-text-muted">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 rounded-full border transition ${checked ? 'border-primary/40 bg-primary/20' : 'border-border bg-card'}`}
        aria-pressed={checked}
      >
        <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-background shadow-md transition ${checked ? 'left-5 bg-primary' : 'left-0.5'}`} />
      </button>
    </div>
  )
}

function SectionCard({ title, description, icon: Icon, children }) {
  return (
    <section className="rounded-[1.75rem] border border-border bg-surface/90 p-6 shadow-card-glow">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-card text-secondary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="font-display text-2xl text-text-primary">{title}</div>
          <p className="mt-1 text-sm text-text-muted">{description}</p>
        </div>
      </div>
      <div className="mt-6">{children}</div>
    </section>
  )
}

function ColorSwatch({ color, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-10 w-10 rounded-full border transition ${active ? 'border-text-primary scale-105' : 'border-border hover:border-primary/40'}`}
      style={{ backgroundColor: color }}
      aria-label={`Select accent ${color}`}
    />
  )
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile')
  const [avatarFile, setAvatarFile] = useState(null)

  // ATS Optimizer state
  const [optimizerJdUrl, setOptimizerJdUrl] = useState('')
  const [optimizerFile, setOptimizerFile] = useState(null)
  const [optimizerLoading, setOptimizerLoading] = useState(false)
  const [optimizerResult, setOptimizerResult] = useState(null)
  const [optimizerError, setOptimizerError] = useState(null)

  const handleOptimize = async (e) => {
    e.preventDefault()
    if (!optimizerJdUrl || !optimizerFile) return
    setOptimizerLoading(true)
    setOptimizerError(null)
    setOptimizerResult(null)
    const formData = new FormData()
    formData.append('jd_url', optimizerJdUrl)
    formData.append('resume_file', optimizerFile)
    try {
      const res = await fetch('http://localhost:3000/api/optimize', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || err.detail || `HTTP ${res.status}`)
      }
      const data = await res.json()
      setOptimizerResult(data)
    } catch (err) {
      setOptimizerError(err.message || 'Optimization failed')
    } finally {
      setOptimizerLoading(false)
    }
  }

  const downloadBase64Pdf = (base64, filename) => {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    const blob = new Blob([bytes], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
  const [profile, setProfile] = useState({
    name: 'Avery',
    email: 'avery@hireradar.app',
    roles: ['Frontend Engineer', 'Platform Engineer'],
    locations: ['Remote', 'Bangalore'],
    salaryMin: '24',
    salaryMax: '42',
    experience: 'Mid',
    jobTypes: ['Full-time', 'Remote'],
  })
  const [scraping, setScraping] = useState({
    frequency: '15',
    concurrentLimit: '4',
    rateLimit: '120',
    userAgentRotation: true,
    proxyHost: '',
    proxyPort: '',
    proxyUsername: '',
    proxyPassword: '',
  })

  const [appearance, setAppearance] = useState({
    theme: 'dark',
    accent: '#8b5cf6',
    compactMode: false,
    fontSize: 'medium',
  })

  const avatarPreview = useMemo(() => {
    if (!avatarFile) {
      return ''
    }
    return URL.createObjectURL(avatarFile)
  }, [avatarFile])

  const activeTabConfig = useMemo(() => tabs.find((tab) => tab.id === activeTab) ?? tabs[0], [activeTab])

  const updateList = (key, nextValue) => {
    setProfile((current) => ({ ...current, [key]: nextValue }))
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[1.75rem] border border-border bg-surface/90 p-6 shadow-card-glow">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="font-display text-3xl text-text-primary">Settings</div>
            <p className="mt-2 max-w-2xl text-sm text-text-muted">Personalize your profile, tune scraping, and set the visual style.</p>
          </div>

          <div className="rounded-full border border-border bg-gray-100 px-4 py-2 text-sm text-text-muted">
            {activeTabConfig.label} settings
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const active = tab.id === activeTab

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
                  active ? 'border-primary/40 bg-primary/10 text-primary' : 'border-border bg-gray-100 text-text-muted hover:border-primary/30 hover:text-text-primary'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </section>

      {activeTab === 'profile' ? (
        <SectionCard title="Profile" description="Shape the profile used for matching and personalization." icon={WandSparkles}>
          <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
            <div className="rounded-[1.75rem] border border-border bg-gray-100 p-5 text-center">
              <div className="mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-border bg-card text-2xl font-semibold text-text-primary">
                {avatarPreview ? <img src={avatarPreview} alt="Avatar preview" className="h-full w-full object-cover" /> : profile.name.slice(0, 2).toUpperCase()}
              </div>
              <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2 text-sm text-text-primary transition hover:border-primary/40 hover:bg-gray-100">
                <Upload className="h-4 w-4" /> Upload avatar
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)}
                />
              </label>
              <div className="mt-3 text-xs text-text-muted">PNG or JPG up to 2 MB</div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-text-muted">
                <span>Name</span>
                <input value={profile.name} onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-2xl border border-border bg-gray-100 px-4 py-3 text-text-primary outline-none" />
              </label>
              <label className="space-y-2 text-sm text-text-muted">
                <span>Email</span>
                <input value={profile.email} onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))} className="w-full rounded-2xl border border-border bg-gray-100 px-4 py-3 text-text-primary outline-none" />
              </label>

              <div className="md:col-span-2">
                <TagInput label="Preferred roles" value={profile.roles} onChange={(roles) => updateList('roles', roles)} placeholder="Add a role" suggestions={roleSuggestions} />
              </div>
              <div className="md:col-span-2">
                <TagInput label="Preferred locations" value={profile.locations} onChange={(locations) => updateList('locations', locations)} placeholder="Add a location" suggestions={locationSuggestions} />
              </div>

              <label className="space-y-2 text-sm text-text-muted">
                <span>Salary expectation min (LPA)</span>
                <input type="number" value={profile.salaryMin} onChange={(event) => setProfile((current) => ({ ...current, salaryMin: event.target.value }))} className="w-full rounded-2xl border border-border bg-gray-100 px-4 py-3 text-text-primary outline-none" />
              </label>
              <label className="space-y-2 text-sm text-text-muted">
                <span>Salary expectation max (LPA)</span>
                <input type="number" value={profile.salaryMax} onChange={(event) => setProfile((current) => ({ ...current, salaryMax: event.target.value }))} className="w-full rounded-2xl border border-border bg-gray-100 px-4 py-3 text-text-primary outline-none" />
              </label>

              <label className="space-y-2 text-sm text-text-muted">
                <span>Experience level</span>
                <select value={profile.experience} onChange={(event) => setProfile((current) => ({ ...current, experience: event.target.value }))} className="w-full rounded-2xl border border-border bg-gray-100 px-4 py-3 text-text-primary outline-none">
                  {experienceOptions.map((option) => <option key={option}>{option}</option>)}
                </select>
              </label>
              <label className="space-y-2 text-sm text-text-muted">
                <span>Job type preferences</span>
                <select multiple value={profile.jobTypes} onChange={(event) => setProfile((current) => ({ ...current, jobTypes: [...event.target.selectedOptions].map((option) => option.value) }))} className="w-full rounded-2xl border border-border bg-gray-100 px-4 py-3 text-text-primary outline-none">
                  {jobTypes.map((option) => <option key={option}>{option}</option>)}
                </select>
              </label>
            </div>
          </div>
        </SectionCard>
      ) : null}

      {activeTab === 'optimizer' ? (
        <SectionCard title="ATS Resume Optimizer" description="Paste a job URL and upload your resume to get an ATS-optimized version with a tailored cover letter." icon={Zap}>
          <form onSubmit={handleOptimize} className="grid gap-4">
            <label className="space-y-2 text-sm text-text-muted">
              <span>Job Description URL</span>
              <input
                type="url"
                required
                value={optimizerJdUrl}
                onChange={(e) => setOptimizerJdUrl(e.target.value)}
                placeholder="https://company.com/jobs/software-engineer"
                className="w-full rounded-2xl border border-border bg-gray-100 px-4 py-3 text-text-primary outline-none focus:border-primary/40"
              />
            </label>

            <label className="space-y-2 text-sm text-text-muted">
              <span>Resume (PDF or DOCX)</span>
              <input
                type="file"
                required
                accept=".pdf,.docx,.doc"
                onChange={(e) => setOptimizerFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-text-muted file:mr-3 file:rounded-2xl file:border file:border-border file:bg-card file:px-4 file:py-2 file:text-sm file:text-text-primary file:transition hover:file:border-primary/40"
              />
            </label>

            {optimizerError && (
              <div className="rounded-2xl border border-danger/30 bg-red-50 px-4 py-3 text-sm text-danger">
                {optimizerError}
              </div>
            )}

            <button
              type="submit"
              disabled={optimizerLoading}
              className="rounded-2xl border border-primary/30 bg-primary px-5 py-3 text-sm font-medium text-background transition hover:shadow-accent-glow disabled:opacity-50"
            >
              {optimizerLoading ? 'Optimizing… (this takes ~30s)' : 'Optimize Resume'}
            </button>
          </form>

          {optimizerResult && (
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-border bg-card p-4 text-center">
                  <div className="text-xs uppercase tracking-widest text-text-muted">Original ATS Score</div>
                  <div className="mt-2 text-4xl font-bold text-text-muted">{optimizerResult.scores?.old_ats_score ?? '—'}</div>
                </div>
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50 p-4 text-center">
                  <div className="text-xs uppercase tracking-widest text-emerald-600">Optimized ATS Score</div>
                  <div className="mt-2 text-4xl font-bold text-emerald-600">{optimizerResult.scores?.new_ats_score ?? '—'}</div>
                </div>
              </div>

              {optimizerResult.missing_keywords_found?.length > 0 && (
                <div>
                  <div className="mb-2 text-sm text-text-muted">Keywords Added</div>
                  <div className="flex flex-wrap gap-2">
                    {optimizerResult.missing_keywords_found.map((kw, i) => (
                      <span key={i} className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-xs text-primary">{kw}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                {optimizerResult.resume_pdf && (
                  <button
                    type="button"
                    onClick={() => downloadBase64Pdf(optimizerResult.resume_pdf, 'optimized-resume.pdf')}
                    className="rounded-2xl border border-primary/30 bg-primary px-5 py-2.5 text-sm font-medium text-background transition hover:shadow-accent-glow"
                  >
                    ⬇ Download Resume PDF
                  </button>
                )}
                {optimizerResult.cover_letter_pdf && (
                  <button
                    type="button"
                    onClick={() => downloadBase64Pdf(optimizerResult.cover_letter_pdf, 'cover-letter.pdf')}
                    className="rounded-2xl border border-border bg-card px-5 py-2.5 text-sm text-text-primary transition hover:border-primary/40"
                  >
                    ⬇ Download Cover Letter PDF
                  </button>
                )}
              </div>
            </div>
          )}
        </SectionCard>
      ) : null}

      {activeTab === 'scraping' ? (
        <SectionCard title="Scraping" description="Set crawler cadence and throughput for the feed." icon={CloudCog}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm text-text-muted">
              <span>Default scraping frequency</span>
              <select value={scraping.frequency} onChange={(event) => setScraping((current) => ({ ...current, frequency: event.target.value }))} className="w-full rounded-2xl border border-border bg-gray-100 px-4 py-3 text-text-primary outline-none">
                <option value="5">Every 5 minutes</option>
                <option value="15">Every 15 minutes</option>
                <option value="30">Every 30 minutes</option>
                <option value="60">Every hour</option>
              </select>
            </label>
            <label className="space-y-2 text-sm text-text-muted">
              <span>Concurrent scraper limit</span>
              <input type="number" value={scraping.concurrentLimit} onChange={(event) => setScraping((current) => ({ ...current, concurrentLimit: event.target.value }))} className="w-full rounded-2xl border border-border bg-gray-100 px-4 py-3 text-text-primary outline-none" />
            </label>
            <label className="space-y-2 text-sm text-text-muted">
              <span>Rate limiting settings</span>
              <input type="number" value={scraping.rateLimit} onChange={(event) => setScraping((current) => ({ ...current, rateLimit: event.target.value }))} className="w-full rounded-2xl border border-border bg-gray-100 px-4 py-3 text-text-primary outline-none" />
            </label>
            <ToggleRow label="User agent rotation" description="Rotate headers to reduce blocking and fingerprinting." checked={scraping.userAgentRotation} onChange={(checked) => setScraping((current) => ({ ...current, userAgentRotation: checked }))} />
            <label className="space-y-2 text-sm text-text-muted md:col-span-2">
              <span>Proxy settings</span>
              <div className="grid gap-3 md:grid-cols-4">
                <input placeholder="Host" value={scraping.proxyHost} onChange={(event) => setScraping((current) => ({ ...current, proxyHost: event.target.value }))} className="rounded-2xl border border-border bg-gray-100 px-4 py-3 text-text-primary outline-none" />
                <input placeholder="Port" value={scraping.proxyPort} onChange={(event) => setScraping((current) => ({ ...current, proxyPort: event.target.value }))} className="rounded-2xl border border-border bg-gray-100 px-4 py-3 text-text-primary outline-none" />
                <input placeholder="Username" value={scraping.proxyUsername} onChange={(event) => setScraping((current) => ({ ...current, proxyUsername: event.target.value }))} className="rounded-2xl border border-border bg-gray-100 px-4 py-3 text-text-primary outline-none" />
                <input placeholder="Password" type="password" value={scraping.proxyPassword} onChange={(event) => setScraping((current) => ({ ...current, proxyPassword: event.target.value }))} className="rounded-2xl border border-border bg-gray-100 px-4 py-3 text-text-primary outline-none" />
              </div>
            </label>
          </div>
        </SectionCard>
      ) : null}


      {activeTab === 'appearance' ? (
        <SectionCard title="Appearance" description="Control the visual style of the workspace." icon={Palette}>
          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2 text-sm text-text-muted">
              <span>Theme</span>
              <select value={appearance.theme} onChange={(event) => setAppearance((current) => ({ ...current, theme: event.target.value }))} className="w-full rounded-2xl border border-border bg-gray-100 px-4 py-3 text-text-primary outline-none">
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="system">System</option>
              </select>
            </label>

            <label className="space-y-2 text-sm text-text-muted">
              <span>Font size preference</span>
              <select value={appearance.fontSize} onChange={(event) => setAppearance((current) => ({ ...current, fontSize: event.target.value }))} className="w-full rounded-2xl border border-border bg-gray-100 px-4 py-3 text-text-primary outline-none">
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </label>

            <ToggleRow label="Compact mode" description="Tighten spacing and density across cards and panels." checked={appearance.compactMode} onChange={(checked) => setAppearance((current) => ({ ...current, compactMode: checked }))} />

            <div className="space-y-2 text-sm text-text-muted">
              <div>Accent color picker</div>
              <div className="flex flex-wrap gap-3 rounded-2xl border border-border bg-gray-100 p-4">
                {accentOptions.map((color) => (
                  <ColorSwatch key={color} color={color} active={appearance.accent === color} onClick={() => setAppearance((current) => ({ ...current, accent: color }))} />
                ))}
              </div>
            </div>
          </div>
        </SectionCard>
      ) : null}

      <section className="rounded-[1.75rem] border border-border bg-gray-100 p-5 text-sm text-text-muted">
        <div className="flex items-center gap-3 text-text-primary">
          <Sparkles className="h-5 w-5 text-secondary" />
          Settings are stored locally in this prototype.
        </div>
      </section>
    </div>
  )
}
