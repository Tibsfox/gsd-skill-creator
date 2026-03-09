/**
 * Spatial Awareness — Passive Environmental Sensor
 * Paula Chipset Release 2, Wave 1 Track A (1A)
 *
 * Reads ambient computational signals (context fill, budget, timing, errors)
 * without making tool calls. Constructs a spatial model from ambient data.
 * Aggregates signals from multiple SensorStream sources via DefaultSensorRegistry.
 */

import type {
  AmbientSignal,
  AmbientSignalType,
  ResourceDimension,
  SpatialModel,
  ThreatLevel,
} from './types.js';
import type {
  SensorRegistry,
  SensorStream,
} from './sensor-interface.js';

// ============================================================================
// Threshold configuration
// ============================================================================

export interface ThresholdConfig {
  /** Context fill % that triggers ELEVATED. */
  contextFillWarn: number;
  /** Context fill % that triggers HIGH. */
  contextFillCritical: number;
  /** Budget remaining % below which triggers ELEVATED. */
  budgetLowWarn: number;
  /** Budget remaining % below which triggers HIGH. */
  budgetLowCritical: number;
  /** Error rate (errors/min) that triggers ELEVATED. */
  errorRateWarn: number;
  /** Error rate that triggers HIGH. */
  errorRateCritical: number;
}

export const DEFAULT_THRESHOLDS: ThresholdConfig = {
  contextFillWarn: 70,
  contextFillCritical: 90,
  budgetLowWarn: 30,
  budgetLowCritical: 10,
  errorRateWarn: 5,
  errorRateCritical: 15,
};

// ============================================================================
// Anomaly record
// ============================================================================

export interface AnomalyRecord {
  signalType: AmbientSignalType;
  source: string;
  value: number;
  threshold: number;
  level: ThreatLevel;
  timestamp: number;
}

// ============================================================================
// Passive Environmental Sensor
// ============================================================================

export class PassiveEnvironmentalSensor {
  private _registry: SensorRegistry;
  private _agentId: string;
  private _thresholds: ThresholdConfig;
  private _model: SpatialModel;
  private _anomalies: AnomalyRecord[] = [];
  private _signalHistory: Map<string, AmbientSignal[]> = new Map();
  private _maxHistoryPerSource = 100;
  private _listeners: Set<(model: SpatialModel) => void> = new Set();
  private _anomalyListeners: Set<(anomaly: AnomalyRecord) => void> = new Set();
  private _running = false;
  private _pollInterval: ReturnType<typeof setInterval> | null = null;
  private _pollMs: number;

  constructor(
    agentId: string,
    registry: SensorRegistry,
    thresholds: ThresholdConfig = DEFAULT_THRESHOLDS,
    pollMs = 500,
  ) {
    this._agentId = agentId;
    this._registry = registry;
    this._thresholds = thresholds;
    this._pollMs = pollMs;
    this._model = this._createEmptyModel();
  }

  get running(): boolean { return this._running; }
  get model(): SpatialModel { return this._model; }
  get anomalies(): readonly AnomalyRecord[] { return this._anomalies; }

  /** Start passive sensing loop. */
  start(): void {
    if (this._running) return;
    this._running = true;
    this._pollInterval = setInterval(() => this._sense(), this._pollMs);
    this._sense(); // immediate first read
  }

  /** Stop passive sensing loop. */
  stop(): void {
    if (!this._running) return;
    this._running = false;
    if (this._pollInterval) {
      clearInterval(this._pollInterval);
      this._pollInterval = null;
    }
  }

  /** Force a single sense cycle (useful for testing). */
  sense(): SpatialModel {
    this._sense();
    return this._model;
  }

