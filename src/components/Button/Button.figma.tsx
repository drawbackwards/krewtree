/**
 * CODE CONNECT — Button
 *
 * HOW TO LINK:
 * 1. In Figma, create a component named "Button" with these properties:
 *    - Variant (enum): Primary | Secondary | Accent | Outline | Ghost | Danger | Link
 *    - Size (enum): sm | md | lg | xl
 *    - Full Width (boolean)
 *    - Loading (boolean)
 *    - Label (text)
 * 2. Copy the component's Figma URL (right-click → Copy link to selection)
 * 3. Replace the URL below with that link
 * 4. Run: npx figma connect publish
 */

import figma from '@figma/code-connect'
import { Button } from './Button'

figma.connect(
  Button,
  'https://www.figma.com/design/FIGMA_FILE_KEY/krewtree-components?node-id=BUTTON_NODE_ID',
  {
    props: {
      variant: figma.enum('Variant', {
        Primary: 'primary',
        Secondary: 'secondary',
        Accent: 'accent',
        Outline: 'outline',
        Ghost: 'ghost',
        Danger: 'danger',
        Link: 'link',
      }),
      size: figma.enum('Size', {
        sm: 'sm',
        md: 'md',
        lg: 'lg',
        xl: 'xl',
      }),
      fullWidth: figma.boolean('Full Width'),
      loading: figma.boolean('Loading'),
      children: figma.string('Label'),
    },
    example: ({ variant, size, fullWidth, loading, children }) => (
      <Button variant={variant} size={size} fullWidth={fullWidth} loading={loading}>
        {children}
      </Button>
    ),
  }
)
