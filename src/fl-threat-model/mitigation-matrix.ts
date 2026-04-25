/**
 * FL Threat-Model Gate — mandatory mitigation matrix.
 *
 * Encodes the 4-item mandatory mitigation matrix from m4-mia-threat-model.tex
 * § Mandatory Mitigation Matrix. Each mitigation has:
 *   - static metadata (name, arXiv source, what it prevents)
 *   - a check function that validates the corresponding design-doc spec block
 *     is non-trivial (not "TODO" / not empty / not null)
 *
 * Mitigations are ordered as in the spec:
 *   1. Differential privacy (noise budget)      — 2604.19891 + 2604.20020
 *   2. Gradient clipping                         — 2604.20020
 *   3. Secure aggregation                        — 2604.19915 + 2604.20020
 *   4. Per-client training-data cap              — 2604.20020
 *
 * @module fl-threat-model/mitigation-matrix
 */

import type { DesignDoc, Mitigation } from './types.js';

// ============================================================================
// Placeholder detection (shared with block-on-conditions)
// ============================================================================

const PLACEHOLDERS = new Set(['todo', 'tbd', 'n/a', 'none', '']);

function isPlaceholder(v: unknown): boolean {
  if (v === null || v === undefined) return true;
  if (typeof v === 'string') {
    return PLACEHOLDERS.has(v.trim().toLowerCase());
  }
  return false;
}

function isPositiveFiniteNumber(v: unknown): boolean {
  if (typeof v !== 'number') return false;
  return isFinite(v) && v > 0;
}

// ============================================================================
// Mitigation check result
// ============================================================================

export interface MitigationCheckResult {
  readonly mitigation: Mitigation;
  /** true iff the mitigation spec is fully present and non-trivial. */
  readonly passed: boolean;
  /** Human-readable reason for failure, undefined when passed. */
  readonly reason?: string;
}

// ============================================================================
// Mitigation check functions
// ============================================================================

function checkDifferentialPrivacy(doc: DesignDoc): MitigationCheckResult {
  const mitigation: Mitigation = {
    name: 'Differential Privacy (noise budget)',
    arXivId: 'arXiv:2604.19891',
    prevents:
      'Data reconstruction via SCLL-prior gradient-inversion MIA (2604.19891)',
  };

  const dp = doc.fl_threat_model?.mitigations?.differential_privacy;
  if (!dp) {
    return { mitigation, passed: false, reason: 'differential_privacy block is absent' };
  }
  if (dp.enabled !== true) {
    return { mitigation, passed: false, reason: 'differential_privacy.enabled must be true' };
  }
  if (isPlaceholder(dp.noise_mechanism)) {
    return {
      mitigation,
      passed: false,
      reason: 'differential_privacy.noise_mechanism must be set (e.g. "gaussian" or "laplacian")',
    };
  }
  if (!isPositiveFiniteNumber(dp.epsilon)) {
    return {
      mitigation,
      passed: false,
      reason: 'differential_privacy.epsilon must be a positive finite number',
    };
  }
  if (dp.accuracy_tradeoff_documented !== true) {
    return {
      mitigation,
      passed: false,
      reason: 'differential_privacy.accuracy_tradeoff_documented must be true',
    };
  }
  return { mitigation, passed: true };
}

function checkGradientClipping(doc: DesignDoc): MitigationCheckResult {
  const mitigation: Mitigation = {
    name: 'Gradient Clipping',
    arXivId: 'arXiv:2604.20020',
    prevents:
      'Precondition for DP: bounds ℓ₂ gradient sensitivity, enabling calibrated noise budget',
  };

  const gc = doc.fl_threat_model?.mitigations?.gradient_clipping;
  if (!gc) {
    return { mitigation, passed: false, reason: 'gradient_clipping block is absent' };
  }
  if (gc.enabled !== true) {
    return { mitigation, passed: false, reason: 'gradient_clipping.enabled must be true' };
  }
  if (!isPositiveFiniteNumber(gc.clipping_norm)) {
    return {
      mitigation,
      passed: false,
      reason: 'gradient_clipping.clipping_norm must be a positive finite number',
    };
  }
  if (gc.bias_characterised !== true) {
    return {
      mitigation,
      passed: false,
      reason: 'gradient_clipping.bias_characterised must be true',
    };
  }
  return { mitigation, passed: true };
}

