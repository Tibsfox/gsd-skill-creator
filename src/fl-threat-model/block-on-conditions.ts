/**
 * FL Threat-Model Gate — block-on conditions.
 *
 * Encodes the 15 block-on conditions enumerated in the Phase 768 gate spec
 * (m4-mia-threat-model.tex § Pre-Rollout Gate Specification, subsection
 * "Block-on conditions (enumerated)").
 *
 * Each condition has a stable numeric ID (1–15), a machine key matching the
 * YAML path being tested, and a check function that returns true when the
 * condition fires (i.e. when the gate should BLOCK).
 *
 * Primary sources:
 *   arXiv:2604.19891  (Lee et al., Data-Free MIA)
 *   arXiv:2604.19915  (Lee et al., DECIFR)
 *   arXiv:2604.20020  (Lee et al., FL HW Assurance Survey)
 *
 * @module fl-threat-model/block-on-conditions
 */

import type { BlockOnCondition, DesignDoc } from './types.js';

// ============================================================================
// Internal helpers
// ============================================================================

/** Placeholder strings that are equivalent to "not set". */
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
// The 15 block-on conditions
// ============================================================================

/**
 * Checks whether block-on condition fires for the given design doc.
 * Returns true → BLOCK; false → condition is satisfied.
 */
export type BlockOnCheckFn = (doc: DesignDoc) => boolean;

export interface BlockOnEntry {
  readonly condition: BlockOnCondition;
  /** Returns true when the condition fires (gate should BLOCK). */
  readonly check: BlockOnCheckFn;
}

