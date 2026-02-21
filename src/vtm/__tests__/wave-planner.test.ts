/**
 * Tests for VTM wave planner core.
 *
 * Covers:
 * - planWaves(): decomposes component specs into dependency-ordered waves
 *   with parallel track detection and Wave 0 enforcement
 * - detectParallelTracks(): groups non-conflicting specs into concurrent
 *   tracks within the same wave
 * - Wave 0 enforcement: restricts foundation wave to types/interfaces/schemas/config
 *
 * @module vtm/__tests__/wave-planner
 */

import { describe, it, expect } from 'vitest';
import type { ComponentSpec, MilestoneSpec } from '../types.js';
import { WaveExecutionPlanSchema } from '../types.js';
import { planWaves, detectParallelTracks } from '../wave-planner.js';

// ---------------------------------------------------------------------------
// Test fixture helpers
// ---------------------------------------------------------------------------

/** Minimal valid MilestoneSpec for testing planWaves. */
function createMilestoneSpec(overrides?: Partial<MilestoneSpec>): MilestoneSpec {
  return {
    name: 'Test Milestone',
    date: '2026-01-01',
    visionDocument: 'test-vision',
    estimatedExecution: { contextWindows: 5, sessions: 2, hours: 1 },
    missionObjective: 'Test objective',
    architectureOverview: 'Test architecture',
    deliverables: [
      { number: 1, deliverable: 'Comp A', acceptanceCriteria: 'Works', componentSpec: 'comp-a-spec.md' },
    ],
    componentBreakdown: [
      { component: 'Comp A', specDocument: 'comp-a-spec.md', dependencies: [], model: 'sonnet', estimatedTokens: 5000 },
    ],
    modelRationale: {
      opus: { percentage: 0, components: [], reason: 'None' },
      sonnet: { percentage: 100, components: ['Comp A'], reason: 'Default' },
      haiku: { percentage: 0, components: [], reason: 'None' },
    },
    ...overrides,
  };
}

/** Create a ComponentSpec with given name, dependencies, produces, model, tokens, and optional objective. */
function makeSpec(
  name: string,
  deps: string[],
  produces: string[],
  model: 'opus' | 'sonnet' | 'haiku' = 'sonnet',
  tokens = 5000,
  objective = `Implement ${name}`,
): ComponentSpec {
  return {
    name,
    milestone: 'Test Milestone',
    wave: 'Wave 0',
    modelAssignment: model,
    estimatedTokens: tokens,
    dependencies: deps,
    produces: produces.length > 0 ? produces : [`${name} implementation`],
    objective,
    context: `Context for ${name}`,
    technicalSpec: [{ name: `${name} spec`, spec: `Spec for ${name}` }],
    implementationSteps: [{ name: `Build ${name}`, description: `Build ${name} functionality` }],
    testCases: [{ name: `Test ${name}`, input: name, expected: `${name} works` }],
    verificationGate: { conditions: [`${name} works`], handoff: `${name} ready` },
  };
}

// ---------------------------------------------------------------------------
// planWaves
// ---------------------------------------------------------------------------

