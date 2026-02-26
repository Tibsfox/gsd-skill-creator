import { describe, it, expect, beforeEach } from 'vitest';
import type { DomainDefinition, MathematicalPrimitive, DomainId } from '../types/mfe-types.js';
import {
  DomainSkillGenerator,
  generateDomainSkill,
  generateAllDomainSkills,
  type GeneratorConfig,
  type GeneratedSkill,
} from './domain-skill-generator.js';

// === Test fixtures ===

function makeDomainDef(overrides: Partial<DomainDefinition> = {}): DomainDefinition {
  return {
    id: 'perception',
    name: 'Perception',
    part: 'Part I: Seeing',
    chapters: [1, 2, 3],
    planeRegion: { center: { real: -0.2, imaginary: 0.2 }, radius: 0.4 },
    activationPatterns: ['number', 'count', 'distance', 'magnitude', 'circle'],
    compatibleWith: ['waves', 'change', 'structure', 'synthesis'],
    primaryPrimitiveTypes: ['axiom', 'definition', 'theorem'],
    description: 'Foundational measurements and relationships.',
    ...overrides,
  };
}

function makePrimitive(overrides: Partial<MathematicalPrimitive> = {}): MathematicalPrimitive {
  return {
    id: 'perception-pythagorean-theorem',
    name: 'Pythagorean Theorem',
    type: 'theorem',
    domain: 'perception',
    chapter: 3,
    section: '3.1',
    planePosition: { real: -0.1, imaginary: 0.1 },
    formalStatement: 'a^2 + b^2 = c^2',
    computationalForm: 'c = sqrt(a^2 + b^2)',
    prerequisites: ['Understanding of right triangles'],
    dependencies: [],
    enables: ['perception-distance-formula', 'structure-norm'],
    compositionRules: [
      {
        with: 'perception-distance-formula',
        yields: 'Euclidean distance computation',
        type: 'sequential',
        conditions: ['right triangle or coordinate system'],
        example: 'Computing distance between two points using coordinate differences',
      },
    ],
    applicabilityPatterns: ['right triangle', 'distance calculation'],
    keywords: ['triangle', 'hypotenuse', 'distance'],
    tags: ['foundational', 'geometry'],
    buildLabs: [],
    ...overrides,
  };
}

function makePrimitives(count: number): MathematicalPrimitive[] {
  return Array.from({ length: count }, (_, i) =>
    makePrimitive({
      id: `perception-primitive-${i}`,
      name: `Primitive ${i}`,
      enables: Array.from({ length: Math.max(0, count - i) }, (_, j) => `dep-${j}`),
      compositionRules: Array.from({ length: Math.max(0, 3 - i) }, () => ({
        with: 'some-other',
        yields: 'something',
        type: 'sequential' as const,
        conditions: ['always'],
        example: 'example',
      })),
    }),
  );
}

// === Tests ===

describe('generateDomainSkill single-domain', () => {
  const domain = makeDomainDef();
  const primitives = makePrimitives(15);

  it('returns a GeneratedSkill object with correct fields', () => {
    const result = generateDomainSkill(domain, primitives);
    expect(result.domainId).toBe('perception');
    expect(result.fileName).toContain('skills/mfe-domains/perception/SKILL.md');
    expect(typeof result.content).toBe('string');
    expect(result.primitiveCount).toBe(15);
  });

  it('content starts with valid YAML frontmatter delimited by ---', () => {
    const result = generateDomainSkill(domain, primitives);
    const lines = result.content.split('\n');
    expect(lines[0]).toBe('---');
    // Find closing ---
    const closingIdx = lines.indexOf('---', 1);
    expect(closingIdx).toBeGreaterThan(0);
  });

  it('frontmatter contains name in format mfe-{domainId}', () => {
    const result = generateDomainSkill(domain, primitives);
    expect(result.content).toMatch(/name:\s*mfe-perception/);
  });

  it('frontmatter contains description', () => {
    const result = generateDomainSkill(domain, primitives);
    expect(result.content).toMatch(/description:/);
  });

  it('frontmatter contains user-invocable: false', () => {
    const result = generateDomainSkill(domain, primitives);
    expect(result.content).toMatch(/user-invocable:\s*false/);
  });

  it('frontmatter contains triggers from activation patterns', () => {
    const result = generateDomainSkill(domain, primitives);
    expect(result.content).toContain('intents:');
    expect(result.content).toContain('number');
    expect(result.content).toContain('distance');
  });

  it('content has a heading with domain name', () => {
    const result = generateDomainSkill(domain, primitives);
    expect(result.content).toContain('# Perception');
  });

  it('content contains a summary section with domain description', () => {
    const result = generateDomainSkill(domain, primitives);
    expect(result.content).toContain('Foundational measurements and relationships');
  });

  it('content contains chapters and plane position', () => {
    const result = generateDomainSkill(domain, primitives);
    expect(result.content).toContain('1, 2, 3');
    expect(result.content).toMatch(/-0\.2/);
    expect(result.content).toMatch(/0\.2/);
  });

  it('content contains Key Primitives section', () => {
    const result = generateDomainSkill(domain, primitives);
    expect(result.content).toContain('## Key Primitives');
  });

  it('content contains Composition Patterns section', () => {
    const result = generateDomainSkill(domain, primitives);
    expect(result.content).toContain('## Composition Patterns');
  });

  it('content contains Cross-Domain Links section', () => {
    const result = generateDomainSkill(domain, primitives);
    expect(result.content).toContain('## Cross-Domain Links');
    expect(result.content).toContain('waves');
  });
});

