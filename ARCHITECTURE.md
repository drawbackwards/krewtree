# krewtree — Architecture Overview

> Last updated: March 2026

---

## What Is krewtree?

krewtree is a job board for hourly and blue-collar workers and the companies that hire them. It is a **Regulix partner platform** — Regulix handles worker identity verification, onboarding, and timecards. Workers who complete Regulix onboarding are "Regulix Ready" and can be hired same-day with no paperwork delays.

**Core value props:**

- **Workers** — one verified profile that works across every industry
- **Companies** — post once, access hire-ready workers who can start immediately
- **Industry subdomains** — `construction.krewtree.com`, `healthcare.krewtree.com`, etc. — each scoped to one vertical, same account everywhere

---

## Tech Stack

| Layer        | Choice                                                                                                    |
| ------------ | --------------------------------------------------------------------------------------------------------- |
| UI framework | React 18                                                                                                  |
| Language     | TypeScript 5 (strict mode)                                                                                |
| Build tool   | Vite 5                                                                                                    |
| Routing      | React Router DOM 7                                                                                        |
| Styling      | CSS Modules + CSS custom properties (`--kt-*` design tokens)                                              |
| Linting      | ESLint 9 (flat config) + typescript-eslint + eslint-plugin-react + react-hooks + react-refresh + prettier |
| Git hooks    | husky + lint-staged (runs ESLint + Prettier on commit)                                                    |
| Deployment   | Vercel — SPA rewrites, root `/` redirects to `/site`                                                      |

**What's intentionally excluded:**

- No Tailwind — never add it
- No external UI library (MUI, Chakra, etc.) — custom component library only
- No Redux / Zustand — local state + context for now; API layer will determine state strategy

---

## Project Structure

```
krewtree/
├── src/
│   ├── main.tsx                 Entry point — ErrorBoundary > BrowserRouter > ToastProvider > App
│   ├── App.tsx                  Component library showcase (dev reference)
│   ├── styles/
│   │   ├── tokens.css           Full CSS design token system (light + dark modes)
│   │   └── global.css           Reset + base body styles
│   ├── tokens/
│   │   └── colors.ts            TypeScript color primitives (mirrors tokens.css)
│   ├── components/              Reusable UI component library
│   │   ├── ErrorBoundary/       Top-level crash recovery boundary
│   │   ├── Button/              7 variants
│   │   ├── Input/               With error state, leading/trailing icons
│   │   ├── ...                  (21 components total — see Component Library section)
│   │   └── index.ts             Barrel export
│   └── site/                    The krewtree application
│       ├── Router.tsx           Route definitions + AppLayout wrapper
│       ├── data/mock.ts         Mock data (56KB) — replace with real API calls
│       ├── types/index.ts       Shared TypeScript interfaces
│       ├── components/          Site-specific components
│       │   ├── Logo.tsx         KrewtreeLogo + KrewtreeBgMark (official brand SVGs)
│       │   ├── Navbar/
│       │   └── ...              (10 components — see below)
│       └── pages/
│           ├── auth/            Auth flow UI (no real auth yet)
│           │   ├── LoginPage.tsx
│           │   ├── SignupRolePage.tsx
│           │   ├── WorkerSignupPage.tsx
│           │   └── CompanySignupPage.tsx
│           └── ...              (12 app pages)
├── .gitignore
├── eslint.config.js
├── tsconfig.json
├── vite.config.ts
└── vercel.json
```

---

## Design System

### Brand Colors

| Token                            | Hex       | Role                                     |
| -------------------------------- | --------- | ---------------------------------------- |
| `--kt-navy-900` / `--kt-primary` | `#0A232D` | 60% — page backgrounds, primary CTAs     |
| `--kt-sand-400`                  | `#E5DAC3` | 30% — warm tints, text on dark surfaces  |
| `--kt-olive-700` / `--kt-accent` | `#6D7531` | 10% — main action buttons, Regulix badge |
| `--kt-grey-700`                  | `#454545` | Charcoal body text                       |
| `--kt-grey-300`                  | `#C7C7C7` | Silver borders, muted                    |
| `--kt-grey-900`                  | `#161616` | Ink — darkest text                       |

