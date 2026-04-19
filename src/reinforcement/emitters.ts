/**
 * MA-6 Canonical Reinforcement Taxonomy — per-channel emitters.
 *
 * Thin constructor functions that produce canonical `ReinforcementEvent`
 * instances for each of the five reinforcement channels.  Each function
 * takes the channel-specific metadata the source already knows and returns
 * a fully-populated, JSON-serialisable event ready for the writer.
 *
 * Emitters are deliberately IO-free: they only build the event record.
 * The writer (`writer.ts`) is responsible for persistence.  The channel-source
 * adapters (`channel-sources.ts`) compose emitters with the writer so that
 * the originating modules (teaching / branches / umwelt / quintessence) can
 * call a single function without reaching into this module directly.
 *
 * @module reinforcement/emitters
 */

import { randomUUID } from 'node:crypto';
import {
  clampMagnitude,
  directionFromMagnitude,
  type ExplicitCorrectionMetadata,
  type OutcomeObservedMetadata,
  type BranchResolvedMetadata,
  type SurpriseTriggeredMetadata,
  type QuintessenceUpdatedMetadata,
  type ReinforcementEvent,
  type ReinforcementValue,
} from '../types/reinforcement.js';

// ─── Default sign/magnitude conventions per channel ──────────────────────────

/**
 * Explicit correction is always negative.  Magnitude scales with
 * developer-provided severity in [0, 1]; defaults to 1.0 (full magnitude).
 * Sign is fixed by the channel semantics (Barto 1983 p. 840 footnote 2:
 * an occurrence of a punishing event).
 */
export const DEFAULT_CORRECTION_MAGNITUDE = -1;

/**
 * Branch commit is positive; branch abort is negative.  Both are unit events.
 */
export const BRANCH_COMMIT_MAGNITUDE = 1;
export const BRANCH_ABORT_MAGNITUDE = -1;

/**
 * Surprise is always negative (observed-discrepancy-from-prediction).
 * Magnitude defaults to −1 but the emitter accepts a caller-provided value
 * so strong surprises can be distinguished from threshold-grazing ones.
 */
export const DEFAULT_SURPRISE_MAGNITUDE = -1;

/**
 * Quintessence axis updates are positive (the system measured itself).
 * Magnitude is neutral-leaning (+0.25) because a recomputation is a
 * structural observation, not a success outcome.
 */
export const DEFAULT_QUINTESSENCE_MAGNITUDE = 0.25;

// ─── Emission helpers ────────────────────────────────────────────────────────

function buildValue(magnitude: number): ReinforcementValue {
  const clamped = clampMagnitude(magnitude);
  return {
    magnitude: clamped,
    direction: directionFromMagnitude(clamped),
  };
}

function now(ts?: number): number {
  return ts ?? Date.now();
}

function newId(): string {
  return randomUUID();
}

// ─── explicit_correction ─────────────────────────────────────────────────────

export interface EmitExplicitCorrectionInput {
  actor: string;
  metadata: ExplicitCorrectionMetadata;
  /** Magnitude in [−1, 1]; defaults to −1. Positive values are clamped to 0. */
  magnitude?: number;
  ts?: number;
  id?: string;
}

/**
 * Emit an `explicit_correction` event.
 *
 * A positive magnitude is coerced toward 0 because a correction cannot be
 * semantically positive — the channel represents punishing feedback.
 */
export function emitExplicitCorrection(
  input: EmitExplicitCorrectionInput,
): ReinforcementEvent {
  const rawMagnitude = input.magnitude ?? DEFAULT_CORRECTION_MAGNITUDE;
  // Correction channel is intrinsically non-positive.
  const magnitude = rawMagnitude > 0 ? 0 : rawMagnitude;
  return {
    id: input.id ?? newId(),
    ts: now(input.ts),
    channel: 'explicit_correction',
    value: buildValue(magnitude),
    actor: input.actor,
    metadata: input.metadata,
  };
}

// ─── outcome_observed ────────────────────────────────────────────────────────

