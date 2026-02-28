import { describe, it, expect, beforeEach } from 'vitest';
import {
  ProofComposer,
  ProofChain,
  ProofStep,
  ProofError,
} from './proof-composer.js';
import type {
  MathematicalPrimitive,
  CompositionPath,
  CompositionStep,
  CompositionType,
  DomainId,
} from '../../core/types/mfe-types.js';

// --- Test Primitive Factory ---

function makePrimitive(
  overrides: Partial<MathematicalPrimitive> & { id: string; domain: DomainId },
): MathematicalPrimitive {
  return {
    name: overrides.id
      .replace(/^[a-z]+-/, '')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase()),
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

  map.set(
    'perception-natural-numbers',
    makePrimitive({
      id: 'perception-natural-numbers',
      name: 'Natural Numbers',
      domain: 'perception',
      type: 'axiom',
      formalStatement:
        'The natural numbers N = {1, 2, 3, ...} satisfy the Peano axioms',
      computationalForm: 'N = {1, 2, 3, ...}',
    }),
  );

  map.set(
    'perception-integers',
    makePrimitive({
      id: 'perception-integers',
      name: 'Integers',
      domain: 'perception',
      type: 'definition',
      formalStatement:
        'The integers Z = {..., -2, -1, 0, 1, 2, ...} extend N with additive inverses',
      computationalForm: 'Z = {..., -2, -1, 0, 1, 2, ...}',
    }),
  );

  map.set(
    'perception-rational-numbers',
    makePrimitive({
      id: 'perception-rational-numbers',
      name: 'Rational Numbers',
      domain: 'perception',
      type: 'definition',
      formalStatement:
        'The rational numbers Q = {p/q : p,q in Z, q != 0} form an ordered field',
      computationalForm: 'Q = {p/q : p,q in Z, q != 0}',
    }),
  );

  map.set(
    'perception-irrational-numbers',
    makePrimitive({
      id: 'perception-irrational-numbers',
      name: 'Irrational Numbers',
      domain: 'perception',
      type: 'definition',
      formalStatement:
        'Irrational numbers are real numbers that cannot be expressed as p/q',
      computationalForm: 'R \\ Q',
    }),
  );

  map.set(
    'perception-sine-function',
    makePrimitive({
      id: 'perception-sine-function',
      name: 'Sine Function',
      domain: 'perception',
      type: 'definition',
      formalStatement:
        'The sine function sin: R -> [-1,1] maps angles to vertical projections on the unit circle',
      computationalForm: 'sin(x) = sum_{n=0}^inf (-1)^n x^{2n+1} / (2n+1)!',
    }),
  );

  map.set(
    'waves-simple-harmonic-motion',
    makePrimitive({
      id: 'waves-simple-harmonic-motion',
      name: 'Simple Harmonic Motion',
      domain: 'waves',
      type: 'theorem',
      formalStatement:
        'Simple harmonic motion is described by x(t) = A sin(wt + phi)',
      computationalForm: 'x(t) = A sin(wt + phi)',
    }),
  );

  map.set(
    'perception-unit-circle',
    makePrimitive({
      id: 'perception-unit-circle',
      name: 'Unit Circle',
      domain: 'perception',
      type: 'definition',
      formalStatement:
        'The unit circle is the set of points (x,y) where x^2 + y^2 = 1',
      computationalForm: '{(x,y) : x^2 + y^2 = 1}',
    }),
  );

  return map;
}

// --- Helper: build a CompositionPath ---

function makeSequentialPath(): CompositionPath {
  return {
    steps: [
      {
        stepNumber: 1,
        primitive: 'perception-natural-numbers',
        action: 'Establish Natural Numbers',
        justification:
          'By Natural Numbers (perception-natural-numbers): The natural numbers N = {1, 2, 3, ...} satisfy the Peano axioms',
        inputType: 'none',
        outputType: 'N = {1, 2, 3, ...}',
        verificationStatus: 'skipped',
      },
      {
        stepNumber: 2,
        primitive: 'perception-integers',
        action: 'Compose with Integers',
        justification:
          'By Integers (perception-integers): The integers Z = {..., -2, -1, 0, 1, 2, ...} extend N with additive inverses',
        inputType: 'N = {1, 2, 3, ...}',
        outputType: 'Complete additive group with identity and inverses',
        verificationStatus: 'skipped',
      },
    ],
    totalCost: 1.0,
    domainsSpanned: ['perception'],
    verified: false,
  };
}

