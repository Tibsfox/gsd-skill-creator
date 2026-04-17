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
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const TOOLS = join(REPO_ROOT, 'tools', 'release-history');

const args = process.argv.slice(2);
const fast = args.includes('--fast');
const noClassify = args.includes('--no-classify');
const publish = args.includes('--publish');
const quiet = args.includes('--quiet');

const STEPS = [
  { name: 'scan',             script: 'scan.mjs',               required: true },
  { name: 'ingest',           script: 'ingest.mjs',             required: true },
  { name: 'seed-ghosts',      script: 'seed-ghosts.mjs',        required: true },
  { name: 'ingest-deep',      script: 'ingest-deep.mjs',        required: true },
  { name: 'extract-metrics',  script: 'extract-metrics.mjs',    required: !fast },
  { name: 'extract-lessons',  script: 'extract-lessons.mjs',    required: true },
  { name: 'classify',         script: 'classify-and-track.mjs', required: !noClassify },
  { name: 'chapter',          script: 'chapter.mjs',            required: true },
  { name: 'regen-history-md', script: 'regen-history-md.mjs',   required: true },
  { name: 'audit',            script: 'audit.mjs',              required: true },
];

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
    // audit returns non-zero on FAIL; ingest returns non-zero on errors
    // scan returns 2 on drift (non-fatal) — allow
    if (step.name === 'scan' && r.status === 2) {
      if (!quiet) console.error(`[refresh] ⚠ ${step.name} reports drift (expected in flight)`);
      return { ok: true, ms, warn: true };
    }
    console.error(`[refresh] ✗ ${step.name} exit=${r.status} (${ms}ms)`);
    return { ok: false, ms, status: r.status };
  }
  if (!quiet) console.error(`[refresh] ✓ ${step.name} (${ms}ms)`);
  return { ok: true, ms };
}

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
    failed = true;
    if (step.name === 'audit') break; // audit fail is informational, keep going elsewhere
    break;
  }
}

if (publish && !failed) {
  const r = run({ name: 'publish (dry-run)', script: 'publish.mjs' });
  results.publish = r;
}

const totalMs = Object.values(results).reduce((s, r) => s + (r.ms || 0), 0);
console.log(JSON.stringify({
  overall: failed ? 'FAIL' : 'PASS',
  total_ms: totalMs,
  steps: results,
}, null, 2));
process.exit(failed ? 1 : 0);
