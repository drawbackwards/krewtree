/**
 * Security notice: the account phone number was changed. Non-optoutable.
 */

import { TransactionalEmail } from '../TransactionalEmail'
import { DetailRows } from './parts'

export const phoneChangedSubject = 'Your Krewtree phone number was changed'

export interface PhoneChangedEmailProps {
  /** New number, masked, e.g. "+1 (602) 555-•••2" */
  newPhoneMasked: string
  /** Previous number, masked. */
  oldPhoneMasked: string
  /** Formatted date + time. */
  when: string
  secureAccountUrl: string
}

export function PhoneChangedEmail({
  newPhoneMasked,
  oldPhoneMasked,
  when,
  secureAccountUrl,
}: PhoneChangedEmailProps) {
  return (
    <TransactionalEmail
      preheader="If you didn't do this, secure your account immediately."
      heading="Your phone number was changed"
      bodyText={`The phone number on your Krewtree account was changed on ${when}. If you made this change, you're all set. If you don't recognize this activity, secure your account now.`}
      secondaryCard={
        <DetailRows title={newPhoneMasked} meta={`Changed from ${oldPhoneMasked} · ${when}`} />
      }
      ctaLabel="Secure my account"
      ctaUrl={secureAccountUrl}
      category="security"
    />
  )
}
