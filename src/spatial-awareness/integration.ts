/**
 * Spatial Awareness — Integration Bridge
 * Paula Chipset Release 2, Wave 2 (2B)
 *
 * Cross-module integration: wires the full pipeline
 *   sensor → threat → response → comm → chorus → output
 *
 * The bridge does not add behavior — it connects existing modules
 * so that a signal detected by the PassiveEnvironmentalSensor flows
 * through threat detection, triggers the Frog Protocol, dispatches
 * coordination messages, and drives output synthesis.
 *
 * Integration tests verified:
 *   IN-01: Sensor → Threat pipeline
 *   IN-02: Threat → Frog Protocol
 *   IN-03: Frog Protocol → Comm Bus
 *   IN-04: Comm Bus → Chorus
 *   IN-05: Full cycle end-to-end (anomaly → silence → assess → resume)
 *   IN-10: Protocol phase → correct light sequence
 */

import type { AmbientSignal, FrogPhase, ThreatEvent } from './types.js';
import type { SensorRegistry } from './sensor-interface.js';
import type { AnomalyRecord } from './passive-sensor.js';
import { PassiveEnvironmentalSensor } from './passive-sensor.js';
import { ThreatDetectionEngine } from './threat-engine.js';
import type { ThreatEngineConfig } from './threat-engine.js';
import { EnvironmentalGeometryMapper } from './geometry-mapper.js';
import type { GeometryConfig } from './geometry-mapper.js';
import { FrogProtocolController } from './frog-protocol.js';
import type { FrogProtocolConfig, FrogProtocolEvent } from './frog-protocol.js';
import { CommBus, createCommBus } from './comm-bus.js';
import { ChorusProtocol, createChorusProtocol } from './chorus-proto.js';
import { OutputSynthesis, createOutputSynthesis } from './output-synthesis.js';

// ============================================================================
// System configuration
// ============================================================================

export interface SpatialSystemConfig {
  /** Agent ID for the system's passive sensor. */
  agentId: string;
  /** Agent IDs participating in the system. */
  agentIds: string[];
  /** Scout agent ID for probe-first pattern. */
  scoutId?: string;
  /** Passive sensor polling interval in ms. */
  sensorPollMs?: number;
  /** Threat engine configuration overrides. */
  threatConfig?: Partial<ThreatEngineConfig>;
  /** Geometry mapper configuration overrides. */
  geometryConfig?: Partial<GeometryConfig>;
  /** Frog protocol configuration overrides. */
  protocolConfig?: Partial<FrogProtocolConfig>;
  /** LED strip pixel count (0 = no LED strip). */
  ledPixelCount?: number;
}

// ============================================================================
// System status
// ============================================================================

export interface SpatialSystemStatus {
  running: boolean;
  phase: FrogPhase;
  agentCount: number;
  threatLevel: string;
  activeThreatCount: number;
  sensorActive: boolean;
  busMessageCount: number;
  chorusPaused: boolean;
  protocolCyclesCompleted: number;
  geometryDimensions: number;
  outputRunning: boolean;
}

// ============================================================================
// System events
// ============================================================================

export type SpatialSystemEvent =
  | { type: 'sensor_anomaly'; anomaly: AnomalyRecord }
  | { type: 'threat_detected'; event: ThreatEvent }
  | { type: 'protocol_event'; event: FrogProtocolEvent }
  | { type: 'pipeline_complete'; threatId: string; classification: string }
  | { type: 'system_started' }
  | { type: 'system_stopped' };

export type SpatialSystemEventHandler = (event: SpatialSystemEvent) => void;

// ============================================================================
// Spatial Awareness System — The Integration Bridge
// ============================================================================

export class SpatialAwarenessSystem {
  // Components — all publicly accessible for testing and inspection
  readonly sensor: PassiveEnvironmentalSensor;
  readonly threats: ThreatDetectionEngine;
  readonly geometry: EnvironmentalGeometryMapper;
  readonly protocol: FrogProtocolController;
  readonly bus: CommBus;
  readonly chorus: ChorusProtocol;
  readonly output: OutputSynthesis;

