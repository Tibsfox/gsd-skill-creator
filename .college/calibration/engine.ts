/**
 * Calibration Engine -- universal Observe->Compare->Adjust->Record feedback loop.
 *
 * Processes calibration observations against domain-specific science models,
 * producing deltas that accumulate into user calibration profiles.
 *
 * @module calibration/engine
 */

import type { CalibrationDelta, CalibrationModel } from '../rosetta-core/types.js';

// ─── Supporting Types ───────────────────────────────────────────────────────

/** User feedback capturing observed vs expected results for a domain. */
export interface UserFeedback {
  domain: string;
  translationId: string;
  observedResult: string;
  expectedResult: string;
  parameters: Record<string, number>;
}

/** Captured observation with timestamp. */
export interface ObservedResult {
  raw: string;
  timestamp: Date;
  parameters: Record<string, number>;
}

/** Comparison between observed and expected, with direction and magnitude. */
export interface ComparisonDelta {
  category: string;
  magnitude: number;
  direction: 'over' | 'under' | 'miss';
}

/**
 * A domain-specific calibration model that plugs into the universal CalibrationEngine.
 *
 * Implement this interface to add calibration support for a new domain.
 * Register the implementation with engine.registerModel(model) at startup.
 *
 * @example
 * const myModel: DomainCalibrationModel = {
 *   domain: 'my-domain',
 *   parameters: ['param1', 'param2'],
 *   science: 'Description of the scientific basis',
 *   safetyBoundaries: [],
 *   computeAdjustment: (delta) => ({ param1: -10 }),
 *   confidence: (delta) => 0.7
 * };
 * engine.registerModel(myModel);
 */
export interface DomainCalibrationModel extends CalibrationModel {
  /** Compute parameter adjustments from a comparison delta. Values are raw -- engine applies 20% bound. */
  computeAdjustment(delta: ComparisonDelta): Record<string, number>;
  /** Return confidence score [0,1] for this adjustment given the delta characteristics. */
  confidence(delta: ComparisonDelta): number;
}

/** Minimal DeltaStore interface for dependency injection. */
interface DeltaStore {
  save(delta: CalibrationDelta): Promise<void>;
  getHistory(): Promise<CalibrationDelta[]>;
}

// ─── CalibrationEngine ──────────────────────────────────────────────────────

/**
 * Universal calibration engine implementing the Observe->Compare->Adjust->Record feedback loop.
 *
 * Domain-specific behavior is provided by registering DomainCalibrationModel implementations.
 * The engine enforces a 20% maximum adjustment bound (CAL-06) across all domains.
 */
export class CalibrationEngine {
  private deltaStore: DeltaStore;
  private models: Map<string, DomainCalibrationModel> = new Map();

  constructor(deltaStore: DeltaStore) {
    this.deltaStore = deltaStore;
  }

  /** Register a domain-specific calibration model. */
  registerModel(model: DomainCalibrationModel): void {
    this.models.set(model.domain, model);
  }

  /**
   * Stage 1 -- OBSERVE: Capture feedback as an ObservedResult with timestamp.
   */
  private observe(feedback: UserFeedback): ObservedResult {
    return {
      raw: feedback.observedResult,
      timestamp: new Date(),
      parameters: { ...feedback.parameters },
    };
  }

  /**
   * Stage 2 -- COMPARE: Derive a ComparisonDelta from observed vs expected.
   */
  private compare(observed: ObservedResult, _expectedResult: string): ComparisonDelta {
    const raw = observed.raw.toLowerCase();
    const overPatterns = ['over', 'too much', 'high', 'burnt', 'dry'];
    const underPatterns = ['under', 'too little', 'low', 'raw', 'wet'];

    let direction: 'over' | 'under' | 'miss' = 'miss';
    if (overPatterns.some((p) => raw.includes(p))) {
      direction = 'over';
    } else if (underPatterns.some((p) => raw.includes(p))) {
      direction = 'under';
    }

    const paramKeys = Object.keys(observed.parameters);
    const category = paramKeys.length > 0 ? paramKeys[0] : 'unknown';

    return {
      category,
      magnitude: 1.0,
      direction,
    };
  }

  /**
   * Bound each adjustment value to at most 20% of the current parameter value (CAL-06).
   *
   * If currentParams[k] is 0 or undefined, the raw adjustment passes through unchanged.
   */
  boundAdjustment(
    rawAdj: Record<string, number>,
    currentParams: Record<string, number>,
  ): Record<string, number> {
    const bounded: Record<string, number> = {};

    for (const key of Object.keys(rawAdj)) {
      const raw = rawAdj[key];
      const current = currentParams[key];

      if (current === undefined || current === 0 || raw === 0) {
        bounded[key] = raw;
        continue;
      }

      const maxChange = Math.abs(current) * 0.20;
      if (Math.abs(raw) > maxChange) {
        bounded[key] = Math.sign(raw) * maxChange;
      } else {
        bounded[key] = raw;
      }
    }

    return bounded;
  }

  /**
   * Process user feedback through the full Observe->Compare->Adjust->Record cycle.
   *
   * @throws Error if no model is registered for the feedback domain
   */
  async process(feedback: UserFeedback): Promise<CalibrationDelta> {
    const model = this.models.get(feedback.domain);
    if (!model) {
      throw new Error(`No calibration model registered for domain: ${feedback.domain}`);
    }

    // Stage 1: Observe
    const observed = this.observe(feedback);

    // Stage 2: Compare
    const delta = this.compare(observed, feedback.expectedResult);

    // Stage 3: Adjust (with 20% bound)
    const rawAdj = model.computeAdjustment(delta);
    const boundedAdj = this.boundAdjustment(rawAdj, feedback.parameters);

    // Build CalibrationDelta
    const calibrationDelta: CalibrationDelta = {
      observedResult: feedback.observedResult,
      expectedResult: feedback.expectedResult,
      adjustment: boundedAdj,
      confidence: model.confidence(delta),
      domainModel: feedback.domain,
      timestamp: observed.timestamp,
    };

    // Stage 4: Record
    await this.deltaStore.save(calibrationDelta);

    return calibrationDelta;
  }
}
