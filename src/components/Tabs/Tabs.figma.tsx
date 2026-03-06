/**
 * CODE CONNECT — Tabs (compound component)
 *
 * HOW TO LINK:
 * 1. In Figma, create a component named "Tabs" with these properties:
 *    - Variant (enum): Underline | Pill
 *    - Active Tab (text — name of the default active tab)
 * 2. Copy the component's Figma URL and replace the URL below
 * 3. Run: npx figma connect publish
 */

import figma from '@figma/code-connect'
import { Tabs, TabList, Tab, TabPanel } from './Tabs'

figma.connect(
  Tabs,
  'https://www.figma.com/design/FIGMA_FILE_KEY/krewtree-components?node-id=TABS_NODE_ID',
  {
    props: {
      variant: figma.enum('Variant', {
        Underline: 'underline',
        Pill: 'pill',
      }),
      defaultTab: figma.string('Active Tab'),
    },
    example: ({ variant, defaultTab }) => (
      <Tabs variant={variant} defaultTab={defaultTab ?? 'tab-1'}>
        <TabList>
          <Tab id="tab-1">Tab One</Tab>
          <Tab id="tab-2">Tab Two</Tab>
          <Tab id="tab-3">Tab Three</Tab>
        </TabList>
        <TabPanel id="tab-1">Content for tab one</TabPanel>
        <TabPanel id="tab-2">Content for tab two</TabPanel>
        <TabPanel id="tab-3">Content for tab three</TabPanel>
      </Tabs>
    ),
  }
)
