import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Badge, Button } from '../../components'
import { RegulixBadge } from '../components/RegulixBadge/RegulixBadge'
import { useAuth } from '../context/AuthContext'
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
} from '../icons'
import { getFullWorkerProfile } from '../services/workerService'
import type { FullWorkerProfile } from '../services/workerService'
import { INDUSTRIES } from '../data/industries'
import styles from './WorkerProfilePage.module.css'

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
  const { user } = useAuth()
  const isOwnProfile = !!user && user.id === id

  const [profile, setProfile] = useState<FullWorkerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getFullWorkerProfile(id).then(({ data, error }) => {
      if (error) setFetchError(error)
      else setProfile(data)
      setLoading(false)
    })
  }, [id])

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
                  <Button variant="primary" size="md">
                    Message
                  </Button>
                  <Button variant="outline" size="md">
                    Save
                  </Button>
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

      {/* ── Body ─────────────────────────────────────────────────────────────── */}
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
                          style={{ color: 'var(--kt-text-muted)', flexShrink: 0, display: 'flex' }}
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
                          style={{ color: 'var(--kt-text-muted)', flexShrink: 0, display: 'flex' }}
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
                          onMouseOut={(e) => (e.currentTarget.style.color = 'var(--kt-text-muted)')}
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
          {/* Regulix status */}
          <div
            style={{
              background: profile.isRegulixReady ? 'var(--kt-olive-100)' : 'var(--kt-surface)',
              border: `1px solid ${profile.isRegulixReady ? 'var(--kt-olive-300)' : 'var(--kt-border)'}`,
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
            <RegulixBadge
              size="lg"
              variant={profile.isRegulixReady ? 'filled' : 'pending'}
              pulse={profile.isRegulixReady}
            />
            <p
              style={{
                marginTop: 10,
                fontSize: 'var(--kt-text-sm)',
                fontWeight: 'var(--kt-weight-semibold)',
                color: profile.isRegulixReady ? 'var(--kt-olive-800)' : 'var(--kt-text-muted)',
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

          {/* Stats */}
          {(profile.performanceScore != null ||
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
        </div>
      </div>
    </div>
  )
}
