import React, { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Badge, Button, Modal } from '../../components'
import { RegulixBadge } from '../components/RegulixBadge/RegulixBadge'
import { StagePicker } from '../components/StagePicker/StagePicker'
import { KrewtreeMark } from '../components/Logo'
import { useAuth } from '../context/AuthContext'
import {
  MapPinIcon,
  LinkedInSimpleIcon,
  InstagramIcon,
  FacebookSimpleIcon,
  XIcon,
  GlobeIcon,
  PhoneIcon,
  MessageIcon,
  StarIcon,
  RegulixMarkIcon,
} from '../icons'
import { getFullWorkerProfile, type FullWorkerProfile } from '../services/workerService'
import {
  addApplicantNote,
  getWorkerApplicationsAtCompany,
  setApplicantStage,
  shortlistApplicant,
} from '../services/applicantService'
import type { CompanyApplicant, KanbanStage } from '../types'
import { INDUSTRIES } from '../data/industries'
import styles from './CompanyApplicantProfilePage.module.css'

// ── Helpers ────────────────────────────────────────────────────────────────────

const formatMonth = (d: string | null): string => {
  if (!d) return ''
  const parts = d.split('-')
  const y = parts[0]
  const m = parts[1]
  if (!y || !m) return d
  const month = new Date(Number(y), Number(m) - 1).toLocaleString('default', { month: 'short' })
  return `${month} ${y}`
}

const contractLabel = (t: string): string => {
  if (t === 'day_rate') return 'Day Rate'
  if (t === 'project') return 'Project'
  if (t === 'long_term_temp') return 'Long-term Temp'
  return ''
}

const industryName = (id: string | null): string =>
  INDUSTRIES.find((i) => i.id === id)?.name ?? id ?? ''

/**
 * Build a minimal FullWorkerProfile from a CompanyApplicant so the dev view
 * works without a real Supabase-backed worker profile. Used when the mock
 * applicant's workerId (e.g. "w1") can't be resolved through Supabase.
 */
function stubProfileFromApplicant(a: CompanyApplicant): FullWorkerProfile {
  const [firstName, ...rest] = a.workerFullName.split(' ')
  return {
    firstName: firstName ?? a.workerFirstName,
    lastName: rest.join(' ') || a.workerLastInitial,
    city: a.workerLocation.split(',')[0]?.trim() ?? '',
    region: a.workerLocation.split(',')[1]?.trim() ?? '',
    phone: '',
    primaryTrade: a.workerPrimaryTrade,
    bio: '',
    avatarUrl: a.workerAvatar || null,
    resumeUrl: null,
    isRegulixReady: a.isRegulixReady,
    performanceScore: a.workerRating,
    profileCompletePct: 0,
    totalHoursWorked: null,
    industries: [],
    skills: a.workerTopSkills.map((name, i) => ({
      id: `stub-skill-${i}`,
      name,
      yearsExp: null,
      industryId: null,
    })),
    certifications: a.workerCertifications.map((c, i) => ({
      id: `stub-cert-${i}`,
      certName: c.name,
      issuingBody: c.issuer,
      earnedDate: null,
    })),
    socialLinks: [],
    workHistory: a.workerJobHistory.map((j, i) => ({
      id: `stub-job-${i}`,
      employerName: j.employer,
      roleTitle: j.title,
      startDate: null,
      endDate: null,
      isCurrent: i === 0,
      contractType: '',
      industryId: null,
      description: '',
    })),
  }
}

