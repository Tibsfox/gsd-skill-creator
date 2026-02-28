import { describe, it, expect } from 'vitest';
import type { CompositionStep, CompositionPath, PrimitiveType, DomainId } from '../core/types/mfe-types.js';
import {
  verifyDimensionalConsistency,
  verifyTypeCompatibility,
  verifyDomainValidity,
  verifyCompositionStep,
  verifyCompositionPath,
  createVerificationEngine,
  type VerificationLookups,
  type VerificationResult,
  type VerificationFailure,
} from './verification-engine.js';

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
    totalCost: steps.length,
    domainsSpanned: ['perception'] as DomainId[],
    verified: false,
    ...overrides,
  };
}

function makeLookups(overrides?: Partial<VerificationLookups>): VerificationLookups {
  const typeMap = new Map<string, PrimitiveType>([
    ['prim-1', 'theorem'],
    ['prim-2', 'algorithm'],
    ['prim-3', 'definition'],
    ['axiom-1', 'axiom'],
    ['identity-1', 'identity'],
    ['technique-1', 'technique'],
  ]);

  const domainMap = new Map<string, DomainId>([
    ['prim-1', 'perception'],
    ['prim-2', 'perception'],
    ['prim-3', 'waves'],
    ['axiom-1', 'foundations'],
    ['identity-1', 'structure'],
    ['technique-1', 'change'],
  ]);

  const compatibility = new Map<DomainId, DomainId[]>([
    ['perception', ['waves', 'change']],
    ['waves', ['perception', 'change', 'structure']],
    ['change', ['perception', 'waves']],
    ['structure', ['waves', 'reality', 'foundations']],
    ['reality', ['structure', 'foundations']],
    ['foundations', ['structure', 'reality', 'mapping']],
    ['mapping', ['foundations', 'unification']],
    ['unification', ['mapping', 'emergence']],
    ['emergence', ['unification', 'synthesis']],
    ['synthesis', ['emergence']],
  ]);

  return {
    primitiveType: (id: string) => typeMap.get(id),
    primitiveDomain: (id: string) => domainMap.get(id),
    domainCompatibility: compatibility,
    ...overrides,
  };
}

// === 1. Dimensional Consistency Tests ===

describe('verifyDimensionalConsistency', () => {
  it('returns empty array for empty steps (vacuously true)', () => {
    const failures = verifyDimensionalConsistency([]);
    expect(failures).toEqual([]);
  });

  it('returns empty array when all steps chain correctly', () => {
    const steps = [
      makeStep({ stepNumber: 1, inputType: 'initial', outputType: 'vector' }),
      makeStep({ stepNumber: 2, inputType: 'vector', outputType: 'matrix' }),
      makeStep({ stepNumber: 3, inputType: 'matrix', outputType: 'scalar' }),
    ];
    const failures = verifyDimensionalConsistency(steps);
    expect(failures).toEqual([]);
  });

  it('detects inputType/outputType mismatch between adjacent steps', () => {
    const steps = [
      makeStep({ stepNumber: 1, inputType: 'initial', outputType: 'vector' }),
      makeStep({ stepNumber: 2, inputType: 'scalar', outputType: 'matrix' }),
    ];
    const failures = verifyDimensionalConsistency(steps);
    expect(failures).toHaveLength(1);
    expect(failures[0].check).toBe('dimensional');
    expect(failures[0].stepNumber).toBe(2);
    expect(failures[0].expected).toBe('vector');
    expect(failures[0].found).toBe('scalar');
    expect(failures[0].message).toContain('dimensional');
  });

  it('allows first step with any inputType', () => {
    const steps = [
      makeStep({ stepNumber: 1, inputType: 'anything', outputType: 'vector' }),
    ];
    const failures = verifyDimensionalConsistency(steps);
    expect(failures).toEqual([]);
  });

  it('collects multiple dimensional failures', () => {
    const steps = [
      makeStep({ stepNumber: 1, inputType: 'initial', outputType: 'vector' }),
      makeStep({ stepNumber: 2, inputType: 'WRONG', outputType: 'matrix' }),
      makeStep({ stepNumber: 3, inputType: 'ALSO_WRONG', outputType: 'scalar' }),
    ];
    const failures = verifyDimensionalConsistency(steps);
    expect(failures).toHaveLength(2);
    expect(failures[0].stepNumber).toBe(2);
    expect(failures[1].stepNumber).toBe(3);
  });
});

// === 2. Type Compatibility Tests ===

