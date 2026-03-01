/**
 * Tests for ExpressionRenderer -- depth levels, calibration,
 * token cost, fallback, and cross-references.
 */

import { describe, it, expect } from 'vitest';
import { ExpressionRenderer } from './expression-renderer.js';
import type { RenderedExpression, RenderDepth } from './expression-renderer.js';
import { PanelInterface } from '../panels/panel-interface.js';
import type { PanelCapabilities } from '../panels/panel-interface.js';
import type {
  RosettaConcept,
  PanelId,
  PanelExpression,
  CalibrationProfile,
  CalibrationDelta,
} from './types.js';

// ─── Mock Panel ───────────────────────────────────────────────────────────────

class MockPanel extends PanelInterface {
  readonly panelId: PanelId = 'python';
  readonly name = 'Mock Python Panel';
  readonly description = 'Test panel for Python';

  translate(concept: RosettaConcept): PanelExpression {
    return concept.panels.get('python') || { panelId: 'python' };
  }

  getCapabilities(): PanelCapabilities {
    return {
      supportedDomains: ['mathematics'],
      mathLibraries: ['numpy'],
      hasCodeGeneration: true,
      hasPedagogicalNotes: true,
      expressionFormats: ['code', 'explanation'],
    };
  }

  formatExpression(expression: PanelExpression): string {
    return `[Python: ${expression.code || 'no code'}]`;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeConcept(overrides: Partial<RosettaConcept> = {}): RosettaConcept {
  return {
    id: 'test-concept',
    name: 'Test Concept',
    domain: 'mathematics',
    description: 'A test concept for expression rendering',
    panels: new Map<PanelId, PanelExpression>([
      [
        'python',
        {
          panelId: 'python',
          code: 'import math\ndef compute(x): return math.sqrt(x)',
          explanation: 'Demonstrates math module usage for square root.',
          examples: ['compute(4)  # -> 2.0', 'compute(9)  # -> 3.0', 'compute(16)  # -> 4.0'],
          pedagogicalNotes: 'Python reveals how standard libraries encapsulate mathematical operations.',
        },
      ],
    ]),
    relationships: [],
    ...overrides,
  };
}

function makeCalibration(
  adjustment: Record<string, number>,
  confidence: number,
): CalibrationProfile {
  return {
    domain: 'mathematics',
    deltas: [
      {
        observedResult: 'test',
        expectedResult: 'test',
        adjustment,
        confidence: 0.8,
        domainModel: 'test-model',
        timestamp: new Date(),
      },
    ],
    confidenceScore: confidence,
    lastUpdated: new Date(),
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ExpressionRenderer', () => {
  const renderer = new ExpressionRenderer();
  const panel = new MockPanel();

  describe('summary depth', () => {
    it('produces content containing concept name and description', () => {
      const concept = makeConcept();
      const result = renderer.render(concept, 'python', panel, 'summary');

      expect(result.content).toContain('Test Concept');
      expect(result.content).toContain('A test concept for expression rendering');
    });

    it('has tokenCost <= 200', () => {
      const concept = makeConcept();
      const result = renderer.render(concept, 'python', panel, 'summary');

      expect(result.tokenCost).toBeLessThanOrEqual(200);
    });

    it('includes relationship IDs in content', () => {
      const concept = makeConcept({
        relationships: [
          { type: 'dependency', targetId: 'algebra', description: 'Requires algebra' },
          { type: 'cross-reference', targetId: 'physics-calc', description: 'Applied in physics' },
        ],
      });
      const result = renderer.render(concept, 'python', panel, 'summary');

      expect(result.content).toContain('algebra');
      expect(result.content).toContain('physics-calc');
    });

    it('truncates long content to stay within token limit', () => {
      const longDescription = 'A'.repeat(1000);
      const concept = makeConcept({ description: longDescription });
      const result = renderer.render(concept, 'python', panel, 'summary');

      expect(result.tokenCost).toBeLessThanOrEqual(200);
    });
  });

  describe('active depth', () => {
    it('has tokenCost <= 1000 for normal expressions', () => {
      const concept = makeConcept();
      const result = renderer.render(concept, 'python', panel, 'active');

      expect(result.tokenCost).toBeLessThanOrEqual(1000);
    });

    it('includes formatted panel output', () => {
      const concept = makeConcept();
      const result = renderer.render(concept, 'python', panel, 'active');

      expect(result.content).toContain('[Python:');
    });

    it('includes explanation', () => {
      const concept = makeConcept();
      const result = renderer.render(concept, 'python', panel, 'active');

      expect(result.content).toContain('Demonstrates math module usage');
    });

    it('includes first 2 examples only', () => {
      const concept = makeConcept();
      const result = renderer.render(concept, 'python', panel, 'active');

      expect(result.content).toContain('compute(4)');
      expect(result.content).toContain('compute(9)');
      expect(result.content).not.toContain('compute(16)');
    });

    it('truncates very long content with truncation marker', () => {
      const longCode = 'x'.repeat(5000);
      const concept = makeConcept({
        panels: new Map([
          [
            'python',
            {
              panelId: 'python' as PanelId,
              code: longCode,
              explanation: 'Long explanation',
            },
          ],
        ]),
      });
      const result = renderer.render(concept, 'python', panel, 'active');

      expect(result.tokenCost).toBeLessThanOrEqual(1000);
      expect(result.content).toContain('[truncated at active tier]');
    });
  });

  describe('deep depth', () => {
    it('includes pedagogicalNotes in the result', () => {
      const concept = makeConcept();
      const result = renderer.render(concept, 'python', panel, 'deep');

      expect(result.pedagogicalNotes).toBeDefined();
      expect(result.pedagogicalNotes).toContain('Python reveals');
    });

    it('includes pedagogical notes in content', () => {
      const concept = makeConcept();
      const result = renderer.render(concept, 'python', panel, 'deep');

      expect(result.content).toContain('Pedagogical Notes:');
      expect(result.content).toContain('Python reveals');
    });

    it('includes all examples', () => {
      const concept = makeConcept();
      const result = renderer.render(concept, 'python', panel, 'deep');

      expect(result.content).toContain('compute(4)');
      expect(result.content).toContain('compute(9)');
      expect(result.content).toContain('compute(16)');
    });

    it('includes context from description', () => {
      const concept = makeConcept();
      const result = renderer.render(concept, 'python', panel, 'deep');

      expect(result.content).toContain('Context: A test concept for expression rendering');
    });

    it('has no truncation (can exceed active token limit)', () => {
      const concept = makeConcept();
      const result = renderer.render(concept, 'python', panel, 'deep');

      expect(result.content).not.toContain('[truncated');
    });
  });

  describe('natural language fallback', () => {
    it('falls back when panel is undefined', () => {
      const concept = makeConcept();
      const result = renderer.render(concept, 'python', undefined, 'active');

      expect(result.content).toContain('Test Concept');
      expect(result.content).toContain('A test concept for expression rendering');
    });

    it('falls back when concept has no expression for the panel', () => {
      const concept = makeConcept({
        panels: new Map(), // empty panels
      });
      const result = renderer.render(concept, 'fortran', panel, 'active');

      expect(result.content).toContain('Test Concept');
    });

    it('preserves the requested panelId in the result', () => {
      const concept = makeConcept();
      const result = renderer.render(concept, 'fortran', undefined, 'active');

      expect(result.panelId).toBe('fortran');
    });

    it('includes relationships in fallback', () => {
      const concept = makeConcept({
        relationships: [
          { type: 'dependency', targetId: 'prereq', description: 'Prerequisite concept' },
        ],
      });
      const result = renderer.render(concept, 'fortran', undefined, 'active');

      expect(result.content).toContain('prereq');
    });
  });

  describe('calibrated rendering', () => {
    it('uses summary depth for high-confidence negative complexity adjustment', () => {
      const concept = makeConcept();
      const calibration = makeCalibration({ complexity: -0.1 }, 0.9);
      const result = renderer.renderCalibrated(concept, 'python', panel, calibration);

      // Summary depth: contains name and description, tokenCost <= 200
      expect(result.content).toContain('Test Concept');
      expect(result.tokenCost).toBeLessThanOrEqual(200);
    });

    it('uses deep depth for high-confidence positive complexity adjustment', () => {
      const concept = makeConcept();
      const calibration = makeCalibration({ complexity: 0.2 }, 0.9);
      const result = renderer.renderCalibrated(concept, 'python', panel, calibration);

      // Deep depth: includes pedagogical notes
      expect(result.pedagogicalNotes).toBeDefined();
      expect(result.content).toContain('Pedagogical Notes:');
    });

    it('uses active depth for low confidence', () => {
      const concept = makeConcept();
      const calibration = makeCalibration({ complexity: -0.5 }, 0.3);
      const result = renderer.renderCalibrated(concept, 'python', panel, calibration);

      // Active depth: includes formatted panel output but not pedagogical notes in top-level field
      expect(result.content).toContain('[Python:');
      expect(result.pedagogicalNotes).toBeUndefined();
    });

    it('uses active depth when no deltas present', () => {
      const calibration: CalibrationProfile = {
        domain: 'mathematics',
        deltas: [],
        confidenceScore: 0.9,
        lastUpdated: new Date(),
      };
      const concept = makeConcept();
      const result = renderer.renderCalibrated(concept, 'python', panel, calibration);

      expect(result.content).toContain('[Python:');
    });
  });

  describe('token cost', () => {
    it('matches Math.ceil(content.length / 4)', () => {
      const concept = makeConcept();
      const result = renderer.render(concept, 'python', panel, 'active');

      const expectedCost = Math.ceil(result.content.length / 4);
      expect(result.tokenCost).toBe(expectedCost);
    });

    it('is consistent across all depth levels', () => {
      const concept = makeConcept();
      const depths: RenderDepth[] = ['summary', 'active', 'deep'];

      for (const depth of depths) {
        const result = renderer.render(concept, 'python', panel, depth);
        expect(result.tokenCost).toBe(Math.ceil(result.content.length / 4));
      }
    });
  });

  describe('cross-references', () => {
    it('extracts targetIds from cross-reference relationships', () => {
      const concept = makeConcept({
        relationships: [
          { type: 'cross-reference', targetId: 'physics-calc', description: 'Applied in physics' },
          { type: 'cross-reference', targetId: 'econ-growth', description: 'Economics application' },
          { type: 'dependency', targetId: 'algebra', description: 'Requires algebra' },
        ],
      });
      const result = renderer.render(concept, 'python', panel, 'active');

      expect(result.crossReferences).toBeDefined();
      expect(result.crossReferences).toContain('physics-calc');
      expect(result.crossReferences).toContain('econ-growth');
      expect(result.crossReferences).not.toContain('algebra');
    });

    it('returns undefined crossReferences when no cross-reference relationships', () => {
      const concept = makeConcept({
        relationships: [
          { type: 'dependency', targetId: 'prereq', description: 'Prerequisite' },
        ],
      });
      const result = renderer.render(concept, 'python', panel, 'active');

      expect(result.crossReferences).toBeUndefined();
    });
  });
});
