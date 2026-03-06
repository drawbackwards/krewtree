/**
 * CODE CONNECT — Avatar / AvatarGroup
 *
 * HOW TO LINK — Avatar:
 * 1. In Figma, create a component named "Avatar" with these properties:
 *    - Size (enum): xs | sm | md | lg | xl | xxl
 *    - Variant (enum): Primary | Secondary | Accent | Neutral
 *    - Shape (enum): Circle | Square | Rounded
 *    - Status (enum): None | Online | Away | Busy | Offline
 *    - Has Image (boolean)
 *    - Initials (text)
 * 2. Copy the component's Figma URL and replace AVATAR_NODE_ID below
 *
 * HOW TO LINK — AvatarGroup:
 * 1. In Figma, create a component named "Avatar Group" with these properties:
 *    - Size (enum): xs | sm | md | lg | xl | xxl
 *    - Max (enum representing count shown before +N overflow)
 * 2. Copy the component's Figma URL and replace AVATARGROUP_NODE_ID below
 *
 * 3. Run: npx figma connect publish
 */

import figma from '@figma/code-connect'
import { Avatar, AvatarGroup } from './Avatar'

figma.connect(
  Avatar,
  'https://www.figma.com/design/FIGMA_FILE_KEY/krewtree-components?node-id=AVATAR_NODE_ID',
  {
    props: {
      size: figma.enum('Size', {
        xs: 'xs',
        sm: 'sm',
        md: 'md',
        lg: 'lg',
        xl: 'xl',
        xxl: 'xxl',
      }),
      variant: figma.enum('Variant', {
        Primary: 'primary',
        Secondary: 'secondary',
        Accent: 'accent',
        Neutral: 'neutral',
      }),
      shape: figma.enum('Shape', {
        Circle: 'circle',
        Square: 'square',
        Rounded: 'rounded',
      }),
      status: figma.enum('Status', {
        None: undefined,
        Online: 'online',
        Away: 'away',
        Busy: 'busy',
        Offline: 'offline',
      }),
      initials: figma.string('Initials'),
    },
    example: ({ size, variant, shape, status, initials }) => (
      <Avatar size={size} variant={variant} shape={shape} status={status} initials={initials} />
    ),
  }
)

figma.connect(
  AvatarGroup,
  'https://www.figma.com/design/FIGMA_FILE_KEY/krewtree-components?node-id=AVATARGROUP_NODE_ID',
  {
    props: {
      size: figma.enum('Size', {
        xs: 'xs',
        sm: 'sm',
        md: 'md',
        lg: 'lg',
        xl: 'xl',
        xxl: 'xxl',
      }),
    },
    example: ({ size }) => (
      <AvatarGroup size={size} max={4}>
        <Avatar initials="JD" />
        <Avatar initials="AB" />
        <Avatar initials="KL" />
        <Avatar initials="MN" />
        <Avatar initials="OP" />
      </AvatarGroup>
    ),
  }
)
