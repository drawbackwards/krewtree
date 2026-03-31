import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Badge, Button, Divider, Alert, Modal } from '../../components'
import { RegulixBadge } from '../components/RegulixBadge/RegulixBadge'
import { QuickApplyModal } from '../components/QuickApplyModal/QuickApplyModal'
import { jobs, companyDetails } from '../data/mock'
import { useAuth } from '../context/AuthContext'
import { getJobById } from '../services/jobService'
import type { Job } from '../types'
import {
  CheckIcon,
  MapPinIcon,
  ClockIcon,
  DollarIcon,
  UsersIcon,
  ShareIcon,
  BookmarkIcon,
  RegulixMarkIcon,
  BuildingIcon,
  GlobeIcon,
  VerifiedBadgeIcon,
  LinkedInIcon,
  XIcon,
  FacebookIcon,
  EnvelopeIcon,
  LinkIcon,
  LightningIcon,
  StarIcon,
  SearchIcon,
} from '../icons'

const EXPERIENCE_LABELS: Record<string, string> = {
  entry: 'Entry Level (0–1 yr)',
  mid: 'Mid Level (1–3 yrs)',
  senior: 'Senior (3–5 yrs)',
  lead: 'Lead / Expert (5+ yrs)',
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const JobDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { persona, user } = useAuth()
  const isCompany = persona === 'company'
  const [applied, setApplied] = useState(false)
  const [saved, setSaved] = useState(false)
  const [quickApplyOpen, setQuickApplyOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [manageOpen, setManageOpen] = useState(false)
  const [pauseDuration, setPauseDuration] = useState<'7d' | '30d' | 'indefinite'>('7d')
  const [manageAction, setManageAction] = useState<'pause' | 'archive'>('pause')
  const [job, setJob] = useState<Job | null | undefined>(undefined)
  const [detail, setDetail] = useState<ReturnType<typeof companyDetails.find>>(undefined)

  useEffect(() => {
    if (!id) {
      setJob(null)
      return
    }

    if (UUID_RE.test(id)) {
      getJobById(id).then(({ data }) => setJob(data))
    } else {
      const mockJob = jobs.find((j) => j.id === id) ?? null
      setJob(mockJob)
      setDetail(mockJob ? companyDetails.find((d) => d.companyId === mockJob.companyId) : undefined)
    }
  }, [id, user])

  // Loading state
  if (job === undefined) {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p style={{ color: 'var(--kt-text-muted)', fontSize: 'var(--kt-text-sm)' }}>Loading…</p>
      </div>
    )
  }

  if (!job) {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
        }}
      >
        <div style={{ color: 'var(--kt-text-muted)' }}>
          <SearchIcon size={48} />
        </div>
        <p
          style={{
            fontSize: 'var(--kt-text-xl)',
            fontWeight: 'var(--kt-weight-semibold)',
            color: 'var(--kt-text)',
          }}
        >
          Job not found
        </p>
        <Button variant="primary" onClick={() => navigate('/site/jobs')}>
          Back to Jobs
        </Button>
      </div>
    )
  }

  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''
  const shareText = `${job.title} at ${job.company.name} — ${job.location}`
  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const questions = job.preInterviewQuestions ?? []
  const postedLabel =
    job.postedDaysAgo === 0
      ? 'Today'
      : job.postedDaysAgo === 1
        ? 'Yesterday'
        : `${job.postedDaysAgo} days ago`
  const hasPayData = job.payMin > 0 && job.payMax > 0
  const payLabel = hasPayData
    ? job.payType === 'hour'
      ? `$${job.payMin}–$${job.payMax}/hr`
      : `$${((job.payMin * 2080) / 1000).toFixed(0)}K–$${((job.payMax * 2080) / 1000).toFixed(0)}K/yr`
    : null

  return (
    <div style={{ minHeight: '100vh', background: 'var(--kt-bg)' }}>
      {/* Header breadcrumb */}
      <div style={{ background: 'var(--kt-surface)', borderBottom: '1px solid var(--kt-border)' }}>
        <div
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            padding: '12px var(--kt-space-6)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Link
            to="/site/jobs"
            style={{
              color: 'var(--kt-text-muted)',
              fontSize: 'var(--kt-text-sm)',
              textDecoration: 'none',
            }}
          >
            Jobs
          </Link>
          <span style={{ color: 'var(--kt-text-placeholder)', fontSize: 'var(--kt-text-sm)' }}>
            ›
          </span>
          <span style={{ color: 'var(--kt-text-muted)', fontSize: 'var(--kt-text-sm)' }}>
            {job.industry}
          </span>
          <span style={{ color: 'var(--kt-text-placeholder)', fontSize: 'var(--kt-text-sm)' }}>
            ›
          </span>
          <span
            style={{
              color: 'var(--kt-text)',
              fontSize: 'var(--kt-text-sm)',
              fontWeight: 'var(--kt-weight-medium)',
            }}
          >
            {job.title}
          </span>
        </div>
      </div>

      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '32px var(--kt-space-6)',
          display: 'flex',
          gap: 28,
          alignItems: 'flex-start',
        }}
      >
        {/* ---- Main Content ---- */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Job Header Card */}
          <div
            style={{
              background:
                !isCompany && job.isSponsored
                  ? 'linear-gradient(135deg, var(--kt-olive-50) 0%, var(--kt-surface) 60%)'
                  : 'var(--kt-surface)',
              border: `1px solid ${!isCompany && job.isSponsored ? 'var(--kt-olive-200)' : 'var(--kt-border)'}`,
              borderRadius: 'var(--kt-radius-lg)',
              padding: 28,
            }}
          >
            {job.isSponsored && (
              <div style={{ marginBottom: 14 }}>
                <Badge variant="accent" size="sm">
                  Featured Position
                </Badge>
              </div>
            )}

            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              {/* Company logo */}
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 12,
                  background: 'var(--kt-grey-100)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--kt-grey-700)',
                  fontWeight: 'var(--kt-weight-bold)',
                  fontSize: 'var(--kt-text-xl)',
                  flexShrink: 0,
                  border: '1px solid var(--kt-border)',
                }}
              >
                {job.company.name.charAt(0)}
              </div>

              <div style={{ flex: 1 }}>
                <h1
                  style={{
                    fontSize: 'var(--kt-text-2xl)',
                    fontWeight: 'var(--kt-weight-bold)',
                    color: 'var(--kt-text)',
                    marginBottom: 6,
                  }}
                >
                  {job.title}
                </h1>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 14,
                    flexWrap: 'wrap',
                  }}
                >
                  <Link
                    to={`/site/company/${job.companyId}`}
                    style={{
                      fontSize: 'var(--kt-text-md)',
                      color: 'var(--kt-primary)',
                      fontWeight: 'var(--kt-weight-medium)',
                      textDecoration: 'none',
                    }}
                  >
                    {job.company.name}
                  </Link>
                  {job.company.isVerified && (
                    <VerifiedBadgeIcon size={14} color="var(--kt-accent)" />
                  )}
                  <span style={{ color: 'var(--kt-border-strong)' }}>·</span>
                  <Badge variant="secondary" size="sm">
                    {job.type}
                  </Badge>
                </div>

                {/* Meta row */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                  {[
                    { icon: <MapPinIcon size={14} />, label: job.location },
                    ...(payLabel ? [{ icon: <DollarIcon size={14} />, label: payLabel }] : []),
                    ...(job.experienceLevel && EXPERIENCE_LABELS[job.experienceLevel]
                      ? [
                          {
                            icon: <StarIcon size={14} />,
                            label: EXPERIENCE_LABELS[job.experienceLevel],
                          },
                        ]
                      : []),
                    { icon: <ClockIcon size={14} />, label: `Posted ${postedLabel}` },
                    ...(isCompany
                      ? [
                          {
                            icon: <UsersIcon size={14} />,
                            label: `${job.totalApplicants} applicants`,
                          },
                        ]
                      : []),
                  ].map(({ icon, label }) => (
                    <div
                      key={label}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        color: 'var(--kt-text-muted)',
                        fontSize: 'var(--kt-text-sm)',
                      }}
                    >
                      {icon}
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Save / Share */}
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                {!isCompany && (
                  <button
                    onClick={() => setSaved((s) => !s)}
                    title={saved ? 'Saved' : 'Save job'}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 'var(--kt-radius-md)',
                      border: '1px solid var(--kt-border)',
                      background: saved ? 'var(--kt-primary-subtle)' : 'transparent',
                      color: saved ? 'var(--kt-primary)' : 'var(--kt-text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all var(--kt-duration-fast)',
                    }}
                  >
                    <BookmarkIcon size={16} />
                  </button>
                )}
                <button
                  title="Share"
                  onClick={() => setShareOpen(true)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 'var(--kt-radius-md)',
                    border: '1px solid var(--kt-border)',
                    background: 'transparent',
                    color: 'var(--kt-text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all var(--kt-duration-fast)',
                  }}
                >
                  <ShareIcon size={16} />
                </button>
              </div>
            </div>

            {/* Skills */}
            {job.skills.length > 0 && (
              <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {job.skills.map((s) => (
                  <span
                    key={s}
                    style={{
                      padding: '4px 12px',
                      borderRadius: 'var(--kt-radius-full)',
                      background: 'var(--kt-primary-subtle)',
                      color: 'var(--kt-primary)',
                      fontSize: 'var(--kt-text-xs)',
                      fontWeight: 'var(--kt-weight-medium)',
                      border: '1px solid var(--kt-primary-subtle)',
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Regulix Ready Info Banner — worker view only; shown in sidebar for company */}
          {!isCompany && job.regulixReadyApplicants > 0 && (
            <div
              style={{
                background: 'var(--kt-olive-100)',
                border: '1px solid var(--kt-olive-200)',
                borderRadius: 'var(--kt-radius-lg)',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <RegulixBadge size="lg" pulse />
              <div>
                <p
                  style={{
                    fontWeight: 'var(--kt-weight-semibold)',
                    color: 'var(--kt-navy-900)',
                    fontSize: 'var(--kt-text-sm)',
                    marginBottom: 2,
                  }}
                >
                  {job.regulixReadyApplicants} Regulix Ready Applicants
                </p>
                <p style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-text-muted)' }}>
                  These candidates have completed W-4, I-9, direct deposit setup, and drug screening
                  — ready to start Day 1.
                </p>
              </div>
              <Link
                to="/site/dashboard/company"
                style={{ marginLeft: 'auto', textDecoration: 'none', flexShrink: 0 }}
              >
                <Button variant="accent" size="sm">
                  View Candidates
                </Button>
              </Link>
            </div>
          )}

          {/* Description */}
          <div
            style={{
              background: 'var(--kt-surface)',
              border: '1px solid var(--kt-border)',
              borderRadius: 'var(--kt-radius-lg)',
              padding: 28,
            }}
          >
            <h2
              style={{
                fontSize: 'var(--kt-text-lg)',
                fontWeight: 'var(--kt-weight-semibold)',
                color: 'var(--kt-text)',
                marginBottom: 14,
              }}
            >
              About the Role
            </h2>
            <p
              style={{
                fontSize: 'var(--kt-text-sm)',
                color: 'var(--kt-text)',
                lineHeight: 1.7,
                marginBottom: 0,
              }}
            >
              {job.description}
            </p>
          </div>

          {/* Requirements */}
          {job.requirements.length > 0 && (
            <div
              style={{
                background: 'var(--kt-surface)',
                border: '1px solid var(--kt-border)',
                borderRadius: 'var(--kt-radius-lg)',
                padding: 28,
              }}
            >
              <h2
                style={{
                  fontSize: 'var(--kt-text-lg)',
                  fontWeight: 'var(--kt-weight-semibold)',
                  color: 'var(--kt-text)',
                  marginBottom: 16,
                }}
              >
                Requirements
              </h2>
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                {job.requirements.map((req, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: 'var(--kt-olive-100)',
                        color: 'var(--kt-accent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: 1,
                      }}
                    >
                      <CheckIcon size={14} />
                    </span>
                    <span
                      style={{
                        fontSize: 'var(--kt-text-sm)',
                        color: 'var(--kt-text)',
                        lineHeight: 1.5,
                      }}
                    >
                      {req}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Pre-Interview Questions Preview */}
          {questions.length > 0 && (
            <div
              style={{
                background: 'var(--kt-surface)',
                border: '1px solid var(--kt-border)',
                borderRadius: 'var(--kt-radius-lg)',
                padding: 28,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 16,
                  gap: 12,
                }}
              >
                <div>
                  <h2
                    style={{
                      fontSize: 'var(--kt-text-lg)',
                      fontWeight: 'var(--kt-weight-semibold)',
                      color: 'var(--kt-text)',
                      marginBottom: 4,
                    }}
                  >
                    Pre-Interview Questions
                  </h2>
                  <p style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-text-muted)' }}>
                    Answering these questions will be part of your application.
                  </p>
                </div>
                <Badge variant="info" size="sm">
                  {questions.length} questions
                </Badge>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {questions.map((q, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      gap: 12,
                      padding: '12px 14px',
                      background: 'var(--kt-bg)',
                      borderRadius: 'var(--kt-radius-md)',
                      border: '1px solid var(--kt-border)',
                    }}
                  >
                    <span
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        background: 'var(--kt-primary-subtle)',
                        color: 'var(--kt-primary)',
                        fontSize: 'var(--kt-text-xs)',
                        fontWeight: 'var(--kt-weight-bold)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {i + 1}
                    </span>
                    <span
                      style={{
                        fontSize: 'var(--kt-text-sm)',
                        color: 'var(--kt-text)',
                        lineHeight: 1.5,
                      }}
                    >
                      {q}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ---- Sidebar ---- */}
        <div
          style={{
            width: 300,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            position: 'sticky',
            top: 80,
          }}
        >
          {isCompany ? (
            /* ── Company: manage listing + Regulix applicants ── */
            <div
              style={{
                background: 'var(--kt-surface)',
                border: '1px solid var(--kt-border)',
                borderRadius: 'var(--kt-radius-lg)',
                padding: 20,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Link to={`/site/post-job/${job.id}`} style={{ textDecoration: 'none' }}>
                  <Button variant="primary" style={{ width: '100%' }}>
                    Edit Job
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  style={{ width: '100%' }}
                  onClick={() => setManageOpen(true)}
                >
                  Manage Listing
                </Button>
                <Link to="/site/dashboard/company" style={{ textDecoration: 'none' }}>
                  <Button variant="ghost" style={{ width: '100%' }}>
                    View Pipeline →
                  </Button>
                </Link>
              </div>

              {job.totalApplicants > 0 && (
                <>
                  <Divider style={{ margin: '16px 0' }} />

                  {/* Applicant split — green wrapper card */}
                  <div
                    style={{
                      background: 'rgba(109, 117, 49, 0.07)',
                      border: '1px solid var(--kt-olive-200)',
                      borderRadius: 'var(--kt-radius-md)',
                      padding: '12px',
                    }}
                  >
                    <p
                      style={{
                        fontSize: 'var(--kt-text-xs)',
                        fontWeight: 'var(--kt-weight-semibold)',
                        color: 'var(--kt-navy-900)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.6px',
                        marginBottom: 10,
                      }}
                    >
                      Job Applicants
                    </p>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 8,
                        marginBottom: 10,
                      }}
                    >
                      {/* Regulix Ready box */}
                      <div
                        style={{
                          background: 'rgba(109, 117, 49, 0.09)',
                          borderRadius: 'var(--kt-radius-sm)',
                          padding: '10px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6,
                        }}
                      >
                        <RegulixMarkIcon size={20} />
                        <div>
                          <p
                            style={{
                              fontSize: 'var(--kt-text-xl)',
                              fontWeight: 'var(--kt-weight-bold)',
                              color: 'var(--kt-navy-900)',
                              lineHeight: 1,
                              marginBottom: 3,
                            }}
                          >
                            {job.regulixReadyApplicants}
                          </p>
                          <p
                            style={{
                              fontSize: 'var(--kt-text-xs)',
                              color: 'var(--kt-text-muted)',
                              lineHeight: 1.3,
                            }}
                          >
                            Regulix Ready
                          </p>
                        </div>
                      </div>

                      {/* Standard applicants box */}
                      <div
                        style={{
                          background: 'var(--kt-surface)',
                          borderRadius: 'var(--kt-radius-sm)',
                          padding: '10px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6,
                        }}
                      >
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            background: 'var(--kt-grey-100)',
                            border: '1px solid var(--kt-border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--kt-text-muted)',
                            flexShrink: 0,
                          }}
                        >
                          <UsersIcon size={14} />
                        </div>
                        <div>
                          <p
                            style={{
                              fontSize: 'var(--kt-text-xl)',
                              fontWeight: 'var(--kt-weight-bold)',
                              color: 'var(--kt-navy-900)',
                              lineHeight: 1,
                              marginBottom: 3,
                            }}
                          >
                            {job.totalApplicants - job.regulixReadyApplicants}
                          </p>
                          <p
                            style={{
                              fontSize: 'var(--kt-text-xs)',
                              color: 'var(--kt-text-muted)',
                              lineHeight: 1.3,
                            }}
                          >
                            Standard
                          </p>
                        </div>
                      </div>
                    </div>

                    <Link to="/site/pipeline" style={{ textDecoration: 'none' }}>
                      <button
                        style={{
                          width: '100%',
                          padding: '7px 0',
                          background: 'var(--kt-olive-700)',
                          color: 'white',
                          border: 'none',
                          borderRadius: 'var(--kt-radius-md)',
                          fontSize: 'var(--kt-text-xs)',
                          fontWeight: 'var(--kt-weight-semibold)',
                          cursor: 'pointer',
                          fontFamily: 'var(--kt-font-sans)',
                        }}
                      >
                        View Candidates →
                      </button>
                    </Link>
                    <a
                      href="https://regulix.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'block',
                        textAlign: 'center',
                        marginTop: 8,
                        fontSize: 'var(--kt-text-xs)',
                        color: 'var(--kt-olive-700)',
                        textDecoration: 'none',
                        fontWeight: 'var(--kt-weight-medium)',
                      }}
                    >
                      Learn more about Regulix →
                    </a>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* ── Worker: quick apply + save + Regulix upsell ── */
            <div
              style={{
                background: 'var(--kt-surface)',
                border: '1px solid var(--kt-border)',
                borderRadius: 'var(--kt-radius-lg)',
                padding: 20,
              }}
            >
              {applied ? (
                <Alert variant="success" style={{ marginBottom: 12 }}>
                  Application submitted! The employer will be in touch.
                </Alert>
              ) : null}

              <Button
                variant={applied ? 'secondary' : 'primary'}
                style={{ width: '100%', marginBottom: 8 }}
                onClick={() => setQuickApplyOpen(true)}
                disabled={applied}
              >
                {applied ? (
                  <>
                    <CheckIcon size={12} /> Applied
                  </>
                ) : (
                  <>
                    <LightningIcon size={14} /> Quick Apply
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                style={{ width: '100%' }}
                onClick={() => setSaved((s) => !s)}
              >
                {saved ? (
                  <>
                    <CheckIcon size={12} /> Saved
                  </>
                ) : (
                  'Save Job'
                )}
              </Button>

              <Divider style={{ margin: '16px 0' }} />

              {/* Regulix upsell */}
              <div
                style={{
                  background: 'rgba(109, 117, 49, 0.07)',
                  border: '1px solid var(--kt-olive-200)',
                  borderRadius: 'var(--kt-radius-md)',
                  padding: '14px 16px',
                }}
              >
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                  <RegulixBadge size="md" />
                  <span
                    style={{
                      fontSize: 'var(--kt-text-sm)',
                      fontWeight: 'var(--kt-weight-semibold)',
                      color: 'var(--kt-navy-900)',
                    }}
                  >
                    Stand Out with Regulix
                  </span>
                </div>
                <p
                  style={{
                    fontSize: 'var(--kt-text-xs)',
                    color: 'var(--kt-text-muted)',
                    lineHeight: 1.5,
                    marginBottom: 10,
                  }}
                >
                  Complete your Regulix profile to become hire-ready. Employers prioritize
                  Regulix-verified candidates.
                </p>
                <button
                  style={{
                    width: '100%',
                    padding: '7px 0',
                    background: 'var(--kt-olive-700)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--kt-radius-md)',
                    fontSize: 'var(--kt-text-xs)',
                    fontWeight: 'var(--kt-weight-semibold)',
                    cursor: 'pointer',
                    fontFamily: 'var(--kt-font-sans)',
                  }}
                >
                  Get Regulix Ready →
                </button>
              </div>
            </div>
          )}

          {/* Company Info Card */}
          <div
            style={{
              background: 'var(--kt-surface)',
              border: '1px solid var(--kt-border)',
              borderRadius: 'var(--kt-radius-lg)',
              padding: 20,
            }}
          >
            <h3
              style={{
                fontSize: 'var(--kt-text-sm)',
                fontWeight: 'var(--kt-weight-semibold)',
                color: 'var(--kt-text)',
                marginBottom: 14,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              About the Company
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: 'var(--kt-navy-900)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--kt-sand-300)',
                  fontWeight: 'var(--kt-weight-bold)',
                  fontSize: 'var(--kt-text-lg)',
                  flexShrink: 0,
                }}
              >
                {job.company.name.charAt(0)}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span
                    style={{
                      fontWeight: 'var(--kt-weight-semibold)',
                      color: 'var(--kt-text)',
                      fontSize: 'var(--kt-text-sm)',
                    }}
                  >
                    {job.company.name}
                  </span>
                  {job.company.isVerified && (
                    <VerifiedBadgeIcon size={14} color="var(--kt-accent)" />
                  )}
                </div>
                <span style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-text-muted)' }}>
                  {job.company.industry}
                </span>
              </div>
            </div>

            <p
              style={{
                fontSize: 'var(--kt-text-xs)',
                color: 'var(--kt-text-muted)',
                lineHeight: 1.6,
                marginBottom: 14,
              }}
            >
              {job.company.description}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
              {[
                { icon: <MapPinIcon size={14} />, label: job.company.location },
                { icon: <BuildingIcon size={14} />, label: `${job.company.size} employees` },
                { icon: <GlobeIcon size={13} />, label: job.company.website },
              ].map(({ icon, label }) => (
                <div
                  key={label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    color: 'var(--kt-text-muted)',
                    fontSize: 'var(--kt-text-xs)',
                  }}
                >
                  {icon}
                  <span>{label}</span>
                </div>
              ))}
            </div>

            {detail && (
              <div
                style={{
                  padding: '10px 12px',
                  background: 'color-mix(in srgb, var(--kt-warning) 8%, transparent)',
                  borderRadius: 'var(--kt-radius-md)',
                  border: '1px solid color-mix(in srgb, var(--kt-warning) 20%, transparent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', gap: 2, marginBottom: 2 }}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <StarIcon
                        key={i}
                        size={11}
                        color={
                          i <= Math.round(detail.avgRating)
                            ? 'var(--kt-rating)'
                            : 'var(--kt-border-strong)'
                        }
                      />
                    ))}
                  </div>
                  <span style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-text-muted)' }}>
                    {detail.reviewCount} reviews
                  </span>
                </div>
                <Link
                  to={`/site/company/${job.companyId}`}
                  style={{
                    fontSize: 'var(--kt-text-xs)',
                    color: 'var(--kt-primary)',
                    textDecoration: 'none',
                    fontWeight: 'var(--kt-weight-medium)',
                  }}
                >
                  See all →
                </Link>
              </div>
            )}

            <Link
              to={`/site/company/${job.companyId}`}
              style={{ textDecoration: 'none', display: 'block', marginTop: 12 }}
            >
              <button
                style={{
                  width: '100%',
                  padding: '8px 0',
                  background: 'transparent',
                  border: '1px solid var(--kt-border)',
                  borderRadius: 'var(--kt-radius-md)',
                  fontSize: 'var(--kt-text-xs)',
                  color: 'var(--kt-text-muted)',
                  cursor: 'pointer',
                  fontFamily: 'var(--kt-font-sans)',
                  fontWeight: 'var(--kt-weight-medium)',
                }}
              >
                View Company Profile →
              </button>
            </Link>
          </div>

          {/* Similar Jobs */}
          <div
            style={{
              background: 'var(--kt-surface)',
              border: '1px solid var(--kt-border)',
              borderRadius: 'var(--kt-radius-lg)',
              padding: 20,
            }}
          >
            <h3
              style={{
                fontSize: 'var(--kt-text-sm)',
                fontWeight: 'var(--kt-weight-semibold)',
                color: 'var(--kt-text)',
                marginBottom: 14,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Similar Jobs
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {jobs
                .filter((j) => j.industrySlug === job.industrySlug && j.id !== job.id)
                .slice(0, 3)
                .map((j) => (
                  <Link
                    key={j.id}
                    to={`/site/jobs/${j.id}`}
                    style={{
                      textDecoration: 'none',
                      display: 'block',
                      padding: '10px 12px',
                      borderRadius: 'var(--kt-radius-md)',
                      border: '1px solid var(--kt-border)',
                      background: 'var(--kt-bg)',
                    }}
                  >
                    <p
                      style={{
                        fontSize: 'var(--kt-text-sm)',
                        fontWeight: 'var(--kt-weight-medium)',
                        color: 'var(--kt-text)',
                        marginBottom: 3,
                      }}
                    >
                      {j.title}
                    </p>
                    <p style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-text-muted)' }}>
                      {j.company.name} · ${j.payMin}–${j.payMax}/hr
                    </p>
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </div>

      <QuickApplyModal
        job={job}
        open={quickApplyOpen}
        onClose={() => setQuickApplyOpen(false)}
        onApplied={() => setApplied(true)}
      />

      {/* Manage Listing modal */}
      <Modal
        open={manageOpen}
        onClose={() => {
          setManageOpen(false)
          setManageAction('pause')
          setPauseDuration('7d')
        }}
        size="sm"
        title="Manage listing"
        description={`${job.title} · ${job.company.name}`}
      >
        {/* Tab toggle — Pause / Delete */}
        <div
          style={{
            display: 'flex',
            background: 'var(--kt-bg)',
            border: '1px solid var(--kt-border)',
            borderRadius: 'var(--kt-radius-md)',
            padding: 3,
            marginBottom: 20,
            gap: 3,
          }}
        >
          {(['pause', 'archive'] as const).map((action) => (
            <button
              key={action}
              onClick={() => setManageAction(action)}
              style={{
                flex: 1,
                padding: '7px 0',
                background: manageAction === action ? 'var(--kt-olive-700)' : 'transparent',
                border: '1px solid transparent',
                borderRadius: 'var(--kt-radius-sm)',
                fontSize: 'var(--kt-text-sm)',
                fontWeight: 'var(--kt-weight-medium)',
                color: manageAction === action ? 'white' : 'var(--kt-text-muted)',
                cursor: 'pointer',
                fontFamily: 'var(--kt-font-sans)',
                transition: 'all var(--kt-duration-fast)',
              }}
            >
              {action === 'pause' ? 'Pause listing' : 'Archive listing'}
            </button>
          ))}
        </div>

        {manageAction !== 'archive' ? (
          <>
            <p
              style={{
                fontSize: 'var(--kt-text-sm)',
                color: 'var(--kt-text-muted)',
                marginBottom: 16,
                lineHeight: 1.5,
              }}
            >
              Pausing hides this job from search results. You can reactivate it at any time from
              your dashboard.
            </p>
            <p
              style={{
                fontSize: 'var(--kt-text-xs)',
                fontWeight: 'var(--kt-weight-semibold)',
                color: 'var(--kt-text)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: 10,
              }}
            >
              Pause duration
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
              {(
                [
                  { value: '7d', label: '7 days', hint: 'Auto-resumes after one week' },
                  { value: '30d', label: '30 days', hint: 'Auto-resumes after one month' },
                  {
                    value: 'indefinite',
                    label: 'Indefinitely',
                    hint: 'Stays paused until you reactivate it',
                  },
                ] as { value: '7d' | '30d' | 'indefinite'; label: string; hint: string }[]
              ).map((opt) => (
                <label
                  key={opt.value}
                  onClick={() => setPauseDuration(opt.value)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 12px',
                    borderRadius: 'var(--kt-radius-md)',
                    border: `1px solid ${pauseDuration === opt.value ? 'var(--kt-primary)' : 'var(--kt-border)'}`,
                    background:
                      pauseDuration === opt.value
                        ? 'var(--kt-primary-subtle)'
                        : 'var(--kt-surface)',
                    cursor: 'pointer',
                    transition: 'all var(--kt-duration-fast)',
                  }}
                >
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      flexShrink: 0,
                      border: `2px solid ${pauseDuration === opt.value ? 'var(--kt-primary)' : 'var(--kt-border-strong)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {pauseDuration === opt.value && (
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: 'var(--kt-primary)',
                        }}
                      />
                    )}
                  </div>
                  <div>
                    <p
                      style={{
                        fontSize: 'var(--kt-text-sm)',
                        fontWeight: 'var(--kt-weight-medium)',
                        color: 'var(--kt-text)',
                        marginBottom: 1,
                      }}
                    >
                      {opt.label}
                    </p>
                    <p style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-text-muted)' }}>
                      {opt.hint}
                    </p>
                  </div>
                </label>
              ))}
            </div>
            <button
              onClick={() => setManageOpen(false)}
              style={{
                width: '100%',
                padding: '10px 0',
                background: 'var(--kt-primary)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--kt-radius-md)',
                fontSize: 'var(--kt-text-sm)',
                fontWeight: 'var(--kt-weight-semibold)',
                cursor: 'pointer',
                fontFamily: 'var(--kt-font-sans)',
                marginBottom: 10,
              }}
            >
              Confirm Pause
            </button>
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={() => setManageOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontSize: 'var(--kt-text-sm)',
                  color: 'var(--kt-text-muted)',
                  cursor: 'pointer',
                  fontFamily: 'var(--kt-font-sans)',
                  textDecoration: 'underline',
                  textUnderlineOffset: 3,
                }}
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <div
              style={{
                marginBottom: 20,
              }}
            >
              <p
                style={{
                  fontSize: 'var(--kt-text-sm)',
                  fontWeight: 'var(--kt-weight-semibold)',
                  color: 'var(--kt-text)',
                  marginBottom: 4,
                }}
              >
                Listing will be archived
              </p>
              <p
                style={{
                  fontSize: 'var(--kt-text-sm)',
                  color: 'var(--kt-text-muted)',
                  lineHeight: 1.5,
                }}
              >
                Archiving removes this job from search results but keeps it on record. You can find
                and restore it anytime from your dashboard under <strong>Archived</strong>.
              </p>
            </div>
            <button
              onClick={() => setManageOpen(false)}
              style={{
                width: '100%',
                padding: '10px 0',
                background: 'var(--kt-navy-900)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--kt-radius-md)',
                fontSize: 'var(--kt-text-sm)',
                fontWeight: 'var(--kt-weight-semibold)',
                cursor: 'pointer',
                fontFamily: 'var(--kt-font-sans)',
                marginBottom: 10,
              }}
            >
              Archive listing
            </button>
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={() => setManageOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontSize: 'var(--kt-text-sm)',
                  color: 'var(--kt-text-muted)',
                  cursor: 'pointer',
                  fontFamily: 'var(--kt-font-sans)',
                  textDecoration: 'underline',
                  textUnderlineOffset: 3,
                }}
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* Share modal */}
      <Modal
        open={shareOpen}
        onClose={() => {
          setShareOpen(false)
          setCopied(false)
        }}
        size="sm"
        title="Share this job"
        description={`${job.title} · ${job.company.name}`}
      >
        {/* Social share row */}
        <div style={{ display: 'flex', justifyContent: 'space-around', paddingBottom: 24 }}>
          {(
            [
              {
                label: 'LinkedIn',
                bg: '#0A66C2', // eslint-disable-line no-restricted-syntax -- LinkedIn brand color
                href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
                icon: <LinkedInIcon />,
              },
              {
                label: 'X',
                bg: '#000000', // eslint-disable-line no-restricted-syntax -- X/Twitter brand color
                href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
                icon: <XIcon />,
              },
              {
                label: 'Facebook',
                bg: '#1877F2', // eslint-disable-line no-restricted-syntax -- Facebook brand color
                href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
                icon: <FacebookIcon />,
              },
              {
                label: 'Email',
                bg: 'var(--kt-navy-900)',
                href: `mailto:?subject=${encodeURIComponent(`Job: ${job.title} at ${job.company.name}`)}&body=${encodeURIComponent(`Hi,\n\nI thought you might be interested in this opportunity:\n\n${job.title} at ${job.company.name}\n${job.location} · ${payLabel}\n\nView posting: ${shareUrl}`)}`,
                icon: <EnvelopeIcon size={20} />,
              },
            ] as { label: string; bg: string; href: string; icon: React.ReactNode }[]
          ).map(({ label, bg, href, icon }) => (
            <a
              key={label}
              href={href}
              target={label !== 'Email' ? '_blank' : undefined}
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                textDecoration: 'none',
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: bg,
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'opacity var(--kt-duration-fast)',
                }}
              >
                {icon}
              </div>
              <span
                style={{
                  fontSize: 'var(--kt-text-xs)',
                  color: 'var(--kt-text-muted)',
                  fontWeight: 'var(--kt-weight-medium)',
                }}
              >
                {label}
              </span>
            </a>
          ))}
        </div>

        <Divider style={{ marginBottom: 16 }} />

        {/* Copy link */}
        <p
          style={{
            fontSize: 'var(--kt-text-xs)',
            fontWeight: 'var(--kt-weight-semibold)',
            color: 'var(--kt-text)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: 8,
          }}
        >
          Copy link
        </p>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--kt-bg)',
            border: '1px solid var(--kt-border)',
            borderRadius: 'var(--kt-radius-md)',
            padding: '8px 10px 8px 12px',
          }}
        >
          <LinkIcon />
          <span
            style={{
              flex: 1,
              fontSize: 'var(--kt-text-xs)',
              color: 'var(--kt-text-muted)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {shareUrl}
          </span>
          <button
            onClick={handleCopy}
            style={{
              flexShrink: 0,
              padding: '4px 14px',
              background: copied ? 'var(--kt-success)' : 'var(--kt-primary)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--kt-radius-sm)',
              fontSize: 'var(--kt-text-xs)',
              fontWeight: 'var(--kt-weight-semibold)',
              cursor: 'pointer',
              fontFamily: 'var(--kt-font-sans)',
              transition: 'background var(--kt-duration-base)',
              whiteSpace: 'nowrap',
            }}
          >
            {copied ? (
              <>
                <CheckIcon size={12} /> Copied!
              </>
            ) : (
              'Copy'
            )}
          </button>
        </div>
      </Modal>
    </div>
  )
}
