import { describe, it, expect } from 'vitest';
import {
  buildGraph,
  DependencyGraph,
  GraphBuildResult,
  GraphNode,
  GraphEdge,
  GraphBuildError,
  DomainDataFile,
  DependencyDataFile,
} from './dependency-graph.js';
import type { MathematicalPrimitive, DependencyEdge, DomainId } from '../core/types/mfe-types.js';

// === Test Helpers ===

function makePrimitive(
  id: string,
  domain: DomainId,
  deps: DependencyEdge[] = [],
  enables: string[] = [],
): MathematicalPrimitive {
  return {
    id,
    name: id.replace(/-/g, ' '),
    type: 'definition',
    domain,
    chapter: 1,
    section: '1.1',
    planePosition: { real: 0, imaginary: 0 },
    formalStatement: `Formal statement for ${id}`,
    computationalForm: '',
    prerequisites: [],
    dependencies: deps,
    enables,
    compositionRules: [],
    applicabilityPatterns: [],
    keywords: [],
    tags: [],
    buildLabs: [],
  };
}

function makeDomainFile(
  domain: DomainId,
  primitives: MathematicalPrimitive[],
): DomainDataFile {
  return { domain, version: '1.35.0', primitives };
}

function makeDepFile(
  scope: string,
  edges: DependencyDataFile['edges'],
): DependencyDataFile {
  return { version: '1.35.0', scope, edges };
}

// === Tests ===

describe('buildGraph', () => {
  it('builds graph from domain and dependency data', () => {
    const p1 = makePrimitive('domain-a-p1', 'perception');
    const p2 = makePrimitive('domain-a-p2', 'perception');
    const p3 = makePrimitive('domain-a-p3', 'perception');
    const p4 = makePrimitive('domain-b-p1', 'waves');
    const p5 = makePrimitive('domain-b-p2', 'waves');
    const p6 = makePrimitive('domain-b-p3', 'waves');

    const domainFiles = [
      makeDomainFile('perception', [p1, p2, p3]),
      makeDomainFile('waves', [p4, p5, p6]),
    ];

    const depFiles = [
      makeDepFile('test', [
        { source: 'domain-b-p1', target: 'domain-a-p1', type: 'requires', strength: 1, description: 'test edge 1' },
        { source: 'domain-b-p2', target: 'domain-a-p2', type: 'motivates', strength: 0.8, description: 'test edge 2' },
      ]),
    ];

    const result = buildGraph(domainFiles, depFiles);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.graph.nodeCount).toBe(6);
      expect(result.graph.edgeCount).toBeGreaterThan(0);
    }
  });

  it('includes both inline dependencies and external dependency file edges', () => {
    const p1 = makePrimitive('source-node', 'perception', [
      { target: 'target-node', type: 'requires', strength: 1, description: 'inline dep' },
    ]);
    const p2 = makePrimitive('target-node', 'perception');

    const domainFiles = [makeDomainFile('perception', [p1, p2])];
    const depFiles = [
      makeDepFile('external', [
        { source: 'source-node', target: 'target-node', type: 'motivates', strength: 0.5, description: 'external dep' },
      ]),
    ];

    const result = buildGraph(domainFiles, depFiles);

    expect(result.ok).toBe(true);
    if (result.ok) {
      const neighbors = result.graph.getNeighbors('source-node');
      expect(neighbors.length).toBe(2);
      const types = neighbors.map(e => e.type);
      expect(types).toContain('requires');
      expect(types).toContain('motivates');
    }
  });

  it('returns all primitives as nodes even when they have no edges', () => {
    const p1 = makePrimitive('isolated-node', 'perception');

    const domainFiles = [makeDomainFile('perception', [p1])];
    const depFiles: DependencyDataFile[] = [];

    const result = buildGraph(domainFiles, depFiles);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.graph.nodeCount).toBe(1);
      expect(result.graph.hasNode('isolated-node')).toBe(true);
      expect(result.graph.getNeighbors('isolated-node')).toEqual([]);
    }
  });
});

describe('referential integrity — SAFE-02', () => {
  it('rejects edges whose target does not exist in registry', () => {
    const p1 = makePrimitive('existing-node', 'perception', [
      { target: 'nonexistent-primitive', type: 'requires', strength: 1, description: 'bad ref' },
    ]);

    const domainFiles = [makeDomainFile('perception', [p1])];
    const depFiles: DependencyDataFile[] = [];

    const result = buildGraph(domainFiles, depFiles);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].type).toBe('integrity');
      expect(result.errors[0].message).toContain('nonexistent-primitive');
    }
  });

  it('rejects edges whose source does not exist in registry', () => {
    const p1 = makePrimitive('existing-target', 'perception');

    const domainFiles = [makeDomainFile('perception', [p1])];
    const depFiles = [
      makeDepFile('bad-source', [
        { source: 'nonexistent-source', target: 'existing-target', type: 'requires', strength: 1, description: 'bad source ref' },
      ]),
    ];

    const result = buildGraph(domainFiles, depFiles);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].type).toBe('integrity');
      expect(result.errors[0].message).toContain('nonexistent-source');
    }
  });

  it('accepts valid edges where both source and target exist', () => {
    const p1 = makePrimitive('node-a', 'perception', [
      { target: 'node-b', type: 'requires', strength: 1, description: 'valid dep' },
    ]);
    const p2 = makePrimitive('node-b', 'perception');

    const domainFiles = [makeDomainFile('perception', [p1, p2])];
    const depFiles: DependencyDataFile[] = [];

    const result = buildGraph(domainFiles, depFiles);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.errors).toEqual([]);
    }
  });
});

