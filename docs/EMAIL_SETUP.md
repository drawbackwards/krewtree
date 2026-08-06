# Email Setup (Resend) — Beta Readiness Phase 2

Status: **account live + send pipeline verified (2026-08-06); real-recipient
delivery blocked on DNS (domain verification).**

This is the working checklist to stand up transactional + auth email for
krewtree via [Resend](https://resend.com). Nothing here is wired into app code
yet (that's the follow-up session) — this doc gets the account, domain, DNS,
keys, and dashboard settings ready so the code work is a fast flip.

---

## The two email paths

krewtree sends email two different ways. Both go through Resend, both need the
verified domain, but they're configured in different places.

| Path                   | Used for                                        | Configured in                                 | Code needed?                           |
| ---------------------- | ----------------------------------------------- | --------------------------------------------- | -------------------------------------- |
| **Supabase Auth SMTP** | Password reset, email confirmation, magic links | Supabase Dashboard → Auth → SMTP settings     | No — Supabase sends these itself       |
| **App transactional**  | Team invites, notification emails               | Vercel serverless function + `RESEND_API_KEY` | Yes — a `/api` function (next session) |

Both are blocked on the same prerequisite: **a verified sending domain**, which
needs DNS access.

---

## Account model (decided: a standalone free krewtree account)

Resend has **no "projects."** The in-account isolation unit is a **Team** — but
in the existing business account, creating an additional team is a **paid
feature** (each team bills separately and new-team creation is gated behind the
account's plan). So krewtree gets its **own standalone Resend account** on the
free tier — fully isolated, $0.

- Resend allows **one account per email address**, so the krewtree account must
  sign up with a _different_ email than the business account. Use a plus-alias:
  **`admin+krewtree@drawbackwards.com`** (still lands in your inbox, and it's the
  address Resend delivers test sends to before the domain is verified).
- Free tier: 100 emails/day, 3,000/month, **1 verified domain** — plenty for the
  beta. Higher volume / more domains later → Pro (~$20/mo) on this account only.
- In the krewtree account, add **one domain** (`mail.krewtree.com`) and create
  **one API key per environment**, each scoped to _Sending access_ only:
  - `krewtree-dev` → used locally + Vercel Preview
  - `krewtree-prod` → used in Vercel Production

---

## Step 1 — Create the standalone krewtree account + get keys `(you)`

- [x] Sign up at https://resend.com with **`admin+krewtree@drawbackwards.com`**
      (NOT the business-account email — one account per email). Free tier. (done)
- [x] API Keys → create `krewtree-dev`, permission **Sending access**. Copy it
      (`re_...`) — shown once. (done; stored in `.env.local`)
- [ ] Create `krewtree-prod` the same way — do this when wiring the Vercel
      Production env var.
- [x] Paste the dev key for local testing → in `.env.local` (git-ignored).

---

## Step 2 — Add + verify the sending domain `(you, needs DNS)`

Use a **subdomain**, not the root domain. Sending from a subdomain keeps the
root domain's reputation isolated and is the standard practice.

- [ ] Recommended sending domain: **`mail.krewtree.com`**
- [ ] Resend Dashboard → Domains → Add Domain → enter `mail.krewtree.com`,
      pick the region closest to Vercel (**US East** is the default).
- [ ] Resend will show a set of DNS records to add. They look like this (the
      **DKIM public key and exact hostnames are generated per-domain — copy the
      real values from the Resend dashboard**, don't use these literally):

  | Type | Host / Name                           | Value                                             | Notes           |
  | ---- | ------------------------------------- | ------------------------------------------------- | --------------- |
  | MX   | `send.mail.krewtree.com`              | `feedback-smtp.us-east-1.amazonses.com` (prio 10) | bounce feedback |
  | TXT  | `send.mail.krewtree.com`              | `v=spf1 include:amazonses.com ~all`               | **SPF**         |
  | TXT  | `resend._domainkey.mail.krewtree.com` | `p=MIGfMA0GCSq...` (long key from dashboard)      | **DKIM**        |

- [ ] Add a **DMARC** record too (Resend may not auto-list it; add it manually).
      Start in monitor-only mode so nothing gets rejected while we learn:

  | Type | Host / Name                | Value                                             |
  | ---- | -------------------------- | ------------------------------------------------- |
  | TXT  | `_dmarc.mail.krewtree.com` | `v=DMARC1; p=none; rua=mailto:dmarc@krewtree.com` |

  Tighten to `p=quarantine` then `p=reject` later, once reports look clean.

- [ ] Back in Resend → click **Verify**. Propagation can take minutes to a few
      hours. Domain must read **Verified** before anything sends to real inboxes.

> **DNS access is the blocker.** Until these records exist and verify, Resend
> only delivers to your _own_ account email (see Testing). That's enough to test
> our integration, not enough for real users.

---

## Step 3 — Env vars `(me, once you paste the dev key)`

Already scaffolded in `.env.example`. Values:

| Var              | Local (`.env.local`) | Vercel Preview/Dev | Vercel Production           |
| ---------------- | -------------------- | ------------------ | --------------------------- |
| `RESEND_API_KEY` | dev key (`re_...`)   | dev key            | prod key                    |
| `EMAIL_FROM`     | see below            | see below          | `noreply@mail.krewtree.com` |

- **Before the domain verifies**, `EMAIL_FROM` must be Resend's shared sender
  `onboarding@resend.dev` (the only thing allowed to send while unverified).
- **After verification**, flip every lane to `noreply@mail.krewtree.com`.
- Neither var is `VITE_`-prefixed → they stay server-side, never in the browser
  bundle.

- [ ] `(you)` Add both vars to Vercel → Settings → Environment Variables, scoped
      per environment (dev key to Preview+Development, prod key to Production).

---

## Step 4 — Supabase Custom SMTP (auth emails) `(you, needs verified domain)`

This routes Supabase's own auth emails (password reset, email confirmation)
through Resend. Do this **per project** (dev + prod) in the Supabase dashboard —
it is not in code.

Supabase Dashboard → Project → Authentication → Emails → SMTP Settings → Enable
Custom SMTP:

| Field        | Value                             |
| ------------ | --------------------------------- |
| Host         | `smtp.resend.com`                 |
| Port         | `465` (SSL) — or `587` (STARTTLS) |
| Username     | `resend`                          |
| Password     | your Resend API key (`re_...`)    |
| Sender email | `noreply@mail.krewtree.com`       |
| Sender name  | `krewtree`                        |

- [ ] Configure on **prod** project (`ivbmjtngsasrlblzhfxj`) — required for beta.
- [ ] Configure on **dev** project (`ryigaxihlfqdwgjbgmcg`) — optional; lets us
      test reset/confirm flows against dev.
- [ ] While at it, confirm Auth → "Confirm email" is ON for prod and the site
      URL / redirect allowlist point at the prod domain (see `ENVIRONMENTS.md`).

Pre-DNS note: you can enable Custom SMTP now with `EMAIL_FROM`/sender set to
`onboarding@resend.dev`, but Supabase auth emails go to real signup addresses,
which Resend rejects until the domain verifies. So real auth-email testing waits
on DNS; the branded sender + template paste can be staged now.

## Step 4b — Paste the branded auth email templates `(you)`

Supabase sends its auth emails itself, using the HTML in its template editor and
substituting its own `{{ .ConfirmationURL }}` / `{{ .Email }}` variables. Our
branded versions are generated from the react-email components to static HTML:

- Source components: `api/_email/templates/VerifyEmail.tsx`,
  `ResetPasswordEmail.tsx`.
- Generated files (the paste source): `supabase/templates/confirm-signup.html`,
  `supabase/templates/reset-password.html`.
- Regenerate after editing a template: `npm run build:auth-emails`.

Per project (prod, then dev), Supabase Dashboard → Authentication → Emails →
**Templates**:

- [ ] Select **Confirm signup** → switch the editor to HTML/source mode → replace
      the contents with `supabase/templates/confirm-signup.html` → Save.
- [ ] Select **Reset Password** → same, paste `supabase/templates/reset-password.html`
      → Save.
- [ ] Leave the **Subject** fields as you want them (e.g. "Verify your email to
      finish setting up krewtree" / "Reset your krewtree password"). The subject
      is set in Supabase, not in the pasted HTML.
- [ ] The templates already include Supabase's `{{ .ConfirmationURL }}` on the
      button and link, so no further variable wiring is needed. (Magic link and
      Change-email templates can reuse the same pattern later.)

---

## Step 5 — Testing (works even before DNS)

Resend delivers to the krewtree **account's own signup email** while the domain
is unverified, so we can prove the plumbing end-to-end now:

- [x] Send a test to `admin+krewtree@drawbackwards.com` (the account's signup
      address) from `onboarding@resend.dev`. **Done 2026-08-06 — HTTP 200,
      id `a966f548-4530-4e1c-b60f-13ec7019fddf`.** (Sending to any other address
      correctly 403s until the domain verifies.)
- [ ] Confirm it lands in the inbox (not spam) and the link resolves.
- Sending to any _other_ address returns a 403 from Resend until the domain
  verifies — that's expected, not a bug.

After the domain is verified:

- [ ] Re-send a test from `noreply@mail.krewtree.com` to an external address.
- [ ] Check the message in a tool like https://www.mail-tester.com to confirm
      SPF + DKIM + DMARC all pass.

---

## Shared email template system — `api/_email/` (added 2026-08-06)

The production email system (built in a separate session, based on **react-email**)
lives in `api/_email/`. The `_` prefix means Vercel does NOT treat these as
routes — they're shared modules imported by the `/api` functions.

- `emailConstants.ts` — brand `COLORS`, `FONTS`, `SENDER`, `LEGAL`, `URLS`,
  `NotificationCategory` + labels, `preferencesUrl()`, `unsubscribeUrl()`.
  ⚠️ Contains TODO placeholders (legal entity name + physical postal address for
  CAN-SPAM, privacy/terms URLs) that must be filled before a real public send.
- `EmailLayout.tsx` — shared shell (navy header + logo, white body, sandy
  CAN-SPAM footer) + `EmailButton` / `EmailHeading` / `EmailText` /
  `EmailSecondaryCard`.
- `TransactionalEmail.tsx` — single-event template (new applicant, message,
  hired, security events…).
- `DigestEmail.tsx` — daily/weekly digest (category → subgroups → items).
- `InviteEmail.tsx` — team-invite template (added here; wasn't in the library).
- `sendEmail.ts` — `sendKrewtreeEmail({to, subject, react, …})` wraps the Resend
  SDK with List-Unsubscribe / idempotency headers. **`from` reads `EMAIL_FROM`**
  (pre-DNS `onboarding@resend.dev`, flips to the branded address post-DNS).

Deps added: `resend`, `@react-email/components`, `@react-email/render`.
ESLint has an `api/**` override (inline hex is required in email; digest rows use
array-index keys). `npm run typecheck:api` covers this dir (TSX/JSX enabled).

The remaining ~36 designed templates (see `public/email-templates.html`) are
built by composing `TransactionalEmail` / `DigestEmail` — the foundation is done.

## Invite email — code (built 2026-08-06)

- [x] First Vercel serverless function: `api/send-invite.ts` — authenticated
      (requires a valid Supabase session JWT, so it's not an open relay). Renders
      `InviteEmail` and sends via `sendKrewtreeEmail`. Builds the join link itself
      from a trusted origin + the token, so a caller can't inject a phishing URL.
- [x] Wired `sendInviteEmail()` in `src/site/services/teamService.ts` — now a
      best-effort POST to `/api/send-invite` (was a no-op). `createInvite()`
      returns `emailed`, and the Team UI copy flips to "Invite sent by email…"
      when true. Never throws — the copyable link is the fallback.
- [x] Verified: app + api typecheck clean, lint clean, 24/24 unit tests; invite
      flow degrades gracefully under local `vite dev` (no `/api` route → fallback
      link, no console errors). The react-email `render → Resend SDK` path was
      exercised end-to-end (real branded invite delivered to the account address,
      HTTP 200).

**Known limits until DNS:**

- Real delivery still only reaches the Resend account's own address; every other
  recipient 403s until `mail.krewtree.com` verifies. So the function runs on
  Vercel but only _delivers_ to `admin+krewtree@drawbackwards.com` for now.
- The function couldn't be run locally (no Vercel CLI; `vite dev` doesn't serve
  `/api`). It exercises on the next Vercel deploy.

**Deferred hardening (post-DNS):** move invite _creation_ into the function too,
so the token never round-trips the browser at all, and drop the manual-link
fallback once delivery is reliable. Same function pattern will serve the
notification email toggles (stored, not yet delivered).

---

## Related

- `.env.example` — variable list + lane mapping
- `ENVIRONMENTS.md` — dev/prod lanes, Vercel env scoping
- `BETA_READINESS.md` — Phase 2 is this work