describe('verifyTypeCompatibility', () => {
  it('returns empty array when all primitive types are valid', () => {
    const steps = [
      makeStep({ stepNumber: 1, primitive: 'prim-1' }), // theorem
      makeStep({ stepNumber: 2, primitive: 'prim-2' }), // algorithm
    ];
    const lookup = (id: string): PrimitiveType | undefined => {
      const m: Record<string, PrimitiveType> = { 'prim-1': 'theorem', 'prim-2': 'algorithm' };
      return m[id];
    };
    const failures = verifyTypeCompatibility(steps, lookup);
    expect(failures).toEqual([]);
  });

  it('axioms can only appear at step 1', () => {
    const steps = [
      makeStep({ stepNumber: 1, primitive: 'prim-1' }), // theorem
      makeStep({ stepNumber: 2, primitive: 'axiom-1' }), // axiom at step 2 => fail
    ];
    const lookup = (id: string): PrimitiveType | undefined => {
      const m: Record<string, PrimitiveType> = { 'prim-1': 'theorem', 'axiom-1': 'axiom' };
      return m[id];
    };
    const failures = verifyTypeCompatibility(steps, lookup);
    expect(failures).toHaveLength(1);
    expect(failures[0].check).toBe('type-compatibility');
    expect(failures[0].stepNumber).toBe(2);
    expect(failures[0].message).toContain('axiom');
  });

  it('axioms are valid at step 1', () => {
    const steps = [
      makeStep({ stepNumber: 1, primitive: 'axiom-1' }),
      makeStep({ stepNumber: 2, primitive: 'prim-1' }),
    ];
    const lookup = (id: string): PrimitiveType | undefined => {
      const m: Record<string, PrimitiveType> = { 'axiom-1': 'axiom', 'prim-1': 'theorem' };
      return m[id];
    };
    const failures = verifyTypeCompatibility(steps, lookup);
    expect(failures).toEqual([]);
  });

  it('unknown primitive IDs produce explicit failure', () => {
    const steps = [
      makeStep({ stepNumber: 1, primitive: 'unknown-id' }),
    ];
    const lookup = (_id: string): PrimitiveType | undefined => undefined;
    const failures = verifyTypeCompatibility(steps, lookup);
    expect(failures).toHaveLength(1);
    expect(failures[0].check).toBe('type-compatibility');
    expect(failures[0].message).toContain('unknown');
  });

  it('returns empty array for empty steps', () => {
    const failures = verifyTypeCompatibility([], () => undefined);
    expect(failures).toEqual([]);
  });
});

// === 3. Domain Validity Tests ===

describe('verifyDomainValidity', () => {
  const domainLookup = (id: string): DomainId | undefined => {
    const m: Record<string, DomainId> = {
      'prim-1': 'perception',
      'prim-2': 'perception',
      'prim-3': 'waves',
      'prim-4': 'synthesis',
    };
    return m[id];
  };

  const compatibility = new Map<DomainId, DomainId[]>([
    ['perception', ['waves', 'change']],
    ['waves', ['perception', 'change']],
    ['change', ['perception', 'waves']],
    ['synthesis', ['emergence']],
  ]);

  it('same-domain transitions are always valid', () => {
    const steps = [
      makeStep({ stepNumber: 1, primitive: 'prim-1' }), // perception
      makeStep({ stepNumber: 2, primitive: 'prim-2' }), // perception
    ];
    const failures = verifyDomainValidity(steps, domainLookup, compatibility);
    expect(failures).toEqual([]);
  });

  it('compatible cross-domain transitions are valid', () => {
    const steps = [
      makeStep({ stepNumber: 1, primitive: 'prim-1' }), // perception
      makeStep({ stepNumber: 2, primitive: 'prim-3' }), // waves (compatible with perception)
    ];
    const failures = verifyDomainValidity(steps, domainLookup, compatibility);
    expect(failures).toEqual([]);
  });

  it('incompatible cross-domain transitions produce failure', () => {
    const steps = [
      makeStep({ stepNumber: 1, primitive: 'prim-1' }), // perception
      makeStep({ stepNumber: 2, primitive: 'prim-4' }), // synthesis (not compatible with perception)
    ];
    const failures = verifyDomainValidity(steps, domainLookup, compatibility);
    expect(failures).toHaveLength(1);
    expect(failures[0].check).toBe('domain-validity');
    expect(failures[0].stepNumber).toBe(2);
    expect(failures[0].message).toContain('perception');
    expect(failures[0].message).toContain('synthesis');
  });

  it('unknown domain IDs produce explicit failure', () => {
    const steps = [
      makeStep({ stepNumber: 1, primitive: 'unknown-prim' }),
    ];
    const failures = verifyDomainValidity(steps, () => undefined, compatibility);
    expect(failures).toHaveLength(1);
    expect(failures[0].check).toBe('domain-validity');
    expect(failures[0].message).toContain('unknown');
  });

  it('returns empty array for empty steps', () => {
    const failures = verifyDomainValidity([], domainLookup, compatibility);
    expect(failures).toEqual([]);
  });
});

// === 4. SAFE-03: Explicit Failure Tests ===

