#!/usr/bin/env node
// Regression check for vitest bench output (v1.49.653 L-05 — CONCERNS §20).
//
// Compares `tools/bench/last-run.json` against `tools/bench/baseline.json`
// and exits non-zero if any benchmark regresses by more than the threshold
// (default 15%). Throughput is measured in hz (operations per second);
// regression means hz dropped — slower than baseline.
//
// Workflow:
//   1. `npm run bench` → writes tools/bench/last-run.json
//   2. `npm run bench:check` → compares against tools/bench/baseline.json
//
// To establish or update the baseline:
//   `node tools/bench/check.mjs --update-baseline`
//   (Copies last-run.json → baseline.json after a manual review.)
//
// Usage:
//   node tools/bench/check.mjs                          (compare + report)
//   node tools/bench/check.mjs --threshold 0.20         (20% regression tolerance)
//   node tools/bench/check.mjs --json                   (machine-readable)
//   node tools/bench/check.mjs --update-baseline        (replace baseline)
//   node tools/bench/check.mjs --strict                 (exit 1 on regression)
//
// Exit codes:
//   0  no regression OR --strict not set
//   1  regression detected AND --strict
//   2  CLI argument error
//   3  inputs missing (run `npm run bench` first)

import { existsSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

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
const LAST_RUN = resolve(REPO_ROOT, 'tools/bench/last-run.json');
const BASELINE = resolve(REPO_ROOT, 'tools/bench/baseline.json');

function parseArgs(argv) {
  const opts = {
    threshold: 0.15,
    json: false,
    updateBaseline: false,
    strict: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '-h' || a === '--help') {
      process.stdout.write(
        [
          'Usage: node tools/bench/check.mjs [options]',
          '',
          'Compares tools/bench/last-run.json (from `npm run bench`) against',
          'tools/bench/baseline.json and reports regressions.',
          '',
          'Options:',
          '  --threshold <fraction>   Max acceptable hz drop (default: 0.15 = 15%)',
          '  --json                   Emit JSON output',
          '  --update-baseline        Overwrite baseline with last-run + exit',
          '  --strict                 Exit 1 if any regression detected',
          '  -h, --help               Show usage',
          '',
        ].join('\n'),
      );
      process.exit(0);
    } else if (a === '--threshold') {
      opts.threshold = parseFloat(argv[++i]);
      if (Number.isNaN(opts.threshold) || opts.threshold <= 0 || opts.threshold >= 1) {
        process.stderr.write(`--threshold must be a fraction in (0,1); got ${argv[i]}\n`);
        process.exit(2);
      }
    } else if (a === '--json') {
      opts.json = true;
    } else if (a === '--update-baseline') {
      opts.updateBaseline = true;
    } else if (a === '--strict') {
      opts.strict = true;
    } else {
      process.stderr.write(`unknown arg: ${a}\n`);
      process.exit(2);
    }
  }
  return opts;
}

// Flatten vitest bench output into a Map<key, {hz, mean, p99}> keyed by
// "fullName::bench-name" so we can match across runs even if order changes.
function indexBenches(report) {
  const idx = new Map();
  for (const file of report.files ?? []) {
    for (const group of file.groups ?? []) {
      for (const b of group.benchmarks ?? []) {
        const key = `${group.fullName} :: ${b.name}`;
        idx.set(key, { hz: b.hz, mean: b.mean, p99: b.p99 });
      }
    }
  }
  return idx;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (!existsSync(LAST_RUN)) {
    process.stderr.write(
      `fatal: ${LAST_RUN.replace(REPO_ROOT + '/', '')} not found.\n` +
        `       Run \`npm run bench\` first.\n`,
    );
    process.exit(3);
  }

  if (opts.updateBaseline) {
    copyFileSync(LAST_RUN, BASELINE);
    process.stdout.write(
      `Updated ${BASELINE.replace(REPO_ROOT + '/', '')} from last run.\n`,
    );
    process.exit(0);
  }

  if (!existsSync(BASELINE)) {
    process.stderr.write(
      `fatal: ${BASELINE.replace(REPO_ROOT + '/', '')} not found.\n` +
        `       Run \`npm run bench && node tools/bench/check.mjs --update-baseline\`\n` +
        `       to seed the baseline from the current run.\n`,
    );
    process.exit(3);
  }

  const lastRun = JSON.parse(readFileSync(LAST_RUN, 'utf8'));
  const baseline = JSON.parse(readFileSync(BASELINE, 'utf8'));

  const lastIdx = indexBenches(lastRun);
  const baseIdx = indexBenches(baseline);

  const findings = [];
  const newKeys = [];
  const droppedKeys = [];

  for (const [key, last] of lastIdx.entries()) {
    const base = baseIdx.get(key);
    if (!base) {
      newKeys.push(key);
      continue;
    }
    const ratio = last.hz / base.hz;
    const regression = 1 - ratio; // positive = slower
    findings.push({
      key,
      baseline_hz: base.hz,
      last_hz: last.hz,
      ratio,
      regression_pct: regression * 100,
      threshold_pct: opts.threshold * 100,
      regressed: regression > opts.threshold,
    });
  }

  for (const key of baseIdx.keys()) {
    if (!lastIdx.has(key)) droppedKeys.push(key);
  }

  const regressions = findings.filter((f) => f.regressed);

  if (opts.json) {
    process.stdout.write(
      JSON.stringify(
        {
          threshold: opts.threshold,
          benchmarks_compared: findings.length,
          regressions_count: regressions.length,
          new_benchmarks: newKeys,
          dropped_benchmarks: droppedKeys,
          findings,
        },
        null,
        2,
      ),
    );
    process.stdout.write('\n');
  } else {
    process.stdout.write(`Compared ${findings.length} benchmarks against baseline (threshold: ${(opts.threshold * 100).toFixed(0)}%)\n\n`);
    for (const f of findings) {
      const ratioStr = f.ratio.toFixed(3);
      const regStr = f.regression_pct.toFixed(1).padStart(6);
      const status = f.regressed ? '[REGRESSED]' : f.regression_pct < -5 ? '[improved] ' : '[OK]       ';
      process.stdout.write(`  ${status} ${regStr}%  (${ratioStr}x)  ${f.key}\n`);
      process.stdout.write(`              baseline: ${f.baseline_hz.toFixed(0)} hz → last: ${f.last_hz.toFixed(0)} hz\n`);
    }
    if (newKeys.length > 0) {
      process.stdout.write(`\nNew benchmarks (not in baseline): ${newKeys.length}\n`);
      for (const k of newKeys) process.stdout.write(`  + ${k}\n`);
    }
    if (droppedKeys.length > 0) {
      process.stdout.write(`\nDropped benchmarks (in baseline, not in last run): ${droppedKeys.length}\n`);
      for (const k of droppedKeys) process.stdout.write(`  - ${k}\n`);
    }
    if (regressions.length > 0) {
      process.stdout.write(
        `\n${regressions.length} regression(s) exceed ${(opts.threshold * 100).toFixed(0)}% threshold.\n` +
          `To accept the new baseline, run: node tools/bench/check.mjs --update-baseline\n`,
      );
    } else {
      process.stdout.write(`\nNo regressions beyond threshold.\n`);
    }
  }

  if (opts.strict && regressions.length > 0) {
    process.exit(1);
  }
  process.exit(0);
}

main();
