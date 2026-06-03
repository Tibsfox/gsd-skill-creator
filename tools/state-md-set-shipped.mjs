#!/usr/bin/env node
/**
 * state-md-set-shipped.mjs — atomic writer for post-T14 STATE.md reset.
 *
 * Closes the v805→v806 STATE.md drift class that v807 only partially addressed.
 * v807 added a post-write check at pre-tag-gate step 0.5 that detects when
 * STATE.md isn't normalized, but that only catches drift AFTER it lands. This
 * tool eliminates the drift class at source: instead of operators hand-editing
 * STATE.md and then running the normalizer (the v805→v806 wedge), they invoke
 * this tool once with milestone metadata and it emits a fully-normalized
 * STATE.md atomically. No hand-edit window, no drift possible.
 *
 * Per the v810-814 chain handoff: "Complete closure would require running the
 * normalizer at the END of T14's reset step, not just at the START of the next
 * pre-tag-gate." This tool is the END-of-T14 normalizer integration.
 *
 * Usage:
 *   node tools/state-md-set-shipped.mjs \
 *     --version v1.49.813 \
 *     --name "Post-T14-reset STATE.md drift closure" \
 *     --degree 1.178 \
 *     --predecessor v1.49.812 \
 *     --predecessor-sha d30de2b4c \
 *     [--counter-cadence]            # mark this ship as counter-cadence
 *     [--predecessor-counter-cadence] # mark predecessor as counter-cadence
 *     [--check]                       # exit 1 if would change, no write
 *
 * Exit codes:
 *   0  STATE.md written + normalize-check confirms normalized state
 *   1  Drift detected (--check), invalid args, or normalize failed
 *   2  I/O error
 *
 * Idempotency: re-running with the same args produces identical output.
 *
 * Schema reference: docs/STATE-MD-SCHEMA.md
 */

import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const jsYaml = require('js-yaml');

const REPO_ROOT = resolve(process.cwd());
const STATE_PATH = resolve(REPO_ROOT, '.planning', 'STATE.md');
const NORMALIZER_PATH = resolve(REPO_ROOT, 'tools', 'state-md-normalizer.mjs');
const BACKUP_CLEANER_PATH = resolve(REPO_ROOT, 'tools', 'state-md-clean-backups.mjs');

// YAML-safe scalar emission via js-yaml. Strings with ':', '#', leading-'-',
// or other YAML-significant chars get auto-quoted (single-quoted form);
// safe strings stay unquoted. Closes the v815 milestone_name colon footgun:
// hand-interpolating `${name}` broke the YAML parse when name contained ':'.
function yamlScalar(value) {
  return jsYaml.dump(value, { lineWidth: -1 }).trimEnd();
}

// ─── arg parsing ──────────────────────────────────────────────────────────

function parseArgs(argv) {
  const out = {
    version: null,
    name: null,
    degree: null,
    predecessor: null,
    predecessorSha: null,
    counterCadence: false,
    predecessorCounterCadence: false,
    check: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case '--version': out.version = argv[++i]; break;
      case '--name': out.name = argv[++i]; break;
      case '--degree': out.degree = argv[++i]; break;
      case '--predecessor': out.predecessor = argv[++i]; break;
      case '--predecessor-sha': out.predecessorSha = argv[++i]; break;
      case '--counter-cadence': out.counterCadence = true; break;
      case '--predecessor-counter-cadence': out.predecessorCounterCadence = true; break;
      case '--check': out.check = true; break;
      default:
        if (a?.startsWith('--')) {
          throw new Error(`Unknown flag: ${a}`);
        }
    }
  }
  return out;
}

function validateArgs(a) {
  const missing = [];
  if (!a.version) missing.push('--version');
  if (!a.name) missing.push('--name');
  if (!a.degree) missing.push('--degree');
  if (!a.predecessor) missing.push('--predecessor');
  if (!a.predecessorSha) missing.push('--predecessor-sha');
  if (missing.length > 0) {
    throw new Error(`Missing required flags: ${missing.join(', ')}`);
  }
  if (!/^v\d+\.\d+\.\d+$/.test(a.version)) {
    throw new Error(`--version must match vMAJOR.MINOR.PATCH (got ${JSON.stringify(a.version)})`);
  }
  if (!/^v\d+\.\d+\.\d+$/.test(a.predecessor)) {
    throw new Error(`--predecessor must match vMAJOR.MINOR.PATCH (got ${JSON.stringify(a.predecessor)})`);
  }
  if (!/^[0-9a-f]{7,40}$/i.test(a.predecessorSha)) {
    throw new Error(`--predecessor-sha must be 7-40 hex chars (got ${JSON.stringify(a.predecessorSha)})`);
  }
  if (!/^\d+(\.\d+)?$/.test(a.degree)) {
    throw new Error(`--degree must be NUM or NUM.NUM (got ${JSON.stringify(a.degree)})`);
  }
}

// ─── content builder ──────────────────────────────────────────────────────

