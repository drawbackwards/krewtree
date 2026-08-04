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
and are **not** `VITE_`-prefixed, so they never enter the browser bundle.

## Migration workflow

Schema lives in `supabase/migrations/` (CLI-managed). To apply migrations:

```bash
# 1. Confirm which project you're linked to BEFORE any push
npm run db:status

# 2. Link the lane you intend to target
npm run db:link:dev     # or: npm run db:link:prod

# 3. Push pending migrations to the linked remote
npm run db:push
```

Standard flow for a schema change: write the migration, test it locally
(`npm run db:reset:local`), push to **dev**, verify, then link **prod** and push.

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
