import React from 'react'
import styles from './Avatar.module.css'

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'
export type AvatarVariant = 'primary' | 'secondary' | 'accent' | 'neutral'
export type AvatarShape = 'circle' | 'square' | 'rounded'
export type AvatarStatus = 'online' | 'away' | 'busy' | 'offline'

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string
  alt?: string
  initials?: string
  size?: AvatarSize
  variant?: AvatarVariant
  shape?: AvatarShape
  status?: AvatarStatus
  icon?: React.ReactNode
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = '',
  initials,
  size = 'md',
  variant = 'primary',
  shape = 'circle',
  status,
  icon,
  className,
  ...props
}) => {
  const cls = [styles.avatar, styles[size], styles[variant], styles[shape], className ?? '']
    .filter(Boolean)
    .join(' ')

  return (
    <div className={cls} aria-label={alt || initials} {...props}>
      {src ? (
        <img src={src} alt={alt} className={styles.img} />
      ) : icon ? (
        icon
      ) : initials ? (
        <span aria-hidden="true">{initials.slice(0, 2).toUpperCase()}</span>
      ) : (
        <svg viewBox="0 0 24 24" fill="currentColor" width="55%" height="55%" aria-hidden="true">
          <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
        </svg>
      )}
      {status && (
        <span
          className={[styles.statusDot, styles[status]].join(' ')}
          aria-label={`Status: ${status}`}
        />
      )}
    </div>
  )
}

export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  max?: number
  size?: AvatarSize
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  max,
  size = 'md',
  className,
  children,
  ...props
}) => {
  const childrenArray = React.Children.toArray(children)
  const visible = max ? childrenArray.slice(0, max) : childrenArray
  const overflow = max ? childrenArray.length - max : 0

  return (
    <div className={[styles.group, className ?? ''].filter(Boolean).join(' ')} {...props}>
      {overflow > 0 && (
        <Avatar size={size} variant="neutral" initials={`+${overflow}`} />
      )}
      {[...visible].reverse().map((child, i) => (
        <React.Fragment key={i}>{child}</React.Fragment>
      ))}
    </div>
  )
}
