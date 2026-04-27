import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Input, Textarea, Select, Button, Badge, Alert, Switch, Divider } from '../../components'
import styles from './PostJobPage.module.css'
import { RegulixBadge } from '../components/RegulixBadge/RegulixBadge'
import { RegulixMarkIcon, StarIcon, PlusIcon, CelebrationIcon, LightningIcon } from '../icons'
import { industries } from '../data/mock'
import { createJob, updateJob, getJobById, getCompanyIndustry } from '../services/jobService'
import { useAuth } from '../context/AuthContext'

// ── Suggested skills by industry ────────────────────────────────────────────

const suggestedSkillsByIndustry: Record<string, string[]> = {
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
    'Patrol',
  ],
}

// ── Layout helpers ───────────────────────────────────────────────────────────

const Section = ({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) => (
  <div className={styles.section}>
    <div style={{ marginBottom: 20 }}>
      <h2
        style={{
          fontSize: 'var(--kt-text-md)',
          fontWeight: 'var(--kt-weight-semibold)',
          color: 'var(--kt-text)',
          marginBottom: 4,
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <p style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text-muted)' }}>{subtitle}</p>
      )}
    </div>
    {children}
  </div>
)

const FieldRow = ({ children }: { children: React.ReactNode }) => (
  <div className={styles.fieldRow}>{children}</div>
)

// ── Select options ───────────────────────────────────────────────────────────

const payTypeOptions = [
  { value: 'hour', label: 'Per Hour' },
  { value: 'salary', label: 'Annual Salary' },
]

const typeOptions = [
  { value: 'Full-time', label: 'Full-time' },
  { value: 'Part-time', label: 'Part-time' },
  { value: 'Contract', label: 'Contract' },
  { value: 'Temporary', label: 'Temporary' },
]

const experienceOptions = [
  { value: 'entry', label: 'Entry Level (0–1 yr)' },
  { value: 'mid', label: 'Mid Level (1–3 yrs)' },
  { value: 'senior', label: 'Senior (3–5 yrs)' },
  { value: 'lead', label: 'Lead / Expert (5+ yrs)' },
]

// ── Page component ───────────────────────────────────────────────────────────

