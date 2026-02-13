import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'fs/promises';
import { join } from 'path';
import * as os from 'os';
import type { PromotionCandidate, ClassifiedOperation, GatekeeperConfig } from '../types/observation.js';
import { DEFAULT_GATEKEEPER_CONFIG } from '../types/observation.js';
import { PromotionGatekeeper } from './promotion-gatekeeper.js';
import { PatternStore } from '../storage/pattern-store.js';
import type { BenchmarkReport } from '../calibration/benchmark-reporter.js';
import { calculateMCC, mccToPercentage } from '../calibration/mcc-calculator.js';

/**
 * Helper: create a PromotionCandidate with specified properties.
 * Defaults produce a candidate that passes all default gates.
 */
function makeCandidate(overrides: {
  determinism?: number;
  compositeScore?: number;
  observationCount?: number;
  toolName?: string;
  frequency?: number;
} = {}): PromotionCandidate {
  const determinism = overrides.determinism ?? 1.0;
  const compositeScore = overrides.compositeScore ?? 0.9;
  const observationCount = overrides.observationCount ?? 10;
  const toolName = overrides.toolName ?? 'Read';
  const frequency = overrides.frequency ?? observationCount;

  const operation: ClassifiedOperation = {
    score: {
      operation: { toolName, inputHash: 'test-hash-abc123' },
      varianceScore: 1 - determinism,
      observationCount,
      uniqueOutputs: determinism >= 0.95 ? 1 : 3,
      sessionIds: Array.from({ length: observationCount }, (_, i) => `sess-${i}`),
    },
    classification: determinism >= 0.95 ? 'deterministic' : determinism >= 0.7 ? 'semi-deterministic' : 'non-deterministic',
    determinism,
  };

  return {
    operation,
    toolName,
    frequency,
    estimatedTokenSavings: 150,
    compositeScore,
    meetsConfidence: true,
  };
}

