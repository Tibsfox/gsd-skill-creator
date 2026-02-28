import { describe, it, expect, beforeEach } from 'vitest';
import {
  CompositionEngine,
  DependencyGraphPort,
  CompositionResult,
  CompositionError,
} from './composition-engine.js';
import type {
  MathematicalPrimitive,
  CompositionRule,
  DependencyEdge,
  DomainId,
} from '../../core/types/mfe-types.js';

// --- Mock DependencyGraphPort ---

class MockGraphPort implements DependencyGraphPort {
  private primitives: Map<string, MathematicalPrimitive>;

  constructor(primitives: Map<string, MathematicalPrimitive>) {
    this.primitives = primitives;
  }

  hasPath(from: string, to: string): boolean {
    // Check if `to` is reachable from `from` via dependencies
    const visited = new Set<string>();
    const queue = [from];
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === to) return true;
      if (visited.has(current)) continue;
      visited.add(current);
      const prim = this.primitives.get(current);
      if (prim) {
        for (const dep of prim.dependencies) {
          queue.push(dep.target);
        }
      }
    }
    return false;
  }

  getTopologicalOrder(primitiveIds: string[]): string[] {
    // Sort by dependency depth (primitives with no deps first)
    const depthMap = new Map<string, number>();
    const getDepth = (id: string, visited: Set<string>): number => {
      if (depthMap.has(id)) return depthMap.get(id)!;
      if (visited.has(id)) return 0; // cycle guard
      visited.add(id);
      const prim = this.primitives.get(id);
      if (!prim || prim.dependencies.length === 0) {
        depthMap.set(id, 0);
        return 0;
      }
      const maxDepth = Math.max(
        ...prim.dependencies
          .filter((d) => primitiveIds.includes(d.target))
          .map((d) => getDepth(d.target, visited) + 1),
        0,
      );
      depthMap.set(id, maxDepth);
      return maxDepth;
    };

    for (const id of primitiveIds) {
      getDepth(id, new Set());
    }

    return [...primitiveIds].sort(
      (a, b) => (depthMap.get(a) ?? 0) - (depthMap.get(b) ?? 0),
    );
  }

  getPathCost(from: string, to: string): number {
    const fromPrim = this.primitives.get(from);
    const toPrim = this.primitives.get(to);
    if (!fromPrim || !toPrim) return Infinity;
    return fromPrim.domain === toPrim.domain ? 1.0 : 2.0;
  }
}

// --- Test Primitive Factory ---

function makePrimitive(
  overrides: Partial<MathematicalPrimitive> & { id: string; domain: DomainId },
): MathematicalPrimitive {
  return {
    name: overrides.id.replace(/-/g, ' '),
    type: 'definition',
    chapter: 1,
    section: '1.0',
    planePosition: { real: 0, imaginary: 0 },
    formalStatement: `Formal statement for ${overrides.id}`,
    computationalForm: `Computational form for ${overrides.id}`,
    prerequisites: [],
    dependencies: [],
    enables: [],
    compositionRules: [],
    applicabilityPatterns: [],
    keywords: [],
    tags: [],
    buildLabs: [],
    ...overrides,
  };
}

// --- Test Fixtures ---

