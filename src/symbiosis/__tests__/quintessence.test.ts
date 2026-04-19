/**
 * Quintessence 5-axis metric tests
 *
 * CF-M8-06  Self-vs-Non-Self computable from community source
 * CF-M8-07  Essential Tensions computable from tension source
 * CF-M8-08  Growth-and-Energy-Flow computable from energy source
 * CF-M8-09  Stability-vs-Novelty + Fateful Encounters without new instrumentation
 * IT-07     Hand-computed reference match on fixture
 */

import { describe, it, expect } from 'vitest';

import {
  computeQuintessenceSnapshot,
  computeQuintessenceTimeSeries,
  narrativeReport,
  MockCommunitySource,
  MockTensionSource,
  MockEnergySource,
  MockStabilitySource,
  MockFatefulSource,
  DEFAULT_FATEFUL_THRESHOLD,
} from '../quintessence.js';
import type { QuintessenceSources } from '../quintessence.js';
import { validateOffering } from '../parasocial-guard.js';

// ─── hand-computed fixture (IT-07) ───────────────────────────────────────────

/** Reference fixture with hand-computed expected values */
const FIXTURE: {
  sources: QuintessenceSources;
  expected: {
    selfVsNonSelf: number;
    essentialTensions: number;
    growthAndEnergyFlow: number;
    stabilityVsNovelty: number;
    fatefulEncounters: number;
  };
} = {
  sources: {
    community: new MockCommunitySource(0.75),           // 75% unique
    tension: new MockTensionSource(0.20, 0.10),          // override=0.20, bound=0.10
    energy: new MockEnergySource(800),                   // 800 tokens/outcome
    stability: new MockStabilitySource(12, 8),           // 12 trunk, 8 branch → 12/20 = 0.6
    fateful: new MockFatefulSource(3),                   // 3 high-impact decisions
  },
  expected: {
    selfVsNonSelf: 0.75,
    essentialTensions: 0.30,     // 0.20 + 0.10
    growthAndEnergyFlow: 800,
    stabilityVsNovelty: 0.6,     // 12 / (12 + 8)
    fatefulEncounters: 3,
  },
};

// ─── CF-M8-06: Self-vs-Non-Self ───────────────────────────────────────────────

describe('CF-M8-06: Self-vs-Non-Self from community source', () => {
  it('computes selfVsNonSelf correctly', () => {
    const snap = computeQuintessenceSnapshot(FIXTURE.sources, { now: 1000 });
    expect(snap.selfVsNonSelf).toBeCloseTo(FIXTURE.expected.selfVsNonSelf, 5);
  });

  it('clamps to [0, 1] on out-of-range community fraction', () => {
    const sources: QuintessenceSources = {
      ...FIXTURE.sources,
      community: new MockCommunitySource(1.5),
    };
    const snap = computeQuintessenceSnapshot(sources);
    expect(snap.selfVsNonSelf).toBeLessThanOrEqual(1);
    expect(snap.selfVsNonSelf).toBeGreaterThanOrEqual(0);
  });

  it('returns 0 for 0% unique communities', () => {
    const sources: QuintessenceSources = {
      ...FIXTURE.sources,
      community: new MockCommunitySource(0),
    };
    const snap = computeQuintessenceSnapshot(sources);
    expect(snap.selfVsNonSelf).toBe(0);
  });

  it('returns 1 for 100% unique communities', () => {
    const sources: QuintessenceSources = {
      ...FIXTURE.sources,
      community: new MockCommunitySource(1),
    };
    const snap = computeQuintessenceSnapshot(sources);
    expect(snap.selfVsNonSelf).toBe(1);
  });
});

// ─── CF-M8-07: Essential Tensions ────────────────────────────────────────────

describe('CF-M8-07: Essential Tensions from tension source', () => {
  it('computes essentialTensions as overrideRatio + boundHitRatio', () => {
    const snap = computeQuintessenceSnapshot(FIXTURE.sources, { now: 1000 });
    expect(snap.essentialTensions).toBeCloseTo(FIXTURE.expected.essentialTensions, 5);
  });

  it('is 0 when both ratios are 0', () => {
    const sources: QuintessenceSources = {
      ...FIXTURE.sources,
      tension: new MockTensionSource(0, 0),
    };
    const snap = computeQuintessenceSnapshot(sources);
    expect(snap.essentialTensions).toBe(0);
  });

  it('accumulates both ratios additively', () => {
    const sources: QuintessenceSources = {
      ...FIXTURE.sources,
      tension: new MockTensionSource(0.5, 0.5),
    };
    const snap = computeQuintessenceSnapshot(sources);
    expect(snap.essentialTensions).toBeCloseTo(1.0, 5);
  });
});

// ─── CF-M8-08: Growth-and-Energy-Flow ────────────────────────────────────────

describe('CF-M8-08: Growth-and-Energy-Flow from energy source', () => {
  it('returns raw tokensPerProductiveOutcome', () => {
    const snap = computeQuintessenceSnapshot(FIXTURE.sources, { now: 1000 });
    expect(snap.growthAndEnergyFlow).toBeCloseTo(FIXTURE.expected.growthAndEnergyFlow, 0);
  });

  it('returns 0 for zero tokens', () => {
    const sources: QuintessenceSources = {
      ...FIXTURE.sources,
      energy: new MockEnergySource(0),
    };
    const snap = computeQuintessenceSnapshot(sources);
    expect(snap.growthAndEnergyFlow).toBe(0);
  });

  it('handles large token counts', () => {
    const sources: QuintessenceSources = {
      ...FIXTURE.sources,
      energy: new MockEnergySource(100_000),
    };
    const snap = computeQuintessenceSnapshot(sources);
    expect(snap.growthAndEnergyFlow).toBe(100_000);
  });
});

