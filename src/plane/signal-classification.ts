/**
 * Signal Classification -- maps observable session patterns to concrete/abstract weights.
 *
 * The SIGNAL_WEIGHTS table covers all 12 signal types observed during sessions.
 * classifySignals aggregates signals into a SignalClassification with total
 * concrete/abstract counts and an estimated theta via atan2.
 *
 * Consumed by ObserverAngularBridge (Plan 361-02) to convert raw session
 * patterns into angular positions on the complex plane.
 */

import { estimateTheta } from './arithmetic.js';

// ============================================================================
// Types
// ============================================================================

/** A single observed signal with an optional occurrence count. */
export interface ObservationSignal {
  /** Key into SIGNAL_WEIGHTS */
  type: string;
  /** How many times this signal appeared (default 1) */
  count?: number;
}

/** Result of classifying a set of signals. */
export interface SignalClassification {
  totalConcrete: number;
  totalAbstract: number;
  /** Estimated angular position via atan2(totalAbstract, totalConcrete) */
  theta: number;
  /** Per-type occurrence counts */
  signalBreakdown: Record<string, number>;
}

// ============================================================================
// Signal Weights Table
// ============================================================================

/**
 * Weight table for the 12 known signal types.
 *
 * Concrete-heavy signals map to theta near 0 (tool-use, file-edit).
 * Abstract-heavy signals map to theta near pi/2 (reasoning, planning).
 * Mixed signals contribute to both axes.
 */
export const SIGNAL_WEIGHTS: Record<string, { concrete: number; abstract: number }> = {
  'bash_deterministic':    { concrete: 3, abstract: 0 },
  'file_change_single':    { concrete: 2, abstract: 0 },
  'tool_exact_sequence':   { concrete: 2, abstract: 0 },
  'phase_execute':         { concrete: 2, abstract: 0 },
  'file_change_multi':     { concrete: 1, abstract: 1 },
  'workflow_repetition':   { concrete: 1, abstract: 1 },
  'command_with_args':     { concrete: 1, abstract: 1 },
  'semantic_cluster':      { concrete: 0, abstract: 3 },
  'cross_project_pattern': { concrete: 0, abstract: 2 },
  'intent_description':    { concrete: 0, abstract: 2 },
  'phase_research':        { concrete: 0, abstract: 2 },
  'high_variance_output':  { concrete: 0, abstract: 2 },
};

// ============================================================================
// Classification Function
// ============================================================================

/**
 * Classify an array of observation signals into concrete/abstract totals.
 *
 * Unknown signal types are silently ignored.
 * The count field on each signal defaults to 1 if not provided.
 *
 * @param signals - Array of observation signals to classify
 * @returns SignalClassification with totals, theta, and per-type breakdown
 */
export function classifySignals(signals: ObservationSignal[]): SignalClassification {
  let totalConcrete = 0;
  let totalAbstract = 0;
  const signalBreakdown: Record<string, number> = {};

  for (const signal of signals) {
    const weights = SIGNAL_WEIGHTS[signal.type];
    if (!weights) continue; // Skip unknown signal types

    const count = signal.count ?? 1;

    totalConcrete += weights.concrete * count;
    totalAbstract += weights.abstract * count;

    signalBreakdown[signal.type] = (signalBreakdown[signal.type] ?? 0) + count;
  }

  const theta = estimateTheta(totalConcrete, totalAbstract);

  return {
    totalConcrete,
    totalAbstract,
    theta,
    signalBreakdown,
  };
}
