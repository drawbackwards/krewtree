/**
 * Krewtree Resend send helper
 *
 * Wraps resend.emails.send() with:
 *   - Consistent From / Reply-To identity
 *   - List-Unsubscribe + List-Unsubscribe-Post headers (RFC 2369 / RFC 8058)
 *   - Optional Idempotency-Key
 *
 * The `from` address is taken from the EMAIL_FROM env var when set, falling back
 * to SENDER.fromEmail. This is deliberate: until mail.krewtree.com is verified
 * in Resend, EMAIL_FROM must be onboarding@resend.dev (the only address Resend
 * will send from), and it flips to the branded address once the domain verifies.
 * See docs/EMAIL_SETUP.md.
 *
 * Bulk-sender note: Gmail and Yahoo require List-Unsubscribe headers on
 * commercial mail. Include unsubscribeToken on any non-security email so
 * the headers get set. Verify current volume thresholds and rules with
 * your deliverability provider before large sends.
 */

import { Resend } from 'resend'
import type * as React from 'react'
import { SENDER, unsubscribeUrl as buildUnsubscribeUrl } from './emailConstants'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface SendKrewtreeEmailArgs {
  to: string | string[]
  subject: string
  react: React.ReactElement
  /**
   * Per-recipient token used to build the unsubscribe URL and the
   * List-Unsubscribe header. Omit for security emails; include for
   * everything else.
   */
  unsubscribeToken?: string
  /**
   * Idempotency key (max 256 chars, expires after 24h). Recommended for
   * retriable triggers (webhook handlers, background jobs) to prevent
   * duplicate sends.
   */
  idempotencyKey?: string
  /**
   * Optional Resend tags for analytics. Names/values must match Resend's
   * character rules: ASCII letters, numbers, underscore, dash. Max 256 chars.
   */
  tags?: Array<{ name: string; value: string }>
}

/** Resolved `from` header: EMAIL_FROM env (pre-DNS onboarding@resend.dev) or the branded default. */
function fromHeader(): string {
  const address = process.env.EMAIL_FROM || SENDER.fromEmail
  return `${SENDER.fromName} <${address}>`
}

export async function sendKrewtreeEmail(args: SendKrewtreeEmailArgs) {
  const { to, subject, react, unsubscribeToken, idempotencyKey, tags } = args

  const headers: Record<string, string> = {}

  if (unsubscribeToken) {
    const unsubUrl = buildUnsubscribeUrl(unsubscribeToken)
    headers['List-Unsubscribe'] =
      `<mailto:${SENDER.unsubscribeMailto}?subject=unsubscribe&body=${encodeURIComponent(unsubscribeToken)}>, <${unsubUrl}>`
    headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click'
  }

  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey
  }

  return resend.emails.send({
    from: fromHeader(),
    to,
    replyTo: SENDER.replyTo,
    subject,
    react,
    headers,
    ...(tags && { tags }),
  })
}

/**
 * Convenience builder: return the unsubscribe URL for a token without sending.
 * Useful if you need to compose your own send call (e.g. from a batch job).
 */
export function getUnsubscribeUrl(token: string): string {
  return buildUnsubscribeUrl(token)
}
