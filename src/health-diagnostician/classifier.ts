/**
 * Classification engine — maps a HealthSignal to exactly one HealthClassification
 * using priority ordering: conflicting > vulnerable > abandoned > stale > aging > healthy.
 */

import type { HealthSignal } from '../dependency-auditor/types.js';
import type {
  DiagnosisResult,
  HealthClassification,
  SeverityLevel,
} from './types.js';
import { getThresholds } from './ecosystem-thresholds.js';

// ─── Age Helper ───────────────────────────────────────────────────────────────

function computeAgeInDays(lastPublishDate: string | null): number | null {
  if (!lastPublishDate) return null;
  const publishTime = new Date(lastPublishDate).getTime();
  if (isNaN(publishTime)) return null;
  return Math.floor((Date.now() - publishTime) / (1000 * 60 * 60 * 24));
}

// ─── Severity for vulnerable ─────────────────────────────────────────────────

function vulnSeverity(
  signal: HealthSignal,
): SeverityLevel {
  const vulns = signal.vulnerabilities;
  if (vulns.length === 0) return 'P3';

  const hasCriticalOrHigh = vulns.some(
    (v) => v.severity === 'CRITICAL' || v.severity === 'HIGH',
  );
  const hasPatch = signal.registryHealth.latestVersion !== null;

  if (hasCriticalOrHigh && !hasPatch) return 'P0';
  if (hasCriticalOrHigh && hasPatch) return 'P1';

  const hasMedium = vulns.some((v) => v.severity === 'MEDIUM');
  if (hasMedium) return 'P2';

  return 'P3'; // LOW or UNKNOWN only
}

// ─── Classifier ───────────────────────────────────────────────────────────────

export class Classifier {
  classify(signal: HealthSignal): DiagnosisResult {
    return classifySignal(signal);
  }
}

/**
 * Classify a single HealthSignal.
 *
 * Priority ordering (highest wins when multiple conditions match):
 *   conflicting > vulnerable > abandoned > stale > aging > healthy
 */
export function classifySignal(signal: HealthSignal): DiagnosisResult {
  const { registryHealth, vulnerabilities } = signal;
  const eco = registryHealth.ecosystem;
  const thresholds = getThresholds(eco);
  const ageInDays = computeAgeInDays(registryHealth.lastPublishDate);
  // Cast to access internal _conflict marker injected by DiagnosticsOrchestrator
  const hasConflict = Boolean(
    (registryHealth as RegistryHealth & { _conflict?: boolean })._conflict,
  );

  // ── 1. Conflicting (highest priority) ──────────────────────────────────────
  if (hasConflict) {
    return {
      signal,
      classification: 'conflicting',
      severity: 'P0',
      rationale: `Version range conflict detected — ${registryHealth.name} has incompatible constraints with another dependency`,
      ageInDays,
    };
  }

  // ── 2. Vulnerable ──────────────────────────────────────────────────────────
  if (vulnerabilities.length > 0) {
    const sev = vulnSeverity(signal);
    const topVuln = vulnerabilities.find(
      (v) => v.severity === 'CRITICAL' || v.severity === 'HIGH',
    ) ?? vulnerabilities[0];
    return {
      signal,
      classification: 'vulnerable',
      severity: sev,
      rationale: `Active ${topVuln.severity} vulnerability: ${topVuln.summary}`,
      ageInDays,
    };
  }

  // ── 3. Abandoned ───────────────────────────────────────────────────────────
  if (registryHealth.isArchived) {
    return {
      signal,
      classification: 'abandoned',
      severity: 'P1',
      rationale: 'Package archived — considered abandoned',
      ageInDays,
    };
  }
  if (ageInDays !== null && ageInDays > thresholds.abandonedDays) {
    return {
      signal,
      classification: 'abandoned',
      severity: 'P1',
      rationale: `No publish in ${ageInDays} days — exceeds ${eco} abandoned threshold of ${thresholds.abandonedDays} days`,
      ageInDays,
    };
  }

  // ── 4. Stale ───────────────────────────────────────────────────────────────
  if (registryHealth.isDeprecated) {
    return {
      signal,
      classification: 'stale',
      severity: 'P2',
      rationale: `Package is deprecated — classified as stale`,
      ageInDays,
    };
  }
  if (ageInDays !== null && ageInDays > thresholds.staleDays) {
    return {
      signal,
      classification: 'stale',
      severity: 'P2',
      rationale: `No publish in ${ageInDays} days — exceeds ${eco} stale threshold of ${thresholds.staleDays} days`,
      ageInDays,
    };
  }

  // ── 5. Aging ───────────────────────────────────────────────────────────────
  if (ageInDays !== null && ageInDays > thresholds.agingDays) {
    return {
      signal,
      classification: 'aging',
      severity: 'P3',
      rationale: `No publish in ${ageInDays} days — exceeds ${eco} aging threshold of ${thresholds.agingDays} days`,
      ageInDays,
    };
  }

  // ── 6. Healthy ─────────────────────────────────────────────────────────────
  const ageDesc =
    ageInDays !== null ? `published ${ageInDays} days ago` : 'publish date unknown';
  return {
    signal,
    classification: 'healthy',
    severity: 'P3',
    rationale: `Package is healthy — ${ageDesc}, no known vulnerabilities`,
    ageInDays,
  };
}

// Type import for internal use
import type { RegistryHealth } from '../dependency-auditor/types.js';
