#!/usr/bin/env node
// ============================================================
// Environment-targeted, guarded `supabase db push`.
//
//   node scripts/db-push.mjs dev     (npm run db:push:dev)
//   node scripts/db-push.mjs prod    (npm run db:push:prod)
//
// Why this exists: `supabase link` + `supabase db push` are two steps, and the
// link can silently fail to switch (e.g. interrupted at its password prompt),
// leaving you pushing the wrong remote. This command makes the target EXPLICIT
// and atomic:
//   1. you name the environment as an argument (no reliance on current link),
//   2. it confirms the target (type "dev", or the full prod ref for prod),
//   3. it links that environment and RE-READS the link to prove it switched —
//      aborting if it did not, so a failed link can never fall through to a
//      push against the previously-linked remote,
//   4. it pushes,
//   5. for prod it links back to dev afterward, so you never linger on prod.
//
// Extra args after the env are passed through to `db push` (e.g. `-- --dry-run`).
// ============================================================
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'

const REF = {
  dev: 'ryigaxihlfqdwgjbgmcg',
  prod: 'ivbmjtngsasrlblzhfxj',
}

const C = {
  red: '\x1b[31m',
  grn: '\x1b[32m',
  yel: '\x1b[33m',
  bold: '\x1b[1m',
  rst: '\x1b[0m',
}

function fail(msg) {
  console.error(`${C.red}${C.bold}${msg}${C.rst}`)
  process.exit(1)
}

function linkedRef() {
  try {
    return readFileSync('supabase/.temp/project-ref', 'utf8').trim()
  } catch {
    return ''
  }
}

function link(env) {
  const res = spawnSync('supabase', ['link', '--project-ref', REF[env]], { stdio: 'inherit' })
  if (res.status !== 0) fail(`\n'supabase link' to ${env} failed — nothing pushed.`)
  const now = linkedRef()
  if (now !== REF[env]) {
    fail(`\nLink did not switch to ${env} (still ${now || 'unlinked'}) — aborting, nothing pushed.`)
  }
}

const env = process.argv[2]
const passthrough = process.argv.slice(3)

if (env !== 'dev' && env !== 'prod') {
  fail('Specify the target explicitly:  npm run db:push:dev   or   npm run db:push:prod')
}

const color = env === 'prod' ? C.red : C.grn
console.log('')
console.log(`${color}${C.bold}  supabase db push  →  ${env.toUpperCase()}  (${REF[env]})${C.rst}`)
if (env === 'prod') console.log(`${C.red}${C.bold}  ⚠  PRODUCTION — real user data.${C.rst}`)
console.log('')

// 1. Confirm the intended target up front (before touching the link).
const expected = env === 'prod' ? REF.prod : 'dev'
const rl = createInterface({ input, output })
const answer = (await rl.question(`  Type "${expected}" to proceed: `)).trim()
rl.close()
if (answer !== expected) fail('  Aborted — confirmation did not match. Nothing pushed.')

// 2. Link the named env and PROVE the switch took.
console.log(`\n  Linking ${env}…`)
link(env)

// 3. Push (Supabase shows its own password + [y/N] migration list).
const res = spawnSync('supabase', ['db', 'push', ...passthrough], { stdio: 'inherit' })

// 4. Always return to dev after a prod push, so nothing later hits prod.
if (env === 'prod') {
  console.log(`\n${C.yel}  Returning link to dev…${C.rst}`)
  const back = spawnSync('supabase', ['link', '--project-ref', REF.dev], { stdio: 'inherit' })
  if (back.status !== 0 || linkedRef() !== REF.dev) {
    console.error(
      `${C.red}${C.bold}  WARNING: could not confirm re-link to dev — you may still be linked to PROD.` +
        `\n  Run 'npm run db:link:dev' before any further push.${C.rst}`
    )
  } else {
    console.log(`${C.grn}  Linked back to dev.${C.rst}`)
  }
}

process.exit(res.status ?? 1)
