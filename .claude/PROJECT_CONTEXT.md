# krewtree — Project Context & Master Flow
> Last updated: March 27, 2026 (session 7)
> This file is the single source of truth for Claude context. Read this first after any memory reset.

---

## 1. What Is krewtree?

krewtree is a **job board platform for hourly / blue-collar workers and the companies that hire them**. It is a Regulix partner platform — Regulix handles worker identity verification, onboarding paperwork, and timecards. Workers who complete Regulix onboarding are "Regulix Ready" and can be hired same-day with zero paperwork delays.

**Core value props:**
- Workers: one verified profile that works across every industry
- Companies: post once, access hire-ready workers who can start immediately
- Industry-specific subdomains (e.g., `construction.krewtree.com`) — each subdomain focuses on one vertical but the user's single account works everywhere

---

## 2. Tech Stack

| Layer | Choice |
|-------|--------|
| UI framework | React 18.3.1 |
| Language | TypeScript 5.5.3 (strict mode) |
| Build tool | Vite 5.4.1 |
| Routing | React Router DOM 7.13.1 |
| Styling | CSS Modules + CSS Custom Properties (`--kt-*` tokens) |
| Tailwind | ❌ None — never add |
| Testing | ❌ Not yet set up |
| Linting | ✅ ESLint 9 + typescript-eslint + react-hooks + react-refresh + react + prettier |
| Deployment | Vercel (vercel.json configured) |
| Dev server | `npm run dev` → http://localhost:5173 |

**Key config files:**
- `vite.config.ts` — defaults to `host: localhost`; set `EXPOSE_HOST=true` to expose on network. Port 5173. `@` alias → `./src`
- `tsconfig.json` — `strict: true`, `noUnusedLocals`, `noUnusedParameters`
- `eslint.config.js` — ESLint flat config with 4 plugins; husky + lint-staged run on commit
- `vercel.json` — SPA rewrites + redirect `/` → `/site`
- `.claude/launch.json` — Claude Code preview server config
- `docs/app-architecture.html` — static HTML architecture diagram showing all sections, pages, and content hierarchy

---

## 3. Brand & Design System

### Brand Colors

| Name | Hex | CSS Token | Usage |
|------|-----|-----------|-------|
| Navy | `#0A232D` | `var(--kt-navy-900)` | 60% — backgrounds, CTAs |
| Sand Dune | `#E5DAC3` | `var(--kt-sand-400)` | 30% — warm tints, dark surfaces |
| Olive | `#6D7531` | `var(--kt-olive-700)` / `var(--kt-accent)` | 10% — primary buttons, Regulix badge |
| Charcoal | `#454545` | `var(--kt-grey-700)` | — |
| Silver | `#C7C7C7` | `var(--kt-grey-300)` | — |
| Ink | `#161616` | `var(--kt-grey-900)` | — |

**Other values used in auth pages:**
- `#103949` — light navy-teal used for "For Workers" badge on LandingPage worker card
- `#8B9A3E` — lighter olive used for "COMPANY ACCOUNT" / "WORKER ACCOUNT" label text on white cards

### CSS Token System
- File: `src/styles/tokens.css`
- TypeScript primitives: `src/tokens/colors.ts`
- Prefix: `--kt-*`
- Light mode on `:root`, dark mode on `[data-theme="dark"]`
- Toggle: `document.documentElement.setAttribute('data-theme', 'dark')`

**Key semantic tokens:**
```
--kt-primary       Navy CTA
--kt-accent        Olive CTA (main call-to-action color)
--kt-bg            Page background
--kt-surface       Card/panel background
--kt-bg-subtle     Section alternating background
--kt-text          Body text
--kt-text-muted    Secondary text
--kt-border        Default border
--kt-shadow-sm/md/lg/xl
--kt-space-1 (4px) … --kt-space-16 (64px)
--kt-radius-sm/md/lg/xl/full
```

### Design Rules
- **No gradients** — all backgrounds use flat/solid tokens
- **No Tailwind** — never add it
- CSS modules for component scoping, inline styles for page-level layouts
- Dark mode supported via token system but no UI toggle yet on site
- Brand name is always lowercase: **krewtree**
- **All SVG icons must be imported from `src/site/icons/index.tsx`** — never define inline SVG icon components in page or component files. Add new icons to the shared library, then import.
- **No emoji** — use SVG icon components for all iconography, never emoji characters
- WCAG AA contrast must be maintained: on olive `#6D7531` backgrounds, only white passes AA for normal text

