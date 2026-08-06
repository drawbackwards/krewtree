/**
 * Security notice: a sign-in from a device or IP the user hasn't used before.
 * Non-optoutable. The subject includes the location, so it is a function.
 */

import { TransactionalEmail } from '../TransactionalEmail.js'
import { DetailRows } from './parts.js'

export const newSignInSubject = (location: string): string =>
  `New sign-in to Krewtree from ${location}`

export interface NewSignInEmailProps {
  /** e.g. "Chrome on macOS" */
  device: string
  /** e.g. "Phoenix, AZ" */
  location: string
  /** Formatted date + time. */
  when: string
  /** Deep link to review recent account activity. */
  reviewActivityUrl: string
}

export function NewSignInEmail({ device, location, when, reviewActivityUrl }: NewSignInEmailProps) {
  return (
    <TransactionalEmail
      preheader={`A new sign-in from ${location}. Was this you?`}
      heading="New sign-in from a new device"
      bodyText="We noticed a new sign-in to your Krewtree account. If this was you, no action is needed. If you don't recognize this activity, change your password immediately and review recent account activity."
      secondaryCard={<DetailRows title={device} meta={`${location} · ${when}`} />}
      ctaLabel="Review activity"
      ctaUrl={reviewActivityUrl}
      category="security"
    />
  )
}
