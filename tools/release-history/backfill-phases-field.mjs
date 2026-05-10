#!/usr/bin/env node
// Inject `**Phases:**` field into engine-cadence READMEs so the ingest
// scanner can extract phase counts. Engine-cadence pipeline = 6 waves:
//   W0 version-bump + brief
//   W1 research subagent
//   W2 build subagents (NASA serial-first then MUS+ELC+SPS parallel)
//   W3 recovery + catalog cards
//   W4 release notes
//   W5 ship pipeline (pre-tag-gate + tag + merge + GH release + FTP + ship-sync)
//
// Idempotent: skips files that already have **Phases:** in the header.
// Inserts after **Mission package:** if present, otherwise after **Predecessor:**.
//
// Usage:
//   node tools/release-history/backfill-phases-field.mjs --range=604-628
//   node tools/release-history/backfill-phases-field.mjs --dry-run --range=604-628

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = process.cwd();
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

let targets = [];
const rangeArg = args.find(a => a.startsWith('--range='));
if (rangeArg) {
  const [lo, hi] = rangeArg.slice('--range='.length).split('-').map(Number);
  for (let n = lo; n <= hi; n++) targets.push(`v1.49.${n}`);
}
for (const a of args) {
  if (/^v\d+\.\d+\.\d+/.test(a)) targets.push(a);
}

if (targets.length === 0) {
  console.error('Usage: backfill-phases-field.mjs [--dry-run] <version> | --range=NNN-MMM');
  process.exit(2);
}

const PHASES_LINE = `**Phases:** 6 (W0-W5 wave-pipeline: W0 version+brief / W1 research / W2 build / W3 recovery+catalog / W4 release-notes / W5 ship-pipeline)`;

let added = 0;
let skipped = 0;
const summary = [];

for (const version of targets) {
  const readmePath = join(REPO_ROOT, 'docs', 'release-notes', version, 'README.md');
  if (!existsSync(readmePath)) {
    summary.push(`${version}: SKIP (no README)`);
    skipped++;
    continue;
  }
  const text = readFileSync(readmePath, 'utf8');

  // Idempotency: skip if Phases field already exists in header
  const head = text.split(/\r?\n/).slice(0, 25).join('\n');
  if (/^\*\*Phases:\*\*/m.test(head)) {
    summary.push(`${version}: SKIP (Phases field already present)`);
    skipped++;
    continue;
  }

  // Insert after **Mission package:** if present, else after **Predecessor:**
  const lines = text.split(/\r?\n/);
  let insertAfter = -1;
  for (let i = 0; i < Math.min(lines.length, 25); i++) {
    if (/^\*\*Mission package:\*\*/.test(lines[i])) {
      insertAfter = i;
      break;
    }
  }
  if (insertAfter < 0) {
    for (let i = 0; i < Math.min(lines.length, 25); i++) {
      if (/^\*\*Predecessor:\*\*/.test(lines[i])) {
        insertAfter = i;
        break;
      }
    }
  }
  if (insertAfter < 0) {
    summary.push(`${version}: SKIP (no anchor field for insert)`);
    skipped++;
    continue;
  }

  lines.splice(insertAfter + 1, 0, PHASES_LINE);
  if (!dryRun) writeFileSync(readmePath, lines.join('\n'));
  added++;
  summary.push(`${version}: APPLIED${dryRun ? ' (dry-run)' : ''}`);
}

console.log(summary.join('\n'));
console.log(`\nResult: ${added} added, ${skipped} skipped${dryRun ? ' (dry-run)' : ''}`);
