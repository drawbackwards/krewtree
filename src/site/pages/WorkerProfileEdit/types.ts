import type { StepState } from '../../../components/Stepper/Stepper'

export type ProfileSkill = {
  id: string
  name: string
  yearsExp: number | null
  source: 'suggested' | 'custom'
  canonicalId?: string
}

export type ProfileCert = {
  id: string
  certName: string
  issuingBody: string
  expiryDate: string
}

export type WorkEntry = {
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

export type Step1Data = {
  fullName: string
  city: string
  region: string
  phone: string
}

export type Step2Data = {
  skills: ProfileSkill[]
  certifications: ProfileCert[]
}

export type StepAboutData = {
  primaryTrade: string
  bio: string
  socialLinks: { id: string; platform: string; url: string }[]
}

export type Step3Data = {
  workHistory: WorkEntry[]
}

export type EditState = {
  workerIndustries: string[]
  stepStates: Record<number, StepState>
  step1: Step1Data
  stepAbout: StepAboutData
  step2: Record<string, Step2Data>
  step3: Step3Data
}
