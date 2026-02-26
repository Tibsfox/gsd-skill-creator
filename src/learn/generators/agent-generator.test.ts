import { describe, it, expect } from 'vitest';
import type { MathematicalPrimitive, PlanePosition } from '../../types/mfe-types.js';
import { generateAgent } from './agent-generator.js';

// === Test Helpers ===

function makePrimitive(overrides: Partial<MathematicalPrimitive> = {}): MathematicalPrimitive {
  return {
    id: 'test-prim',
    name: 'Test Primitive',
    type: 'definition',
    domain: 'perception',
    chapter: 1,
    section: '1.1',
    planePosition: { real: 0.5, imaginary: 0.3 },
    formalStatement: 'Test formal statement',
    computationalForm: 'test(x) = x',
    prerequisites: [],
    dependencies: [],
    enables: ['other-prim'],
    compositionRules: [
      { with: 'other-prim', yields: 'combined', type: 'sequential', conditions: [], example: 'ex' },
    ],
    applicabilityPatterns: ['when solving test problems'],
    keywords: ['test', 'primitive'],
    tags: [],
    buildLabs: [],
    ...overrides,
  };
}

function makePrimitives(count: number, center: PlanePosition = { real: 0.8, imaginary: 0.7 }): MathematicalPrimitive[] {
  return Array.from({ length: count }, (_, i) =>
    makePrimitive({
      id: `prim-${i}`,
      name: `Primitive ${i}`,
      planePosition: {
        real: center.real + (i % 3) * 0.01,
        imaginary: center.imaginary + (i % 3) * 0.01,
      },
      enables: i < 5 ? ['prim-other-a'] : [],
      compositionRules: i < 3
        ? [{ with: `prim-${i + 1}`, yields: 'combined', type: 'sequential' as const, conditions: [], example: 'ex' }]
        : [],
      keywords: [`kw-${i}`, 'kw-shared'],
    }),
  );
}

// === Threshold Tests ===

describe('agent generator: threshold', () => {
  it('returns generated: false for 29 primitives', () => {
    const result = generateAgent('Test Domain', makePrimitives(29), []);
    expect(result.generated).toBe(false);
    expect(result.reason).toContain('Insufficient');
    expect(result.agent).toBeNull();
  });

  it('checks distance when 30 primitives (no existing centers => generate)', () => {
    const result = generateAgent('Test Domain', makePrimitives(30), []);
    expect(result.generated).toBe(true);
    expect(result.agent).not.toBeNull();
  });
});

// === Distance Check Tests ===

describe('agent generator: distance check', () => {
  it('skips when all existing domain centers are close', () => {
    // Primitives centered around (0.8, 0.7)
    // Existing center at (0.81, 0.71) — distance ~0.014 < 0.5
    const existing: PlanePosition[] = [{ real: 0.81, imaginary: 0.71 }];
    const result = generateAgent('Test Domain', makePrimitives(30), existing);
    expect(result.generated).toBe(false);
    expect(result.reason).toContain('Too close');
  });

  it('generates when at least one existing center is distant', () => {
    // Primitives centered around (0.8, 0.7)
    // One close center, one far center
    const existing: PlanePosition[] = [
      { real: 0.81, imaginary: 0.71 },  // close
      { real: -0.5, imaginary: -0.5 },  // far
    ];
    // ANY distance >= 0.5 should trigger generation
    // The check: if ALL are < 0.5, skip. Here one is far so should generate.
    // Wait: the plan says "If ALL distances < minPlaneDistance, skip"
    // So if at least one is distant, we generate.
    const result = generateAgent('Test Domain', makePrimitives(30), existing);
    expect(result.generated).toBe(true);
  });

  it('generates when no existing domain centers exist', () => {
    const result = generateAgent('Test Domain', makePrimitives(30), []);
    expect(result.generated).toBe(true);
    expect(result.agent).not.toBeNull();
  });

  it('skips with custom minPlaneDistance', () => {
    // Distance from (0.8, 0.7) to (0.3, 0.3) ~= 0.64
    // With minPlaneDistance = 1.0, this is still "close"
    const existing: PlanePosition[] = [{ real: 0.3, imaginary: 0.3 }];
    const result = generateAgent('Test Domain', makePrimitives(30), existing, {
      minPlaneDistance: 1.0,
    });
    expect(result.generated).toBe(false);
  });
});

// === Content Format Tests ===

describe('agent generator: content format', () => {
  const result = generateAgent('Test Domain', makePrimitives(35), []);
  const content = result.agent!.content;

  it('has YAML frontmatter with learn-{slug}-agent name', () => {
    expect(content).toMatch(/^---\n/);
    expect(content).toMatch(/name: learn-test-domain-agent/);
  });

  it('has ## Role section', () => {
    expect(content).toContain('## Role');
  });

  it('has ## Expertise section', () => {
    expect(content).toContain('## Expertise');
  });

  it('has ## Reasoning Patterns section', () => {
    expect(content).toContain('## Reasoning Patterns');
  });

  it('has ## Activation section', () => {
    expect(content).toContain('## Activation');
  });

  it('fileName includes agent name', () => {
    expect(result.agent!.fileName).toContain('learn-test-domain-agent');
  });
});