### Token System

- All design values live in `src/styles/tokens.css` as `--kt-*` CSS custom properties
- Light mode on `:root`, dark mode on `[data-theme="dark"]`
- TypeScript equivalents in `src/tokens/colors.ts`
- Components reference tokens only — never hardcoded hex values

### Design Rules

- **No gradients** — flat solid colors only
- **No Tailwind** — CSS modules + custom properties
- **CSS modules** for component-level scoping
- **Inline styles** for page-level layout (supports dynamic values; no media query needed at page level)
- Brand name is always lowercase: **krewtree**

---

## Routing

All routes live under `/site`. The root `/` redirects via `vercel.json`.

Routes are split into two groups in `Router.tsx`:

**Auth routes** (no Navbar):
| Path | Page |
|------|------|
| `/site/login` | LoginPage |
| `/site/signup` | SignupRolePage |
| `/site/signup/worker` | WorkerSignupPage |
| `/site/signup/company` | CompanySignupPage |

**App routes** (wrapped in AppLayout with Navbar):
| Path | Page |
|------|------|
| `/site` | LandingPage |
| `/site/jobs` | JobsPage |
| `/site/jobs/:id` | JobDetailPage |
| `/site/dashboard/worker` | WorkerDashboard |
| `/site/dashboard/company` | CompanyDashboard |
| `/site/profile/:id` | WorkerProfilePage |
| `/site/post-job` | PostJobPage |
| `/site/company/:id` | CompanyProfilePage |
| `/site/saved-jobs` | SavedJobsPage |
| `/site/messages` | MessagesPage |
| `/site/referrals` | ReferralPage |

> ⚠️ **Auth guards are not yet implemented.** All routes are currently open. A `ProtectedRoute` component and `AuthContext` need to be added before launch.

---

## Component Library

Located in `src/components/`. All components are TypeScript-first, use CSS modules with `--kt-*` tokens, and support both light and dark mode.

| Component                              | Notes                                                                           |
| -------------------------------------- | ------------------------------------------------------------------------------- |
| `ErrorBoundary`                        | Class component; wraps the entire app; shows reload UI on unhandled errors      |
| `Button`                               | 7 variants: primary, secondary, accent, outline, ghost, danger, link            |
| `Badge`                                | 8 variants: default, primary, secondary, accent, success, warning, danger, info |
| `Input`                                | Sizes sm/md/lg; `error` prop; leading/trailing icons; accessible                |
| `Textarea`                             | Resize control, optional character count                                        |
| `Select`                               | Sizes sm/md/lg; error state                                                     |
| `Checkbox`                             | Indeterminate state support                                                     |
| `Radio` / `RadioGroup`                 | Group context via compound component                                            |
| `Switch`                               | Label positioning control                                                       |
| `Card`                                 | Compound: `Card`, `CardHeader`, `CardBody`, `CardFooter`                        |
| `Avatar` / `AvatarGroup`               | Sizes xs–xl; fallback initials; status dot                                      |
| `Modal`                                | Sizes sm/md/lg/xl; focus trap                                                   |
| `Tabs`                                 | Compound: `Tabs`, `TabList`, `Tab`, `TabPanel`; keyboard navigation             |
| `Alert`                                | 4 variants; dismissible                                                         |
| `Progress`                             | Determinate + indeterminate modes                                               |
| `Spinner`                              | Sizes sm/md/lg                                                                  |
| `Tooltip`                              | 4 placement options                                                             |
| `Toast` / `ToastProvider` / `useToast` | Position prop; auto-dismiss                                                     |
| `Label`                                | Accessible form label                                                           |
| `Divider`                              | Horizontal + vertical                                                           |

---

## Site-Specific Components

Located in `src/site/components/`.

