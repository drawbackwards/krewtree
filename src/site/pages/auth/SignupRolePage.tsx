import React from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '../../../components'
import { KrewtreeLogo } from '../../components/Logo'
import { CheckIcon } from '../../icons'
import styles from './SignupRolePage.module.css'

export const SignupRolePage: React.FC = () => {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--kt-bg)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--kt-font-sans)',
      }}
    >
      {/* ── Top bar ────────────────────────────────────────────────── */}
      <div
        className={styles.topBar}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {/* Logo */}
        <Link
          to="/site"
          style={{ display: 'inline-flex', lineHeight: 0 }}
          aria-label="krewtree home"
        >
          <KrewtreeLogo height={30} onDark={false} />
        </Link>

        {/* Sign in */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            className={styles.alreadyLabel}
            style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text-muted)' }}
          >
            Already have an account?
          </span>
          <Link
            to="/site/login"
            style={{
              background: 'transparent',
              color: 'var(--kt-text)',
              border: '1px solid var(--kt-border)',
              borderRadius: 'var(--kt-radius-full)',
              padding: '6px 16px',
              fontSize: 'var(--kt-text-sm)',
              fontWeight: 'var(--kt-weight-medium)',
              textDecoration: 'none',
              transition: 'all 0.15s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'var(--kt-bg-subtle)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
          >
            Sign in
          </Link>
        </div>
      </div>

      {/* ── Main content ───────────────────────────────────────────── */}
      <div
        className={styles.mainContent}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Heading */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1
            style={{
              fontSize: 'clamp(30px, 4vw, 52px)',
              fontWeight: 300,
              color: 'var(--kt-text)',
              letterSpacing: '-1.5px',
              lineHeight: 1.1,
              marginBottom: 14,
            }}
          >
            Join <strong style={{ fontWeight: 700 }}>krewtree</strong>
          </h1>
          <p
            style={{
              fontSize: 'var(--kt-text-lg)',
              color: 'var(--kt-text-muted)',
              maxWidth: 440,
              margin: '0 auto',
              lineHeight: 1.6,
            }}
          >
            The job board built for real work — pick your path to get started.
          </p>
        </div>

        {/* Two track cards */}
        <div className={styles.cardGrid}>
          {/* Worker track */}
          <Link
            to="/site/signup/worker"
            className={styles.card}
            style={{
              background: 'var(--kt-navy-900)',
              border: '1px solid rgba(229,218,195,0.1)',
              borderRadius: 'var(--kt-radius-xl)',
              cursor: 'pointer',
              fontFamily: 'var(--kt-font-sans)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              textAlign: 'left',
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
              Browse jobs, build a verified profile, and get hired faster with Regulix.
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
                'One profile works everywhere',
                'Become Regulix Ready',
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
                  <CheckIcon size={14} color="rgba(255,255,255,0.9)" />
                  {item}
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
              Create worker account →
            </span>
          </Link>

          {/* Company track */}
          <Link
            to="/site/signup/company"
            className={styles.card}
            style={{
              background: 'var(--kt-olive-700)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 'var(--kt-radius-xl)',
              cursor: 'pointer',
              fontFamily: 'var(--kt-font-sans)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              textAlign: 'left',
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
              Post jobs and find Regulix Ready workers who can start the day they're hired.
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
                'Access 54,000+ verified workers',
                'Hire same-day — no delays',
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
                  <CheckIcon size={14} color="rgba(255,255,255,0.9)" />
                  {item}
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
              Create company account →
            </span>
          </Link>
        </div>

        {/* Bottom nudge */}
        <p
          style={{
            marginTop: 36,
            fontSize: 'var(--kt-text-sm)',
            color: 'var(--kt-text-muted)',
          }}
        >
          Already have an account?{' '}
          <Link
            to="/site/login"
            style={{
              color: 'var(--kt-text)',
              fontWeight: 'var(--kt-weight-semibold)',
              textDecoration: 'none',
            }}
          >
            Sign in →
          </Link>
        </p>
      </div>

      {/* Bottom wordmark */}
      <p
        style={{
          textAlign: 'center',
          padding: '0 0 20px',
          fontSize: 11,
          color: 'var(--kt-text-muted)',
          letterSpacing: '0.02em',
        }}
      >
        A Regulix Partner Platform · © 2026 krewtree
      </p>
    </div>
  )
}
