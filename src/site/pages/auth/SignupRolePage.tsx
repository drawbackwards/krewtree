import React from 'react'
import { useNavigate } from 'react-router-dom'

const TreeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 32 32" fill="currentColor">
    <path d="M16 3L4 17h8l-3 12h14l-3-12h8z" opacity=".9" />
    <rect x="14" y="24" width="4" height="5" rx="1" opacity=".6" />
  </svg>
)

const BgMark = () => (
  <svg
    width="700"
    height="700"
    viewBox="0 0 32 32"
    fill="rgba(229,218,195,0.05)"
    aria-hidden="true"
    style={{
      position: 'absolute',
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
      pointerEvents: 'none',
      userSelect: 'none',
    }}
  >
    <path d="M16 3L4 17h8l-3 12h14l-3-12h8z" />
    <rect x="14" y="24" width="4" height="5" rx="1" />
  </svg>
)

export const SignupRolePage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--kt-navy-900)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--kt-font-sans)',
      }}
    >
      <BgMark />

      {/* ── Top bar ────────────────────────────────────────────────── */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '22px 52px',
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
              width: 34,
              height: 34,
              borderRadius: 8,
              background: 'var(--kt-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}
          >
            <TreeIcon />
          </div>
          <span
            style={{
              fontSize: 'var(--kt-text-xl)',
              fontWeight: 'var(--kt-weight-bold)',
              color: 'var(--kt-sand-300)',
              letterSpacing: '-0.3px',
            }}
          >
            krewtree
          </span>
        </button>

        {/* Sign in */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 'var(--kt-text-sm)', color: 'rgba(229,218,195,0.45)' }}>
            Already have an account?
          </span>
          <button
            onClick={() => navigate('/site/login')}
            style={{
              background: 'rgba(229,218,195,0.1)',
              color: 'var(--kt-sand-300)',
              border: '1px solid rgba(229,218,195,0.2)',
              borderRadius: 'var(--kt-radius-full)',
              padding: '7px 18px',
              fontSize: 'var(--kt-text-sm)',
              fontWeight: 'var(--kt-weight-medium)',
              cursor: 'pointer',
              fontFamily: 'var(--kt-font-sans)',
              transition: 'all 0.15s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(229,218,195,0.16)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(229,218,195,0.1)'
            }}
          >
            Sign in
          </button>
        </div>
      </div>

      {/* ── Main content ───────────────────────────────────────────── */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
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
              color: 'var(--kt-sand-300)',
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
              color: 'rgba(229,218,195,0.45)',
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
          <button
            onClick={() => navigate('/site/signup/worker')}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(229,218,195,0.14)',
              borderRadius: 16,
              padding: '36px 32px',
              textAlign: 'left',
              cursor: 'pointer',
              fontFamily: 'var(--kt-font-sans)',
              transition: 'transform 0.2s ease, background 0.2s ease, border-color 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)'
              e.currentTarget.style.background = 'rgba(255,255,255,0.09)'
              e.currentTarget.style.borderColor = 'rgba(229,218,195,0.25)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'none'
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
              e.currentTarget.style.borderColor = 'rgba(229,218,195,0.14)'
            }}
          >
            <div style={{ fontSize: 36 }}>👷</div>
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  background: 'rgba(109,117,49,0.3)',
                  border: '1px solid rgba(109,117,49,0.5)',
                  borderRadius: 'var(--kt-radius-full)',
                  padding: '3px 10px',
                  marginBottom: 10,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--kt-sand-300)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  For Workers
                </span>
              </div>
              <h2
                style={{
                  fontSize: 'var(--kt-text-3xl)',
                  fontWeight: 'var(--kt-weight-bold)',
                  color: 'var(--kt-sand-300)',
                  lineHeight: 1.05,
                  marginBottom: 10,
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
                  color: 'rgba(229,218,195,0.45)',
                  lineHeight: 1.6,
                }}
              >
                Browse jobs, build a verified profile, and get hired faster with Regulix.
              </p>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
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
                    gap: 8,
                    fontSize: 'var(--kt-text-sm)',
                    color: 'rgba(229,218,195,0.5)',
                    marginBottom: 7,
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
                background: 'var(--kt-accent)',
                color: 'white',
                padding: '9px 18px',
                borderRadius: 8,
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
              borderRadius: 16,
              padding: '36px 32px',
              textAlign: 'left',
              cursor: 'pointer',
              fontFamily: 'var(--kt-font-sans)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)'
              e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.2)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'none'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <div style={{ fontSize: 36 }}>🏢</div>
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  background: 'var(--kt-navy-900)',
                  border: '1px solid rgba(10,35,45,0.2)',
                  borderRadius: 'var(--kt-radius-full)',
                  padding: '3px 10px',
                  marginBottom: 10,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--kt-sand-300)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  For Companies
                </span>
              </div>
              <h2
                style={{
                  fontSize: 'var(--kt-text-3xl)',
                  fontWeight: 'var(--kt-weight-bold)',
                  color: 'var(--kt-navy-900)',
                  lineHeight: 1.05,
                  marginBottom: 10,
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
                  lineHeight: 1.6,
                }}
              >
                Post jobs and find Regulix Ready workers who can start the day they're hired.
              </p>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
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
                    gap: 8,
                    fontSize: 'var(--kt-text-sm)',
                    color: 'var(--kt-text-muted)',
                    marginBottom: 7,
                  }}
                >
                  <span style={{ color: 'var(--kt-olive-700)', fontWeight: 700, flexShrink: 0 }}>
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <span
              style={{
                alignSelf: 'flex-start',
                background: 'var(--kt-navy-900)',
                color: 'white',
                padding: '9px 18px',
                borderRadius: 8,
                fontWeight: 'var(--kt-weight-semibold)',
                fontSize: 'var(--kt-text-sm)',
              }}
            >
              Create company account →
            </span>
          </button>
        </div>

        {/* Bottom nudge */}
        <p
          style={{
            marginTop: 36,
            fontSize: 'var(--kt-text-sm)',
            color: 'rgba(229,218,195,0.35)',
          }}
        >
          Already have an account?{' '}
          <button
            onClick={() => navigate('/site/login')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--kt-sand-300)',
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

      {/* Bottom wordmark */}
      <p
        style={{
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          padding: '0 0 20px',
          fontSize: 11,
          color: 'rgba(229,218,195,0.15)',
          letterSpacing: '0.02em',
        }}
      >
        A Regulix Partner Platform · © 2026 krewtree
      </p>
    </div>
  )
}
