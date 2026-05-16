import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import type { MathematicalPrimitive, DomainId } from '../types/mfe-types.js';
import type { Changeset } from '../learn/changeset-manager.js';
import {
  harvestAddedPrimitives,
  groupByDomain,
  computeDomainCenter,
  runAggregateGenerators,
} from './aggregate-generators.js';

function makePrimitive(overrides: Partial<MathematicalPrimitive> = {}): MathematicalPrimitive {
  return {
    id: 'test-prim',
    name: 'Test Primitive',
    type: 'definition',
    domain: 'arxiv-cs' as DomainId,
    chapter: 1,
    section: '1.1',
    planePosition: { real: 0, imaginary: 0 },
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

describe('aggregate-generators: harvestAddedPrimitives', () => {
  it('returns an empty array for a null changeset', () => {
    expect(harvestAddedPrimitives(null)).toEqual([]);
  });

  it('extracts only `add` entries', () => {
    const added = makePrimitive({ id: 'added-1' });
    const updated = makePrimitive({ id: 'updated-1' });
    const removed = makePrimitive({ id: 'removed-1' });
    const changeset: Changeset = {
      sessionId: 's1',
      createdAt: 'now',
      reverted: false,
      entries: [
        { type: 'add', primitiveId: 'added-1', before: null, after: added, timestamp: 't' },
        { type: 'update', primitiveId: 'updated-1', before: updated, after: updated, timestamp: 't' },
        { type: 'remove', primitiveId: 'removed-1', before: removed, after: null, timestamp: 't' },
      ],
    };
    const result = harvestAddedPrimitives(changeset);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('added-1');
  });

  it('skips add entries with a null `after`', () => {
    const changeset: Changeset = {
      sessionId: 's1',
      createdAt: 'now',
      reverted: false,
      entries: [
        { type: 'add', primitiveId: 'bad', before: null, after: null, timestamp: 't' },
      ],
    };
    expect(harvestAddedPrimitives(changeset)).toEqual([]);
  });
});

describe('aggregate-generators: groupByDomain', () => {
  it('returns an empty map for empty input', () => {
    expect(groupByDomain([]).size).toBe(0);
  });

  it('groups by the domain field', () => {
    const primitives = [
      makePrimitive({ id: 'a', domain: 'arxiv-cs' as DomainId }),
      makePrimitive({ id: 'b', domain: 'arxiv-cs' as DomainId }),
      makePrimitive({ id: 'c', domain: 'arxiv-math' as DomainId }),
    ];
    const groups = groupByDomain(primitives);
    expect(groups.size).toBe(2);
    expect(groups.get('arxiv-cs')!.map(p => p.id)).toEqual(['a', 'b']);
    expect(groups.get('arxiv-math')!.map(p => p.id)).toEqual(['c']);
  });
});

describe('aggregate-generators: computeDomainCenter', () => {
  it('returns null on empty input', () => {
    expect(computeDomainCenter([])).toBeNull();
  });

  it('averages plane positions', () => {
    const primitives = [
      makePrimitive({ planePosition: { real: 1, imaginary: 0 } }),
      makePrimitive({ planePosition: { real: -1, imaginary: 0 } }),
      makePrimitive({ planePosition: { real: 0, imaginary: 1 } }),
    ];
    const center = computeDomainCenter(primitives);
    expect(center).toEqual({ real: 0, imaginary: 1 / 3 });
  });
});

describe('aggregate-generators: runAggregateGenerators', () => {
  it('does not fire generators below threshold', () => {
    const primitives = Array.from({ length: 5 }, (_, i) =>
      makePrimitive({ id: `cs-${i}`, domain: 'arxiv-cs' as DomainId }),
    );
    const report = runAggregateGenerators({ primitives });
    expect(report.totalPrimitives).toBe(5);
    expect(report.domains).toHaveLength(1);
    expect(report.domains[0].skill.generated).toBe(false);
    expect(report.domains[0].agent.generated).toBe(false);
    expect(report.domains[0].team.generated).toBe(false);
  });

  it('fires the skill generator at the 30-primitive threshold', () => {
    const primitives = Array.from({ length: 30 }, (_, i) =>
      makePrimitive({
        id: `cs-${i}`,
        name: `Concept ${i}`,
        domain: 'arxiv-cs' as DomainId,
        keywords: [`kw${i}`],
      }),
    );
    const report = runAggregateGenerators({ primitives });
    expect(report.domains[0].skill.generated).toBe(true);
    expect(report.domains[0].skill.skill?.primitiveCount).toBe(30);
  });

  it('writes SKILL.md when outputDir is provided and threshold is met', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agg-gen-'));
    try {
      const primitives = Array.from({ length: 30 }, (_, i) =>
        makePrimitive({
          id: `cs-${i}`,
          name: `Concept ${i}`,
          domain: 'arxiv-cs' as DomainId,
          keywords: [`kw${i}`],
        }),
      );
      const report = runAggregateGenerators({ primitives, outputDir: tmpDir });
      const skillPath = path.join(tmpDir, 'skills', 'learn-arxiv-cs', 'SKILL.md');
      expect(fs.existsSync(skillPath)).toBe(true);
      expect(report.domains[0].writtenFiles).toContain(skillPath);
      const content = fs.readFileSync(skillPath, 'utf-8');
      expect(content).toContain('name: learn-arxiv-cs');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('passes other domains as existingDomainCenters to the agent generator', () => {
    const csPrimitives = Array.from({ length: 30 }, (_, i) =>
      makePrimitive({
        id: `cs-${i}`,
        name: `CS ${i}`,
        domain: 'arxiv-cs' as DomainId,
        planePosition: { real: 0.9, imaginary: 0.9 },
        keywords: [`cs${i}`],
      }),
    );
    const mathPrimitives = Array.from({ length: 30 }, (_, i) =>
      makePrimitive({
        id: `math-${i}`,
        name: `Math ${i}`,
        domain: 'arxiv-math' as DomainId,
        planePosition: { real: 0.85, imaginary: 0.85 },
        keywords: [`math${i}`],
      }),
    );
    const report = runAggregateGenerators({
      primitives: [...csPrimitives, ...mathPrimitives],
    });
    const csReport = report.domains.find(d => d.name === 'arxiv-cs')!;
    expect(csReport.agent.generated).toBe(false);
    expect(csReport.agent.reason).toMatch(/Too close to existing domains/);
  });
});
