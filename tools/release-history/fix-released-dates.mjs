#!/usr/bin/env node
// Fix `**Released:**` date in engine-cadence README files. The original
// retrofit-engine-cadence-headers.mjs used inferShippedDate() which scanned
// the first 30 lines of the README+chapter for a date regex match — that
// caused false positives like:
//   v1.49.611: 2020-10-08 (USFWS Coastal Marten DPS designation)
//   v1.49.615: 1976-07-20 (Viking 1 landing date)
//   v1.49.619: 2012-08-25 (Voyager 1 entered interstellar space)
//
// This script uses `git log -1 --format=%cs <version-tag>` as authoritative
// source. Run after the retrofit has already added the **Released:** field
// (idempotent — will overwrite stale values to match git).
//
// Usage:
//   node tools/release-history/fix-released-dates.mjs --range=604-628
//   node tools/release-history/fix-released-dates.mjs v1.49.611 v1.49.615

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
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
  console.error('Usage: fix-released-dates.mjs [--dry-run] <version> | --range=NNN-MMM');
  process.exit(2);
}

function tagCommitDate(version) {
  for (const ref of [version, version.replace(/^v/, ''), `refs/tags/${version}`]) {
    const r = spawnSync('git', ['log', '-1', '--format=%cs', ref], { encoding: 'utf8' });
    if (r.status === 0 && /^\d{4}-\d{2}-\d{2}/.test(r.stdout.trim())) {
      return r.stdout.trim();
    }
  }
  return null;
}

let fixed = 0;
let skipped = 0;
const summary = [];

for (const version of targets) {
  const readmePath = join(REPO_ROOT, 'docs', 'release-notes', version, 'README.md');
  if (!existsSync(readmePath)) {
    summary.push(`${version}: SKIP (no README)`);
    continue;
  }
  const text = readFileSync(readmePath, 'utf8');
  const tagDate = tagCommitDate(version);
  if (!tagDate) {
    summary.push(`${version}: SKIP (no git tag)`);
    skipped++;
    continue;
  }

  // Match `**Released:** YYYY-MM-DD` in the first 20 lines. Replace the
  // date with the git tag commit date.
  const lines = text.split(/\r?\n/);
  const head = lines.slice(0, 20);
  let mutated = false;
  for (let i = 0; i < head.length; i++) {
    const m = head[i].match(/^(\*\*Released:\*\*\s*)(\d{4}-\d{2}-\d{2})/);
    if (m) {
      if (m[2] !== tagDate) {
        lines[i] = head[i].replace(/^(\*\*Released:\*\*\s*)\d{4}-\d{2}-\d{2}/, `$1${tagDate}`);
        mutated = true;
        summary.push(`${version}: ${m[2]} → ${tagDate}${dryRun ? ' (dry-run)' : ''}`);
      } else {
        summary.push(`${version}: already correct (${tagDate})`);
      }
      break;
    }
  }
  if (mutated) {
    if (!dryRun) writeFileSync(readmePath, lines.join('\n'));
    fixed++;
  } else if (!summary[summary.length - 1] || !summary[summary.length - 1].startsWith(version)) {
    summary.push(`${version}: SKIP (no **Released:** field)`);
    skipped++;
  }
}

console.log(summary.join('\n'));
console.log(`\nResult: ${fixed} fixed, ${skipped} skipped${dryRun ? ' (dry-run)' : ''}`);