// ─── CF-M8-09: Stability-vs-Novelty + Fateful Encounters ─────────────────────

describe('CF-M8-09: Stability-vs-Novelty + Fateful Encounters', () => {
  it('computes stabilityVsNovelty correctly', () => {
    const snap = computeQuintessenceSnapshot(FIXTURE.sources, { now: 1000 });
    expect(snap.stabilityVsNovelty).toBeCloseTo(FIXTURE.expected.stabilityVsNovelty, 5);
  });

  it('returns 1 when all sessions are trunk-preserved', () => {
    const sources: QuintessenceSources = {
      ...FIXTURE.sources,
      stability: new MockStabilitySource(20, 0),
    };
    const snap = computeQuintessenceSnapshot(sources);
    expect(snap.stabilityVsNovelty).toBe(1);
  });

  it('returns 0 when no sessions are trunk-preserved', () => {
    const sources: QuintessenceSources = {
      ...FIXTURE.sources,
      stability: new MockStabilitySource(0, 10),
    };
    const snap = computeQuintessenceSnapshot(sources);
    expect(snap.stabilityVsNovelty).toBe(0);
  });

  it('returns 1 (max stability) when both counts are 0', () => {
    const sources: QuintessenceSources = {
      ...FIXTURE.sources,
      stability: new MockStabilitySource(0, 0),
    };
    const snap = computeQuintessenceSnapshot(sources);
    expect(snap.stabilityVsNovelty).toBe(1);
  });

  it('computes fatefulEncounters count', () => {
    const snap = computeQuintessenceSnapshot(FIXTURE.sources, { now: 1000 });
    expect(snap.fatefulEncounters).toBe(FIXTURE.expected.fatefulEncounters);
  });

  it('fatefulEncounters is 0 when no high-impact decisions', () => {
    const sources: QuintessenceSources = {
      ...FIXTURE.sources,
      fateful: new MockFatefulSource(0),
    };
    const snap = computeQuintessenceSnapshot(sources);
    expect(snap.fatefulEncounters).toBe(0);
  });
});

// ─── IT-07: hand-computed reference match ────────────────────────────────────

describe('IT-07: Quintessence axes match hand-computed reference on fixture', () => {
  it('all five axes match hand-computed values', () => {
    const snap = computeQuintessenceSnapshot(FIXTURE.sources, { now: 999_000 });

    expect(snap.selfVsNonSelf).toBeCloseTo(0.75, 10);
    expect(snap.essentialTensions).toBeCloseTo(0.30, 10);
    expect(snap.growthAndEnergyFlow).toBeCloseTo(800, 10);
    expect(snap.stabilityVsNovelty).toBeCloseTo(0.6, 10);
    expect(snap.fatefulEncounters).toBe(3);
  });

  it('snapshot ts matches the provided timestamp', () => {
    const now = 123_456_789;
    const snap = computeQuintessenceSnapshot(FIXTURE.sources, { now });
    expect(snap.ts).toBe(now);
  });

  it('time series preserves per-snapshot values', () => {
    const sourceArray: QuintessenceSources[] = [
      { ...FIXTURE.sources, community: new MockCommunitySource(0.3) },
      { ...FIXTURE.sources, community: new MockCommunitySource(0.6) },
      { ...FIXTURE.sources, community: new MockCommunitySource(0.9) },
    ];
    const series = computeQuintessenceTimeSeries(sourceArray, { baseTs: 1_000_000, stepMs: 1000 });
    expect(series).toHaveLength(3);
    expect(series[0]!.selfVsNonSelf).toBeCloseTo(0.3, 10);
    expect(series[1]!.selfVsNonSelf).toBeCloseTo(0.6, 10);
    expect(series[2]!.selfVsNonSelf).toBeCloseTo(0.9, 10);
  });

  it('narrativeReport contains all five axis labels', () => {
    const snap = computeQuintessenceSnapshot(FIXTURE.sources, { now: 1000 });
    const report = narrativeReport(snap);
    expect(report).toContain('Self-vs-Non-Self');
    expect(report).toContain('Essential Tensions');
    expect(report).toContain('Growth-and-Energy-Flow');
    expect(report).toContain('Stability-vs-Novelty');
    expect(report).toContain('Fateful Encounters');
  });

  it('narrativeReport uses engineering-observational language (no prohibited terms)', () => {
    const snap = computeQuintessenceSnapshot(FIXTURE.sources, { now: 1000 });
    const report = narrativeReport(snap);
    const result = validateOffering(report);
    expect(result.ok).toBe(true);
  });

  it('DEFAULT_FATEFUL_THRESHOLD is a positive number', () => {
    expect(DEFAULT_FATEFUL_THRESHOLD).toBeGreaterThan(0);
  });

  it('degenerate case: one-session time series is valid (EC-04)', () => {
    const series = computeQuintessenceTimeSeries([FIXTURE.sources], { baseTs: 0 });
    expect(series).toHaveLength(1);
    expect(Number.isFinite(series[0]!.selfVsNonSelf)).toBe(true);
  });
});
