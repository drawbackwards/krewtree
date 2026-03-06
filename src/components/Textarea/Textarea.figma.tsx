/**
 * CODE CONNECT — Textarea
 *
 * HOW TO LINK:
 * 1. In Figma, create a component named "Textarea" with these properties:
 *    - Label (text)
 *    - Placeholder (text)
 *    - Helper Text (text)
 *    - Error (text)
 *    - Max Chars (boolean — show character counter state)
 *    - No Resize (boolean)
 *    - Required (boolean)
 *    - Disabled (boolean)
 * 2. Copy the component's Figma URL and replace the URL below
 * 3. Run: npx figma connect publish
 */

import figma from '@figma/code-connect'
import { Textarea } from './Textarea'

figma.connect(
  Textarea,
  'https://www.figma.com/design/FIGMA_FILE_KEY/krewtree-components?node-id=TEXTAREA_NODE_ID',
  {
    props: {
      label: figma.string('Label'),
      placeholder: figma.string('Placeholder'),
      helperText: figma.string('Helper Text'),
      error: figma.string('Error'),
      noResize: figma.boolean('No Resize'),
      required: figma.boolean('Required'),
      disabled: figma.boolean('Disabled'),
    },
    example: ({ label, placeholder, helperText, error, noResize, required, disabled }) => (
      <Textarea
        label={label}
        placeholder={placeholder}
        helperText={helperText}
        error={error}
        noResize={noResize}
        required={required}
        disabled={disabled}
      />
    ),
  }
)
