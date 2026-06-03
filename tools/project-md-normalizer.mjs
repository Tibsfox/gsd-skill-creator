#!/usr/bin/env node
/**
 * project-md-normalizer.mjs — structural validator for .planning/PROJECT.md.
 *
 * Added v1.49.785 per AUDIT-2026-05-26 strengthening lever S5 (counter-cadence-
 * shaped chip: convert PROJECT.md prose-drift social rule into deterministic
 * gate). The audit found PROJECT.md had drifted to list a 115-milestone-old
 * "Current Milestone" and had GAP-6 (DACP docs) flagged Open despite closure
 * at v1.49.572 T1c (`docs/substrate/semantic-channel.md`).
 *
 * What --check does:
 *
 *   1. Verifies required top-level sections exist.
 *   2. Verifies the "Latest shipped release" version matches package.json.
 *   3. Verifies the Architecture Gaps table is well-formed (4 columns) and
 *      statuses come from a known enum.
 *   4. Surfaces "Last updated" staleness as a WARN.
 *
 * What --write does (v1.49.954 — the source-eliminator paired with --check's
 * detector, completing the two-layer closure #10431 for the "Latest shipped
 * release" hand-edit drift class):
 *
 *   `--write --version vX --name "..." [--date YYYY-MM-DD]` updates ONLY the
 *   three STRUCTURED lines — "Latest shipped release", "Predecessor", and
 *   "Last updated" — leaving ALL hand-authored prose untouched. It ROTATES the
 *   current latest-shipped (version + name) into the Predecessor line, sets the
 *   new latest-shipped from the args, and refreshes the Last-updated date. It is
 *   idempotent (re-running when already at vX rotates nothing) and runs a
 *   post-condition self-check (the result must pass --check's latest-shipped
 *   validation). PROJECT.md is gitignored (local-only ground truth), so --write
 *   is a LOCAL ship-sequence step (it replaces the manual hand-edit). The
 *   conservative-by-design stance still holds: --write touches no prose, only
 *   the deterministically-derivable structured lines.
 *
 * CLI flags:
 *   --check                       Exit 1 if drift detected; findings to stderr.
 *   --write --version --name      Rewrite the structured lines (see above).
 *
 * Exit codes:
 *   0   no drift (--check) / write succeeded (--write)
 *   1   drift detected (--check)
 *   2   fatal error (file missing, malformed package.json, bad --write args)
 */

import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const args = new Set(process.argv.slice(2));
const CHECK_ONLY = args.has('--check') || args.size === 0;

/** Em-dash used as the version/name separator (escape keeps this source ASCII). */
const EM_DASH = '\u2014';

/** Read a `--flag value` or `--flag=value` argument; undefined if absent. */
function getArgValue(flag) {
  const argv = process.argv.slice(2);
  const i = argv.indexOf(flag);
  if (i !== -1 && i + 1 < argv.length) return argv[i + 1];
  const eq = argv.find((a) => a.startsWith(flag + '='));
  return eq ? eq.slice(flag.length + 1) : undefined;
}

const REPO_ROOT = resolve(process.cwd());
const PROJECT_PATH = resolve(REPO_ROOT, '.planning', 'PROJECT.md');
const PACKAGE_PATH = resolve(REPO_ROOT, 'package.json');

const REQUIRED_SECTIONS = [
  '## What This Is',
  '## Core Value',
  '## Current State',
  '## Tech Stack',
  '## Architecture Gaps',
];

/**
 * Recognized GAP statuses. Permissive — covers historical PROJECT.md
 * conventions ("ADDRESSED" predates "CLOSED"; "Intentional design" is the
 * idiom for GAP-3 which is not-a-gap-by-design). The point is not to enforce
 * uniform vocabulary but to surface typos / unrecognized states.
 */
const ALLOWED_GAP_STATUSES = new Set([
  'CLOSED',
  'ADDRESSED',
  'IN PROGRESS',
  'Open',
  'N/A',
  'Intentional design',
]);

