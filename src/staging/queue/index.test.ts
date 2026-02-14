/**
 * Integration tests for the queue submodule barrel index.
 *
 * Verifies all type-only and value exports are importable and
 * have the expected types. Also verifies createQueueManager
 * returns an object with all expected methods. Includes integration
 * tests for pre-wiring, retroactive audit, and dashboard panel.
 *
 * @module staging/queue/index.test
 */

import { describe, it, expect, vi } from 'vitest';
import {
  // Constants
  QUEUE_STATES,
  VALID_QUEUE_TRANSITIONS,
  OPTIMIZATION_TYPES,
  ELIGIBLE_STATES,
  SEVERITY_ORDER,
  // Functions
  transitionQueueItem,
  appendAuditEntry,
  readAuditLog,
  detectDependencies,
  analyzeOptimizations,
  createQueueManager,
  generatePreWiring,
  recommendRetroactiveAudit,
} from './index.js';

import type {
  // Type-only exports
  QueueState,
  QueueEntry,
  QueueAuditEntry,
  AuditLoggerDeps,
  DependencyEdge,
  DependencyGraph,
  OptimizationSuggestion,
  OptimizationType,
  QueueManagerDeps,
  // Pre-wiring type-only exports
  PreWiringOptions,
  PreWiringResult,
  PreWiredSkill,
  PreWiredTopology,
  PreWiredAgent,
  // Retroactive audit type-only exports
  RetroactiveAuditOptions,
  RetroactiveAuditRecommendation,
  PatternTrigger,
} from './index.js';

import type { ResourceManifest } from '../resource/types.js';
import type { HygienePattern } from '../hygiene/types.js';

import { renderStagingQueuePanel } from '../../dashboard/staging-queue-panel.js';

// ============================================================================
// Value exports
// ============================================================================

describe('queue barrel: value exports', () => {
  it('exports QUEUE_STATES as an array', () => {
    expect(Array.isArray(QUEUE_STATES)).toBe(true);
    expect(QUEUE_STATES.length).toBeGreaterThan(0);
  });

  it('exports VALID_QUEUE_TRANSITIONS as an object', () => {
    expect(typeof VALID_QUEUE_TRANSITIONS).toBe('object');
    expect(VALID_QUEUE_TRANSITIONS).not.toBeNull();
  });

  it('exports OPTIMIZATION_TYPES as an array', () => {
    expect(Array.isArray(OPTIMIZATION_TYPES)).toBe(true);
    expect(OPTIMIZATION_TYPES.length).toBeGreaterThan(0);
  });

  it('exports transitionQueueItem as a function', () => {
    expect(typeof transitionQueueItem).toBe('function');
  });

  it('exports appendAuditEntry as a function', () => {
    expect(typeof appendAuditEntry).toBe('function');
  });

  it('exports readAuditLog as a function', () => {
    expect(typeof readAuditLog).toBe('function');
  });

  it('exports detectDependencies as a function', () => {
    expect(typeof detectDependencies).toBe('function');
  });

  it('exports analyzeOptimizations as a function', () => {
    expect(typeof analyzeOptimizations).toBe('function');
  });

  it('exports createQueueManager as a function', () => {
    expect(typeof createQueueManager).toBe('function');
  });

  it('exports generatePreWiring as a function', () => {
    expect(typeof generatePreWiring).toBe('function');
  });

  it('exports recommendRetroactiveAudit as a function', () => {
    expect(typeof recommendRetroactiveAudit).toBe('function');
  });

  it('exports ELIGIBLE_STATES as a Set', () => {
    expect(ELIGIBLE_STATES instanceof Set).toBe(true);
    expect(ELIGIBLE_STATES.has('ready')).toBe(true);
    expect(ELIGIBLE_STATES.has('queued')).toBe(true);
  });

  it('exports SEVERITY_ORDER as an object', () => {
    expect(typeof SEVERITY_ORDER).toBe('object');
    expect(SEVERITY_ORDER.critical).toBe(0);
    expect(SEVERITY_ORDER.info).toBe(4);
  });
});

// ============================================================================
// Type-only exports (compile-time verification)
// ============================================================================

