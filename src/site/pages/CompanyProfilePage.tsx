import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Badge, Button, Modal, Textarea } from '../../components'
import {
  BuildingIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FlagIcon,
  GlobeIcon,
  LocationIcon,
  PhoneIcon,
  UsersIcon,
  VerifiedShieldIcon,
} from '../icons'
import { useAuth } from '../context/AuthContext'
import { getPublicCompanyProfile, reportPhoto } from '../services/companyService'
import type { PublicCompanyJob, PublicCompanyProfile } from '../services/companyService'
import { JobCard } from '../components/JobCard/JobCard'
import { QuickApplyModal } from '../components/QuickApplyModal/QuickApplyModal'
import { getAppliedJobIds } from '../services/jobService'
import type { Job } from '../types'
import { RegulixLogo } from '../components/RegulixLogo/RegulixLogo'
import { FEATURES } from '../config/features'
import { getIndustryById, INDUSTRIES } from '../data/industries'
import { getLicenseTypeById } from '../data/licenseTypes'
import { BENEFIT_GROUPS, CONTRACT_TYPE_OPTIONS } from './CompanyProfileEdit/types'
import styles from './CompanyProfilePage.module.css'

const CURRENT_YEAR = 2026

const industryLabel = (slug: string): string => {
  const found = INDUSTRIES.find((i) => i.slug === slug) ?? getIndustryById(slug)
  return found?.name ?? slug
}

const benefitLabel = (value: string): string => {
  for (const group of BENEFIT_GROUPS) {
    const b = group.benefits.find((b) => b.value === value)
    if (b) return b.label
  }
  return value
}

const contractTypeLabel = (value: string): string =>
  CONTRACT_TYPE_OPTIONS.find((c) => c.value === value)?.label ?? value

const licenseStatusBadge = (status: string, expirationDate: string | null): React.ReactNode => {
  const today = new Date().toISOString().slice(0, 10)
  if (expirationDate && expirationDate < today) {
    return <Badge variant="warning">Expired</Badge>
  }
  if (status === 'verified') return <Badge variant="success">Verified</Badge>
  if (status === 'pending') return <Badge variant="warning">Verifying…</Badge>
  if (status === 'failed') return <Badge variant="danger">Could not verify</Badge>
  return null
}

const SocialLink: React.FC<{ url: string; label: string }> = ({ url, label }) => (
  <a
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    style={{
      color: 'var(--kt-navy-500)',
      fontWeight: 'var(--kt-weight-bold)',
      textDecoration: 'none',
      fontSize: 'var(--kt-text-sm)',
    }}
  >
    {label}
  </a>
)

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section
    style={{
      background: 'var(--kt-surface)',
      border: '1px solid var(--kt-border)',
      borderRadius: 'var(--kt-radius-lg)',
      padding: 24,
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
    }}
  >
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
    {children}
  </section>
)

const SidebarCard: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div
    style={{
      background: 'var(--kt-surface)',
      border: '1px solid var(--kt-border)',
      borderRadius: 'var(--kt-radius-lg)',
      padding: 18,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}
  >
    <h2
      style={{
        fontSize: 'var(--kt-text-md)',
        fontWeight: 'var(--kt-weight-bold)',
        color: 'var(--kt-text)',
        margin: 0,
      }}
    >
      {title}
    </h2>
    {children}
  </div>
)

const QuickFact: React.FC<{ icon: React.ReactNode; label: string; children: React.ReactNode }> = ({
  icon,
  label,
  children,
}) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
    <span style={{ color: 'var(--kt-text-muted)', flexShrink: 0, display: 'flex', marginTop: 1 }}>
      {icon}
    </span>
    <div style={{ minWidth: 0 }}>
      <p
        style={{
          margin: 0,
          fontSize: 'var(--kt-text-xs)',
          color: 'var(--kt-text-muted)',
        }}
      >
        {label}
      </p>
      <div style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text)' }}>{children}</div>
    </div>
  </div>
)

