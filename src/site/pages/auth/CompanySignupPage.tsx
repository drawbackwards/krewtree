import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, Select, Checkbox, Badge, Radio } from '../../../components'
import { industries } from '../../data/mock'

const TreeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 32 32" fill="currentColor">
    <path d="M16 3L4 17h8l-3 12h14l-3-12h8z" opacity=".9" />
    <rect x="14" y="24" width="4" height="5" rx="1" opacity=".6" />
  </svg>
)

const BgMark = () => (
  <svg
    width="680"
    height="680"
    viewBox="0 0 32 32"
    fill="rgba(229,218,195,0.05)"
    aria-hidden="true"
    style={{
      position: 'absolute',
      right: '-60px',
      top: '50%',
      transform: 'translateY(-50%)',
      pointerEvents: 'none',
      userSelect: 'none',
    }}
  >
    <path d="M16 3L4 17h8l-3 12h14l-3-12h8z" />
    <rect x="14" y="24" width="4" height="5" rx="1" />
  </svg>
)

const BENEFITS = [
  { icon: '📋', label: 'Post unlimited jobs — 14-day free trial, no credit card' },
  { icon: '👷', label: 'Access 54,000+ verified workers across 8 industries' },
  { icon: '⚡', label: 'Hire same-day with Regulix Ready applicants' },
  { icon: '📬', label: 'Applicant tracking + direct messaging included' },
]

const COMPANY_SIZES = [
  { value: '1-9', label: '1–9' },
  { value: '10-50', label: '10–50' },
  { value: '51-200', label: '51–200' },
  { value: '201+', label: '201+' },
]

export const CompanySignupPage: React.FC = () => {
  const navigate = useNavigate()

  const [companyName, setCompanyName] = useState('')
  const [contactName, setContactName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [industry, setIndustry] = useState('')
  const [companySize, setCompanySize] = useState('10-50')
  const [website, setWebsite] = useState('')
  const [termsAgreed, setTermsAgreed] = useState(false)

  const industryOptions = industries.map((ind) => ({
    value: ind.slug,
    label: `${ind.icon} ${ind.name}`,
  }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!termsAgreed) return
    navigate('/site/dashboard/company')
  }

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
              background: 'var(--kt-sand-400)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--kt-navy-900)',
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
          alignItems: 'flex-start',
          padding: '48px 52px 60px',
          gap: 72,
        }}
      >
        {/* Left — brand text (sticky) */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            position: 'sticky',
            top: 48,
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(229,218,195,0.1)',
              border: '1px solid rgba(229,218,195,0.2)',
              borderRadius: 'var(--kt-radius-full)',
              padding: '4px 12px',
              marginBottom: 18,
            }}
          >
            <span style={{ fontSize: 13 }}>🏢</span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--kt-sand-300)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Company Account
            </span>
          </div>
          <h1
            style={{
              fontSize: 'clamp(28px, 3vw, 44px)',
              fontWeight: 'var(--kt-weight-bold)',
              color: 'var(--kt-sand-300)',
              lineHeight: 1.05,
              marginBottom: 16,
              letterSpacing: '-0.8px',
            }}
          >
            Hire faster.
          </h1>
          <p
            style={{
              fontSize: 'var(--kt-text-md)',
              color: 'rgba(229,218,195,0.45)',
              lineHeight: 1.7,
              marginBottom: 44,
              maxWidth: 340,
            }}
          >
            Post jobs and find Regulix Ready workers who can start the same day they're hired — no
            paperwork delays.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {BENEFITS.map(({ icon, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: 'rgba(229,218,195,0.07)',
                    border: '1px solid rgba(229,218,195,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 15,
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  {icon}
                </div>
                <span
                  style={{
                    fontSize: 'var(--kt-text-sm)',
                    color: 'rgba(229,218,195,0.5)',
                    lineHeight: 1.55,
                    paddingTop: 7,
                  }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Social proof tile */}
          <div
            style={{
              marginTop: 40,
              display: 'inline-flex',
              flexDirection: 'column',
              padding: '16px 20px',
              background: 'rgba(229,218,195,0.05)',
              border: '1px solid rgba(229,218,195,0.1)',
              borderRadius: 12,
            }}
          >
            <span
              style={{
                fontSize: 'var(--kt-text-2xl)',
                fontWeight: 'var(--kt-weight-bold)',
                color: 'var(--kt-sand-300)',
                lineHeight: 1,
              }}
            >
              620+
            </span>
            <span
              style={{
                fontSize: 11,
                color: 'rgba(229,218,195,0.35)',
                marginTop: 4,
                letterSpacing: '0.02em',
              }}
            >
              verified companies hiring on krewtree
            </span>
          </div>
        </div>

        {/* Right — white card */}
        <div
          style={{
            background: 'white',
            borderRadius: 20,
            padding: '40px 44px 48px',
            width: 480,
            flexShrink: 0,
            boxShadow: '0 24px 64px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.2)',
          }}
        >
          <div style={{ marginBottom: 6 }}>
            <Badge variant="primary" size="sm">
              Company Profile
            </Badge>
          </div>
          <h2
            style={{
              fontSize: 'var(--kt-text-2xl)',
              fontWeight: 'var(--kt-weight-bold)',
              color: 'var(--kt-text)',
              marginBottom: 4,
              letterSpacing: '-0.3px',
              marginTop: 10,
            }}
          >
            Create your account
          </h2>
          <p
            style={{
              fontSize: 'var(--kt-text-sm)',
              color: 'var(--kt-text-muted)',
              marginBottom: 28,
            }}
          >
            14-day free trial. No credit card required.
          </p>

          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Input
                label="Company name"
                type="text"
                placeholder="Apex Builders LLC"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
              <Input
                label="Your name"
                type="text"
                placeholder="Alex Brennan"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                required
              />
            </div>

            <Input
              label="Work email"
              type="email"
              placeholder="alex@apexbuilders.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Select
                label="Primary industry"
                placeholder="Select industry"
                options={industryOptions}
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                required
              />
              <Input
                label="Website"
                type="url"
                placeholder="https://yourcompany.com"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                helperText="Optional"
              />
            </div>

            {/* Company size */}
            <div>
              <p
                style={{
                  fontSize: 'var(--kt-text-sm)',
                  fontWeight: 'var(--kt-weight-medium)',
                  color: 'var(--kt-text)',
                  marginBottom: 10,
                }}
              >
                Company size
              </p>
              <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                {COMPANY_SIZES.map(({ value, label }) => (
                  <Radio
                    key={value}
                    label={label}
                    name="company-size"
                    value={value}
                    checked={companySize === value}
                    onChange={() => setCompanySize(value)}
                  />
                ))}
              </div>
            </div>

            <div style={{ height: 1, background: 'var(--kt-border)', margin: '2px 0' }} />

            <Checkbox
              checked={termsAgreed}
              onChange={(e) => setTermsAgreed(e.target.checked)}
              label="I agree to the Terms of Service and Privacy Policy"
              required
            />

            <div style={{ marginTop: 4 }}>
              <Button type="submit" variant="primary" size="lg" fullWidth disabled={!termsAgreed}>
                Create company account →
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

      <p
        style={{
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          padding: '0 0 20px',
          fontSize: 11,
          color: 'rgba(229,218,195,0.15)',
        }}
      >
        A Regulix Partner Platform · © 2026 krewtree
      </p>
    </div>
  )
}
