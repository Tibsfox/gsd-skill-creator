#!/usr/bin/env node
// Pre-ship release-notes completeness gate.
//
// Run before tagging / pushing main / creating GH release for any v1.49.x ship.
// Exits non-zero if the standard release-notes structure is missing.
//
// Standard structure (per docs/release-notes/v1.49.581/ + v1.49.582/ as gold):
//   docs/release-notes/<version>/
//   ├── README.md
//   └── chapter/
//       ├── 00-summary.md
//       ├── 03-retrospective.md
//       ├── 04-lessons.md
//       └── 99-context.md
//
// Usage:
//   node tools/release-history/check-completeness.mjs <version>
//   node tools/release-history/check-completeness.mjs v1.49.582
//   node tools/release-history/check-completeness.mjs --current  # auto-detect from package.json
//
// Exits 0 = pass; 1 = missing files; 2 = bad version arg; 3 = no package.json

import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..');

const REQUIRED = [
  'README.md',
  'chapter/00-summary.md',
  'chapter/03-retrospective.md',
  'chapter/04-lessons.md',
  'chapter/99-context.md',
];

function detectCurrentVersion() {
  const pkgPath = join(REPO_ROOT, 'package.json');
  if (!existsSync(pkgPath)) return null;
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  return pkg.version ? `v${pkg.version}` : null;
}

const args = process.argv.slice(2);
let version = null;
let strict = false;

for (const a of args) {
  if (a === '--current') {
    version = detectCurrentVersion();
    if (!version) {
      console.error('fatal: --current requires package.json with a "version" field');
      process.exit(3);
    }
  } else if (a === '--strict') {
    strict = true; // also requires non-empty content (>200 bytes per file)
  } else if (a.startsWith('v')) {
    version = a;
  } else {
    console.error(`unknown argument: ${a}`);
    process.exit(2);
  }
}

if (!version) {
  console.error('usage: check-completeness.mjs <version> [--strict]');
  console.error('       check-completeness.mjs --current [--strict]');
  process.exit(2);
}

if (!/^v\d+\.\d+(\.\d+)?$/.test(version)) {
  console.error(`fatal: bad version arg: ${version} (expected vN.N or vN.N.N)`);
  process.exit(2);
}

const releaseDir = join(REPO_ROOT, 'docs', 'release-notes', version);

const findings = [];
for (const rel of REQUIRED) {
  const p = join(releaseDir, rel);
  if (!existsSync(p)) {
    findings.push({ severity: 'BLOCK', file: rel, reason: 'missing' });
    continue;
  }
  if (strict) {
    try {
      const sz = readFileSync(p, 'utf8').length;
      if (sz < 200) {
        findings.push({ severity: 'WARN', file: rel, reason: `too short (${sz} bytes; need ≥200)` });
      }
    } catch (e) {
      findings.push({ severity: 'BLOCK', file: rel, reason: `unreadable: ${e.message}` });
    }
  }
}

const blocks = findings.filter(f => f.severity === 'BLOCK');
const warns = findings.filter(f => f.severity === 'WARN');

if (blocks.length === 0 && warns.length === 0) {
  console.log(`[check-completeness] ${version}: PASS — all 5 required files present${strict ? ' (strict)' : ''}`);
  process.exit(0);
}

console.error(`[check-completeness] ${version}: ${blocks.length === 0 ? 'WARN' : 'FAIL'}`);
console.error(`  ${releaseDir}/`);
for (const f of [...blocks, ...warns]) {
  console.error(`    ${f.severity}: ${f.file} — ${f.reason}`);
}

if (blocks.length > 0) {
  console.error('');
  console.error('  Standard (gold reference): docs/release-notes/v1.49.581/ and v1.49.582/');
  console.error('  Required files:');
  for (const r of REQUIRED) console.error(`    - ${r}`);
  console.error('');
  console.error('  Author the missing files BEFORE tagging / pushing main / creating GH release.');
  console.error('  Drift in this discipline cost 4 missing release-notes (v1.49.577–580) on 2026-04-26;');
  console.error('  this gate is the remediation. Do not skip it.');
  process.exit(1);
}

// Warns only — exit 0 but loudly
process.exit(0);
