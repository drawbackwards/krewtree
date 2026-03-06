/**
 * CODE CONNECT — Modal
 *
 * HOW TO LINK:
 * 1. In Figma, create a component named "Modal" with these properties:
 *    - Size (enum): sm | md | lg | xl | Full
 *    - Title (text)
 *    - Description (text)
 *    - Show Close (boolean)
 *    - Has Footer (boolean)
 * 2. Copy the component's Figma URL and replace the URL below
 * 3. Run: npx figma connect publish
 */

import figma from '@figma/code-connect'
import { Modal } from './Modal'

figma.connect(
  Modal,
  'https://www.figma.com/design/FIGMA_FILE_KEY/krewtree-components?node-id=MODAL_NODE_ID',
  {
    props: {
      size: figma.enum('Size', {
        sm: 'sm',
        md: 'md',
        lg: 'lg',
        xl: 'xl',
        Full: 'full',
      }),
      title: figma.string('Title'),
      description: figma.string('Description'),
      showClose: figma.boolean('Show Close'),
      hasFooter: figma.boolean('Has Footer'),
    },
    example: ({ size, title, description, showClose, hasFooter }) => (
      <Modal
        open={true}
        onClose={() => {}}
        size={size}
        title={title}
        description={description}
        showClose={showClose}
        footer={hasFooter ? <button>Confirm</button> : undefined}
      >
        Modal body content goes here.
      </Modal>
    ),
  }
)
