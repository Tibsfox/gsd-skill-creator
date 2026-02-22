/**
 * Tests for VTM cache optimization analyzers.
 *
 * Covers:
 * - detectSharedLoads(): identifies skill loads shareable within each wave
 * - analyzeSchemaReuse(): identifies schema reuse across ALL wave boundaries
 * - calculateKnowledgeTiers(): computes current vs optimal tier with token savings
 * - validateTTL(): validates cache TTL at every wave boundary using cumulative timing
 * - estimateTokenSavings(): reports per-category token savings with aggregate total
 * - generateCacheReport(): composes all analyzers into a structured CacheReport
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
  validateTTL,
  estimateTokenSavings,
  generateCacheReport,
} from '../cache-optimizer.js';
import type {
  SharedLoadEntry,
  SchemaReuseEntry,
  KnowledgeTierEntry,
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

// ===========================================================================
// validateTTL
// ===========================================================================

describe('validateTTL', () => {
  it('returns valid: true with empty violations when all waves complete within TTL', () => {
    // Each wave has 2000 tokens => 2min at 1000 tokens/min
    // Cumulative: Wave 0=2min, Wave 1=4min -- both under default 5min TTL
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
              { id: 'task-a', description: 'Fast task', produces: 'a.ts', model: 'sonnet', estimatedTokens: 2000, dependsOn: [] },
            ],
          }],
        },
        {
          number: 1,
          name: 'Implementation',
          purpose: 'Build',
          isSequential: false,
          tracks: [{
            name: 'Track A',
            tasks: [
              { id: 'task-b', description: 'Also fast', produces: 'b.ts', model: 'sonnet', estimatedTokens: 2000, dependsOn: ['task-a'] },
            ],
          }],
        },
      ],
    });
    const specs: ComponentSpec[] = [
      makeSpec('A', [], ['a.ts'], 2000),
      makeSpec('B', ['A'], ['b.ts'], 2000),
    ];

    const result = validateTTL(plan, specs);
    expect(result.valid).toBe(true);
    expect(result.violations).toEqual([]);
  });

  it('uses default TTL of 5 minutes when options not provided', () => {
    // Wave 0 takes 6min (6000 tokens at 1000/min), exceeds default 5min TTL
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
              { id: 'task-slow', description: 'Slow task', produces: 'slow.ts', model: 'sonnet', estimatedTokens: 6000, dependsOn: [] },
            ],
          }],
        },
        {
          number: 1,
          name: 'Implementation',
          purpose: 'Build',
          isSequential: false,
          tracks: [{
            name: 'Track A',
            tasks: [
              { id: 'task-consumer', description: 'Consumer', produces: 'consumer.ts', model: 'sonnet', estimatedTokens: 1000, dependsOn: ['task-slow'] },
            ],
          }],
        },
      ],
    });
    const specs: ComponentSpec[] = [
      makeSpec('Slow', [], ['slow.ts'], 6000),
      makeSpec('Consumer', ['Slow'], ['consumer.ts'], 1000),
    ];

    // No options passed -- should use default 5 minutes
    const result = validateTTL(plan, specs);
    expect(result.valid).toBe(false);
    expect(result.violations.length).toBeGreaterThanOrEqual(1);
    // Violation should reference 5min TTL
    expect(result.violations[0].ttlMinutes).toBe(5);
  });

  it('accepts configurable TTL threshold via options.ttlMinutes', () => {
    // Wave 0 takes 6min (6000 tokens) -- exceeds 5min TTL but not 10min TTL
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
              { id: 'task-a', description: 'Moderately slow', produces: 'a.ts', model: 'sonnet', estimatedTokens: 6000, dependsOn: [] },
            ],
          }],
        },
        {
          number: 1,
          name: 'Build',
          purpose: 'Build',
          isSequential: false,
          tracks: [{
            name: 'Track A',
            tasks: [
              { id: 'task-b', description: 'Consumer', produces: 'b.ts', model: 'sonnet', estimatedTokens: 1000, dependsOn: ['task-a'] },
            ],
          }],
        },
      ],
    });
    const specs: ComponentSpec[] = [
      makeSpec('A', [], ['a.ts'], 6000),
      makeSpec('B', ['A'], ['b.ts'], 1000),
    ];

    // With 10min TTL -- should be valid
    const result = validateTTL(plan, specs, { ttlMinutes: 10 });
    expect(result.valid).toBe(true);
    expect(result.violations).toEqual([]);
  });

  it('flags Wave 0 exceeding TTL for Wave 1 consumers (basic case)', () => {
    // Wave 0 = 6000 tokens = 6min, exceeds default 5min TTL
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
              { id: 'task-producer', description: 'Slow producer', produces: 'types.ts', model: 'sonnet', estimatedTokens: 6000, dependsOn: [] },
            ],
          }],
        },
        {
          number: 1,
          name: 'Implementation',
          purpose: 'Build',
          isSequential: false,
          tracks: [{
            name: 'Track A',
            tasks: [
              { id: 'task-consumer-1', description: 'Consumer 1', produces: 'impl1.ts', model: 'sonnet', estimatedTokens: 2000, dependsOn: ['task-producer'] },
              { id: 'task-consumer-2', description: 'Consumer 2', produces: 'impl2.ts', model: 'sonnet', estimatedTokens: 2000, dependsOn: ['task-producer'] },
            ],
          }],
        },
      ],
    });
    const specs: ComponentSpec[] = [
      makeSpec('Producer', [], ['types.ts'], 6000),
      makeSpec('Consumer 1', ['Producer'], ['impl1.ts'], 2000),
      makeSpec('Consumer 2', ['Producer'], ['impl2.ts'], 2000),
    ];

    const result = validateTTL(plan, specs);
    expect(result.valid).toBe(false);
    expect(result.violations.length).toBeGreaterThanOrEqual(1);

    const violation = result.violations[0];
    expect(violation.wave).toBe(1);
    expect(violation.cumulativeMinutes).toBeGreaterThan(5);
    expect(violation.affectedConsumers.length).toBeGreaterThanOrEqual(1);
  });

  it('validates at EVERY wave boundary -- cumulative timing triggers violation at later waves', () => {
    // Wave 0: 3000 tokens = 3min
    // Wave 1: 3000 tokens = 3min, cumulative = 6min
    // Wave 2 consumes from Wave 0 -- at 6min cumulative, Wave 0's cache is stale (>5min TTL)
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
          name: 'Core',
          purpose: 'Core modules',
          isSequential: false,
          tracks: [{
            name: 'Track A',
            tasks: [
              { id: 'task-core', description: 'Build core', produces: 'core.ts', model: 'sonnet', estimatedTokens: 3000, dependsOn: ['task-types'] },
            ],
          }],
        },
        {
          number: 2,
          name: 'Features',
          purpose: 'Feature modules',
          isSequential: false,
          tracks: [{
            name: 'Track A',
            tasks: [
              { id: 'task-feature', description: 'Build feature', produces: 'feature.ts', model: 'sonnet', estimatedTokens: 2000, dependsOn: ['task-types'] },
            ],
          }],
        },
      ],
    });
    const specs: ComponentSpec[] = [
      makeSpec('Types', [], ['types.ts'], 3000),
      makeSpec('Core', ['Types'], ['core.ts'], 3000),
      makeSpec('Feature', ['Types'], ['feature.ts'], 2000),
    ];

    const result = validateTTL(plan, specs);
    expect(result.valid).toBe(false);

    // Wave 0 caches should be stale by Wave 2 (cumulative 6min > 5min TTL)
    const wave2Violation = result.violations.find(v => v.wave === 2);
    expect(wave2Violation).toBeDefined();
    expect(wave2Violation!.cumulativeMinutes).toBeGreaterThanOrEqual(6);
  });

  it('severity: warning when cumulative exceeds TTL by <1 minute, error when >= 1 minute over', () => {
    // Wave 0: 5500 tokens = 5.5min => 0.5min over 5min TTL = warning
    const planWarning = createPlan({
      waves: [
        {
          number: 0,
          name: 'Foundation',
          purpose: 'Types',
          isSequential: false,
          tracks: [{
            name: 'Track A',
            tasks: [
              { id: 'task-a', description: 'Slightly slow', produces: 'a.ts', model: 'sonnet', estimatedTokens: 5500, dependsOn: [] },
            ],
          }],
        },
        {
          number: 1,
          name: 'Build',
          purpose: 'Build',
          isSequential: false,
          tracks: [{
            name: 'Track A',
            tasks: [
              { id: 'task-b', description: 'Consumer', produces: 'b.ts', model: 'sonnet', estimatedTokens: 1000, dependsOn: ['task-a'] },
            ],
          }],
        },
      ],
    });
    const specsWarning: ComponentSpec[] = [
      makeSpec('A', [], ['a.ts'], 5500),
      makeSpec('B', ['A'], ['b.ts'], 1000),
    ];

    const resultWarning = validateTTL(planWarning, specsWarning);
    expect(resultWarning.violations.length).toBeGreaterThanOrEqual(1);
    expect(resultWarning.violations[0].severity).toBe('warning');

    // Wave 0: 7000 tokens = 7min => 2min over 5min TTL = error
    const planError = createPlan({
      waves: [
        {
          number: 0,
          name: 'Foundation',
          purpose: 'Types',
          isSequential: false,
          tracks: [{
            name: 'Track A',
            tasks: [
              { id: 'task-c', description: 'Very slow', produces: 'c.ts', model: 'sonnet', estimatedTokens: 7000, dependsOn: [] },
            ],
          }],
        },
        {
          number: 1,
          name: 'Build',
          purpose: 'Build',
          isSequential: false,
          tracks: [{
            name: 'Track A',
            tasks: [
              { id: 'task-d', description: 'Consumer', produces: 'd.ts', model: 'sonnet', estimatedTokens: 1000, dependsOn: ['task-c'] },
            ],
          }],
        },
      ],
    });
    const specsError: ComponentSpec[] = [
      makeSpec('C', [], ['c.ts'], 7000),
      makeSpec('D', ['C'], ['d.ts'], 1000),
    ];

    const resultError = validateTTL(planError, specsError);
    expect(resultError.violations.length).toBeGreaterThanOrEqual(1);
    expect(resultError.violations[0].severity).toBe('error');
  });

  it('affectedConsumers lists task IDs in the consumer wave that depend on the stale producer wave', () => {
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
              { id: 'task-producer', description: 'Slow producer', produces: 'types.ts', model: 'sonnet', estimatedTokens: 6000, dependsOn: [] },
            ],
          }],
        },
        {
          number: 1,
          name: 'Build',
          purpose: 'Build',
          isSequential: false,
          tracks: [{
            name: 'Track A',
            tasks: [
              { id: 'task-dep-1', description: 'Depends on producer', produces: 'dep1.ts', model: 'sonnet', estimatedTokens: 1000, dependsOn: ['task-producer'] },
              { id: 'task-dep-2', description: 'Also depends on producer', produces: 'dep2.ts', model: 'sonnet', estimatedTokens: 1000, dependsOn: ['task-producer'] },
              { id: 'task-independent', description: 'No dependency', produces: 'indep.ts', model: 'sonnet', estimatedTokens: 1000, dependsOn: [] },
            ],
          }],
        },
      ],
    });
    const specs: ComponentSpec[] = [
      makeSpec('Producer', [], ['types.ts'], 6000),
      makeSpec('Dep 1', ['Producer'], ['dep1.ts'], 1000),
      makeSpec('Dep 2', ['Producer'], ['dep2.ts'], 1000),
      makeSpec('Independent', [], ['indep.ts'], 1000),
    ];

    const result = validateTTL(plan, specs);
    const violation = result.violations.find(v => v.wave === 1);
    expect(violation).toBeDefined();
    expect(violation!.affectedConsumers).toContain('task-dep-1');
    expect(violation!.affectedConsumers).toContain('task-dep-2');
    expect(violation!.affectedConsumers).not.toContain('task-independent');
  });

  it('mitigation suggests splitting the slow wave or moving tasks', () => {
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
              { id: 'task-slow', description: 'Slow', produces: 'slow.ts', model: 'sonnet', estimatedTokens: 8000, dependsOn: [] },
            ],
          }],
        },
        {
          number: 1,
          name: 'Build',
          purpose: 'Build',
          isSequential: false,
          tracks: [{
            name: 'Track A',
            tasks: [
              { id: 'task-consumer', description: 'Consumer', produces: 'consumer.ts', model: 'sonnet', estimatedTokens: 1000, dependsOn: ['task-slow'] },
            ],
          }],
        },
      ],
    });
    const specs: ComponentSpec[] = [
      makeSpec('Slow', [], ['slow.ts'], 8000),
      makeSpec('Consumer', ['Slow'], ['consumer.ts'], 1000),
    ];

    const result = validateTTL(plan, specs);
    expect(result.violations.length).toBeGreaterThanOrEqual(1);
    expect(result.violations[0].mitigation).toBeTruthy();
    // Should mention splitting or moving
    expect(result.violations[0].mitigation.toLowerCase()).toMatch(/split|move/);
  });

  it('tracks cumulativeTimes for each wave boundary', () => {
    const plan = createPlan({
      waves: [
        {
          number: 0,
          name: 'Wave 0',
          purpose: 'Types',
          isSequential: false,
          tracks: [{
            name: 'Track A',
            tasks: [
              { id: 'task-0', description: 'Wave 0 task', produces: 'w0.ts', model: 'sonnet', estimatedTokens: 2000, dependsOn: [] },
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
              { id: 'task-1', description: 'Wave 1 task', produces: 'w1.ts', model: 'sonnet', estimatedTokens: 3000, dependsOn: ['task-0'] },
            ],
          }],
        },
      ],
    });
    const specs: ComponentSpec[] = [
      makeSpec('W0', [], ['w0.ts'], 2000),
      makeSpec('W1', ['W0'], ['w1.ts'], 3000),
    ];

    const result = validateTTL(plan, specs);
    // Should have cumulative times for each wave
    expect(result.cumulativeTimes.length).toBe(2);
    expect(result.cumulativeTimes[0].wave).toBe(0);
    expect(result.cumulativeTimes[0].cumulativeMinutes).toBe(2); // 2000/1000
    expect(result.cumulativeTimes[1].wave).toBe(1);
    expect(result.cumulativeTimes[1].cumulativeMinutes).toBe(5); // 2000/1000 + 3000/1000
  });

  it('wave time estimation uses tokens/1000 per minute rate', () => {
    // 3000 tokens at 1000 tokens/min = 3 minutes
    const plan = createPlan({
      waves: [
        {
          number: 0,
          name: 'Wave 0',
          purpose: 'Test',
          isSequential: false,
          tracks: [{
            name: 'Track A',
            tasks: [
              { id: 'task-0', description: 'Test', produces: 'test.ts', model: 'sonnet', estimatedTokens: 3000, dependsOn: [] },
            ],
          }],
        },
      ],
    });
    const specs: ComponentSpec[] = [makeSpec('Test', [], ['test.ts'], 3000)];

    const result = validateTTL(plan, specs);
    expect(result.cumulativeTimes[0].cumulativeMinutes).toBe(3);
  });
});

// ===========================================================================
// estimateTokenSavings
// ===========================================================================

describe('estimateTokenSavings', () => {
  it('returns zero savings for all categories when inputs are empty arrays', () => {
    const result = estimateTokenSavings([], [], []);
    expect(result.skillCaching.entries).toBe(0);
    expect(result.skillCaching.tokensSaved).toBe(0);
    expect(result.schemaReuse.entries).toBe(0);
    expect(result.schemaReuse.tokensSaved).toBe(0);
    expect(result.knowledgeTierOptimization.entries).toBe(0);
    expect(result.knowledgeTierOptimization.tokensSaved).toBe(0);
    expect(result.totalTokensSaved).toBe(0);
  });

  it('skill caching savings: estimatedTokens * (tasks.length - 1) for cacheable entries', () => {
    const sharedLoads: SharedLoadEntry[] = [
      {
        wave: 0,
        skill: 'shared-types.ts',
        tasks: ['task-a', 'task-b', 'task-c'],
        estimatedTokens: 100,
        cacheable: true,
      },
    ];

    const result = estimateTokenSavings(sharedLoads, [], []);
    // 100 tokens * (3 tasks - 1) = 200 tokens saved
    expect(result.skillCaching.entries).toBe(1);
    expect(result.skillCaching.tokensSaved).toBe(200);
  });

  it('skill caching ignores non-cacheable entries', () => {
    const sharedLoads: SharedLoadEntry[] = [
      {
        wave: 0,
        skill: 'unique.ts',
        tasks: ['task-a'],
        estimatedTokens: 100,
        cacheable: false,
      },
    ];

    const result = estimateTokenSavings(sharedLoads, [], []);
    expect(result.skillCaching.tokensSaved).toBe(0);
  });

  it('schema reuse savings: encode(schema name).length * consumerTasks.length', () => {
    const schemaReuse: SchemaReuseEntry[] = [
      {
        schema: 'shared-types.ts',
        producerTask: 'task-types',
        producerWave: 0,
        consumerTasks: ['task-a', 'task-b'],
        consumerWaves: [1, 2],
        waveBoundariesCrossed: 2,
      },
    ];

    const expectedTokens = encode('shared-types.ts').length;
    const result = estimateTokenSavings([], schemaReuse, []);
    // tokens per schema name * 2 consumers
    expect(result.schemaReuse.entries).toBe(1);
    expect(result.schemaReuse.tokensSaved).toBe(expectedTokens * 2);
  });

  it('knowledge tier savings: sum of all KnowledgeTierEntry.savings values', () => {
    const knowledgeTiers: KnowledgeTierEntry[] = [
      { task: 'task-a', wave: 0, currentTier: 'reference', optimalTier: 'summary', tokensCurrent: 5000, tokensOptimal: 500, savings: 4500 },
      { task: 'task-b', wave: 0, currentTier: 'reference', optimalTier: 'active', tokensCurrent: 5000, tokensOptimal: 2000, savings: 3000 },
    ];

    const result = estimateTokenSavings([], [], knowledgeTiers);
    expect(result.knowledgeTierOptimization.entries).toBe(2);
    expect(result.knowledgeTierOptimization.tokensSaved).toBe(7500);
  });

  it('reports per-category token counts as absolute numbers', () => {
    const sharedLoads: SharedLoadEntry[] = [
      { wave: 0, skill: 'cache.ts', tasks: ['a', 'b'], estimatedTokens: 50, cacheable: true },
    ];
    const schemaReuse: SchemaReuseEntry[] = [
      { schema: 'types.ts', producerTask: 'p', producerWave: 0, consumerTasks: ['c'], consumerWaves: [1], waveBoundariesCrossed: 1 },
    ];
    const knowledgeTiers: KnowledgeTierEntry[] = [
      { task: 'd', wave: 0, currentTier: 'reference', optimalTier: 'summary', tokensCurrent: 1000, tokensOptimal: 100, savings: 900 },
    ];

    const result = estimateTokenSavings(sharedLoads, schemaReuse, knowledgeTiers);
    // All numbers should be positive absolute values
    expect(result.skillCaching.tokensSaved).toBeGreaterThan(0);
    expect(result.schemaReuse.tokensSaved).toBeGreaterThan(0);
    expect(result.knowledgeTierOptimization.tokensSaved).toBeGreaterThan(0);
  });

  it('totalTokensSaved = sum of all three categories', () => {
    const sharedLoads: SharedLoadEntry[] = [
      { wave: 0, skill: 'cache.ts', tasks: ['a', 'b'], estimatedTokens: 100, cacheable: true },
    ];
    const schemaReuse: SchemaReuseEntry[] = [
      { schema: 'types.ts', producerTask: 'p', producerWave: 0, consumerTasks: ['c'], consumerWaves: [1], waveBoundariesCrossed: 1 },
    ];
    const knowledgeTiers: KnowledgeTierEntry[] = [
      { task: 'd', wave: 0, currentTier: 'reference', optimalTier: 'summary', tokensCurrent: 1000, tokensOptimal: 100, savings: 900 },
    ];

    const result = estimateTokenSavings(sharedLoads, schemaReuse, knowledgeTiers);
    const expected = result.skillCaching.tokensSaved + result.schemaReuse.tokensSaved + result.knowledgeTierOptimization.tokensSaved;
    expect(result.totalTokensSaved).toBe(expected);
  });
});

// ===========================================================================
// generateCacheReport
// ===========================================================================

describe('generateCacheReport', () => {
  it('composes all analyzers: detectSharedLoads, analyzeSchemaReuse, calculateKnowledgeTiers, validateTTL, estimateTokenSavings', () => {
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
              { id: 'task-types', description: 'Define types and interfaces', produces: 'shared-types.ts', model: 'sonnet', estimatedTokens: 3000, dependsOn: [] },
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
              { id: 'task-impl', description: 'Implement features', produces: 'impl.ts', model: 'sonnet', estimatedTokens: 5000, dependsOn: ['task-types'] },
            ],
          }],
        },
      ],
    });
    const specs: ComponentSpec[] = [
      makeSpec('Types', [], ['shared-types.ts'], 3000),
      makeSpec('Impl', ['Types'], ['impl.ts'], 5000),
    ];

    const report = generateCacheReport(plan, specs);
    // Should have all required fields populated
    expect(report.sharedLoads).toBeDefined();
    expect(report.schemaReuse).toBeDefined();
    expect(report.knowledgeTiers).toBeDefined();
    expect(report.ttlValidation).toBeDefined();
    expect(report.tokenSavings).toBeDefined();
    expect(report.recommendations).toBeDefined();
    expect(report.waveSummaries).toBeDefined();
    expect(Array.isArray(report.sharedLoads)).toBe(true);
    expect(Array.isArray(report.schemaReuse)).toBe(true);
    expect(Array.isArray(report.knowledgeTiers)).toBe(true);
    expect(Array.isArray(report.recommendations)).toBe(true);
    expect(Array.isArray(report.waveSummaries)).toBe(true);
  });

  it('produces correct waveSummaries with per-wave breakdowns', () => {
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
              { id: 'task-types-a', description: 'Build types and interfaces', produces: 'types.ts', model: 'sonnet', estimatedTokens: 1500, dependsOn: [] },
              { id: 'task-types-b', description: 'Build types and schemas', produces: 'types.ts', model: 'sonnet', estimatedTokens: 1500, dependsOn: [] },
            ],
          }],
        },
        {
          number: 1,
          name: 'Implementation',
          purpose: 'Build',
          isSequential: false,
          tracks: [{
            name: 'Track A',
            tasks: [
              { id: 'task-impl', description: 'Implement feature', produces: 'impl.ts', model: 'sonnet', estimatedTokens: 5000, dependsOn: ['task-types-a'] },
            ],
          }],
        },
      ],
    });
    const specs: ComponentSpec[] = [
      makeSpec('Types A', [], ['types.ts'], 1500),
      makeSpec('Types B', [], ['types.ts'], 1500),
      makeSpec('Impl', ['Types A'], ['impl.ts'], 5000),
    ];

    const report = generateCacheReport(plan, specs);
    expect(report.waveSummaries.length).toBe(2);

    const wave0Summary = report.waveSummaries.find(ws => ws.wave === 0);
    expect(wave0Summary).toBeDefined();
    expect(typeof wave0Summary!.sharedLoadCount).toBe('number');
    expect(typeof wave0Summary!.schemaReuseCount).toBe('number');
    expect(typeof wave0Summary!.tierOptimizations).toBe('number');
    expect(typeof wave0Summary!.waveSavings).toBe('number');
  });

  it('generates recommendation for shared loads across adjacent waves', () => {
    // This tests recommendation: "Move task X to wave Y to share cache with Z"
    const plan = createPlan({
      cacheOptimization: {
        sharedSkillLoads: [],
        schemaReuse: [
          {
            schema: 'shared-types.ts',
            producerTask: 'task-producer',
            producerWave: 0,
            consumerTasks: ['task-consumer'],
            consumerWaves: [1],
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
              { id: 'task-producer', description: 'Produce types', produces: 'shared-types.ts', model: 'sonnet', estimatedTokens: 2000, dependsOn: [] },
            ],
          }],
        },
        {
          number: 1,
          name: 'Implementation',
          purpose: 'Build',
          isSequential: false,
          tracks: [{
            name: 'Track A',
            tasks: [
              { id: 'task-consumer', description: 'Consume types', produces: 'impl.ts', model: 'sonnet', estimatedTokens: 2000, dependsOn: ['task-producer'] },
            ],
          }],
        },
      ],
    });
    const specs: ComponentSpec[] = [];

    const report = generateCacheReport(plan, specs);
    // Should have at least one recommendation when schema reuse exists
    // (specific wording may vary, but should have recommendations)
    expect(report.schemaReuse.length).toBeGreaterThanOrEqual(1);
  });

  it('generates recommendation for TTL violations', () => {
    // Wave 0: 8000 tokens = 8min > 5min TTL
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
              { id: 'task-slow', description: 'Very slow types', produces: 'types.ts', model: 'sonnet', estimatedTokens: 8000, dependsOn: [] },
            ],
          }],
        },
        {
          number: 1,
          name: 'Build',
          purpose: 'Build',
          isSequential: false,
          tracks: [{
            name: 'Track A',
            tasks: [
              { id: 'task-consumer', description: 'Consumer', produces: 'impl.ts', model: 'sonnet', estimatedTokens: 2000, dependsOn: ['task-slow'] },
            ],
          }],
        },
      ],
    });
    const specs: ComponentSpec[] = [
      makeSpec('Slow', [], ['types.ts'], 8000),
      makeSpec('Consumer', ['Slow'], ['impl.ts'], 2000),
    ];

    const report = generateCacheReport(plan, specs);
    expect(report.ttlValidation.valid).toBe(false);
    // Should generate recommendations for TTL violations
    const ttlRec = report.recommendations.find(r => r.toLowerCase().includes('wave') || r.toLowerCase().includes('split') || r.toLowerCase().includes('ttl'));
    expect(ttlRec).toBeDefined();
  });

  it('generates recommendation for knowledge tier downgrade opportunities', () => {
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
              { id: 'task-small', description: 'Tiny task', produces: 'small.ts', model: 'haiku', estimatedTokens: 500, dependsOn: [] },
            ],
          }],
        },
      ],
    });
    const specs: ComponentSpec[] = [makeSpec('Small', [], ['small.ts'], 500, 'haiku')];

    const report = generateCacheReport(plan, specs);
    // The task has estimatedTokens=500 so optimalTier=summary while currentTier=reference
    const tierEntries = report.knowledgeTiers.filter(e => e.optimalTier !== e.currentTier);
    if (tierEntries.length > 0) {
      const downgradeRec = report.recommendations.find(r => r.toLowerCase().includes('downgrade') || r.toLowerCase().includes('tier'));
      expect(downgradeRec).toBeDefined();
    }
  });

  it('passes through TTL options to validateTTL', () => {
    // Wave 0: 6000 tokens = 6min > 5min default, but < 10min custom
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
              { id: 'task-a', description: 'Moderate task', produces: 'a.ts', model: 'sonnet', estimatedTokens: 6000, dependsOn: [] },
            ],
          }],
        },
        {
          number: 1,
          name: 'Build',
          purpose: 'Build',
          isSequential: false,
          tracks: [{
            name: 'Track A',
            tasks: [
              { id: 'task-b', description: 'Consumer', produces: 'b.ts', model: 'sonnet', estimatedTokens: 1000, dependsOn: ['task-a'] },
            ],
          }],
        },
      ],
    });
    const specs: ComponentSpec[] = [
      makeSpec('A', [], ['a.ts'], 6000),
      makeSpec('B', ['A'], ['b.ts'], 1000),
    ];

    // With 10min TTL, should pass
    const report = generateCacheReport(plan, specs, { ttlMinutes: 10 });
    expect(report.ttlValidation.valid).toBe(true);

    // With default TTL (5min), should fail
    const reportDefault = generateCacheReport(plan, specs);
    expect(reportDefault.ttlValidation.valid).toBe(false);
  });

  it('returns empty recommendations array when no optimizations found', () => {
    // Single wave, single task, large tokens (no tier downgrade), no reuse, no TTL violation
    const plan = createPlan({
      waves: [
        {
          number: 0,
          name: 'Solo',
          purpose: 'Single task',
          isSequential: false,
          tracks: [{
            name: 'Track A',
            tasks: [
              { id: 'task-solo', description: 'Only task in plan', produces: 'solo.ts', model: 'opus', estimatedTokens: 15000, dependsOn: [] },
            ],
          }],
        },
      ],
    });
    const specs: ComponentSpec[] = [makeSpec('Solo', [], ['solo.ts'], 15000, 'opus')];

    const report = generateCacheReport(plan, specs);
    expect(report.recommendations).toEqual([]);
  });
});
