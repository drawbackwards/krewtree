/**
 * LoginPageV3 — "Left Panel Split"
 * 42% navy brand panel (logo, headline, stat bars) + 58% white form.
 * More enterprise / B2B SaaS feel.
 * Access via: /site/login/v3
 */
import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button, Input } from '../../../components'
import { KrewtreeLogo, KrewtreeBgMark } from '../../components/Logo'
import { useAuth } from '../../context/AuthContext'

const PANEL_STATS = [
  { num: '12,400+', label: 'Active job listings' },
  { num: '54,000+', label: 'Verified workers' },
  { num: '620+', label: 'Hiring companies' },
]

export const LoginPageV3: React.FC = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const isCompanyDemo = searchParams.get('type') === 'company'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPassword('')
    login(isCompanyDemo ? 'company' : 'worker')
    navigate(isCompanyDemo ? '/site/dashboard/company' : '/site/dashboard/worker')
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        fontFamily: 'var(--kt-font-sans)',
      }}
    >
      {/* ── Left panel — navy brand ───────────────────────────────────── */}
      <div
        style={{
          width: '42%',
          flexShrink: 0,
          background: 'var(--kt-navy-900)',
          display: 'flex',
          flexDirection: 'column',
          padding: '36px 52px 36px 52px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Watermark — sand default looks great on navy */}
        <KrewtreeBgMark />

        {/* Logo */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Link
            to="/site"
            aria-label="krewtree home"
            style={{ display: 'inline-flex', lineHeight: 0 }}
          >
            <KrewtreeLogo height={30} onDark />
          </Link>
        </div>

        {/* Center content */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            position: 'relative',
            zIndex: 1,
            paddingTop: 40,
            paddingBottom: 40,
          }}
        >
          <h1
            style={{
              fontSize: 'clamp(30px, 2.8vw, 50px)',
              fontWeight: 800,
              color: 'white',
              lineHeight: 1.05,
              letterSpacing: '-1.5px',
              marginBottom: 18,
            }}
          >
            Real work.
            <br />
            Real workers.
            <br />
            <span style={{ color: 'var(--kt-sand-400)' }}>Right now.</span>
          </h1>
          <p
            style={{
              fontSize: 'var(--kt-text-md)',
              color: 'rgba(255,255,255,0.55)',
              lineHeight: 1.65,
              maxWidth: 310,
              marginBottom: 52,
            }}
          >
            krewtree connects hourly workers with employers who are ready to hire today.
          </p>

          {/* Stats with accent bar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            {PANEL_STATS.map((s) => (
              <div key={s.num} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div
                  style={{
                    width: 3,
                    height: 38,
                    background: 'var(--kt-olive-700)',
                    borderRadius: 2,
                    flexShrink: 0,
                  }}
                />
                <div>
                  <div
                    style={{
                      fontSize: 'clamp(18px, 1.5vw, 22px)',
                      fontWeight: 800,
                      color: 'var(--kt-sand-400)',
                      lineHeight: 1,
                    }}
                  >
                    {s.num}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: 'rgba(255,255,255,0.45)',
                      marginTop: 3,
                    }}
                  >
                    {s.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom footer */}
        <p
          style={{
            position: 'relative',
            zIndex: 1,
            fontSize: 11,
            color: 'rgba(255,255,255,0.18)',
            letterSpacing: '0.02em',
          }}
        >
          A Regulix Partner Platform · © 2026 krewtree
        </p>
      </div>

      {/* ── Right panel — white form ──────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          background: 'white',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* Top-right nav */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 12,
            padding: '24px 40px',
          }}
        >
          <span style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text-muted)' }}>
            New to krewtree?
          </span>
          <Link
            to="/site/signup"
            style={{
              background: 'var(--kt-navy-900)',
              color: 'white',
              borderRadius: 'var(--kt-radius-full)',
              padding: '7px 18px',
              fontSize: 'var(--kt-text-sm)',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'opacity 0.15s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = '0.85')}
            onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
          >
            Create account
          </Link>
        </div>

        {/* Form — vertically centered in remaining space */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px 60px 48px',
          }}
        >
          <div style={{ width: '100%', maxWidth: 380 }}>
            <h2
              style={{
                fontSize: 'var(--kt-text-3xl)',
                fontWeight: 800,
                color: 'var(--kt-grey-900)',
                marginBottom: 6,
                letterSpacing: '-0.5px',
              }}
            >
              Sign in
            </h2>
            <p
              style={{
                fontSize: 'var(--kt-text-sm)',
                color: 'var(--kt-text-muted)',
                marginBottom: 32,
              }}
            >
              Good to have you back.
            </p>

            <form
              onSubmit={handleSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
            >
              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    marginBottom: 6,
                  }}
                >
                  <label
                    htmlFor="v3-login-password"
                    style={{
                      fontSize: 'var(--kt-text-sm)',
                      fontWeight: 600,
                      color: 'var(--kt-text)',
                    }}
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 'var(--kt-text-sm)',
                      color: 'var(--kt-accent)',
                      fontFamily: 'var(--kt-font-sans)',
                      padding: 0,
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
                <Input
                  id="v3-login-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div style={{ marginTop: 4 }}>
                <Button type="submit" variant="primary" size="lg" fullWidth>
                  Sign in →
                </Button>
              </div>
            </form>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '24px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--kt-border)' }} />
              <span
                style={{
                  fontSize: 11,
                  color: 'var(--kt-text-placeholder)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                or
              </span>
              <div style={{ flex: 1, height: 1, background: 'var(--kt-border)' }} />
            </div>

            <p
              style={{
                textAlign: 'center',
                fontSize: 'var(--kt-text-sm)',
                color: 'var(--kt-text-muted)',
              }}
            >
              New to krewtree?{' '}
              <Link
                to="/site/signup"
                style={{
                  color: 'var(--kt-accent)',
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                Create a free account →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
