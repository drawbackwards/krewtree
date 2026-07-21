import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Checkbox, Spinner, useToast } from '../../../components'
import { useAuth } from '../../context/AuthContext'
import {
  getNotificationCatalog,
  getNotificationPreferenceOverrides,
  updateNotificationPreference,
  effectivePref,
  type NotificationCatalogItem,
  type PreferenceOverrides,
  type NotifChannel,
  type Persona,
} from '../../services/notificationService'

const CHANNELS: { channel: NotifChannel; label: string }[] = [
  { channel: 'inapp', label: 'In-app' },
  { channel: 'email', label: 'Email' },
  { channel: 'sms', label: 'SMS' },
]

const GRID_COLUMNS = '1fr repeat(3, 88px)'

// One card per subject group, mirroring the Templates settings page. The group
// title sits inline in the header row (first column), aligned with the channel
// labels — so SectionCard is just the card shell.
const SectionCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <section
    style={{
      background: 'var(--kt-surface)',
      border: '1px solid var(--kt-border)',
      borderRadius: 'var(--kt-radius-lg)',
      padding: 24,
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
    }}
  >
    {children}
  </section>
)

export const NotificationsSettingsPage: React.FC = () => {
  const { persona } = useAuth()
  const { toast } = useToast()
  const [catalog, setCatalog] = useState<NotificationCatalogItem[]>([])
  const [overrides, setOverrides] = useState<PreferenceOverrides>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!persona) return
    let cancelled = false
    Promise.all([
      getNotificationCatalog(persona as Persona),
      getNotificationPreferenceOverrides(),
    ]).then(([cat, ov]) => {
      if (cancelled) return
      setCatalog(cat.data)
      setOverrides(ov.data)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [persona])

  // Catalog is ordered by sort_order with subjects contiguous, so insertion
  // order preserves the intended subject grouping.
  const groups = useMemo(() => {
    const map = new Map<string, NotificationCatalogItem[]>()
    for (const item of catalog) {
      const list = map.get(item.subject) ?? []
      list.push(item)
      map.set(item.subject, list)
    }
    return Array.from(map.entries())
  }, [catalog])

  // A single "saved" toast, debounced — toggling several rows in a burst
  // collapses to one confirmation once changes settle instead of a stack.
  const savedToastTimer = useRef<number | null>(null)
  useEffect(
    () => () => {
      if (savedToastTimer.current) window.clearTimeout(savedToastTimer.current)
    },
    []
  )
  const flashSaved = (): void => {
    if (savedToastTimer.current) window.clearTimeout(savedToastTimer.current)
    savedToastTimer.current = window.setTimeout(() => {
      toast({ title: 'Notification preferences saved', variant: 'success' })
      savedToastTimer.current = null
    }, 800)
  }

  const handleToggle = (
    item: NotificationCatalogItem,
    channel: NotifChannel,
    next: boolean
  ): void => {
    const mapKey = `${item.key}:${channel}`
    // Functional updates so a rapid burst of toggles doesn't clobber each other.
    setOverrides((prev) => ({ ...prev, [mapKey]: next }))
    updateNotificationPreference(item.key, channel, next).then(({ error }) => {
      if (error) {
        setOverrides((prev) => ({ ...prev, [mapKey]: !next }))
        toast({
          title: 'Could not save',
          description: 'Your notification preference did not save. Please try again.',
          variant: 'danger',
        })
      } else {
        flashSaved()
      }
    })
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1
          style={{
            fontSize: 'var(--kt-text-xl)',
            fontWeight: 'var(--kt-weight-bold)',
            color: 'var(--kt-text)',
            margin: '0 0 4px',
          }}
        >
          Notifications
        </h1>
        <p style={{ margin: 0, fontSize: 'var(--kt-text-sm)', color: 'var(--kt-text-muted)' }}>
          Choose what you're notified about and how it reaches you. Email and SMS delivery are
          coming soon.
        </p>
      </div>

      {groups.map(([subject, items]) => {
        const regular = items.filter((i) => !i.isDigest)
        const digests = items.filter((i) => i.isDigest)
        return (
          <SectionCard key={subject}>
            {/* Header row: group title inline with the channel labels */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: GRID_COLUMNS,
                alignItems: 'end',
                gap: 12,
                paddingBottom: 12,
                borderBottom: '1px solid var(--kt-border)',
              }}
            >
              <h2
                style={{
                  fontSize: 'var(--kt-text-lg)',
                  fontWeight: 'var(--kt-weight-bold)',
                  color: 'var(--kt-text)',
                  margin: 0,
                }}
              >
                {subject}
              </h2>
              {CHANNELS.map((c) => (
                <span
                  key={c.channel}
                  style={{
                    textAlign: 'center',
                    fontSize: 'var(--kt-text-sm)',
                    fontWeight: 'var(--kt-weight-semibold)',
                    color: 'var(--kt-text)',
                  }}
                >
                  {c.label}
                </span>
              ))}
            </div>

            {regular.map((item) => (
              <div
                key={item.key}
                style={{
                  display: 'grid',
                  gridTemplateColumns: GRID_COLUMNS,
                  alignItems: 'center',
                  gap: 12,
                  paddingBlock: 6,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 'var(--kt-text-sm)',
                      fontWeight: 'var(--kt-weight-semibold)',
                      color: 'var(--kt-text)',
                    }}
                  >
                    {item.label}
                  </div>
                  <div style={{ fontSize: 'var(--kt-text-xs)', color: 'var(--kt-text-muted)' }}>
                    {item.description}
                  </div>
                </div>
                {CHANNELS.map((c) => {
                  const { enabled, locked } = effectivePref(item, c.channel, overrides)
                  return (
                    <div
                      key={c.channel}
                      style={{ display: 'flex', justifyContent: 'center' }}
                      title={locked ? 'Always on' : undefined}
                    >
                      <Checkbox
                        checked={enabled}
                        disabled={locked}
                        onChange={(e) => handleToggle(item, c.channel, e.target.checked)}
                        aria-label={`${item.label} — ${c.label}${locked ? ' (always on)' : ''}`}
                      />
                    </div>
                  )
                })}
              </div>
            ))}

            {/* Digest: a distinct light-gray opt-in prompt (email only). */}
            {digests.map((item) => {
              const { enabled } = effectivePref(item, 'email', overrides)
              const digestLabel = item.key.includes('weekly')
                ? 'Receive a weekly digest by email'
                : 'Receive a daily digest by email'
              const inputId = `digest-${item.key}`
              return (
                <div
                  key={item.key}
                  style={{
                    background: 'var(--kt-bg-subtle)',
                    borderRadius: 'var(--kt-radius-md)',
                    padding: '12px 16px',
                    marginTop: 4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Checkbox
                    id={inputId}
                    checked={enabled}
                    onChange={(e) => handleToggle(item, 'email', e.target.checked)}
                    aria-label={`${item.label} — email digest`}
                  />
                  <label
                    htmlFor={inputId}
                    style={{
                      fontSize: 'var(--kt-text-sm)',
                      color: 'var(--kt-text)',
                      cursor: 'pointer',
                    }}
                  >
                    {digestLabel}
                  </label>
                </div>
              )
            })}
          </SectionCard>
        )
      })}
    </div>
  )
}

export default NotificationsSettingsPage
