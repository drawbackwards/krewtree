import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components'
import { Stepper } from '../../components/Stepper/Stepper'
import type { StepState } from '../../components/Stepper/Stepper'
import { useAuth } from '../context/AuthContext'
import {
  getCompanyProfile,
  getCompanyLicenses,
  getCompanyAdditionalLocations,
  getCompanyPhotos,
  getCompanyBenefits,
  upsertCompanyBasics,
  saveCompanyLicenses,
  saveCompanyLocations,
  saveCompanyHiring,
  recomputeProfileCompletePct,
} from '../services/companyService'
import { Step1Section } from './CompanyProfileEdit/Step1Section'
import { StepAboutSection } from './CompanyProfileEdit/StepAboutSection'
import { StepLicensesSection } from './CompanyProfileEdit/StepLicensesSection'
import { StepLocationsSection } from './CompanyProfileEdit/StepLocationsSection'
import { StepHiringSection } from './CompanyProfileEdit/StepHiringSection'
import { CheckCircleIcon } from './WorkerProfileEdit/icons'
import type {
  EditState,
  Step1Data,
  StepAboutData,
  StepLicensesData,
  StepLocationsData,
  StepHiringData,
} from './CompanyProfileEdit/types'
import styles from './CompanyProfileEditPage.module.css'

// Bumped to v2 so cached states from the Phase 2 build don't poison the new shape.
const STORAGE_KEY = 'kt_company_profile_edit_v2'

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
  emailPublic: false,
  addressPublic: false,
})

const defaultStepAbout = (): StepAboutData => ({
  description: '',
  size: '',
  founded: null,
})

const defaultStepLicenses = (): StepLicensesData => ({ licenses: [] })

const defaultStepLocations = (): StepLocationsData => ({
  hqStreet: '',
  hqPostalCode: '',
  serviceAreaRadius: 25,
  serviceAreaOverride: '',
  additionalLocations: [],
})