export interface EmitOutcomeObservedInput {
  actor: string;
  metadata: OutcomeObservedMetadata;
  /** Caller-supplied magnitude in [−1, 1]; no clamping to sign — outcome channel is bipolar. */
  magnitude: number;
  ts?: number;
  id?: string;
}

/**
 * Emit an `outcome_observed` event.  This is the one bipolar channel —
 * positive magnitudes for successes, negative for failures.  The caller
 * decides the sign from the outcome kind.
 */
export function emitOutcomeObserved(
  input: EmitOutcomeObservedInput,
): ReinforcementEvent {
  return {
    id: input.id ?? newId(),
    ts: now(input.ts),
    channel: 'outcome_observed',
    value: buildValue(input.magnitude),
    actor: input.actor,
    metadata: input.metadata,
  };
}

// ─── branch_resolved ─────────────────────────────────────────────────────────

export interface EmitBranchResolvedInput {
  actor: string;
  metadata: BranchResolvedMetadata;
  /** Override magnitude; defaults to ±1 based on the metadata's resolution. */
  magnitude?: number;
  ts?: number;
  id?: string;
}

/**
 * Emit a `branch_resolved` event.  Sign is derived from the metadata's
 * `resolution` field so callers cannot emit a "committed with negative
 * magnitude" event by accident.
 */
export function emitBranchResolved(
  input: EmitBranchResolvedInput,
): ReinforcementEvent {
  const defaultMagnitude =
    input.metadata.resolution === 'committed'
      ? BRANCH_COMMIT_MAGNITUDE
      : BRANCH_ABORT_MAGNITUDE;
  const magnitude = input.magnitude ?? defaultMagnitude;
  return {
    id: input.id ?? newId(),
    ts: now(input.ts),
    channel: 'branch_resolved',
    value: buildValue(magnitude),
    actor: input.actor,
    metadata: input.metadata,
  };
}

// ─── surprise_triggered ──────────────────────────────────────────────────────

export interface EmitSurpriseTriggeredInput {
  actor: string;
  metadata: SurpriseTriggeredMetadata;
  /** Override magnitude; defaults to −1. Positive values coerced to 0. */
  magnitude?: number;
  ts?: number;
  id?: string;
}

/**
 * Emit a `surprise_triggered` event.  Semantics: a non-positive feedback
 * signal indicating the generative model's prediction was wrong.
 */
export function emitSurpriseTriggered(
  input: EmitSurpriseTriggeredInput,
): ReinforcementEvent {
  const rawMagnitude = input.magnitude ?? DEFAULT_SURPRISE_MAGNITUDE;
  // Surprise channel is non-positive by construction.
  const magnitude = rawMagnitude > 0 ? 0 : rawMagnitude;
  return {
    id: input.id ?? newId(),
    ts: now(input.ts),
    channel: 'surprise_triggered',
    value: buildValue(magnitude),
    actor: input.actor,
    metadata: input.metadata,
  };
}

// ─── quintessence_updated ────────────────────────────────────────────────────

export interface EmitQuintessenceUpdatedInput {
  actor: string;
  metadata: QuintessenceUpdatedMetadata;
  /** Override magnitude; defaults to +0.25 (structural observation). */
  magnitude?: number;
  ts?: number;
  id?: string;
}

/**
 * Emit a `quintessence_updated` event.  Semantics: a low-magnitude
 * positive signal indicating the M8 symbiosis layer produced a fresh
 * measurement of itself.  Not a success outcome — merely a sign of life.
 */
export function emitQuintessenceUpdated(
  input: EmitQuintessenceUpdatedInput,
): ReinforcementEvent {
  const rawMagnitude = input.magnitude ?? DEFAULT_QUINTESSENCE_MAGNITUDE;
  // Quintessence channel is non-negative.
  const magnitude = rawMagnitude < 0 ? 0 : rawMagnitude;
  return {
    id: input.id ?? newId(),
    ts: now(input.ts),
    channel: 'quintessence_updated',
    value: buildValue(magnitude),
    actor: input.actor,
    metadata: input.metadata,
  };
}