  /** Subscribe to model updates. Returns unsubscribe function. */
  onModelUpdate(listener: (model: SpatialModel) => void): () => void {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  /** Subscribe to anomaly detections. Returns unsubscribe function. */
  onAnomaly(listener: (anomaly: AnomalyRecord) => void): () => void {
    this._anomalyListeners.add(listener);
    return () => this._anomalyListeners.delete(listener);
  }

  /** Update threshold configuration. */
  setThresholds(thresholds: Partial<ThresholdConfig>): void {
    this._thresholds = { ...this._thresholds, ...thresholds };
  }

  /** Get signal history for a specific source. */
  getHistory(sourceKey: string): readonly AmbientSignal[] {
    return this._signalHistory.get(sourceKey) ?? [];
  }

  /** Clear all signal history. */
  clearHistory(): void {
    this._signalHistory.clear();
  }

  // --------------------------------------------------------------------------
  // Internal sensing
  // --------------------------------------------------------------------------

  private _sense(): void {
    const sensors = this._registry.getActive();
    const signals: AmbientSignal[] = [];

    for (const sensor of sensors) {
      const signal = sensor.read();
      if (signal) {
        signals.push(signal);
        this._recordSignal(signal);
      }
    }

    this._updateModel(signals);
    this._checkThresholds(signals);
    this._emitModelUpdate();
  }

  private _recordSignal(signal: AmbientSignal): void {
    const key = `${signal.type}:${signal.source}`;
    let history = this._signalHistory.get(key);
    if (!history) {
      history = [];
      this._signalHistory.set(key, history);
    }
    history.push(signal);
    if (history.length > this._maxHistoryPerSource) {
      history.splice(0, history.length - this._maxHistoryPerSource);
    }
  }

  private _updateModel(signals: AmbientSignal[]): void {
    const dimensions = this._buildDimensions(signals);
    const threatLevel = this._calculateThreatLevel(signals);

    // Count peer states from signal sources
    const sources = new Set(signals.map(s => s.source));
    const peerCount = Math.max(0, sources.size - 1); // exclude self if present

    this._model = {
      agentId: this._agentId,
      timestamp: Date.now(),
      dimensions,
      threatLevel,
      activePhase: this._model.activePhase,
      peerCount,
      peersActive: peerCount, // all reporting peers are assumed active
      peersIdle: 0,
      peersBlocked: 0,
      lastAnomaly: this._anomalies.length > 0
        ? this._anomalies[this._anomalies.length - 1].timestamp
        : null,
    };
  }

  private _buildDimensions(signals: AmbientSignal[]): ResourceDimension[] {
    const dimensions: ResourceDimension[] = [];

    // Aggregate context fill signals
    const contextSignals = signals.filter(s => s.type === 'context_fill');
    if (contextSignals.length > 0) {
      const avg = contextSignals.reduce((sum, s) => sum + s.value, 0) / contextSignals.length;
      const rateOfChange = this._calculateRateOfChange('context_fill', avg);
      dimensions.push({
        name: 'context_window',
        current: avg,
        maximum: 100,
        unit: 'percent',
        fillPercent: avg,
        rateOfChange,
      });
    }

    // Aggregate budget signals
    const budgetSignals = signals.filter(s => s.type === 'token_budget');
    if (budgetSignals.length > 0) {
      const avg = budgetSignals.reduce((sum, s) => sum + s.value, 0) / budgetSignals.length;
      const rateOfChange = this._calculateRateOfChange('token_budget', avg);
      dimensions.push({
        name: 'token_budget',
        current: avg,
        maximum: 100,
        unit: 'percent',
        fillPercent: 100 - avg, // budget fill is inverse of remaining
        rateOfChange,
      });
    }

    // Aggregate error rate signals
    const errorSignals = signals.filter(s => s.type === 'error_rate');
    if (errorSignals.length > 0) {
      const avg = errorSignals.reduce((sum, s) => sum + s.value, 0) / errorSignals.length;
      const rateOfChange = this._calculateRateOfChange('error_rate', avg);
      dimensions.push({
        name: 'error_rate',
        current: avg,
        maximum: 100, // arbitrary ceiling for errors/min
        unit: 'errors/min',
        fillPercent: Math.min(100, avg),
        rateOfChange,
      });
    }

    return dimensions;
  }

  private _calculateRateOfChange(type: AmbientSignalType, currentAvg: number): number {
    // Look at all sources for this type, compute average rate of change
    const histories: AmbientSignal[][] = [];
    for (const [key, history] of this._signalHistory) {
      if (key.startsWith(`${type}:`)) {
        histories.push(history);
      }
    }

    if (histories.length === 0) return 0;

    let totalRate = 0;
    let rateCount = 0;

    for (const history of histories) {
      if (history.length < 2) continue;
      const recent = history[history.length - 1];
      const prev = history[history.length - 2];
      const dt = (recent.timestamp - prev.timestamp) / 1000; // seconds
      if (dt > 0) {
        totalRate += (recent.value - prev.value) / dt;
        rateCount++;
      }
    }

    return rateCount > 0 ? totalRate / rateCount : 0;
  }

  private _calculateThreatLevel(signals: AmbientSignal[]): ThreatLevel {
    let maxLevel: ThreatLevel = 'NOMINAL';
    const order: ThreatLevel[] = ['NOMINAL', 'ELEVATED', 'HIGH', 'BLOCK'];

    for (const signal of signals) {
      const level = this._signalThreatLevel(signal);
      if (order.indexOf(level) > order.indexOf(maxLevel)) {
        maxLevel = level;
      }
    }

    return maxLevel;
  }

  private _signalThreatLevel(signal: AmbientSignal): ThreatLevel {
    switch (signal.type) {
      case 'context_fill':
        if (signal.value >= this._thresholds.contextFillCritical) return 'HIGH';
        if (signal.value >= this._thresholds.contextFillWarn) return 'ELEVATED';
        return 'NOMINAL';
      case 'token_budget':
        if (signal.value <= this._thresholds.budgetLowCritical) return 'HIGH';
        if (signal.value <= this._thresholds.budgetLowWarn) return 'ELEVATED';
        return 'NOMINAL';
      case 'error_rate':
        if (signal.value >= this._thresholds.errorRateCritical) return 'HIGH';
        if (signal.value >= this._thresholds.errorRateWarn) return 'ELEVATED';
        return 'NOMINAL';
      default:
        return 'NOMINAL';
    }
  }

  private _checkThresholds(signals: AmbientSignal[]): void {
    for (const signal of signals) {
      const level = this._signalThreatLevel(signal);
      if (level !== 'NOMINAL') {
        const threshold = this._getThresholdForSignal(signal.type, level);
        const anomaly: AnomalyRecord = {
          signalType: signal.type,
          source: signal.source,
          value: signal.value,
          threshold,
          level,
          timestamp: signal.timestamp,
        };
        this._anomalies.push(anomaly);
        for (const listener of this._anomalyListeners) {
          listener(anomaly);
        }
      }
    }
  }

  private _getThresholdForSignal(type: AmbientSignalType, level: ThreatLevel): number {
    switch (type) {
      case 'context_fill':
        return level === 'HIGH' ? this._thresholds.contextFillCritical : this._thresholds.contextFillWarn;
      case 'token_budget':
        return level === 'HIGH' ? this._thresholds.budgetLowCritical : this._thresholds.budgetLowWarn;
      case 'error_rate':
        return level === 'HIGH' ? this._thresholds.errorRateCritical : this._thresholds.errorRateWarn;
      default:
        return 0;
    }
  }

  private _emitModelUpdate(): void {
    for (const listener of this._listeners) {
      listener(this._model);
    }
  }

  private _createEmptyModel(): SpatialModel {
    return {
      agentId: this._agentId,
      timestamp: Date.now(),
      dimensions: [],
      threatLevel: 'NOMINAL',
      activePhase: 'BASELINE',
      peerCount: 0,
      peersActive: 0,
      peersIdle: 0,
      peersBlocked: 0,
      lastAnomaly: null,
    };
  }
}
