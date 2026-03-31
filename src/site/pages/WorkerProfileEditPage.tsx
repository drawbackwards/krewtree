import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '../../components'
import { Stepper } from '../../components/Stepper/Stepper'
import type { StepState } from '../../components/Stepper/Stepper'
import { getFullWorkerProfile, upsertWorkerProfile } from '../services/workerService'
import { useAuth } from '../context/AuthContext'
import { Step1Section } from './WorkerProfileEdit/Step1Section'
import { StepAboutSection } from './WorkerProfileEdit/StepAboutSection'
import { Step2Section } from './WorkerProfileEdit/Step2Section'
import { Step3Section } from './WorkerProfileEdit/Step3Section'
import { CheckCircleIcon } from './WorkerProfileEdit/icons'
import type { EditState, Step2Data, WorkEntry } from './WorkerProfileEdit/types'

// ── localStorage ───────────────────────────────────────────────────────────────

const STORAGE_KEY = 'kt_profile_edit_v6'

const emptyStep2 = (): Step2Data => ({ skills: [], certifications: [] })

const defaultState = (): EditState => ({
  workerIndustries: [],
  stepStates: { 1: 'incomplete', 2: 'incomplete', 3: 'incomplete', 4: 'incomplete' },
  step1: { firstName: '', lastName: '', city: '', region: '', phone: '', avatarUrl: '' },
  stepAbout: { primaryTrade: '', bio: '', socialLinks: [] },
  step2: { construction: emptyStep2(), healthcare: emptyStep2(), manufacturing: emptyStep2() },
  step3: { workHistory: [] },
})

