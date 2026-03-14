import React, { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Badge, Button, Divider, Alert, Modal } from '../../components'
import { RegulixBadge } from '../components/RegulixBadge/RegulixBadge'
import { QuickApplyModal } from '../components/QuickApplyModal/QuickApplyModal'
import { jobs, companyDetails } from '../data/mock'
import { useAuth } from '../context/AuthContext'

const CheckIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
  >
    <path d="M20 6L9 17l-5-5" />
  </svg>
)

const MapPinIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
)

const ClockIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
)

const DollarIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
  </svg>
)

const UsersIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87" />
    <path d="M16 3.13a4 4 0 010 7.75" />
  </svg>
)

const ShareIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
)

const BookmarkIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
  </svg>
)

const RegulixMarkIcon = ({ size = 24 }: { size?: number }) => {
  const h = Math.round((size * 699.83) / 600)
  return (
    <svg viewBox="0 0 600 699.83" width={size} height={h} xmlns="http://www.w3.org/2000/svg">
      <rect y="174.96" width="174.96" height="174.96" rx="17.5" ry="17.5" fill="#ff3d00" />
      <path
        fill="#ff3d00"
        d="M597.42,684.9l-108.78-108.78c-26.8-26.8-61.39-44-98.45-49.4-1.34-.49-2.3-1.77-2.3-3.27,0-1.4.83-2.61,2.02-3.16.44-.1.87-.21,1.31-.32.06,0,.11-.02.17-.02h-.1c76.65-18.59,133.58-87.65,133.58-170.02v-174.96C524.87,78.33,446.54,0,349.92,0h-157.46c-9.66,0-17.5,7.83-17.5,17.5v139.97c0,9.66,7.83,17.5,17.5,17.5h139.97c9.66,0,17.5,7.83,17.5,17.5v139.97c0,9.66-7.83,17.5-17.5,17.5h-139.97c-9.66,0-17.5,7.83-17.5,17.5v142.97c0,9.28,3.69,18.18,10.25,24.74l159.58,159.59c3.28,3.28,7.73,5.12,12.37,5.12h234.07c7.79,0,11.7-9.42,6.19-14.93Z"
      />
    </svg>
  )
}

const BuildingIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
  </svg>
)

const GlobeIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
  </svg>
)

const VerifiedIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--kt-accent)" stroke="none">
    <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
  </svg>
)

const LinkedInIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
)

const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

const FacebookIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
)

const EnvelopeShareIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M2 7l10 7 10-7" />
  </svg>
)

const LinkIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
  </svg>
)

const preInterviewQuestions: Record<string, string[]> = {
  j1: [
    'How many years of commercial framing experience do you have?',
    'Do you currently hold an OSHA 10 or OSHA 30 certification?',
    'Do you have your own hand tools?',
  ],
  j2: [
    'Are you able to lift 50 lbs repeatedly throughout a shift?',
    'Do you have reliable transportation to the Glendale work site?',
    'Are you available to start immediately?',
  ],
  j3: [
    'Do you hold an active AZ CNA certification?',
    'Are you CPR/BLS certified?',
    "Do you have a valid driver's license and reliable vehicle?",
  ],
  j4: [
    'Do you have experience with EMR software? Which systems?',
    'How many years of medical office experience do you have?',
  ],
  j5: [
    'Do you have 2+ years of kitchen experience?',
    "Do you have an active AZ Food Handler's Card?",
    'Are you available to work evenings and weekends?',
  ],
  j6: [
    'Do you hold an active CDL-A license?',
    'Is your DOT physical current?',
    'How many years of Class A driving experience do you have?',
  ],
  j7: [
    'Do you have prior landscaping or grounds maintenance experience?',
    'Are you available for early morning start times (5:30 AM)?',
    "Do you have a valid driver's license?",
  ],
  j8: [
    'Do you have customer service experience in a food & beverage setting?',
    'Are you available on weekends?',
    "Do you have an AZ Food Handler's Card?",
  ],
}