  private _config: SpatialSystemConfig;
  private _listeners = new Set<SpatialSystemEventHandler>();
  private _unsubscribers: Array<() => void> = [];
  private _running = false;

  constructor(
    config: SpatialSystemConfig,
    sensorRegistry: SensorRegistry,
  ) {
    this._config = config;

    // Create all components
    this.bus = createCommBus();
    // Register internal chorus agent before creating protocol
    this.bus.registerAgent('_chorus_proto_internal');
    this.chorus = createChorusProtocol(this.bus);
    this.threats = new ThreatDetectionEngine(config.threatConfig);
    this.geometry = new EnvironmentalGeometryMapper(config.geometryConfig);
    this.protocol = new FrogProtocolController(config.protocolConfig);
    this.output = createOutputSynthesis();

    // Create passive sensor with provided registry
    this.sensor = new PassiveEnvironmentalSensor(
      config.agentId,
      sensorRegistry,
      undefined, // default thresholds
      config.sensorPollMs ?? 500,
    );

    // Wire components together
    this._wireComponents();

    // Initialize LED strip if configured
    if (config.ledPixelCount && config.ledPixelCount > 0) {
      this.output.initLedStrip(config.ledPixelCount);
    }
  }

  // --------------------------------------------------------------------------
  // Lifecycle
  // --------------------------------------------------------------------------

  /** Start the full spatial awareness pipeline. */
  start(): void {
    if (this._running) return;
    this._running = true;

    // Start components
    this.sensor.start();
    this.protocol.start();
    this.output.start();

    this._emitEvent({ type: 'system_started' });
  }

  /** Stop the full pipeline. */
  stop(): void {
    if (!this._running) return;
    this._running = false;

    this.sensor.stop();
    this.protocol.stop();
    this.output.stop();

    this._emitEvent({ type: 'system_stopped' });
  }

  /** Reset all components to initial state. */
  reset(): void {
    this.stop();

    // Unsubscribe all wiring
    for (const unsub of this._unsubscribers) {
      unsub();
    }
    this._unsubscribers = [];

    // Reset all components
    this.threats.reset();
    this.geometry.reset();
    this.protocol.reset();
    this.bus.reset();
    // Re-register internal chorus agent after bus reset
    this.bus.registerAgent('_chorus_proto_internal');
    this.chorus.reset();
    this.output.reset();
    this.sensor.clearHistory();

    // Re-wire
    this._wireComponents();
  }

  // --------------------------------------------------------------------------
  // Status
  // --------------------------------------------------------------------------

  get running(): boolean { return this._running; }

  getStatus(): SpatialSystemStatus {
    return {
      running: this._running,
      phase: this.protocol.phase,
      agentCount: this._config.agentIds.length,
      threatLevel: this.threats.getOverallThreatLevel(),
      activeThreatCount: this.threats.activeEvents.length,
      sensorActive: this.sensor.running,
      busMessageCount: this.bus.getStats().totalSent,
      chorusPaused: this.chorus.isPaused(),
      protocolCyclesCompleted: this.protocol.completedCycles.length,
      geometryDimensions: this.geometry.dimensions.length,
      outputRunning: this.output.running,
    };
  }

  // --------------------------------------------------------------------------
  // Manual pipeline triggers (for testing and external use)
  // --------------------------------------------------------------------------

  /**
   * Manually feed a signal through the full pipeline.
   * Useful for testing: injects a signal → processes through
   * threat detection → triggers protocol if threshold breached.
   */
  feedSignal(signal: AmbientSignal): ThreatEvent | null {
    // 1. Update geometry mapper
    this.geometry.updateFromSignal(signal);

    // 2. Feed to threat detection engine
    const event = this.threats.ingest(signal);

    // 3. If threat detected, feed to protocol
    if (event) {
      this._emitEvent({ type: 'threat_detected', event });
      this.protocol.ingestThreat(event);
    }

    return event;
  }

  /**
   * Run one sense cycle manually.
   * Reads all sensors, processes through pipeline.
   */
  senseCycle(): void {
    this.sensor.sense();
  }

