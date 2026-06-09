import type { StepState } from '../../../components/Stepper/Stepper'

export type Step1Data = {
  name: string
  tagline: string
  logoUrl: string
  industry: string
  additionalIndustries: string[]
  phone: string
  website: string
  hqCity: string
  hqState: string
  phonePublic: boolean
  emailPublic: boolean
  addressPublic: boolean
}

export type StepAboutData = {
  description: string
  size: string
  founded: number | null
}

export type LicenseEntry = {
  id: string
  licenseType: string
  jurisdiction: string
  licenseNumber: string
  expirationDate: string // YYYY-MM-DD or ''
  verificationStatus: 'unverified' | 'pending' | 'verified' | 'failed' | 'expired'
}

export type StepLicensesData = {
  licenses: LicenseEntry[]
}

export type AdditionalLocation = {
  id: string
  name: string
  street: string
  city: string
  state: string
  postalCode: string
  radius: number | null
}

export type StepLocationsData = {
  hqStreet: string
  hqPostalCode: string
  serviceAreaRadius: number
  serviceAreaOverride: string
  additionalLocations: AdditionalLocation[]
}

export type CompanyPhoto = {
  id: string
  url: string
  caption: string
}

export type StepHiringData = {
  photos: CompanyPhoto[]
  benefits: string[]
  contractTypes: string[]
  facebookUrl: string
  instagramUrl: string
  linkedinUrl: string
  youtubeUrl: string
  tiktokUrl: string
}

export type EditState = {
  stepStates: Record<number, StepState>
  step1: Step1Data
  stepAbout: StepAboutData
  stepLicenses: StepLicensesData
  stepLocations: StepLocationsData
  stepHiring: StepHiringData
}

// Company size band per spec section 4.2.
export const COMPANY_SIZE_OPTIONS: { value: string; label: string }[] = [
  { value: '1-10', label: '1–10' },
  { value: '11-50', label: '11–50' },
  { value: '51-200', label: '51–200' },
  { value: '201-500', label: '201–500' },
  { value: '500+', label: '500+' },
]

// Spec §4.5 + §10 #6: five contract types — shared with the worker side via
// the canonical list. Re-exported here so existing imports keep working.
export { CONTRACT_TYPE_OPTIONS } from '../../data/contractTypes'

// Spec section 4.5.1: canonical benefits list (19 entries grouped).
// Stored as flat string tags; grouping is editor-only.
export const BENEFIT_GROUPS: { label: string; benefits: { value: string; label: string }[] }[] = [
  {
    label: 'Compensation',
    benefits: [
      { value: 'weekly_pay', label: 'Weekly pay' },
      { value: 'overtime', label: 'Overtime available' },
      { value: 'performance_bonus', label: 'Performance bonuses' },
      { value: 'sign_on_bonus', label: 'Sign-on bonus' },
      { value: 'per_diem', label: 'Per diem on travel' },
    ],
  },
  {
    label: 'Health & wellness',
    benefits: [
      { value: 'health_insurance', label: 'Health insurance' },
      { value: 'dental_vision', label: 'Dental & vision' },
      { value: 'life_insurance', label: 'Life insurance' },
      { value: 'mental_health', label: 'Mental health support' },
    ],
  },
  {
    label: 'Time off',
    benefits: [
      { value: 'pto', label: 'Paid time off' },
      { value: 'paid_holidays', label: 'Paid holidays' },
      { value: 'parental_leave', label: 'Paid parental leave' },
    ],
  },
  {
    label: 'Retirement',
    benefits: [{ value: '401k', label: '401(k) with employer match' }],
  },
  {
    label: 'Trade-specific',
    benefits: [
      { value: 'tool_allowance', label: 'Tool allowance' },
      { value: 'vehicle_mileage', label: 'Company vehicle or mileage reimbursement' },
      { value: 'uniform_ppe', label: 'Uniform & PPE provided' },
    ],
  },
  {
    label: 'Growth & development',
    benefits: [
      { value: 'training', label: 'Training & certification reimbursement' },
      { value: 'apprenticeship_program', label: 'Apprenticeship program' },
    ],
  },
  {
    label: 'Other',
    benefits: [
      { value: 'referral_program', label: 'Employee referral program' },
      { value: 'relocation', label: 'Relocation assistance' },
    ],
  },
]

export const MAX_PHOTOS = 5
export const MAX_ADDITIONAL_LOCATIONS = 10
