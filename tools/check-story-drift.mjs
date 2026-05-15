#!/usr/bin/env node
// Detects drift between the public docs/release-notes/STORY.md preamble and
// reality (chapter count on disk + package.json version + ground-truth
// .planning/roadmap/STORY.md).
//
// Closes the recurrence path for the 8-degree drift surfaced 2026-05-15: the
// T14 STORY-gate step 2.5 (scripts/append-story-entry.mjs) was skipped across
// the v1.49.645→v1.49.652 sprint, leaving public STORY.md frozen at v1.49.644
// even though the ground-truth and chapter directories had advanced. This
// gate makes future drift detectable at audit / pre-tag time instead of at
// the next manual audit.
//
// Checks:
//   1. Public STORY.md preamble chapter count == count of v* directories
//      under docs/release-notes/
//   2. Public STORY.md preamble tail tag == package.json version
//   3. Public STORY.md last entry tag >= package.json predecessor (one ship
//      behind is acceptable; more than one is drift)
//
// Usage:
//   node tools/check-story-drift.mjs                  (human-readable report)
//   node tools/check-story-drift.mjs --json
//   node tools/check-story-drift.mjs --strict         (exit 1 on drift)
//
// Exit codes:
//   0  no drift OR drift detected without --strict
//   1  drift detected AND --strict
//   2  malformed STORY.md (cannot parse preamble)
//   3  invalid CLI arg / missing input

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, resolve } from 'node:path';

function repoRoot() {
  try {
    return execSync('git rev-parse --show-toplevel', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return process.cwd();
  }
}

const REPO_ROOT = repoRoot();
const PUBLIC_STORY = resolve(REPO_ROOT, 'docs/release-notes/STORY.md');
const NOTES_DIR = resolve(REPO_ROOT, 'docs/release-notes');
const PACKAGE_JSON = resolve(REPO_ROOT, 'package.json');

function parseArgs(argv) {
  const opts = { json: false, strict: false };
  for (const a of argv) {
    if (a === '--json') opts.json = true;
    else if (a === '--strict') opts.strict = true;
    else if (a === '-h' || a === '--help') {
      process.stdout.write(
        [
          'Usage: node tools/check-story-drift.mjs [--json] [--strict]',
          '',
          'Detects drift between docs/release-notes/STORY.md preamble and reality.',
          'Exit 0 on clean (or non-strict drift); 1 on drift+strict; 2 on parse error.',
        ].join('\n') + '\n',
      );
      process.exit(0);
    } else {
      process.stderr.write(`unknown arg: ${a}\n`);
      process.exit(3);
    }
  }
  return opts;
}

function parsePreamble(content) {
  const lines = content.split('\n');
  let tailTag = null, chapters = null, retrospectives = null, lastEntryTag = null;
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const m1 = lines[i].match(/continues to `(v\d+\.\d+\.\d+)`\.\s*$/);
    if (m1) tailTag = m1[1];
    const m2 = lines[i].match(/^\*\*(\d+) chapters\.\*\* (\d+) have retrospectives\.\s*$/);
    if (m2) {
      chapters = parseInt(m2[1], 10);
      retrospectives = parseInt(m2[2], 10);
    }
  }
  // Last entry tag = last bullet matching the v-tag pattern
  for (let i = lines.length - 1; i >= 0; i--) {
    const m = lines[i].match(/^- \*\*\[(v\d+\.\d+\.\d+)\]/);
    if (m) { lastEntryTag = m[1]; break; }
  }
  return { tailTag, chapters, retrospectives, lastEntryTag };
}

function readPackageVersion() {
  if (!existsSync(PACKAGE_JSON)) return null;
  const pkg = JSON.parse(readFileSync(PACKAGE_JSON, 'utf8'));
  return typeof pkg.version === 'string' ? `v${pkg.version}` : null;
}

