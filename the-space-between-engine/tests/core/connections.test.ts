import { describe, it, expect } from 'vitest';
import { ConnectionGraph, createDefaultGraph } from '../../src/core/connections';
import { FOUNDATION_ORDER, PHASE_ORDER } from '../../src/types/index';
import type { FoundationId, LearnerState, PhaseType } from '../../src/types/index';

function makeLearnerState(overrides: Partial<LearnerState> = {}): LearnerState {
  const completedPhases: Record<FoundationId, PhaseType[]> = {} as any;
  const timeSpent: Record<FoundationId, number> = {} as any;
  const bypasses: Record<FoundationId, PhaseType[]> = {} as any;
  for (const id of FOUNDATION_ORDER) {
    completedPhases[id] = [];
    timeSpent[id] = 0;
    bypasses[id] = [];
  }
  return {
    currentFoundation: 'unit-circle',
    currentPhase: 'wonder',
    completedPhases,
    creations: [],
    journalEntries: [],
    unitCircleMoments: [],
    timeSpent,
    bypasses,
    firstVisit: new Date().toISOString(),
    lastVisit: new Date().toISOString(),
    ...overrides,
  };
}

describe('ConnectionGraph', () => {
  const graph = createDefaultGraph();

  describe('getAllConnections', () => {
    it('contains all defined connections (including reverse of bidirectional)', () => {
      const all = graph.getAllConnections();
      // 8 original connections + 1 reverse for the bidirectional (unit-circle <-> trigonometry)
      // = 9 total stored edges
      expect(all.length).toBeGreaterThanOrEqual(9);
    });

    it('every FoundationId appears as either source or target', () => {
      const all = graph.getAllConnections();
      const sources = new Set(all.map(c => c.from));
      const targets = new Set(all.map(c => c.to));
      const allIds = new Set([...sources, ...targets]);
      for (const id of FOUNDATION_ORDER) {
        expect(allIds.has(id)).toBe(true);
      }
    });
  });

  describe('getConnection', () => {
    it('finds unit-circle -> trigonometry', () => {
      const conn = graph.getConnection('unit-circle', 'trigonometry');
      expect(conn).not.toBeNull();
      expect(conn!.strength).toBe(1.0);
      expect(conn!.connectionType).toBe('isomorphism');
      expect(conn!.bidirectional).toBe(true);
    });

    it('finds reverse of bidirectional (trigonometry -> unit-circle)', () => {
      const conn = graph.getConnection('trigonometry', 'unit-circle');
      expect(conn).not.toBeNull();
      expect(conn!.strength).toBe(1.0);
    });

    it('returns null for nonexistent connection', () => {
      const conn = graph.getConnection('unit-circle', 'l-systems');
      expect(conn).toBeNull();
    });
  });

  describe('getOutgoing', () => {
    it('trigonometry has outgoing to information-theory', () => {
      const outgoing = graph.getOutgoing('trigonometry');
      const targets = outgoing.map(c => c.to);
      expect(targets).toContain('information-theory');
    });

    it('l-systems has outgoing to unit-circle', () => {
      const outgoing = graph.getOutgoing('l-systems');
      const targets = outgoing.map(c => c.to);
      expect(targets).toContain('unit-circle');
    });
  });

  describe('getIncoming', () => {
    it('information-theory has incoming from trigonometry and category-theory', () => {
      const incoming = graph.getIncoming('information-theory');
      const sources = incoming.map(c => c.from);
      expect(sources).toContain('trigonometry');
      expect(sources).toContain('category-theory');
    });
  });

  describe('getShortestPath', () => {
    it('returns empty for unreachable targets (no sequential edges in cross-connection graph)', () => {
      // The graph only has cross-connections, not sequential 1->2->3 edges.
      // unit-circle can reach trigonometry, info-theory, set-theory, category-theory
      // but NOT pythagorean, vector-calculus, or l-systems (no path exists).
      const path = graph.getShortestPath('unit-circle', 'l-systems');
      expect(path).toEqual([]);
    });

    it('follows reachable cross-connections', () => {
      // unit-circle -> trigonometry -> information-theory -> set-theory
      const path = graph.getShortestPath('unit-circle', 'set-theory');
      expect(path[0]).toBe('unit-circle');
      expect(path[path.length - 1]).toBe('set-theory');
      expect(path).toEqual(['unit-circle', 'trigonometry', 'information-theory', 'set-theory']);
    });

    it('same node returns single-element path', () => {
      const path = graph.getShortestPath('unit-circle', 'unit-circle');
      expect(path).toEqual(['unit-circle']);
    });

    it('finds a path between connected nodes', () => {
      const path = graph.getShortestPath('set-theory', 'information-theory');
      expect(path[0]).toBe('set-theory');
      expect(path[path.length - 1]).toBe('information-theory');
      expect(path.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('getRelatedFoundations', () => {
    it('unit-circle is related to trigonometry', () => {
      const related = graph.getRelatedFoundations('unit-circle');
      expect(related).toContain('trigonometry');
    });

    it('filters by minimum strength', () => {
      const strong = graph.getRelatedFoundations('unit-circle', 0.9);
      expect(strong).toContain('trigonometry'); // strength 1.0
    });

    it('returns empty when no connections meet threshold', () => {
      // pythagorean has outgoing to vector-calculus at 0.85
      const veryStrong = graph.getRelatedFoundations('pythagorean', 0.99);
      expect(veryStrong).toHaveLength(0);
    });
  });

  describe('getGraphLayout', () => {
    it('returns 8 nodes and multiple edges', () => {
      const layout = graph.getGraphLayout();
      expect(layout.nodes).toHaveLength(8);
      expect(layout.edges.length).toBeGreaterThan(0);
    });

    it('nodes have valid positions and colors', () => {
      const layout = graph.getGraphLayout();
      for (const node of layout.nodes) {
        expect(node.x).toBeGreaterThan(0);
        expect(node.y).toBeGreaterThan(0);
        expect(node.color).toMatch(/^#/);
        expect(node.label).toBeTruthy();
      }
    });
  });

  describe('Cross-domain nodes', () => {
    it('has birdsong node', () => {
      const birdsong = graph.getCrossDomainNode('birdsong');
      expect(birdsong).not.toBeNull();
      expect(birdsong!.foundations).toContain('trigonometry');
      expect(birdsong!.foundations).toContain('information-theory');
      expect(birdsong!.foundations).toContain('l-systems');
    });

    it('has compass-fox node', () => {
      const fox = graph.getCrossDomainNode('compass-fox');
      expect(fox).not.toBeNull();
      expect(fox!.foundations).toContain('vector-calculus');
      expect(fox!.foundations).toContain('information-theory');
      expect(fox!.foundations).toContain('set-theory');
    });

    it('getCrossDomainNodes returns both', () => {
      const all = graph.getCrossDomainNodes();
      expect(all).toHaveLength(2);
    });

    it('returns null for unknown cross-domain node', () => {
      expect(graph.getCrossDomainNode('nonexistent')).toBeNull();
    });
  });

  describe('isLoopClosed', () => {
    it('returns false when neither foundation is complete', () => {
      const state = makeLearnerState();
      expect(graph.isLoopClosed(state)).toBe(false);
    });

    it('returns false when only l-systems is complete', () => {
      const state = makeLearnerState({
        completedPhases: {
          ...makeLearnerState().completedPhases,
          'l-systems': [...PHASE_ORDER],
        },
      });
      expect(graph.isLoopClosed(state)).toBe(false);
    });

    it('returns false when only unit-circle is complete', () => {
      const state = makeLearnerState({
        completedPhases: {
          ...makeLearnerState().completedPhases,
          'unit-circle': [...PHASE_ORDER],
        },
      });
      expect(graph.isLoopClosed(state)).toBe(false);
    });

    it('returns true when both unit-circle and l-systems are complete', () => {
      const state = makeLearnerState({
        completedPhases: {
          ...makeLearnerState().completedPhases,
          'unit-circle': [...PHASE_ORDER],
          'l-systems': [...PHASE_ORDER],
        },
      });
      expect(graph.isLoopClosed(state)).toBe(true);
    });
  });
});
