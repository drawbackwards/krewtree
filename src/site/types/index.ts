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
  viewCount: number
  postedDaysAgo: number
  createdAt: string
  status: 'active' | 'paused' | 'closed'
  experienceLevel?: string | null
  preInterviewQuestions?: string[]
  urgentHiring?: boolean
  regulixPreferred?: boolean
  autoPauseLimit?: number | null
  closingAt?: string | null
  /** Job's resolved coordinates from us_cities. Set by the jobs_geocode trigger
   *  whenever `location` changes; null when the location isn't parseable. */
  latitude?: number | null
  longitude?: number | null
  /** Miles from the worker's chosen anchor — only populated when the Find Jobs
   *  page is running a distance filter or Nearest sort. */
  distanceMi?: number | null
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

// ---- Application status (pipeline-foundation spec) ----
// Active applications have status='active' and a current_stage_id pointing to
// a stage UUID in the job's pipeline snapshot. Terminal states record how the
// application ended — the stage that was active at that moment is preserved in
// current_stage_id for history but the application is no longer "in" a stage.
export type ApplicationStatus =
  | 'active'
  | 'terminal_hired'
  | 'terminal_rejected'
  | 'terminal_withdrawn'
  | 'terminal_archived'

export type SlaState = 'none' | 'approaching' | 'breached'

// ---- Company Applicant (for cross-job pipeline views) ----
// Used by the company dashboard widget and /site/dashboard/applicants.
export type CompanyApplicant = {
  id: string // application id
  workerId: string
  workerFirstName: string
  workerLastInitial: string
  workerFullName: string
  workerAvatar: string // url or empty string
  workerInitials: string
  workerPrimaryTrade: string
  workerLocation: string
  workerAvailability: 'available' | 'limited' | 'unavailable'
  workerTopSkills: string[]
  workerCertifications: Array<{ name: string; issuer: string; expiresOn: string | null }>
  workerJobHistory: Array<{
    employer: string
    title: string
    duration: string
    isCurrent: boolean
  }>
  workerReferences: Array<{
    id: string
    name: string
    company: string
    phone: string | null
    email: string | null
  }>
  workerRating: number | null
  workerRatingCount: number
  workerRegulixRating: number | null
  workerRegulixRatingCount: number
  jobId: string
  jobTitle: string
  jobStatus: Job['status']
  // Stage identity — UUID from the job's pipeline snapshot
  currentStageId: string
  currentStageName: string
  status: ApplicationStatus
  matchScore: number // 0–100
  matchBreakdown: { skills: number; location: number; availability: number }
  isRegulixReady: boolean
  isShortlisted: boolean
  isBoosted: boolean
  appliedAt: string // ISO
  stageEnteredAt: string | null
  slaState: SlaState
  flagged: boolean
  notes: Array<{ text: string; authorName: string; createdAt: string }>
  preInterviewAnswers?: Array<{ question: string; answer: string }>
  // Labels of any tasks currently flagged for follow-up. Empty when nothing is flagged.
  flaggedTaskLabels: string[]
}

// Convenience: human-readable label for a terminal status
export const TERMINAL_LABEL: Record<ApplicationStatus, string> = {
  active: 'Active',
  terminal_hired: 'Hired',
  terminal_rejected: 'Rejected',
  terminal_withdrawn: 'Withdrawn',
  terminal_archived: 'Archived',
}

export function isTerminal(status: ApplicationStatus): boolean {
  return status !== 'active'
}

// ---- Pipeline task system ----

export type TaskState = 'incomplete' | 'completed' | 'skipped'
export type TaskSource = 'template' | 'ad_hoc'

export type ApplicationTask = {
  id: string
  applicationId: string
  stageId: string
  source: TaskSource
  templateTaskId: string | null
  label: string
  isRequired: boolean
  state: TaskState
  completedAt: string | null
  completedBy: string | null
  skippedAt: string | null
  skippedBy: string | null
  notes: ApplicationTaskNote[]
  dueDate: string | null // ISO date YYYY-MM-DD
  order: number
  createdAt: string
  // Attached message (snapshot from template at instantiation time)
  messageSubject: string | null
  messageBody: string | null
  calendarLink: string | null
  autoSend: boolean
  messageSentAt: string | null
  flagged: boolean
}

export type ApplicationTaskNote = {
  id: string
  applicationTaskId: string
  applicationId: string
  body: string
  createdAt: string
  createdBy: string | null
  updatedAt: string | null
  updatedBy: string | null
}

export type ApplicationMessage = {
  id: string
  applicationId: string
  applicationTaskId: string | null
  body: string
  calendarLink: string | null
  sentAt: string
  sentBy: string | null
  readAt: string | null
}

export type StageNote = {
  applicationId: string
  stageId: string
  notes: string | null
  updatedAt: string
  updatedBy: string
}

export type LogEventType =
  | 'application_created'
  | 'stage_entered'
  | 'stage_exited'
  | 'trigger_fired'
  | 'task_created'
  | 'task_completed'
  | 'task_uncompleted'
  | 'task_skipped'
  | 'task_unskipped'
  | 'task_deleted'
  | 'stage_notes_updated'
  | 'task_note_added'
  | 'task_note_edited'
  | 'note_added'
  | 'application_withdrawn'
  | 'application_rejected'
  | 'application_hired'
  | 'application_archived'
  | 'shortlisted'
  | 'unshortlisted'
  | 'task_flagged'
  | 'task_unflagged'

export type ApplicationLogEvent = {
  id: string
  applicationId: string
  eventType: LogEventType
  actor: string // user display name or 'System'
  description: string
  // Snapshots taken at write time so renames / edits to the underlying
  // task or note don't rewrite history. `taskLabel` is set for any
  // task-related event; `noteBody` is set for note add/edit events.
  taskLabel: string | null
  noteBody: string | null
  stageId: string | null
  createdAt: string // ISO
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

// ============================================================
// REGULIX INTEGRATION TYPES
// Mirror the v1 regulixService interface (see docs/superpowers/specs
// 2026-04-20-company-dashboard-design.md §3.7). Shapes are frozen now
// so mock and real implementations stay swap-compatible.
// ============================================================

export type RegulixStatus = {
  ready: boolean
  onboarded: boolean
  immediateHire: boolean
}

export type RegulixEndorsement = {
  id: string
  workerId: string
  fromCompanyId: string
  fromCompanyName: string
  role: string
  rating: number // 1-5
  quote: string
  date: string // ISO
}

export type VerifiedWorkHistoryEntry = {
  id: string
  workerId: string
  companyName: string // may be anonymized as "Construction Co." if Regulix policy hides it
  role: string
  startDate: string // ISO
  endDate: string | null // null if current
  verified: true // literal: this endpoint only returns verified entries; unverified are excluded server-side
}

export type PastHire = {
  workerId: string
  companyId: string
  lastHiredAt: string // ISO
  jobTitle: string
  rehireable: boolean
}

export type HireHandoffParams = {
  companyId: string
  workerId: string
  jobId: string
  hireDate: string // ISO
  payRate: number
}

export type HireHandoffResult = {
  regulixHireId: string
}

export type RegulixInviteParams = {
  companyId: string
  workerId: string
  jobId: string
}