function countChapterDirs() {
  if (!existsSync(NOTES_DIR)) return 0;
  // Allow 2+ dot-separated parts: v1.X, v1.X.Y, v1.X.Y.Z (covers the
  // v1.49.20.1-style 4-part version that briefly appeared in the v1.49.20 series).
  return readdirSync(NOTES_DIR)
    .filter((d) => /^v\d+(\.\d+)+$/.test(d))
    .filter((d) => statSync(join(NOTES_DIR, d)).isDirectory())
    .length;
}

function cmpVersion(a, b) {
  const pa = a.replace(/^v/, '').split('.').map(Number);
  const pb = b.replace(/^v/, '').split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const da = pa[i] ?? 0;
    const db = pb[i] ?? 0;
    if (da < db) return -1;
    if (da > db) return 1;
  }
  return 0;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (!existsSync(PUBLIC_STORY)) {
    process.stderr.write(`docs/release-notes/STORY.md not found\n`);
    process.exit(3);
  }
  const content = readFileSync(PUBLIC_STORY, 'utf8');
  const { tailTag, chapters, retrospectives, lastEntryTag } = parsePreamble(content);
  if (!tailTag || chapters === null || !lastEntryTag) {
    process.stderr.write(`STORY.md preamble unparseable (need 'continues to vX.Y.Z' + '**N chapters.** M have retrospectives')\n`);
    process.exit(2);
  }

  const pkgVersion = readPackageVersion();
  const dirCount = countChapterDirs();

  const findings = [];
  if (chapters !== dirCount) {
    findings.push({
      kind: 'chapter_count_drift',
      severity: 'high',
      preamble_count: chapters,
      directory_count: dirCount,
      delta: dirCount - chapters,
      message: `STORY.md preamble says ${chapters} chapters; ${dirCount} v* directories exist`,
    });
  }
  if (pkgVersion && tailTag !== pkgVersion) {
    findings.push({
      kind: 'tail_tag_drift',
      severity: 'high',
      preamble_tail: tailTag,
      package_version: pkgVersion,
      message: `STORY.md preamble tail = ${tailTag}; package.json version = ${pkgVersion}`,
    });
  }
  if (pkgVersion && lastEntryTag && cmpVersion(lastEntryTag, pkgVersion) < 0) {
    findings.push({
      kind: 'last_entry_drift',
      severity: 'medium',
      last_entry: lastEntryTag,
      package_version: pkgVersion,
      message: `STORY.md last entry = ${lastEntryTag}; package.json version = ${pkgVersion}`,
    });
  }

  if (opts.json) {
    process.stdout.write(
      JSON.stringify(
        {
          scan_date: new Date().toISOString().split('T')[0],
          preamble: { tailTag, chapters, retrospectives, lastEntryTag },
          package_version: pkgVersion,
          directory_count: dirCount,
          findings,
        },
        null,
        2,
      ),
    );
    process.stdout.write('\n');
  } else {
    process.stdout.write(`STORY.md preamble:\n`);
    process.stdout.write(`  tail tag:   ${tailTag}\n`);
    process.stdout.write(`  chapters:   ${chapters} (with ${retrospectives} retrospectives)\n`);
    process.stdout.write(`  last entry: ${lastEntryTag}\n`);
    process.stdout.write(`\nReality:\n`);
    process.stdout.write(`  package.json version: ${pkgVersion ?? '(absent)'}\n`);
    process.stdout.write(`  v* directories:       ${dirCount}\n\n`);
    if (findings.length === 0) {
      process.stdout.write(`No drift detected — STORY.md is in sync.\n`);
    } else {
      process.stdout.write(`Detected ${findings.length} drift finding(s):\n\n`);
      for (const f of findings) {
        process.stdout.write(`  [${f.severity.toUpperCase()}] ${f.kind}\n    ${f.message}\n\n`);
      }
      process.stdout.write(
        `Fix: run scripts/append-story-entry.mjs (T14 step 2.5) or backfill manually.\n` +
          `Ground truth lives at .planning/roadmap/STORY.md (gitignored).\n`,
      );
    }
  }

  if (findings.length > 0 && opts.strict) {
    process.exit(1);
  }
  process.exit(0);
}

main();
