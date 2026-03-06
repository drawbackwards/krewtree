/**
 * CODE CONNECT — Progress
 *
 * HOW TO LINK:
 * 1. In Figma, create a component named "Progress" with these properties:
 *    - Size (enum): sm | md | lg
 *    - Color (enum): Accent | Primary | Success | Warning | Danger
 *    - Value (number 0–100)
 *    - Label (text)
 *    - Show Value (boolean)
 *    - Indeterminate (boolean)
 * 2. Copy the component's Figma URL and replace the URL below
 * 3. Run: npx figma connect publish
 */

import figma from '@figma/code-connect'
import { Progress } from './Progress'

figma.connect(
  Progress,
  'https://www.figma.com/design/FIGMA_FILE_KEY/krewtree-components?node-id=PROGRESS_NODE_ID',
  {
    props: {
      size: figma.enum('Size', {
        sm: 'sm',
        md: 'md',
        lg: 'lg',
      }),
      color: figma.enum('Color', {
        Accent: 'accent',
        Primary: 'primary',
        Success: 'success',
        Warning: 'warning',
        Danger: 'danger',
      }),
      label: figma.string('Label'),
      showValue: figma.boolean('Show Value'),
      indeterminate: figma.boolean('Indeterminate'),
    },
    example: ({ size, color, label, showValue, indeterminate }) => (
      <Progress
        value={65}
        size={size}
        color={color}
        label={label}
        showValue={showValue}
        indeterminate={indeterminate}
      />
    ),
  }
)