describe('queue barrel: type-only exports', () => {
  it('type-only exports are importable (140 types)', () => {
    // These are compile-time checks. If the imports above succeeded,
    // the types are importable. We verify by using them in type positions.
    const _state: QueueState = 'uploaded';
    const _entry: Partial<QueueEntry> = { id: 'q-1' };
    const _audit: Partial<QueueAuditEntry> = { id: 'audit-1' };
    const _deps: Partial<AuditLoggerDeps> = {};
    const _edge: Partial<DependencyEdge> = {};
    const _graph: Partial<DependencyGraph> = {};
    const _suggestion: Partial<OptimizationSuggestion> = {};
    const _type: OptimizationType = 'batch';
    const _managerDeps: Partial<QueueManagerDeps> = {};

    // Suppress unused variable warnings
    expect(_state).toBe('uploaded');
    expect(_entry.id).toBe('q-1');
    expect(_audit.id).toBe('audit-1');
    expect(_deps).toBeDefined();
    expect(_edge).toBeDefined();
    expect(_graph).toBeDefined();
    expect(_suggestion).toBeDefined();
    expect(_type).toBe('batch');
    expect(_managerDeps).toBeDefined();
  });

  it('type-only exports are importable (141 pre-wiring types)', () => {
    const _opts: Partial<PreWiringOptions> = {};
    const _result: Partial<PreWiringResult> = {};
    const _skill: Partial<PreWiredSkill> = {};
    const _topo: Partial<PreWiredTopology> = {};
    const _agent: Partial<PreWiredAgent> = {};

    expect(_opts).toBeDefined();
    expect(_result).toBeDefined();
    expect(_skill).toBeDefined();
    expect(_topo).toBeDefined();
    expect(_agent).toBeDefined();
  });

  it('type-only exports are importable (141 retroactive audit types)', () => {
    const _opts: Partial<RetroactiveAuditOptions> = {};
    const _rec: Partial<RetroactiveAuditRecommendation> = {};
    const _trigger: Partial<PatternTrigger> = {};

    expect(_opts).toBeDefined();
    expect(_rec).toBeDefined();
    expect(_trigger).toBeDefined();
  });
});

// ============================================================================
// createQueueManager interface
// ============================================================================

describe('queue barrel: createQueueManager returns expected methods', () => {
  it('returns object with all 6 queue manager methods', () => {
    const manager = createQueueManager({ basePath: '/test' }, {
      appendAuditEntry: vi.fn(async () => {}),
      readAuditLog: vi.fn(async () => []),
      readFile: vi.fn(async () => '[]'),
      writeFile: vi.fn(async () => {}),
      mkdir: vi.fn(async () => undefined),
    });

    expect(typeof manager.addEntry).toBe('function');
    expect(typeof manager.transition).toBe('function');
    expect(typeof manager.getEntry).toBe('function');
    expect(typeof manager.listEntries).toBe('function');
    expect(typeof manager.analyzeQueue).toBe('function');
    expect(typeof manager.getAuditLog).toBe('function');
  });
});

// ============================================================================
// Integration: pre-wiring
// ============================================================================

describe('queue barrel: pre-wiring integration', () => {
  it('generates pre-wiring from a minimal resource manifest', () => {
    const manifest: ResourceManifest = {
      visionAnalysis: {
        requirements: [
          { id: 'r-1', description: 'auth system', category: 'authentication', confidence: 0.9 },
          { id: 'r-2', description: 'data store', category: 'data-storage', confidence: 0.8 },
        ],
        complexity: [],
        ambiguities: [],
        dependencies: [],
        overallComplexity: 'medium',
        summary: 'Test project with auth and storage',
      },
      skillMatches: [
        { skillName: 'auth-skill', status: 'ready', relevance: 0.9, reason: 'matches', scope: 'project' },
        { skillName: 'db-skill', status: 'ready', relevance: 0.8, reason: 'matches', scope: 'user' },
      ],
      topology: {
        topology: 'pipeline',
        rationale: 'Sequential auth then storage',
        confidence: 0.85,
        agentCount: 2,
      },
      tokenBudget: {
        total: 100000,
        categories: {
          'skill-loading': 5000,
          planning: 20000,
          execution: 50000,
          research: 10000,
          verification: 10000,
          hitl: 3000,
          'safety-margin': 2000,
        },
        contextWindowSize: 200000,
        utilizationPercent: 50,
      },
      decomposition: {
        subtasks: [],
        criticalPath: [],
        maxParallelism: 2,
        sharedResources: [],
      },
      hitlPredictions: [],
      queueContext: {
        priority: 2,
        estimatedDuration: '30m',
        tags: ['auth', 'storage'],
      },
      generatedAt: '2026-02-13T00:00:00Z',
    };

    const result = generatePreWiring({ manifest, entryId: 'q-test-001' });

    // Skills: 2 ready skills (no missing)
    expect(result.skills).toHaveLength(2);
    expect(result.skills[0].name).toBe('auth-skill');
    expect(result.skills[1].name).toBe('db-skill');

    // Topology
    expect(result.topology.type).toBe('pipeline');
    expect(result.topology.agentCount).toBe(2);

    // Agents: pipeline with 2 agents
    expect(result.agents).toHaveLength(2);
    expect(result.agents[0].role).toBe('stage-1');
    expect(result.agents[1].role).toBe('stage-2');

    // Gaps: none (no missing skills)
    expect(result.gaps).toHaveLength(0);

    // Markdown contains heading
    expect(result.markdown).toContain('Pre-Wired Resources');

    // Entry ID tracked
    expect(result.entryId).toBe('q-test-001');
  });
});

