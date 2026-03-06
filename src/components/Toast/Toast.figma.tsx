/**
 * CODE CONNECT — Toast
 *
 * The Toast system has three parts:
 *   - ToastProvider   wraps the app (in main.tsx)
 *   - useToast        hook to trigger toasts imperatively
 *   - Toast           the individual notification UI
 *
 * HOW TO LINK:
 * 1. In Figma, create a component named "Toast" with these properties:
 *    - Variant (enum): Info | Success | Warning | Danger
 *    - Title (text)
 *    - Description (text)
 *    - Position (enum): Top Right | Top Left | Top Center | Bottom Right | Bottom Left | Bottom Center
 * 2. Copy the component's Figma URL and replace the URL below
 * 3. Run: npx figma connect publish
 */

import figma from '@figma/code-connect'
import { ToastProvider, useToast } from './Toast'

// We connect the provider as the canonical component since Toast items
// are rendered imperatively via the useToast hook, not declared in JSX.
figma.connect(
  ToastProvider,
  'https://www.figma.com/design/FIGMA_FILE_KEY/krewtree-components?node-id=TOAST_NODE_ID',
  {
    props: {
      position: figma.enum('Position', {
        'Top Right': 'top-right',
        'Top Left': 'top-left',
        'Top Center': 'top-center',
        'Bottom Right': 'bottom-right',
        'Bottom Left': 'bottom-left',
        'Bottom Center': 'bottom-center',
      }),
    },
    example: ({ position }) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const { toast } = useToast()
      return (
        <ToastProvider position={position}>
          <button
            onClick={() =>
              toast({
                title: 'Notification title',
                description: 'Optional description text.',
                variant: 'success',
              })
            }
          >
            Show Toast
          </button>
        </ToastProvider>
      )
    },
  }
)
