// === Euclid's Test: Decompose-Compose Round Trip (SAFE-06) ===
//
// Named after Euclid's foundational principle: complex mathematics reduces to
// fundamental building blocks. This test proves that the MFE's decomposition
// engine can take a complex multi-domain problem (optimization of a
// multivariable function), decompose it to Domain I (Perception) primitives
// through intermediate domains, compose the primitives back into a verified
// solution, and produce a traceable proof chain.
//
// Scenario: 9 hand-crafted primitives spanning:
//   Domain I   (Perception): real numbers, euclidean distance, pythagorean theorem
//   Domain III (Change):     derivative, partial derivative, gradient, optimization
//   Domain IV  (Structure):  vector, hessian matrix
//
// Composition chain: real-numbers -> derivative -> partial-derivative ->
//   gradient -> optimization -> hessian-matrix (5 rules, 6 steps, 3 domains)

import { describe, it, expect } from 'vitest';

import { makePrimitive } from './mfe-helpers.js';
import type {
  MathematicalPrimitive,
  DomainId,
  CompositionPath,
} from '../../src/core/types/mfe-types.js';
import type { DependencyGraphPort } from '../../src/packs/engines/composition-engine.js';
import type { PropertyLookups } from '../../src/packs/engines/property-checkers.js';
import { CompositionEngine } from '../../src/packs/engines/composition-engine.js';
import { ProofComposer } from '../../src/packs/engines/proof-composer.js';
import type { ProofChain } from '../../src/packs/engines/proof-composer.js';
import { verifyCompositionPath } from '../../src/packs/engines/verification-engine.js';
import type { VerificationLookups } from '../../src/packs/engines/verification-engine.js';
import { checkAllProperties } from '../../src/packs/engines/property-checkers.js';

// === Euclid's Test Primitives ===

/**
 * Build the 9-primitive scenario described in the plan. Each primitive has
 * explicit field values for full control over the decomposition path.
 *
 * Composition rule `yields` must equal the target primitive's
 * `computationalForm` so the composition engine produces dimensionally
 * consistent paths (inputType of step N+1 === outputType of step N).
 */
