import { describe, it, expect } from 'vitest';
import type { CompositionStep, CompositionPath, CompositionRule, PrimitiveType, DomainId } from '../core/types/mfe-types.js';
import {
  checkCommutativity,
  checkAssociativity,
  checkLinearity,
  checkContinuity,
  checkConvergence,
  checkProperty,
  checkAllProperties,
  createPropertyCheckerSuite,
  type PropertyLookups,
  type PropertyCheckResult,
} from './property-checkers.js';

// === Test Helpers ===

function makeStep(overrides: Partial<CompositionStep> & { stepNumber: number }): CompositionStep {
  return {
    primitive: `prim-${overrides.stepNumber}`,
    action: `action-${overrides.stepNumber}`,
    justification: `justification-${overrides.stepNumber}`,
    inputType: 'number',
    outputType: 'number',
    verificationStatus: 'skipped',
    ...overrides,
  };
}

function makePath(steps: CompositionStep[], overrides?: Partial<CompositionPath>): CompositionPath {
  return {
    steps,
    totalCost: steps.length * 2,
    domainsSpanned: ['perception'] as DomainId[],
    verified: false,
    ...overrides,
  };
}

function makeLookups(overrides?: Partial<PropertyLookups>): PropertyLookups {
  const keywordMap = new Map<string, string[]>([
    ['prim-1', ['linear', 'superposition']],
    ['prim-2', ['linear', 'homogeneous']],
    ['prim-3', ['nonlinear', 'chaotic']],
    ['prim-4', ['exponential', 'growth']],
    ['prim-5', ['continuous', 'smooth']],
    ['prim-6', ['discrete', 'combinatorial']],
  ]);

  const typeMap = new Map<string, PrimitiveType>([
    ['prim-1', 'theorem'],
    ['prim-2', 'algorithm'],
    ['prim-3', 'technique'],
    ['prim-4', 'definition'],
    ['prim-5', 'theorem'],
    ['prim-6', 'algorithm'],
  ]);

  const rulesMap = new Map<string, CompositionRule[]>([
    ['prim-1', [{
      with: 'prim-2',
      yields: 'composed-12',
      type: 'parallel',
      conditions: ['both linear'],
      example: 'parallel composition of linear transforms',
    }]],
    ['prim-2', [{
      with: 'prim-1',
      yields: 'composed-21',
      type: 'parallel',
      conditions: ['both linear'],
      example: 'parallel composition of linear transforms',
    }]],
    ['prim-3', [{
      with: 'prim-4',
      yields: 'composed-34',
      type: 'sequential',
      conditions: ['sequential dependency'],
      example: 'sequential composition',
    }]],
    ['prim-5', [{
      with: 'prim-6',
      yields: 'composed-56',
      type: 'nested',
      conditions: ['nesting allowed'],
      example: 'nested composition',
    }]],
  ]);

  return {
    primitiveKeywords: (id: string) => keywordMap.get(id) ?? [],
    primitiveType: (id: string) => typeMap.get(id),
    compositionRules: (id: string) => rulesMap.get(id) ?? [],
    ...overrides,
  };
}

// === 1. Commutativity Tests ===

describe('checkCommutativity', () => {
  const lookups = makeLookups();

  it('single step is trivially commutative', () => {
    const path = makePath([makeStep({ stepNumber: 1, primitive: 'prim-1' })]);
    const result = checkCommutativity(path, lookups);
    expect(result.property).toBe('commutativity');
    expect(result.status).toBe('holds');
    expect(result.evidence).toContain('trivial');
  });

  it('parallel steps that can be reordered pass', () => {
    // prim-1 and prim-2 have parallel composition rules
    const path = makePath([
      makeStep({ stepNumber: 1, primitive: 'prim-1', inputType: 'number', outputType: 'vector' }),
      makeStep({ stepNumber: 2, primitive: 'prim-2', inputType: 'number', outputType: 'matrix' }),
    ]);
    const result = checkCommutativity(path, lookups);
    expect(result.property).toBe('commutativity');
    expect(result.status).toBe('holds');
  });

  it('sequential dependencies violate commutativity', () => {
    // prim-3 and prim-4 have sequential composition rules
    const path = makePath([
      makeStep({ stepNumber: 1, primitive: 'prim-3', inputType: 'initial', outputType: 'intermediate' }),
      makeStep({ stepNumber: 2, primitive: 'prim-4', inputType: 'intermediate', outputType: 'final' }),
    ]);
    const result = checkCommutativity(path, lookups);
    expect(result.property).toBe('commutativity');
    expect(result.status).toBe('violated');
    expect(result.counterexample).toBeDefined();
  });
});

// === 2. Associativity Tests ===

