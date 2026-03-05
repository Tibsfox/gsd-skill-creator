import { describe, it, expect } from 'vitest';
import {
  linearDecay,
  exponentialDecay,
  stepDecay,
  simulateDecay,
  recommendDecayCurve,
} from '../decay-simulator.js';
import type { ConfidenceDecayConfig } from '../types.js';

const cfg: ConfidenceDecayConfig = {
  decayStartDays: 10,
  decayRatePerWeek: 0.1,
  minimumConfidence: 0.1,
};

// ============================================================================
// linearDecay
// ============================================================================

describe('linearDecay', () => {
  it('does not decay before decay start', () => {
    expect(linearDecay(0.8, 5, cfg)).toBe(0.8);
    expect(linearDecay(0.8, 10, cfg)).toBe(0.8);
  });

  it('decays linearly at ratePerDay after decay start', () => {
    // 7 days past start = 1 week = 0.1 decay on 0.8 → 0.7
    expect(linearDecay(0.8, 17, cfg)).toBeCloseTo(0.7, 5);
  });

  it('clamps to minimumConfidence floor over 90 days', () => {
    // 90 - 10 = 80 days of decay; 80 * (0.1/7) ≈ 1.14 — would go negative
    expect(linearDecay(0.8, 90, cfg)).toBe(cfg.minimumConfidence);
  });

  it('never goes below minimum for very long inactivity', () => {
    expect(linearDecay(0.5, 500, cfg)).toBe(cfg.minimumConfidence);
  });
});

// ============================================================================
// exponentialDecay
// ============================================================================

describe('exponentialDecay', () => {
  it('does not decay before decay start', () => {
    expect(exponentialDecay(0.8, 5, cfg)).toBe(0.8);
    expect(exponentialDecay(0.8, 10, cfg)).toBe(0.8);
  });

  it('approaches but never falls below minimum confidence', () => {
    const longResult = exponentialDecay(0.8, 1000, cfg);
    expect(longResult).toBe(cfg.minimumConfidence);
  });

  it('decays continuously after decay start', () => {
    const at30 = exponentialDecay(0.8, 30, cfg);
    const at60 = exponentialDecay(0.8, 60, cfg);
    expect(at30).toBeLessThan(0.8);
    expect(at60).toBeLessThan(at30);
  });

  it('never goes below minimum for any inactivity duration', () => {
    for (const days of [100, 500, 1000]) {
      expect(exponentialDecay(0.8, days, cfg)).toBeGreaterThanOrEqual(cfg.minimumConfidence);
    }
  });

  it('matches compound decay formula', () => {
    // 14 days = decayStart(10) + 4 days → 4/7 weeks of decay
    // expected = 0.8 * (1 - 0.1)^(4/7)
    const expected = 0.8 * Math.pow(0.9, 4 / 7);
    expect(exponentialDecay(0.8, 14, cfg)).toBeCloseTo(expected, 10);
  });
});

// ============================================================================
// stepDecay
// ============================================================================

describe('stepDecay', () => {
  it('does not decay before decay start', () => {
    expect(stepDecay(0.8, 5, cfg)).toBe(0.8);
    expect(stepDecay(0.8, 10, cfg)).toBe(0.8);
  });

  it('drops to 90% in the first 30 days past decay start', () => {
    // 11 = decayStart(10) + 1 → daysPastStart = 1
    expect(stepDecay(0.8, 11, cfg)).toBeCloseTo(0.8 * 0.9);
  });

  it('drops to 70% between 30–60 days past decay start', () => {
    // 41 = decayStart(10) + 31 → daysPastStart = 31
    expect(stepDecay(0.8, 41, cfg)).toBeCloseTo(0.8 * 0.7);
  });

  it('drops to 40% after 60 days past decay start', () => {
    // 71 = decayStart(10) + 61 → daysPastStart = 61
    expect(stepDecay(0.8, 71, cfg)).toBeCloseTo(0.8 * 0.4);
  });

  it('respects minimumConfidence floor at each step', () => {
    const veryLow = cfg.minimumConfidence * 0.3; // 0.03 — below minimum
    expect(stepDecay(veryLow, 71, cfg)).toBeGreaterThanOrEqual(cfg.minimumConfidence);
  });
});

// ============================================================================
// simulateDecay
// ============================================================================

describe('simulateDecay', () => {
  it('returns projections at 30/60/90 days for all three curves', () => {
    const result = simulateDecay({ currentTrustLevel: 0.8, daysInactive: 5, rigType: 'agent' });

    for (const curve of ['linear', 'exponential', 'step'] as const) {
      expect(result.curves[curve].at30Days).toBeTypeOf('number');
      expect(result.curves[curve].at60Days).toBeTypeOf('number');
      expect(result.curves[curve].at90Days).toBeTypeOf('number');
    }
  });

  it('includes a recommended curve in the result', () => {
    const result = simulateDecay({ currentTrustLevel: 0.7, daysInactive: 0, rigType: 'human' });
    expect(['linear', 'exponential', 'step']).toContain(result.recommendedCurve);
  });

  it('projections are monotonically non-increasing over the three intervals', () => {
    const result = simulateDecay({ currentTrustLevel: 0.9, daysInactive: 0, rigType: 'agent' });

    for (const curve of ['linear', 'exponential', 'step'] as const) {
      const { at30Days, at60Days, at90Days } = result.curves[curve];
      expect(at30Days).toBeGreaterThanOrEqual(at60Days);
      expect(at60Days).toBeGreaterThanOrEqual(at90Days);
    }
  });

  it('reflects input back in result', () => {
    const input = { currentTrustLevel: 0.6, daysInactive: 20, rigType: 'human' as const };
    const result = simulateDecay(input);
    expect(result.input).toEqual(input);
  });
});

