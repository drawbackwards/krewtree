// ============================================================
// KREWTREE — Shared Types
// Single source of truth for all data types used across site/
// ============================================================

export type Industry = {
  id: string
  name: string
  slug: string
  icon: string
  jobCount: number
  color: string
}

export type Company = {
  id: string
  name: string
  logo: string
  location: string
  industry: string
  isVerified: boolean
  description: string
  size: string
  website: string
  avgRating?: number
  reviewCount?: number
}

export type WorkerSkill = { name: string; level: 'Beginner' | 'Intermediate' | 'Expert' }

export type WorkerJobHistory = {
  employer: string
  title: string
  startDate: string
  endDate: string | null
  isRegulixVerified: boolean
}

export type Worker = {
  id: string
  name: string
  headline: string
  avatar: string
  initials: string
  location: string
  isRegulixReady: boolean
  performanceScore: number | null
  ratingCount: number
  skills: WorkerSkill[]
  jobHistory: WorkerJobHistory[]
  bio: string
  profileCompletePct: number
  totalHoursWorked: number | null
  isPremium: boolean
  industries: string[]
  socialLinks: { facebook?: string; instagram?: string; linkedin?: string }
}

export type Job = {
  id: string
  companyId: string
  company: Company
  title: string
  industry: string
  industrySlug: string
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Temporary'
  location: string
  payMin: number
  payMax: number
  payType: 'hour' | 'salary'
  description: string
  requirements: string[]
  skills: string[]
  isSponsored: boolean
  regulixReadyApplicants: number
  totalApplicants: number
  postedDaysAgo: number
  status: 'active' | 'paused' | 'closed'
  experienceLevel?: string | null
  preInterviewQuestions?: string[]
  urgentHiring?: boolean
  regulixPreferred?: boolean
  autoPauseLimit?: number | null
}

export type Application = {
  id: string
  jobId: string
  job: Job
  status: 'Applied' | 'Viewed' | 'Interviewing' | 'Offer' | 'Rejected'
  appliedDaysAgo: number
  isBoosted: boolean
}

// ---- Saved Search / Job Alert ----
export type SavedSearch = {
  id: string
  label: string
  query: string
  industrySlug: string | null
  types: string[]
  payRangeIdx: number
  regulixOnly: boolean
  createdDaysAgo: number
  alertEnabled: boolean
  newMatchesCount: number
}

// ---- Location Region (for location browse view) ----
export type LocationRegion = {
  id: string
  city: string
  state: string
  slug: string
  jobCount: number
  featuredIndustries: string[]
}

// ---- Saved Job ----
export type SavedJob = {
  id: string
  jobId: string
  job: Job
  savedDaysAgo: number
  note: string
}

// ---- Resume & Portfolio ----
export type ResumeDocument = {
  id: string
  workerId: string
  filename: string
  uploadedDaysAgo: number
  isPrimary: boolean
  fileType: 'pdf' | 'doc'
  sizeKb: number
}

export type PortfolioItem = {
  id: string
  workerId: string
  title: string
  description: string
  projectDate: string
  tags: string[]
  imageEmoji: string
}

// ---- Application Timeline ----
export type ApplicationEvent = {
  id: string
  applicationId: string
  status: Application['status']
  note: string
  occurredDaysAgo: number
}

// ---- Company Detail (extended profile) ----
export type CompanyBenefit = {
  icon: string
  label: string
}

export type CompanyDetail = {
  companyId: string
  tagline: string
  culture: string
  mission: string
  benefits: CompanyBenefit[]
  teamSize: number
  founded: number
  headquarters: string
  perks: string[]
  avgRating: number
  reviewCount: number
  photoEmojis: string[]
}

// ---- Company Review ----
export type CompanyReview = {
  id: string
  workerId: string
  workerName: string
  workerInitials: string
  companyId: string
  rating: number
  title: string
  body: string
  pros: string
  cons: string
  recommend: boolean
  datedMonthsAgo: number
  isVerified: boolean
}

// ---- Skill Endorsement ----
export type SkillEndorsement = {
  skillName: string
  endorserId: string
  endorserName: string
  endorserInitials: string
}

// ---- Referral ----
export type Referral = {
  id: string
  referrerId: string
  name: string
  email: string
  type: 'worker' | 'company'
  status: 'pending' | 'joined' | 'hired'
  daysAgo: number
  reward: number
}

// ---- Messaging ----
export type Message = {
  id: string
  fromId: string
  fromName: string
  fromInitials: string
  isCompany: boolean
  content: string
  timestamp: string
  isRead: boolean
}

export type Conversation = {
  id: string
  workerId: string
  workerName: string
  workerInitials: string
  companyId: string
  companyName: string
  jobId: string
  jobTitle: string
  messages: Message[]
  lastActivity: string
  unreadCount: number
}

// ---- Notifications ----
export type Notification = {
  id: string
  type: 'application' | 'message' | 'status_change' | 'job_alert' | 'review'
  title: string
  body: string
  isRead: boolean
  createdDaysAgo: number
  link: string
}

// ---- Kanban Applicant ----
export type KanbanStage = 'new' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected'

export type KanbanApplicant = {
  id: string
  workerId: string
  workerName: string
  workerInitials: string
  isRegulixReady: boolean
  performanceScore: number | null
  jobId: string
  jobTitle: string
  stage: KanbanStage
  appliedDaysAgo: number
  notes: string
}

// ---- Job Analytics ----
export type JobAnalytics = {
  jobId: string
  viewsTotal: number
  applicationsTotal: number
  viewsByDay: number[]
  applicationsByDay: number[]
  conversionRate: number
  avgTimeToApplyHours: number
}