describe('checkAssociativity', () => {
  const lookups = makeLookups();

  it('single step is trivially associative', () => {
    const path = makePath([makeStep({ stepNumber: 1, primitive: 'prim-1' })]);
    const result = checkAssociativity(path, lookups);
    expect(result.property).toBe('associativity');
    expect(result.status).toBe('holds');
  });

  it('two steps are trivially associative (no grouping possible)', () => {
    const path = makePath([
      makeStep({ stepNumber: 1, primitive: 'prim-1', inputType: 'a', outputType: 'b' }),
      makeStep({ stepNumber: 2, primitive: 'prim-2', inputType: 'b', outputType: 'c' }),
    ]);
    const result = checkAssociativity(path, lookups);
    expect(result.property).toBe('associativity');
    expect(result.status).toBe('holds');
  });

  it('three steps with consistent type chain are associative', () => {
    const path = makePath([
      makeStep({ stepNumber: 1, primitive: 'prim-1', inputType: 'a', outputType: 'b' }),
      makeStep({ stepNumber: 2, primitive: 'prim-2', inputType: 'b', outputType: 'c' }),
      makeStep({ stepNumber: 3, primitive: 'prim-5', inputType: 'c', outputType: 'd' }),
    ]);
    const result = checkAssociativity(path, lookups);
    expect(result.property).toBe('associativity');
    expect(result.status).toBe('holds');
  });

  it('non-associative regrouping with type mismatch is violated', () => {
    // Step 2 output changes type in a way that breaks regrouping
    const path = makePath([
      makeStep({ stepNumber: 1, primitive: 'prim-1', inputType: 'a', outputType: 'b' }),
      makeStep({ stepNumber: 2, primitive: 'prim-3', inputType: 'b', outputType: 'x' }),
      makeStep({ stepNumber: 3, primitive: 'prim-4', inputType: 'x', outputType: 'd' }),
    ]);
    // With nonlinear primitives (prim-3), regrouping may break
    const result = checkAssociativity(path, lookups);
    expect(result.property).toBe('associativity');
    // Either violated or indeterminate is acceptable for nonlinear chains
    expect(['violated', 'indeterminate']).toContain(result.status);
  });
});

// === 3. Linearity Tests ===

describe('checkLinearity', () => {
  const lookups = makeLookups();

  it('linear keywords indicate linearity holds', () => {
    const path = makePath([
      makeStep({ stepNumber: 1, primitive: 'prim-1' }), // keywords: linear, superposition
      makeStep({ stepNumber: 2, primitive: 'prim-2' }), // keywords: linear, homogeneous
    ]);
    const result = checkLinearity(path, lookups);
    expect(result.property).toBe('linearity');
    expect(result.status).toBe('holds');
  });

  it('nonlinear keywords indicate linearity violated', () => {
    const path = makePath([
      makeStep({ stepNumber: 1, primitive: 'prim-3' }), // keywords: nonlinear, chaotic
      makeStep({ stepNumber: 2, primitive: 'prim-4' }), // keywords: exponential, growth
    ]);
    const result = checkLinearity(path, lookups);
    expect(result.property).toBe('linearity');
    expect(result.status).toBe('violated');
    expect(result.counterexample).toBeDefined();
  });

  it('no lookups returns indeterminate', () => {
    const path = makePath([makeStep({ stepNumber: 1, primitive: 'prim-1' })]);
    const result = checkLinearity(path);
    expect(result.property).toBe('linearity');
    expect(result.status).toBe('indeterminate');
  });

  it('no keywords returns indeterminate', () => {
    const noKeywordLookups = makeLookups({
      primitiveKeywords: () => [],
    });
    const path = makePath([makeStep({ stepNumber: 1, primitive: 'prim-99' })]);
    const result = checkLinearity(path, noKeywordLookups);
    expect(result.property).toBe('linearity');
    expect(result.status).toBe('indeterminate');
  });
});

// === 4. Continuity Tests ===

describe('checkContinuity', () => {
  const lookups = makeLookups();

  it('continuous primitives indicate continuity holds', () => {
    const path = makePath([
      makeStep({ stepNumber: 1, primitive: 'prim-5' }), // keywords: continuous, smooth; type: theorem
    ]);
    const result = checkContinuity(path, lookups);
    expect(result.property).toBe('continuity');
    expect(result.status).toBe('holds');
  });

  it('discrete algorithm primitives indicate continuity violated', () => {
    const path = makePath([
      makeStep({ stepNumber: 1, primitive: 'prim-6' }), // keywords: discrete, combinatorial; type: algorithm
    ]);
    const result = checkContinuity(path, lookups);
    expect(result.property).toBe('continuity');
    expect(result.status).toBe('violated');
  });

  it('no lookups returns indeterminate', () => {
    const path = makePath([makeStep({ stepNumber: 1 })]);
    const result = checkContinuity(path);
    expect(result.property).toBe('continuity');
    expect(result.status).toBe('indeterminate');
  });
});

// === 5. Convergence Tests ===