describe('SAFE-03: explicit failure guarantee', () => {
  const lookups = makeLookups();

  it('verifyCompositionStep never returns undefined or null', () => {
    const step = makeStep({ stepNumber: 1, primitive: 'prim-1', inputType: 'initial', outputType: 'vector' });
    const result = verifyCompositionStep(step, null, lookups);
    expect(result).toBeDefined();
    expect(result).not.toBeNull();
    expect(result.status).toBeDefined();
    expect(result.failures).toBeDefined();
    expect(Array.isArray(result.failures)).toBe(true);
  });

  it('verifyCompositionStep with incompatible inputs returns VerificationFailure, not throw', () => {
    const prev = makeStep({ stepNumber: 1, primitive: 'prim-1', inputType: 'initial', outputType: 'vector' });
    const step = makeStep({ stepNumber: 2, primitive: 'unknown-prim', inputType: 'WRONG', outputType: 'matrix' });
    // Should not throw
    const result = verifyCompositionStep(step, prev, lookups);
    expect(result.status).toBe('failed');
    expect(result.failures.length).toBeGreaterThan(0);
  });

  it('verifyCompositionPath with ANY failed step returns overall failure with ALL failures', () => {
    const steps = [
      makeStep({ stepNumber: 1, primitive: 'prim-1', inputType: 'initial', outputType: 'vector' }),
      makeStep({ stepNumber: 2, primitive: 'unknown-prim', inputType: 'WRONG', outputType: 'matrix' }),
      makeStep({ stepNumber: 3, primitive: 'prim-4', inputType: 'ALSO_WRONG', outputType: 'scalar' }),
    ];
    const path = makePath(steps);
    const result = verifyCompositionPath(path, lookups);
    expect(result.status).toBe('failed');
    // Must collect ALL failures, not just the first
    expect(result.failures.length).toBeGreaterThan(1);
  });

  it('VerificationResult is a discriminated union on status', () => {
    const step = makeStep({ stepNumber: 1, primitive: 'prim-1', inputType: 'initial', outputType: 'vector' });
    const result = verifyCompositionStep(step, null, lookups);
    expect(['passed', 'failed']).toContain(result.status);
    expect(typeof result.stepsChecked).toBe('number');
    expect(typeof result.checkedAt).toBe('string');
  });

  it('handles edge cases: empty strings, missing fields', () => {
    const step = makeStep({ stepNumber: 1, primitive: '', inputType: '', outputType: '' });
    const result = verifyCompositionStep(step, null, lookups);
    // Must not throw, must return a result
    expect(result).toBeDefined();
    expect(result.status).toBeDefined();
  });
});

// === 5. Integration: verifyCompositionPath ===

describe('verifyCompositionPath', () => {
  const lookups = makeLookups();

  it('passes when all checks pass on all steps', () => {
    const steps = [
      makeStep({ stepNumber: 1, primitive: 'prim-1', inputType: 'initial', outputType: 'vector' }),
      makeStep({ stepNumber: 2, primitive: 'prim-2', inputType: 'vector', outputType: 'matrix' }),
    ];
    const path = makePath(steps);
    const result = verifyCompositionPath(path, lookups);
    expect(result.status).toBe('passed');
    expect(result.failures).toEqual([]);
    expect(result.stepsChecked).toBe(2);
  });

  it('returns empty-path success for path with no steps', () => {
    const path = makePath([]);
    const result = verifyCompositionPath(path, lookups);
    expect(result.status).toBe('passed');
    expect(result.stepsChecked).toBe(0);
    expect(result.failures).toEqual([]);
  });

  it('aggregates failures from all three check types', () => {
    // Dimensional: step 2 inputType mismatches step 1 outputType
    // Type: unknown primitive at step 2
    // Domain: unknown domain at step 2
    const steps = [
      makeStep({ stepNumber: 1, primitive: 'prim-1', inputType: 'initial', outputType: 'vector' }),
      makeStep({ stepNumber: 2, primitive: 'unknown-prim', inputType: 'WRONG', outputType: 'matrix' }),
    ];
    const path = makePath(steps);
    const result = verifyCompositionPath(path, lookups);
    expect(result.status).toBe('failed');

    const checkTypes = result.failures.map(f => f.check);
    expect(checkTypes).toContain('dimensional');
    expect(checkTypes).toContain('type-compatibility');
    expect(checkTypes).toContain('domain-validity');
  });

  it('includes checkedAt timestamp', () => {
    const path = makePath([makeStep({ stepNumber: 1, primitive: 'prim-1' })]);
    const result = verifyCompositionPath(path, lookups);
    expect(result.checkedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

// === 6. createVerificationEngine ===

describe('createVerificationEngine', () => {
  const lookups = makeLookups();

  it('creates an engine with verifyStep and verifyPath methods', () => {
    const engine = createVerificationEngine(lookups);
    expect(typeof engine.verifyStep).toBe('function');
    expect(typeof engine.verifyPath).toBe('function');
  });

  it('engine.verifyStep delegates to verifyCompositionStep with bound lookups', () => {
    const engine = createVerificationEngine(lookups);
    const step = makeStep({ stepNumber: 1, primitive: 'prim-1', inputType: 'initial', outputType: 'vector' });
    const result = engine.verifyStep(step, null);
    expect(result.status).toBe('passed');
  });

  it('engine.verifyPath delegates to verifyCompositionPath with bound lookups', () => {
    const engine = createVerificationEngine(lookups);
    const steps = [
      makeStep({ stepNumber: 1, primitive: 'prim-1', inputType: 'initial', outputType: 'vector' }),
      makeStep({ stepNumber: 2, primitive: 'prim-2', inputType: 'vector', outputType: 'matrix' }),
    ];
    const path = makePath(steps);
    const result = engine.verifyPath(path);
    expect(result.status).toBe('passed');
  });
});