describe('cycle detection — SAFE-01', () => {
  it('detects a direct cycle (A->B->A)', () => {
    const pA = makePrimitive('cycle-a', 'perception', [
      { target: 'cycle-b', type: 'requires', strength: 1, description: 'A depends on B' },
    ]);
    const pB = makePrimitive('cycle-b', 'perception', [
      { target: 'cycle-a', type: 'requires', strength: 1, description: 'B depends on A' },
    ]);

    const domainFiles = [makeDomainFile('perception', [pA, pB])];
    const depFiles: DependencyDataFile[] = [];

    const result = buildGraph(domainFiles, depFiles);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      const cycleError = result.errors.find(e => e.type === 'cycle');
      expect(cycleError).toBeDefined();
    }
  });

  it('detects an indirect cycle (A->B->C->A)', () => {
    const pA = makePrimitive('tri-a', 'perception', [
      { target: 'tri-b', type: 'requires', strength: 1, description: 'A->B' },
    ]);
    const pB = makePrimitive('tri-b', 'perception', [
      { target: 'tri-c', type: 'requires', strength: 1, description: 'B->C' },
    ]);
    const pC = makePrimitive('tri-c', 'perception', [
      { target: 'tri-a', type: 'requires', strength: 1, description: 'C->A' },
    ]);

    const domainFiles = [makeDomainFile('perception', [pA, pB, pC])];
    const depFiles: DependencyDataFile[] = [];

    const result = buildGraph(domainFiles, depFiles);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      const cycleError = result.errors.find(e => e.type === 'cycle');
      expect(cycleError).toBeDefined();
    }
  });

  it('accepts a valid DAG with no cycles', () => {
    // Diamond: A->B, A->C, B->D, C->D
    const pA = makePrimitive('diamond-a', 'perception', [
      { target: 'diamond-b', type: 'requires', strength: 1, description: 'A->B' },
      { target: 'diamond-c', type: 'requires', strength: 1, description: 'A->C' },
    ]);
    const pB = makePrimitive('diamond-b', 'perception', [
      { target: 'diamond-d', type: 'requires', strength: 1, description: 'B->D' },
    ]);
    const pC = makePrimitive('diamond-c', 'perception', [
      { target: 'diamond-d', type: 'requires', strength: 1, description: 'C->D' },
    ]);
    const pD = makePrimitive('diamond-d', 'perception');

    const domainFiles = [makeDomainFile('perception', [pA, pB, pC, pD])];
    const depFiles: DependencyDataFile[] = [];

    const result = buildGraph(domainFiles, depFiles);

    expect(result.ok).toBe(true);
  });

  it('returns topological order when graph is valid', () => {
    // A->B->C (linear chain)
    const pA = makePrimitive('topo-a', 'perception', [
      { target: 'topo-b', type: 'requires', strength: 1, description: 'A->B' },
    ]);
    const pB = makePrimitive('topo-b', 'perception', [
      { target: 'topo-c', type: 'requires', strength: 1, description: 'B->C' },
    ]);
    const pC = makePrimitive('topo-c', 'perception');

    const domainFiles = [makeDomainFile('perception', [pA, pB, pC])];
    const depFiles: DependencyDataFile[] = [];

    const result = buildGraph(domainFiles, depFiles);

    expect(result.ok).toBe(true);
    if (result.ok) {
      const order = result.graph.getTopologicalOrder();
      expect(order.length).toBe(3);

      // In topological order, dependencies come before dependents
      // Since A->B means "A depends on B", B must come before A in topo order
      const idxA = order.indexOf('topo-a');
      const idxB = order.indexOf('topo-b');
      const idxC = order.indexOf('topo-c');

      // C has no deps, so it's earliest; B depends on C; A depends on B
      expect(idxC).toBeLessThan(idxB);
      expect(idxB).toBeLessThan(idxA);
    }
  });
});

describe('graph queries', () => {
  // Build a shared graph for query tests
  function buildQueryGraph(): DependencyGraph {
    const p1 = makePrimitive('query-node-a', 'perception', [
      { target: 'query-node-b', type: 'requires', strength: 1, description: 'A depends on B' },
    ]);
    const p2 = makePrimitive('query-node-b', 'perception');

    const domainFiles = [makeDomainFile('perception', [p1, p2])];
    const depFiles: DependencyDataFile[] = [];

    const result = buildGraph(domainFiles, depFiles);
    if (!result.ok) throw new Error('Failed to build query test graph');
    return result.graph;
  }

  it('getNode returns primitive data for a valid ID', () => {
    const graph = buildQueryGraph();
    const node = graph.getNode('query-node-a');

    expect(node).toBeDefined();
    expect(node!.id).toBe('query-node-a');
    expect(node!.primitive.id).toBe('query-node-a');
    expect(node!.domain).toBe('perception');
  });

  it('getNode returns undefined for unknown ID', () => {
    const graph = buildQueryGraph();
    const node = graph.getNode('fake-id');

    expect(node).toBeUndefined();
  });

  it('getNeighbors returns outgoing edges for a node', () => {
    const graph = buildQueryGraph();
    const neighbors = graph.getNeighbors('query-node-a');

    expect(neighbors.length).toBe(1);
    expect(neighbors[0].source).toBe('query-node-a');
    expect(neighbors[0].target).toBe('query-node-b');
    expect(neighbors[0].type).toBe('requires');
  });

  it('getSummary returns a RegistrySummary', () => {
    const graph = buildQueryGraph();
    const summary = graph.getSummary();

    expect(summary.totalPrimitives).toBe(2);
    expect(summary.totalEdges).toBe(1);
    expect(summary.graphDepth).toBeGreaterThanOrEqual(1);
    expect(summary.domains.length).toBeGreaterThan(0);
    expect(summary.version).toBeDefined();
  });
});
