/**
 * Runs a native implementation against oracle-captured expected outputs.
 *
 * ABSB-03: ≥10,000 test cases, zero failures for deterministic algorithms.
 *
 * Pure computation — no I/O. Caller supplies test cases.
 */

import type { OracleTestResult } from './types.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OracleTestCase {
  /** Serializable input arguments as a tuple. */
  inputs: unknown[];
  /** Expected output captured from the original package. */
  expected: unknown;
}

export interface OracleRunConfig {
  packageName: string;
  /** Whether the algorithm is deterministic (same inputs → same output). */
  isDeterministic: boolean;
  /** Minimum number of test cases required. Defaults to 10_000. */
  minimumCases?: number;
}

// ─── Core function ────────────────────────────────────────────────────────────

const DEFAULT_MINIMUM_CASES = 10_000;

/**
 * Runs nativeImpl against each test case and compares to expected.
 *
 * Returns OracleTestResult with failures count.
 * For deterministic algorithms: passes only when failures === 0 AND totalCases >= minimumCases.
 * For non-deterministic: passes when failures === 0 regardless of case count.
 */
export function runOracleVerification(
  nativeImpl: (...args: unknown[]) => unknown,
  testCases: OracleTestCase[],
  config: OracleRunConfig,
): OracleTestResult {
  const minimumCases = config.minimumCases ?? DEFAULT_MINIMUM_CASES;
  let failures = 0;

  for (const tc of testCases) {
    let actual: unknown;
    try {
      actual = nativeImpl(...tc.inputs);
    } catch {
      failures++;
      continue;
    }

    if (!deepEqual(actual, tc.expected)) {
      failures++;
    }
  }

  const totalCases = testCases.length;
  const passed = failures === 0 && (!config.isDeterministic || totalCases >= minimumCases);

  return {
    packageName: config.packageName,
    totalCases,
    failures,
    isDeterministic: config.isDeterministic,
    passedAt: passed ? new Date().toISOString() : null,
  };
}

// ─── Deep equality helper ─────────────────────────────────────────────────────

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return a === b;
  if (typeof a !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, (b as unknown[])[i]));
  }

  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;
  const aKeys = Object.keys(aObj);
  const bKeys = Object.keys(bObj);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every(k => deepEqual(aObj[k], bObj[k]));
}

// ─── Class wrapper ────────────────────────────────────────────────────────────

/** Class wrapper providing a stateful API surface for runOracleVerification. */
export class OracleVerifier {
  run(
    nativeImpl: (...args: unknown[]) => unknown,
    testCases: OracleTestCase[],
    config: OracleRunConfig,
  ): OracleTestResult {
    return runOracleVerification(nativeImpl, testCases, config);
  }
}
