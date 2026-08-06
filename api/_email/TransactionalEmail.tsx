/**
 * Krewtree transactional email template
 *
 * Single-event pattern. Used for immediate notifications like "new applicant,"
 * "new message," "you've been hired," password/email/sign-in security events, etc.
 *
 * Set `category` to drive the preferences deep link. Use 'security' for events
 * that cannot be turned off (password changed, sign-in from new device, etc.).
 */

import * as React from 'react'
import { Section } from '@react-email/components'
import {
  EmailButton,
  EmailHeading,
  EmailLayout,
  EmailSecondaryCard,
  EmailText,
} from './EmailLayout'
import type { NotificationCategory } from './emailConstants'

export interface TransactionalEmailProps {
  /** Invisible preview text shown in inbox list, 40-100 chars. */
  preheader: string
  /** Body H1. Should be scannable and specific. */
  heading: string
  /** Body text or React children. Strings render as a single paragraph. */
  bodyText: string | React.ReactNode
  /** Optional secondary card (applicant summary, job snapshot, etc.). */
  secondaryCard?: React.ReactNode
  /** Primary CTA. If either is omitted, no button renders. */
  ctaLabel?: string
  ctaUrl?: string
  /** Optional closing line above the footer. */
  signOff?: string
  /** Category, drives preferences deep link and security treatment. */
  category: NotificationCategory
  /** Per-recipient unsubscribe URL. Omit for security emails. */
  unsubscribeUrl?: string
  /** Footer treatment; see EmailLayout. 'transactional' hides the preferences/lock line. */
  footer?: 'auto' | 'transactional'
}

export function TransactionalEmail(props: TransactionalEmailProps) {
  const {
    preheader,
    heading,
    bodyText,
    secondaryCard,
    ctaLabel,
    ctaUrl,
    signOff,
    category,
    unsubscribeUrl,
    footer,
  } = props

  return (
    <EmailLayout
      preheader={preheader}
      category={category}
      unsubscribeUrl={unsubscribeUrl}
      footer={footer}
    >
      <EmailHeading>{heading}</EmailHeading>

      {typeof bodyText === 'string' ? <EmailText>{bodyText}</EmailText> : bodyText}

      {secondaryCard && <EmailSecondaryCard>{secondaryCard}</EmailSecondaryCard>}

      {ctaLabel && ctaUrl && (
        <Section style={{ padding: '8px 0 8px 0' }}>
          <EmailButton href={ctaUrl}>{ctaLabel}</EmailButton>
        </Section>
      )}

      {signOff && <EmailText>{signOff}</EmailText>}
    </EmailLayout>
  )
}