function loadState(): EditState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<EditState>
      const def = defaultState()
      return {
        ...def,
        ...parsed,
        // Deep-merge nested objects so new fields added to defaults are always present
        step1: { ...def.step1, ...(parsed.step1 ?? {}) },
        stepAbout: { ...def.stepAbout, ...(parsed.stepAbout ?? {}) },
        step2: { ...def.step2, ...(parsed.step2 ?? {}) },
        step3: { ...def.step3, ...(parsed.step3 ?? {}) },
      }
    }
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
  error?: string | null
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
  error,
}) => {
  const isComplete = stepState === 'complete-filled' || stepState === 'complete-skipped'
  return (
    <div
      ref={cardRef}
      style={{
        background: 'var(--kt-surface)',
        border: '1px solid var(--kt-border)',
        borderRadius: 'var(--kt-radius-lg)',
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
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
            {isSaving
              ? 'Saving…'
              : isLast
                ? isCreate
                  ? 'Publish profile'
                  : 'Save changes'
                : 'Save'}
          </Button>
        </div>
        {error && (
          <p
            style={{
              margin: 0,
              fontSize: 'var(--kt-text-sm)',
              color: 'var(--kt-danger)',
              textAlign: 'right',
            }}
          >
            {error}
          </p>
        )}
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
  const [saveErrorStep, setSaveErrorStep] = useState<number | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [profileCompletePct, setProfileCompletePct] = useState(0)
  const prefillDone = useRef(false)
  const sectionRefs = useRef<Record<number, HTMLDivElement | null>>({})

  useEffect(() => {
    saveState(editState)
    if (prefillDone.current) setIsDirty(true)
  }, [editState])

  // Warn on browser refresh / tab close
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  const safeNavigate = (target: string | number) => {
    if (isDirty && !window.confirm('You have unsaved changes. Leave without saving?')) return
    if (typeof target === 'number') navigate(target)
    else navigate(target)
  }

  // Prefill from DB on mount — fills any section that is empty in localStorage
  useEffect(() => {
    if (!user) return
    getFullWorkerProfile(user.id).then(({ data }) => {
      if (!data) {
        prefillDone.current = true
        return
      }
      setProfileCompletePct(data.profileCompletePct)
      const meta = user.user_metadata as Record<string, string> | undefined
      setEditState((prev) => {
        // Skills: group by industry, then fill each bucket that is empty in localStorage
        const step2 = { ...prev.step2 }
        const skillsByKey: Record<string, typeof data.skills> = {}
        for (const skill of data.skills) {
          const key = skill.industryId ?? 'construction'
          if (!skillsByKey[key]) skillsByKey[key] = []
          skillsByKey[key].push(skill)
        }
        for (const [key, skills] of Object.entries(skillsByKey)) {
          if (!step2[key]) step2[key] = emptyStep2()
          if (step2[key].skills.length === 0) {
            step2[key] = {
              ...step2[key],
              skills: skills.map((s) => ({
                id: s.id,
                name: s.name,
                yearsExp: s.yearsExp ?? null,
                source: 'custom' as const,
                canonicalId: undefined,
              })),
            }
          }
        }
        // Certifications: group by industry, then fill each bucket that is empty in localStorage
        const certsByKey: Record<string, typeof data.certifications> = {}
        for (const cert of data.certifications) {
          const key = data.industries[0] ?? 'construction'
          if (!certsByKey[key]) certsByKey[key] = []
          certsByKey[key].push(cert)
        }
        for (const [key, certs] of Object.entries(certsByKey)) {
          if (!step2[key]) step2[key] = emptyStep2()
          if (step2[key].certifications.length === 0) {
            step2[key] = {
              ...step2[key],
              certifications: certs.map((c) => ({
                id: c.id,
                certName: c.certName,
                issuingBody: c.issuingBody,
                earnedDate: c.earnedDate ?? '',
              })),
            }
          }
        }
        return {
          ...prev,
          workerIndustries:
            prev.workerIndustries.length > 0 ? prev.workerIndustries : data.industries,
          step1: {
            firstName: prev.step1.firstName || data.firstName || meta?.first_name || '',
            lastName: prev.step1.lastName || data.lastName || meta?.last_name || '',
            city: prev.step1.city || data.city || '',
            region: prev.step1.region || data.region || '',
            phone: prev.step1.phone || data.phone || '',
            avatarUrl: prev.step1.avatarUrl || data.avatarUrl || '',
          },
          stepAbout: {
            primaryTrade: prev.stepAbout.primaryTrade || data.primaryTrade || '',
            bio: prev.stepAbout.bio || data.bio || '',
            socialLinks:
              prev.stepAbout.socialLinks.length > 0 ? prev.stepAbout.socialLinks : data.socialLinks,
          },
          step2,
          step3: {
            workHistory:
              prev.step3.workHistory.length > 0
                ? prev.step3.workHistory
                : data.workHistory.map((j) => ({
                    id: j.id,
                    employerName: j.employerName,
                    roleTitle: j.roleTitle,
                    startDate: j.startDate ?? '',
                    endDate: j.endDate ?? '',
                    isCurrent: j.isCurrent,
                    contractType: (j.contractType || '') as WorkEntry['contractType'],
                    industryId: j.industryId ?? '',
                    description: j.description,
                  })),
          },
        }
      })
      prefillDone.current = true
    })
  }, [user?.id])

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
    setSaveErrorStep(null)

    if (user) {
      setIsSaving(true)

      const activeIndustries = new Set(editState.workerIndustries)
      const skills = Object.entries(editState.step2)
        .filter(([industryId]) => activeIndustries.has(industryId))
        .flatMap(([industryId, d]) =>
          d.skills.map((s) => ({
            industry_id: industryId,
            skill_id: s.canonicalId ?? null,
            name: s.name,
            years_exp: s.yearsExp ?? null,
            source: s.source === 'suggested' ? 'suggested' : 'custom',
          }))
        )

      const certs = Object.entries(editState.step2)
        .filter(([industryId]) => activeIndustries.has(industryId))
        .flatMap(([, d]) =>
          d.certifications.map((c) => ({
            cert_name: c.certName,
            issuing_body: c.issuingBody,
            expiry_date: c.earnedDate || null,
          }))
        )

      const socialLinks = editState.stepAbout.socialLinks.map((l) => ({
        platform: l.platform,
        url: l.url,
      }))

      const workHistory = editState.step3.workHistory.map((w) => ({
        employer_name: w.employerName,
        role_title: w.roleTitle,
        start_date: w.startDate ? `${w.startDate}-01` : null,
        end_date: w.endDate ? `${w.endDate}-01` : null,
        is_current: w.isCurrent,
        contract_type: w.contractType,
        industry_id: w.industryId || null,
        description: w.description,
      }))

      const { error } = await upsertWorkerProfile({
        p_first_name: editState.step1.firstName,
        p_last_name: editState.step1.lastName,
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
        setSaveErrorStep(stepNum)
        return
      }
    }

    setIsDirty(false)
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
      setTimeout(() => navigate(`/site/profile/${user!.id}`), 1500)
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
          padding: '20px 0',
        }}
      >
        <div
          style={{
            maxWidth: profileCompletePct >= 100 ? 900 : 'var(--kt-layout-max-width)',
            margin: '0 auto',
            padding: '0 var(--kt-space-6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <div>
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
          {!isCreate && user && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => safeNavigate(`/site/profile/${user.id}`)}
            >
              View Profile
            </Button>
          )}
        </div>
      </div>

      <div
        style={{
          maxWidth: 'var(--kt-layout-max-width)',
          margin: '0 auto',
          padding: '40px var(--kt-space-6) 48px',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: profileCompletePct < 100 ? '220px 1fr' : '1fr',
            gap: 40,
            alignItems: 'start',
            maxWidth: profileCompletePct >= 100 ? 900 : undefined,
            margin: profileCompletePct >= 100 ? '0 auto' : undefined,
          }}
        >
          {/* Left: sticky vertical stepper — hidden once profile is 100% */}
          {profileCompletePct < 100 && (
            <div style={{ position: 'sticky', top: 84 }}>
              <Stepper
                vertical
                steps={STEPS}
                stepStates={displayStepStates}
                onStepClick={scrollToSection}
              />
            </div>
          )}

          {/* Right: all sections stacked */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <SectionCard
              stepNum={1}
              title={STEP_TITLES[1]}
              stepState={displayStepStates[1]}
              isSaved={savedStep === 1}
              isSaving={isSaving}
              onSave={() => saveSection(1)}
              isCreate={isCreate}
              error={saveErrorStep === 1 ? saveError : null}
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
              error={saveErrorStep === 2 ? saveError : null}
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
              error={saveErrorStep === 3 ? saveError : null}
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
              error={saveErrorStep === 4 ? saveError : null}
              cardRef={(el) => {
                sectionRefs.current[4] = el
              }}
            >
              <Step3Section
                data={editState.step3}
                workerIndustries={editState.workerIndustries}
                userId={user?.id ?? null}
                onChange={(d) => setEditState((prev) => ({ ...prev, step3: d }))}
              />
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  )
}
