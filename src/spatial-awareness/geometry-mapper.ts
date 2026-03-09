/**
 * Spatial Awareness — Environmental Geometry Mapper
 * Paula Chipset Release 2, Wave 1 Track A (1C)
 *
 * Constructs ResourceDimension model of the environment.
 * Tracks context window headroom, budget remaining, rate limit proximity.
 * Calculates fill percentages and rates of change.
 * Within 5% accuracy per dimension.
 * Updates spatial model with constraint boundaries.
 */

import type {
  AmbientSignal,
  ResourceDimension,
  SpatialModel,
  ThreatLevel,
} from './types.js';

// ============================================================================
// Geometry configuration
// ============================================================================

export interface GeometryConfig {
  /** Maximum context window size (tokens). */
  maxContextTokens: number;
  /** Maximum token budget per session. */
  maxBudgetTokens: number;
  /** Rate limit requests per minute. */
  rateLimitRpm: number;
  /** Smoothing factor for rate of change (0-1, higher = more responsive). */
  smoothingFactor: number;
  /** History length for rate calculations. */
  historyLength: number;
}

export const DEFAULT_GEOMETRY_CONFIG: GeometryConfig = {
  maxContextTokens: 200_000,
  maxBudgetTokens: 1_000_000,
  rateLimitRpm: 60,
  smoothingFactor: 0.3,
  historyLength: 20,
};

// ============================================================================
// Constraint boundary
// ============================================================================

export interface ConstraintBoundary {
  dimension: string;
  softLimit: number;
  hardLimit: number;
  currentDistance: number;
  timeToHit: number | null; // seconds, null if not approaching
  breached: boolean;
}

// ============================================================================
// Dimension snapshot
// ============================================================================

interface DimensionHistory {
  values: Array<{ value: number; timestamp: number }>;
  rateOfChange: number;
}

// ============================================================================
// Environmental Geometry Mapper
// ============================================================================

export class EnvironmentalGeometryMapper {
  private _config: GeometryConfig;
  private _dimensions: Map<string, ResourceDimension> = new Map();
  private _histories: Map<string, DimensionHistory> = new Map();
  private _constraints: Map<string, ConstraintBoundary> = new Map();
  private _listeners: Set<(dims: ResourceDimension[]) => void> = new Set();

  constructor(config: Partial<GeometryConfig> = {}) {
    this._config = { ...DEFAULT_GEOMETRY_CONFIG, ...config };
    this._initDefaultDimensions();
  }

  get dimensions(): ResourceDimension[] {
    return [...this._dimensions.values()];
  }

  get constraints(): ConstraintBoundary[] {
    return [...this._constraints.values()];
  }

  /** Update a dimension from a signal reading. */
  updateFromSignal(signal: AmbientSignal): ResourceDimension | null {
    const dimName = this._signalToDimension(signal);
    if (!dimName) return null;

    const dim = this._dimensions.get(dimName);
    if (!dim) return null;

    const { current, maximum, fillPercent } = this._mapSignalToDimension(signal, dim);
    const rateOfChange = this._updateHistory(dimName, current);

    const updated: ResourceDimension = {
      name: dimName,
      current,
      maximum,
      unit: dim.unit,
      fillPercent,
      rateOfChange,
    };

    this._dimensions.set(dimName, updated);
    this._updateConstraint(dimName, updated);
    this._emitUpdate();

    return updated;
  }

  /** Update dimensions from multiple signals at once. */
  updateFromSignals(signals: AmbientSignal[]): ResourceDimension[] {
    const updated: ResourceDimension[] = [];
    for (const signal of signals) {
      const dim = this.updateFromSignal(signal);
      if (dim) updated.push(dim);
    }
    return updated;
  }

  /** Get a specific dimension by name. */
  getDimension(name: string): ResourceDimension | undefined {
    return this._dimensions.get(name);
  }

  /** Get the fill percentage for a dimension. Within 5% accuracy. */
  getFillPercent(name: string): number | null {
    const dim = this._dimensions.get(name);
    return dim ? dim.fillPercent : null;
  }

  /** Get the rate of change for a dimension. */
  getRateOfChange(name: string): number | null {
    const history = this._histories.get(name);
    return history ? history.rateOfChange : null;
  }

  /** Get the constraint boundary for a dimension. */
  getConstraint(name: string): ConstraintBoundary | undefined {
    return this._constraints.get(name);
  }

  /** Calculate estimated time to constraint breach. */
  getTimeToConstraint(name: string): number | null {
    const constraint = this._constraints.get(name);
    return constraint?.timeToHit ?? null;
  }

  /** Get context window headroom (tokens remaining). */
  getContextHeadroom(): number {
    const dim = this._dimensions.get('context_window');
    if (!dim) return this._config.maxContextTokens;
    return dim.maximum - dim.current;
  }

  /** Get budget remaining (tokens). */
  getBudgetRemaining(): number {
    const dim = this._dimensions.get('token_budget');
    if (!dim) return this._config.maxBudgetTokens;
    return dim.current;
  }

  /** Get rate limit proximity (0-1, where 1 = at limit). */
  getRateLimitProximity(): number {
    const dim = this._dimensions.get('rate_limit');
    if (!dim) return 0;
    return dim.fillPercent / 100;
  }

  /** Build a SpatialModel snapshot from current geometry. */
  buildSpatialModel(agentId: string, threatLevel: ThreatLevel = 'NOMINAL'): SpatialModel {
    return {
      agentId,
      timestamp: Date.now(),
      dimensions: this.dimensions,
      threatLevel,
      activePhase: 'BASELINE',
      peerCount: 0,
      peersActive: 0,
      peersIdle: 0,
      peersBlocked: 0,
      lastAnomaly: null,
    };
  }

