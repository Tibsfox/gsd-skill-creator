#!/usr/bin/env node
/**
 * tools/check-tools-test-coverage.mjs — drift-guard for vitest.tools.config.mjs.
 *
 * v1.49.913 Layer-2 closure (paired with the pre-tag-gate "tools-suite" step,
 * Layer 1 — see docs/two-layer-closure-discipline.md). The tools-suite config
 * carries an EXPLICIT include list rather than a glob, because a glob would
 * sweep up node:test files that vitest cannot execute. But an explicit list
 * silently drifts: a new vitest *.test.mjs under tools/ or scripts/ that isn't
 * added to the list runs NOWHERE enforced — which is exactly how the catalog /
 * scorer / ftp tests rotted red, unseen, for weeks (v1.49.913 finding).
 *
 * This tool asserts every vitest *.test.mjs under tools/ + scripts/ is present
 * in the include list. node:test files (which use Node's built-in runner, not
 * vitest) are reported and intentionally excluded — never silently dropped
 * (#10421 no-silent-caps). A test file importing neither runner is flagged as
 * UNKNOWN and fails the check loudly (#10427 — a test that registers with no
 * runner is itself a silent-rot vector).
 *
 * Usage:
 *   node tools/check-tools-test-coverage.mjs            # human output; exit 1 on drift
 *   node tools/check-tools-test-coverage.mjs --json     # machine-readable summary
 *   node tools/check-tools-test-coverage.mjs --root=DIR # scan an alternate repo root (tests)
 *
 * Exit codes:
 *   0  all vitest test files are covered by the include list
 *   1  drift: one or more vitest files missing from the include list (or UNKNOWN runner)
 *   2  internal error (config unreadable, etc.)
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, dirname, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = resolve(HERE, '..');
const SCAN_DIRS = ['tools', 'scripts'];

const jsonMode = process.argv.includes('--json');
// --root=DIR lets the test harness point the scan at a fixture repo (#10417).
const rootArg = process.argv.find((a) => a.startsWith('--root='));
const REPO_ROOT = rootArg ? resolve(rootArg.slice('--root='.length)) : DEFAULT_ROOT;
const CONFIG_PATH = join(REPO_ROOT, 'vitest.tools.config.mjs');

/** Recursively collect *.test.mjs files under `dir` (skips node_modules). */
function collectTestFiles(absDir, acc) {
  let entries;
  try {
    entries = readdirSync(absDir, { withFileTypes: true });
  } catch {
    return acc; // dir absent — nothing to scan
  }
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name === '.git') continue;
    const abs = join(absDir, e.name);
    let isDir = e.isDirectory();
    // Resolve symlinks defensively (Dirent.isDirectory is false for symlinked dirs).
    if (!isDir && e.isSymbolicLink()) {
      try { isDir = statSync(abs).isDirectory(); } catch { isDir = false; }
    }
    if (isDir) collectTestFiles(abs, acc);
    else if (e.name.endsWith('.test.mjs')) acc.push(abs);
  }
  return acc;
}

/** Classify a test file by which runner it imports. */
function classify(absPath) {
  const src = readFileSync(absPath, 'utf8');
  // Match a REAL import statement (line-anchored at `^import`) whose binding
  // block may span multiple lines (prettier-wrapped named imports), WITHOUT
  // re-reading a runner name that appears as string data. The `[^'"\`;]*` class
  // spans newlines (it is a negated class) yet cannot cross the import's own
  // source quote, a backtick, or a statement terminator — so it can never reach
  // a `from 'node:test'` that lives inside a later template literal (#10450
  // false-positive class), nor span past one import into another statement.
  const isNodeTest = /^import\b[^'"`;]*\bfrom\s+['"]node:test['"]/m.test(src);
  const isVitest = /^import\b[^'"`;]*\bfrom\s+['"]vitest['"]/m.test(src);
  if (isNodeTest && !isVitest) return 'node:test';
  if (isVitest && !isNodeTest) return 'vitest';
  if (isVitest && isNodeTest) return 'mixed'; // ambiguous — treat as loud failure
  return 'unknown';
}

