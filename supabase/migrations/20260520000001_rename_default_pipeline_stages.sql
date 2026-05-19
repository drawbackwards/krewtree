-- Rename the four default pipeline stage names to match the kanban_stage
-- display values used by the application layer (STAGE_DISPLAY map in
-- applicantService.ts). The May-19 pipeline_foundation migration seeded
-- stages as "Applied"/"Reviewed"/"Interview"/"Offer", but the app-layer
-- canonical names are "Screening"/"Assessment"/"Interview"/"Offer".
-- "Interview" and "Offer" are unchanged; only the first two are renamed.
-- Safe pre-launch: no production companies yet.

UPDATE pipeline_stage SET name = 'Screening'  WHERE name = 'Applied';
UPDATE pipeline_stage SET name = 'Assessment' WHERE name = 'Reviewed';
