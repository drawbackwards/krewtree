import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components'
import { RegulixBadge } from '../../components'
import { industries, jobs } from '../../data/mock'
import { JobCard } from '../../components/JobCard/JobCard'

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

// ── Featured Jobs ─────────────────────────────────────────────────────────────
export const FeaturedJobsSection = () => {
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

// ── How It Works ──────────────────────────────────────────────────────────────
export const HowItWorksSection = () => (
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

// ── Browse by Industry ────────────────────────────────────────────────────────
export const IndustriesSection = () => {
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

// ── CTA ───────────────────────────────────────────────────────────────────────
export const CTASection = () => {
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

// ── Footer ────────────────────────────────────────────────────────────────────
export const FooterSection = () => (
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
