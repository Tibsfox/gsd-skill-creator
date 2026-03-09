/**
 * Spatial Awareness — Threat Detection Engine
 * Paula Chipset Release 2, Wave 1 Track A (1B)
 *
 * Distributed anomaly detection with configurable thresholds.
 * Multi-agent signal correlation (requires >= 2 correlated sources to escalate).
 * Probabilistic threat scoring (not binary).
 * ThreatEvent generation with proper ThreatLevel assignment.
 * Sliding window for error rate trend analysis.
 */

import type {
  AmbientSignal,
  AmbientSignalType,
  ThreatEvent,
  ThreatEventType,
  ThreatLevel,
  ThreatClassification,
} from './types.js';

// ============================================================================
// Threat engine configuration
// ============================================================================

export interface ThreatEngineConfig {
  /** Sliding window size in milliseconds for trend analysis. */
  windowMs: number;
  /** Minimum correlated sources required to escalate. */
  minCorrelatedSources: number;
  /** Error rate threshold (errors/min) for anomaly detection. */
  errorRateThreshold: number;
  /** Context fill % threshold for anomaly detection. */
  contextFillThreshold: number;
  /** Budget remaining % threshold (below = anomaly). */
  budgetThreshold: number;
  /** Threat score decay rate per second (0-1). */
  scoreDecayRate: number;
  /** Score threshold above which ELEVATED is assigned. */
  elevatedScoreThreshold: number;
  /** Score threshold above which HIGH is assigned. */
  highScoreThreshold: number;
  /** Score threshold above which BLOCK is assigned. */
  blockScoreThreshold: number;
}

export const DEFAULT_THREAT_CONFIG: ThreatEngineConfig = {
  windowMs: 30_000,
  minCorrelatedSources: 2,
  errorRateThreshold: 5,
  contextFillThreshold: 80,
  budgetThreshold: 20,
  scoreDecayRate: 0.1,
  elevatedScoreThreshold: 0.3,
  highScoreThreshold: 0.6,
  blockScoreThreshold: 0.85,
};

// ============================================================================
// Internal types
// ============================================================================

interface SignalWindow {
  signals: AmbientSignal[];
  lastPruned: number;
}

interface ThreatScore {
  source: string;
  signalType: AmbientSignalType;
  score: number;
  lastUpdated: number;
  contributions: number;
}

interface CorrelationGroup {
  signalType: AmbientSignalType;
  sources: Set<string>;
  avgScore: number;
  timestamp: number;
}

// ============================================================================
// Threat Detection Engine
// ============================================================================

export class ThreatDetectionEngine {
  private _config: ThreatEngineConfig;
  private _windows: Map<string, SignalWindow> = new Map();
  private _scores: Map<string, ThreatScore> = new Map();
  private _events: ThreatEvent[] = [];
  private _listeners: Set<(event: ThreatEvent) => void> = new Set();
  private _eventIdCounter = 0;

  constructor(config: Partial<ThreatEngineConfig> = {}) {
    this._config = { ...DEFAULT_THREAT_CONFIG, ...config };
  }

  get events(): readonly ThreatEvent[] { return this._events; }
  get activeEvents(): ThreatEvent[] { return this._events.filter(e => !e.resolved); }

  /** Ingest a signal and evaluate for threats. */
  ingest(signal: AmbientSignal): ThreatEvent | null {
    const windowKey = `${signal.type}:${signal.source}`;
    this._addToWindow(windowKey, signal);
    this._updateScore(signal);
    this._pruneWindows();

    // Check for correlated anomalies
    const correlation = this._checkCorrelation(signal.type);
    if (correlation && correlation.sources.size >= this._config.minCorrelatedSources) {
      return this._generateCorrelatedEvent(correlation);
    }

    // Check individual signal for threshold breach
    const score = this._scores.get(windowKey);
    if (score && score.score > this._config.elevatedScoreThreshold) {
      return this._generateEvent(signal, score);
    }

    return null;
  }

  /** Ingest multiple signals at once. Returns all generated events. */
  ingestBatch(signals: AmbientSignal[]): ThreatEvent[] {
    const events: ThreatEvent[] = [];
    for (const signal of signals) {
      const event = this.ingest(signal);
      if (event) events.push(event);
    }
    return events;
  }