const STALENESS_WARN_DAYS = 30;

function readFileOrFail(path, label) {
  if (!existsSync(path)) {
    console.error(`[project-md-normalizer] FATAL: ${label} not found at ${path}`);
    process.exit(2);
  }
  return readFileSync(path, 'utf8');
}

function loadPackageVersion() {
  const raw = readFileOrFail(PACKAGE_PATH, 'package.json');
  try {
    return JSON.parse(raw).version;
  } catch (err) {
    console.error(`[project-md-normalizer] FATAL: cannot parse package.json: ${err.message}`);
    process.exit(2);
  }
}

function checkRequiredSections(body, findings) {
  for (const heading of REQUIRED_SECTIONS) {
    // Match the heading at start of line; allow trailing prose.
    const re = new RegExp(`^${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'm');
    if (!re.test(body)) {
      findings.push({
        level: 'BLOCK',
        code: 'missing-section',
        message: `Required section missing: "${heading}"`,
      });
    }
  }
}

function parseSemver(version) {
  const m = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!m) return null;
  return { major: +m[1], minor: +m[2], patch: +m[3] };
}

function checkLatestShippedRelease(body, expectedVersion, findings) {
  // Look for a line like:
  //   **Latest shipped release (...):** **v1.49.784 — ...**
  // Semantics: "Latest shipped release" is the predecessor of the in-flight
  // ship. During T14 ship sequencing, package.json is bumped to N before
  // pre-tag-gate runs, so the PROJECT.md line should still reference (N-1).
  // Outside T14 (package.json unchanged), the line should equal N.
  // We accept either: same as package.json OR one patch behind.
  const re = /\*\*Latest shipped release[^:]*:\*\*\s*\*\*v([0-9]+\.[0-9]+\.[0-9]+)/m;
  const match = body.match(re);
  if (!match) {
    findings.push({
      level: 'WARN',
      code: 'missing-latest-shipped-line',
      message: 'No "Latest shipped release" line found (expected `**Latest shipped release...:** **vX.Y.Z — ...**`)',
    });
    return;
  }
  const docVersion = match[1];
  const doc = parseSemver(docVersion);
  const expected = parseSemver(expectedVersion);
  if (!doc || !expected) {
    findings.push({
      level: 'WARN',
      code: 'latest-shipped-version-malformed',
      message: `Cannot parse semver: doc="${docVersion}" expected="${expectedVersion}"`,
    });
    return;
  }
  const sameMajorMinor = doc.major === expected.major && doc.minor === expected.minor;
  const isCurrent = sameMajorMinor && doc.patch === expected.patch;
  const isPredecessor = sameMajorMinor && doc.patch === expected.patch - 1;
  if (!isCurrent && !isPredecessor) {
    findings.push({
      level: 'WARN',
      code: 'latest-shipped-version-drift',
      message: `"Latest shipped release" lists v${docVersion} but package.json is v${expectedVersion} (expected v${expectedVersion} or v${expected.major}.${expected.minor}.${expected.patch - 1})`,
    });
  }
}

/**
 * Extract a section's body by walking lines until the next H2 heading or EOF.
 * Robust to any character in section prose (avoids the JS-regex \Z literal-Z
 * pitfall — see Lesson #10416 in v1.49.783 STATE.md normalizer fix).
 */
function stripSection(body, headingPrefix) {
  const lines = body.split('\n');
  const startIdx = lines.findIndex((l) => l.startsWith(headingPrefix));
  if (startIdx === -1) return null;
  const out = [];
  for (let i = startIdx + 1; i < lines.length; i++) {
    if (/^## /.test(lines[i])) break;
    out.push(lines[i]);
  }
  return out.join('\n');
}

function parseGapTable(body) {
  // The Architecture Gaps section contains a markdown table like:
  //   | ID | Gap | Priority | Status |
  //   |----|-----|----------|--------|
  //   | GAP-1 | ... | ... | ... |
  const section = stripSection(body, '## Architecture Gaps');
  if (section === null) return null;
  const rows = [];
  // Heuristic: match lines that look like markdown table rows starting with |
  // and have at least 4 pipes. Skip header / separator rows.
  const lineRe = /^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/;
  for (const line of section.split('\n')) {
    const m = line.match(lineRe);
    if (!m) continue;
    const [, id, gap, priority, status] = m;
    // Skip header (e.g. "ID" / "Gap") and separator (e.g. "----").
    if (/^-+$/.test(id) || id.trim().toLowerCase() === 'id') continue;
    rows.push({ id: id.trim(), gap: gap.trim(), priority: priority.trim(), status: status.trim() });
  }
  return rows;
}

function checkGapTable(body, findings) {
  const rows = parseGapTable(body);
  if (rows === null) {
    findings.push({
      level: 'BLOCK',
      code: 'gap-section-missing',
      message: '`## Architecture Gaps` section is missing',
    });
    return;
  }
  if (rows.length === 0) {
    findings.push({
      level: 'BLOCK',
      code: 'gap-table-empty',
      message: 'Architecture Gaps table has no rows',
    });
    return;
  }
  for (const row of rows) {
    if (!/^GAP-\d+$/.test(row.id)) {
      findings.push({
        level: 'WARN',
        code: 'gap-id-malformed',
        message: `GAP row has non-canonical ID: "${row.id}" (expected GAP-N)`,
      });
    }
    // Status may carry trailing parenthetical (e.g. "CLOSED (739-edge graph)").
    // Accept any allowed-status that is a prefix of row.status.
    const statusMatch = [...ALLOWED_GAP_STATUSES].find((s) => row.status.startsWith(s));
    if (!statusMatch) {
      findings.push({
        level: 'WARN',
        code: 'gap-status-unknown',
        message: `${row.id} status "${row.status}" — leading keyword not in {${[...ALLOWED_GAP_STATUSES].join(', ')}}`,
      });
    }
  }
}

