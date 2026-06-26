import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Input, Textarea, Select, Button, Alert, Switch, Divider, Modal } from '../../components'
import styles from './PostJobPage.module.css'
import { RegulixBadge } from '../components/RegulixBadge/RegulixBadge'
import {
  RegulixMarkIcon,
  RocketIcon,
  PlusIcon,
  CelebrationIcon,
  LightningIcon,
  CalendarIcon,
  ChevronDownIcon,
  DotsVerticalIcon,
} from '../icons'
import { industries } from '../data/mock'
import { FEATURES } from '../config/features'
import {
  createJob,
  updateJob,
  getJobById,
  getCompanyIndustry,
  getCompanyTemplates,
  saveJobTemplate,
} from '../services/jobService'
import type { CreateJobParams, JobTemplate } from '../services/jobService'
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

// Shared style for the publish overflow-menu items.
const menuItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  width: '100%',
  padding: '10px 12px',
  background: 'none',
  border: 'none',
  borderRadius: 'var(--kt-radius-sm)',
  cursor: 'pointer',
  fontSize: 'var(--kt-text-sm)',
  fontFamily: 'var(--kt-font-sans)',
  color: 'var(--kt-text)',
  textAlign: 'left',
}

// Format an ISO timestamp as a `datetime-local` input value in local time.
const toDatetimeLocal = (iso: string): string => {
  const d = new Date(iso)
  const pad = (n: number): string => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// ── Page component ───────────────────────────────────────────────────────────

export const PostJobPage: React.FC = () => {
  const navigate = useNavigate()
  const { id: editId } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const duplicateOf = searchParams.get('duplicate')
  const templateParam = searchParams.get('template')
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
  const [budget, setBudget] = useState('1900')
  const [urgentHiring, setUrgentHiring] = useState(false)
  const [regulixPreferred, setRegulixPreferred] = useState(false)
  const [questions, setQuestions] = useState<string[]>([''])
  const [closingAt, setClosingAt] = useState('')

  // Templates
  const [templates, setTemplates] = useState<JobTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [showSaveTemplate, setShowSaveTemplate] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [templateSaved, setTemplateSaved] = useState(false)

  const [showTemplateMenu, setShowTemplateMenu] = useState(false)

  // Scheduling
  const [showPublishMenu, setShowPublishMenu] = useState(false)
  const [showSchedule, setShowSchedule] = useState(false)
  const [scheduleAt, setScheduleAt] = useState('')
  const [scheduledSubmit, setScheduledSubmit] = useState(false)
  const [draftSubmit, setDraftSubmit] = useState(false)
  // Status of the job loaded in edit mode (null when creating/duplicating).
  const [loadedStatus, setLoadedStatus] = useState<string | null>(null)

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

  // Load saved templates for the "Start from a template" picker (create mode only).
  useEffect(() => {
    if (editId || !user) return
    getCompanyTemplates(user.id).then(({ data }) => setTemplates(data))
  }, [editId, user])

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
        setBudget(String(data.autoPauseLimit * 38))
      }
      setClosingAt(data.closingAt ? data.closingAt.slice(0, 10) : '')
      // Carry the scheduled time + status only when editing (a duplicate publishes fresh).
      if (editId) {
        setLoadedStatus(data.status)
        if (data.publishAt) setScheduleAt(toDatetimeLocal(data.publishAt))
      }
    })
  }, [editId, duplicateOf])

  const estimatedApplications =
    stopMode === 'limit' && Number(budget) > 0 ? Math.floor(Number(budget) / 38) : 0

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

  // Snapshot the current form into the shape createJob/templates consume.
  const buildJobFields = (): Omit<CreateJobParams, 'companyId'> => {
    const selectedIndustry = industries.find((ind) => ind.slug === industry)
    return {
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
      // Defensive: never persist a Regulix-preferred job while the feature is off,
      // even if stale state slips through.
      regulixPreferred: FEATURES.regulix && regulixPreferred,
      autoPauseLimit:
        stopMode === 'limit' && Number(budget) > 0 ? Math.floor(Number(budget) / 38) : null,
      closingAt: closingAt ? closingAt : null,
    }
  }

  // Create or update the job. `publishAt` (ISO) schedules it for later;
  // null publishes immediately.
  const submitJob = async (publishAt: string | null): Promise<void> => {
    if (!validate()) return
    if (!user) return
    setSubmitError('')
    const jobFields = buildJobFields()

    if (isEditMode && editId) {
      // Scheduling re-parks as 'scheduled'; publishing a draft promotes it to
      // 'active'; editing any already-live job leaves its status untouched.
      const editPatch = publishAt
        ? { ...jobFields, publishAt, status: 'scheduled' as const }
        : loadedStatus === 'draft'
          ? { ...jobFields, status: 'active' as const, publishAt: null }
          : jobFields
      const { error } = await updateJob(editId, editPatch)
      if (error) {
        setSubmitError(error)
        return
      }
      setScheduledSubmit(!!publishAt)
      setSubmitted(true)
      setTimeout(() => navigate(publishAt ? '/site/dashboard/jobs' : `/site/jobs/${editId}`), 2500)
    } else {
      const { data, error } = await createJob({ companyId: user.id, ...jobFields, publishAt })
      if (error) {
        setSubmitError(error)
        return
      }
      setScheduledSubmit(!!publishAt)
      setSubmitted(true)
      setTimeout(
        () => navigate(publishAt ? '/site/dashboard/jobs' : `/site/jobs/${data?.id ?? ''}`),
        2500
      )
    }
  }

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    void submitJob(null)
  }

  // Save the in-progress form as a draft (only a title is required). Drafts
  // stay off the public board and live under the Job posts "Drafts" tab.
  const saveDraft = async (): Promise<void> => {
    if (!user) return
    if (!title.trim()) {
      setErrors({ title: 'Add a title to save a draft' })
      return
    }
    setSubmitError('')
    const jobFields = buildJobFields()
    const { error } =
      isEditMode && editId
        ? await updateJob(editId, { ...jobFields, status: 'draft', publishAt: null })
        : await createJob({ companyId: user.id, ...jobFields, asDraft: true })
    if (error) {
      setSubmitError(error)
      return
    }
    setDraftSubmit(true)
    setSubmitted(true)
    setTimeout(() => navigate('/site/dashboard/jobs'), 2000)
  }

  const scheduleValid = !!scheduleAt && new Date(scheduleAt).getTime() > Date.now()

  const handleScheduleConfirm = (): void => {
    if (!scheduleValid) return
    setShowSchedule(false)
    void submitJob(new Date(scheduleAt).toISOString())
  }

  // ── Templates ───────────────────────────────────────────────────────────────

  const applyTemplate = (p: Partial<Omit<CreateJobParams, 'companyId'>>): void => {
    if (p.industrySlug !== undefined) setIndustry(p.industrySlug)
    if (p.title !== undefined) setTitle(p.title)
    if (p.type !== undefined) setJobType(p.type)
    if (p.location !== undefined) setLocation(p.location)
    setPayMin(p.payMin != null ? String(p.payMin) : '')
    setPayMax(p.payMax != null ? String(p.payMax) : '')
    if (p.payType !== undefined) setPayType(p.payType)
    setExperience(p.experienceLevel || 'mid')
    if (p.description !== undefined) setDescription(p.description)
    setRequirements(p.requirements?.join('\n') ?? '')
    setParsedSkills(p.skills ?? [])
    setSponsorMode(p.isSponsored ? 'on' : 'off')
    setUrgentHiring(p.urgentHiring ?? false)
    setRegulixPreferred(p.regulixPreferred ?? false)
    if (p.autoPauseLimit) {
      setStopMode('limit')
      setBudget(String(p.autoPauseLimit * 38))
    } else {
      setStopMode('pause')
    }
    setQuestions(p.preInterviewQuestions?.length ? p.preInterviewQuestions : [''])
    setClosingAt(p.closingAt ? p.closingAt.slice(0, 10) : '')
  }

  const handleSelectTemplate = (id: string): void => {
    setSelectedTemplateId(id)
    const t = templates.find((x) => x.id === id)
    if (t) applyTemplate(t.payload)
  }

  // Auto-apply a template when arriving from Settings with ?template=<id>
  // (create mode only). Runs once, after the template list has loaded.
  const appliedTemplateParam = useRef(false)
  useEffect(() => {
    if (editId || duplicateOf || !templateParam || appliedTemplateParam.current) return
    const t = templates.find((x) => x.id === templateParam)
    if (t) {
      appliedTemplateParam.current = true
      handleSelectTemplate(t.id)
    }
    // handleSelectTemplate is stable enough; ref guard prevents re-application.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templates, templateParam, editId, duplicateOf])

  const resetForm = (): void => {
    setSelectedTemplateId('')
    setTitle('')
    setJobType('Full-time')
    setLocation('')
    setPayMin('')
    setPayMax('')
    setPayType('hour')
    setExperience('mid')
    setDescription('')
    setRequirements('')
    setParsedSkills([])
    setSponsorMode('off')
    setStopMode('pause')
    setBudget('1900')
    setUrgentHiring(false)
    setRegulixPreferred(false)
    setQuestions([''])
    setClosingAt('')
  }

  const handleSaveTemplate = async (): Promise<void> => {
    if (!user || !templateName.trim()) return
    setSavingTemplate(true)
    const { error } = await saveJobTemplate(user.id, templateName.trim(), buildJobFields())
    setSavingTemplate(false)
    if (error) {
      setSubmitError(error)
      setShowSaveTemplate(false)
      return
    }
    const { data: list } = await getCompanyTemplates(user.id)
    setTemplates(list)
    setShowSaveTemplate(false)
    setTemplateName('')
    setTemplateSaved(true)
    setTimeout(() => setTemplateSaved(false), 3000)
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
          {draftSubmit
            ? 'Draft saved'
            : scheduledSubmit
              ? 'Job Scheduled!'
              : isEditMode && loadedStatus !== 'draft'
                ? 'Job Updated!'
                : 'Job Posted Successfully!'}
        </h1>
        <p
          style={{
            fontSize: 'var(--kt-text-md)',
            color: 'var(--kt-text-muted)',
            textAlign: 'center',
            maxWidth: 400,
          }}
        >
          {draftSubmit
            ? 'Your draft is saved under Job posts. Redirecting you there…'
            : scheduledSubmit
              ? 'Your listing will go live at the scheduled time. Redirecting you to your job posts…'
              : isEditMode && loadedStatus !== 'draft'
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
              fontWeight: 'var(--kt-weight-semibold)',
              color: 'var(--kt-text)',
              marginBottom: 6,
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
          {templateSaved && <Alert variant="success">Template saved.</Alert>}

          {/* Start from a template (create mode only) */}
          {!isEditMode && templates.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'flex-end',
                gap: 16,
                padding: '18px 20px',
                background: 'var(--kt-primary-subtle)',
                borderRadius: 'var(--kt-radius-lg)',
                marginBottom: 12,
              }}
            >
              <div style={{ flex: '1 1 auto', minWidth: 300 }}>
                <p
                  style={{
                    fontSize: 'var(--kt-text-md)',
                    fontWeight: 'var(--kt-weight-semibold)',
                    color: 'var(--kt-text)',
                    marginBottom: 4,
                  }}
                >
                  Start from a template
                </p>
                <p style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text-muted)' }}>
                  Prefill this form with a saved posting. You can still edit any field.
                </p>
              </div>
              <div style={{ flex: '0 0 240px', minWidth: 0 }}>
                <Select
                  placeholder="Choose a template…"
                  value={selectedTemplateId}
                  onChange={(e) => handleSelectTemplate(e.target.value)}
                  options={templates.map((t) => ({ value: t.id, label: t.name }))}
                />
              </div>
              {selectedTemplateId && (
                <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
                  Clear
                </Button>
              )}
            </div>
          )}

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
                <Input
                  label="Location"
                  placeholder="e.g. Phoenix, AZ"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  error={errors.location}
                  required
                />
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
              </FieldRow>
              <FieldRow>
                <Select
                  label="Job Type"
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                  options={typeOptions}
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
              <div className={styles.payGrid}>
                <Select
                  label="Pay Type"
                  value={payType}
                  onChange={(e) => setPayType(e.target.value)}
                  options={payTypeOptions}
                />
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
              </div>
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
            <div className={styles.skillInputRow}>
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
                        fontSize: 'var(--kt-text-sm)',
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
                <div key={i} className={styles.questionRow}>
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
                        fontSize: 'var(--kt-text-lg)',
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
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {/* Closing Date */}
              <div className={styles.optionRowDate}>
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
                  <CalendarIcon size={22} color="var(--kt-text-muted)" />
                </div>
                <div className={styles.optionRowDateText}>
                  <p
                    style={{
                      fontWeight: 'var(--kt-weight-semibold)',
                      color: 'var(--kt-text)',
                      fontSize: 'var(--kt-text-sm)',
                    }}
                  >
                    Closing Date{' '}
                    <span
                      style={{
                        fontWeight: 'var(--kt-weight-normal)',
                        color: 'var(--kt-text-muted)',
                      }}
                    >
                      (Optional)
                    </span>
                  </p>
                </div>
                <div className={styles.optionRowDateInput}>
                  <Input
                    type="date"
                    value={closingAt}
                    onChange={(e) => setClosingAt(e.target.value)}
                  />
                </div>
              </div>

              <Divider style={{ borderColor: 'var(--kt-border-subtle, rgba(0,0,0,0.06))' }} />

              {/* Regulix Preferred */}
              {FEATURES.regulix && (
                <>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: 16,
                      padding: '24px 4px',
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

                  <Divider style={{ borderColor: 'var(--kt-border-subtle, rgba(0,0,0,0.06))' }} />
                </>
              )}

              {/* Sponsored / Featured */}
              <div>
                {/* Always-visible top row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 16,
                    padding: '24px 4px',
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
                      <RocketIcon size={24} color="var(--kt-olive-700)" />
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
                        Boost this listing for $38
                      </p>
                      <p
                        style={{
                          fontSize: 'var(--kt-text-xs)',
                          color: 'var(--kt-text-muted)',
                          lineHeight: 1.5,
                          maxWidth: 460,
                        }}
                      >
                        Pinned to the top of search results with a "Boosted" banner. Only pay when
                        someone applies.
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
                  <>
                    <div
                      style={{
                        padding: '4px 4px 4px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 20,
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
                          When should this boosted listing stop?
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {/* Option 1: pause mode */}
                          <label
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 10,
                              cursor: 'pointer',
                            }}
                          >
                            <input
                              type="radio"
                              name="stopMode"
                              checked={stopMode === 'pause'}
                              onChange={() => setStopMode('pause')}
                              style={{
                                marginTop: 3,
                                accentColor: 'var(--kt-primary)',
                                flexShrink: 0,
                              }}
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
                                Manually
                              </p>
                              <p
                                style={{
                                  fontSize: 'var(--kt-text-xs)',
                                  color: 'var(--kt-text-muted)',
                                  lineHeight: 1.5,
                                }}
                              >
                                Keep running until you pause or close it.
                              </p>
                            </div>
                          </label>

                          {/* Option 2: limit mode */}
                          <label
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 4,
                              cursor: 'pointer',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                flexWrap: 'wrap',
                              }}
                            >
                              <input
                                type="radio"
                                name="stopMode"
                                checked={stopMode === 'limit'}
                                onChange={() => setStopMode('limit')}
                                style={{
                                  accentColor: 'var(--kt-primary)',
                                  flexShrink: 0,
                                }}
                              />
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
                              <div
                                style={{
                                  position: 'relative',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                }}
                              >
                                <span
                                  style={{
                                    position: 'absolute',
                                    left: 8,
                                    fontSize: 'var(--kt-text-sm)',
                                    color: 'var(--kt-text-muted)',
                                    pointerEvents: 'none',
                                  }}
                                >
                                  $
                                </span>
                                <input
                                  type="number"
                                  min="1"
                                  step="1"
                                  value={budget}
                                  onChange={(e) => setBudget(e.target.value)}
                                  onClick={() => setStopMode('limit')}
                                  style={{
                                    width: 110,
                                    padding: '4px 8px 4px 18px',
                                    border: `1px solid ${stopMode === 'limit' ? 'var(--kt-primary)' : 'var(--kt-border)'}`,
                                    borderRadius: 'var(--kt-radius-sm)',
                                    fontSize: 'var(--kt-text-sm)',
                                    color: 'var(--kt-text)',
                                    background: 'var(--kt-bg)',
                                    fontFamily: 'var(--kt-font-sans)',
                                    outline: 'none',
                                    textAlign: 'left',
                                  }}
                                />
                              </div>
                              <p style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text)' }}>
                                budget
                              </p>
                            </div>
                            {stopMode === 'limit' && (
                              <p
                                style={{
                                  fontSize: 'var(--kt-text-xs)',
                                  color: 'var(--kt-text-muted)',
                                  paddingLeft: 26,
                                  lineHeight: 1.5,
                                }}
                              >
                                Equals approximately{' '}
                                <strong>
                                  {estimatedApplications.toLocaleString()} application
                                  {estimatedApplications === 1 ? '' : 's'}
                                </strong>{' '}
                                at $38 each
                              </p>
                            )}
                          </label>
                        </div>
                      </div>

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
                              Shows a badge on your listing to signal that you need to fill this
                              role fast.
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
                  </>
                )}
              </div>
            </div>
          </Section>

          {/* Submit */}
          <div className={styles.submitRow}>
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => navigate('/site/dashboard/company')}
            >
              Cancel
            </Button>

            <div className={styles.submitActions}>
              {/* Publish split-button: primary action + CTA dropdown */}
              <div style={{ position: 'relative', display: 'inline-flex' }}>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                >
                  {isEditMode && loadedStatus !== 'draft' ? 'Save Changes' : 'Publish Job'}
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  iconOnly
                  aria-label="More publish options"
                  onClick={() => setShowPublishMenu((v) => !v)}
                  style={{
                    borderTopLeftRadius: 0,
                    borderBottomLeftRadius: 0,
                    marginLeft: 1,
                    paddingLeft: 10,
                    paddingRight: 10,
                  }}
                >
                  <ChevronDownIcon size={16} color="var(--kt-on-primary, #fff)" />
                </Button>
                {showPublishMenu && (
                  <>
                    <div
                      onClick={() => setShowPublishMenu(false)}
                      style={{ position: 'fixed', inset: 0, zIndex: 10 }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 'calc(100% + 6px)',
                        right: 0,
                        minWidth: 220,
                        background: 'var(--kt-bg)',
                        borderRadius: 'var(--kt-radius-md)',
                        boxShadow: 'var(--kt-shadow-lg, 0 8px 24px rgba(0,0,0,0.16))',
                        padding: 6,
                        zIndex: 11,
                      }}
                    >
                      {(!isEditMode || loadedStatus === 'draft') && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowPublishMenu(false)
                            void saveDraft()
                          }}
                          style={menuItemStyle}
                          onMouseOver={(e) =>
                            (e.currentTarget.style.background =
                              'var(--kt-bg-subtle, rgba(0,0,0,0.04))')
                          }
                          onMouseOut={(e) => (e.currentTarget.style.background = 'none')}
                        >
                          Save as draft
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setShowPublishMenu(false)
                          setShowSchedule(true)
                        }}
                        style={menuItemStyle}
                        onMouseOver={(e) =>
                          (e.currentTarget.style.background =
                            'var(--kt-bg-subtle, rgba(0,0,0,0.04))')
                        }
                        onMouseOut={(e) => (e.currentTarget.style.background = 'none')}
                      >
                        Schedule for later…
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Kebab menu (strokeless), right of the publish button: Save as template */}
              <div style={{ position: 'relative', display: 'inline-flex' }}>
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  iconOnly
                  aria-label="More actions"
                  onClick={() => setShowTemplateMenu((v) => !v)}
                >
                  <DotsVerticalIcon size={18} color="var(--kt-text-muted)" />
                </Button>
                {showTemplateMenu && (
                  <>
                    <div
                      onClick={() => setShowTemplateMenu(false)}
                      style={{ position: 'fixed', inset: 0, zIndex: 10 }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 'calc(100% + 6px)',
                        right: 0,
                        minWidth: 200,
                        background: 'var(--kt-bg)',
                        borderRadius: 'var(--kt-radius-md)',
                        boxShadow: 'var(--kt-shadow-lg, 0 8px 24px rgba(0,0,0,0.16))',
                        padding: 6,
                        zIndex: 11,
                      }}
                    >
                      <button
                        type="button"
                        disabled={!title.trim()}
                        onClick={() => {
                          setShowTemplateMenu(false)
                          setShowSaveTemplate(true)
                        }}
                        style={{
                          ...menuItemStyle,
                          cursor: title.trim() ? 'pointer' : 'not-allowed',
                          opacity: title.trim() ? 1 : 0.5,
                        }}
                        onMouseOver={(e) => {
                          if (title.trim())
                            e.currentTarget.style.background =
                              'var(--kt-bg-subtle, rgba(0,0,0,0.04))'
                        }}
                        onMouseOut={(e) => (e.currentTarget.style.background = 'none')}
                      >
                        Save as template
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Save-as-template modal */}
      <Modal
        open={showSaveTemplate}
        onClose={() => setShowSaveTemplate(false)}
        size="sm"
        title="Save as template"
        description="Save these job details to reuse on future posts."
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowSaveTemplate(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={savingTemplate}
              disabled={!templateName.trim()}
              onClick={() => void handleSaveTemplate()}
            >
              Save template
            </Button>
          </>
        }
      >
        <Input
          label="Template name"
          placeholder="e.g. Standard CDL-A Driver"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
        />
      </Modal>

      {/* Schedule publishing modal */}
      <Modal
        open={showSchedule}
        onClose={() => setShowSchedule(false)}
        size="sm"
        title="Schedule publishing"
        description="Choose when this job goes live. It stays off the job board until then."
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowSchedule(false)}>
              Cancel
            </Button>
            <Button variant="primary" disabled={!scheduleValid} onClick={handleScheduleConfirm}>
              Schedule
            </Button>
          </>
        }
      >
        <Input
          type="datetime-local"
          label="Publish date & time"
          value={scheduleAt}
          onChange={(e) => setScheduleAt(e.target.value)}
        />
        {scheduleAt && !scheduleValid && (
          <p
            style={{
              fontSize: 'var(--kt-text-xs)',
              color: 'var(--kt-danger)',
              marginTop: 8,
            }}
          >
            Pick a time in the future.
          </p>
        )}
      </Modal>
    </div>
  )
}
