/**
 * Tests for cross-pack connection mapper.
 *
 * Builds a directed graph from enables, related_packs, and dependency
 * metadata on knowledge packs. Supports incoming/outgoing edge queries
 * for navigation and visualization.
 */

import { describe, expect, it } from 'vitest';

import type { KnowledgePack } from '../types.js';
import {
  buildConnectionGraph,
  ConnectionGraph,
} from '../connection-mapper.js';
import type { ConnectionEdge } from '../connection-mapper.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePack(
  id: string,
  opts: {
    enables?: string[];
    dependencies?: string[];
    prerequisite_packs?: string[];
    related_packs?: Array<{ id: string; relationship: string }>;
  } = {},
): KnowledgePack {
  return {
    pack_id: id,
    pack_name: `Pack ${id}`,
    version: '1.0.0',
    status: 'alpha',
    classification: 'core_academic',
    description: `Test pack ${id}`,
    contributors: [{ name: 'Test', role: 'author' }],
    copyright: 'Test 2026',
    dependencies: opts.dependencies ?? [],
    prerequisite_packs: opts.prerequisite_packs ?? [],
    recommended_prior_knowledge: [],
    enables: opts.enables ?? [],
    grade_levels: [{ label: 'Elementary', grades: ['3', '4', '5'], estimated_hours: [40, 60] }],
    tags: ['test'],
    related_packs: opts.related_packs ?? [],
    gsd_integration: {},
  } as KnowledgePack;
}

// ---------------------------------------------------------------------------
// buildConnectionGraph
// ---------------------------------------------------------------------------

describe('buildConnectionGraph', () => {
  it('creates enables edges', () => {
    const packs = [
      makePack('MATH-101', { enables: ['PHYS-101', 'CODE-101', 'DATA-101'] }),
      makePack('PHYS-101'),
      makePack('CODE-101'),
      makePack('DATA-101'),
    ];
    const graph = buildConnectionGraph(packs);
    const edges = graph.getAllEdges().filter((e) => e.type === 'enables');

    expect(edges).toHaveLength(3);
    expect(edges.every((e) => e.from === 'MATH-101')).toBe(true);
    expect(new Set(edges.map((e) => e.to))).toEqual(
      new Set(['PHYS-101', 'CODE-101', 'DATA-101']),
    );
  });

  it('creates related edges with descriptions', () => {
    const packs = [
      makePack('MATH-101', {
        related_packs: [{ id: 'PHYS-101', relationship: 'math models physics' }],
      }),
      makePack('PHYS-101'),
    ];
    const graph = buildConnectionGraph(packs);
    const relatedEdges = graph.getAllEdges().filter((e) => e.type === 'related');

    expect(relatedEdges).toHaveLength(1);
    expect(relatedEdges[0].from).toBe('MATH-101');
    expect(relatedEdges[0].to).toBe('PHYS-101');
    expect(relatedEdges[0].description).toBe('math models physics');
  });

  it('creates prerequisite edges from dependencies', () => {
    const packs = [
      makePack('MATH-101'),
      makePack('PHYS-101', { dependencies: ['MATH-101'] }),
    ];
    const graph = buildConnectionGraph(packs);
    const prereqEdges = graph.getAllEdges().filter((e) => e.type === 'prerequisite');

    expect(prereqEdges).toHaveLength(1);
    expect(prereqEdges[0].from).toBe('MATH-101');
    expect(prereqEdges[0].to).toBe('PHYS-101');
  });

  it('creates prerequisite edges from prerequisite_packs', () => {
    const packs = [
      makePack('MATH-101'),
      makePack('PHYS-101', { prerequisite_packs: ['MATH-101'] }),
    ];
    const graph = buildConnectionGraph(packs);
    const prereqEdges = graph.getAllEdges().filter((e) => e.type === 'prerequisite');

    expect(prereqEdges).toHaveLength(1);
    expect(prereqEdges[0].from).toBe('MATH-101');
    expect(prereqEdges[0].to).toBe('PHYS-101');
  });

  it('builds combined graph with all edge types', () => {
    const packs = [
      makePack('MATH-101', {
        enables: ['PHYS-101'],
        related_packs: [{ id: 'CODE-101', relationship: 'computational thinking' }],
      }),
      makePack('PHYS-101', { dependencies: ['MATH-101'] }),
      makePack('CODE-101'),
    ];
    const graph = buildConnectionGraph(packs);
    const allEdges = graph.getAllEdges();

    const types = new Set(allEdges.map((e) => e.type));
    expect(types).toEqual(new Set(['enables', 'related', 'prerequisite']));
  });

  it('getConnections returns all connections for a pack', () => {
    const packs = [
      makePack('A', { enables: ['B'] }),
      makePack('B', { dependencies: ['A'], enables: ['C'] }),
      makePack('C'),
    ];
    const graph = buildConnectionGraph(packs);
    const connections = graph.getConnections('B');

    // B has: incoming prerequisite from A, incoming enables from A, outgoing enables to C
    expect(connections.length).toBeGreaterThanOrEqual(2);
  });

  it('getIncoming returns packs that connect TO this pack', () => {
    const packs = [
      makePack('A', { enables: ['B'] }),
      makePack('B'),
      makePack('C', { enables: ['B'] }),
    ];
    const graph = buildConnectionGraph(packs);
    const incoming = graph.getIncoming('B');

    expect(incoming).toHaveLength(2);
    expect(new Set(incoming.map((e) => e.from))).toEqual(new Set(['A', 'C']));
  });

  it('getOutgoing returns packs this pack connects TO', () => {
    const packs = [
      makePack('A', { enables: ['B', 'C'] }),
      makePack('B'),
      makePack('C'),
    ];
    const graph = buildConnectionGraph(packs);
    const outgoing = graph.getOutgoing('A');

    expect(outgoing).toHaveLength(2);
    expect(new Set(outgoing.map((e) => e.to))).toEqual(new Set(['B', 'C']));
  });

  it('isolated pack has no connections', () => {
    const packs = [
      makePack('A', { enables: ['B'] }),
      makePack('B'),
      makePack('ISOLATED'),
    ];
    const graph = buildConnectionGraph(packs);

    expect(graph.getConnections('ISOLATED')).toEqual([]);
    expect(graph.getIncoming('ISOLATED')).toEqual([]);
    expect(graph.getOutgoing('ISOLATED')).toEqual([]);
  });

  it('getNodes returns all pack IDs', () => {
    const packs = [makePack('A'), makePack('B'), makePack('C')];
    const graph = buildConnectionGraph(packs);

    expect(new Set(graph.getNodes())).toEqual(new Set(['A', 'B', 'C']));
  });

  it('handles empty pack array', () => {
    const graph = buildConnectionGraph([]);

    expect(graph.getAllEdges()).toEqual([]);
    expect(graph.getNodes()).toEqual([]);
  });
});
