import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components'
import type { StepState } from '../../components/Stepper/Stepper'
import { useAuth } from '../context/AuthContext'
import {
  getCompanyProfile,
  getCompanyLicenses,
  getCompanyPhotos,
  getCompanyBenefits,
  upsertCompanyBasics,
  saveCompanyLicenses,
  saveCompanyContractBenefits,
  saveCompanyHiring,
  recomputeProfileCompletePct,
} from '../services/companyService'
import { Step1Section } from './CompanyProfileEdit/Step1Section'
import { StepAboutSection } from './CompanyProfileEdit/StepAboutSection'
import { StepLicensesSection } from './CompanyProfileEdit/StepLicensesSection'
import { StepContractBenefitsSection } from './CompanyProfileEdit/StepContractBenefitsSection'
import { StepHiringSection } from './CompanyProfileEdit/StepHiringSection'
import { CheckCircleIcon } from './WorkerProfileEdit/icons'
import type {
  EditState,
  Step1Data,
  StepAboutData,
  StepLicensesData,
  StepContractBenefitsData,
  StepHiringData,
} from './CompanyProfileEdit/types'
import styles from './CompanyProfileEditPage.module.css'

// Bumped to v2 so cached states from the Phase 2 build don't poison the new shape.
// Scoped per account so a draft from one company never leaks into another that
// signs in on the same browser. A missing user id yields no key (no read/write).
function storageKey(userId: string | undefined): string | null {
  return userId ? `kt_company_profile_edit_v2:${userId}` : null
}

const defaultStep1 = (): Step1Data => ({
  name: '',
  tagline: '',
  logoUrl: '',
  industry: '',
  additionalIndustries: [],
  phone: '',
  website: '',
  hqCity: '',
  hqState: '',
  phonePublic: false,
})

const defaultStepAbout = (): StepAboutData => ({
  description: '',
  size: '',
  founded: null,
})

const defaultStepLicenses = (): StepLicensesData => ({ licenses: [] })

const defaultStepContractBenefits = (): StepContractBenefitsData => ({
  contractTypes: [],
  benefits: [],
})

const defaultStepHiring = (): StepHiringData => ({
  photos: [],
  facebookUrl: '',
  instagramUrl: '',
  linkedinUrl: '',
  youtubeUrl: '',
  tiktokUrl: '',
})

const defaultState = (): EditState => ({
  stepStates: {
    1: 'incomplete',
    2: 'incomplete',
    3: 'incomplete',
    4: 'incomplete',
    5: 'incomplete',
  },
  step1: defaultStep1(),
  stepAbout: defaultStepAbout(),
  stepLicenses: defaultStepLicenses(),
  stepContractBenefits: defaultStepContractBenefits(),
  stepHiring: defaultStepHiring(),
})

function loadState(userId: string | undefined): EditState {
  const key = storageKey(userId)
  if (!key) return defaultState()
  try {
    const raw = localStorage.getItem(key)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<EditState>
      const def = defaultState()
      return {
        ...def,
        ...parsed,
        step1: { ...def.step1, ...(parsed.step1 ?? {}) },
        stepAbout: { ...def.stepAbout, ...(parsed.stepAbout ?? {}) },
        stepLicenses: { ...def.stepLicenses, ...(parsed.stepLicenses ?? {}) },
        stepContractBenefits: {
          ...def.stepContractBenefits,
          ...(parsed.stepContractBenefits ?? {}),
        },
        stepHiring: { ...def.stepHiring, ...(parsed.stepHiring ?? {}) },
      }
    }
  } catch {
    /* ignore */
  }
  return defaultState()
}

function saveState(userId: string | undefined, state: EditState) {
  const key = storageKey(userId)
  if (!key) return
  try {
    localStorage.setItem(key, JSON.stringify(state))
  } catch {
    /* ignore */
  }
}

const STEPS = [
  { label: 'Identity' },
  { label: 'About' },
  { label: 'Licenses' },
  { label: 'Contract & Benefits' },
  { label: 'Hiring & Culture' },
]
const TOTAL_STEPS = STEPS.length

