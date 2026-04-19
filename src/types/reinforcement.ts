/**
 * MA-6 Canonical Reinforcement Taxonomy — shared types.
 *
 * Defines the `ReinforcementEvent` shape and the `ReinforcementChannel`
 * enumeration over the five canonical feedback channels the Living Sensoria
 * actor-critic subgraph observes:
 *
 *   1. explicit_correction   — user corrects a skill / teach entry       (sign: −1)
 *   2. outcome_observed      — a concrete outcome (test pass/fail, etc.) (sign: ±1)
 *   3. branch_resolved       — a branch commits or aborts                (sign: ±1)
 *   4. surprise_triggered    — M7 prediction surprise exceeds threshold  (sign: −1)
 *   5. quintessence_updated  — M8 quintessence axis recomputation fires  (sign: +1)
 *
 * Sign convention (Barto, Sutton & Anderson 1983, p. 840 footnote 2):
 *   a negative value denotes the *occurrence* of a punishing event,
 *   not the *cessation* of a rewarding one.  The weight update rule
 *   in Eq. 2 consumes `r(t)` directly, so sign drives the gradient direction.
 *
 * All fields are JSON-serialisable so events round-trip through the M3 JSONL
 * writer losslessly.  The discriminated union on `channel` narrows the
 * `metadata` shape per channel at type-check time.
 *
 * Source thread: A §5 (actor-critic wire).
 * Proposal:      .planning/research/living-sensoria-refinement/proposals/MA-6-reinforcement-taxonomy.md
 *
 * @module types/reinforcement
 */

/**
 * The five canonical reinforcement channels.
 *
 * String literals (not numeric enum) so JSON serialisation is stable and
 * human-readable in the trace log.
 */
export const REINFORCEMENT_CHANNELS = [
  'explicit_correction',
  'outcome_observed',
  'branch_resolved',
  'surprise_triggered',
  'quintessence_updated',
] as const;

export type ReinforcementChannel = typeof REINFORCEMENT_CHANNELS[number];

/**
 * Canonical reinforcement value.
 *
 *   magnitude ∈ [−1, 1]
 *   sign is implied by the sign of `magnitude`:
 *     magnitude > 0 → positive reinforcement
 *     magnitude < 0 → negative reinforcement
 *     magnitude = 0 → neutral (observed-but-indeterminate)
 *
 * Direction-classification helpers on the companion record avoid callers
 * having to re-implement sign inspection.
 */
export interface ReinforcementValue {
  /** Scalar reinforcement in [−1, 1]. */
  magnitude: number;
  /** Free-text human-readable label for the direction ('positive' | 'negative' | 'neutral'). */
  direction: 'positive' | 'negative' | 'neutral';
}

/**
 * Per-channel metadata payloads.  Each shape captures the minimum context a
 * downstream consumer (MA-1 eligibility, MA-2 actor-critic, ME-4 warning)
 * needs to re-identify the event source.
 *
 * All fields are JSON-serialisable primitives.
 */
export interface ExplicitCorrectionMetadata {
  /** Teaching-ledger entry ID (when the correction was captured by M8). */
  teachEntryId?: string;
  /** Category of the correction ('correction' | 'clarification' | …). */
  category?: string;
  /** Skill that was being corrected, when known. */
  skillId?: string;
}

export interface OutcomeObservedMetadata {
  /** Outcome label ('test-pass' | 'test-fail' | 'build-green' | 'user-confirm' | string). */
  outcomeKind: string;
  /** Identifier of the work item this outcome was measured against. */
  subjectId?: string;
  /** Numeric context (e.g. test count) that influenced the magnitude. */
  count?: number;
}

export interface BranchResolvedMetadata {
  /** Branch ID that transitioned state. */
  branchId: string;
  /** Terminal state the branch reached. */
  resolution: 'committed' | 'aborted';
  /** When `committed`, the winning branch ID (may be the resolved branch itself). */
  winnerBranchId?: string;
  /** Optional diagnostic for aborted branches. */
  diagnostic?: string;
}

export interface SurpriseTriggeredMetadata {
  /** Sigma (standardised) surprise level. */
  sigma: number;
  /** Raw KL divergence at the surprise tick. */
  klDivergence: number;
  /** Threshold the sigma exceeded. */
  threshold: number;
}

export interface QuintessenceUpdatedMetadata {
  /** Axis values at the snapshot instant. */
  axes: {
    selfVsNonSelf: number;
    essentialTensions: number;
    growthAndEnergyFlow: number;
    stabilityVsNovelty: number;
    fatefulEncounters: number;
  };
}

/**
 * Canonical reinforcement event — discriminated union over `channel`.
 *
 * Each variant narrows `metadata` to the shape the emitter for that channel
 * produces; the writer and trace-log consumers treat the event as fully typed
 * rather than a bag of any-payloads.
 */
export type ReinforcementEvent =
  | {
      id: string;
      ts: number;
      channel: 'explicit_correction';
      value: ReinforcementValue;
      actor: string;
      metadata: ExplicitCorrectionMetadata;
    }
  | {
      id: string;
      ts: number;
      channel: 'outcome_observed';
      value: ReinforcementValue;
      actor: string;
      metadata: OutcomeObservedMetadata;
    }
  | {
      id: string;
      ts: number;
      channel: 'branch_resolved';
      value: ReinforcementValue;
      actor: string;
      metadata: BranchResolvedMetadata;
    }
  | {
      id: string;
      ts: number;
      channel: 'surprise_triggered';
      value: ReinforcementValue;
      actor: string;
      metadata: SurpriseTriggeredMetadata;
    }
  | {
      id: string;
      ts: number;
      channel: 'quintessence_updated';
      value: ReinforcementValue;
      actor: string;
      metadata: QuintessenceUpdatedMetadata;
    };

/**
 * Type guard — narrow an unknown value to a ReinforcementChannel.
 */
export function isReinforcementChannel(v: unknown): v is ReinforcementChannel {
  return (
    typeof v === 'string' &&
    (REINFORCEMENT_CHANNELS as readonly string[]).includes(v)
  );
}

/**
 * Derive the `direction` label from a numeric magnitude.
 * Pure helper used by both emitters (at construction time) and writer (at
 * redact/validate time) so the label is never out of sync with the sign.
 */
export function directionFromMagnitude(
  magnitude: number,
): 'positive' | 'negative' | 'neutral' {
  if (magnitude > 0) return 'positive';
  if (magnitude < 0) return 'negative';
  return 'neutral';
}

/**
 * Clamp a number to [−1, 1] — the canonical magnitude range.
 * Non-finite values are coerced to 0 (neutral).
 */
export function clampMagnitude(n: number): number {
  if (!Number.isFinite(n)) return 0;
  if (n < -1) return -1;
  if (n > 1) return 1;
  return n;
}

/**
 * Scalar extractor `r(e)` — the reinforcement signal fed into Barto 1983
 * Eq. 2 (`wᵢ(t+1) = wᵢ(t) + α·r(t)·eᵢ(t)`).
 *
 * Equivalent to `event.value.magnitude` but kept as a named export so
 * downstream consumers (MA-1 / MA-2) can cite the mapping directly without
 * reaching into the metadata layout.
 */
export function r(event: ReinforcementEvent): number {
  return event.value.magnitude;
}
