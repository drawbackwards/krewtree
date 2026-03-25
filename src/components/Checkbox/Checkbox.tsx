import React, { useId } from 'react'
import { CheckSmallIcon, DashIcon } from '../../site/icons'
import styles from './Checkbox.module.css'

export interface CheckboxProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type' | 'size'
> {
  label?: string
  helperText?: string
  error?: string
  indeterminate?: boolean
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    { label, helperText, error, indeterminate = false, checked, disabled, className, id, ...props },
    ref
  ) => {
    const generatedId = useId()
    const inputId = id ?? generatedId

    const isChecked = checked ?? false

    const rootCls = [
      styles.root,
      disabled ? styles.disabled : '',
      isChecked ? styles.checked : '',
      indeterminate ? styles.indeterminate : '',
      error ? styles.error : '',
      className ?? '',
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <label className={rootCls} htmlFor={inputId}>
        <input
          ref={ref}
          type="checkbox"
          id={inputId}
          className={styles.input}
          checked={isChecked}
          disabled={disabled}
          aria-invalid={!!error}
          {...props}
        />
        <span className={styles.box}>
          {indeterminate ? (
            <span className={styles.check}>
              <DashIcon size={10} />
            </span>
          ) : isChecked ? (
            <span className={styles.check}>
              <CheckSmallIcon size={11} />
            </span>
          ) : null}
        </span>
        {label && (
          <span>
            <span className={styles.labelText}>{label}</span>
            {helperText && <span className={styles.helperText}>{helperText}</span>}
            {error && (
              <span className={styles.errorText} role="alert">
                {error}
              </span>
            )}
          </span>
        )}
      </label>
    )
  }
)

Checkbox.displayName = 'Checkbox'