---

## 4. File Structure

```
src/
├── App.tsx                    — component library showcase/demo page
├── main.tsx                   — entry; wraps in ErrorBoundary > BrowserRouter > ToastProvider
├── vite-env.d.ts              — CSS module type declarations
├── styles/
│   ├── tokens.css             — full CSS custom property token system (light + dark)
│   └── global.css             — reset + body styles
├── tokens/
│   └── colors.ts              — TS color primitives + light/dark semantic maps
├── components/                — reusable UI component library (21 components + ErrorBoundary)
│   ├── index.ts               — barrel export
│   ├── ErrorBoundary/         — top-level React error boundary (class component)
│   ├── Alert/    ├── Avatar/       ├── Badge/
│   ├── Button/   ├── Card/         ├── Checkbox/
│   ├── Divider/  ├── Input/        ├── Label/
│   ├── Modal/    ├── Progress/     ├── Radio/
│   ├── Select/   ├── Spinner/      ├── Switch/
│   ├── Tabs/     ├── Textarea/     ├── Toast/
│   └── Tooltip/
└── site/                      — the krewtree site/app
    ├── Router.tsx             — all site routes + Navbar wrapper (AppLayout)
    ├── context/
    │   └── AuthContext.tsx    — AuthContext with login/logout, persona state (worker | company)
    ├── icons/
    │   └── index.tsx          — shared SVG icon library (~60+ icons, all named exports)
    ├── data/
    │   └── mock.ts            — all mock data (56KB) — types + data; replace with real API
    ├── types/
    │   └── index.ts           — shared TypeScript types
    ├── components/            — site-specific components
    │   ├── index.ts
    │   ├── Logo.tsx           — KrewtreeLogo + KrewtreeBgMark (official brand SVG paths)
    │   ├── AnalyticsPanel/    ├── JobCard/       ├── KanbanBoard/
    │   ├── Navbar/            ├── NotificationDrawer/
    │   ├── QuickApplyModal/   ├── RegulixBadge/  ├── ReviewCard/
    │   ├── StatCard/          └── WorkerCard/
    └── pages/
        ├── index.ts
        ├── auth/
        │   ├── LoginPage.tsx          — sign-in page (color-coded by user type)
        │   ├── SignupRolePage.tsx     — role picker (worker vs company path cards)
        │   ├── WorkerSignupPage.tsx   — worker registration form
        │   └── CompanySignupPage.tsx  — company registration form
        ├── landing/
        │   ├── sections.tsx          — landing page section components (IndustriesSection, RegulixBannerSection, etc.)
        │   └── RegulixBanner.module.css — CSS module for Regulix two-card grid (subgrid + mobile stacking)
        ├── LandingPage.tsx        — home / path chooser
        ├── JobsPage.tsx           — job search & filtering
        ├── JobDetailPage.tsx      — individual job view + apply; share modal; manage listing modal
        ├── WorkerDashboard.tsx    — worker's home (stats, apps, activity)
        ├── WorkerProfilePage.tsx  — public worker profile
        ├── CompanyDashboard.tsx   — company's home (analytics, kanban)
        ├── CompanyProfilePage.tsx — public company profile
        ├── PostJobPage.tsx        — job posting form
        ├── SavedJobsPage.tsx      — worker's saved jobs
        ├── MessagesPage.tsx       — messaging between workers & companies
        └── ReferralPage.tsx       — referral program
```

---

## 5. Routes

All site routes are prefixed `/site`. Root `/` redirects to `/site` via vercel.json.

| Route | Component | Notes |
|-------|-----------|-------|
| `/site/login` | `LoginPage` | No Navbar — neutral white/gray page, email + password only |
| `/site/login?type=company` | `LoginPage` | No Navbar — same neutral page; `?type=company` routes mock demo to company dashboard silently |
| `/site/signup` | `SignupRolePage` | No Navbar — role picker |
| `/site/signup/worker` | `WorkerSignupPage` | No Navbar |
| `/site/signup/company` | `CompanySignupPage` | No Navbar |
| `/site` | `LandingPage` | Navbar |
| `/site?layout=e` | `LandingPage` (E·Color hero) | Navbar |
| `/site/jobs` | `JobsPage` | Navbar |
| `/site/jobs/:id` | `JobDetailPage` | Navbar |
| `/site/dashboard/worker` | `WorkerDashboard` | Navbar — ⚠️ no auth guard yet |
| `/site/dashboard/company` | `CompanyDashboard` | Navbar — ⚠️ no auth guard yet |
| `/site/profile/:id` | `WorkerProfilePage` | Navbar |
| `/site/post-job` | `PostJobPage` | Navbar |
| `/site/company/:id` | `CompanyProfilePage` | Navbar |
| `/site/saved-jobs` | `SavedJobsPage` | Navbar |
| `/site/messages` | `MessagesPage` | Navbar |
| `/site/referrals` | `ReferralPage` | Navbar |
| `/site/candidates` | *(not yet built)* | Navbar — company only; search & filter workers by profile info |
| `/site/manage-jobs` | *(not yet built)* | Navbar — company only; table of all listings, bulk actions, per-listing stats |
| `/site/pipeline` | *(not yet built)* | Navbar — company only; all interacted applicants and their hiring stage |

