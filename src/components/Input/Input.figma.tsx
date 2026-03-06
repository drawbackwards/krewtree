/**
 * CODE CONNECT — Input
 *
 * HOW TO LINK:
 * 1. In Figma, create a component named "Input" with these properties:
 *    - Size (enum): sm | md | lg
 *    - Label (text)
 *    - Placeholder (text)
 *    - Helper Text (text)
 *    - Error (text)
 *    - Has Leading Icon (boolean)
 *    - Has Trailing Icon (boolean)
 *    - Required (boolean)
 *    - Disabled (boolean)
 * 2. Copy the component's Figma URL and replace the URL below
 * 3. Run: npx figma connect publish
 */

import figma from '@figma/code-connect'
import { Input } from './Input'

figma.connect(
  Input,
  'https://www.figma.com/design/FIGMA_FILE_KEY/krewtree-components?node-id=INPUT_NODE_ID',
  {
    props: {
      size: figma.enum('Size', {
        sm: 'sm',
        md: 'md',
        lg: 'lg',
      }),
      label: figma.string('Label'),
      placeholder: figma.string('Placeholder'),
      helperText: figma.string('Helper Text'),
      error: figma.string('Error'),
      required: figma.boolean('Required'),
      disabled: figma.boolean('Disabled'),
    },
    example: ({ size, label, placeholder, helperText, error, required, disabled }) => (
      <Input
        size={size}
        label={label}
        placeholder={placeholder}
        helperText={helperText}
        error={error}
        required={required}
        disabled={disabled}
      />
    ),
  }
)
