/**
 * CODE CONNECT — Divider
 *
 * HOW TO LINK:
 * 1. In Figma, create a component named "Divider" with these properties:
 *    - Orientation (enum): Horizontal | Vertical
 *    - Strong (boolean — heavier weight line)
 *    - Label (text — optional centred label)
 * 2. Copy the component's Figma URL and replace the URL below
 * 3. Run: npx figma connect publish
 */

import figma from '@figma/code-connect'
import { Divider } from './Divider'

figma.connect(
  Divider,
  'https://www.figma.com/design/FIGMA_FILE_KEY/krewtree-components?node-id=DIVIDER_NODE_ID',
  {
    props: {
      orientation: figma.enum('Orientation', {
        Horizontal: 'horizontal',
        Vertical: 'vertical',
      }),
      strong: figma.boolean('Strong'),
      label: figma.string('Label'),
    },
    example: ({ orientation, strong, label }) => (
      <Divider orientation={orientation} strong={strong} label={label} />
    ),
  }
)
