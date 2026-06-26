import React, { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Badge, Button } from '../../components'
import { useToast } from '../../components/Toast/Toast'
import { RegulixLogo } from '../components/RegulixLogo/RegulixLogo'
import { useChatPane } from '../components/ChatPane/ChatPaneContext'
import { WorkerActivityLog } from '../components/WorkerActivityLog/WorkerActivityLog'
import { useDrawerStack } from '../components/DrawerSystem/DrawerStackContext'
import { KrewtreeMark } from '../components/Logo'
import { FEATURES } from '../config/features'
import { useAuth } from '../context/AuthContext'
import { addWorkerToKrew, removeWorkerFromKrew, getKrewRelationship } from '../services/krewService'
import { getWorkerApplicationsAtCompany } from '../services/applicantService'
import {
  MapPinIcon,
  StarIcon,
  LinkedInSimpleIcon,
  InstagramIcon,
  FacebookSimpleIcon,
  XIcon,
  GlobeIcon,
  EnvelopeIcon,
  PhoneIcon,
  VerifiedBadgeIcon,
  RegulixMarkIcon,
  CheckIcon,
  ShareIcon,
} from '../icons'
import { getFullWorkerProfile, getResumeShareLink } from '../services/workerService'
import type { FullWorkerProfile } from '../services/workerService'
import type { CompanyApplicant } from '../types'
import { INDUSTRIES } from '../data/industries'
import { getContractTypeLabel } from '../data/contractTypes'
import styles from './WorkerProfilePage.module.css'

// ── Helpers ────────────────────────────────────────────────────────────────────

const formatAppliedDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

const formatMonth = (d: string | null): string => {
  if (!d) return ''
  const parts = d.split('-')
  const y = parts[0]
  const m = parts[1]
  if (!y || !m) return d
  const month = new Date(Number(y), Number(m) - 1).toLocaleString('default', { month: 'short' })
  return `${month} ${y}`
}

const contractLabel = (t: string): string => getContractTypeLabel(t)

const industryName = (id: string | null): string =>
  INDUSTRIES.find((i) => i.id === id)?.name ?? id ?? ''

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

// ── Shared styles ──────────────────────────────────────────────────────────────

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

// ── Component ──────────────────────────────────────────────────────────────────

