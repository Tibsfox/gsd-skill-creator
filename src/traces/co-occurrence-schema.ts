/**
 * JP-016 — Co-occurrence schema for skill trace events.
 *
 * Defines pairs of (trace_event_a, trace_event_b) → co-occurrence probability
 * + temporal lag. Observable from the M3 Decision-Trace Ledger event log and
 * consumed by the JP-017 MIQP+CP scheduler and JP-036 cartridge bundler.
 *
 * Anchor: arXiv:2604.21029 (RL-MPC + co-occurrence + MIQP packing).
 *
 * Phase 838, Wave 3 (JP-016).
 *
 * @module traces/co-occurrence-schema
 */

import { z } from 'zod';

// ─── Skill event reference ─────────────────────────────────────────────────────

/**
 * A reference to a single skill-activation event observed in the trace log.
 * `skillId` is the opaque skill/actor identifier; `eventType` classifies the
 * kind of trace event (e.g. activation, composition, outcome).
 */
export const SkillTraceEventSchema = z.object({
  skillId: z.string().min(1),
  eventType: z.enum(['activation', 'composition', 'outcome', 'error']),
  /** Optional trace record id for precise cross-reference. */
  traceId: z.string().uuid().optional(),
});

export type SkillTraceEvent = z.infer<typeof SkillTraceEventSchema>;

// ─── Co-occurrence pair ────────────────────────────────────────────────────────

/**
 * A single observed co-occurrence pair: two skills A and B that appear
 * together in the trace log.
 *
 * - `probability` — empirical co-occurrence probability P(B | A) in [0, 1].
 * - `temporalLagMs` — median observed time delta between event_a and event_b
 *   across all observations (milliseconds, may be negative if B precedes A).
 * - `observationCount` — number of times this pair was observed (used to
 *   weight the probability estimate; higher = more reliable).
 * - `windowMs` — observation window used when collecting this pair (default
 *   30 000 ms = 30 s).
 */
export const CoOccurrencePairSchema = z.object({
  event_a: SkillTraceEventSchema,
  event_b: SkillTraceEventSchema,
  probability: z.number().min(0).max(1),
  temporalLagMs: z.number(),
  observationCount: z.number().int().nonnegative(),
  windowMs: z.number().int().positive().default(30_000),
});

export type CoOccurrencePair = z.infer<typeof CoOccurrencePairSchema>;

// ─── Co-occurrence matrix ──────────────────────────────────────────────────────

/**
 * A collection of co-occurrence pairs derived from a trace log segment.
 *
 * - `generatedAt` — Unix ms epoch when this matrix was computed.
 * - `traceWindowStart` / `traceWindowEnd` — epoch boundaries of the trace
 *   segment that was scanned.
 * - `pairs` — the co-occurrence observations.
 */
export const CoOccurrenceMatrixSchema = z.object({
  generatedAt: z.number().int().nonnegative(),
  traceWindowStart: z.number().int().nonnegative(),
  traceWindowEnd: z.number().int().nonnegative(),
  pairs: z.array(CoOccurrencePairSchema).min(0),
});

export type CoOccurrenceMatrix = z.infer<typeof CoOccurrenceMatrixSchema>;

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Validate a raw object as a CoOccurrenceMatrix.
 * Returns a discriminated result rather than throwing.
 */
export function validateCoOccurrenceMatrix(
  raw: unknown,
): { ok: true; matrix: CoOccurrenceMatrix } | { ok: false; error: string } {
  const result = CoOccurrenceMatrixSchema.safeParse(raw);
  if (!result.success) {
    return { ok: false, error: result.error.message };
  }
  return { ok: true, matrix: result.data };
}

/**
 * Serialise a CoOccurrenceMatrix to a plain JSON-safe object.
 * All optional fields are preserved as-is.
 */
export function serializeMatrix(matrix: CoOccurrenceMatrix): unknown {
  return CoOccurrenceMatrixSchema.parse(matrix);
}

/**
 * Deserialise and validate a plain object back to a CoOccurrenceMatrix.
 * Throws a ZodError if the input is invalid.
 */
export function deserializeMatrix(raw: unknown): CoOccurrenceMatrix {
  return CoOccurrenceMatrixSchema.parse(raw);
}