function checkLastUpdated(body, findings) {
  // Look for a line like:
  //   **Last updated:** 2026-05-02 — ...
  const re = /\*\*Last updated:\*\*\s*(\d{4}-\d{2}-\d{2})/m;
  const match = body.match(re);
  if (!match) {
    findings.push({
      level: 'WARN',
      code: 'no-last-updated',
      message: 'No "**Last updated:** YYYY-MM-DD" line found',
    });
    return;
  }
  const updated = new Date(match[1] + 'T00:00:00Z');
  const now = new Date();
  const days = Math.floor((now - updated) / (1000 * 60 * 60 * 24));
  if (days > STALENESS_WARN_DAYS) {
    findings.push({
      level: 'WARN',
      code: 'last-updated-stale',
      message: `"Last updated" is ${days} days old (threshold ${STALENESS_WARN_DAYS}d)`,
    });
  }
}

function formatFindings(findings) {
  const out = [];
  for (const f of findings) {
    out.push(`  [${f.level}] ${f.code}: ${f.message}`);
  }
  return out.join('\n');
}

/**
 * Match the "Latest shipped release" line, capturing:
 *   [1] the prefix up to and including the `:** ` (preserves the parenthetical),
 *   [2] the version (X.Y.Z, no leading v),
 *   [3] the milestone name (between the `vX — ` and the closing `**`).
 */
const LATEST_LINE_RE =
  /^(\*\*Latest shipped release[^:]*:\*\*\s*)\*\*v([0-9]+\.[0-9]+\.[0-9]+)\s+[—-]\s+([^*]+?)\*\*.*$/m;

/** Match the "Predecessor" line up to its version + name (rewritten on rotate). */
const PREDECESSOR_LINE_RE =
  /^(\*\*Predecessor[^:]*:\*\*\s*)v[0-9]+\.[0-9]+\.[0-9]+\s+[—-]\s+.*$/m;

