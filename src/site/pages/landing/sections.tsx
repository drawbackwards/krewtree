import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Badge } from '../../../components'
// TODO: replace with real Supabase queries for featured industries and jobs
import { industries, jobs } from '../../data/mock'
import { JobCard } from '../../components/JobCard/JobCard'
import { CheckIcon } from '../../icons'
import regulixStyles from './RegulixBanner.module.css'
import s from './sections.module.css'

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
          className={s.featuredHeader}
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
          <Button
            className={s.featuredBrowseBtn}
            variant="outline"
            onClick={() => navigate('/site/jobs')}
          >
            Browse All Jobs →
          </Button>
        </div>
        <div
          className={s.featuredGrid}
          style={{
            display: 'grid',
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
      <div
        className={s.stepsRow}
        style={{ display: 'flex', alignItems: 'flex-start', maxWidth: 900, margin: '0 auto' }}
      >
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
                className={s.connector}
                style={{
                  background: 'var(--kt-border)',
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

// ── Industry icon map ─────────────────────────────────────────────────────────
const IndustryIcon = ({ slug }: { slug: string }) => {
  const p = {
    viewBox: '0 0 24 24',
    fill: 'none' as const,
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    width: 26,
    height: 26,
  }
  switch (slug) {
    case 'construction':
      return (
        <svg {...p}>
          <path d="M2 20h20" />
          <path d="M6 20v-5a6 6 0 0112 0v5" />
          <path d="M2 15h20" />
          <path d="M12 3v4M9.5 5.5l2.5 1.5 2.5-1.5" />
        </svg>
      )
    case 'healthcare':
      return (
        <svg {...p}>
          <rect x="3" y="3" width="18" height="18" rx="4" />
          <path d="M12 8v8M8 12h8" />
        </svg>
      )
    case 'hospitality':
      return (
        <svg {...p}>
          <path d="M3 2v7c0 1.1.9 2 2 2h2a2 2 0 002-2V2M7 2v20" />
          <path d="M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h1a2 2 0 012 2v5" />
        </svg>
      )
    case 'retail':
      return (
        <svg {...p}>
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
          <path d="M3 6h18M16 10a4 4 0 01-8 0" />
        </svg>
      )
    case 'transportation':
      return (
        <svg {...p}>
          <path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11v12H5z" />
          <path d="M14 3h4l3 3v9h-7V3z" />
          <circle cx="7" cy="17" r="2" />
          <circle cx="17" cy="17" r="2" />
        </svg>
      )
    case 'manufacturing':
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
      )
    case 'landscaping':
      return (
        <svg {...p}>
          <path d="M17 8C8 10 5.9 16.17 3.82 21" />
          <path d="M9.84 9.98c2.65-3.54 6.82-5.5 11.16-5.98" />
        </svg>
      )
    case 'security':
      return (
        <svg {...p}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      )
    default:
      return null
  }
}

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
          className={s.industriesGrid}
          style={{
            display: 'grid',
            gap: 12,
            maxWidth: 760,
            margin: '0 auto',
          }}
        >
          {industries.map((ind) => (
            <button
              key={ind.id}
              onClick={() => navigate(`/site/jobs?industry=${ind.slug}`)}
              style={{
                background: 'var(--kt-surface)',
                border: 'none',
                borderRadius: 'var(--kt-radius-lg)',
                padding: '24px 16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
                cursor: 'pointer',
                textAlign: 'center',
                fontFamily: 'var(--kt-font-sans)',
                transition:
                  'box-shadow var(--kt-duration-base) var(--kt-ease), transform var(--kt-duration-base) var(--kt-ease)',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.boxShadow = 'var(--kt-shadow-md)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <div style={{ color: ind.color }}>
                <IndustryIcon slug={ind.slug} />
              </div>
              <div>
                <p
                  style={{
                    fontWeight: 'var(--kt-weight-semibold)',
                    color: 'var(--kt-text)',
                    fontSize: 'var(--kt-text-sm)',
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

// ── Regulix Co-Marketing Banner ───────────────────────────────────────────────
const RegulixLogo = () => (
  <svg
    viewBox="0 0 1200 231.54"
    height={28}
    width={Math.round(28 * (1200 / 231.54))}
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Regulix"
    style={{ display: 'block' }}
  >
    <path
      fill="white"
      d="M348.43,173.06l-18.46-42.49h-18.46v42.49h-22.91V58.49h58.4c13.37,0,22.6,9.23,22.6,22.6v26.89c0,10.82-6.05,18.94-15.59,21.64l19.1,43.44h-24.66ZM346.67,85.54c0-3.5-1.91-5.41-5.41-5.41h-29.76v29.12h29.76c3.5,0,5.41-1.91,5.41-5.41v-18.3Z"
    />
    <path
      fill="white"
      d="M514.7,58.49v21.64h-52.03v23.55h42.17v21.64h-42.17v26.1h52.03v21.64h-74.95V58.49h74.95Z"
    />
    <path
      fill="white"
      d="M638.65,84.9c0-3.5-1.91-5.41-5.41-5.41h-26.26c-3.5,0-5.41,1.91-5.41,5.41v61.74c0,3.5,1.91,5.41,5.41,5.41h26.26c3.5,0,5.41-1.91,5.41-5.41v-17.03h-21v-20.69h43.92v42.17c0,13.37-9.23,22.6-22.6,22.6h-37.71c-13.37,0-22.6-9.23-22.6-22.6v-70.65c0-13.37,9.23-22.6,22.6-22.6h37.71c13.37,0,22.6,9.23,22.6,22.6v14.96h-22.91v-10.5Z"
    />
    <path
      fill="white"
      d="M811.29,151.1c0,13.37-9.23,22.6-22.6,22.6h-36.6c-13.37,0-22.6-9.23-22.6-22.6V58.49h22.91v88.15c0,3.5,1.91,5.41,5.41,5.41h25.14c3.5,0,5.41-1.91,5.41-5.41V58.49h22.91v92.61Z"
    />
    <path fill="white" d="M905.32,58.49v92.93h48.06v21.64h-70.97V58.49h22.91Z" />
    <path fill="white" d="M1018.45,58.49h22.91v114.57h-22.91V58.49Z" />
    <path
      fill="white"
      d="M1128.87,173.06h-24.98l34.37-58.72-33.42-55.85h26.73l21.32,36.12,21.16-36.12h24.98l-33.26,57.29,34.21,57.28h-26.73l-22.28-37.87-22.12,37.87Z"
    />
    <rect fill="#ff3d00" x="0" y="57.89" width="57.89" height="57.89" rx="5.79" ry="5.79" />
    <path
      fill="#ff3d00"
      d="M197.66,226.6l-35.99-35.99c-8.87-8.87-20.31-14.56-32.57-16.35-.44-.16-.76-.58-.76-1.08,0-.46.28-.86.67-1.05.14-.03.29-.07.43-.11.02,0,.04,0,.05,0h-.03c25.36-6.15,44.2-29,44.2-56.25v-57.89c0-31.97-25.92-57.89-57.89-57.89h-52.1c-3.2,0-5.79,2.59-5.79,5.79v46.31c0,3.2,2.59,5.79,5.79,5.79h46.31c3.2,0,5.79,2.59,5.79,5.79v46.31c0,3.2-2.59,5.79-5.79,5.79h-46.31c-3.2,0-5.79,2.59-5.79,5.79v47.3c0,3.07,1.22,6.02,3.39,8.19l52.8,52.8c1.09,1.09,2.56,1.7,4.09,1.7h77.44c2.58,0,3.87-3.12,2.05-4.94Z"
    />
  </svg>
)

export const RegulixBannerSection = () => (
  <section style={{ padding: '80px var(--kt-space-6)', background: 'var(--kt-navy-900)' }}>
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Section header */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <RegulixLogo />
        </div>
        <h2
          style={{
            fontSize: 'var(--kt-text-3xl)',
            fontWeight: 'var(--kt-weight-bold)',
            color: 'white',
            marginBottom: 12,
            letterSpacing: '-0.3px',
          }}
        >
          Compliance built in from day one.
        </h2>
        <p
          style={{
            fontSize: 'var(--kt-text-lg)',
            color: 'rgba(255,255,255,0.65)',
            maxWidth: 520,
            margin: '0 auto',
            lineHeight: 'var(--kt-leading-normal)',
          }}
        >
          krewtree partners with Regulix so workers get verified faster and companies stay compliant
          automatically.
        </p>
      </div>

      {/* Two cards — subgrid so badge/h3/p/ul rows align across both columns */}
      <div className={regulixStyles.cardsGrid}>
        {/* Workers half */}
        <div className={regulixStyles.card}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Badge
              variant="accent"
              size="sm"
              style={{ background: 'rgba(255,255,255,0.18)', color: 'white', border: 'none' }}
            >
              For Workers
            </Badge>
          </div>
          <h3
            style={{
              fontSize: 'var(--kt-text-xl)',
              fontWeight: 'var(--kt-weight-bold)',
              color: 'white',
              lineHeight: 1.3,
              letterSpacing: '-0.3px',
              margin: 0,
              alignSelf: 'start',
            }}
          >
            Start work immediately when your employer uses Regulix.
          </h3>
          <p
            style={{
              fontSize: 'var(--kt-text-sm)',
              color: 'rgba(255,255,255,0.6)',
              lineHeight: 1.6,
              margin: 0,
              alignSelf: 'start',
            }}
          >
            When you and your employer both use Regulix, compliance is already handled so you can
            get to work immediately.
          </p>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              alignSelf: 'start',
            }}
          >
            {[
              'Classification verified upfront',
              'Your records, always clean',
              'Instant hire, zero friction',
            ].map((item) => (
              <li
                key={item}
                style={{
                  fontSize: 'var(--kt-text-sm)',
                  color: 'rgba(255,255,255,0.65)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <CheckIcon size={14} color="white" /> {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Companies half */}
        <div className={regulixStyles.card}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Badge
              variant="accent"
              size="sm"
              style={{ background: 'var(--kt-olive-700)', color: 'white', border: 'none' }}
            >
              For Companies
            </Badge>
          </div>
          <h3
            style={{
              fontSize: 'var(--kt-text-xl)',
              fontWeight: 'var(--kt-weight-bold)',
              color: 'white',
              lineHeight: 1.3,
              letterSpacing: '-0.3px',
              margin: 0,
              alignSelf: 'start',
            }}
          >
            Hire verified workers today. Compliance already done.
          </h3>
          <p
            style={{
              fontSize: 'var(--kt-text-sm)',
              color: 'rgba(255,255,255,0.6)',
              lineHeight: 1.6,
              margin: 0,
              alignSelf: 'start',
            }}
          >
            When a worker already has a Regulix account, your compliance is pre-verified. Skip the
            setup and bring them on immediately.
          </p>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              alignSelf: 'start',
            }}
          >
            {[
              'Same day onboarding',
              'Worker classification documented',
              'Continuous compliance logging',
            ].map((item) => (
              <li
                key={item}
                style={{
                  fontSize: 'var(--kt-text-sm)',
                  color: 'rgba(255,255,255,0.65)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <CheckIcon size={14} color="white" /> {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Footer CTA */}
      <div style={{ textAlign: 'center', marginTop: 36 }}>
        <Button
          className={s.regulixCta}
          as="a"
          variant="secondary"
          size="lg"
          href="https://regulix.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn More About Regulix →
        </Button>
      </div>
    </div>
  </section>
)

// ── CTA ───────────────────────────────────────────────────────────────────────
export const CTASection = () => {
  const navigate = useNavigate()
  return (
    <section
      style={{
        background: 'var(--kt-navy-950)',
        padding: '80px var(--kt-space-6)',
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <h2
          style={{
            fontSize: 'clamp(28px, 4vw, 48px)',
            fontWeight: 'var(--kt-weight-bold)',
            color: 'white',
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
            color: 'rgba(255,255,255,0.65)',
            marginBottom: 40,
            lineHeight: 1.6,
          }}
        >
          Join thousands of workers and employers already using krewtree to find faster, better
          matches.
        </p>
        <div
          className={s.ctaButtons}
          style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}
        >
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
    className={s.footer}
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
    <div className={s.footerBrand} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
        A Regulix Partner Platform
      </span>
    </div>
    <div
      className={s.footerLinks}
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
    <span
      className={s.footerCopyright}
      style={{ fontSize: 'var(--kt-text-sm)', color: 'rgba(229,218,195,0.25)' }}
    >
      © 2026 krewtree. All rights reserved.
    </span>
  </footer>
)
