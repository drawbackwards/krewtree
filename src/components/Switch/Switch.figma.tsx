/**
 * CODE CONNECT — Switch
 *
 * HOW TO LINK:
 * 1. In Figma, create a component named "Switch" with these properties:
 *    - Size (enum): sm | md | lg
 *    - Label (text)
 *    - Label Position (enum): Right | Left
 *    - Checked (boolean)
 *    - Disabled (boolean)
 * 2. Copy the component's Figma URL and replace the URL below
 * 3. Run: npx figma connect publish
 */

import figma from '@figma/code-connect'
import { Switch } from './Switch'

figma.connect(
  Switch,
  'https://www.figma.com/design/FIGMA_FILE_KEY/krewtree-components?node-id=SWITCH_NODE_ID',
  {
    props: {
      size: figma.enum('Size', {
        sm: 'sm',
        md: 'md',
        lg: 'lg',
      }),
      label: figma.string('Label'),
      labelPosition: figma.enum('Label Position', {
        Right: 'right',
        Left: 'left',
      }),
      checked: figma.boolean('Checked'),
      disabled: figma.boolean('Disabled'),
    },
    example: ({ size, label, labelPosition, checked, disabled }) => (
      <Switch
        size={size}
        label={label}
        labelPosition={labelPosition}
        defaultChecked={checked}
        disabled={disabled}
      />
    ),
  }
)
