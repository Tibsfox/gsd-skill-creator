#!/usr/bin/env node
/**
 * verify-overdue-scan.mjs — flag CalibratableThreshold members past the
 * 10-ship verify-axis trigger (#10428 meta-cadence discipline).
 *
 * The verify axis says: each calibratable threshold should have an
 * integration test verifying the substrate-to-caller wire within 10
 * ships of the threshold first being wired by a production (non-test)
 * caller. This tool enumerates the threshold registry, checks against a
 * hand-curated manifest of "wired since" ship versions, and computes
 * the ship-count delta from the current package.json version.
 *
 * Usage:
 *   node tools/calibratable/verify-overdue-scan.mjs           # human report
 *   node tools/calibratable/verify-overdue-scan.mjs --json    # JSON output
 *
 * Exit codes:
 *   0 — no thresholds overdue
 *   1 — one or more thresholds overdue
 *
 * Manifest source: this file's `THRESHOLDS_MANIFEST` constant. Update
 * when new thresholds are wired or new test surfaces are added.
 *
 * Codified at v1.49.882 — campaign-close ship of the v868-v882 follow-on
 * campaign. Generalizes the verify-axis trigger guidance from #10428
 * prose into a deterministic runtime check.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), '..', '..', '..');

// ─── Manifest ────────────────────────────────────────────────────────────────
// Hand-curated. For each CalibratableThreshold from src/bounded-learning/types.ts:
//   - wired_first_caller_ship: version of first NON-TEST production caller
//   - integration_test_ship:   version of the integration test verifying the wire
//                              (null if not yet shipped)
//   - notes: human context
//
// When a new threshold is added to the registry, append an entry here.
// When an integration test ships, update integration_test_ship.

const THRESHOLDS_MANIFEST = [
  {
    threshold: 'suggestions.min_occurrences',
    wired_first_caller_ship: 'v1.49.795',
    integration_test_ship: 'v1.49.797',
    notes: 'Suggestions class first; wired early in T1.1 arc.',
  },
  {
    threshold: 'suggestions.cooldown_days',
    wired_first_caller_ship: 'v1.49.796',
    integration_test_ship: 'v1.49.797',
    notes: 'Suggestions class second member.',
  },
  {
    threshold: 'suggestions.auto_dismiss_after_days',
    wired_first_caller_ship: 'v1.49.797',
    integration_test_ship: 'v1.49.797',
    notes: 'Suggestions class third member.',
  },
  {
    threshold: 'token_budget.warn_at_percent',
    wired_first_caller_ship: 'v1.49.798',
    integration_test_ship: 'v1.49.799',
    notes: 'token_budget class first; second-instance trigger for #10426 cross-class registry extraction.',
  },
  {
    threshold: 'token_budget.max_percent',
    wired_first_caller_ship: 'v1.49.893',
    integration_test_ship: 'v1.49.898',
    notes: 'SUBSTRATE WIRED v1.49.893 (token-budget/ceiling-substrate.ts runTokenBudgetCeilingCheck — production caller that reads token_budget.max_percent, compares against usagePercent, auto-emits an outcome-driven event per #10437). Read-side wired at v1.49.888. Integration test at v1.49.898 (5 ships after wire — within 10-ship verify-axis budget per #10428). THIRD instance of "substrate→calibration end-to-end test" pattern (after v856 predictive low-confidence + v894 observation-retention) — promotes pattern to ESTABLISHED at the 3-instance bar. Distinct from v894 in that the substrate is outcome-driven (kind falls out of the inequality), not default-fixed.',
  },
  {
    threshold: 'observation.retention_days',
    wired_first_caller_ship: 'v1.49.891',
    integration_test_ship: 'v1.49.894',
    notes: 'SUBSTRATE WIRED v1.49.891 (retention-substrate.ts). Read-side wired at v1.49.884. Integration test at v1.49.894 (3 ships after wire — within 10-ship verify-axis budget per #10428). Second instance of "substrate→calibration end-to-end test" pattern (after v856 predictive low-confidence).',
  },
  {
    threshold: 'predictive.low_confidence_threshold',
    wired_first_caller_ship: 'v1.49.846',
    integration_test_ship: 'v1.49.856',
    notes: 'Substrate auto-emit wired at v846; calibration-loop verify ship at v856.',
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseVersion(v) {
  if (!v) return null;
  const m = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(v);
  if (!m) throw new Error(`Cannot parse version: ${v}`);
  return { major: +m[1], minor: +m[2], patch: +m[3] };
}

function shipCountBetween(fromVersion, toVersion) {
  const from = parseVersion(fromVersion);
  const to = parseVersion(toVersion);
  if (!from || !to) return null;
  if (from.major !== to.major || from.minor !== to.minor) {
    // Cross-minor calculation is out of scope; degree advances handled by NASA tooling.
    return to.patch - from.patch;
  }
  return to.patch - from.patch;
}

function getCurrentVersion() {
  const pkg = JSON.parse(readFileSync(resolve(REPO_ROOT, 'package.json'), 'utf8'));
  return `v${pkg.version}`;
}

const OVERDUE_THRESHOLD_SHIPS = 10;

// ─── Scan ────────────────────────────────────────────────────────────────────

function scan() {
  const currentVersion = getCurrentVersion();
  const results = [];

  for (const entry of THRESHOLDS_MANIFEST) {
    if (!entry.wired_first_caller_ship) {
      results.push({
        threshold: entry.threshold,
        status: 'UNWIRED',
        notes: entry.notes,
      });
      continue;
    }

    const wired_ships_ago = shipCountBetween(entry.wired_first_caller_ship, currentVersion);

    if (!entry.integration_test_ship) {
      // Wired but no integration test
      const overdue = wired_ships_ago !== null && wired_ships_ago > OVERDUE_THRESHOLD_SHIPS;
      results.push({
        threshold: entry.threshold,
        status: overdue ? 'OVERDUE-NO-TEST' : 'PENDING-TEST',
        wired_first_caller_ship: entry.wired_first_caller_ship,
        ships_since_wired: wired_ships_ago,
        notes: entry.notes,
      });
      continue;
    }

    // Both wired AND has integration test — measure gap
    const test_ships_after_wire = shipCountBetween(
      entry.wired_first_caller_ship,
      entry.integration_test_ship,
    );
    const overdue = test_ships_after_wire !== null && test_ships_after_wire > OVERDUE_THRESHOLD_SHIPS;
    results.push({
      threshold: entry.threshold,
      status: overdue ? 'OVERDUE-TEST-LATE' : 'COVERED',
      wired_first_caller_ship: entry.wired_first_caller_ship,
      integration_test_ship: entry.integration_test_ship,
      test_ships_after_wire,
      notes: entry.notes,
    });
  }

  return { current_version: currentVersion, threshold_count: THRESHOLDS_MANIFEST.length, results };
}

// ─── Output ──────────────────────────────────────────────────────────────────

function emitHuman(report) {
  console.log(`verify-overdue-scan @ ${report.current_version}`);
  console.log(`  threshold-axis threshold (10-ship verify-axis trigger per #10428)`);
  console.log('');

  const overdue = report.results.filter((r) => r.status.startsWith('OVERDUE'));
  const pending = report.results.filter((r) => r.status === 'PENDING-TEST');
  const covered = report.results.filter((r) => r.status === 'COVERED');
  const unwired = report.results.filter((r) => r.status === 'UNWIRED');

  console.log(`  COVERED:           ${covered.length} thresholds within 10-ship verify-axis budget`);
  console.log(`  PENDING-TEST:      ${pending.length} thresholds wired but test not yet shipped (within budget)`);
  console.log(`  OVERDUE-NO-TEST:   ${overdue.filter((r) => r.status === 'OVERDUE-NO-TEST').length} thresholds wired >10 ships ago WITHOUT integration test`);
  console.log(`  OVERDUE-TEST-LATE: ${overdue.filter((r) => r.status === 'OVERDUE-TEST-LATE').length} thresholds where integration test shipped >10 ships AFTER wire`);
  console.log(`  UNWIRED:           ${unwired.length} thresholds in registry but no production caller yet`);
  console.log('');

  for (const r of report.results) {
    const marker =
      r.status === 'COVERED' ? '✓' : r.status === 'UNWIRED' ? '·' : r.status === 'PENDING-TEST' ? '⏳' : '⚠';
    console.log(`  ${marker} ${r.threshold} [${r.status}]`);
    if (r.wired_first_caller_ship) {
      console.log(`     wired @ ${r.wired_first_caller_ship}`);
    }
    if (r.integration_test_ship) {
      console.log(`     tested @ ${r.integration_test_ship} (${r.test_ships_after_wire ?? '?'} ships after wire)`);
    } else if (r.ships_since_wired !== undefined) {
      console.log(`     ships since wired: ${r.ships_since_wired}`);
    }
  }

  console.log('');
  if (overdue.length > 0) {
    console.log(`  ✗ ${overdue.length} thresholds overdue per #10428 (10-ship verify-axis trigger).`);
    console.log(`    Action: add integration test for each OVERDUE threshold.`);
    return 1;
  }
  console.log(`  ✓ All wired thresholds within verify-axis budget.`);
  return 0;
}

function emitJson(report) {
  const overdue = report.results.filter((r) => r.status.startsWith('OVERDUE'));
  console.log(
    JSON.stringify({ ...report, overdue_count: overdue.length, clean: overdue.length === 0 }, null, 2),
  );
  return overdue.length > 0 ? 1 : 0;
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const report = scan();
  const exitCode = json ? emitJson(report) : emitHuman(report);
  process.exit(exitCode);
}

main();
