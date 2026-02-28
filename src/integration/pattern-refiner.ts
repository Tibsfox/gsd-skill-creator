/**
 * MFE pattern refiner — analyzes observation data to update primitive
 * applicability patterns, improving future activation accuracy.
 *
 * The refiner is a pure analysis layer. It reads observations and primitives,
 * then produces a changeset of pattern additions. It never mutates the input
 * data directly — the caller decides whether to apply refinements.
 *
 * This respects the bounded learning guardrail: "All refinements require
 * user confirmation."
 *
 * @module integration/pattern-refiner
 */

import type {
  MFEObservation,
  MathematicalPrimitive,
} from '../core/types/mfe-types.js';

// ============================================================================
// Types
// ============================================================================

/** A single primitive's refinement: patterns to add based on observation data. */
export interface PatternRefinement {
  /** The primitive receiving new patterns. */
  primitiveId: string;
  /** Existing applicabilityPatterns on the primitive (unchanged). */
  currentPatterns: string[];
  /** New patterns to add (deduplicated, not already present). */
  newPatterns: string[];
  /** How many positive observations included this primitive. */
  observationCount: number;
  /** Confidence score: observationCount / totalPositiveObservations. */
  confidence: number;
}

/** Aggregate result of a refinement analysis run. */
export interface RefinementResult {
  /** Array of per-primitive refinements (only those meeting threshold). */
  refinements: PatternRefinement[];
  /** Total observations provided to the refiner. */
  totalObservations: number;
  /** Observations that passed the positive filter. */
  positiveObservations: number;
  /** Total unique primitives seen across positive observations. */
  primitivesAnalyzed: number;
  /** Number of primitives that met threshold and have new patterns. */
  primitivesRefined: number;
  /** ISO 8601 timestamp of when analysis was performed. */
  timestamp: string;
}

/** Configuration for the pattern refiner. */
export interface PatternRefinerOptions {
  /** Minimum positive observations for a primitive to qualify for refinement. Default: 3. */
  minObservationThreshold?: number;
}

/** The pattern refiner interface. */
export interface PatternRefiner {
  /**
   * Analyze observations against known primitives and produce refinement changesets.
   *
   * @param observations - All observations to analyze
   * @param primitives - Map of primitiveId to MathematicalPrimitive
   * @returns A RefinementResult with proposed pattern additions
   */
  refine(
    observations: MFEObservation[],
    primitives: Map<string, MathematicalPrimitive>,
  ): RefinementResult;
}

// ============================================================================
// Filtering
// ============================================================================

/**
 * An observation is positive if:
 * - verificationResult === 'passed'
 * - userFeedback !== 'negative'
 */
function isPositive(obs: MFEObservation): boolean {
  return obs.verificationResult === 'passed' && obs.userFeedback !== 'negative';
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create a pattern refiner instance.
 *
 * @param options - Optional configuration (observation threshold)
 * @returns A PatternRefiner for analyzing observations and producing refinements
 */
export function createPatternRefiner(
  options?: PatternRefinerOptions,
): PatternRefiner {
  const threshold = options?.minObservationThreshold ?? 3;

  return {
    refine(
      observations: MFEObservation[],
      primitives: Map<string, MathematicalPrimitive>,
    ): RefinementResult {
      const positiveObs = observations.filter(isPositive);

      // Count primitive frequency + collect associated problem hashes
      const primitiveFrequency = new Map<string, Set<string>>();

      for (const obs of positiveObs) {
        for (const pid of obs.primitivesUsed) {
          if (!primitiveFrequency.has(pid)) {
            primitiveFrequency.set(pid, new Set());
          }
          primitiveFrequency.get(pid)!.add(obs.problemHash);
        }
      }

      // Build refinements for primitives meeting threshold
      const refinements: PatternRefinement[] = [];

      for (const [pid, hashes] of primitiveFrequency) {
        const obsCount = hashes.size;
        if (obsCount < threshold) {
          continue;
        }

        const primitive = primitives.get(pid);
        if (!primitive) {
          continue;
        }

        const existingPatterns = new Set(
          primitive.applicabilityPatterns.map((p) => p.toLowerCase().trim()),
        );

        // Extract new patterns from problem hashes (deduplicated)
        const candidatePatterns = new Set<string>();
        for (const hash of hashes) {
          const normalized = hash.toLowerCase().trim();
          if (normalized && !existingPatterns.has(normalized)) {
            candidatePatterns.add(normalized);
          }
        }

        if (candidatePatterns.size === 0) {
          continue;
        }

        refinements.push({
          primitiveId: pid,
          currentPatterns: [...primitive.applicabilityPatterns],
          newPatterns: [...candidatePatterns],
          observationCount: obsCount,
          confidence: Math.min(1, obsCount / Math.max(1, positiveObs.length)),
        });
      }

      return {
        refinements,
        totalObservations: observations.length,
        positiveObservations: positiveObs.length,
        primitivesAnalyzed: primitiveFrequency.size,
        primitivesRefined: refinements.length,
        timestamp: new Date().toISOString(),
      };
    },
  };
}
