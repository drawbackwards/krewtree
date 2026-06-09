import type { StepState } from '../../../components/Stepper/Stepper'
import type { ContractTypeValue } from '../../data/contractTypes'

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
  earnedDate: string
}

export type WorkEntry = {
  id: string
  employerName: string
  roleTitle: string
  startDate: string
  endDate: string
  isCurrent: boolean
  contractType: ContractTypeValue | ''
  industryId: string
  description: string
}

export type Step1Data = {
  firstName: string
  lastName: string
  city: string
  region: string
  phone: string
  avatarUrl: string
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

export type ReferenceEntry = {
  id: string
  name: string
  company: string
  phone: string
  email: string
}

export type StepReferencesData = {
  consent: boolean
  references: ReferenceEntry[]
}

export const MAX_REFERENCES = 5

export type EditState = {
  workerIndustries: string[]
  stepStates: Record<number, StepState>
  step1: Step1Data
  stepAbout: StepAboutData
  step2: Record<string, Step2Data>
  step3: Step3Data
  stepReferences: StepReferencesData
}
