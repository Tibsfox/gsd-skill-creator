/**
 * Tests for Feedback Integrator — tracking, SPRT evaluation, confidence decay, meta-learning.
 */

import { describe, it, expect } from 'vitest';
import {
  startTracking,
  updateMetrics,
  evaluateSPRT,
  categorizeOutcome,
  applyConfidenceDecay,
  feedbackToPatternEngine,
} from '../feedback-integrator.js';
import type { FeedbackRecord, MetricSnapshot } from '../types.js';

const BASELINE: MetricSnapshot = {
  successRate: 0.7,
  avgDurationMs: 5000,
  throughput: 10,
  timestamp: '2026-03-01T00:00:00Z',
};

function makeRecord(overrides: Partial<FeedbackRecord> = {}): FeedbackRecord {
  return {
    ...startTracking('rec-1', 'team-composition', 0.8, BASELINE),
    ...overrides,
  };
}

describe('startTracking', () => {
  it('initializes a feedback record', () => {
    const record = startTracking('rec-1', 'team-composition', 0.8, BASELINE);
    expect(record.recommendationId).toBe('rec-1');
    expect(record.recommendationType).toBe('team-composition');
    expect(record.confidence).toBe(0.8);
    expect(record.status).toBe('evaluating');
    expect(record.sampleCount).toBe(0);
  });

  it('copies baseline to current metric', () => {
    const record = startTracking('rec-1', 'routing', 0.7, BASELINE);
    expect(record.currentMetric.successRate).toBe(0.7);
    expect(record.baselineMetric).toEqual(BASELINE);
  });
});

describe('updateMetrics', () => {
  it('increments sample count', () => {
    const record = makeRecord();
    const updated = updateMetrics(record, {
      successRate: 0.8,
      avgDurationMs: 4000,
      throughput: 12,
      timestamp: '2026-03-27T00:00:00Z',
    });
    expect(updated.sampleCount).toBe(1);
  });

  it('updates current metric', () => {
    const record = makeRecord();
    const newMetric: MetricSnapshot = {
      successRate: 0.9,
      avgDurationMs: 3000,
      throughput: 15,
      timestamp: '2026-03-27T00:00:00Z',
    };
    const updated = updateMetrics(record, newMetric);
    expect(updated.currentMetric.successRate).toBe(0.9);
  });
});

describe('evaluateSPRT', () => {
  it('returns continue-sampling with insufficient samples', () => {
    const record = makeRecord({ sampleCount: 0 });
    const result = evaluateSPRT(record);
    expect(result.decision).toBe('continue-sampling');
  });

  it('detects improvement when current > baseline', () => {
    const record = makeRecord({
      sampleCount: 50,
      baselineMetric: { ...BASELINE, successRate: 0.5 },
      currentMetric: { ...BASELINE, successRate: 0.95 },
    });
    const result = evaluateSPRT(record);
    expect(['accept-improvement', 'continue-sampling']).toContain(result.decision);
    expect(result.effectSize).toBeGreaterThan(0);
  });

  it('reports negative effect size when current < baseline', () => {
    const record = makeRecord({
      sampleCount: 50,
      baselineMetric: { ...BASELINE, successRate: 0.9 },
      currentMetric: { ...BASELINE, successRate: 0.1 },
    });
    const result = evaluateSPRT(record);
    expect(result.effectSize).toBeLessThan(0);
    expect(result.samplesUsed).toBe(50);
  });
});

describe('categorizeOutcome', () => {
  it('categorizes improvement', () => {
    const result = categorizeOutcome(BASELINE, { ...BASELINE, successRate: 0.95 });
    expect(['improvement', 'strong-success']).toContain(result);
  });

  it('categorizes regression', () => {
    const result = categorizeOutcome(BASELINE, { ...BASELINE, successRate: 0.3 });
    expect(['regression', 'strong-failure']).toContain(result);
  });

  it('categorizes neutral for small changes', () => {
    const result = categorizeOutcome(BASELINE, { ...BASELINE, successRate: 0.71 });
    expect(result).toBe('neutral');
  });
});

describe('applyConfidenceDecay', () => {
  it('does not decay recent records', () => {
    const record = makeRecord({
      lastUpdated: '2026-03-20T00:00:00Z',
      confidence: 0.8,
      initialConfidence: 0.8,
      status: 'evaluating',
    });
    const decayed = applyConfidenceDecay([record], {
      decayStartDays: 30,
      decayRatePerWeek: 0.1,
      minimumConfidence: 0.1,
    }, '2026-03-27T00:00:00Z');
    expect(decayed[0].confidence).toBe(0.8);
  });

  it('decays old records', () => {
    const record = makeRecord({
      lastUpdated: '2026-01-01T00:00:00Z',
      confidence: 0.8,
      initialConfidence: 0.8,
      status: 'evaluating',
    });
    const decayed = applyConfidenceDecay([record], {
      decayStartDays: 30,
      decayRatePerWeek: 0.1,
      minimumConfidence: 0.1,
    }, '2026-03-27T00:00:00Z');
    expect(decayed[0].confidence).toBeLessThan(0.8);
  });

  it('never decays below minimum', () => {
    const record = makeRecord({
      lastUpdated: '2020-01-01T00:00:00Z',
      confidence: 0.8,
      initialConfidence: 0.8,
      status: 'evaluating',
    });
    const decayed = applyConfidenceDecay([record], {
      decayStartDays: 1,
      decayRatePerWeek: 0.5,
      minimumConfidence: 0.2,
    }, '2026-03-27T00:00:00Z');
    expect(decayed[0].confidence).toBeGreaterThanOrEqual(0.2);
  });
});

describe('feedbackToPatternEngine', () => {
  it('converts validated records to pattern signals', () => {
    const records = [makeRecord({ status: 'validated' as any, outcome: 'strong-success' as any })];
    const signals = feedbackToPatternEngine(records);
    expect(signals.length).toBe(1);
    expect(signals[0].signalType).toBe('boost');
  });

  it('converts rejected records to dampen signals', () => {
    const records = [makeRecord({ status: 'rejected' as any, outcome: 'strong-failure' as any })];
    const signals = feedbackToPatternEngine(records);
    expect(signals.length).toBe(1);
    expect(signals[0].signalType).toBe('dampen');
  });

  it('filters out evaluating records', () => {
    const records = [makeRecord({ status: 'evaluating' })];
    expect(feedbackToPatternEngine(records)).toEqual([]);
  });

  it('returns empty for empty input', () => {
    expect(feedbackToPatternEngine([])).toEqual([]);
  });
});