  // --------------------------------------------------------------------------
  // Event system
  // --------------------------------------------------------------------------

  onEvent(handler: SpatialSystemEventHandler): () => void {
    this._listeners.add(handler);
    return () => this._listeners.delete(handler);
  }

  // --------------------------------------------------------------------------
  // Internal — component wiring
  // --------------------------------------------------------------------------

  private _wireComponents(): void {
    // Register agents on the comm bus and chorus
    for (const agentId of this._config.agentIds) {
      this.bus.registerAgent(agentId);
      this.chorus.registerAgent(agentId);
    }

    // Register the controller as a pseudo-agent on the bus
    this.bus.registerAgent('frog-controller');

    // Set scout
    const scoutId = this._config.scoutId ?? this._config.agentIds[0];
    if (scoutId) {
      this.protocol.setScout(scoutId);
    }

    // Connect protocol to dependencies
    this.protocol.connectBus(this.bus);
    this.protocol.connectChorus(this.chorus);
    this.protocol.connectOutput(this.output);
    this.protocol.registerAgents(this._config.agentIds);

    // Wire sensor anomalies → threat detection engine
    const unsubAnomaly = this.sensor.onAnomaly((anomaly: AnomalyRecord) => {
      this._emitEvent({ type: 'sensor_anomaly', anomaly });
    });
    this._unsubscribers.push(unsubAnomaly);

    // Wire sensor model updates → geometry mapper + threat engine
    const unsubModel = this.sensor.onModelUpdate((model) => {
      // Feed each dimension as signals to the geometry mapper
      for (const dim of model.dimensions) {
        const signal: AmbientSignal = {
          id: `model-${dim.name}-${Date.now()}`,
          type: dim.name === 'context_window' ? 'context_fill'
            : dim.name === 'token_budget' ? 'token_budget'
            : 'error_rate',
          source: model.agentId,
          value: dim.name === 'token_budget'
            ? 100 - dim.fillPercent  // budget: remaining %
            : dim.fillPercent,       // context/error: fill %
          unit: dim.unit,
          timestamp: model.timestamp,
          confidence: 1,
        };
        this.geometry.updateFromSignal(signal);

        // Also feed to threat engine
        const event = this.threats.ingest(signal);
        if (event) {
          this._emitEvent({ type: 'threat_detected', event });
          this.protocol.ingestThreat(event);
        }
      }
    });
    this._unsubscribers.push(unsubModel);

    // Wire threat engine events to protocol
    const unsubThreat = this.threats.onThreat((event: ThreatEvent) => {
      this._emitEvent({ type: 'threat_detected', event });
      this.protocol.ingestThreat(event);
    });
    this._unsubscribers.push(unsubThreat);

    // Wire protocol events → system events + output synthesis
    const unsubProtocol = this.protocol.onEvent((event: FrogProtocolEvent) => {
      this._emitEvent({ type: 'protocol_event', event });

      // IN-10: Protocol phase transitions drive output light sequences
      if (event.type === 'phase_change') {
        this.output.setPhase(event.transition.to);

        // Apply phase colors to LED strip and DMX
        this.output.applyPhaseToStrip(event.transition.to);
        this.output.applyPhaseToFrame(event.transition.to);
      }

      if (event.type === 'threat_classified') {
        this._emitEvent({
          type: 'pipeline_complete',
          threatId: event.result.threatId,
          classification: event.result.classification,
        });
      }
    });
    this._unsubscribers.push(unsubProtocol);
  }

  // --------------------------------------------------------------------------
  // Internal — event emission
  // --------------------------------------------------------------------------

  private _emitEvent(event: SpatialSystemEvent): void {
    for (const handler of this._listeners) {
      handler(event);
    }
  }
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create a fully wired SpatialAwarenessSystem.
 *
 * Requires a SensorRegistry with sensors already registered.
 * The system wires all components and is ready to start().
 */
export function createSpatialSystem(
  config: SpatialSystemConfig,
  sensorRegistry: SensorRegistry,
): SpatialAwarenessSystem {
  return new SpatialAwarenessSystem(config, sensorRegistry);
}
