import { describe, it, expect } from 'vitest';
import {
  TestedModelSchema,
  MeshHintsSchema,
  SkillManifestSchema,
  buildSkillManifest,
} from './skill-manifest.js';
import type { MultiModelReport } from './multi-model-optimizer.js';

// ============================================================================
// TestedModelSchema
// ============================================================================

describe('TestedModelSchema', () => {
  it('validates a well-formed tested model', () => {
    const valid = {
      chipName: 'gpt-4',
      tier: 'cloud',
      passRate: 0.95,
      status: 'passing',
    };
    expect(() => TestedModelSchema.parse(valid)).not.toThrow();
  });

  it('rejects invalid tier', () => {
    const invalid = {
      chipName: 'test',
      tier: 'mega',
      passRate: 0.5,
      status: 'passing',
    };
    expect(() => TestedModelSchema.parse(invalid)).toThrow();
  });

  it('rejects invalid status', () => {
    const invalid = {
      chipName: 'test',
      tier: 'cloud',
      passRate: 0.5,
      status: 'unknown',
    };
    expect(() => TestedModelSchema.parse(invalid)).toThrow();
  });

  it('accepts all valid tiers', () => {
    for (const tier of ['local-small', 'local-large', 'cloud']) {
      const model = { chipName: 'test', tier, passRate: 0.8, status: 'passing' };
      expect(() => TestedModelSchema.parse(model)).not.toThrow();
    }
  });

  it('accepts all valid statuses', () => {
    for (const status of ['passing', 'marginal', 'failing']) {
      const model = { chipName: 'test', tier: 'cloud', passRate: 0.5, status };
      expect(() => TestedModelSchema.parse(model)).not.toThrow();
    }
  });
});

// ============================================================================
// MeshHintsSchema
// ============================================================================

describe('MeshHintsSchema', () => {
  it('validates well-formed mesh hints', () => {
    const valid = {
      preferredTier: 'cloud',
      minimumPassRate: 0.75,
      costSensitive: false,
    };
    expect(() => MeshHintsSchema.parse(valid)).not.toThrow();
  });

  it('accepts all valid preferredTier values', () => {
    for (const tier of ['local-small', 'local-large', 'cloud', 'any']) {
      const hints = { preferredTier: tier, minimumPassRate: 0.5, costSensitive: true };
      expect(() => MeshHintsSchema.parse(hints)).not.toThrow();
    }
  });

  it('rejects minimumPassRate below 0', () => {
    const invalid = { preferredTier: 'any', minimumPassRate: -0.1, costSensitive: true };
    expect(() => MeshHintsSchema.parse(invalid)).toThrow();
  });

  it('rejects minimumPassRate above 1', () => {
    const invalid = { preferredTier: 'any', minimumPassRate: 1.1, costSensitive: true };
    expect(() => MeshHintsSchema.parse(invalid)).toThrow();
  });

  it('defaults costSensitive to true', () => {
    const result = MeshHintsSchema.parse({
      preferredTier: 'any',
      minimumPassRate: 0.5,
    });
    expect(result.costSensitive).toBe(true);
  });
});

// ============================================================================
// SkillManifestSchema
// ============================================================================

describe('SkillManifestSchema', () => {
  it('validates a well-formed manifest', () => {
    const valid = {
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
    };
    expect(() => SkillManifestSchema.parse(valid)).not.toThrow();
  });

  it('rejects manifest missing required fields', () => {
    expect(() => SkillManifestSchema.parse({})).toThrow();
  });
});

// ============================================================================
// buildSkillManifest
// ============================================================================