/** Narrow, prose-preserving rewrite of the three structured PROJECT.md lines. */
function writeMode() {
  const body = readFileOrFail(PROJECT_PATH, '.planning/PROJECT.md');
  const rawVersion = getArgValue('--version');
  const name = getArgValue('--name');
  if (!rawVersion || !name) {
    console.error('[project-md-normalizer] FATAL: --write requires --version and --name');
    process.exit(2);
  }
  const version = rawVersion.replace(/^v/, '');
  const date = getArgValue('--date') ?? new Date().toISOString().slice(0, 10);

  const m = body.match(LATEST_LINE_RE);
  if (!m) {
    console.error('[project-md-normalizer] FATAL: --write found no "Latest shipped release" line to rewrite');
    process.exit(2);
  }
  const [, prefix, oldVersion, oldNameRaw] = m;
  const oldName = oldNameRaw.trim();

  let out = body;

  // Rotate the current latest-shipped into the Predecessor line — but only when
  // actually advancing (idempotent: re-running at the same version rotates
  // nothing, so the predecessor is never clobbered with the current version).
  if (oldVersion !== version && PREDECESSOR_LINE_RE.test(out)) {
    out = out.replace(PREDECESSOR_LINE_RE, `$1v${oldVersion} ${EM_DASH} ${oldName}.`);
  }

  // Rewrite the latest-shipped line from the args (prefix/parenthetical preserved).
  out = out.replace(
    LATEST_LINE_RE,
    `${prefix}**v${version} ${EM_DASH} ${name}** (shipped ${date}; tag \`v${version}\`).`,
  );

  // Refresh the Last-updated date, preserving any trailing prose after it.
  out = out.replace(/^(\*\*Last updated:\*\*\s*)\d{4}-\d{2}-\d{2}/m, `$1${date}`);

  writeFileSync(PROJECT_PATH, out, 'utf8');

  // Post-condition self-check (#10431 source-eliminator + post-condition): the
  // result MUST pass the latest-shipped validation against the written version.
  const findings = [];
  checkLatestShippedRelease(out, version, findings);
  const drift = findings.find((f) => f.code === 'latest-shipped-version-drift');
  if (drift) {
    console.error(`[project-md-normalizer] FATAL: post-write check failed: ${drift.message}`);
    process.exit(2);
  }

  const action = oldVersion === version ? 'refreshed (already at)' : `rotated ${oldVersion} -> predecessor;`;
  console.log(`[project-md-normalizer] WRITE: ${action} latest-shipped now v${version} (${date}).`);
  process.exit(0);
}

function main() {
  const body = readFileOrFail(PROJECT_PATH, '.planning/PROJECT.md');
  const expectedVersion = loadPackageVersion();
  const findings = [];

  checkRequiredSections(body, findings);
  checkLatestShippedRelease(body, expectedVersion, findings);
  checkGapTable(body, findings);
  checkLastUpdated(body, findings);

  const blockers = findings.filter((f) => f.level === 'BLOCK');
  const warns = findings.filter((f) => f.level === 'WARN');

  if (findings.length === 0) {
    console.log('[project-md-normalizer] CHECK: no drift — PROJECT.md is structurally clean');
    process.exit(0);
  }

  console.error('[project-md-normalizer] CHECK: drift detected');
  console.error(formatFindings(findings));
  console.error('');
  console.error(`[project-md-normalizer] summary: ${blockers.length} BLOCK, ${warns.length} WARN`);

  // Exit 1 if any BLOCKs; exit 0 if only WARNs (operator decides via
  // SC_PRE_TAG_GATE_REQUIRE=project-md whether warns escalate to BLOCK).
  if (blockers.length > 0) {
    process.exit(1);
  }
  // For --check-only mode, surface warns via exit 1 ONLY when --strict is set.
  if (args.has('--strict')) {
    process.exit(1);
  }
  process.exit(0);
}

if (args.has('--write')) {
  writeMode();
} else {
  main();
}
