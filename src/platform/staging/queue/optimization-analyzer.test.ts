/**
 * Tests for the optimization analyzer.
 *
 * Covers batching (QUEUE-04), parallel lane (QUEUE-05), and shared
 * setup (QUEUE-06) opportunity detection across queued items.
 *
 * @module staging/queue/optimization-analyzer.test
 */

import { describe, it, expect } from 'vitest';
import {
  analyzeOptimizations,
  OPTIMIZATION_TYPES,
} from './optimization-analyzer.js';
import type {
  OptimizationType,
  OptimizationSuggestion,
  DependencyEdge,
} from './optimization-analyzer.js';
import type { QueueEntry } from './types.js';
import type { ResourceManifest } from '../resource/types.js';

// ============================================================================
// Helpers
// ============================================================================

/** Create a minimal QueueEntry with overrides. */
function makeEntry(overrides: Partial<QueueEntry> & { id: string }): QueueEntry {
  return {
    filename: `${overrides.id}.md`,
    state: 'queued',
    milestoneName: 'test milestone',
    domain: 'general',
    tags: [],
    resourceManifestPath: `.planning/staging/ready/${overrides.id}.manifest.json`,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

/** Create a minimal ResourceManifest with overrides. */
function makeManifest(overrides?: Partial<ResourceManifest>): ResourceManifest {
  return {
    visionAnalysis: {
      requirements: [],
      complexity: [],
      ambiguities: [],
      dependencies: [],
      overallComplexity: 'low',
      summary: 'test',
    },
    skillMatches: [],
    topology: {
      topology: 'single',
      rationale: 'default',
      confidence: 0.5,
      agentCount: 1,
    },
    tokenBudget: {
      total: 100000,
      categories: {
        'skill-loading': 5000,
        planning: 20000,
        execution: 40000,
        research: 15000,
        verification: 10000,
        hitl: 5000,
        'safety-margin': 5000,
      },
      contextWindowSize: 200000,
      utilizationPercent: 50,
    },
    decomposition: {
      subtasks: [],
      criticalPath: [],
      maxParallelism: 1,
      sharedResources: [],
    },
    hitlPredictions: [],
    queueContext: {
      priority: 3,
      estimatedDuration: '2h',
      tags: [],
    },
    generatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

// ============================================================================
// Types
// ============================================================================

describe('OptimizationType', () => {
  it('OPTIMIZATION_TYPES contains all 3 values', () => {
    expect(OPTIMIZATION_TYPES).toEqual(['batch', 'parallel', 'shared-setup']);
    expect(OPTIMIZATION_TYPES).toHaveLength(3);
  });

  it('type-checks OptimizationType values', () => {
    const batch: OptimizationType = 'batch';
    const parallel: OptimizationType = 'parallel';
    const sharedSetup: OptimizationType = 'shared-setup';
    expect(batch).toBe('batch');
    expect(parallel).toBe('parallel');
    expect(sharedSetup).toBe('shared-setup');
  });
});

describe('OptimizationSuggestion', () => {
  it('has required fields', () => {
    const suggestion: OptimizationSuggestion = {
      type: 'batch',
      description: 'test',
      entryIds: ['a', 'b'],
      confidence: 0.7,
      details: {},
    };
    expect(suggestion.type).toBe('batch');
    expect(suggestion.description).toBe('test');
    expect(suggestion.entryIds).toEqual(['a', 'b']);
    expect(suggestion.confidence).toBe(0.7);
    expect(suggestion.details).toEqual({});
  });
});

// ============================================================================
// Batching (QUEUE-04)
// ============================================================================

describe('analyzeOptimizations - batching', () => {
  it('detects same domain batching', () => {
    const entries: QueueEntry[] = [
      makeEntry({ id: 'q-001', domain: 'authentication' }),
      makeEntry({ id: 'q-002', domain: 'authentication' }),
    ];
    const manifests = new Map<string, ResourceManifest>([
      ['q-001', makeManifest()],
      ['q-002', makeManifest()],
    ]);

    const results = analyzeOptimizations(entries, manifests);
    const batchSuggestions = results.filter((s) => s.type === 'batch');

    expect(batchSuggestions.length).toBeGreaterThanOrEqual(1);
    const domainBatch = batchSuggestions.find(
      (s) => s.entryIds.includes('q-001') && s.entryIds.includes('q-002'),
    );
    expect(domainBatch).toBeDefined();
    expect(domainBatch!.confidence).toBeGreaterThanOrEqual(0.6);
    expect(domainBatch!.description).toMatch(/authentication/i);
  });

  it('detects overlapping tags batching', () => {
    const entries: QueueEntry[] = [
      makeEntry({ id: 'q-001', domain: 'frontend' }),
      makeEntry({ id: 'q-002', domain: 'backend' }),
    ];
    const manifests = new Map<string, ResourceManifest>([
      [
        'q-001',
        makeManifest({
          queueContext: {
            priority: 3,
            estimatedDuration: '2h',
            tags: ['typescript', 'ui', 'testing'],
          },
        }),
      ],
      [
        'q-002',
        makeManifest({
          queueContext: {
            priority: 3,
            estimatedDuration: '2h',
            tags: ['typescript', 'ui', 'api'],
          },
        }),
      ],
    ]);

    const results = analyzeOptimizations(entries, manifests);
    const batchSuggestions = results.filter((s) => s.type === 'batch');

    expect(batchSuggestions.length).toBeGreaterThanOrEqual(1);
    const tagBatch = batchSuggestions.find(
      (s) =>
        s.entryIds.includes('q-001') &&
        s.entryIds.includes('q-002') &&
        s.details.sharedTags !== undefined,
    );
    expect(tagBatch).toBeDefined();
    expect(tagBatch!.details.sharedTags).toEqual(
      expect.arrayContaining(['typescript', 'ui']),
    );
  });

  it('does not batch different domains with no tag overlap', () => {
    const entries: QueueEntry[] = [
      makeEntry({ id: 'q-001', domain: 'authentication' }),
      makeEntry({ id: 'q-002', domain: 'data-visualization' }),
    ];
    const manifests = new Map<string, ResourceManifest>([
      [
        'q-001',
        makeManifest({
          queueContext: {
            priority: 3,
            estimatedDuration: '2h',
            tags: ['jwt', 'oauth'],
          },
        }),
      ],
      [
        'q-002',
        makeManifest({
          queueContext: {
            priority: 3,
            estimatedDuration: '2h',
            tags: ['d3', 'charts'],
          },
        }),
      ],
    ]);

    const results = analyzeOptimizations(entries, manifests);
    const batchSuggestions = results.filter((s) => s.type === 'batch');
    expect(batchSuggestions).toHaveLength(0);
  });

  it('creates three-way batch for same domain', () => {
    const entries: QueueEntry[] = [
      makeEntry({ id: 'q-001', domain: 'testing' }),
      makeEntry({ id: 'q-002', domain: 'testing' }),
      makeEntry({ id: 'q-003', domain: 'testing' }),
    ];
    const manifests = new Map<string, ResourceManifest>([
      ['q-001', makeManifest()],
      ['q-002', makeManifest()],
      ['q-003', makeManifest()],
    ]);

    const results = analyzeOptimizations(entries, manifests);
    const batchSuggestions = results.filter((s) => s.type === 'batch');

    expect(batchSuggestions.length).toBeGreaterThanOrEqual(1);
    const threeBatch = batchSuggestions.find(
      (s) => s.entryIds.length === 3,
    );
    expect(threeBatch).toBeDefined();
    expect(threeBatch!.entryIds).toEqual(
      expect.arrayContaining(['q-001', 'q-002', 'q-003']),
    );
  });
});

// ============================================================================
// Parallel lanes (QUEUE-05)
// ============================================================================

describe('analyzeOptimizations - parallel lanes', () => {
  it('detects independent milestones as parallel', () => {
    const entries: QueueEntry[] = [
      makeEntry({ id: 'q-001', domain: 'auth' }),
      makeEntry({ id: 'q-002', domain: 'ui' }),
    ];
    const manifests = new Map<string, ResourceManifest>([
      ['q-001', makeManifest()],
      ['q-002', makeManifest()],
    ]);

    const results = analyzeOptimizations(entries, manifests, []);
    const parallelSuggestions = results.filter((s) => s.type === 'parallel');

    expect(parallelSuggestions.length).toBeGreaterThanOrEqual(1);
    const pair = parallelSuggestions.find(
      (s) => s.entryIds.includes('q-001') && s.entryIds.includes('q-002'),
    );
    expect(pair).toBeDefined();
  });

  it('does not suggest parallel for dependent milestones', () => {
    const entries: QueueEntry[] = [
      makeEntry({ id: 'q-001', domain: 'auth' }),
      makeEntry({ id: 'q-002', domain: 'api' }),
    ];
    const manifests = new Map<string, ResourceManifest>([
      ['q-001', makeManifest()],
      ['q-002', makeManifest()],
    ]);
    const edges: DependencyEdge[] = [
      { from: 'q-001', to: 'q-002', reason: 'auth required before api' },
    ];

    const results = analyzeOptimizations(entries, manifests, edges);
    const parallelSuggestions = results.filter((s) => s.type === 'parallel');

    // Should not contain a suggestion pairing q-001 and q-002
    const pairSuggestion = parallelSuggestions.find(
      (s) => s.entryIds.includes('q-001') && s.entryIds.includes('q-002'),
    );
    expect(pairSuggestion).toBeUndefined();
  });

  it('detects partial independence in three entries', () => {
    const entries: QueueEntry[] = [
      makeEntry({ id: 'q-A', domain: 'auth' }),
      makeEntry({ id: 'q-B', domain: 'api' }),
      makeEntry({ id: 'q-C', domain: 'ui' }),
    ];
    const manifests = new Map<string, ResourceManifest>([
      ['q-A', makeManifest()],
      ['q-B', makeManifest()],
      ['q-C', makeManifest()],
    ]);
    // A -> B dependency, C is independent
    const edges: DependencyEdge[] = [
      { from: 'q-A', to: 'q-B', reason: 'A before B' },
    ];

    const results = analyzeOptimizations(entries, manifests, edges);
    const parallelSuggestions = results.filter((s) => s.type === 'parallel');

    // Should have a parallel suggestion involving C
    expect(parallelSuggestions.length).toBeGreaterThanOrEqual(1);

    // q-A and q-B should NOT be in the same parallel suggestion
    const abParallel = parallelSuggestions.find(
      (s) => s.entryIds.includes('q-A') && s.entryIds.includes('q-B'),
    );
    expect(abParallel).toBeUndefined();
  });

  it('detects all-independent entries as single parallel group', () => {
    const entries: QueueEntry[] = [
      makeEntry({ id: 'q-001', domain: 'auth' }),
      makeEntry({ id: 'q-002', domain: 'ui' }),
      makeEntry({ id: 'q-003', domain: 'data' }),
    ];
    const manifests = new Map<string, ResourceManifest>([
      ['q-001', makeManifest()],
      ['q-002', makeManifest()],
      ['q-003', makeManifest()],
    ]);

    const results = analyzeOptimizations(entries, manifests, []);
    const parallelSuggestions = results.filter((s) => s.type === 'parallel');

    expect(parallelSuggestions.length).toBeGreaterThanOrEqual(1);
    const allThree = parallelSuggestions.find(
      (s) => s.entryIds.length === 3,
    );
    expect(allThree).toBeDefined();
    expect(allThree!.entryIds).toEqual(
      expect.arrayContaining(['q-001', 'q-002', 'q-003']),
    );
  });
});

// ============================================================================
// Shared setup (QUEUE-06)
// ============================================================================

describe('analyzeOptimizations - shared setup', () => {
  it('detects same skills needed', () => {
    const entries: QueueEntry[] = [
      makeEntry({ id: 'q-001', domain: 'auth' }),
      makeEntry({ id: 'q-002', domain: 'api' }),
    ];
    const manifests = new Map<string, ResourceManifest>([
      [
        'q-001',
        makeManifest({
          skillMatches: [
            {
              skillName: 'jwt-handler',
              status: 'ready',
              relevance: 0.8,
              reason: 'matches',
            },
            {
              skillName: 'testing-utils',
              status: 'recommended',
              relevance: 0.6,
              reason: 'useful',
            },
          ],
        }),
      ],
      [
        'q-002',
        makeManifest({
          skillMatches: [
            {
              skillName: 'jwt-handler',
              status: 'ready',
              relevance: 0.7,
              reason: 'matches',
            },
            {
              skillName: 'db-connector',
              status: 'ready',
              relevance: 0.9,
              reason: 'needed',
            },
          ],
        }),
      ],
    ]);

    const results = analyzeOptimizations(entries, manifests);
    const sharedSetup = results.filter((s) => s.type === 'shared-setup');

    expect(sharedSetup.length).toBeGreaterThanOrEqual(1);
    const skillShared = sharedSetup.find(
      (s) => s.details.sharedSkills !== undefined,
    );
    expect(skillShared).toBeDefined();
    expect(skillShared!.details.sharedSkills).toEqual(
      expect.arrayContaining(['jwt-handler']),
    );
    expect(skillShared!.entryIds).toEqual(
      expect.arrayContaining(['q-001', 'q-002']),
    );
  });

  it('detects same research / external dependencies', () => {
    const entries: QueueEntry[] = [
      makeEntry({ id: 'q-001', domain: 'backend' }),
      makeEntry({ id: 'q-002', domain: 'worker' }),
    ];
    const manifests = new Map<string, ResourceManifest>([
      [
        'q-001',
        makeManifest({
          visionAnalysis: {
            requirements: [],
            complexity: [],
            ambiguities: [],
            dependencies: [
              { name: 'Redis', type: 'service', confidence: 0.9 },
              { name: 'PostgreSQL', type: 'database', confidence: 0.8 },
            ],
            overallComplexity: 'medium',
            summary: 'backend service',
          },
        }),
      ],
      [
        'q-002',
        makeManifest({
          visionAnalysis: {
            requirements: [],
            complexity: [],
            ambiguities: [],
            dependencies: [
              { name: 'redis', type: 'service', confidence: 0.85 },
              { name: 'RabbitMQ', type: 'service', confidence: 0.7 },
            ],
            overallComplexity: 'medium',
            summary: 'worker service',
          },
        }),
      ],
    ]);

    const results = analyzeOptimizations(entries, manifests);
    const sharedSetup = results.filter((s) => s.type === 'shared-setup');

    expect(sharedSetup.length).toBeGreaterThanOrEqual(1);
    const depShared = sharedSetup.find(
      (s) => s.details.sharedDependencies !== undefined,
    );
    expect(depShared).toBeDefined();
    // Case-insensitive match: Redis / redis
    expect(depShared!.details.sharedDependencies).toEqual(
      expect.arrayContaining(['redis']),
    );
  });

  it('detects same topology recommendation', () => {
    const entries: QueueEntry[] = [
      makeEntry({ id: 'q-001', domain: 'a' }),
      makeEntry({ id: 'q-002', domain: 'b' }),
    ];
    const manifests = new Map<string, ResourceManifest>([
      [
        'q-001',
        makeManifest({
          topology: {
            topology: 'pipeline',
            rationale: 'multi-step',
            confidence: 0.7,
            agentCount: 3,
          },
        }),
      ],
      [
        'q-002',
        makeManifest({
          topology: {
            topology: 'pipeline',
            rationale: 'sequential work',
            confidence: 0.6,
            agentCount: 2,
          },
        }),
      ],
    ]);

    const results = analyzeOptimizations(entries, manifests);
    const sharedSetup = results.filter((s) => s.type === 'shared-setup');

    expect(sharedSetup.length).toBeGreaterThanOrEqual(1);
    const topoShared = sharedSetup.find(
      (s) => s.details.sharedTopology !== undefined,
    );
    expect(topoShared).toBeDefined();
    expect(topoShared!.details.sharedTopology).toBe('pipeline');
  });

  it('produces no shared-setup for completely different entries', () => {
    const entries: QueueEntry[] = [
      makeEntry({ id: 'q-001', domain: 'auth' }),
      makeEntry({ id: 'q-002', domain: 'ui' }),
    ];
    const manifests = new Map<string, ResourceManifest>([
      [
        'q-001',
        makeManifest({
          skillMatches: [
            {
              skillName: 'jwt-handler',
              status: 'ready',
              relevance: 0.8,
              reason: 'matches',
            },
          ],
          topology: {
            topology: 'single',
            rationale: 'simple',
            confidence: 0.8,
            agentCount: 1,
          },
          visionAnalysis: {
            requirements: [],
            complexity: [],
            ambiguities: [],
            dependencies: [
              { name: 'bcrypt', type: 'library', confidence: 0.9 },
            ],
            overallComplexity: 'low',
            summary: 'auth',
          },
        }),
      ],
      [
        'q-002',
        makeManifest({
          skillMatches: [
            {
              skillName: 'react-components',
              status: 'ready',
              relevance: 0.9,
              reason: 'matches',
            },
          ],
          topology: {
            topology: 'map-reduce',
            rationale: 'parallel pages',
            confidence: 0.7,
            agentCount: 4,
          },
          visionAnalysis: {
            requirements: [],
            complexity: [],
            ambiguities: [],
            dependencies: [
              { name: 'React', type: 'library', confidence: 0.95 },
            ],
            overallComplexity: 'medium',
            summary: 'ui',
          },
        }),
      ],
    ]);

    const results = analyzeOptimizations(entries, manifests);
    const sharedSetup = results.filter((s) => s.type === 'shared-setup');
    expect(sharedSetup).toHaveLength(0);
  });
});

// ============================================================================
// Edge cases
// ============================================================================

describe('analyzeOptimizations - edge cases', () => {
  it('returns empty array for empty input', () => {
    const results = analyzeOptimizations([], new Map());
    expect(results).toEqual([]);
  });

  it('returns empty array for single entry', () => {
    const entries: QueueEntry[] = [
      makeEntry({ id: 'q-001', domain: 'auth' }),
    ];
    const manifests = new Map<string, ResourceManifest>([
      ['q-001', makeManifest()],
    ]);

    const results = analyzeOptimizations(entries, manifests);
    expect(results).toEqual([]);
  });

  it('returns only parallel suggestions when manifests are empty', () => {
    const entries: QueueEntry[] = [
      makeEntry({ id: 'q-001', domain: 'auth' }),
      makeEntry({ id: 'q-002', domain: 'ui' }),
    ];
    const manifests = new Map<string, ResourceManifest>();

    const results = analyzeOptimizations(entries, manifests, []);
    // Should get parallel suggestions (no dependency edges)
    const parallelSuggestions = results.filter((s) => s.type === 'parallel');
    expect(parallelSuggestions.length).toBeGreaterThanOrEqual(1);

    // Should NOT have batch or shared-setup (no manifest data to check)
    const batchSuggestions = results.filter((s) => s.type === 'batch');
    const sharedSuggestions = results.filter((s) => s.type === 'shared-setup');
    // Domain batching comes from QueueEntry.domain, so different domains = no batch
    expect(batchSuggestions).toHaveLength(0);
    expect(sharedSuggestions).toHaveLength(0);
  });

  it('sorts suggestions by confidence descending', () => {
    // Create entries that trigger multiple suggestion types
    const entries: QueueEntry[] = [
      makeEntry({ id: 'q-001', domain: 'auth' }),
      makeEntry({ id: 'q-002', domain: 'auth' }),
    ];
    const manifests = new Map<string, ResourceManifest>([
      [
        'q-001',
        makeManifest({
          skillMatches: [
            {
              skillName: 'jwt-handler',
              status: 'ready',
              relevance: 0.8,
              reason: 'matches',
            },
          ],
          topology: {
            topology: 'pipeline',
            rationale: 'multi-step',
            confidence: 0.7,
            agentCount: 3,
          },
        }),
      ],
      [
        'q-002',
        makeManifest({
          skillMatches: [
            {
              skillName: 'jwt-handler',
              status: 'ready',
              relevance: 0.7,
              reason: 'matches',
            },
          ],
          topology: {
            topology: 'pipeline',
            rationale: 'sequential',
            confidence: 0.6,
            agentCount: 2,
          },
        }),
      ],
    ]);

    const results = analyzeOptimizations(entries, manifests, []);

    // Results should be sorted by confidence descending
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].confidence).toBeGreaterThanOrEqual(
        results[i].confidence,
      );
    }
  });
});