export const JobDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { persona } = useAuth()
  const isCompany = persona === 'company'
  const [applied, setApplied] = useState(false)
  const [saved, setSaved] = useState(false)
  const [quickApplyOpen, setQuickApplyOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [manageOpen, setManageOpen] = useState(false)
  const [pauseDuration, setPauseDuration] = useState<'7d' | '30d' | 'indefinite'>('7d')
  const [manageAction, setManageAction] = useState<'pause' | 'archive'>('pause')

  const job = jobs.find((j) => j.id === id)
  const detail = job ? companyDetails.find((d) => d.companyId === job.companyId) : null

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
        <div style={{ fontSize: 48 }}>🔍</div>
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

  const questions = preInterviewQuestions[job.id] ?? []
  const postedLabel =
    job.postedDaysAgo === 0
      ? 'Today'
      : job.postedDaysAgo === 1
        ? 'Yesterday'
        : `${job.postedDaysAgo} days ago`
  const payLabel =
    job.payType === 'hour'
      ? `$${job.payMin}–$${job.payMax}/hr`
      : `$${((job.payMin * 2080) / 1000).toFixed(0)}K–$${((job.payMax * 2080) / 1000).toFixed(0)}K/yr`

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
                  {job.company.isVerified && <VerifiedIcon />}
                  <span style={{ color: 'var(--kt-border-strong)' }}>·</span>
                  <Badge variant="secondary" size="sm">
                    {job.type}
                  </Badge>
                </div>

                {/* Meta row */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                  {[
                    { icon: <MapPinIcon />, label: job.location },
                    { icon: <DollarIcon />, label: payLabel },
                    { icon: <ClockIcon />, label: `Posted ${postedLabel}` },
                    ...(!isCompany
                      ? [{ icon: <UsersIcon />, label: `${job.totalApplicants} applicants` }]
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
                    <BookmarkIcon />
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
                  <ShareIcon />
                </button>
              </div>
            </div>

            {/* Skills */}
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
          </div>

          {/* Regulix Ready Info Banner — worker view only; shown in sidebar for company */}
          {!isCompany && job.regulixReadyApplicants > 0 && (
            <div
              style={{
                background: 'linear-gradient(135deg, #f0f4e8, #e8eedb)',
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
                    <CheckIcon />
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
                <Link to="/site/post-job" style={{ textDecoration: 'none' }}>
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
                          <UsersIcon />
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
                {applied ? '✓ Applied' : '⚡ Quick Apply'}
              </Button>

              <Button
                variant="outline"
                style={{ width: '100%' }}
                onClick={() => setSaved((s) => !s)}
              >
                {saved ? '✓ Saved' : 'Save Job'}
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
                  {job.company.isVerified && <VerifiedIcon />}
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
                { icon: <MapPinIcon />, label: job.company.location },
                { icon: <BuildingIcon />, label: `${job.company.size} employees` },
                { icon: <GlobeIcon />, label: job.company.website },
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
                      <span
                        key={i}
                        style={{
                          fontSize: '11px',
                          color:
                            i <= Math.round(detail.avgRating)
                              ? '#F5A623'
                              : 'var(--kt-border-strong)',
                        }}
                      >
                        ★
                      </span>
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
                bg: '#0A66C2',
                href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
                icon: <LinkedInIcon />,
              },
              {
                label: 'X',
                bg: '#000000',
                href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
                icon: <XIcon />,
              },
              {
                label: 'Facebook',
                bg: '#1877F2',
                href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
                icon: <FacebookIcon />,
              },
              {
                label: 'Email',
                bg: 'var(--kt-navy-900)',
                href: `mailto:?subject=${encodeURIComponent(`Job: ${job.title} at ${job.company.name}`)}&body=${encodeURIComponent(`Hi,\n\nI thought you might be interested in this opportunity:\n\n${job.title} at ${job.company.name}\n${job.location} · ${payLabel}\n\nView posting: ${shareUrl}`)}`,
                icon: <EnvelopeShareIcon />,
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
              background: copied ? '#2e7d32' : 'var(--kt-primary)',
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
            {copied ? '✓ Copied!' : 'Copy'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
