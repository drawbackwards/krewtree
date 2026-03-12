import React from 'react'
import styles from './Button.module.css'

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'link'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  loading?: boolean
  iconOnly?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  /** Render as an anchor element (for navigation / external links) */
  as?: 'button' | 'a'
  href?: string
  target?: string
  rel?: string
}

const inner = (
  loading: boolean,
  leftIcon: React.ReactNode,
  rightIcon: React.ReactNode,
  children: React.ReactNode,
  spinnerClass: string
) => (
  <>
    {loading && <span className={spinnerClass} aria-hidden="true" />}
    {!loading && leftIcon && <span aria-hidden="true">{leftIcon}</span>}
    {children}
    {rightIcon && <span aria-hidden="true">{rightIcon}</span>}
  </>
)

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      iconOnly = false,
      leftIcon,
      rightIcon,
      className,
      children,
      disabled,
      as: _as = 'button',
      href,
      target,
      rel,
      ...props
    },
    ref
  ) => {
    const cls = [
      styles.btn,
      styles[variant],
      styles[size],
      fullWidth ? styles.fullWidth : '',
      iconOnly ? styles.iconOnly : '',
      loading ? styles.loading : '',
      className ?? '',
    ]
      .filter(Boolean)
      .join(' ')

    if (_as === 'a') {
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          className={cls}
          href={href}
          target={target}
          rel={rel}
          aria-disabled={disabled || loading || undefined}
          {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {inner(loading, leftIcon, rightIcon, children, styles.spinner)}
        </a>
      )
    }

    return (
      <button ref={ref} className={cls} disabled={disabled || loading} {...props}>
        {inner(loading, leftIcon, rightIcon, children, styles.spinner)}
      </button>
    )
  }
)

Button.displayName = 'Button'
