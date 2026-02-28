/**
 * TDD tests for the topology recommender.
 *
 * Tests recommendTopology() analysis of VisionAnalysis to produce
 * TopologyRecommendation with topology type, rationale, confidence,
 * and agent count.
 *
 * @module staging/resource/topology.test
 */

import { describe, it, expect } from 'vitest';
import { recommendTopology } from './topology.js';
import type {
  VisionAnalysis,
  DomainRequirement,
  ComplexitySignal,
  AmbiguityMarker,
  ExternalDependency,
  TopologyRecommendation,
} from './types.js';

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Build a VisionAnalysis with sensible defaults and overrides.
 */
function makeAnalysis(overrides: Partial<VisionAnalysis> = {}): VisionAnalysis {
  return {
    requirements: [],
    complexity: [],
    ambiguities: [],
    dependencies: [],
    overallComplexity: 'low',
    summary: 'Test vision document.',
    ...overrides,
  };
}

/** Create N requirements with distinct categories. */
function makeRequirements(
  count: number,
  categoryPrefix = 'domain',
): DomainRequirement[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `req-${String(i + 1).padStart(3, '0')}`,
    description: `Requirement ${i + 1} for ${categoryPrefix}-${i + 1}`,
    category: `${categoryPrefix}-${i + 1}`,
    confidence: 0.8,
  }));
}

/** Create a complexity signal. */
function makeSignal(
  signal: string,
  level: 'low' | 'medium' | 'high' | 'critical' = 'medium',
): ComplexitySignal {
  return { signal, level, evidence: `Evidence for ${signal}` };
}

/** Create an ambiguity marker. */
function makeAmbiguity(text = 'vague statement'): AmbiguityMarker {
  return { text, reason: 'Vague language', location: 'paragraph 1' };
}

/** Create an external dependency. */
function makeDep(
  name: string,
  type: 'api' | 'library' | 'service' | 'database' | 'tool' = 'api',
): ExternalDependency {
  return { name, type, confidence: 0.8 };
}

// ============================================================================
// Tests
// ============================================================================