function buildEuclidsPrimitives(): Map<string, MathematicalPrimitive> {
  const primitives = new Map<string, MathematicalPrimitive>();

  // --- Domain I: Perception (the foundation) ---

  // 1. Real numbers (axiom, no dependencies)
  primitives.set(
    'perception-real-numbers',
    makePrimitive({
      id: 'perception-real-numbers',
      name: 'Real Number Field',
      type: 'axiom',
      domain: 'perception',
      chapter: 1,
      section: '1.1',
      planePosition: { real: -0.2, imaginary: 0.2 },
      formalStatement: 'The real number field (R, +, *, <) is an ordered field',
      computationalForm: 'R',
      prerequisites: [],
      dependencies: [],
      enables: ['perception-euclidean-distance', 'change-derivative', 'structure-vector'],
      compositionRules: [
        {
          with: 'change-derivative',
          yields: 'lim_{h->0} (f(x+h) - f(x))/h',
          type: 'sequential',
          conditions: ['Real-valued function domain'],
          example: 'Function analysis on R',
        },
      ],
      applicabilityPatterns: ['number', 'real', 'field', 'arithmetic'],
      keywords: ['real', 'number', 'field', 'continuous'],
      tags: ['perception', 'foundation'],
      buildLabs: [],
    }),
  );

  // 2. Euclidean distance (definition, depends on real numbers)
  primitives.set(
    'perception-euclidean-distance',
    makePrimitive({
      id: 'perception-euclidean-distance',
      name: 'Euclidean Distance',
      type: 'definition',
      domain: 'perception',
      chapter: 1,
      section: '1.2',
      planePosition: { real: -0.18, imaginary: 0.22 },
      formalStatement: 'd(x,y) = sqrt(sum((xi-yi)^2))',
      computationalForm: 'sqrt(sum((xi-yi)^2))',
      prerequisites: ['Understanding of real numbers'],
      dependencies: [
        {
          target: 'perception-real-numbers',
          type: 'requires',
          strength: 1.0,
          description: 'Distance requires the real number field',
        },
      ],
      enables: ['perception-pythagorean-theorem'],
      compositionRules: [],
      applicabilityPatterns: ['distance', 'metric', 'euclidean'],
      keywords: ['distance', 'metric', 'euclidean', 'continuous'],
      tags: ['perception', 'geometry'],
      buildLabs: [],
    }),
  );

  // 3. Pythagorean theorem (theorem, depends on euclidean distance)
  primitives.set(
    'perception-pythagorean-theorem',
    makePrimitive({
      id: 'perception-pythagorean-theorem',
      name: 'Pythagorean Theorem',
      type: 'theorem',
      domain: 'perception',
      chapter: 2,
      section: '2.1',
      planePosition: { real: -0.16, imaginary: 0.24 },
      formalStatement: 'a^2 + b^2 = c^2 for right triangles',
      computationalForm: 'a^2 + b^2 = c^2',
      prerequisites: ['Understanding of euclidean distance'],
      dependencies: [
        {
          target: 'perception-euclidean-distance',
          type: 'requires',
          strength: 0.9,
          description: 'Pythagorean theorem is a special case of distance',
        },
      ],
      enables: [],
      compositionRules: [],
      applicabilityPatterns: ['right triangle', 'hypotenuse', 'pythagorean'],
      keywords: ['pythagorean', 'triangle', 'geometry'],
      tags: ['perception', 'geometry'],
      buildLabs: [],
    }),
  );

  // --- Domain III: Change (the tools) ---

  // 4. Derivative (definition, depends on real numbers)
  primitives.set(
    'change-derivative',
    makePrimitive({
      id: 'change-derivative',
      name: 'Derivative',
      type: 'definition',
      domain: 'change',
      chapter: 8,
      section: '8.1',
      planePosition: { real: 0.0, imaginary: -0.2 },
      formalStatement: "f'(x) = lim_{h->0} (f(x+h) - f(x))/h",
      computationalForm: 'lim_{h->0} (f(x+h) - f(x))/h',
      prerequisites: ['Understanding of real numbers'],
      dependencies: [
        {
          target: 'perception-real-numbers',
          type: 'requires',
          strength: 1.0,
          description: 'Derivative requires the real number field for limits',
        },
      ],
      enables: ['change-partial-derivative'],
      compositionRules: [
        {
          with: 'change-partial-derivative',
          yields: 'df/dxi',
          type: 'sequential',
          conditions: ['Multivariate extension'],
          example: 'Multivariate differentiation',
        },
      ],
      applicabilityPatterns: ['derivative', 'rate of change', 'slope'],
      keywords: ['derivative', 'limit', 'change', 'continuous'],
      tags: ['change', 'calculus'],
      buildLabs: [],
    }),
  );

  // 5. Partial derivative (definition, depends on derivative)
  primitives.set(
    'change-partial-derivative',
    makePrimitive({
      id: 'change-partial-derivative',
      name: 'Partial Derivative',
      type: 'definition',
      domain: 'change',
      chapter: 8,
      section: '8.2',
      planePosition: { real: 0.02, imaginary: -0.18 },
      formalStatement: 'df/dxi = lim_{h->0} (f(x+hei) - f(x))/h',
      computationalForm: 'df/dxi',
      prerequisites: ['Understanding of derivative'],
      dependencies: [
        {
          target: 'change-derivative',
          type: 'requires',
          strength: 1.0,
          description: 'Partial derivative extends the single-variable derivative',
        },
      ],
      enables: ['change-gradient', 'structure-hessian-matrix'],
      compositionRules: [
        {
          with: 'change-gradient',
          yields: 'grad(f) = (df/dx1, ..., df/dxn)',
          type: 'sequential',
          conditions: ['All partial derivatives collected'],
          example: 'Gradient field',
        },
      ],
      applicabilityPatterns: ['partial derivative', 'multivariate', 'directional'],
      keywords: ['partial', 'derivative', 'multivariate', 'continuous'],
      tags: ['change', 'calculus'],
      buildLabs: [],
    }),
  );

  // 6. Gradient (definition, depends on partial derivative)
  primitives.set(
    'change-gradient',
    makePrimitive({
      id: 'change-gradient',
      name: 'Gradient',
      type: 'definition',
      domain: 'change',
      chapter: 9,
      section: '9.1',
      planePosition: { real: 0.04, imaginary: -0.16 },
      formalStatement: 'grad(f) = (df/dx1, ..., df/dxn)',
      computationalForm: 'grad(f) = (df/dx1, ..., df/dxn)',
      prerequisites: ['Understanding of partial derivatives'],
      dependencies: [
        {
          target: 'change-partial-derivative',
          type: 'requires',
          strength: 1.0,
          description: 'Gradient is the vector of all partial derivatives',
        },
      ],
      enables: ['change-optimization'],
      compositionRules: [
        {
          with: 'change-optimization',
          yields: 'grad(f) = 0',
          type: 'sequential',
          conditions: ['Optimization context'],
          example: 'Critical point analysis',
        },
      ],
      applicabilityPatterns: ['gradient', 'direction', 'steepest'],
      keywords: ['gradient', 'vector', 'direction', 'continuous'],
      tags: ['change', 'calculus'],
      buildLabs: [],
    }),
  );

  // 7. Optimization (technique, depends on gradient)
  primitives.set(
    'change-optimization',
    makePrimitive({
      id: 'change-optimization',
      name: 'Optimization',
      type: 'technique',
      domain: 'change',
      chapter: 10,
      section: '10.1',
      planePosition: { real: 0.06, imaginary: -0.14 },
      formalStatement:
        'Set grad(f) = 0, solve for critical points, check second-order conditions',
      computationalForm: 'grad(f) = 0',
      prerequisites: ['Understanding of gradient'],
      dependencies: [
        {
          target: 'change-gradient',
          type: 'requires',
          strength: 1.0,
          description: 'Optimization requires gradient to find critical points',
        },
      ],
      enables: [],
      compositionRules: [
        {
          with: 'structure-hessian-matrix',
          yields: 'H(f)_ij = d^2f/(dxi dxj)',
          type: 'sequential',
          conditions: ['Second-order analysis needed'],
          example: 'Second-order optimization',
        },
      ],
      applicabilityPatterns: ['optimize', 'minimize', 'maximize', 'critical point'],
      keywords: ['optimization', 'critical', 'extremum'],
      tags: ['change', 'optimization'],
      buildLabs: [],
    }),
  );

  // --- Domain IV: Structure (the bridge) ---

  // 8. Vector (definition, depends on real numbers)
  primitives.set(
    'structure-vector',
    makePrimitive({
      id: 'structure-vector',
      name: 'Vector',
      type: 'definition',
      domain: 'structure',
      chapter: 11,
      section: '11.1',
      planePosition: { real: 0.2, imaginary: 0.4 },
      formalStatement: 'An element of R^n with component-wise operations',
      computationalForm: 'v in R^n',
      prerequisites: ['Understanding of real numbers'],
      dependencies: [
        {
          target: 'perception-real-numbers',
          type: 'requires',
          strength: 1.0,
          description: 'Vectors are built on the real number field',
        },
      ],
      enables: ['structure-hessian-matrix'],
      compositionRules: [
        {
          with: 'structure-hessian-matrix',
          yields: 'H(f)_ij = d^2f/(dxi dxj)',
          type: 'parallel',
          conditions: ['Both vector and matrix structures available'],
          example: 'Matrix-vector classification',
        },
      ],
      applicabilityPatterns: ['vector', 'component', 'direction'],
      keywords: ['vector', 'linear', 'component'],
      tags: ['structure', 'algebra'],
      buildLabs: [],
    }),
  );

  // 9. Hessian matrix (definition, depends on partial derivative + vector)
  primitives.set(
    'structure-hessian-matrix',
    makePrimitive({
      id: 'structure-hessian-matrix',
      name: 'Hessian Matrix',
      type: 'definition',
      domain: 'structure',
      chapter: 12,
      section: '12.1',
      planePosition: { real: 0.22, imaginary: 0.42 },
      formalStatement: 'H(f)_ij = d^2f/(dxi dxj)',
      computationalForm: 'H(f)_ij = d^2f/(dxi dxj)',
      prerequisites: ['Understanding of partial derivatives', 'Understanding of vectors'],
      dependencies: [
        {
          target: 'change-partial-derivative',
          type: 'requires',
          strength: 1.0,
          description: 'Hessian is a matrix of second partial derivatives',
        },
        {
          target: 'structure-vector',
          type: 'requires',
          strength: 0.9,
          description: 'Hessian operates on vector spaces',
        },
      ],
      enables: [],
      compositionRules: [],
      applicabilityPatterns: ['hessian', 'second derivative', 'curvature'],
      keywords: ['hessian', 'matrix', 'curvature'],
      tags: ['structure', 'algebra'],
      buildLabs: [],
    }),
  );

  return primitives;
}

