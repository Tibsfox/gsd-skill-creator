/**
 * Tests for VTM cache optimization analyzers.
 *
 * Covers:
 * - detectSharedLoads(): identifies skill loads shareable within each wave
 * - analyzeSchemaReuse(): identifies schema reuse across ALL wave boundaries
 * - calculateKnowledgeTiers(): computes current vs optimal tier with token savings
 *
 * @module vtm/__tests__/cache-optimizer
 */

import { describe, it, expect } from 'vitest';
import { encode } from 'gpt-tokenizer';
import type { WaveExecutionPlan, ComponentSpec } from '../types.js';
import {
  detectSharedLoads,
  analyzeSchemaReuse,
  calculateKnowledgeTiers,
} from '../cache-optimizer.js';

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
              { id: 'task-a', description: 'Implement shared types and interfaces', produces: 'shared-types.ts', model: 'sonnet', estimatedTokens: 5000, dependsOn: [] },
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
  tokens: number = 5000,
  model: 'opus' | 'sonnet' | 'haiku' = 'sonnet',
): ComponentSpec {
  return {
    name,
    milestone: 'Test Milestone',
    wave: 'Wave 0',
    modelAssignment: model,
    estimatedTokens: tokens,
    dependencies: deps,
    produces,
    objective: `Implement ${name}`,
    context: `Context for ${name}`,
    technicalSpec: [{ name: 'Spec', spec: 'Details' }],
    implementationSteps: [{ name: 'Step 1', description: 'Do the thing' }],
    testCases: [{ name: 'Test 1', input: 'input', expected: 'output' }],
    verificationGate: { conditions: ['Tests pass'], handoff: 'Next phase' },
  };
}

// ===========================================================================
// detectSharedLoads
// ===========================================================================

