#!/usr/bin/env node
// tools/check-sps-cohort-uniqueness.mjs — Lesson #10364 codification (v1.49.666 cc-3 Phase 3).
//
// Scans www/tibsfox/com/Research/SPS/<slug>/index.html files for declared
// `SPS #N` numbers and reports any duplicate-number collisions across the
// catalog. Optional --prospective slug:N compares a hypothetical new entry
// against existing pages to detect first-instance-claim duplicates before
// they ship.
//
// Closes the recurrence path for the v1.49.661 marbled-murrelet near-miss:
// the v661 release-notes claimed FIRST-INSTANCE for marbled-murrelet at
// SPS #115, but the species was already at SPS #82 from v608 era (with
// substantive substrate-form anchoring). Without an automated gate, the
// duplicate-claim shipped into cc-1 manifest scaffolding; cc-2 caught it
// pre-dispatch and retracted. This gate makes the next near-miss detectable
// at pre-tag time instead of pre-dispatch.
//
// Detection rules:
//   - Looks for /SPS #(\d+)/ pattern inside each <slug>/index.html.
//     Multiple matches in a single file are deduped to the first declared
//     number (subsequent occurrences within the same file are page-internal
//     cross-references, not separate declarations).
//   - Pages with no `SPS #N` declaration are skipped gracefully (treated
//     as "not yet declared"; not a violation).
//   - --prospective slug:N flag: treat slug as a hypothetical new entry
//     declaring SPS #N. Reports if N collides with any existing page.
//   - --json: emits machine-readable output.
//
// Usage:
//   node tools/check-sps-cohort-uniqueness.mjs
//   node tools/check-sps-cohort-uniqueness.mjs --prospective marbled-murrelet:115
//   node tools/check-sps-cohort-uniqueness.mjs --json
//   node tools/check-sps-cohort-uniqueness.mjs --sps-root /alt/path
//   node tools/check-sps-cohort-uniqueness.mjs --strict      (exit 1 on collision)
//
// Exit codes:
//   0  no collision OR collision detected without --strict (soak-mode default)
//   1  collision detected AND --strict
//   2  invalid CLI args / inaccessible SPS root
//
// Consumers:
//   - tools/pre-tag-gate.sh (step 14/14 soak-mode WARN; promote to BLOCKER
//     by SC_PRE_TAG_GATE_REQUIRE=sps-cohort-uniqueness).
//   - manual catalog-card workflow inputs (run with --prospective before
//     authoring a new SPS species page).

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { execSync } from 'node:child_process';
import { join, resolve } from 'node:path';

const DECLARATION_RE = /SPS #(\d+)\b/;
const DEFAULT_SPS_REL = 'www/tibsfox/com/Research/SPS';

