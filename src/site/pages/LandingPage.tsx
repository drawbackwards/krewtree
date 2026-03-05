import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button, Badge } from '../../components'
import { RegulixBadge } from '../components'
import { industries, jobs } from '../data/mock'
import { JobCard } from '../components/JobCard/JobCard'

// ── shared styles ─────────────────────────────────────────────────────────────
const S = {
  section: (bg = 'var(--kt-bg)'): React.CSSProperties => ({
    backgroundColor: bg,
    padding: '80px var(--kt-space-6)',
  }),
  inner: (): React.CSSProperties => ({
    maxWidth: 1200,
    margin: '0 auto',
  }),
  sectionTitle: (): React.CSSProperties => ({
    fontSize: 'var(--kt-text-3xl)',
    fontWeight: 'var(--kt-weight-bold)',
    color: 'var(--kt-text)',
    marginBottom: 12,
    letterSpacing: '-0.3px',
  }),
  sectionSubtitle: (): React.CSSProperties => ({
    fontSize: 'var(--kt-text-lg)',
    color: 'var(--kt-text-muted)',
    maxWidth: 560,
    lineHeight: 'var(--kt-leading-normal)',
  }),
}

// ── shared sections ───────────────────────────────────────────────────────────
const FeaturedJobsSection = () => {
  const navigate = useNavigate()
  const featuredJobs = jobs.filter((j) => j.isSponsored).slice(0, 3)
  return (
    <section style={{ ...S.section('var(--kt-bg-subtle)') }}>
      <div style={S.inner()}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: 32,
          }}
        >
          <div>
            <h2 style={S.sectionTitle()}>Featured Jobs</h2>
            <p style={S.sectionSubtitle()}>Hand-picked opportunities from verified employers.</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/site/jobs')}>
            Browse All Jobs →
          </Button>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: 20,
          }}
        >
          {featuredJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      </div>
    </section>
  )
}

