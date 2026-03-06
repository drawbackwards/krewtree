import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FeaturedJobsSection,
  HowItWorksSection,
  IndustriesSection,
  CTASection,
  FooterSection,
} from './landing/sections'

// ═════════════════════════════════════════════════════════════════════════════
// HERO E: VIBRANT / COLORFUL
// White BG, bold 900-weight type, colored stat tiles, offset-shadow search, marquee
// ═════════════════════════════════════════════════════════════════════════════
const HeroE = () => {
  const navigate = useNavigate()
  const [q, setQ] = useState('')

  const handleSearch = (query: string) => navigate(`/site/jobs?q=${encodeURIComponent(query)}`)

  const chips = [
    { icon: '🏗️', label: 'Construction', color: '#E85D2F' },
    { icon: '🚛', label: 'Trucking', color: '#0C8A7E' },
    { icon: '🏥', label: 'Healthcare', color: '#6D28D9' },
    { icon: '🌿', label: 'Landscaping', color: '#059669' },
    { icon: '🍳', label: 'Hospitality', color: '#C47A22' },
    { icon: '⚡', label: 'Electrical', color: '#1D4ED8' },
  ]
  const colorStats = [
    { num: '12,400+', label: 'Open Jobs', bg: '#E85D2F', icon: '💼' },
    { num: '54,000+', label: 'Workers', bg: '#0C8A7E', icon: '👷' },
    { num: '620+', label: 'Companies', bg: '#6D28D9', icon: '🏢' },
    { num: '8', label: 'Industries', bg: '#C47A22', icon: '🌐' },
  ]
  const logoRow = [
    'Southwest Logistics',
    'Apex Builders',
    'Summit Staffing',
    'Valley Care Center',
    'Desert Ridge Builders',
    'Pacific Crew',
    'Phoenix Solar',
    'Coastal Labor',
  ]

  return (
    <section style={{ overflow: 'hidden' }}>
      <style>{`@keyframes kt-marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>
      {/* Solid accent bar */}
      <div style={{ height: 5, background: 'var(--kt-accent)' }} />
      {/* Hero content */}
      <div style={{ background: '#FAFAF8', padding: '60px var(--kt-space-6) 52px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* Colorful industry chips */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginBottom: 36,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontSize: 11,
                color: '#94A3B8',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginRight: 4,
                flexShrink: 0,
              }}
            >
              Browse:
            </span>
            {chips.map(({ icon, label, color }) => (
              <span
                key={label}
                style={{
                  padding: '5px 12px 5px 8px',
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  background: `${color}18`,
                  color,
                  border: `1px solid ${color}30`,
                  cursor: 'pointer',
                }}
              >
                {icon} {label}
              </span>
            ))}
          </div>
          {/* Grid: headline + search | color stat tiles */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 300px',
              gap: 56,
              alignItems: 'center',
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: 'clamp(42px, 6vw, 78px)',
                  fontWeight: 900,
                  color: '#0A232D',
                  lineHeight: 1.0,
                  marginBottom: 20,
                  letterSpacing: '-3px',
                }}
              >
                Real work,
                <br />
                <span style={{ color: 'var(--kt-accent)' }}>real people,</span>
                <br />
                right now.
              </h1>
              <p
                style={{
                  fontSize: 'var(--kt-text-xl)',
                  color: '#475569',
                  lineHeight: 1.65,
                  marginBottom: 36,
                  maxWidth: 500,
                }}
              >
                The job board that connects hourly workers with employers who need them today —
                verified, fast, no delays.
              </p>
              {/* Offset-shadow search bar */}
              <div
                style={{
                  display: 'flex',
                  borderRadius: 'var(--kt-radius-lg)',
                  border: '2.5px solid #0A232D',
                  overflow: 'hidden',
                  maxWidth: 600,
                  background: 'white',
                  boxShadow: '5px 5px 0 #0A232D',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 14px',
                    color: '#94A3B8',
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Job title, skill, or keyword..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch(q)}
                  style={{
                    flex: 1,
                    padding: '18px 4px',
                    border: 'none',
                    outline: 'none',
                    fontSize: 16,
                    color: '#0A232D',
                    fontFamily: 'var(--kt-font-sans)',
                    background: 'transparent',
                  }}
                />
                <button
                  onClick={() => handleSearch(q)}
                  style={{
                    background: '#E85D2F',
                    color: 'white',
                    border: 'none',
                    borderLeft: '2.5px solid #0A232D',
                    padding: '0 26px',
                    fontSize: 15,
                    fontWeight: 800,
                    cursor: 'pointer',
                    fontFamily: 'var(--kt-font-sans)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Find Jobs →
                </button>
              </div>
              <p style={{ marginTop: 12, fontSize: 13, color: '#94A3B8' }}>
                Trending: CDL Driver · Framing Carpenter · CNA · Line Cook · Landscape Tech
              </p>
            </div>
            {/* Colored stat tiles 2×2 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {colorStats.map((s) => (
                <div
                  key={s.num}
                  style={{
                    background: s.bg,
                    borderRadius: 'var(--kt-radius-xl)',
                    padding: '24px 12px',
                    textAlign: 'center',
                    color: 'white',
                  }}
                >
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
                  <div
                    style={{ fontSize: 'clamp(18px, 2vw, 24px)', fontWeight: 900, lineHeight: 1 }}
                  >
                    {s.num}
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.75, marginTop: 4, fontWeight: 600 }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Scrolling logo marquee */}
      <div
        style={{
          background: 'white',
          borderTop: '1px solid #E8EDF2',
          borderBottom: '1px solid #E8EDF2',
          padding: '14px 0 12px',
          overflow: 'hidden',
        }}
      >
        <p
          style={{
            textAlign: 'center',
            fontSize: 11,
            color: '#CBD5E1',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            fontWeight: 700,
            marginBottom: 10,
          }}
        >
          Trusted by 620+ verified employers
        </p>
        <div style={{ overflow: 'hidden' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 56,
              animation: 'kt-marquee 22s linear infinite',
              width: 'max-content',
              paddingLeft: 32,
            }}
          >
            {[...logoRow, ...logoRow].map((name, i) => (
              <span
                key={i}
                style={{ fontSize: 14, fontWeight: 700, color: '#CBD5E1', whiteSpace: 'nowrap' }}
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═════════════════════════════════════════════════════════════════════════════
export const ColorLandingPage: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--kt-bg)' }}>
      <HeroE />
      <FeaturedJobsSection />
      <HowItWorksSection />
      <IndustriesSection />
      <CTASection />
      <FooterSection />
    </div>
  )
}
