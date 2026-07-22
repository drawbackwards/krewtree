import type { User } from '@supabase/supabase-js'

/**
 * The current seat's human display name for attribution (message senders, note
 * authors, pipeline stage moves). Prefers the person's own name from auth
 * user_metadata (set on the Personal → My profile page), then falls back to the
 * company name, then the email local part.
 */
export function userDisplayName(user: User | null | undefined): string {
  const meta = (user?.user_metadata ?? {}) as Record<string, unknown>
  const first = typeof meta.first_name === 'string' ? meta.first_name : ''
  const last = typeof meta.last_name === 'string' ? meta.last_name : ''
  const full = `${first} ${last}`.trim()
  if (full) return full
  if (typeof meta.company_name === 'string' && meta.company_name.trim()) return meta.company_name
  if (user?.email) return user.email.split('@')[0]
  return 'A teammate'
}
