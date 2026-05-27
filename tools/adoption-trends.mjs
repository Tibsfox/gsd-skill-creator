#!/usr/bin/env node
/**
 * adoption-trends.mjs — multi-snapshot trend report over adoption baselines.
 *
 * Added v1.49.808 per AUDIT-2026-05-26 strengthening lever S2 (adoption
 * telemetry as design constraint, not afterthought). Consumes the per-
 * version JSON snapshots written by tools/adoption-refresh.mjs and emits a
 * trend report surfacing:
 *
 *   1. STATUS CHANGES — modules whose status changed between the oldest and
 *      newest snapshot (adoption wins, regressions, new modules, removed
 *      modules). Each change is annotated with the version where it occurred.
 *   2. PERSISTENT SHELFWARE — modules that have been `test-only` or
 *      `isolated` for ≥ ADOPTION_STALE_SHIPS (default 6) consecutive
 *      snapshots. Per the audit: "6-ship-gap from ship to first non-test
 *      caller is normal" — anything past 6 ships is shelfware-risk territory.
 *   3. NEW-MODULE WATCH — modules first observed in the most recent N
 *      snapshots (window = NEW_MODULE_WATCH_SHIPS, default 10). Their
 *      "first real caller" status is the live S2 deliverable.
 *   4. SUMMARY — counts of living / test-only / isolated over time so the
 *      population trend is visible.
 *
 * Inputs: docs/ADOPTION-BASELINE-v*.json (existing committed snapshots).
 * Output: docs/ADOPTION-TRENDS.md (regenerable; committed alongside).
 *
 * CLI flags:
 *   --check       Compare current output against the file on disk; exit 1
 *                 on drift. Pre-tag-gate uses this mode.
 *   --write       Write the report to disk (default if no flag).
 *   --since=vX.Y.Z  Only consider snapshots ≥ this version.
 *
 * Exit codes:
 *   0  no drift (--check) or write succeeded (--write)
 *   1  drift detected (--check) or fatal error
 *
 * Idempotency: re-running with no new baselines produces byte-identical output.
 *
 * Lessons applied: #10416 (lightest wire — consume existing JSON snapshots
 * rather than re-scanning); #10422 (observability/decision split — this is
 * pure observability, no decisions); #10427 (loud-fail on missing inputs).
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const args = new Set(process.argv.slice(2));
const CHECK_ONLY = args.has('--check');
const SINCE_ARG = [...args].find((a) => a.startsWith('--since='));
const SINCE = SINCE_ARG ? SINCE_ARG.slice('--since='.length) : null;

const REPO_ROOT = resolve(process.cwd());
const DOCS_DIR = resolve(REPO_ROOT, 'docs');
const OUTPUT_PATH = resolve(DOCS_DIR, 'ADOPTION-TRENDS.md');

const ADOPTION_STALE_SHIPS = Number(process.env.SC_ADOPTION_STALE_SHIPS ?? 6);
const NEW_MODULE_WATCH_SHIPS = Number(process.env.SC_NEW_MODULE_WATCH_SHIPS ?? 10);

// ─── Snapshot loading ────────────────────────────────────────────────────────

function compareVersion(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

function loadSnapshots() {
  const files = readdirSync(DOCS_DIR).filter((f) => /^ADOPTION-BASELINE-v\d+\.\d+\.\d+\.json$/.test(f));
  if (files.length === 0) {
    console.error('[adoption-trends] FATAL: no ADOPTION-BASELINE-v*.json files in docs/');
    process.exit(1);
  }
  const snapshots = [];
  for (const f of files) {
    const versionMatch = f.match(/v(\d+\.\d+\.\d+)/);
    if (!versionMatch) continue;
    const version = versionMatch[1];
    if (SINCE && compareVersion(version, SINCE) < 0) continue;
    try {
      const raw = readFileSync(resolve(DOCS_DIR, f), 'utf8');
      const modules = JSON.parse(raw);
      if (!Array.isArray(modules)) {
        console.error(`[adoption-trends] WARN: ${f} is not a JSON array, skipping`);
        continue;
      }
      snapshots.push({ version, file: f, modules });
    } catch (err) {
      console.error(`[adoption-trends] WARN: cannot parse ${f}: ${err.message}`);
    }
  }
  snapshots.sort((a, b) => compareVersion(a.version, b.version));
  return snapshots;
}

// ─── Per-module timeline assembly ────────────────────────────────────────────

/**
 * Build per-module timeline: { module -> [{version, status}, ...] }
 * Only records entries; absent versions mean the module wasn't observed
 * (introduced later, or removed).
 */