const STEP_TITLES: Record<number, string> = {
  1: 'Identity & Basics',
  2: 'About the Company',
  3: 'Licenses & Credentials',
  4: 'Contract Types & Benefits',
  5: 'Hiring & Culture',
}

function validateRequiredFields(state: EditState): { step: number; message: string } | null {
  const { step1 } = state
  if (!step1.name.trim()) return { step: 1, message: 'Company name is required.' }
  if (!step1.industry.trim()) return { step: 1, message: 'Primary industry is required.' }
  if (!step1.phone.trim()) return { step: 1, message: 'Phone is required.' }
  if (!step1.hqCity.trim()) return { step: 1, message: 'HQ city is required.' }
  if (!step1.hqState.trim()) return { step: 1, message: 'HQ state is required.' }
  return null
}

type SectionCardProps = {
  stepNum: number
  title: string
  stepState: StepState
  isSaved: boolean
  isSaving?: boolean
  onSave?: () => void
  isLast?: boolean
  cardRef: (el: HTMLDivElement | null) => void
  children: React.ReactNode
  error?: string | null
  showSaveButton?: boolean
}

const SectionCard: React.FC<SectionCardProps> = ({
  stepNum,
  title,
  stepState,
  isSaved,
  isSaving = false,
  onSave,
  isLast = false,
  cardRef,
  children,
  error,
  showSaveButton = true,
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
      <div className={styles.cardHeader}>
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

      <div className={styles.cardBody}>{children}</div>

      {showSaveButton && onSave && (
        <div className={styles.cardFooter}>
          <div className={styles.saveRow}>
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
              {isSaving ? 'Saving…' : isLast ? 'Save changes' : 'Save'}
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
      )}
    </div>
  )
}

