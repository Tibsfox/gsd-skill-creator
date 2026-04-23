/**
 * Two-Gate Guardrail — public API.
 *
 * Default-off module shipped by Phase 712 (v1.49.570 Convergent Substrate).
 * Source paper: Wang & Dorchen 2025, arXiv:2510.04399, "On The Statistical
 * Limits of Self-Improving Agents".
 *
 * Formalizes the CAPCOM + Safety Warden split as a Two-Gate theorem:
 * a validation margin tau plus a capacity cap K[m], with an oracle inequality
 * at VC rates. All exports are pure functions; nothing runs on import.
 *
 * @module bounded-learning/two-gate
 */

export type {
  TwoGateParams,
  GateInputs,
  TwoGateResult,
  TwoGateLogRecord,
  GSDCapRealization,
} from './types.js';

export { DEFAULT_K0, DEFAULT_TAU } from './types.js';

export {
  sqrtScalingCap,
  buildParams,
  evaluateTwoGate,
  buildLogRecord,
  gsdCapRealization,
} from './gate.js';