export const CompanyProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, persona } = useAuth()
  const isOwnProfile = persona === 'company' && !!user?.id && user.id === id
  const isWorker = persona === 'worker'
  const [data, setData] = useState<PublicCompanyProfile | null>(null)
  const [appliedDates, setAppliedDates] = useState<Map<string, string>>(new Map())
  const [quickApplyJob, setQuickApplyJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [activeTab, setActiveTab] = useState<'about' | 'jobs'>('about')
  const [reportPhotoId, setReportPhotoId] = useState<string | null>(null)
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)
  const [reportReason, setReportReason] = useState('')
  const [reportStatus, setReportStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [reportError, setReportError] = useState('')

  const openReport = (photoId: string) => {
    setReportPhotoId(photoId)
    setReportReason('')
    setReportStatus('idle')
    setReportError('')
  }

  const closeReport = () => {
    if (reportStatus === 'sending') return
    setReportPhotoId(null)
  }

  const submitReport = async () => {
    if (!reportPhotoId) return
    setReportStatus('sending')
    const { error } = await reportPhoto(reportPhotoId, reportReason)
    if (error) {
      setReportStatus('error')
      setReportError(error)
      return
    }
    setReportStatus('sent')
  }

  const photoCount = data?.photos.length ?? 0
  const stepViewer = (delta: number) =>
    setViewerIndex((i) => (i === null ? null : (i + delta + photoCount) % photoCount))

  // Arrow-key navigation while the photo viewer is open
  useEffect(() => {
    if (viewerIndex === null || photoCount < 2) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') stepViewer(-1)
      if (e.key === 'ArrowRight') stepViewer(1)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [viewerIndex, photoCount])

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getPublicCompanyProfile(id).then(({ data, error }) => {
      setLoading(false)
      if (error || !data) {
        setNotFound(true)
        return
      }
      setData(data)
    })
  }, [id])

  // Workers see a Quick Apply affordance on each job card, so we need to know
  // which of this company's jobs they've already applied to. Companies don't
  // apply, so we skip the fetch for them.
  useEffect(() => {
    if (!isWorker || !user?.id) return
    getAppliedJobIds(user.id).then(({ data }) => {
      setAppliedDates(new Map(data.map((r) => [r.jobId, r.appliedAt])))
    })
  }, [isWorker, user?.id])

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--kt-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--kt-text-muted)',
        }}
      >
        Loading…
      </div>
    )
  }

  if (notFound || !data) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--kt-bg)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
        }}
      >
        <h1 style={{ margin: 0 }}>Company not found</h1>
        <p style={{ color: 'var(--kt-text-muted)', margin: 0 }}>
          This company may have been deleted or moved.
        </p>
        <Button variant="outline" onClick={() => navigate('/site/jobs')}>
          Browse jobs
        </Button>
      </div>
    )
  }

  const yearsInBusiness =
    data.founded && data.founded >= 1800 && data.founded <= CURRENT_YEAR
      ? CURRENT_YEAR - data.founded
      : null

  const locationLabel =
    data.hq_full_address || [data.hq_city, data.hq_state].filter(Boolean).join(', ')

  const initials = data.name.slice(0, 2).toUpperCase()

  // Map a profile's lightweight job row onto the full Job shape the shared
  // JobCard renders, so the company-profile Jobs tab matches the worker's
  // Find Jobs cards exactly. Fields the public profile query doesn't fetch
  // (skills, description, applicant counts) stay empty — the card hides them.
  const toJobCardModel = (j: PublicCompanyJob): Job => ({
    id: j.id,
    companyId: data.id,
    company: {
      id: data.id,
      name: data.name,
      logo: data.logo_url ?? '',
      location: locationLabel,
      industry: data.industry,
      isVerified: data.is_verified,
      description: data.description,
      size: data.size,
      website: data.website,
    },
    title: j.title,
    industry: j.industry,
    industrySlug: j.industry_slug,
    type: (j.type ?? 'Full-time') as Job['type'],
    location: j.location || locationLabel,
    payMin: j.pay_min ?? 0,
    payMax: j.pay_max ?? 0,
    payType: (j.pay_type ?? 'hour') as Job['payType'],
    description: '',
    requirements: [],
    skills: j.skills ?? [],
    isSponsored: false,
    regulixReadyApplicants: 0,
    totalApplicants: 0,
    viewCount: 0,
    postedDaysAgo: Math.max(
      0,
      Math.floor((Date.now() - new Date(j.created_at).getTime()) / 86_400_000)
    ),
    createdAt: j.created_at,
    status: 'active',
  })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--kt-bg)' }}>
      {/* Hero */}
      <div style={{ background: 'var(--kt-surface)' }}>
        <div className={styles.heroInner}>
          <div className={styles.profileRow}>
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: 'var(--kt-radius-lg)',
                background: 'var(--kt-primary)',
                color: 'var(--kt-primary-fg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'var(--kt-weight-bold)',
                fontSize: 'var(--kt-text-2xl)',
                flexShrink: 0,
                overflow: 'hidden',
              }}
            >
              {data.logo_url ? (
                <img
                  src={data.logo_url}
                  alt={data.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                initials
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  flexWrap: 'wrap',
                  marginBottom: 4,
                }}
              >
                <h1
                  style={{
                    fontSize: 'var(--kt-text-2xl)',
                    fontWeight: 'var(--kt-weight-bold)',
                    color: 'var(--kt-text)',
                    margin: 0,
                  }}
                >
                  {data.name}
                </h1>
                {data.is_verified && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 'var(--kt-text-xs)',
                      color: 'var(--kt-accent)',
                      fontWeight: 'var(--kt-weight-medium)',
                    }}
                  >
                    <VerifiedShieldIcon size={14} color="var(--kt-olive-600)" /> Verified
                  </span>
                )}
              </div>
              {data.tagline && (
                <p
                  style={{
                    fontSize: 'var(--kt-text-sm)',
                    color: 'var(--kt-text-muted)',
                    margin: 0,
                  }}
                >
                  {data.tagline}
                </p>
              )}
            </div>
            <div className={styles.profileActions}>
              {isOwnProfile ? (
                <Button variant="primary" onClick={() => navigate('/site/settings/profile')}>
                  Edit profile
                </Button>
              ) : (
                <Button variant="primary" onClick={() => navigate('/site/messages')}>
                  Message company
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          background: 'var(--kt-surface)',
          position: 'sticky',
          top: 64,
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: 960,
            margin: '0 auto',
            padding: '0 var(--kt-space-6)',
            borderBottom: '1px solid var(--kt-border)',
            display: 'flex',
            gap: 8,
          }}
        >
          {(['about', 'jobs'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '12px 20px',
                border: 'none',
                borderBottom: `2px solid ${
                  activeTab === tab ? 'var(--kt-primary)' : 'transparent'
                }`,
                background: 'transparent',
                color: activeTab === tab ? 'var(--kt-text)' : 'var(--kt-text-muted)',
                fontWeight: activeTab === tab ? 'var(--kt-weight-bold)' : 'var(--kt-weight-medium)',
                fontSize: 'var(--kt-text-sm)',
                cursor: 'pointer',
                fontFamily: 'var(--kt-font-sans)',
              }}
            >
              {tab === 'about'
                ? 'About'
                : `Jobs${data.jobs.length ? ` · ${data.jobs.length}` : ''}`}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className={styles.body}>
        {activeTab === 'about' && (
          <>
            <div className={styles.aboutGrid}>
              <div className={styles.main}>
                {data.description && (
                  <Section title="About">
                    <p
                      style={{
                        margin: 0,
                        whiteSpace: 'pre-wrap',
                        fontSize: 'var(--kt-text-sm)',
                        color: 'var(--kt-text)',
                        lineHeight: 1.6,
                      }}
                    >
                      {data.description}
                    </p>
                  </Section>
                )}

                {data.licenses.length > 0 && (
                  <Section title="Licenses & credentials">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {data.licenses.map((l) => {
                        const typeLabel =
                          getLicenseTypeById(l.license_type)?.label ?? l.license_type
                        return (
                          <div
                            key={l.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '10px 0',
                              borderBottom:
                                data.licenses.length > 1 ? '1px solid var(--kt-border)' : 'none',
                            }}
                          >
                            <div>
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: 'var(--kt-text-sm)',
                                  fontWeight: 'var(--kt-weight-medium)',
                                  color: 'var(--kt-text)',
                                }}
                              >
                                {typeLabel}{' '}
                                <span style={{ color: 'var(--kt-text-muted)' }}>
                                  · {l.jurisdiction}
                                </span>
                              </p>
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: 'var(--kt-text-xs)',
                                  color: 'var(--kt-text-muted)',
                                }}
                              >
                                License #{l.license_number}
                                {l.expiration_date && ` · expires ${l.expiration_date}`}
                              </p>
                            </div>
                            {licenseStatusBadge(l.verification_status, l.expiration_date)}
                          </div>
                        )
                      })}
                    </div>
                  </Section>
                )}

                {data.benefits.length > 0 && (
                  <Section title="Benefits & perks">
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {data.benefits.map((b) => (
                        <Badge key={b} variant="secondary">
                          {benefitLabel(b)}
                        </Badge>
                      ))}
                    </div>
                  </Section>
                )}

                {data.contract_types.length > 0 && (
                  <Section title="Typical contract types">
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {data.contract_types.map((c) => (
                        <Badge key={c} variant="secondary">
                          {contractTypeLabel(c)}
                        </Badge>
                      ))}
                    </div>
                  </Section>
                )}

                {data.additional_industries.length > 0 && (
                  <Section title="Industries">
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      <Badge variant="primary">{industryLabel(data.industry)}</Badge>
                      {data.additional_industries.map((slug) => (
                        <Badge key={slug} variant="neutral">
                          {industryLabel(slug)}
                        </Badge>
                      ))}
                    </div>
                  </Section>
                )}
              </div>

              <div className={styles.sidebar}>
                {/* Regulix status — matches the worker profile's box; greyed out
                  when the company hasn't connected Regulix. Hidden entirely until
                  the Regulix partner connection is live. */}
                {FEATURES.regulix && (
                  <div
                    style={{
                      background: data.regulix_connected
                        ? 'var(--kt-regulix-50)'
                        : 'var(--kt-surface-raised)',
                      borderRadius: 'var(--kt-radius-lg)',
                      padding: 18,
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                    }}
                  >
                    <RegulixLogo
                      height={24}
                      textColor={
                        data.regulix_connected ? 'var(--kt-navy-700)' : 'var(--kt-text-muted)'
                      }
                      opacity={data.regulix_connected ? 1 : 0.45}
                    />
                    <p
                      style={{
                        marginTop: 10,
                        fontSize: 'var(--kt-text-sm)',
                        fontWeight: 'var(--kt-weight-semibold)',
                        color: data.regulix_connected
                          ? 'var(--kt-regulix-500)'
                          : 'var(--kt-text-muted)',
                      }}
                    >
                      {data.regulix_connected ? 'Regulix Connected' : 'Not on Regulix'}
                    </p>
                    <p
                      style={{
                        fontSize: 'var(--kt-text-xs)',
                        color: 'var(--kt-text-muted)',
                        marginTop: 4,
                        lineHeight: 1.5,
                      }}
                    >
                      {data.regulix_connected
                        ? 'Verified workforce compliance through Regulix.'
                        : 'This company has not connected Regulix yet.'}
                    </p>
                  </div>
                )}

                <SidebarCard title="Company details">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {data.industry && (
                      <QuickFact icon={<BuildingIcon size={15} />} label="Industry">
                        {industryLabel(data.industry)}
                      </QuickFact>
                    )}
                    {data.founded && (
                      <QuickFact icon={<CalendarIcon size={15} />} label="Founded">
                        {data.founded}
                        {yearsInBusiness !== null && (
                          <span style={{ color: 'var(--kt-text-muted)' }}>
                            {' '}
                            · {yearsInBusiness} {yearsInBusiness === 1 ? 'yr' : 'yrs'}
                          </span>
                        )}
                      </QuickFact>
                    )}
                    {data.size && (
                      <QuickFact icon={<UsersIcon size={15} />} label="Company size">
                        {data.size} employees
                      </QuickFact>
                    )}
                    {locationLabel && (
                      <QuickFact icon={<LocationIcon size={15} />} label="Location">
                        {locationLabel}
                      </QuickFact>
                    )}
                    {data.phone && (
                      <QuickFact icon={<PhoneIcon size={15} />} label="Phone">
                        {data.phone}
                      </QuickFact>
                    )}
                    {(data.website ||
                      data.facebook_url ||
                      data.instagram_url ||
                      data.linkedin_url ||
                      data.youtube_url ||
                      data.tiktok_url) && (
                      <QuickFact icon={<GlobeIcon size={15} />} label="Links">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {data.website && (
                            <SocialLink url={data.website} label="Company Website" />
                          )}
                          {data.facebook_url && (
                            <SocialLink url={data.facebook_url} label="Facebook" />
                          )}
                          {data.instagram_url && (
                            <SocialLink url={data.instagram_url} label="Instagram" />
                          )}
                          {data.linkedin_url && (
                            <SocialLink url={data.linkedin_url} label="LinkedIn" />
                          )}
                          {data.youtube_url && (
                            <SocialLink url={data.youtube_url} label="YouTube" />
                          )}
                          {data.tiktok_url && <SocialLink url={data.tiktok_url} label="TikTok" />}
                        </div>
                      </QuickFact>
                    )}
                  </div>
                </SidebarCard>
              </div>
            </div>

            {data.photos.length > 0 && (
              <section
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  marginTop: 24,
                }}
              >
                <h2
                  style={{
                    fontSize: 'var(--kt-text-lg)',
                    fontWeight: 'var(--kt-weight-bold)',
                    color: 'var(--kt-text)',
                    margin: 0,
                  }}
                >
                  Photos
                </h2>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                    gap: 12,
                  }}
                >
                  {data.photos.map((p, i) => (
                    <figure
                      key={p.id}
                      style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}
                    >
                      <div className={styles.photoFrame}>
                        <img
                          src={p.url}
                          alt={p.caption || 'Company photo'}
                          className={styles.photoImg}
                          onClick={() => setViewerIndex(i)}
                        />
                        <button
                          type="button"
                          onClick={() => openReport(p.id)}
                          aria-label="Report this photo"
                          title="Report this photo"
                          className={styles.reportBtn}
                        >
                          <FlagIcon size={13} color="var(--kt-white)" />
                        </button>
                      </div>
                      {p.caption && (
                        <figcaption
                          style={{
                            fontSize: 'var(--kt-text-xs)',
                            color: 'var(--kt-text-muted)',
                          }}
                        >
                          {p.caption}
                        </figcaption>
                      )}
                    </figure>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {activeTab === 'jobs' && (
          <Section title={`Open jobs · ${data.jobs.length}`}>
            {data.jobs.length === 0 ? (
              <p
                style={{ margin: 0, color: 'var(--kt-text-muted)', fontSize: 'var(--kt-text-sm)' }}
              >
                No open jobs right now. Check back soon.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {data.jobs.map((j) => {
                  const job = toJobCardModel(j)
                  return (
                    <JobCard
                      key={j.id}
                      job={job}
                      appliedAt={isWorker ? (appliedDates.get(j.id) ?? null) : null}
                      onQuickApply={isWorker ? () => setQuickApplyJob(job) : undefined}
                    />
                  )
                })}
              </div>
            )}
          </Section>
        )}
      </div>

      {/* Photo viewer — click a photo to see it larger; scroll with ‹ › */}
      <Modal
        open={viewerIndex !== null}
        onClose={() => setViewerIndex(null)}
        size="lg"
        title={
          (viewerIndex !== null && data.photos[viewerIndex]?.caption) ||
          (photoCount > 1 && viewerIndex !== null
            ? `Photo ${viewerIndex + 1} of ${photoCount}`
            : undefined)
        }
        showClose
      >
        {viewerIndex !== null && data.photos[viewerIndex] && (
          <div className={styles.viewerFrame}>
            <img
              src={data.photos[viewerIndex].url}
              alt={data.photos[viewerIndex].caption || 'Company photo'}
              className={styles.viewerImg}
            />
            {photoCount > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => stepViewer(-1)}
                  aria-label="Previous photo"
                  className={`${styles.viewerNav} ${styles.viewerNavPrev}`}
                >
                  <ChevronLeftIcon size={22} color="var(--kt-white)" />
                </button>
                <button
                  type="button"
                  onClick={() => stepViewer(1)}
                  aria-label="Next photo"
                  className={`${styles.viewerNav} ${styles.viewerNavNext}`}
                >
                  <ChevronRightIcon size={22} color="var(--kt-white)" />
                </button>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Photo report modal — spec §4.5 */}
      <Modal
        open={!!reportPhotoId}
        onClose={closeReport}
        size="sm"
        title={reportStatus === 'sent' ? 'Thanks for the report' : 'Report this photo'}
        footer={
          reportStatus === 'sent' ? (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="primary" onClick={closeReport}>
                Close
              </Button>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button variant="ghost" onClick={closeReport} disabled={reportStatus === 'sending'}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={submitReport}
                disabled={reportStatus === 'sending'}
              >
                {reportStatus === 'sending' ? 'Sending…' : 'Submit report'}
              </Button>
            </div>
          )
        }
      >
        {reportStatus === 'sent' ? (
          <p style={{ margin: 0, fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text)' }}>
            We logged your report. Our team will review reported content as moderation tools come
            online.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ margin: 0, fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text)' }}>
              Tell us briefly what's wrong with this photo. Reports are sent to the krewtree team.
            </p>
            <Textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="e.g. offensive content, not the company's work, misleading…"
              rows={4}
            />
            {reportStatus === 'error' && (
              <p style={{ margin: 0, fontSize: 'var(--kt-text-sm)', color: 'var(--kt-danger)' }}>
                {reportError}
              </p>
            )}
          </div>
        )}
      </Modal>

      {/* Quick Apply — workers only; companies don't apply to jobs */}
      {quickApplyJob && (
        <QuickApplyModal
          job={quickApplyJob}
          open={!!quickApplyJob}
          onClose={() => setQuickApplyJob(null)}
          onApplied={(jobId) =>
            setAppliedDates((prev) => new Map(prev).set(jobId, new Date().toISOString()))
          }
        />
      )}
    </div>
  )
}
