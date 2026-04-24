/**
 * Wasserstein-Hebbian adapter — plasticity-rule validator.
 *
 * Pure structural checks on a declared `PlasticityRule`. Two layers:
 *
 *   1. `validatePlasticityRule(r)` — shape check (required fields, type
 *      soundness, finite numerics). Non-opinionated about values beyond
 *      basic sanity.
 *   2. `inStableRegion(r)` — range check: learningRate ∈ (0, 1] and (if
 *      present) regularization ∈ [0, 10]. These ranges are the adapter's
 *      defensible-plausibility envelope for a Wasserstein-2 gradient-flow
 *      interpretation; ranges outside are not mathematically impossible
 *      but fall outside the regime the Tan 2026 framework commonly treats.
 *
 * @module wasserstein-hebbian/plasticity-rule
 */

import type { PlasticityRule } from './types.js';

/** Accepted range for the learning rate η. */
export const LEARNING_RATE_MIN = 0;
export const LEARNING_RATE_MAX = 1;
/** Accepted range for the entropy-regularisation weight β. */
export const REGULARIZATION_MIN = 0;
export const REGULARIZATION_MAX = 10;

export interface ValidationResult {
  ok: boolean;
  violations: string[];
}

/**
 * Structural validation of a plasticity-rule payload. Reports every
 * violation found; does not throw.
 */
export function validatePlasticityRule(r: PlasticityRule): ValidationResult {
  const violations: string[] = [];
  if (!r || typeof r !== 'object') {
    return { ok: false, violations: ['rule is not an object'] };
  }
  if (typeof r.ruleName !== 'string' || r.ruleName.length === 0) {
    violations.push('ruleName must be a non-empty string');
  }
  if (typeof r.learningRate !== 'number' || !Number.isFinite(r.learningRate)) {
    violations.push('learningRate must be a finite number');
  }
  if (
    r.regularization !== undefined &&
    (typeof r.regularization !== 'number' || !Number.isFinite(r.regularization))
  ) {
    violations.push('regularization, if present, must be a finite number');
  }
  return { ok: violations.length === 0, violations };
}

/**
 * Range check: rule's learningRate ∈ (0, 1] and (optional) regularization
 * ∈ [0, 10]. Returns `true` iff every numeric parameter present lies in
 * its plausibility envelope. Callers should first pass
 * `validatePlasticityRule(r).ok`; `inStableRegion` assumes shape is valid.
 */
export function inStableRegion(r: PlasticityRule): boolean {
  const shape = validatePlasticityRule(r);
  if (!shape.ok) return false;
  if (r.learningRate <= LEARNING_RATE_MIN) return false;
  if (r.learningRate > LEARNING_RATE_MAX) return false;
  if (r.regularization !== undefined) {
    if (r.regularization < REGULARIZATION_MIN) return false;
    if (r.regularization > REGULARIZATION_MAX) return false;
  }
  return true;
}

/**
 * Compose `validatePlasticityRule` + `inStableRegion` into a single reason
 * list consumable by the audit-finding emitter. Returns the reason strings
 * directly; empty array means rule passes both checks.
 */
export function collectInconsistencyReasons(r: PlasticityRule): string[] {
  const reasons: string[] = [];
  const shape = validatePlasticityRule(r);
  if (!shape.ok) {
    return [...shape.violations];
  }
  if (r.learningRate <= LEARNING_RATE_MIN) {
    reasons.push(`learningRate ${r.learningRate} ≤ ${LEARNING_RATE_MIN}`);
  }
  if (r.learningRate > LEARNING_RATE_MAX) {
    reasons.push(`learningRate ${r.learningRate} > ${LEARNING_RATE_MAX}`);
  }
  if (r.regularization !== undefined) {
    if (r.regularization < REGULARIZATION_MIN) {
      reasons.push(`regularization ${r.regularization} < ${REGULARIZATION_MIN}`);
    }
    if (r.regularization > REGULARIZATION_MAX) {
      reasons.push(`regularization ${r.regularization} > ${REGULARIZATION_MAX}`);
    }
  }
  return reasons;
}
