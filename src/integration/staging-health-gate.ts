/**
 * StagingHealthGate — blocks installs on dry-run failure or abandoned/vulnerable critical deps.
 *
 * INTG-02: Blocks installation when dry-run fails OR abandoned/vulnerable package
 * appears in the critical path. Pure function — no I/O.
 */

import type { HealthGateResult, GateDecision } from './types.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GateCheckInput {
  /** Whether the dry-run install completed without conflicts. */
  dryRunPassed: boolean;
  /** Package names in the critical path (direct + runtime dependencies). */
  criticalPathPackages: string[];
  /** Map of packageName → health classification from the Health Diagnostician. */
  packageClassifications: Record<string, string>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** Classifications that block installation when found in the critical path. */
const BLOCKING_CLASSIFICATIONS = new Set(['abandoned', 'vulnerable']);

// ─── Core function ────────────────────────────────────────────────────────────

/**
 * Evaluates the staging health gate.
 *
 * Blocks when:
 * 1. dryRunPassed is false — installation would fail
 * 2. Any critical-path package is classified as 'abandoned' or 'vulnerable'
 *
 * All blocking findings are collected independently (no short-circuit).
 * Non-critical-path packages are never checked.
 */
export function checkHealthGate(input: GateCheckInput): HealthGateResult {
  const now = new Date().toISOString();
  const findings: string[] = [];

  if (!input.dryRunPassed) {
    findings.push('Dry-run install failed — conflicts detected before installation');
  }

  for (const pkg of input.criticalPathPackages) {
    const classification = input.packageClassifications[pkg];
    if (classification && BLOCKING_CLASSIFICATIONS.has(classification)) {
      findings.push(
        `Critical-path package '${pkg}' is classified as '${classification}' and blocks installation`,
      );
    }
  }

  const decision: GateDecision = findings.length > 0 ? 'block' : 'allow';

  return {
    decision,
    blockingFindings: findings,
    checkedAt: now,
  };
}

// ─── Class wrapper ────────────────────────────────────────────────────────────

/** Class wrapper providing a stateful API surface for checkHealthGate. */
export class StagingHealthGate {
  check(input: GateCheckInput): HealthGateResult {
    return checkHealthGate(input);
  }
}
