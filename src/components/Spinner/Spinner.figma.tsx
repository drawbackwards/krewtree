/**
 * CODE CONNECT — Spinner
 *
 * HOW TO LINK:
 * 1. In Figma, create a component named "Spinner" with these properties:
 *    - Size (enum): xs | sm | md | lg | xl
 *    - Color (enum): Accent | Primary | Secondary | White | Current
 *    - Label (text — accessible label, not visible)
 * 2. Copy the component's Figma URL and replace the URL below
 * 3. Run: npx figma connect publish
 */

import figma from '@figma/code-connect'
import { Spinner } from './Spinner'

figma.connect(
  Spinner,
  'https://www.figma.com/design/FIGMA_FILE_KEY/krewtree-components?node-id=SPINNER_NODE_ID',
  {
    props: {
      size: figma.enum('Size', {
        xs: 'xs',
        sm: 'sm',
        md: 'md',
        lg: 'lg',
        xl: 'xl',
      }),
      color: figma.enum('Color', {
        Accent: 'accent',
        Primary: 'primary',
        Secondary: 'secondary',
        White: 'white',
        Current: 'current',
      }),
      label: figma.string('Label'),
    },
    example: ({ size, color, label }) => <Spinner size={size} color={color} label={label} />,
  }
)
