#!/usr/bin/env node
// ============================================================
// RLS convention guard
//
// Enforces the rule from CLAUDE.md / the 2026-06-12 perf overhaul: RLS policy
// expressions must wrap auth calls as `(select auth.uid())`, never a bare
// `auth.uid()`. Wrapped, Postgres evaluates the call once per query; bare, it
// re-runs per row. A one-time DO-block (20260612000002_perf_indexes_and_rls)
// wrapped every policy that existed then, but nothing stops a NEW migration
// from reintroducing a bare call — this guard does.
//
// Bare `auth.*()` INSIDE a function body (SECURITY DEFINER/INVOKER) is correct
// and exempt, so dollar-quoted blocks are blanked before scanning.
//
// Usage:
//   node scripts/check-rls-policies.mjs                  # scan post-rewrite migrations
//   node scripts/check-rls-policies.mjs <file.sql> ...   # scan specific files (lint-staged)
// Exits 1 if any bare auth call is found.
// ============================================================

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const MIGRATIONS_DIR = 'supabase/migrations'

// Migrations with a timestamp <= this predate the one-time policy rewrite, so
// their SOURCE still reads bare even though the live policies are wrapped.
// Don't re-flag history; only guard migrations authored after the rewrite.
const REWRITE_CUTOFF = 20260612000002

const AUTH_CALL = /auth\.(uid|role|jwt|email)\s*\(\s*\)/g
// True when the text immediately before a match is an opening `(select `.
const WRAPPED_BEFORE = /\(\s*select\s+$/i

function filesToScan() {
  const args = process.argv.slice(2).filter((a) => a.endsWith('.sql'))
  if (args.length) return args
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .filter((f) => {
      const ts = Number(f.split('_')[0])
      return Number.isFinite(ts) && ts > REWRITE_CUTOFF
    })
    .map((f) => join(MIGRATIONS_DIR, f))
}

// Blank everything that isn't policy code — function bodies (bare auth.*()
// there is correct), block comments, and line comments (which often mention
// `auth.uid()` in prose) — while preserving newlines so line numbers hold.
function blankNonCode(sql) {
  const blank = (m) => m.replace(/[^\n]/g, ' ')
  return sql
    .replace(/\$([a-zA-Z0-9_]*)\$[\s\S]*?\$\1\$/g, blank) // dollar-quoted function bodies
    .replace(/\/\*[\s\S]*?\*\//g, blank) // /* block comments */
    .replace(/--[^\n]*/g, blank) // -- line comments
}

const violations = []
for (const file of filesToScan()) {
  let sql
  try {
    sql = readFileSync(file, 'utf8')
  } catch {
    continue
  }
  const scanned = blankNonCode(sql)
  const lines = sql.split('\n')
  let match
  AUTH_CALL.lastIndex = 0
  while ((match = AUTH_CALL.exec(scanned)) !== null) {
    if (WRAPPED_BEFORE.test(scanned.slice(0, match.index))) continue
    const lineNo = scanned.slice(0, match.index).split('\n').length
    violations.push({ file, lineNo, snippet: (lines[lineNo - 1] ?? match[0]).trim() })
  }
}

if (violations.length) {
  console.error('\n✖ RLS convention check failed — wrap auth calls as `(select auth.uid())`:\n')
  for (const v of violations) {
    console.error(`  ${v.file}:${v.lineNo}`)
    console.error(`    ${v.snippet}`)
  }
  console.error(
    '\nA bare `auth.uid()` in a policy re-evaluates once per row; `(select auth.uid())`' +
      '\nevaluates once per query. Bare calls inside function bodies are exempt.\n'
  )
  process.exit(1)
}

console.log('✓ RLS convention check passed — no bare auth.*() in policy expressions.')
