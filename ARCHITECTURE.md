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
- No icon library — all icons are inline React SVG components
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
│   ├── components/              Reusable UI component library (21 components + ErrorBoundary)
│   │   ├── ErrorBoundary/       Top-level crash recovery boundary
│   │   ├── Button/              7 variants
│   │   ├── Input/               With error state, leading/trailing icons
│   │   ├── ...                  (see Component Library section)
│   │   └── index.ts             Barrel export
│   └── site/                    The krewtree application
│       ├── Router.tsx           Route definitions + AppLayout wrapper
│       ├── context/
│       │   └── AuthContext.tsx  useAuth() hook — login(type), logout(), persona state
│       ├── data/mock.ts         Mock data (56KB) — replace with real API calls
│       ├── types/index.ts       Shared TypeScript interfaces
│       ├── components/          Site-specific components
│       │   ├── Logo.tsx         KrewtreeLogo + KrewtreeBgMark (official brand SVGs)
│       │   ├── Navbar/          Top nav with persona switcher + auth buttons
│       │   └── ...              (10 components total)
│       └── pages/
│           ├── auth/            Auth flow — 4 pages, full visual system, no real auth yet
│           │   ├── LoginPage.tsx
│           │   ├── SignupRolePage.tsx
│           │   ├── WorkerSignupPage.tsx
│           │   └── CompanySignupPage.tsx
│           ├── landing/
│           │   ├── sections.tsx              Landing page section components
│           │   └── RegulixBanner.module.css  Subgrid two-card layout + mobile stacking breakpoint
│           └── ...              12 app pages
├── .claude/
│   ├── PROJECT_CONTEXT.md      Full context file — read this on session start
│   └── launch.json             Claude Preview server config
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

Other values: `#103949` (light navy-teal — "For Workers" badge), `#8B9A3E` (lighter olive — account type label text on white cards).

### Token System

- All design values live in `src/styles/tokens.css` as `--kt-*` CSS custom properties
- Light mode on `:root`, dark mode on `[data-theme="dark"]`
- TypeScript equivalents in `src/tokens/colors.ts`
- Components reference tokens only — never hardcoded hex values (page-level layout is the exception)

### Design Rules

- **No gradients** — flat solid colors only
- **No Tailwind** — CSS modules + custom properties
- **No icon libraries** — inline React SVG components only
- **CSS modules** for component-level scoping
- **Inline styles** for page-level layout
- Brand name is always lowercase: **krewtree**
- WCAG AA contrast required — on olive backgrounds, use white for body text

---

## Routing

All routes live under `/site`. The root `/` redirects via `vercel.json`.

**Auth routes** (no Navbar):
| Path | Page | Notes |
|------|------|-------|
| `/site/login` | LoginPage | Defaults to worker (navy) view |
| `/site/login?type=company` | LoginPage | Opens company (olive) view directly |
| `/site/signup` | SignupRolePage | Role picker |
| `/site/signup/worker` | WorkerSignupPage | |
| `/site/signup/company` | CompanySignupPage | Sign-in link routes to `?type=company` |

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

> ⚠️ **Auth guards are not yet implemented.** All routes are currently open.

---

## Auth Pages — Visual System

The 4 auth pages share a consistent layout and are color-coded by user type.

**Color coding:**

- Worker context → `var(--kt-navy-900)` background, standard logo
- Company context → `var(--kt-olive-700)` background, logo with `accentColor="white"`

**Shared layout pattern:**

1. Full-viewport colored background
2. `KrewtreeBgMark` watermark layer
3. Top bar: logo (left) + secondary link (right)
4. Two-column: marketing content (left, sticky) + white form card (right)
5. Footer: faint copyright line

**LoginPage specifics:**

- Worker/Company toggle inside the white card
- `useSearchParams` reads `?type=company` → pre-selects company tab on load
- Background transitions smoothly between navy ↔ olive with `transition: 'background 0.25s ease'`
- Left panel copy and stat icons update based on selected tab

**White card conventions:**

- Account type label: `#8B9A3E`, 11px, 700 weight, uppercase — plain text, no background pill
- All form pages clear passwords from state before navigating away

---

## Component Library

Located in `src/components/`. All TypeScript-first, CSS modules, light + dark mode.