export const WorkerProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, persona } = useAuth()
  const { openChat } = useChatPane()
  const { openDrawer } = useDrawerStack()
  const { toast } = useToast()
  const isOwnProfile = !!user && user.id === id
  const isCompanyViewer = persona === 'company' && !isOwnProfile

  const [profile, setProfile] = useState<FullWorkerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'profile' | 'activity'>('profile')

  // Krew membership — only meaningful when a company is viewing someone else's
  // profile. null while we don't know yet (loading / not applicable).
  const [inKrew, setInKrew] = useState<boolean | null>(null)
  const [krewBusy, setKrewBusy] = useState(false)

  // Company-side application context — only loaded when a company views the
  // profile. Feeds the sidebar "Applications" card + the dual ratings card.
  const [applications, setApplications] = useState<CompanyApplicant[]>([])
  const [showPast, setShowPast] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getFullWorkerProfile(id).then(({ data, error }) => {
      if (error) setFetchError(error)
      else setProfile(data)
      setLoading(false)
    })
  }, [id])

  useEffect(() => {
    if (!id || !isCompanyViewer) {
      setInKrew(null)
      return
    }
    getKrewRelationship(id).then(({ data }) => {
      setInKrew(data?.inKrew ?? false)
    })
  }, [id, isCompanyViewer])

  // Applications this worker has filed with the viewing company. RLS scopes the
  // rows; we still pass the company id (== the company user's auth uid).
  const loadApplications = useCallback(() => {
    if (!id || !isCompanyViewer || !user?.id) {
      setApplications([])
      return
    }
    getWorkerApplicationsAtCompany(id, user.id).then(({ data }) => {
      setApplications(data)
    })
  }, [id, isCompanyViewer, user?.id])

  useEffect(() => {
    loadApplications()
  }, [loadApplications])

  // Newest application — drives the ratings card + the hero Shortlist toggle.
  const primary = applications[0] ?? null

  // Clicking an application opens the full applicant drawer on its Pipeline tab
  // (stage + tasks live there); onWrite refreshes the sidebar after any change.
  const openApplicationDrawer = (app: CompanyApplicant): void => {
    openDrawer({
      type: 'application',
      applicationId: app.id,
      defaultTab: 'pipeline',
      preloadedApplicant: app,
      onWrite: loadApplications,
    })
  }

  // Company viewers with a scored application get the richer dual-rating card;
  // everyone else falls back to the generic profile stats card.
  const showDualRatings =
    isCompanyViewer &&
    !!primary &&
    (primary.workerRating != null || (FEATURES.regulix && primary.workerRegulixRating != null))

  // Mints a 7-day signed link to the resume and copies it to the clipboard, so
  // it can be forwarded to someone (e.g. an outside hiring manager) without an
  // account. Distinct from the inline "View Resume" link, which is short-lived.
  const handleCopyResumeShareLink = async (): Promise<void> => {
    if (!profile?.resumePath) return
    const { url, error } = await getResumeShareLink(profile.resumePath)
    if (error || !url) {
      toast({
        title: 'Could not create share link',
        description: error ?? undefined,
        variant: 'danger',
      })
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      toast({
        title: 'Share link copied',
        description: 'Anyone with this link can view the resume for 7 days.',
      })
    } catch {
      toast({
        title: 'Copy failed',
        description: 'Could not access the clipboard.',
        variant: 'danger',
      })
    }
  }

  const handleToggleKrew = async (): Promise<void> => {
    if (!id || krewBusy) return
    const name = `${profile?.firstName ?? ''} ${profile?.lastName ?? ''}`.trim() || 'Worker'
    setKrewBusy(true)
    if (inKrew) {
      const { error } = await removeWorkerFromKrew(id)
      setKrewBusy(false)
      if (error) {
        toast({ title: 'Could not remove from krew', description: error, variant: 'danger' })
        return
      }
      setInKrew(false)
      toast({
        title: 'Removed from My Krew',
        description: `${name} is no longer in your krew.`,
        variant: 'success',
      })
    } else {
      const { error } = await addWorkerToKrew(id, { source: 'marketplace' })
      setKrewBusy(false)
      if (error) {
        toast({ title: 'Could not add to krew', description: error, variant: 'danger' })
        return
      }
      setInKrew(true)
      toast({
        title: 'Added to My Krew',
        description: `${name} is now in your krew.`,
        variant: 'success',
      })
    }
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--kt-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p style={{ color: 'var(--kt-text-muted)', fontSize: 'var(--kt-text-sm)' }}>
          Loading profile…
        </p>
      </div>
    )
  }

  if (fetchError || !profile) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--kt-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p style={{ color: 'var(--kt-danger)', fontSize: 'var(--kt-text-sm)' }}>
          {fetchError ?? 'Profile not found.'}
        </p>
      </div>
    )
  }

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

  // Group skills by industry for display
  const skillsByIndustry = profile.skills.reduce<Record<string, typeof profile.skills>>(
    (acc, skill) => {
      const key = skill.industryId ?? '__other__'
      if (!acc[key]) acc[key] = []
      acc[key].push(skill)
      return acc
    },
    {}
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--kt-bg)' }}>
      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <div style={{ background: 'var(--kt-surface)' }}>
        {/* Profile row */}
        <div className={styles.heroInner}>
          <div className={styles.profileRow}>
            {/* Avatar */}
            <div
              style={{
                width: 112,
                height: 112,
                borderRadius: 'var(--kt-radius-lg)',
                background: 'var(--kt-primary)',
                color: 'var(--kt-primary-fg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'var(--kt-weight-bold)',
                fontSize: 'var(--kt-text-3xl)',
                flexShrink: 0,
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

            {/* Identity */}
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

            {/* Actions */}
            <div className={styles.profileActions}>
              {isOwnProfile ? (
                <Button variant="primary" size="md" onClick={() => navigate('/site/profile/edit')}>
                  Edit profile
                </Button>
              ) : (
                <>
                  {/* In-krew status sits to the LEFT of the CTA — a muted,
                      non-interactive indicator (mirrors the Discover card),
                      not a button. Removal happens elsewhere (Discover / My Krew). */}
                  {isCompanyViewer && inKrew === true && (
                    <span className={styles.krewPill}>
                      <CheckIcon size={14} />
                      In Krew
                    </span>
                  )}
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() =>
                      openChat({
                        workerId: id!,
                        name: fullName || 'Worker',
                        avatarUrl: profile.avatarUrl,
                      })
                    }
                  >
                    Message
                  </Button>
                  {isCompanyViewer ? (
                    inKrew === false && (
                      <Button
                        variant="outline"
                        size="md"
                        onClick={handleToggleKrew}
                        disabled={krewBusy}
                      >
                        Add to My Krew
                      </Button>
                    )
                  ) : (
                    <Button variant="outline" size="md">
                      Save
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Skills strip */}
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

      {/* ── Tabs ─────────────────────────────────────────────────────────────── */}
      {/* Activity is company-only context; workers never see it (own profile or
          when viewing another worker's profile). With only the Profile tab left
          for workers, the whole strip is hidden. */}
      {isCompanyViewer && (
        <div className={styles.tabStrip}>
          <div className={styles.tabStripInner}>
            {(['profile', 'activity'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={[styles.tab, activeTab === tab ? styles.tabActive : '']
                  .filter(Boolean)
                  .join(' ')}
              >
                {tab === 'profile' ? 'Profile' : 'Activity'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Activity tab ─────────────────────────────────────────────────────── */}
      {activeTab === 'activity' && (
        <div className={styles.tabPanel}>
          <div style={card}>
            <WorkerActivityLog
              workerId={id!}
              isOwnProfile={isOwnProfile}
              isCompanyViewer={isCompanyViewer}
            />
          </div>
        </div>
      )}

      {/* ── Body ─────────────────────────────────────────────────────────────── */}
      {activeTab === 'profile' && (
        <div className={styles.body}>
          {/* ── Main column ── */}
          <div className={styles.main}>
            {/* About */}
            {(() => {
              const hasSocials = profile.socialLinks.some((l) => l.url)
              const hasEmail = isOwnProfile && !!user?.email
              const hasContact = !!profile.phone || hasEmail || hasSocials
              if (!profile.bio && !hasContact) return null
              return (
                <div style={card}>
                  <h2 style={sectionHeading}>About</h2>

                  {/* Bio */}
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

                  {/* Contact + social rows */}
                  {hasContact && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {profile.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span
                            style={{
                              color: 'var(--kt-text-muted)',
                              flexShrink: 0,
                              display: 'flex',
                            }}
                          >
                            <PhoneIcon size={15} />
                          </span>
                          <span style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text)' }}>
                            {profile.phone}
                          </span>
                        </div>
                      )}
                      {hasEmail && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span
                            style={{
                              color: 'var(--kt-text-muted)',
                              flexShrink: 0,
                              display: 'flex',
                            }}
                          >
                            <EnvelopeIcon size={15} />
                          </span>
                          <span style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text)' }}>
                            {user!.email}
                          </span>
                          {user!.email_confirmed_at && (
                            <span
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 3,
                                fontSize: 'var(--kt-text-xs)',
                                color: 'var(--kt-success)',
                                flexShrink: 0,
                              }}
                            >
                              <VerifiedBadgeIcon size={13} color="var(--kt-success)" />
                              Verified
                            </span>
                          )}
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
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              color: 'var(--kt-text-muted)',
                              textDecoration: 'none',
                              transition: 'color 0.15s',
                            }}
                            onMouseOver={(e) => (e.currentTarget.style.color = 'var(--kt-text)')}
                            onMouseOut={(e) =>
                              (e.currentTarget.style.color = 'var(--kt-text-muted)')
                            }
                          >
                            <span style={{ flexShrink: 0, display: 'flex' }}>
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
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <a
                        href={profile.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 'var(--kt-text-xs)',
                          fontWeight: 'var(--kt-weight-semibold)',
                          color: 'var(--kt-primary)',
                          textDecoration: 'none',
                          border: '1px solid var(--kt-primary)',
                          borderRadius: 'var(--kt-radius-md)',
                          padding: '4px 10px',
                        }}
                      >
                        View Resume
                      </a>
                      {profile.resumePath && (
                        <button
                          type="button"
                          onClick={handleCopyResumeShareLink}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            fontSize: 'var(--kt-text-xs)',
                            fontWeight: 'var(--kt-weight-semibold)',
                            color: 'var(--kt-navy-500)',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px 6px',
                          }}
                        >
                          <ShareIcon size={14} />
                          Copy share link
                        </button>
                      )}
                    </div>
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
                        {/* Timeline */}
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

                        {/* Content */}
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

                          {/* Industry + contract type badges */}
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

                          {/* Description */}
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
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {profile.certifications.map((cert) => (
                    <div
                      key={cert.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 0',
                        borderBottom:
                          profile.certifications.length > 1 ? '1px solid var(--kt-border)' : 'none',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            fontWeight: 'var(--kt-weight-medium)',
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

            {/* References are intentionally NOT rendered on the profile — they are
              never public. The full list (names + contacts) appears only inside
              the application drawer (ApplicantPreviewBody). The sidebar shows a
              count-only "available on application" indicator. */}

            {/* Empty state — only shown when profile is genuinely empty and incomplete */}
            {!hasContent && profile.profileCompletePct < 100 && (
              <div
                style={{
                  ...card,
                  textAlign: 'center',
                  padding: '48px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
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
                  {isOwnProfile
                    ? 'Your profile is empty.'
                    : "This worker hasn't filled in their profile yet."}
                </p>
                {isOwnProfile && (
                  <p
                    style={{
                      fontSize: 'var(--kt-text-sm)',
                      color: 'var(--kt-text-muted)',
                      margin: '0 0 20px',
                    }}
                  >
                    Add your skills and experience to stand out to employers.
                  </p>
                )}
                {isOwnProfile && (
                  <div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate('/site/profile/edit')}
                    >
                      Build your profile
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Sidebar ── */}
          <div
            className={styles.sidebar}
            style={{ alignSelf: !hasContent ? 'stretch' : 'flex-start' }}
          >
            {/* Regulix status — always the top card. Matches the company
              profile's box; greyed out when the worker isn't Regulix ready.
              Gated behind the Regulix feature flag until the partner
              connection is live. */}
            {FEATURES.regulix && (
              <div
                style={{
                  background: profile.isRegulixReady
                    ? 'var(--kt-regulix-50)'
                    : 'var(--kt-surface-raised)',
                  borderRadius: 'var(--kt-radius-lg)',
                  padding: 18,
                  textAlign: 'center',
                  flex: !hasContent ? 1 : undefined,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: !hasContent ? 'center' : undefined,
                }}
              >
                <RegulixLogo
                  height={24}
                  textColor={profile.isRegulixReady ? 'var(--kt-navy-700)' : 'var(--kt-text-muted)'}
                  opacity={profile.isRegulixReady ? 1 : 0.45}
                />
                <p
                  style={{
                    marginTop: 10,
                    fontSize: 'var(--kt-text-sm)',
                    fontWeight: 'var(--kt-weight-semibold)',
                    color: profile.isRegulixReady
                      ? 'var(--kt-regulix-500)'
                      : 'var(--kt-text-muted)',
                  }}
                >
                  {profile.isRegulixReady ? 'Regulix Ready' : 'Not Yet Regulix Ready'}
                </p>
                <p
                  style={{
                    fontSize: 'var(--kt-text-xs)',
                    color: 'var(--kt-text-muted)',
                    marginTop: 4,
                    lineHeight: 1.5,
                  }}
                >
                  {profile.isRegulixReady
                    ? 'All onboarding docs verified. Day-1 hire-ready.'
                    : 'Complete onboarding to become hire-ready.'}
                </p>
              </div>
            )}

            {/* Applications to the viewing company — moved here from the old
              full-width strip on the applicant page. Company viewers only;
              each row opens the applicant drawer on its Pipeline tab. */}
            {isCompanyViewer &&
              applications.length > 0 &&
              (() => {
                const activeApps = applications.filter((a) => a.status === 'active')
                const pastApps = applications.filter((a) => a.status !== 'active')
                return (
                  <div className={styles.sidebarCard}>
                    <h3 className={styles.sidebarHeading}>Applications · {applications.length}</h3>
                    <div className={styles.appRows}>
                      {activeApps.map((app) => (
                        <ApplicationRow
                          key={app.id}
                          applicant={app}
                          onOpen={() => openApplicationDrawer(app)}
                        />
                      ))}
                      {pastApps.length > 0 && (
                        <>
                          {showPast &&
                            pastApps.map((app) => (
                              <ApplicationRow
                                key={app.id}
                                applicant={app}
                                onOpen={() => openApplicationDrawer(app)}
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
                  </div>
                )
              })()}

            {/* Ratings — dual krewtree + Regulix card, company viewers with a
              scored application. Replaces the generic stats card below. */}
            {showDualRatings && primary && (
              <div className={styles.sidebarCard}>
                <h3 className={styles.sidebarHeading}>Ratings</h3>
                <div className={styles.ratingsGrid}>
                  <div className={styles.ratingCell}>
                    <div className={styles.ratingLabel}>
                      <KrewtreeMark size={14} />
                      <span>krewtree</span>
                    </div>
                    <span className={styles.ratingValue}>
                      {primary.workerRating != null ? primary.workerRating.toFixed(1) : '—'}
                    </span>
                    <span className={styles.ratingMeta}>
                      {primary.workerRatingCount} job{primary.workerRatingCount === 1 ? '' : 's'}
                    </span>
                  </div>
                  {FEATURES.regulix && (
                    <div className={styles.ratingCell}>
                      <div className={styles.ratingLabel}>
                        <RegulixMarkIcon size={12} />
                        <span>Regulix</span>
                      </div>
                      <span className={styles.ratingValue}>
                        {primary.workerRegulixRating != null
                          ? primary.workerRegulixRating.toFixed(1)
                          : '—'}
                      </span>
                      <span className={styles.ratingMeta}>
                        {primary.workerRegulixRatingCount} job
                        {primary.workerRegulixRatingCount === 1 ? '' : 's'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Stats — generic profile rating + verified hours. Hidden when the
              dual ratings card above is shown (company viewer with an app). */}
            {!showDualRatings &&
              (profile.performanceScore != null ||
                (profile.totalHoursWorked != null && profile.totalHoursWorked > 0)) && (
                <div
                  style={{
                    background: 'var(--kt-surface)',
                    border: '1px solid var(--kt-border)',
                    borderRadius: 'var(--kt-radius-lg)',
                    padding: 18,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                  }}
                >
                  {profile.performanceScore != null && (
                    <div style={{ textAlign: 'center' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          marginBottom: 4,
                        }}
                      >
                        <StarIcon size={18} color="var(--kt-warning)" />
                        <span
                          style={{
                            fontSize: 'var(--kt-text-3xl)',
                            fontWeight: 'var(--kt-weight-bold)',
                            color: 'var(--kt-text)',
                            lineHeight: 1,
                          }}
                        >
                          {profile.performanceScore}
                        </span>
                      </div>
                      <p
                        style={{
                          fontSize: 'var(--kt-text-xs)',
                          color: 'var(--kt-text-muted)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          margin: 0,
                        }}
                      >
                        Rating
                      </p>
                    </div>
                  )}
                  {profile.performanceScore != null &&
                    profile.totalHoursWorked != null &&
                    profile.totalHoursWorked > 0 && (
                      <div style={{ height: 1, background: 'var(--kt-border)' }} />
                    )}
                  {profile.totalHoursWorked != null && profile.totalHoursWorked > 0 && (
                    <div style={{ textAlign: 'center' }}>
                      <p
                        style={{
                          fontSize: 'var(--kt-text-3xl)',
                          fontWeight: 'var(--kt-weight-bold)',
                          color: 'var(--kt-text)',
                          margin: '0 0 4px',
                          lineHeight: 1,
                        }}
                      >
                        {profile.totalHoursWorked.toLocaleString()}
                      </p>
                      <p
                        style={{
                          fontSize: 'var(--kt-text-xs)',
                          color: 'var(--kt-text-muted)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          margin: 0,
                        }}
                      >
                        Verified hrs
                      </p>
                    </div>
                  )}
                </div>
              )}

            {/* References indicator — count only, never names; hidden until
              consent is confirmed so the count never advertises hidden refs.
              The actual references are only ever shown in the application
              drawer, so this count is the sole reference signal on the profile. */}
            {profile.referencesCount > 0 && !!profile.referencesConsentConfirmedAt && (
              <div
                style={{
                  background: 'var(--kt-surface)',
                  border: '1px solid var(--kt-border)',
                  borderRadius: 'var(--kt-radius-lg)',
                  padding: '14px 16px',
                  fontSize: 'var(--kt-text-xs)',
                  color: 'var(--kt-text-muted)',
                  lineHeight: 1.55,
                }}
              >
                <strong
                  style={{ color: 'var(--kt-text)', fontWeight: 'var(--kt-weight-semibold)' }}
                >
                  {profile.referencesCount}{' '}
                  {profile.referencesCount === 1 ? 'reference' : 'references'}
                </strong>{' '}
                available on application
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sidebar application row (compact; click → applicant drawer, Pipeline tab) ─

const ApplicationRow: React.FC<{
  applicant: CompanyApplicant
  onOpen: () => void
}> = ({ applicant, onOpen }) => {
  const noteCount = applicant.notes.length
  const handleKeyDown = (e: React.KeyboardEvent): void => {
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
      <span className={styles.appRowTitle}>{applicant.jobTitle}</span>
      <span className={styles.appRowMeta}>
        Applied {formatAppliedDate(applicant.appliedAt)} · {applicant.matchScore}% match
        {noteCount > 0 && ` · ${noteCount} ${noteCount === 1 ? 'note' : 'notes'}`}
      </span>
      {applicant.currentStageName && (
        <span className={styles.appRowStage}>{applicant.currentStageName}</span>
      )}
    </div>
  )
}
