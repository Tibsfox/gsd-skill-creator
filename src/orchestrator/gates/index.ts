/**
 * GSD HITL Gate Evaluation Module
 *
 * Provides gate evaluation for the orchestrator's human-in-the-loop
 * decision points. Exports the evaluator function, type schemas,
 * and default configuration.
 */

// Type schemas, inferred types, and defaults
export {
  GateDecisionSchema,
  DEFAULT_DESTRUCTIVE_COMMANDS,
} from './types.js';
export type {
  GateDecision,
  GateEvaluatorOptions,
} from './types.js';

// Gate evaluator function
export { evaluateGate } from './gate-evaluator.js';

// Confirmation gate (mode-aware confirmation for execute-phase etc.)
export {
  evaluateConfirmationGate,
  CONFIRMATION_REQUIRED_COMMANDS,
} from './confirmation-gate.js';
export type { ConfirmationGateConfig } from './confirmation-gate.js';
