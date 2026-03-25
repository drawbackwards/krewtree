import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Spinner } from '../../components'
import { KrewtreeLogo, KrewtreeBgMark } from '../components/Logo'
import { industries as allIndustries } from '../data/mock'
import {
  CheckCircleIcon,
  PlusIcon,
  CloseIcon,
  FolderIcon,
  ChevronDownIcon,
  UploadIcon,
  TrashIcon,
  LightningIcon,
  CheckIcon,
  ClockIcon,
  BriefcaseIcon,
  SparkleIcon,
} from '../icons'

// ── Types ─────────────────────────────────────────────────────────────────────

interface JobEntry {
  id: string
  employer: string
  title: string
  startDate: string
  endDate: string
  current: boolean
}

// ── Skill suggestions ─────────────────────────────────────────────────────────

const SUGGESTED_SKILLS: Record<string, string[]> = {
  construction: [
    'Framing',
    'Drywall',
    'Concrete',
    'Roofing',
    'Plumbing',
    'Electrical',
    'OSHA 10',
    'Blueprint Reading',
    'Welding',
    'Heavy Equipment',
  ],
  healthcare: [
    'CPR/BLS',
    'Patient Care',
    'Phlebotomy',
    'EMR/EHR',
    'Wound Care',
    'IV Therapy',
    'CNA',
    'HIPAA',
    'Vitals Monitoring',
  ],
  hospitality: [
    'Food Safety',
    'ServSafe',
    'POS Systems',
    'Customer Service',
    'Food Prep',
    'Barista',
    'Event Setup',
    'Table Service',
  ],
  retail: [
    'Cash Handling',
    'Inventory Management',
    'POS Systems',
    'Customer Service',
    'Loss Prevention',
    'Merchandising',
    'Stock',
  ],
  transportation: [
    'CDL-A',
    'CDL-B',
    'Forklift',
    'DOT Compliance',
    'Route Planning',
    'Hazmat',
    'Logistics',
    'Load Securing',
  ],
  manufacturing: [
    'CNC Operation',
    'Quality Control',
    'Forklift',
    'Assembly Line',
    'Welding',
    'ISO Standards',
    'Lean Manufacturing',
    'Machine Operation',
  ],
  landscaping: [
    'Lawn Care',
    'Irrigation',
    'Pruning',
    'Pesticide License',
    'Hardscaping',
    'Plant Identification',
    'Sod Installation',
    'Snow Removal',
  ],
  security: [
    'CPR/AED',
    'Crowd Control',
    'CCTV Monitoring',
    'Incident Reporting',
    'Guard Card',
    'First Aid',
    'Access Control',
    'Report Writing',
  ],
}

// ── Step metadata ─────────────────────────────────────────────────────────────

const TOTAL_STEPS = 5

const STEPS_META = [
  {
    label: 'The basics',
    headline: 'First impressions count.',
    sub: 'Your headline is the first thing employers read. Make it specific.',
  },
  {
    label: 'About you',
    headline: 'Tell your story.',
    sub: 'Profiles with a bio get 2× more views from employers.',
  },
  {
    label: 'Industries & skills',
    headline: 'Get found faster.',
    sub: 'Workers with 5+ skills appear in 3× more employer searches.',
  },
  {
    label: 'Resume',
    headline: 'Upload once, apply everywhere.',
    sub: "We'll pull your work history automatically — no retyping needed.",
  },
  {
    label: 'Work experience',
    headline: 'Your experience, your story.',
    sub: 'Review what we found and add anything we missed.',
  },
]

const STEP_ICONS = [
  <SparkleIcon key="sparkle" size={15} />,
  <LightningIcon key="lightning" size={15} />,
  <BriefcaseIcon key="briefcase" size={15} />,
  <FolderIcon key="folder" size={15} />,
  <ClockIcon key="clock" size={15} />,
]

const PARSED_JOBS: JobEntry[] = [
  {
    id: 'pj1',
    employer: 'Skyline Framing Co.',
    title: 'Lead Carpenter',
    startDate: '2021-03',
    endDate: '',
    current: true,
  },
  {
    id: 'pj2',
    employer: 'Desert Build Group',
    title: 'Journeyman Carpenter',
    startDate: '2018-06',
    endDate: '2021-02',
    current: false,
  },
  {
    id: 'pj3',
    employer: 'Martinez Construction',
    title: 'Framing Apprentice',
    startDate: '2016-01',
    endDate: '2018-05',
    current: false,
  },
]