**Auth note:** Auth is fully wired via Supabase. `ProtectedRoute` implemented in `Router.tsx`. `isLoggedIn` and `isEmailVerified` are separate flags — users gain full app access immediately after signup; specific actions (job applications) are gated behind `isEmailVerified`.

**⚠️ Pre-launch:** Supabase "Confirm email" setting must be enabled in the dashboard — currently all new signups are auto-confirmed. See `project_email_confirmation.md`.

---

## 6. Auth Pages — Design System

The 4 auth pages form a cohesive visual system. Key patterns:

### Color coding by user type
**LoginPage** is now **neutral** (white/gray) — it is NOT color-coded. The persona toggle was removed; the user's account type is determined by stored account data after login.

Signup pages remain color-coded:
| Context | Background | Logo |
|---------|-----------|------|
| Worker signup | `var(--kt-navy-900)` `#0A232D` | `onDark` (default olive accent) |
| Company signup | `var(--kt-olive-700)` `#6D7531` | `onDark` + `accentColor="white"` |

### Layout pattern
**LoginPage:**
- Background: `var(--kt-grey-50)` (light gray) — no color coding
- `KrewtreeBgMark` watermark inside main content area with `color: 'var(--kt-grey-900)', opacity: 0.045`; mark is nested inside the content `<div>` (not full-page) so it centers relative to content only, not the header
- Top bar: no background/border, `zIndex: 10`, `padding: '22px 52px'`; `KrewtreeLogo height={34}` with `onDark={false}`
- Main content: `zIndex: 1`, `overflow: hidden`; two-column layout (marketing left, white card right)
- White card: `background: white`, `border: '1px solid var(--kt-border)'`, `boxShadow: 'var(--kt-shadow-md)'`, `borderRadius: 16`, `padding: '44px 48px'`, `width: 420`
- Footer: "A Regulix Partner Platform · © 2026 krewtree" faint text
- `?type=company` param is preserved for mock demo routing only — routes to company dashboard after login; not reflected in UI

**Signup pages (WorkerSignupPage, CompanySignupPage):**
- Full-viewport colored background (navy or olive)
- `KrewtreeBgMark` watermark; mark uses `currentColor` fill so color is controlled by the parent's CSS `color` property
- Top bar: `KrewtreeLogo` left, secondary nav link right
- Two-column main: brand/marketing content left, white card form right
- Footer: "A Regulix Partner Platform · © 2026 krewtree" faint text

### White card conventions (signup pages)
- `background: white`, `borderRadius: 20`, `boxShadow: '0 24px 64px rgba(0,0,0,0.45)'`
- Account type label: plain text `#8B9A3E` (lighter olive), 11px, 700 weight, uppercase, `letterSpacing: '0.08em'`
- Heading: `var(--kt-text)`, 2xl, bold
- Subtext: `var(--kt-text-muted)`

### KrewtreeBgMark — currentColor fill
`KrewtreeBgMark` SVG paths use `fill="currentColor"`. The component sets a default `color: '#e5dac3'` (sand) in its style so dark auth pages are unchanged. Override via the `style` prop:
```tsx
// Login page (light gray bg):
<KrewtreeBgMark style={{ color: 'var(--kt-grey-900)', opacity: 0.045 }} />

// Dark auth pages (worker/company signup) use the sand default automatically
```

