#!/usr/bin/env node
/**
 * tools/check-deadcode-ceiling.mjs
 *
 * Dead-code count ceiling / ratchet, mirroring the module-reachability and
 * check-stale-known-unwired debt-ledger discipline.
 *
 * `npm run deadcode` (knip with `--no-exit-code`) is a REPORT — it never fails,
 * so as a gate it is a no-op: dead code accumulates silently. This checker turns
 * the same report into a ratchet: it computes the meaningful finding count
 * (unused source files + unused deps + unused devDeps, matching the `deadcode`
 * script's `--exclude exports,types,...`) and BLOCKS when the count exceeds a
 * ceiling.
 *
 * The barrel wall (60 nested per-directory index.ts re-exports) is ignored in
 * knip.ts, so the count is meaningful: 6 today —
 *   src/branches/lifecycle-adapter.ts, src/hooks/session-{start,end}.ts,
 *   src/scan-arxiv/dedup-cli.ts, @mapbox/vector-tile, @types/diff.
 * Baseline + interpretation: docs/audits/2026-07-07-knip-deadcode-baseline.md.
 *
 * The ceiling only ratchets DOWN — a reduction is reported as "ceiling can drop
 * to N" (lower SC_DEADCODE_CEILING / DEFAULT_CEILING to lock the win in), a NEW
 * dead file/dep pushes the count over the ceiling and fails the gate, forcing a
 * wire-or-delete decision.
 *
 * Usage:
 *   node tools/check-deadcode-ceiling.mjs                # human-readable
 *   node tools/check-deadcode-ceiling.mjs --json         # JSON report
 *   node tools/check-deadcode-ceiling.mjs --ceiling 5    # override the ceiling
 *   SC_DEADCODE_CEILING=5 node tools/check-deadcode-ceiling.mjs
 *
 * Exit code: 0 if count <= ceiling, 1 if count > ceiling (or knip failed).
 *
 * @module tools/check-deadcode-ceiling
 */

import { execFileSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const KNIP_BIN = resolve(ROOT, 'node_modules', 'knip', 'bin', 'knip.js');

// Today's meaningful count after the knip.ts barrel-ignore. Ratchet target.
export const DEFAULT_CEILING = 6;

// Same exclusions as the `deadcode` npm script: report unused FILES + unused
// dependencies only, not the (much noisier, intentional) export/type surface.
const KNIP_ARGS = [
  '--no-config-hints',
  '--no-exit-code',
  '--exclude',
  'exports,nsExports,types,nsTypes,enumMembers,namespaceMembers',
  '--reporter',
  'json',
];

/**
 * Run knip and return the meaningful dead-code finding set.
 * @returns {{count:number, files:string[], dependencies:string[], devDependencies:string[]}}
 */
export function collectDeadcode() {
  let raw;
  try {
    raw = execFileSync(process.execPath, [KNIP_BIN, ...KNIP_ARGS], {
      cwd: ROOT,
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch (err) {
    throw new Error(`knip failed to run: ${err.message}`);
  }

  const report = JSON.parse(raw);
  const issues = report.issues ?? [];

  const files = [];
  const dependencies = [];
  const devDependencies = [];
  for (const issue of issues) {
    if ((issue.files ?? []).length > 0) files.push(issue.file);
    for (const d of issue.dependencies ?? []) dependencies.push(d.name ?? String(d));
    for (const d of issue.devDependencies ?? []) devDependencies.push(d.name ?? String(d));
  }

  return {
    count: files.length + dependencies.length + devDependencies.length,
    files,
    dependencies,
    devDependencies,
  };
}

function resolveCeiling(args) {
  const flagIdx = args.indexOf('--ceiling');
  if (flagIdx !== -1 && args[flagIdx + 1] !== undefined) {
    const n = Number.parseInt(args[flagIdx + 1], 10);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  const env = Number.parseInt(process.env.SC_DEADCODE_CEILING ?? '', 10);
  if (Number.isFinite(env) && env >= 0) return env;
  return DEFAULT_CEILING;
}

function main() {
  const args = process.argv.slice(2);
  const wantJson = args.includes('--json');
  const ceiling = resolveCeiling(args);

  let result;
  try {
    result = collectDeadcode();
  } catch (err) {
    if (wantJson) {
      process.stdout.write(JSON.stringify({ error: err.message, over: true }, null, 2) + '\n');
    } else {
      process.stderr.write(`deadcode-ceiling: ${err.message}\n`);
    }
    process.exit(1);
  }

  const { count, files, dependencies, devDependencies } = result;
  const over = count > ceiling;

  if (wantJson) {
    process.stdout.write(
      JSON.stringify({ count, ceiling, over, files, dependencies, devDependencies }, null, 2) + '\n',
    );
  } else {
    let out = `\ndeadcode ceiling: ${count} finding(s) (ceiling ${ceiling})\n`;
    for (const f of files) out += `    file  ${f}\n`;
    for (const d of dependencies) out += `    dep   ${d}\n`;
    for (const d of devDependencies) out += `    devDep ${d}\n`;
    if (over) {
      out += `\nCEILING EXCEEDED: ${count} > ${ceiling} — wire or delete the new dead code, or raise SC_DEADCODE_CEILING.\n`;
    } else if (count < ceiling) {
      out += `\nINFO: below ceiling — lower the ceiling to ${count} to lock in the reduction.\n`;
    } else {
      out += `\nat ceiling.\n`;
    }
    process.stdout.write(out);
  }

  process.exit(over ? 1 : 0);
}

// Only run when invoked directly (the test imports collectDeadcode()).
if (resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1] ?? '')) {
  main();
}