describe('checkConvergence', () => {
  it('single step is trivially convergent', () => {
    const path = makePath([makeStep({ stepNumber: 1 })], { totalCost: 1 });
    const result = checkConvergence(path);
    expect(result.property).toBe('convergence');
    expect(result.status).toBe('holds');
  });

  it('two steps are trivially convergent', () => {
    const path = makePath([
      makeStep({ stepNumber: 1 }),
      makeStep({ stepNumber: 2 }),
    ], { totalCost: 2 });
    const result = checkConvergence(path);
    expect(result.property).toBe('convergence');
    expect(result.status).toBe('holds');
  });

  it('empty path is trivially convergent', () => {
    const path = makePath([], { totalCost: 0 });
    const result = checkConvergence(path);
    expect(result.property).toBe('convergence');
    expect(result.status).toBe('holds');
  });

  it('many steps with low average cost suggest convergence', () => {
    const steps = Array.from({ length: 5 }, (_, i) =>
      makeStep({ stepNumber: i + 1 }),
    );
    const path = makePath(steps, { totalCost: 3 }); // low cost per step
    const result = checkConvergence(path);
    expect(result.property).toBe('convergence');
    expect(result.status).toBe('holds');
  });

  it('many steps with high average cost suggest non-convergence', () => {
    const steps = Array.from({ length: 4 }, (_, i) =>
      makeStep({ stepNumber: i + 1 }),
    );
    const path = makePath(steps, { totalCost: 100 }); // high cost per step
    const result = checkConvergence(path);
    expect(result.property).toBe('convergence');
    expect(result.status).toBe('violated');
  });
});

// === 6. Generic Interface Tests ===

describe('checkProperty', () => {
  const lookups = makeLookups();

  it('dispatches to checkCommutativity', () => {
    const path = makePath([makeStep({ stepNumber: 1, primitive: 'prim-1' })]);
    const result = checkProperty('commutativity', path, lookups);
    expect(result.property).toBe('commutativity');
  });

  it('dispatches to checkAssociativity', () => {
    const path = makePath([makeStep({ stepNumber: 1, primitive: 'prim-1' })]);
    const result = checkProperty('associativity', path, lookups);
    expect(result.property).toBe('associativity');
  });

  it('dispatches to checkLinearity', () => {
    const path = makePath([makeStep({ stepNumber: 1, primitive: 'prim-1' })]);
    const result = checkProperty('linearity', path, lookups);
    expect(result.property).toBe('linearity');
  });

  it('dispatches to checkContinuity', () => {
    const path = makePath([makeStep({ stepNumber: 1, primitive: 'prim-1' })]);
    const result = checkProperty('continuity', path, lookups);
    expect(result.property).toBe('continuity');
  });

  it('dispatches to checkConvergence', () => {
    const path = makePath([makeStep({ stepNumber: 1 })], { totalCost: 1 });
    const result = checkProperty('convergence', path, lookups);
    expect(result.property).toBe('convergence');
  });

  it('unknown property name returns error status', () => {
    const path = makePath([makeStep({ stepNumber: 1 })]);
    const result = checkProperty('bogus-property', path, lookups);
    expect(result.status).toBe('error');
    expect(result.evidence).toContain('unknown');
  });
});

describe('checkAllProperties', () => {
  const lookups = makeLookups();

  it('returns exactly 5 results', () => {
    const path = makePath([makeStep({ stepNumber: 1, primitive: 'prim-1' })], { totalCost: 1 });
    const results = checkAllProperties(path, lookups);
    expect(results).toHaveLength(5);
  });

  it('returns one result per property', () => {
    const path = makePath([makeStep({ stepNumber: 1, primitive: 'prim-1' })], { totalCost: 1 });
    const results = checkAllProperties(path, lookups);
    const properties = results.map(r => r.property);
    expect(properties).toContain('commutativity');
    expect(properties).toContain('associativity');
    expect(properties).toContain('linearity');
    expect(properties).toContain('continuity');
    expect(properties).toContain('convergence');
  });

  it('each result has checkedAt timestamp', () => {
    const path = makePath([makeStep({ stepNumber: 1, primitive: 'prim-1' })], { totalCost: 1 });
    const results = checkAllProperties(path, lookups);
    for (const result of results) {
      expect(result.checkedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    }
  });
});

describe('createPropertyCheckerSuite', () => {
  const lookups = makeLookups();

  it('creates a suite with check and checkAll methods', () => {
    const suite = createPropertyCheckerSuite(lookups);
    expect(typeof suite.check).toBe('function');
    expect(typeof suite.checkAll).toBe('function');
  });

  it('suite.check delegates to checkProperty with bound lookups', () => {
    const suite = createPropertyCheckerSuite(lookups);
    const path = makePath([makeStep({ stepNumber: 1, primitive: 'prim-1' })]);
    const result = suite.check('commutativity', path);
    expect(result.property).toBe('commutativity');
  });

  it('suite.checkAll delegates to checkAllProperties with bound lookups', () => {
    const suite = createPropertyCheckerSuite(lookups);
    const path = makePath([makeStep({ stepNumber: 1, primitive: 'prim-1' })], { totalCost: 1 });
    const results = suite.checkAll(path);
    expect(results).toHaveLength(5);
  });
});