describe('recommendTopology', () => {
  describe('single topology', () => {
    it('recommends single for simple work with 1-2 requirements and low complexity', () => {
      const analysis = makeAnalysis({
        requirements: makeRequirements(2),
        overallComplexity: 'low',
      });
      const result: TopologyRecommendation = recommendTopology(analysis);
      expect(result.topology).toBe('single');
      expect(result.agentCount).toBe(1);
    });
  });

  describe('pipeline topology', () => {
    it('recommends pipeline for sequential multi-stage work', () => {
      const analysis = makeAnalysis({
        requirements: makeRequirements(4, 'stage'),
        complexity: [
          makeSignal('multi-phase'),
          makeSignal('external-integration'),
        ],
        overallComplexity: 'medium',
      });
      const result = recommendTopology(analysis);
      expect(result.topology).toBe('pipeline');
      expect(result.agentCount).toBeGreaterThanOrEqual(2);
    });
  });

  describe('map-reduce topology', () => {
    it('recommends map-reduce for independent parallel subtasks in different domains', () => {
      const analysis = makeAnalysis({
        requirements: makeRequirements(5, 'independent'),
        complexity: [makeSignal('external-integration')],
        overallComplexity: 'medium',
      });
      const result = recommendTopology(analysis);
      expect(result.topology).toBe('map-reduce');
      expect(result.agentCount).toBeGreaterThanOrEqual(3);
    });
  });

  describe('router topology', () => {
    it('recommends router for classification/routing work spanning many categories', () => {
      const analysis = makeAnalysis({
        requirements: makeRequirements(4, 'specialty'),
        complexity: [makeSignal('cross-cutting')],
        overallComplexity: 'medium',
      });
      const result = recommendTopology(analysis);
      expect(result.topology).toBe('router');
      expect(result.agentCount).toBeGreaterThanOrEqual(2);
    });
  });

  describe('hybrid topology', () => {
    it('recommends hybrid for complex work with both sequential and parallel signals', () => {
      const analysis = makeAnalysis({
        requirements: makeRequirements(6, 'complex'),
        complexity: [
          makeSignal('multi-phase'),
          makeSignal('cross-cutting'),
          makeSignal('external-integration'),
        ],
        overallComplexity: 'high',
      });
      const result = recommendTopology(analysis);
      expect(result.topology).toBe('hybrid');
      expect(result.agentCount).toBeGreaterThanOrEqual(3);
    });
  });

  describe('confidence levels', () => {
    it('assigns high confidence for simple clear work', () => {
      const analysis = makeAnalysis({
        requirements: makeRequirements(1),
        overallComplexity: 'low',
      });
      const result = recommendTopology(analysis);
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('assigns lower confidence when many ambiguity markers present', () => {
      const analysis = makeAnalysis({
        requirements: makeRequirements(3),
        ambiguities: Array.from({ length: 8 }, (_, i) =>
          makeAmbiguity(`ambiguous point ${i}`),
        ),
        overallComplexity: 'medium',
      });
      const result = recommendTopology(analysis);
      // With 8 ambiguity markers, confidence should be noticeably reduced
      expect(result.confidence).toBeLessThanOrEqual(0.7);
    });
  });

  describe('rationale', () => {
    it('includes a non-empty rationale explaining the choice', () => {
      const analysis = makeAnalysis({
        requirements: makeRequirements(3),
        complexity: [makeSignal('multi-phase')],
        overallComplexity: 'medium',
      });
      const result = recommendTopology(analysis);
      expect(result.rationale).toBeTruthy();
      expect(typeof result.rationale).toBe('string');
      expect(result.rationale.length).toBeGreaterThan(10);
    });
  });

  describe('empty analysis', () => {
    it('defaults to single with confidence 1.0 for empty analysis', () => {
      const analysis = makeAnalysis();
      const result = recommendTopology(analysis);
      expect(result.topology).toBe('single');
      expect(result.confidence).toBe(1.0);
      expect(result.agentCount).toBe(1);
    });
  });

  describe('external dependencies influence', () => {
    it('external dependencies push toward pipeline for sequential integrations', () => {
      const analysis = makeAnalysis({
        requirements: makeRequirements(3),
        dependencies: [
          makeDep('Stripe', 'api'),
          makeDep('SendGrid', 'api'),
          makeDep('AWS S3', 'service'),
        ],
        complexity: [makeSignal('external-integration')],
        overallComplexity: 'medium',
      });
      const result = recommendTopology(analysis);
      // Multiple external deps should favor pipeline or higher-complexity topology
      expect(['pipeline', 'map-reduce', 'router', 'hybrid']).toContain(
        result.topology,
      );
      expect(result.agentCount).toBeGreaterThanOrEqual(2);
    });
  });

  describe('complexity escalation', () => {
    it('tends away from single as overall complexity increases', () => {
      const lowResult = recommendTopology(
        makeAnalysis({
          requirements: makeRequirements(3),
          overallComplexity: 'low',
        }),
      );
      const highResult = recommendTopology(
        makeAnalysis({
          requirements: makeRequirements(3),
          complexity: [
            makeSignal('multi-phase', 'high'),
            makeSignal('cross-cutting', 'high'),
          ],
          overallComplexity: 'high',
        }),
      );
      const criticalResult = recommendTopology(
        makeAnalysis({
          requirements: makeRequirements(3),
          complexity: [
            makeSignal('multi-phase', 'critical'),
            makeSignal('cross-cutting', 'critical'),
            makeSignal('novel-domain', 'critical'),
          ],
          overallComplexity: 'critical',
        }),
      );

      // Low complexity may still be single; high/critical should not
      expect(highResult.agentCount).toBeGreaterThanOrEqual(
        lowResult.agentCount,
      );
      expect(criticalResult.agentCount).toBeGreaterThanOrEqual(
        highResult.agentCount,
      );
    });
  });

  describe('agent count scaling', () => {
    it('single topology always recommends 1 agent', () => {
      const analysis = makeAnalysis({
        requirements: makeRequirements(1),
        overallComplexity: 'low',
      });
      const result = recommendTopology(analysis);
      expect(result.topology).toBe('single');
      expect(result.agentCount).toBe(1);
    });

    it('more requirements and higher complexity recommend more agents', () => {
      const smallResult = recommendTopology(
        makeAnalysis({
          requirements: makeRequirements(2, 'small'),
          complexity: [makeSignal('multi-phase')],
          overallComplexity: 'medium',
        }),
      );
      const largeResult = recommendTopology(
        makeAnalysis({
          requirements: makeRequirements(5, 'large'),
          complexity: [
            makeSignal('multi-phase'),
            makeSignal('cross-cutting'),
          ],
          overallComplexity: 'high',
        }),
      );

      expect(largeResult.agentCount).toBeGreaterThan(smallResult.agentCount);
    });
  });
});
