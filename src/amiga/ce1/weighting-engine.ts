/**
 * CE-1 weighting engine.
 *
 * The core calculation module that transforms raw attribution ledger entries
 * into a normalized, auditable weight vector using three algorithms:
 *
 * 1. **Frequency**: Contributors with more invocations receive higher weight
 * 2. **Critical-path**: Entries in later mission phases score higher
 * 3. **Depth-decay**: Transitive dependencies decay geometrically by depth
 *
 * The weight vector feeds directly into the dividend calculator (Plan 02).
 * All weights sum to exactly 1.0, and each contributor's weight includes
 * a full breakdown of the three components for auditability.
 */

import type { LedgerEntry } from './attribution-ledger.js';
import type { DependencyNode } from '../icd/icd-02.js';

// ============================================================================
// Types
// ============================================================================

/** Breakdown of the three weight components for auditability. */
export interface WeightBreakdown {
  /** Frequency component: how often this contributor was invoked. */
  frequency: number;
  /** Critical-path component: how critical the phases of contribution were. */
  criticalPath: number;
  /** Depth-decay component: direct contribution strength plus decayed dependency weight. */
  depthDecay: number;
}

/** A single contributor's calculated weight with full audit trail. */
export interface ContributorWeight {
  /** Contributor identifier. */
  contributorId: string;
  /** Normalized composite weight (0-1, all weights sum to 1.0). */
  weight: number;
  /** Number of ledger entries for this contributor. */
  entryCount: number;
  /** Breakdown of the three component weights before normalization. */
  breakdown: WeightBreakdown;
}

/** The complete weight vector for a mission -- the output of the weighting engine. */
export interface WeightVector {
  /** Mission this weight vector is for. */
  missionId: string;
  /** Total ledger entries processed. */
  totalEntries: number;
  /** Contributor weights, sorted descending by weight. */
  weights: ContributorWeight[];
  /** The configuration used for this calculation (audit trail). */
  config: WeightingConfig;
}

/** Configuration for the weighting algorithm. */
export interface WeightingConfig {
  /** Weight ratio for frequency component (0-1). All three ratios must sum to 1.0. */
  frequencyRatio: number;
  /** Weight ratio for critical-path component (0-1). */
  criticalPathRatio: number;
  /** Weight ratio for depth-decay component (0-1). */
  depthDecayRatio: number;
  /** Phase criticality scores. Higher = more critical. */
  phaseScores: Record<string, number>;
  /** Decay base for depth calculation (0-1 exclusive). Weight at depth d = base^d. */
  decayBase: number;
}

// ============================================================================
// Default Configuration
// ============================================================================

/**
 * Default weighting configuration.
 *
 * Critical-path gets 40% weight because contributions during integration
 * and review are disproportionately valuable. Frequency and depth-decay
 * split the remaining 60% equally.
 */
export const DEFAULT_WEIGHTING_CONFIG: WeightingConfig = {
  frequencyRatio: 0.3,
  criticalPathRatio: 0.4,
  depthDecayRatio: 0.3,
  phaseScores: {
    BRIEFING: 0.1,
    PLANNING: 0.2,
    EXECUTION: 0.5,
    INTEGRATION: 0.8,
    REVIEW_GATE: 0.9,
    COMPLETION: 1.0,
    HOLD: 0.05,
    ABORT: 0.0,
  },
  decayBase: 0.5,
};

// ============================================================================
// WeightingEngine
// ============================================================================

/**
 * Calculates normalized, auditable weight vectors from attribution ledger entries.
 *
 * The engine applies three weighting algorithms (frequency, critical-path,
 * depth-decay), normalizes each independently, combines them using configurable
 * ratios, and performs a final normalization so all weights sum to 1.0.
 */
export class WeightingEngine {
  private readonly config: WeightingConfig;

  constructor(config?: Partial<WeightingConfig>) {
    this.config = { ...DEFAULT_WEIGHTING_CONFIG, ...config };
  }