export function buildShippedStateContent({
  version,
  name,
  degree,
  predecessor,
  predecessorSha,
  counterCadence,
  predecessorCounterCadence,
  date = new Date().toISOString().slice(0, 10),
  lastUpdated = new Date().toISOString().replace(/\.\d+Z$/, '.000Z'),
}) {
  // Strip leading 'v' for milestone fields per schema convention.
  const versionNoV = version.replace(/^v/, '');
  return `---
gsd_state_version: "1.0"
milestone: v${versionNoV}
milestone_name: ${yamlScalar(name)}
status: shipped
counter_cadence: ${counterCadence}
nasa_degree: "${degree}"
predecessor:
  milestone: ${predecessor}
  shipped_at_tag: ${predecessor}
  shipped_at_sha: ${predecessorSha}
  counter_cadence: ${predecessorCounterCadence}
opened_on: "${date}"
shipped_at: "${date}"
last_updated: "${lastUpdated}"
progress:
  total_phases: 1
  completed_phases: 1
  total_plans: 0
  completed_plans: 0
  percent: 100
---

## Current Position

Milestone: **v${versionNoV} — ${name}**
Status: SHIPPED
Opened: ${date}
Shipped: ${date}

## Engine state baseline at v${versionNoV} open

- **Predecessor milestone:** ${predecessor} (tag: ${predecessor}, sha: ${predecessorSha})
- **Predecessor counter-cadence:** ${predecessorCounterCadence}
- **NASA degree at open:** ${degree}
`;
}

// ─── main ─────────────────────────────────────────────────────────────────

function main() {
  let a;
  try {
    a = parseArgs(process.argv.slice(2));
    validateArgs(a);
  } catch (err) {
    console.error(`[state-md-set-shipped] ${err.message}`);
    process.exit(1);
  }

  if (a.check) {
    if (!existsSync(STATE_PATH)) {
      console.error('[state-md-set-shipped] CHECK: STATE.md does not exist; would write.');
      process.exit(1);
    }
    const current = readFileSync(STATE_PATH, 'utf8');
    // --check semantics: "does the file match the canonical shape for this
    // milestone?", not "does it match what I'd regenerate at this exact
    // moment?". Use the file's own last_updated so the comparison is
    // time-deterministic; otherwise --check is racy by wall-clock.
    const lastUpdatedMatch = current.match(/^last_updated:\s*"([^"]+)"/m);
    const desiredCheck = buildShippedStateContent({
      ...a,
      lastUpdated: lastUpdatedMatch ? lastUpdatedMatch[1] : undefined,
    });
    if (current === desiredCheck) {
      console.log('[state-md-set-shipped] CHECK: STATE.md matches desired shipped state.');
      process.exit(0);
    }
    console.error('[state-md-set-shipped] CHECK: STATE.md differs from desired shipped state.');
    process.exit(1);
  }

  const desired = buildShippedStateContent(a);

  // Atomic write — the content is built fully-normalized by construction; no
  // hand-edit window where drift can be introduced.
  writeFileSync(STATE_PATH, desired, 'utf8');

  // Belt-and-suspenders: confirm normalizer agrees the content is canonical.
  // If the normalizer would change it, our template + normalizer disagree
  // and the normalizer wins — re-emit via normalizer to land in canonical form.
  // Then re-check. This costs one extra normalizer invocation per call but
  // guarantees the post-condition is "STATE.md is normalized."
  const writeResult = spawnSync('node', [NORMALIZER_PATH, '--write'], {
    cwd: REPO_ROOT,
    stdio: 'pipe',
  });
  if (writeResult.status !== 0) {
    console.error('[state-md-set-shipped] normalizer --write failed:');
    if (writeResult.stderr) console.error(writeResult.stderr.toString());
    process.exit(2);
  }

  const checkResult = spawnSync('node', [NORMALIZER_PATH, '--check'], {
    cwd: REPO_ROOT,
    stdio: 'pipe',
  });
  if (checkResult.status !== 0) {
    console.error('[state-md-set-shipped] post-write normalize-check FAILED:');
    if (checkResult.stderr) console.error(checkResult.stderr.toString());
    process.exit(2);
  }

  // SOURCE ELIMINATOR (v1.49.961 / counter-cadence #28): the normalizer --write
  // above leaves a timestamped `.planning/STATE.md.backup-before-normalize-*` on
  // any actual rewrite, and citation-debt apply-diff leaves `.bak.*` siblings —
  // historically cleaned by a forgettable manual `rm`. Self-clean them here (the
  // END-of-T14 reset point) so they never accumulate; the matching pre-tag-gate
  // detector blocks any that slip through. Best-effort: a cleanup hiccup warns
  // but does not fail the reset (the detector is the backstop at the next ship).
  const cleanResult = spawnSync('node', [BACKUP_CLEANER_PATH, '--write'], {
    cwd: REPO_ROOT,
    stdio: 'pipe',
  });
  if (cleanResult.status !== 0) {
    console.warn('[state-md-set-shipped] WARN: backup self-clean exited non-zero (non-fatal):');
    if (cleanResult.stderr) console.warn(cleanResult.stderr.toString());
  }

  console.log(`[state-md-set-shipped] WROTE STATE.md for ${a.version} + normalize-check PASS`);
}

// Only run main when invoked as a script (not when imported for tests).
const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  main();
}
