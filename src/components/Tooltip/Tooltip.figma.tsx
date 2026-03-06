/**
 * CODE CONNECT — Tooltip
 *
 * HOW TO LINK:
 * 1. In Figma, create a component named "Tooltip" with these properties:
 *    - Position (enum): Top | Bottom | Left | Right
 *    - Content (text)
 *    - Disabled (boolean)
 * 2. Copy the component's Figma URL and replace the URL below
 * 3. Run: npx figma connect publish
 */

import figma from '@figma/code-connect'
import { Tooltip } from './Tooltip'

figma.connect(
  Tooltip,
  'https://www.figma.com/design/FIGMA_FILE_KEY/krewtree-components?node-id=TOOLTIP_NODE_ID',
  {
    props: {
      position: figma.enum('Position', {
        Top: 'top',
        Bottom: 'bottom',
        Left: 'left',
        Right: 'right',
      }),
      content: figma.string('Content'),
      disabled: figma.boolean('Disabled'),
    },
    example: ({ position, content, disabled }) => (
      <Tooltip content={content} position={position} disabled={disabled}>
        <button>Hover me</button>
      </Tooltip>
    ),
  }
)
