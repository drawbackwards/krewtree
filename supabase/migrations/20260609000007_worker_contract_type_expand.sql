-- ============================================================
-- KREWTREE — Expand worker_work_history.contract_type
-- Spec §2 + §10 #6: worker contract types must match the company
-- spec's 5-option list (day_rate, project, long_term_temp,
-- full_time, apprenticeship). The original schema CHECK pinned
-- it to the first 3 + ''. Drop and recreate with all 5.
-- ============================================================

ALTER TABLE worker_work_history
  DROP CONSTRAINT IF EXISTS worker_work_history_contract_type_check;

ALTER TABLE worker_work_history
  ADD CONSTRAINT worker_work_history_contract_type_check
  CHECK (contract_type IN (
    '',
    'day_rate',
    'project',
    'long_term_temp',
    'full_time',
    'apprenticeship'
  ));
