// ============================================================================
// Confirmation Gate
// ============================================================================
// Extends the base gate evaluator with mode-aware confirmation logic.
// Commands in CONFIRMATION_REQUIRED_COMMANDS require confirmation in
// non-YOLO (interactive) mode, but proceed in YOLO mode if confidence
// is sufficient. This is distinct from destructive commands which
// ALWAYS require confirmation regardless of mode.
//
// Gate priority: destructive > low-confidence > confirmation > routing

import { evaluateGate } from './gate-evaluator.js';
import type { GateDecision, GateEvaluatorOptions } from './types.js';

/**
 * Commands that require confirmation in non-YOLO mode.
 *
 * These are high-impact but not irreversible operations. In YOLO mode
 * with sufficient confidence, they auto-proceed. In interactive mode,
 * they always require explicit confirmation.
 */
export const CONFIRMATION_REQUIRED_COMMANDS: Set<string> = new Set([
  'gsd:execute-phase',
  'gsd:complete-milestone',
]);

/**
 * Configuration for the confirmation gate evaluator.
 * Extends GateEvaluatorOptions with an optional override for
 * the confirmation commands set.
 */
export interface ConfirmationGateConfig extends GateEvaluatorOptions {
  /** Override the default confirmation-required commands */
  confirmationCommands?: Set<string>;
}

/**
 * Evaluate confirmation gate with mode-aware logic.
 *
 * Extends evaluateGate by adding a confirmation layer for commands that
 * need user confirmation in non-YOLO mode. Destructive and low-confidence
 * gates take priority over the confirmation gate.
 *
 * Gate priority order:
 * 1. Destructive (always confirm, never skipped)
 * 2. Low-confidence (always confirm when below threshold)
 * 3. Confirmation (confirm in non-YOLO mode only)
 * 4. Routing (YOLO proceeds, interactive confirms)
 *
 * @param commandName - The GSD command name (e.g., 'gsd:execute-phase')
 * @param mode - Current GSD mode ('yolo' or 'interactive')
 * @param confidence - Classification confidence score (0-1)
 * @param config - Optional overrides for thresholds and command sets
 * @returns GateDecision indicating the action to take
 */
export function evaluateConfirmationGate(
  commandName: string,
  mode: string,
  confidence: number,
  config?: ConfirmationGateConfig,
): GateDecision {
  const confirmationCommands =
    config?.confirmationCommands ?? CONFIRMATION_REQUIRED_COMMANDS;

  // First, evaluate base gates (destructive, low-confidence, routing)
  const baseDecision = evaluateGate(commandName, mode, confidence, config);

  // Destructive and low-confidence gates take priority -- return as-is
  if (
    baseDecision.gateType === 'destructive' ||
    baseDecision.gateType === 'low-confidence'
  ) {
    return baseDecision;
  }

  // Confirmation gate: require confirmation in non-YOLO mode for
  // commands in the confirmation set
  if (mode !== 'yolo' && confirmationCommands.has(commandName)) {
    return {
      action: 'confirm',
      reason: `"${commandName}" requires confirmation in interactive mode`,
      gateType: 'confirmation',
      skippedByYolo: false,
    };
  }

  // Fall through to base routing decision
  return baseDecision;
}
