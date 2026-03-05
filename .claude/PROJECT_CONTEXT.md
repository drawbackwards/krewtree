# krewtree — Project Context & Master Flow
> Last updated: March 2026
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
| Linting | ❌ Not yet set up |
| Deployment | Vercel (vercel.json configured) |
| Dev server | `npm run dev` → http://localhost:5173 (also on network IP for Claude Preview) |

**Key config files:**
- `vite.config.ts` — `host: true, port: 5173`, `@` alias → `./src`
- `tsconfig.json` — `strict: true`, `noUnusedLocals`, `noUnusedParameters`
- `vercel.json` — SPA rewrites + redirect `/` → `/site`
- `.claude/launch.json` — Claude Code preview server config

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

---

## 4. File Structure

```
src/
├── App.tsx                    — component library showcase/demo page
├── main.tsx                   — entry, wraps in BrowserRouter + ToastProvider
├── vite-env.d.ts              — CSS module type declarations
├── styles/
│   ├── tokens.css             — full CSS custom property token system (light + dark)
│   └── global.css             — reset + body styles
├── tokens/
│   └── colors.ts              — TS color primitives + light/dark semantic maps
├── components/                — reusable UI component library (21 components)
│   ├── index.ts               — barrel export
│   ├── Alert/                 ├── Avatar/       ├── Badge/
│   ├── Button/                ├── Card/         ├── Checkbox/
│   ├── Divider/               ├── Input/        ├── Label/
│   ├── Modal/                 ├── Progress/     ├── Radio/
│   ├── Select/                ├── Spinner/      ├── Switch/
│   ├── Tabs/                  ├── Textarea/     ├── Toast/
│   └── Tooltip/
└── site/                      — the krewtree site/app
    ├── Router.tsx             — all site routes + Navbar wrapper
    ├── data/
    │   └── mock.ts            — all mock data (1018 lines) — types + data
    ├── components/            — site-specific components
    │   ├── index.ts
    │   ├── AnalyticsPanel/    ├── JobCard/       ├── KanbanBoard/
    │   ├── Navbar/            ├── NotificationDrawer/
    │   ├── QuickApplyModal/   ├── RegulixBadge/  ├── ReviewCard/
    │   ├── StatCard/          └── WorkerCard/
    └── pages/
        ├── index.ts
        ├── LandingPage.tsx        — home / path chooser
        ├── JobsPage.tsx           — job search & filtering
        ├── JobDetailPage.tsx      — individual job view + apply
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

| Route | Component | Persona |
|-------|-----------|---------|
| `/site` | `LandingPage` | Both |
| `/site?layout=e` | `LandingPage` (E·Color hero) | Both |
| `/site/jobs` | `JobsPage` | Worker |
| `/site/jobs/:id` | `JobDetailPage` | Worker |
| `/site/dashboard/worker` | `WorkerDashboard` | Worker |
| `/site/dashboard/company` | `CompanyDashboard` | Company |
| `/site/profile/:id` | `WorkerProfilePage` | Both |
| `/site/post-job` | `PostJobPage` | Company |
| `/site/company/:id` | `CompanyProfilePage` | Both |
| `/site/saved-jobs` | `SavedJobsPage` | Worker |
| `/site/messages` | `MessagesPage` | Both |
| `/site/referrals` | `ReferralPage` | Both |

**Navbar persona switcher:** `Persona = 'worker' | 'company'` — state lives in `Router.tsx`.

---

## 6. Data Models (from mock.ts)

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

## 7. Component Library (src/components)

All 21 components share:
- TypeScript props interfaces
- CSS module styling using `--kt-*` tokens
- Accessible (aria attributes, focus-visible)
- Light/dark responsive

| Component | Key Variants/Notes |
|-----------|-------------------|
| `Button` | 7 variants: primary, secondary, accent, outline, ghost, danger, link |
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

## 8. Site-Specific Components (src/site/components)

| Component | Purpose |
|-----------|---------|
| `Navbar` | Top nav with persona switcher (worker/company), links, notification bell |
| `RegulixBadge` | Regulix partner badge with pulse animation, sizes sm/md/lg, onDark variant |
| `JobCard` | Job listing card with company, pay, skills, Regulix Ready badge |
| `WorkerCard` | Worker profile card with performance score, Regulix Ready status |
| `StatCard` | Dashboard stat tile (num + label + trend) |
| `AnalyticsPanel` | Chart/analytics display for company dashboard |
| `KanbanBoard` | Application pipeline (Applied → Reviewed → Interview → Hired) |
| `QuickApplyModal` | 1-click apply modal for workers |
| `ReviewCard` | Employer/worker review display |
| `NotificationDrawer` | Slide-in notification panel |

---

## 9. LandingPage — Current State

**File:** `src/site/pages/LandingPage.tsx`

**Active layouts (toggled via `?layout=` query param):**
- `default` — D Track + B Center merged: "What brings you to krewtree?" → two path cards (worker/company) → stats
- `e` (E·Color) — Vibrant white-BG layout with colored industry chips, offset-shadow search, colored stat tiles, marquee

**Layout switcher pill:** Fixed bottom-center, only shows Default and E·Color.

**Page section order (default):**
1. Hero (path chooser)
2. Featured Jobs
3. How krewtree Works (horizontal timeline — 01 → 02 → 03)
4. Browse by Industry
5. CTA
6. Footer

**Key design decisions logged:**
- No gradients anywhere
- Industries section placed lower (subdomain-first strategy means main site doesn't lead with industry browsing)
- Workers/Companies feature cards removed (covered by hero path cards)
- "Krewtree" → "krewtree" everywhere (lowercase brand name)

---

## 10. Master User Flow

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
    │   (search, filter    │                  │   (title, pay,       │
    │    by industry,      │                  │    requirements,     │
    │    location, pay)    │                  │    industry)         │
    └──────────┬──────────┘                  └──────────┬──────────┘
               │                                         │
    ┌──────────▼──────────┐                  ┌──────────▼──────────┐
    │   Job Detail         │                  │   Company Dashboard  │
    │   /site/jobs/:id     │                  │   /site/dashboard/   │
    │   (full listing,     │                  │   company            │
    │    requirements,     │                  │   (analytics,        │
    │    quick apply)      │                  │    kanban pipeline,  │
    └──────────┬──────────┘                  │    worker search)    │
               │                             └──────────┬──────────┘
    ┌──────────▼──────────┐                             │
    │   QuickApplyModal    │                  ┌──────────▼──────────┐
    │   (1-click if        │                  │   Browse Workers     │
    │    Regulix Ready,    │                  │   (not yet built)    │
    │    else full form)   │                  │   /site/workers      │
    └──────────┬──────────┘                  └──────────┬──────────┘
               │                                         │
    ┌──────────▼──────────┐                  ┌──────────▼──────────┐
    │   Worker Dashboard   │                  │   Messages           │
    │   /site/dashboard/   │◄────────────────►│   /site/messages     │
    │   worker             │    (both use)    │   (worker ↔ company  │
    │   (applications,     │                  │    thread view)      │
    │    saved, activity,  │                  └─────────────────────┘
    │    profile %)        │
    └──────────┬──────────┘
               │
    ┌──────────▼──────────┐
    │   Worker Profile     │
    │   /site/profile/:id  │
    │   (skills, history,  │
    │    Regulix Ready,    │
    │    perf. score,      │
    │    reviews)          │
    └──────────┬──────────┘
               │
    ┌──────────▼──────────┐
    │   Regulix Integration│
    │   (external)         │
    │   Connect account →  │
    │   verified history + │
    │   Regulix Ready badge│
    └─────────────────────┘
```

