import { describe, it, expect } from 'vitest';
import type { MathematicalPrimitive } from '../../core/types/mfe-types.js';
import { generateLearnedSkill } from './skill-generator.js';
import type { LearnedSkillConfig, LearnedSkillResult, GeneratedSkillFile } from './skill-generator.js';

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
    applicabilityPatterns: ['when solving test problems'],
    keywords: ['test', 'primitive'],
    tags: [],
    buildLabs: [],
    ...overrides,
  };
}

function makePrimitives(count: number): MathematicalPrimitive[] {
  return Array.from({ length: count }, (_, i) =>
    makePrimitive({
      id: `prim-${i}`,
      name: `Primitive ${i}`,
      planePosition: { real: (i % 10) * 0.1, imaginary: (i % 5) * 0.2 },
      enables: i < 5 ? ['prim-other-a', 'prim-other-b'] : [],
      compositionRules: i < 3
        ? [{ with: `prim-${i + 1}`, yields: 'combined', type: 'sequential', conditions: [], example: 'ex' }]
        : [],
      keywords: [`kw-${i}`, `kw-shared`, `kw-group-${i % 3}`],
      applicabilityPatterns: [`pattern for primitive ${i}`],
    }),
  );
}

// === Threshold Tests ===

describe('skill generator: threshold', () => {
  it('returns generated: false for 29 primitives', () => {
    const result = generateLearnedSkill('Test Domain', makePrimitives(29));
    expect(result.generated).toBe(false);
    expect(result.reason).toContain('Insufficient');
    expect(result.reason).toContain('29');
    expect(result.skill).toBeNull();
  });

  it('returns generated: true for 30 primitives', () => {
    const result = generateLearnedSkill('Test Domain', makePrimitives(30));
    expect(result.generated).toBe(true);
    expect(result.skill).not.toBeNull();
    expect(result.skill!.primitiveCount).toBe(30);
  });

  it('returns generated: true for 50 primitives', () => {
    const result = generateLearnedSkill('Test Domain', makePrimitives(50));
    expect(result.generated).toBe(true);
    expect(result.skill).not.toBeNull();
    expect(result.skill!.primitiveCount).toBe(50);
  });
});

// === Content Format Tests ===

describe('skill generator: content format', () => {
  const result = generateLearnedSkill('Test Domain', makePrimitives(35));
  const content = result.skill!.content;

  it('frontmatter has name: learn-{slug}', () => {
    expect(content).toMatch(/^---\n/);
    expect(content).toMatch(/name: learn-test-domain/);
  });

  it('has ## Summary section', () => {
    expect(content).toContain('## Summary');
  });

  it('has ## Key Primitives section with max 10 entries', () => {
    expect(content).toContain('## Key Primitives');
    // Count bold primitive entries (each starts with **)
    const keyPrimSection = content.split('## Key Primitives')[1].split('## ')[0];
    const entries = keyPrimSection.match(/\*\*Primitive \d+\*\*/g) ?? [];
    expect(entries.length).toBeLessThanOrEqual(10);
  });

  it('has ## Composition Patterns section', () => {
    expect(content).toContain('## Composition Patterns');
  });

  it('has ## Activation Patterns section', () => {
    expect(content).toContain('## Activation Patterns');
  });
});

// === Progressive Disclosure Tests ===

describe('skill generator: progressive disclosure', () => {
  it('summary under 2000 chars', () => {
    const result = generateLearnedSkill('Test Domain', makePrimitives(40));
    const content = result.skill!.content;
    const summary = content.split('## Summary')[1].split('## ')[0];
    expect(summary.length).toBeLessThan(2000);
  });

  it('key primitives limited to config max', () => {
    const result = generateLearnedSkill('Test Domain', makePrimitives(40), {
      maxPrimitivesPerSkill: 5,
    });
    const content = result.skill!.content;
    const keyPrimSection = content.split('## Key Primitives')[1].split('## ')[0];
    const entries = keyPrimSection.match(/\*\*Primitive \d+\*\*/g) ?? [];
    expect(entries.length).toBeLessThanOrEqual(5);
  });

  it('composition rules limited to config max', () => {
    const result = generateLearnedSkill('Test Domain', makePrimitives(40), {
      maxCompositionRules: 2,
    });
    const content = result.skill!.content;
    const compSection = content.split('## Composition Patterns')[1].split('## ')[0];
    const ruleLines = compSection.split('\n').filter(l => l.startsWith('- '));
    expect(ruleLines.length).toBeLessThanOrEqual(2);
  });
});

// === Config Override Tests ===

describe('skill generator: config overrides', () => {
  it('custom outputDir', () => {
    const result = generateLearnedSkill('Test Domain', makePrimitives(30), {
      outputDir: '/custom/output',
    });
    expect(result.skill!.fileName).toContain('/custom/output');
  });

  it('custom minPrimitives', () => {
    // Lower threshold: 10 primitives should generate
    const result = generateLearnedSkill('Test Domain', makePrimitives(10), {
      minPrimitives: 10,
    });
    expect(result.generated).toBe(true);
    expect(result.skill).not.toBeNull();
  });

  it('custom maxPrimitivesPerSkill', () => {
    const result = generateLearnedSkill('Test Domain', makePrimitives(30), {
      maxPrimitivesPerSkill: 3,
    });
    const content = result.skill!.content;
    const keyPrimSection = content.split('## Key Primitives')[1].split('## ')[0];
    const entries = keyPrimSection.match(/\*\*Primitive \d+\*\*/g) ?? [];
    expect(entries.length).toBeLessThanOrEqual(3);
  });
});