describe('detectSharedLoads', () => {
  it('returns empty array for a plan with a single task per wave', () => {
    const plan = createPlan();
    const result = detectSharedLoads(plan);
    // Single task means nothing to share
    expect(result).toEqual([]);
  });

  it('detects two tasks in the same wave that produce overlapping artifacts', () => {
    const plan = createPlan({
      waves: [
        {
          number: 0,
          name: 'Foundation',
          purpose: 'Execute foundation',
          isSequential: false,
          tracks: [
            {
              name: 'Track A',
              tasks: [
                { id: 'task-a', description: 'Build user types', produces: 'shared-types.ts', model: 'sonnet', estimatedTokens: 3000, dependsOn: [] },
                { id: 'task-b', description: 'Build auth types', produces: 'shared-types.ts', model: 'sonnet', estimatedTokens: 4000, dependsOn: [] },
              ],
            },
          ],
        },
      ],
    });

    const result = detectSharedLoads(plan);
    expect(result.length).toBeGreaterThanOrEqual(1);

    const shared = result.find(e => e.skill === 'shared-types.ts');
    expect(shared).toBeDefined();
    expect(shared!.tasks).toContain('task-a');
    expect(shared!.tasks).toContain('task-b');
    expect(shared!.cacheable).toBe(true);
    expect(shared!.wave).toBe(0);
  });

  it('detects tasks in the same wave with matching description keywords indicating same skill domain', () => {
    const plan = createPlan({
      waves: [
        {
          number: 0,
          name: 'Foundation',
          purpose: 'Execute foundation',
          isSequential: false,
          tracks: [
            {
              name: 'Track A',
              tasks: [
                { id: 'task-parser', description: 'Build the markdown parser with validation and error handling', produces: 'parser.ts', model: 'sonnet', estimatedTokens: 5000, dependsOn: [] },
                { id: 'task-validator', description: 'Build the markdown validator with error handling and validation', produces: 'validator.ts', model: 'sonnet', estimatedTokens: 5000, dependsOn: [] },
              ],
            },
          ],
        },
      ],
    });

    const result = detectSharedLoads(plan);
    // Should detect content overlap between the two descriptions
    const overlapping = result.find(e =>
      e.tasks.includes('task-parser') && e.tasks.includes('task-validator'),
    );
    expect(overlapping).toBeDefined();
    expect(overlapping!.cacheable).toBe(true);
  });

  it('content overlap detection: tasks whose description text shares >50% significant words are flagged', () => {
    const plan = createPlan({
      waves: [
        {
          number: 0,
          name: 'Foundation',
          purpose: 'Execute foundation',
          isSequential: false,
          tracks: [
            {
              name: 'Track A',
              tasks: [
                { id: 'task-x', description: 'implement authentication middleware for user sessions', produces: 'auth-middleware.ts', model: 'sonnet', estimatedTokens: 5000, dependsOn: [] },
                { id: 'task-y', description: 'implement authentication middleware for admin sessions', produces: 'admin-middleware.ts', model: 'sonnet', estimatedTokens: 5000, dependsOn: [] },
              ],
            },
          ],
        },
      ],
    });

    const result = detectSharedLoads(plan);
    const overlapping = result.find(e =>
      e.tasks.includes('task-x') && e.tasks.includes('task-y'),
    );
    expect(overlapping).toBeDefined();
    expect(overlapping!.cacheable).toBe(true);
  });

  it('does NOT flag tasks in different waves as shared loads', () => {
    const plan = createPlan({
      waves: [
        {
          number: 0,
          name: 'Foundation',
          purpose: 'Execute foundation',
          isSequential: false,
          tracks: [
            {
              name: 'Track A',
              tasks: [
                { id: 'task-a', description: 'Build shared types', produces: 'shared-types.ts', model: 'sonnet', estimatedTokens: 5000, dependsOn: [] },
              ],
            },
          ],
        },
        {
          number: 1,
          name: 'Implementation',
          purpose: 'Build features',
          isSequential: false,
          tracks: [
            {
              name: 'Track A',
              tasks: [
                { id: 'task-b', description: 'Build shared types consumer', produces: 'shared-types.ts', model: 'sonnet', estimatedTokens: 5000, dependsOn: ['shared-types'] },
              ],
            },
          ],
        },
      ],
    });

    const result = detectSharedLoads(plan);
    // Cross-wave matches should NOT appear (that's schema reuse, not shared loads)
    const crossWave = result.find(e =>
      e.tasks.includes('task-a') && e.tasks.includes('task-b'),
    );
    expect(crossWave).toBeUndefined();
  });

  it('returns correct estimatedTokens using gpt-tokenizer encode on the produces string', () => {
    const producesStr = 'shared-types.ts';
    const expectedTokens = encode(producesStr).length;

    const plan = createPlan({
      waves: [
        {
          number: 0,
          name: 'Foundation',
          purpose: 'Execute foundation',
          isSequential: false,
          tracks: [
            {
              name: 'Track A',
              tasks: [
                { id: 'task-a', description: 'Build types A', produces: producesStr, model: 'sonnet', estimatedTokens: 5000, dependsOn: [] },
                { id: 'task-b', description: 'Build types B', produces: producesStr, model: 'sonnet', estimatedTokens: 5000, dependsOn: [] },
              ],
            },
          ],
        },
      ],
    });

    const result = detectSharedLoads(plan);
    const shared = result.find(e => e.skill === producesStr);
    expect(shared).toBeDefined();
    expect(shared!.estimatedTokens).toBe(expectedTokens);
  });

  it('marks cacheable: true when 2+ tasks share, cacheable: false for singletons', () => {
    const plan = createPlan({
      waves: [
        {
          number: 0,
          name: 'Foundation',
          purpose: 'Execute foundation',
          isSequential: false,
          tracks: [
            {
              name: 'Track A',
              tasks: [
                { id: 'task-a', description: 'Build types', produces: 'shared-types.ts', model: 'sonnet', estimatedTokens: 5000, dependsOn: [] },
                { id: 'task-b', description: 'Build more types', produces: 'shared-types.ts', model: 'sonnet', estimatedTokens: 5000, dependsOn: [] },
                { id: 'task-c', description: 'Build something completely unique and unrelated', produces: 'unique-file.ts', model: 'sonnet', estimatedTokens: 5000, dependsOn: [] },
              ],
            },
          ],
        },
      ],
    });

    const result = detectSharedLoads(plan);
    const shared = result.find(e => e.skill === 'shared-types.ts');
    expect(shared).toBeDefined();
    expect(shared!.cacheable).toBe(true);
    expect(shared!.tasks.length).toBeGreaterThanOrEqual(2);
  });
});