/**
 * Build DependencyGraphPort for the Euclid's Test scenario.
 * - hasPath: true for any pair within the primitive set
 * - getTopologicalOrder: returns IDs in the order listed in the plan
 * - getPathCost: 1.0 for all pairs
 */
function buildEuclidsGraphPort(
  primitives: Map<string, MathematicalPrimitive>,
): DependencyGraphPort {
  // Canonical order matching the plan's listing order
  const canonicalOrder = [
    'perception-real-numbers',
    'perception-euclidean-distance',
    'perception-pythagorean-theorem',
    'change-derivative',
    'change-partial-derivative',
    'change-gradient',
    'change-optimization',
    'structure-vector',
    'structure-hessian-matrix',
  ];

  return {
    hasPath(from: string, to: string): boolean {
      return primitives.has(from) && primitives.has(to);
    },
    getTopologicalOrder(primitiveIds: string[]): string[] {
      return canonicalOrder.filter((id) => primitiveIds.includes(id));
    },
    getPathCost(_from: string, _to: string): number {
      return 1.0;
    },
  };
}

/**
 * Build VerificationLookups for Euclid's Test with explicit domain
 * compatibility: perception <-> change, perception <-> structure,
 * change <-> structure.
 */
function buildEuclidsVerificationLookups(
  primitives: Map<string, MathematicalPrimitive>,
): VerificationLookups {
  const domainCompatibility = new Map<DomainId, DomainId[]>([
    ['perception', ['change', 'structure']],
    ['change', ['perception', 'structure']],
    ['structure', ['perception', 'change']],
  ]);

  return {
    primitiveType(id: string) {
      return primitives.get(id)?.type;
    },
    primitiveDomain(id: string) {
      return primitives.get(id)?.domain;
    },
    domainCompatibility,
  };
}

