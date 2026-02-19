/**
 * Tests for the CE-1 dividend calculator.
 *
 * Covers three-tier distribution (direct contributors, infrastructure commons,
 * universal base dividend), proportional allocation, UBD fairness,
 * auditability, and edge cases.
 */

import { describe, it, expect } from 'vitest';
import {
  DividendCalculator,
  DEFAULT_DIVIDEND_CONFIG,
} from '../dividend-calculator.js';
import type {
  DistributionPlan,
  TierAllocation,
  ContributorAllocation,
  DividendConfig,
} from '../dividend-calculator.js';
import type { WeightVector, ContributorWeight } from '../weighting-engine.js';

// ============================================================================
// Test Fixtures
// ============================================================================

function makeWeightVector(
  weights: Array<{
    contributorId: string;
    weight: number;
    entryCount?: number;
  }>,
): WeightVector {
  return {
    missionId: 'mission-2026-02-18-001',
    totalEntries: weights.reduce((sum, w) => sum + (w.entryCount ?? 1), 0),
    weights: weights.map((w) => ({
      contributorId: w.contributorId,
      weight: w.weight,
      entryCount: w.entryCount ?? 1,
      breakdown: {
        frequency: w.weight,
        criticalPath: w.weight,
        depthDecay: w.weight,
      },
    })),
    config: {
      frequencyRatio: 0.3,
      criticalPathRatio: 0.4,
      depthDecayRatio: 0.3,
      phaseScores: {},
      decayBase: 0.5,
    },
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('DividendCalculator', () => {
  // --------------------------------------------------------------------------
  // Constructor and configuration tests
  // --------------------------------------------------------------------------

  describe('constructor and configuration', () => {
    it('creates calculator with default config', () => {
      const calculator = new DividendCalculator();
      expect(calculator).toBeInstanceOf(DividendCalculator);
    });

    it('accepts a custom DividendConfig', () => {
      const calculator = new DividendCalculator({
        tier1Ratio: 0.5,
        tier2Ratio: 0.3,
        tier3Ratio: 0.2,
      });
      expect(calculator).toBeInstanceOf(DividendCalculator);
    });

    it('DEFAULT_DIVIDEND_CONFIG tier ratios sum to 1.0', () => {
      const sum =
        DEFAULT_DIVIDEND_CONFIG.tier1Ratio +
        DEFAULT_DIVIDEND_CONFIG.tier2Ratio +
        DEFAULT_DIVIDEND_CONFIG.tier3Ratio;
      expect(Math.abs(sum - 1.0)).toBeLessThan(1e-10);
    });

    it('DEFAULT_DIVIDEND_CONFIG.tier1Ratio is 0.60', () => {
      expect(DEFAULT_DIVIDEND_CONFIG.tier1Ratio).toBe(0.6);
    });

    it('DEFAULT_DIVIDEND_CONFIG.tier2Ratio is 0.25', () => {
      expect(DEFAULT_DIVIDEND_CONFIG.tier2Ratio).toBe(0.25);
    });

    it('DEFAULT_DIVIDEND_CONFIG.tier3Ratio is 0.15', () => {
      expect(DEFAULT_DIVIDEND_CONFIG.tier3Ratio).toBe(0.15);
    });

    it('DEFAULT_DIVIDEND_CONFIG has infrastructureContributorIds as empty Set', () => {
      expect(DEFAULT_DIVIDEND_CONFIG.infrastructureContributorIds).toBeInstanceOf(Set);
      expect(DEFAULT_DIVIDEND_CONFIG.infrastructureContributorIds.size).toBe(0);
    });
  });

  // --------------------------------------------------------------------------
  // Three-tier distribution tests
  // --------------------------------------------------------------------------

  describe('three-tier distribution', () => {
    it('distributes correctly with no infrastructure contributors', () => {
      const calculator = new DividendCalculator();
      const wv = makeWeightVector([
        { contributorId: 'contrib-alice', weight: 0.7 },
        { contributorId: 'contrib-bob01', weight: 0.3 },
      ]);
      const plan = calculator.calculate(wv);

      const tier1 = plan.tiers.find(
        (t) => t.tierName === 'direct_contributors',
      )!;
      // With no infra contributors, tier2 redistributes to tier1
      // effectiveTier1 = 0.60 + 0.25 = 0.85
      const aliceTier1 = tier1.allocations.find(
        (a) => a.contributorId === 'contrib-alice',
      )!;
      const bobTier1 = tier1.allocations.find(
        (a) => a.contributorId === 'contrib-bob01',
      )!;
      expect(aliceTier1.amount).toBeCloseTo(0.7 * 0.85, 5);
      expect(bobTier1.amount).toBeCloseTo(0.3 * 0.85, 5);

      const tier3 = plan.tiers.find(
        (t) => t.tierName === 'universal_base_dividend',
      )!;
      expect(tier3.allocations[0].amount).toBeCloseTo(0.15 / 2, 5);
      expect(tier3.allocations[1].amount).toBeCloseTo(0.15 / 2, 5);
    });

    it('allocates Tier 2 to infrastructure contributors', () => {
      const calculator = new DividendCalculator({
        infrastructureContributorIds: new Set(['contrib-bob01']),
      });
      const wv = makeWeightVector([
        { contributorId: 'contrib-alice', weight: 0.7 },
        { contributorId: 'contrib-bob01', weight: 0.3 },
      ]);
      const plan = calculator.calculate(wv);

      const tier2 = plan.tiers.find(
        (t) => t.tierName === 'infrastructure_commons',
      )!;
      // Bob is sole infra contributor, gets entire tier2 pool
      expect(tier2.allocations).toHaveLength(1);
      expect(tier2.allocations[0].contributorId).toBe('contrib-bob01');
      expect(tier2.allocations[0].amount).toBeCloseTo(0.25, 5);
    });

    it('multiple infrastructure contributors split Tier 2 by weights', () => {
      const calculator = new DividendCalculator({
        infrastructureContributorIds: new Set([
          'contrib-alice',
          'contrib-bob01',
        ]),
      });
      const wv = makeWeightVector([
        { contributorId: 'contrib-alice', weight: 0.7 },
        { contributorId: 'contrib-bob01', weight: 0.3 },
      ]);
      const plan = calculator.calculate(wv);

      const tier2 = plan.tiers.find(
        (t) => t.tierName === 'infrastructure_commons',
      )!;
      const aliceInfra = tier2.allocations.find(
        (a) => a.contributorId === 'contrib-alice',
      )!;
      const bobInfra = tier2.allocations.find(
        (a) => a.contributorId === 'contrib-bob01',
      )!;
      // Alice: 0.7/1.0 * 0.25 = 0.175, Bob: 0.3/1.0 * 0.25 = 0.075
      expect(aliceInfra.amount).toBeCloseTo(0.175, 5);
      expect(bobInfra.amount).toBeCloseTo(0.075, 5);
    });
  });

  // --------------------------------------------------------------------------
  // Universal Base Dividend tests (Tier 3)
  // --------------------------------------------------------------------------

  describe('universal base dividend', () => {
    it('UBD is split equally regardless of weight', () => {
      const calculator = new DividendCalculator({
        infrastructureContributorIds: new Set(['contrib-alice']),
      });
      const wv = makeWeightVector([
        { contributorId: 'contrib-alice', weight: 0.99 },
        { contributorId: 'contrib-bob01', weight: 0.01 },
      ]);
      const plan = calculator.calculate(wv);

      const tier3 = plan.tiers.find(
        (t) => t.tierName === 'universal_base_dividend',
      )!;
      expect(tier3.allocations[0].amount).toBeCloseTo(
        tier3.allocations[1].amount,
        10,
      );
    });

    it('with 5 contributors each gets 0.15/5 = 0.03 from UBD', () => {
      const calculator = new DividendCalculator({
        infrastructureContributorIds: new Set(['contrib-alice']),
      });
      const wv = makeWeightVector([
        { contributorId: 'contrib-alice', weight: 0.5 },
        { contributorId: 'contrib-bob01', weight: 0.2 },
        { contributorId: 'contrib-carol', weight: 0.15 },
        { contributorId: 'contrib-dave1', weight: 0.1 },
        { contributorId: 'contrib-eve01', weight: 0.05 },
      ]);
      const plan = calculator.calculate(wv);

      const tier3 = plan.tiers.find(
        (t) => t.tierName === 'universal_base_dividend',
      )!;
      for (const alloc of tier3.allocations) {
        expect(alloc.amount).toBeCloseTo(0.03, 5);
      }
    });

    it('UBD ensures smallest contributor receives non-zero allocation', () => {
      const calculator = new DividendCalculator({
        infrastructureContributorIds: new Set(['contrib-alice']),
      });
      const wv = makeWeightVector([
        { contributorId: 'contrib-alice', weight: 0.99 },
        { contributorId: 'contrib-bob01', weight: 0.01 },
      ]);
      const plan = calculator.calculate(wv);

      const tier3 = plan.tiers.find(
        (t) => t.tierName === 'universal_base_dividend',
      )!;
      const bobUBD = tier3.allocations.find(
        (a) => a.contributorId === 'contrib-bob01',
      )!;
      expect(bobUBD.amount).toBeGreaterThan(0);
    });
  });

  // --------------------------------------------------------------------------
  // Allocation totals tests
  // --------------------------------------------------------------------------

  describe('allocation totals', () => {
    it('all allocations sum to 1.0', () => {
      const calculator = new DividendCalculator({
        infrastructureContributorIds: new Set(['contrib-bob01']),
      });
      const wv = makeWeightVector([
        { contributorId: 'contrib-alice', weight: 0.6 },
        { contributorId: 'contrib-bob01', weight: 0.25 },
        { contributorId: 'contrib-carol', weight: 0.15 },
      ]);
      const plan = calculator.calculate(wv);

      let total = 0;
      for (const tier of plan.tiers) {
        for (const alloc of tier.allocations) {
          total += alloc.amount;
        }
      }
      expect(Math.abs(total - 1.0)).toBeLessThan(1e-10);
    });

    it('no individual allocation is negative', () => {
      const calculator = new DividendCalculator({
        infrastructureContributorIds: new Set(['contrib-bob01']),
      });
      const wv = makeWeightVector([
        { contributorId: 'contrib-alice', weight: 0.8 },
        { contributorId: 'contrib-bob01', weight: 0.2 },
      ]);
      const plan = calculator.calculate(wv);

      for (const tier of plan.tiers) {
        for (const alloc of tier.allocations) {
          expect(alloc.amount).toBeGreaterThanOrEqual(0);
        }
      }
    });

    it('with no infrastructure contributors, Tier 2 redistributes to Tier 1', () => {
      const calculator = new DividendCalculator();
      const wv = makeWeightVector([
        { contributorId: 'contrib-alice', weight: 0.6 },
        { contributorId: 'contrib-bob01', weight: 0.4 },
      ]);
      const plan = calculator.calculate(wv);

      const tier2 = plan.tiers.find(
        (t) => t.tierName === 'infrastructure_commons',
      )!;
      expect(tier2.allocations).toHaveLength(0);
      expect(tier2.totalAllocation).toBe(0);

      // Tier 1 should get 0.60 + 0.25 = 0.85
      const tier1 = plan.tiers.find(
        (t) => t.tierName === 'direct_contributors',
      )!;
      expect(tier1.totalAllocation).toBeCloseTo(0.85, 5);
    });
  });

  // --------------------------------------------------------------------------
  // Distribution plan structure tests
  // --------------------------------------------------------------------------

  describe('distribution plan structure', () => {
    it('calculate returns a DistributionPlan', () => {
      const calculator = new DividendCalculator();
      const wv = makeWeightVector([
        { contributorId: 'contrib-alice', weight: 1.0 },
      ]);
      const plan = calculator.calculate(wv);
      expect(plan).toHaveProperty('missionId');
      expect(plan).toHaveProperty('tiers');
      expect(plan).toHaveProperty('calculatedAt');
    });

    it('DistributionPlan has missionId matching input', () => {
      const calculator = new DividendCalculator();
      const wv = makeWeightVector([
        { contributorId: 'contrib-alice', weight: 1.0 },
      ]);
      const plan = calculator.calculate(wv);
      expect(plan.missionId).toBe('mission-2026-02-18-001');
    });

    it('DistributionPlan has exactly 3 tiers', () => {
      const calculator = new DividendCalculator();
      const wv = makeWeightVector([
        { contributorId: 'contrib-alice', weight: 1.0 },
      ]);
      const plan = calculator.calculate(wv);
      expect(plan.tiers).toHaveLength(3);
    });

    it('tiers have correct tier names', () => {
      const calculator = new DividendCalculator();
      const wv = makeWeightVector([
        { contributorId: 'contrib-alice', weight: 1.0 },
      ]);
      const plan = calculator.calculate(wv);
      const names = plan.tiers.map((t) => t.tierName);
      expect(names).toContain('direct_contributors');
      expect(names).toContain('infrastructure_commons');
      expect(names).toContain('universal_base_dividend');
    });

    it('each TierAllocation has totalAllocation', () => {
      const calculator = new DividendCalculator();
      const wv = makeWeightVector([
        { contributorId: 'contrib-alice', weight: 1.0 },
      ]);
      const plan = calculator.calculate(wv);
      for (const tier of plan.tiers) {
        expect(typeof tier.totalAllocation).toBe('number');
      }
    });

    it('each TierAllocation has allocations array', () => {
      const calculator = new DividendCalculator();
      const wv = makeWeightVector([
        { contributorId: 'contrib-alice', weight: 1.0 },
      ]);
      const plan = calculator.calculate(wv);
      for (const tier of plan.tiers) {
        expect(Array.isArray(tier.allocations)).toBe(true);
      }
    });

    it('each ContributorAllocation has contributorId, amount, and reasoning', () => {
      const calculator = new DividendCalculator();
      const wv = makeWeightVector([
        { contributorId: 'contrib-alice', weight: 1.0 },
      ]);
      const plan = calculator.calculate(wv);
      for (const tier of plan.tiers) {
        for (const alloc of tier.allocations) {
          expect(alloc).toHaveProperty('contributorId');
          expect(alloc).toHaveProperty('amount');
          expect(alloc).toHaveProperty('reasoning');
        }
      }
    });
  });

  // --------------------------------------------------------------------------
  // Auditability tests
  // --------------------------------------------------------------------------

  describe('auditability', () => {
    it('DistributionPlan has calculatedAt ISO timestamp', () => {
      const calculator = new DividendCalculator();
      const wv = makeWeightVector([
        { contributorId: 'contrib-alice', weight: 1.0 },
      ]);
      const plan = calculator.calculate(wv);
      expect(plan.calculatedAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
      );
    });

    it('DistributionPlan has inputWeightVector reference', () => {
      const calculator = new DividendCalculator();
      const wv = makeWeightVector([
        { contributorId: 'contrib-alice', weight: 1.0 },
      ]);
      const plan = calculator.calculate(wv);
      expect(plan.inputWeightVector).toBe(wv);
    });

    it('DistributionPlan has config recording DividendConfig used', () => {
      const calculator = new DividendCalculator();
      const wv = makeWeightVector([
        { contributorId: 'contrib-alice', weight: 1.0 },
      ]);
      const plan = calculator.calculate(wv);
      expect(plan.config.tier1Ratio).toBe(0.6);
      expect(plan.config.tier2Ratio).toBe(0.25);
      expect(plan.config.tier3Ratio).toBe(0.15);
    });

    it('reasoning explains how amount was derived', () => {
      const calculator = new DividendCalculator();
      const wv = makeWeightVector([
        { contributorId: 'contrib-alice', weight: 1.0 },
      ]);
      const plan = calculator.calculate(wv);
      const tier1 = plan.tiers.find(
        (t) => t.tierName === 'direct_contributors',
      )!;
      expect(tier1.allocations[0].reasoning).toContain('weight');
    });

    it('DistributionPlan has sealed field initially false', () => {
      const calculator = new DividendCalculator();
      const wv = makeWeightVector([
        { contributorId: 'contrib-alice', weight: 1.0 },
      ]);
      const plan = calculator.calculate(wv);
      expect(plan.sealed).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // Edge case tests
  // --------------------------------------------------------------------------

  describe('edge cases', () => {
    it('empty weight vector produces empty DistributionPlan', () => {
      const calculator = new DividendCalculator();
      const wv = makeWeightVector([]);
      const plan = calculator.calculate(wv);
      for (const tier of plan.tiers) {
        expect(tier.allocations).toHaveLength(0);
        expect(tier.totalAllocation).toBe(0);
      }
    });

    it('single contributor gets tier1 + tier3 = 1.0 (tier2 redistributed)', () => {
      const calculator = new DividendCalculator();
      const wv = makeWeightVector([
        { contributorId: 'contrib-alice', weight: 1.0 },
      ]);
      const plan = calculator.calculate(wv);

      let total = 0;
      for (const tier of plan.tiers) {
        for (const alloc of tier.allocations) {
          total += alloc.amount;
        }
      }
      expect(Math.abs(total - 1.0)).toBeLessThan(1e-10);
    });

    it('custom config with tier1Ratio 1.0 gives all value to direct contributors', () => {
      const calculator = new DividendCalculator({
        tier1Ratio: 1.0,
        tier2Ratio: 0,
        tier3Ratio: 0,
      });
      const wv = makeWeightVector([
        { contributorId: 'contrib-alice', weight: 0.7 },
        { contributorId: 'contrib-bob01', weight: 0.3 },
      ]);
      const plan = calculator.calculate(wv);

      const tier1 = plan.tiers.find(
        (t) => t.tierName === 'direct_contributors',
      )!;
      expect(tier1.totalAllocation).toBeCloseTo(1.0, 5);
      const alice = tier1.allocations.find(
        (a) => a.contributorId === 'contrib-alice',
      )!;
      expect(alice.amount).toBeCloseTo(0.7, 5);
    });

    it('config validation: tier ratios that do not sum to 1.0 throws', () => {
      expect(
        () =>
          new DividendCalculator({
            tier1Ratio: 0.5,
            tier2Ratio: 0.3,
            tier3Ratio: 0.3,
          }),
      ).toThrow('Tier ratios must sum to 1.0');
    });
  });
});