export const BLOCK_ON_ENTRIES: readonly BlockOnEntry[] = [
  // ─── Condition 1 ────────────────────────────────────────────────────────
  {
    condition: {
      id: 1,
      key: 'fl_threat_model.present',
      description:
        'fl_threat_model block is absent from the design doc frontmatter',
    },
    check: (doc) => doc.fl_threat_model === undefined || doc.fl_threat_model === null,
  },

  // ─── Condition 2 ────────────────────────────────────────────────────────
  {
    condition: {
      id: 2,
      key: 'fl_threat_model.mandatory_sources',
      description:
        'One or more of the three mandatory source IDs (2604.19891, 2604.19915, 2604.20020) is absent from mandatory_sources',
    },
    check: (doc) => {
      const block = doc.fl_threat_model;
      if (!block) return true;
      const sources: unknown = block.mandatory_sources;
      if (!Array.isArray(sources)) return true;
      const strs = (sources as unknown[]).map((s) =>
        typeof s === 'string' ? s : '',
      );
      const required = ['2604.19891', '2604.19915', '2604.20020'];
      return required.some((id) => !strs.some((s) => s.includes(id)));
    },
  },

  // ─── Condition 3 ────────────────────────────────────────────────────────
  {
    condition: {
      id: 3,
      key: 'fl_threat_model.mitigations.differential_privacy.enabled',
      description: 'differential_privacy.enabled is false',
    },
    check: (doc) => {
      const dp = doc.fl_threat_model?.mitigations?.differential_privacy;
      if (!dp) return true;
      return dp.enabled !== true;
    },
  },

  // ─── Condition 4 ────────────────────────────────────────────────────────
  {
    condition: {
      id: 4,
      key: 'fl_threat_model.mitigations.differential_privacy.epsilon',
      description: 'differential_privacy.epsilon is null or not a positive finite number',
    },
    check: (doc) => {
      const dp = doc.fl_threat_model?.mitigations?.differential_privacy;
      if (!dp) return true;
      return !isPositiveFiniteNumber(dp.epsilon);
    },
  },

  // ─── Condition 5 ────────────────────────────────────────────────────────
  {
    condition: {
      id: 5,
      key: 'fl_threat_model.mitigations.differential_privacy.accuracy_tradeoff_documented',
      description: 'differential_privacy.accuracy_tradeoff_documented is false',
    },
    check: (doc) => {
      const dp = doc.fl_threat_model?.mitigations?.differential_privacy;
      if (!dp) return true;
      return dp.accuracy_tradeoff_documented !== true;
    },
  },

  // ─── Condition 6 ────────────────────────────────────────────────────────
  {
    condition: {
      id: 6,
      key: 'fl_threat_model.mitigations.gradient_clipping.enabled',
      description: 'gradient_clipping.enabled is false',
    },
    check: (doc) => {
      const gc = doc.fl_threat_model?.mitigations?.gradient_clipping;
      if (!gc) return true;
      return gc.enabled !== true;
    },
  },

  // ─── Condition 7 ────────────────────────────────────────────────────────
  {
    condition: {
      id: 7,
      key: 'fl_threat_model.mitigations.gradient_clipping.clipping_norm',
      description: 'gradient_clipping.clipping_norm is null or not a positive finite number',
    },
    check: (doc) => {
      const gc = doc.fl_threat_model?.mitigations?.gradient_clipping;
      if (!gc) return true;
      return !isPositiveFiniteNumber(gc.clipping_norm);
    },
  },

  // ─── Condition 8 ────────────────────────────────────────────────────────
  {
    condition: {
      id: 8,
      key: 'fl_threat_model.mitigations.secure_aggregation.enabled',
      description: 'secure_aggregation.enabled is false',
    },
    check: (doc) => {
      const sa = doc.fl_threat_model?.mitigations?.secure_aggregation;
      if (!sa) return true;
      return sa.enabled !== true;
    },
  },

  // ─── Condition 9 ────────────────────────────────────────────────────────
  {
    condition: {
      id: 9,
      key: 'fl_threat_model.mitigations.secure_aggregation.protocol',
      description: 'secure_aggregation.protocol is empty or a placeholder',
    },
    check: (doc) => {
      const sa = doc.fl_threat_model?.mitigations?.secure_aggregation;
      if (!sa) return true;
      return isPlaceholder(sa.protocol);
    },
  },

  // ─── Condition 10 ───────────────────────────────────────────────────────
  {
    condition: {
      id: 10,
      key: 'fl_threat_model.mitigations.per_client_data_cap.enabled',
      description: 'per_client_data_cap.enabled is false',
    },
    check: (doc) => {
      const cap = doc.fl_threat_model?.mitigations?.per_client_data_cap;
      if (!cap) return true;
      return cap.enabled !== true;
    },
  },

  // ─── Condition 11 ───────────────────────────────────────────────────────
  {
    condition: {
      id: 11,
      key: 'fl_threat_model.mitigations.per_client_data_cap.cap_value',
      description: 'per_client_data_cap.cap_value is null or not a positive finite number',
    },
    check: (doc) => {
      const cap = doc.fl_threat_model?.mitigations?.per_client_data_cap;
      if (!cap) return true;
      return !isPositiveFiniteNumber(cap.cap_value);
    },
  },

  // ─── Condition 12 ───────────────────────────────────────────────────────
  {
    condition: {
      id: 12,
      key: 'fl_threat_model.mitigations.per_client_data_cap.cap_rationale',
      description: 'per_client_data_cap.cap_rationale is empty or a placeholder',
    },
    check: (doc) => {
      const cap = doc.fl_threat_model?.mitigations?.per_client_data_cap;
      if (!cap) return true;
      return isPlaceholder(cap.cap_rationale);
    },
  },

  // ─── Condition 13 ───────────────────────────────────────────────────────
  {
    condition: {
      id: 13,
      key: 'fl_threat_model.decifr_assessment.attack_class_enumerated',
      description: 'decifr_assessment.attack_class_enumerated is false',
    },
    check: (doc) => {
      const da = doc.fl_threat_model?.decifr_assessment;
      if (!da) return true;
      return da.attack_class_enumerated !== true;
    },
  },

  // ─── Condition 14 ───────────────────────────────────────────────────────
  {
    condition: {
      id: 14,
      key: 'fl_threat_model.decifr_assessment.secure_aggregation_as_primary_countermeasure',
      description:
        'decifr_assessment.secure_aggregation_as_primary_countermeasure is false',
    },
    check: (doc) => {
      const da = doc.fl_threat_model?.decifr_assessment;
      if (!da) return true;
      return da.secure_aggregation_as_primary_countermeasure !== true;
    },
  },

  // ─── Condition 15 ───────────────────────────────────────────────────────
  {
    condition: {
      id: 15,
      key: 'fl_threat_model.dolthub_delineation.unblock_conditions_documented',
      description: 'dolthub_delineation.unblock_conditions_documented is false',
    },
    check: (doc) => {
      const dd = doc.fl_threat_model?.dolthub_delineation;
      if (!dd) return true;
      return dd.unblock_conditions_documented !== true;
    },
  },
] as const;

/**
 * Evaluate all 15 block-on conditions against `doc`.
 *
 * @returns Array of entries where the condition fired (gate BLOCKS).
 */
export function evaluateBlockOnConditions(
  doc: DesignDoc,
): BlockOnEntry[] {
  return BLOCK_ON_ENTRIES.filter((e) => e.check(doc));
}
