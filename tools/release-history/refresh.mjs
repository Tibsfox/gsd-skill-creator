#!/usr/bin/env node
// Refresh — one-shot pipeline runner. Idempotent.
//
// Runs in order:
//   1. scan.mjs            — reconcile filesystem vs RELEASE-HISTORY.md
//   2. ingest.mjs          — release table
//   3. ingest-deep.mjs     — feature + retrospective tables
//   4. extract-metrics.mjs — metric table
//   5. extract-lessons.mjs — lesson table
//   6. classify-and-track.mjs — rule-based classifier + tracker
//   7. chapter.mjs         — regenerate .planning/roadmap/ chapters
//   8. audit.mjs           — verify
//
// Skips steps that would duplicate work; each underlying tool is idempotent.
//
// Flags:
//   --fast        skip extract-metrics (expensive scan), keep the rest
//   --no-classify skip the classifier step (useful if LLM work in progress)
//   --publish     also run publisher dry-run at the end
//   --quiet       suppress per-step output

import { spawnSync } from 'node:child_process';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const TOOLS = join(REPO_ROOT, 'tools', 'release-history');

const args = process.argv.slice(2);
const fast = args.includes('--fast');
const noClassify = args.includes('--no-classify');
const publish = args.includes('--publish');
const quiet = args.includes('--quiet');

const STEPS = [
  { name: 'scan',              script: 'scan.mjs',                required: true },
  { name: 'ingest',            script: 'ingest.mjs',              required: true },
  { name: 'seed-ghosts',       script: 'seed-ghosts.mjs',         required: true },
  { name: 'ingest-deep',       script: 'ingest-deep.mjs',         required: true },
  { name: 'backfill-git-stats',script: 'backfill-git-stats.mjs',  required: true },
  { name: 'extract-metrics',   script: 'extract-metrics.mjs',     required: !fast },
  { name: 'extract-lessons',   script: 'extract-lessons.mjs',     required: true },
  { name: 'classify',          script: 'classify-and-track.mjs',  required: !noClassify },
  { name: 'classify-types',    script: 'classify-types.mjs',      required: true },
  { name: 'chapter',           script: 'chapter.mjs',             required: true },
  { name: 'score',             script: 'score-completeness.mjs',  required: true },
  { name: 'regen-history-md',  script: 'regen-history-md.mjs',    required: true },
  { name: 'reconcile',         script: 'pipeline-reconciler.mjs', required: true },
  { name: 'drift-check',       script: 'quality-drift-check.mjs', required: true },
  // `audit` MUST remain the final step. main()'s loop breaks on the first
  // non-advisory failure, and audit is a load-bearing verification gate (AC
  // checks incl. the AC7 leak-scan), so any step appended after it would be
  // skipped whenever an earlier step fails. Keep audit last.
  { name: 'audit',             script: 'audit.mjs',               required: true },
];

// Advisory (non-fatal) step exits — these report a CONDITION, not a failure,
// and must NOT abort the pipeline:
//   scan        exits 2 on filesystem-vs-RELEASE-HISTORY drift (expected in flight)
//   drift-check exits 1 on quality drift — advisory per scripts/release-history-
//               refresh.sh's documented contract ("1 = drift-check warned ...
//               advisory, not a blocker"). Before v1.49.916 refresh.mjs treated
//               this by-design exit-1 as a pipeline failure, aborting BEFORE the
//               final `audit` step and reporting overall FAIL on every drift —
//               which is what the v915 handoff misread as a "PG-credential bug".
// Anything else non-zero is a real failure. NOTE: drift-check exit 2 is a FATAL
// crash (e.g. unresolved PG credentials → the resolvePgCredentials throw) and is
// deliberately NOT advisory — it stays fatal so a genuine credential break still
// aborts the pipeline.
export function isAdvisoryExit(stepName, status) {
  if (stepName === 'scan' && status === 2) return true;
  if (stepName === 'drift-check' && status === 1) return true;
  return false;
}

function run(step) {
  const start = Date.now();
  if (!quiet) console.error(`[refresh] ▶ ${step.name}`);
  const r = spawnSync('node', [join(TOOLS, step.script)], {
    encoding: 'utf8',
    env: process.env,
    stdio: quiet ? ['ignore', 'pipe', 'pipe'] : ['ignore', 'inherit', 'inherit'],
    timeout: 600000,
  });
  const ms = Date.now() - start;
  if (r.status !== 0 && r.status !== null) {
    // audit returns non-zero on FAIL; ingest returns non-zero on errors.
    // Advisory exits (scan drift / drift-check quality drift) are non-fatal.
    if (isAdvisoryExit(step.name, r.status)) {
      const note = step.name === 'scan'
        ? 'reports drift (expected in flight)'
        : 'reports quality drift (advisory, non-blocking)';
      if (!quiet) console.error(`[refresh] ⚠ ${step.name} ${note}`);
      return { ok: true, ms, warn: true };
    }
    console.error(`[refresh] ✗ ${step.name} exit=${r.status} (${ms}ms)`);
    return { ok: false, ms, status: r.status };
  }
  if (!quiet) console.error(`[refresh] ✓ ${step.name} (${ms}ms)`);
  return { ok: true, ms };
}

function main() {
  let failed = false;
  const results = {};
  for (const step of STEPS) {
    if (!step.required) {
      if (!quiet) console.error(`[refresh] — skipping ${step.name} (flag)`);
      results[step.name] = { skipped: true };
      continue;
    }
    const r = run(step);
    results[step.name] = r;
    if (!r.ok) {
      // Any non-advisory step failure aborts the pipeline. `audit` (the final
      // step) is a load-bearing verification gate — it runs the AC checks
      // including the AC7 leak-scan, so a failure there is fatal and loud
      // (failure-mode-contracts #10427), exactly like every other required
      // step. Truly advisory exits (scan drift, drift-check quality drift) are
      // filtered out by isAdvisoryExit() before they reach here.
      failed = true;
      break;
    }
  }

  if (publish && !failed) {
    const r = run({ name: 'publish (dry-run)', script: 'publish.mjs' });
    results.publish = r;
  }

  const totalMs = Object.values(results).reduce((s, r) => s + (r.ms || 0), 0);
  const warned = Object.values(results).some(r => r && r.warn);
  console.log(JSON.stringify({
    overall: failed ? 'FAIL' : warned ? 'PASS (with advisories)' : 'PASS',
    total_ms: totalMs,
    steps: results,
  }, null, 2));
  process.exit(failed ? 1 : 0);
}

// Entrypoint guard: run the pipeline ONLY when invoked as a CLI, never on
// import — so tests can import isAdvisoryExit without spawning the whole
// pipeline (same import-time-side-effect hardening v915 applied to chapter.mjs).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
