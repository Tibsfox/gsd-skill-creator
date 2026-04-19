/**
 * M3 Decision-Trace Ledger — activation-writer convenience wrapper.
 *
 * Convenience entry point invoked by the M5 applicator and M4 branch lifecycle
 * (both will wire to it in Phase 646).  For now the API is fully exposed and
 * call sites are defined; wiring lands in Phase 646.
 *
 * Two helper factories cover the two call-site patterns:
 *
 *   `writeActivationTrace(opts)` — single skill activation fired.
 *     Writes a DecisionTrace with kind='activation'.
 *
 *   `writeCompositionTrace(opts)` — multi-skill agent composition decided.
 *     Writes a DecisionTrace with kind='composition'.
 *
 * Both delegates to `writeTrace` in `./writer.ts`, preserving the
 * SC-M3-APPEND append-only invariant throughout.
 *
 * Phase 644, Wave 1 Track D (M3).
 * Wiring: Phase 646 (M5 applicator hook + M4 branch lifecycle).
 *
 * @module traces/activation-writer
 */

import { randomUUID } from 'node:crypto';
import { writeTrace, DEFAULT_TRACE_PATH } from './writer.js';
import type { DecisionTrace } from '../types/memory.js';
import type { CanonicalDecisionTrace } from './schema.js';

// ─── Activation trace options ────────────────────────────────────────────────

export interface ActivationTraceOptions {
  /** Skill / agent ID that fired. */
  actor: string;
  /** Goal or task the activation was serving. */
  intent: string;
  /** How the skill decided what to do. */
  reasoning: string;
  /** Constraints in effect at activation time. */
  constraints?: string[];
  /** Paths considered but not taken. */
  alternatives?: string[];
  /** Outcome description (may be filled in after completion). */
  outcome?: string;
  /** Optional reference to a teaching entry. */
  teachId?: string;
  /** Optional entity IDs from the semantic graph. */
  entityIds?: string[];
  /** Log path override (defaults to DEFAULT_TRACE_PATH). */
  logPath?: string;
  /** Timestamp override in Unix ms (defaults to Date.now()). */
  ts?: number;
}

// ─── Composition trace options ────────────────────────────────────────────────

export interface CompositionTraceOptions {
  /** Orchestrator / compositor ID. */
  actor: string;
  /** Composition goal intent. */
  intent: string;
  /** Reasoning behind the composition decision. */
  reasoning: string;
  /** Skills selected for composition. */
  selectedSkills: string[];
  /** Skills considered but rejected. */
  rejectedSkills?: string[];
  /** Constraints in effect. */
  constraints?: string[];
  /** Outcome description. */
  outcome?: string;
  /** Optional teaching reference. */
  teachId?: string;
  /** Optional entity IDs. */
  entityIds?: string[];
  /** Log path override. */
  logPath?: string;
  /** Timestamp override in Unix ms. */
  ts?: number;
}

// ─── Activation trace writer ──────────────────────────────────────────────────

/**
 * Write a trace for a single skill activation.
 *
 * Called by M5 applicator hook on every skill fire (Phase 646 wiring).
 * Returns the redacted canonical form that was written.
 */
export async function writeActivationTrace(
  opts: ActivationTraceOptions,
): Promise<CanonicalDecisionTrace> {
  const trace: DecisionTrace = {
    id: randomUUID(),
    ts: opts.ts ?? Date.now(),
    actor: opts.actor,
    intent: opts.intent,
    reasoning: opts.reasoning,
    constraints: opts.constraints ?? [],
    alternatives: opts.alternatives ?? [],
    outcome: opts.outcome,
    refs: {
      teachId: opts.teachId,
      entityIds: opts.entityIds,
    },
  };
  return writeTrace(trace, opts.logPath ?? DEFAULT_TRACE_PATH);
}

// ─── Composition trace writer ─────────────────────────────────────────────────

/**
 * Write a trace for a multi-skill agent composition decision.
 *
 * Called by M4 branch lifecycle and M5 multi-skill invocations (Phase 646).
 * Returns the redacted canonical form that was written.
 */
export async function writeCompositionTrace(
  opts: CompositionTraceOptions,
): Promise<CanonicalDecisionTrace> {
  const alternatives = opts.rejectedSkills
    ? opts.rejectedSkills.map((s) => `rejected: ${s}`)
    : [];

  const trace: DecisionTrace = {
    id: randomUUID(),
    ts: opts.ts ?? Date.now(),
    actor: opts.actor,
    intent: opts.intent,
    reasoning: opts.reasoning,
    constraints: [
      ...( opts.constraints ?? []),
      `selected-skills: ${opts.selectedSkills.join(', ')}`,
    ],
    alternatives,
    outcome: opts.outcome,
    refs: {
      teachId: opts.teachId,
      entityIds: opts.entityIds,
    },
  };
  return writeTrace(trace, opts.logPath ?? DEFAULT_TRACE_PATH);
}

// ─── ActivationWriter class ───────────────────────────────────────────────────

/**
 * Stateful wrapper for DI contexts (M5 applicator, M4 branch lifecycle).
 * Both Phase 646 wiring points will receive an ActivationWriter instance.
 */
export class ActivationWriter {
  constructor(private readonly logPath: string = DEFAULT_TRACE_PATH) {}

  /** Write a skill activation trace. */
  activation(opts: Omit<ActivationTraceOptions, 'logPath'>): Promise<CanonicalDecisionTrace> {
    return writeActivationTrace({ ...opts, logPath: this.logPath });
  }

  /** Write a multi-skill composition trace. */
  composition(opts: Omit<CompositionTraceOptions, 'logPath'>): Promise<CanonicalDecisionTrace> {
    return writeCompositionTrace({ ...opts, logPath: this.logPath });
  }
}
