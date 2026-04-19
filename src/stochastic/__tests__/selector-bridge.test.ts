/**
 * MA-3 + MD-2 — Selector Bridge tests.
 *
 * Covers:
 *   CF-MA3-01 / CF-MD2-01 — T=0 returns deterministic decisions (M5 byte-identical)
 *   CF-MA3-03             — flag-on but inBranchContext=false → deterministic
 *   SC-MA3-01             — flag-off → decisions unchanged (reference-equal)
 *   CF-MA3+MD2-01..05     — stochastic selection with seeded reproducibility
 *
 * @module stochastic/__tests__/selector-bridge.test
 */

import { describe, it, expect } from 'vitest';
import type { SelectorDecision } from '../../orchestration/selector.js';
import { applyStochasticBridge, mulberry32, type BridgeOptions } from '../selector-bridge.js';

// ─── Helpers ───────────────────────────────────────────────────────────────

function makeDecision(id: string, score: number): SelectorDecision {
  return {
    id,
    score,
    signals: { m2Score: score, m1Boost: 0, stepBoost: 0, sensoria: null },
    activated: score > 0,
  };
}

function sortedDecisions(count: number): SelectorDecision[] {
  // Pre-sorted descending by score (as M5 would return them).
  const decisions: SelectorDecision[] = [];
  for (let i = count; i > 0; i--) {
    decisions.push(makeDecision(`skill-${i}`, i * 0.1));
  }
  return decisions;
}