describe('buildSkillManifest', () => {
  const makeReport = (
    guidances: MultiModelReport['guidances'],
  ): MultiModelReport => ({
    skillName: 'test-skill',
    guidances,
    summary: `${guidances.length} models evaluated`,
  });

  it('produces correct tested_models from report', () => {
    const report = makeReport([
      {
        chipName: 'gpt-4',
        tier: 'cloud',
        passRate: 0.95,
        status: 'passing',
        recommendations: ['Skill performs well'],
      },
      {
        chipName: 'llama-7b',
        tier: 'local-small',
        passRate: 0.30,
        status: 'failing',
        recommendations: ['Consider larger context model'],
      },
    ]);

    const manifest = buildSkillManifest('my-skill', '1.0.0', 'A skill', report);

    expect(manifest.tested_models).toHaveLength(2);
    expect(manifest.tested_models[0]).toEqual({
      chipName: 'gpt-4',
      tier: 'cloud',
      passRate: 0.95,
      status: 'passing',
    });
    expect(manifest.tested_models[1]).toEqual({
      chipName: 'llama-7b',
      tier: 'local-small',
      passRate: 0.30,
      status: 'failing',
    });
  });

  it('derives preferredTier from highest passRate model', () => {
    const report = makeReport([
      {
        chipName: 'local-model',
        tier: 'local-large',
        passRate: 0.60,
        status: 'marginal',
        recommendations: [],
      },
      {
        chipName: 'cloud-model',
        tier: 'cloud',
        passRate: 0.95,
        status: 'passing',
        recommendations: [],
      },
    ]);

    const manifest = buildSkillManifest('s', '1.0', 'd', report);
    expect(manifest.mesh_hints.preferredTier).toBe('cloud');
  });

  it('derives minimumPassRate from lowest passing model', () => {
    const report = makeReport([
      {
        chipName: 'a',
        tier: 'cloud',
        passRate: 0.95,
        status: 'passing',
        recommendations: [],
      },
      {
        chipName: 'b',
        tier: 'local-large',
        passRate: 0.76,
        status: 'passing',
        recommendations: [],
      },
      {
        chipName: 'c',
        tier: 'local-small',
        passRate: 0.30,
        status: 'failing',
        recommendations: [],
      },
    ]);

    const manifest = buildSkillManifest('s', '1.0', 'd', report);
    expect(manifest.mesh_hints.minimumPassRate).toBe(0.76);
  });

  it('defaults minimumPassRate to 0.50 when no models are passing', () => {
    const report = makeReport([
      {
        chipName: 'a',
        tier: 'cloud',
        passRate: 0.40,
        status: 'failing',
        recommendations: [],
      },
      {
        chipName: 'b',
        tier: 'local-small',
        passRate: 0.30,
        status: 'failing',
        recommendations: [],
      },
    ]);

    const manifest = buildSkillManifest('s', '1.0', 'd', report);
    expect(manifest.mesh_hints.minimumPassRate).toBe(0.50);
  });

  it('sets costSensitive true when a local model passes', () => {
    const report = makeReport([
      {
        chipName: 'local-good',
        tier: 'local-large',
        passRate: 0.80,
        status: 'passing',
        recommendations: [],
      },
      {
        chipName: 'cloud-good',
        tier: 'cloud',
        passRate: 0.95,
        status: 'passing',
        recommendations: [],
      },
    ]);

    const manifest = buildSkillManifest('s', '1.0', 'd', report);
    expect(manifest.mesh_hints.costSensitive).toBe(true);
  });

  it('sets costSensitive false when no local model passes', () => {
    const report = makeReport([
      {
        chipName: 'local-bad',
        tier: 'local-small',
        passRate: 0.30,
        status: 'failing',
        recommendations: [],
      },
      {
        chipName: 'cloud-good',
        tier: 'cloud',
        passRate: 0.95,
        status: 'passing',
        recommendations: [],
      },
    ]);

    const manifest = buildSkillManifest('s', '1.0', 'd', report);
    expect(manifest.mesh_hints.costSensitive).toBe(false);
  });

  it('handles empty guidances', () => {
    const report = makeReport([]);
    const manifest = buildSkillManifest('empty', '1.0', 'no models', report);

    expect(manifest.tested_models).toHaveLength(0);
    expect(manifest.mesh_hints.preferredTier).toBe('any');
    expect(manifest.mesh_hints.minimumPassRate).toBe(0.50);
    expect(manifest.mesh_hints.costSensitive).toBe(false);
  });

  it('handles all failing models', () => {
    const report = makeReport([
      {
        chipName: 'a',
        tier: 'cloud',
        passRate: 0.20,
        status: 'failing',
        recommendations: [],
      },
      {
        chipName: 'b',
        tier: 'local-large',
        passRate: 0.10,
        status: 'failing',
        recommendations: [],
      },
    ]);

    const manifest = buildSkillManifest('s', '1.0', 'd', report);
    expect(manifest.mesh_hints.minimumPassRate).toBe(0.50);
    expect(manifest.mesh_hints.costSensitive).toBe(false);
  });

  it('handles mixed tiers with local-small passing', () => {
    const report = makeReport([
      {
        chipName: 'tiny',
        tier: 'local-small',
        passRate: 0.80,
        status: 'passing',
        recommendations: [],
      },
    ]);

    const manifest = buildSkillManifest('s', '1.0', 'd', report);
    expect(manifest.mesh_hints.costSensitive).toBe(true);
    expect(manifest.mesh_hints.preferredTier).toBe('local-small');
  });

  it('sets metadata fields correctly', () => {
    const report = makeReport([]);
    const manifest = buildSkillManifest('name', '2.0', 'desc', report);

    expect(manifest.name).toBe('name');
    expect(manifest.version).toBe('2.0');
    expect(manifest.description).toBe('desc');
    expect(manifest.packagedBy).toBe('skill-creator');
    expect(manifest.createdAt).toBeTruthy();
    // createdAt should be a valid ISO string
    expect(new Date(manifest.createdAt).toISOString()).toBe(manifest.createdAt);
  });

  it('validates against SkillManifestSchema', () => {
    const report = makeReport([
      {
        chipName: 'test',
        tier: 'cloud',
        passRate: 0.90,
        status: 'passing',
        recommendations: [],
      },
    ]);
    const manifest = buildSkillManifest('s', '1.0', 'd', report);
    expect(() => SkillManifestSchema.parse(manifest)).not.toThrow();
  });
});