  /** Get the current threat score for a source. */
  getScore(source: string, type: AmbientSignalType): number {
    const key = `${type}:${source}`;
    const score = this._scores.get(key);
    if (!score) return 0;
    return this._decayScore(score);
  }

  /** Get the overall threat level across all sources. */
  getOverallThreatLevel(): ThreatLevel {
    let maxScore = 0;
    for (const score of this._scores.values()) {
      const decayed = this._decayScore(score);
      if (decayed > maxScore) maxScore = decayed;
    }
    return this._scoreToLevel(maxScore);
  }

  /** Get error rate trend for a source within the sliding window. */
  getErrorRateTrend(source: string): { rate: number; trend: 'rising' | 'falling' | 'stable' } {
    const key = `error_rate:${source}`;
    const window = this._windows.get(key);
    if (!window || window.signals.length < 2) {
      return { rate: 0, trend: 'stable' };
    }

    const signals = window.signals;
    const recent = signals.slice(-5);
    const avgRate = recent.reduce((sum, s) => sum + s.value, 0) / recent.length;

    // Compare first half to second half of window
    const mid = Math.floor(signals.length / 2);
    const firstHalf = signals.slice(0, mid);
    const secondHalf = signals.slice(mid);
    const firstAvg = firstHalf.reduce((sum, s) => sum + s.value, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, s) => sum + s.value, 0) / secondHalf.length;

    const diff = secondAvg - firstAvg;
    const trend = diff > 1 ? 'rising' : diff < -1 ? 'falling' : 'stable';

