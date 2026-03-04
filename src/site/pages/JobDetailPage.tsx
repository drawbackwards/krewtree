import React, { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Badge, Button, Divider, Alert } from '../../components'
import { RegulixBadge } from '../components/RegulixBadge/RegulixBadge'
import { QuickApplyModal } from '../components/QuickApplyModal/QuickApplyModal'
import { jobs, companyDetails } from '../data/mock'

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M20 6L9 17l-5-5" />
  </svg>
)

const MapPinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
)

const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
  </svg>
)

const DollarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
  </svg>
)

const UsersIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
  </svg>
)

const ShareIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
)

const BookmarkIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
  </svg>
)

const BuildingIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
  </svg>
)

const GlobeIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
  </svg>
)

const VerifiedIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--kt-accent)" stroke="none">
    <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
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
  const [applied, setApplied] = useState(false)
  const [saved, setSaved] = useState(false)
  const [quickApplyOpen, setQuickApplyOpen] = useState(false)

  const job = jobs.find(j => j.id === id)
  const detail = job ? companyDetails.find(d => d.companyId === job.companyId) : null

  if (!job) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <div style={{ fontSize: 48 }}>🔍</div>
        <p style={{ fontSize: 'var(--kt-text-xl)', fontWeight: 'var(--kt-weight-semibold)', color: 'var(--kt-text)' }}>Job not found</p>
        <Button variant="primary" onClick={() => navigate('/site/jobs')}>Back to Jobs</Button>
      </div>
    )
  }

  const questions = preInterviewQuestions[job.id] ?? []
  const postedLabel = job.postedDaysAgo === 0 ? 'Today' : job.postedDaysAgo === 1 ? 'Yesterday' : `${job.postedDaysAgo} days ago`
  const payLabel = job.payType === 'hour'
    ? `$${job.payMin}–$${job.payMax}/hr`
    : `$${(job.payMin * 2080 / 1000).toFixed(0)}K–$${(job.payMax * 2080 / 1000).toFixed(0)}K/yr`

  return (
    <div style={{ minHeight: '100vh', background: 'var(--kt-bg)' }}>

      {/* Header breadcrumb */}
      <div style={{ background: 'var(--kt-surface)', padding: '12px var(--kt-space-6)', borderBottom: '1px solid var(--kt-border)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link to="/site/jobs" style={{ color: 'var(--kt-text-muted)', fontSize: 'var(--kt-text-sm)', textDecoration: 'none' }}>Jobs</Link>
          <span style={{ color: 'var(--kt-text-placeholder)', fontSize: 'var(--kt-text-sm)' }}>›</span>
          <span style={{ color: 'var(--kt-text-muted)', fontSize: 'var(--kt-text-sm)' }}>{job.industry}</span>
          <span style={{ color: 'var(--kt-text-placeholder)', fontSize: 'var(--kt-text-sm)' }}>›</span>
          <span style={{ color: 'var(--kt-text)', fontSize: 'var(--kt-text-sm)', fontWeight: 'var(--kt-weight-medium)' }}>{job.title}</span>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px var(--kt-space-6)', display: 'flex', gap: 28, alignItems: 'flex-start' }}>

        {/* ---- Main Content ---- */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Job Header Card */}
          <div style={{
            background: job.isSponsored ? 'linear-gradient(135deg, var(--kt-olive-50) 0%, var(--kt-surface) 60%)' : 'var(--kt-surface)',
            border: `1px solid ${job.isSponsored ? 'var(--kt-olive-200)' : 'var(--kt-border)'}`,
            borderRadius: 'var(--kt-radius-lg)',
            padding: 28,
          }}>
            {job.isSponsored && (
              <div style={{ marginBottom: 14 }}>
                <Badge variant="accent" size="sm">⭐ Featured Position</Badge>
              </div>
            )}

            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              {/* Company logo */}
              <div style={{
                width: 60, height: 60, borderRadius: 12,
                background: 'var(--kt-grey-100)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--kt-grey-700)', fontWeight: 'var(--kt-weight-bold)',
                fontSize: 'var(--kt-text-xl)', flexShrink: 0,
                border: '1px solid var(--kt-border)',
              }}>
                {job.company.name.charAt(0)}
              </div>

              <div style={{ flex: 1 }}>
                <h1 style={{ fontSize: 'var(--kt-text-2xl)', fontWeight: 'var(--kt-weight-bold)', color: 'var(--kt-text)', marginBottom: 6 }}>
                  {job.title}
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                  <Link to={`/site/company/${job.companyId}`} style={{ fontSize: 'var(--kt-text-md)', color: 'var(--kt-primary)', fontWeight: 'var(--kt-weight-medium)', textDecoration: 'none' }}>
                    {job.company.name}
                  </Link>
                  {job.company.isVerified && <VerifiedIcon />}
                  <span style={{ color: 'var(--kt-border-strong)' }}>·</span>
                  <Badge variant="secondary" size="sm">{job.type}</Badge>
                </div>

                {/* Meta row */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                  {[
                    { icon: <MapPinIcon />, label: job.location },
                    { icon: <DollarIcon />, label: payLabel },
                    { icon: <ClockIcon />, label: `Posted ${postedLabel}` },
                    { icon: <UsersIcon />, label: `${job.totalApplicants} applicants` },
                  ].map(({ icon, label }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--kt-text-muted)', fontSize: 'var(--kt-text-sm)' }}>
                      {icon}
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Save / Share */}
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button
                  onClick={() => setSaved(s => !s)}
                  title={saved ? 'Saved' : 'Save job'}
                  style={{
                    width: 36, height: 36, borderRadius: 'var(--kt-radius-md)',
                    border: '1px solid var(--kt-border)',
                    background: saved ? 'var(--kt-primary-subtle)' : 'transparent',
                    color: saved ? 'var(--kt-primary)' : 'var(--kt-text-muted)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all var(--kt-duration-fast)',
                  }}>
                  <BookmarkIcon />
                </button>
                <button
                  title="Share"
                  style={{
                    width: 36, height: 36, borderRadius: 'var(--kt-radius-md)',
                    border: '1px solid var(--kt-border)', background: 'transparent',
                    color: 'var(--kt-text-muted)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all var(--kt-duration-fast)',
                  }}>
                  <ShareIcon />
                </button>
              </div>
            </div>

            {/* Skills */}
            <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {job.skills.map(s => (
                <span key={s} style={{
                  padding: '4px 12px', borderRadius: 'var(--kt-radius-full)',
                  background: 'var(--kt-primary-subtle)', color: 'var(--kt-primary)',
                  fontSize: 'var(--kt-text-xs)', fontWeight: 'var(--kt-weight-medium)',
                  border: '1px solid var(--kt-primary-subtle)',
                }}>{s}</span>
              ))}
            </div>
          </div>

          {/* Regulix Ready Info Banner */}
          {job.regulixReadyApplicants > 0 && (
            <div style={{
              background: 'linear-gradient(135deg, #f0f4e8, #e8eedb)',
              border: '1px solid var(--kt-olive-200)',
              borderRadius: 'var(--kt-radius-lg)',
              padding: '16px 20px',
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <RegulixBadge size="lg" pulse />
              <div>
                <p style={{ fontWeight: 'var(--kt-weight-semibold)', color: 'var(--kt-navy-900)', fontSize: 'var(--kt-text-sm)', marginBottom: 2 }}>
                  {job.regulixReadyApplicants} Regulix Ready Applicants
                </p>
                <p style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-text-muted)' }}>
                  These candidates have completed W-4, I-9, direct deposit setup, and drug screening — ready to start Day 1.
                </p>
              </div>
              <Link to="/site/dashboard/company" style={{ marginLeft: 'auto', textDecoration: 'none', flexShrink: 0 }}>
                <Button variant="accent" size="sm">View Candidates</Button>
              </Link>
            </div>
          )}

          {/* Description */}
          <div style={{
            background: 'var(--kt-surface)', border: '1px solid var(--kt-border)',
            borderRadius: 'var(--kt-radius-lg)', padding: 28,
          }}>
            <h2 style={{ fontSize: 'var(--kt-text-lg)', fontWeight: 'var(--kt-weight-semibold)', color: 'var(--kt-text)', marginBottom: 14 }}>
              About the Role
            </h2>
            <p style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text)', lineHeight: 1.7, marginBottom: 0 }}>
              {job.description}
            </p>
          </div>

          {/* Requirements */}
          <div style={{
            background: 'var(--kt-surface)', border: '1px solid var(--kt-border)',
            borderRadius: 'var(--kt-radius-lg)', padding: 28,
          }}>
            <h2 style={{ fontSize: 'var(--kt-text-lg)', fontWeight: 'var(--kt-weight-semibold)', color: 'var(--kt-text)', marginBottom: 16 }}>
              Requirements
            </h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {job.requirements.map((req, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <span style={{
                    width: 20, height: 20, borderRadius: '50%',
                    background: 'var(--kt-olive-100)', color: 'var(--kt-accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, marginTop: 1,
                  }}>
                    <CheckIcon />
                  </span>
                  <span style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text)', lineHeight: 1.5 }}>{req}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pre-Interview Questions Preview */}
          {questions.length > 0 && (
            <div style={{
              background: 'var(--kt-surface)', border: '1px solid var(--kt-border)',
              borderRadius: 'var(--kt-radius-lg)', padding: 28,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, gap: 12 }}>
                <div>
                  <h2 style={{ fontSize: 'var(--kt-text-lg)', fontWeight: 'var(--kt-weight-semibold)', color: 'var(--kt-text)', marginBottom: 4 }}>
                    Pre-Interview Questions
                  </h2>
                  <p style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-text-muted)' }}>
                    Answering these questions will be part of your application.
                  </p>
                </div>
                <Badge variant="info" size="sm">{questions.length} questions</Badge>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {questions.map((q, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 12, padding: '12px 14px',
                    background: 'var(--kt-bg)', borderRadius: 'var(--kt-radius-md)',
                    border: '1px solid var(--kt-border)',
                  }}>
                    <span style={{
                      width: 22, height: 22, borderRadius: '50%',
                      background: 'var(--kt-primary-subtle)', color: 'var(--kt-primary)',
                      fontSize: 'var(--kt-text-xs)', fontWeight: 'var(--kt-weight-bold)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>{i + 1}</span>
                    <span style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text)', lineHeight: 1.5 }}>{q}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ---- Sidebar ---- */}
        <div style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 80 }}>

          {/* Apply Card */}
          <div style={{
            background: 'var(--kt-surface)', border: '1px solid var(--kt-border)',
            borderRadius: 'var(--kt-radius-lg)', padding: 20,
          }}>
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
              onClick={() => setSaved(s => !s)}
            >
              {saved ? '✓ Saved' : 'Save Job'}
            </Button>

            <Divider style={{ margin: '16px 0' }} />

            {/* Regulix upsell */}
            <div style={{
              background: 'linear-gradient(135deg, #f0f4e8, #e8eedb)',
              border: '1px solid var(--kt-olive-200)',
              borderRadius: 'var(--kt-radius-md)',
              padding: '14px 16px',
            }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                <RegulixBadge size="md" />
                <span style={{ fontSize: 'var(--kt-text-sm)', fontWeight: 'var(--kt-weight-semibold)', color: 'var(--kt-navy-900)' }}>
                  Stand Out with Regulix
                </span>
              </div>
              <p style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-text-muted)', lineHeight: 1.5, marginBottom: 10 }}>
                Complete your Regulix profile to become hire-ready. Employers prioritize Regulix-verified candidates.
              </p>
              <button style={{
                width: '100%', padding: '7px 0',
                background: 'var(--kt-olive-700)', color: 'white',
                border: 'none', borderRadius: 'var(--kt-radius-md)',
                fontSize: 'var(--kt-text-xs)', fontWeight: 'var(--kt-weight-semibold)',
                cursor: 'pointer', fontFamily: 'var(--kt-font-sans)',
              }}>
                Get Regulix Ready →
              </button>
            </div>
          </div>

          {/* Company Info Card */}
          <div style={{
            background: 'var(--kt-surface)', border: '1px solid var(--kt-border)',
            borderRadius: 'var(--kt-radius-lg)', padding: 20,
          }}>
            <h3 style={{ fontSize: 'var(--kt-text-sm)', fontWeight: 'var(--kt-weight-semibold)', color: 'var(--kt-text)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              About the Company
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: 'var(--kt-navy-900)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--kt-sand-300)', fontWeight: 'var(--kt-weight-bold)',
                fontSize: 'var(--kt-text-lg)', flexShrink: 0,
              }}>
                {job.company.name.charAt(0)}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ fontWeight: 'var(--kt-weight-semibold)', color: 'var(--kt-text)', fontSize: 'var(--kt-text-sm)' }}>
                    {job.company.name}
                  </span>
                  {job.company.isVerified && <VerifiedIcon />}
                </div>
                <span style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-text-muted)' }}>{job.company.industry}</span>
              </div>
            </div>

            <p style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-text-muted)', lineHeight: 1.6, marginBottom: 14 }}>
              {job.company.description}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
              {[
                { icon: <MapPinIcon />, label: job.company.location },
                { icon: <BuildingIcon />, label: `${job.company.size} employees` },
                { icon: <GlobeIcon />, label: job.company.website },
              ].map(({ icon, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--kt-text-muted)', fontSize: 'var(--kt-text-xs)' }}>
                  {icon}
                  <span>{label}</span>
                </div>
              ))}
            </div>

            {detail && (
              <div style={{
                padding: '10px 12px',
                background: 'color-mix(in srgb, var(--kt-warning) 8%, transparent)',
                borderRadius: 'var(--kt-radius-md)',
                border: '1px solid color-mix(in srgb, var(--kt-warning) 20%, transparent)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ display: 'flex', gap: 2, marginBottom: 2 }}>
                    {[1,2,3,4,5].map(i => (
                      <span key={i} style={{ fontSize: '11px', color: i <= Math.round(detail.avgRating) ? '#F5A623' : 'var(--kt-border-strong)' }}>★</span>
                    ))}
                  </div>
                  <span style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-text-muted)' }}>{detail.reviewCount} reviews</span>
                </div>
                <Link to={`/site/company/${job.companyId}`} style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-primary)', textDecoration: 'none', fontWeight: 'var(--kt-weight-medium)' }}>
                  See all →
                </Link>
              </div>
            )}

            <Link to={`/site/company/${job.companyId}`} style={{ textDecoration: 'none', display: 'block', marginTop: 12 }}>
              <button style={{
                width: '100%', padding: '8px 0',
                background: 'transparent', border: '1px solid var(--kt-border)',
                borderRadius: 'var(--kt-radius-md)', fontSize: 'var(--kt-text-xs)',
                color: 'var(--kt-text-muted)', cursor: 'pointer',
                fontFamily: 'var(--kt-font-sans)', fontWeight: 'var(--kt-weight-medium)',
              }}>
                View Company Profile →
              </button>
            </Link>
          </div>

          {/* Similar Jobs */}
          <div style={{
            background: 'var(--kt-surface)', border: '1px solid var(--kt-border)',
            borderRadius: 'var(--kt-radius-lg)', padding: 20,
          }}>
            <h3 style={{ fontSize: 'var(--kt-text-sm)', fontWeight: 'var(--kt-weight-semibold)', color: 'var(--kt-text)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Similar Jobs
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {jobs
                .filter(j => j.industrySlug === job.industrySlug && j.id !== job.id)
                .slice(0, 3)
                .map(j => (
                  <Link
                    key={j.id}
                    to={`/site/jobs/${j.id}`}
                    style={{ textDecoration: 'none', display: 'block', padding: '10px 12px', borderRadius: 'var(--kt-radius-md)', border: '1px solid var(--kt-border)', background: 'var(--kt-bg)' }}
                  >
                    <p style={{ fontSize: 'var(--kt-text-sm)', fontWeight: 'var(--kt-weight-medium)', color: 'var(--kt-text)', marginBottom: 3 }}>{j.title}</p>
                    <p style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-text-muted)' }}>{j.company.name} · ${j.payMin}–${j.payMax}/hr</p>
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
    </div>
  )
}
