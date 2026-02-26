import { describe, it, expect } from 'vitest';
import type { MathematicalPrimitive, CompositionRule } from '../../types/mfe-types.js';
import { generateTeam } from './team-generator.js';

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
    enables: [],
    compositionRules: [],
    applicabilityPatterns: [],
    keywords: ['test'],
    tags: [],
    buildLabs: [],
    ...overrides,
  };
}

/** Create a composition rule that references a target primitive */
function makeRule(targetId: string): CompositionRule {
  return {
    with: targetId,
    yields: 'combined-result',
    type: 'sequential',
    conditions: [],
    example: 'example',
  };
}

/**
 * Create primitives spread across quadrants with cross-quadrant composition rules.
 * Q1: real >= 0, imaginary >= 0
 * Q2: real < 0, imaginary >= 0
 * Q3: real < 0, imaginary < 0
 * Q4: real >= 0, imaginary < 0
 */
function makeMultiQuadrantPrimitives(
  count: number,
  crossRuleCount: number,
): MathematicalPrimitive[] {
  const quadrantPositions = [
    { real: 0.5, imaginary: 0.5 },   // Q1
    { real: -0.5, imaginary: 0.5 },  // Q2
    { real: -0.5, imaginary: -0.5 }, // Q3
    { real: 0.5, imaginary: -0.5 },  // Q4
  ];

  const primitives: MathematicalPrimitive[] = [];

  for (let i = 0; i < count; i++) {
    const quadrant = i % 4;
    const pos = quadrantPositions[quadrant];
    // Assign cross-quadrant composition rules to early primitives
    const rules: CompositionRule[] = [];
    if (i < crossRuleCount) {
      // Each rule targets a primitive in a DIFFERENT quadrant
      const targetQuadrant = (quadrant + 1) % 4;
      const targetIdx = targetQuadrant; // First prim in that quadrant
      rules.push(makeRule(`prim-${targetIdx}`));
    }

    primitives.push(
      makePrimitive({
        id: `prim-${i}`,
        name: `Primitive ${i}`,
        planePosition: {
          real: pos.real + (i % 3) * 0.01,
          imaginary: pos.imaginary + (i % 3) * 0.01,
        },
        compositionRules: rules,
        keywords: [`kw-${i}`, 'shared-kw'],
      }),
    );
  }

  return primitives;
}

// === Threshold Tests ===

describe('team generator: threshold checks', () => {
  it('returns generated: false for 49 primitives', () => {
    const prims = makeMultiQuadrantPrimitives(49, 25);
    const result = generateTeam('Test Domain', prims);
    expect(result.generated).toBe(false);
    expect(result.reason).toContain('Insufficient primitives');
    expect(result.team).toBeNull();
  });

  it('returns generated: false when composition rules < 20', () => {
    // 50 prims but only 10 cross-quadrant rules
    const prims = makeMultiQuadrantPrimitives(50, 10);
    const result = generateTeam('Test Domain', prims);
    expect(result.generated).toBe(false);
    expect(result.reason).toContain('composition rules');
  });

  it('returns generated: false when fewer than 2 quadrants', () => {
    // 50 prims all in Q1 with cross-quadrant rules
    // Since all are in Q1, there's only 1 quadrant => skip
    const prims = Array.from({ length: 50 }, (_, i) =>
      makePrimitive({
        id: `prim-${i}`,
        name: `Primitive ${i}`,
        planePosition: { real: 0.5 + i * 0.001, imaginary: 0.5 + i * 0.001 },
        compositionRules: i < 25
          ? [makeRule(`prim-${(i + 1) % 50}`)]
          : [],
      }),
    );
    const result = generateTeam('Test Domain', prims);
    expect(result.generated).toBe(false);
    expect(result.reason).toContain('quadrant');
  });

  it('generates when 50+ prims, 20+ cross-quadrant rules, 2+ quadrants', () => {
    const prims = makeMultiQuadrantPrimitives(52, 22);
    const result = generateTeam('Test Domain', prims);
    expect(result.generated).toBe(true);
    expect(result.team).not.toBeNull();
  });
});

// === Composition Rule Counting ===

describe('team generator: composition rule counting', () => {
  it('counts cross-quadrant rules correctly', () => {
    // 50 prims with exactly 20 cross-quadrant rules
    const prims = makeMultiQuadrantPrimitives(50, 20);
    const result = generateTeam('Test Domain', prims);
    expect(result.generated).toBe(true);
  });

  it('does not count same-quadrant rules as cross-quadrant', () => {
    // 50 prims in Q1 and Q2, but rules target same-quadrant
    const prims = Array.from({ length: 50 }, (_, i) => {
      const inQ1 = i % 2 === 0;
      const pos = inQ1
        ? { real: 0.5, imaginary: 0.5 }
        : { real: -0.5, imaginary: 0.5 };
      // Rules target same-quadrant primitives (not cross-quadrant)
      const sameQuadrantTarget = inQ1 ? (i + 2) % 50 : ((i + 2) % 50);
      // Make sure target is in same quadrant
      const rules: CompositionRule[] = i < 25
        ? [makeRule(`prim-${i % 2 === 0 ? Math.min(i + 2, 48) : Math.min(i + 2, 49)}`)]
        : [];
      return makePrimitive({
        id: `prim-${i}`,
        name: `Primitive ${i}`,
        planePosition: { real: pos.real + i * 0.001, imaginary: pos.imaginary },
        compositionRules: rules,
      });
    });
    // Need to verify: with same-quadrant rules, the cross-count < 20
    // This test checks the result is false (not enough CROSS-quadrant rules)
    const result = generateTeam('Test Domain', prims);
    expect(result.generated).toBe(false);
  });
});

// === Quadrant Detection ===

describe('team generator: quadrant detection', () => {
  it('detects all 4 quadrants', () => {
    const prims = makeMultiQuadrantPrimitives(52, 22);
    const result = generateTeam('Test Domain', prims);
    expect(result.generated).toBe(true);
    // agentCount should reflect multi-quadrant coverage
    expect(result.team!.agentCount).toBeGreaterThanOrEqual(2);
  });
});

// === Content Format Tests ===

describe('team generator: content format', () => {
  const prims = makeMultiQuadrantPrimitives(52, 22);
  const result = generateTeam('Test Domain', prims);
  const content = result.team!.content;

  it('has YAML frontmatter with learn-{slug}-team name', () => {
    expect(content).toMatch(/^---\n/);
    expect(content).toMatch(/name: learn-test-domain-team/);
  });

  it('has ## Purpose section', () => {
    expect(content).toContain('## Purpose');
  });

  it('has ## Agents section', () => {
    expect(content).toContain('## Agents');
  });

  it('has ## Coordination section', () => {
    expect(content).toContain('## Coordination');
  });

  it('has ## Topology section', () => {
    expect(content).toContain('## Topology');
  });

  it('fileName includes team name', () => {
    expect(result.team!.fileName).toContain('learn-test-domain-team');
  });
});
