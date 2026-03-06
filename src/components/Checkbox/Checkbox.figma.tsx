/**
 * CODE CONNECT — Checkbox
 *
 * HOW TO LINK:
 * 1. In Figma, create a component named "Checkbox" with these properties:
 *    - Label (text)
 *    - Helper Text (text)
 *    - Error (text)
 *    - Checked (boolean)
 *    - Indeterminate (boolean)
 *    - Disabled (boolean)
 * 2. Copy the component's Figma URL and replace the URL below
 * 3. Run: npx figma connect publish
 */

import figma from '@figma/code-connect'
import { Checkbox } from './Checkbox'

figma.connect(
  Checkbox,
  'https://www.figma.com/design/FIGMA_FILE_KEY/krewtree-components?node-id=CHECKBOX_NODE_ID',
  {
    props: {
      label: figma.string('Label'),
      helperText: figma.string('Helper Text'),
      error: figma.string('Error'),
      checked: figma.boolean('Checked'),
      indeterminate: figma.boolean('Indeterminate'),
      disabled: figma.boolean('Disabled'),
    },
    example: ({ label, helperText, error, checked, indeterminate, disabled }) => (
      <Checkbox
        label={label}
        helperText={helperText}
        error={error}
        defaultChecked={checked}
        indeterminate={indeterminate}
        disabled={disabled}
      />
    ),
  }
)