function repoRoot() {
  try {
    return execSync('git rev-parse --show-toplevel', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return process.cwd();
  }
}

function parseArgs(argv) {
  const args = { json: false, strict: false, prospective: null, spsRoot: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') args.json = true;
    else if (a === '--strict') args.strict = true;
    else if (a === '--prospective') {
      const v = argv[++i];
      if (!v) throw new Error('--prospective requires slug:N value');
      const m = v.match(/^([a-z0-9][a-z0-9-]*):(\d+)$/);
      if (!m) throw new Error(`--prospective expects slug:N (got "${v}")`);
      args.prospective = { slug: m[1], number: parseInt(m[2], 10) };
    } else if (a === '--sps-root') {
      args.spsRoot = argv[++i];
      if (!args.spsRoot) throw new Error('--sps-root requires a path');
    } else if (a === '--help' || a === '-h') {
      args.help = true;
    } else if (a.startsWith('--')) {
      throw new Error(`unknown flag: ${a}`);
    }
  }
  return args;
}

export function extractDeclaration(htmlPath) {
  if (!existsSync(htmlPath)) return null;
  const text = readFileSync(htmlPath, 'utf8');
  const m = text.match(DECLARATION_RE);
  if (!m) return null;
  return parseInt(m[1], 10);
}

export function scanSpsRoot(spsRoot) {
  if (!existsSync(spsRoot)) {
    return { declarations: [], skipped: [], rootMissing: true };
  }
  const entries = readdirSync(spsRoot);
  const declarations = [];
  const skipped = [];
  for (const slug of entries) {
    const slugPath = join(spsRoot, slug);
    let isDir = false;
    try {
      isDir = statSync(slugPath).isDirectory();
    } catch {
      continue;
    }
    if (!isDir) continue;
    const indexPath = join(slugPath, 'index.html');
    const number = extractDeclaration(indexPath);
    if (number === null) {
      skipped.push({ slug, reason: existsSync(indexPath) ? 'no-declaration' : 'no-index-html' });
      continue;
    }
    declarations.push({ slug, number, indexPath });
  }
  declarations.sort((a, b) => a.number - b.number || a.slug.localeCompare(b.slug));
  return { declarations, skipped, rootMissing: false };
}

export function findCollisions(declarations) {
  const byNumber = new Map();
  for (const d of declarations) {
    if (!byNumber.has(d.number)) byNumber.set(d.number, []);
    byNumber.get(d.number).push(d.slug);
  }
  const collisions = [];
  for (const [number, slugs] of byNumber.entries()) {
    if (slugs.length > 1) {
      collisions.push({ number, slugs: slugs.slice().sort() });
    }
  }
  collisions.sort((a, b) => a.number - b.number);
  return collisions;
}

/**
 * Two distinct collision modes:
 *
 * - `number-collision` — prospective declares a number already taken by a
 *   DIFFERENT existing slug (classic duplicate-NUMBER detection).
 *
 * - `slug-collision` — prospective uses a slug that already exists on disk
 *   with a DIFFERENT declared number. This is the marbled-murrelet
 *   near-miss pattern: v661 claimed first-instance for marbled-murrelet at
 *   SPS #115 while the slug already lived at SPS #82. Without this branch
 *   the gate would miss the most consequential v666 reproduction case.
 */
export function checkProspective(prospective, declarations) {
  if (!prospective) return null;
  const numberCollidingSlugs = declarations
    .filter((d) => d.number === prospective.number && d.slug !== prospective.slug)
    .map((d) => d.slug);
  const slugMatchDeclaration = declarations.find((d) => d.slug === prospective.slug);
  const slugCollision = slugMatchDeclaration && slugMatchDeclaration.number !== prospective.number
    ? { existingNumber: slugMatchDeclaration.number }
    : null;
  const collision = numberCollidingSlugs.length > 0 || slugCollision !== null;
  return {
    collision,
    prospective,
    collidingSlugs: numberCollidingSlugs,
    slugCollision,
  };
}

function reportHuman(result, args) {
  const out = [];
  if (result.rootMissing) {
    out.push(`[sps-cohort-uniqueness] SPS root not found: ${result.spsRoot}`);
    out.push('[sps-cohort-uniqueness] (no SPS pages to scan; treated as PASS by soak-mode gate)');
    return out.join('\n');
  }
  out.push(`[sps-cohort-uniqueness] scanned ${result.declarations.length} declared + ${result.skipped.length} skipped under ${result.spsRoot}`);
  if (result.collisions.length === 0 && !result.prospectiveResult?.collision) {
    out.push('[sps-cohort-uniqueness] PASS — no SPS-number collisions detected');
    return out.join('\n');
  }
  if (result.collisions.length > 0) {
    out.push(`[sps-cohort-uniqueness] COLLISION-DETECTED: ${result.collisions.length} number(s) with duplicate slugs:`);
    for (const c of result.collisions) {
      out.push(`  SPS #${c.number}: ${c.slugs.join(', ')}`);
    }
  }
  if (result.prospectiveResult?.collision) {
    const p = result.prospectiveResult.prospective;
    if (result.prospectiveResult.collidingSlugs.length > 0) {
      out.push(`[sps-cohort-uniqueness] PROSPECTIVE NUMBER COLLISION: ${p.slug} @ SPS #${p.number} duplicates existing slug(s): ${result.prospectiveResult.collidingSlugs.join(', ')}`);
    }
    if (result.prospectiveResult.slugCollision) {
      const existing = result.prospectiveResult.slugCollision.existingNumber;
      out.push(`[sps-cohort-uniqueness] PROSPECTIVE SLUG COLLISION: ${p.slug} declared at SPS #${p.number} but already exists at SPS #${existing} on disk — likely a false first-instance claim (cf. v661 marbled-murrelet near-miss, Lesson #10364)`);
    }
  }
  return out.join('\n');
}

export function runCheck(opts = {}) {
  const spsRoot = resolve(opts.spsRoot || join(repoRoot(), DEFAULT_SPS_REL));
  const scan = scanSpsRoot(spsRoot);
  const collisions = findCollisions(scan.declarations);
  const prospectiveResult = checkProspective(opts.prospective, scan.declarations);
  return {
    spsRoot,
    rootMissing: scan.rootMissing,
    declarations: scan.declarations,
    skipped: scan.skipped,
    collisions,
    prospectiveResult,
  };
}

function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (err) {
    process.stderr.write(`[sps-cohort-uniqueness] arg error: ${err.message}\n`);
    process.exit(2);
  }

  if (args.help) {
    process.stdout.write(`Usage:
  node tools/check-sps-cohort-uniqueness.mjs [--json] [--strict] [--prospective slug:N] [--sps-root <path>]

Scans www/.../SPS/<slug>/index.html files for declared SPS numbers and reports duplicate-number collisions. Optional --prospective slug:N detects collision for a hypothetical new entry.

Exit codes:
  0 no collision OR collision without --strict
  1 collision AND --strict
  2 CLI error
`);
    process.exit(0);
  }

  const result = runCheck({ spsRoot: args.spsRoot, prospective: args.prospective });

  if (args.json) {
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  } else {
    process.stdout.write(reportHuman(result, args) + '\n');
  }

  const anyCollision = result.collisions.length > 0 || result.prospectiveResult?.collision;
  if (anyCollision && args.strict) process.exit(1);
  process.exit(0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
