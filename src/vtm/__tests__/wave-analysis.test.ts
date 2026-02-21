/**
 * Tests for VTM wave analysis functions.
 *
 * Covers:
 * - generateDependencyGraph(): produces ASCII DAG with critical path marked
 * - computeSequentialSavings(): calculates wall-time savings of parallel execution
 * - analyzeRiskFactors(): identifies cache TTL, interface mismatch, and model capacity risks
 *
 * @module vtm/__tests__/wave-analysis
 */

import { describe, it, expect } from 'vitest';
import type { WaveExecutionPlan, ComponentSpec } from '../types.js';
import {
  generateDependencyGraph,
  computeSequentialSavings,
  analyzeRiskFactors,
} from '../wave-analysis.js';

// ---------------------------------------------------------------------------
// Test fixture helpers
// ---------------------------------------------------------------------------

/** Create a minimal valid WaveExecutionPlan for testing. */
function createPlan(overrides?: Partial<WaveExecutionPlan>): WaveExecutionPlan {
  return {
    milestoneName: 'Test Milestone',
    milestoneSpec: 'milestone-spec.md',
    totalTasks: 1,
    parallelTracks: 1,
    sequentialDepth: 1,
    estimatedWallTime: '5 min',
    criticalPath: 'A',
    waveSummary: [
      { wave: 0, tasks: 1, parallelTracks: 1, estimatedTime: '5 min', cacheDependencies: 'None' },
    ],
    waves: [
      {
        number: 0,
        name: 'Foundation',
        purpose: 'Execute A',
        isSequential: false,
        tracks: [
          {
            name: 'Track A',
            tasks: [
              { id: 'task-a', description: 'Implement A', produces: 'A types', model: 'sonnet', estimatedTokens: 5000, dependsOn: [] },
            ],
          },
        ],
      },
    ],
    ...overrides,
  };
}

/** Create a ComponentSpec test fixture. */
function makeSpec(
  name: string,
  deps: string[],
  produces: string[],
  model: 'opus' | 'sonnet' | 'haiku' = 'sonnet',
  tokens = 5000,
): ComponentSpec {
  return {
    name,
    milestone: 'Test Milestone',
    wave: 'Wave 0',
    modelAssignment: model,
    estimatedTokens: tokens,
    dependencies: deps,
    produces: produces.length > 0 ? produces : [`${name} implementation`],
    objective: `Implement ${name}`,
    context: `Context for ${name}`,
    technicalSpec: [{ name: `${name} spec`, spec: `Spec for ${name}` }],
    implementationSteps: [{ name: `Build ${name}`, description: `Build ${name} functionality` }],
    testCases: [{ name: `Test ${name}`, input: name, expected: `${name} works` }],
    verificationGate: { conditions: [`${name} works`], handoff: `${name} ready` },
  };
}

// ---------------------------------------------------------------------------
// generateDependencyGraph
// ---------------------------------------------------------------------------

