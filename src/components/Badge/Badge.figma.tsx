/**
 * CODE CONNECT — Badge
 *
 * HOW TO LINK:
 * 1. In Figma, create a component named "Badge" with these properties:
 *    - Variant (enum): Primary | Secondary | Accent | Success | Warning | Danger | Info | Neutral
 *    - Size (enum): sm | md | lg
 *    - Dot (boolean)
 *    - Label (text)
 * 2. Copy the component's Figma URL and replace the URL below
 * 3. Run: npx figma connect publish
 */

import figma from '@figma/code-connect'
import { Badge } from './Badge'

figma.connect(
  Badge,
  'https://www.figma.com/design/FIGMA_FILE_KEY/krewtree-components?node-id=BADGE_NODE_ID',
  {
    props: {
      variant: figma.enum('Variant', {
        Primary: 'primary',
        Secondary: 'secondary',
        Accent: 'accent',
        Success: 'success',
        Warning: 'warning',
        Danger: 'danger',
        Info: 'info',
        Neutral: 'neutral',
      }),
      size: figma.enum('Size', {
        sm: 'sm',
        md: 'md',
        lg: 'lg',
      }),
      dot: figma.boolean('Dot'),
      children: figma.string('Label'),
    },
    example: ({ variant, size, dot, children }) => (
      <Badge variant={variant} size={size} dot={dot}>
        {children}
      </Badge>
    ),
  }
)
