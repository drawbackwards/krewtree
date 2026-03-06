/**
 * CODE CONNECT — Select
 *
 * HOW TO LINK:
 * 1. In Figma, create a component named "Select" with these properties:
 *    - Size (enum): sm | md | lg
 *    - Label (text)
 *    - Placeholder (text)
 *    - Helper Text (text)
 *    - Error (text)
 *    - Required (boolean)
 *    - Disabled (boolean)
 * 2. Copy the component's Figma URL and replace the URL below
 * 3. Run: npx figma connect publish
 */

import figma from '@figma/code-connect'
import { Select } from './Select'

figma.connect(
  Select,
  'https://www.figma.com/design/FIGMA_FILE_KEY/krewtree-components?node-id=SELECT_NODE_ID',
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
      <Select
        size={size}
        label={label}
        placeholder={placeholder}
        helperText={helperText}
        error={error}
        required={required}
        disabled={disabled}
        options={[
          { label: 'Option 1', value: 'option-1' },
          { label: 'Option 2', value: 'option-2' },
        ]}
      />
    ),
  }
)