| Component                              | Notes                                                                                                                                   |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `ErrorBoundary`                        | Class component; wraps the entire app                                                                                                   |
| `Button`                               | 7 variants: primary, secondary, accent, outline, ghost, danger, link. `as="a"` prop renders as `<a>` (supports `href`, `target`, `rel`) |
| `Badge`                                | 8 variants: default, primary, secondary, accent, success, warning, danger, info                                                         |
| `Input`                                | Sizes sm/md/lg; error prop; leading/trailing icons                                                                                      |
| `Textarea`                             | Resize control, optional character count                                                                                                |
| `Select`                               | Sizes sm/md/lg; error state                                                                                                             |
| `Checkbox`                             | Indeterminate state support                                                                                                             |
| `Radio` / `RadioGroup`                 | Group context via compound component                                                                                                    |
| `Switch`                               | Label positioning control                                                                                                               |
| `Card`                                 | Compound: `Card`, `CardHeader`, `CardBody`, `CardFooter`                                                                                |
| `Avatar` / `AvatarGroup`               | Sizes xs–xl; fallback initials; status dot                                                                                              |
| `Modal`                                | Sizes sm/md/lg/xl; focus trap                                                                                                           |
| `Tabs`                                 | Compound: `Tabs`, `TabList`, `Tab`, `TabPanel`; keyboard navigation                                                                     |
| `Alert`                                | 4 variants; dismissible                                                                                                                 |
| `Progress`                             | Determinate + indeterminate modes                                                                                                       |
| `Spinner`                              | Sizes sm/md/lg                                                                                                                          |
| `Tooltip`                              | 4 placement options                                                                                                                     |
| `Toast` / `ToastProvider` / `useToast` | Position prop; auto-dismiss                                                                                                             |
| `Label`                                | Accessible form label                                                                                                                   |
| `Divider`                              | Horizontal + vertical                                                                                                                   |

---

## Site-Specific Components

Located in `src/site/components/`.

| Component            | Purpose                                                                                                                                                   |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Logo`               | `KrewtreeLogo` — wordmark SVG with `onDark` + `accentColor` props. `KrewtreeBgMark` — large watermark for auth pages.                                     |
| `Navbar`             | Top nav; Log in / Sign up links pushed to far right (`margin-left: auto`); persona switcher; notification bell                                            |
| `RegulixBadge`       | Animated Regulix Ready badge; sizes sm/md/lg; `onDark` variant                                                                                            |
| `JobCard`            | Job listing card with company info, pay, skills chips, Regulix Ready indicator. Sponsored banner transitions olive → teal-blue (`--kt-navy-500`) on hover |
| `WorkerCard`         | Worker profile card with performance score and Regulix Ready status                                                                                       |
| `StatCard`           | Dashboard KPI tile (value + label + trend direction)                                                                                                      |
| `AnalyticsPanel`     | Bar/line chart display for company dashboard                                                                                                              |
| `KanbanBoard`        | Applicant pipeline: Applied → Reviewed → Interview → Hired                                                                                                |
| `QuickApplyModal`    | 1-click apply for Regulix Ready workers; optional $9.99 boost add-on                                                                                      |
| `ReviewCard`         | Employer or worker review with star rating                                                                                                                |
| `NotificationDrawer` | Slide-in notification panel with mark-all-read                                                                                                            |

---

## Data Layer

Currently all data is mocked in `src/site/data/mock.ts` (56KB).

**When connecting a real backend:**

1. Create `src/site/api/` with typed fetch functions per resource
2. Replace mock imports one page at a time
3. Consider React Query or SWR for caching, loading, and error states

---

## Auth (Not Yet Implemented)

The auth UI is complete. What still needs to be built:

1. **ProtectedRoute** — redirects unauthenticated users to `/site/login`
2. **Real API** — POST `/auth/login`, `/auth/register`; store JWT or session cookie
3. **Replace persona switcher** — `Navbar` currently has a dev-only toggle; should derive from `AuthContext` after real login
4. **`AuthContext` already exists** — `useAuth()` exposes `login(type)` / `logout()`, persona state; needs real session persistence

---

## What's Built vs. What's Next

### ✅ Complete (prototype level)

- Design token system (light + dark)
- 21-component UI library + ErrorBoundary
- All 12 app pages + 4 auth pages
- AuthContext (`useAuth`) — mock login/logout
- Full mock data layer
- ESLint + Prettier + husky + lint-staged
- Vercel deployment config
- Color-coded auth system (navy=worker, olive=company) across login + signup pages
- Boost monetization UI (all mock):
  - Worker dashboard: per-application boost modal ($9.99, Apple Pay / Zelle)
  - QuickApplyModal: boost opt-in checkbox ($9.99)
  - Company dashboard: job boost modal (7/14/30-day tiers, $35/$65/$120)
  - PostJobPage: sponsored listing — $38/application, stop-mode, Urgently Hiring label

### 🔜 Next priorities

1. **Auth** — ProtectedRoute, real login/register API, session persistence
2. **API integration** — replace mock.ts with real fetch calls
3. **Mobile layouts** — no responsive CSS exists yet
4. **Tests** — Vitest + @testing-library/react
5. **SEO** — per-page `<title>` and `<meta>` tags
6. **Loading states** — skeleton components
7. **Browse Workers page** — `/site/workers` not yet built
8. **Dark mode toggle** — tokens exist, no UI switch yet
9. **Subdomain routing** — industry-scoped subdomain logic

---

## Dev Setup

```bash
npm install
npm run dev                    # localhost:5173
EXPOSE_HOST=true npm run dev   # expose on local network
npx tsc --noEmit               # type check
npm run lint / lint:fix
npm run format
npm run build && npm run preview
```
