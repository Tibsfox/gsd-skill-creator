/**
 * telemetry-roi — advisory ROI gate tests.
 *
 * The gate returns a reasoned recommend / hold / abstain verdict from
 * telemetry-derived value vs cost, and it is ADVISORY: it never blocks.
 */

import { describe, it, expect } from 'vitest';
import {
  advisoryRoiVerdict,
  deriveCandidateFromSignal,
  formatRoiAdvisory,
  signalFromPatternEntry,
  signalFromRankedCandidate,
  type TelemetryUsageSignal,
} from '../telemetry-roi.js';
import type { SkillPatternEntry } from '../../telemetry/types.js';
import type { RankedCandidate } from '../../discovery/pattern-scorer.js';

const HIGH_VALUE: TelemetryUsageSignal = {
  sessionCount: 20,
  loadRate: 0.9,
  avgScore: 0.85,
  correctionRate: 0.05,
  budgetSkipRate: 0.0,
};

const LOW_VALUE: TelemetryUsageSignal = {
  sessionCount: 4,
  loadRate: 0.2,
  avgScore: 0.15,
  correctionRate: 0.4,
  budgetSkipRate: 0.6,
};

describe('advisoryRoiVerdict', () => {
  it('recommends a high-value, high-demand artifact (pays for its tokens)', () => {
    const v = advisoryRoiVerdict('skill-a', HIGH_VALUE);
    expect(v.recommendation).toBe('recommend');
    expect(v.roi.decision).toBe('install');
    expect(v.roi.marginBits).toBeGreaterThan(0);
    expect(v.reason).toContain('recommend');
    expect(v.reason).toContain('payoff');
    expect(v.advisory).toBe(true);
  });

  it('holds a low-value artifact whose payoff does not clear install cost', () => {
    const v = advisoryRoiVerdict('skill-b', LOW_VALUE);
    expect(v.recommendation).toBe('hold');
    expect(v.roi.decision).toBe('reject');
    expect(v.roi.marginBits).toBeLessThanOrEqual(0);
    expect(v.reason).toContain('hold');
    expect(v.advisory).toBe(true);
  });

  it('abstains (never holds) when telemetry is too thin to judge', () => {
    const v = advisoryRoiVerdict('skill-c', {
      sessionCount: 1,
      loadRate: 0,
      avgScore: 0,
    });
    expect(v.recommendation).toBe('abstain');
    expect(v.reason).toContain('insufficient telemetry');
    expect(v.advisory).toBe(true);
  });

  it('is driven by telemetry, not constants: higher score flips hold → recommend', () => {
    const base: TelemetryUsageSignal = { sessionCount: 10, loadRate: 1, avgScore: 0.05 };
    const low = advisoryRoiVerdict('x', base);
    const high = advisoryRoiVerdict('x', { ...base, avgScore: 0.95 });
    expect(low.recommendation).toBe('hold');
    expect(high.recommendation).toBe('recommend');
  });

  it('correction drag lowers per-use value', () => {
    const clean = deriveCandidateFromSignal('x', { sessionCount: 5, loadRate: 1, avgScore: 0.8 });
    const noisy = deriveCandidateFromSignal('x', {
      sessionCount: 5,
      loadRate: 1,
      avgScore: 0.8,
      correctionRate: 0.5,
    });
    expect(noisy.perUseSavingsBits).toBeLessThan(clean.perUseSavingsBits);
  });

  it('budget-skip friction raises install cost', () => {
    const cheap = deriveCandidateFromSignal('x', { sessionCount: 5, loadRate: 1, avgScore: 0.8 });
    const frictive = deriveCandidateFromSignal('x', {
      sessionCount: 5,
      loadRate: 1,
      avgScore: 0.8,
      budgetSkipRate: 1,
    });
    expect(frictive.estimatedIK).toBeGreaterThan(cheap.estimatedIK);
  });
});

describe('formatRoiAdvisory', () => {
  it('renders a one-line capcom note with the recommendation and id', () => {
    const line = formatRoiAdvisory(advisoryRoiVerdict('skill-a', HIGH_VALUE));
    expect(line).toContain('ROI advisory');
    expect(line).toContain('[recommend]');
    expect(line).toContain('skill-a');
  });
});

describe('signal adapters', () => {
  it('maps a SkillPatternEntry onto a usage signal', () => {
    const entry: SkillPatternEntry = {
      skillName: 's',
      sessionCount: 8,
      loadCount: 6,
      budgetSkipCount: 2,
      avgScore: 0.7,
      loadRate: 0.6,
      budgetSkipRate: 0.25,
    };
    const sig = signalFromPatternEntry(entry, { correctionRate: 0.1 });
    expect(sig.sessionCount).toBe(8);
    expect(sig.avgScore).toBe(0.7);
    expect(sig.loadRate).toBe(0.6);
    expect(sig.budgetSkipRate).toBe(0.25);
    expect(sig.correctionRate).toBe(0.1);
  });

  it('maps a RankedCandidate onto a usage signal from its evidence', () => {
    const c = {
      patternKey: 'k',
      label: 'l',
      type: 'tool-bigram',
      score: 0.66,
      scoreBreakdown: { frequency: 0, crossProject: 0, recency: 0, consistency: 0 },
      evidence: {
        projects: ['a', 'b'],
        sessions: ['s1', 's2', 's3'],
        totalOccurrences: 9,
        exampleInvocations: [],
        lastSeen: '',
        firstSeen: '',
      },
      suggestedName: 'n',
      suggestedDescription: 'd',
    } as RankedCandidate;
    const sig = signalFromRankedCandidate(c);
    expect(sig.sessionCount).toBe(3);
    expect(sig.avgScore).toBe(0.66);
    expect(sig.projectCount).toBe(2);
    expect(sig.loadRate).toBe(1);
  });
});
