/**
 * P0-P3 severity scoring engine.
 *
 * Determines the actionability level for a dependency given its classification
 * and any detected conflict findings. P0 is most urgent; P3 is lowest urgency.
 */

import type { HealthSignal } from '../dependency-auditor/types.js';
import type { HealthClassification, SeverityLevel } from './types.js';
import type { ConflictFinding } from './conflict-detector.js';

export class SeverityScorer {
  score(
    signal: HealthSignal,
    classification: HealthClassification,
    conflicts: ConflictFinding[],
  ): SeverityLevel {
    return scoreSignal(signal, classification, conflicts);
  }
}

/**
 * Assign a P0-P3 severity level.
 *
 * Rules (first match wins, highest priority first):
 *
 * P0:
 *  - Classification is 'conflicting', OR
 *  - This dep appears in a ConflictFinding, OR
 *  - Vulnerable with CRITICAL/HIGH severity AND no latest version (no patch available)
 *
 * P1:
 *  - Vulnerable with CRITICAL/HIGH severity AND patch available
 *  - Abandoned
 *
 * P2:
 *  - Stale
 *  - Vulnerable with MEDIUM severity
 *
 * P3:
 *  - Aging
 *  - Healthy
 *  - Vulnerable with LOW/UNKNOWN severity
 */
export function scoreSignal(
  signal: HealthSignal,
  classification: HealthClassification,
  conflicts: ConflictFinding[],
): SeverityLevel {
  // ── P0 checks ─────────────────────────────────────────────────────────────
  if (classification === 'conflicting') return 'P0';

  const hasConflictFinding = conflicts.some(
    (c) =>
      c.packageA === signal.dependency.name ||
      c.packageB === signal.dependency.name,
  );
  if (hasConflictFinding) return 'P0';

  if (classification === 'vulnerable') {
    const vulns = signal.vulnerabilities;
    const hasCriticalOrHigh = vulns.some(
      (v) => v.severity === 'CRITICAL' || v.severity === 'HIGH',
    );
    const hasPatch = signal.registryHealth.latestVersion !== null;

    if (hasCriticalOrHigh && !hasPatch) return 'P0';
    if (hasCriticalOrHigh && hasPatch) return 'P1';

    const hasMedium = vulns.some((v) => v.severity === 'MEDIUM');
    if (hasMedium) return 'P2';

    return 'P3'; // LOW or UNKNOWN
  }

  // ── P1 checks ─────────────────────────────────────────────────────────────
  if (classification === 'abandoned') return 'P1';

  // ── P2 checks ─────────────────────────────────────────────────────────────
  if (classification === 'stale') return 'P2';

  // ── P3 (aging, healthy, and anything else) ────────────────────────────────
  return 'P3';
}
