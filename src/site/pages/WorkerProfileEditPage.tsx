import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button, Input, Textarea, Select, Checkbox } from '../../components'
import { Stepper } from '../../components/Stepper/Stepper'
import type { StepState } from '../../components/Stepper/Stepper'
import { INDUSTRIES, searchSkills, getSkillsByIndustry } from '../data/industries'
import type { SkillTag } from '../data/industries'
import { currentWorker } from '../data/mock'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../context/AuthContext'

// ── Icons ────────────────────────────────────────────────────────────────────

const PlusIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

const XIcon = ({ size = 14 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const CheckCircleIcon = ({ color = 'var(--kt-success)' }: { color?: string }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
  >
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)

const PhoneIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8a19.79 19.79 0 01-3.07-8.68A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z" />
  </svg>
)

const UploadIcon = ({ size = 24 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
  >
    <polyline points="16 16 12 12 8 16" />
    <line x1="12" y1="12" x2="12" y2="21" />
    <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
  </svg>
)

const ChevronDownIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

const ChevronUpIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <polyline points="18 15 12 9 6 15" />
  </svg>
)

const FileTextIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
)

const SparkleIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z" />
    <path d="M19 3l.8 2.2L22 6l-2.2.8L19 9l-.8-2.2L16 6l2.2-.8z" />
  </svg>
)

// ── Types ─────────────────────────────────────────────────────────────────

type ProfileSkill = {
  id: string
  name: string
  yearsExp: number | null
  source: 'suggested' | 'custom'
  canonicalId?: string
}

type ProfileCert = {
  id: string
  certName: string
  issuingBody: string
  expiryDate: string
}

type WorkEntry = {
  id: string
  employerName: string
  roleTitle: string
  startDate: string
  endDate: string
  isCurrent: boolean
  contractType: 'day_rate' | 'project' | 'long_term_temp' | ''
  industryId: string
  description: string
}

type Step1Data = {
  fullName: string
  city: string
  region: string
  phone: string
}

type Step2Data = {
  skills: ProfileSkill[]
  certifications: ProfileCert[]
}

type StepAboutData = {
  primaryTrade: string
  bio: string
  socialLinks: { id: string; platform: string; url: string }[]
}

type Step3Data = {
  workHistory: WorkEntry[]
}

type EditState = {
  workerIndustries: string[]
  stepStates: Record<number, StepState>
  step1: Step1Data
  stepAbout: StepAboutData
  step2: Record<string, Step2Data>
  step3: Step3Data
}

// ── localStorage ──────────────────────────────────────────────────────────

const STORAGE_KEY = 'kt_profile_edit_v4'

const emptyStep2 = (): Step2Data => ({ skills: [], certifications: [] })
const emptyStep3 = (): Step3Data => ({ workHistory: [] })

const defaultState = (): EditState => ({
  workerIndustries: ['construction'],
  stepStates: { 1: 'incomplete', 2: 'incomplete', 3: 'incomplete', 4: 'incomplete' },
  step1: {
    fullName: currentWorker.name,
    city: currentWorker.location.split(',')[0]?.trim() ?? '',
    region: currentWorker.location.split(',')[1]?.trim() ?? '',
    phone: '',
  },
  stepAbout: { primaryTrade: currentWorker.headline, bio: '', socialLinks: [] },
  step2: { construction: emptyStep2(), healthcare: emptyStep2(), manufacturing: emptyStep2() },
  step3: emptyStep3(),
})

function loadState(): EditState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...defaultState(), ...JSON.parse(raw) }
  } catch {
    /* ignore */
  }
  return defaultState()
}

function saveState(state: EditState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* ignore */
  }
}

// ── Stepper steps ─────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Identity' },
  { label: 'About Me' },
  { label: 'Skills' },
  { label: 'Work History' },
]

// ── Step 1: Identity & Basics ─────────────────────────────────────────────

const Step1: React.FC<{ data: Step1Data; onChange: (d: Step1Data) => void }> = ({
  data,
  onChange,
}) => {
  const set = (field: keyof Step1Data, val: string) => onChange({ ...data, [field]: val })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Profile photo */}
      <div>
        <label
          style={{
            display: 'block',
            fontSize: 'var(--kt-text-sm)',
            fontWeight: 'var(--kt-weight-medium)',
            color: 'var(--kt-text)',
            marginBottom: 10,
          }}
        >
          Profile Photo
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'var(--kt-primary)',
              color: 'var(--kt-white, #fff)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'var(--kt-text-xl)',
              fontWeight: 'var(--kt-weight-bold)',
            }}
          >
            {data.fullName
              ? data.fullName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()
              : 'KT'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Button size="sm" variant="outline">
              Upload photo
            </Button>
            <p style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-text-muted)', margin: 0 }}>
              JPG, PNG, or WebP · Max 5 MB
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <Input
            label="Full name"
            value={data.fullName}
            onChange={(e) => set('fullName', e.target.value)}
            placeholder="Your legal or professional name"
            required
          />
        </div>
        <Input
          label="City"
          value={data.city}
          onChange={(e) => set('city', e.target.value)}
          placeholder="e.g. Denver"
        />
        <Input
          label="State / Region"
          value={data.region}
          onChange={(e) => set('region', e.target.value)}
          placeholder="e.g. CO"
        />
        <div>
          <Input
            label="Phone number"
            type="tel"
            value={data.phone}
            onChange={(e) => set('phone', e.target.value)}
            placeholder="e.g. (555) 000-0000"
          />
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              marginTop: 6,
              fontSize: 'var(--kt-text-xs)',
              color: 'var(--kt-accent)',
              textDecoration: 'none',
              fontFamily: 'var(--kt-font-sans)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
          >
            <PhoneIcon /> Verify number →
          </a>
        </div>
      </div>
    </div>
  )
}