describe('generateDependencyGraph', () => {
  it('linear chain A->B->C produces ASCII DAG with arrows', () => {
    const plan = createPlan({
      totalTasks: 3,
      sequentialDepth: 3,
      criticalPath: 'A -> B -> C',
      waveSummary: [
        { wave: 0, tasks: 1, parallelTracks: 1, estimatedTime: '5 min', cacheDependencies: 'None' },
        { wave: 1, tasks: 1, parallelTracks: 1, estimatedTime: '5 min', cacheDependencies: 'Wave 0' },
        { wave: 2, tasks: 1, parallelTracks: 1, estimatedTime: '5 min', cacheDependencies: 'Wave 0, Wave 1' },
      ],
      waves: [
        {
          number: 0, name: 'Foundation', purpose: 'Execute A', isSequential: false,
          tracks: [{ name: 'Track A', tasks: [
            { id: 'task-a', description: 'Implement A', produces: 'A types', model: 'sonnet', estimatedTokens: 5000, dependsOn: [] },
          ] }],
        },
        {
          number: 1, name: 'Wave 1', purpose: 'Execute B', isSequential: false,
          tracks: [{ name: 'Track A', tasks: [
            { id: 'task-b', description: 'Implement B', produces: 'B output', model: 'sonnet', estimatedTokens: 5000, dependsOn: ['A'] },
          ] }],
        },
        {
          number: 2, name: 'Wave 2', purpose: 'Execute C', isSequential: false,
          tracks: [{ name: 'Track A', tasks: [
            { id: 'task-c', description: 'Implement C', produces: 'C output', model: 'sonnet', estimatedTokens: 5000, dependsOn: ['B'] },
          ] }],
        },
      ],
    });

    const result = generateDependencyGraph(plan);

    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain('\n');
    // Should show task IDs or descriptions
    expect(result).toContain('task-a');
    expect(result).toContain('task-b');
    expect(result).toContain('task-c');
  });

  it('diamond pattern A->{B,C}->D shows fork and join', () => {
    const plan = createPlan({
      totalTasks: 4,
      sequentialDepth: 3,
      criticalPath: 'A -> B -> D',
      waveSummary: [
        { wave: 0, tasks: 1, parallelTracks: 1, estimatedTime: '5 min', cacheDependencies: 'None' },
        { wave: 1, tasks: 2, parallelTracks: 2, estimatedTime: '5 min', cacheDependencies: 'Wave 0' },
        { wave: 2, tasks: 1, parallelTracks: 1, estimatedTime: '5 min', cacheDependencies: 'Wave 0, Wave 1' },
      ],
      waves: [
        {
          number: 0, name: 'Foundation', purpose: 'Execute A', isSequential: false,
          tracks: [{ name: 'Track A', tasks: [
            { id: 'task-a', description: 'Implement A', produces: 'A types', model: 'sonnet', estimatedTokens: 5000, dependsOn: [] },
          ] }],
        },
        {
          number: 1, name: 'Parallel Implementation', purpose: 'Execute B and C', isSequential: false,
          tracks: [
            { name: 'Track A', tasks: [
              { id: 'task-b', description: 'Implement B', produces: 'B output', model: 'sonnet', estimatedTokens: 5000, dependsOn: ['A'] },
            ] },
            { name: 'Track B', tasks: [
              { id: 'task-c', description: 'Implement C', produces: 'C output', model: 'sonnet', estimatedTokens: 5000, dependsOn: ['A'] },
            ] },
          ],
        },
        {
          number: 2, name: 'Integration', purpose: 'Execute D', isSequential: false,
          tracks: [{ name: 'Track A', tasks: [
            { id: 'task-d', description: 'Implement D', produces: 'D output', model: 'sonnet', estimatedTokens: 5000, dependsOn: ['B', 'C'] },
          ] }],
        },
      ],
    });

    const result = generateDependencyGraph(plan);

    expect(result).toContain('task-a');
    expect(result).toContain('task-b');
    expect(result).toContain('task-c');
    expect(result).toContain('task-d');
  });

  it('single task produces single node', () => {
    const plan = createPlan();

    const result = generateDependencyGraph(plan);

    expect(result).toContain('task-a');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('parallel tracks (A and B independent, both feed C) shows convergence', () => {
    const plan = createPlan({
      totalTasks: 3,
      sequentialDepth: 2,
      criticalPath: 'A -> C',
      waveSummary: [
        { wave: 0, tasks: 2, parallelTracks: 2, estimatedTime: '5 min', cacheDependencies: 'None' },
        { wave: 1, tasks: 1, parallelTracks: 1, estimatedTime: '5 min', cacheDependencies: 'Wave 0' },
      ],
      waves: [
        {
          number: 0, name: 'Foundation', purpose: 'Execute A and B', isSequential: false,
          tracks: [
            { name: 'Track A', tasks: [
              { id: 'task-a', description: 'Implement A', produces: 'A output', model: 'sonnet', estimatedTokens: 5000, dependsOn: [] },
            ] },
            { name: 'Track B', tasks: [
              { id: 'task-b', description: 'Implement B', produces: 'B output', model: 'sonnet', estimatedTokens: 5000, dependsOn: [] },
            ] },
          ],
        },
        {
          number: 1, name: 'Wave 1', purpose: 'Execute C', isSequential: false,
          tracks: [{ name: 'Track A', tasks: [
            { id: 'task-c', description: 'Implement C', produces: 'C output', model: 'sonnet', estimatedTokens: 5000, dependsOn: ['A', 'B'] },
          ] }],
        },
      ],
    });

    const result = generateDependencyGraph(plan);

    expect(result).toContain('task-a');
    expect(result).toContain('task-b');
    expect(result).toContain('task-c');
  });

  it('critical path is visually distinguished', () => {
    const plan = createPlan({
      totalTasks: 3,
      sequentialDepth: 3,
      criticalPath: 'A -> B -> C',
      waveSummary: [
        { wave: 0, tasks: 1, parallelTracks: 1, estimatedTime: '5 min', cacheDependencies: 'None' },
        { wave: 1, tasks: 1, parallelTracks: 1, estimatedTime: '5 min', cacheDependencies: 'Wave 0' },
        { wave: 2, tasks: 1, parallelTracks: 1, estimatedTime: '5 min', cacheDependencies: 'Wave 0, Wave 1' },
      ],
      waves: [
        {
          number: 0, name: 'Foundation', purpose: 'Execute A', isSequential: false,
          tracks: [{ name: 'Track A', tasks: [
            { id: 'task-a', description: 'Implement A', produces: 'A types', model: 'sonnet', estimatedTokens: 5000, dependsOn: [] },
          ] }],
        },
        {
          number: 1, name: 'Wave 1', purpose: 'Execute B', isSequential: false,
          tracks: [{ name: 'Track A', tasks: [
            { id: 'task-b', description: 'Implement B', produces: 'B output', model: 'sonnet', estimatedTokens: 5000, dependsOn: ['A'] },
          ] }],
        },
        {
          number: 2, name: 'Wave 2', purpose: 'Execute C', isSequential: false,
          tracks: [{ name: 'Track A', tasks: [
            { id: 'task-c', description: 'Implement C', produces: 'C output', model: 'sonnet', estimatedTokens: 5000, dependsOn: ['B'] },
          ] }],
        },
      ],
    });

    const result = generateDependencyGraph(plan);

    // Critical path should be marked with asterisks or [CRITICAL] or similar
    expect(result.includes('*') || result.toLowerCase().includes('critical')).toBe(true);
  });

  it('output contains wave headers', () => {
    const plan = createPlan({
      totalTasks: 2,
      sequentialDepth: 2,
      criticalPath: 'A -> B',
      waveSummary: [
        { wave: 0, tasks: 1, parallelTracks: 1, estimatedTime: '5 min', cacheDependencies: 'None' },
        { wave: 1, tasks: 1, parallelTracks: 1, estimatedTime: '5 min', cacheDependencies: 'Wave 0' },
      ],
      waves: [
        {
          number: 0, name: 'Foundation', purpose: 'Execute A', isSequential: false,
          tracks: [{ name: 'Track A', tasks: [
            { id: 'task-a', description: 'Implement A', produces: 'A types', model: 'sonnet', estimatedTokens: 5000, dependsOn: [] },
          ] }],
        },
        {
          number: 1, name: 'Wave 1', purpose: 'Execute B', isSequential: false,
          tracks: [{ name: 'Track A', tasks: [
            { id: 'task-b', description: 'Implement B', produces: 'B output', model: 'sonnet', estimatedTokens: 5000, dependsOn: ['A'] },
          ] }],
        },
      ],
    });

    const result = generateDependencyGraph(plan);

    // Should contain wave section headers
    expect(result).toContain('Wave 0');
    expect(result).toContain('Wave 1');
  });
});

// ---------------------------------------------------------------------------
// computeSequentialSavings
// ---------------------------------------------------------------------------

describe('computeSequentialSavings', () => {
  it('3 waves, wave 1 has 2 parallel tracks each 30min: parallel time < sequential time', () => {
    const plan = createPlan({
      totalTasks: 4,
      sequentialDepth: 3,
      criticalPath: 'A -> B -> D',
      waveSummary: [
        { wave: 0, tasks: 1, parallelTracks: 1, estimatedTime: '5 min', cacheDependencies: 'None' },
        { wave: 1, tasks: 2, parallelTracks: 2, estimatedTime: '5 min', cacheDependencies: 'Wave 0' },
        { wave: 2, tasks: 1, parallelTracks: 1, estimatedTime: '5 min', cacheDependencies: 'Wave 0, Wave 1' },
      ],
      waves: [
        {
          number: 0, name: 'Foundation', purpose: 'Execute A', isSequential: false,
          tracks: [{ name: 'Track A', tasks: [
            { id: 'task-a', description: 'Implement A', produces: 'A types', model: 'sonnet', estimatedTokens: 30000, dependsOn: [] },
          ] }],
        },
        {
          number: 1, name: 'Parallel Implementation', purpose: 'Execute B and C', isSequential: false,
          tracks: [
            { name: 'Track A', tasks: [
              { id: 'task-b', description: 'Implement B', produces: 'B output', model: 'sonnet', estimatedTokens: 30000, dependsOn: ['A'] },
            ] },
            { name: 'Track B', tasks: [
              { id: 'task-c', description: 'Implement C', produces: 'C output', model: 'sonnet', estimatedTokens: 30000, dependsOn: ['A'] },
            ] },
          ],
        },
        {
          number: 2, name: 'Integration', purpose: 'Execute D', isSequential: false,
          tracks: [{ name: 'Track A', tasks: [
            { id: 'task-d', description: 'Implement D', produces: 'D output', model: 'sonnet', estimatedTokens: 30000, dependsOn: ['B', 'C'] },
          ] }],
        },
      ],
    });

    const result = computeSequentialSavings(plan);

    expect(typeof result.sequentialTime).toBe('string');
    expect(typeof result.parallelTime).toBe('string');
    expect(typeof result.savedTime).toBe('string');
    expect(typeof result.speedupFactor).toBe('number');
    expect(result.speedupFactor).toBeGreaterThan(1.0);
  });

  it('single wave single track: speedupFactor = 1.0', () => {
    const plan = createPlan();

    const result = computeSequentialSavings(plan);

    expect(result.speedupFactor).toBe(1.0);
  });

  it('4 waves, wave 2 has 3 tracks: savings > 0', () => {
    const plan = createPlan({
      totalTasks: 6,
      sequentialDepth: 4,
      criticalPath: 'A -> B -> E -> F',
      waveSummary: [
        { wave: 0, tasks: 1, parallelTracks: 1, estimatedTime: '5 min', cacheDependencies: 'None' },
        { wave: 1, tasks: 1, parallelTracks: 1, estimatedTime: '5 min', cacheDependencies: 'Wave 0' },
        { wave: 2, tasks: 3, parallelTracks: 3, estimatedTime: '5 min', cacheDependencies: 'Wave 0, Wave 1' },
        { wave: 3, tasks: 1, parallelTracks: 1, estimatedTime: '5 min', cacheDependencies: 'Wave 0, Wave 1, Wave 2' },
      ],
      waves: [
        {
          number: 0, name: 'Foundation', purpose: 'Execute A', isSequential: false,
          tracks: [{ name: 'Track A', tasks: [
            { id: 'task-a', description: 'Implement A', produces: 'A types', model: 'sonnet', estimatedTokens: 10000, dependsOn: [] },
          ] }],
        },
        {
          number: 1, name: 'Wave 1', purpose: 'Execute B', isSequential: false,
          tracks: [{ name: 'Track A', tasks: [
            { id: 'task-b', description: 'Implement B', produces: 'B output', model: 'sonnet', estimatedTokens: 10000, dependsOn: ['A'] },
          ] }],
        },
        {
          number: 2, name: 'Parallel Implementation', purpose: 'Execute C, D, E', isSequential: false,
          tracks: [
            { name: 'Track A', tasks: [
              { id: 'task-c', description: 'Implement C', produces: 'C output', model: 'sonnet', estimatedTokens: 10000, dependsOn: ['B'] },
            ] },
            { name: 'Track B', tasks: [
              { id: 'task-d', description: 'Implement D', produces: 'D output', model: 'sonnet', estimatedTokens: 10000, dependsOn: ['B'] },
            ] },
            { name: 'Track C', tasks: [
              { id: 'task-e', description: 'Implement E', produces: 'E output', model: 'sonnet', estimatedTokens: 10000, dependsOn: ['B'] },
            ] },
          ],
        },
        {
          number: 3, name: 'Polish', purpose: 'Execute F', isSequential: false,
          tracks: [{ name: 'Track A', tasks: [
            { id: 'task-f', description: 'Implement F', produces: 'F output', model: 'sonnet', estimatedTokens: 10000, dependsOn: ['C', 'D', 'E'] },
          ] }],
        },
      ],
    });

    const result = computeSequentialSavings(plan);

    expect(result.speedupFactor).toBeGreaterThan(1.0);
    // savedTime should be a non-empty string
    expect(result.savedTime.length).toBeGreaterThan(0);
  });

  it('all times are human-readable strings', () => {
    const plan = createPlan({
      totalTasks: 3,
      sequentialDepth: 2,
      criticalPath: 'A -> C',
      waveSummary: [
        { wave: 0, tasks: 2, parallelTracks: 2, estimatedTime: '5 min', cacheDependencies: 'None' },
        { wave: 1, tasks: 1, parallelTracks: 1, estimatedTime: '5 min', cacheDependencies: 'Wave 0' },
      ],
      waves: [
        {
          number: 0, name: 'Foundation', purpose: 'Execute A and B', isSequential: false,
          tracks: [
            { name: 'Track A', tasks: [
              { id: 'task-a', description: 'Implement A', produces: 'A output', model: 'sonnet', estimatedTokens: 150000, dependsOn: [] },
            ] },
            { name: 'Track B', tasks: [
              { id: 'task-b', description: 'Implement B', produces: 'B output', model: 'sonnet', estimatedTokens: 60000, dependsOn: [] },
            ] },
          ],
        },
        {
          number: 1, name: 'Wave 1', purpose: 'Execute C', isSequential: false,
          tracks: [{ name: 'Track A', tasks: [
            { id: 'task-c', description: 'Implement C', produces: 'C output', model: 'sonnet', estimatedTokens: 30000, dependsOn: ['A', 'B'] },
          ] }],
        },
      ],
    });

    const result = computeSequentialSavings(plan);

    // Times should be human readable (e.g., "2h 30min", "45min")
    expect(result.sequentialTime).toMatch(/\d+(h\s)?\d*min/);
    expect(result.parallelTime).toMatch(/\d+(h\s)?\d*min/);
  });

  it('speedupFactor is rounded to 1 decimal', () => {
    const plan = createPlan({
      totalTasks: 3,
      sequentialDepth: 2,
      criticalPath: 'A -> C',
      waveSummary: [
        { wave: 0, tasks: 2, parallelTracks: 2, estimatedTime: '5 min', cacheDependencies: 'None' },
        { wave: 1, tasks: 1, parallelTracks: 1, estimatedTime: '5 min', cacheDependencies: 'Wave 0' },
      ],
      waves: [
        {
          number: 0, name: 'Foundation', purpose: 'Execute A and B', isSequential: false,
          tracks: [
            { name: 'Track A', tasks: [
              { id: 'task-a', description: 'Implement A', produces: 'A output', model: 'sonnet', estimatedTokens: 30000, dependsOn: [] },
            ] },
            { name: 'Track B', tasks: [
              { id: 'task-b', description: 'Implement B', produces: 'B output', model: 'sonnet', estimatedTokens: 30000, dependsOn: [] },
            ] },
          ],
        },
        {
          number: 1, name: 'Wave 1', purpose: 'Execute C', isSequential: false,
          tracks: [{ name: 'Track A', tasks: [
            { id: 'task-c', description: 'Implement C', produces: 'C output', model: 'sonnet', estimatedTokens: 30000, dependsOn: ['A', 'B'] },
          ] }],
        },
      ],
    });

    const result = computeSequentialSavings(plan);

    // speedupFactor should be rounded to 1 decimal
    const decimals = result.speedupFactor.toString().split('.')[1]?.length ?? 0;
    expect(decimals).toBeLessThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// analyzeRiskFactors
// ---------------------------------------------------------------------------

describe('analyzeRiskFactors', () => {
  it('flags Cache TTL Exceedance when Wave 0 has > 300000 estimated tokens', () => {
    const plan = createPlan({
      totalTasks: 2,
      sequentialDepth: 2,
      criticalPath: 'A -> B',
      waveSummary: [
        { wave: 0, tasks: 1, parallelTracks: 1, estimatedTime: '10 min', cacheDependencies: 'None' },
        { wave: 1, tasks: 1, parallelTracks: 1, estimatedTime: '5 min', cacheDependencies: 'Wave 0' },
      ],
      waves: [
        {
          number: 0, name: 'Foundation', purpose: 'Execute A', isSequential: false,
          tracks: [{ name: 'Track A', tasks: [
            { id: 'task-a', description: 'Implement A', produces: 'A types', model: 'sonnet', estimatedTokens: 350000, dependsOn: [] },
          ] }],
        },
        {
          number: 1, name: 'Wave 1', purpose: 'Execute B', isSequential: false,
          tracks: [{ name: 'Track A', tasks: [
            { id: 'task-b', description: 'Implement B', produces: 'B output', model: 'sonnet', estimatedTokens: 5000, dependsOn: ['A'] },
          ] }],
        },
      ],
    });

    const specs = [
      makeSpec('A', [], ['A types'], 'sonnet', 350000),
      makeSpec('B', ['A'], ['B output'], 'sonnet', 5000),
    ];

    const risks = analyzeRiskFactors(plan, specs);

    const cacheTTL = risks.find(r => r.risk === 'Cache TTL Exceedance');
    expect(cacheTTL).toBeDefined();
    expect(cacheTTL!.impact.length).toBeGreaterThan(0);
    expect(cacheTTL!.mitigation).toMatch(/split|pre-comput/i);
  });

  it('flags Interface Mismatch when producer and consumer are 2+ waves apart', () => {
    const plan = createPlan({
      totalTasks: 3,
      sequentialDepth: 3,
      criticalPath: 'A -> B -> C',
      waveSummary: [
        { wave: 0, tasks: 1, parallelTracks: 1, estimatedTime: '5 min', cacheDependencies: 'None' },
        { wave: 1, tasks: 1, parallelTracks: 1, estimatedTime: '5 min', cacheDependencies: 'Wave 0' },
        { wave: 2, tasks: 1, parallelTracks: 1, estimatedTime: '5 min', cacheDependencies: 'Wave 0, Wave 1' },
      ],
      waves: [
        {
          number: 0, name: 'Foundation', purpose: 'Execute A', isSequential: false,
          tracks: [{ name: 'Track A', tasks: [
            { id: 'task-a', description: 'Implement A', produces: 'A types', model: 'sonnet', estimatedTokens: 5000, dependsOn: [] },
          ] }],
        },
        {
          number: 1, name: 'Wave 1', purpose: 'Execute B', isSequential: false,
          tracks: [{ name: 'Track A', tasks: [
            { id: 'task-b', description: 'Implement B', produces: 'B output', model: 'sonnet', estimatedTokens: 5000, dependsOn: ['A'] },
          ] }],
        },
        {
          number: 2, name: 'Wave 2', purpose: 'Execute C', isSequential: false,
          tracks: [{ name: 'Track A', tasks: [
            { id: 'task-c', description: 'Implement C', produces: 'C output', model: 'sonnet', estimatedTokens: 5000, dependsOn: ['A'] },
          ] }],
        },
      ],
    });

    // C depends on A, and they are 2 waves apart (Wave 0 and Wave 2)
    const specs = [
      makeSpec('A', [], ['A types'], 'sonnet', 5000),
      makeSpec('B', ['A'], ['B output'], 'sonnet', 5000),
      makeSpec('C', ['A'], ['C output'], 'sonnet', 5000),
    ];

    const risks = analyzeRiskFactors(plan, specs);

    const mismatch = risks.find(r => r.risk === 'Interface Mismatch');
    expect(mismatch).toBeDefined();
    expect(mismatch!.impact).toContain('A');
    expect(mismatch!.impact).toContain('C');
    expect(mismatch!.mitigation).toMatch(/contract\s*test/i);
  });

  it('flags Model Capacity when component has estimatedTokens > 100000', () => {
    const plan = createPlan();

    const specs = [
      makeSpec('HugeComponent', [], ['huge output'], 'opus', 150000),
    ];

    const risks = analyzeRiskFactors(plan, specs);

    const capacity = risks.find(r => r.risk === 'Model Capacity');
    expect(capacity).toBeDefined();
    expect(capacity!.impact).toContain('HugeComponent');
    expect(capacity!.mitigation).toMatch(/split|sub-task|larger/i);
  });

  it('returns empty array when no risks detected', () => {
    const plan = createPlan();

    const specs = [
      makeSpec('SmallComp', [], ['output'], 'sonnet', 5000),
    ];

    const risks = analyzeRiskFactors(plan, specs);

    expect(risks).toEqual([]);
  });

  it('each risk object has non-empty risk, impact, and mitigation strings', () => {
    const plan = createPlan({
      totalTasks: 2,
      sequentialDepth: 2,
      waves: [
        {
          number: 0, name: 'Foundation', purpose: 'Execute A', isSequential: false,
          tracks: [{ name: 'Track A', tasks: [
            { id: 'task-a', description: 'Implement A', produces: 'A types', model: 'sonnet', estimatedTokens: 350000, dependsOn: [] },
          ] }],
        },
        {
          number: 1, name: 'Wave 1', purpose: 'Execute B', isSequential: false,
          tracks: [{ name: 'Track A', tasks: [
            { id: 'task-b', description: 'Implement B', produces: 'B output', model: 'opus', estimatedTokens: 150000, dependsOn: ['A'] },
          ] }],
        },
      ],
      waveSummary: [
        { wave: 0, tasks: 1, parallelTracks: 1, estimatedTime: '10 min', cacheDependencies: 'None' },
        { wave: 1, tasks: 1, parallelTracks: 1, estimatedTime: '5 min', cacheDependencies: 'Wave 0' },
      ],
    });

    const specs = [
      makeSpec('A', [], ['A types'], 'sonnet', 350000),
      makeSpec('B', ['A'], ['B output'], 'opus', 150000),
    ];

    const risks = analyzeRiskFactors(plan, specs);

    expect(risks.length).toBeGreaterThan(0);
    for (const risk of risks) {
      expect(risk.risk.length).toBeGreaterThan(0);
      expect(risk.impact.length).toBeGreaterThan(0);
      expect(risk.mitigation.length).toBeGreaterThan(0);
    }
  });

  it('Cache TTL mitigation mentions splitting or pre-computing', () => {
    const plan = createPlan({
      waves: [
        {
          number: 0, name: 'Foundation', purpose: 'Execute A', isSequential: false,
          tracks: [{ name: 'Track A', tasks: [
            { id: 'task-a', description: 'Implement A', produces: 'A types', model: 'sonnet', estimatedTokens: 400000, dependsOn: [] },
          ] }],
        },
      ],
      waveSummary: [
        { wave: 0, tasks: 1, parallelTracks: 1, estimatedTime: '10 min', cacheDependencies: 'None' },
      ],
    });

    const specs = [makeSpec('A', [], ['A types'], 'sonnet', 400000)];

    const risks = analyzeRiskFactors(plan, specs);
    const cacheTTL = risks.find(r => r.risk === 'Cache TTL Exceedance');
    expect(cacheTTL).toBeDefined();
    expect(cacheTTL!.mitigation).toMatch(/split|pre-comput/i);
  });

  it('Interface mismatch mitigation mentions contract testing', () => {
    const plan = createPlan({
      totalTasks: 3,
      sequentialDepth: 3,
      waves: [
        {
          number: 0, name: 'Foundation', purpose: 'Execute A', isSequential: false,
          tracks: [{ name: 'Track A', tasks: [
            { id: 'task-a', description: 'Implement A', produces: 'A types', model: 'sonnet', estimatedTokens: 5000, dependsOn: [] },
          ] }],
        },
        {
          number: 1, name: 'Wave 1', purpose: 'Execute B', isSequential: false,
          tracks: [{ name: 'Track A', tasks: [
            { id: 'task-b', description: 'Implement B', produces: 'B output', model: 'sonnet', estimatedTokens: 5000, dependsOn: ['A'] },
          ] }],
        },
        {
          number: 2, name: 'Wave 2', purpose: 'Execute C', isSequential: false,
          tracks: [{ name: 'Track A', tasks: [
            { id: 'task-c', description: 'Implement C', produces: 'C output', model: 'sonnet', estimatedTokens: 5000, dependsOn: ['A'] },
          ] }],
        },
      ],
      waveSummary: [
        { wave: 0, tasks: 1, parallelTracks: 1, estimatedTime: '5 min', cacheDependencies: 'None' },
        { wave: 1, tasks: 1, parallelTracks: 1, estimatedTime: '5 min', cacheDependencies: 'Wave 0' },
        { wave: 2, tasks: 1, parallelTracks: 1, estimatedTime: '5 min', cacheDependencies: 'Wave 0, Wave 1' },
      ],
    });

    const specs = [
      makeSpec('A', [], ['A types'], 'sonnet', 5000),
      makeSpec('B', ['A'], ['B output'], 'sonnet', 5000),
      makeSpec('C', ['A'], ['C output'], 'sonnet', 5000),
    ];

    const risks = analyzeRiskFactors(plan, specs);
    const mismatch = risks.find(r => r.risk === 'Interface Mismatch');
    expect(mismatch).toBeDefined();
    expect(mismatch!.mitigation).toMatch(/contract\s*test/i);
  });

  it('Model capacity mitigation mentions splitting or switching model', () => {
    const plan = createPlan();
    const specs = [makeSpec('BigSpec', [], ['output'], 'opus', 200000)];

    const risks = analyzeRiskFactors(plan, specs);
    const capacity = risks.find(r => r.risk === 'Model Capacity');
    expect(capacity).toBeDefined();
    expect(capacity!.mitigation).toMatch(/split|sub-task|model\s*tier/i);
  });
});
