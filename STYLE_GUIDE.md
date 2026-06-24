# krewtree — Type & Style Guide

Status: **proposed** (2026-06-23). Written from a full audit of every CSS module
and inline style in `src/`. Review the recommended scale below before we migrate.

---

## 1. The problem we found

The token foundation is strong: **font-weights are 100% tokenized** (358 token
uses, 0 hardcoded), colors run through `--kt-*`, and most inline styles already
use `var(--kt-text-*)`. The inconsistency is in **one dimension only — font-size
in CSS modules.**

There are **298 hardcoded px font-sizes** in CSS. Their distribution:

| Hardcoded value                   | Count | In the current scale?                |
| --------------------------------- | ----- | ------------------------------------ |
| **12px**                          | 103   | ❌ gap between `xs`(11) and `sm`(13) |
| 11px                              | 83    | ✅ `xs`                              |
| 13px                              | 50    | ✅ `sm`                              |
| 10px                              | 20    | ❌ below the scale                   |
| **16px**                          | 19    | ❌ gap between `md`(15) and `lg`(17) |
| **14px**                          | 11    | ❌ gap between `sm`(13) and `md`(15) |
| 24 / 22 / 20 / 19 / 15 / 9 / 8 px | ~11   | mostly ❌                            |

**Root cause:** the current scale (`11 / 13 / 15 / 17 / 21 / 27 / 36 / 48`) is not a
recognized web type scale — it mirrors Apple's iOS HIG sizes, which are tuned for
native mobile, not a dense web dashboard. It has no steps at 12, 14, or 16, so
developers hardcode those. **The single most-used font size in the app — 12px,
103 times — isn't a token at all.** The three most-hardcoded values (12 / 14 / 16,
together 133 of 298 uses) are exactly Tailwind's `xs / sm / base`. The team has
been rebuilding the industry-standard scale by hand.

Secondary issues:

- **Line-height:** 79 hardcoded vs only 29 using `--kt-leading-*`.
- **No canonical heading sizes.** `h1/h2/h3` in `global.css` set weight and
  letter-spacing but not `font-size`, so every heading is sized ad hoc.

---

## 2. Recommended type scale (Tailwind-aligned, 16px base)

The web accessibility baseline for body text is **16px** (`html` is already
`16px` in `global.css`, but `body` is `--kt-text-md` = 15px). We adopt the
Tailwind scale, which is the de-facto product-UI standard and already matches how
the app is built. **We keep the existing token names and only change their
values** — this auto-migrates all ~755 existing token consumers with negligible
drift, leaving only the 298 hardcoded px to convert.

| Token           | Current | **Proposed**   | Role                                               |
| --------------- | ------- | -------------- | -------------------------------------------------- |
| `--kt-text-2xs` | —       | **10px** (NEW) | micro: dense timestamps, table meta, count chips   |
| `--kt-text-xs`  | 11px    | **12px**       | secondary labels, badges, captions — the workhorse |
| `--kt-text-sm`  | 13px    | **14px**       | supporting text, table cells, form helper text     |
| `--kt-text-md`  | 15px    | **16px**       | **body default**                                   |
| `--kt-text-lg`  | 17px    | **18px**       | lead paragraph, card titles                        |
| `--kt-text-xl`  | 21px    | **20px**       | section headings (h3)                              |
| `--kt-text-2xl` | 27px    | **24px**       | page sub-headings (h2)                             |
| `--kt-text-3xl` | 36px    | **30px**       | page titles (h1)                                   |
| `--kt-text-4xl` | 48px    | **36px**       | large page titles                                  |
| `--kt-text-5xl` | —       | **48px** (NEW) | hero / marketing display                           |

Net effect: the heavily-used small end (`xs/sm/md`) each grows 1px and gains the
missing steps; the rarely-used large end shifts a few px. Adding `2xs` (10px) and
`5xl` (48px) preserves the existing extremes so nothing clips.

> **Decided 2026-06-23:** body baseline moves to **16px** (`md`=16). This is the
> accessibility-correct, Tailwind-standard value and enlarges body text app-wide,
> so the migration must include a visual QA pass on dense screens (dashboards,
> pipeline, tables).

---

## 3. Migration mapping (hardcoded px → token)

| You see                        | Replace with                          |
| ------------------------------ | ------------------------------------- |
| `8px`, `9px`, `10px`           | `var(--kt-text-2xs)` (10px)           |
| `11px`, `12px`                 | `var(--kt-text-xs)` (12px)            |
| `13px`, `14px`                 | `var(--kt-text-sm)` (14px)            |
| `15px`, `16px`                 | `var(--kt-text-md)` (16px)            |
| `17px`, `18px`                 | `var(--kt-text-lg)` (18px)            |
| `19px`, `20px`, `21px`, `22px` | `var(--kt-text-xl)` (20px)            |
| `24px`, `27px`                 | `var(--kt-text-2xl)` (24px)           |
| `30px`, `36px` (page titles)   | `var(--kt-text-3xl)` / `4xl` per role |
| `48px` (hero)                  | `var(--kt-text-5xl)`                  |

