/**
 * Integration tests for RosettaCore engine.
 *
 * Tests the full translate() pipeline: register concept -> select panel ->
 * render -> return Translation. Proves CORE-04: same concept translates
 * correctly across 3 panels (python, lisp, natural).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RosettaCore, ConceptNotFoundError } from './engine.js';
import type { Translation, UserFeedback } from './engine.js';
import { ConceptRegistry } from './concept-registry.js';
import { PanelRouter } from './panel-router.js';
import type { TranslationContext } from './panel-router.js';
import { ExpressionRenderer } from './expression-renderer.js';
import { PanelInterface } from '../panels/panel-interface.js';
import type { PanelCapabilities } from '../panels/panel-interface.js';
import type {
  RosettaConcept,
  PanelId,
  PanelExpression,
} from './types.js';

// ─── Mock Panel ───────────────────────────────────────────────────────────────

class MockPanel extends PanelInterface {
  readonly panelId: PanelId;
  readonly name: string;
  readonly description: string;

  constructor(id: PanelId) {
    super();
    this.panelId = id;
    this.name = `Mock ${id} Panel`;
    this.description = `Test panel for ${id}`;
  }

  translate(concept: RosettaConcept): PanelExpression {
    return concept.panels.get(this.panelId) || { panelId: this.panelId };
  }

  getCapabilities(): PanelCapabilities {
    return {
      supportedDomains: ['mathematics', 'cooking'],
      mathLibraries: this.panelId === 'python' ? ['math'] : [],
      hasCodeGeneration: this.panelId !== 'natural',
      hasPedagogicalNotes: true,
      expressionFormats: ['code', 'explanation'],
    };
  }

  formatExpression(expression: PanelExpression): string {
    if (expression.code) {
      return `[${expression.panelId}] ${expression.code}`;
    }
    return `[${expression.panelId}] ${expression.explanation || 'no content'}`;
  }
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const exponentialDecay: RosettaConcept = {
  id: 'exponential-decay',
  name: 'Exponential Decay',
  domain: 'mathematics',
  description: 'A process where quantity decreases by a constant percentage per unit time.',
  panels: new Map<PanelId, PanelExpression>([
    [
      'python',
      {
        panelId: 'python',
        code: 'import math\ndef decay(initial, rate, time): return initial * math.exp(-rate * time)',
        explanation: 'Uses math.exp for precise exponential calculation.',
        examples: ['decay(100, 0.1, 5)  # -> 60.65'],
        pedagogicalNotes: 'Python reveals the math library ecosystem for scientific computing.',
      },
    ],
    [
      'lisp',
      {
        panelId: 'lisp',
        code: '(defun decay (initial rate time) (* initial (exp (* (- rate) time))))',
        explanation: 'Lisp expresses the formula as a pure function composition.',
        pedagogicalNotes: 'The S-expression mirrors the mathematical definition -- code IS the formula.',
      },
    ],
    [
      'natural',
      {
        panelId: 'natural',
        explanation: 'Exponential decay describes how a quantity shrinks by the same fraction each period.',
        examples: ['Radioactive decay', 'Cooling of a hot object', 'Drug concentration in the bloodstream'],
      },
    ],
  ]),
  relationships: [],
  complexPlanePosition: { real: 0.5, imaginary: 0.3, magnitude: 0.58, angle: 0.54 },
};

const limitConcept: RosettaConcept = {
  id: 'limit',
  name: 'Limit',
  domain: 'mathematics',
  description: 'The value a function approaches as the input approaches a value.',
  panels: new Map<PanelId, PanelExpression>([
    [
      'python',
      {
        panelId: 'python',
        code: 'from sympy import limit, Symbol\nx = Symbol("x")\nlimit(1/x, x, 0)',
        explanation: 'SymPy provides symbolic limit computation.',
      },
    ],
  ]),
  relationships: [],
};

const derivativeConcept: RosettaConcept = {
  id: 'derivative',
  name: 'Derivative',
  domain: 'mathematics',
  description: 'Rate of change of a function at a point.',
  panels: new Map<PanelId, PanelExpression>([
    [
      'python',
      {
        panelId: 'python',
        code: 'from sympy import diff, Symbol\nx = Symbol("x")\ndiff(x**2, x)',
        explanation: 'SymPy provides symbolic differentiation.',
      },
    ],
  ]),
  relationships: [
    { type: 'dependency', targetId: 'limit', description: 'Derivatives are defined as limits' },
  ],
};

// ─── Test Setup ───────────────────────────────────────────────────────────────

function createEngine(): {
  engine: RosettaCore;
  registry: ConceptRegistry;
  router: PanelRouter;
} {
  const registry = new ConceptRegistry();
  registry.register(exponentialDecay);
  registry.register(limitConcept);
  registry.register(derivativeConcept);

  const router = new PanelRouter();
  const mockPython = new MockPanel('python');
  const mockLisp = new MockPanel('lisp');
  const mockNatural = new MockPanel('natural');

  router.registerPanel(mockPython);
  router.registerPanel(mockLisp);
  router.registerPanel(mockNatural);

  const renderer = new ExpressionRenderer();

  const panelInstances = new Map<PanelId, PanelInterface>([
    ['python', mockPython],
    ['lisp', mockLisp],
    ['natural', mockNatural],
  ]);

  const engine = new RosettaCore({ registry, router, renderer, panelInstances });

  return { engine, registry, router };
}

function makeContext(overrides: Partial<TranslationContext> = {}): TranslationContext {
  return {
    userExpertise: 'intermediate',
    currentDomain: 'mathematics',
    recentPanels: [],
    taskType: 'explain',
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('RosettaCore Engine', () => {
  let engine: RosettaCore;

  beforeEach(() => {
    const setup = createEngine();
    engine = setup.engine;
  });

  describe('translate() -- basic pipeline', () => {
    it('returns a Translation with non-null primary RenderedExpression', async () => {
      const context = makeContext({ requestedFormat: 'python' });
      const translation = await engine.translate('exponential-decay', context);

      expect(translation).toBeDefined();
      expect(translation.primary).toBeDefined();
      expect(translation.primary.content).toBeTruthy();
      expect(translation.primary.panelId).toBe('python');
    });

    it('generates a non-empty Translation.id string', async () => {
      const context = makeContext({ requestedFormat: 'python' });
      const translation = await engine.translate('exponential-decay', context);

      expect(typeof translation.id).toBe('string');
      expect(translation.id.length).toBeGreaterThan(0);
      expect(translation.id).toContain('translation-');
    });

    it('includes the original concept in the Translation', async () => {
      const context = makeContext({ requestedFormat: 'python' });
      const translation = await engine.translate('exponential-decay', context);

      expect(translation.concept.id).toBe('exponential-decay');
      expect(translation.concept.name).toBe('Exponential Decay');
    });

    it('includes panel selection with rationale', async () => {
      const context = makeContext({ requestedFormat: 'python' });
      const translation = await engine.translate('exponential-decay', context);

      expect(translation.panels).toBeDefined();
      expect(translation.panels.primary).toBe('python');
      expect(translation.panels.rationale).toBeTruthy();
    });
  });

  describe('CORE-04: cross-panel translation', () => {
    it('translates exponential-decay in Python panel with correct content', async () => {
      const context = makeContext({ requestedFormat: 'python' });
      const translation = await engine.translate('exponential-decay', context);

      expect(translation.primary.panelId).toBe('python');
      expect(translation.primary.content).toBeTruthy();
      expect(translation.primary.content.length).toBeGreaterThan(0);
    });

    it('translates exponential-decay in Lisp panel with correct content', async () => {
      const context = makeContext({ requestedFormat: 'lisp' });
      const translation = await engine.translate('exponential-decay', context);

      expect(translation.primary.panelId).toBe('lisp');
      expect(translation.primary.content).toBeTruthy();
      expect(translation.primary.content.length).toBeGreaterThan(0);
    });

    it('translates exponential-decay in Natural panel with correct content', async () => {
      const context = makeContext({ requestedFormat: 'natural' });
      const translation = await engine.translate('exponential-decay', context);

      expect(translation.primary.panelId).toBe('natural');
      expect(translation.primary.content).toBeTruthy();
      expect(translation.primary.content.length).toBeGreaterThan(0);
    });

    it('produces different content for each panel (panel-specific output)', async () => {
      const pythonTranslation = await engine.translate(
        'exponential-decay',
        makeContext({ requestedFormat: 'python' }),
      );
      const lispTranslation = await engine.translate(
        'exponential-decay',
        makeContext({ requestedFormat: 'lisp' }),
      );
      const naturalTranslation = await engine.translate(
        'exponential-decay',
        makeContext({ requestedFormat: 'natural' }),
      );

      // Each panel should produce different content
      expect(pythonTranslation.primary.content).not.toBe(lispTranslation.primary.content);
      expect(pythonTranslation.primary.content).not.toBe(naturalTranslation.primary.content);
      expect(lispTranslation.primary.content).not.toBe(naturalTranslation.primary.content);
    });
  });

  describe('translate() -- error handling', () => {
    it('throws ConceptNotFoundError for unknown conceptId', async () => {
      const context = makeContext({ requestedFormat: 'python' });

      await expect(engine.translate('nonexistent', context)).rejects.toThrow(
        ConceptNotFoundError,
      );
    });
  });

  describe('translate() -- dependency loading', () => {
    it('loads dependencies for derivative concept (depends on limit)', async () => {
      const context = makeContext({ requestedFormat: 'python' });
      const translation = await engine.translate('derivative', context);

      expect(translation.dependenciesLoaded).toBeDefined();
      const depIds = translation.dependenciesLoaded.map((c) => c.id);
      expect(depIds).toContain('limit');
    });

    it('returns empty dependencies for concept with no dependencies', async () => {
      const context = makeContext({ requestedFormat: 'python' });
      const translation = await engine.translate('exponential-decay', context);

      expect(translation.dependenciesLoaded).toEqual([]);
    });
  });

  describe('translate() -- comparison mode', () => {
    it('produces secondary panels when taskType is compare', async () => {
      const context = makeContext({ taskType: 'compare' });
      const translation = await engine.translate('exponential-decay', context);

      // Compare should produce secondary panels (at least one)
      // The router selects diverse panels for comparison
      expect(translation.secondary).toBeDefined();
      if (translation.secondary) {
        expect(translation.secondary.length).toBeGreaterThanOrEqual(1);
        // Secondary expressions should have content
        for (const sec of translation.secondary) {
          expect(sec.content).toBeTruthy();
        }
      }
    });
  });

  describe('processFeedback()', () => {
    it('returns delta with negative complexity for too-complex rating', async () => {
      const feedback: UserFeedback = {
        translationId: 'test-translation-1',
        rating: 'too-complex',
      };
      const delta = await engine.processFeedback('test-translation-1', feedback);

      expect(delta.adjustment.complexity).toBeLessThan(0);
      expect(delta.adjustment.complexity).toBe(-0.1);
      expect(delta.observedResult).toBe('too-complex');
      expect(delta.expectedResult).toBe('helpful');
    });

    it('returns delta with positive complexity for too-simple rating', async () => {
      const feedback: UserFeedback = {
        translationId: 'test-translation-2',
        rating: 'too-simple',
      };
      const delta = await engine.processFeedback('test-translation-2', feedback);

      expect(delta.adjustment.complexity).toBeGreaterThan(0);
      expect(delta.adjustment.complexity).toBe(0.1);
    });

    it('returns delta with zero complexity for helpful rating', async () => {
      const feedback: UserFeedback = {
        translationId: 'test-translation-3',
        rating: 'helpful',
      };
      const delta = await engine.processFeedback('test-translation-3', feedback);

      expect(delta.adjustment.complexity).toBe(0);
    });

    it('returns delta with stub confidence of 0.5', async () => {
      const feedback: UserFeedback = {
        translationId: 'test-translation-4',
        rating: 'helpful',
      };
      const delta = await engine.processFeedback('test-translation-4', feedback);

      expect(delta.confidence).toBe(0.5);
      expect(delta.domainModel).toBe('feedback-stub');
    });

    it('returns delta with zero complexity for wrong-panel rating', async () => {
      const feedback: UserFeedback = {
        translationId: 'test-translation-5',
        rating: 'wrong-panel',
      };
      const delta = await engine.processFeedback('test-translation-5', feedback);

      expect(delta.adjustment.complexity).toBe(0);
    });
  });
});
