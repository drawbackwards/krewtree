# Pipeline Migration Progress

## Sessions (all 11 complete — 2026-05-20)

| Session | Scope                             | Date             | Notes                                                                                                                                                           |
| ------- | --------------------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1       | Schema migration                  | pre-conversation | `company_pipeline` + `pipeline_stage` tables added in `20260519000001_pipeline_foundation.sql`; `pipeline_snapshot` on jobs; `current_stage_id` on applications |
| 2       | Pipeline snapshot at job creation | 2026-05-20       | `fetchPipelineSnapshot()` added to `createJob()` in `jobService.ts`                                                                                             |
| 3       | Worker-facing stage derivation    | 2026-05-20       | `DB_TO_WORKER_STAGE` map in `workerService.ts`; 3-state model: Applied / In Review / Closed                                                                     |
| 4       | Pipeline editor surface           | 2026-05-20       | `PipelinePage` at `/site/pipeline`; inline rename, add, remove, template replacement                                                                            |
| 5       | Template selection at signup      | 2026-05-20       | Two-step company signup: step 1 = company details, step 2 = pipeline template picker                                                                            |
| 6       | Dashboard layout reorganization   | pre-conversation | Four-block dashboard; Applicants widget shell; view toggle                                                                                                      |
| 7       | Applicants widget list view       | pre-conversation | `ApplicantListView`, filters, filter chips, overflow menu                                                                                                       |
| 8       | Applicants widget kanban view     | pre-conversation | `WidgetKanbanView`, drag-and-drop, undo toast, `+N more` links                                                                                                  |
| 9       | Full applicants page              | 2026-05-20       | `AllApplicantsPage` rebuilt: URL-persisted filters, view toggle, filter chips, kanban at 50 cards/col                                                           |
| 10      | Worker dashboard revision         | 2026-05-20       | 3-stage badges, Boost/Withdraw available at Applied + In Review                                                                                                 |
| 11      | Stage tasks copy and code cleanup | 2026-05-20       | Deleted orphaned `PipelineKanban`/`KanbanBoard`; `StagePill`/`StagePicker` accept dynamic label props; all callers pass `currentStageName`                      |

## After migration

- [x] Template content filled in (`seeds/pipeline-templates/short.json`, `long.json`) — 2026-05-20
- [ ] Final smoke test (manual walkthrough: create company → pick template → post job → apply as worker → advance → hire/reject)
- [ ] `supabase db push` — apply `20260520000001_rename_default_pipeline_stages.sql` (renames default "Applied" → "Screening", "Reviewed" → "Assessment" in `pipeline_stage` table)
- [ ] `applications.status` enum migration (deferred to API session)
- [ ] Archive migration plan + deprecated specs once smoke test passes

## Remaining deferred blockers (pre-launch)

- Resume AI parsing (mocked; needs Vercel fn + Claude Haiku)
- Phone verification (stub; needs Supabase Phone Auth / Twilio)
- Supabase "Confirm email" setting (must enable in dashboard before launch)
- Boost payment flow (UI-only; needs Stripe wiring)
- Regulix connect / disconnect
