/**
 * HITL gate evaluator for the GSD orchestrator.
 *
 * Pure function that decides whether to proceed, confirm, or block
 * before executing a classified command. Three gate types exist:
 *
 * 1. Destructive gate: Commands in the destructive set always require
 *    confirmation, regardless of mode. Never skippable.
 *
 * 2. Low-confidence gate: Classifications below the confidence threshold
 *    always require confirmation. Never skippable.
 *
 * 3. Routing gate: In YOLO mode with sufficient confidence, auto-proceeds.
 *    In interactive mode, always confirms.
 *
 * Gate priority: destructive > low-confidence > routing (first match wins).
 *
 * This is a decision function only -- it returns a GateDecision.
 * The CLI/agent layer handles user interaction.
 */

import { DEFAULT_DESTRUCTIVE_COMMANDS } from './types.js';
import type { GateDecision, GateEvaluatorOptions } from './types.js';

/**
 * Evaluate which gate applies and return the appropriate decision.
 *
 * @param commandName - The GSD command name (e.g., 'gsd:remove-phase')
 * @param mode - Current GSD mode ('yolo' or 'interactive')
 * @param confidence - Classification confidence score (0-1)
 * @param options - Optional overrides for thresholds and command sets
 * @returns GateDecision indicating the action to take
 */
export function evaluateGate(
  commandName: string,
  mode: string,
  confidence: number,
  options?: GateEvaluatorOptions,
): GateDecision {
  const destructiveCommands = options?.destructiveCommands ?? DEFAULT_DESTRUCTIVE_COMMANDS;
  const lowConfidenceThreshold = options?.lowConfidenceThreshold ?? 0.5;

  // Gate 1: Destructive commands always require confirmation
  if (destructiveCommands.has(commandName)) {
    return {
      action: 'confirm',
      reason: `"${commandName}" is a destructive command that requires explicit confirmation`,
      gateType: 'destructive',
      skippedByYolo: false,
    };
  }

  // Gate 2: Low-confidence classifications always require confirmation
  if (confidence < lowConfidenceThreshold) {
    return {
      action: 'confirm',
      reason: `Classification confidence ${confidence.toFixed(2)} is below threshold ${lowConfidenceThreshold}`,
      gateType: 'low-confidence',
      skippedByYolo: false,
    };
  }

  // Gate 3: Routing gate -- mode-dependent
  if (mode === 'yolo') {
    return {
      action: 'proceed',
      reason: `YOLO mode: auto-proceeding with "${commandName}" (confidence: ${confidence.toFixed(2)})`,
      gateType: 'routing',
      skippedByYolo: true,
    };
  }

  // Gate 4: Interactive mode -- always confirm
  return {
    action: 'confirm',
    reason: `Interactive mode: confirming "${commandName}" before execution`,
    gateType: 'routing',
    skippedByYolo: true,
  };
}
