import React from 'react'
import styles from './Stepper.module.css'

export type StepState = 'incomplete' | 'active' | 'complete-filled' | 'complete-skipped'

export type StepDef = {
  label: string
  sublabel?: string
}

export type StepperProps = {
  steps: StepDef[]
  currentStep?: number // 1-based, reserved for future use
  stepStates: Record<number, StepState>
  onStepClick?: (step: number) => void
  vertical?: boolean
}

const CheckIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const SkipCheckIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

export const Stepper: React.FC<StepperProps> = ({
  steps,
  stepStates,
  onStepClick,
  vertical = false,
}) => {
  const totalSteps = steps.length
  const completeCount = Object.values(stepStates).filter(
    (s) => s === 'complete-filled' || s === 'complete-skipped'
  ).length

  const getCircleClass = (state: StepState): string => {
    switch (state) {
      case 'active':
        return styles.active
      case 'complete-filled':
        return styles.completeFilled
      case 'complete-skipped':
        return styles.completeSkipped
      default:
        return styles.incomplete
    }
  }

  const getLabelClass = (state: StepState): string => {
    if (state === 'active') return `${styles.label} ${styles.active}`
    if (state === 'complete-filled' || state === 'complete-skipped')
      return `${styles.label} ${styles.done}`
    return styles.label
  }

  const isConnectorDone = (stepIndex: number): boolean => {
    const leftState = stepStates[stepIndex]
    return leftState === 'complete-filled' || leftState === 'complete-skipped'
  }

  const renderCircleContent = (state: StepState, stepNum: number) => {
    if (state === 'complete-filled') return <CheckIcon />
    if (state === 'complete-skipped') return <SkipCheckIcon />
    return <span>{stepNum}</span>
  }

  if (vertical) {
    return (
      <div>
        <div className={styles.stepperVertical}>
          {steps.map((step, index) => {
            const stepNum = index + 1
            const state = stepStates[stepNum] ?? 'incomplete'
            const isLast = stepNum === totalSteps

            return (
              <React.Fragment key={stepNum}>
                <div
                  className={styles.stepVertical}
                  onClick={() => onStepClick?.(stepNum)}
                  role="button"
                  aria-label={`Step ${stepNum}: ${step.label}`}
                  aria-current={state === 'active' ? 'step' : undefined}
                >
                  <div className={`${styles.circle} ${getCircleClass(state)}`}>
                    <span className={styles.checkIcon}>{renderCircleContent(state, stepNum)}</span>
                  </div>
                  <span
                    className={`${styles.stepVertical} ${getLabelClass(state)}`}
                    style={{ padding: 0 }}
                  >
                    {step.label}
                  </span>
                </div>

                {!isLast && (
                  <div
                    className={`${styles.connectorVertical} ${isConnectorDone(stepNum) ? styles.done : ''}`}
                  />
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className={styles.stepper}>
        {steps.map((step, index) => {
          const stepNum = index + 1
          const state = stepStates[stepNum] ?? 'incomplete'
          const isLast = stepNum === totalSteps

          return (
            <React.Fragment key={stepNum}>
              <div
                className={styles.step}
                onClick={() => onStepClick?.(stepNum)}
                role="button"
                aria-label={`Step ${stepNum}: ${step.label}`}
                aria-current={state === 'active' ? 'step' : undefined}
              >
                <div className={`${styles.circle} ${getCircleClass(state)}`}>
                  <span className={styles.checkIcon}>{renderCircleContent(state, stepNum)}</span>
                </div>
                <span className={getLabelClass(state)}>{step.label}</span>
              </div>

              {!isLast && (
                <div
                  className={`${styles.connector} ${isConnectorDone(stepNum) ? styles.done : ''}`}
                />
              )}
            </React.Fragment>
          )
        })}
      </div>

      <div className={styles.summary}>
        <span>
          <span className={styles.summaryCount}>{completeCount}</span> of {totalSteps} steps
          complete
        </span>
      </div>
    </div>
  )
}

export default Stepper
