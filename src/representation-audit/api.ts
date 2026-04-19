/**
 * MD-6 Representation Audit — Read API.
 *
 * Consumer-facing surface for M8 co-evolution to subscribe to audit results.
 * Caches the most recent AuditResult; callers poll `getLatestAuditResult()`
 * and receive the cached result or null when no audit has been run.
 *
 * The cache is intentionally process-scoped (module-level singleton).  Each
 * call to `runAndCacheAudit()` overwrites the previous entry; M8 co-evolution
 * reads the latest without triggering a new computation.
 *
 * Thread-safety: Node.js single-threaded event loop; no locking needed.
 *
 * @module representation-audit/api
 */

import { detectCollapse } from './collapse-detector.js';
import type { AuditResult } from './collapse-detector.js';
import type { DetectorInput } from './collapse-detector.js';
import type { AuditSettings } from './settings.js';

export type { AuditResult } from './collapse-detector.js';

// ─── Module-level cache ──────────────────────────────────────────────────────

let _latestResult: AuditResult | null = null;

/**
 * Return the most recent audit result, or `null` when no audit has been run
 * in this process lifetime.
 *
 * M8 co-evolution subscribers call this to read the latest diagnostic without
 * triggering recomputation.
 */
export function getLatestAuditResult(): AuditResult | null {
  return _latestResult;
}

/**
 * Clear the cached result.  Useful in tests.
 */
export function clearAuditCache(): void {
  _latestResult = null;
}

/**
 * Run the collapse detector and store the result in the module-level cache.
 *
 * @param input    Data to audit.
 * @param settings Feature flag + thresholds.
 * @returns The fresh AuditResult (also accessible via `getLatestAuditResult()`).
 */
export function runAndCacheAudit(
  input: DetectorInput,
  settings?: Partial<AuditSettings>,
): AuditResult {
  const result = detectCollapse(input, settings);
  _latestResult = result;
  return result;
}

/**
 * Whether the latest cached result is CRITICAL.
 * Returns `false` when no audit has been run or audit is disabled.
 */
export function isCritical(): boolean {
  return _latestResult?.status === 'CRITICAL';
}

/**
 * Whether the latest cached result is OK (no issues detected).
 * Returns `false` when no audit has been run or audit is disabled.
 */
export function isHealthy(): boolean {
  return _latestResult?.status === 'OK';
}