// ── Regulix wordmark (navy on white) ─────────────────────────────────────────

// ── Shared input styles ───────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  border: '1.5px solid var(--kt-border)',
  borderRadius: 'var(--kt-radius-lg)',
  fontFamily: 'var(--kt-font-sans)',
  fontSize: 'var(--kt-text-sm)',
  color: 'var(--kt-text)',
  background: 'white',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
}

const fieldLabel: React.CSSProperties = {
  fontSize: 'var(--kt-text-sm)',
  fontWeight: 'var(--kt-weight-medium)',
  color: 'var(--kt-text)',
  marginBottom: 6,
  display: 'block',
}

// ── Component ─────────────────────────────────────────────────────────────────

export const WorkerProfileSetupPage: React.FC = () => {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState(1)

  // Step 1
  const [headline, setHeadline] = useState('')

  // Step 2
  const [bio, setBio] = useState('')

  // Step 3
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>(['construction'])
  const [industryOpen, setIndustryOpen] = useState(false)
  const industryRef = useRef<HTMLDivElement>(null)
  const [skills, setSkills] = useState<string[]>([])
  const [customSkillInput, setCustomSkillInput] = useState('')

  // Step 4
  const [resumeFilename, setResumeFilename] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzed, setAnalyzed] = useState(false)

  // Step 5
  const [jobHistory, setJobHistory] = useState<JobEntry[]>([])

  // Close industry dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (industryRef.current && !industryRef.current.contains(e.target as Node)) {
        setIndustryOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Handlers ───────────────────────────────────────────────────────────────

  const toggleIndustry = (slug: string) =>
    setSelectedIndustries((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    )

  const addSkill = (name: string) => {
    const t = name.trim()
    if (t && !skills.includes(t)) setSkills((p) => [...p, t])
  }

  const removeSkill = (name: string) => setSkills((p) => p.filter((s) => s !== name))

  const handleCustomSkill = () => {
    addSkill(customSkillInput)
    setCustomSkillInput('')
  }

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setResumeFilename(file.name)
      setAnalyzed(false)
    }
  }

  const handleAnalyze = () => {
    setAnalyzing(true)
    setTimeout(() => {
      setAnalyzing(false)
      setAnalyzed(true)
      setJobHistory(PARSED_JOBS)
    }, 2200)
  }

  const addJob = () =>
    setJobHistory((prev) => [
      ...prev,
      { id: `j${Date.now()}`, employer: '', title: '', startDate: '', endDate: '', current: false },
    ])

  const updateJob = (id: string, field: keyof JobEntry, value: string | boolean) =>
    setJobHistory((prev) => prev.map((j) => (j.id === id ? { ...j, [field]: value } : j)))

  const removeJob = (id: string) => setJobHistory((prev) => prev.filter((j) => j.id !== id))

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS))
  const back = () => setStep((s) => Math.max(s - 1, 1))
  const finish = () => navigate('/site/dashboard/worker')

  // ── Ghost button ───────────────────────────────────────────────────────────

  const ghostBtn: React.CSSProperties = {
    background: 'none',
    border: 'none',
    fontSize: 'var(--kt-text-sm)',
    color: 'var(--kt-text-muted)',
    cursor: 'pointer',
    fontFamily: 'var(--kt-font-sans)',
  }

  // ── Standard footer ────────────────────────────────────────────────────────

  const stdFooter = (label = 'Continue →', showSkip = false) => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        marginTop: 'auto',
        paddingTop: 24,
      }}
    >
      <Button variant="primary" size="lg" style={{ width: '100%' }} onClick={next}>
        {label}
      </Button>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 24 }}>
        {step > 1 && (
          <button onClick={back} style={ghostBtn}>
            ← Back
          </button>
        )}
        {showSkip && (
          <button onClick={next} style={ghostBtn}>
            Skip this step
          </button>
        )}
      </div>
    </div>
  )

  // ── Step bodies ────────────────────────────────────────────────────────────

  // Step 1
  const body1 = (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'var(--kt-primary)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'var(--kt-text-lg)',
            fontWeight: 'var(--kt-weight-bold)',
            flexShrink: 0,
          }}
        >
          MT
        </div>
        <div>
          <p
            style={{
              fontSize: 'var(--kt-text-sm)',
              fontWeight: 'var(--kt-weight-semibold)',
              color: 'var(--kt-text)',
              marginBottom: 2,
            }}
          >
            Marcus Torres
          </p>
          <p style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-text-muted)' }}>
            Photo upload coming soon
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div>
          <label style={fieldLabel}>Full name</label>
          <input
            style={{
              ...inputStyle,
              background: 'var(--kt-bg-subtle)',
              color: 'var(--kt-text-muted)',
            }}
            value="Marcus Torres"
            readOnly
          />
        </div>
        <div>
          <label style={fieldLabel}>Location</label>
          <input
            style={{
              ...inputStyle,
              background: 'var(--kt-bg-subtle)',
              color: 'var(--kt-text-muted)',
            }}
            value="Phoenix, AZ"
            readOnly
          />
        </div>
      </div>

      <div>
        <label style={fieldLabel}>Headline</label>
        <input
          style={inputStyle}
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="e.g. Journeyman Carpenter · 8 yrs experience"
          onFocus={(e) => (e.target.style.borderColor = 'var(--kt-accent)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--kt-border)')}
        />
        <p style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-text-muted)', marginTop: 5 }}>
          Role + years of experience works well.
        </p>
      </div>

      {stdFooter()}
    </>
  )

  // Step 2
  const body2 = (
    <>
      <div>
        <label style={fieldLabel}>
          About you{' '}
          <span style={{ fontWeight: 400, color: 'var(--kt-text-muted)' }}>(optional)</span>
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={500}
          rows={7}
          placeholder="e.g. Experienced journeyman carpenter specializing in commercial framing. Safety-first mindset, OSHA 30 certified. Reliable and always on time."
          style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--kt-accent)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--kt-border)')}
        />
        <p
          style={{
            fontSize: 'var(--kt-text-xs)',
            color: 'var(--kt-text-muted)',
            marginTop: 5,
            textAlign: 'right',
          }}
        >
          {bio.length}/500
        </p>
      </div>
      {stdFooter('Continue →', true)}
    </>
  )

  // Step 3
  const body3 = (
    <>
      {/* Industries multiselect */}
      <div ref={industryRef} style={{ position: 'relative', marginBottom: 16 }}>
        <label style={fieldLabel}>Industries you work in</label>
        <button
          type="button"
          onClick={() => setIndustryOpen((o) => !o)}
          style={{
            ...inputStyle,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            textAlign: 'left',
            color: selectedIndustries.length ? 'var(--kt-text)' : 'var(--kt-text-muted)',
            borderColor: industryOpen ? 'var(--kt-accent)' : 'var(--kt-border)',
          }}
        >
          <span
            style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {selectedIndustries.length === 0
              ? 'Select industries…'
              : selectedIndustries.length === 1
                ? (allIndustries.find((i) => i.slug === selectedIndustries[0])?.name ??
                  '1 selected')
                : `${selectedIndustries.length} industries selected`}
          </span>
          <span
            style={{
              flexShrink: 0,
              marginLeft: 8,
              display: 'flex',
              transform: industryOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.15s',
            }}
          >
            <ChevronDownIcon size={16} />
          </span>
        </button>

        {industryOpen && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              right: 0,
              background: 'white',
              border: '1.5px solid var(--kt-border)',
              borderRadius: 'var(--kt-radius-lg)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              zIndex: 50,
              overflow: 'hidden',
            }}
          >
            {allIndustries.map((ind) => {
              const active = selectedIndustries.includes(ind.slug)
              return (
                <button
                  key={ind.id}
                  type="button"
                  onClick={() => toggleIndustry(ind.slug)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    background: active ? 'rgba(109,117,49,0.07)' : 'transparent',
                    border: 'none',
                    borderBottom: '1px solid var(--kt-border)',
                    cursor: 'pointer',
                    fontFamily: 'var(--kt-font-sans)',
                    fontSize: 'var(--kt-text-sm)',
                    color: 'var(--kt-text)',
                    textAlign: 'left',
                  }}
                >
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 4,
                      flexShrink: 0,
                      border: `2px solid ${active ? 'var(--kt-accent)' : 'var(--kt-border)'}`,
                      background: active ? 'var(--kt-accent)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {active && <CheckIcon size={10} color="white" />}
                  </span>
                  {ind.name}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Skills */}
      <div style={{ marginBottom: 16 }}>
        <label style={fieldLabel}>
          Your skills
          {skills.length > 0 && (
            <span style={{ fontWeight: 400, color: 'var(--kt-text-muted)', marginLeft: 6 }}>
              {skills.length} added
            </span>
          )}
        </label>

        {skills.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {skills.map((s) => (
              <span
                key={s}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '4px 10px',
                  borderRadius: 'var(--kt-radius-full)',
                  background: 'var(--kt-primary)',
                  color: 'white',
                  fontSize: 'var(--kt-text-xs)',
                  fontWeight: 'var(--kt-weight-medium)',
                }}
              >
                {s}
                <button
                  type="button"
                  onClick={() => removeSkill(s)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'rgba(255,255,255,0.8)',
                    display: 'flex',
                    padding: 0,
                  }}
                >
                  <CloseIcon size={12} />
                </button>
              </span>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <input
            style={{ ...inputStyle, flex: 1 }}
            value={customSkillInput}
            onChange={(e) => setCustomSkillInput(e.target.value)}
            placeholder="Type a skill and press Add"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleCustomSkill()
              }
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--kt-accent)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--kt-border)')}
          />
          <button
            type="button"
            onClick={handleCustomSkill}
            disabled={!customSkillInput.trim()}
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--kt-radius-lg)',
              border: '1.5px solid var(--kt-border)',
              background: customSkillInput.trim() ? 'var(--kt-primary)' : 'transparent',
              color: customSkillInput.trim() ? 'white' : 'var(--kt-text-muted)',
              cursor: customSkillInput.trim() ? 'pointer' : 'default',
              fontSize: 'var(--kt-text-sm)',
              fontFamily: 'var(--kt-font-sans)',
              fontWeight: 'var(--kt-weight-medium)',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.15s',
            }}
          >
            <PlusIcon size={14} />
          </button>
        </div>
      </div>

      {/* Suggested per industry */}
      {selectedIndustries.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p
            style={{
              fontSize: 'var(--kt-text-xs)',
              fontWeight: 'var(--kt-weight-semibold)',
              color: 'var(--kt-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Suggested
          </p>
          {selectedIndustries.map((slug) => {
            const industryName = allIndustries.find((i) => i.slug === slug)?.name ?? slug
            const suggestions = (SUGGESTED_SKILLS[slug] ?? []).filter((s) => !skills.includes(s))
            if (!suggestions.length) return null
            return (
              <div key={slug}>
                {selectedIndustries.length > 1 && (
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 'var(--kt-weight-semibold)',
                      color: 'var(--kt-text-muted)',
                      marginBottom: 6,
                    }}
                  >
                    {industryName}
                  </p>
                )}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => addSkill(s)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '4px 10px',
                        borderRadius: 'var(--kt-radius-full)',
                        border: '1.5px solid var(--kt-border)',
                        background: 'white',
                        fontSize: 'var(--kt-text-xs)',
                        color: 'var(--kt-text)',
                        cursor: 'pointer',
                        fontFamily: 'var(--kt-font-sans)',
                        transition: 'all 0.12s',
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.borderColor = 'var(--kt-accent)'
                        e.currentTarget.style.color = 'var(--kt-accent)'
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.borderColor = 'var(--kt-border)'
                        e.currentTarget.style.color = 'var(--kt-text)'
                      }}
                    >
                      <PlusIcon size={11} /> {s}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {stdFooter()}
    </>
  )

  // Step 4 — Resume
  const body4 = (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        style={{ display: 'none' }}
        onChange={handleFilePick}
      />

      {!resumeFilename && !analyzing && !analyzed && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          style={{
            width: '100%',
            padding: '48px 24px',
            border: '2px dashed var(--kt-border)',
            borderRadius: 'var(--kt-radius-lg)',
            background: 'var(--kt-bg-subtle)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
            fontFamily: 'var(--kt-font-sans)',
            transition: 'border-color 0.15s, background 0.15s',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.borderColor = 'var(--kt-accent)'
            e.currentTarget.style.background = 'rgba(109,117,49,0.04)'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.borderColor = 'var(--kt-border)'
            e.currentTarget.style.background = 'var(--kt-bg-subtle)'
          }}
        >
          <UploadIcon size={28} color="var(--kt-text-muted)" />
          <span
            style={{
              fontSize: 'var(--kt-text-sm)',
              fontWeight: 'var(--kt-weight-semibold)',
              color: 'var(--kt-text)',
            }}
          >
            Drop your resume here
          </span>
          <span style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-text-muted)' }}>
            or click to browse — PDF or Word
          </span>
        </button>
      )}

      {resumeFilename && !analyzing && !analyzed && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '16px 18px',
            border: '1.5px solid var(--kt-border)',
            borderRadius: 'var(--kt-radius-lg)',
            background: 'var(--kt-bg-subtle)',
          }}
        >
          <FolderIcon size={24} color="var(--kt-text-muted)" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontSize: 'var(--kt-text-sm)',
                fontWeight: 'var(--kt-weight-medium)',
                color: 'var(--kt-text)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {resumeFilename}
            </p>
            <p style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-text-muted)' }}>
              Ready to analyze
            </p>
          </div>
          <button
            type="button"
            onClick={() => setResumeFilename(null)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--kt-text-muted)',
              display: 'flex',
              padding: 4,
            }}
          >
            <CloseIcon size={16} />
          </button>
        </div>
      )}

      {analyzing && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 14,
            padding: '48px 24px',
            border: '1.5px solid var(--kt-border)',
            borderRadius: 'var(--kt-radius-lg)',
            background: 'var(--kt-bg-subtle)',
          }}
        >
          <Spinner size="md" />
          <div style={{ textAlign: 'center' }}>
            <p
              style={{
                fontSize: 'var(--kt-text-sm)',
                fontWeight: 'var(--kt-weight-semibold)',
                color: 'var(--kt-text)',
                marginBottom: 4,
              }}
            >
              Analyzing your resume…
            </p>
            <p style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-text-muted)' }}>
              Finding your work history and skills
            </p>
          </div>
        </div>
      )}

      {analyzed && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 14,
            padding: '18px 20px',
            border: '1.5px solid var(--kt-success)',
            borderRadius: 'var(--kt-radius-lg)',
            background: 'var(--kt-success-subtle)',
          }}
        >
          <CheckCircleIcon size={22} color="var(--kt-success)" />
          <div>
            <p
              style={{
                fontSize: 'var(--kt-text-sm)',
                fontWeight: 'var(--kt-weight-semibold)',
                color: 'var(--kt-text)',
                marginBottom: 3,
              }}
            >
              Analysis complete
            </p>
            <p style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-text-muted)' }}>
              Found {PARSED_JOBS.length} positions — review them on the next step.
            </p>
          </div>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          marginTop: 'auto',
          paddingTop: 24,
        }}
      >
        {analyzed ? (
          <Button variant="primary" size="lg" style={{ width: '100%' }} onClick={next}>
            Continue to review →
          </Button>
        ) : resumeFilename && !analyzing ? (
          <Button variant="primary" size="lg" style={{ width: '100%' }} onClick={handleAnalyze}>
            Analyze resume →
          </Button>
        ) : null}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24 }}>
          <button onClick={back} style={ghostBtn}>
            ← Back
          </button>
          <button onClick={next} style={ghostBtn}>
            Skip this step
          </button>
        </div>
      </div>
    </>
  )

  // Step 5 — Work experience
  const body5 = (
    <>
      {analyzed && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 14px',
            background: 'rgba(109,117,49,0.07)',
            border: '1px solid rgba(109,117,49,0.25)',
            borderRadius: 'var(--kt-radius-md)',
            marginBottom: 16,
          }}
        >
          <CheckCircleIcon size={15} color="var(--kt-accent)" />
          <span
            style={{
              fontSize: 'var(--kt-text-xs)',
              color: 'var(--kt-olive-700)',
              fontWeight: 'var(--kt-weight-medium)',
            }}
          >
            Pre-filled from your resume — review and adjust as needed
          </span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 16 }}>
        {jobHistory.map((job, i) => (
          <div
            key={job.id}
            style={{
              padding: '16px 18px',
              border: '1.5px solid var(--kt-border)',
              borderRadius: 'var(--kt-radius-lg)',
              background: 'var(--kt-bg-subtle)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 'var(--kt-weight-bold)',
                  color: 'var(--kt-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                Position {i + 1}
              </span>
              <button
                type="button"
                onClick={() => removeJob(job.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--kt-text-muted)',
                  padding: 2,
                  display: 'flex',
                }}
              >
                <TrashIcon size={14} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ ...fieldLabel, fontSize: 11 }}>Employer</label>
                  <input
                    style={{
                      ...inputStyle,
                      fontSize: 'var(--kt-text-xs)',
                      padding: '8px 12px',
                      background: 'white',
                    }}
                    value={job.employer}
                    onChange={(e) => updateJob(job.id, 'employer', e.target.value)}
                    placeholder="Company name"
                    onFocus={(e) => (e.target.style.borderColor = 'var(--kt-accent)')}
                    onBlur={(e) => (e.target.style.borderColor = 'var(--kt-border)')}
                  />
                </div>
                <div>
                  <label style={{ ...fieldLabel, fontSize: 11 }}>Job title</label>
                  <input
                    style={{
                      ...inputStyle,
                      fontSize: 'var(--kt-text-xs)',
                      padding: '8px 12px',
                      background: 'white',
                    }}
                    value={job.title}
                    onChange={(e) => updateJob(job.id, 'title', e.target.value)}
                    placeholder="Your role"
                    onFocus={(e) => (e.target.style.borderColor = 'var(--kt-accent)')}
                    onBlur={(e) => (e.target.style.borderColor = 'var(--kt-border)')}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ ...fieldLabel, fontSize: 11 }}>Start date</label>
                  <input
                    type="month"
                    value={job.startDate}
                    onChange={(e) => updateJob(job.id, 'startDate', e.target.value)}
                    style={{
                      ...inputStyle,
                      fontSize: 'var(--kt-text-xs)',
                      padding: '8px 12px',
                      background: 'white',
                      cursor: 'pointer',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = 'var(--kt-accent)')}
                    onBlur={(e) => (e.target.style.borderColor = 'var(--kt-border)')}
                  />
                </div>
                <div>
                  <label style={{ ...fieldLabel, fontSize: 11 }}>End date</label>
                  <input
                    type="month"
                    disabled={job.current}
                    value={job.current ? '' : job.endDate}
                    onChange={(e) => updateJob(job.id, 'endDate', e.target.value)}
                    style={{
                      ...inputStyle,
                      fontSize: 'var(--kt-text-xs)',
                      padding: '8px 12px',
                      background: job.current ? 'var(--kt-bg-subtle)' : 'white',
                      cursor: job.current ? 'default' : 'pointer',
                      color: job.current ? 'var(--kt-text-muted)' : 'var(--kt-text)',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = 'var(--kt-accent)')}
                    onBlur={(e) => (e.target.style.borderColor = 'var(--kt-border)')}
                  />
                </div>
              </div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  fontSize: 'var(--kt-text-xs)',
                  color: 'var(--kt-text-muted)',
                  userSelect: 'none',
                }}
              >
                <input
                  type="checkbox"
                  checked={job.current}
                  onChange={(e) => updateJob(job.id, 'current', e.target.checked)}
                  style={{
                    accentColor: 'var(--kt-accent)',
                    width: 14,
                    height: 14,
                    cursor: 'pointer',
                  }}
                />
                I currently work here
              </label>
            </div>
          </div>
        ))}

        {jobHistory.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '36px 24px',
              border: '2px dashed var(--kt-border)',
              borderRadius: 'var(--kt-radius-lg)',
              color: 'var(--kt-text-muted)',
              fontSize: 'var(--kt-text-sm)',
            }}
          >
            No positions yet — add your first one below.
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={addJob}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 'var(--kt-text-sm)',
          color: 'var(--kt-primary)',
          fontFamily: 'var(--kt-font-sans)',
          fontWeight: 'var(--kt-weight-medium)',
          padding: 0,
          marginBottom: 8,
        }}
      >
        <PlusIcon size={14} /> Add {jobHistory.length === 0 ? 'a position' : 'another position'}
      </button>

      {stdFooter('Get Started', false)}
    </>
  )

  const stepBodies = [body1, body2, body3, body4, body5]
  const meta = STEPS_META[step - 1]

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--kt-navy-900)',
        position: 'relative',
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--kt-font-sans)',
      }}
    >
      <KrewtreeBgMark />

      {/* ── Top bar ── */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '22px 52px',
        }}
      >
        <Link
          to="/site"
          style={{ display: 'inline-flex', lineHeight: 0 }}
          aria-label="krewtree home"
        >
          <KrewtreeLogo height={34} onDark accentColor="white" />
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 'var(--kt-text-sm)', color: 'rgba(255,255,255,0.7)' }}>
            You can always do this later
          </span>
          <button
            onClick={finish}
            style={{
              background: 'rgba(229,218,195,0.1)',
              color: 'var(--kt-sand-300)',
              border: '1px solid rgba(229,218,195,0.2)',
              borderRadius: 'var(--kt-radius-full)',
              padding: '7px 18px',
              fontSize: 'var(--kt-text-sm)',
              fontWeight: 'var(--kt-weight-medium)',
              cursor: 'pointer',
              fontFamily: 'var(--kt-font-sans)',
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(229,218,195,0.16)')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(229,218,195,0.1)')}
          >
            Skip for now
          </button>
        </div>
      </div>

      {/* ── Main content ── */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          padding: '48px 24px 60px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 56,
            width: '100%',
            maxWidth: 1060,
          }}
        >
          {/* Left — sticky brand + step list */}
          <div style={{ flex: 1, minWidth: 0, position: 'sticky', top: 48 }}>
            <h1
              style={{
                fontSize: 'clamp(28px, 3vw, 44px)',
                fontWeight: 'var(--kt-weight-bold)',
                color: 'var(--kt-sand-300)',
                lineHeight: 1.05,
                marginBottom: 16,
                letterSpacing: '-0.8px',
              }}
            >
              {meta.headline}
            </h1>
            <p
              style={{
                fontSize: 'var(--kt-text-md)',
                color: 'rgba(255,255,255,0.85)',
                lineHeight: 1.7,
                marginBottom: 44,
                maxWidth: 340,
              }}
            >
              {meta.sub}
            </p>

            {/* Step list — same icon box style as signup benefits */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {STEPS_META.map((s, i) => {
                const n = i + 1
                const done = n < step
                const active = n === step
                return (
                  <div key={n} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        flexShrink: 0,
                        marginTop: 1,
                        background: done
                          ? 'var(--kt-accent)'
                          : active
                            ? 'rgba(255,255,255,0.2)'
                            : 'rgba(255,255,255,0.12)',
                        border: `1px solid ${done ? 'var(--kt-accent)' : active ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.15)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                      }}
                    >
                      {done ? <CheckIcon size={14} /> : STEP_ICONS[i]}
                    </div>
                    <span
                      style={{
                        fontSize: 'var(--kt-text-sm)',
                        color: done || active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)',
                        lineHeight: 1.55,
                        paddingTop: 7,
                        fontWeight: active ? 'var(--kt-weight-semibold)' : 'normal',
                      }}
                    >
                      {s.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right — white card */}
          <div
            style={{
              background: 'white',
              borderRadius: 20,
              padding: '40px 44px 48px',
              width: 480,
              flexShrink: 0,
              minHeight: 560,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 24px 64px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.2)',
            }}
          >
            {/* Step label — same style as "Worker Account" in signup */}
            <span
              style={{
                display: 'block',
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--kt-navy-500)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 14,
              }}
            >
              Step {step} of {TOTAL_STEPS} — {meta.label}
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              {stepBodies[step - 1]}
            </div>
          </div>
        </div>
      </div>

      {/* Page-level footer — matches signup */}
      <p
        style={{
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          padding: '0 0 20px',
          fontSize: 11,
          color: 'rgba(229,218,195,0.15)',
        }}
      >
        A Regulix Partner Platform · © 2026 krewtree
      </p>
    </div>
  )
}