  /** Subscribe to dimension updates. Returns unsubscribe function. */
  onUpdate(listener: (dims: ResourceDimension[]) => void): () => void {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  /** Update configuration. */
  configure(config: Partial<GeometryConfig>): void {
    this._config = { ...this._config, ...config };
    this._initDefaultDimensions();
  }

  /** Reset all dimensions to defaults. */
  reset(): void {
    this._histories.clear();
    this._constraints.clear();
    this._initDefaultDimensions();
  }

  // --------------------------------------------------------------------------
  // Internal methods
  // --------------------------------------------------------------------------

  private _initDefaultDimensions(): void {
    this._dimensions.set('context_window', {
      name: 'context_window',
      current: 0,
      maximum: this._config.maxContextTokens,
      unit: 'tokens',
      fillPercent: 0,
      rateOfChange: 0,
    });

    this._dimensions.set('token_budget', {
      name: 'token_budget',
      current: this._config.maxBudgetTokens,
      maximum: this._config.maxBudgetTokens,
      unit: 'tokens',
      fillPercent: 0,
      rateOfChange: 0,
    });

    this._dimensions.set('rate_limit', {
      name: 'rate_limit',
      current: 0,
      maximum: this._config.rateLimitRpm,
      unit: 'rpm',
      fillPercent: 0,
      rateOfChange: 0,
    });

    // Initialize constraints
    this._constraints.set('context_window', {
      dimension: 'context_window',
      softLimit: this._config.maxContextTokens * 0.8,
      hardLimit: this._config.maxContextTokens * 0.95,
      currentDistance: this._config.maxContextTokens,
      timeToHit: null,
      breached: false,
    });

    this._constraints.set('token_budget', {
      dimension: 'token_budget',
      softLimit: this._config.maxBudgetTokens * 0.2,
      hardLimit: this._config.maxBudgetTokens * 0.05,
      currentDistance: this._config.maxBudgetTokens,
      timeToHit: null,
      breached: false,
    });

    this._constraints.set('rate_limit', {
      dimension: 'rate_limit',
      softLimit: this._config.rateLimitRpm * 0.8,
      hardLimit: this._config.rateLimitRpm * 0.95,
      currentDistance: this._config.rateLimitRpm,
      timeToHit: null,
      breached: false,
    });
  }

  private _signalToDimension(signal: AmbientSignal): string | null {
    switch (signal.type) {
      case 'context_fill': return 'context_window';
      case 'token_budget': return 'token_budget';
      default: return null;
    }
  }

  private _mapSignalToDimension(
    signal: AmbientSignal,
    dim: ResourceDimension,
  ): { current: number; maximum: number; fillPercent: number } {
    switch (signal.type) {
      case 'context_fill': {
        // Signal value is fill percentage (0-100)
        const current = (signal.value / 100) * this._config.maxContextTokens;
        return {
          current,
          maximum: this._config.maxContextTokens,
          fillPercent: signal.value,
        };
      }
      case 'token_budget': {
        // Signal value is remaining percentage (0-100)
        const current = (signal.value / 100) * this._config.maxBudgetTokens;
        return {
          current,
          maximum: this._config.maxBudgetTokens,
          fillPercent: 100 - signal.value, // fill = inverse of remaining
        };
      }
      default:
        return { current: dim.current, maximum: dim.maximum, fillPercent: dim.fillPercent };
    }
  }

  private _updateHistory(dimName: string, currentValue: number): number {
    let history = this._histories.get(dimName);
    if (!history) {
      history = { values: [], rateOfChange: 0 };
      this._histories.set(dimName, history);
    }

    history.values.push({ value: currentValue, timestamp: Date.now() });
    if (history.values.length > this._config.historyLength) {
      history.values.splice(0, history.values.length - this._config.historyLength);
    }

    // Calculate rate of change using exponential smoothing
    if (history.values.length >= 2) {
      const latest = history.values[history.values.length - 1];
      const prev = history.values[history.values.length - 2];
      const dt = (latest.timestamp - prev.timestamp) / 1000; // seconds
      if (dt > 0) {
        const instantRate = (latest.value - prev.value) / dt;
        history.rateOfChange = history.rateOfChange * (1 - this._config.smoothingFactor)
          + instantRate * this._config.smoothingFactor;
      }
    }

    return history.rateOfChange;
  }

  private _updateConstraint(dimName: string, dim: ResourceDimension): void {
    const constraint = this._constraints.get(dimName);
    if (!constraint) return;

    // For budget, distance is to hard limit (approaching zero)
    // For context/rate, distance is to hard limit (approaching max)
    if (dimName === 'token_budget') {
      constraint.currentDistance = dim.current - constraint.hardLimit;
      constraint.breached = dim.current <= constraint.hardLimit;
    } else {
      constraint.currentDistance = constraint.hardLimit - dim.current;
      constraint.breached = dim.current >= constraint.hardLimit;
    }

    // Time to hit calculation
    const history = this._histories.get(dimName);
    if (history && history.rateOfChange !== 0) {
      if (dimName === 'token_budget') {
        // Budget decreases over time
        if (history.rateOfChange < 0) {
          constraint.timeToHit = Math.abs(constraint.currentDistance / history.rateOfChange);
        } else {
          constraint.timeToHit = null; // moving away from constraint
        }
      } else {
        // Context/rate increases over time
        if (history.rateOfChange > 0) {
          constraint.timeToHit = constraint.currentDistance / history.rateOfChange;
        } else {
          constraint.timeToHit = null; // moving away from constraint
        }
      }
    } else {
      constraint.timeToHit = null;
    }
  }

  private _emitUpdate(): void {
    const dims = this.dimensions;
    for (const listener of this._listeners) {
      listener(dims);
    }
  }
}
