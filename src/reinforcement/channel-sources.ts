/**
 * MA-6 Canonical Reinforcement Taxonomy — channel-source adapters.
 *
 * Thin facades that compose `emitters.ts` (pure construction) with
 * `writer.ts` (IO) so upstream modules — teaching, branches, umwelt,
 * quintessence — can emit canonical events with a single function call
 * and without knowing where the log lives.
 *
 * Each adapter follows the same shape:
 *   1. Build the event via the matching emitter.
 *   2. Write it through the shared M3-surface writer.
 *   3. Return the event (redacted and normalised) on success;
 *      swallow write errors with a console.warn so callers never crash
 *      because reinforcement logging failed (fail-open on emission errors,
 *      matching Barto 1983's "reinforcement is feedback, not control").
 *
 * Dependency direction (one-way):
 *   teaching.ts / commit.ts / abort.ts / prediction.ts / quintessence.ts
 *     → channel-sources.ts
 *     → emitters.ts + writer.ts
 *     → mesh/event-log.ts
 *
 * @module reinforcement/channel-sources
 */

import {
  emitBranchResolved,
  emitExplicitCorrection,
  emitOutcomeObserved,
  emitQuintessenceUpdated,
  emitSurpriseTriggered,
  type EmitBranchResolvedInput,
  type EmitExplicitCorrectionInput,
  type EmitOutcomeObservedInput,
  type EmitQuintessenceUpdatedInput,
  type EmitSurpriseTriggeredInput,
} from './emitters.js';
import {
  DEFAULT_REINFORCEMENT_PATH,
  writeReinforcementEvent,
} from './writer.js';
import type { ReinforcementEvent } from '../types/reinforcement.js';

// ─── Shared options ──────────────────────────────────────────────────────────

export interface ChannelSourceOptions {
  /** Override the log path — tests and alternate storage use this. */
  logPath?: string;
  /** When true, a write failure rethrows; default is to swallow + warn. */
  strict?: boolean;
}

// ─── Fail-open helper ────────────────────────────────────────────────────────

/**
 * When set, all emissions go to this path instead of
 * DEFAULT_REINFORCEMENT_PATH.  Tests use this to keep a per-suite fixture
 * log without plumbing `logPath` through every production caller.
 */
const ENV_LOG_PATH = 'REINFORCEMENT_LOG_PATH';

/**
 * When set truthy, emissions are suppressed entirely — the emitter still
 * returns the structured event but no IO is attempted.  Vitest sets VITEST=true
 * automatically; that is treated as an implicit "suppress by default" signal
 * so existing test suites that do not pass `logPath` do not accumulate
 * garbage under `.planning/traces/` at the repo root.
 *
 * Opt back in per-test by setting REINFORCEMENT_EMIT=1 or by passing a
 * non-default logPath through the channel options.
 */
function shouldSuppressEmission(opts: ChannelSourceOptions): boolean {
  if (opts.logPath) return false; // explicit path — always write
  if (process.env['REINFORCEMENT_EMIT'] === '1') return false;
  if (process.env['VITEST']) return true;
  if (process.env['NODE_ENV'] === 'test') return true;
  return false;
}

async function writeOrWarn(
  event: ReinforcementEvent,
  opts: ChannelSourceOptions,
): Promise<ReinforcementEvent> {
  if (shouldSuppressEmission(opts)) return event;

  const logPath =
    opts.logPath ?? process.env[ENV_LOG_PATH] ?? DEFAULT_REINFORCEMENT_PATH;

  try {
    return await writeReinforcementEvent(event, logPath);
  } catch (err) {
    if (opts.strict) throw err;
    // Fail-open: log the failure but return the unpersisted event so
    // callers always get a structured record back (useful for in-process
    // consumers like MA-1 eligibility that do not require durable storage).
    // eslint-disable-next-line no-console
    console.warn(
      `[reinforcement] failed to persist ${event.channel} event: ${String(err)}`,
    );
    return event;
  }
}

// ─── Channel sources ────────────────────────────────────────────────────────

/**
 * Record an `explicit_correction` event from the symbiosis/teaching channel.
 * Wrap a call to this immediately after a teach entry is committed.
 */
export async function recordExplicitCorrection(
  input: EmitExplicitCorrectionInput,
  opts: ChannelSourceOptions = {},
): Promise<ReinforcementEvent> {
  const event = emitExplicitCorrection(input);
  return writeOrWarn(event, opts);
}

/**
 * Record an `outcome_observed` event.  Callers pass the magnitude sign that
 * reflects whether the outcome was a success (+) or failure (−).
 */
export async function recordOutcomeObserved(
  input: EmitOutcomeObservedInput,
  opts: ChannelSourceOptions = {},
): Promise<ReinforcementEvent> {
  const event = emitOutcomeObserved(input);
  return writeOrWarn(event, opts);
}

/**
 * Record a `branch_resolved` event.  Sign is derived from the metadata's
 * `resolution` field; callers only need to populate the metadata shape.
 */
export async function recordBranchResolved(
  input: EmitBranchResolvedInput,
  opts: ChannelSourceOptions = {},
): Promise<ReinforcementEvent> {
  const event = emitBranchResolved(input);
  return writeOrWarn(event, opts);
}

/**
 * Record a `surprise_triggered` event from the M7 umwelt channel.
 * Only call when the surprise entry's `triggered` flag is true.
 */
export async function recordSurpriseTriggered(
  input: EmitSurpriseTriggeredInput,
  opts: ChannelSourceOptions = {},
): Promise<ReinforcementEvent> {
  const event = emitSurpriseTriggered(input);
  return writeOrWarn(event, opts);
}

/**
 * Record a `quintessence_updated` event from the M8 symbiosis channel.
 * Fire once per axis recomputation — not once per axis read.
 */
export async function recordQuintessenceUpdated(
  input: EmitQuintessenceUpdatedInput,
  opts: ChannelSourceOptions = {},
): Promise<ReinforcementEvent> {
  const event = emitQuintessenceUpdated(input);
  return writeOrWarn(event, opts);
}