// ── Step 2: About Me ──────────────────────────────────────────────────────

const SOCIAL_PLATFORMS = [
  { id: 'linkedin', label: 'LinkedIn', placeholder: 'linkedin.com/in/yourname' },
  { id: 'instagram', label: 'Instagram', placeholder: 'instagram.com/yourname' },
  { id: 'x', label: 'X', placeholder: 'x.com/yourname' },
  { id: 'facebook', label: 'Facebook', placeholder: 'facebook.com/yourname' },
  { id: 'youtube', label: 'YouTube', placeholder: 'youtube.com/@yourname' },
  { id: 'tiktok', label: 'TikTok', placeholder: 'tiktok.com/@yourname' },
  { id: 'website', label: 'Website', placeholder: 'yourwebsite.com' },
]

const StepAbout: React.FC<{ data: StepAboutData; onChange: (d: StepAboutData) => void }> = ({
  data,
  onChange,
}) => {
  const addedPlatformIds = new Set(data.socialLinks.map((l) => l.platform))
  const available = SOCIAL_PLATFORMS.filter((p) => !addedPlatformIds.has(p.id))

  const addLink = (platformId: string) => {
    onChange({
      ...data,
      socialLinks: [
        ...data.socialLinks,
        { id: crypto.randomUUID(), platform: platformId, url: '' },
      ],
    })
  }

  const removeLink = (id: string) =>
    onChange({ ...data, socialLinks: data.socialLinks.filter((l) => l.id !== id) })

  const updateUrl = (id: string, url: string) =>
    onChange({
      ...data,
      socialLinks: data.socialLinks.map((l) => (l.id === id ? { ...l, url } : l)),
    })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Primary trade */}
      <Input
        label="Primary trade / profession"
        value={data.primaryTrade}
        onChange={(e) => onChange({ ...data, primaryTrade: e.target.value })}
        placeholder="e.g. Journeyman Carpenter, Registered Nurse"
      />

      {/* Bio */}
      <div>
        <Textarea
          label="About me"
          value={data.bio}
          onChange={(e) => onChange({ ...data, bio: e.target.value })}
          placeholder="e.g. I'm a journeyman carpenter with 8 years of experience in residential and commercial framing. I take pride in clean, precise work and showing up on time every day."
          rows={5}
        />
        <p
          style={{
            fontSize: 'var(--kt-text-xs)',
            color: 'var(--kt-text-muted)',
            margin: '6px 0 0',
            lineHeight: 1.5,
          }}
        >
          Write 2–4 sentences about your experience, skills, and what makes you a great hire.
          Employers read this first.
        </p>
      </div>

      {/* Social links */}
      <div>
        <h4
          style={{
            fontSize: 'var(--kt-text-sm)',
            fontWeight: 'var(--kt-weight-semibold)',
            color: 'var(--kt-text)',
            margin: '0 0 4px',
          }}
        >
          Social &amp; web links
        </h4>
        <p
          style={{
            fontSize: 'var(--kt-text-sm)',
            color: 'var(--kt-text-muted)',
            margin: '0 0 14px',
          }}
        >
          Add links to your profiles so employers can learn more about you.
        </p>

        {data.socialLinks.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
            {data.socialLinks.map((link) => {
              const platform = SOCIAL_PLATFORMS.find((p) => p.id === link.platform)
              return (
                <div key={link.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    style={{
                      fontSize: 'var(--kt-text-xs)',
                      fontWeight: 'var(--kt-weight-medium)',
                      color: 'var(--kt-text-muted)',
                      width: 72,
                      flexShrink: 0,
                    }}
                  >
                    {platform?.label}
                  </span>
                  <div style={{ flex: 1 }}>
                    <Input
                      type="url"
                      value={link.url}
                      onChange={(e) => updateUrl(link.id, e.target.value)}
                      placeholder={platform?.placeholder ?? 'https://...'}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLink(link.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--kt-text-muted)',
                      padding: 4,
                      display: 'flex',
                      flexShrink: 0,
                    }}
                  >
                    <XIcon />
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {available.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {available.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => addLink(p.id)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 'var(--kt-radius-full)',
                  border: '1.5px solid var(--kt-border)',
                  background: 'var(--kt-surface)',
                  fontSize: 'var(--kt-text-xs)',
                  color: 'var(--kt-text)',
                  cursor: 'pointer',
                  fontFamily: 'var(--kt-font-sans)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--kt-accent)'
                  e.currentTarget.style.color = 'var(--kt-accent)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--kt-border)'
                  e.currentTarget.style.color = 'var(--kt-text)'
                }}
              >
                + {p.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Skill search input ────────────────────────────────────────────────────

const SkillSearchInput: React.FC<{
  industryId: string
  selectedIds: Set<string>
  onAdd: (skill: SkillTag | null, customName?: string) => void
}> = ({ industryId, selectedIds, onAdd }) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SkillTag[]>([])
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (query.trim().length < 1) {
      setResults([])
      setOpen(false)
      return
    }
    const res = searchSkills(query, industryId).filter((s) => !selectedIds.has(s.id))
    setResults(res)
    setOpen(res.length > 0)
  }, [query, industryId, selectedIds])

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim()) {
      e.preventDefault()
      if (results.length > 0) {
        onAdd(results[0])
      } else {
        onAdd(null, query.trim())
      }
      setQuery('')
      setOpen(false)
    }
    if (e.key === 'Escape') setOpen(false)
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <Input
        placeholder="Search or type a skill name, press Enter to add"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 100,
            background: 'var(--kt-surface)',
            border: '1px solid var(--kt-border)',
            borderRadius: 'var(--kt-radius-md)',
            boxShadow: 'var(--kt-shadow-md)',
            marginTop: 4,
            maxHeight: 220,
            overflowY: 'auto',
          }}
        >
          {results.map((skill) => (
            <button
              key={skill.id}
              type="button"
              onClick={() => {
                onAdd(skill)
                setQuery('')
                setOpen(false)
              }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '10px 14px',
                background: 'none',
                border: 'none',
                fontSize: 'var(--kt-text-sm)',
                color: 'var(--kt-text)',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--kt-surface-raised)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
            >
              {skill.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Industry skills card (used inside Step2) ──────────────────────────────

const IndustrySkillsCard: React.FC<{
  industryId: string
  data: Step2Data
  onChange: (d: Step2Data) => void
  onRemoveIndustry: () => void
  isOnly: boolean
}> = ({ industryId, data, onChange, onRemoveIndustry, isOnly }) => {
  const ind = INDUSTRIES.find((i) => i.id === industryId)
  const allSkills = getSkillsByIndustry(industryId)
  const selectedIds = new Set(data.skills.map((s) => s.canonicalId).filter(Boolean) as string[])
  const suggestedChips = allSkills.filter((s) => !selectedIds.has(s.id)).slice(0, 5)

  const addSkill = (tag: SkillTag | null, customName?: string) => {
    if (tag && selectedIds.has(tag.id)) return
    const newSkill: ProfileSkill = tag
      ? {
          id: crypto.randomUUID(),
          name: tag.name,
          yearsExp: null,
          source: 'suggested',
          canonicalId: tag.id,
        }
      : { id: crypto.randomUUID(), name: customName ?? '', yearsExp: null, source: 'custom' }
    onChange({ ...data, skills: [...data.skills, newSkill] })
  }

  const removeSkill = (id: string) =>
    onChange({ ...data, skills: data.skills.filter((s) => s.id !== id) })

  const updateSkillYears = (id: string, val: string) => {
    const num = val === '' ? null : Math.max(0, Math.min(99, parseInt(val) || 0))
    onChange({
      ...data,
      skills: data.skills.map((s) => (s.id === id ? { ...s, yearsExp: num } : s)),
    })
  }

  const addCert = () =>
    onChange({
      ...data,
      certifications: [
        ...data.certifications,
        { id: crypto.randomUUID(), certName: '', issuingBody: '', expiryDate: '' },
      ],
    })
  const removeCert = (id: string) =>
    onChange({ ...data, certifications: data.certifications.filter((c) => c.id !== id) })
  const updateCert = (id: string, field: keyof ProfileCert, val: string) =>
    onChange({
      ...data,
      certifications: data.certifications.map((c) => (c.id === id ? { ...c, [field]: val } : c)),
    })

  return (
    <div
      style={{
        border: '1px solid var(--kt-border)',
        borderRadius: 'var(--kt-radius-md)',
        background: 'var(--kt-surface)',
        overflow: 'hidden',
      }}
    >
      {/* Card header */}
      <div
        style={{
          padding: '12px 16px',
          background: 'var(--kt-surface-raised)',
          borderBottom: '1px solid var(--kt-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontWeight: 'var(--kt-weight-semibold)',
            fontSize: 'var(--kt-text-md)',
            color: 'var(--kt-text)',
          }}
        >
          {ind?.name}
        </span>
        {!isOnly && (
          <button
            type="button"
            onClick={onRemoveIndustry}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--kt-text-muted)',
              fontSize: 'var(--kt-text-xs)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <XIcon size={12} /> Remove
          </button>
        )}
      </div>

      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 28 }}>
        {/* Skills */}
        <div>
          <h4
            style={{
              fontSize: 'var(--kt-text-sm)',
              fontWeight: 'var(--kt-weight-semibold)',
              color: 'var(--kt-text)',
              margin: '0 0 4px',
            }}
          >
            Skills
          </h4>
          <p
            style={{
              fontSize: 'var(--kt-text-sm)',
              color: 'var(--kt-text-muted)',
              margin: '0 0 12px',
            }}
          >
            Add skills so employers can find you.
          </p>

          <SkillSearchInput industryId={industryId} selectedIds={selectedIds} onAdd={addSkill} />

          {suggestedChips.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <p
                style={{
                  fontSize: 'var(--kt-text-xs)',
                  color: 'var(--kt-text-muted)',
                  margin: '0 0 6px',
                }}
              >
                Suggested:
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {suggestedChips.map((skill) => (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() => addSkill(skill)}
                    style={{
                      padding: '4px 11px',
                      borderRadius: 'var(--kt-radius-full)',
                      border: '1.5px solid var(--kt-border)',
                      background: 'var(--kt-surface)',
                      fontSize: 'var(--kt-text-xs)',
                      color: 'var(--kt-text)',
                      cursor: 'pointer',
                      fontFamily: 'var(--kt-font-sans)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--kt-accent)'
                      e.currentTarget.style.color = 'var(--kt-accent)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--kt-border)'
                      e.currentTarget.style.color = 'var(--kt-text)'
                    }}
                  >
                    + {skill.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {data.skills.length > 0 ? (
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <p
                style={{
                  fontSize: 'var(--kt-text-xs)',
                  fontWeight: 'var(--kt-weight-medium)',
                  color: 'var(--kt-text-muted)',
                  margin: 0,
                }}
              >
                Your skills ({data.skills.length})
              </p>
              {data.skills.map((skill) => (
                <div
                  key={skill.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '7px 12px',
                    borderRadius: 'var(--kt-radius-md)',
                    border: '1px solid var(--kt-border)',
                    background: 'var(--kt-surface-raised)',
                  }}
                >
                  <span style={{ flex: 1, fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text)' }}>
                    {skill.name}
                    {skill.source === 'custom' && (
                      <span
                        style={{
                          fontSize: 'var(--kt-text-xs)',
                          color: 'var(--kt-text-muted)',
                          marginLeft: 6,
                        }}
                      >
                        (custom)
                      </span>
                    )}
                  </span>
                  <label
                    style={{
                      fontSize: 'var(--kt-text-xs)',
                      color: 'var(--kt-text-muted)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Yrs exp
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={99}
                    placeholder="—"
                    value={skill.yearsExp === null ? '' : skill.yearsExp}
                    onChange={(e) => updateSkillYears(skill.id, e.target.value)}
                    style={{
                      width: 52,
                      padding: '4px 8px',
                      borderRadius: 'var(--kt-radius-sm)',
                      border: '1px solid var(--kt-border)',
                      fontSize: 'var(--kt-text-sm)',
                      background: 'var(--kt-surface)',
                      color: 'var(--kt-text)',
                      fontFamily: 'var(--kt-font-sans)',
                      textAlign: 'center',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => removeSkill(skill.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--kt-text-muted)',
                      padding: 4,
                      display: 'flex',
                      borderRadius: 'var(--kt-radius-sm)',
                    }}
                  >
                    <XIcon />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                marginTop: 12,
                padding: '16px 20px',
                borderRadius: 'var(--kt-radius-md)',
                background: 'var(--kt-grey-50, #f9f9fb)',
                border: '1px dashed var(--kt-border)',
                textAlign: 'center',
              }}
            >
              <p
                style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text-muted)', margin: 0 }}
              >
                No skills added yet. Use the suggestions above or search for a skill.
              </p>
            </div>
          )}
        </div>

        {/* Certifications */}
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 4,
            }}
          >
            <h4
              style={{
                fontSize: 'var(--kt-text-sm)',
                fontWeight: 'var(--kt-weight-semibold)',
                color: 'var(--kt-text)',
                margin: 0,
              }}
            >
              Certifications
            </h4>
            {data.certifications.length > 0 && (
              <Button size="sm" variant="outline" onClick={addCert}>
                <PlusIcon /> Add certification
              </Button>
            )}
          </div>
          <p
            style={{
              fontSize: 'var(--kt-text-sm)',
              color: 'var(--kt-text-muted)',
              margin: '0 0 12px',
            }}
          >
            Self-reported. Add the cert name, issuing body, and expiry date.
          </p>

          {data.certifications.length === 0 && (
            <div
              style={{
                padding: '20px',
                borderRadius: 'var(--kt-radius-md)',
                background: 'var(--kt-grey-50, #f9f9fb)',
                border: '1px dashed var(--kt-border)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
                textAlign: 'center',
              }}
            >
              <p
                style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text-muted)', margin: 0 }}
              >
                Got certifications? Add them here.
              </p>
              <Button size="sm" variant="outline" onClick={addCert}>
                <PlusIcon /> Add certification
              </Button>
            </div>
          )}

          {data.certifications.map((cert, idx) => {
            const expired = cert.expiryDate && new Date(cert.expiryDate) < new Date()
            return (
              <div
                key={cert.id}
                style={{
                  padding: 14,
                  borderRadius: 'var(--kt-radius-md)',
                  border: '1px solid var(--kt-border)',
                  background: 'var(--kt-surface)',
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 10,
                  }}
                >
                  <span style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-text-muted)' }}>
                    Certification {idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeCert(cert.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--kt-text-muted)',
                      padding: 4,
                      display: 'flex',
                    }}
                  >
                    <XIcon />
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <Input
                      label="Certification name"
                      value={cert.certName}
                      onChange={(e) => updateCert(cert.id, 'certName', e.target.value)}
                      placeholder="e.g. OSHA 30, CPR/AED"
                    />
                  </div>
                  <Input
                    label="Issuing body"
                    value={cert.issuingBody}
                    onChange={(e) => updateCert(cert.id, 'issuingBody', e.target.value)}
                    placeholder="e.g. OSHA, Red Cross"
                  />
                  <div>
                    <Input
                      label="Expiry date"
                      type="date"
                      value={cert.expiryDate}
                      onChange={(e) => updateCert(cert.id, 'expiryDate', e.target.value)}
                    />
                    {cert.expiryDate && (
                      <p
                        style={{
                          fontSize: 'var(--kt-text-xs)',
                          color: 'var(--kt-text-muted)',
                          margin: '3px 0 0',
                        }}
                      >
                        {expired
                          ? `Expired on: ${cert.expiryDate}`
                          : `Expires on: ${cert.expiryDate}`}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Step 2: Skills & Certifications ──────────────────────────────────────

const Step2: React.FC<{
  workerIndustries: string[]
  allData: Record<string, Step2Data>
  onChange: (industryId: string, d: Step2Data) => void
  onAddIndustry: (id: string) => void
  onRemoveIndustry: (id: string) => void
}> = ({ workerIndustries, allData, onChange, onAddIndustry, onRemoveIndustry }) => {
  const [addDropOpen, setAddDropOpen] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)
  const available = INDUSTRIES.filter((i) => !workerIndustries.includes(i.id))

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setAddDropOpen(false)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {workerIndustries.map((id) => (
        <IndustrySkillsCard
          key={id}
          industryId={id}
          data={allData[id] ?? emptyStep2()}
          onChange={(d) => onChange(id, d)}
          onRemoveIndustry={() => onRemoveIndustry(id)}
          isOnly={workerIndustries.length === 1}
        />
      ))}

      {available.length > 0 && (
        <div ref={dropRef} style={{ position: 'relative', alignSelf: 'center' }}>
          <Button size="sm" variant="ghost" onClick={() => setAddDropOpen((o) => !o)}>
            <PlusIcon /> Add another industry
          </Button>
          {addDropOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                zIndex: 100,
                marginTop: 6,
                background: 'var(--kt-surface)',
                border: '1px solid var(--kt-border)',
                borderRadius: 'var(--kt-radius-md)',
                boxShadow: 'var(--kt-shadow-md)',
                minWidth: 180,
              }}
            >
              {available.map((ind) => (
                <button
                  key={ind.id}
                  type="button"
                  onClick={() => {
                    onAddIndustry(ind.id)
                    setAddDropOpen(false)
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 14px',
                    background: 'none',
                    border: 'none',
                    fontSize: 'var(--kt-text-sm)',
                    color: 'var(--kt-text)',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = 'var(--kt-surface-raised)')
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                >
                  {ind.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Work history entry (collapsible) ─────────────────────────────────────

const WorkEntryCard: React.FC<{
  entry: WorkEntry
  isExpanded: boolean
  onToggle: () => void
  onRemove: () => void
  onChange: (field: keyof WorkEntry, val: unknown) => void
  workerIndustries: string[]
}> = ({ entry, isExpanded, onToggle, onRemove, onChange, workerIndustries }) => {
  const formatMonthDate = (d: string) => {
    if (!d) return ''
    const [y, m] = d.split('-')
    const month = new Date(Number(y), Number(m) - 1).toLocaleString('default', { month: 'short' })
    return `${month} ${y}`
  }

  const industryOptions = INDUSTRIES.filter((i) => workerIndustries.includes(i.id)).map((i) => ({
    label: i.name,
    value: i.id,
  }))

  if (!isExpanded) {
    return (
      <div
        style={{
          padding: '12px 16px',
          borderRadius: 'var(--kt-radius-md)',
          border: '1px solid var(--kt-border)',
          background: 'var(--kt-surface)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
        }}
        onClick={onToggle}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontSize: 'var(--kt-text-sm)',
              fontWeight: 'var(--kt-weight-medium)',
              color: 'var(--kt-text)',
            }}
          >
            {entry.employerName || 'Untitled position'}{' '}
            {entry.roleTitle ? `· ${entry.roleTitle}` : ''}
          </p>
          {(entry.startDate || entry.isCurrent) && (
            <p style={{ margin: 0, fontSize: 'var(--kt-text-xs)', color: 'var(--kt-text-muted)' }}>
              {formatMonthDate(entry.startDate)} —{' '}
              {entry.isCurrent ? 'Present' : formatMonthDate(entry.endDate)}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--kt-text-muted)',
              padding: 4,
              display: 'flex',
            }}
          >
            <XIcon />
          </button>
          <ChevronDownIcon />
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        borderRadius: 'var(--kt-radius-md)',
        border: '1px solid var(--kt-border)',
        background: 'var(--kt-surface)',
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--kt-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
        }}
        onClick={onToggle}
      >
        <p
          style={{
            margin: 0,
            fontSize: 'var(--kt-text-sm)',
            fontWeight: 'var(--kt-weight-medium)',
            color: 'var(--kt-text)',
          }}
        >
          {entry.employerName || 'New position'}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--kt-text-muted)',
              padding: 4,
              display: 'flex',
            }}
          >
            <XIcon />
          </button>
          <ChevronUpIcon />
        </div>
      </div>
      <div style={{ padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Input
            label="Employer name"
            value={entry.employerName}
            onChange={(e) => onChange('employerName', e.target.value)}
            placeholder="Company or client name"
          />
          <Input
            label="Role title"
            value={entry.roleTitle}
            onChange={(e) => onChange('roleTitle', e.target.value)}
            placeholder="Your job title"
          />
          <Input
            label="Start date"
            type="month"
            value={entry.startDate}
            onChange={(e) => onChange('startDate', e.target.value)}
          />
          <div>
            <Input
              label="End date"
              type="month"
              value={entry.endDate}
              onChange={(e) => onChange('endDate', e.target.value)}
              disabled={entry.isCurrent}
            />
            <div style={{ marginTop: 6 }}>
              <Checkbox
                label="Currently working here"
                checked={entry.isCurrent}
                onChange={(e) => onChange('isCurrent', e.target.checked)}
              />
            </div>
          </div>
          <Select
            label="Contract type"
            value={entry.contractType}
            onChange={(e) => onChange('contractType', e.target.value)}
            options={[
              { label: 'Day rate', value: 'day_rate' },
              { label: 'Project-based', value: 'project' },
              { label: 'Long-term temp', value: 'long_term_temp' },
            ]}
            placeholder="Select type"
          />
          <Select
            label="Industry"
            value={entry.industryId}
            onChange={(e) => onChange('industryId', e.target.value)}
            options={industryOptions}
            placeholder="Select industry"
          />
          <div style={{ gridColumn: '1 / -1' }}>
            <Textarea
              label="Project description"
              value={entry.description}
              onChange={(e) => onChange('description', e.target.value)}
              placeholder="Describe the work, scope, and key accomplishments (max 2000 characters)"
              rows={3}
            />
            <p
              style={{
                textAlign: 'right',
                fontSize: 'var(--kt-text-xs)',
                color: 'var(--kt-text-muted)',
                margin: '3px 0 0',
              }}
            >
              {entry.description.length} / 2000
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Step 4: Work History ──────────────────────────────────────────────────

const MOCK_RESUME_ENTRIES: WorkEntry[] = [
  {
    id: 'resume-1',
    employerName: 'Harmon General Contracting',
    roleTitle: 'Lead Framing Carpenter',
    startDate: '2022-03',
    endDate: '2024-11',
    isCurrent: false,
    contractType: 'long_term_temp',
    industryId: 'construction',
    description:
      'Led framing crew on 12-unit townhome and commercial remodel projects. Responsible for blueprint interpretation and daily crew coordination.',
  },
  {
    id: 'resume-2',
    employerName: 'BlueLine Construction',
    roleTitle: 'Journeyman Carpenter',
    startDate: '2020-06',
    endDate: '2022-02',
    isCurrent: false,
    contractType: 'project',
    industryId: 'construction',
    description:
      'Installed finish carpentry, cabinetry, and trim work on residential builds. Completed OSHA 30 during this period.',
  },
]

const Step3: React.FC<{
  data: Step3Data
  workerIndustries: string[]
  onChange: (d: Step3Data) => void
}> = ({ data, workerIndustries, onChange }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [resumeFile, setResumeFile] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzed, setAnalyzed] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleResumeUpload = (file: File) => {
    setResumeFile(file.name)
    setAnalyzing(true)
    setAnalyzed(false)
    setTimeout(() => {
      setAnalyzing(false)
      setAnalyzed(true)
      const newEntries = MOCK_RESUME_ENTRIES.map((e) => ({ ...e, id: crypto.randomUUID() }))
      onChange({ ...data, workHistory: [...newEntries, ...data.workHistory] })
      setExpandedId(null)
    }, 2200)
  }

  const addEntry = () => {
    const newId = crypto.randomUUID()
    onChange({
      ...data,
      workHistory: [
        {
          id: newId,
          employerName: '',
          roleTitle: '',
          startDate: '',
          endDate: '',
          isCurrent: false,
          contractType: '',
          industryId: workerIndustries[0] ?? '',
          description: '',
        },
        ...data.workHistory,
      ],
    })
    setExpandedId(newId)
  }

  const removeEntry = (id: string) => {
    onChange({ ...data, workHistory: data.workHistory.filter((e) => e.id !== id) })
    if (expandedId === id) setExpandedId(null)
  }

  const updateEntry = (id: string, field: keyof WorkEntry, val: unknown) =>
    onChange({
      ...data,
      workHistory: data.workHistory.map((e) => (e.id === id ? { ...e, [field]: val } : e)),
    })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Resume upload */}
      <div
        style={{
          padding: 20,
          borderRadius: 'var(--kt-radius-md)',
          border: '1px solid var(--kt-border)',
          background: 'var(--kt-surface)',
        }}
      >
        <div style={{ marginBottom: 4 }}>
          <h3
            style={{
              fontSize: 'var(--kt-text-md)',
              fontWeight: 'var(--kt-weight-semibold)',
              color: 'var(--kt-text)',
              margin: 0,
            }}
          >
            Resume
          </h3>
        </div>
        <p
          style={{
            fontSize: 'var(--kt-text-sm)',
            color: 'var(--kt-text-muted)',
            margin: '0 0 12px',
          }}
        >
          Upload your resume and AI will analyze it to prefill your work history.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleResumeUpload(f)
          }}
        />

        {!resumeFile && (
          <div
            style={{
              border: '1.5px dashed var(--kt-border)',
              borderRadius: 'var(--kt-radius-md)',
              padding: '20px',
              textAlign: 'center',
              background: 'var(--kt-grey-50, #f9f9fb)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 10,
            }}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              const f = e.dataTransfer.files[0]
              if (f) handleResumeUpload(f)
            }}
          >
            <div
              style={{ color: 'var(--kt-text-muted)', display: 'flex', justifyContent: 'center' }}
            >
              <UploadIcon size={20} />
            </div>
            <p style={{ margin: 0, fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text-muted)' }}>
              Drag your resume here or click to browse · PDF, DOC, DOCX
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                fileInputRef.current?.click()
              }}
            >
              <UploadIcon size={14} /> Upload resume
            </Button>
          </div>
        )}

        {resumeFile && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 14px',
              borderRadius: 'var(--kt-radius-md)',
              border: '1px solid var(--kt-border)',
              background: 'var(--kt-surface-raised)',
            }}
          >
            <FileTextIcon />
            <span style={{ flex: 1, fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text)' }}>
              {resumeFile}
            </span>
            {analyzing && (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 'var(--kt-text-xs)',
                  color: 'var(--kt-accent)',
                }}
              >
                <SparkleIcon /> Analyzing with AI…
              </span>
            )}
            {analyzed && (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 'var(--kt-text-xs)',
                  color: 'var(--kt-success)',
                }}
              >
                <CheckCircleIcon color="var(--kt-success)" /> Work history prefilled
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                setResumeFile(null)
                setAnalyzed(false)
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--kt-text-muted)',
                padding: 4,
                display: 'flex',
              }}
            >
              <XIcon />
            </button>
          </div>
        )}
      </div>

      {/* Work History */}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 4,
          }}
        >
          <h3
            style={{
              fontSize: 'var(--kt-text-md)',
              fontWeight: 'var(--kt-weight-semibold)',
              color: 'var(--kt-text)',
              margin: 0,
            }}
          >
            Work History
          </h3>
          {data.workHistory.length > 0 && (
            <Button size="sm" variant="outline" onClick={addEntry}>
              <PlusIcon /> Add experience
            </Button>
          )}
        </div>
        <p
          style={{
            fontSize: 'var(--kt-text-sm)',
            color: 'var(--kt-text-muted)',
            margin: '0 0 14px',
          }}
        >
          New to the industry? No problem — add experience as you go, or skip this step.
        </p>

        {data.workHistory.length === 0 && (
          <div
            style={{
              padding: '20px',
              borderRadius: 'var(--kt-radius-md)',
              background: 'var(--kt-grey-50, #f9f9fb)',
              border: '1px dashed var(--kt-border)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 10,
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text-muted)', margin: 0 }}>
              No work history added yet. Upload your resume above or add experience manually.
            </p>
            <Button size="sm" variant="outline" onClick={addEntry}>
              <PlusIcon /> Add experience
            </Button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {data.workHistory.map((entry) => (
            <WorkEntryCard
              key={entry.id}
              entry={entry}
              isExpanded={expandedId === entry.id}
              onToggle={() => setExpandedId((prev) => (prev === entry.id ? null : entry.id))}
              onRemove={() => removeEntry(entry.id)}
              onChange={(field, val) => updateEntry(entry.id, field, val)}
              workerIndustries={workerIndustries}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Section card wrapper ──────────────────────────────────────────────────

type SectionCardProps = {
  stepNum: number
  title: string
  stepState: StepState
  isSaved: boolean
  isSaving?: boolean
  onSave: () => void
  isLast?: boolean
  isCreate?: boolean
  cardRef: (el: HTMLDivElement | null) => void
  children: React.ReactNode
}

const SectionCard: React.FC<SectionCardProps> = ({
  stepNum,
  title,
  stepState,
  isSaved,
  isSaving = false,
  onSave,
  isLast = false,
  isCreate = false,
  cardRef,
  children,
}) => {
  const isComplete = stepState === 'complete-filled' || stepState === 'complete-skipped'
  return (
    <div
      ref={cardRef}
      style={{
        background: 'var(--kt-surface)',
        border: '1px solid var(--kt-border)',
        borderRadius: 'var(--kt-radius-lg)',
        overflow: 'hidden',
        scrollMarginTop: 84,
      }}
    >
      <div
        style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--kt-border)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            flexShrink: 0,
            background: isComplete ? 'var(--kt-accent)' : 'var(--kt-primary)',
            color: 'var(--kt-white, #fff)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'var(--kt-text-xs)',
            fontWeight: 'var(--kt-weight-bold)',
          }}
        >
          {isComplete ? '✓' : stepNum}
        </div>
        <h2
          style={{
            fontSize: 'var(--kt-text-lg)',
            fontWeight: 'var(--kt-weight-bold)',
            color: 'var(--kt-text)',
            margin: 0,
          }}
        >
          {title}
        </h2>
      </div>

      <div style={{ padding: 24 }}>{children}</div>

      <div
        style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--kt-border)',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: 12,
        }}
      >
        {isSaved && (
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 'var(--kt-text-xs)',
              color: 'var(--kt-success)',
            }}
          >
            <CheckCircleIcon /> Saved
          </span>
        )}
        <Button variant="primary" size="md" onClick={onSave} disabled={isSaving}>
          {isSaving ? 'Saving…' : isLast ? (isCreate ? 'Publish profile' : 'Save changes') : 'Save'}
        </Button>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────

