import { describe, it, expect } from 'vitest';
import {
  VariantEntrySchema,
  BenchmarkEntrySchema,
  SkillPackageSchema,
  packageSkill,
} from './skill-packager.js';
import type { BenchmarkEntry } from './skill-packager.js';
import type { MultiModelReport } from './multi-model-optimizer.js';

// ============================================================================
// VariantEntrySchema
// ============================================================================

describe('VariantEntrySchema', () => {
  it('validates a well-formed variant entry', () => {
    const valid = {
      chipName: 'gpt-4',
      tier: 'cloud',
      description: 'Cloud model variant',
      recommendations: ['Skill performs well'],
    };
    expect(() => VariantEntrySchema.parse(valid)).not.toThrow();
  });

  it('rejects invalid tier', () => {
    const invalid = {
      chipName: 'test',
      tier: 'mega',
      description: 'Bad tier',
      recommendations: [],
    };
    expect(() => VariantEntrySchema.parse(invalid)).toThrow();
  });

  it('accepts empty recommendations array', () => {
    const valid = {
      chipName: 'test',
      tier: 'local-small',
      description: 'No recs',
      recommendations: [],
    };
    expect(() => VariantEntrySchema.parse(valid)).not.toThrow();
  });
});

// ============================================================================
// BenchmarkEntrySchema
// ============================================================================

describe('BenchmarkEntrySchema', () => {
  it('validates a well-formed benchmark entry', () => {
    const valid = {
      chipName: 'gpt-4',
      passRate: 0.95,
      testCount: 20,
      runAt: '2026-03-04T00:00:00.000Z',
    };
    expect(() => BenchmarkEntrySchema.parse(valid)).not.toThrow();
  });

  it('rejects missing fields', () => {
    expect(() => BenchmarkEntrySchema.parse({})).toThrow();
  });

  it('rejects non-numeric passRate', () => {
    const invalid = {
      chipName: 'test',
      passRate: 'high',
      testCount: 10,
      runAt: '2026-01-01',
    };
    expect(() => BenchmarkEntrySchema.parse(invalid)).toThrow();
  });
});

// ============================================================================
// SkillPackageSchema
// ============================================================================

describe('SkillPackageSchema', () => {
  it('validates a well-formed skill package', () => {
    const valid = {
      manifest: {
        name: 'test-skill',
        version: '1.0.0',
        description: 'A test skill',
        tested_models: [
          { chipName: 'gpt-4', tier: 'cloud', passRate: 0.95, status: 'passing' },
        ],
        mesh_hints: {
          preferredTier: 'cloud',
          minimumPassRate: 0.75,
          costSensitive: false,
        },
        createdAt: '2026-03-04T00:00:00.000Z',
        packagedBy: 'skill-creator',
      },
      variants: [
        {
          chipName: 'gpt-4',
          tier: 'cloud',
          description: 'Cloud variant',
          recommendations: ['Skill performs well'],
        },
      ],
      benchmarks: [],
    };
    expect(() => SkillPackageSchema.parse(valid)).not.toThrow();
  });

  it('rejects package missing manifest', () => {
    const invalid = { variants: [], benchmarks: [] };
    expect(() => SkillPackageSchema.parse(invalid)).toThrow();
  });
});

// ============================================================================
// packageSkill
// ============================================================================