// ============================================================================
// Human vs agent decay differences
// ============================================================================

describe('human vs agent decay', () => {
  it('agents have lower decay start threshold than humans', () => {
    // Agent defaults: decayStartDays=7; human defaults: decayStartDays=14
    const agentAt10 = simulateDecay({ currentTrustLevel: 0.8, daysInactive: 10, rigType: 'agent' });
    const humanAt10 = simulateDecay({ currentTrustLevel: 0.8, daysInactive: 10, rigType: 'human' });

    // Agent has already started decaying (past 7 days), human has not (before 14 days)
    expect(agentAt10.curves.linear.at30Days).toBeLessThan(humanAt10.curves.linear.at30Days);
  });

  it('agents decay faster than humans for the same curve type', () => {
    const agentResult = simulateDecay({ currentTrustLevel: 0.8, daysInactive: 30, rigType: 'agent' });
    const humanResult = simulateDecay({ currentTrustLevel: 0.8, daysInactive: 30, rigType: 'human' });

    // Both using linear curve — agent rate (0.15/wk) > human rate (0.05/wk)
    expect(agentResult.curves.linear.at90Days).toBeLessThan(humanResult.curves.linear.at90Days);
  });

  it('human minimum confidence floor is higher than agent minimum', () => {
    // At extreme inactivity both hit their minimums
    const agentResult = simulateDecay({ currentTrustLevel: 0.8, daysInactive: 2000, rigType: 'agent' });
    const humanResult = simulateDecay({ currentTrustLevel: 0.8, daysInactive: 2000, rigType: 'human' });

    // Human min (0.2) > agent min (0.05)
    expect(humanResult.curves.linear.at90Days).toBeGreaterThan(agentResult.curves.linear.at90Days);
    expect(humanResult.curves.exponential.at90Days).toBeGreaterThan(agentResult.curves.exponential.at90Days);
  });
});

// ============================================================================
// recommendDecayCurve
// ============================================================================

describe('recommendDecayCurve', () => {
  it('recommends exponential for agents', () => {
    expect(recommendDecayCurve('agent')).toBe('exponential');
  });

  it('recommends step for humans', () => {
    expect(recommendDecayCurve('human')).toBe('step');
  });

  it('returns different curves for different rig types', () => {
    expect(recommendDecayCurve('agent')).not.toBe(recommendDecayCurve('human'));
  });
});

// ============================================================================
// Edge cases
// ============================================================================

describe('edge cases', () => {
  it('handles 0 days inactive — no decay has occurred', () => {
    const result = simulateDecay({ currentTrustLevel: 0.8, daysInactive: 0, rigType: 'agent' });

    for (const curve of ['linear', 'exponential', 'step'] as const) {
      // At 0 current inactivity, 30-day projection should be ≤ starting trust
      expect(result.curves[curve].at30Days).toBeLessThanOrEqual(0.8 + Number.EPSILON);
    }
  });

  it('handles trust already at minimum', () => {
    const result = simulateDecay({ currentTrustLevel: 0.05, daysInactive: 100, rigType: 'agent' });

    for (const curve of ['linear', 'exponential', 'step'] as const) {
      expect(result.curves[curve].at30Days).toBeGreaterThanOrEqual(0.05);
      expect(result.curves[curve].at90Days).toBeGreaterThanOrEqual(0.05);
    }
  });

  it('handles trust of 1.0 (maximum)', () => {
    const result = simulateDecay({ currentTrustLevel: 1.0, daysInactive: 0, rigType: 'human' });
    expect(result.curves.linear.at30Days).toBeLessThanOrEqual(1.0);
    expect(result.curves.exponential.at30Days).toBeLessThanOrEqual(1.0);
    expect(result.curves.step.at30Days).toBeLessThanOrEqual(1.0);
  });

  it('accepts custom config override that supersedes defaults', () => {
    // Fast decay: starts immediately, 50%/week
    const result = simulateDecay({
      currentTrustLevel: 0.8,
      daysInactive: 14,
      rigType: 'agent',
      config: { decayStartDays: 0, decayRatePerWeek: 0.5, minimumConfidence: 0.01 },
    });

    // 14 days = 2 weeks at 50%/wk: 0.8 * 0.5^2 = 0.2
    expect(result.curves.exponential.at30Days).toBeLessThan(0.5);
  });
});
