import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { PatternStore } from '../../../core/storage/pattern-store.js';
import {
  DoltHubPatternAdapter,
  TrustScorer,
  StampGatekeeper,
  ValidationLineage,
  TrustDriftMonitor,
  computeBehaviorHash,
} from '../observation-bridge.js';

describe('Observation Bridge', () => {
  let tempDir: string;
  let store: PatternStore;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'obs-bridge-'));
    store = new PatternStore(tempDir);
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  // =========================================================================
  // R3.1: DoltHub Pattern Adapter
  // =========================================================================

  describe('DoltHubPatternAdapter', () => {
    it('records and reads rig activity', async () => {
      const adapter = new DoltHubPatternAdapter(store);

      await adapter.recordRigActivity({ handle: 'fox', action: 'claimed', wantedId: 'w-001' });
      await adapter.recordRigActivity({ handle: 'fox', action: 'completed', wantedId: 'w-001' });

      const activities = await adapter.readRigActivities();
      expect(activities).toHaveLength(2);
      expect(activities[0]!.handle).toBe('fox');
      expect(activities[0]!.action).toBe('claimed');
      expect(activities[1]!.action).toBe('completed');
    });

    it('records and reads trust changes', async () => {
      const adapter = new DoltHubPatternAdapter(store);

      await adapter.recordTrustChange({ handle: 'fox', fromLevel: 0, toLevel: 1, reason: 'First contribution' });
      await adapter.recordTrustChange({ handle: 'fox', fromLevel: 1, toLevel: 2, reason: 'Consistent quality' });

      const history = await adapter.readTrustHistory('fox');
      expect(history).toHaveLength(2);
      expect(history[0]!.fromLevel).toBe(0);
      expect(history[0]!.toLevel).toBe(1);
      expect(history[1]!.toLevel).toBe(2);
    });

    it('filters trust history by handle', async () => {
      const adapter = new DoltHubPatternAdapter(store);

      await adapter.recordTrustChange({ handle: 'fox', fromLevel: 0, toLevel: 1, reason: 'test' });
      await adapter.recordTrustChange({ handle: 'sam', fromLevel: 0, toLevel: 1, reason: 'test' });

      const foxHistory = await adapter.readTrustHistory('fox');
      expect(foxHistory).toHaveLength(1);
      expect(foxHistory[0]!.handle).toBe('fox');

      const allHistory = await adapter.readTrustHistory();
      expect(allHistory).toHaveLength(2);
    });

    it('records scan results', async () => {
      const adapter = new DoltHubPatternAdapter(store);
      await adapter.recordScanResult({ rigCount: 90, eventCount: 15, durationMs: 340, source: 'dolthub-api' });

      const events = await store.read('events');
      const scanEvents = events.filter(e => e.data['kind'] === 'scan-result');
      expect(scanEvents).toHaveLength(1);
      expect(scanEvents[0]!.data['rigCount']).toBe(90);
    });

    it('exposes underlying PatternStore', () => {
      const adapter = new DoltHubPatternAdapter(store);
      expect(adapter.getStore()).toBe(store);
    });
  });

  // =========================================================================
  // R3.2: Trust Scorer
  // =========================================================================

  describe('TrustScorer', () => {
    it('scores a newcomer rig low', () => {
      const scorer = new TrustScorer();
      const result = scorer.evaluate({
        completionCount: 0,
        stampCount: 0,
        avgValence: 0,
        daysSinceFirstCompletion: 0,
        activeDays: 0,
        crossRigEndorsements: 0,
      });

      expect(result.promote).toBe(false);
      expect(result.score).toBe(0);
      expect(result.reasons).toHaveLength(0);
    });

    it('scores an active contributor high', () => {
      const scorer = new TrustScorer();
      const result = scorer.evaluate({
        completionCount: 10,
        stampCount: 5,
        avgValence: 0.85,
        daysSinceFirstCompletion: 45,
        activeDays: 20,
        crossRigEndorsements: 4,
      });

      expect(result.promote).toBe(true);
      expect(result.score).toBeGreaterThan(0.5);
      expect(result.reasons.length).toBeGreaterThan(0);
    });

    it('respects minimum score threshold', () => {
      const scorer = new TrustScorer(0.8);
      const result = scorer.evaluate({
        completionCount: 1,
        stampCount: 0,
        avgValence: 0.5,
        daysSinceFirstCompletion: 1,
        activeDays: 1,
        crossRigEndorsements: 0,
      });

      // With only 1 completion, score should be 0.3 (tool calls factor only)
      expect(result.promote).toBe(false);
      expect(result.score).toBe(0.3);
    });

    it('includes cross-session bonus for endorsed rigs', () => {
      const scorer = new TrustScorer();
      const result = scorer.evaluate(
        {
          completionCount: 5,
          stampCount: 3,
          avgValence: 0.8,
          daysSinceFirstCompletion: 30,
          activeDays: 10,
          crossRigEndorsements: 3,
        },
        { crossSessionCount: 3 },
      );

      expect(result.promote).toBe(true);
      expect(result.reasons.some(r => r.includes('sessions'))).toBe(true);
    });
  });

  // =========================================================================
  // R3.3: Stamp Gatekeeper
  // =========================================================================

  describe('StampGatekeeper', () => {
    it('approves high-quality stamp', async () => {
      const gk = new StampGatekeeper();
      const decision = await gk.evaluate({
        evidenceQuality: 0.9,
        valenceScore: 0.85,
        completionCount: 10,
      });

      expect(decision.approved).toBe(true);
      expect(decision.reasoning.length).toBeGreaterThan(0);
    });

    it('rejects stamp with poor evidence', async () => {
      const gk = new StampGatekeeper();
      const decision = await gk.evaluate({
        evidenceQuality: 0.3,
        valenceScore: 0.4,
        completionCount: 1,
      });

      expect(decision.approved).toBe(false);
      expect(decision.reasoning.some(r => r.includes('failed'))).toBe(true);
    });

    it('records decision to audit trail when store provided', async () => {
      const gk = new StampGatekeeper({}, store);
      await gk.evaluate({
        evidenceQuality: 0.8,
        valenceScore: 0.75,
        completionCount: 5,
      });

      const decisions = await store.read('decisions');
      expect(decisions.length).toBeGreaterThan(0);
    });

    it('uses custom thresholds', async () => {
      const strictGk = new StampGatekeeper({ minDeterminism: 0.95, minConfidence: 0.9, minObservations: 10 });
      const decision = await strictGk.evaluate({
        evidenceQuality: 0.85,
        valenceScore: 0.8,
        completionCount: 5,
      });

      expect(decision.approved).toBe(false); // Doesn't meet strict thresholds
    });
  });

  // =========================================================================
  // R3.4: Validation Lineage
  // =========================================================================

  describe('ValidationLineage', () => {
    it('records completion → stamp → escalation chain', async () => {
      const lineage = new ValidationLineage(store);

      await lineage.recordCompletion('c-fox-001', 'w-001', 'fox');
      await lineage.recordStamp('s-fox-001', 'c-fox-001', 'cedar');
      await lineage.recordStamp('s-fox-002', 'c-fox-001', 'hemlock');
      await lineage.recordEscalation('e-fox-001', 'fox', 0, 1, ['s-fox-001', 's-fox-002']);

      const completions = await lineage.getCompletions();
      expect(completions).toHaveLength(1);

      const stamps = await lineage.getStamps();
      expect(stamps).toHaveLength(2);

      const escalations = await lineage.getEscalations();
      expect(escalations).toHaveLength(1);
    });

    it('traces upstream from escalation to completions', async () => {
      const lineage = new ValidationLineage(store);

      await lineage.recordCompletion('c-fox-001', 'w-001', 'fox');
      await lineage.recordStamp('s-fox-001', 'c-fox-001', 'cedar');
      await lineage.recordEscalation('e-fox-001', 'fox', 0, 1, ['s-fox-001']);

      const chain = await lineage.getChain('e-fox-001');
      expect(chain.artifact.artifactId).toBe('e-fox-001');
      expect(chain.upstream.length).toBeGreaterThan(0);
      expect(chain.upstream.some(e => e.artifactId === 's-fox-001')).toBe(true);
    });
  });

  // =========================================================================
  // R3.5: Trust Drift Monitor
  // =========================================================================

  describe('TrustDriftMonitor', () => {
    it('no demotion when behavior matches baseline', async () => {
      const monitor = new TrustDriftMonitor(store);
      const result = await monitor.check('fox', 'abc123', 'abc123');

      expect(result.demoted).toBe(false);
      expect(result.consecutiveMismatches).toBe(0);
    });

    it('triggers demotion after consecutive mismatches', async () => {
      const monitor = new TrustDriftMonitor(store, 2);

      await monitor.check('fox', 'drift1', 'baseline');
      const result = await monitor.check('fox', 'drift2', 'baseline');

      expect(result.demoted).toBe(true);
      expect(result.consecutiveMismatches).toBe(2);
    });

    it('resets counter on matching behavior', async () => {
      const monitor = new TrustDriftMonitor(store, 3);

      await monitor.check('fox', 'drift', 'baseline'); // mismatch 1
      await monitor.check('fox', 'baseline', 'baseline'); // match — reset
      await monitor.check('fox', 'drift', 'baseline'); // mismatch 1 again

      const result = await monitor.check('fox', 'drift', 'baseline'); // mismatch 2
      expect(result.demoted).toBe(false); // Not yet — only 2 consecutive
      expect(result.consecutiveMismatches).toBe(2);
    });
  });

  // =========================================================================
  // Behavior Hash
  // =========================================================================

  describe('computeBehaviorHash', () => {
    it('produces deterministic hash', () => {
      const h1 = computeBehaviorHash({ completionRate: 0.85, avgValence: 0.7, activeDaysPct: 0.6 });
      const h2 = computeBehaviorHash({ completionRate: 0.85, avgValence: 0.7, activeDaysPct: 0.6 });
      expect(h1).toBe(h2);
    });

    it('quantizes to prevent noise drift', () => {
      const h1 = computeBehaviorHash({ completionRate: 0.83, avgValence: 0.7, activeDaysPct: 0.6 });
      const h2 = computeBehaviorHash({ completionRate: 0.77, avgValence: 0.7, activeDaysPct: 0.6 });
      // Both round to 0.8
      expect(h1).toBe(h2);
    });

    it('detects real changes', () => {
      const h1 = computeBehaviorHash({ completionRate: 0.8, avgValence: 0.7, activeDaysPct: 0.6 });
      const h2 = computeBehaviorHash({ completionRate: 0.3, avgValence: 0.7, activeDaysPct: 0.6 });
      expect(h1).not.toBe(h2);
    });
  });
});