export const PostJobPage: React.FC = () => {
  const navigate = useNavigate()
  const { id: editId } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const duplicateOf = searchParams.get('duplicate')
  const isEditMode = !!editId
  const { user } = useAuth()
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [loadError, setLoadError] = useState('')

  // Form state
  const [title, setTitle] = useState('')
  const [industry, setIndustry] = useState('')
  const [jobType, setJobType] = useState('Full-time')
  const [location, setLocation] = useState('')
  const [payMin, setPayMin] = useState('')
  const [payMax, setPayMax] = useState('')
  const [payType, setPayType] = useState('hour')
  const [experience, setExperience] = useState('mid')
  const [description, setDescription] = useState('')
  const [requirements, setRequirements] = useState('')
  const [skillInput, setSkillInput] = useState('')
  const [parsedSkills, setParsedSkills] = useState<string[]>([])
  const [sponsorMode, setSponsorMode] = useState<'off' | 'on'>('off')
  const [stopMode, setStopMode] = useState<'pause' | 'limit'>('pause')
  const [appLimit, setAppLimit] = useState('50')
  const [urgentHiring, setUrgentHiring] = useState(false)
  const [regulixPreferred, setRegulixPreferred] = useState(false)
  const [questions, setQuestions] = useState<string[]>([''])

  // Pre-fill industry from company profile when creating a new job from scratch
  // (skip when editing or duplicating — both already supply an industry)
  useEffect(() => {
    if (editId || duplicateOf || !user) return
    getCompanyIndustry(user.id).then(({ data }) => {
      if (!data) return
      const match = industries.find((i) => i.name.toLowerCase() === data.toLowerCase())
      if (match) setIndustry(match.slug)
    })
  }, [editId, duplicateOf, user])

  // Load existing job when editing or duplicating. In duplicate mode the title
  // gets a "(Copy)" suffix and editId stays unset so submit creates a new job.
  useEffect(() => {
    const sourceId = editId ?? duplicateOf
    if (!sourceId) return
    getJobById(sourceId).then(({ data, error }) => {
      if (error || !data) {
        setLoadError(error ?? 'Job not found')
        return
      }
      setTitle(duplicateOf ? `${data.title} (Copy)` : data.title)
      setIndustry(data.industrySlug)
      setJobType(data.type)
      setLocation(data.location)
      setPayMin(data.payMin ? String(data.payMin) : '')
      setPayMax(data.payMax ? String(data.payMax) : '')
      setPayType(data.payType)
      setExperience(data.experienceLevel ?? 'mid')
      setDescription(data.description)
      setRequirements(data.requirements.join('\n'))
      setParsedSkills(data.skills)
      setSponsorMode(data.isSponsored ? 'on' : 'off')
      setUrgentHiring(data.urgentHiring ?? false)
      setRegulixPreferred(data.regulixPreferred ?? false)
      setQuestions(data.preInterviewQuestions?.length ? data.preInterviewQuestions : [''])
      if (data.autoPauseLimit) {
        setStopMode('limit')
        setAppLimit(String(data.autoPauseLimit))
      }
    })
  }, [editId, duplicateOf])

  const estimatedCost =
    stopMode === 'limit' ? `$${(Number(appLimit) * 38).toLocaleString()}` : 'pay-per-application'

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Skills
  const addSkill = (skill?: string) => {
    const s = (skill ?? skillInput).trim()
    if (s && !parsedSkills.includes(s)) {
      setParsedSkills((prev) => [...prev, s])
      if (!skill) setSkillInput('')
    }
  }
  const removeSkill = (s: string) => setParsedSkills((prev) => prev.filter((x) => x !== s))

  const suggestedSkills = industry
    ? (suggestedSkillsByIndustry[industry] ?? []).filter((s) => !parsedSkills.includes(s))
    : []

  // Questions
  const addQuestion = () => {
    if (questions.length < 6) setQuestions((prev) => [...prev, ''])
  }
  const removeQuestion = (i: number) => setQuestions((prev) => prev.filter((_, idx) => idx !== i))
  const updateQuestion = (i: number, value: string) => {
    const next = [...questions]
    next[i] = value
    setQuestions(next)
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!title.trim()) e.title = 'Job title is required'
    if (!industry) e.industry = 'Industry is required'
    if (!location.trim()) e.location = 'Location is required'
    if (payMin && payMax && Number(payMin) >= Number(payMax))
      e.pay = 'Pay min must be less than pay max'
    if (!description.trim()) e.description = 'Job description is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    if (!user) return
    setSubmitError('')

    const selectedIndustry = industries.find((ind) => ind.slug === industry)
    const jobFields = {
      title: title.trim(),
      industry: selectedIndustry?.name ?? industry,
      industrySlug: industry,
      type: jobType as 'Full-time' | 'Part-time' | 'Contract' | 'Temporary',
      location: location.trim(),
      payMin: payMin ? Number(payMin) : null,
      payMax: payMax ? Number(payMax) : null,
      payType: payType as 'hour' | 'salary',
      description: description.trim(),
      requirements: requirements
        .split('\n')
        .map((r) => r.trim())
        .filter(Boolean),
      skills: parsedSkills,
      isSponsored: sponsorMode === 'on',
      experienceLevel: experience || null,
      preInterviewQuestions: questions.filter(Boolean),
      urgentHiring,
      regulixPreferred,
      autoPauseLimit: stopMode === 'limit' && appLimit ? Number(appLimit) : null,
    }

    if (isEditMode && editId) {
      const { error } = await updateJob(editId, jobFields)
      if (error) {
        setSubmitError(error)
        return
      }
      setSubmitted(true)
      setTimeout(() => navigate(`/site/jobs/${editId}`), 2500)
    } else {
      const { data, error } = await createJob({ companyId: user.id, ...jobFields })
      if (error) {
        setSubmitError(error)
        return
      }
      setSubmitted(true)
      setTimeout(() => navigate(`/site/jobs/${data?.id ?? ''}`), 2500)
    }
  }

  if (submitted) {
    return (
      <div className={styles.successWrapper}>
        <div>
          <CelebrationIcon size={64} />
        </div>
        <h1
          style={{
            fontSize: 'var(--kt-text-2xl)',
            fontWeight: 'var(--kt-weight-bold)',
            color: 'var(--kt-text)',
            textAlign: 'center',
          }}
        >
          {isEditMode ? 'Job Updated!' : 'Job Posted Successfully!'}
        </h1>
        <p
          style={{
            fontSize: 'var(--kt-text-md)',
            color: 'var(--kt-text-muted)',
            textAlign: 'center',
            maxWidth: 400,
          }}
        >
          {isEditMode
            ? 'Your changes have been saved. Redirecting you to your posting…'
            : 'Your job listing is now live. Redirecting you to your posting…'}
        </p>
        {regulixPreferred && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <RegulixBadge pulse />
            <span
              style={{
                fontSize: 'var(--kt-text-sm)',
                color: 'var(--kt-olive-700)',
                fontWeight: 'var(--kt-weight-medium)',
              }}
            >
              Regulix Preferred — your listing is boosted to hire-ready candidates
            </span>
          </div>
        )}
      </div>
    )
  }

  if (loadError) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <Alert variant="danger">{loadError}</Alert>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      {/* Page Header */}
      <div className={styles.header}>
        <div className={styles.headerInner}>
          <h1
            style={{
              fontSize: 'var(--kt-text-2xl)',
              fontWeight: 'var(--kt-weight-display)',
              color: 'var(--kt-text)',
              marginBottom: 6,
              letterSpacing: '-0.02em',
            }}
          >
            {isEditMode ? 'Edit Job' : 'Post a Job'}
          </h1>
          <p style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text-muted)' }}>
            {isEditMode
              ? 'Update the details below to edit your job listing.'
              : 'Fill in the details below to publish your job listing to thousands of qualified workers.'}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate className={styles.formOuter}>
        <div className={styles.formInner}>
          {Object.keys(errors).length > 0 && (
            <Alert variant="danger">Please fix the errors below before submitting.</Alert>
          )}
          {submitError && <Alert variant="danger">{submitError}</Alert>}

          {/* Basic Info */}
          <Section
            title="Basic Information"
            subtitle="Tell workers what the role is and where it's located."
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Input
                label="Job Title"
                placeholder="e.g. Framing Carpenter, CNA, CDL-A Driver…"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                error={errors.title}
                required
              />
              <FieldRow>
                <Select
                  label="Industry"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  error={errors.industry}
                  required
                  options={[
                    { value: '', label: 'Select an industry…' },
                    ...industries.map((i) => ({ value: i.slug, label: i.name })),
                  ]}
                />
                <Select
                  label="Job Type"
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                  options={typeOptions}
                />
              </FieldRow>
              <FieldRow>
                <Input
                  label="Location"
                  placeholder="e.g. Phoenix, AZ"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  error={errors.location}
                  required
                />
                <Select
                  label="Experience Level"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  options={experienceOptions}
                />
              </FieldRow>
            </div>
          </Section>

          {/* Compensation */}
          <Section
            title="Compensation"
            subtitle="Set a competitive pay range to attract qualified candidates."
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Select
                label="Pay Type"
                value={payType}
                onChange={(e) => setPayType(e.target.value)}
                options={payTypeOptions}
              />
              <FieldRow>
                <Input
                  label={`Minimum Pay (${payType === 'hour' ? '$/hr' : 'K/yr'})`}
                  type="number"
                  placeholder={payType === 'hour' ? '18' : '35'}
                  value={payMin}
                  onChange={(e) => setPayMin(e.target.value)}
                  error={errors.pay}
                />
                <Input
                  label={`Maximum Pay (${payType === 'hour' ? '$/hr' : 'K/yr'})`}
                  type="number"
                  placeholder={payType === 'hour' ? '26' : '50'}
                  value={payMax}
                  onChange={(e) => setPayMax(e.target.value)}
                />
              </FieldRow>
              <p style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-text-muted)' }}>
                Jobs with a posted pay range receive 3x more applications on average.
              </p>
            </div>
          </Section>

          {/* Description */}
          <Section
            title="Job Description"
            subtitle="Describe the role, day-to-day responsibilities, and work environment."
          >
            <Textarea
              label="Description"
              placeholder="This role involves… Workers will be responsible for… The ideal candidate…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              error={errors.description}
              rows={6}
              maxChars={1500}
              required
            />
          </Section>

          {/* Requirements */}
          <Section
            title="Requirements"
            subtitle="List the qualifications, certifications, and experience needed."
          >
            <Textarea
              label="Requirements"
              placeholder="• 3+ years experience&#10;• OSHA 10 certification preferred&#10;• Valid driver's license…"
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              rows={5}
              maxChars={1000}
              helperText="Enter each requirement on a new line for best formatting."
            />
          </Section>

          {/* Skills */}
          <Section
            title="Required Skills"
            subtitle="Tag the skills workers need. These help match your job to the right candidates."
          >
            {/* Input row */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <Input
                placeholder="Add a skill (e.g. Framing, CPR/BLS, CDL-A)…"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addSkill()
                  }
                }}
                style={{ flex: 1 }}
              />
              <Button type="button" variant="outline" size="md" onClick={() => addSkill()}>
                Add
              </Button>
            </div>

            {/* Added skills */}
            {parsedSkills.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {parsedSkills.map((s) => (
                  <span
                    key={s}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 10px 4px 12px',
                      background: 'var(--kt-primary-subtle)',
                      color: 'var(--kt-primary)',
                      borderRadius: 'var(--kt-radius-full)',
                      fontSize: 'var(--kt-text-xs)',
                      fontWeight: 'var(--kt-weight-medium)',
                      border: '1px solid var(--kt-primary-subtle)',
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
                        color: 'var(--kt-primary)',
                        fontSize: 14,
                        padding: 0,
                        lineHeight: 1,
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Empty state */}
            {parsedSkills.length === 0 && suggestedSkills.length === 0 && (
              <p
                style={{
                  fontSize: 'var(--kt-text-xs)',
                  color: 'var(--kt-text-muted)',
                  marginBottom: 8,
                }}
              >
                No skills added yet. Type a skill and press Enter or click Add.
              </p>
            )}

            {/* Suggested skills */}
            {suggestedSkills.length > 0 && (
              <div>
                <p
                  style={{
                    fontSize: 'var(--kt-text-xs)',
                    fontWeight: 'var(--kt-weight-medium)',
                    color: 'var(--kt-text-muted)',
                    marginBottom: 8,
                  }}
                >
                  Suggested skills:
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {suggestedSkills.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => addSkill(s)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '4px 12px 4px 8px',
                        background: 'rgba(109, 117, 49, 0.07)',
                        border: '1px solid rgba(109, 117, 49, 0.22)',
                        borderRadius: 'var(--kt-radius-full)',
                        fontSize: 'var(--kt-text-xs)',
                        fontWeight: 'var(--kt-weight-medium)',
                        color: 'var(--kt-olive-700)',
                        cursor: 'pointer',
                        fontFamily: 'var(--kt-font-sans)',
                        transition: 'background var(--kt-duration-fast)',
                      }}
                      onMouseOver={(e) =>
                        (e.currentTarget.style.background = 'rgba(109, 117, 49, 0.14)')
                      }
                      onMouseOut={(e) =>
                        (e.currentTarget.style.background = 'rgba(109, 117, 49, 0.07)')
                      }
                    >
                      <PlusIcon size={12} />
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Section>

          {/* Pre-Interview Questions */}
          <Section
            title="Pre-Interview Questions"
            subtitle="Optional screening questions applicants will answer when they apply."
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {questions.map((q, i) => (
                // eslint-disable-next-line react/no-array-index-key
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <Input
                      label={`Question ${i + 1}${i > 0 ? ' (optional)' : ''}`}
                      placeholder={
                        i === 0
                          ? "e.g. Do you have a valid driver's license?"
                          : i === 1
                            ? 'e.g. Are you available to start immediately?'
                            : 'e.g. Do you have the required certification?'
                      }
                      value={q}
                      onChange={(e) => updateQuestion(i, e.target.value)}
                    />
                  </div>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(i)}
                      style={{
                        background: 'none',
                        border: '1px solid var(--kt-border)',
                        borderRadius: 'var(--kt-radius-sm)',
                        cursor: 'pointer',
                        color: 'var(--kt-text-muted)',
                        fontSize: 18,
                        padding: '6px 10px',
                        lineHeight: 1,
                        fontFamily: 'var(--kt-font-sans)',
                        marginBottom: 1,
                        transition:
                          'color var(--kt-duration-fast), border-color var(--kt-duration-fast)',
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.color = 'var(--kt-danger)'
                        e.currentTarget.style.borderColor = 'var(--kt-danger)'
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.color = 'var(--kt-text-muted)'
                        e.currentTarget.style.borderColor = 'var(--kt-border)'
                      }}
                      aria-label={`Remove question ${i + 1}`}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}

              {questions.length < 6 && (
                <button
                  type="button"
                  onClick={addQuestion}
                  style={{
                    alignSelf: 'flex-start',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--kt-primary)',
                    fontSize: 'var(--kt-text-sm)',
                    fontWeight: 'var(--kt-weight-medium)',
                    fontFamily: 'var(--kt-font-sans)',
                    padding: '4px 0',
                  }}
                >
                  <PlusIcon size={12} />
                  Add another question
                </button>
              )}
            </div>
          </Section>

          {/* Listing Options */}
          <Section
            title="Listing Options"
            subtitle="Boost your listing's visibility and attract hire-ready candidates."
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Regulix Preferred */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 16,
                  padding: '16px 18px',
                  background: regulixPreferred ? 'rgba(109, 117, 49, 0.07)' : 'var(--kt-bg)',
                  border: `1px solid ${regulixPreferred ? 'var(--kt-accent)' : 'var(--kt-border)'}`,
                  borderRadius: 'var(--kt-radius-md)',
                  transition: 'all var(--kt-duration-fast)',
                }}
              >
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  {/* Regulix R mark — same footprint as the star in the sponsor card */}
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <RegulixMarkIcon size={24} />
                  </div>
                  <div>
                    <p
                      style={{
                        fontWeight: 'var(--kt-weight-semibold)',
                        color: 'var(--kt-text)',
                        fontSize: 'var(--kt-text-sm)',
                        marginBottom: 4,
                      }}
                    >
                      Regulix Preferred
                    </p>
                    <p
                      style={{
                        fontSize: 'var(--kt-text-xs)',
                        color: 'var(--kt-text-muted)',
                        lineHeight: 1.5,
                      }}
                    >
                      Mark this job as preferring candidates with up-to-date Regulix accounts.
                    </p>
                  </div>
                </div>
                <Switch
                  checked={regulixPreferred}
                  onChange={(e) => setRegulixPreferred(e.target.checked)}
                  size="md"
                />
              </div>

              {/* Sponsored / Featured */}
              <div
                style={{
                  border: `1px solid ${sponsorMode === 'on' ? 'var(--kt-accent)' : 'var(--kt-border)'}`,
                  borderRadius: 'var(--kt-radius-md)',
                  overflow: 'hidden',
                  transition: 'border-color var(--kt-duration-fast)',
                }}
              >
                {/* Always-visible top row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 16,
                    padding: '16px 18px',
                    background: sponsorMode === 'on' ? 'rgba(109, 117, 49, 0.07)' : 'var(--kt-bg)',
                    borderBottom: sponsorMode === 'on' ? '1px solid var(--kt-border)' : 'none',
                    transition: 'background var(--kt-duration-fast)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <StarIcon size={24} color="var(--kt-olive-700)" />
                    </div>
                    <div>
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}
                      >
                        <p
                          style={{
                            fontWeight: 'var(--kt-weight-semibold)',
                            color: 'var(--kt-text)',
                            fontSize: 'var(--kt-text-sm)',
                          }}
                        >
                          Sponsor this listing
                        </p>
                        {sponsorMode === 'on' && (
                          <Badge variant="accent" size="sm">
                            Active
                          </Badge>
                        )}
                      </div>
                      <p
                        style={{
                          fontSize: 'var(--kt-text-xs)',
                          color: 'var(--kt-text-muted)',
                          lineHeight: 1.5,
                          maxWidth: 460,
                        }}
                      >
                        Pinned to the top of search results with a "Featured" banner. Only pay when
                        someone applies. Sponsored jobs get <strong>5× more views</strong> on
                        average.{' '}
                        <strong style={{ color: 'var(--kt-text)' }}>$38.00 per application.</strong>
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={sponsorMode === 'on'}
                    onChange={(e) => {
                      setSponsorMode(e.target.checked ? 'on' : 'off')
                      if (!e.target.checked) setUrgentHiring(false)
                    }}
                    size="md"
                  />
                </div>

                {sponsorMode === 'on' && (
                  <div
                    style={{
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 20,
                      background: 'var(--kt-surface)',
                    }}
                  >
                    {/* Stop mode */}
                    <div>
                      <p
                        style={{
                          fontSize: 'var(--kt-text-sm)',
                          fontWeight: 'var(--kt-weight-semibold)',
                          color: 'var(--kt-text)',
                          marginBottom: 12,
                        }}
                      >
                        When should this sponsored listing stop?
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {/* Option 1: pause mode */}
                        <label
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            cursor: 'pointer',
                          }}
                        >
                          <input
                            type="radio"
                            name="stopMode"
                            checked={stopMode === 'pause'}
                            onChange={() => setStopMode('pause')}
                            style={{ accentColor: 'var(--kt-primary)', flexShrink: 0 }}
                          />
                          <div>
                            <p
                              style={{
                                fontSize: 'var(--kt-text-sm)',
                                color: 'var(--kt-text)',
                                fontWeight:
                                  stopMode === 'pause'
                                    ? 'var(--kt-weight-semibold)'
                                    : 'var(--kt-weight-normal)',
                              }}
                            >
                              Pause or close listing
                            </p>
                            <p
                              style={{
                                fontSize: 'var(--kt-text-xs)',
                                color: 'var(--kt-text-muted)',
                                lineHeight: 1.5,
                              }}
                            >
                              Keep running until you manually pause it or close the job.
                            </p>
                          </div>
                        </label>

                        {/* Option 2: limit mode */}
                        <label
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            cursor: 'pointer',
                          }}
                        >
                          <input
                            type="radio"
                            name="stopMode"
                            checked={stopMode === 'limit'}
                            onChange={() => setStopMode('limit')}
                            style={{ accentColor: 'var(--kt-primary)', flexShrink: 0 }}
                          />
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                flexWrap: 'wrap',
                              }}
                            >
                              <p
                                style={{
                                  fontSize: 'var(--kt-text-sm)',
                                  color: 'var(--kt-text)',
                                  fontWeight:
                                    stopMode === 'limit'
                                      ? 'var(--kt-weight-semibold)'
                                      : 'var(--kt-weight-normal)',
                                }}
                              >
                                Stop after
                              </p>
                              <input
                                type="number"
                                min="1"
                                value={appLimit}
                                onChange={(e) => setAppLimit(e.target.value)}
                                onClick={() => setStopMode('limit')}
                                style={{
                                  width: 72,
                                  padding: '4px 8px',
                                  border: `1px solid ${stopMode === 'limit' ? 'var(--kt-primary)' : 'var(--kt-border)'}`,
                                  borderRadius: 'var(--kt-radius-sm)',
                                  fontSize: 'var(--kt-text-sm)',
                                  color: 'var(--kt-text)',
                                  background: 'var(--kt-bg)',
                                  fontFamily: 'var(--kt-font-sans)',
                                  outline: 'none',
                                  textAlign: 'center',
                                }}
                              />
                              <p style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text)' }}>
                                applications
                              </p>
                            </div>
                            {stopMode === 'limit' && (
                              <p
                                style={{
                                  fontSize: 'var(--kt-text-xs)',
                                  color: 'var(--kt-text-muted)',
                                  marginTop: 4,
                                  lineHeight: 1.5,
                                }}
                              >
                                Estimated budget: <strong>{estimatedCost}</strong> total
                              </p>
                            )}
                          </div>
                        </label>
                      </div>
                    </div>

                    <Divider />

                    {/* Urgently hiring */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <input
                          type="checkbox"
                          id="urgentHiring"
                          checked={urgentHiring}
                          onChange={(e) => setUrgentHiring(e.target.checked)}
                          style={{
                            marginTop: 3,
                            accentColor: 'var(--kt-primary)',
                            width: 16,
                            height: 16,
                            cursor: 'pointer',
                          }}
                        />
                        <label htmlFor="urgentHiring" style={{ cursor: 'pointer', flex: 1 }}>
                          <p
                            style={{
                              fontSize: 'var(--kt-text-sm)',
                              fontWeight: 'var(--kt-weight-semibold)',
                              color: 'var(--kt-text)',
                              marginBottom: 3,
                            }}
                          >
                            Add "Urgently Hiring" label
                          </p>
                          <p
                            style={{
                              fontSize: 'var(--kt-text-xs)',
                              color: 'var(--kt-text-muted)',
                              lineHeight: 1.5,
                            }}
                          >
                            Shows a badge on your listing to signal that you need to fill this role
                            fast.
                          </p>
                          {urgentHiring && (
                            <div
                              style={{
                                marginTop: 8,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '3px 10px',
                                background: 'var(--kt-warning-subtle)',
                                border: '1px solid var(--kt-warning)',
                                borderRadius: 'var(--kt-radius-full)',
                                fontSize: 'var(--kt-text-xs)',
                                fontWeight: 'var(--kt-weight-semibold)',
                                color: 'var(--kt-warning-text)',
                              }}
                            >
                              <LightningIcon size={12} /> Urgently Hiring
                            </div>
                          )}
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Section>

          {/* Submit */}
          <div className={styles.submitRow}>
            <Button
              type="button"
              variant="ghost"
              size="lg"
              onClick={() => navigate('/site/dashboard/company')}
            >
              Cancel
            </Button>
            <Button type="button" variant="outline" size="lg" onClick={() => {}}>
              Save Draft
            </Button>
            <Button type="submit" variant="primary" size="lg">
              {isEditMode ? 'Save Changes' : 'Publish Job'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