  /**
   * Calculate the normalized weight vector for a set of ledger entries.
   *
   * All entries must belong to the same mission.
   *
   * @param entries - Array of LedgerEntry records from the attribution ledger
   * @returns Normalized, auditable WeightVector
   * @throws If entries span multiple missions
   */
  calculateWeights(entries: readonly LedgerEntry[]): WeightVector {
    // Handle empty input
    if (entries.length === 0) {
      return {
        missionId: '',
        totalEntries: 0,
        weights: [],
        config: { ...this.config },
      };
    }

    // Validate single mission
    const missionIds = new Set(entries.map((e) => e.mission_id));
    if (missionIds.size > 1) {
      throw new Error('All entries must belong to the same mission');
    }
    const missionId = [...missionIds][0];

    // Group entries by contributor
    const grouped = new Map<string, LedgerEntry[]>();
    for (const entry of entries) {
      const existing = grouped.get(entry.contributor_id) ?? [];
      existing.push(entry);
      grouped.set(entry.contributor_id, existing);
    }

    // Calculate raw frequency scores and normalize
    const rawFrequency = new Map<string, number>();
    let maxFreq = 0;
    for (const [id, contribEntries] of grouped) {
      const count = contribEntries.length;
      rawFrequency.set(id, count);
      if (count > maxFreq) maxFreq = count;
    }
    const normFrequency = new Map<string, number>();
    for (const [id, count] of rawFrequency) {
      normFrequency.set(id, maxFreq > 0 ? count / maxFreq : 0);
    }

    // Calculate raw critical-path scores and normalize
    const rawCriticalPath = new Map<string, number>();
    let maxCP = 0;
    for (const [id, contribEntries] of grouped) {
      let totalScore = 0;
      for (const entry of contribEntries) {
        const phaseScore = this.config.phaseScores[entry.phase] ?? 0;
        totalScore += phaseScore;
      }
      const avgScore = totalScore / contribEntries.length;
      rawCriticalPath.set(id, avgScore);
      if (avgScore > maxCP) maxCP = avgScore;
    }
    const normCriticalPath = new Map<string, number>();
    for (const [id, score] of rawCriticalPath) {
      normCriticalPath.set(id, maxCP > 0 ? score / maxCP : 0);
    }

    // Calculate raw depth-decay scores and normalize
    const rawDepthDecay = new Map<string, number>();
    let maxDD = 0;
    for (const [id, contribEntries] of grouped) {
      let totalDD = 0;
      for (const entry of contribEntries) {
        // Start with context_weight (base contribution strength)
        let entryScore = entry.context_weight;
        // Add decayed dependency contribution
        for (const dep of entry.dependency_tree as DependencyNode[]) {
          entryScore +=
            dep.decay_factor * Math.pow(this.config.decayBase, dep.depth);
        }
        totalDD += entryScore;
      }
      rawDepthDecay.set(id, totalDD);
      if (totalDD > maxDD) maxDD = totalDD;
    }
    const normDepthDecay = new Map<string, number>();
    for (const [id, score] of rawDepthDecay) {
      normDepthDecay.set(id, maxDD > 0 ? score / maxDD : 0);
    }

    // Combine into composite scores
    const composites = new Map<string, number>();
    let totalComposite = 0;
    for (const [id] of grouped) {
      const freq = normFrequency.get(id) ?? 0;
      const cp = normCriticalPath.get(id) ?? 0;
      const dd = normDepthDecay.get(id) ?? 0;
      const composite =
        freq * this.config.frequencyRatio +
        cp * this.config.criticalPathRatio +
        dd * this.config.depthDecayRatio;
      composites.set(id, composite);
      totalComposite += composite;
    }

    // Build ContributorWeight array with final normalization
    const weights: ContributorWeight[] = [];
    for (const [id, contribEntries] of grouped) {
      const composite = composites.get(id) ?? 0;
      const normalizedWeight =
        totalComposite > 0 ? composite / totalComposite : 0;

      weights.push({
        contributorId: id,
        weight: normalizedWeight,
        entryCount: contribEntries.length,
        breakdown: {
          frequency: normFrequency.get(id) ?? 0,
          criticalPath: normCriticalPath.get(id) ?? 0,
          depthDecay: normDepthDecay.get(id) ?? 0,
        },
      });
    }

    // Sort descending by weight
    weights.sort((a, b) => b.weight - a.weight);

    return {
      missionId,
      totalEntries: entries.length,
      weights,
      config: { ...this.config },
    };
  }
}