describe('PromotionGatekeeper', () => {
  describe('threshold checking and decision logic', () => {
    it('approves candidate that passes all default thresholds', async () => {
      const gatekeeper = new PromotionGatekeeper();
      const candidate = makeCandidate({ determinism: 1.0, compositeScore: 0.9, observationCount: 10 });
      const decision = await gatekeeper.evaluate(candidate);
      expect(decision.approved).toBe(true);
    });

    it('rejects candidate with determinism below threshold', async () => {
      const gatekeeper = new PromotionGatekeeper();
      const candidate = makeCandidate({ determinism: 0.8 });
      const decision = await gatekeeper.evaluate(candidate);
      expect(decision.approved).toBe(false);
      expect(decision.reasoning.some(r => r.toLowerCase().includes('determinism') && r.toLowerCase().includes('failed'))).toBe(true);
    });

    it('rejects candidate with compositeScore below confidence threshold', async () => {
      const gatekeeper = new PromotionGatekeeper();
      const candidate = makeCandidate({ compositeScore: 0.5 });
      const decision = await gatekeeper.evaluate(candidate);
      expect(decision.approved).toBe(false);
      expect(decision.reasoning.some(r => r.toLowerCase().includes('confidence') && r.toLowerCase().includes('failed'))).toBe(true);
    });

    it('rejects candidate with insufficient observations', async () => {
      const gatekeeper = new PromotionGatekeeper();
      const candidate = makeCandidate({ observationCount: 2 });
      const decision = await gatekeeper.evaluate(candidate);
      expect(decision.approved).toBe(false);
      expect(decision.reasoning.some(r => r.toLowerCase().includes('observation') && r.toLowerCase().includes('failed'))).toBe(true);
    });

    it('rejects candidate failing multiple gates with all reasons listed', async () => {
      const gatekeeper = new PromotionGatekeeper();
      const candidate = makeCandidate({ determinism: 0.5, compositeScore: 0.3, observationCount: 1 });
      const decision = await gatekeeper.evaluate(candidate);
      expect(decision.approved).toBe(false);
      expect(decision.reasoning.length).toBeGreaterThanOrEqual(3);
    });

    it('includes evidence with actual scores and thresholds', async () => {
      const gatekeeper = new PromotionGatekeeper();
      const candidate = makeCandidate({ determinism: 0.98, compositeScore: 0.92, observationCount: 7 });
      const decision = await gatekeeper.evaluate(candidate);
      expect(decision.evidence.determinism).toBe(0.98);
      expect(decision.evidence.compositeScore).toBe(0.92);
      expect(decision.evidence.observationCount).toBe(7);
      expect(decision.evidence.thresholdDeterminism).toBe(0.95);
      expect(decision.evidence.thresholdConfidence).toBe(0.85);
      expect(decision.evidence.thresholdMinObservations).toBe(5);
    });

    it('uses custom thresholds from config', async () => {
      const config: GatekeeperConfig = { minDeterminism: 0.7, minConfidence: 0.5, minObservations: 3 };
      const gatekeeper = new PromotionGatekeeper(config);
      const candidate = makeCandidate({ determinism: 0.8, compositeScore: 0.6, observationCount: 3 });
      const decision = await gatekeeper.evaluate(candidate);
      expect(decision.approved).toBe(true);
    });

    it('default config enforces determinism >= 0.95, confidence >= 0.85, minObservations >= 5', async () => {
      expect(DEFAULT_GATEKEEPER_CONFIG.minDeterminism).toBe(0.95);
      expect(DEFAULT_GATEKEEPER_CONFIG.minConfidence).toBe(0.85);
      expect(DEFAULT_GATEKEEPER_CONFIG.minObservations).toBe(5);

      const gatekeeper = new PromotionGatekeeper();

      // Exact boundary values should pass
      const boundaryCandidate = makeCandidate({ determinism: 0.95, compositeScore: 0.85, observationCount: 5 });
      const passDecision = await gatekeeper.evaluate(boundaryCandidate);
      expect(passDecision.approved).toBe(true);

      // Just below boundary should fail
      const belowCandidate = makeCandidate({ determinism: 0.949, compositeScore: 0.849, observationCount: 4 });
      const failDecision = await gatekeeper.evaluate(belowCandidate);
      expect(failDecision.approved).toBe(false);
    });

    it('includes candidate reference in decision', async () => {
      const gatekeeper = new PromotionGatekeeper();
      const candidate = makeCandidate();
      const decision = await gatekeeper.evaluate(candidate);
      expect(decision.candidate).toBe(candidate);
    });

    it('includes ISO timestamp in decision', async () => {
      const gatekeeper = new PromotionGatekeeper();
      const candidate = makeCandidate();
      const decision = await gatekeeper.evaluate(candidate);
      expect(decision.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('approved decision has positive reasoning', async () => {
      const gatekeeper = new PromotionGatekeeper();
      const candidate = makeCandidate();
      const decision = await gatekeeper.evaluate(candidate);
      expect(decision.approved).toBe(true);
      expect(decision.reasoning.some(r => r.toLowerCase().includes('passed'))).toBe(true);
      // One reasoning entry per gate checked (3 core gates)
      expect(decision.reasoning.length).toBe(3);
    });
  });

  describe('calibration metrics integration', () => {
    /**
     * Helper: create a BenchmarkReport with specified metrics.
     * Defaults produce a healthy report that passes typical thresholds.
     */
    function makeReport(overrides: {
      f1Score?: number;
      accuracy?: number;
      tp?: number;
      tn?: number;
      fp?: number;
      fn?: number;
      dataPoints?: number;
    } = {}): BenchmarkReport {
      const tp = overrides.tp ?? 80;
      const tn = overrides.tn ?? 10;
      const fp = overrides.fp ?? 5;
      const fn = overrides.fn ?? 5;
      const total = tp + tn + fp + fn;
      const accuracy = overrides.accuracy ?? (total > 0 ? (tp + tn) / total : 0);
      const precision = (tp + fp) > 0 ? tp / (tp + fp) : 0;
      const recall = (tp + fn) > 0 ? tp / (tp + fn) : 0;
      const f1Score = overrides.f1Score ?? ((precision + recall) > 0 ? 2 * (precision * recall) / (precision + recall) : 0);

      return {
        correlation: mccToPercentage(calculateMCC(tp, tn, fp, fn)),
        metrics: {
          truePositives: tp,
          trueNegatives: tn,
          falsePositives: fp,
          falseNegatives: fn,
          accuracy,
          precision,
          recall,
          f1Score,
          falsePositiveRate: (fp + tn) > 0 ? fp / (fp + tn) : 0,
        },
        dataPoints: overrides.dataPoints ?? total,
        dateRange: { from: '2026-01-01', to: '2026-02-01' },
        currentThreshold: 0.7,
        recommendations: [],
      };
    }

    it('checks F1 score from BenchmarkReport when minF1 is configured', async () => {
      const candidate = makeCandidate({ determinism: 1.0, compositeScore: 0.9, observationCount: 10 });
      const report = makeReport({ f1Score: 0.85 });
      const config: GatekeeperConfig = { ...DEFAULT_GATEKEEPER_CONFIG, minF1: 0.8 };
      const gatekeeper = new PromotionGatekeeper(config);
      const decision = await gatekeeper.evaluate(candidate, report);
      expect(decision.approved).toBe(true);
      expect(decision.evidence.f1Score).toBe(0.85);
      expect(decision.evidence.thresholdF1).toBe(0.8);
      expect(decision.reasoning.some(r => r.toLowerCase().includes('f1') && r.toLowerCase().includes('passed'))).toBe(true);
    });

    it('rejects candidate when F1 score is below minF1 threshold', async () => {
      const candidate = makeCandidate({ determinism: 1.0, compositeScore: 0.9, observationCount: 10 });
      const report = makeReport({ f1Score: 0.4 });
      const config: GatekeeperConfig = { ...DEFAULT_GATEKEEPER_CONFIG, minF1: 0.7 };
      const gatekeeper = new PromotionGatekeeper(config);
      const decision = await gatekeeper.evaluate(candidate, report);
      expect(decision.approved).toBe(false);
      expect(decision.reasoning.some(r => r.toLowerCase().includes('f1') && r.toLowerCase().includes('failed'))).toBe(true);
    });

    it('checks accuracy from BenchmarkReport when minAccuracy is configured', async () => {
      const candidate = makeCandidate({ determinism: 1.0, compositeScore: 0.9, observationCount: 10 });
      const report = makeReport({ accuracy: 0.92 });
      const config: GatekeeperConfig = { ...DEFAULT_GATEKEEPER_CONFIG, minAccuracy: 0.85 };
      const gatekeeper = new PromotionGatekeeper(config);
      const decision = await gatekeeper.evaluate(candidate, report);
      expect(decision.approved).toBe(true);
      expect(decision.evidence.accuracy).toBe(0.92);
      expect(decision.evidence.thresholdAccuracy).toBe(0.85);
    });

    it('rejects candidate when accuracy is below minAccuracy threshold', async () => {
      const candidate = makeCandidate({ determinism: 1.0, compositeScore: 0.9, observationCount: 10 });
      const report = makeReport({ accuracy: 0.5 });
      const config: GatekeeperConfig = { ...DEFAULT_GATEKEEPER_CONFIG, minAccuracy: 0.8 };
      const gatekeeper = new PromotionGatekeeper(config);
      const decision = await gatekeeper.evaluate(candidate, report);
      expect(decision.approved).toBe(false);
    });

    it('checks MCC from BenchmarkReport when minMCC is configured', async () => {
      const candidate = makeCandidate({ determinism: 1.0, compositeScore: 0.9, observationCount: 10 });
      const report = makeReport({ tp: 80, tn: 10, fp: 5, fn: 5 });
      const config: GatekeeperConfig = { ...DEFAULT_GATEKEEPER_CONFIG, minMCC: 0.3 };
      const gatekeeper = new PromotionGatekeeper(config);
      const decision = await gatekeeper.evaluate(candidate, report);
      expect(decision.approved).toBe(true);
      expect(decision.evidence.mcc).toBeTypeOf('number');
      expect(decision.evidence.thresholdMCC).toBe(0.3);
    });

    it('rejects candidate when MCC is below minMCC threshold', async () => {
      const candidate = makeCandidate({ determinism: 1.0, compositeScore: 0.9, observationCount: 10 });
      const report = makeReport({ tp: 5, tn: 5, fp: 45, fn: 45 });
      const config: GatekeeperConfig = { ...DEFAULT_GATEKEEPER_CONFIG, minMCC: 0.5 };
      const gatekeeper = new PromotionGatekeeper(config);
      const decision = await gatekeeper.evaluate(candidate, report);
      expect(decision.approved).toBe(false);
    });

    it('skips F1, accuracy, and MCC gates when no BenchmarkReport is provided', async () => {
      const candidate = makeCandidate({ determinism: 1.0, compositeScore: 0.9, observationCount: 10 });
      const config: GatekeeperConfig = { ...DEFAULT_GATEKEEPER_CONFIG, minF1: 0.8, minAccuracy: 0.8, minMCC: 0.3 };
      const gatekeeper = new PromotionGatekeeper(config);
      const decision = await gatekeeper.evaluate(candidate);
      expect(decision.approved).toBe(true);
      expect(decision.reasoning.some(r => r.toLowerCase().includes('f1'))).toBe(false);
      expect(decision.reasoning.some(r => r.toLowerCase().includes('accuracy'))).toBe(false);
      expect(decision.reasoning.some(r => r.toLowerCase().includes('mcc'))).toBe(false);
    });

    it('skips calibration gates when thresholds are not configured even with report', async () => {
      const candidate = makeCandidate({ determinism: 1.0, compositeScore: 0.9, observationCount: 10 });
      const gatekeeper = new PromotionGatekeeper();
      const report = makeReport({ f1Score: 0.1, accuracy: 0.1 });
      const decision = await gatekeeper.evaluate(candidate, report);
      expect(decision.approved).toBe(true);
    });
  });

  describe('decision audit trail', () => {
    let tmpDir: string;
    let store: PatternStore;

    beforeEach(async () => {
      tmpDir = await mkdtemp(join(os.tmpdir(), 'gatekeeper-audit-test-'));
      store = new PatternStore(tmpDir);
    });

    afterEach(async () => {
      await rm(tmpDir, { recursive: true, force: true });
    });

    it('stores approved decision to PatternStore decisions category', async () => {
      const gatekeeper = new PromotionGatekeeper(DEFAULT_GATEKEEPER_CONFIG, store);
      const candidate = makeCandidate();
      await gatekeeper.evaluate(candidate);
      const entries = await store.read('decisions');
      expect(entries.length).toBe(1);
      expect((entries[0].data as Record<string, unknown>).approved).toBe(true);
    });

    it('stores rejected decision to PatternStore decisions category', async () => {
      const gatekeeper = new PromotionGatekeeper(DEFAULT_GATEKEEPER_CONFIG, store);
      const candidate = makeCandidate({ determinism: 0.5 });
      await gatekeeper.evaluate(candidate);
      const entries = await store.read('decisions');
      expect(entries.length).toBe(1);
      expect((entries[0].data as Record<string, unknown>).approved).toBe(false);
    });

    it('stores multiple decisions sequentially', async () => {
      const gatekeeper = new PromotionGatekeeper(DEFAULT_GATEKEEPER_CONFIG, store);
      await gatekeeper.evaluate(makeCandidate());
      await gatekeeper.evaluate(makeCandidate());
      await gatekeeper.evaluate(makeCandidate({ determinism: 0.5 }));
      const entries = await store.read('decisions');
      expect(entries.length).toBe(3);
    });

    it('decision is returned even when store is not provided', async () => {
      const gatekeeper = new PromotionGatekeeper(DEFAULT_GATEKEEPER_CONFIG);
      const candidate = makeCandidate();
      const decision = await gatekeeper.evaluate(candidate);
      expect(decision).toBeDefined();
      expect(decision.approved).toBe(true);
    });
  });

  describe('barrel exports', () => {
    it('exports PromotionGatekeeper and types from observation barrel', async () => {
      const barrel = await import('./index.js');
      expect(barrel.PromotionGatekeeper).toBeDefined();
      expect(barrel.DEFAULT_GATEKEEPER_CONFIG).toBeDefined();
    });
  });
});
