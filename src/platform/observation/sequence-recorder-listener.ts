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
