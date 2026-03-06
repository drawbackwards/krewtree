/**
 * CODE CONNECT — Label
 *
 * HOW TO LINK:
 * 1. In Figma, create a component named "Label" with these properties:
 *    - Text (text)
 *    - Hint (text)
 *    - Required (boolean)
 *    - Disabled (boolean)
 * 2. Copy the component's Figma URL and replace the URL below
 * 3. Run: npx figma connect publish
 */

import figma from '@figma/code-connect'
import { Label } from './Label'

figma.connect(
  Label,
  'https://www.figma.com/design/FIGMA_FILE_KEY/krewtree-components?node-id=LABEL_NODE_ID',
  {
    props: {
      children: figma.string('Text'),
      hint: figma.string('Hint'),
      required: figma.boolean('Required'),
      disabled: figma.boolean('Disabled'),
    },
    example: ({ children, hint, required, disabled }) => (
      <Label hint={hint} required={required} disabled={disabled}>
        {children}
      </Label>
    ),
  }
)
