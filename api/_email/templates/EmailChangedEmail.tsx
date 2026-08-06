/**
 * Security notice: the account email address was changed. Sent to the PREVIOUS
 * address after a successful email change (both personas). Non-optoutable.
 */

import { TransactionalEmail } from '../TransactionalEmail'
import { DetailRows } from './parts'

export const emailChangedSubject = 'Your Krewtree email was changed'

export interface EmailChangedEmailProps {
  /** The new email address on the account. */
  newEmail: string
  /** The previous email address (this notice is sent there). */
  oldEmail: string
  /** Formatted date + time. */
  when: string
  secureAccountUrl: string
}

export function EmailChangedEmail({
  newEmail,
  oldEmail,
  when,
  secureAccountUrl,
}: EmailChangedEmailProps) {
  return (
    <TransactionalEmail
      preheader="If you didn't do this, secure your account immediately."
      heading="Your email address was changed"
      bodyText={`The email address on your Krewtree account was changed on ${when}. If you made this change, you're all set. If you don't recognize this activity, secure your account now.`}
      secondaryCard={<DetailRows title={newEmail} meta={`Changed from ${oldEmail} · ${when}`} />}
      ctaLabel="Secure my account"
      ctaUrl={secureAccountUrl}
      category="security"
    />
  )
}