function checkSecureAggregation(doc: DesignDoc): MitigationCheckResult {
  const mitigation: Mitigation = {
    name: 'Secure Aggregation',
    arXivId: 'arXiv:2604.19915',
    prevents:
      'Per-client gradient interception by DECIFR domain-aware exfiltration (2604.19915)',
  };

  const sa = doc.fl_threat_model?.mitigations?.secure_aggregation;
  if (!sa) {
    return { mitigation, passed: false, reason: 'secure_aggregation block is absent' };
  }
  if (sa.enabled !== true) {
    return { mitigation, passed: false, reason: 'secure_aggregation.enabled must be true' };
  }
  if (isPlaceholder(sa.protocol)) {
    return {
      mitigation,
      passed: false,
      reason:
        'secure_aggregation.protocol must be set (e.g. "SecAgg", "SecAgg+", "LightSecAgg")',
    };
  }
  if (sa.communication_overhead_estimated !== true) {
    return {
      mitigation,
      passed: false,
      reason: 'secure_aggregation.communication_overhead_estimated must be true',
    };
  }
  return { mitigation, passed: true };
}

function checkPerClientDataCap(doc: DesignDoc): MitigationCheckResult {
  const mitigation: Mitigation = {
    name: 'Per-Client Training-Data Cap',
    arXivId: 'arXiv:2604.20020',
    prevents:
      'Limits gradient information content; reduces reconstruction quality for MIA + DECIFR',
  };

  const cap = doc.fl_threat_model?.mitigations?.per_client_data_cap;
  if (!cap) {
    return { mitigation, passed: false, reason: 'per_client_data_cap block is absent' };
  }
  if (cap.enabled !== true) {
    return { mitigation, passed: false, reason: 'per_client_data_cap.enabled must be true' };
  }
  if (!isPositiveFiniteNumber(cap.cap_value)) {
    return {
      mitigation,
      passed: false,
      reason: 'per_client_data_cap.cap_value must be a positive finite number',
    };
  }
  if (isPlaceholder(cap.cap_rationale)) {
    return {
      mitigation,
      passed: false,
      reason: 'per_client_data_cap.cap_rationale must be a non-empty string',
    };
  }
  return { mitigation, passed: true };
}

// ============================================================================
// Public matrix
// ============================================================================

/**
 * Static metadata for the four mandatory mitigations.
 * Order matches the spec table.
 */
export const MANDATORY_MITIGATIONS: readonly Mitigation[] = [
  {
    name: 'Differential Privacy (noise budget)',
    arXivId: 'arXiv:2604.19891',
    prevents:
      'Data reconstruction via SCLL-prior gradient-inversion MIA (2604.19891)',
  },
  {
    name: 'Gradient Clipping',
    arXivId: 'arXiv:2604.20020',
    prevents:
      'Precondition for DP: bounds ℓ₂ gradient sensitivity, enabling calibrated noise budget',
  },
  {
    name: 'Secure Aggregation',
    arXivId: 'arXiv:2604.19915',
    prevents:
      'Per-client gradient interception by DECIFR domain-aware exfiltration (2604.19915)',
  },
  {
    name: 'Per-Client Training-Data Cap',
    arXivId: 'arXiv:2604.20020',
    prevents:
      'Limits gradient information content; reduces reconstruction quality for MIA + DECIFR',
  },
];

/**
 * Run all four mitigation checks against `doc`.
 *
 * @returns Array of four results, one per mitigation.
 */
export function checkMitigationMatrix(doc: DesignDoc): MitigationCheckResult[] {
  return [
    checkDifferentialPrivacy(doc),
    checkGradientClipping(doc),
    checkSecureAggregation(doc),
    checkPerClientDataCap(doc),
  ];
}

/**
 * Returns true iff all four mandatory mitigations pass.
 */
export function allMitigationsPass(doc: DesignDoc): boolean {
  return checkMitigationMatrix(doc).every((r) => r.passed);
}
