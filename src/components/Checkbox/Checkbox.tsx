import React, { useId } from 'react'
import styles from './Checkbox.module.css'

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string
  helperText?: string
  error?: string
  indeterminate?: boolean
}

const CheckIcon = () => (
  <svg width="11" height="8" viewBox="0 0 11 8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 4l3 3 6-6" />
  </svg>
)

const DashIcon = () => (
  <svg width="10" height="2" viewBox="0 0 10 2" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="1" y1="1" x2="9" y2="1" />
  </svg>
)

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
            <span className={styles.check}><DashIcon /></span>
          ) : isChecked ? (
            <span className={styles.check}><CheckIcon /></span>
          ) : null}
        </span>
        {label && (
          <span>
            <span className={styles.labelText}>{label}</span>
            {helperText && <span className={styles.helperText}>{helperText}</span>}
            {error && <span className={styles.errorText} role="alert">{error}</span>}
          </span>
        )}
      </label>
    )
  }
)

Checkbox.displayName = 'Checkbox'
