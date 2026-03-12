import React from 'react'
import { Link } from 'react-router-dom'
import { KrewtreeLogo } from '../../components/Logo'

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
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '22px 52px',
        }}
      >
        {/* Logo */}
        <Link
          to="/site"
          style={{ display: 'inline-flex', lineHeight: 0 }}
          aria-label="krewtree home"
        >
          <KrewtreeLogo height={34} onDark={false} />
        </Link>

        {/* Sign in */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text-muted)' }}>
            Already have an account?
          </span>
          <Link
            to="/site/login"
            style={{
              background: 'transparent',
              color: 'var(--kt-text)',
              border: '1px solid var(--kt-border)',
              borderRadius: 'var(--kt-radius-full)',
              padding: '7px 18px',
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
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 52px 60px',
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
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16,
            width: '100%',
            maxWidth: 820,
          }}
        >
          {/* Worker track */}
          <Link
            to="/site/signup/worker"
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
              textDecoration: 'none',
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
            <img
              src="/icon-worker.png"
              alt=""
              aria-hidden="true"
              style={{ width: 80, height: 80, objectFit: 'contain' }}
            />
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  background: '#103949',
                  border: 'none',
                  borderRadius: 'var(--kt-radius-full)',
                  padding: '3px 10px',
                  marginBottom: 14,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'rgba(229,218,195,0.85)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  For Workers
                </span>
              </div>
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
                }}
              >
                Browse jobs, build a verified profile, and get hired faster with Regulix.
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
                    color: 'rgba(229,218,195,0.65)',
                  }}
                >
                  <span style={{ color: 'var(--kt-accent)', fontWeight: 700, flexShrink: 0 }}>
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <span
              style={{
                alignSelf: 'flex-start',
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
              textDecoration: 'none',
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
            <img
              src="/icon-company.png"
              alt=""
              aria-hidden="true"
              style={{ width: 80, height: 80, objectFit: 'contain' }}
            />
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  background: 'rgba(255,255,255,0.18)',
                  border: 'none',
                  borderRadius: 'var(--kt-radius-full)',
                  padding: '3px 10px',
                  marginBottom: 14,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'white',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  For Companies
                </span>
              </div>
              <h2
                style={{
                  fontSize: 'var(--kt-text-4xl)',
                  fontWeight: 'var(--kt-weight-bold)',
                  color: 'white',
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
                  color: 'rgba(255,255,255,0.65)',
                  lineHeight: 1.6,
                }}
              >
                Post jobs and find Regulix Ready workers who can start the day they're hired.
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
                  <span style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 700, flexShrink: 0 }}>
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <span
              style={{
                alignSelf: 'flex-start',
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
