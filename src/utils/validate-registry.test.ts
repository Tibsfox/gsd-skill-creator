import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { validateDomainFile, validatePrimitive, type ValidationResult } from './validate-registry.js';

// Helper: well-formed primitive for valid test cases
function validPrimitive(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'perception-pythagorean-theorem',
    name: 'Pythagorean Theorem',
    type: 'theorem',
    domain: 'perception',
    chapter: 3,
    section: '3.1',
    planePosition: { real: -0.1, imaginary: 0.3 },
    formalStatement: 'For a right triangle with legs a, b and hypotenuse c: a² + b² = c²',
    computationalForm: 'c = sqrt(a² + b²)',
    prerequisites: ['right triangle', 'square root'],
    dependencies: [
      {
        target: 'perception-right-triangle',
        type: 'requires',
        strength: 1.0,
        description: 'Cannot state without right triangle concept',
      },
    ],
    enables: ['perception-distance-formula'],
    compositionRules: [],
    applicabilityPatterns: [
      'find the length of the hypotenuse',
      'right triangle with two known sides',
    ],
    keywords: ['pythagorean', 'hypotenuse', 'right triangle'],
    tags: ['geometry', 'foundational'],
    buildLabs: ['Build Lab 3.1'],
    ...overrides,
  };
}

// Helper: well-formed axiom (no dependencies required)
function validAxiom(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'perception-counting-axiom',
    name: 'Counting Axiom',
    type: 'axiom',
    domain: 'perception',
    chapter: 1,
    section: '1.1',
    planePosition: { real: -0.3, imaginary: 0.1 },
    formalStatement: 'For every natural number n, there exists a successor S(n)',
    computationalForm: '',
    prerequisites: [],
    dependencies: [],
    enables: ['perception-addition'],
    compositionRules: [],
    applicabilityPatterns: [
      'counting natural numbers',
      'successor function',
    ],
    keywords: ['counting', 'natural number', 'successor'],
    tags: ['arithmetic', 'foundational'],
    buildLabs: ['Build Lab 1.1'],
    ...overrides,
  };
}

describe('validatePrimitive', () => {
  it('accepts a well-formed primitive with all required fields', () => {
    const result: ValidationResult = validatePrimitive(validPrimitive());
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects a primitive with missing required field (formalStatement)', () => {
    const prim = validPrimitive();
    delete prim.formalStatement;
    const result = validatePrimitive(prim);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some((e) => e.message.includes('formalStatement') || e.path.includes('formalStatement'))).toBe(true);
  });

  it('rejects a primitive with out-of-range plane position (real: 2.0)', () => {
    const result = validatePrimitive(
      validPrimitive({ planePosition: { real: 2.0, imaginary: 0.0 } }),
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.keyword === 'maximum' || e.message.includes('real'))).toBe(true);
  });

  it('rejects a primitive with invalid chapter (chapter: 0)', () => {
    const result = validatePrimitive(validPrimitive({ chapter: 0 }));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.keyword === 'minimum')).toBe(true);
  });

  it('rejects a primitive with chapter > 33', () => {
    const result = validatePrimitive(validPrimitive({ chapter: 34 }));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.keyword === 'maximum')).toBe(true);
  });

  it('accepts an axiom without dependencies', () => {
    const result = validatePrimitive(validAxiom());
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects a non-axiom (theorem) without dependencies', () => {
    const result = validatePrimitive(
      validPrimitive({ type: 'theorem', dependencies: [] }),
    );
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('rejects a theorem with empty computationalForm', () => {
    const result = validatePrimitive(
      validPrimitive({ type: 'theorem', computationalForm: '' }),
    );
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('rejects a primitive with fewer than 2 applicability patterns', () => {
    const result = validatePrimitive(
      validPrimitive({ applicabilityPatterns: ['only one'] }),
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.keyword === 'minItems')).toBe(true);
  });

  it('rejects a primitive with invalid id pattern (uppercase)', () => {
    const result = validatePrimitive(
      validPrimitive({ id: 'Perception-Theorem' }),
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.keyword === 'pattern')).toBe(true);
  });

  it('rejects a primitive with invalid dependency strength (> 1.0)', () => {
    const result = validatePrimitive(
      validPrimitive({
        dependencies: [
          {
            target: 'perception-right-triangle',
            type: 'requires',
            strength: 1.5,
            description: 'Too strong',
          },
        ],
      }),
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.keyword === 'maximum')).toBe(true);
  });
});

describe('validateDomainFile', () => {
  const tmpDir = join(process.cwd(), '.tmp-test-validate');

  beforeAll(() => {
    mkdirSync(tmpDir, { recursive: true });
  });

  afterAll(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('accepts a valid domain file with multiple primitives', async () => {
    const domainFile = {
      domain: 'perception',
      version: '1.35.0',
      primitives: [validAxiom(), validPrimitive()],
    };
    const filePath = join(tmpDir, 'valid-domain.json');
    writeFileSync(filePath, JSON.stringify(domainFile, null, 2));

    const result = await validateDomainFile(filePath);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.primitiveCount).toBe(2);
  });

  it('rejects a domain file with invalid primitives', async () => {
    const badPrim = validPrimitive();
    delete badPrim.formalStatement;
    const domainFile = {
      domain: 'perception',
      version: '1.35.0',
      primitives: [badPrim],
    };
    const filePath = join(tmpDir, 'invalid-domain.json');
    writeFileSync(filePath, JSON.stringify(domainFile, null, 2));

    const result = await validateDomainFile(filePath);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('returns error for non-existent file', async () => {
    const result = await validateDomainFile(join(tmpDir, 'does-not-exist.json'));
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('returns error for invalid JSON', async () => {
    const filePath = join(tmpDir, 'bad-json.json');
    writeFileSync(filePath, '{ not valid json }}}');

    const result = await validateDomainFile(filePath);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes('JSON') || e.message.includes('parse'))).toBe(true);
  });
});
