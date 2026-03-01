/**
 * Tests for ConceptRegistry -- CRUD, dependency resolution, search,
 * panel operations, and Complex Plane queries.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ConceptRegistry,
  ConceptNotFoundError,
  ConceptCircularDependencyError,
} from './concept-registry.js';
import type {
  RosettaConcept,
  PanelId,
  PanelExpression,
  ConceptRelationship,
  ComplexPosition,
} from './types.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeConcept(overrides: Partial<RosettaConcept> = {}): RosettaConcept {
  return {
    id: 'test-concept',
    name: 'Test Concept',
    domain: 'mathematics',
    description: 'A test concept for unit testing',
    panels: new Map<PanelId, PanelExpression>(),
    relationships: [],
    ...overrides,
  };
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const limitConcept = makeConcept({
  id: 'limit',
  name: 'Limit',
  domain: 'mathematics',
  description: 'The value a function approaches as the input approaches a value',
  panels: new Map<PanelId, PanelExpression>([
    ['python', { panelId: 'python', code: 'from sympy import limit', explanation: 'SymPy limits' }],
    ['lisp', { panelId: 'lisp', code: '(defun limit-fn ...)', explanation: 'Lisp limits' }],
  ]),
  complexPlanePosition: { real: 0.3, imaginary: 0.5, magnitude: 0.58, angle: 1.03 },
});

const derivativeConcept = makeConcept({
  id: 'derivative',
  name: 'Derivative',
  domain: 'mathematics',
  description: 'Rate of change of a function',
  panels: new Map<PanelId, PanelExpression>([
    ['python', { panelId: 'python', code: 'from sympy import diff', explanation: 'SymPy differentiation' }],
  ]),
  relationships: [
    { type: 'dependency', targetId: 'limit', description: 'Derivatives are defined via limits' },
  ],
});

const integralConcept = makeConcept({
  id: 'integral',
  name: 'Integral',
  domain: 'mathematics',
  description: 'Accumulation of quantities over a continuous range',
  relationships: [
    { type: 'dependency', targetId: 'derivative', description: 'Integrals reverse derivatives' },
    { type: 'analogy', targetId: 'cooling-curve', description: 'Integral under a cooling curve' },
  ],
});

const coolingCurveConcept = makeConcept({
  id: 'cooling-curve',
  name: 'Cooling Curve',
  domain: 'cooking',
  description: 'Temperature decrease over time during cooling',
  relationships: [
    { type: 'cross-reference', targetId: 'exponential-decay', description: 'Cooling follows exponential decay' },
  ],
});

const exponentialDecayConcept = makeConcept({
  id: 'exponential-decay',
  name: 'Exponential Decay',
  domain: 'mathematics',
  description: 'A quantity that decreases by a constant percentage per unit time',
  panels: new Map<PanelId, PanelExpression>([
    ['python', { panelId: 'python', code: 'math.exp(-rate * t)', explanation: 'Python decay' }],
    ['natural', { panelId: 'natural', explanation: 'Natural language decay description' }],
  ]),
  complexPlanePosition: { real: 0.5, imaginary: 0.3, magnitude: 0.58, angle: 0.54 },
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ConceptRegistry', () => {
  let registry: ConceptRegistry;

  beforeEach(() => {
    registry = new ConceptRegistry();
  });

  describe('register and retrieve', () => {
    it('stores a concept and retrieves it by ID with all fields intact', () => {
      registry.register(limitConcept);
      const retrieved = registry.get('limit');

      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe('limit');
      expect(retrieved!.name).toBe('Limit');
      expect(retrieved!.domain).toBe('mathematics');
      expect(retrieved!.description).toBe('The value a function approaches as the input approaches a value');
      expect(retrieved!.panels).toBeInstanceOf(Map);
      expect(retrieved!.panels.size).toBe(2);
      expect(retrieved!.complexPlanePosition).toBeDefined();
      expect(retrieved!.complexPlanePosition!.real).toBe(0.3);
    });

    it('throws when registering a duplicate ID', () => {
      registry.register(limitConcept);
      expect(() => registry.register(limitConcept)).toThrow(/already registered/);
    });

    it('returns undefined for unknown ID', () => {
      expect(registry.get('nonexistent')).toBeUndefined();
    });

    it('getAll returns all registered concepts', () => {
      registry.register(limitConcept);
      registry.register(derivativeConcept);
      const all = registry.getAll();
      expect(all).toHaveLength(2);
      expect(all.map((c) => c.id)).toContain('limit');
      expect(all.map((c) => c.id)).toContain('derivative');
    });
  });

  describe('search', () => {
    beforeEach(() => {
      registry.register(limitConcept);
      registry.register(derivativeConcept);
      registry.register(coolingCurveConcept);
      registry.register(exponentialDecayConcept);
    });

    it('finds concepts by name substring (case-insensitive)', () => {
      const results = registry.search('LIMIT');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('limit');
    });

    it('finds concepts by description substring', () => {
      const results = registry.search('rate of change');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('derivative');
    });

    it('filters by domain when provided', () => {
      const results = registry.search('curve', 'cooking');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('cooling-curve');
    });

    it('returns empty array when no match', () => {
      const results = registry.search('quantum');
      expect(results).toHaveLength(0);
    });
  });

  describe('dependency resolution', () => {
    it('resolves transitive chain (A->B->C returns [C, B])', () => {
      registry.register(limitConcept);
      registry.register(derivativeConcept);
      registry.register(integralConcept);

      const deps = registry.getDependencies('integral');
      const depIds = deps.map((c) => c.id);
      expect(depIds).toContain('limit');
      expect(depIds).toContain('derivative');
      expect(deps).toHaveLength(2);
    });

    it('detects circular dependency and throws ConceptCircularDependencyError', () => {
      const conceptA = makeConcept({
        id: 'A',
        relationships: [{ type: 'dependency', targetId: 'B', description: 'A depends on B' }],
      });
      const conceptB = makeConcept({
        id: 'B',
        relationships: [{ type: 'dependency', targetId: 'A', description: 'B depends on A' }],
      });

      registry.register(conceptA);
      registry.register(conceptB);

      expect(() => registry.getDependencies('A')).toThrow(ConceptCircularDependencyError);
    });

    it('throws ConceptNotFoundError for unknown concept', () => {
      expect(() => registry.getDependencies('nonexistent')).toThrow(ConceptNotFoundError);
    });

    it('returns empty array when concept has no dependencies', () => {
      registry.register(limitConcept);
      const deps = registry.getDependencies('limit');
      expect(deps).toHaveLength(0);
    });
  });

  describe('relationship navigation', () => {
    beforeEach(() => {
      registry.register(limitConcept);
      registry.register(derivativeConcept);
      registry.register(integralConcept);
      registry.register(coolingCurveConcept);
      registry.register(exponentialDecayConcept);
    });

    it('getAnalogies returns concepts in target domain via analogy relationships', () => {
      const analogies = registry.getAnalogies('integral', 'cooking');
      expect(analogies).toHaveLength(1);
      expect(analogies[0].id).toBe('cooling-curve');
    });

    it('getAnalogies returns empty when no analogies in target domain', () => {
      const analogies = registry.getAnalogies('integral', 'physics');
      expect(analogies).toHaveLength(0);
    });

    it('getCrossReferences returns cross-reference relationships', () => {
      const crossRefs = registry.getCrossReferences('cooling-curve');
      expect(crossRefs).toHaveLength(1);
      expect(crossRefs[0].fromId).toBe('cooling-curve');
      expect(crossRefs[0].toId).toBe('exponential-decay');
      expect(crossRefs[0].description).toBe('Cooling follows exponential decay');
    });

    it('getCrossReferences returns empty when no cross-references', () => {
      const crossRefs = registry.getCrossReferences('limit');
      expect(crossRefs).toHaveLength(0);
    });
  });

  describe('panel operations', () => {
    beforeEach(() => {
      registry.register(limitConcept);
      registry.register(exponentialDecayConcept);
    });

    it('getPanelExpression returns expression for registered panel', () => {
      const expr = registry.getPanelExpression('limit', 'python');
      expect(expr).toBeDefined();
      expect(expr!.panelId).toBe('python');
      expect(expr!.code).toContain('sympy');
    });

    it('getPanelExpression returns undefined for unregistered panel', () => {
      const expr = registry.getPanelExpression('limit', 'fortran');
      expect(expr).toBeUndefined();
    });

    it('getPanelExpression returns undefined for unknown concept', () => {
      const expr = registry.getPanelExpression('nonexistent', 'python');
      expect(expr).toBeUndefined();
    });

    it('getAvailablePanels returns correct set of PanelIds', () => {
      const panels = registry.getAvailablePanels('limit');
      expect(panels).toContain('python');
      expect(panels).toContain('lisp');
      expect(panels).toHaveLength(2);
    });

    it('getAvailablePanels returns empty for unknown concept', () => {
      const panels = registry.getAvailablePanels('nonexistent');
      expect(panels).toHaveLength(0);
    });
  });

  describe('Complex Plane queries', () => {
    beforeEach(() => {
      registry.register(limitConcept);
      registry.register(derivativeConcept); // no position
      registry.register(exponentialDecayConcept);
    });

    it('getByPosition returns concepts within tolerance radius at given theta', () => {
      // limitConcept: angle=1.03, magnitude=0.58
      const results = registry.getByPosition(1.0, 0.6, 0.1);
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('limit');
    });

    it('getByPosition skips concepts without complexPlanePosition', () => {
      // derivative has no position
      const results = registry.getByPosition(0, 0, 100);
      const ids = results.map((c) => c.id);
      expect(ids).not.toContain('derivative');
    });

    it('getByPosition returns empty when no concepts match', () => {
      const results = registry.getByPosition(3.14, 10, 0.01);
      expect(results).toHaveLength(0);
    });

    it('getNearestConcepts returns N closest by Euclidean distance, sorted nearest-first', () => {
      const queryPosition: ComplexPosition = { real: 0.5, imaginary: 0.3, magnitude: 0.58, angle: 0.54 };
      const results = registry.getNearestConcepts(queryPosition, 2);

      expect(results).toHaveLength(2);
      // exponentialDecayConcept is at (0.5, 0.3) -- distance 0 from query
      expect(results[0].id).toBe('exponential-decay');
      // limitConcept is at (0.3, 0.5) -- distance > 0
      expect(results[1].id).toBe('limit');
    });

    it('getNearestConcepts respects count limit', () => {
      const queryPosition: ComplexPosition = { real: 0, imaginary: 0, magnitude: 0, angle: 0 };
      const results = registry.getNearestConcepts(queryPosition, 1);
      expect(results).toHaveLength(1);
    });

    it('getNearestConcepts skips concepts without position', () => {
      const queryPosition: ComplexPosition = { real: 0, imaginary: 0, magnitude: 0, angle: 0 };
      const results = registry.getNearestConcepts(queryPosition, 10);
      // Only 2 concepts have positions (limit and exponential-decay)
      expect(results).toHaveLength(2);
    });
  });
});
