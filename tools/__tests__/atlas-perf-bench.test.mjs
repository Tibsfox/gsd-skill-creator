/**
 * atlas-perf-bench.mjs — vitest invariant tests (v1.49.607 W4)
 *
 * 4 cases:
 *   1. Runs without error on a 1K-line fixture (small fixture for fast CI)
 *   2. --json mode produces parseable JSON with the right shape (per-language + aggregate)
 *   3. --language=ts mode benches only ts
 *   4. --strict passes when all languages clear the per-test threshold (low threshold override)
 *
 * Hermetic: uses the compiled dist/ atlas API (build must have run).
 * Run via: npx vitest run --config vitest.tools.config.mjs
 */

import { describe, it, expect } from 'vitest';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT_PATH = join(HERE, '..', 'atlas-perf-bench.mjs');

/**
 * Run atlas-perf-bench with given extra args.
 * Returns { stdout, stderr, exitCode }.
 */
function runBench(extraArgs = '') {
  const cmd = `node "${SCRIPT_PATH}" --lines=1000 ${extraArgs}`;
  try {
    const stdout = execSync(cmd, { encoding: 'utf8', timeout: 60_000 });
    return { stdout, stderr: '', exitCode: 0 };
  } catch (err) {
    return {
      stdout: err.stdout ?? '',
      stderr: err.stderr ?? '',
      exitCode: err.status ?? 1,
    };
  }
}

describe('atlas-perf-bench', () => {
  // ── Case 1: runs without error on 1K-line fixture ──────────────────────────
  it('runs without error on 1K-line fixture and prints a table', () => {
    const { exitCode, stdout } = runBench();
    expect(exitCode).toBe(0);
    // Should print language labels and PASS/FAIL status column
    expect(stdout).toContain('ts');
    expect(stdout).toContain('rust');
    expect(stdout).toContain('py');
    expect(stdout).toContain('LOC/sec');
  });

  // ── Case 2: --json mode produces correct shape ─────────────────────────────
  it('--json mode produces parseable JSON with per-language entries and aggregate', () => {
    const { exitCode, stdout } = runBench('--json');
    expect(exitCode).toBe(0);
    let parsed;
    expect(() => { parsed = JSON.parse(stdout); }).not.toThrow();

    // Top-level shape
    expect(parsed).toHaveProperty('version', '1.0.0');
    expect(parsed).toHaveProperty('targetLines', 1000);
    expect(Array.isArray(parsed.languages)).toBe(true);
    expect(parsed).toHaveProperty('aggregate');

    // Per-language entry shape
    const first = parsed.languages[0];
    expect(first).toHaveProperty('key');
    expect(first).toHaveProperty('langId');
    expect(first).toHaveProperty('label');
    expect(first).toHaveProperty('lineCount');
    expect(first).toHaveProperty('p50LocPerSec');
    expect(first).toHaveProperty('p95LocPerSec');
    expect(first).toHaveProperty('pass');
    expect(first).toHaveProperty('status');
    expect(typeof first.p50LocPerSec).toBe('number');
    expect(typeof first.p95LocPerSec).toBe('number');

    // Aggregate shape
    expect(parsed.aggregate).toHaveProperty('p50LocPerSec');
    expect(parsed.aggregate).toHaveProperty('p95LocPerSec');
    expect(parsed.aggregate).toHaveProperty('pass');
    expect(parsed.aggregate).toHaveProperty('status');

    // All 9 languages present in full-run
    expect(parsed.languages.length).toBe(9);
  });

  // ── Case 3: --language=ts benches only ts ─────────────────────────────────
  it('--language=ts mode benches only ts and returns a single-language JSON result', () => {
    const { exitCode, stdout } = runBench('--language=ts --json');
    expect(exitCode).toBe(0);
    let parsed;
    expect(() => { parsed = JSON.parse(stdout); }).not.toThrow();
    expect(parsed.languages.length).toBe(1);
    expect(parsed.languages[0].key).toBe('ts');
    // Aggregate still present
    expect(parsed).toHaveProperty('aggregate');
    expect(typeof parsed.aggregate.p50LocPerSec).toBe('number');
  });

  // ── Case 4: --strict passes with a very low threshold ─────────────────────
  it('--strict passes when threshold is set low enough for the 1K-line fixture', () => {
    // Use threshold=1 LOC/sec — any non-zero throughput should pass.
    const { exitCode, stderr } = runBench('--strict --threshold=1');
    expect(exitCode).toBe(0);
    expect(stderr).not.toContain('STRICT FAIL');
  });
});