export const WorkerProfileEditPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const isCreate = location.pathname.includes('/create')

  const [editState, setEditState] = useState<EditState>(() => loadState())
  const [activeSection, setActiveSection] = useState(1)
  const [savedStep, setSavedStep] = useState<number | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const sectionRefs = useRef<Record<number, HTMLDivElement | null>>({})

  useEffect(() => {
    saveState(editState)
  }, [editState])

  const scrollToSection = (stepNum: number) => {
    setActiveSection(stepNum)
    const el = sectionRefs.current[stepNum]
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 84
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }

  const saveSection = async (stepNum: number) => {
    setSaveError(null)

    // Only call the RPC on the final step (step 4) when all data is ready,
    // or on any step save when the user is logged in
    if (user) {
      setIsSaving(true)

      // Build the RPC payload from current editState
      const skills = Object.entries(editState.step2).flatMap(([industryId, d]) =>
        d.skills.map((s) => ({
          industry_id: industryId,
          skill_id: s.canonicalId ?? null,
          name: s.name,
          years_exp: s.yearsExp ?? null,
          source: s.source,
        }))
      )

      const certs = Object.values(editState.step2).flatMap((d) =>
        d.certifications.map((c) => ({
          cert_name: c.certName,
          issuing_body: c.issuingBody,
          expiry_date: c.expiryDate || null,
        }))
      )

      const socialLinks = editState.stepAbout.socialLinks.map((l) => ({
        platform: l.platform,
        url: l.url,
      }))

      const workHistory = editState.step3.workHistory.map((w) => ({
        employer_name: w.employerName,
        role_title: w.roleTitle,
        start_date: w.startDate || null,
        end_date: w.endDate || null,
        is_current: w.isCurrent,
        contract_type: w.contractType,
        industry_id: w.industryId || null,
        description: w.description,
      }))

      const { error } = await supabase.rpc('upsert_worker_profile', {
        p_full_name: editState.step1.fullName,
        p_city: editState.step1.city,
        p_region: editState.step1.region,
        p_phone: editState.step1.phone,
        p_primary_trade: editState.stepAbout.primaryTrade,
        p_bio: editState.stepAbout.bio,
        p_industries: editState.workerIndustries,
        p_skills: skills,
        p_certs: certs,
        p_social_links: socialLinks,
        p_work_history: workHistory,
      })

      setIsSaving(false)

      if (error) {
        setSaveError(error.message)
        return
      }
    }

    setEditState((prev) => {
      const states = { ...prev.stepStates }
      states[stepNum] = 'complete-filled'
      return { ...prev, stepStates: states }
    })
    setSavedStep(stepNum)
    setTimeout(() => setSavedStep(null), 2000)
    if (stepNum < 4) {
      setActiveSection(stepNum + 1)
      setTimeout(() => scrollToSection(stepNum + 1), 80)
    } else {
      navigate('/site/dashboard/worker')
    }
  }

  const updateStep2 = (industryId: string, d: Step2Data) =>
    setEditState((prev) => ({ ...prev, step2: { ...prev.step2, [industryId]: d } }))

  const addIndustry = (id: string) =>
    setEditState((prev) => ({ ...prev, workerIndustries: [...prev.workerIndustries, id] }))

  const removeIndustry = (id: string) =>
    setEditState((prev) => ({
      ...prev,
      workerIndustries: prev.workerIndustries.filter((i) => i !== id),
    }))

  const displayStepStates: Record<number, StepState> = {}
  for (let i = 1; i <= 4; i++) {
    const stored = editState.stepStates[i]
    if (stored === 'complete-filled' || stored === 'complete-skipped') {
      displayStepStates[i] = stored
    } else if (i === activeSection) {
      displayStepStates[i] = 'active'
    } else {
      displayStepStates[i] = 'incomplete'
    }
  }

  const stepTitles: Record<number, string> = {
    1: 'Identity & Basics',
    2: 'About Me',
    3: 'Skills & Certifications',
    4: 'Work History',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--kt-bg)' }}>
      {/* Page header */}
      <div
        style={{
          background: 'var(--kt-surface)',
          borderBottom: '1px solid var(--kt-border)',
          padding: '20px var(--kt-space-6)',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--kt-text-muted)',
              fontSize: 'var(--kt-text-xs)',
              padding: 0,
              marginBottom: 8,
              fontFamily: 'var(--kt-font-sans)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            ← Back to profile
          </button>
          <h1
            style={{
              fontSize: 'var(--kt-text-xl)',
              fontWeight: 'var(--kt-weight-bold)',
              color: 'var(--kt-text)',
              margin: '0 0 2px',
            }}
          >
            {isCreate ? 'Build your profile' : 'Edit your profile'}
          </h1>
          <p style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text-muted)', margin: 0 }}>
            {isCreate
              ? 'Fill in your information to start getting discovered by employers.'
              : 'Keep your profile up to date to attract the best opportunities.'}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 32px 48px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '220px 1fr',
            gap: 40,
            alignItems: 'start',
          }}
        >
          {/* Left: sticky vertical stepper (no border/card) */}
          <div style={{ position: 'sticky', top: 84 }}>
            <Stepper
              vertical
              steps={STEPS}
              stepStates={displayStepStates}
              onStepClick={scrollToSection}
            />
          </div>

          {/* Right: all sections stacked */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {saveError && (
              <p
                style={{
                  fontSize: 'var(--kt-text-sm)',
                  color: 'var(--kt-error, #c0392b)',
                  margin: 0,
                  padding: '10px 14px',
                  background: 'rgba(192,57,43,0.07)',
                  borderRadius: 'var(--kt-radius-md)',
                }}
              >
                {saveError}
              </p>
            )}

            <SectionCard
              stepNum={1}
              title={stepTitles[1]}
              stepState={displayStepStates[1]}
              isSaved={savedStep === 1}
              isSaving={isSaving}
              onSave={() => saveSection(1)}
              isCreate={isCreate}
              cardRef={(el) => {
                sectionRefs.current[1] = el
              }}
            >
              <Step1
                data={editState.step1}
                onChange={(d) => setEditState((prev) => ({ ...prev, step1: d }))}
              />
            </SectionCard>

            <SectionCard
              stepNum={2}
              title={stepTitles[2]}
              stepState={displayStepStates[2]}
              isSaved={savedStep === 2}
              isSaving={isSaving}
              onSave={() => saveSection(2)}
              isCreate={isCreate}
              cardRef={(el) => {
                sectionRefs.current[2] = el
              }}
            >
              <StepAbout
                data={editState.stepAbout}
                onChange={(d) => setEditState((prev) => ({ ...prev, stepAbout: d }))}
              />
            </SectionCard>

            <SectionCard
              stepNum={3}
              title={stepTitles[3]}
              stepState={displayStepStates[3]}
              isSaved={savedStep === 3}
              isSaving={isSaving}
              onSave={() => saveSection(3)}
              isCreate={isCreate}
              cardRef={(el) => {
                sectionRefs.current[3] = el
              }}
            >
              <Step2
                workerIndustries={editState.workerIndustries}
                allData={editState.step2}
                onChange={updateStep2}
                onAddIndustry={addIndustry}
                onRemoveIndustry={removeIndustry}
              />
            </SectionCard>

            <SectionCard
              stepNum={4}
              title={stepTitles[4]}
              stepState={displayStepStates[4]}
              isSaved={savedStep === 4}
              isSaving={isSaving}
              onSave={() => saveSection(4)}
              isCreate={isCreate}
              isLast
              cardRef={(el) => {
                sectionRefs.current[4] = el
              }}
            >
              <Step3
                data={editState.step3}
                workerIndustries={editState.workerIndustries}
                onChange={(d) => setEditState((prev) => ({ ...prev, step3: d }))}
              />
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  )
}
