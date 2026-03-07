/**
 * wasteland-pattern-bridge.ts — Storage Bridge: Wasteland → PatternStore
 *
 * R2.2 + R2.3: Bridges wasteland federation types to core PatternStore for
 * persistent local storage of feedback records, recommendation decisions,
 * and metric snapshots.
 *
 * TYPE ALIGNMENT DECISION (R2.2)
 * Wasteland types are a parallel dialect — they represent multi-agent federation
 * coordination (rigs, towns, trust levels, stamps) while core types represent
 * single-agent observation (sessions, tool executions, promotions). The domains
 * share vocabulary (feedback, decisions, confidence, gates) but solve different
 * problems at different scales.
 *
 * Rather than merging incompatible types, we bridge at the storage boundary:
 * wasteland types serialize into PatternStore's existing categories with
 * type-safe deserialization on read.
 *
 * CATEGORY MAPPING
 * - FeedbackRecord → 'feedback' (same concept: post-action outcome tracking)
 * - Recommendation → 'decisions' (same concept: action proposals with evidence)
 * - MetricSnapshot → 'events' (timestamped measurement data)
 *
 * @module wasteland-pattern-bridge
 */

import { PatternStore } from '../../core/storage/pattern-store.js';
import type {
  FeedbackRecord,
  Recommendation,
  MetricSnapshot,
} from './types.js';

/**
 * Store a wasteland FeedbackRecord in PatternStore 'feedback' category.
 *
 * FeedbackRecords track whether a recommendation improved outcomes.
 * Stored alongside core feedback entries (drift events, bridge entries)
 * but distinguished by the 'source: wasteland' field.
 */
export async function storeFeedback(
  store: PatternStore,
  record: FeedbackRecord,
): Promise<void> {
  await store.append('feedback', {
    source: 'wasteland',
    kind: 'feedback-record',
    recommendationId: record.recommendationId,
    recommendationType: record.recommendationType,
    confidence: record.confidence,
    initialConfidence: record.initialConfidence,
    appliedAt: record.appliedAt,
    baselineMetric: record.baselineMetric as unknown as Record<string, unknown>,
    currentMetric: record.currentMetric as unknown as Record<string, unknown>,
    sampleCount: record.sampleCount,
    minSamplesRequired: record.minSamplesRequired,
    status: record.status,
    outcome: record.outcome,
    lastUpdated: record.lastUpdated,
    evaluationHistoryLength: record.evaluationHistory.length,
  });
}

/**
 * Store a wasteland Recommendation in PatternStore 'decisions' category.
 *
 * Recommendations are proposed actions (team composition, routing, gates)
 * with confidence scores and evidence chains. Stored alongside core
 * gatekeeper decisions but distinguished by 'source: wasteland'.
 */
export async function storeRecommendation(
  store: PatternStore,
  rec: Recommendation,
): Promise<void> {
  await store.append('decisions', {
    source: 'wasteland',
    kind: 'recommendation',
    recommendationId: rec.id,
    type: rec.type,
    confidence: rec.confidence,
    evidenceChain: rec.evidenceChain,
    reasoning: rec.reasoning,
    createdAt: rec.createdAt,
  });
}

/**
 * Store a wasteland MetricSnapshot in PatternStore 'events' category.
 *
 * Metric snapshots capture point-in-time measurements of federation health
 * (success rates, latency, throughput). Stored as events for time-series
 * analysis.
 */
export async function storeMetricSnapshot(
  store: PatternStore,
  snapshot: MetricSnapshot,
  context?: { recommendationId?: string; label?: string },
): Promise<void> {
  await store.append('events', {
    source: 'wasteland',
    kind: 'metric-snapshot',
    successRate: snapshot.successRate,
    avgLatencyMs: snapshot.avgLatencyMs,
    failureCount: snapshot.failureCount,
    throughput: snapshot.throughput,
    sampleSize: snapshot.sampleSize,
    snapshotTimestamp: snapshot.timestamp,
    recommendationId: context?.recommendationId,
    label: context?.label,
  });
}

/**
 * Read wasteland FeedbackRecords from PatternStore 'feedback' category.
 *
 * Filters by source='wasteland' and kind='feedback-record' to distinguish
 * from core feedback entries (drift events, etc.).
 */
export async function readFeedback(
  store: PatternStore,
): Promise<Array<{ recommendationId: string; status: string; confidence: number; outcome?: string; lastUpdated: string }>> {
  const patterns = await store.read('feedback');
  return patterns
    .filter(p => p.data['source'] === 'wasteland' && p.data['kind'] === 'feedback-record')
    .map(p => ({
      recommendationId: String(p.data['recommendationId'] ?? ''),
      status: String(p.data['status'] ?? ''),
      confidence: Number(p.data['confidence'] ?? 0),
      outcome: p.data['outcome'] ? String(p.data['outcome']) : undefined,
      lastUpdated: String(p.data['lastUpdated'] ?? ''),
    }));
}

/**
 * Read wasteland Recommendations from PatternStore 'decisions' category.
 *
 * Filters by source='wasteland' and kind='recommendation' to distinguish
 * from core gatekeeper decisions.
 */
export async function readRecommendations(
  store: PatternStore,
): Promise<Array<{ recommendationId: string; type: string; confidence: number; reasoning: string; createdAt: string }>> {
  const patterns = await store.read('decisions');
  return patterns
    .filter(p => p.data['source'] === 'wasteland' && p.data['kind'] === 'recommendation')
    .map(p => ({
      recommendationId: String(p.data['recommendationId'] ?? ''),
      type: String(p.data['type'] ?? ''),
      confidence: Number(p.data['confidence'] ?? 0),
      reasoning: String(p.data['reasoning'] ?? ''),
      createdAt: String(p.data['createdAt'] ?? ''),
    }));
}

/**
 * Read wasteland MetricSnapshots from PatternStore 'events' category.
 *
 * Filters by source='wasteland' and kind='metric-snapshot'.
 * Returns snapshots in storage order (oldest first).
 */
export async function readMetricSnapshots(
  store: PatternStore,
): Promise<Array<{ successRate: number; avgLatencyMs: number; failureCount: number; throughput: number; sampleSize: number; timestamp: string; label?: string }>> {
  const patterns = await store.read('events');
  return patterns
    .filter(p => p.data['source'] === 'wasteland' && p.data['kind'] === 'metric-snapshot')
    .map(p => ({
      successRate: Number(p.data['successRate'] ?? 0),
      avgLatencyMs: Number(p.data['avgLatencyMs'] ?? 0),
      failureCount: Number(p.data['failureCount'] ?? 0),
      throughput: Number(p.data['throughput'] ?? 0),
      sampleSize: Number(p.data['sampleSize'] ?? 0),
      timestamp: String(p.data['snapshotTimestamp'] ?? ''),
      label: p.data['label'] ? String(p.data['label']) : undefined,
    }));
}