### Subdomain Strategy
```
krewtree.com/site          → main site (industry agnostic, path chooser hero)
construction.krewtree.com  → construction-specific landing, same account
trucking.krewtree.com      → trucking-specific landing
healthcare.krewtree.com    → healthcare-specific landing
... (one per industry)
```
Each subdomain shows industry-scoped jobs by default. "Browse by Industry" is intentionally moved lower on the main site since subdomains handle discovery.

---

## 11. Figma Reference

- **File key:** `AdcUtHlOEMY5qMncpShGAJ`
- **Brand slide node:** `2075:386` (slide 04 — brand colors)
- Access: Figma MCP tool with `fileKey: 'AdcUtHlOEMY5qMncpShGAJ'`

---

## 12. What's Built vs. What's Missing

### ✅ Built (UI/prototype level)
- Full design token system (light + dark)
- 21 reusable components
- Landing page (2 hero variants)
- Jobs listing page
- Job detail page
- Worker dashboard
- Worker profile page
- Company dashboard
- Company profile page
- Post job page
- Saved jobs page
- Messages page
- Referral page
- Navbar with persona switcher
- RegulixBadge, JobCard, WorkerCard, StatCard, KanbanBoard, etc.

### ❌ Not Yet Built
- Browse Workers page (`/site/workers`)
- Auth (login / signup flows)
- Real API / backend integration
- Industry subdomain routing logic
- Search/filter state management (URL-driven)
- Dark mode UI toggle (tokens exist, no toggle)
- Mobile responsive layouts
- ESLint / Prettier config
- Unit tests
- Error boundaries
- Loading / skeleton states
- SEO / per-page `<title>` and meta tags
- Analytics integration

---

## 13. Dev Commands

```bash
npm run dev        # start dev server → http://localhost:5173
npm run build      # tsc + vite build
npm run preview    # preview production build
npx tsc --noEmit   # type-check only (no output)
```

**Claude Preview:** Navigates to `http://192.168.0.4:5173/site` (network IP, not localhost).
Dev server must have `host: true` in vite.config.ts (already set).
