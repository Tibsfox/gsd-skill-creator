/**
 * CE-1 dividend calculator.
 *
 * Transforms a normalized weight vector into a three-tier distribution plan:
 *
 * 1. **Tier 1 -- Direct Contributors:** Weighted share proportional to each
 *    contributor's weight from the weight vector.
 * 2. **Tier 2 -- Infrastructure Commons:** Shared pool allocated among
 *    infrastructure contributors by their relative weights.
 * 3. **Tier 3 -- Universal Base Dividend (UBD):** Equal share for ALL
 *    contributors regardless of contribution size.
 *
 * The calculator is output-only: it produces a distribution plan but does
 * not execute any payments (per REQUIREMENTS.md Out of Scope).
 *
 * When no infrastructure contributors are specified, Tier 2's share is
 * redistributed to Tier 1 so that no value is lost.
 */

import type { WeightVector, ContributorWeight } from './weighting-engine.js';

// ============================================================================
// Types
// ============================================================================

/** Allocation for a single contributor within a tier. */
export interface ContributorAllocation {
  /** Contributor identifier. */
  contributorId: string;
  /** Allocated share (0-1, fraction of total distributable value). */
  amount: number;
  /** Human-readable explanation of how amount was derived. */
  reasoning: string;
}

/** Allocation summary for a single distribution tier. */
export interface TierAllocation {
  /** Tier name matching TOKEN_ARCHITECTURE tier names. */
  tierName:
    | 'direct_contributors'
    | 'infrastructure_commons'
    | 'universal_base_dividend';
  /** Total allocation ratio for this tier. */
  totalAllocation: number;
  /** Per-contributor allocations within this tier. */
  allocations: ContributorAllocation[];
}

/** The complete distribution plan for a mission. */
export interface DistributionPlan {
  /** Mission this plan is for. */
  missionId: string;
  /** ISO 8601 timestamp when this plan was calculated. */
  calculatedAt: string;
  /** The three distribution tiers with allocations. */
  tiers: TierAllocation[];
  /** The input weight vector used. */
  inputWeightVector: WeightVector;
  /** The configuration used for this calculation. */
  config: DividendConfig;
  /** Whether this plan has been sealed (immutable). */
  sealed: boolean;
}

/** Configuration for the dividend calculator. */
export interface DividendConfig {
  /** Fraction of total value for Tier 1 (direct contributors). Must be 0-1. */
  tier1Ratio: number;
  /** Fraction of total value for Tier 2 (infrastructure commons). Must be 0-1. */
  tier2Ratio: number;
  /** Fraction of total value for Tier 3 (universal base dividend). Must be 0-1. */
  tier3Ratio: number;
  /** ContributorIDs that qualify for infrastructure commons (Tier 2). */
  infrastructureContributorIds: Set<string>;
}

// ============================================================================
// Default Configuration
// ============================================================================

/**
 * Default dividend configuration.
 *
 * 60% rewards direct work proportionally, 25% maintains shared
 * infrastructure, 15% ensures universal participation regardless
 * of contribution size.
 */
export const DEFAULT_DIVIDEND_CONFIG: DividendConfig = {
  tier1Ratio: 0.6,
  tier2Ratio: 0.25,
  tier3Ratio: 0.15,
  infrastructureContributorIds: new Set(),
};

// ============================================================================
// DividendCalculator
// ============================================================================

/**
 * Produces three-tier distribution plans from weight vectors.
 *
 * Output only -- no payment execution, no side effects.
 */
export class DividendCalculator {
  private readonly config: DividendConfig;

  constructor(config?: Partial<DividendConfig>) {
    const merged = { ...DEFAULT_DIVIDEND_CONFIG, ...config };
    // Validate tier ratios sum to 1.0
    const sum = merged.tier1Ratio + merged.tier2Ratio + merged.tier3Ratio;
    if (Math.abs(sum - 1.0) > 1e-10) {
      throw new Error('Tier ratios must sum to 1.0');
    }
    this.config = merged;
  }