function buildTimelines(snapshots) {
  const timelines = new Map();
  for (const snap of snapshots) {
    for (const m of snap.modules) {
      const list = timelines.get(m.module) ?? [];
      list.push({ version: snap.version, status: m.status, realCallerCount: m.realCallerCount ?? 0, allowlisted: !!m.allowlisted });
      timelines.set(m.module, list);
    }
  }
  return timelines;
}

// ─── Findings ─────────────────────────────────────────────────────────────────

function findStatusChanges(timelines, snapshots) {
  const changes = [];
  for (const [module, history] of timelines) {
    if (history.length < 2) continue;
    let prevStatus = history[0].status;
    let prevVersion = history[0].version;
    for (let i = 1; i < history.length; i++) {
      const entry = history[i];
      if (entry.status !== prevStatus) {
        changes.push({
          module,
          fromStatus: prevStatus,
          toStatus: entry.status,
          fromVersion: prevVersion,
          atVersion: entry.version,
          allowlisted: entry.allowlisted,
        });
        prevStatus = entry.status;
        prevVersion = entry.version;
      }
    }
  }
  // Sort: most recent change first
  changes.sort((a, b) => compareVersion(b.atVersion, a.atVersion));
  return changes;
}

function findPersistentShelfware(timelines, snapshots) {
  if (snapshots.length === 0) return [];
  const findings = [];
  for (const [module, history] of timelines) {
    if (history.length < ADOPTION_STALE_SHIPS) continue;
    // Walk from the most recent snapshot backwards. Count consecutive
    // non-living snapshots. A module on the allowlist is not flagged.
    const recent = history.slice(-ADOPTION_STALE_SHIPS);
    if (recent[recent.length - 1].allowlisted) continue;
    if (recent.every((e) => e.status !== 'living')) {
      findings.push({
        module,
        consecutiveNonLiving: recent.length,
        currentStatus: recent[recent.length - 1].status,
        firstNonLivingSince: recent[0].version,
      });
    }
  }
  findings.sort((a, b) => a.module.localeCompare(b.module));
  return findings;
}

function findNewModuleWatch(timelines, snapshots) {
  if (snapshots.length === 0) return [];
  const recentVersions = new Set(snapshots.slice(-NEW_MODULE_WATCH_SHIPS).map((s) => s.version));
  const watch = [];
  for (const [module, history] of timelines) {
    const firstVersion = history[0].version;
    if (!recentVersions.has(firstVersion)) continue;
    const latest = history[history.length - 1];
    watch.push({
      module,
      firstObserved: firstVersion,
      shipsSinceFirstObserved: history.length,
      currentStatus: latest.status,
      currentRealCallerCount: latest.realCallerCount,
      allowlisted: latest.allowlisted,
    });
  }
  watch.sort((a, b) => compareVersion(b.firstObserved, a.firstObserved) || a.module.localeCompare(b.module));
  return watch;
}

function summarizeCounts(snapshots) {
  return snapshots.map((s) => {
    const counts = { living: 0, 'test-only': 0, isolated: 0, allowlisted: 0 };
    for (const m of s.modules) {
      if (m.allowlisted) counts.allowlisted++;
      counts[m.status] = (counts[m.status] ?? 0) + 1;
    }
    return { version: s.version, total: s.modules.length, ...counts };
  });
}

// ─── Markdown emission ───────────────────────────────────────────────────────

