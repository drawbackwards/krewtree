import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, Checkbox, Badge } from '../../../components'
import { industries } from '../../data/mock'

const TreeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 32 32" fill="currentColor">
    <path d="M16 3L4 17h8l-3 12h14l-3-12h8z" opacity=".9" />
    <rect x="14" y="24" width="4" height="5" rx="1" opacity=".6" />
  </svg>
)

const BENEFITS = [
  { icon: '💼', label: 'Browse 12,400+ jobs across 8 industries' },
  { icon: '🪪', label: 'One profile works everywhere you want to work' },
  { icon: '⚡', label: 'Get Regulix Ready — get hired same day' },
  { icon: '✨', label: 'Free to sign up, always' },
]

export const WorkerSignupPage: React.FC = () => {
  const navigate = useNavigate()

  // Form state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [location, setLocation] = useState('')
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([])
  const [regulixOptIn, setRegulixOptIn] = useState(false)
  const [termsAgreed, setTermsAgreed] = useState(false)

  const toggleIndustry = (slug: string) => {
    setSelectedIndustries((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!termsAgreed) return
    // Mock: navigate to worker dashboard
    navigate('/site/dashboard/worker')
  }

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        fontFamily: 'var(--kt-font-sans)',
        background: 'var(--kt-bg)',
      }}
    >
      {/* ── LEFT BRAND PANEL ─────────────────────────────────────────── */}
      <div
        style={{
          width: '42%',
          minWidth: 360,
          flexShrink: 0,
          background: 'var(--kt-navy-900)',
          display: 'flex',
          flexDirection: 'column',
          padding: '40px 48px',
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflowY: 'auto',
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
            alignSelf: 'flex-start',
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 'var(--kt-radius-md)',
              background: 'var(--kt-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              flexShrink: 0,
            }}
          >
            <TreeIcon />
          </div>
          <span
            style={{
              fontSize: 'var(--kt-text-xl)',
              fontWeight: 'var(--kt-weight-bold)',
              color: 'var(--kt-sand-300)',
            }}
          >
            krewtree
          </span>
        </button>

        {/* Center content */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            paddingTop: 60,
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(109,117,49,0.25)',
              border: '1px solid rgba(109,117,49,0.4)',
              borderRadius: 'var(--kt-radius-full)',
              padding: '5px 12px',
              marginBottom: 20,
              alignSelf: 'flex-start',
            }}
          >
            <span style={{ fontSize: 14 }}>👷</span>
            <span
              style={{
                fontSize: 'var(--kt-text-xs)',
                fontWeight: 'var(--kt-weight-semibold)',
                color: 'var(--kt-sand-300)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Worker Account
            </span>
          </div>

          <h2
            style={{
              fontSize: 'clamp(26px, 2.8vw, 40px)',
              fontWeight: 'var(--kt-weight-bold)',
              color: 'var(--kt-sand-300)',
              lineHeight: 1.1,
              marginBottom: 16,
              letterSpacing: '-0.5px',
            }}
          >
            Find work faster.
          </h2>
          <p
            style={{
              fontSize: 'var(--kt-text-md)',
              color: 'rgba(229,218,195,0.5)',
              lineHeight: 1.7,
              marginBottom: 44,
              maxWidth: 340,
            }}
          >
            Create a free profile and get connected to thousands of employers across every industry.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {BENEFITS.map(({ icon, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 'var(--kt-radius-md)',
                    background: 'rgba(229,218,195,0.07)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  {icon}
                </div>
                <span
                  style={{
                    fontSize: 'var(--kt-text-sm)',
                    color: 'rgba(229,218,195,0.55)',
                    lineHeight: 1.5,
                    paddingTop: 8,
                  }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Social proof */}
          <div
            style={{
              marginTop: 44,
              padding: '16px 20px',
              background: 'rgba(229,218,195,0.05)',
              borderRadius: 'var(--kt-radius-lg)',
              border: '1px solid rgba(229,218,195,0.1)',
            }}
          >
            <div
              style={{
                fontSize: 'var(--kt-text-2xl)',
                fontWeight: 'var(--kt-weight-bold)',
                color: 'var(--kt-sand-300)',
              }}
            >
              54,000+
            </div>
            <div
              style={{
                fontSize: 'var(--kt-text-xs)',
                color: 'rgba(229,218,195,0.4)',
                marginTop: 2,
              }}
            >
              workers already on krewtree
            </div>
          </div>
        </div>

        {/* Footer */}
        <p style={{ fontSize: 'var(--kt-text-xs)', color: 'rgba(229,218,195,0.2)', marginTop: 40 }}>
          A Regulix Partner Platform · © 2026 krewtree
        </p>
      </div>

      {/* ── RIGHT FORM PANEL ─────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        {/* Top bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            padding: '20px 48px',
            gap: 12,
            borderBottom: '1px solid var(--kt-border)',
          }}
        >
          <span style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text-muted)' }}>
            Already have an account?
          </span>
          <Button variant="outline" size="sm" onClick={() => navigate('/site/login')}>
            Sign in
          </Button>
        </div>

        {/* Form area */}
        <div
          style={{
            padding: '48px 48px 64px',
            maxWidth: 580,
            width: '100%',
            margin: '0 auto',
          }}
        >
          <div style={{ marginBottom: 8 }}>
            <Badge variant="accent" size="sm">
              Worker Profile
            </Badge>
          </div>
          <h1
            style={{
              fontSize: 'var(--kt-text-3xl)',
              fontWeight: 'var(--kt-weight-bold)',
              color: 'var(--kt-text)',
              marginBottom: 6,
              letterSpacing: '-0.3px',
              marginTop: 12,
            }}
          >
            Create your account
          </h1>
          <p
            style={{
              fontSize: 'var(--kt-text-md)',
              color: 'var(--kt-text-muted)',
              marginBottom: 36,
            }}
          >
            Free forever. No credit card required.
          </p>

          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: 22 }}
          >
            {/* Name + Location row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Input
                label="Full name"
                type="text"
                placeholder="Marcus Torres"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                label="City, State"
                type="text"
                placeholder="Phoenix, AZ"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>

            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {/* Password row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Input
                label="Password"
                type="password"
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Input
                label="Confirm password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {/* Industry chips */}
            <div>
              <p
                style={{
                  fontSize: 'var(--kt-text-sm)',
                  fontWeight: 'var(--kt-weight-medium)',
                  color: 'var(--kt-text)',
                  marginBottom: 10,
                }}
              >
                Industries you work in{' '}
                <span style={{ color: 'var(--kt-text-muted)', fontWeight: 400 }}>
                  (select all that apply)
                </span>
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {industries.map((ind) => {
                  const active = selectedIndustries.includes(ind.slug)
                  return (
                    <button
                      key={ind.id}
                      type="button"
                      onClick={() => toggleIndustry(ind.slug)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 14px',
                        borderRadius: 'var(--kt-radius-full)',
                        border: `1.5px solid ${active ? 'var(--kt-accent)' : 'var(--kt-border)'}`,
                        background: active ? 'var(--kt-accent)' : 'transparent',
                        color: active ? 'white' : 'var(--kt-text)',
                        cursor: 'pointer',
                        fontSize: 'var(--kt-text-sm)',
                        fontFamily: 'var(--kt-font-sans)',
                        fontWeight: active ? 'var(--kt-weight-medium)' : 'var(--kt-weight-normal)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span style={{ fontSize: 14 }}>{ind.icon}</span>
                      {ind.name}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: 'var(--kt-border)', margin: '4px 0' }} />

            {/* Checkboxes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Checkbox
                checked={regulixOptIn}
                onChange={(e) => setRegulixOptIn(e.target.checked)}
                label="Start my Regulix verification to become hire-ready"
                helperText="Complete onboarding paperwork once and use it everywhere. Takes ~10 minutes."
              />
              <Checkbox
                checked={termsAgreed}
                onChange={(e) => setTermsAgreed(e.target.checked)}
                label="I agree to the Terms of Service and Privacy Policy"
                required
              />
            </div>

            {/* Submit */}
            <div style={{ marginTop: 4 }}>
              <Button type="submit" variant="accent" size="lg" fullWidth disabled={!termsAgreed}>
                Create free account →
              </Button>
            </div>

            <p
              style={{
                textAlign: 'center',
                fontSize: 'var(--kt-text-sm)',
                color: 'var(--kt-text-muted)',
              }}
            >
              Wrong path?{' '}
              <button
                type="button"
                onClick={() => navigate('/site/signup')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--kt-accent)',
                  fontFamily: 'var(--kt-font-sans)',
                  fontSize: 'inherit',
                  padding: 0,
                }}
              >
                Go back and choose your path
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
