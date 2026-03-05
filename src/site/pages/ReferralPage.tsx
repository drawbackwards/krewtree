import React, { useState } from 'react'
import { Badge } from '../../components'
import type { BadgeVariant } from '../../components/Badge/Badge'
import type { Referral } from '../types'
import { referrals as initialReferrals } from '../data/mock'

const statusColor: Record<string, BadgeVariant> = {
  pending: 'warning',
  joined: 'info',
  hired: 'success',
}

const statusLabel: Record<string, string> = {
  pending: 'Pending',
  joined: 'Joined',
  hired: 'Hired ✓',
}

export const ReferralPage: React.FC = () => {
  const [referrals, setReferrals] = useState<Referral[]>(initialReferrals)
  const [form, setForm] = useState({ name: '', email: '', type: 'worker' as 'worker' | 'company' })
  const [sent, setSent] = useState(false)
  const [copied, setCopied] = useState(false)

  const stats = {
    total: referrals.length,
    joined: referrals.filter((r) => r.status === 'joined' || r.status === 'hired').length,
    hired: referrals.filter((r) => r.status === 'hired').length,
    earned: referrals.reduce((s, r) => s + (r.reward ?? 0), 0),
  }

  const handleSend = () => {
    if (!form.name || !form.email) return
    const newRef: Referral = {
      id: `ref-${Date.now()}`,
      referrerId: 'w1',
      name: form.name,
      email: form.email,
      type: form.type,
      status: 'pending',
      daysAgo: 0,
      reward: 0,
    }
    setReferrals((prev) => [newRef, ...prev])
    setForm({ name: '', email: '', type: 'worker' })
    setSent(true)
    setTimeout(() => setSent(false), 3000)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText('https://krewtree.io/join?ref=marcus-w1').catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '9px 12px',
    border: '1px solid var(--kt-border)',
    borderRadius: 'var(--kt-radius-md)',
    background: 'var(--kt-bg)',
    color: 'var(--kt-text)',
    fontFamily: 'var(--kt-font-sans)',
    fontSize: 'var(--kt-text-sm)',
    outline: 'none',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--kt-bg)' }}>
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '32px var(--kt-space-6)' }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1
            style={{
              fontSize: 'var(--kt-text-2xl)',
              fontWeight: 'var(--kt-weight-bold)',
              color: 'var(--kt-text)',
              marginBottom: 6,
            }}
          >
            Referral Program
          </h1>
          <p style={{ fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text-muted)' }}>
            Earn rewards by inviting workers and companies to join krewtree.
          </p>
        </div>

        {/* Stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 12,
            marginBottom: 28,
          }}
        >
          {[
            { label: 'Total Referred', value: stats.total, icon: '👥' },
            { label: 'Joined', value: stats.joined, icon: '✅' },
            { label: 'Got Hired', value: stats.hired, icon: '🎉' },
            { label: 'Total Earned', value: `$${stats.earned}`, icon: '💰' },
          ].map(({ label, value, icon }) => (
            <div
              key={label}
              style={{
                background: 'var(--kt-surface)',
                border: '1px solid var(--kt-border)',
                borderRadius: 'var(--kt-radius-lg)',
                padding: '18px 16px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: 6 }}>{icon}</div>
              <div
                style={{
                  fontSize: 'var(--kt-text-xl)',
                  fontWeight: 'var(--kt-weight-bold)',
                  color: 'var(--kt-text)',
                  marginBottom: 2,
                }}
              >
                {value}
              </div>
              <div style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-text-muted)' }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          {/* Invite Form */}
          <div
            style={{
              background: 'var(--kt-surface)',
              border: '1px solid var(--kt-border)',
              borderRadius: 'var(--kt-radius-xl)',
              padding: 24,
            }}
          >
            <h2
              style={{
                fontSize: 'var(--kt-text-md)',
                fontWeight: 'var(--kt-weight-semibold)',
                color: 'var(--kt-text)',
                marginBottom: 16,
              }}
            >
              Send an Invite
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 'var(--kt-text-xs)',
                    fontWeight: 'var(--kt-weight-semibold)',
                    color: 'var(--kt-text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: 5,
                  }}
                >
                  Name
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Full name"
                  style={inputStyle}
                />
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 'var(--kt-text-xs)',
                    fontWeight: 'var(--kt-weight-semibold)',
                    color: 'var(--kt-text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: 5,
                  }}
                >
                  Email
                </label>
                <input
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="email@example.com"
                  type="email"
                  style={inputStyle}
                />
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 'var(--kt-text-xs)',
                    fontWeight: 'var(--kt-weight-semibold)',
                    color: 'var(--kt-text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: 5,
                  }}
                >
                  Invite as
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['worker', 'company'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setForm((f) => ({ ...f, type: t }))}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: 'var(--kt-radius-md)',
                        border: `1px solid ${form.type === t ? 'var(--kt-primary)' : 'var(--kt-border)'}`,
                        background:
                          form.type === t
                            ? 'color-mix(in srgb, var(--kt-primary) 8%, transparent)'
                            : 'transparent',
                        color: form.type === t ? 'var(--kt-primary)' : 'var(--kt-text-muted)',
                        fontSize: 'var(--kt-text-sm)',
                        fontWeight: 'var(--kt-weight-medium)',
                        cursor: 'pointer',
                        fontFamily: 'var(--kt-font-sans)',
                        textTransform: 'capitalize',
                      }}
                    >
                      {t === 'worker' ? '👷 Worker' : '🏢 Company'}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleSend}
                disabled={!form.name || !form.email}
                style={{
                  padding: '10px',
                  background: 'var(--kt-primary)',
                  color: 'var(--kt-primary-fg)',
                  border: 'none',
                  borderRadius: 'var(--kt-radius-md)',
                  fontSize: 'var(--kt-text-sm)',
                  fontWeight: 'var(--kt-weight-semibold)',
                  cursor: form.name && form.email ? 'pointer' : 'not-allowed',
                  opacity: form.name && form.email ? 1 : 0.5,
                  fontFamily: 'var(--kt-font-sans)',
                  transition: 'opacity 0.15s',
                }}
              >
                {sent ? '✓ Invite Sent!' : 'Send Invite'}
              </button>
            </div>
          </div>

          {/* How it works */}
          <div
            style={{
              background: 'var(--kt-surface)',
              border: '1px solid var(--kt-border)',
              borderRadius: 'var(--kt-radius-xl)',
              padding: 24,
            }}
          >
            <h2
              style={{
                fontSize: 'var(--kt-text-md)',
                fontWeight: 'var(--kt-weight-semibold)',
                color: 'var(--kt-text)',
                marginBottom: 16,
              }}
            >
              How It Works
            </h2>
            {[
              {
                step: '1',
                title: 'Invite someone',
                desc: 'Send an invite by email or share your referral link.',
              },
              {
                step: '2',
                title: 'They join krewtree',
                desc: 'You earn $25 when they create a verified account.',
              },
              {
                step: '3',
                title: 'They get hired',
                desc: 'Earn an additional $25 bonus when your referral lands a job.',
              },
              {
                step: '4',
                title: 'Refer a company',
                desc: 'Earn up to $100 when a company you refer posts their first job.',
              },
            ].map(({ step, title, desc }) => (
              <div key={step} style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    flexShrink: 0,
                    background: 'var(--kt-primary)',
                    color: 'var(--kt-primary-fg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'var(--kt-weight-bold)',
                    fontSize: 'var(--kt-text-xs)',
                  }}
                >
                  {step}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 'var(--kt-text-sm)',
                      fontWeight: 'var(--kt-weight-semibold)',
                      color: 'var(--kt-text)',
                      marginBottom: 2,
                    }}
                  >
                    {title}
                  </div>
                  <div
                    style={{
                      fontSize: 'var(--kt-text-xs)',
                      color: 'var(--kt-text-muted)',
                      lineHeight: 1.4,
                    }}
                  >
                    {desc}
                  </div>
                </div>
              </div>
            ))}

            {/* Share link */}
            <div
              style={{
                marginTop: 16,
                padding: '10px 12px',
                background: 'var(--kt-bg)',
                borderRadius: 'var(--kt-radius-md)',
                border: '1px solid var(--kt-border)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span
                style={{
                  flex: 1,
                  fontSize: '11px',
                  color: 'var(--kt-text-muted)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                krewtree.io/join?ref=marcus-w1
              </span>
              <button
                onClick={handleCopy}
                style={{
                  padding: '4px 10px',
                  flexShrink: 0,
                  background: 'var(--kt-primary)',
                  color: 'var(--kt-primary-fg)',
                  border: 'none',
                  borderRadius: 'var(--kt-radius-sm)',
                  fontSize: '11px',
                  fontWeight: 'var(--kt-weight-semibold)',
                  cursor: 'pointer',
                  fontFamily: 'var(--kt-font-sans)',
                }}
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </div>

        {/* Referral Table */}
        <div
          style={{
            background: 'var(--kt-surface)',
            border: '1px solid var(--kt-border)',
            borderRadius: 'var(--kt-radius-xl)',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--kt-border)' }}>
            <h2
              style={{
                fontSize: 'var(--kt-text-md)',
                fontWeight: 'var(--kt-weight-semibold)',
                color: 'var(--kt-text)',
              }}
            >
              Your Referrals
            </h2>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--kt-border)' }}>
                  {['Name', 'Type', 'Status', 'Sent', 'Reward'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '10px 16px',
                        textAlign: 'left',
                        fontSize: 'var(--kt-text-xs)',
                        fontWeight: 'var(--kt-weight-semibold)',
                        color: 'var(--kt-text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {referrals.map((ref, i) => (
                  <tr
                    key={ref.id}
                    style={{
                      borderBottom:
                        i < referrals.length - 1 ? '1px solid var(--kt-border)' : 'none',
                    }}
                  >
                    <td
                      style={{
                        padding: '12px 16px',
                        fontSize: 'var(--kt-text-sm)',
                        fontWeight: 'var(--kt-weight-medium)',
                        color: 'var(--kt-text)',
                      }}
                    >
                      {ref.name}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <Badge variant="secondary" size="sm">
                        {ref.type === 'worker' ? '👷 Worker' : '🏢 Company'}
                      </Badge>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <Badge variant={statusColor[ref.status]} size="sm">
                        {statusLabel[ref.status]}
                      </Badge>
                    </td>
                    <td
                      style={{
                        padding: '12px 16px',
                        fontSize: 'var(--kt-text-xs)',
                        color: 'var(--kt-text-muted)',
                      }}
                    >
                      {ref.daysAgo === 0 ? 'Today' : `${ref.daysAgo}d ago`}
                    </td>
                    <td
                      style={{
                        padding: '12px 16px',
                        fontSize: 'var(--kt-text-sm)',
                        fontWeight: 'var(--kt-weight-semibold)',
                        color: (ref.reward ?? 0) > 0 ? 'var(--kt-success)' : 'var(--kt-text-muted)',
                      }}
                    >
                      {(ref.reward ?? 0) > 0 ? `$${ref.reward}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
