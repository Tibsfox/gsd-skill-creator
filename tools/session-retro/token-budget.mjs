#!/usr/bin/env node
// Per-session token budget tracker.
//
// Records user-reported or estimated token consumption for a session.
// Since we don't have direct API-level telemetry from inside Claude Code,
// this is a reported/estimated channel — the user or the assistant enters
// counts and the tool tracks them against a budget.
//
// Usage:
//   node tools/session-retro/token-budget.mjs set-budget 200000
//   node tools/session-retro/token-budget.mjs record <in_tokens> <out_tokens> [label]
//   node tools/session-retro/token-budget.mjs status
//   node tools/session-retro/token-budget.mjs summary
//
// Data lives at .planning/sessions/current.tokens.jsonl (append-only).

import { readFileSync, writeFileSync, appendFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..');
const SESSIONS_DIR = join(REPO_ROOT, '.planning', 'sessions');
const TOKENS_FILE = join(SESSIONS_DIR, 'current.tokens.jsonl');
const BUDGET_FILE = join(SESSIONS_DIR, 'current.budget.json');

function ensureDir() { mkdirSync(SESSIONS_DIR, { recursive: true }); }

function cmdSetBudget(n) {
  ensureDir();
  const budget = parseInt(n, 10);
  if (!budget || budget < 1000) {
    console.error('[token-budget] budget must be a positive integer ≥ 1000');
    process.exit(1);
  }
  writeFileSync(BUDGET_FILE, JSON.stringify({ budget, set_at: new Date().toISOString() }, null, 2));
  console.log(JSON.stringify({ action: 'set-budget', budget }));
}

function cmdRecord(inTok, outTok, label) {
  ensureDir();
  const entry = {
    t: new Date().toISOString(),
    in_tokens: parseInt(inTok, 10) || 0,
    out_tokens: parseInt(outTok, 10) || 0,
    label: label || '',
  };
  entry.total = entry.in_tokens + entry.out_tokens;
  appendFileSync(TOKENS_FILE, JSON.stringify(entry) + '\n');
  console.log(JSON.stringify({ action: 'record', ...entry }));
}

function loadEntries() {
  if (!existsSync(TOKENS_FILE)) return [];
  return readFileSync(TOKENS_FILE, 'utf8')
    .split('\n').filter(Boolean)
    .map(l => { try { return JSON.parse(l); } catch { return null; } })
    .filter(Boolean);
}

function loadBudget() {
  if (!existsSync(BUDGET_FILE)) return null;
  try { return JSON.parse(readFileSync(BUDGET_FILE, 'utf8')); } catch { return null; }
}

function cmdStatus() {
  const entries = loadEntries();
  const budget = loadBudget();
  const total = entries.reduce((s, e) => s + e.total, 0);
  const totalIn = entries.reduce((s, e) => s + e.in_tokens, 0);
  const totalOut = entries.reduce((s, e) => s + e.out_tokens, 0);
  const pct = budget ? Math.round(100 * total / budget.budget) : null;
  const remaining = budget ? Math.max(0, budget.budget - total) : null;

  console.log(JSON.stringify({
    entries: entries.length,
    total, total_in: totalIn, total_out: totalOut,
    budget: budget?.budget || null,
    pct_used: pct,
    remaining,
    status: pct === null ? 'no-budget-set'
          : pct > 100 ? 'OVER'
          : pct > 80  ? 'NEAR-LIMIT'
          : pct > 50  ? 'MODERATE'
                      : 'HEALTHY',
  }, null, 2));
}

function cmdSummary() {
  const entries = loadEntries();
  const byLabel = {};
  for (const e of entries) {
    const k = e.label || '(unlabeled)';
    byLabel[k] = (byLabel[k] || 0) + e.total;
  }
  const sorted = Object.entries(byLabel).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, e) => s + e.total, 0);
  console.log(JSON.stringify({
    total,
    entries: entries.length,
    top_labels: sorted.slice(0, 20).map(([label, tokens]) => ({ label, tokens, pct: total > 0 ? Math.round(100 * tokens / total) : 0 })),
  }, null, 2));
}

const [cmd, ...args] = process.argv.slice(2);
try {
  switch (cmd) {
    case 'set-budget': cmdSetBudget(args[0]); break;
    case 'record':     cmdRecord(args[0], args[1], args.slice(2).join(' ')); break;
    case 'status':     cmdStatus(); break;
    case 'summary':    cmdSummary(); break;
    default:
      console.error('Usage: token-budget.mjs <set-budget|record|status|summary> [args]');
      console.error('  set-budget <n>                  — set session token budget');
      console.error('  record <in> <out> [label]       — record a consumption entry');
      console.error('  status                          — show usage vs budget');
      console.error('  summary                         — show usage grouped by label');
      process.exit(1);
  }
} catch (e) { console.error('[token-budget] fatal:', e.message); process.exit(2); }