// ===========================================================================
// analyzeSchemaReuse
// ===========================================================================

describe('analyzeSchemaReuse', () => {
  it('returns empty array when no cross-wave dependencies exist', () => {
    const plan = createPlan();
    const specs: ComponentSpec[] = [
      makeSpec('A', [], ['impl.ts']),
    ];

    const result = analyzeSchemaReuse(plan, specs);
    expect(result).toEqual([]);
  });

  it('detects Wave 0 type producer consumed by Wave 1 tasks', () => {
    const plan = createPlan({
      waves: [
        {
          number: 0,
          name: 'Foundation',
          purpose: 'Types',
          isSequential: false,
          tracks: [
            {
              name: 'Track A',
              tasks: [
                { id: 'task-types', description: 'Define shared types', produces: 'shared-types.ts', model: 'sonnet', estimatedTokens: 3000, dependsOn: [] },
              ],
            },
          ],
        },
        {
          number: 1,
          name: 'Implementation',
          purpose: 'Build features',
          isSequential: false,
          tracks: [
            {
              name: 'Track A',
              tasks: [
                { id: 'task-parser', description: 'Build parser', produces: 'parser.ts', model: 'sonnet', estimatedTokens: 5000, dependsOn: ['Shared Types'] },
              ],
            },
          ],
        },
      ],
    });

    const specs: ComponentSpec[] = [
      makeSpec('Shared Types', [], ['shared-types.ts'], 3000),
      makeSpec('Parser', ['Shared Types'], ['parser.ts'], 5000),
    ];

    const result = analyzeSchemaReuse(plan, specs);
    expect(result.length).toBeGreaterThanOrEqual(1);

    const reuse = result.find(e => e.schema === 'shared-types.ts');
    expect(reuse).toBeDefined();
    expect(reuse!.producerWave).toBe(0);
    expect(reuse!.consumerWaves).toContain(1);
    expect(reuse!.waveBoundariesCrossed).toBe(1);
  });

  it('detects reuse across ALL wave boundaries, not just Wave 0 to Wave 1', () => {
    const plan = createPlan({
      waves: [
        {
          number: 0,
          name: 'Foundation',
          purpose: 'Types',
          isSequential: false,
          tracks: [{
            name: 'Track A',
            tasks: [
              { id: 'task-types', description: 'Define types', produces: 'types.ts', model: 'sonnet', estimatedTokens: 3000, dependsOn: [] },
            ],
          }],
        },
        {
          number: 1,
          name: 'Wave 1',
          purpose: 'Build core',
          isSequential: false,
          tracks: [{
            name: 'Track A',
            tasks: [
              { id: 'task-core', description: 'Build core schema definitions', produces: 'core-schema.ts', model: 'sonnet', estimatedTokens: 5000, dependsOn: ['Base Types'] },
            ],
          }],
        },
        {
          number: 2,
          name: 'Wave 2',
          purpose: 'Build features',
          isSequential: false,
          tracks: [{
            name: 'Track A',
            tasks: [
              { id: 'task-feature', description: 'Build feature', produces: 'feature.ts', model: 'sonnet', estimatedTokens: 5000, dependsOn: ['Core'] },
            ],
          }],
        },
        {
          number: 3,
          name: 'Wave 3',
          purpose: 'Polish',
          isSequential: false,
          tracks: [{
            name: 'Track A',
            tasks: [
              { id: 'task-polish', description: 'Polish feature', produces: 'polish.ts', model: 'sonnet', estimatedTokens: 5000, dependsOn: ['Core'] },
            ],
          }],
        },
      ],
    });

    const specs: ComponentSpec[] = [
      makeSpec('Base Types', [], ['types.ts'], 3000),
      makeSpec('Core', ['Base Types'], ['core-schema.ts'], 5000),
      makeSpec('Feature', ['Core'], ['feature.ts'], 5000),
      makeSpec('Polish', ['Core'], ['polish.ts'], 5000),
    ];

    const result = analyzeSchemaReuse(plan, specs);

    // Should detect Core (Wave 1) reused by Feature (Wave 2) and Polish (Wave 3)
    const coreReuse = result.find(e => e.producerWave === 1);
    expect(coreReuse).toBeDefined();
    expect(coreReuse!.waveBoundariesCrossed).toBeGreaterThanOrEqual(2);
  });

  it('uses plan.cacheOptimization.schemaReuse when present as primary source', () => {
    const plan = createPlan({
      cacheOptimization: {
        sharedSkillLoads: [],
        schemaReuse: [
          {
            schema: 'explicit-types.ts',
            producerTask: 'task-explicit',
            producerWave: 0,
            consumerTasks: ['task-consumer'],
            consumerWaves: [2],
          },
        ],
        preComputedKnowledge: [],
        tokenSavings: [],
      },
      waves: [
        {
          number: 0,
          name: 'Foundation',
          purpose: 'Types',
          isSequential: false,
          tracks: [{
            name: 'Track A',
            tasks: [
              { id: 'task-explicit', description: 'Define explicit types', produces: 'explicit-types.ts', model: 'sonnet', estimatedTokens: 3000, dependsOn: [] },
            ],
          }],
        },
        {
          number: 2,
          name: 'Wave 2',
          purpose: 'Features',
          isSequential: false,
          tracks: [{
            name: 'Track A',
            tasks: [
              { id: 'task-consumer', description: 'Consume types', produces: 'feature.ts', model: 'sonnet', estimatedTokens: 5000, dependsOn: [] },
            ],
          }],
        },
      ],
    });

    const specs: ComponentSpec[] = [];

    const result = analyzeSchemaReuse(plan, specs);
    expect(result.length).toBeGreaterThanOrEqual(1);

    const entry = result.find(e => e.schema === 'explicit-types.ts');
    expect(entry).toBeDefined();
    expect(entry!.producerWave).toBe(0);
    expect(entry!.consumerWaves).toContain(2);
    expect(entry!.waveBoundariesCrossed).toBe(2);
  });

  it('falls back to produces/dependsOn pattern inference when cacheOptimization is absent', () => {
    const plan = createPlan({
      waves: [
        {
          number: 0,
          name: 'Foundation',
          purpose: 'Types',
          isSequential: false,
          tracks: [{
            name: 'Track A',
            tasks: [
              { id: 'task-types', description: 'Define shared interfaces', produces: 'shared-interfaces.ts', model: 'sonnet', estimatedTokens: 3000, dependsOn: [] },
            ],
          }],
        },
        {
          number: 1,
          name: 'Implementation',
          purpose: 'Build features',
          isSequential: false,
          tracks: [{
            name: 'Track A',
            tasks: [
              { id: 'task-impl', description: 'Build implementation', produces: 'impl.ts', model: 'sonnet', estimatedTokens: 5000, dependsOn: ['Interface Defs'] },
            ],
          }],
        },
      ],
    });

    const specs: ComponentSpec[] = [
      makeSpec('Interface Defs', [], ['shared-interfaces.ts'], 3000),
      makeSpec('Implementation', ['Interface Defs'], ['impl.ts'], 5000),
    ];

    const result = analyzeSchemaReuse(plan, specs);
    // Should infer producer/consumer from produces containing "interface"
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].producerWave).toBe(0);
  });

  it('handles multiple schemas being reused simultaneously', () => {
    const plan = createPlan({
      waves: [
        {
          number: 0,
          name: 'Foundation',
          purpose: 'Types',
          isSequential: false,
          tracks: [{
            name: 'Track A',
            tasks: [
              { id: 'task-types-a', description: 'Define types A', produces: 'types-a.ts', model: 'sonnet', estimatedTokens: 3000, dependsOn: [] },
              { id: 'task-types-b', description: 'Define schema B', produces: 'schema-b.ts', model: 'sonnet', estimatedTokens: 3000, dependsOn: [] },
            ],
          }],
        },
        {
          number: 1,
          name: 'Implementation',
          purpose: 'Build features',
          isSequential: false,
          tracks: [{
            name: 'Track A',
            tasks: [
              { id: 'task-consumer-1', description: 'Build feature 1', produces: 'feature1.ts', model: 'sonnet', estimatedTokens: 5000, dependsOn: ['Types A'] },
              { id: 'task-consumer-2', description: 'Build feature 2', produces: 'feature2.ts', model: 'sonnet', estimatedTokens: 5000, dependsOn: ['Schema B'] },
            ],
          }],
        },
      ],
    });

    const specs: ComponentSpec[] = [
      makeSpec('Types A', [], ['types-a.ts'], 3000),
      makeSpec('Schema B', [], ['schema-b.ts'], 3000),
      makeSpec('Feature 1', ['Types A'], ['feature1.ts'], 5000),
      makeSpec('Feature 2', ['Schema B'], ['feature2.ts'], 5000),
    ];

    const result = analyzeSchemaReuse(plan, specs);
    expect(result.length).toBeGreaterThanOrEqual(2);

    const schemas = result.map(e => e.schema);
    expect(schemas).toContain('types-a.ts');
    expect(schemas).toContain('schema-b.ts');
  });

  it('waveBoundariesCrossed is computed as max consumer wave minus producer wave', () => {
    const plan = createPlan({
      waves: [
        {
          number: 0,
          name: 'Foundation',
          purpose: 'Types',
          isSequential: false,
          tracks: [{
            name: 'Track A',
            tasks: [
              { id: 'task-base', description: 'Define base types', produces: 'base-types.ts', model: 'sonnet', estimatedTokens: 3000, dependsOn: [] },
            ],
          }],
        },
        {
          number: 1,
          name: 'Wave 1',
          purpose: 'Core',
          isSequential: false,
          tracks: [{
            name: 'Track A',
            tasks: [
              { id: 'task-core', description: 'Build core', produces: 'core.ts', model: 'sonnet', estimatedTokens: 5000, dependsOn: ['Base'] },
            ],
          }],
        },
        {
          number: 3,
          name: 'Wave 3',
          purpose: 'Polish',
          isSequential: false,
          tracks: [{
            name: 'Track A',
            tasks: [
              { id: 'task-polish', description: 'Polish', produces: 'polish.ts', model: 'sonnet', estimatedTokens: 5000, dependsOn: ['Base'] },
            ],
          }],
        },
      ],
    });

    const specs: ComponentSpec[] = [
      makeSpec('Base', [], ['base-types.ts'], 3000),
      makeSpec('Core', ['Base'], ['core.ts'], 5000),
      makeSpec('Polish', ['Base'], ['polish.ts'], 5000),
    ];

    const result = analyzeSchemaReuse(plan, specs);
    const baseReuse = result.find(e => e.producerWave === 0);
    expect(baseReuse).toBeDefined();
    // max consumer wave (3) - producer wave (0) = 3
    expect(baseReuse!.waveBoundariesCrossed).toBe(3);
  });
});