  /**
   * Calculate a three-tier distribution plan from a weight vector.
   *
   * Output only -- no payment execution, no side effects.
   *
   * @param weightVector - Normalized weight vector from WeightingEngine
   * @returns Auditable three-tier distribution plan
   */
  calculate(weightVector: WeightVector): DistributionPlan {
    const contributors = weightVector.weights;
    const contributorCount = contributors.length;

    // Handle empty vector
    if (contributorCount === 0) {
      return {
        missionId: weightVector.missionId,
        calculatedAt: new Date().toISOString(),
        tiers: [
          {
            tierName: 'direct_contributors',
            totalAllocation: 0,
            allocations: [],
          },
          {
            tierName: 'infrastructure_commons',
            totalAllocation: 0,
            allocations: [],
          },
          {
            tierName: 'universal_base_dividend',
            totalAllocation: 0,
            allocations: [],
          },
        ],
        inputWeightVector: weightVector,
        config: { ...this.config },
        sealed: false,
      };
    }

    // Determine infrastructure contributors present in this weight vector
    const infraContributors = contributors.filter((c) =>
      this.config.infrastructureContributorIds.has(c.contributorId),
    );
    const hasInfraContributors = infraContributors.length > 0;

    // Calculate effective tier ratios
    const effectiveTier1 = hasInfraContributors
      ? this.config.tier1Ratio
      : this.config.tier1Ratio + this.config.tier2Ratio;
    const effectiveTier2 = hasInfraContributors ? this.config.tier2Ratio : 0;
    const effectiveTier3 = this.config.tier3Ratio;

    // Tier 1 -- Direct Contributors
    const tier1Allocations: ContributorAllocation[] = contributors.map((c) => {
      const amount = c.weight * effectiveTier1;
      return {
        contributorId: c.contributorId,
        amount,
        reasoning: `weight ${c.weight.toFixed(6)} * tier1 ratio ${effectiveTier1.toFixed(2)} = ${amount.toFixed(6)}`,
      };
    });

    // Tier 2 -- Infrastructure Commons
    const tier2Allocations: ContributorAllocation[] = [];
    if (hasInfraContributors) {
      const totalInfraWeight = infraContributors.reduce(
        (sum, c) => sum + c.weight,
        0,
      );
      for (const c of infraContributors) {
        const infraShare =
          totalInfraWeight > 0 ? c.weight / totalInfraWeight : 0;
        const amount = infraShare * effectiveTier2;
        tier2Allocations.push({
          contributorId: c.contributorId,
          amount,
          reasoning: `infrastructure share ${infraShare.toFixed(6)} * tier2 ratio ${effectiveTier2.toFixed(2)} = ${amount.toFixed(6)}`,
        });
      }
    }

    // Tier 3 -- Universal Base Dividend
    const ubdPerContributor =
      contributorCount > 0 ? effectiveTier3 / contributorCount : 0;
    const tier3Allocations: ContributorAllocation[] = contributors.map((c) => ({
      contributorId: c.contributorId,
      amount: ubdPerContributor,
      reasoning: `equal UBD share: tier3 ratio ${effectiveTier3.toFixed(2)} / ${contributorCount} contributors = ${ubdPerContributor.toFixed(6)}`,
    }));

    // Assemble distribution plan
    return {
      missionId: weightVector.missionId,
      calculatedAt: new Date().toISOString(),
      tiers: [
        {
          tierName: 'direct_contributors',
          totalAllocation: effectiveTier1,
          allocations: tier1Allocations,
        },
        {
          tierName: 'infrastructure_commons',
          totalAllocation: effectiveTier2,
          allocations: tier2Allocations,
        },
        {
          tierName: 'universal_base_dividend',
          totalAllocation: effectiveTier3,
          allocations: tier3Allocations,
        },
      ],
      inputWeightVector: weightVector,
      config: { ...this.config },
      sealed: false,
    };
  }
}
