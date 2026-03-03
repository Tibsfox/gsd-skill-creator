/**
 * AbsorptionCriteriaGate — verifies all four absorption criteria before proceeding.
 *
 * ABSB-01: All four criteria must pass for approval.
 * ABSB-02: Hard blocks on prohibited categories — no absorption work performed.
 *
 * Pure function — no I/O, no side effects.
 */

import type { AbsorptionCandidate, CriteriaVerdict } from './types.js';

// ─── Hard-blocked category keywords (ABSB-02) ────────────────────────────────

const HARD_BLOCKED_PATTERNS: string[] = [
  'crypto', 'cryptography', 'encryption', 'hashing', 'cipher',
  'parser', 'parsing', 'ast', 'grammar', 'tokenizer', 'lexer',
  'protocol', 'network', 'http', 'websocket', 'tcp', 'udp',
  'compression', 'zlib', 'gzip', 'brotli', 'lz4',
  'native', 'binding', 'ffi', 'napi', 'wasm',
];

export function isHardBlocked(categoryTags: string[]): boolean {
  const lower = categoryTags.map(t => t.toLowerCase());
  return HARD_BLOCKED_PATTERNS.some(pattern =>
    lower.some(tag => tag.includes(pattern))
  );
}

// ─── Criteria thresholds (ABSB-01) ───────────────────────────────────────────

const MAX_IMPLEMENTATION_LINES = 500;
const MAX_API_USAGE_RATIO = 0.20;

/**
 * Verifies all four absorption criteria.
 *
 * Hard block (ABSB-02) fires first — returns immediately if matched.
 * Soft criteria (ABSB-01) are all checked independently to collect all reasons.
 */
export function checkCriteria(candidate: AbsorptionCandidate): CriteriaVerdict {
  const now = new Date().toISOString();
  const hardBlocked = isHardBlocked(candidate.categoryTags);

  if (hardBlocked) {
    return {
      candidatePackage: candidate.packageName,
      status: 'hard-blocked',
      rejectionReasons: [
        `Package '${candidate.packageName}' matches a prohibited category and cannot be absorbed`,
      ],
      isHardBlocked: true,
      checkedAt: now,
    };
  }

  const reasons: string[] = [];

  if (candidate.implementationLines > MAX_IMPLEMENTATION_LINES) {
    reasons.push(
      `Implementation size ${candidate.implementationLines} lines exceeds 500-line limit`,
    );
  }

  if (!candidate.isAlgorithmStable) {
    reasons.push('Algorithm is not stable (breaking changes detected in last 2 years)');
  }

  if (!candidate.isPureAlgorithmic) {
    reasons.push('Implementation is not pure algorithmic (has side effects, I/O, or network calls)');
  }

  if (candidate.apiUsageRatio > MAX_API_USAGE_RATIO) {
    reasons.push(
      `API usage ratio ${(candidate.apiUsageRatio * 100).toFixed(1)}% exceeds 20% limit`,
    );
  }

  if (reasons.length > 0) {
    return {
      candidatePackage: candidate.packageName,
      status: 'rejected',
      rejectionReasons: reasons,
      isHardBlocked: false,
      checkedAt: now,
    };
  }

  return {
    candidatePackage: candidate.packageName,
    status: 'approved',
    rejectionReasons: [],
    isHardBlocked: false,
    checkedAt: now,
  };
}

// ─── Class wrapper ────────────────────────────────────────────────────────────

/** Class wrapper providing a stateful API surface for checkCriteria. */
export class AbsorptionCriteriaGate {
  check(candidate: AbsorptionCandidate): CriteriaVerdict {
    return checkCriteria(candidate);
  }
}
