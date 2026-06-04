#!/usr/bin/env node
/**
 * adoption-baseline-freshness.mjs — is the committed adoption baseline fresh?
 *
 * Added v1.49.965 (Ship 0.1, audit-2026-06-03 item T1.3). The adoption
 * shelfware-telemetry baseline (`docs/ADOPTION-BASELINE-v*.json`, written by
 * `tools/adoption-refresh.mjs`) silently FROZE at v1.49.801 for ~163 ships
 * because nothing gated its freshness — a textbook #10461 un-gated-runnable-
 * surface: the alarm the project built to answer the 2026-05-26 audit's #1
 * concern (shelfware telemetry) went quiet and no surface noticed.
 *
 * This tool re-arms the alarm. It compares the NEWEST committed baseline's
 * version against the current shipping version and reports the ship-distance
 * (the patch delta within the same major.minor line). It is consumed by
 * `tools/pre-tag-gate.sh` step 20 (WARN-only first per the #10463 staged-
 * promotion pattern; escalatable to BLOCKER via SC_PRE_TAG_GATE_REQUIRE).
 *
 * FORWARD-PROGRESS mode (not exact-match): the gate tolerates the baseline
 * trailing the current version by up to `--max-drift N` ships (default 30, or
 * SC_ADOPTION_BASELINE_MAX_DRIFT). This deliberately avoids churning a fresh
 * baseline on EVERY ship while still catching a multi-ship freeze. Refresh with
 * `node tools/adoption-refresh.mjs` (which MUST run AFTER bump-version — #10424).
 *
 * CLI:
 *   node tools/adoption-baseline-freshness.mjs            # check cwd repo
 *   node tools/adoption-baseline-freshness.mjs --root DIR # check another tree
 *   node tools/adoption-baseline-freshness.mjs --max-drift 10
 *   node tools/adoption-baseline-freshness.mjs --version 1.49.965  # override current
 *   node tools/adoption-baseline-freshness.mjs --json
 *
 * Exit codes:
 *   0  FRESH   — newest baseline is within `max-drift` ships of current
 *   1  STALE   — newest baseline trails by > max-drift ships, is from a different
 *                release line (major.minor), OR no baseline exists at all
 *                (all actionable: run adoption-refresh)
 *   2  FATAL   — usage / unparseable package.json version
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

const args = process.argv.slice(2);
const rootIdx = args.indexOf('--root');
const ROOT = resolve(rootIdx >= 0 ? args[rootIdx + 1] : process.cwd());
const versionIdx = args.indexOf('--version');
const driftIdx = args.indexOf('--max-drift');
const JSON_OUTPUT = args.includes('--json');

const DEFAULT_MAX_DRIFT = 30;
const MAX_DRIFT = (() => {
  const raw = driftIdx >= 0 ? args[driftIdx + 1] : process.env.SC_ADOPTION_BASELINE_MAX_DRIFT;
  const n = Number(raw);
  return raw !== undefined && raw !== '' && Number.isFinite(n) && n >= 0 ? n : DEFAULT_MAX_DRIFT;
})();

const BASELINE_RE = /^ADOPTION-BASELINE-v([0-9]+\.[0-9]+\.[0-9]+)\.json$/;

function fail(msg) {
  console.error(`[adoption-baseline-freshness] FATAL: ${msg}`);
  process.exitCode = 2;
}

function parseVer(v) {
  const m = String(v).replace(/^v/, '').match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!m) return null;
  return { major: +m[1], minor: +m[2], patch: +m[3], raw: `${+m[1]}.${+m[2]}.${+m[3]}` };
}

function cmp(a, b) {
  return a.major - b.major || a.minor - b.minor || a.patch - b.patch;
}

function currentVersion() {
  if (versionIdx >= 0) {
    const v = parseVer(args[versionIdx + 1]);
    if (!v) { fail(`--version "${args[versionIdx + 1]}" is not a valid semver`); return null; }
    return v;
  }
  const pkgPath = join(ROOT, 'package.json');
  if (!existsSync(pkgPath)) { fail(`no package.json at ${pkgPath} (pass --version)`); return null; }
  let pkg;
  try { pkg = JSON.parse(readFileSync(pkgPath, 'utf8')); }
  catch (err) { fail(`cannot parse ${pkgPath}: ${err.message}`); return null; }
  const v = parseVer(pkg.version);
  if (!v) { fail(`package.json version "${pkg.version}" is not a valid semver`); return null; }
  return v;
}

function newestBaseline() {
  const docsDir = join(ROOT, 'docs');
  if (!existsSync(docsDir)) return null;
  let best = null;
  for (const f of readdirSync(docsDir)) {
    const m = f.match(BASELINE_RE);
    if (!m) continue;
    const v = parseVer(m[1]);
    if (v && (!best || cmp(v, best) > 0)) best = v;
  }
  return best;
}

/**
 * Ship-distance the baseline trails current, defined ONLY within a release line:
 *   - different major.minor (older OR newer) → null → STALE. A v1.51 baseline is
 *     not "fresh" for a v1.50 ship, and — critically — a future-major file
 *     (v999.0.0) must not be able to mask real staleness by reporting drift 0.
 *   - same major.minor, baseline at-or-ahead of current → 0 → FRESH.
 *   - same major.minor, baseline behind current → patch delta (the ship-count).
 * The major.minor guard MUST come first: cmp() alone would call a newer-line
 * baseline "ahead" and return 0.
 */
function driftShips(current, baseline) {
  if (baseline.major !== current.major || baseline.minor !== current.minor) return null;
  if (cmp(baseline, current) >= 0) return 0;
  return current.patch - baseline.patch;
}

function main() {
  const current = currentVersion();
  if (!current) return; // exitCode 2 already set
  const baseline = newestBaseline();

  if (!baseline) {
    const payload = { current: current.raw, newestBaseline: null, driftShips: null, maxDrift: MAX_DRIFT, fresh: false };
    if (JSON_OUTPUT) console.log(JSON.stringify(payload, null, 2));
    else {
      console.error(`[adoption-baseline-freshness] STALE: no docs/ADOPTION-BASELINE-v*.json found (current v${current.raw})`);
      console.error('[adoption-baseline-freshness]   Fix: node tools/adoption-refresh.mjs (AFTER bump-version)');
    }
    process.exitCode = 1;
    return;
  }

  const drift = driftShips(current, baseline);
  const fresh = drift !== null && drift <= MAX_DRIFT;
  const payload = {
    current: current.raw,
    newestBaseline: baseline.raw,
    driftShips: drift,
    maxDrift: MAX_DRIFT,
    fresh,
  };

  if (JSON_OUTPUT) {
    console.log(JSON.stringify(payload, null, 2));
  } else if (fresh) {
    console.log(`[adoption-baseline-freshness] FRESH: newest baseline v${baseline.raw} is ${drift} ship(s) behind current v${current.raw} (max drift ${MAX_DRIFT})`);
  } else {
    const dist = drift === null ? `from an older release line than` : `${drift} ship(s) behind`;
    console.error(`[adoption-baseline-freshness] STALE: newest baseline v${baseline.raw} is ${dist} current v${current.raw} (max drift ${MAX_DRIFT})`);
    console.error('[adoption-baseline-freshness]   Fix: node tools/adoption-refresh.mjs (AFTER bump-version)');
  }
  process.exitCode = fresh ? 0 : 1;
}

main();