/**
 * Build PropertyLookups for Euclid's Test.
 */
function buildEuclidsPropertyLookups(
  primitives: Map<string, MathematicalPrimitive>,
): PropertyLookups {
  return {
    primitiveKeywords(id: string): string[] {
      return primitives.get(id)?.keywords ?? [];
    },
    primitiveType(id: string) {
      return primitives.get(id)?.type;
    },
    compositionRules(id: string) {
      return primitives.get(id)?.compositionRules ?? [];
    },
  };
}

// === Shared scenario state ===
// Each test reconstructs what it needs from the same primitive set.

function composeFullScenario(): {
  primitives: Map<string, MathematicalPrimitive>;
  path: CompositionPath;
} {
  const primitives = buildEuclidsPrimitives();
  const graphPort = buildEuclidsGraphPort(primitives);
  const engine = new CompositionEngine(primitives, graphPort);

  const allIds = Array.from(primitives.keys());
  const result = engine.compose(allIds, 'optimization of multivariable function');

  if (!result.success) {
    throw new Error(
      `Euclid's Test scenario composition failed: ${result.errors.map((e) => e.message).join('; ')}`,
    );
  }

  return { primitives, path: result.path };
}

// ============================================================================
// Euclid's Test
// ============================================================================

describe("Euclid's Test", () => {
  // Test 1: Decomposition
  it('decomposes optimization problem to Domain I primitives', () => {
    const primitives = buildEuclidsPrimitives();
    const graphPort = buildEuclidsGraphPort(primitives);
    const engine = new CompositionEngine(primitives, graphPort);

    const allIds = Array.from(primitives.keys());
    const result = engine.compose(allIds, 'optimization of multivariable function');

    expect(result.success).toBe(true);
    if (!result.success) throw new Error('Expected composition success');

    const { path } = result;

    // Non-trivial chain: at least 3 steps
    expect(path.steps.length).toBeGreaterThanOrEqual(3);

    // Spans at least perception and change domains
    expect(path.domainsSpanned).toContain('perception');
    expect(path.domainsSpanned).toContain('change');
  });

  // Test 2: Verification
  it('composed path passes full verification', () => {
    const { primitives, path } = composeFullScenario();
    const lookups = buildEuclidsVerificationLookups(primitives);

    const result = verifyCompositionPath(path, lookups);

    expect(result.status).toBe('passed');
    expect(result.stepsChecked).toBe(path.steps.length);
    expect(result.failures).toHaveLength(0);
  });

  // Test 3: Proof chain traceability
  it('proof chain has traceable justifications', () => {
    const { primitives, path } = composeFullScenario();
    const composer = new ProofComposer(primitives);

    const result = composer.composeProof(
      path,
      "Euclid's Test: Multivariable Optimization",
    );

    // Must be a ProofChain, not a ProofError
    expect('steps' in result).toBe(true);
    const proof = result as ProofChain;

    // Every step has a non-empty justification
    for (const step of proof.steps) {
      expect(step.justification.length).toBeGreaterThan(0);
    }

    // Every justification cites a primitive ID in the (id) pattern
    for (const step of proof.steps) {
      const citesId = /\([a-z]+-[a-z]+-?[a-z]*\)/.test(step.justification);
      expect(citesId).toBe(true);
    }

    // primitivesUsed includes at least one perception-domain primitive
    const hasPerception = proof.primitivesUsed.some((id) =>
      id.startsWith('perception-'),
    );
    expect(hasPerception).toBe(true);

    // domainsSpanned includes at least 2 domains
    expect(proof.domainsSpanned.length).toBeGreaterThanOrEqual(2);
  });

  // Test 4: Property checks
  it('property checks produce meaningful results', () => {
    const { primitives, path } = composeFullScenario();
    const lookups = buildEuclidsPropertyLookups(primitives);

    const results = checkAllProperties(path, lookups);

    // 5 results: commutativity, associativity, linearity, continuity, convergence
    expect(results).toHaveLength(5);

    // No result has status 'error'
    for (const r of results) {
      expect(r.status).not.toBe('error');
    }

    // Every result analyzed at least 1 step
    for (const r of results) {
      expect(r.stepsAnalyzed).toBeGreaterThan(0);
    }
  });

  // Test 5: Capstone round trip — Domain I -> Domain III -> verified solution
  it('round trip: Domain I -> Domain III -> verified solution', () => {
    const primitives = buildEuclidsPrimitives();
    const graphPort = buildEuclidsGraphPort(primitives);
    const engine = new CompositionEngine(primitives, graphPort);

    // Compose with primitives that start in Domain I (perception-real-numbers)
    // and chain through to Domain III (change-optimization)
    const roundTripIds = [
      'perception-real-numbers',
      'change-derivative',
      'change-partial-derivative',
      'change-gradient',
      'change-optimization',
    ];

    const compResult = engine.compose(
      roundTripIds,
      'Domain I to Domain III round trip optimization',
    );

    // Composition succeeded
    expect(compResult.success).toBe(true);
    if (!compResult.success) throw new Error('Expected composition success');

    const { path } = compResult;

    // Verify the path
    const lookups = buildEuclidsVerificationLookups(primitives);
    const verResult = verifyCompositionPath(path, lookups);
    expect(verResult.status).toBe('passed');

    // Compose proof
    const proofComposer = new ProofComposer(primitives);
    const proof = proofComposer.composeProof(path, "Euclid's Round Trip");

    // Proof is a ProofChain (not an error)
    expect('steps' in proof).toBe(true);
    const proofChain = proof as ProofChain;

    // Proof has traceable steps
    expect(proofChain.steps.length).toBeGreaterThan(0);
    for (const step of proofChain.steps) {
      expect(step.justification.length).toBeGreaterThan(0);
    }

    // Domains spanned include both perception and change
    expect(path.domainsSpanned).toContain('perception');
    expect(path.domainsSpanned).toContain('change');

    // This IS Euclid's Test: complex math reduces to perception primitives
    // and the composition path rebuilds a verified solution
    expect(path.steps.length).toBeGreaterThanOrEqual(3);
    expect(verResult.failures).toHaveLength(0);
  });
});
