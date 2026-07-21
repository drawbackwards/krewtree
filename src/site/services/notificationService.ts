// ============================================================
// KREWTREE — Notification Service (catalog-driven)
// Backs the navbar bell/drawer (in-app notifications) and the notification
// preference matrix (Settings → Notifications). Notification ROWS are created
// server-side by triggers + cron (see 20260722000001/2); this service reads
// them, marks them read, and reads/writes preference OVERRIDES against the
// seeded `notification_type` catalog. Email + SMS channel prefs are stored but
// not yet delivered. Each function returns { data, error } with a string error.
// ============================================================

import { supabase, getCurrentUserId } from '../../lib/supabase'
import type { Database } from '../../lib/database.types'
import type { Notification } from '../types'

type NotificationRow = Database['public']['Tables']['notifications']['Row']
type NotificationTypeRow = Database['public']['Tables']['notification_type']['Row']

export type Persona = 'worker' | 'company'
export type NotifChannel = 'inapp' | 'email' | 'sms'

// Fires when the bell marks notifications read so the navbar count can refresh
// (mirrors MESSAGES_READ_EVENT in messageService).
export const NOTIFICATIONS_READ_EVENT = 'kt:notifications-read'

// Fires when notification preferences are saved, so live UI that depends on a
// preference (e.g. the navbar Messages badge, gated on the message key's in-app
// pref) can refresh without a page reload.
export const NOTIFICATION_PREFS_CHANGED_EVENT = 'kt:notification-prefs-changed'

// ── Bell notifications ───────────────────────────────────────

function toNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    type: row.type, // catalog key, e.g. 'company.applicants.new_application'
    title: row.title,
    body: row.body,
    isRead: row.is_read,
    createdAt: row.created_at,
    link: row.link,
  }
}

export async function getNotifications(
  limit = 30
): Promise<{ data: Notification[]; error: string | null }> {
  const uid = await getCurrentUserId()
  if (!uid) return { data: [], error: 'not_authenticated' }

  const { data, error } = await supabase
    .from('notifications')
    .select('id, type, title, body, link, is_read, created_at, user_id, dedup_key')
    .eq('user_id', uid)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return { data: [], error: error.message }
  return { data: (data ?? []).map((r) => toNotification(r as NotificationRow)), error: null }
}

export async function getUnreadNotificationCount(): Promise<{
  data: number
  error: string | null
}> {
  const uid = await getCurrentUserId()
  if (!uid) return { data: 0, error: 'not_authenticated' }

  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', uid)
    .eq('is_read', false)

  if (error) return { data: 0, error: error.message }
  return { data: count ?? 0, error: null }
}

export async function markNotificationRead(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id)
  return { error: error?.message ?? null }
}

export async function markAllNotificationsRead(): Promise<{ error: string | null }> {
  const uid = await getCurrentUserId()
  if (!uid) return { error: 'not_authenticated' }

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', uid)
    .eq('is_read', false)
  return { error: error?.message ?? null }
}

// ── Catalog + preference overrides ───────────────────────────

export type NotificationCatalogItem = {
  key: string
  persona: Persona
  subject: string
  label: string
  description: string
  mandatoryInapp: boolean
  defaultInapp: boolean
  defaultEmail: boolean
  defaultSms: boolean
  isBadge: boolean
  isDigest: boolean
  sortOrder: number
}

/** Overrides keyed `${notification_key}:${channel}` → enabled. Absent = default. */
export type PreferenceOverrides = Record<string, boolean>

function toCatalogItem(row: NotificationTypeRow): NotificationCatalogItem {
  return {
    key: row.key,
    persona: row.persona as Persona,
    subject: row.subject,
    label: row.label,
    description: row.description,
    mandatoryInapp: row.mandatory_inapp,
    defaultInapp: row.default_inapp,
    defaultEmail: row.default_email,
    defaultSms: row.default_sms,
    isBadge: row.is_badge,
    isDigest: row.is_digest,
    sortOrder: row.sort_order,
  }
}

/** Active catalog rows for a persona, ordered for grouped display. */
export async function getNotificationCatalog(
  persona: Persona
): Promise<{ data: NotificationCatalogItem[]; error: string | null }> {
  const { data, error } = await supabase
    .from('notification_type')
    .select('*')
    .eq('persona', persona)
    .eq('active', true)
    .order('sort_order', { ascending: true })

  if (error) return { data: [], error: error.message }
  return { data: (data ?? []).map((r) => toCatalogItem(r as NotificationTypeRow)), error: null }
}

export async function getNotificationPreferenceOverrides(): Promise<{
  data: PreferenceOverrides
  error: string | null
}> {
  const uid = await getCurrentUserId()
  if (!uid) return { data: {}, error: 'not_authenticated' }

  const { data, error } = await supabase
    .from('notification_preference')
    .select('notification_key, channel, enabled')
    .eq('user_id', uid)

  if (error) return { data: {}, error: error.message }
  const map: PreferenceOverrides = {}
  for (const row of data ?? []) map[`${row.notification_key}:${row.channel}`] = row.enabled
  return { data: map, error: null }
}

/** Effective state of one (item, channel), merging mandatory + override + default. */
export function effectivePref(
  item: NotificationCatalogItem,
  channel: NotifChannel,
  overrides: PreferenceOverrides
): { enabled: boolean; locked: boolean } {
  if (channel === 'inapp' && item.mandatoryInapp) return { enabled: true, locked: true }
  const override = overrides[`${item.key}:${channel}`]
  const def =
    channel === 'inapp'
      ? item.defaultInapp
      : channel === 'email'
        ? item.defaultEmail
        : item.defaultSms
  return { enabled: override ?? def, locked: false }
}

export async function updateNotificationPreference(
  key: string,
  channel: NotifChannel,
  enabled: boolean
): Promise<{ error: string | null }> {
  const uid = await getCurrentUserId()
  if (!uid) return { error: 'not_authenticated' }

  const { error } = await supabase
    .from('notification_preference')
    .upsert(
      {
        user_id: uid,
        notification_key: key,
        channel,
        enabled,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,notification_key,channel' }
    )
  if (error) return { error: error.message }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(NOTIFICATION_PREFS_CHANGED_EVENT))
  }
  return { error: null }
}

/**
 * Whether the Messages nav badge should show for this persona — the in-app
 * channel of the `<persona>.messages.new_message` catalog key (badge, not a
 * bell entry). Used by the Navbar.
 */
export async function getMessageBadgeEnabled(persona: Persona): Promise<boolean> {
  const key = `${persona}.messages.new_message`
  const { data: t } = await supabase
    .from('notification_type')
    .select('default_inapp')
    .eq('key', key)
    .maybeSingle()
  const def = t?.default_inapp ?? true

  const uid = await getCurrentUserId()
  if (!uid) return def

  const { data: o } = await supabase
    .from('notification_preference')
    .select('enabled')
    .eq('user_id', uid)
    .eq('notification_key', key)
    .eq('channel', 'inapp')
    .maybeSingle()
  return o?.enabled ?? def
}