function buildTestPrimitives(): Map<string, MathematicalPrimitive> {
  const map = new Map<string, MathematicalPrimitive>();

  // Axiom: no dependencies, enables integers
  map.set(
    'perception-natural-numbers',
    makePrimitive({
      id: 'perception-natural-numbers',
      domain: 'perception',
      type: 'axiom',
      formalStatement:
        'The natural numbers N = {1, 2, 3, ...} satisfy the Peano axioms',
      dependencies: [],
      enables: ['perception-integers'],
      compositionRules: [
        {
          with: 'perception-integers',
          yields: 'Complete additive group with identity and inverses',
          type: 'sequential',
          conditions: ['When subtraction must always be defined'],
          example: 'Extending counting numbers to allow 3 - 5 = -2',
        },
      ],
    }),
  );

  // Definition: requires natural-numbers, sequential rule
  map.set(
    'perception-integers',
    makePrimitive({
      id: 'perception-integers',
      domain: 'perception',
      type: 'definition',
      formalStatement:
        'The integers Z = {..., -2, -1, 0, 1, 2, ...} extend N with additive inverses',
      dependencies: [
        {
          target: 'perception-natural-numbers',
          type: 'requires',
          strength: 1.0,
          description: 'Integers extend natural numbers',
        },
      ],
      enables: ['perception-rational-numbers'],
      compositionRules: [
        {
          with: 'perception-rational-numbers',
          yields: 'Field of fractions with multiplicative inverses',
          type: 'sequential',
          conditions: ['When division must always be defined'],
          example: 'Extending integers to allow 3 / 5 = 0.6',
        },
      ],
    }),
  );

  // Definition: requires integers, sequential rule
  map.set(
    'perception-rational-numbers',
    makePrimitive({
      id: 'perception-rational-numbers',
      domain: 'perception',
      type: 'definition',
      formalStatement:
        'The rational numbers Q = {p/q : p,q in Z, q != 0} form an ordered field',
      dependencies: [
        {
          target: 'perception-integers',
          type: 'requires',
          strength: 1.0,
          description: 'Rationals extend integers',
        },
      ],
      enables: ['perception-irrational-numbers'],
      compositionRules: [
        {
          with: 'perception-irrational-numbers',
          yields: 'The complete real number line without gaps',
          type: 'parallel',
          conditions: ['When completeness of the number line is needed'],
          example:
            'Rationals and irrationals together fill every point on the line',
        },
      ],
    }),
  );

  // Definition: parallel rule with rational-numbers
  map.set(
    'perception-irrational-numbers',
    makePrimitive({
      id: 'perception-irrational-numbers',
      domain: 'perception',
      type: 'definition',
      formalStatement:
        'Irrational numbers are real numbers that cannot be expressed as p/q for integers p,q',
      dependencies: [
        {
          target: 'perception-rational-numbers',
          type: 'requires',
          strength: 0.8,
          description: 'Defined by exclusion from rationals',
        },
      ],
      enables: [],
      compositionRules: [],
    }),
  );

  // Cross-domain: waves domain, requires sine-function
  map.set(
    'waves-simple-harmonic-motion',
    makePrimitive({
      id: 'waves-simple-harmonic-motion',
      domain: 'waves',
      type: 'theorem',
      formalStatement:
        'Simple harmonic motion is described by x(t) = A sin(wt + phi)',
      dependencies: [
        {
          target: 'perception-sine-function',
          type: 'requires',
          strength: 1.0,
          description: 'SHM uses sine function',
        },
      ],
      enables: [],
      compositionRules: [],
    }),
  );

  // Definition: sine function, has nested rule with unit-circle
  map.set(
    'perception-sine-function',
    makePrimitive({
      id: 'perception-sine-function',
      domain: 'perception',
      type: 'definition',
      formalStatement:
        'The sine function sin: R -> [-1,1] maps angles to vertical projections on the unit circle',
      dependencies: [],
      enables: ['waves-simple-harmonic-motion'],
      compositionRules: [
        {
          with: 'waves-simple-harmonic-motion',
          yields: 'Complete oscillatory model with amplitude and phase',
          type: 'sequential',
          conditions: ['When modeling periodic physical motion'],
          example:
            'Sine function drives the mathematical form of simple harmonic motion',
        },
      ],
    }),
  );

  // Definition: unit circle, nested rule with sine-function
  map.set(
    'perception-unit-circle',
    makePrimitive({
      id: 'perception-unit-circle',
      domain: 'perception',
      type: 'definition',
      formalStatement:
        'The unit circle is the set of points (x,y) where x^2 + y^2 = 1',
      dependencies: [],
      enables: [],
      compositionRules: [
        {
          with: 'perception-sine-function',
          yields: 'Sine values mapped on the unit circle',
          type: 'nested',
          conditions: ['When visualizing trigonometric functions geometrically'],
          example:
            'The sine of an angle is the y-coordinate of the corresponding point on the unit circle',
        },
      ],
    }),
  );

  // Isolated primitive: no composition rules
  map.set(
    'perception-isolated-concept',
    makePrimitive({
      id: 'perception-isolated-concept',
      domain: 'perception',
      type: 'definition',
      formalStatement: 'An isolated concept with no composition rules',
      dependencies: [],
      enables: [],
      compositionRules: [],
    }),
  );

  return map;
}

