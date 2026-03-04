import React from 'react'
import styles from './Select.module.css'

export type SelectSize = 'sm' | 'md' | 'lg'

export interface SelectOption {
  label: string
  value: string
  disabled?: boolean
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  size?: SelectSize
  label?: string
  helperText?: string
  error?: string
  placeholder?: string
  options?: SelectOption[]
  required?: boolean
}

const ChevronIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      size = 'md',
      label,
      helperText,
      error,
      placeholder,
      options = [],
      required,
      id,
      className,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const selectId = id ?? (label ? `select-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined)

    const wrapCls = [styles.selectWrap, size !== 'md' ? styles[size] : ''].filter(Boolean).join(' ')
    const selectCls = [styles.select, error ? styles.error : '', className ?? ''].filter(Boolean).join(' ')

    return (
      <div className={styles.wrapper}>
        {label && (
          <label
            htmlFor={selectId}
            style={{
              fontSize: 'var(--kt-text-sm)',
              fontWeight: 'var(--kt-weight-medium)',
              color: 'var(--kt-text)',
            }}
          >
            {label}
            {required && <span style={{ color: 'var(--kt-danger)', marginLeft: 2 }}>*</span>}
          </label>
        )}
        <div className={wrapCls}>
          <select
            ref={ref}
            id={selectId}
            className={selectCls}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-hint` : undefined}
            {...props}
          >
            {placeholder && <option value="" disabled>{placeholder}</option>}
            {children
              ? children
              : options.map(opt => (
                  <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                    {opt.label}
                  </option>
                ))}
          </select>
          <span className={styles.chevron} aria-hidden="true">
            <ChevronIcon />
          </span>
        </div>
        {error && (
          <span id={`${selectId}-error`} className={styles.errorText} role="alert">
            {error}
          </span>
        )}
        {!error && helperText && (
          <span id={`${selectId}-hint`} className={styles.helperText}>
            {helperText}
          </span>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'