    return { rate: avgRate, trend };
  }

  /** Resolve a threat event by ID. */
  resolve(eventId: string): boolean {
    const event = this._events.find(e => e.id === eventId);
    if (!event || event.resolved) return false;
    event.resolved = true;
    return true;
  }

  /** Subscribe to threat events. Returns unsubscribe function. */
  onThreat(listener: (event: ThreatEvent) => void): () => void {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  /** Update configuration. */
  configure(config: Partial<ThreatEngineConfig>): void {
    this._config = { ...this._config, ...config };
  }

  /** Clear all state. */
  reset(): void {
    this._windows.clear();
    this._scores.clear();
    this._events = [];
    this._eventIdCounter = 0;
  }

  // --------------------------------------------------------------------------
  // Internal methods
  // --------------------------------------------------------------------------

  private _addToWindow(key: string, signal: AmbientSignal): void {
    let window = this._windows.get(key);
    if (!window) {
      window = { signals: [], lastPruned: Date.now() };
      this._windows.set(key, window);
    }
    window.signals.push(signal);
  }

  private _pruneWindows(): void {
    const now = Date.now();
    const cutoff = now - this._config.windowMs;

    for (const [key, window] of this._windows) {
      window.signals = window.signals.filter(s => s.timestamp >= cutoff);
      window.lastPruned = now;
      if (window.signals.length === 0) {
        this._windows.delete(key);
      }
    }
  }

  private _updateScore(signal: AmbientSignal): void {
    const key = `${signal.type}:${signal.source}`;
    const rawScore = this._calculateRawScore(signal);

    let existing = this._scores.get(key);
    if (!existing) {
      existing = {
        source: signal.source,
        signalType: signal.type,
        score: 0,
        lastUpdated: signal.timestamp,
        contributions: 0,
      };
      this._scores.set(key, existing);
    }

    // Exponential moving average with decay
    const decayed = this._decayScore(existing);
    existing.score = Math.min(1, decayed * 0.7 + rawScore * 0.3);
    existing.lastUpdated = signal.timestamp;
    existing.contributions++;
  }

  private _calculateRawScore(signal: AmbientSignal): number {
    switch (signal.type) {
      case 'context_fill': {
        // Higher fill = higher threat
        if (signal.value >= 95) return 0.95;
        if (signal.value >= this._config.contextFillThreshold) {
          return 0.3 + (signal.value - this._config.contextFillThreshold) /
            (100 - this._config.contextFillThreshold) * 0.6;
        }
        return signal.value / 100 * 0.2;
      }
      case 'token_budget': {
        // Lower budget = higher threat
        if (signal.value <= 5) return 0.95;
        if (signal.value <= this._config.budgetThreshold) {
          return 0.3 + (this._config.budgetThreshold - signal.value) /
            this._config.budgetThreshold * 0.6;
        }
        return (100 - signal.value) / 100 * 0.2;
      }
      case 'error_rate': {
        // Higher error rate = higher threat
        if (signal.value >= this._config.errorRateThreshold * 3) return 0.95;
        if (signal.value >= this._config.errorRateThreshold) {
          return 0.3 + (signal.value - this._config.errorRateThreshold) /
            (this._config.errorRateThreshold * 2) * 0.6;
        }
        return signal.value / (this._config.errorRateThreshold * 2) * 0.2;
      }
      default:
        return 0;
    }
  }

  private _decayScore(score: ThreatScore): number {
    const elapsed = (Date.now() - score.lastUpdated) / 1000;
    return score.score * Math.exp(-this._config.scoreDecayRate * elapsed);
  }

  private _scoreToLevel(score: number): ThreatLevel {
    if (score >= this._config.blockScoreThreshold) return 'BLOCK';
    if (score >= this._config.highScoreThreshold) return 'HIGH';
    if (score >= this._config.elevatedScoreThreshold) return 'ELEVATED';
    return 'NOMINAL';
  }

  private _checkCorrelation(signalType: AmbientSignalType): CorrelationGroup | null {
    const relevantScores: ThreatScore[] = [];
    for (const score of this._scores.values()) {
      if (score.signalType === signalType) {
        const decayed = this._decayScore(score);
        if (decayed > this._config.elevatedScoreThreshold * 0.8) {
          relevantScores.push({ ...score, score: decayed });
        }
      }
    }

    if (relevantScores.length < this._config.minCorrelatedSources) return null;

    const sources = new Set(relevantScores.map(s => s.source));
    const avgScore = relevantScores.reduce((sum, s) => sum + s.score, 0) / relevantScores.length;

    return {
      signalType,
      sources,
      avgScore,
      timestamp: Date.now(),
    };
  }

  private _generateEvent(signal: AmbientSignal, score: ThreatScore): ThreatEvent {
    const level = this._scoreToLevel(score.score);
    const eventType = this._signalToEventType(signal.type);

    const event: ThreatEvent = {
      id: `threat-${++this._eventIdCounter}-${Date.now()}`,
      type: eventType,
      level,
      classification: this._classifyThreat(signal, score.score),
      sources: [signal.source],
      description: `${signal.type} anomaly from ${signal.source}: value=${signal.value.toFixed(2)}, score=${score.score.toFixed(3)}`,
      timestamp: Date.now(),
      probeResults: [],
      resolved: false,
    };

    this._events.push(event);
    this._emitEvent(event);
    return event;
  }

  private _generateCorrelatedEvent(correlation: CorrelationGroup): ThreatEvent {
    // Correlated events get boosted threat level
    const boostedScore = Math.min(1, correlation.avgScore * 1.3);
    const level = this._scoreToLevel(boostedScore);
    const eventType = this._signalToEventType(correlation.signalType);

    const event: ThreatEvent = {
      id: `threat-corr-${++this._eventIdCounter}-${Date.now()}`,
      type: 'anomaly_correlated',
      level,
      classification: 'THREAT',
      sources: [...correlation.sources],
      description: `Correlated ${correlation.signalType} anomaly across ${correlation.sources.size} sources (avg score: ${correlation.avgScore.toFixed(3)})`,
      timestamp: Date.now(),
      correlationId: `corr-${correlation.signalType}-${Date.now()}`,
      probeResults: [],
      resolved: false,
    };

    this._events.push(event);
    this._emitEvent(event);
    return event;
  }

  private _signalToEventType(signalType: AmbientSignalType): ThreatEventType {
    switch (signalType) {
      case 'context_fill': return 'resource_exhaustion';
      case 'token_budget': return 'budget_spike';
      case 'error_rate': return 'error_surge';
      case 'agent_output_rate': return 'agent_silence';
      default: return 'environmental_change';
    }
  }

  private _classifyThreat(signal: AmbientSignal, score: number): ThreatClassification {
    if (score >= this._config.highScoreThreshold) return 'THREAT';
    if (score >= this._config.elevatedScoreThreshold) return 'NEUTRAL';
    return 'UNKNOWN';
  }

  private _emitEvent(event: ThreatEvent): void {
    for (const listener of this._listeners) {
      listener(event);
    }
  }
}