// ============================================================================
// Integration: retroactive audit
// ============================================================================

describe('queue barrel: retroactive audit integration', () => {
  it('recommends audits for eligible entries when new patterns are added', () => {
    const now = '2026-02-13T00:00:00Z';

    const entries: QueueEntry[] = [
      {
        id: 'q-ready',
        filename: 'milestone-a.md',
        state: 'ready',
        milestoneName: 'Milestone A',
        domain: 'auth',
        tags: ['auth'],
        resourceManifestPath: '/ready/milestone-a.manifest.json',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'q-queued',
        filename: 'milestone-b.md',
        state: 'queued',
        milestoneName: 'Milestone B',
        domain: 'storage',
        tags: ['storage'],
        resourceManifestPath: '/ready/milestone-b.manifest.json',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'q-executing',
        filename: 'milestone-c.md',
        state: 'executing',
        milestoneName: 'Milestone C',
        domain: 'ui',
        tags: ['ui'],
        resourceManifestPath: '/ready/milestone-c.manifest.json',
        createdAt: now,
        updatedAt: now,
      },
    ];

    const newPattern: HygienePattern = {
      id: 'test-pattern',
      name: 'Test Injection Pattern',
      category: 'embedded-instructions',
      severity: 'high',
      description: 'Test pattern for retroactive audit',
      regex: /test-injection/g,
    };

    const recommendations = recommendRetroactiveAudit({
      entries,
      newPatterns: [newPattern],
    });

    // Only ready + queued entries (not executing)
    expect(recommendations).toHaveLength(2);

    // Each recommendation has the triggering pattern
    for (const rec of recommendations) {
      expect(rec.triggeringPatterns).toHaveLength(1);
      expect(rec.triggeringPatterns[0].patternId).toBe('test-pattern');
      expect(rec.triggeringPatterns[0].severity).toBe('high');
    }

    // Entry IDs match eligible entries
    const ids = recommendations.map((r) => r.entryId);
    expect(ids).toContain('q-ready');
    expect(ids).toContain('q-queued');
    expect(ids).not.toContain('q-executing');
  });
});

// ============================================================================
// Integration: staging queue panel
// ============================================================================

describe('queue barrel: staging queue panel integration', () => {
  it('renders queue data as HTML with cards, columns, and SVG overlay', () => {
    const now = '2026-02-13T00:00:00Z';

    const entries: QueueEntry[] = [
      {
        id: 'q-1',
        filename: 'alpha.md',
        state: 'ready',
        milestoneName: 'Alpha Release',
        domain: 'core',
        tags: ['core', 'mvp'],
        resourceManifestPath: '/ready/alpha.manifest.json',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'q-2',
        filename: 'beta.md',
        state: 'uploaded',
        milestoneName: 'Beta Release',
        domain: 'extensions',
        tags: ['extensions'],
        resourceManifestPath: '/ready/beta.manifest.json',
        createdAt: now,
        updatedAt: now,
      },
    ];

    const deps: DependencyEdge[] = [
      {
        from: 'q-2',
        to: 'q-1',
        type: 'explicit',
        confidence: 0.85,
        reason: 'Beta depends on Alpha',
      },
    ];

    const html = renderStagingQueuePanel({ entries, dependencies: deps });

    // Contains card elements
    expect(html).toContain('sq-card');
    expect(html).toContain('data-entry-id="q-1"');
    expect(html).toContain('data-entry-id="q-2"');

    // Contains column divs
    expect(html).toContain('sq-column');
    expect(html).toContain('sq-column-header');

    // Contains SVG overlay with dependency line
    expect(html).toContain('sq-dep-overlay');
    expect(html).toContain('data-from="q-2"');
    expect(html).toContain('data-to="q-1"');

    // Contains milestone names
    expect(html).toContain('Alpha Release');
    expect(html).toContain('Beta Release');
  });
});