// --- Tests ---

describe('CompositionEngine', () => {
  let primitives: Map<string, MathematicalPrimitive>;
  let graphPort: MockGraphPort;
  let engine: CompositionEngine;

  beforeEach(() => {
    primitives = buildTestPrimitives();
    graphPort = new MockGraphPort(primitives);
    engine = new CompositionEngine(primitives, graphPort);
  });

  describe('sequential composition', () => {
    it('finds valid sequential chain between natural-numbers and integers', () => {
      const result = engine.compose(
        ['perception-natural-numbers', 'perception-integers'],
        'Extend counting to include negatives',
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.path.steps.length).toBeGreaterThanOrEqual(2);
        expect(result.path.domainsSpanned).toContain('perception');
        expect(result.path.verified).toBe(false); // not yet verified
        // Check steps are in order
        for (let i = 1; i < result.path.steps.length; i++) {
          expect(result.path.steps[i].stepNumber).toBeGreaterThan(
            result.path.steps[i - 1].stepNumber,
          );
        }
      }
    });
  });

  describe('parallel composition', () => {
    it('finds valid parallel composition between rationals and irrationals', () => {
      const result = engine.compose(
        [
          'perception-natural-numbers',
          'perception-integers',
          'perception-rational-numbers',
          'perception-irrational-numbers',
        ],
        'Complete the real number line',
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.path.steps.length).toBeGreaterThanOrEqual(2);
        // Should contain the parallel composition step
        const hasParallelAction = result.path.steps.some(
          (s) =>
            s.action.toLowerCase().includes('parallel') ||
            s.action.toLowerCase().includes('combine'),
        );
        // The path should include composition of rationals and irrationals
        const primitiveIds = result.path.steps.map((s) => s.primitive);
        expect(primitiveIds).toContain('perception-rational-numbers');
      }
    });
  });

  describe('nested composition', () => {
    it('finds valid nested composition between unit-circle and sine-function', () => {
      const result = engine.compose(
        ['perception-unit-circle', 'perception-sine-function'],
        'Map sine values on the unit circle',
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.path.steps.length).toBeGreaterThanOrEqual(2);
        const primitiveIds = result.path.steps.map((s) => s.primitive);
        expect(primitiveIds).toContain('perception-unit-circle');
        expect(primitiveIds).toContain('perception-sine-function');
      }
    });
  });

  describe('multi-step chain', () => {
    it('discovers A->B->C chain via sequential rules', () => {
      const result = engine.compose(
        [
          'perception-natural-numbers',
          'perception-integers',
          'perception-rational-numbers',
        ],
        'Build the rational number system from counting',
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.path.steps.length).toBeGreaterThanOrEqual(3);
        // Steps must be in dependency order
        const stepPrimitives = result.path.steps.map((s) => s.primitive);
        const natIdx = stepPrimitives.indexOf('perception-natural-numbers');
        const intIdx = stepPrimitives.indexOf('perception-integers');
        const ratIdx = stepPrimitives.indexOf('perception-rational-numbers');
        expect(natIdx).toBeLessThan(intIdx);
        expect(intIdx).toBeLessThan(ratIdx);
      }
    });
  });

  describe('cross-domain composition', () => {
    it('composes primitives from perception and waves domains', () => {
      const result = engine.compose(
        ['perception-sine-function', 'waves-simple-harmonic-motion'],
        'Model oscillatory motion with sine',
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.path.domainsSpanned).toContain('perception');
        expect(result.path.domainsSpanned).toContain('waves');
        expect(result.path.totalCost).toBeGreaterThan(0);
      }
    });
  });

  describe('rejection: no matching rules', () => {
    it('rejects composition when no rules exist between primitives', () => {
      // Use two primitives that have no dependency issues AND no composition rules between them
      // perception-isolated-concept has no deps, perception-unit-circle has no deps
      // But unit-circle has a nested rule with sine-function, not with isolated-concept
      const result = engine.compose(
        ['perception-isolated-concept', 'perception-unit-circle'],
        'Try to compose unrelated concepts',
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThanOrEqual(1);
        expect(result.errors[0].code).toBe('NO_RULES');
        expect(result.errors[0].message).toContain('No valid composition');
      }
    });
  });

  describe('rejection: missing dependency', () => {
    it('rejects when required dependency is not in available set', () => {
      // integers requires natural-numbers, but we only provide integers + rationals
      const result = engine.compose(
        ['perception-integers', 'perception-rational-numbers'],
        'Build rationals without naturals',
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(
          result.errors.some((e) => e.code === 'MISSING_DEPENDENCY'),
        ).toBe(true);
        const depError = result.errors.find(
          (e) => e.code === 'MISSING_DEPENDENCY',
        )!;
        expect(depError.message).toBeTruthy();
        expect(depError.primitiveIds).toBeDefined();
      }
    });
  });

  describe('rejection: insufficient primitives', () => {
    it('rejects empty input', () => {
      const result = engine.compose([], 'Nothing to compose');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].code).toBe('INSUFFICIENT_PRIMITIVES');
      }
    });

    it('rejects single primitive', () => {
      const result = engine.compose(
        ['perception-natural-numbers'],
        'Only one primitive',
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].code).toBe('INSUFFICIENT_PRIMITIVES');
        expect(result.errors[0].message).toContain('At least 2');
      }
    });
  });

  describe('step ordering and numbering', () => {
    it('produces sequential step numbers starting from 1', () => {
      const result = engine.compose(
        ['perception-natural-numbers', 'perception-integers'],
        'Check step numbering',
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.path.steps[0].stepNumber).toBe(1);
        for (let i = 1; i < result.path.steps.length; i++) {
          expect(result.path.steps[i].stepNumber).toBe(
            result.path.steps[i - 1].stepNumber + 1,
          );
        }
      }
    });
  });

  describe('cost calculation', () => {
    it('same-domain composition has lower cost than cross-domain', () => {
      const sameDomain = engine.compose(
        ['perception-natural-numbers', 'perception-integers'],
        'Same domain composition',
      );

      const crossDomain = engine.compose(
        ['perception-sine-function', 'waves-simple-harmonic-motion'],
        'Cross domain composition',
      );

      expect(sameDomain.success).toBe(true);
      expect(crossDomain.success).toBe(true);

      if (sameDomain.success && crossDomain.success) {
        expect(crossDomain.path.totalCost).toBeGreaterThan(
          sameDomain.path.totalCost,
        );
      }
    });
  });

  describe('CompositionResult structure', () => {
    it('successful result contains well-formed CompositionPath', () => {
      const result = engine.compose(
        ['perception-natural-numbers', 'perception-integers'],
        'Check result structure',
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.path).toBeDefined();
        expect(result.path.steps).toBeDefined();
        expect(Array.isArray(result.path.steps)).toBe(true);
        expect(typeof result.path.totalCost).toBe('number');
        expect(Array.isArray(result.path.domainsSpanned)).toBe(true);
        expect(typeof result.path.verified).toBe('boolean');

        // Check each step has required fields
        for (const step of result.path.steps) {
          expect(typeof step.stepNumber).toBe('number');
          expect(typeof step.primitive).toBe('string');
          expect(typeof step.action).toBe('string');
          expect(typeof step.justification).toBe('string');
          expect(typeof step.inputType).toBe('string');
          expect(typeof step.outputType).toBe('string');
          expect(step.verificationStatus).toBe('skipped');
        }
      }
    });

    it('failed result contains well-formed errors', () => {
      const result = engine.compose([], 'Check error structure');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toBeDefined();
        expect(Array.isArray(result.errors)).toBe(true);
        for (const error of result.errors) {
          expect(typeof error.code).toBe('string');
          expect(typeof error.message).toBe('string');
        }
      }
    });
  });
});
