/**
 * Krewtree team invite email
 *
 * Sent when a company admin invites a teammate to join their company. Unlike the
 * notification templates, this goes to a PROSPECTIVE user who may not have an
 * account yet, so it carries no unsubscribe link. Categorized as 'account' for
 * the footer preferences link.
 */

import { Section } from '@react-email/components'
import { EmailButton, EmailHeading, EmailLayout, EmailText } from '../EmailLayout.js'
import { COLORS } from '../emailConstants.js'

export interface InviteEmailProps {
  /** Company the invitee is being asked to join. */
  companyName: string
  /** Display name of the person who sent the invite, if known. */
  inviterName?: string
  /** Tokenized /site/join link. */
  joinUrl: string
}

export function InviteEmail({ companyName, inviterName, joinUrl }: InviteEmailProps) {
  const lead = inviterName
    ? `${inviterName} invited you to join ${companyName} on Krewtree.`
    : `You've been invited to join ${companyName} on Krewtree.`

  return (
    <EmailLayout
      preheader={`Join ${companyName} on Krewtree`}
      category="account"
      footer="transactional"
    >
      <EmailHeading>You&rsquo;re invited to join {companyName}</EmailHeading>
      <EmailText>{lead}</EmailText>
      <EmailText>
        Accept the invitation to set up your account and start working with the team.
      </EmailText>

      <Section style={{ padding: '8px 0 8px 0' }}>
        <EmailButton href={joinUrl}>Accept invitation</EmailButton>
      </Section>

      <EmailText>
        Or paste this link into your browser:
        <br />
        <a href={joinUrl} style={{ color: COLORS.bodyText, wordBreak: 'break-all' }}>
          {joinUrl}
        </a>
      </EmailText>
    </EmailLayout>
  )
}
