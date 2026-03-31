import React, { useState } from 'react'
import { Input, Textarea } from '../../../components'
import { XIcon } from './icons'
import type { StepAboutData } from './types'

const SOCIAL_PLATFORMS = [
  { id: 'linkedin', label: 'LinkedIn', placeholder: 'linkedin.com/in/yourname' },
  { id: 'instagram', label: 'Instagram', placeholder: 'instagram.com/yourname' },
  { id: 'x', label: 'X', placeholder: 'x.com/yourname' },
  { id: 'facebook', label: 'Facebook', placeholder: 'facebook.com/yourname' },
  { id: 'youtube', label: 'YouTube', placeholder: 'youtube.com/@yourname' },
  { id: 'tiktok', label: 'TikTok', placeholder: 'tiktok.com/@yourname' },
  { id: 'website', label: 'Website', placeholder: 'yourwebsite.com' },
]

function validateSocialUrl(platformId: string, url: string): string | null {
  if (!url.trim()) return null
  const normalized = url
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
  switch (platformId) {
    case 'linkedin':
      if (!/^linkedin\.com\/(in|company)\/\S+/i.test(normalized))
        return 'Enter a LinkedIn profile URL — e.g. linkedin.com/in/yourname'
      break
    case 'instagram':
      if (!/^instagram\.com\/\S+/i.test(normalized))
        return 'Enter an Instagram URL — e.g. instagram.com/yourname'
      break
    case 'x':
      if (!/^(x|twitter)\.com\/\S+/i.test(normalized))
        return 'Enter an X profile URL — e.g. x.com/yourname'
      break
    case 'facebook':
      if (!/^facebook\.com\/\S+/i.test(normalized))
        return 'Enter a Facebook URL — e.g. facebook.com/yourname'
      break
    case 'youtube':
      if (!/^youtube\.com\/\S+/i.test(normalized))
        return 'Enter a YouTube URL — e.g. youtube.com/@yourname'
      break
    case 'tiktok':
      if (!/^tiktok\.com\/@\S+/i.test(normalized))
        return 'Enter a TikTok URL — e.g. tiktok.com/@yourname'
      break
    case 'website': {
      const isValid = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+/.test(normalized)
      if (!isValid) return 'Enter a valid website URL — e.g. yourwebsite.com'
      break
    }
  }
  return null
}

export const StepAboutSection: React.FC<{
  data: StepAboutData
  onChange: (d: StepAboutData) => void
}> = ({ data, onChange }) => {
  const [urlErrors, setUrlErrors] = useState<Record<string, string | null>>({})

  const addedPlatformIds = new Set(data.socialLinks.map((l) => l.platform))
  const available = SOCIAL_PLATFORMS.filter((p) => !addedPlatformIds.has(p.id))

  const addLink = (platformId: string) => {
    onChange({
      ...data,
      socialLinks: [
        ...data.socialLinks,
        { id: crypto.randomUUID(), platform: platformId, url: '' },
      ],
    })
  }

  const removeLink = (id: string) => {
    setUrlErrors((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    onChange({ ...data, socialLinks: data.socialLinks.filter((l) => l.id !== id) })
  }

  const updateUrl = (id: string, url: string) => {
    // Clear error while typing
    if (urlErrors[id]) setUrlErrors((prev) => ({ ...prev, [id]: null }))
    onChange({
      ...data,
      socialLinks: data.socialLinks.map((l) => (l.id === id ? { ...l, url } : l)),
    })
  }

  const handleBlur = (id: string, platformId: string, url: string) => {
    const error = validateSocialUrl(platformId, url)
    setUrlErrors((prev) => ({ ...prev, [id]: error }))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <Input
        label="Primary trade / profession"
        value={data.primaryTrade}
        onChange={(e) => onChange({ ...data, primaryTrade: e.target.value })}
        placeholder="e.g. Journeyman Carpenter, Registered Nurse"
      />

      <div>
        <Textarea
          label="About me"
          value={data.bio}
          onChange={(e) => onChange({ ...data, bio: e.target.value })}
          placeholder="e.g. I'm a journeyman carpenter with 8 years of experience in residential and commercial framing. I take pride in clean, precise work and showing up on time every day."
          rows={5}
        />
        <p
          style={{
            fontSize: 'var(--kt-text-xs)',
            color: 'var(--kt-text-muted)',
            margin: '6px 0 0',
            lineHeight: 1.5,
          }}
        >
          Write 2–4 sentences about your experience, skills, and what makes you a great hire.
          Employers read this first.
        </p>
      </div>

      <div>
        <h4
          style={{
            fontSize: 'var(--kt-text-sm)',
            fontWeight: 'var(--kt-weight-semibold)',
            color: 'var(--kt-text)',
            margin: '0 0 4px',
          }}
        >
          Social &amp; web links
        </h4>
        <p
          style={{
            fontSize: 'var(--kt-text-sm)',
            color: 'var(--kt-text-muted)',
            margin: '0 0 14px',
          }}
        >
          Add links to your profiles so employers can learn more about you.
        </p>

        {data.socialLinks.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
            {data.socialLinks.map((link) => {
              const platform = SOCIAL_PLATFORMS.find((p) => p.id === link.platform)
              return (
                <div key={link.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <span
                    style={{
                      fontSize: 'var(--kt-text-xs)',
                      fontWeight: 'var(--kt-weight-medium)',
                      color: 'var(--kt-text-muted)',
                      width: 72,
                      flexShrink: 0,
                      height: 40,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {platform?.label}
                  </span>
                  <div style={{ flex: 1 }}>
                    <Input
                      type="url"
                      value={link.url}
                      onChange={(e) => updateUrl(link.id, e.target.value)}
                      onBlur={() => handleBlur(link.id, link.platform, link.url)}
                      placeholder={platform?.placeholder ?? 'https://...'}
                      error={urlErrors[link.id] ?? undefined}
                    />
                  </div>
                  <div style={{ height: 40, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => removeLink(link.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--kt-text-muted)',
                        padding: 4,
                        display: 'flex',
                      }}
                    >
                      <XIcon />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {available.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {available.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => addLink(p.id)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 'var(--kt-radius-full)',
                  border: '1.5px solid var(--kt-border)',
                  background: 'var(--kt-surface)',
                  fontSize: 'var(--kt-text-xs)',
                  color: 'var(--kt-text)',
                  cursor: 'pointer',
                  fontFamily: 'var(--kt-font-sans)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--kt-accent)'
                  e.currentTarget.style.color = 'var(--kt-accent)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--kt-border)'
                  e.currentTarget.style.color = 'var(--kt-text)'
                }}
              >
                + {p.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
