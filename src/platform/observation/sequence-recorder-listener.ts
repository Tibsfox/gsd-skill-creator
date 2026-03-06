/**
 * sequence-recorder-listener.ts — Signal Intake: Integration Factory
 *
 * WHAT THIS MODULE DOES
 * ---------------------
 * Provides a single factory function, initializeSequenceRecorder(), that creates
 * a SequenceRecorder, starts it as a parallel listener on the SignalBus, and
 * returns the started instance. This is the canonical wiring point.
 *
 * WHY THIS FILE EXISTS AS SEPARATE FROM THE CLASS
 * ------------------------------------------------
 * SequenceRecorder is a class with logic. This file is a factory with intention.
 * The separation follows a pattern from Lex's Batch 3 audit:
 * "The integration surface is almost always smaller than it looks."
 *
 * The entire wiring takes 15 lines once the design is clear. Separating it into
 * its own file makes the integration surface explicit and easy to find. New
 * engineers can grep for "initializeSequenceRecorder" to understand exactly
 * where the recorder enters the live system.
 *
 * THE PARALLEL LISTENER ARCHITECTURE
 * ------------------------------------
 * Both FeedbackBridge and SequenceRecorder use this same pattern:
 *   1. Create the observer (FeedbackBridge or SequenceRecorder)
 *   2. Call start() to register the listener
 *   3. Return the instance (for lifecycle management — caller can stop() it)
 *
 * The SignalBus listener array supports any number of parallel listeners.
 * Both observers can share the same bus and store instances. They write to
 * different PatternStore categories ('feedback' vs 'workflows'), so there is
 * no contention at the storage level.
 *
 * From CENTERCAMP-PERSONAL-JOURNAL, "The Story of the Two Listeners":
 * "The next traveler reading this will think: 'Oh, I see. The system is built
 * on this foundation. This is why it doesn't break.'"
 *
 * HOW TO USE
 * ----------
 * In application startup:
 *   import { initializeSequenceRecorder } from './sequence-recorder-listener.js';
 *   const recorder = initializeSequenceRecorder(signalBus, patternStore);
 *   // recorder is now listening for 'completion' events
 *
 * In application shutdown:
 *   recorder.stop();
 *   // listener is unregistered — clean teardown
 *
 * For custom topology or testing:
 *   const recorder = initializeSequenceRecorder(bus, store, {
 *     clusterMap: { 'my-agent': 'rigor-spine' },
 *     capabilityGapThreshold: 0.4,
 *   });
 *
 * INTEGRATION CONTEXT
 * -------------------
 * This factory was written during Phase 1 of Batch 3 (Lex's wiring phase).
 * The integration was 15 lines because Phase 0's 30-minute audit clarified
 * the exact touchpoints. Lesson: 2:1 planning-to-coding ratio on integration work.
 *
 * From BATCH-3-RETROSPECTIVE.md, Lex's debrief:
 * "When wiring two systems together, the integration surface is almost always
 * smaller than it looks. Map the exact touchpoints first (30 min), then build (15 min)."
 *
 * @see SequenceRecorder (sequence-recorder.ts) — the class this factory creates
 * @see FeedbackBridge (feedback-bridge.ts) — mirrors this initialization pattern
 * @see BATCH-3-RETROSPECTIVE.md — Lex's debrief on the integration philosophy
 * @see CENTERCAMP-PERSONAL-JOURNAL.md — "The Story of the Two Listeners"
 */

import { SignalBus } from '../../services/chipset/blitter/signals.js';
import { PatternStore } from '../../core/storage/pattern-store.js';
import { SequenceRecorder } from './sequence-recorder.js';
import type { SequenceRecorderConfig } from './sequence-recorder.js';

/**
 * Wire a SequenceRecorder as a parallel listener on the SignalBus 'completion'
 * channel. Mirrors the FeedbackBridge initialization pattern.
 *
 * Starts listening immediately. Returns the recorder instance so the caller
 * can call recorder.stop() during application shutdown.
 *
 * Both FeedbackBridge and SequenceRecorder can share the same SignalBus and
 * PatternStore — they write to different categories ('feedback' vs 'workflows')
 * and the SignalBus listener array supports any number of parallel listeners.
 *
 * @param bus - SignalBus instance to subscribe to
 * @param store - PatternStore instance for persisting workflow records
 * @param config - Optional recorder configuration (defaults to DEFAULT_RECORDER_CONFIG)
 * @returns Started SequenceRecorder instance
 */
export function initializeSequenceRecorder(
  bus: SignalBus,
  store: PatternStore,
  config?: Partial<SequenceRecorderConfig>,
): SequenceRecorder {
  const recorder = new SequenceRecorder(bus, store, config);
  recorder.start();
  return recorder;
}
