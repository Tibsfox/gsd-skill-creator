/**
 * M3 Decision-Trace Ledger — AMTP envelope schema.
 *
 * Provides Zod validation and canonical serialisation helpers over the
 * `DecisionTrace` shape already defined in `src/types/memory.ts`.  This
 * module does NOT redefine the type — it imports and wraps it, so the
 * shared type remains the single source of truth (OQ-4 parallel-types rule).
 *
 * AMTP (agentry/amtp-protocol.org) envelope contract:
 *   - id        — UUID v4, globally unique per trace
 *   - ts        — Unix ms epoch (number)
 *   - actor     — skill / agent / composition ID that made the decision
 *   - intent    — free-form task goal sentence
 *   - reasoning — how the actor arrived at the chosen outcome
 *   - constraints — explicit limits imposed (budget, safety, params)
 *   - alternatives — paths considered but not taken
 *   - outcome   — what was actually done (optional until resolved)
 *   - refs      — cross-references to teaching entries and graph entities
 *
 * Phase 644, Wave 1 Track D (M3).
 *
 * @module traces/schema
 */

import { z } from 'zod';
import type { DecisionTrace } from '../types/memory.js';

// ─── Zod schema ───────────────────────────────────────────────────────────────

export const DecisionTraceSchema = z.object({
  id: z.string().uuid(),
  ts: z.number().int().nonnegative(),
  actor: z.string().min(1),
  intent: z.string().min(1),
  reasoning: z.string(),
  constraints: z.array(z.string()),
  alternatives: z.array(z.string()),
  outcome: z.string().optional(),
  refs: z.object({
    teachId: z.string().optional(),
    entityIds: z.array(z.string()).optional(),
  }),
});

/** Validated DecisionTrace — identical shape to the shared type, but Zod-parsed. */
export type ValidatedDecisionTrace = z.infer<typeof DecisionTraceSchema>;

// ─── Canonical form ───────────────────────────────────────────────────────────

/**
 * Canonical form for JSONL serialisation.  All optional fields are
 * normalised to their zero-value equivalents so round-trips are lossless.
 */
export interface CanonicalDecisionTrace {
  id: string;
  ts: number;
  actor: string;
  intent: string;
  reasoning: string;
  constraints: string[];
  alternatives: string[];
  outcome: string;           // '' when not yet resolved
  refs: {
    teachId: string;         // '' when absent
    entityIds: string[];     // [] when absent
  };
}

/**
 * Convert a raw (possibly partial) `DecisionTrace` to the canonical form
 * used for JSONL storage.  Validates via Zod first; throws on invalid input.
 */
export function toCanonical(raw: DecisionTrace): CanonicalDecisionTrace {
  const validated = DecisionTraceSchema.parse(raw);
  return {
    id: validated.id,
    ts: validated.ts,
    actor: validated.actor,
    intent: validated.intent,
    reasoning: validated.reasoning,
    constraints: validated.constraints,
    alternatives: validated.alternatives,
    outcome: validated.outcome ?? '',
    refs: {
      teachId: validated.refs.teachId ?? '',
      entityIds: validated.refs.entityIds ?? [],
    },
  };
}

/**
 * Convert a `CanonicalDecisionTrace` (read from JSONL) back to the shared
 * `DecisionTrace` type.  Optional fields are omitted when they are empty.
 * Lossless round-trip: toCanonical(fromCanonical(c)) deep-equals c.
 */
export function fromCanonical(c: CanonicalDecisionTrace): DecisionTrace {
  return {
    id: c.id,
    ts: c.ts,
    actor: c.actor,
    intent: c.intent,
    reasoning: c.reasoning,
    constraints: c.constraints,
    alternatives: c.alternatives,
    outcome: c.outcome !== '' ? c.outcome : undefined,
    refs: {
      teachId: c.refs.teachId !== '' ? c.refs.teachId : undefined,
      entityIds: c.refs.entityIds.length > 0 ? c.refs.entityIds : undefined,
    },
  };
}

/**
 * Validate a raw object as a DecisionTrace.
 * Returns a typed result rather than throwing, for reader resilience.
 */
export function validateDecisionTrace(
  raw: unknown,
): { ok: true; trace: DecisionTrace } | { ok: false; error: string } {
  const result = DecisionTraceSchema.safeParse(raw);
  if (!result.success) {
    return { ok: false, error: result.error.message };
  }
  return { ok: true, trace: result.data as DecisionTrace };
}
