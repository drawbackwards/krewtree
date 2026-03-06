/**
 * CODE CONNECT — Radio / RadioGroup
 *
 * HOW TO LINK — Radio (single item):
 * 1. In Figma, create a component named "Radio" with these properties:
 *    - Label (text)
 *    - Checked (boolean)
 *    - Disabled (boolean)
 * 2. Copy the component's Figma URL and replace RADIO_NODE_ID below
 *
 * HOW TO LINK — RadioGroup:
 * 1. In Figma, create a component named "Radio Group" with these properties:
 *    - Orientation (enum): Vertical | Horizontal
 * 2. Copy the component's Figma URL and replace RADIOGROUP_NODE_ID below
 *
 * 3. Run: npx figma connect publish
 */

import figma from '@figma/code-connect'
import { Radio, RadioGroup } from './Radio'

figma.connect(
  Radio,
  'https://www.figma.com/design/FIGMA_FILE_KEY/krewtree-components?node-id=RADIO_NODE_ID',
  {
    props: {
      label: figma.string('Label'),
      checked: figma.boolean('Checked'),
      disabled: figma.boolean('Disabled'),
    },
    example: ({ label, checked, disabled }) => (
      <Radio label={label} defaultChecked={checked} disabled={disabled} />
    ),
  }
)

figma.connect(
  RadioGroup,
  'https://www.figma.com/design/FIGMA_FILE_KEY/krewtree-components?node-id=RADIOGROUP_NODE_ID',
  {
    props: {
      orientation: figma.enum('Orientation', {
        Vertical: 'vertical',
        Horizontal: 'horizontal',
      }),
    },
    example: ({ orientation }) => (
      <RadioGroup
        name="example"
        orientation={orientation}
        options={[
          { label: 'Option A', value: 'a' },
          { label: 'Option B', value: 'b' },
          { label: 'Option C', value: 'c' },
        ]}
      />
    ),
  }
)