### Inline SVG icons
All icon-like UI uses inline React SVG components — no icon library. Pattern:
```tsx
const MyIcon = ({ icon }: { icon: string }) => {
  const p = {
    viewBox: '0 0 24 24', fill: 'none' as const,
    stroke: 'currentColor', strokeWidth: 1.75,
    strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
    width: N, height: N,
  }
  switch (icon) { ... }
}
```
Icons in use: `hardhat`, `building`, `zap` (LoginPage `StatIcon`); `clipboard`, `users`, `zap`, `inbox` (CompanySignupPage `BenefitIcon`); `construction`, `healthcare`, `hospitality`, `retail`, `transportation`, `manufacturing`, `landscaping`, `security` (LandingPage `IndustryIcon`).

### WCAG AA contrast on olive backgrounds
Olive `#6D7531` has luminance ≈ 0.162. Contrast ratios:
- White → **4.95:1** ✅ passes AA normal text
- `rgba(255,255,255,0.85)` → ~4.2:1 ✅ passes AA large/bold text; use for subtitles
- `rgba(255,255,255,0.75)` → ~3.7:1 ✅ passes AA large/bold; use for captions
- `rgba(229,218,195,0.5)` → ~1.94:1 ❌ fails — do not use for text

---

## 7. Data Models (from mock.ts)

```typescript
Industry { id, name, slug, icon, jobCount, color }

Company {
  id, name, logo, location, industry,
  isVerified: boolean, description, size, website
}

Job {
  id, title, company: Company, industry, type: 'full-time'|'part-time'|'contract'|'temp',
  location, payMin: number, payMax: number, payType: 'hour'|'salary',
  requirements: string[], skills: string[],
  isSponsored: boolean, applicantCount, newApplicants, status, postedAt
}

WorkerSkill { name: string, level: 'Beginner'|'Intermediate'|'Expert' }

WorkerJobHistory {
  employer, title, startDate, endDate, isRegulixVerified: boolean
}

Worker {
  id, name, headline, avatar, location,
  isRegulixReady: boolean, performanceScore: number (0-5),
  skills: WorkerSkill[], jobHistory: WorkerJobHistory[],
  bio, profileCompletePct: number
}
```

---

## 8. Component Library (src/components)

All components share:
- TypeScript props interfaces
- CSS module styling using `--kt-*` tokens
- Accessible (aria attributes, focus-visible)
- Light/dark responsive

| Component | Key Variants/Notes |
|-----------|-------------------|
| `ErrorBoundary` | Class component; wraps entire app; shows reload UI on crash |
| `Button` | 7 variants: primary, secondary, accent, outline, ghost, danger, link. Supports `as="a"` to render as `<a>` with `href`, `target`, `rel` |
| `Badge` | 8 variants: default, primary, secondary, accent, success, warning, danger, info |
| `Input` | size sm/md/lg, error state, leading/trailing icon |
| `Textarea` | resize control, character count |
| `Select` | size sm/md/lg, error state |
| `Checkbox` | indeterminate support |
| `Radio` / `RadioGroup` | group context |
| `Switch` | label positioning |
| `Card` / `CardHeader` / `CardBody` / `CardFooter` | compound component |
| `Avatar` / `AvatarGroup` | size xs–xl, fallback initials, status dot |
| `Modal` | size sm/md/lg/xl, focus trap |
| `Tabs` / `TabList` / `Tab` / `TabPanel` | keyboard nav |
| `Alert` | 4 variants, dismissible |
| `Progress` | determinate + indeterminate |
| `Spinner` | size sm/md/lg |
| `Tooltip` | 4 placements |
| `Toast` / `ToastProvider` / `useToast` | position prop, auto-dismiss |
| `Label` | — |
| `Divider` | horizontal/vertical |

---

## 9. Site-Specific Components (src/site/components)