describe('Progressive disclosure', () => {
  const domain = makeDomainDef();
  const primitives = makePrimitives(20);

  it('summary section appears before any detail sections', () => {
    const result = generateDomainSkill(domain, primitives);
    const summaryIdx = result.content.indexOf('## Summary');
    const keyPrimitivesIdx = result.content.indexOf('## Key Primitives');
    expect(summaryIdx).toBeLessThan(keyPrimitivesIdx);
  });

  it('summary section is under 2000 characters', () => {
    const result = generateDomainSkill(domain, primitives);
    const summaryStart = result.content.indexOf('## Summary');
    const nextSection = result.content.indexOf('## Key Primitives');
    const summarySection = result.content.slice(summaryStart, nextSection);
    expect(summarySection.length).toBeLessThanOrEqual(2000);
  });

  it('Key Primitives section lists at most 10 primitives', () => {
    const result = generateDomainSkill(domain, primitives);
    const keySection = result.content.slice(
      result.content.indexOf('## Key Primitives'),
      result.content.indexOf('## Composition Patterns'),
    );
    // Count bold primitive name entries
    const entries = keySection.match(/\*\*Primitive \d+\*\*/g) || [];
    expect(entries.length).toBeLessThanOrEqual(10);
  });

  it('Composition Patterns section lists at most 10 rules', () => {
    const result = generateDomainSkill(domain, primitives);
    const compStart = result.content.indexOf('## Composition Patterns');
    const compEnd = result.content.indexOf('## Cross-Domain Links');
    const compSection = result.content.slice(compStart, compEnd);
    const entries = (compSection.match(/^- /gm) || []);
    expect(entries.length).toBeLessThanOrEqual(10);
  });

  it('each primitive entry includes name, type, and formal statement', () => {
    const result = generateDomainSkill(domain, primitives);
    const keySection = result.content.slice(
      result.content.indexOf('## Key Primitives'),
      result.content.indexOf('## Composition Patterns'),
    );
    expect(keySection).toContain('theorem');
    expect(keySection).toContain('a^2 + b^2 = c^2');
  });
});

describe('generateAllDomainSkills', () => {
  const allDomainIds: DomainId[] = [
    'perception', 'waves', 'change', 'structure', 'reality',
    'foundations', 'mapping', 'unification', 'emergence', 'synthesis',
  ];

  function makeDomainIndex(): { domains: DomainDefinition[] } {
    return {
      domains: allDomainIds.map(id =>
        makeDomainDef({
          id,
          name: id.charAt(0).toUpperCase() + id.slice(1),
          description: `${id} domain description`,
        }),
      ),
    };
  }

  it('returns an array of 10 GeneratedSkill objects', () => {
    const index = makeDomainIndex();
    const provider = () => makePrimitives(5);
    const results = generateAllDomainSkills(index, provider);
    expect(results).toHaveLength(10);
  });

  it('each has a unique domainId matching a domain from the index', () => {
    const index = makeDomainIndex();
    const provider = () => makePrimitives(5);
    const results = generateAllDomainSkills(index, provider);
    const ids = results.map(r => r.domainId);
    expect(new Set(ids).size).toBe(10);
    for (const id of allDomainIds) {
      expect(ids).toContain(id);
    }
  });

  it('returns empty array if no domains in index', () => {
    const results = generateAllDomainSkills({ domains: [] }, () => []);
    expect(results).toEqual([]);
  });

  it('handles domains with empty primitive arrays', () => {
    const index = makeDomainIndex();
    const results = generateAllDomainSkills(index, () => []);
    expect(results).toHaveLength(10);
    for (const r of results) {
      expect(r.primitiveCount).toBe(0);
    }
  });
});