function emitReport(snapshots, changes, shelfware, newModules, summary) {
  const lines = [];
  lines.push('# Adoption Trends');
  lines.push('');
  lines.push(`> **Auto-generated** by \`tools/adoption-trends.mjs\` from \`docs/ADOPTION-BASELINE-v*.json\`. Run \`node tools/adoption-trends.mjs --write\` to refresh.`);
  lines.push('');
  lines.push(`**Snapshots considered:** ${snapshots.length} (\`v${snapshots[0].version}\` → \`v${snapshots[snapshots.length - 1].version}\`)`);
  lines.push(`**Shelfware threshold:** ${ADOPTION_STALE_SHIPS} consecutive non-living snapshots (override via \`SC_ADOPTION_STALE_SHIPS\`)`);
  lines.push(`**New-module watch window:** last ${NEW_MODULE_WATCH_SHIPS} snapshots (override via \`SC_NEW_MODULE_WATCH_SHIPS\`)`);
  lines.push('');

  // ── Summary section ────────────────────────────────────────────────────────
  lines.push('## Population summary');
  lines.push('');
  lines.push('| version | total | living | test-only | isolated | allowlisted |');
  lines.push('|---|---|---|---|---|---|');
  for (const s of summary) {
    lines.push(`| v${s.version} | ${s.total} | ${s.living} | ${s['test-only']} | ${s.isolated} | ${s.allowlisted} |`);
  }
  lines.push('');

  // ── Status changes ─────────────────────────────────────────────────────────
  lines.push('## Status changes');
  lines.push('');
  if (changes.length === 0) {
    lines.push('_No status changes across observed snapshots._');
  } else {
    lines.push(`${changes.length} status transition(s) across the window. Most recent first.`);
    lines.push('');
    lines.push('| module | transition | at version | note |');
    lines.push('|---|---|---|---|');
    for (const c of changes) {
      const note = c.allowlisted ? 'allowlisted' : (c.toStatus === 'living' ? '✓ adoption' : (c.toStatus === 'isolated' ? '⚠ regression' : ''));
      lines.push(`| \`${c.module}\` | ${c.fromStatus} → ${c.toStatus} | v${c.atVersion} | ${note} |`);
    }
  }
  lines.push('');

  // ── Persistent shelfware ───────────────────────────────────────────────────
  lines.push('## Persistent shelfware watch');
  lines.push('');
  if (shelfware.length === 0) {
    lines.push(`_No modules have been non-living for ≥${ADOPTION_STALE_SHIPS} consecutive snapshots._`);
  } else {
    lines.push(`${shelfware.length} module(s) with ≥${ADOPTION_STALE_SHIPS} consecutive non-living snapshots. Operator action: wire a real caller, allowlist with reason, or retire.`);
    lines.push('');
    lines.push('| module | consecutive non-living | current status | non-living since |');
    lines.push('|---|---|---|---|');
    for (const f of shelfware) {
      lines.push(`| \`${f.module}\` | ${f.consecutiveNonLiving} | ${f.currentStatus} | v${f.firstNonLivingSince} |`);
    }
  }
  lines.push('');

  // ── New-module watch ───────────────────────────────────────────────────────
  lines.push('## New-module watch');
  lines.push('');
  if (newModules.length === 0) {
    lines.push(`_No new modules first observed in the last ${NEW_MODULE_WATCH_SHIPS} snapshots._`);
  } else {
    lines.push(`${newModules.length} module(s) first observed in the last ${NEW_MODULE_WATCH_SHIPS} snapshots. Per S2: track the "first real caller" timeline for each.`);
    lines.push('');
    lines.push('| module | first observed | snapshots since | current status | real callers |');
    lines.push('|---|---|---|---|---|');
    for (const m of newModules) {
      const callersCell = m.allowlisted ? `${m.currentRealCallerCount} (allowlisted)` : `${m.currentRealCallerCount}`;
      lines.push(`| \`${m.module}\` | v${m.firstObserved} | ${m.shipsSinceFirstObserved} | ${m.currentStatus} | ${callersCell} |`);
    }
  }
  lines.push('');

  lines.push('---');
  lines.push('');
  lines.push('_Per AUDIT-2026-05-26 strengthening lever S2._ Closes the open lever from the 2026-05-26 audit retrospective.');
  lines.push('');

  return lines.join('\n');
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main() {
  const snapshots = loadSnapshots();
  if (snapshots.length === 0) {
    console.error('[adoption-trends] FATAL: no snapshots after --since filter');
    process.exit(1);
  }
  const timelines = buildTimelines(snapshots);
  const changes = findStatusChanges(timelines, snapshots);
  const shelfware = findPersistentShelfware(timelines, snapshots);
  const newModules = findNewModuleWatch(timelines, snapshots);
  const summary = summarizeCounts(snapshots);
  const report = emitReport(snapshots, changes, shelfware, newModules, summary);

  if (CHECK_ONLY) {
    if (!existsSync(OUTPUT_PATH)) {
      console.error(`[adoption-trends] CHECK: ${OUTPUT_PATH} does not exist; run --write first`);
      process.exit(1);
    }
    const existing = readFileSync(OUTPUT_PATH, 'utf8');
    if (existing === report) {
      console.log('[adoption-trends] CHECK: no drift — ADOPTION-TRENDS.md is up to date');
      process.exit(0);
    }
    console.error('[adoption-trends] CHECK: drift detected — ADOPTION-TRENDS.md does not match generated content');
    console.error('[adoption-trends] Fix: node tools/adoption-trends.mjs --write');
    process.exit(1);
  }

  writeFileSync(OUTPUT_PATH, report, 'utf8');
  console.log(`[adoption-trends] WROTE ${OUTPUT_PATH}`);
  console.log(`[adoption-trends]   snapshots: ${snapshots.length}`);
  console.log(`[adoption-trends]   status changes: ${changes.length}`);
  console.log(`[adoption-trends]   persistent shelfware: ${shelfware.length}`);
  console.log(`[adoption-trends]   new-module watch: ${newModules.length}`);
}

main();
