/**
 * LoginPageV2 — "Dark Minimal"
 * Navy full-page background, single centered white card.
 * No marketing copy — pure, focused auth. Linear/Vercel-style.
 * Access via: /site/login/v2
 */
import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button, Input } from '../../../components'
import { KrewtreeLogo } from '../../components/Logo'
import { useAuth } from '../../context/AuthContext'

export const LoginPageV2: React.FC = () => {
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
        background: 'var(--kt-navy-900)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--kt-font-sans)',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '24px 40px',
        }}
      >
        <Link
          to="/site"
          aria-label="krewtree home"
          style={{ display: 'inline-flex', lineHeight: 0 }}
        >
          <KrewtreeLogo height={30} onDark />
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 'var(--kt-text-sm)', color: 'rgba(255,255,255,0.4)' }}>
            New to krewtree?
          </span>
          <Link
            to="/site/signup"
            style={{
              background: 'rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.88)',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: 'var(--kt-radius-full)',
              padding: '7px 18px',
              fontSize: 'var(--kt-text-sm)',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'background 0.15s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.13)')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
          >
            Create account
          </Link>
        </div>
      </div>

      {/* Centered form area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        <div
          style={{
            background: 'white',
            borderRadius: 20,
            padding: '48px 44px 44px',
            width: '100%',
            maxWidth: 400,
            boxShadow: '0 32px 80px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.25)',
          }}
        >
          <h2
            style={{
              fontSize: 'var(--kt-text-2xl)',
              fontWeight: 800,
              color: 'var(--kt-grey-900)',
              marginBottom: 4,
              letterSpacing: '-0.5px',
            }}
          >
            Sign in
          </h2>
          <p
            style={{
              fontSize: 'var(--kt-text-sm)',
              color: 'var(--kt-text-muted)',
              marginBottom: 28,
            }}
          >
            Welcome back to krewtree.
          </p>

          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
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
                  htmlFor="v2-login-password"
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
                  Forgot?
                </button>
              </div>
              <Input
                id="v2-login-password"
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '22px 0' }}>
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
            Don't have an account?{' '}
            <Link
              to="/site/signup"
              style={{
                color: 'var(--kt-accent)',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Sign up free →
            </Link>
          </p>
        </div>
      </div>

      {/* Footer */}
      <p
        style={{
          textAlign: 'center',
          padding: '0 0 24px',
          fontSize: 11,
          color: 'rgba(255,255,255,0.18)',
          letterSpacing: '0.02em',
        }}
      >
        A Regulix Partner Platform · © 2026 krewtree
      </p>
    </div>
  )
}
