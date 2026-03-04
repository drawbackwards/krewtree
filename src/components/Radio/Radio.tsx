import React, { useId } from 'react'
import styles from './Radio.module.css'

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ label, checked, disabled, className, id, ...props }, ref) => {
    const generatedId = useId()
    const inputId = id ?? generatedId

    const rootCls = [
      styles.root,
      disabled ? styles.disabled : '',
      checked ? styles.checked : '',
      className ?? '',
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <label className={rootCls} htmlFor={inputId}>
        <input
          ref={ref}
          type="radio"
          id={inputId}
          className={styles.input}
          checked={checked}
          disabled={disabled}
          {...props}
        />
        <span className={styles.circle}>
          <span className={styles.dot} />
        </span>
        {label && <span className={styles.labelText}>{label}</span>}
      </label>
    )
  }
)

Radio.displayName = 'Radio'

export interface RadioGroupProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  orientation?: 'vertical' | 'horizontal'
  name: string
  value?: string
  onChange?: (value: string) => void
  options: { label: string; value: string; disabled?: boolean }[]
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  orientation = 'vertical',
  name,
  value,
  onChange,
  options,
  className,
  ...props
}) => {
  const cls = [
    styles.group,
    orientation === 'horizontal' ? styles.groupHorizontal : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={cls} role="radiogroup" {...props}>
      {options.map(opt => (
        <Radio
          key={opt.value}
          name={name}
          value={opt.value}
          label={opt.label}
          checked={value === opt.value}
          disabled={opt.disabled}
          onChange={() => onChange?.(opt.value)}
        />
      ))}
    </div>
  )
}
