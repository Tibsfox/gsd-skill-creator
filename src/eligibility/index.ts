/**
 * MA-1 Eligibility-Trace Layer — barrel export.
 *
 * Re-exports the complete public API surface of the MA-1 module.
 * MA-2 (phase 655) imports from this barrel.
 *
 * @module eligibility
 */

// ─── Core types and store ─────────────────────────────────────────────────────
export type { EligibilityTrace } from './traces.js';
export { EligibilityStore, PRUNE_EPSILON } from './traces.js';

// ─── Decay kernels ────────────────────────────────────────────────────────────
export type { DecayKernelOptions } from './decay-kernels.js';
export {
  TAU_EXPLICIT_CORRECTION_MS,
  TAU_OUTCOME_OBSERVED_MS,
  TAU_BRANCH_RESOLVED_MS,
  TAU_SURPRISE_TRIGGERED_MS,
  TAU_QUINTESSENCE_UPDATED_MS,
  tauForChannel,
  decayForChannel,
  decayFromTau,
  pruneHorizonMs,
} from './decay-kernels.js';

// ─── Replay driver ────────────────────────────────────────────────────────────
export type { EligibilitySnapshot, ReplayOptions } from './replay.js';
export {
  replayEvents,
  replayReinforcementLog,
  getFinalTraces,
  getFinalTracesFromEvents,
} from './replay.js';

// ─── Read API (MA-2 consumer surface) ────────────────────────────────────────
export { EligibilityReader, buildReaderFromEvents, getTraceFor, getAllTracesAt } from './api.js';
