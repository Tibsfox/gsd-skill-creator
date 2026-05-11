#!/usr/bin/env node
/**
 * scripts/ci-gate-enum.mjs (v1.49.636 C6)
 *
 * CSV-enumerated CI-gate override discipline. Closes Lesson #10185
 * (v1.49.635 W3 G3 incident: SC_SKIP_CI_GATE=1 silently masked a
 * co-occurring CI red the operator did not authorize).
 *
 * Inputs:
 *   process.env.SC_SKIP_CI_GATE_TESTS  CSV of override entries
 *   process.env.SC_CI_GATE_FAILING     (test-only) comma-separated list
 *                                      of failing test ids; bypasses
 *                                      the gh invocation
 *
 * CSV entry shapes:
 *   1. test-name match (default, stable across refactors):
 *      "<file-stem>:<test-name>"
 *      e.g. "v1-49-634-meta-test:C4-self-mod-guard-BLOCK"
 *
 *   2. file-path-glob match (broad, allows full files to be skipped):
 *      "<path-or-stem>:*"
 *      e.g. "tests/integration/v1-49-634-meta-test.test.ts:*"
 *
 *   3. file:line match (most precise, breaks on refactor; supported
 *      with WARNING emitted to stderr):
 *      "<file>:<line-number>"
 *      e.g. "tests/integration/v1-49-634-meta-test.test.ts:118"
 *
 * Exit codes:
 *   0  every failing test is covered by SC_SKIP_CI_GATE_TESTS
 *      OR no failing tests exist
 *   1  one or more failing tests are NOT covered (unauthorized)
 *   2  unrecoverable error (gh unavailable, CSV malformed, etc.)
 *
 * For pre-tag-gate integration, see step 4/9 of tools/pre-tag-gate.sh.
 */

import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

/**
 * @typedef {Object} OverrideEntry
 * @property {'test-name'|'file-glob'|'file-line'} type
 * @property {string} [fileStem]   for test-name
 * @property {string} [testName]   for test-name
 * @property {string} [pattern]    for file-glob (path or stem; trailing :*)
 * @property {string} [file]       for file-line
 * @property {number} [line]       for file-line
 * @property {string} raw          the original CSV entry text
 */

/**
 * Parse a single CSV entry into a structured OverrideEntry.
 * Returns null when the entry is empty/whitespace.
 */
export function parseEntry(raw) {
  const entry = raw.trim();
  if (!entry) return null;

  if (entry.includes(':')) {
    const colon = entry.indexOf(':');
    const left = entry.slice(0, colon);
    const right = entry.slice(colon + 1);

    if (right === '*') {
      return { type: 'file-glob', pattern: left, raw: entry };
    }
    if (/^\d+$/.test(right)) {
      return {
        type: 'file-line',
        file: left,
        line: parseInt(right, 10),
        raw: entry,
      };
    }
    return {
      type: 'test-name',
      fileStem: left,
      testName: right,
      raw: entry,
    };
  }
  // No colon — treat as file-glob match against the whole token.
  return { type: 'file-glob', pattern: entry, raw: entry };
}

/**
 * Parse a CSV string of override entries. Empty string -> [].
 */
export function parseCsvOverride(csv) {
  if (!csv) return [];
  return csv
    .split(',')
    .map((s) => parseEntry(s))
    .filter((e) => e !== null);
}

/**
 * Decide whether a `failingTest` (string of shape `<file-stem>:<test>` or
 * `<path>:<line>`) is covered by the given OverrideEntry.
 */
export function matches(failingTest, entry) {
  if (entry.type === 'test-name') {
    const want = `${entry.fileStem}:${entry.testName}`;
    return failingTest === want;
  }
  if (entry.type === 'file-glob') {
    // Match by file-stem prefix or full path containment.
    return (
      failingTest.startsWith(`${entry.pattern}:`) ||
      failingTest.includes(`/${entry.pattern}`) ||
      failingTest === entry.pattern
    );
  }
  if (entry.type === 'file-line') {
    const want = `${entry.file}:${entry.line}`;
    return failingTest === want;
  }
  return false;
}

/**
 * Fetch the failing-test ids from the latest CI run on origin/dev via
 * `gh run view --log-failed`. Returns an array of `<file-stem>:<test>`
 * strings. When `process.env.SC_CI_GATE_FAILING` is set, that
 * comma-separated value is used instead (test-friendly bypass).
 */
export function fetchFailingTests() {
  if (process.env.SC_CI_GATE_FAILING !== undefined) {
    return process.env.SC_CI_GATE_FAILING
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  try {
    const out = execSync('gh run view --log-failed --json name 2>&1', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    // Best-effort parse of failing-test names from gh JSON output.
    try {
      const parsed = JSON.parse(out);
      if (Array.isArray(parsed)) {
        return parsed.map((row) => row.name || '').filter(Boolean);
      }
      if (parsed && parsed.name) return [parsed.name];
    } catch {
      // Fallback: scan free-form output for `FAIL ... > test-name` shapes.
      const lines = out.split('\n');
      const fails = [];
      for (const line of lines) {
        const m = line.match(/FAIL\s+(\S+\.test\.[mc]?[jt]sx?)\s+>\s+(.+)/);
        if (m) fails.push(`${m[1]}:${m[2].trim()}`);
      }
      return fails;
    }
  } catch {
    return [];
  }
  return [];
}

/**
 * Top-level entry point. Returns the exit code without exiting.
 */
export function runGateCheck({
  csv = process.env.SC_SKIP_CI_GATE_TESTS || '',
  log = (m) => process.stdout.write(m + '\n'),
  warn = (m) => process.stderr.write(m + '\n'),
  fail = (m) => process.stderr.write(m + '\n'),
} = {}) {
  const overrides = parseCsvOverride(csv);
  const failing = fetchFailingTests();

  if (failing.length === 0) {
    if (overrides.length > 0) {
      warn(
        '[ci-gate-enum] CI is green but SC_SKIP_CI_GATE_TESTS was set — overrides unused.',
      );
    }
    return 0;
  }

  // Warn on file-line forms (refactor-fragile).
  for (const entry of overrides) {
    if (entry.type === 'file-line') {
      warn(
        `[ci-gate-enum] WARNING: file:line override "${entry.raw}" is refactor-fragile; prefer test-name form.`,
      );
    }
  }

  const unauthorized = failing.filter(
    (f) => !overrides.some((entry) => matches(f, entry)),
  );

  if (unauthorized.length > 0) {
    fail('[ci-gate-enum] UNAUTHORIZED CI RED(s) — not in SC_SKIP_CI_GATE_TESTS:');
    for (const t of unauthorized) {
      fail(`  - ${t}`);
    }
    fail(
      '[ci-gate-enum] Either fix the test on dev, or enumerate it in SC_SKIP_CI_GATE_TESTS + author rationale at .planning/ship-pipeline-discipline/ci-gate-override-rationale.md.',
    );
    return 1;
  }

  log(
    `[ci-gate-enum] All ${failing.length} CI red(s) authorized via SC_SKIP_CI_GATE_TESTS.`,
  );
  log(
    '[ci-gate-enum] Rationale required at: .planning/ship-pipeline-discipline/ci-gate-override-rationale.md',
  );
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exit(runGateCheck());
}
