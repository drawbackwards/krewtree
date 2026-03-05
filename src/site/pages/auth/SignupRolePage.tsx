import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '../../../components'

const TreeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 32 32" fill="currentColor">
    <path d="M16 3L4 17h8l-3 12h14l-3-12h8z" opacity=".9" />
    <rect x="14" y="24" width="4" height="5" rx="1" opacity=".6" />
  </svg>
)

export const SignupRolePage: React.FC = () => {
  const navigate = useNavigate()

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
      {/* ── TOP BAR ──────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 48px',
          borderBottom: '1px solid var(--kt-border)',
        }}
      >
        {/* Logo */}
        <button
          onClick={() => navigate('/site')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--kt-radius-md)',
              background: 'var(--kt-navy-900)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--kt-sand-400)',
            }}
          >
            <TreeIcon />
          </div>
          <span
            style={{
              fontSize: 'var(--kt-text-xl)',
              fontWeight: 'var(--kt-weight-bold)',
              color: 'var(--kt-text)',
              letterSpacing: '-0.3px',
            }}
          >
            krewtree
          </span>
        </button>

        {/* Sign in link */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text-muted)' }}>
            Already have an account?
          </span>
          <button
            onClick={() => navigate('/site/login')}
            style={{
              background: 'none',
              border: '1px solid var(--kt-border)',
              borderRadius: 'var(--kt-radius-md)',
              padding: '7px 16px',
              cursor: 'pointer',
              fontSize: 'var(--kt-text-sm)',
              fontWeight: 'var(--kt-weight-medium)',
              color: 'var(--kt-text)',
              fontFamily: 'var(--kt-font-sans)',
              transition: 'all 0.15s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'var(--kt-surface)'
              e.currentTarget.style.borderColor = 'var(--kt-border-strong)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'none'
              e.currentTarget.style.borderColor = 'var(--kt-border)'
            }}
          >
            Sign in
          </button>
        </div>
      </div>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '64px var(--kt-space-6) 80px',
        }}
      >
        {/* Heading */}
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <h1
            style={{
              fontSize: 'clamp(28px, 4vw, 50px)',
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
            gap: 20,
            width: '100%',
            maxWidth: 900,
          }}
        >
          {/* Worker track */}
          <button
            onClick={() => navigate('/site/signup/worker')}
            style={{
              background: 'var(--kt-navy-900)',
              border: '1px solid rgba(229,218,195,0.1)',
              borderRadius: 'var(--kt-radius-xl)',
              padding: '44px 40px',
              textAlign: 'left',
              cursor: 'pointer',
              fontFamily: 'var(--kt-font-sans)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
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
            <div style={{ fontSize: 40 }}>👷</div>
            <div>
              <Badge variant="accent" size="sm" style={{ marginBottom: 12 }}>
                For Workers
              </Badge>
              <h2
                style={{
                  fontSize: 'var(--kt-text-4xl)',
                  fontWeight: 'var(--kt-weight-bold)',
                  color: 'var(--kt-sand-300)',
                  lineHeight: 1.0,
                  marginBottom: 12,
                  letterSpacing: '-0.5px',
                }}
              >
                I'm looking
                <br />
                for work
              </h2>
              <p
                style={{
                  fontSize: 'var(--kt-text-sm)',
                  color: 'rgba(229,218,195,0.5)',
                  lineHeight: 1.65,
                  maxWidth: 320,
                }}
              >
                Build a free verified profile, browse thousands of jobs, and get hired faster with
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
                'Become Regulix Ready — hire same day',
              ].map((item) => (
                <li
                  key={item}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    fontSize: 'var(--kt-text-sm)',
                    color: 'rgba(229,218,195,0.6)',
                  }}
                >
                  <span style={{ color: 'var(--kt-accent)', fontWeight: 700, flexShrink: 0 }}>
                    ✓
                  </span>{' '}
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
                background: 'var(--kt-accent)',
                color: 'white',
                padding: '11px 22px',
                borderRadius: 'var(--kt-radius-lg)',
                fontWeight: 'var(--kt-weight-semibold)',
                fontSize: 'var(--kt-text-sm)',
              }}
            >
              Create worker account →
            </span>
          </button>

          {/* Company track */}
          <button
            onClick={() => navigate('/site/signup/company')}
            style={{
              background: 'var(--kt-sand-50)',
              border: '1px solid var(--kt-sand-200)',
              borderRadius: 'var(--kt-radius-xl)',
              padding: '44px 40px',
              textAlign: 'left',
              cursor: 'pointer',
              fontFamily: 'var(--kt-font-sans)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(10,35,45,0.12)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'none'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <div style={{ fontSize: 40 }}>🏢</div>
            <div>
              <Badge variant="primary" size="sm" style={{ marginBottom: 12 }}>
                For Companies
              </Badge>
              <h2
                style={{
                  fontSize: 'var(--kt-text-4xl)',
                  fontWeight: 'var(--kt-weight-bold)',
                  color: 'var(--kt-navy-900)',
                  lineHeight: 1.0,
                  marginBottom: 12,
                  letterSpacing: '-0.5px',
                }}
              >
                I'm looking
                <br />
                to hire
              </h2>
              <p
                style={{
                  fontSize: 'var(--kt-text-sm)',
                  color: 'var(--kt-text-muted)',
                  lineHeight: 1.65,
                  maxWidth: 320,
                }}
              >
                Post jobs and find verified, Regulix Ready workers who can start the same day
                they're hired.
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
                  <span style={{ color: 'var(--kt-olive-700)', fontWeight: 700, flexShrink: 0 }}>
                    ✓
                  </span>{' '}
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
                background: 'var(--kt-navy-900)',
                color: 'white',
                padding: '11px 22px',
                borderRadius: 'var(--kt-radius-lg)',
                fontWeight: 'var(--kt-weight-semibold)',
                fontSize: 'var(--kt-text-sm)',
              }}
            >
              Create company account →
            </span>
          </button>
        </div>

        {/* Bottom sign-in nudge */}
        <p
          style={{
            marginTop: 40,
            fontSize: 'var(--kt-text-sm)',
            color: 'var(--kt-text-muted)',
          }}
        >
          Already have an account?{' '}
          <button
            onClick={() => navigate('/site/login')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--kt-accent)',
              fontWeight: 'var(--kt-weight-semibold)',
              fontFamily: 'var(--kt-font-sans)',
              fontSize: 'inherit',
              padding: 0,
            }}
          >
            Sign in →
          </button>
        </p>
      </div>
    </div>
  )
}
