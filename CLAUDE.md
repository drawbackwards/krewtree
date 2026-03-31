# Krewtree — Claude Code Context

## What this project is

Krewtree is a dual-sided job board connecting workers and companies,
built in partnership with Regulix. It has two distinct user personas
with different dashboards, flows, and data access.

## Tech stack

- React 18 + TypeScript 5 (strict mode)
- React Router 7 for routing
- Vite 5 as build tool
- Supabase for auth, Postgres database, and Row Level Security (RLS)
- CSS Modules + CSS custom properties (`--kt-*` design tokens) for styling
- Custom component library (`src/components/`) — no Tailwind, no shadcn/ui
- Vercel for deployment

## Project conventions

- All components use TypeScript with explicit return types
- No `any` types — use `unknown` and narrow, or define proper interfaces
- Supabase queries go in `src/site/services/` — never inline in components
  - Each service function returns `{ data, error }` — always handle both
- Auth state comes from `useAuth()` (src/site/context/AuthContext.tsx) — never fetch directly
- Icons live in `src/site/icons/index.tsx` — always import from there, never define inline
- No Tailwind, no inline hex values, no emoji — use CSS tokens and SVG icon components
- Brand name is always lowercase: **krewtree**

## Auth model

- Supabase handles auth: `supabase.auth.signUp`, `signInWithPassword`, `signOut`
- User roles stored in `user_roles` table; loaded via `loadRole(userId)` in AuthContext
- `isEmailVerified`: derived from `!!user?.email_confirmed_at`
- `isLoggedIn`: true immediately after signup (before email verification)
- Email verification gates specific actions (e.g. job applications) — not full app access
- `resendVerificationEmail()` available from `useAuth()` for resend flows

## Data model notes

- Two user types: `worker` | `company` — always check persona before writing queries
- RLS is active — never disable it for convenience
- All Supabase calls should handle the error case explicitly
- Mock data lives in `src/site/data/mock.ts` — replace with real service calls one file at a time
- When replacing a mock import, add/update a function in `src/site/services/`

## Services layer (current state — session 9)

- `workerService.ts` — worker profile read/write, applications, events, saved count, recommended jobs, avatar/resume upload, `submitApplication()`
- `jobService.ts` — `getJobs()`, `getJobById()`, `createJob()`, `updateJob()` (added session 9)
- No service files yet for: company profile, messages, referrals, saved jobs, notifications

## Screen completion status (session 9 — 2026-03-30)

**Complete:** LandingPage, LoginPage, SignupRolePage, WorkerSignupPage, CompanySignupPage, PostJobPage (`/site/post-job`), EditJobPage (`/site/post-job/:id`), QuickApplyModal

**In progress:** WorkerDashboard, WorkerProfileEditPage, WorkerProfilePage (public), JobsPage, JobDetailPage, CompanyDashboard

**Stub / mock data only:** SavedJobsPage, MessagesPage, ReferralPage, CompanyProfilePage

**Missing / not built:** Email verification landing, Company profile edit, Phone verification flow, Resume AI parsing (Vercel + Claude Haiku), Boost payment flow, Regulix connect/disconnect, Worker settings, Applicant detail view, 404 page, Post-apply confirmation screen

**Journey map:** https://www.figma.com/design/dPKfI2yONW9L6wYs40HdWB (Drawbackwards team)

## Styling rules

- CSS Modules for component-level scoping; inline styles for page-level layout
- All values use `--kt-*` tokens — never hardcode hex colors or pixel values in components
- No gradients, no Tailwind, no external UI libraries
- Light + dark mode tokens exist in `src/styles/tokens.css`

## Testing

- Unit tests: Vitest — test utility functions and data transforms
- Integration tests: Playwright — covers auth flows and critical paths
- Run tests before opening a PR: `npm test -- --run`

## What NOT to do

- Do not bypass RLS policies
- Do not inline Supabase queries in components — use `src/site/services/`
- Do not hardcode hex values in component files — use CSS tokens
- Do not introduce new dependencies without checking if one already exists
- Do not use `console.log` in committed code — use proper error handling
- Do not add Tailwind, shadcn/ui, or any external UI component library