const defaultStepHiring = (): StepHiringData => ({
  photos: [],
  benefits: [],
  contractTypes: [],
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
  stepLocations: defaultStepLocations(),
  stepHiring: defaultStepHiring(),
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
        step1: { ...def.step1, ...(parsed.step1 ?? {}) },
        stepAbout: { ...def.stepAbout, ...(parsed.stepAbout ?? {}) },
        stepLicenses: { ...def.stepLicenses, ...(parsed.stepLicenses ?? {}) },
        stepLocations: { ...def.stepLocations, ...(parsed.stepLocations ?? {}) },
        stepHiring: { ...def.stepHiring, ...(parsed.stepHiring ?? {}) },
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

const STEPS = [
  { label: 'Identity' },
  { label: 'About' },
  { label: 'Licenses' },
  { label: 'Locations' },
  { label: 'Hiring & Culture' },
]
const TOTAL_STEPS = STEPS.length

const STEP_TITLES: Record<number, string> = {
  1: 'Identity & Basics',
  2: 'About the Company',
  3: 'Licenses & Credentials',
  4: 'Locations & Coverage',
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
      getCompanyAdditionalLocations(userId),
      getCompanyPhotos(userId),
      getCompanyBenefits(userId),
    ]).then(([profileRes, licensesRes, locationsRes, photosRes, benefitsRes]) => {
      const { data } = profileRes
      if (!data) {
        prefillDone.current = true
        return
      }
      setProfileCompletePct(data.profile_complete_pct)
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
          emailPublic: prev.step1.emailPublic || data.email_public,
          addressPublic: prev.step1.addressPublic || data.address_public,
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
        stepLocations: {
          hqStreet: prev.stepLocations.hqStreet || data.hq_street || '',
          hqPostalCode: prev.stepLocations.hqPostalCode || data.hq_postal_code || '',
          serviceAreaRadius:
            prev.stepLocations.serviceAreaRadius !== 25
              ? prev.stepLocations.serviceAreaRadius
              : (data.service_area_radius ?? 25),
          serviceAreaOverride:
            prev.stepLocations.serviceAreaOverride || data.service_area_override || '',
          additionalLocations:
            prev.stepLocations.additionalLocations.length > 0
              ? prev.stepLocations.additionalLocations
              : locationsRes.data.map((l) => ({
                  id: l.id,
                  name: l.name,
                  street: l.street,
                  city: l.city,
                  state: l.state,
                  postalCode: l.postal_code,
                  radius: l.radius,
                })),
        },
        stepHiring: {
          photos:
            prev.stepHiring.photos.length > 0
              ? prev.stepHiring.photos
              : photosRes.data.map((p) => ({ id: p.id, url: p.url, caption: p.caption })),
          benefits:
            prev.stepHiring.benefits.length > 0 ? prev.stepHiring.benefits : benefitsRes.data,
          contractTypes:
            prev.stepHiring.contractTypes.length > 0
              ? prev.stepHiring.contractTypes
              : (data.contract_types ?? []),
          facebookUrl: prev.stepHiring.facebookUrl || data.facebook_url || '',
          instagramUrl: prev.stepHiring.instagramUrl || data.instagram_url || '',
          linkedinUrl: prev.stepHiring.linkedinUrl || data.linkedin_url || '',
          youtubeUrl: prev.stepHiring.youtubeUrl || data.youtube_url || '',
          tiktokUrl: prev.stepHiring.tiktokUrl || data.tiktok_url || '',
        },
      }))
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
        hq_street: editState.stepLocations.hqStreet,
        hq_city: editState.step1.hqCity,
        hq_state: editState.step1.hqState,
        hq_postal_code: editState.stepLocations.hqPostalCode,
        phone_public: editState.step1.phonePublic,
        email_public: editState.step1.emailPublic,
        address_public: editState.step1.addressPublic,
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
      const res = await saveCompanyLocations(user.id, {
        hq_street: editState.stepLocations.hqStreet,
        hq_postal_code: editState.stepLocations.hqPostalCode,
        service_area_radius: editState.stepLocations.serviceAreaRadius,
        service_area_override: editState.stepLocations.serviceAreaOverride,
        additional_locations: editState.stepLocations.additionalLocations.map((l) => ({
          name: l.name,
          street: l.street,
          city: l.city,
          state: l.state,
          postal_code: l.postalCode,
          radius: l.radius,
        })),
      })
      error = res.error
    } else if (stepNum === 5) {
      const res = await saveCompanyHiring(user.id, {
        photos: editState.stepHiring.photos.map((p) => ({ url: p.url, caption: p.caption })),
        benefits: editState.stepHiring.benefits,
        contract_types: editState.stepHiring.contractTypes,
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

  return (
    <div style={{ minHeight: '100vh', background: 'var(--kt-bg)' }}>
      <div
        style={{
          background: 'var(--kt-surface)',
          borderBottom: '1px solid var(--kt-border)',
          padding: '20px 0',
        }}
      >
        <div className={styles.pageHeaderInner}>
          <div>
            <h1
              style={{
                fontSize: 'var(--kt-text-xl)',
                fontWeight: 'var(--kt-weight-bold)',
                color: 'var(--kt-text)',
                margin: '0 0 2px',
              }}
            >
              Edit company profile
            </h1>
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
      </div>

      <div className={styles.pageBody}>
        <div className={`${styles.grid} ${styles.gridWithStepper}`}>
          <div className={styles.stepperWrap}>
            <Stepper
              vertical
              steps={STEPS}
              stepStates={displayStepStates}
              onStepClick={scrollToSection}
            />
          </div>

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
                industryIds={[
                  editState.step1.industry,
                  ...editState.step1.additionalIndustries,
                ].filter(Boolean)}
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
              <StepLocationsSection
                data={editState.stepLocations}
                hqCity={editState.step1.hqCity}
                hqState={editState.step1.hqState}
                onChange={(d) => setEditState((prev) => ({ ...prev, stepLocations: d }))}
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
        </div>
      </div>
    </div>
  )
}
