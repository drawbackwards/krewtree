# Krewtree — Beta Readiness Plan

Created: 2026-08-04
Status: planning

Goal: get real beta users onto krewtree safely, in a state where the beta
actually produces signal (both sides of the marketplace present, errors and
usage observable).

**Critical path:** env split → email service → (reset / confirm / phone /
invites). Observability + legal run in parallel. Marketplace seeding is the
final gate.

---

## Phase 1 — Foundation

Do this first so everything below is built and tested in the right place.

- [ ] **Split dev / prod environments**
  - [x] Code scaffolding: `.env.example` two-lane model, `ENVIRONMENTS.md`,
        `db:*` npm scripts (2026-08-04)
  - [ ] Create the prod Supabase project (existing `ryigaxihlfqdwgjbgmcg` = dev)
  - [x] Push all 116 migrations to prod (schema only, no seed) — prod up to date;
        CLI relinked to dev (2026-08-04). Added `20260427000001_seed_industries_reference.sql`
        so industries reference data (was seed-only) exists on clean DBs.
        FOLLOW-UP: reconcile industries taxonomy — seed.sql/prod (retail/transportation/
        security) vs `src/site/data/industries.ts` (warehousing/cleaning/food_service/freelance)
  - [x] Fill prod ref `ivbmjtngsasrlblzhfxj` into `package.json` + `ENVIRONMENTS.md` (2026-08-04)
  - [x] Separate Vercel environments (prod vars → prod, preview/dev → dev) (2026-08-04)
  - [x] Prod Auth: site URL + redirects → prod domain saved; "Confirm email"
        is ON by default on new hosted projects (2026-08-04). NOTE: emails
        won't actually deliver until Resend/SMTP is wired (Phase 2)
- [x] **Upgrade Supabase to Pro** (unblocks real backups) — both dev + prod on
      Pro (2026-08-04)
  - [ ] Verify automated daily backups are on for prod
  - [ ] Confirm point-in-time-recovery expectations
- [x] **Finish deferred cron work** (2026-08-04)
  - [x] Schedule `hard_delete_expired_companies()` — daily 04:00 UTC via
        `20260804000001`; applied to prod + dev (pg_cron already enabled;
        `publish_scheduled_jobs` already registered)

---

## Phase 2 — Communications backbone

Hard prerequisite for password reset, email confirmation, and invites.

- [ ] **Choose + wire an email provider** (Resend / Postmark / SendGrid — not
      Supabase's built-in SMTP for prod)
  - [ ] Point Supabase Auth emails through the provider
  - [ ] Reuse the hosted email templates already in the repo
- [ ] **Authenticate the sending domain** (deliverability — the part people skip)
  - [ ] SPF record
  - [ ] DKIM signing
  - [ ] DMARC policy
  - [ ] Send test emails and confirm they land in inbox, not spam

---

## Phase 3 — Auth completeness

All items depend on Phase 2 (email) except phone (SMS).

- [ ] **Finish password reset flow**
  - [ ] Request-reset entry point
  - [ ] Reset email delivers (via Phase 2)
  - [ ] Reset completion screen (set new password → confirmation)
- [ ] **Enable email confirmation**
  - [ ] Turn on Supabase "Confirm email" setting (currently auto-verified)
  - [ ] Build email verification landing page
  - [ ] Verify `resendVerificationEmail()` path works end-to-end
- [ ] **Phone verification**
  - [ ] Wire Supabase Phone Auth (Twilio)
  - [ ] Replace the current stub UI
  - [ ] **SMS consent language (TCPA)** at the point the number is collected
- [ ] **Team invite emails**
  - [ ] Flip `sendInviteEmail` from no-op stub to real send (via Phase 2)

---

## Phase 4 — Observability, safety & legal

Can run in parallel with Phase 3. Must be live BEFORE seeding — the beta's
whole purpose is the signal.

- [ ] **Sentry — error monitoring**
  - [ ] Install `@sentry/react`
  - [ ] Init module + error boundary at app root
  - [ ] Vite source-map upload plugin (so traces show real TS lines)
  - [ ] DSN as env var; report only from real deployments, not local dev
  - [ ] Add `Sentry.captureException` in key service `{ data, error }` handlers
  - [ ] Route alerts to email/Slack
- [ ] **PostHog — product analytics + marketplace liquidity metrics**
  - [ ] Install + init
  - [ ] Track both-sides activation, not just signups
  - [ ] Instrument time-to-first-value per side (worker finds a relevant job;
        company gets first applicant)
  - [ ] Instrument empty-state / zero-results rate (the liquidity gauge)
  - [ ] (Optional) session replay for debugging beta issues
- [ ] **Legal**
  - [ ] Terms of Service — live + linked from signup
  - [ ] Privacy Policy — live + linked from signup
- [ ] **Security / RLS review** before real data lands
  - [ ] Focused pass over RLS policies for the personas
  - [ ] Confirm no policy regressions from recent multiseat work

---

## Phase 5 — Launch readiness

Final gate. Depends on nearly everything above holding up.

- [ ] **Close known UX gaps**
  - [ ] 404 page
  - [ ] Post-apply confirmation screen
  - [ ] Any zero-results screens that would greet a brand-new user
- [ ] **Marketplace seeding** (start planning NOW — company recruiting has a
      long lead time)
  - [ ] Pick the wedge: one metro + one or two trades
  - [ ] Line up first 5–15 companies (warm intros / Regulix relationships)
  - [ ] Concierge onboarding: post their REAL open jobs for them
        (no fabricated listings)
  - [ ] Recruit workers matched to the wedge's trade + geography
  - [ ] Plan for manual matchmaking in the first few weeks (you are the
        liquidity until it self-sustains)
- [ ] **Beta feedback loop** (form or email for bug reports / feedback)

---

## Explicitly NOT blocking beta

- Resume AI (still mocked) — leave stubbed unless a beta beat tests it
- Regulix (behind `VITE_ENABLE_REGULIX`, off) — keep gated
