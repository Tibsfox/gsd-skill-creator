/**
 * Tests for cross-queue dependency detection between milestones.
 *
 * Verifies that detectDependencies identifies explicit keyword
 * dependencies, implicit shared-resource dependencies, and correctly
 * assigns confidence scores.
 *
 * @module staging/queue/dependency-detector.test
 */

import { describe, it, expect } from 'vitest';
import { detectDependencies } from './dependency-detector.js';
import type { DependencyEdge, DependencyGraph } from './dependency-detector.js';
import type { QueueEntry } from './types.js';
import type { ResourceManifest } from '../resource/types.js';

// ============================================================================
// Fixtures
// ============================================================================

function makeEntry(overrides: Partial<QueueEntry> = {}): QueueEntry {
  return {
    id: 'q-20240101-001',
    filename: 'doc.md',
    state: 'queued',
    milestoneName: 'Default Milestone',
    domain: 'general',
    tags: [],
    resourceManifestPath: '.planning/staging/ready/doc.manifest.json',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeManifest(
  overrides: Partial<ResourceManifest> = {},
): ResourceManifest {
  const base: ResourceManifest = {
    visionAnalysis: {
      requirements: [],
      complexity: [],
      ambiguities: [],
      dependencies: [],
      overallComplexity: 'low',
      summary: '',
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
        research: 10000,
        verification: 15000,
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
  };

  return {
    ...base,
    ...overrides,
    visionAnalysis: {
      ...base.visionAnalysis,
      ...overrides.visionAnalysis,
    },
    queueContext: {
      ...base.queueContext,
      ...overrides.queueContext,
    },
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('detectDependencies', () => {
  // --------------------------------------------------------------------------
  // Empty and single entry
  // --------------------------------------------------------------------------

  it('returns empty graph for no entries', () => {
    const result = detectDependencies([], new Map());

    expect(result.edges).toEqual([]);
    expect(result.entryIds).toEqual([]);
  });

  it('returns graph with one entryId and no edges for single entry', () => {
    const entry = makeEntry({ id: 'q-001' });
    const result = detectDependencies([entry], new Map());

    expect(result.entryIds).toEqual(['q-001']);
    expect(result.edges).toEqual([]);
  });

  // --------------------------------------------------------------------------
  // Explicit keyword dependencies
  // --------------------------------------------------------------------------

  it('detects explicit forward keyword dependency (requires)', () => {
    const entryA = makeEntry({
      id: 'q-auth',
      milestoneName: 'Auth System',
      domain: 'authentication',
    });
    const entryB = makeEntry({
      id: 'q-dash',
      milestoneName: 'User Dashboard (requires Auth System)',
      domain: 'ui',
    });

    const result = detectDependencies([entryA, entryB], new Map());

    expect(result.edges.length).toBe(1);
    const edge = result.edges[0];
    expect(edge.from).toBe('q-dash'); // B depends on A
    expect(edge.to).toBe('q-auth');
    expect(edge.type).toBe('explicit');
    expect(edge.confidence).toBeGreaterThanOrEqual(0.8);
  });

  it('detects explicit reverse keyword dependency (blocks)', () => {
    const entryA = makeEntry({
      id: 'q-api',
      milestoneName: 'API Layer (blocks Dashboard)',
      domain: 'backend',
    });
    const entryB = makeEntry({
      id: 'q-dash',
      milestoneName: 'Dashboard',
      domain: 'ui',
    });

    const result = detectDependencies([entryA, entryB], new Map());

    expect(result.edges.length).toBe(1);
    const edge = result.edges[0];
    // "blocks" means B depends on A (A blocks B, so B depends on A)
    expect(edge.from).toBe('q-dash');
    expect(edge.to).toBe('q-api');
    expect(edge.type).toBe('explicit');
  });

  // --------------------------------------------------------------------------
  // Implicit dependencies via shared external deps
  // --------------------------------------------------------------------------

  it('detects implicit dependency via shared external dependencies', () => {
    const entryA = makeEntry({ id: 'q-svc1', milestoneName: 'Service One', domain: 'backend' });
    const entryB = makeEntry({ id: 'q-svc2', milestoneName: 'Service Two', domain: 'data' });

    const manifests = new Map<string, ResourceManifest>();
    manifests.set(
      'q-svc1',
      makeManifest({
        visionAnalysis: {
          requirements: [],
          complexity: [],
          ambiguities: [],
          dependencies: [
            { name: 'postgres', type: 'database', confidence: 0.9 },
          ],
          overallComplexity: 'low',
          summary: 'Service using postgres',
        },
      }),
    );
    manifests.set(
      'q-svc2',
      makeManifest({
        visionAnalysis: {
          requirements: [],
          complexity: [],
          ambiguities: [],
          dependencies: [
            { name: 'Postgres', type: 'database', confidence: 0.9 },
          ],
          overallComplexity: 'low',
          summary: 'Another service using Postgres',
        },
      }),
    );

    const result = detectDependencies([entryA, entryB], manifests);

    expect(result.edges.length).toBeGreaterThanOrEqual(1);
    const implicitEdge = result.edges.find((e) => e.type === 'implicit');
    expect(implicitEdge).toBeDefined();
    expect(implicitEdge!.confidence).toBeGreaterThanOrEqual(0.3);
    expect(implicitEdge!.confidence).toBeLessThanOrEqual(0.6);
  });

  // --------------------------------------------------------------------------
  // Implicit dependencies via overlapping domain requirements
  // --------------------------------------------------------------------------

  it('detects implicit dependency via overlapping requirement categories', () => {
    const entryA = makeEntry({ id: 'q-login', milestoneName: 'Login Flow', domain: 'auth' });
    const entryB = makeEntry({ id: 'q-perms', milestoneName: 'Permissions System', domain: 'auth' });

    const manifests = new Map<string, ResourceManifest>();
    manifests.set(
      'q-login',
      makeManifest({
        visionAnalysis: {
          requirements: [
            {
              id: 'req-1',
              description: 'User authentication flow',
              category: 'authentication',
              confidence: 0.9,
            },
          ],
          complexity: [],
          ambiguities: [],
          dependencies: [],
          overallComplexity: 'low',
          summary: 'Login flow with authentication',
        },
      }),
    );
    manifests.set(
      'q-perms',
      makeManifest({
        visionAnalysis: {
          requirements: [
            {
              id: 'req-2',
              description: 'Role-based access authentication',
              category: 'authentication',
              confidence: 0.9,
            },
          ],
          complexity: [],
          ambiguities: [],
          dependencies: [],
          overallComplexity: 'low',
          summary: 'Permissions with authentication',
        },
      }),
    );

    const result = detectDependencies([entryA, entryB], manifests);

    const implicitEdge = result.edges.find((e) => e.type === 'implicit');
    expect(implicitEdge).toBeDefined();
    expect(implicitEdge!.type).toBe('implicit');
  });

  // --------------------------------------------------------------------------
  // No dependencies between unrelated milestones
  // --------------------------------------------------------------------------

  it('returns no edges for unrelated milestones', () => {
    const entryA = makeEntry({
      id: 'q-email',
      milestoneName: 'Email Notifications',
      domain: 'messaging',
    });
    const entryB = makeEntry({
      id: 'q-chart',
      milestoneName: 'Chart Rendering',
      domain: 'visualization',
    });

    const manifests = new Map<string, ResourceManifest>();
    manifests.set(
      'q-email',
      makeManifest({
        visionAnalysis: {
          requirements: [
            { id: 'req-1', description: 'SMTP integration', category: 'email', confidence: 0.9 },
          ],
          complexity: [],
          ambiguities: [],
          dependencies: [{ name: 'sendgrid', type: 'service', confidence: 0.9 }],
          overallComplexity: 'low',
          summary: 'Email notification system',
        },
      }),
    );
    manifests.set(
      'q-chart',
      makeManifest({
        visionAnalysis: {
          requirements: [
            { id: 'req-2', description: 'SVG rendering', category: 'rendering', confidence: 0.9 },
          ],
          complexity: [],
          ambiguities: [],
          dependencies: [{ name: 'd3', type: 'library', confidence: 0.9 }],
          overallComplexity: 'low',
          summary: 'Chart rendering engine',
        },
      }),
    );

    const result = detectDependencies([entryA, entryB], manifests);

    expect(result.entryIds).toHaveLength(2);
    expect(result.edges).toHaveLength(0);
  });

  // --------------------------------------------------------------------------
  // Multiple dependencies
  // --------------------------------------------------------------------------

  it('detects multiple dependencies across three entries', () => {
    const entryA = makeEntry({
      id: 'q-core',
      milestoneName: 'Core Framework',
      domain: 'infrastructure',
    });
    const entryB = makeEntry({
      id: 'q-auth',
      milestoneName: 'Auth Module (requires Core Framework)',
      domain: 'auth',
    });
    const entryC = makeEntry({
      id: 'q-api',
      milestoneName: 'API Layer (requires Core Framework)',
      domain: 'api',
    });

    const result = detectDependencies([entryA, entryB, entryC], new Map());

    expect(result.edges.length).toBe(2);
    expect(result.entryIds).toHaveLength(3);

    const edgeB = result.edges.find((e) => e.from === 'q-auth');
    const edgeC = result.edges.find((e) => e.from === 'q-api');
    expect(edgeB).toBeDefined();
    expect(edgeB!.to).toBe('q-core');
    expect(edgeC).toBeDefined();
    expect(edgeC!.to).toBe('q-core');
  });

  // --------------------------------------------------------------------------
  // Confidence: explicit > implicit
  // --------------------------------------------------------------------------

  it('explicit dependencies have higher confidence than implicit', () => {
    const entryA = makeEntry({
      id: 'q-base',
      milestoneName: 'Base Layer',
      domain: 'infra',
    });
    const entryB = makeEntry({
      id: 'q-dep',
      milestoneName: 'Dependent Module (depends on Base Layer)',
      domain: 'infra',
    });

    const manifests = new Map<string, ResourceManifest>();
    manifests.set(
      'q-base',
      makeManifest({
        visionAnalysis: {
          requirements: [],
          complexity: [],
          ambiguities: [],
          dependencies: [
            { name: 'redis', type: 'database', confidence: 0.9 },
          ],
          overallComplexity: 'low',
          summary: 'Base layer with redis',
        },
      }),
    );
    manifests.set(
      'q-dep',
      makeManifest({
        visionAnalysis: {
          requirements: [],
          complexity: [],
          ambiguities: [],
          dependencies: [
            { name: 'redis', type: 'database', confidence: 0.9 },
          ],
          overallComplexity: 'low',
          summary: 'Dependent module with redis',
        },
      }),
    );

    const result = detectDependencies([entryA, entryB], manifests);

    // Should have explicit edge (from keyword), possibly implicit too but deduped
    const explicitEdge = result.edges.find((e) => e.type === 'explicit');
    expect(explicitEdge).toBeDefined();
    expect(explicitEdge!.confidence).toBeGreaterThanOrEqual(0.8);

    // If any implicit edges remain (for different pairs), they should be lower
    const implicitEdges = result.edges.filter((e) => e.type === 'implicit');
    for (const ie of implicitEdges) {
      expect(ie.confidence).toBeLessThan(explicitEdge!.confidence);
    }
  });

  // --------------------------------------------------------------------------
  // Self-dependency not produced
  // --------------------------------------------------------------------------

  it('does not produce self-referencing edges', () => {
    const entry = makeEntry({
      id: 'q-self',
      milestoneName: 'Auth System (requires Auth System)',
      domain: 'auth',
    });

    const result = detectDependencies([entry], new Map());

    expect(result.edges).toHaveLength(0);
    expect(result.entryIds).toEqual(['q-self']);
  });

  // --------------------------------------------------------------------------
  // Entries without manifests
  // --------------------------------------------------------------------------

  it('handles entries without manifests gracefully', () => {
    const entryA = makeEntry({ id: 'q-nomf', milestoneName: 'No Manifest', domain: 'x' });
    const entryB = makeEntry({ id: 'q-hasmf', milestoneName: 'Has Manifest', domain: 'y' });

    const manifests = new Map<string, ResourceManifest>();
    manifests.set(
      'q-hasmf',
      makeManifest({
        visionAnalysis: {
          requirements: [
            { id: 'req-1', description: 'Something', category: 'test', confidence: 0.9 },
          ],
          complexity: [],
          ambiguities: [],
          dependencies: [],
          overallComplexity: 'low',
          summary: 'Has a manifest',
        },
      }),
    );

    // Should not throw; both entries appear in entryIds
    const result = detectDependencies([entryA, entryB], manifests);

    expect(result.entryIds).toContain('q-nomf');
    expect(result.entryIds).toContain('q-hasmf');
  });

  // --------------------------------------------------------------------------
  // Type structure
  // --------------------------------------------------------------------------

  it('DependencyEdge has correct structure', () => {
    const entryA = makeEntry({
      id: 'q-a',
      milestoneName: 'Foundation',
      domain: 'core',
    });
    const entryB = makeEntry({
      id: 'q-b',
      milestoneName: 'Feature (requires Foundation)',
      domain: 'feature',
    });

    const result = detectDependencies([entryA, entryB], new Map());

    expect(result.edges.length).toBe(1);
    const edge: DependencyEdge = result.edges[0];

    expect(typeof edge.from).toBe('string');
    expect(typeof edge.to).toBe('string');
    expect(['explicit', 'implicit']).toContain(edge.type);
    expect(typeof edge.reason).toBe('string');
    expect(typeof edge.confidence).toBe('number');
  });

  it('DependencyGraph has correct structure', () => {
    const result: DependencyGraph = detectDependencies([], new Map());

    expect(Array.isArray(result.edges)).toBe(true);
    expect(Array.isArray(result.entryIds)).toBe(true);
  });
});
