/**
 * CODE CONNECT — Alert
 *
 * HOW TO LINK:
 * 1. In Figma, create a component named "Alert" with these properties:
 *    - Variant (enum): Info | Success | Warning | Danger | Neutral
 *    - Title (text)
 *    - Description (text)
 *    - Closable (boolean)
 * 2. Copy the component's Figma URL and replace the URL below
 * 3. Run: npx figma connect publish
 */

import figma from '@figma/code-connect'
import { Alert } from './Alert'

figma.connect(
  Alert,
  'https://www.figma.com/design/FIGMA_FILE_KEY/krewtree-components?node-id=ALERT_NODE_ID',
  {
    props: {
      variant: figma.enum('Variant', {
        Info: 'info',
        Success: 'success',
        Warning: 'warning',
        Danger: 'danger',
        Neutral: 'neutral',
      }),
      title: figma.string('Title'),
      description: figma.string('Description'),
      closable: figma.boolean('Closable'),
    },
    example: ({ variant, title, description, closable }) => (
      <Alert variant={variant} title={title} description={description} closable={closable} />
    ),
  }
)