| Component | Purpose |
|-----------|---------|
| `Logo` (`KrewtreeLogo`, `KrewtreeBgMark`) | Official brand SVG. `onDark` prop switches colors. `accentColor` prop overrides accent (use `"white"` on olive bg). `KrewtreeBgMark` uses `fill="currentColor"` — default color is sand `#e5dac3`; override via `style` prop (e.g. `style={{ color: 'var(--kt-grey-900)', opacity: 0.045 }}` on the light login page). Used in Navbar + all auth pages |
| `Navbar` | Top nav. Auth buttons (`Log in`, `Sign up`) pushed to far right via `margin-left: auto` on `.right` wrapper. When logged in: persona-specific nav links + `+ Post a Job` button (company only) + notification bell + avatar dropdown. **Worker links:** Find Jobs, Dashboard, Resume, Saved Jobs, Messages. **Company links:** Dashboard, Candidates (`/site/candidates`), Manage Jobs (`/site/manage-jobs`), Pipeline (`/site/pipeline`), Messages. **Avatar dropdown:** name header (+ company name for company persona), Organization Settings (company only — Company Name, Industry, Team Members, Billing), Personal Settings (Name & Headline, Avatar, Location, Password, Photo, Notifications, Dark/Light Mode), Log Out |
| `RegulixBadge` | Regulix partner badge with pulse animation, sizes sm/md/lg, onDark variant |
| `JobCard` | Job listing card with company, pay, skills, Regulix Ready badge. Sponsored banner transitions from olive → `--kt-navy-500` on hover |
| `WorkerCard` | Worker profile card with performance score, Regulix Ready status |
| `StatCard` | Dashboard stat tile (num + label + trend) |
| `AnalyticsPanel` | Chart/analytics display for company dashboard |
| `KanbanBoard` | Application pipeline (Applied → Reviewed → Interview → Hired) |
| `QuickApplyModal` | 1-click apply modal; optional $9.99 boost add-on (checkbox, reflected in submit label + success state) |
| `ReviewCard` | Employer/worker review display |
| `NotificationDrawer` | Slide-in notification panel |

---

## 10. LandingPage — Current State

**File:** `src/site/pages/LandingPage.tsx`
**Sections file:** `src/site/pages/landing/sections.tsx`

**Active layouts (toggled via `?layout=` query param):**
- `default` — D Track + B Center merged: "What brings you to krewtree?" → two path cards (worker/company) → stats
- `e` (E·Color) — Vibrant white-BG layout with colored industry chips, offset-shadow search, colored stat tiles, marquee

**Layout switcher pill:** Fixed bottom-center, only shows Default and E·Color.

**Page section order (default):**
1. Hero (path chooser)
2. Featured Jobs
3. How krewtree Works (horizontal timeline — 01 → 02 → 03)
4. Browse by Industry
5. Regulix Banner
6. CTA
7. Footer

**Worker path card (on hero):**
- "For Workers" badge: `background: '#103949'` (light navy-teal), `color: 'rgba(229,218,195,0.85)'`, `border: 'none'`
- "Browse Jobs →" button: `background: 'white'`, `color: 'var(--kt-navy-900)'`

**IndustriesSection:**
- Grid layout: `display: grid; gridTemplateColumns: repeat(4, 1fr); maxWidth: 760; margin: 0 auto`
- Exactly 4 columns locked — no scroll, no stretch at wide screens
- Cards: no border/stroke, vertically aligned (icon top, label centered below), `padding: '24px 16px'`
- Icons: `IndustryIcon` SVG component with `slug` prop, colored with `ind.color`
- 8 industries: construction, healthcare, hospitality, retail, transportation, manufacturing, landscaping, security

**Key design decisions:**
- No gradients anywhere
- Industries section placed lower (subdomain-first strategy)
- WorkersCompaniesSection removed (covered by hero path cards)

---

## 11. Master User Flow

```
                         ┌─────────────────────────────┐
                         │      krewtree.com /site      │
                         │   "What brings you here?"   │
                         └──────────┬──────────────────┘
                                    │
               ┌────────────────────┴────────────────────┐
               │                                         │
        👷 WORKER PATH                           🏢 COMPANY PATH
               │                                         │
    ┌──────────▼──────────┐                  ┌──────────▼──────────┐
    │   Browse Jobs        │                  │   Post a Job         │
    │   /site/jobs         │                  │   /site/post-job     │
    └──────────┬──────────┘                  └──────────┬──────────┘
               │                                         │
    ┌──────────▼──────────┐                  ┌──────────▼──────────┐
    │   Job Detail         │                  │   Company Dashboard  │
    │   /site/jobs/:id     │                  │   /site/dashboard/   │
    └──────────┬──────────┘                  │   company            │
               │                             └──────────┬──────────┘
    ┌──────────▼──────────┐                             │
    │   QuickApplyModal    │                  ┌──────────▼──────────┐
    │   (1-click if        │                  │   Browse Workers     │
    │    Regulix Ready)    │                  │   (not yet built)    │
    └──────────┬──────────┘                  └─────────────────────┘
               │
    ┌──────────▼──────────┐
    │   Worker Dashboard   │◄────────► Messages /site/messages
    │   /site/dashboard/   │
    │   worker             │
    └──────────┬──────────┘
               │
    ┌──────────▼──────────┐
    │   Worker Profile     │
    │   /site/profile/:id  │
    └──────────┬──────────┘
               │
    ┌──────────▼──────────┐
    │   Regulix (external) │
    │   → Regulix Ready    │
    └─────────────────────┘
```

