import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '../../components'
import { useAuth } from '../context/AuthContext'
import { CheckIcon } from '../icons'
import styles from './landing/LandingHero.module.css'
import {
  FeaturedJobsSection,
  HowItWorksSection,
  IndustriesSection,
  RegulixBannerSection,
  CTASection,
  FooterSection,
} from './landing/sections'

// ═════════════════════════════════════════════════════════════════════════════
// HERO DEFAULT: D TRACK + B CENTER
// Centered question (B aesthetic) → two path cards (D track)
// ═════════════════════════════════════════════════════════════════════════════
const HeroDefault = () => {
  const navigate = useNavigate()
  const { setPersona } = useAuth()
  return (
    <section style={{ background: 'var(--kt-bg)', borderBottom: '1px solid var(--kt-border)' }}>
      {/* Centered header */}
      <div
        className={styles.heroHeader}
        style={{ textAlign: 'center', padding: '80px var(--kt-space-6) 52px' }}
      >
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
        className={styles.heroGrid}
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '0 var(--kt-space-6) 64px',
          display: 'grid',
          gap: 20,
        }}
      >
        {/* Worker track */}
        <button
          onClick={() => {
            setPersona('worker')
            navigate('/site/signup/worker')
          }}
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
          <div className={styles.cardTop}>
            <Badge
              className={styles.cardBadge}
              variant="accent"
              size="sm"
              style={{
                background: 'var(--kt-badge-worker-bg)',
                color: 'rgba(229,218,195,0.85)',
                border: 'none',
              }}
            >
              For Workers
            </Badge>
            <div className={styles.cardIconHeadline}>
              <img
                src="/icon-worker.png"
                alt=""
                aria-hidden="true"
                style={{ width: 80, height: 80, objectFit: 'contain', flexShrink: 0 }}
              />
              <h2
                className={styles.cardHeadline}
                style={{
                  fontWeight: 'var(--kt-weight-bold)',
                  color: 'white',
                  lineHeight: 1.0,
                  letterSpacing: '-0.5px',
                }}
              >
                I'm looking
                <br />
                for work
              </h2>
            </div>
          </div>
          <p
            style={{
              fontSize: 'var(--kt-text-md)',
              color: 'rgba(255,255,255,0.65)',
              lineHeight: 1.6,
              maxWidth: 340,
            }}
          >
            Find jobs across every industry, build a verified profile, and get hired faster with
            Regulix.
          </p>
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
                  color: 'rgba(255,255,255,0.65)',
                }}
              >
                <CheckIcon size={14} color="rgba(255,255,255,0.9)" /> {item}
              </li>
            ))}
          </ul>
          <span
            className={styles.cardCta}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'white',
              color: 'var(--kt-navy-900)',
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
          onClick={() => {
            setPersona('company')
            navigate('/site/signup/company')
          }}
          style={{
            background: 'var(--kt-olive-700)',
            border: '1px solid rgba(255,255,255,0.15)',
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
            e.currentTarget.style.boxShadow = '0 20px 40px rgba(109,117,49,0.35)'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'none'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <div className={styles.cardTop}>
            <Badge
              className={styles.cardBadge}
              variant="secondary"
              size="sm"
              style={{
                background: 'rgba(255,255,255,0.18)',
                color: 'white',
                border: 'none',
              }}
            >
              For Companies
            </Badge>
            <div className={styles.cardIconHeadline}>
              <img
                src="/icon-company.png"
                alt=""
                aria-hidden="true"
                style={{ width: 80, height: 80, objectFit: 'contain', flexShrink: 0 }}
              />
              <h2
                className={styles.cardHeadline}
                style={{
                  fontWeight: 'var(--kt-weight-bold)',
                  color: 'white',
                  lineHeight: 1.0,
                  letterSpacing: '-0.5px',
                }}
              >
                I'm looking
                <br />
                to hire
              </h2>
            </div>
          </div>
          <p
            style={{
              fontSize: 'var(--kt-text-md)',
              color: 'rgba(255,255,255,0.65)',
              lineHeight: 1.6,
              maxWidth: 340,
            }}
          >
            Post jobs, find verified workers, and hire people who can start tomorrow — paperwork
            already done.
          </p>
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
                  color: 'rgba(255,255,255,0.65)',
                }}
              >
                <CheckIcon size={14} color="rgba(255,255,255,0.9)" /> {item}
              </li>
            ))}
          </ul>
          <span
            className={styles.cardCta}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'white',
              color: 'var(--kt-olive-700)',
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
          className={styles.statsGrid}
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 0,
            paddingTop: 40,
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
              key={s.num}
              className={styles.statItem}
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
// MAIN EXPORT
// ═════════════════════════════════════════════════════════════════════════════
export const LandingPage: React.FC = () => (
  <div style={{ minHeight: '100vh', background: 'var(--kt-bg)' }}>
    <HeroDefault />
    <FeaturedJobsSection />
    <HowItWorksSection />
    <IndustriesSection />
    <RegulixBannerSection />
    <CTASection />
    <FooterSection />
  </div>
)