async function main() {
  // Load the include list from the live config (authoritative — no regex parsing).
  let include;
  try {
    const cfg = (await import(pathToFileURL(CONFIG_PATH).href)).default;
    include = cfg?.test?.include;
  } catch (err) {
    fail2(`cannot import ${relative(REPO_ROOT, CONFIG_PATH)}: ${err.message}`);
    return;
  }
  if (!Array.isArray(include)) {
    fail2(`vitest.tools.config.mjs has no test.include array`);
    return;
  }
  const includeSet = new Set(include.map((p) => p.replace(/^\.\//, '')));

  // Scan disk.
  const files = [];
  for (const d of SCAN_DIRS) collectTestFiles(join(REPO_ROOT, d), files);
  files.sort();

  const vitestFiles = [];
  const nodeTestFiles = [];
  const unknownFiles = [];
  for (const abs of files) {
    const rel = relative(REPO_ROOT, abs);
    const kind = classify(abs);
    if (kind === 'vitest') vitestFiles.push(rel);
    else if (kind === 'node:test') nodeTestFiles.push(rel);
    else unknownFiles.push({ file: rel, kind });
  }

  // Drift: vitest files NOT in the include list.
  const missing = vitestFiles.filter((rel) => !includeSet.has(rel));
  // Stale: include entries that no longer exist on disk.
  const onDisk = new Set(files.map((abs) => relative(REPO_ROOT, abs)));
  const stale = include
    .map((p) => p.replace(/^\.\//, ''))
    .filter((p) => p.endsWith('.test.mjs') && !onDisk.has(p));
  // Misclassified: include entries that DO exist on disk but are NOT vitest files
  // (a node:test or unknown-runner file in the vitest include list crashes the
  // suite at runtime). Layer 1 (running the suite) would catch this, but Layer 2
  // flags it directly rather than overstating its coverage.
  const nodeTestSet = new Set(nodeTestFiles);
  const unknownSet = new Set(unknownFiles.map((u) => u.file));
  const misclassifiedInclude = [...includeSet].filter(
    (p) => nodeTestSet.has(p) || unknownSet.has(p),
  );

  const ok =
    missing.length === 0 &&
    unknownFiles.length === 0 &&
    stale.length === 0 &&
    misclassifiedInclude.length === 0;
  const summary = {
    ok,
    scanned: files.length,
    vitest_count: vitestFiles.length,
    node_test_count: nodeTestFiles.length,
    include_count: includeSet.size,
    missing,
    stale,
    misclassified_include: misclassifiedInclude,
    unknown: unknownFiles,
    node_test_files: nodeTestFiles,
  };

  if (jsonMode) {
    process.stdout.write(JSON.stringify(summary, null, 2) + '\n');
  } else {
    const lines = [];
    lines.push(`[tools-test-coverage] scanned ${files.length} *.test.mjs under ${SCAN_DIRS.join('/ + ')}/`);
    lines.push(`[tools-test-coverage]   vitest: ${vitestFiles.length}  node:test (excluded): ${nodeTestFiles.length}  include-list: ${includeSet.size}`);
    if (nodeTestFiles.length) {
      lines.push(`[tools-test-coverage]   node:test files (need a 'node --test' runner, NOT vitest):`);
      for (const f of nodeTestFiles) lines.push(`[tools-test-coverage]     - ${f}`);
    }
    if (missing.length) {
      lines.push(`[tools-test-coverage] DRIFT: ${missing.length} vitest file(s) MISSING from vitest.tools.config.mjs include list:`);
      for (const f of missing) lines.push(`[tools-test-coverage]     + ${f}`);
      lines.push(`[tools-test-coverage]   These tests run NOWHERE enforced. Add them to vitest.tools.config.mjs.`);
    }
    if (stale.length) {
      lines.push(`[tools-test-coverage] STALE: ${stale.length} include entr(y/ies) point at a file not on disk:`);
      for (const f of stale) lines.push(`[tools-test-coverage]     ! ${f}`);
    }
    if (misclassifiedInclude.length) {
      lines.push(`[tools-test-coverage] MISCLASSIFIED: ${misclassifiedInclude.length} include entr(y/ies) are NOT vitest files (would crash the suite):`);
      for (const f of misclassifiedInclude) lines.push(`[tools-test-coverage]     x ${f}`);
      lines.push(`[tools-test-coverage]   Remove these from vitest.tools.config.mjs (node:test files need a 'node --test' runner).`);
    }
    if (unknownFiles.length) {
      lines.push(`[tools-test-coverage] UNKNOWN-RUNNER: ${unknownFiles.length} *.test.mjs import(s) neither 'vitest' nor 'node:test':`);
      for (const u of unknownFiles) lines.push(`[tools-test-coverage]     ? ${u.file} (${u.kind})`);
    }
    lines.push(`[tools-test-coverage] ${ok ? 'PASS — include list covers all vitest test files' : 'FAIL — include list drift detected'}`);
    process.stdout.write(lines.join('\n') + '\n');
  }

  // Flush stdout before exit (#10419 — avoid 64KB pipe-buffer truncation).
  process.stdout.write('', () => process.exit(ok ? 0 : 1));
}

function fail2(msg) {
  process.stderr.write(`[tools-test-coverage] ERROR: ${msg}\n`);
  process.exitCode = 2;
}

// ---------------------------------------------------------------------------
// node:test RUNNER mode (v1.49.914).
//
// vitest cannot execute node:test files, so before these flags they ran in NO
// gate at all (reported by `main()` but never run). The runner closes that gap,
// discovering the node:test files via the SAME `classify()` used by the report —
// single source of truth, no hardcoded list, so a new node:test file is auto-
// covered. REPO_ROOT resolution is shared with `main()` so paths are correct
// regardless of CWD.
// ---------------------------------------------------------------------------

/** Discover node:test files under SCAN_DIRS as repo-relative POSIX paths. */
function discoverNodeTestFiles() {
  const files = [];
  for (const d of SCAN_DIRS) collectTestFiles(join(REPO_ROOT, d), files);
  files.sort();
  const nodeTestFiles = [];
  for (const abs of files) {
    if (classify(abs) === 'node:test') {
      nodeTestFiles.push(relative(REPO_ROOT, abs).split('\\').join('/'));
    }
  }
  return nodeTestFiles;
}

/**
 * --print-node-test: print discovered node:test files (one repo-relative path
 * per line) to stdout, then exit 0. Same classifier as the report.
 */
function printNodeTest() {
  const nodeTestFiles = discoverNodeTestFiles();
  const out = nodeTestFiles.join('\n') + (nodeTestFiles.length ? '\n' : '');
  // Flush stdout before exit (#10419 — avoid 64KB pipe-buffer truncation).
  process.stdout.write(out, () => process.exit(0));
}

/**
 * --run-node-test: discover node:test files (same classifier) and run them via
 * Node's built-in test runner (`node --test`), inheriting stdio. Exit with the
 * child's status. If ZERO node:test files are discovered, print a notice to
 * stderr and exit 0 — an empty `node --test` invocation must never run.
 */
function runNodeTest() {
  const nodeTestFiles = discoverNodeTestFiles();
  if (nodeTestFiles.length === 0) {
    process.stderr.write(
      `[tools-test-coverage] no node:test files discovered under ${SCAN_DIRS.join('/ + ')}/ — nothing to run.\n`,
    );
    process.exit(0);
  }
  // Absolute paths so `node --test` resolves regardless of CWD.
  const absFiles = nodeTestFiles.map((rel) => join(REPO_ROOT, rel));
  const res = spawnSync(process.execPath, ['--test', ...absFiles], {
    stdio: 'inherit',
    cwd: REPO_ROOT,
  });
  process.exit(res.status == null ? 1 : res.status);
}

// ---------------------------------------------------------------------------
// Flag dispatch. Flags are independent; default (no recognized flag) behavior
// is byte-identical to the original drift-guard report.
// ---------------------------------------------------------------------------
const argv = process.argv.slice(2);
if (argv.includes('--print-node-test')) {
  printNodeTest();
} else if (argv.includes('--run-node-test')) {
  runNodeTest();
} else {
  main();
}