function formatNoteTime(iso: string): string {
  const then = new Date(iso).getTime()
  const diffMs = Date.now() - then
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const SocialLinkIcon: React.FC<{ platform: string }> = ({ platform }) => {
  const size = 17
  switch (platform) {
    case 'linkedin':
      return <LinkedInSimpleIcon size={size} />
    case 'instagram':
      return <InstagramIcon size={size} />
    case 'facebook':
      return <FacebookSimpleIcon size={size} />
    case 'x':
      return <XIcon size={size} />
    default:
      return <GlobeIcon size={size} />
  }
}

const card: React.CSSProperties = {
  background: 'var(--kt-surface)',
  border: '1px solid var(--kt-border)',
  borderRadius: 'var(--kt-radius-lg)',
  padding: 24,
}

const sectionHeading: React.CSSProperties = {
  fontSize: 'var(--kt-text-lg)',
  fontWeight: 'var(--kt-weight-bold)',
  color: 'var(--kt-navy-900)',
  margin: '0 0 16px',
}

// ── Page ──────────────────────────────────────────────────────────────────────

export const CompanyApplicantProfilePage: React.FC = () => {
  const { workerId } = useParams<{ workerId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [profile, setProfile] = useState<FullWorkerProfile | null>(null)
  const [applications, setApplications] = useState<CompanyApplicant[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [showPast, setShowPast] = useState(false)
  const [openAppId, setOpenAppId] = useState<string | null>(null)

  const load = useCallback(() => {
    if (!workerId || !user?.id) return
    Promise.all([
      getFullWorkerProfile(workerId),
      getWorkerApplicationsAtCompany(workerId, user.id),
    ]).then(([p, a]) => {
      setApplications(a.data)
      // Real-DB worker profile fetched via Supabase (requires a UUID).
      // Mock applicant ids like "w1" will fail — fall back to a stub derived
      // from the CompanyApplicant so the dev view still renders.
      if (p.data) {
        setProfile(p.data)
      } else if (a.data[0]) {
        setProfile(stubProfileFromApplicant(a.data[0]))
      } else {
        setFetchError(p.error ?? 'Applicant not found.')
      }
      setLoading(false)
    })
  }, [workerId, user?.id])

  useEffect(() => {
    load()
  }, [load])

  // ── Primary application — first in the list (newest) ───────────────────────
  const primary = applications[0] ?? null

  const resolveAuthorName = (): string => {
    const meta = (user?.user_metadata ?? {}) as Record<string, unknown>
    return (meta.company_name as string) || (meta.first_name as string) || user?.email || 'Unknown'
  }

  const handleStageChange = async (appId: string, stage: KanbanStage) => {
    await setApplicantStage(appId, stage)
    load()
  }

  const handleShortlist = async () => {
    if (!primary) return
    await shortlistApplicant(primary.id)
    load()
  }

  const handleMessage = () => {
    navigate('/site/messages')
  }

  const handleAddNote = async (appId: string, text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    await addApplicantNote(appId, trimmed, resolveAuthorName())
    load()
  }

  // ── Loading / error ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={styles.centered}>
        <p className={styles.centeredText}>Loading applicant…</p>
      </div>
    )
  }

  if (fetchError || !profile) {
    return (
      <div className={styles.centered}>
        <p className={styles.centeredError}>{fetchError ?? 'Applicant not found.'}</p>
      </div>
    )
  }

  // ── Derived profile fields ─────────────────────────────────────────────────
  const fullName = `${profile.firstName} ${profile.lastName}`.trim()
  const initials = profile.firstName
    ? `${profile.firstName[0]}${profile.lastName?.[0] ?? ''}`.toUpperCase()
    : '?'
  const location = [profile.city, profile.region].filter(Boolean).join(', ')
  const hasContent =
    !!profile.bio ||
    !!profile.phone ||
    profile.socialLinks.some((l) => l.url) ||
    profile.skills.length > 0 ||
    profile.certifications.length > 0 ||
    profile.workHistory.length > 0

  const skillsByIndustry = profile.skills.reduce<Record<string, typeof profile.skills>>(
    (acc, skill) => {
      const key = skill.industryId ?? '__other__'
      if (!acc[key]) acc[key] = []
      acc[key].push(skill)
      return acc
    },
    {}
  )

  // ── Split applications: active vs past (hired + rejected) ─────────────────
  const activeApps = applications.filter((a) => a.stage !== 'hired' && a.stage !== 'rejected')
  const pastApps = applications.filter((a) => a.stage === 'hired' || a.stage === 'rejected')

  return (
    <div className={styles.page}>
      {/* ── Application header strip ───────────────────────────────────────── */}
      <div className={styles.stripWrap}>
        <div className={styles.stripInner}>
          <div className={styles.stripTopRow}>
            <Link to="/site/dashboard/applicants" className={styles.backLink}>
              ← Back to applicants
            </Link>
          </div>

          {applications.length === 0 ? (
            <p className={styles.stripEmpty}>This worker has no applications at your company.</p>
          ) : (
            <div className={styles.appRows}>
              {activeApps.map((app) => (
                <ApplicationRow
                  key={app.id}
                  applicant={app}
                  onOpen={() => setOpenAppId(app.id)}
                  onStageChange={(stage) => handleStageChange(app.id, stage)}
                />
              ))}
              {pastApps.length > 0 && (
                <>
                  {showPast &&
                    pastApps.map((app) => (
                      <ApplicationRow
                        key={app.id}
                        applicant={app}
                        onOpen={() => setOpenAppId(app.id)}
                        onStageChange={(stage) => handleStageChange(app.id, stage)}
                      />
                    ))}
                  <button
                    type="button"
                    className={styles.pastToggle}
                    onClick={() => setShowPast((v) => !v)}
                  >
                    {showPast ? 'Hide' : 'Show'} past applications ({pastApps.length})
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <div style={{ background: 'var(--kt-surface)' }}>
        <div className={styles.heroInner}>
          <div className={styles.profileRow}>
            <div
              style={{
                width: 112,
                height: 112,
                borderRadius: '50%',
                background: 'var(--kt-primary)',
                color: 'var(--kt-primary-fg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'var(--kt-weight-bold)',
                fontSize: 'var(--kt-text-3xl)',
                border: '4px solid var(--kt-surface)',
                flexShrink: 0,
                boxShadow: 'var(--kt-shadow-sm)',
                overflow: 'hidden',
              }}
            >
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={fullName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                initials
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <h1
                style={{
                  fontSize: 'var(--kt-text-2xl)',
                  fontWeight: 'var(--kt-weight-bold)',
                  color: 'var(--kt-text)',
                  margin: '0 0 4px',
                }}
              >
                {fullName || 'Worker Profile'}
              </h1>
              {profile.primaryTrade && (
                <p
                  style={{
                    fontSize: 'var(--kt-text-sm)',
                    color: 'var(--kt-text-muted)',
                    margin: '0 0 8px',
                  }}
                >
                  {profile.primaryTrade}
                </p>
              )}
              {location && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 'var(--kt-text-xs)',
                    color: 'var(--kt-text-muted)',
                  }}
                >
                  <MapPinIcon size={13} />
                  {location}
                </div>
              )}
            </div>

            <div className={styles.profileActions}>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={handleMessage}
                aria-label="Message"
                title="Message"
                disabled={!primary}
              >
                <MessageIcon size={18} />
              </button>
              <button
                type="button"
                className={[styles.iconBtn, primary?.isShortlisted ? styles.iconBtnActive : '']
                  .filter(Boolean)
                  .join(' ')}
                onClick={handleShortlist}
                aria-label={primary?.isShortlisted ? 'Remove from shortlist' : 'Shortlist'}
                title={primary?.isShortlisted ? 'Remove from shortlist' : 'Shortlist'}
                disabled={!primary}
              >
                <StarIcon
                  size={18}
                  color={primary?.isShortlisted ? 'var(--kt-warning)' : undefined}
                />
              </button>
            </div>
          </div>

          {/* Skills strip — mirrors WorkerProfilePage */}
          {profile.skills.length > 0 && (
            <div
              style={{
                marginTop: 20,
                background: 'var(--kt-navy-50)',
                borderRadius: 'var(--kt-radius-lg)',
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              {Object.entries(skillsByIndustry).map(([indId, skills]) => {
                const sorted = [...skills].sort((a, b) => (b.yearsExp ?? 0) - (a.yearsExp ?? 0))
                return (
                  <div key={indId}>
                    {Object.keys(skillsByIndustry).length > 1 && (
                      <p
                        style={{
                          fontSize: 'var(--kt-text-xs)',
                          fontWeight: 'var(--kt-weight-semibold)',
                          color: 'var(--kt-navy-500)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          margin: '0 0 8px',
                        }}
                      >
                        {indId === '__other__' ? 'Other' : industryName(indId)}
                      </p>
                    )}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {sorted.map((skill) => (
                        <div
                          key={skill.id}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '5px 12px',
                            background: 'var(--kt-surface)',
                            border: '1px solid var(--kt-navy-100)',
                            borderRadius: 'var(--kt-radius-full)',
                            fontSize: 'var(--kt-text-sm)',
                            color: 'var(--kt-navy-600)',
                            fontWeight: 'var(--kt-weight-medium)',
                          }}
                        >
                          {skill.name}
                          {skill.yearsExp != null && skill.yearsExp > 0 && (
                            <span
                              style={{
                                fontSize: 'var(--kt-text-xs)',
                                color: 'var(--kt-navy-400)',
                                fontWeight: 'var(--kt-weight-normal)',
                              }}
                            >
                              {skill.yearsExp} yr{skill.yearsExp !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className={styles.body}>
        {/* Main column */}
        <div className={styles.main}>
          {/* About */}
          {(() => {
            const hasSocials = profile.socialLinks.some((l) => l.url)
            const hasContact = !!profile.phone || hasSocials
            if (!profile.bio && !hasContact) return null
            return (
              <div style={card}>
                <h2 style={sectionHeading}>About</h2>
                {profile.bio && (
                  <p
                    style={{
                      fontSize: 'var(--kt-text-sm)',
                      color: 'var(--kt-text)',
                      lineHeight: 1.75,
                      margin: 0,
                      marginBottom: hasContact ? 20 : 0,
                    }}
                  >
                    {profile.bio}
                  </p>
                )}
                {hasContact && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {profile.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ color: 'var(--kt-text-muted)', display: 'flex' }}>
                          <PhoneIcon size={15} />
                        </span>
                        <span style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text)' }}>
                          {profile.phone}
                        </span>
                      </div>
                    )}
                    {profile.socialLinks
                      .filter((l) => l.url)
                      .map((link) => (
                        <a
                          key={link.id}
                          href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.socialLink}
                        >
                          <span style={{ display: 'flex' }}>
                            <SocialLinkIcon platform={link.platform} />
                          </span>
                          <span style={{ fontSize: 'var(--kt-text-sm)' }}>
                            {link.url.replace(/^https?:\/\//, '')}
                          </span>
                        </a>
                      ))}
                  </div>
                )}
              </div>
            )
          })()}

          {/* Work Experience */}
          {profile.workHistory.length > 0 && (
            <div style={card}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 20,
                }}
              >
                <h2 style={{ ...sectionHeading, margin: 0 }}>Work Experience</h2>
                {profile.resumeUrl && (
                  <a
                    href={profile.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.resumeLink}
                  >
                    View Resume
                  </a>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {profile.workHistory.map((job, i) => {
                  const isLast = i === profile.workHistory.length - 1
                  const label = contractLabel(job.contractType)
                  const dateRange = [
                    formatMonth(job.startDate),
                    job.isCurrent ? 'Present' : formatMonth(job.endDate),
                  ]
                    .filter(Boolean)
                    .join(' — ')

                  return (
                    <div key={job.id} style={{ display: 'flex', gap: 14 }}>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <div
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            background: 'var(--kt-success)',
                            border: '2px solid var(--kt-success-subtle)',
                            marginTop: 6,
                            flexShrink: 0,
                          }}
                        />
                        {!isLast && (
                          <div
                            style={{
                              width: 2,
                              flex: 1,
                              background: 'var(--kt-border)',
                              margin: '4px 0',
                            }}
                          />
                        )}
                      </div>
                      <div style={{ flex: 1, paddingBottom: isLast ? 0 : 24 }}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            gap: 8,
                            flexWrap: 'wrap',
                          }}
                        >
                          <div>
                            <p
                              style={{
                                fontWeight: 'var(--kt-weight-semibold)',
                                fontSize: 'var(--kt-text-sm)',
                                color: 'var(--kt-text)',
                                margin: '0 0 2px',
                              }}
                            >
                              {job.roleTitle}
                            </p>
                            <p
                              style={{
                                fontSize: 'var(--kt-text-xs)',
                                color: 'var(--kt-text-muted)',
                                margin: 0,
                              }}
                            >
                              {job.employerName}
                            </p>
                          </div>
                          {dateRange && (
                            <span
                              style={{
                                fontSize: 'var(--kt-text-xs)',
                                color: 'var(--kt-text-muted)',
                                flexShrink: 0,
                              }}
                            >
                              {dateRange}
                            </span>
                          )}
                        </div>
                        {(job.industryId || label) && (
                          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                            {job.industryId && (
                              <Badge variant="secondary" size="sm">
                                {industryName(job.industryId)}
                              </Badge>
                            )}
                            {label && (
                              <Badge variant="secondary" size="sm">
                                {label}
                              </Badge>
                            )}
                          </div>
                        )}
                        {job.description && (
                          <p
                            style={{
                              fontSize: 'var(--kt-text-xs)',
                              color: 'var(--kt-text-muted)',
                              lineHeight: 1.65,
                              margin: '8px 0 0',
                            }}
                          >
                            {job.description}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Certifications */}
          {profile.certifications.length > 0 && (
            <div style={card}>
              <h2 style={sectionHeading}>Certifications</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {profile.certifications.map((cert) => (
                  <div
                    key={cert.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 14px',
                      border: '1px solid var(--kt-border)',
                      borderRadius: 'var(--kt-radius-md)',
                      background: 'var(--kt-bg)',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontWeight: 'var(--kt-weight-semibold)',
                          fontSize: 'var(--kt-text-sm)',
                          color: 'var(--kt-text)',
                          margin: '0 0 2px',
                        }}
                      >
                        {cert.certName}
                      </p>
                      {cert.issuingBody && (
                        <p
                          style={{
                            fontSize: 'var(--kt-text-xs)',
                            color: 'var(--kt-text-muted)',
                            margin: 0,
                          }}
                        >
                          {cert.issuingBody}
                        </p>
                      )}
                    </div>
                    {cert.earnedDate && (
                      <span
                        style={{
                          flexShrink: 0,
                          fontSize: 'var(--kt-text-xs)',
                          color: 'var(--kt-text-muted)',
                          padding: '2px 8px',
                          borderRadius: 'var(--kt-radius-full)',
                          border: '1px solid var(--kt-border)',
                        }}
                      >
                        Earned {formatMonth(cert.earnedDate)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!hasContent && (
            <div
              style={{
                ...card,
                textAlign: 'center',
                padding: '48px 24px',
              }}
            >
              <p
                style={{
                  fontSize: 'var(--kt-text-sm)',
                  fontWeight: 'var(--kt-weight-bold)',
                  color: 'var(--kt-text)',
                  margin: '0 0 6px',
                }}
              >
                This worker hasn't filled in their profile yet.
              </p>
            </div>
          )}
        </div>

        {/* Sidebar — sticky, subtle-bg cards */}
        <div className={styles.sidebar}>
          {/* Ratings — krewtree + Regulix */}
          {primary && (primary.workerRating !== null || primary.workerRegulixRating !== null) && (
            <div className={styles.sidebarCard}>
              <h3 className={styles.sidebarHeading}>Ratings</h3>
              <div className={styles.ratingsGrid}>
                <div className={styles.ratingCell}>
                  <div className={styles.ratingLabel}>
                    <KrewtreeMark size={14} />
                    <span>krewtree</span>
                  </div>
                  <span className={styles.ratingValue}>
                    {primary.workerRating !== null ? primary.workerRating.toFixed(1) : '—'}
                  </span>
                  <span className={styles.ratingMeta}>
                    {primary.workerRatingCount} job
                    {primary.workerRatingCount === 1 ? '' : 's'}
                  </span>
                </div>
                <div className={styles.ratingCell}>
                  <div className={styles.ratingLabel}>
                    <RegulixMarkIcon size={12} />
                    <span>Regulix</span>
                  </div>
                  <span className={styles.ratingValue}>
                    {primary.workerRegulixRating !== null
                      ? primary.workerRegulixRating.toFixed(1)
                      : '—'}
                  </span>
                  <span className={styles.ratingMeta}>
                    {primary.workerRegulixRatingCount} job
                    {primary.workerRegulixRatingCount === 1 ? '' : 's'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Regulix status */}
          <div
            className={[styles.regulixCard, profile.isRegulixReady ? styles.regulixReady : '']
              .filter(Boolean)
              .join(' ')}
          >
            <RegulixBadge
              size="lg"
              variant={profile.isRegulixReady ? 'filled' : 'pending'}
              pulse={profile.isRegulixReady}
            />
            <p className={styles.regulixLabel}>
              {profile.isRegulixReady ? 'Regulix Ready' : 'Not Yet Regulix Ready'}
            </p>
            <p className={styles.regulixMeta}>
              {profile.isRegulixReady
                ? 'All onboarding docs verified. Day-1 hire-ready.'
                : 'Complete onboarding to become hire-ready.'}
            </p>
          </div>
        </div>
      </div>

      {/* Application details modal — mirrors QuickApplyModal's company-side shape */}
      <ApplicationDetailsModal
        applicant={applications.find((a) => a.id === openAppId) ?? null}
        onClose={() => setOpenAppId(null)}
        onStageChange={(appId, stage) => handleStageChange(appId, stage)}
        onAddNote={(appId, text) => handleAddNote(appId, text)}
      />
    </div>
  )
}

// ── Application row (top strip, click → modal) ───────────────────────────────

const ApplicationRow: React.FC<{
  applicant: CompanyApplicant
  onOpen: () => void
  onStageChange: (stage: KanbanStage) => void
}> = ({ applicant, onOpen, onStageChange }) => {
  const appliedDate = new Date(applicant.appliedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
  const noteCount = applicant.notes.length

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onOpen()
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className={styles.appRow}
      onClick={onOpen}
      onKeyDown={handleKeyDown}
    >
      <div className={styles.appRowMain}>
        <span className={styles.appRowTitle}>{applicant.jobTitle}</span>
        <span className={styles.appRowDate}>Applied {appliedDate}</span>
      </div>
      <div className={styles.appRowStats}>
        <span className={styles.appRowLabel}>
          {noteCount > 0 && `${noteCount} ${noteCount === 1 ? 'note' : 'notes'}`}
        </span>
        <span className={styles.appRowLabel}>{applicant.matchScore}% match</span>
        <span
          className={styles.appRowStatusWrap}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          role="presentation"
        >
          <StagePicker stage={applicant.stage} onChange={onStageChange} size="sm" />
        </span>
      </div>
      <OpenModalIcon size={14} />
    </div>
  )
}

// Arrow-out-of-box glyph — signals "click to open details"
const OpenModalIcon: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M15 3h6v6" />
    <path d="M10 14 21 3" />
    <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
  </svg>
)

// ── Application details modal ─────────────────────────────────────────────────

const ApplicationDetailsModal: React.FC<{
  applicant: CompanyApplicant | null
  onClose: () => void
  onStageChange: (appId: string, stage: KanbanStage) => void
  onAddNote: (appId: string, text: string) => Promise<void>
}> = ({ applicant, onClose, onStageChange, onAddNote }) => {
  const [draft, setDraft] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Reset draft when the open applicant changes
  useEffect(() => {
    setDraft('')
  }, [applicant?.id])

  if (!applicant) {
    return <Modal open={false} onClose={onClose} />
  }

  const appliedDate = new Date(applicant.appliedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const answers = applicant.preInterviewAnswers ?? []

  const submitNote = async () => {
    if (!draft.trim()) return
    setSubmitting(true)
    await onAddNote(applicant.id, draft)
    setDraft('')
    setSubmitting(false)
  }

  return (
    <Modal
      open={true}
      onClose={onClose}
      size="lg"
      title={applicant.jobTitle}
      description={`Applied ${appliedDate}`}
      headerExtra={
        <StagePicker
          stage={applicant.stage}
          onChange={(stage) => onStageChange(applicant.id, stage)}
        />
      }
    >
      <div className={styles.appModalBody}>
        {/* Match score */}
        <section className={styles.appModalSection}>
          <h4 className={styles.appModalLabel}>Match score</h4>
          <div className={styles.appModalMatch}>
            <span className={styles.appModalMatchValue}>{applicant.matchScore}%</span>
            <div className={styles.appModalMatchBreakdown}>
              <span>
                Skills <strong>{applicant.matchBreakdown.skills}%</strong>
              </span>
              <span className={styles.appModalMatchSep}>·</span>
              <span>
                Location <strong>{applicant.matchBreakdown.location}%</strong>
              </span>
            </div>
          </div>
        </section>

        {/* Pre-apply answers */}
        {answers.length > 0 && (
          <section className={styles.appModalSection}>
            <h4 className={styles.appModalLabel}>Pre-apply answers</h4>
            <ul className={styles.qaList}>
              {answers.map((qa, i) => (
                <li key={i} className={styles.qaItem}>
                  <p className={styles.qaQuestion}>{qa.question}</p>
                  <p className={styles.qaAnswer}>{qa.answer}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Notes */}
        <section className={styles.appModalSection}>
          <h4 className={styles.appModalLabel}>Notes</h4>
          {applicant.notes.length === 0 ? (
            <p className={styles.appModalEmpty}>No notes yet.</p>
          ) : (
            <ul className={styles.notesList}>
              {applicant.notes.map((n, i) => (
                <li key={i} className={styles.noteItem}>
                  <p className={styles.noteText}>{n.text}</p>
                  <p className={styles.noteCaption}>
                    {n.authorName} · {formatNoteTime(n.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <div className={styles.appModalNoteForm}>
            <textarea
              className={styles.noteTextarea}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Add a note for this application…"
              rows={3}
              disabled={submitting}
            />
            <div className={styles.appModalNoteFooter}>
              <Button
                variant="primary"
                size="sm"
                onClick={submitNote}
                disabled={!draft.trim() || submitting}
              >
                {submitting ? 'Adding…' : 'Add note'}
              </Button>
            </div>
          </div>
        </section>
      </div>
    </Modal>
  )
}