function makeParallelPath(): CompositionPath {
  return {
    steps: [
      {
        stepNumber: 1,
        primitive: 'perception-rational-numbers',
        action: 'Establish Rational Numbers',
        justification:
          'By Rational Numbers (perception-rational-numbers): The rational numbers Q form an ordered field',
        inputType: 'none',
        outputType: 'Q = {p/q : p,q in Z, q != 0}',
        verificationStatus: 'skipped',
      },
      {
        stepNumber: 2,
        primitive: 'perception-irrational-numbers',
        action: 'Combine in parallel with Irrational Numbers',
        justification:
          'By Irrational Numbers (perception-irrational-numbers): Irrational numbers are real numbers that cannot be expressed as p/q',
        inputType: 'Q = {p/q : p,q in Z, q != 0}',
        outputType: 'The complete real number line without gaps',
        verificationStatus: 'skipped',
      },
    ],
    totalCost: 1.0,
    domainsSpanned: ['perception'],
    verified: false,
  };
}

function makeNestedPath(): CompositionPath {
  return {
    steps: [
      {
        stepNumber: 1,
        primitive: 'perception-unit-circle',
        action: 'Establish Unit Circle',
        justification:
          'By Unit Circle (perception-unit-circle): The unit circle is the set of points (x,y) where x^2 + y^2 = 1',
        inputType: 'none',
        outputType: '{(x,y) : x^2 + y^2 = 1}',
        verificationStatus: 'skipped',
      },
      {
        stepNumber: 2,
        primitive: 'perception-sine-function',
        action: 'Nest into Sine Function',
        justification:
          'By Sine Function (perception-sine-function): The sine function maps angles to vertical projections on the unit circle',
        inputType: '{(x,y) : x^2 + y^2 = 1}',
        outputType: 'Sine values mapped on the unit circle',
        verificationStatus: 'skipped',
      },
    ],
    totalCost: 1.0,
    domainsSpanned: ['perception'],
    verified: false,
  };
}

function makeMultiStepPath(): CompositionPath {
  return {
    steps: [
      {
        stepNumber: 1,
        primitive: 'perception-natural-numbers',
        action: 'Establish Natural Numbers',
        justification:
          'By Natural Numbers (perception-natural-numbers): The natural numbers satisfy the Peano axioms',
        inputType: 'none',
        outputType: 'N = {1, 2, 3, ...}',
        verificationStatus: 'skipped',
      },
      {
        stepNumber: 2,
        primitive: 'perception-integers',
        action: 'Compose with Integers',
        justification:
          'By Integers (perception-integers): The integers extend N with additive inverses',
        inputType: 'N = {1, 2, 3, ...}',
        outputType: 'Complete additive group',
        verificationStatus: 'skipped',
      },
      {
        stepNumber: 3,
        primitive: 'perception-rational-numbers',
        action: 'Compose with Rational Numbers',
        justification:
          'By Rational Numbers (perception-rational-numbers): The rational numbers form an ordered field',
        inputType: 'Complete additive group',
        outputType: 'Field of fractions with multiplicative inverses',
        verificationStatus: 'skipped',
      },
    ],
    totalCost: 2.0,
    domainsSpanned: ['perception'],
    verified: false,
  };
}