| Component            | Purpose                                                                                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Logo`               | `KrewtreeLogo` — full wordmark SVG with `onDark` color switching. `KrewtreeBgMark` — large watermark for auth page backgrounds. Both use official brand SVG paths. |
| `Navbar`             | Top nav; `Log in` / `Sign up` links; persona switcher (dev-only until auth); notification bell                                                                     |
| `RegulixBadge`       | Animated Regulix Ready badge; sizes sm/md/lg; `onDark` variant                                                                                                     |
| `JobCard`            | Job listing card with company info, pay, skills chips, Regulix Ready indicator                                                                                     |
| `WorkerCard`         | Worker profile card with performance score and Regulix Ready status                                                                                                |
| `StatCard`           | Dashboard KPI tile (value + label + trend direction)                                                                                                               |
| `AnalyticsPanel`     | Bar/line chart display for company dashboard                                                                                                                       |
| `KanbanBoard`        | Applicant pipeline: Applied → Reviewed → Interview → Hired                                                                                                         |
| `QuickApplyModal`    | 1-click apply for Regulix Ready workers; full form otherwise                                                                                                       |
| `ReviewCard`         | Employer or worker review with star rating                                                                                                                         |
| `NotificationDrawer` | Slide-in notification panel with mark-all-read                                                                                                                     |

---

## Data Layer

Currently all data is mocked in `src/site/data/mock.ts` (56KB). This file exports typed arrays for all entities. It is imported directly by components during the prototype phase.

**When connecting a real backend:**

1. Create `src/site/api/` with typed fetch functions per resource
2. Replace mock imports one page at a time
3. Consider React Query or SWR for caching, loading, and error states
4. Move shared static data (industry slugs, company sizes, etc.) to `src/site/data/static.ts` so it stays available without the mock file

**Core data models:**

```typescript
Industry    { id, name, slug, icon, jobCount, color }
Company     { id, name, logo, location, industry, isVerified, description, size, website }
Job         { id, title, company, industry, type, location, payMin, payMax, payType,
              requirements, skills, isSponsored, applicantCount, status, postedAt }
Worker      { id, name, headline, avatar, location, isRegulixReady, performanceScore,
              skills, jobHistory, bio, profileCompletePct }
Application { id, jobId, workerId, status, appliedAt, events }
```

---

## Auth (Not Yet Implemented)

The auth UI is built (4 pages) but there is no real authentication logic. What needs to be added:

1. **`AuthContext`** — React context holding `user`, `isAuthenticated`, `login()`, `logout()`
2. **`ProtectedRoute`** — wrapper component that redirects unauthenticated users to `/site/login`
3. **API integration** — POST to `/auth/login`, `/auth/register`; store JWT or use session cookie
4. **Replace persona switcher** — `Navbar` currently has a dev-only `worker` / `company` toggle; this should derive from `AuthContext` after login
5. **Clear password state after submit** — already done; passwords are cleared before navigation

> ⚠️ Until auth is implemented, all dashboard routes are accessible without logging in.

---

## What's Built vs. What's Next

### ✅ Complete (prototype level)

- Design token system (light + dark)
- 21-component UI library + ErrorBoundary
- All 12 app pages + 4 auth pages (UI only)
- Full mock data layer
- ESLint + Prettier + husky + lint-staged
- Vercel deployment config

### 🔜 Next priorities

1. **Auth** — AuthContext, ProtectedRoute, real login/register API
2. **API integration** — replace mock.ts with real fetch calls
3. **Mobile layouts** — no responsive CSS exists yet
4. **Tests** — Vitest + @testing-library/react; start with auth flows and form validation
5. **SEO** — per-page `<title>` and `<meta>` tags
6. **Loading states** — skeleton components for data-fetching transitions
7. **Browse Workers page** — `/site/workers` not yet built
8. **Dark mode toggle** — tokens exist, no UI switch yet
9. **Subdomain routing** — industry-scoped subdomain logic

---

## Dev Setup

```bash
# Install dependencies
npm install

# Start dev server (localhost only)
npm run dev

# Start dev server exposed on local network (for device testing)
EXPOSE_HOST=true npm run dev

# Type check
npx tsc --noEmit

# Lint
npm run lint
npm run lint:fix

# Format
npm run format

# Production build
npm run build
npm run preview
```

Dev server runs at `http://localhost:5173`. All site routes are under `/site`.