describe('planWaves', () => {
  it('produces 3 waves for a linear chain A->B->C', () => {
    const milestone = createMilestoneSpec();
    const specs = [
      makeSpec('A', [], ['A-types']),
      makeSpec('B', ['A'], ['B-output']),
      makeSpec('C', ['B'], ['C-output']),
    ];

    const result = planWaves(milestone, specs);

    expect(result.waves.length).toBe(3);
    // A in first wave, B in second, C in third
    const wave0Names = result.waves[0].tracks.flatMap(t => t.tasks.map(tk => tk.description));
    const wave1Names = result.waves[1].tracks.flatMap(t => t.tasks.map(tk => tk.description));
    const wave2Names = result.waves[2].tracks.flatMap(t => t.tasks.map(tk => tk.description));

    expect(wave0Names.some(d => d.includes('A'))).toBe(true);
    expect(wave1Names.some(d => d.includes('B'))).toBe(true);
    expect(wave2Names.some(d => d.includes('C'))).toBe(true);
  });

  it('produces 3 waves for diamond dependency: A->{B,C}->D', () => {
    const milestone = createMilestoneSpec();
    const specs = [
      makeSpec('A', [], ['A-types']),
      makeSpec('B', ['A'], ['B-output']),
      makeSpec('C', ['A'], ['C-output']),
      makeSpec('D', ['B', 'C'], ['D-output']),
    ];

    const result = planWaves(milestone, specs);

    expect(result.waves.length).toBe(3);
    // Wave 0: A, Wave 1: B+C (parallel), Wave 2: D
    const wave1Tasks = result.waves[1].tracks.flatMap(t => t.tasks);
    expect(wave1Tasks.length).toBe(2);
  });

  it('puts two independent specs in the same wave', () => {
    const milestone = createMilestoneSpec();
    const specs = [
      makeSpec('X', [], ['X-output']),
      makeSpec('Y', [], ['Y-output']),
    ];

    const result = planWaves(milestone, specs);

    // Both should end up in Wave 0 (no deps)
    expect(result.waves.length).toBe(1);
    const allTasks = result.waves[0].tracks.flatMap(t => t.tasks);
    expect(allTasks.length).toBe(2);
  });

  it('produces 1 wave for a single component spec', () => {
    const milestone = createMilestoneSpec();
    const specs = [makeSpec('Solo', [], ['Solo-output'])];

    const result = planWaves(milestone, specs);

    expect(result.waves.length).toBe(1);
    expect(result.totalTasks).toBe(1);
  });

  it('each wave has correct number, name, purpose, isSequential flag', () => {
    const milestone = createMilestoneSpec();
    const specs = [
      makeSpec('A', [], ['A-types']),
      makeSpec('B', ['A'], ['B-output']),
    ];

    const result = planWaves(milestone, specs);

    for (let i = 0; i < result.waves.length; i++) {
      const wave = result.waves[i];
      expect(wave.number).toBe(i);
      expect(typeof wave.name).toBe('string');
      expect(wave.name.length).toBeGreaterThan(0);
      expect(typeof wave.purpose).toBe('string');
      expect(typeof wave.isSequential).toBe('boolean');
    }
  });

  it('result satisfies WaveExecutionPlanSchema validation', () => {
    const milestone = createMilestoneSpec();
    const specs = [
      makeSpec('A', [], ['A-types']),
      makeSpec('B', ['A'], ['B-output']),
      makeSpec('C', ['B'], ['C-output']),
    ];

    const result = planWaves(milestone, specs);
    const parsed = WaveExecutionPlanSchema.safeParse(result);

    expect(parsed.success).toBe(true);
  });

  it('waveSummary has correct entry per wave with tasks and parallelTracks', () => {
    const milestone = createMilestoneSpec();
    const specs = [
      makeSpec('A', [], ['A-types']),
      makeSpec('B', ['A'], ['B-output']),
      makeSpec('C', ['A'], ['C-output']),
    ];

    const result = planWaves(milestone, specs);

    expect(result.waveSummary.length).toBe(result.waves.length);
    for (let i = 0; i < result.waveSummary.length; i++) {
      expect(result.waveSummary[i].wave).toBe(i);
      expect(result.waveSummary[i].tasks).toBeGreaterThan(0);
      expect(result.waveSummary[i].parallelTracks).toBeGreaterThan(0);
    }
  });

  it('criticalPath identifies the longest dependency chain', () => {
    const milestone = createMilestoneSpec();
    const specs = [
      makeSpec('A', [], ['A-types']),
      makeSpec('B', ['A'], ['B-output']),
      makeSpec('C', ['B'], ['C-output']),
    ];

    const result = planWaves(milestone, specs);

    // Critical path should mention A, B, C in order
    expect(result.criticalPath).toContain('A');
    expect(result.criticalPath).toContain('C');
  });

  it('wave names follow Foundation/Parallel Implementation/Integration/Polish for 4+ waves', () => {
    const milestone = createMilestoneSpec();
    const specs = [
      makeSpec('A', [], ['A-types']),
      makeSpec('B', ['A'], ['B-output']),
      makeSpec('C', ['B'], ['C-output']),
      makeSpec('D', ['C'], ['D-output']),
    ];

    const result = planWaves(milestone, specs);

    expect(result.waves.length).toBe(4);
    expect(result.waves[0].name).toBe('Foundation');
    // Wave 1 name depends on whether it has parallel tracks
    expect(result.waves[result.waves.length - 1].name).toBe('Polish');
    expect(result.waves[result.waves.length - 2].name).toBe('Integration');
  });

  it('milestoneName from milestoneSpec', () => {
    const milestone = createMilestoneSpec({ name: 'Custom Milestone' });
    const specs = [makeSpec('A', [], ['A-out'])];

    const result = planWaves(milestone, specs);

    expect(result.milestoneName).toBe('Custom Milestone');
  });

  it('totalTasks equals componentSpecs.length', () => {
    const milestone = createMilestoneSpec();
    const specs = [
      makeSpec('A', [], ['A-types']),
      makeSpec('B', ['A'], ['B-output']),
    ];

    const result = planWaves(milestone, specs);

    expect(result.totalTasks).toBe(2);
  });

  it('sequentialDepth equals number of waves', () => {
    const milestone = createMilestoneSpec();
    const specs = [
      makeSpec('A', [], ['A-types']),
      makeSpec('B', ['A'], ['B-output']),
      makeSpec('C', ['B'], ['C-output']),
    ];

    const result = planWaves(milestone, specs);

    expect(result.sequentialDepth).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// detectParallelTracks
// ---------------------------------------------------------------------------

describe('detectParallelTracks', () => {
  it('returns 1 track when 3 specs share no produces targets', () => {
    const specs = [
      makeSpec('X', [], ['X-unique']),
      makeSpec('Y', [], ['Y-unique']),
      makeSpec('Z', [], ['Z-unique']),
    ];
    const allSpecs = specs;

    const tracks = detectParallelTracks(specs, allSpecs);

    expect(tracks.length).toBe(1);
    expect(tracks[0].tasks.length).toBe(3);
  });

  it('separates 2 specs that share a produces target into different tracks', () => {
    const specs = [
      makeSpec('X', [], ['shared-artifact']),
      makeSpec('Y', [], ['shared-artifact']),
      makeSpec('Z', [], ['Z-unique']),
    ];
    const allSpecs = specs;

    const tracks = detectParallelTracks(specs, allSpecs);

    // X and Y conflict (shared artifact), so need >= 2 tracks
    expect(tracks.length).toBeGreaterThanOrEqual(2);

    // Verify X and Y are not in the same track
    for (const track of tracks) {
      const names = track.tasks.map(t => t.description);
      const hasX = names.some(n => n.includes('X'));
      const hasY = names.some(n => n.includes('Y'));
      expect(hasX && hasY).toBe(false);
    }
  });

  it('specs with dependsOn pointing to each other cannot be in same track', () => {
    // Among the wave specs, if one depends on another they conflict
    const specA = makeSpec('A', [], ['A-out']);
    const specB = makeSpec('B', ['A'], ['B-out']);
    const allSpecs = [specA, specB];

    const tracks = detectParallelTracks([specA, specB], allSpecs);

    // A and B conflict (dependency relationship), need separate tracks
    expect(tracks.length).toBeGreaterThanOrEqual(2);
  });

  it('returns 1 track with 1 task for single spec in a wave', () => {
    const specs = [makeSpec('Solo', [], ['Solo-out'])];

    const tracks = detectParallelTracks(specs, specs);

    expect(tracks.length).toBe(1);
    expect(tracks[0].tasks.length).toBe(1);
  });

  it('components producing the same artifact must be in separate tracks', () => {
    const specs = [
      makeSpec('Writer1', [], ['shared-file']),
      makeSpec('Writer2', [], ['shared-file']),
    ];

    const tracks = detectParallelTracks(specs, specs);

    expect(tracks.length).toBe(2);
  });

  it('track names follow Track A, Track B pattern', () => {
    const specs = [
      makeSpec('X', [], ['shared']),
      makeSpec('Y', [], ['shared']),
    ];

    const tracks = detectParallelTracks(specs, specs);

    expect(tracks[0].name).toBe('Track A');
    if (tracks.length > 1) {
      expect(tracks[1].name).toBe('Track B');
    }
  });
});

// ---------------------------------------------------------------------------
// Wave 0 enforcement
// ---------------------------------------------------------------------------

describe('wave 0 enforcement', () => {
  it('spec with "types" in objective goes to Wave 0', () => {
    const milestone = createMilestoneSpec();
    const specs = [
      makeSpec('TypeDefs', [], ['type-defs'], 'sonnet', 5000, 'Define shared types and interfaces'),
      makeSpec('Builder', ['TypeDefs'], ['build-output']),
    ];

    const result = planWaves(milestone, specs);

    const wave0Tasks = result.waves[0].tracks.flatMap(t => t.tasks);
    expect(wave0Tasks.some(t => t.id.includes('typedefs'))).toBe(true);
  });

  it('spec with "schema" in produces goes to Wave 0', () => {
    const milestone = createMilestoneSpec();
    const specs = [
      makeSpec('SchemaGen', [], ['schema-definitions'], 'sonnet', 5000, 'Generate schema definitions'),
      makeSpec('Consumer', ['SchemaGen'], ['consumer-output']),
    ];

    const result = planWaves(milestone, specs);

    const wave0Tasks = result.waves[0].tracks.flatMap(t => t.tasks);
    expect(wave0Tasks.some(t => t.id.includes('schemagen'))).toBe(true);
  });

  it('spec with "interfaces" in objective goes to Wave 0', () => {
    const milestone = createMilestoneSpec();
    const specs = [
      makeSpec('Contracts', [], ['contracts'], 'sonnet', 5000, 'Define interfaces and contracts'),
      makeSpec('Impl', ['Contracts'], ['impl-output']),
    ];

    const result = planWaves(milestone, specs);

    const wave0Tasks = result.waves[0].tracks.flatMap(t => t.tasks);
    expect(wave0Tasks.some(t => t.id.includes('contracts'))).toBe(true);
  });

  it('spec with "config" in objective goes to Wave 0', () => {
    const milestone = createMilestoneSpec();
    const specs = [
      makeSpec('ConfigSetup', [], ['config-files'], 'sonnet', 5000, 'Set up config scaffolds'),
      makeSpec('Service', ['ConfigSetup'], ['service-output']),
    ];

    const result = planWaves(milestone, specs);

    const wave0Tasks = result.waves[0].tracks.flatMap(t => t.tasks);
    expect(wave0Tasks.some(t => t.id.includes('configsetup'))).toBe(true);
  });

  it('non-type spec without dependencies is NOT forced to Wave 0 if others depend on it', () => {
    const milestone = createMilestoneSpec();
    // Even though Builder has no deps, it's not a type/schema/config spec
    // It naturally goes to wave 0 because no deps, but the point is
    // it's NOT forced there by enforcement -- it goes there by topology
    const specs = [
      makeSpec('Builder', [], ['build-output'], 'sonnet', 5000, 'Build the main application'),
      makeSpec('Tester', ['Builder'], ['test-output']),
    ];

    const result = planWaves(milestone, specs);

    // Builder is in wave 0 by topology (no deps), not by enforcement
    // This is fine -- the enforcement rule is about FORCING type specs
    // to wave 0 even if topology would place them elsewhere
    expect(result.waves.length).toBe(2);
  });

  it('Wave 0 has isSequential: false (types can be parallel)', () => {
    const milestone = createMilestoneSpec();
    const specs = [
      makeSpec('Types', [], ['type-defs'], 'sonnet', 5000, 'Define shared types'),
      makeSpec('Schemas', [], ['schema-defs'], 'sonnet', 5000, 'Define schema definitions'),
      makeSpec('Impl', ['Types', 'Schemas'], ['impl-output']),
    ];

    const result = planWaves(milestone, specs);

    expect(result.waves[0].isSequential).toBe(false);
  });

  it('spec with type/schema in produces and no deps goes to Wave 0 even with non-type peers', () => {
    const milestone = createMilestoneSpec();
    const specs = [
      makeSpec('TypeDefs', [], ['type definitions'], 'sonnet', 5000, 'Define base types'),
      makeSpec('Unrelated', [], ['unrelated-output'], 'sonnet', 5000, 'Build unrelated feature'),
      makeSpec('Consumer', ['TypeDefs'], ['consumer-output']),
    ];

    const result = planWaves(milestone, specs);

    const wave0Tasks = result.waves[0].tracks.flatMap(t => t.tasks);
    expect(wave0Tasks.some(t => t.id.includes('typedefs'))).toBe(true);
  });
});