export const CompanyProfileEditPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [editState, setEditState] = useState<EditState>(() => loadState(user?.id))
  const [activeSection, setActiveSection] = useState(1)
  const [savedStep, setSavedStep] = useState<number | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveErrorStep, setSaveErrorStep] = useState<number | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [profileCompletePct, setProfileCompletePct] = useState(0)
  const prefillDone = useRef(false)
  // The prefill's own setEditState triggers the effect below; this one-shot ref
  // lets that single run through without marking the form dirty.
  const skipDirtyOnce = useRef(false)
  const sectionRefs = useRef<Record<number, HTMLDivElement | null>>({})

  useEffect(() => {
    saveState(user?.id, editState)
    if (skipDirtyOnce.current) {
      skipDirtyOnce.current = false
      return
    }
    if (prefillDone.current) setIsDirty(true)
  }, [editState, user?.id])

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

  const safeNavigate = (target: string) => {
    if (isDirty && !window.confirm('You have unsaved changes. Leave without saving?')) return
    navigate(target)
  }

  useEffect(() => {
    if (!user) return
    const userId = user.id
    Promise.all([
      getCompanyProfile(userId),
      getCompanyLicenses(userId),
      getCompanyPhotos(userId),
      getCompanyBenefits(userId),
    ]).then(([profileRes, licensesRes, photosRes, benefitsRes]) => {
      const { data } = profileRes
      if (!data) {
        prefillDone.current = true
        return
      }
      setProfileCompletePct(data.profile_complete_pct)
      skipDirtyOnce.current = true
      setEditState((prev) => ({
        ...prev,
        step1: {
          name: prev.step1.name || data.name || '',
          tagline: prev.step1.tagline || data.tagline || '',
          logoUrl: prev.step1.logoUrl || data.logo_url || '',
          industry: prev.step1.industry || data.industry || '',
          additionalIndustries:
            prev.step1.additionalIndustries.length > 0
              ? prev.step1.additionalIndustries
              : (data.additional_industries ?? []),
          phone: prev.step1.phone || data.phone || '',
          website: prev.step1.website || data.website || '',
          hqCity: prev.step1.hqCity || data.hq_city || '',
          hqState: prev.step1.hqState || data.hq_state || '',
          phonePublic: prev.step1.phonePublic || data.phone_public,
        },
        stepAbout: {
          description: prev.stepAbout.description || data.description || '',
          size: prev.stepAbout.size || data.size || '',
          founded: prev.stepAbout.founded ?? data.founded,
        },
        stepLicenses: {
          licenses:
            prev.stepLicenses.licenses.length > 0
              ? prev.stepLicenses.licenses
              : licensesRes.data.map((l) => ({
                  id: l.id,
                  licenseType: l.license_type,
                  jurisdiction: l.jurisdiction,
                  licenseNumber: l.license_number,
                  expirationDate: l.expiration_date ?? '',
                  verificationStatus: (l.verification_status ?? 'unverified') as
                    | 'unverified'
                    | 'pending'
                    | 'verified'
                    | 'failed'
                    | 'expired',
                })),
        },
        stepContractBenefits: {
          contractTypes:
            prev.stepContractBenefits.contractTypes.length > 0
              ? prev.stepContractBenefits.contractTypes
              : (data.contract_types ?? []),
          benefits:
            prev.stepContractBenefits.benefits.length > 0
              ? prev.stepContractBenefits.benefits
              : benefitsRes.data,
        },
        stepHiring: {
          photos:
            prev.stepHiring.photos.length > 0
              ? prev.stepHiring.photos
              : photosRes.data.map((p) => ({ id: p.id, url: p.url, caption: p.caption })),
          facebookUrl: prev.stepHiring.facebookUrl || data.facebook_url || '',
          instagramUrl: prev.stepHiring.instagramUrl || data.instagram_url || '',
          linkedinUrl: prev.stepHiring.linkedinUrl || data.linkedin_url || '',
          youtubeUrl: prev.stepHiring.youtubeUrl || data.youtube_url || '',
          tiktokUrl: prev.stepHiring.tiktokUrl || data.tiktok_url || '',
        },
      }))
      prefillDone.current = true
    })
    // Prefill runs once the user id is known and is guarded by prefillDone;
    // re-running on every `user` object identity change is unwanted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    // Identity fields are required regardless of which section is saving — the
    // company_profiles row needs them populated for downstream features.
    const missing = validateRequiredFields(editState)
    if (missing && (stepNum === 1 || stepNum === 2)) {
      setSaveError(missing.message)
      setSaveErrorStep(missing.step)
      if (missing.step !== stepNum) {
        setTimeout(() => scrollToSection(missing.step), 80)
      }
      return
    }

    if (!user) return

    setIsSaving(true)
    let error: string | null = null

    if (stepNum === 1 || stepNum === 2) {
      const res = await upsertCompanyBasics(user.id, {
        name: editState.step1.name,
        tagline: editState.step1.tagline,
        industry: editState.step1.industry,
        additional_industries: editState.step1.additionalIndustries,
        phone: editState.step1.phone,
        website: editState.step1.website,
        hq_city: editState.step1.hqCity,
        hq_state: editState.step1.hqState,
        phone_public: editState.step1.phonePublic,
        size: editState.stepAbout.size,
        founded: editState.stepAbout.founded,
        description: editState.stepAbout.description,
      })
      error = res.error
    } else if (stepNum === 3) {
      const res = await saveCompanyLicenses(
        user.id,
        editState.stepLicenses.licenses.map((l) => ({
          license_type: l.licenseType,
          jurisdiction: l.jurisdiction,
          license_number: l.licenseNumber,
          expiration_date: l.expirationDate || null,
        }))
      )
      error = res.error
    } else if (stepNum === 4) {
      const res = await saveCompanyContractBenefits(user.id, {
        contract_types: editState.stepContractBenefits.contractTypes,
        benefits: editState.stepContractBenefits.benefits,
      })
      error = res.error
    } else if (stepNum === 5) {
      const res = await saveCompanyHiring(user.id, {
        photos: editState.stepHiring.photos.map((p) => ({ url: p.url, caption: p.caption })),
        facebook_url: editState.stepHiring.facebookUrl,
        instagram_url: editState.stepHiring.instagramUrl,
        linkedin_url: editState.stepHiring.linkedinUrl,
        youtube_url: editState.stepHiring.youtubeUrl,
        tiktok_url: editState.stepHiring.tiktokUrl,
      })
      error = res.error
    }

    if (error) {
      setIsSaving(false)
      setSaveError(error)
      setSaveErrorStep(stepNum)
      return
    }

    // After any successful save, re-read the canonical pct from the DB so the
    // header stays in sync with whatever changed (including cross-section).
    const { pct } = await recomputeProfileCompletePct(user.id)
    setIsSaving(false)
    setProfileCompletePct(pct)
    setIsDirty(false)
    setEditState((prev) => {
      const states = { ...prev.stepStates }
      states[stepNum] = 'complete-filled'
      return { ...prev, stepStates: states }
    })
    setSavedStep(stepNum)
    setTimeout(() => setSavedStep(null), 2000)
    if (stepNum < TOTAL_STEPS) {
      setActiveSection(stepNum + 1)
      setTimeout(() => scrollToSection(stepNum + 1), 80)
    }
  }

  const displayStepStates: Record<number, StepState> = {}
  for (let i = 1; i <= TOTAL_STEPS; i++) {
    const stored = editState.stepStates[i]
    if (stored === 'complete-filled' || stored === 'complete-skipped') {
      displayStepStates[i] = stored
    } else if (i === activeSection) {
      displayStepStates[i] = 'active'
    } else {
      displayStepStates[i] = 'incomplete'
    }
  }

  const sectionCards = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
      <SectionCard
        stepNum={1}
        title={STEP_TITLES[1]}
        stepState={displayStepStates[1]}
        isSaved={savedStep === 1}
        isSaving={isSaving}
        onSave={() => saveSection(1)}
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
        error={saveErrorStep === 3 ? saveError : null}
        cardRef={(el) => {
          sectionRefs.current[3] = el
        }}
      >
        <StepLicensesSection
          data={editState.stepLicenses}
          industryIds={[editState.step1.industry, ...editState.step1.additionalIndustries].filter(
            Boolean
          )}
          onChange={(d) => setEditState((prev) => ({ ...prev, stepLicenses: d }))}
        />
      </SectionCard>

      <SectionCard
        stepNum={4}
        title={STEP_TITLES[4]}
        stepState={displayStepStates[4]}
        isSaved={savedStep === 4}
        isSaving={isSaving}
        onSave={() => saveSection(4)}
        error={saveErrorStep === 4 ? saveError : null}
        cardRef={(el) => {
          sectionRefs.current[4] = el
        }}
      >
        <StepContractBenefitsSection
          data={editState.stepContractBenefits}
          onChange={(d) => setEditState((prev) => ({ ...prev, stepContractBenefits: d }))}
        />
      </SectionCard>

      <SectionCard
        stepNum={5}
        title={STEP_TITLES[5]}
        stepState={displayStepStates[5]}
        isSaved={savedStep === 5}
        isSaving={isSaving}
        onSave={() => saveSection(5)}
        error={saveErrorStep === 5 ? saveError : null}
        isLast
        cardRef={(el) => {
          sectionRefs.current[5] = el
        }}
      >
        <StepHiringSection
          data={editState.stepHiring}
          onChange={(d) => setEditState((prev) => ({ ...prev, stepHiring: d }))}
        />
      </SectionCard>
    </div>
  )

  const header = (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 16,
      }}
    >
      <div>
        <h2
          style={{
            fontSize: 'var(--kt-text-xl)',
            fontWeight: 'var(--kt-weight-bold)',
            color: 'var(--kt-text)',
            margin: '0 0 2px',
          }}
        >
          Company profile
        </h2>
        <p style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text-muted)', margin: 0 }}>
          Keep your profile current so workers know what you're about
          {profileCompletePct > 0 && ` · ${profileCompletePct}% complete`}.
        </p>
      </div>
      {user && (
        <Button
          variant="outline"
          size="md"
          onClick={() => safeNavigate(`/site/company/${user.id}`)}
        >
          View public profile
        </Button>
      )}
    </div>
  )

  // Rendered inside SettingsLayout (Settings → Profile), which supplies the page
  // chrome and left nav, so we render a single column of section cards under a
  // lightweight header — no full-page wrapper, no step sidebar.
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {header}
      {sectionCards}
    </div>
  )
}
