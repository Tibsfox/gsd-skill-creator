import { describe, it, expect } from 'vitest';
import type { PromotionCandidate, ClassifiedOperation, GatekeeperConfig } from '../types/observation.js';
import { DEFAULT_GATEKEEPER_CONFIG } from '../types/observation.js';
import { PromotionGatekeeper } from './promotion-gatekeeper.js';

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
    it('approves candidate that passes all default thresholds', () => {
      const gatekeeper = new PromotionGatekeeper();
      const candidate = makeCandidate({ determinism: 1.0, compositeScore: 0.9, observationCount: 10 });
      const decision = gatekeeper.evaluate(candidate);
      expect(decision.approved).toBe(true);
    });

    it('rejects candidate with determinism below threshold', () => {
      const gatekeeper = new PromotionGatekeeper();
      const candidate = makeCandidate({ determinism: 0.8 });
      const decision = gatekeeper.evaluate(candidate);
      expect(decision.approved).toBe(false);
      expect(decision.reasoning.some(r => r.toLowerCase().includes('determinism') && r.toLowerCase().includes('failed'))).toBe(true);
    });

    it('rejects candidate with compositeScore below confidence threshold', () => {
      const gatekeeper = new PromotionGatekeeper();
      const candidate = makeCandidate({ compositeScore: 0.5 });
      const decision = gatekeeper.evaluate(candidate);
      expect(decision.approved).toBe(false);
      expect(decision.reasoning.some(r => r.toLowerCase().includes('confidence') && r.toLowerCase().includes('failed'))).toBe(true);
    });

    it('rejects candidate with insufficient observations', () => {
      const gatekeeper = new PromotionGatekeeper();
      const candidate = makeCandidate({ observationCount: 2 });
      const decision = gatekeeper.evaluate(candidate);
      expect(decision.approved).toBe(false);
      expect(decision.reasoning.some(r => r.toLowerCase().includes('observation') && r.toLowerCase().includes('failed'))).toBe(true);
    });

    it('rejects candidate failing multiple gates with all reasons listed', () => {
      const gatekeeper = new PromotionGatekeeper();
      const candidate = makeCandidate({ determinism: 0.5, compositeScore: 0.3, observationCount: 1 });
      const decision = gatekeeper.evaluate(candidate);
      expect(decision.approved).toBe(false);
      expect(decision.reasoning.length).toBeGreaterThanOrEqual(3);
    });

    it('includes evidence with actual scores and thresholds', () => {
      const gatekeeper = new PromotionGatekeeper();
      const candidate = makeCandidate({ determinism: 0.98, compositeScore: 0.92, observationCount: 7 });
      const decision = gatekeeper.evaluate(candidate);
      expect(decision.evidence.determinism).toBe(0.98);
      expect(decision.evidence.compositeScore).toBe(0.92);
      expect(decision.evidence.observationCount).toBe(7);
      expect(decision.evidence.thresholdDeterminism).toBe(0.95);
      expect(decision.evidence.thresholdConfidence).toBe(0.85);
      expect(decision.evidence.thresholdMinObservations).toBe(5);
    });

    it('uses custom thresholds from config', () => {
      const config: GatekeeperConfig = { minDeterminism: 0.7, minConfidence: 0.5, minObservations: 3 };
      const gatekeeper = new PromotionGatekeeper(config);
      const candidate = makeCandidate({ determinism: 0.8, compositeScore: 0.6, observationCount: 3 });
      const decision = gatekeeper.evaluate(candidate);
      expect(decision.approved).toBe(true);
    });

    it('default config enforces determinism >= 0.95, confidence >= 0.85, minObservations >= 5', () => {
      expect(DEFAULT_GATEKEEPER_CONFIG.minDeterminism).toBe(0.95);
      expect(DEFAULT_GATEKEEPER_CONFIG.minConfidence).toBe(0.85);
      expect(DEFAULT_GATEKEEPER_CONFIG.minObservations).toBe(5);

      const gatekeeper = new PromotionGatekeeper();

      // Exact boundary values should pass
      const boundaryCandidate = makeCandidate({ determinism: 0.95, compositeScore: 0.85, observationCount: 5 });
      const passDecision = gatekeeper.evaluate(boundaryCandidate);
      expect(passDecision.approved).toBe(true);

      // Just below boundary should fail
      const belowCandidate = makeCandidate({ determinism: 0.949, compositeScore: 0.849, observationCount: 4 });
      const failDecision = gatekeeper.evaluate(belowCandidate);
      expect(failDecision.approved).toBe(false);
    });

    it('includes candidate reference in decision', () => {
      const gatekeeper = new PromotionGatekeeper();
      const candidate = makeCandidate();
      const decision = gatekeeper.evaluate(candidate);
      expect(decision.candidate).toBe(candidate);
    });

    it('includes ISO timestamp in decision', () => {
      const gatekeeper = new PromotionGatekeeper();
      const candidate = makeCandidate();
      const decision = gatekeeper.evaluate(candidate);
      expect(decision.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('approved decision has positive reasoning', () => {
      const gatekeeper = new PromotionGatekeeper();
      const candidate = makeCandidate();
      const decision = gatekeeper.evaluate(candidate);
      expect(decision.approved).toBe(true);
      expect(decision.reasoning.some(r => r.toLowerCase().includes('passed'))).toBe(true);
      // One reasoning entry per gate checked (3 core gates)
      expect(decision.reasoning.length).toBe(3);
    });
  });
});
