import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { PatternStore } from '../../../core/storage/pattern-store.js';
import {
  storeFeedback,
  storeRecommendation,
  storeMetricSnapshot,
  readFeedback,
  readRecommendations,
  readMetricSnapshots,
} from '../wasteland-pattern-bridge.js';
import type { FeedbackRecord, Recommendation, MetricSnapshot } from '../types.js';

describe('Wasteland Pattern Bridge', () => {
  let tempDir: string;
  let store: PatternStore;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'wl-bridge-'));
    store = new PatternStore(tempDir);
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  // =========================================================================
  // FeedbackRecord round-trip
  // =========================================================================

  it('stores and reads FeedbackRecords', async () => {
    const record: FeedbackRecord = {
      recommendationId: 'rec-001',
      recommendationType: 'team-composition',
      confidence: 0.85,
      initialConfidence: 0.9,
      appliedAt: '2026-03-07T00:00:00Z',
      baselineMetric: { successRate: 0.7, avgLatencyMs: 200, failureCount: 3, throughput: 10, timestamp: '2026-03-07T00:00:00Z', sampleSize: 50 },
      currentMetric: { successRate: 0.82, avgLatencyMs: 180, failureCount: 1, throughput: 12, timestamp: '2026-03-07T01:00:00Z', sampleSize: 60 },
      sampleCount: 60,
      minSamplesRequired: 30,
      status: 'validated',
      outcome: 'strong-success',
      lastUpdated: '2026-03-07T01:00:00Z',
      evaluationHistory: [],
    };

    await storeFeedback(store, record);
    const results = await readFeedback(store);

    expect(results).toHaveLength(1);
    expect(results[0]!.recommendationId).toBe('rec-001');
    expect(results[0]!.status).toBe('validated');
    expect(results[0]!.confidence).toBe(0.85);
    expect(results[0]!.outcome).toBe('strong-success');
  });

  // =========================================================================
  // Recommendation round-trip
  // =========================================================================

  it('stores and reads Recommendations', async () => {
    const rec: Recommendation = {
      id: 'rec-002',
      type: 'routing-rule',
      confidence: 0.72,
      evidenceChain: ['pattern-A', 'cluster-B'],
      reasoning: 'Route through low-latency path',
      payload: { route: ['town-1', 'town-2'] },
      createdAt: '2026-03-07T02:00:00Z',
    };

    await storeRecommendation(store, rec);
    const results = await readRecommendations(store);

    expect(results).toHaveLength(1);
    expect(results[0]!.recommendationId).toBe('rec-002');
    expect(results[0]!.type).toBe('routing-rule');
    expect(results[0]!.confidence).toBe(0.72);
    expect(results[0]!.reasoning).toBe('Route through low-latency path');
  });

  // =========================================================================
  // MetricSnapshot round-trip
  // =========================================================================

  it('stores and reads MetricSnapshots', async () => {
    const snapshot: MetricSnapshot = {
      successRate: 0.91,
      avgLatencyMs: 150,
      failureCount: 2,
      throughput: 15,
      timestamp: '2026-03-07T03:00:00Z',
      sampleSize: 100,
    };

    await storeMetricSnapshot(store, snapshot, { recommendationId: 'rec-003', label: 'baseline' });
    const results = await readMetricSnapshots(store);

    expect(results).toHaveLength(1);
    expect(results[0]!.successRate).toBe(0.91);
    expect(results[0]!.avgLatencyMs).toBe(150);
    expect(results[0]!.sampleSize).toBe(100);
    expect(results[0]!.label).toBe('baseline');
  });

  // =========================================================================
  // Isolation: wasteland entries don't leak into core reads
  // =========================================================================

  it('wasteland entries are filtered by source and kind', async () => {
    // Store a wasteland entry
    await storeRecommendation(store, {
      id: 'wl-rec',
      type: 'safety-gate',
      confidence: 0.8,
      evidenceChain: [],
      reasoning: 'test',
      payload: {},
      createdAt: '2026-03-07T00:00:00Z',
    });

    // Store a core entry directly (simulating gatekeeper decision)
    await store.append('decisions', {
      approved: true,
      reasoning: ['core gate passed'],
      candidateToolName: 'Read',
    });

    // Wasteland read should only get the wasteland entry
    const wlDecisions = await readRecommendations(store);
    expect(wlDecisions).toHaveLength(1);
    expect(wlDecisions[0]!.recommendationId).toBe('wl-rec');

    // Full store read should have both
    const allDecisions = await store.read('decisions');
    expect(allDecisions).toHaveLength(2);
  });

  // =========================================================================
  // Multiple entries in same category
  // =========================================================================

  it('handles multiple feedback records', async () => {
    const base: Omit<FeedbackRecord, 'recommendationId' | 'status' | 'confidence'> = {
      recommendationType: 'task-decomposition',
      initialConfidence: 0.9,
      appliedAt: '2026-03-07T00:00:00Z',
      baselineMetric: { successRate: 0.7, avgLatencyMs: 200, failureCount: 3, throughput: 10, timestamp: '2026-03-07T00:00:00Z', sampleSize: 50 },
      currentMetric: { successRate: 0.8, avgLatencyMs: 190, failureCount: 2, throughput: 11, timestamp: '2026-03-07T01:00:00Z', sampleSize: 55 },
      sampleCount: 55,
      minSamplesRequired: 30,
      outcome: undefined,
      lastUpdated: '2026-03-07T01:00:00Z',
      evaluationHistory: [],
    };

    await storeFeedback(store, { ...base, recommendationId: 'r1', status: 'evaluating', confidence: 0.8 });
    await storeFeedback(store, { ...base, recommendationId: 'r2', status: 'validated', confidence: 0.95 });
    await storeFeedback(store, { ...base, recommendationId: 'r3', status: 'rejected', confidence: 0.3 });

    const results = await readFeedback(store);
    expect(results).toHaveLength(3);
    expect(results.map(r => r.recommendationId)).toEqual(['r1', 'r2', 'r3']);
  });

  // =========================================================================
  // Empty store reads
  // =========================================================================

  it('returns empty arrays from empty store', async () => {
    expect(await readFeedback(store)).toEqual([]);
    expect(await readRecommendations(store)).toEqual([]);
    expect(await readMetricSnapshots(store)).toEqual([]);
  });

  // =========================================================================
  // MetricSnapshot without optional context
  // =========================================================================

  it('stores MetricSnapshot without context', async () => {
    const snapshot: MetricSnapshot = {
      successRate: 0.5,
      avgLatencyMs: 300,
      failureCount: 10,
      throughput: 5,
      timestamp: '2026-03-07T04:00:00Z',
      sampleSize: 20,
    };

    await storeMetricSnapshot(store, snapshot);
    const results = await readMetricSnapshots(store);

    expect(results).toHaveLength(1);
    expect(results[0]!.label).toBeUndefined();
  });
});