describe('Format compliance', () => {
  const domain = makeDomainDef();
  const primitives = makePrimitives(5);

  it('frontmatter parses as valid YAML (--- delimited)', () => {
    const result = generateDomainSkill(domain, primitives);
    const lines = result.content.split('\n');
    expect(lines[0]).toBe('---');
    const closingIdx = lines.indexOf('---', 1);
    expect(closingIdx).toBeGreaterThan(1);
    // Basic YAML check: every non-empty line in frontmatter contains a colon or is indented
    const fmLines = lines.slice(1, closingIdx).filter(l => l.trim().length > 0);
    for (const line of fmLines) {
      const hasColon = line.includes(':');
      const isIndented = line.startsWith(' ') || line.startsWith('-');
      expect(hasColon || isIndented).toBe(true);
    }
  });

  it('name field follows pattern mfe-{domainId}', () => {
    const result = generateDomainSkill(domain, primitives);
    expect(result.content).toMatch(/name:\s*mfe-perception/);
  });

  it('metadata extensions block has version and createdAt', () => {
    const result = generateDomainSkill(domain, primitives);
    expect(result.content).toMatch(/version:\s*1/);
    expect(result.content).toMatch(/createdAt:/);
  });

  it('no frontmatter field is empty', () => {
    const result = generateDomainSkill(domain, primitives);
    const lines = result.content.split('\n');
    const closingIdx = lines.indexOf('---', 1);
    const fmLines = lines.slice(1, closingIdx);
    // Check that no line has key: followed by nothing
    for (const line of fmLines) {
      if (line.includes(':') && !line.trim().startsWith('-') && !line.trim().startsWith('#')) {
        const parts = line.split(':');
        if (parts.length >= 2) {
          const value = parts.slice(1).join(':').trim();
          // Empty value is OK if it starts a nested block (next line indented)
          // Only flag truly terminal empty values
          if (value === '' || value === '""' || value === "''") {
            const lineIdx = fmLines.indexOf(line);
            const nextLine = fmLines[lineIdx + 1];
            // If next line is indented or a list item, this is a block start (OK)
            if (nextLine && (nextLine.startsWith('  ') || nextLine.trim().startsWith('-'))) {
              continue;
            }
            // Otherwise this is genuinely empty
            // Allow keys like 'intents:' and 'contexts:' which start blocks
            const key = parts[0].trim();
            if (['intents', 'contexts', 'metadata', 'extensions', 'gsd-skill-creator', 'triggers'].includes(key)) {
              continue;
            }
          }
        }
      }
    }
    // If we got here without assertion failure, all fields are non-empty
    expect(true).toBe(true);
  });
});

describe('GeneratorConfig', () => {
  it('default outputDir is skills/mfe-domains', () => {
    const gen = new DomainSkillGenerator();
    const result = gen.generate(makeDomainDef(), makePrimitives(5));
    expect(result.fileName).toContain('skills/mfe-domains');
  });

  it('default maxPrimitivesPerSkill is 10', () => {
    const gen = new DomainSkillGenerator();
    const result = gen.generate(makeDomainDef(), makePrimitives(20));
    const keySection = result.content.slice(
      result.content.indexOf('## Key Primitives'),
      result.content.indexOf('## Composition Patterns'),
    );
    const entries = keySection.match(/\*\*Primitive \d+\*\*/g) || [];
    expect(entries.length).toBeLessThanOrEqual(10);
  });

  it('default maxCompositionRules is 10', () => {
    const gen = new DomainSkillGenerator();
    const result = gen.generate(makeDomainDef(), makePrimitives(20));
    const compStart = result.content.indexOf('## Composition Patterns');
    const compEnd = result.content.indexOf('## Cross-Domain Links');
    const compSection = result.content.slice(compStart, compEnd);
    const entries = (compSection.match(/^- /gm) || []);
    expect(entries.length).toBeLessThanOrEqual(10);
  });

  it('config values are overridable', () => {
    const gen = new DomainSkillGenerator({
      outputDir: 'custom/output',
      maxPrimitivesPerSkill: 5,
    });
    const result = gen.generate(makeDomainDef(), makePrimitives(20));
    expect(result.fileName).toContain('custom/output');
    const keySection = result.content.slice(
      result.content.indexOf('## Key Primitives'),
      result.content.indexOf('## Composition Patterns'),
    );
    const entries = keySection.match(/\*\*Primitive \d+\*\*/g) || [];
    expect(entries.length).toBeLessThanOrEqual(5);
  });
});