Inline numeric `fontSize` in TSX (e.g. `fontSize: 22`, `fontSize: 14`) — there are
~48 of these — convert to the matching token string, e.g. `fontSize: 'var(--kt-text-xl)'`.

---

## 4. Line-height

Use the three existing tokens; stop hardcoding ratios.

| Token                 | Value | Use for                         |
| --------------------- | ----- | ------------------------------- |
| `--kt-leading-tight`  | 1.15  | headings, single-line UI labels |
| `--kt-leading-normal` | 1.55  | body and multi-line paragraphs  |
| `--kt-leading-loose`  | 1.8   | rare — spacious marketing copy  |

---

## 5. Font weight (already healthy — keep doing this)

Always use `--kt-weight-*`; never a bare number. Current usage is already 100%
tokenized.

| Token                  | Value | Use                                                   |
| ---------------------- | ----- | ----------------------------------------------------- |
| `--kt-weight-light`    | 300   | —                                                     |
| `--kt-weight-normal`   | 400   | body                                                  |
| `--kt-weight-medium`   | 500   | h3, emphasis, labels                                  |
| `--kt-weight-semibold` | 600   | h2, card titles                                       |
| `--kt-weight-bold`     | 700   | h1, **dashboard links** (see CLAUDE.md link standard) |
| `--kt-weight-display`  | 300   | h1 display headlines                                  |

---

## 6. Canonical heading sizes (NEW — set these in `global.css`)

Headings currently have no size. Adopt these defaults so headings are consistent
without per-component overrides:

| Element | Size token                                | Weight                 |
| ------- | ----------------------------------------- | ---------------------- |
| `h1`    | `--kt-text-3xl` (30) — `4xl` on marketing | `--kt-weight-display`  |
| `h2`    | `--kt-text-2xl` (24)                      | `--kt-weight-semibold` |
| `h3`    | `--kt-text-xl` (20)                       | `--kt-weight-medium`   |
| `h4`    | `--kt-text-lg` (18)                       | `--kt-weight-semibold` |

---

## 6a. Page title tiers (canonical — audited 2026-06-23)

Top-of-screen titles were inconsistent (the same role rendered 3xl-bold on one
page and 3xl-light on its sibling, plus several used a non-existent
`--kt-font-size-*` token that silently fell back). Use these three tiers:

| Tier                   | Style                                               | Use for                                                                                                                                                                                                |
| ---------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Screen title**       | `--kt-text-2xl` + `--kt-weight-semibold` (24 / 600) | collection/list/form/settings page titles — "Discover workers", "Browse Jobs", "My Krew", "Post a Job", "Messages", "Settings", "Referral Program", "Edit your profile", etc. **This is the default.** |
| **Entity hero**        | `--kt-text-2xl` + `--kt-weight-bold` (24 / 700)     | a page whose subject IS a named thing — a worker's name, a job title, a company name (profile/detail pages). Heavier on purpose.                                                                       |
| **Dashboard greeting** | `--kt-text-xl` + `--kt-weight-bold` (20 / 700)      | the personalized greeting header ("Welcome back, Jordan").                                                                                                                                             |

No display-weight (300) on in-app screen titles — display/light is reserved for
auth and landing hero headlines. The stale `--kt-font-size-*` token namespace is
dead; only `--kt-text-*` exists.

---

## 7. Rules going forward

1. **Never hardcode `font-size` in px.** Always `var(--kt-text-*)`.
2. **Never hardcode `line-height` or `font-weight`.** Always a token.
3. Inline `fontSize` must use the token string, not a number.
4. If a design genuinely needs a size not on the scale, that's a signal to
   discuss the scale — don't one-off it.

---

## 8. Worst-offending files (migration priority)

Ordered by hardcoded px font-size count:

| File                                                                       | Count |
| -------------------------------------------------------------------------- | ----- |
| `src/site/components/ApplicantSlideover/PipelineTab.module.css`            | 35    |
| `src/site/pages/KrewPage.module.css`                                       | 28    |
| `src/site/pages/AllApplicantsPage.module.css`                              | 28    |
| `src/site/pages/JobPostsPage.module.css`                                   | 20    |
| `src/site/pages/WorkerDashboard.module.css`                                | 17    |
| `src/site/components/ApplicantPreviewBody/ApplicantPreviewBody.module.css` | 12    |
| `src/site/components/WorkerDrawer/WorkerHistoryTab.module.css`             | 11    |
| `src/site/components/ApplicantsWidget/WidgetKanbanView.module.css`         | 11    |
| `src/site/components/ApplicantSlideover/LogTab.module.css`                 | 11    |
| `src/site/pages/SavedJobsPage.module.css`                                  | 10    |
| `src/site/pages/ApplicationsPage.module.css`                               | 10    |
| `src/site/components/WorkerActivityLog/WorkerActivityLog.module.css`       | 10    |

The top 5 files account for 128 of the 298 hardcoded font-sizes.
