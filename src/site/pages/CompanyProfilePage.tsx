import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Badge, Button, Modal, Textarea } from '../../components'
import {
  BuildingIcon,
  CalendarIcon,
  FlagIcon,
  GlobeIcon,
  LocationIcon,
  PhoneIcon,
  UsersIcon,
  VerifiedShieldIcon,
} from '../icons'
import { getPublicCompanyProfile, reportPhoto } from '../services/companyService'
import type { PublicCompanyProfile } from '../services/companyService'
import { RegulixLogo } from '../components/RegulixLogo/RegulixLogo'
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
  const [data, setData] = useState<PublicCompanyProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [activeTab, setActiveTab] = useState<'about' | 'jobs'>('about')
  const [reportPhotoId, setReportPhotoId] = useState<string | null>(null)
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
              <Button variant="primary" onClick={() => navigate('/site/messages')}>
                Message company
              </Button>
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
                  {yearsInBusiness !== null && (
                    <p
                      style={{
                        margin: 0,
                        fontSize: 'var(--kt-text-xs)',
                        color: 'var(--kt-text-muted)',
                      }}
                    >
                      In business {yearsInBusiness} {yearsInBusiness === 1 ? 'year' : 'years'}.
                    </p>
                  )}
                </Section>
              )}

              {data.photos.length > 0 && (
                <Section title="Photos">
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                      gap: 12,
                    }}
                  >
                    {data.photos.map((p) => (
                      <figure
                        key={p.id}
                        style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}
                      >
                        <div style={{ position: 'relative' }}>
                          <img
                            src={p.url}
                            alt={p.caption || 'Company photo'}
                            style={{
                              width: '100%',
                              aspectRatio: '1 / 1',
                              objectFit: 'cover',
                              borderRadius: 'var(--kt-radius-md)',
                              background: 'var(--kt-bg-subtle)',
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => openReport(p.id)}
                            aria-label="Report this photo"
                            title="Report this photo"
                            style={{
                              position: 'absolute',
                              top: 6,
                              right: 6,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '4px 8px',
                              background: 'rgba(0, 0, 0, 0.55)',
                              color: 'white',
                              border: 'none',
                              borderRadius: 'var(--kt-radius-sm)',
                              cursor: 'pointer',
                              fontSize: 11,
                              fontFamily: 'var(--kt-font-sans)',
                            }}
                          >
                            <FlagIcon size={11} color="white" /> Report
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
                </Section>
              )}

              {data.licenses.length > 0 && (
                <Section title="Licenses & credentials">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {data.licenses.map((l) => {
                      const typeLabel = getLicenseTypeById(l.license_type)?.label ?? l.license_type
                      return (
                        <div
                          key={l.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '10px 0',
                            borderBottom: '1px solid var(--kt-border)',
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
                      <Badge key={b} variant="neutral">
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

              {(data.facebook_url ||
                data.instagram_url ||
                data.linkedin_url ||
                data.youtube_url ||
                data.tiktok_url) && (
                <Section title="Social">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                    {data.facebook_url && <SocialLink url={data.facebook_url} label="Facebook" />}
                    {data.instagram_url && (
                      <SocialLink url={data.instagram_url} label="Instagram" />
                    )}
                    {data.linkedin_url && <SocialLink url={data.linkedin_url} label="LinkedIn" />}
                    {data.youtube_url && <SocialLink url={data.youtube_url} label="YouTube" />}
                    {data.tiktok_url && <SocialLink url={data.tiktok_url} label="TikTok" />}
                  </div>
                </Section>
              )}
            </div>

            <div className={styles.sidebar}>
              {/* Regulix status — matches the worker profile's box; greyed out
                  when the company hasn't connected Regulix. */}
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
                  textColor={data.regulix_connected ? 'var(--kt-navy-700)' : 'var(--kt-text-muted)'}
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
                  {data.website && (
                    <QuickFact icon={<GlobeIcon size={15} />} label="Website">
                      <a
                        href={data.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: 'var(--kt-navy-500)',
                          fontWeight: 'var(--kt-weight-bold)',
                          textDecoration: 'none',
                          wordBreak: 'break-word',
                        }}
                      >
                        {data.website.replace(/^https?:\/\//, '')}
                      </a>
                    </QuickFact>
                  )}
                </div>
              </SidebarCard>
            </div>
          </div>
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
                {data.jobs.map((j) => (
                  <button
                    key={j.id}
                    onClick={() => navigate(`/site/jobs/${j.id}`)}
                    style={{
                      textAlign: 'left',
                      background: 'var(--kt-surface)',
                      border: '1px solid var(--kt-border)',
                      borderRadius: 'var(--kt-radius-md)',
                      padding: 14,
                      cursor: 'pointer',
                      fontFamily: 'var(--kt-font-sans)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                    }}
                  >
                    <strong style={{ fontSize: 'var(--kt-text-md)', color: 'var(--kt-text)' }}>
                      {j.title}
                    </strong>
                    <span
                      style={{
                        fontSize: 'var(--kt-text-xs)',
                        color: 'var(--kt-text-muted)',
                      }}
                    >
                      {j.location || locationLabel}
                      {j.industry && ` · ${j.industry}`}
                      {j.type && ` · ${j.type}`}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </Section>
        )}
      </div>

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
    </div>
  )
}
