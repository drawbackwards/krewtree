import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '../../components'
import { Stepper } from '../../components/Stepper/Stepper'
import type { StepState } from '../../components/Stepper/Stepper'
// TODO: replace mock fallback data with real DB profile once fetch is wired
import { currentWorker } from '../data/mock'
import { upsertWorkerProfile } from '../services/workerService'
import { useAuth } from '../context/AuthContext'
import { Step1Section } from './WorkerProfileEdit/Step1Section'
import { StepAboutSection } from './WorkerProfileEdit/StepAboutSection'
import { Step2Section } from './WorkerProfileEdit/Step2Section'
import { Step3Section } from './WorkerProfileEdit/Step3Section'
import { CheckCircleIcon } from './WorkerProfileEdit/icons'
import type { EditState, Step2Data } from './WorkerProfileEdit/types'

// ── localStorage ───────────────────────────────────────────────────────────────

const STORAGE_KEY = 'kt_profile_edit_v4'

const emptyStep2 = (): Step2Data => ({ skills: [], certifications: [] })

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
  step3: { workHistory: [] },
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

// ── Stepper config ─────────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Identity' },
  { label: 'About Me' },
  { label: 'Skills' },
  { label: 'Work History' },
]

const STEP_TITLES: Record<number, string> = {
  1: 'Identity & Basics',
  2: 'About Me',
  3: 'Skills & Certifications',
  4: 'Work History',
}

// ── Section card wrapper ───────────────────────────────────────────────────────

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
            color: 'var(--kt-primary-fg)',
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

// ── Main Page ──────────────────────────────────────────────────────────────────

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

    if (user) {
      setIsSaving(true)

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

      const { error } = await upsertWorkerProfile({
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
        setSaveError(error)
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
      localStorage.removeItem(STORAGE_KEY)
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
          {/* Left: sticky vertical stepper */}
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
                  color: 'var(--kt-danger)',
                  margin: 0,
                  padding: '10px 14px',
                  background: 'var(--kt-danger-subtle)',
                  borderRadius: 'var(--kt-radius-md)',
                }}
              >
                {saveError}
              </p>
            )}

            <SectionCard
              stepNum={1}
              title={STEP_TITLES[1]}
              stepState={displayStepStates[1]}
              isSaved={savedStep === 1}
              isSaving={isSaving}
              onSave={() => saveSection(1)}
              isCreate={isCreate}
              cardRef={(el) => {
                sectionRefs.current[1] = el
              }}
            >
              <Step1Section
                data={editState.step1}
                onChange={(d) => setEditState((prev) => ({ ...prev, step1: d }))}
              />
            </SectionCard>

            <SectionCard
              stepNum={2}
              title={STEP_TITLES[2]}
              stepState={displayStepStates[2]}
              isSaved={savedStep === 2}
              isSaving={isSaving}
              onSave={() => saveSection(2)}
              isCreate={isCreate}
              cardRef={(el) => {
                sectionRefs.current[2] = el
              }}
            >
              <StepAboutSection
                data={editState.stepAbout}
                onChange={(d) => setEditState((prev) => ({ ...prev, stepAbout: d }))}
              />
            </SectionCard>

            <SectionCard
              stepNum={3}
              title={STEP_TITLES[3]}
              stepState={displayStepStates[3]}
              isSaved={savedStep === 3}
              isSaving={isSaving}
              onSave={() => saveSection(3)}
              isCreate={isCreate}
              cardRef={(el) => {
                sectionRefs.current[3] = el
              }}
            >
              <Step2Section
                workerIndustries={editState.workerIndustries}
                allData={editState.step2}
                onChange={updateStep2}
                onAddIndustry={addIndustry}
                onRemoveIndustry={removeIndustry}
              />
            </SectionCard>

            <SectionCard
              stepNum={4}
              title={STEP_TITLES[4]}
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
              <Step3Section
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