// ===========================================================================
// calculateKnowledgeTiers
// ===========================================================================

describe('calculateKnowledgeTiers', () => {
  it('all tasks default to reference tier as currentTier when not specified', () => {
    const plan = createPlan();
    const specs: ComponentSpec[] = [makeSpec('A', [], ['impl.ts'], 5000)];

    const result = calculateKnowledgeTiers(plan, specs);
    expect(result.length).toBeGreaterThanOrEqual(1);

    for (const entry of result) {
      expect(entry.currentTier).toBe('reference');
    }
  });

  it('tasks with estimatedTokens <= 2000 are optimal at summary tier', () => {
    const plan = createPlan({
      waves: [
        {
          number: 0,
          name: 'Foundation',
          purpose: 'Simple tasks',
          isSequential: false,
          tracks: [{
            name: 'Track A',
            tasks: [
              { id: 'task-small', description: 'Small task', produces: 'small.ts', model: 'haiku', estimatedTokens: 1500, dependsOn: [] },
            ],
          }],
        },
      ],
    });
    const specs: ComponentSpec[] = [makeSpec('Small', [], ['small.ts'], 1500, 'haiku')];

    const result = calculateKnowledgeTiers(plan, specs);
    const entry = result.find(e => e.task === 'task-small');
    expect(entry).toBeDefined();
    expect(entry!.optimalTier).toBe('summary');
  });

  it('tasks with estimatedTokens 2001-10000 are optimal at active tier', () => {
    const plan = createPlan({
      waves: [
        {
          number: 0,
          name: 'Foundation',
          purpose: 'Medium tasks',
          isSequential: false,
          tracks: [{
            name: 'Track A',
            tasks: [
              { id: 'task-medium', description: 'Medium task', produces: 'medium.ts', model: 'sonnet', estimatedTokens: 5000, dependsOn: [] },
            ],
          }],
        },
      ],
    });
    const specs: ComponentSpec[] = [makeSpec('Medium', [], ['medium.ts'], 5000)];

    const result = calculateKnowledgeTiers(plan, specs);
    const entry = result.find(e => e.task === 'task-medium');
    expect(entry).toBeDefined();
    expect(entry!.optimalTier).toBe('active');
  });

  it('tasks with estimatedTokens > 10000 are optimal at reference tier (no downgrade)', () => {
    const plan = createPlan({
      waves: [
        {
          number: 0,
          name: 'Foundation',
          purpose: 'Large tasks',
          isSequential: false,
          tracks: [{
            name: 'Track A',
            tasks: [
              { id: 'task-large', description: 'Large task', produces: 'large.ts', model: 'opus', estimatedTokens: 15000, dependsOn: [] },
            ],
          }],
        },
      ],
    });
    const specs: ComponentSpec[] = [makeSpec('Large', [], ['large.ts'], 15000, 'opus')];

    const result = calculateKnowledgeTiers(plan, specs);
    const entry = result.find(e => e.task === 'task-large');
    expect(entry).toBeDefined();
    expect(entry!.optimalTier).toBe('reference');
  });

  it('token sizes use gpt-tokenizer for tier content estimation', () => {
    const plan = createPlan({
      waves: [
        {
          number: 0,
          name: 'Foundation',
          purpose: 'Test tokens',
          isSequential: false,
          tracks: [{
            name: 'Track A',
            tasks: [
              { id: 'task-token', description: 'Token test task', produces: 'token.ts', model: 'sonnet', estimatedTokens: 1500, dependsOn: [] },
            ],
          }],
        },
      ],
    });
    const specs: ComponentSpec[] = [makeSpec('Token', [], ['token.ts'], 1500)];

    const result = calculateKnowledgeTiers(plan, specs);
    const entry = result.find(e => e.task === 'task-token');
    expect(entry).toBeDefined();
    // Token counts should be positive numbers
    expect(entry!.tokensCurrent).toBeGreaterThan(0);
    expect(entry!.tokensOptimal).toBeGreaterThan(0);
  });

  it('returns savings = 0 when currentTier matches optimalTier', () => {
    const plan = createPlan({
      waves: [
        {
          number: 0,
          name: 'Foundation',
          purpose: 'Large tasks',
          isSequential: false,
          tracks: [{
            name: 'Track A',
            tasks: [
              { id: 'task-ref', description: 'Reference tier task needing all content', produces: 'ref.ts', model: 'opus', estimatedTokens: 15000, dependsOn: [] },
            ],
          }],
        },
      ],
    });
    const specs: ComponentSpec[] = [makeSpec('Ref', [], ['ref.ts'], 15000, 'opus')];

    const result = calculateKnowledgeTiers(plan, specs);
    const entry = result.find(e => e.task === 'task-ref');
    expect(entry).toBeDefined();
    expect(entry!.savings).toBe(0);
  });

  it('returns positive savings when task loads higher tier than needed', () => {
    const plan = createPlan({
      waves: [
        {
          number: 0,
          name: 'Foundation',
          purpose: 'Small tasks',
          isSequential: false,
          tracks: [{
            name: 'Track A',
            tasks: [
              { id: 'task-over', description: 'Over-provisioned task', produces: 'over.ts', model: 'haiku', estimatedTokens: 1000, dependsOn: [] },
            ],
          }],
        },
      ],
    });
    const specs: ComponentSpec[] = [makeSpec('Over', [], ['over.ts'], 1000, 'haiku')];

    const result = calculateKnowledgeTiers(plan, specs);
    const entry = result.find(e => e.task === 'task-over');
    expect(entry).toBeDefined();
    // currentTier defaults to 'reference', but optimal is 'summary' (<=2000 tokens)
    expect(entry!.currentTier).toBe('reference');
    expect(entry!.optimalTier).toBe('summary');
    expect(entry!.savings).toBeGreaterThan(0);
  });
});
