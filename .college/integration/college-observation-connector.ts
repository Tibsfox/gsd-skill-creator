/**
 * College Observation Connector -- feeds College usage into the learning pipeline.
 *
 * Bridges the ObservationBridge event stream to the skill-creator
 * SessionObservation pipeline: when concepts are explored or translated during
 * real work, the buffered CollegeObservationEvents are collapsed into a single
 * SessionObservation (via ObservationBridge.toSessionObservation) and handed to
 * a sink. The sink is supplied by the caller so this stays decoupled from src/
 * across the rootdir boundary -- a src-side adapter can point the sink at
 * SessionObserver / PatternStore / the MemorySink.
 *
 * Gated: forwarding is off unless `enabled` is set, so College usage only
 * becomes pattern signal when the operator opts in. When disabled the bridge
 * buffer is left intact (never drained), so enabling later loses nothing.
 *
 * @module integration/college-observation-connector
 */

import type { ObservationBridge } from './observation-bridge.js';

/** The SessionObservation-compatible shape ObservationBridge emits. */
export type BridgeSessionObservation = ReturnType<ObservationBridge['toSessionObservation']>;

/** Receiver for a converted College SessionObservation (e.g. a PatternStore). */
export type SessionObservationSink = (
  observation: BridgeSessionObservation,
) => void | Promise<void>;

/** Configuration for the connector. */
export interface CollegeObservationConnectorConfig {
  /** When true, buffered events are forwarded to the sink on pump(). Default false. */
  enabled?: boolean;
}

/**
 * Drains an ObservationBridge into a SessionObservation sink.
 */
export class CollegeObservationConnector {
  private readonly bridge: ObservationBridge;
  private readonly sink: SessionObservationSink;
  private enabled: boolean;

  constructor(
    bridge: ObservationBridge,
    sink: SessionObservationSink,
    config: CollegeObservationConnectorConfig = {},
  ) {
    this.bridge = bridge;
    this.sink = sink;
    this.enabled = config.enabled ?? false;
  }

  /** Whether forwarding is currently active. */
  isEnabled(): boolean {
    return this.enabled;
  }

  /** Toggle forwarding at runtime (e.g. from a live config reload). */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Flush buffered College events into the sink as one SessionObservation.
   *
   * No-op returning 0 when disabled (buffer preserved) or when the buffer is
   * empty. Otherwise drains the bridge, converts, forwards, and returns the
   * number of events that were folded into the observation.
   */
  async pump(): Promise<number> {
    if (!this.enabled) return 0;

    const events = this.bridge.flush();
    if (events.length === 0) return 0;

    const observation = this.bridge.toSessionObservation(events);
    await this.sink(observation);
    return events.length;
  }
}
