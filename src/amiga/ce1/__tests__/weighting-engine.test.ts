/**
 * Tests for the CE-1 weighting engine.
 *
 * Covers frequency, critical-path, and depth-decay weight calculation,
 * normalization, auditability, and edge cases.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  WeightingEngine,
  DEFAULT_WEIGHTING_CONFIG,
} from '../weighting-engine.js';
import type {
  WeightVector,
  ContributorWeight,
  WeightBreakdown,
  WeightingConfig,
} from '../weighting-engine.js';
import type { LedgerEntry } from '../attribution-ledger.js';

// ============================================================================
// Test Fixtures
// ============================================================================

let entryCounter = 1;

function makeEntry(
  overrides: Partial<LedgerEntry> & { contributor_id: string },
): LedgerEntry {
  return {
    entry_id: `le-${String(entryCounter++).padStart(6, '0')}`,
    mission_id: 'mission-2026-02-18-001',
    agent_id: 'CE-1',
    skill_name: 'test-skill',
    phase: 'EXECUTION',
    timestamp: '2026-02-18T10:00:00Z',
    context_weight: 0.8,
    dependency_tree: [],
    ...overrides,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('WeightingEngine', () => {
  beforeEach(() => {
    entryCounter = 1;
  });

  // --------------------------------------------------------------------------
  // Constructor and configuration tests
  // --------------------------------------------------------------------------

  describe('constructor and configuration', () => {
    it('creates engine with default config', () => {
      const engine = new WeightingEngine();
      expect(engine).toBeInstanceOf(WeightingEngine);
    });

    it('accepts a custom WeightingConfig', () => {
      const custom: Partial<WeightingConfig> = {
        frequencyRatio: 0.5,
        criticalPathRatio: 0.3,
        depthDecayRatio: 0.2,
      };
      const engine = new WeightingEngine(custom);
      expect(engine).toBeInstanceOf(WeightingEngine);
    });

    it('DEFAULT_WEIGHTING_CONFIG ratios sum to 1.0', () => {
      const sum =
        DEFAULT_WEIGHTING_CONFIG.frequencyRatio +
        DEFAULT_WEIGHTING_CONFIG.criticalPathRatio +
        DEFAULT_WEIGHTING_CONFIG.depthDecayRatio;
      expect(Math.abs(sum - 1.0)).toBeLessThan(1e-10);
    });

    it('DEFAULT_WEIGHTING_CONFIG has phaseScores for all 8 PhaseStatus values', () => {
      const phases = [
        'BRIEFING',
        'PLANNING',
        'EXECUTION',
        'INTEGRATION',
        'REVIEW_GATE',
        'COMPLETION',
        'HOLD',
        'ABORT',
      ];
      for (const phase of phases) {
        expect(DEFAULT_WEIGHTING_CONFIG.phaseScores).toHaveProperty(phase);
        expect(typeof DEFAULT_WEIGHTING_CONFIG.phaseScores[phase]).toBe(
          'number',
        );
      }
    });

    it('DEFAULT_WEIGHTING_CONFIG has decayBase between 0 and 1 exclusive', () => {
      expect(DEFAULT_WEIGHTING_CONFIG.decayBase).toBeGreaterThan(0);
      expect(DEFAULT_WEIGHTING_CONFIG.decayBase).toBeLessThan(1);
    });
  });

  // --------------------------------------------------------------------------
  // Frequency weight tests
  // --------------------------------------------------------------------------

  describe('frequency weight', () => {
    it('contributor with 3 entries has 3x the raw frequency weight of contributor with 1', () => {
      const engine = new WeightingEngine();
      const entries = [
        makeEntry({ contributor_id: 'contrib-alice' }),
        makeEntry({ contributor_id: 'contrib-alice' }),
        makeEntry({ contributor_id: 'contrib-alice' }),
        makeEntry({ contributor_id: 'contrib-bob01' }),
      ];
      const result = engine.calculateWeights(entries);
      const alice = result.weights.find(
        (w) => w.contributorId === 'contrib-alice',
      )!;
      const bob = result.weights.find(
        (w) => w.contributorId === 'contrib-bob01',
      )!;
      // Alice has 3x frequency, Bob has 1x -> Alice's frequency component = 1.0, Bob's = 1/3
      expect(alice.breakdown.frequency).toBeCloseTo(1.0, 5);
      expect(bob.breakdown.frequency).toBeCloseTo(1 / 3, 5);
    });

    it('single contributor gets frequency weight 1.0', () => {
      const engine = new WeightingEngine();
      const entries = [makeEntry({ contributor_id: 'contrib-alice' })];
      const result = engine.calculateWeights(entries);
      expect(result.weights[0].breakdown.frequency).toBeCloseTo(1.0, 5);
    });

    it('three contributors with equal entries get equal frequency weight', () => {
      const engine = new WeightingEngine();
      const entries = [
        makeEntry({ contributor_id: 'contrib-alice' }),
        makeEntry({ contributor_id: 'contrib-bob01' }),
        makeEntry({ contributor_id: 'contrib-carol' }),
      ];
      const result = engine.calculateWeights(entries);
      for (const w of result.weights) {
        expect(w.breakdown.frequency).toBeCloseTo(1.0, 5);
      }
    });
  });

  // --------------------------------------------------------------------------
  // Critical-path weight tests
  // --------------------------------------------------------------------------

  describe('critical-path weight', () => {
    it('INTEGRATION scores higher than BRIEFING', () => {
      const engine = new WeightingEngine();
      const entries = [
        makeEntry({
          contributor_id: 'contrib-alice',
          phase: 'INTEGRATION',
        }),
        makeEntry({
          contributor_id: 'contrib-bob01',
          phase: 'BRIEFING',
        }),
      ];
      const result = engine.calculateWeights(entries);
      const alice = result.weights.find(
        (w) => w.contributorId === 'contrib-alice',
      )!;
      const bob = result.weights.find(
        (w) => w.contributorId === 'contrib-bob01',
      )!;
      expect(alice.breakdown.criticalPath).toBeGreaterThan(
        bob.breakdown.criticalPath,
      );
    });

    it('REVIEW_GATE + INTEGRATION contributor has higher critical-path weight than BRIEFING-only', () => {
      const engine = new WeightingEngine();
      const entries = [
        makeEntry({
          contributor_id: 'contrib-alice',
          phase: 'REVIEW_GATE',
        }),
        makeEntry({
          contributor_id: 'contrib-alice',
          phase: 'INTEGRATION',
        }),
        makeEntry({
          contributor_id: 'contrib-bob01',
          phase: 'BRIEFING',
        }),
        makeEntry({
          contributor_id: 'contrib-bob01',
          phase: 'BRIEFING',
        }),
      ];
      const result = engine.calculateWeights(entries);
      const alice = result.weights.find(
        (w) => w.contributorId === 'contrib-alice',
      )!;
      const bob = result.weights.find(
        (w) => w.contributorId === 'contrib-bob01',
      )!;
      expect(alice.breakdown.criticalPath).toBeGreaterThan(
        bob.breakdown.criticalPath,
      );
    });

    it('phase score ordering: BRIEFING < PLANNING < EXECUTION < INTEGRATION < REVIEW_GATE < COMPLETION', () => {
      const scores = DEFAULT_WEIGHTING_CONFIG.phaseScores;
      expect(scores['BRIEFING']).toBeLessThan(scores['PLANNING']);
      expect(scores['PLANNING']).toBeLessThan(scores['EXECUTION']);
      expect(scores['EXECUTION']).toBeLessThan(scores['INTEGRATION']);
      expect(scores['INTEGRATION']).toBeLessThan(scores['REVIEW_GATE']);
      expect(scores['REVIEW_GATE']).toBeLessThan(scores['COMPLETION']);
    });

    it('HOLD and ABORT phases have lowest scores', () => {
      const scores = DEFAULT_WEIGHTING_CONFIG.phaseScores;
      expect(scores['HOLD']).toBeLessThan(scores['BRIEFING']);
      expect(scores['ABORT']).toBeLessThanOrEqual(scores['HOLD']);
    });
  });

  // --------------------------------------------------------------------------
  // Depth-decay weight tests
  // --------------------------------------------------------------------------

  describe('depth-decay weight', () => {
    it('dependency tree contributes to depth-decay score', () => {
      const engine = new WeightingEngine();
      const entries = [
        makeEntry({
          contributor_id: 'contrib-alice',
          context_weight: 0.8,
          dependency_tree: [
            {
              contributor_id: 'contrib-bob01',
              depth: 0,
              decay_factor: 1.0,
            },
            {
              contributor_id: 'contrib-carol',
              depth: 1,
              decay_factor: 0.5,
            },
          ],
        }),
        makeEntry({
          contributor_id: 'contrib-bob01',
          context_weight: 0.8,
          dependency_tree: [],
        }),
      ];
      const result = engine.calculateWeights(entries);
      const alice = result.weights.find(
        (w) => w.contributorId === 'contrib-alice',
      )!;
      // Alice has dependency tree adding weight, so her depth-decay should be higher
      expect(alice.breakdown.depthDecay).toBeGreaterThan(0);
    });

    it('empty dependency tree: depth-decay based purely on context_weight', () => {
      const engine = new WeightingEngine();
      const entries = [
        makeEntry({
          contributor_id: 'contrib-alice',
          context_weight: 0.9,
          dependency_tree: [],
        }),
        makeEntry({
          contributor_id: 'contrib-bob01',
          context_weight: 0.3,
          dependency_tree: [],
        }),
      ];
      const result = engine.calculateWeights(entries);
      const alice = result.weights.find(
        (w) => w.contributorId === 'contrib-alice',
      )!;
      const bob = result.weights.find(
        (w) => w.contributorId === 'contrib-bob01',
      )!;
      expect(alice.breakdown.depthDecay).toBeGreaterThan(
        bob.breakdown.depthDecay,
      );
    });

    it('deep dependency tree (depth 3) contributes less weight', () => {
      const engine = new WeightingEngine();
      const entries = [
        makeEntry({
          contributor_id: 'contrib-alice',
          context_weight: 0.5,
          dependency_tree: [
            {
              contributor_id: 'contrib-dep01',
              depth: 0,
              decay_factor: 1.0,
            },
          ],
        }),
        makeEntry({
          contributor_id: 'contrib-bob01',
          context_weight: 0.5,
          dependency_tree: [
            {
              contributor_id: 'contrib-dep01',
              depth: 3,
              decay_factor: 0.125,
            },
          ],
        }),
      ];
      const result = engine.calculateWeights(entries);
      const alice = result.weights.find(
        (w) => w.contributorId === 'contrib-alice',
      )!;
      const bob = result.weights.find(
        (w) => w.contributorId === 'contrib-bob01',
      )!;
      // Alice has depth 0 dep (full weight), Bob has depth 3 (much less)
      expect(alice.breakdown.depthDecay).toBeGreaterThan(
        bob.breakdown.depthDecay,
      );
    });

    it('context_weight is factored into depth-decay calculation', () => {
      const engine = new WeightingEngine();
      const entries = [
        makeEntry({
          contributor_id: 'contrib-alice',
          context_weight: 1.0,
          dependency_tree: [],
        }),
        makeEntry({
          contributor_id: 'contrib-bob01',
          context_weight: 0.1,
          dependency_tree: [],
        }),
      ];
      const result = engine.calculateWeights(entries);
      const alice = result.weights.find(
        (w) => w.contributorId === 'contrib-alice',
      )!;
      const bob = result.weights.find(
        (w) => w.contributorId === 'contrib-bob01',
      )!;
      expect(alice.breakdown.depthDecay).toBeGreaterThan(
        bob.breakdown.depthDecay,
      );
    });
  });

  // --------------------------------------------------------------------------
  // Combined weight and normalization tests
  // --------------------------------------------------------------------------

  describe('combined weight and normalization', () => {
    it('returns one ContributorWeight per unique contributor', () => {
      const engine = new WeightingEngine();
      const entries = [
        makeEntry({ contributor_id: 'contrib-alice' }),
        makeEntry({ contributor_id: 'contrib-alice' }),
        makeEntry({ contributor_id: 'contrib-bob01' }),
      ];
      const result = engine.calculateWeights(entries);
      expect(result.weights).toHaveLength(2);
    });

    it('all weights sum to 1.0', () => {
      const engine = new WeightingEngine();
      const entries = [
        makeEntry({
          contributor_id: 'contrib-alice',
          phase: 'INTEGRATION',
          context_weight: 0.9,
        }),
        makeEntry({
          contributor_id: 'contrib-bob01',
          phase: 'BRIEFING',
          context_weight: 0.4,
        }),
        makeEntry({
          contributor_id: 'contrib-carol',
          phase: 'EXECUTION',
          context_weight: 0.7,
        }),
      ];
      const result = engine.calculateWeights(entries);
      const sum = result.weights.reduce((s, w) => s + w.weight, 0);
      expect(Math.abs(sum - 1.0)).toBeLessThan(1e-10);
    });

    it('WeightVector is sorted by weight descending', () => {
      const engine = new WeightingEngine();
      const entries = [
        makeEntry({
          contributor_id: 'contrib-alice',
          phase: 'BRIEFING',
          context_weight: 0.1,
        }),
        makeEntry({
          contributor_id: 'contrib-bob01',
          phase: 'COMPLETION',
          context_weight: 1.0,
        }),
      ];
      const result = engine.calculateWeights(entries);
      for (let i = 1; i < result.weights.length; i++) {
        expect(result.weights[i - 1].weight).toBeGreaterThanOrEqual(
          result.weights[i].weight,
        );
      }
    });

    it('each ContributorWeight has a breakdown with three components', () => {
      const engine = new WeightingEngine();
      const entries = [makeEntry({ contributor_id: 'contrib-alice' })];
      const result = engine.calculateWeights(entries);
      const w = result.weights[0];
      expect(w.breakdown).toHaveProperty('frequency');
      expect(w.breakdown).toHaveProperty('criticalPath');
      expect(w.breakdown).toHaveProperty('depthDecay');
    });

    it('composite weight equals weighted combination of components after normalization', () => {
      const engine = new WeightingEngine();
      const entries = [
        makeEntry({
          contributor_id: 'contrib-alice',
          phase: 'INTEGRATION',
          context_weight: 0.9,
        }),
        makeEntry({
          contributor_id: 'contrib-bob01',
          phase: 'BRIEFING',
          context_weight: 0.4,
        }),
      ];
      const result = engine.calculateWeights(entries);
      // The composite before final normalization should be:
      // (freq * freqRatio) + (cp * cpRatio) + (dd * ddRatio)
      // And weights should sum to 1.0 after final normalization
      const totalComposite = result.weights.reduce((s, w) => {
        const raw =
          w.breakdown.frequency * DEFAULT_WEIGHTING_CONFIG.frequencyRatio +
          w.breakdown.criticalPath *
            DEFAULT_WEIGHTING_CONFIG.criticalPathRatio +
          w.breakdown.depthDecay * DEFAULT_WEIGHTING_CONFIG.depthDecayRatio;
        return s + raw;
      }, 0);
      // Each weight should equal its composite / totalComposite
      for (const w of result.weights) {
        const raw =
          w.breakdown.frequency * DEFAULT_WEIGHTING_CONFIG.frequencyRatio +
          w.breakdown.criticalPath *
            DEFAULT_WEIGHTING_CONFIG.criticalPathRatio +
          w.breakdown.depthDecay * DEFAULT_WEIGHTING_CONFIG.depthDecayRatio;
        expect(w.weight).toBeCloseTo(raw / totalComposite, 5);
      }
    });
  });

  // --------------------------------------------------------------------------
  // Auditability tests
  // --------------------------------------------------------------------------

  describe('auditability', () => {
    it('each ContributorWeight has contributorId', () => {
      const engine = new WeightingEngine();
      const entries = [makeEntry({ contributor_id: 'contrib-alice' })];
      const result = engine.calculateWeights(entries);
      expect(result.weights[0].contributorId).toBe('contrib-alice');
    });

    it('each ContributorWeight has entryCount matching entries for that contributor', () => {
      const engine = new WeightingEngine();
      const entries = [
        makeEntry({ contributor_id: 'contrib-alice' }),
        makeEntry({ contributor_id: 'contrib-alice' }),
        makeEntry({ contributor_id: 'contrib-bob01' }),
      ];
      const result = engine.calculateWeights(entries);
      const alice = result.weights.find(
        (w) => w.contributorId === 'contrib-alice',
      )!;
      const bob = result.weights.find(
        (w) => w.contributorId === 'contrib-bob01',
      )!;
      expect(alice.entryCount).toBe(2);
      expect(bob.entryCount).toBe(1);
    });

    it('WeightVector has missionId from entries', () => {
      const engine = new WeightingEngine();
      const entries = [makeEntry({ contributor_id: 'contrib-alice' })];
      const result = engine.calculateWeights(entries);
      expect(result.missionId).toBe('mission-2026-02-18-001');
    });

    it('WeightVector has totalEntries matching input count', () => {
      const engine = new WeightingEngine();
      const entries = [
        makeEntry({ contributor_id: 'contrib-alice' }),
        makeEntry({ contributor_id: 'contrib-bob01' }),
      ];
      const result = engine.calculateWeights(entries);
      expect(result.totalEntries).toBe(2);
    });

    it('WeightVector has config recording the configuration used', () => {
      const engine = new WeightingEngine();
      const entries = [makeEntry({ contributor_id: 'contrib-alice' })];
      const result = engine.calculateWeights(entries);
      expect(result.config).toEqual(DEFAULT_WEIGHTING_CONFIG);
    });
  });

  // --------------------------------------------------------------------------
  // Edge case tests
  // --------------------------------------------------------------------------

  describe('edge cases', () => {
    it('empty entries produces empty WeightVector', () => {
      const engine = new WeightingEngine();
      const result = engine.calculateWeights([]);
      expect(result.weights).toHaveLength(0);
      expect(result.totalEntries).toBe(0);
    });

    it('single entry produces weight of 1.0', () => {
      const engine = new WeightingEngine();
      const entries = [makeEntry({ contributor_id: 'contrib-alice' })];
      const result = engine.calculateWeights(entries);
      expect(result.weights).toHaveLength(1);
      expect(result.weights[0].weight).toBeCloseTo(1.0, 5);
    });

    it('all contributors with identical profiles get equal weight', () => {
      const engine = new WeightingEngine();
      const entries = [
        makeEntry({ contributor_id: 'contrib-alice' }),
        makeEntry({ contributor_id: 'contrib-bob01' }),
        makeEntry({ contributor_id: 'contrib-carol' }),
      ];
      const result = engine.calculateWeights(entries);
      for (const w of result.weights) {
        expect(w.weight).toBeCloseTo(1 / 3, 5);
      }
    });

    it('entries from multiple missions throws error', () => {
      const engine = new WeightingEngine();
      const entries = [
        makeEntry({
          contributor_id: 'contrib-alice',
          mission_id: 'mission-2026-02-18-001',
        }),
        makeEntry({
          contributor_id: 'contrib-bob01',
          mission_id: 'mission-2026-02-18-002',
        }),
      ];
      expect(() => engine.calculateWeights(entries)).toThrow(
        'All entries must belong to the same mission',
      );
    });

    it('custom config with zero frequencyRatio works', () => {
      const engine = new WeightingEngine({
        frequencyRatio: 0,
        criticalPathRatio: 0.6,
        depthDecayRatio: 0.4,
      });
      const entries = [
        makeEntry({
          contributor_id: 'contrib-alice',
          phase: 'INTEGRATION',
          context_weight: 0.9,
        }),
        makeEntry({
          contributor_id: 'contrib-bob01',
          phase: 'BRIEFING',
          context_weight: 0.4,
        }),
      ];
      const result = engine.calculateWeights(entries);
      const sum = result.weights.reduce((s, w) => s + w.weight, 0);
      expect(Math.abs(sum - 1.0)).toBeLessThan(1e-10);
    });
  });
});
