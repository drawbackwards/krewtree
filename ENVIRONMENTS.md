# Environments

krewtree runs two Supabase lanes. This doc is the source of truth for which is
which, how migrations flow, and the rules that keep prod safe.

## The two lanes

| Lane     | Supabase project ref   | Purpose                     | Notes                                                        |
| -------- | ---------------------- | --------------------------- | ------------------------------------------------------------ |
| **dev**  | `ryigaxihlfqdwgjbgmcg` | Local + preview development | Has seeded test data. Safe to reset.                         |
| **prod** | `ivbmjtngsasrlblzhfxj` | Real beta users             | Clean. Pro tier (backups). "Confirm email" ON. Never seeded. |

## Where env vars live

- **Local (`.env.local`)** → always the **dev** project. Never put prod
  credentials in a local file.
- **Vercel**
  - Production environment → **prod** project URL + anon key
  - Preview / Development environments → **dev** project URL + anon key

Server-only secrets (e.g. `RESEND_API_KEY`) are set per-environment in Vercel
and are **not** `VITE_`-prefixed, so they never enter the browser bundle. Use a
separate Resend key per lane (dev key → Preview/Development, prod key →
Production). Full email setup lives in `docs/EMAIL_SETUP.md`.

## Migration workflow

Schema lives in `supabase/migrations/` (CLI-managed). To apply migrations:

```bash
# Push pending migrations — name the target explicitly:
npm run db:push:dev      # dev
npm run db:push:prod     # prod
```

`db:push:dev` / `db:push:prod` run the guarded wrapper `scripts/db-push.mjs`,
which makes the target **explicit and atomic** — you never rely on the current
link state:

1. it prints the lane (green **DEV** / red **PROD**) and won't continue until
   you type the confirmation — `dev` for dev, the **full prod ref** for prod;
2. it links that env and **re-reads the link to prove the switch took** — if the
   link didn't change (e.g. interrupted at its password prompt) it aborts rather
   than falling through to the previously-linked remote;
3. it pushes (the Supabase CLI then shows its own DB-password + `[y/N]` migration
   list — you must answer **y** for anything to apply);
4. after a **prod** push it links back to **dev** automatically, so you never
   linger on prod.

Bare `npm run db:push` refuses and points you at the two explicit commands.
`db:link:dev` / `db:link:prod` still exist for non-push tasks (`db:diff`, etc.).

Standard flow for a schema change: write the migration, test it locally
(`npm run db:reset:local`), `db:push:dev`, verify, then `db:push:prod`.

## Rules that keep prod safe

1. **Never reset prod.** `supabase db reset` drops the database and re-runs
   migrations + seed. There is intentionally no prod-reset npm script, and
   `db:reset:local` only ever targets the local database. Do not add `--linked`
   to it against prod.
2. **Prod never runs `seed.sql`.** That file is local-only test data
   (Jesse Calloway, the test accounts, etc.). Prod gets schema (migrations)
   only — no seed.
3. **Check your link before every push.** Run `npm run db:status` and confirm
   the target. A `db:push` while accidentally linked to prod applies to prod.
4. **Prod-only settings** (set in the Supabase dashboard, not in code):
   - Pro tier enabled → automated backups on
   - Auth → "Confirm email" **ON** (dev leaves it off for convenience)
   - Auth → site URL + redirect URLs point at the prod domain

## Related

- `.env.example` — the variable list and lane mapping
- `BETA_READINESS.md` — where this env split sits in the launch plan