describe('packageSkill', () => {
  const makeReport = (
    guidances: MultiModelReport['guidances'],
  ): MultiModelReport => ({
    skillName: 'test-skill',
    guidances,
    summary: `${guidances.length} models evaluated`,
  });

  const sampleReport = makeReport([
    {
      chipName: 'gpt-4',
      tier: 'cloud',
      passRate: 0.95,
      status: 'passing',
      recommendations: ['Skill performs well', 'Consider local model to reduce cost'],
    },
    {
      chipName: 'llama-7b',
      tier: 'local-small',
      passRate: 0.30,
      status: 'failing',
      recommendations: ['Consider larger context model', 'Simplify prompts', 'Break into sub-skills'],
    },
  ]);

  it('creates correct manifest via buildSkillManifest', () => {
    const pkg = packageSkill('my-skill', '1.0.0', 'A skill', sampleReport);

    expect(pkg.manifest.name).toBe('my-skill');
    expect(pkg.manifest.version).toBe('1.0.0');
    expect(pkg.manifest.description).toBe('A skill');
    expect(pkg.manifest.tested_models).toHaveLength(2);
    expect(pkg.manifest.packagedBy).toBe('skill-creator');
  });

  it('creates one variant per chip', () => {
    const pkg = packageSkill('s', '1.0', 'd', sampleReport);

    expect(pkg.variants).toHaveLength(2);
    expect(pkg.variants[0].chipName).toBe('gpt-4');
    expect(pkg.variants[0].tier).toBe('cloud');
    expect(pkg.variants[1].chipName).toBe('llama-7b');
    expect(pkg.variants[1].tier).toBe('local-small');
  });

  it('joins recommendations as variant description', () => {
    const pkg = packageSkill('s', '1.0', 'd', sampleReport);

    expect(pkg.variants[0].description).toBe(
      'Skill performs well\nConsider local model to reduce cost',
    );
    expect(pkg.variants[1].description).toBe(
      'Consider larger context model\nSimplify prompts\nBreak into sub-skills',
    );
  });

  it('preserves recommendations array in variants', () => {
    const pkg = packageSkill('s', '1.0', 'd', sampleReport);

    expect(pkg.variants[0].recommendations).toEqual([
      'Skill performs well',
      'Consider local model to reduce cost',
    ]);
    expect(pkg.variants[1].recommendations).toEqual([
      'Consider larger context model',
      'Simplify prompts',
      'Break into sub-skills',
    ]);
  });

  it('includes benchmarks when provided', () => {
    const benchmarks: BenchmarkEntry[] = [
      { chipName: 'gpt-4', passRate: 0.95, testCount: 20, runAt: '2026-03-04T00:00:00.000Z' },
      { chipName: 'llama-7b', passRate: 0.30, testCount: 20, runAt: '2026-03-04T00:00:00.000Z' },
    ];

    const pkg = packageSkill('s', '1.0', 'd', sampleReport, benchmarks);
    expect(pkg.benchmarks).toHaveLength(2);
    expect(pkg.benchmarks[0].chipName).toBe('gpt-4');
    expect(pkg.benchmarks[1].testCount).toBe(20);
  });

  it('defaults benchmarks to empty array when not provided', () => {
    const pkg = packageSkill('s', '1.0', 'd', sampleReport);
    expect(pkg.benchmarks).toEqual([]);
  });

  it('validates against SkillPackageSchema', () => {
    const pkg = packageSkill('s', '1.0', 'd', sampleReport);
    expect(() => SkillPackageSchema.parse(pkg)).not.toThrow();
  });

  it('handles empty report guidances', () => {
    const emptyReport = makeReport([]);
    const pkg = packageSkill('empty', '1.0', 'no models', emptyReport);

    expect(pkg.variants).toHaveLength(0);
    expect(pkg.benchmarks).toEqual([]);
    expect(pkg.manifest.tested_models).toHaveLength(0);
  });

  it('validates package with benchmarks against schema', () => {
    const benchmarks: BenchmarkEntry[] = [
      { chipName: 'test', passRate: 0.80, testCount: 10, runAt: '2026-01-01T00:00:00.000Z' },
    ];
    const report = makeReport([
      {
        chipName: 'test',
        tier: 'cloud',
        passRate: 0.80,
        status: 'passing',
        recommendations: ['Good'],
      },
    ]);

    const pkg = packageSkill('s', '1.0', 'd', report, benchmarks);
    expect(() => SkillPackageSchema.parse(pkg)).not.toThrow();
  });
});
