/**
 * CODE CONNECT — Card (compound component)
 *
 * HOW TO LINK:
 * 1. In Figma, create a component named "Card" with these properties:
 *    - Size (enum): sm | md | lg
 *    - Shadow (enum): Flat | Raised | Elevated
 *    - Interactive (boolean)
 *    - Has Header (boolean)
 *    - Has Footer (boolean)
 * 2. Copy the component's Figma URL and replace the URL below
 * 3. Run: npx figma connect publish
 */

import figma from '@figma/code-connect'
import { Card, CardHeader, CardBody, CardFooter } from './Card'

figma.connect(
  Card,
  'https://www.figma.com/design/FIGMA_FILE_KEY/krewtree-components?node-id=CARD_NODE_ID',
  {
    props: {
      size: figma.enum('Size', {
        sm: 'sm',
        md: 'md',
        lg: 'lg',
      }),
      shadow: figma.enum('Shadow', {
        Flat: 'flat',
        Raised: 'raised',
        Elevated: 'elevated',
      }),
      interactive: figma.boolean('Interactive'),
      hasHeader: figma.boolean('Has Header'),
      hasFooter: figma.boolean('Has Footer'),
    },
    example: ({ size, shadow, interactive, hasHeader, hasFooter }) => (
      <Card size={size} shadow={shadow} interactive={interactive}>
        {hasHeader && <CardHeader title="Card Title" description="Optional description" />}
        <CardBody>Card content goes here.</CardBody>
        {hasFooter && <CardFooter>Footer content</CardFooter>}
      </Card>
    ),
  }
)
