/**
 * Security notice: the account password was changed. Sent after a successful
 * password change (both personas). Non-optoutable security category.
 */

import { TransactionalEmail } from '../TransactionalEmail'
import { DetailRows } from './parts'

export const passwordChangedSubject = 'Your Krewtree password was changed'

export interface PasswordChangedEmailProps {
  /** e.g. "Chrome on macOS" */
  device: string
  /** e.g. "Phoenix, AZ" */
  location: string
  /** Formatted date + time, e.g. "July 23, 2026 at 11:14 AM MST" */
  when: string
  /** Deep link to secure the account (change password / review activity). */
  secureAccountUrl: string
}

export function PasswordChangedEmail({
  device,
  location,
  when,
  secureAccountUrl,
}: PasswordChangedEmailProps) {
  return (
    <TransactionalEmail
      preheader="If you didn't do this, secure your account immediately."
      heading="Your password was changed"
      bodyText={`The password on your Krewtree account was changed on ${when}. If you made this change, you're all set. If you don't recognize this activity, secure your account now.`}
      secondaryCard={<DetailRows title={device} meta={`${location} · ${when}`} />}
      ctaLabel="Secure my account"
      ctaUrl={secureAccountUrl}
      category="security"
    />
  )
}
