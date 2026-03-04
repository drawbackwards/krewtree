import React, { useId } from 'react'
import styles from './Switch.module.css'

export type SwitchSize = 'sm' | 'md' | 'lg'

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string
  labelPosition?: 'right' | 'left'
  size?: SwitchSize
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  (
    {
      label,
      labelPosition = 'right',
      size = 'md',
      checked,
      disabled,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = useId()
    const inputId = id ?? generatedId

    const rootCls = [
      styles.root,
      size !== 'md' ? styles[size] : '',
      checked ? styles.checked : '',
      disabled ? styles.disabled : '',
      labelPosition === 'left' ? styles.labelLeft : '',
      className ?? '',
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <label className={rootCls} htmlFor={inputId}>
        <input
          ref={ref}
          type="checkbox"
          role="switch"
          id={inputId}
          className={styles.input}
          checked={checked}
          disabled={disabled}
          aria-checked={checked}
          {...props}
        />
        <span className={styles.track}>
          <span className={styles.thumb} />
        </span>
        {label && <span className={styles.labelText}>{label}</span>}
      </label>
    )
  }
)

Switch.displayName = 'Switch'
