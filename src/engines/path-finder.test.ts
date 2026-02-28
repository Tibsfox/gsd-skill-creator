import { describe, it, expect } from 'vitest';
import {
  findShortestPath,
  PathResult,
  PathStep,
  CostWeights,
} from './path-finder.js';
import {
  buildGraph,
  DependencyGraph,
  DomainDataFile,
  DependencyDataFile,
} from './dependency-graph.js';
import type {
  MathematicalPrimitive,
  DependencyEdge,
  DomainId,
  PlanePosition,
} from '../core/types/mfe-types.js';

// === Test Helpers ===

function makePrimitive(
  id: string,
  domain: DomainId,
  planePosition: PlanePosition = { real: 0, imaginary: 0 },
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
    planePosition,
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

function buildTestGraph(
  primitives: MathematicalPrimitive[],
  externalEdges: DependencyDataFile['edges'] = [],
): DependencyGraph {
  // Group primitives by domain
  const domainGroups = new Map<DomainId, MathematicalPrimitive[]>();
  for (const p of primitives) {
    const existing = domainGroups.get(p.domain) ?? [];
    existing.push(p);
    domainGroups.set(p.domain, existing);
  }

  const domainFiles: DomainDataFile[] = Array.from(domainGroups.entries()).map(
    ([domain, prims]) => makeDomainFile(domain, prims),
  );

  const depFiles: DependencyDataFile[] =
    externalEdges.length > 0 ? [makeDepFile('test', externalEdges)] : [];

  const result = buildGraph(domainFiles, depFiles);
  if (!result.ok) {
    throw new Error(`Failed to build test graph: ${result.errors.map(e => e.message).join(', ')}`);
  }
  return result.graph;
}

// === Tests ===

describe('findShortestPath', () => {
  it('returns null when source node does not exist', () => {
    const graph = buildTestGraph([
      makePrimitive('real-node', 'perception'),
    ]);

    const result = findShortestPath(graph, 'nonexistent', 'real-node');
    expect(result).toBeNull();
  });

  it('returns null when target node does not exist', () => {
    const graph = buildTestGraph([
      makePrimitive('real-node', 'perception'),
    ]);

    const result = findShortestPath(graph, 'real-node', 'nonexistent');
    expect(result).toBeNull();
  });

  it('returns zero-cost path when source === target', () => {
    const graph = buildTestGraph([
      makePrimitive('same-node', 'perception', { real: 0.1, imaginary: 0.2 }),
    ]);

    const result = findShortestPath(graph, 'same-node', 'same-node');
    expect(result).not.toBeNull();
    expect(result!.steps.length).toBe(0);
    expect(result!.totalCost).toBe(0);
  });

  it('returns direct path for single-edge connection', () => {
    const pA = makePrimitive('direct-a', 'perception', { real: 0, imaginary: 0 }, [
      { target: 'direct-b', type: 'requires', strength: 1, description: 'A->B' },
    ]);
    const pB = makePrimitive('direct-b', 'perception', { real: 0, imaginary: 0 });

    const graph = buildTestGraph([pA, pB]);

    const result = findShortestPath(graph, 'direct-a', 'direct-b');
    expect(result).not.toBeNull();
    expect(result!.steps.length).toBe(1);
    expect(result!.steps[0].from).toBe('direct-a');
    expect(result!.steps[0].to).toBe('direct-b');
  });

  it('returns null when no path exists (disconnected nodes)', () => {
    const pA = makePrimitive('island-a', 'perception', { real: 0, imaginary: 0 }, [
      { target: 'island-b', type: 'requires', strength: 1, description: 'A->B' },
    ]);
    const pB = makePrimitive('island-b', 'perception', { real: 0, imaginary: 0 });
    const pC = makePrimitive('island-c', 'waves', { real: 0.5, imaginary: 0.5 }, [
      { target: 'island-d', type: 'requires', strength: 1, description: 'C->D' },
    ]);
    const pD = makePrimitive('island-d', 'waves', { real: 0.5, imaginary: 0.5 });

    const graph = buildTestGraph([pA, pB, pC, pD]);

    const result = findShortestPath(graph, 'island-a', 'island-c');
    expect(result).toBeNull();
  });
});

describe('weighted cost model', () => {
  it('prefers "requires" edges over "motivates" edges', () => {
    // A->B direct (requires), A->C->B indirect (motivates then requires)
    // Same positions so domain distance and abstraction jump are equal
    const pos: PlanePosition = { real: 0, imaginary: 0 };
    const pA = makePrimitive('cost-a', 'perception', pos, [
      { target: 'cost-b', type: 'requires', strength: 1, description: 'direct requires' },
      { target: 'cost-c', type: 'motivates', strength: 1, description: 'to intermediate' },
    ]);
    const pB = makePrimitive('cost-b', 'perception', pos);
    const pC = makePrimitive('cost-c', 'perception', pos, [
      { target: 'cost-b', type: 'requires', strength: 1, description: 'intermediate to B' },
    ]);

    const graph = buildTestGraph([pA, pB, pC]);

    const result = findShortestPath(graph, 'cost-a', 'cost-b');
    expect(result).not.toBeNull();
    // Direct A->B should be preferred (requires = 1.0 cost vs motivates+requires = 4.0+1.0)
    expect(result!.steps.length).toBe(1);
    expect(result!.steps[0].from).toBe('cost-a');
    expect(result!.steps[0].to).toBe('cost-b');
  });

  it('penalizes cross-domain hops', () => {
    // A (perception, pos 0,0) -> B (perception, pos 0,0): intra-domain, cheap
    // A (perception, pos 0,0) -> C (waves, pos 0.8,0.8) -> B: cross-domain, expensive
    const pA = makePrimitive('dom-a', 'perception', { real: 0, imaginary: 0 }, [
      { target: 'dom-b', type: 'requires', strength: 1, description: 'intra-domain' },
      { target: 'dom-c', type: 'requires', strength: 1, description: 'cross-domain hop' },
    ]);
    const pB = makePrimitive('dom-b', 'perception', { real: 0, imaginary: 0 });
    const pC = makePrimitive('dom-c', 'waves', { real: 0.8, imaginary: 0.8 }, [
      { target: 'dom-b', type: 'requires', strength: 1, description: 'back to B' },
    ]);

    const graph = buildTestGraph([pA, pB, pC]);

    const result = findShortestPath(graph, 'dom-a', 'dom-b');
    expect(result).not.toBeNull();
    // Should take the direct intra-domain path
    expect(result!.steps.length).toBe(1);
  });

  it('penalizes abstraction jumps', () => {
    // A at low imaginary -> B at high imaginary
    const pA = makePrimitive('abs-a', 'perception', { real: 0, imaginary: -0.8 }, [
      { target: 'abs-b', type: 'requires', strength: 1, description: 'big jump' },
    ]);
    const pB = makePrimitive('abs-b', 'perception', { real: 0, imaginary: 0.8 });

    const graph = buildTestGraph([pA, pB]);

    const result = findShortestPath(graph, 'abs-a', 'abs-b');
    expect(result).not.toBeNull();
    // Cost should include abstraction jump penalty (|(-0.8) - 0.8| = 1.6)
    expect(result!.totalCost).toBeGreaterThan(1.0); // Edge type alone would be 1.0
  });

  it('returns totalCost as sum of step costs', () => {
    // A->B->C chain
    const pos: PlanePosition = { real: 0, imaginary: 0 };
    const pA = makePrimitive('sum-a', 'perception', pos, [
      { target: 'sum-b', type: 'requires', strength: 1, description: 'A->B' },
    ]);
    const pB = makePrimitive('sum-b', 'perception', pos, [
      { target: 'sum-c', type: 'requires', strength: 1, description: 'B->C' },
    ]);
    const pC = makePrimitive('sum-c', 'perception', pos);

    const graph = buildTestGraph([pA, pB, pC]);

    const result = findShortestPath(graph, 'sum-a', 'sum-c');
    expect(result).not.toBeNull();
    const stepCostSum = result!.steps.reduce((acc, step) => acc + step.stepCost, 0);
    expect(result!.totalCost).toBeCloseTo(stepCostSum, 10);
  });
});

describe('cost weights configuration', () => {
  it('uses default weights when none provided', () => {
    const pos: PlanePosition = { real: 0, imaginary: 0 };
    const pA = makePrimitive('def-a', 'perception', pos, [
      { target: 'def-b', type: 'requires', strength: 1, description: 'A->B' },
    ]);
    const pB = makePrimitive('def-b', 'perception', pos);

    const graph = buildTestGraph([pA, pB]);

    const result = findShortestPath(graph, 'def-a', 'def-b');
    expect(result).not.toBeNull();
    expect(result!.totalCost).toBeGreaterThan(0);
  });

  it('accepts custom cost weights', () => {
    const pA = makePrimitive('cust-a', 'perception', { real: 0, imaginary: 0 }, [
      { target: 'cust-b', type: 'requires', strength: 1, description: 'A->B' },
    ]);
    const pB = makePrimitive('cust-b', 'waves', { real: 0.5, imaginary: 0.5 });

    const graph = buildTestGraph([pA, pB]);

    const defaultResult = findShortestPath(graph, 'cust-a', 'cust-b');
    const customResult = findShortestPath(graph, 'cust-a', 'cust-b', {
      edgeTypeWeight: 2.0,
      domainDistanceWeight: 0.5,
      abstractionJumpWeight: 0.5,
    });

    expect(defaultResult).not.toBeNull();
    expect(customResult).not.toBeNull();
    // Custom weights should produce a different cost
    expect(customResult!.totalCost).not.toBeCloseTo(defaultResult!.totalCost, 5);
  });
});

describe('PathResult structure', () => {
  it('includes domain information for each step', () => {
    const pA = makePrimitive('info-a', 'perception', { real: 0, imaginary: 0 }, [
      { target: 'info-b', type: 'requires', strength: 1, description: 'A->B' },
    ]);
    const pB = makePrimitive('info-b', 'waves', { real: 0.3, imaginary: 0.1 });

    const graph = buildTestGraph([pA, pB]);

    const result = findShortestPath(graph, 'info-a', 'info-b');
    expect(result).not.toBeNull();
    expect(result!.steps.length).toBe(1);
    expect(result!.steps[0].fromDomain).toBe('perception');
    expect(result!.steps[0].toDomain).toBe('waves');
  });

  it('includes domainsSpanned for the complete path', () => {
    const pA = makePrimitive('span-a', 'perception', { real: 0, imaginary: 0 }, [
      { target: 'span-b', type: 'requires', strength: 1, description: 'A->B' },
    ]);
    const pB = makePrimitive('span-b', 'waves', { real: 0.1, imaginary: 0 }, [
      { target: 'span-c', type: 'requires', strength: 1, description: 'B->C' },
    ]);
    const pC = makePrimitive('span-c', 'change', { real: 0.2, imaginary: 0 });

    const graph = buildTestGraph([pA, pB, pC]);

    const result = findShortestPath(graph, 'span-a', 'span-c');
    expect(result).not.toBeNull();
    expect(result!.domainsSpanned).toContain('perception');
    expect(result!.domainsSpanned).toContain('waves');
    expect(result!.domainsSpanned).toContain('change');
    // Deduplicated
    const uniqueDomains = new Set(result!.domainsSpanned);
    expect(uniqueDomains.size).toBe(result!.domainsSpanned.length);
  });
});
