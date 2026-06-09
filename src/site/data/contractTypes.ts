// ============================================================
// KREWTREE — Canonical contract types
// Shared between the company-side hiring section (preferred contract
// types you offer) and the worker-side work-history editor (contract
// type for each past role). Spec §2 + §10 #6.
// ============================================================

export type ContractTypeValue =
  | 'day_rate'
  | 'project'
  | 'long_term_temp'
  | 'full_time'
  | 'apprenticeship'

export const CONTRACT_TYPE_OPTIONS: { value: ContractTypeValue; label: string }[] = [
  { value: 'day_rate', label: 'Day rate' },
  { value: 'project', label: 'Project-based' },
  { value: 'long_term_temp', label: 'Long-term temp' },
  { value: 'full_time', label: 'Full-time hire' },
  { value: 'apprenticeship', label: 'Apprenticeship' },
]

export const getContractTypeLabel = (value: string): string =>
  CONTRACT_TYPE_OPTIONS.find((c) => c.value === value)?.label ?? ''