function makeCrossDomainPath(): CompositionPath {
  return {
    steps: [
      {
        stepNumber: 1,
        primitive: 'perception-sine-function',
        action: 'Establish Sine Function',
        justification:
          'By Sine Function (perception-sine-function): The sine function maps angles to vertical projections',
        inputType: 'none',
        outputType: 'sin(x) = sum_{n=0}^inf (-1)^n x^{2n+1} / (2n+1)!',
        verificationStatus: 'skipped',
      },
      {
        stepNumber: 2,
        primitive: 'waves-simple-harmonic-motion',
        action: 'Compose with Simple Harmonic Motion',
        justification:
          'By Simple Harmonic Motion (waves-simple-harmonic-motion): Simple harmonic motion is described by x(t) = A sin(wt + phi)',
        inputType: 'sin(x) = sum_{n=0}^inf (-1)^n x^{2n+1} / (2n+1)!',
        outputType: 'Complete oscillatory model with amplitude and phase',
        verificationStatus: 'skipped',
      },
    ],
    totalCost: 2.0,
    domainsSpanned: ['perception', 'waves'],
    verified: false,
  };
}

// --- Tests ---

describe('ProofComposer', () => {
  let primitives: Map<string, MathematicalPrimitive>;
  let composer: ProofComposer;

  beforeEach(() => {
    primitives = buildTestPrimitives();
    composer = new ProofComposer(primitives);
  });

  describe('sequential proof formatting', () => {
    it('formats a sequential 2-step path as linear proof steps', () => {
      const path = makeSequentialPath();
      const result = composer.composeProof(path, 'Extend naturals to integers');

      expect('code' in result).toBe(false);
      const chain = result as ProofChain;
      expect(chain.title).toBe('Extend naturals to integers');
      expect(chain.steps.length).toBe(2);
      expect(chain.steps[0].stepNumber).toBe(1);
      expect(chain.steps[1].stepNumber).toBe(2);
      // First step establishes, no composition type
      expect(chain.steps[0].compositionType).toBeNull();
      // Second step is sequential composition
      expect(chain.steps[1].compositionType).toBe('sequential');
    });
  });

  describe('parallel proof formatting', () => {
    it('shows branch labels for parallel composition', () => {
      const path = makeParallelPath();
      const result = composer.composeProof(path, 'Complete the number line');

      expect('code' in result).toBe(false);
      const chain = result as ProofChain;
      expect(chain.steps.length).toBeGreaterThanOrEqual(2);
      // Should have branch labels
      const branchSteps = chain.steps.filter((s) => s.branchLabel);
      expect(branchSteps.length).toBeGreaterThanOrEqual(2);
      // Should include Branch A, Branch B labels
      const labels = branchSteps.map((s) => s.branchLabel);
      expect(labels.some((l) => l?.includes('Branch A'))).toBe(true);
      expect(
        labels.some((l) => l?.includes('Branch B') || l?.includes('Merge')),
      ).toBe(true);
    });
  });

  describe('nested proof formatting', () => {
    it('shows inner/outer labels for nested composition', () => {
      const path = makeNestedPath();
      const result = composer.composeProof(
        path,
        'Map sine on unit circle',
      );

      expect('code' in result).toBe(false);
      const chain = result as ProofChain;
      expect(chain.steps.length).toBeGreaterThanOrEqual(2);
      // Should contain nested composition type
      const nestedSteps = chain.steps.filter(
        (s) => s.compositionType === 'nested',
      );
      expect(nestedSteps.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('multi-step chain', () => {
    it('formats 3+ step chain with sequential numbering', () => {
      const path = makeMultiStepPath();
      const result = composer.composeProof(
        path,
        'Build rational numbers from counting',
      );

      expect('code' in result).toBe(false);
      const chain = result as ProofChain;
      expect(chain.steps.length).toBe(3);
      // Each step cites a different primitive
      const uniquePrimitives = new Set(chain.steps.map((s) => s.primitiveId));
      expect(uniquePrimitives.size).toBe(3);
      // Step numbers are 1, 2, 3
      expect(chain.steps.map((s) => s.stepNumber)).toEqual([1, 2, 3]);
    });
  });

  describe('cross-domain proof', () => {
    it('spans perception and waves domains', () => {
      const path = makeCrossDomainPath();
      const result = composer.composeProof(
        path,
        'Model oscillatory motion with sine',
      );

      expect('code' in result).toBe(false);
      const chain = result as ProofChain;
      expect(chain.domainsSpanned).toContain('perception');
      expect(chain.domainsSpanned).toContain('waves');
      // Primitives from both domains
      expect(
        chain.steps.some((s) => s.primitiveId === 'perception-sine-function'),
      ).toBe(true);
      expect(
        chain.steps.some(
          (s) => s.primitiveId === 'waves-simple-harmonic-motion',
        ),
      ).toBe(true);
    });
  });

  describe('justification includes formal statement', () => {
    it('each step justification contains primitive formal statement', () => {
      const path = makeSequentialPath();
      const result = composer.composeProof(path);

      expect('code' in result).toBe(false);
      const chain = result as ProofChain;
      for (const step of chain.steps) {
        // Justification should contain the primitive's formal statement
        const prim = primitives.get(step.primitiveId);
        expect(prim).toBeDefined();
        expect(step.justification).toContain(prim!.formalStatement.slice(0, 50));
      }
    });
  });

  describe('intermediate results present', () => {
    it('each step has a non-empty intermediate result', () => {
      const path = makeMultiStepPath();
      const result = composer.composeProof(path);

      expect('code' in result).toBe(false);
      const chain = result as ProofChain;
      for (const step of chain.steps) {
        expect(step.intermediateResult).toBeTruthy();
        expect(step.intermediateResult.length).toBeGreaterThan(0);
      }
    });
  });

  describe('error: empty path', () => {
    it('returns EMPTY_PATH error for path with no steps', () => {
      const emptyPath: CompositionPath = {
        steps: [],
        totalCost: 0,
        domainsSpanned: [],
        verified: false,
      };

      const result = composer.composeProof(emptyPath);
      expect('code' in result).toBe(true);
      const error = result as ProofError;
      expect(error.code).toBe('EMPTY_PATH');
    });
  });

  describe('error: missing primitive', () => {
    it('returns MISSING_PRIMITIVE error when path references unknown primitive', () => {
      const badPath: CompositionPath = {
        steps: [
          {
            stepNumber: 1,
            primitive: 'nonexistent-primitive',
            action: 'Establish something',
            justification: 'By something',
            inputType: 'none',
            outputType: 'something',
            verificationStatus: 'skipped',
          },
        ],
        totalCost: 0,
        domainsSpanned: [],
        verified: false,
      };

      const result = composer.composeProof(badPath);
      expect('code' in result).toBe(true);
      const error = result as ProofError;
      expect(error.code).toBe('MISSING_PRIMITIVE');
      expect(error.message).toContain('nonexistent-primitive');
    });
  });

  describe('conclusion summarizes final result', () => {
    it('conclusion references the final step output', () => {
      const path = makeSequentialPath();
      const result = composer.composeProof(path);

      expect('code' in result).toBe(false);
      const chain = result as ProofChain;
      expect(chain.conclusion).toBeTruthy();
      // Conclusion should reference the last step's output
      const lastStep = chain.steps[chain.steps.length - 1];
      expect(chain.conclusion).toContain(lastStep.intermediateResult);
    });
  });

  describe('primitivesUsed lists all IDs', () => {
    it('tracks all primitive IDs used in the proof', () => {
      const path = makeMultiStepPath();
      const result = composer.composeProof(path);

      expect('code' in result).toBe(false);
      const chain = result as ProofChain;
      expect(chain.primitivesUsed).toContain('perception-natural-numbers');
      expect(chain.primitivesUsed).toContain('perception-integers');
      expect(chain.primitivesUsed).toContain('perception-rational-numbers');
      expect(chain.primitivesUsed.length).toBe(3);
    });
  });

  describe('compositionTypes tracks types used', () => {
    it('records all composition types in the proof chain', () => {
      // Use sequential path - should contain 'sequential'
      const path = makeSequentialPath();
      const result = composer.composeProof(path);

      expect('code' in result).toBe(false);
      const chain = result as ProofChain;
      expect(chain.compositionTypes).toContain('sequential');
    });

    it('cross-domain path tracks sequential type', () => {
      const path = makeCrossDomainPath();
      const result = composer.composeProof(path);

      expect('code' in result).toBe(false);
      const chain = result as ProofChain;
      expect(chain.compositionTypes.length).toBeGreaterThanOrEqual(1);
    });
  });
});
