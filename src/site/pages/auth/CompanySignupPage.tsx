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

const BENEFITS = [
  { icon: '📋', label: 'Post unlimited jobs — 14-day free trial, no credit card' },
  { icon: '👷', label: 'Access 54,000+ verified workers across 8 industries' },
  { icon: '⚡', label: 'Hire same-day with Regulix Ready applicants' },
  { icon: '📬', label: 'Applicant tracking + direct messaging included' },
]

const COMPANY_SIZES = [
  { value: '1-9', label: '1–9 employees' },
  { value: '10-50', label: '10–50 employees' },
  { value: '51-200', label: '51–200 employees' },
  { value: '201+', label: '201+ employees' },
]

export const CompanySignupPage: React.FC = () => {
  const navigate = useNavigate()

  // Form state
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
    // Mock: navigate to company dashboard
    navigate('/site/dashboard/company')
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
              background: 'var(--kt-sand-400)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--kt-navy-900)',
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
              background: 'rgba(229,218,195,0.1)',
              border: '1px solid rgba(229,218,195,0.2)',
              borderRadius: 'var(--kt-radius-full)',
              padding: '5px 12px',
              marginBottom: 20,
              alignSelf: 'flex-start',
            }}
          >
            <span style={{ fontSize: 14 }}>🏢</span>
            <span
              style={{
                fontSize: 'var(--kt-text-xs)',
                fontWeight: 'var(--kt-weight-semibold)',
                color: 'var(--kt-sand-300)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Company Account
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
            Hire faster.
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
            Post jobs and find Regulix Ready workers who can start the same day they're hired — no
            paperwork delays.
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
              620+
            </div>
            <div
              style={{
                fontSize: 'var(--kt-text-xs)',
                color: 'rgba(229,218,195,0.4)',
                marginTop: 2,
              }}
            >
              verified companies already hiring on krewtree
            </div>
          </div>
        </div>

        {/* Footer */}
        <p
          style={{
            fontSize: 'var(--kt-text-xs)',
            color: 'rgba(229,218,195,0.2)',
            marginTop: 40,
          }}
        >
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
            <Badge variant="primary" size="sm">
              Company Profile
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
            14-day free trial. No credit card required.
          </p>

          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: 22 }}
          >
            {/* Company name + Contact name */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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

            {/* Industry + Website */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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
                  marginBottom: 12,
                }}
              >
                Company size
              </p>
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
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

            {/* Divider */}
            <div style={{ height: 1, background: 'var(--kt-border)', margin: '2px 0' }} />

            {/* Terms */}
            <Checkbox
              checked={termsAgreed}
              onChange={(e) => setTermsAgreed(e.target.checked)}
              label="I agree to the Terms of Service and Privacy Policy"
              required
            />

            {/* Submit */}
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
    </div>
  )
}
