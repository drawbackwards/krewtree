/**
 * Small shared pieces used across templates.
 */

import { Text } from '@react-email/components'
import { COLORS } from '../emailConstants.js'

/**
 * Two-line content for a TransactionalEmail `secondaryCard`: a bold title line
 * (device, email address, phone, etc.) over a muted meta line (location, when).
 * Rendered inside EmailSecondaryCard by TransactionalEmail.
 */
export function DetailRows({ title, meta }: { title: string; meta: string }) {
  return (
    <>
      <Text
        style={{ fontSize: '16px', fontWeight: 600, color: COLORS.bodyText, margin: '0 0 4px 0' }}
      >
        {title}
      </Text>
      <Text style={{ fontSize: '13px', color: COLORS.mutedText, margin: '0' }}>{meta}</Text>
    </>
  )
}