const HowItWorksSection = () => (
  <section style={S.section()}>
    <div style={S.inner()}>
      <div style={{ textAlign: 'center', marginBottom: 64 }}>
        <h2 style={S.sectionTitle()}>How krewtree Works</h2>
        <p style={{ ...S.sectionSubtitle(), margin: '0 auto' }}>
          Three steps to your next job or your next great hire.
        </p>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-start', maxWidth: 900, margin: '0 auto' }}>
        {[
          {
            num: '01',
            title: 'Create Your Profile',
            body: 'Workers build a verified profile with skills and job history. Companies set up their business profile and verify credentials.',
          },
          {
            num: '02',
            title: 'Connect',
            body: 'Workers browse and apply to jobs across industries. Companies post jobs and find qualified, hire-ready applicants.',
          },
          {
            num: '03',
            title: 'Get to Work',
            body: "Regulix Ready workers can start the same day they're hired — all paperwork done. No delays, no back-and-forth.",
          },
        ].map((step, i, arr) => (
          <React.Fragment key={step.num}>
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                padding: '0 24px',
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: 'var(--kt-navy-900)',
                  color: 'var(--kt-sand-400)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'var(--kt-weight-bold)',
                  fontSize: 'var(--kt-text-lg)',
                  marginBottom: 20,
                  flexShrink: 0,
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                {step.num}
              </div>
              <p
                style={{
                  fontWeight: 'var(--kt-weight-semibold)',
                  fontSize: 'var(--kt-text-lg)',
                  color: 'var(--kt-text)',
                  marginBottom: 10,
                }}
              >
                {step.title}
              </p>
              <p
                style={{
                  fontSize: 'var(--kt-text-sm)',
                  color: 'var(--kt-text-muted)',
                  lineHeight: 1.6,
                }}
              >
                {step.body}
              </p>
            </div>
            {i < arr.length - 1 && (
              <div
                style={{
                  width: 64,
                  height: 2,
                  background: 'var(--kt-border)',
                  marginTop: 25,
                  flexShrink: 0,
                }}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  </section>
)

const IndustriesSection = () => {
  const navigate = useNavigate()
  return (
    <section style={{ ...S.section('var(--kt-bg-subtle)') }}>
      <div style={S.inner()}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={S.sectionTitle()}>Browse by Industry</h2>
          <p style={{ ...S.sectionSubtitle(), margin: '0 auto' }}>
            One account works across every industry. Find the right opportunity wherever you want to
            work.
          </p>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 16,
          }}
        >
          {industries.map((ind) => (
            <button
              key={ind.id}
              onClick={() => navigate(`/site/jobs?industry=${ind.slug}`)}
              style={{
                background: 'var(--kt-surface)',
                border: '1px solid var(--kt-border)',
                borderRadius: 'var(--kt-radius-lg)',
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'var(--kt-font-sans)',
                transition: 'all var(--kt-duration-base) var(--kt-ease)',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.boxShadow = 'var(--kt-shadow-md)'
                e.currentTarget.style.borderColor = 'var(--kt-border-strong)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.borderColor = 'var(--kt-border)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <span style={{ fontSize: 28, flexShrink: 0 }}>{ind.icon}</span>
              <div>
                <p
                  style={{
                    fontWeight: 'var(--kt-weight-semibold)',
                    color: 'var(--kt-text)',
                    fontSize: 'var(--kt-text-md)',
                  }}
                >
                  {ind.name}
                </p>
                <p
                  style={{
                    fontSize: 'var(--kt-text-xs)',
                    color: 'var(--kt-text-muted)',
                    marginTop: 2,
                  }}
                >
                  {ind.jobCount.toLocaleString()} jobs
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

const CTASection = () => {
  const navigate = useNavigate()
  return (
    <section
      style={{
        background: 'var(--kt-navy-900)',
        padding: '80px var(--kt-space-6)',
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <RegulixBadge size="lg" variant="onDark" pulse showTooltip={false} />
        <h2
          style={{
            fontSize: 'clamp(28px, 4vw, 48px)',
            fontWeight: 'var(--kt-weight-bold)',
            color: 'var(--kt-sand-300)',
            marginTop: 20,
            marginBottom: 16,
            lineHeight: 1.1,
          }}
        >
          Ready to build your krew?
        </h2>
        <p
          style={{
            fontSize: 'var(--kt-text-lg)',
            color: 'rgba(229,218,195,0.55)',
            marginBottom: 40,
            lineHeight: 1.6,
          }}
        >
          Join thousands of workers and employers already using krewtree to find faster, better
          matches — powered by Regulix.
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button variant="secondary" size="xl" onClick={() => navigate('/site/signup/worker')}>
            Find Jobs Now
          </Button>
          <Button variant="accent" size="xl" onClick={() => navigate('/site/signup/company')}>
            Post a Job
          </Button>
        </div>
      </div>
    </section>
  )
}

const FooterSection = () => (
  <footer
    style={{
      background: 'var(--kt-navy-950)',
      padding: '40px var(--kt-space-6)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 16,
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span
        style={{
          fontSize: 'var(--kt-text-xl)',
          fontWeight: 'var(--kt-weight-bold)',
          color: 'var(--kt-sand-400)',
        }}
      >
        krewtree
      </span>
      <span style={{ color: 'rgba(229,218,195,0.3)', fontSize: 'var(--kt-text-sm)' }}>
        · A Regulix Partner Platform
      </span>
    </div>
    <div
      style={{
        display: 'flex',
        gap: 24,
        fontSize: 'var(--kt-text-sm)',
        color: 'rgba(229,218,195,0.4)',
      }}
    >
      {['About', 'Employers', 'Workers', 'Industries', 'Privacy', 'Terms'].map((l) => (
        <a
          key={l}
          href="#"
          style={{ color: 'inherit', textDecoration: 'none' }}
          onMouseOver={(e) => (e.currentTarget.style.color = 'var(--kt-sand-400)')}
          onMouseOut={(e) => (e.currentTarget.style.color = 'rgba(229,218,195,0.4)')}
        >
          {l}
        </a>
      ))}
    </div>
    <span style={{ fontSize: 'var(--kt-text-sm)', color: 'rgba(229,218,195,0.25)' }}>
      © 2026 krewtree. All rights reserved.
    </span>
  </footer>
)

// ═════════════════════════════════════════════════════════════════════════════
// HERO DEFAULT: D TRACK + B CENTER
// Centered question (B aesthetic) → two path cards (D track)
// ═════════════════════════════════════════════════════════════════════════════
const HeroDefault = () => {
  const navigate = useNavigate()
  return (
    <section style={{ background: 'var(--kt-bg)', borderBottom: '1px solid var(--kt-border)' }}>
      {/* Centered header */}
      <div style={{ textAlign: 'center', padding: '80px var(--kt-space-6) 52px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <RegulixBadge size="sm" showTooltip={false} />
        </div>
        <h1
          style={{
            fontSize: 'clamp(32px, 5vw, 58px)',
            fontWeight: 300,
            color: 'var(--kt-text)',
            letterSpacing: '-1.5px',
            lineHeight: 1.1,
            marginBottom: 12,
          }}
        >
          What brings you to{' '}
          <strong style={{ fontWeight: 700, color: 'var(--kt-text)' }}>krewtree</strong>?
        </h1>
        <p
          style={{
            fontSize: 'var(--kt-text-lg)',
            color: 'var(--kt-text-muted)',
            maxWidth: 460,
            margin: '0 auto',
          }}
        >
          The job board built for real work — pick your path below.
        </p>
      </div>

      {/* Two track cards */}
      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '0 var(--kt-space-6) 64px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 20,
        }}
      >
        {/* Worker track */}
        <button
          onClick={() => navigate('/site/signup/worker')}
          style={{
            background: 'var(--kt-navy-900)',
            border: '1px solid rgba(229,218,195,0.1)',
            borderRadius: 'var(--kt-radius-xl)',
            padding: '48px 44px',
            textAlign: 'left',
            cursor: 'pointer',
            fontFamily: 'var(--kt-font-sans)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)'
            e.currentTarget.style.boxShadow = '0 20px 40px rgba(10,35,45,0.25)'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'none'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <div style={{ fontSize: 44 }}>👷</div>
          <div>
            <Badge variant="accent" size="sm" style={{ marginBottom: 14 }}>
              For Workers
            </Badge>
            <h2
              style={{
                fontSize: 'var(--kt-text-4xl)',
                fontWeight: 'var(--kt-weight-bold)',
                color: 'var(--kt-sand-300)',
                lineHeight: 1.0,
                marginBottom: 14,
                letterSpacing: '-0.5px',
              }}
            >
              I'm looking
              <br />
              for work
            </h2>
            <p
              style={{
                fontSize: 'var(--kt-text-md)',
                color: 'rgba(229,218,195,0.5)',
                lineHeight: 1.6,
                maxWidth: 340,
              }}
            >
              Find jobs across every industry, build a verified profile, and get hired faster with
              Regulix.
            </p>
          </div>
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
            {[
              'Browse 12,400+ live jobs',
              'Build a verified work profile',
              'Get Regulix Ready — hire same day',
            ].map((item) => (
              <li
                key={item}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: 'var(--kt-text-sm)',
                  color: 'rgba(229,218,195,0.65)',
                }}
              >
                <span style={{ color: 'var(--kt-accent)', fontWeight: 700 }}>✓</span> {item}
              </li>
            ))}
          </ul>
          <span
            style={{
              alignSelf: 'flex-start',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--kt-accent)',
              color: 'white',
              padding: '12px 24px',
              borderRadius: 'var(--kt-radius-lg)',
              fontWeight: 'var(--kt-weight-semibold)',
              fontSize: 'var(--kt-text-md)',
            }}
          >
            Browse Jobs →
          </span>
        </button>

        {/* Company track */}
        <button
          onClick={() => navigate('/site/signup/company')}
          style={{
            background: 'var(--kt-sand-50)',
            border: '1px solid var(--kt-sand-200)',
            borderRadius: 'var(--kt-radius-xl)',
            padding: '48px 44px',
            textAlign: 'left',
            cursor: 'pointer',
            fontFamily: 'var(--kt-font-sans)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)'
            e.currentTarget.style.boxShadow = '0 20px 40px rgba(10,35,45,0.1)'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'none'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <div style={{ fontSize: 44 }}>🏢</div>
          <div>
            <Badge variant="primary" size="sm" style={{ marginBottom: 14 }}>
              For Companies
            </Badge>
            <h2
              style={{
                fontSize: 'var(--kt-text-4xl)',
                fontWeight: 'var(--kt-weight-bold)',
                color: 'var(--kt-navy-900)',
                lineHeight: 1.0,
                marginBottom: 14,
                letterSpacing: '-0.5px',
              }}
            >
              I'm looking
              <br />
              to hire
            </h2>
            <p
              style={{
                fontSize: 'var(--kt-text-md)',
                color: 'var(--kt-text-muted)',
                lineHeight: 1.6,
                maxWidth: 340,
              }}
            >
              Post jobs, find verified workers, and hire people who can start tomorrow — paperwork
              already done.
            </p>
          </div>
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
            {[
              'Post jobs across every industry',
              'Find Regulix Ready workers instantly',
              'Hire same-day — no onboarding delays',
            ].map((item) => (
              <li
                key={item}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: 'var(--kt-text-sm)',
                  color: 'var(--kt-text-muted)',
                }}
              >
                <span style={{ color: 'var(--kt-olive-700)', fontWeight: 700 }}>✓</span> {item}
              </li>
            ))}
          </ul>
          <span
            style={{
              alignSelf: 'flex-start',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--kt-navy-900)',
              color: 'white',
              padding: '12px 24px',
              borderRadius: 'var(--kt-radius-lg)',
              fontWeight: 'var(--kt-weight-semibold)',
              fontSize: 'var(--kt-text-md)',
            }}
          >
            Post a Job →
          </span>
        </button>
      </div>

      {/* Stats */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 var(--kt-space-6) 72px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 0,
            paddingTop: 40,
            borderTop: '1px solid var(--kt-border)',
            flexWrap: 'wrap',
          }}
        >
          {[
            { num: '12,400+', label: 'Active Jobs' },
            { num: '54,000+', label: 'Workers' },
            { num: '620+', label: 'Verified Companies' },
            { num: '8', label: 'Industries' },
          ].map((s, i, arr) => (
            <div
              key={i}
              style={{
                flex: '1 0 120px',
                textAlign: 'center',
                padding: '0 32px',
                borderRight: i < arr.length - 1 ? '1px solid var(--kt-border)' : 'none',
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  fontSize: 'clamp(22px, 2.5vw, 34px)',
                  fontWeight: 'var(--kt-weight-bold)',
                  color: 'var(--kt-text)',
                  lineHeight: 1,
                }}
              >
                {s.num}
              </div>
              <div
                style={{
                  fontSize: 'var(--kt-text-sm)',
                  color: 'var(--kt-text-muted)',
                  marginTop: 4,
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// HERO E: VIBRANT / COLORFUL  (alternate layout)
// White BG, bold 900-weight type, colored stat tiles, offset-shadow search, marquee
// ═════════════════════════════════════════════════════════════════════════════
const HeroE = ({ onSearch }: { onSearch: (q: string) => void }) => {
  const [q, setQ] = useState('')
  const chips = [
    { icon: '🏗️', label: 'Construction', color: '#E85D2F' },
    { icon: '🚛', label: 'Trucking', color: '#0C8A7E' },
    { icon: '🏥', label: 'Healthcare', color: '#6D28D9' },
    { icon: '🌿', label: 'Landscaping', color: '#059669' },
    { icon: '🍳', label: 'Hospitality', color: '#C47A22' },
    { icon: '⚡', label: 'Electrical', color: '#1D4ED8' },
  ]
  const colorStats = [
    { num: '12,400+', label: 'Open Jobs', bg: '#E85D2F', icon: '💼' },
    { num: '54,000+', label: 'Workers', bg: '#0C8A7E', icon: '👷' },
    { num: '620+', label: 'Companies', bg: '#6D28D9', icon: '🏢' },
    { num: '8', label: 'Industries', bg: '#C47A22', icon: '🌐' },
  ]
  const logoRow = [
    'Southwest Logistics',
    'Apex Builders',
    'Summit Staffing',
    'Valley Care Center',
    'Desert Ridge Builders',
    'Pacific Crew',
    'Phoenix Solar',
    'Coastal Labor',
  ]
  return (
    <section style={{ overflow: 'hidden' }}>
      <style>{`@keyframes kt-marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>
      {/* Solid accent bar */}
      <div style={{ height: 5, background: 'var(--kt-accent)' }} />
      {/* Hero content */}
      <div style={{ background: '#FAFAF8', padding: '60px var(--kt-space-6) 52px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* Colorful industry chips */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginBottom: 36,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontSize: 11,
                color: '#94A3B8',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginRight: 4,
                flexShrink: 0,
              }}
            >
              Browse:
            </span>
            {chips.map(({ icon, label, color }) => (
              <span
                key={label}
                style={{
                  padding: '5px 12px 5px 8px',
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  background: `${color}18`,
                  color,
                  border: `1px solid ${color}30`,
                  cursor: 'pointer',
                }}
              >
                {icon} {label}
              </span>
            ))}
          </div>
          {/* Grid: headline + search | color stat tiles */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 300px',
              gap: 56,
              alignItems: 'center',
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: 'clamp(42px, 6vw, 78px)',
                  fontWeight: 900,
                  color: '#0A232D',
                  lineHeight: 1.0,
                  marginBottom: 20,
                  letterSpacing: '-3px',
                }}
              >
                Real work,
                <br />
                <span style={{ color: 'var(--kt-accent)' }}>real people,</span>
                <br />
                right now.
              </h1>
              <p
                style={{
                  fontSize: 'var(--kt-text-xl)',
                  color: '#475569',
                  lineHeight: 1.65,
                  marginBottom: 36,
                  maxWidth: 500,
                }}
              >
                The job board that connects hourly workers with employers who need them today —
                verified, fast, no delays.
              </p>
              {/* Offset-shadow search bar */}
              <div
                style={{
                  display: 'flex',
                  borderRadius: 'var(--kt-radius-lg)',
                  border: '2.5px solid #0A232D',
                  overflow: 'hidden',
                  maxWidth: 600,
                  background: 'white',
                  boxShadow: '5px 5px 0 #0A232D',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 14px',
                    color: '#94A3B8',
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Job title, skill, or keyword..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && onSearch(q)}
                  style={{
                    flex: 1,
                    padding: '18px 4px',
                    border: 'none',
                    outline: 'none',
                    fontSize: 16,
                    color: '#0A232D',
                    fontFamily: 'var(--kt-font-sans)',
                    background: 'transparent',
                  }}
                />
                <button
                  onClick={() => onSearch(q)}
                  style={{
                    background: '#E85D2F',
                    color: 'white',
                    border: 'none',
                    borderLeft: '2.5px solid #0A232D',
                    padding: '0 26px',
                    fontSize: 15,
                    fontWeight: 800,
                    cursor: 'pointer',
                    fontFamily: 'var(--kt-font-sans)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Find Jobs →
                </button>
              </div>
              <p style={{ marginTop: 12, fontSize: 13, color: '#94A3B8' }}>
                Trending: CDL Driver · Framing Carpenter · CNA · Line Cook · Landscape Tech
              </p>
            </div>
            {/* Colored stat tiles 2×2 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {colorStats.map((s) => (
                <div
                  key={s.num}
                  style={{
                    background: s.bg,
                    borderRadius: 'var(--kt-radius-xl)',
                    padding: '24px 12px',
                    textAlign: 'center',
                    color: 'white',
                  }}
                >
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
                  <div
                    style={{ fontSize: 'clamp(18px, 2vw, 24px)', fontWeight: 900, lineHeight: 1 }}
                  >
                    {s.num}
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.75, marginTop: 4, fontWeight: 600 }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Scrolling logo marquee */}
      <div
        style={{
          background: 'white',
          borderTop: '1px solid #E8EDF2',
          borderBottom: '1px solid #E8EDF2',
          padding: '14px 0 12px',
          overflow: 'hidden',
        }}
      >
        <p
          style={{
            textAlign: 'center',
            fontSize: 11,
            color: '#CBD5E1',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            fontWeight: 700,
            marginBottom: 10,
          }}
        >
          Trusted by 620+ verified employers
        </p>
        <div style={{ overflow: 'hidden' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 56,
              animation: 'kt-marquee 22s linear infinite',
              width: 'max-content',
              paddingLeft: 32,
            }}
          >
            {[...logoRow, ...logoRow].map((name, i) => (
              <span
                key={i}
                style={{ fontSize: 14, fontWeight: 700, color: '#CBD5E1', whiteSpace: 'nowrap' }}
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ── layout switcher ───────────────────────────────────────────────────────────
const layoutOptions = [
  { key: 'default', label: 'Default' },
  { key: 'e', label: 'E · Color' },
]

const LayoutSwitcher = ({ current }: { current: string }) => {
  const navigate = useNavigate()
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'var(--kt-navy-900)',
        borderRadius: 'var(--kt-radius-full)',
        padding: '6px 8px',
        display: 'flex',
        gap: 4,
        zIndex: 9999,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        border: '1px solid rgba(229,218,195,0.15)',
      }}
    >
      {layoutOptions.map((l) => {
        const isActive = current === l.key
        return (
          <button
            key={l.key}
            onClick={() => navigate(l.key === 'default' ? '/site' : `/site?layout=${l.key}`)}
            style={{
              padding: '7px 16px',
              borderRadius: 'var(--kt-radius-full)',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--kt-font-sans)',
              fontSize: 13,
              fontWeight: isActive ? 600 : 400,
              background: isActive ? 'var(--kt-sand-400)' : 'transparent',
              color: isActive ? 'var(--kt-navy-900)' : 'rgba(229,218,195,0.6)',
              transition: 'all 0.15s',
            }}
          >
            {l.label}
          </button>
        )
      })}
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═════════════════════════════════════════════════════════════════════════════
export const LandingPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const layout = searchParams.get('layout') ?? 'default'

  const handleSearch = (q: string) => navigate(`/site/jobs?q=${encodeURIComponent(q)}`)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--kt-bg)' }}>
      <LayoutSwitcher current={layout} />

      {layout === 'e' ? <HeroE onSearch={handleSearch} /> : <HeroDefault />}

      <FeaturedJobsSection />
      <HowItWorksSection />
      <IndustriesSection />
      <CTASection />
      <FooterSection />
    </div>
  )
}