### Subdomain Strategy
```
krewtree.com/site          → main site (industry agnostic, path chooser hero)
construction.krewtree.com  → construction-specific landing, same account
trucking.krewtree.com      → trucking-specific landing
healthcare.krewtree.com    → healthcare-specific landing
```
Each subdomain shows industry-scoped jobs by default. "Browse by Industry" is intentionally placed lower on the main site since subdomains handle discovery.

---

## 12. Figma Reference

- **File key:** `AdcUtHlOEMY5qMncpShGAJ`
- **Brand slide node:** `2075:386` (slide 04 — brand colors)
- Access: Figma MCP tool with `fileKey: 'AdcUtHlOEMY5qMncpShGAJ'`

---

## 13. What's Built vs. What's Missing

### ✅ Built

- Full design token system (light + dark)
- 21 reusable UI components + ErrorBoundary
- Supabase auth — signup, login, logout, email verification gate, role-based persona, `ProtectedRoute`
- `AuthContext` (`useAuth`) — `isLoggedIn`, `isEmailVerified`, `resendVerificationEmail`, `persona`
- Service layer — `src/site/services/workerService.ts` — all Supabase queries centralized
- `WorkerDashboard` + `WorkerProfileEditPage` wired to real Supabase data
- `WorkerProfileEditPage` — 6 sub-components in `WorkerProfileEdit/`; localStorage draft with deep-merge; unsaved-changes guard (`safeNavigate`)
- Resume upload wired to Supabase Storage (`resumes` bucket)
- Landing page (2 hero variants), all 12 app pages + 4 auth pages
- Full `JobDetailPage`: Quick Apply, Save Job, Share modal, Manage Listing modal (company)
- Worker profile public view — skills hero strip, work experience, certifications, contact sidebar
- `upsert_worker_profile` SQL function — auto-computes `profile_complete_pct` on every save
- localStorage cleared on logout — prevents profile data leaking to new accounts
- Company dashboard + kanban + boost modal
- Post Job page with sponsored listing + Regulix Preferred toggles
- Navbar — persona-aware links; "My Profile" uses real `user.id`
- Portfolio feature removed
- Endorsements placeholder removed — will come from Regulix connection (not yet built)
- ESLint + Prettier + husky + lint-staged; HTTP security headers via `vercel.json`

**Worker profile UI (session 7):**
- Work Experience above Certifications; contract type badge next to industry badge
- Section headers: `--kt-navy-900`, bold; experience timeline dots: `--kt-success` green
- Skills hero strip: `--kt-navy-50` background, no border, rounded; industry label hidden if only 1 industry; sorted by years exp desc
- Certifications: expiry date → earned date (UI + service; DB column unchanged)
- Completion indicator hidden at 100% on both dashboard and edit page
- Edit page: View Profile button replaces back link; 2-column skill grid; full width when stepper hidden

### ⚠️ Pre-launch blockers

| Item | Status | Notes |
|------|--------|-------|
| Resume AI analysis | Mocked | Use Vercel fn + Claude Haiku — see `project_resume_ai.md` |
| Phone verification | Stub | Use Supabase Phone Auth (Twilio) — see `project_phone_verification.md` |
| Supabase "Confirm email" | Off | Enable in Supabase Dashboard → Auth → Providers → Email |
| Endorsements | Not built | Comes from Regulix connection |

### ❌ Not Yet Built
- **Candidates page** (`/site/candidates`) — search & filter workers by profile info
- **Manage Jobs page** (`/site/manage-jobs`) — listings table, bulk actions, per-listing stats
- **Pipeline page** (`/site/pipeline`) — all interacted applicants by hiring stage
- Real API / backend integration (replace remaining `mock.ts` imports)
- Industry subdomain routing logic
- Dark mode UI toggle (tokens exist, no toggle)
- Mobile responsive layouts
- Unit / integration tests
- Loading / skeleton states
- SEO / per-page `<title>` and meta tags
- Analytics integration

---

## 14. Dev Commands

```bash
npm run dev          # start dev server → http://localhost:5173
EXPOSE_HOST=true npm run dev  # expose on local network (for device testing)
npm run build        # tsc + vite build
npm run preview      # preview production build
npm run lint         # run ESLint
npm run lint:fix     # run ESLint with auto-fix
npm run format       # run Prettier on all src files
npx tsc --noEmit     # type-check only (no output)
```