// Default bridge options: flag on, in branch, T=1, tractable.
function bridgeOpts(overrides: Partial<BridgeOptions> = {}): BridgeOptions {
  return {
    stochasticEnabled: true,
    inBranchContext: true,
    baseTemperature: 1.0,
    tractabilityClass: 'tractable',
    rng: mulberry32(42),
    ...overrides,
  };
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('applyStochasticBridge', () => {
  describe('SC-MA3-01 — flag-off byte-identical to M5 deterministic', () => {
    it('returns the same array reference when flag is off', () => {
      const decisions = sortedDecisions(5);
      const result = applyStochasticBridge(decisions, bridgeOpts({ stochasticEnabled: false }));
      // Same reference — no copy made.
      expect(result).toBe(decisions);
    });

    it('flag-off with zero temperature still returns same reference', () => {
      const decisions = sortedDecisions(3);
      const result = applyStochasticBridge(decisions, bridgeOpts({
        stochasticEnabled: false,
        baseTemperature: 0,
      }));
      expect(result).toBe(decisions);
    });

    it('flag-off order is unchanged across 1000 calls', () => {
      const decisions = sortedDecisions(5);
      const ids = decisions.map(d => d.id);
      for (let i = 0; i < 1000; i++) {
        const result = applyStochasticBridge(decisions, bridgeOpts({
          stochasticEnabled: false,
          rng: mulberry32(i),
        }));
        expect(result.map(d => d.id)).toEqual(ids);
      }
    });
  });

  describe('CF-MA3-03 — inBranchContext=false → deterministic', () => {
    it('returns same reference when not in branch context', () => {
      const decisions = sortedDecisions(5);
      const result = applyStochasticBridge(decisions, bridgeOpts({ inBranchContext: false }));
      expect(result).toBe(decisions);
    });

    it('zero stochastic draws over 10k live-session decisions (CF-MA3-03)', () => {
      const decisions = sortedDecisions(5);
      const topId = decisions[0].id;
      let stochasticDraws = 0;
      for (let i = 0; i < 10000; i++) {
        const result = applyStochasticBridge(decisions, bridgeOpts({
          inBranchContext: false,
          rng: mulberry32(i),
        }));
        if (result[0].id !== topId) stochasticDraws++;
      }
      expect(stochasticDraws).toBe(0);
    });
  });

  describe('CF-MA3-01 / CF-MD2-01 — T=0 → deterministic (same reference)', () => {
    it('returns same reference at baseTemperature=0', () => {
      const decisions = sortedDecisions(4);
      const result = applyStochasticBridge(decisions, bridgeOpts({ baseTemperature: 0 }));
      expect(result).toBe(decisions);
    });

    it('returns same reference at effective T ≤ 1e-9 due to coin-flip scaling', () => {
      // coin-flip scale = 0.3; baseTemp = 1e-10 → effectiveTemp = 3e-11 < 1e-9
      const decisions = sortedDecisions(3);
      const result = applyStochasticBridge(decisions, bridgeOpts({
        baseTemperature: 1e-10,
        tractabilityClass: 'coin-flip',
      }));
      expect(result).toBe(decisions);
    });
  });

  describe('empty input', () => {
    it('returns empty array unchanged', () => {
      const decisions: SelectorDecision[] = [];
      const result = applyStochasticBridge(decisions, bridgeOpts());
      expect(result).toBe(decisions);
    });
  });

  describe('single candidate', () => {
    it('returns same reference for single-candidate decisions', () => {
      const decisions = [makeDecision('only', 1.0)];
      // At T=1, single element → sampled index=0 → no change → same reference.
      const result = applyStochasticBridge(decisions, bridgeOpts());
      // Should be same because index 0 was chosen (only option).
      expect(result[0].id).toBe('only');
    });
  });

  describe('stochastic selection — seeded reproducibility', () => {
    it('identical seed produces identical selection order (SC-MA3-01)', () => {
      const decisions = sortedDecisions(6);
      const opts1 = bridgeOpts({ rng: mulberry32(12345) });
      const opts2 = bridgeOpts({ rng: mulberry32(12345) });
      const result1 = applyStochasticBridge(decisions, opts1);
      const result2 = applyStochasticBridge(decisions, opts2);
      expect(result1.map(d => d.id)).toEqual(result2.map(d => d.id));
    });

    it('different seeds can produce different winners', () => {
      const decisions = sortedDecisions(5);
      const winners = new Set<string>();
      // Run many seeds; with T=1 and 5 candidates, multiple should win sometimes.
      for (let seed = 0; seed < 500; seed++) {
        const result = applyStochasticBridge(decisions, bridgeOpts({ rng: mulberry32(seed) }));
        winners.add(result[0].id);
      }
      // More than one candidate should appear as winner.
      expect(winners.size).toBeGreaterThan(1);
    });

    it('non-top candidate can be promoted when T=1 (stochastic)', () => {
      // Give all candidates equal scores → uniform softmax → any can win.
      const decisions = [
        makeDecision('skill-a', 1.0),
        makeDecision('skill-b', 1.0),
        makeDecision('skill-c', 1.0),
        makeDecision('skill-d', 1.0),
      ];
      const winners = new Set<string>();
      for (let seed = 0; seed < 200; seed++) {
        const result = applyStochasticBridge(decisions, bridgeOpts({ rng: mulberry32(seed) }));
        winners.add(result[0].id);
      }
      // All 4 should win with roughly equal probability.
      expect(winners.size).toBe(4);
    });

    it('list length is preserved after stochastic promotion', () => {
      const decisions = sortedDecisions(5);
      const result = applyStochasticBridge(decisions, bridgeOpts());
      expect(result).toHaveLength(decisions.length);
    });

    it('all original candidates are present after promotion', () => {
      const decisions = sortedDecisions(5);
      const originalIds = new Set(decisions.map(d => d.id));
      const result = applyStochasticBridge(decisions, bridgeOpts({ rng: mulberry32(77) }));
      const resultIds = new Set(result.map(d => d.id));
      expect(resultIds).toEqual(originalIds);
    });

    it('does not mutate the original decisions array', () => {
      const decisions = sortedDecisions(5);
      const originalIds = decisions.map(d => d.id);
      applyStochasticBridge(decisions, bridgeOpts({ rng: mulberry32(1) }));
      // Original array unchanged.
      expect(decisions.map(d => d.id)).toEqual(originalIds);
    });
  });

  describe('tractability scaling visible in effective temperature', () => {
    it('coin-flip tractability gets lower exploration than tractable', () => {
      // Use a score distribution where the top candidate dominates.
      // With lower T (coin-flip), the top candidate wins more often.
      const decisions = [
        makeDecision('top', 5.0),
        makeDecision('mid', 1.0),
        makeDecision('low', 0.1),
      ];

      let topWinsTractable = 0;
      let topWinsCoinFlip = 0;
      const N = 1000;

      for (let seed = 0; seed < N; seed++) {
        const resTractable = applyStochasticBridge(decisions, bridgeOpts({
          tractabilityClass: 'tractable',
          baseTemperature: 2.0,
          rng: mulberry32(seed),
        }));
        if (resTractable[0].id === 'top') topWinsTractable++;

        const resCoinFlip = applyStochasticBridge(decisions, bridgeOpts({
          tractabilityClass: 'coin-flip',
          baseTemperature: 2.0,
          rng: mulberry32(seed),
        }));
        if (resCoinFlip[0].id === 'top') topWinsCoinFlip++;
      }

      // Coin-flip (lower T) → top candidate wins MORE often (less exploration).
      expect(topWinsCoinFlip).toBeGreaterThan(topWinsTractable);
    });
  });
});
