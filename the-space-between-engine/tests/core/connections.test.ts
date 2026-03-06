import { describe, it, expect } from 'vitest';
import {
  getConnection,
  getOutgoing,
  getIncoming,
  getAllConnections,
  getShortestPath,
  getRelatedFoundations,
  getGraphLayout,
  isLoopClosed,
} from '../../src/core/connections.js';
import type { FoundationId, LearnerState } from '../../src/types/index.js';
import { FOUNDATION_ORDER, PHASE_ORDER } from '../../src/types/index.js';

function makeCompleteLearner(foundations: FoundationId[]): LearnerState {
  const completedPhases: Record<string, string[]> = {};
  for (const id of FOUNDATION_ORDER) {
    completedPhases[id] = foundations.includes(id) ? [...PHASE_ORDER] : [];
  }
  return {
    currentFoundation: 'unit-circle',
    currentPhase: 'wonder',
    completedPhases: completedPhases as Record<FoundationId, string[]> as never,
    creations: [],
    journalEntries: [],
    unitCircleMoments: [],
    timeSpent: Object.fromEntries(FOUNDATION_ORDER.map((id) => [id, 0])) as Record<FoundationId, number>,
    bypasses: {},
    firstVisit: new Date().toISOString(),
    lastVisit: new Date().toISOString(),
    stateVersion: 1,
  };
}

describe('Connection Graph', () => {
  // ─── Sequential connections ────────────────────────

  describe('sequential connections', () => {
    it('has sequential connections between consecutive foundations', () => {
      for (let i = 0; i < FOUNDATION_ORDER.length - 1; i++) {
        const from = FOUNDATION_ORDER[i];
        const to = FOUNDATION_ORDER[i + 1];
        const conn = getConnection(from, to);
        expect(conn).not.toBeNull();
        expect(conn!.from).toBe(from);
        expect(conn!.to).toBe(to);
        expect(conn!.strength).toBe(1.0);
        expect(conn!.relationship).toBe('sequential');
      }
    });
  });

  // ─── Cross connections ─────────────────────────────

  describe('cross connections', () => {
    it('unit-circle <-> trigonometry (bidirectional, strength 1.0)', () => {
      const fwd = getConnection('unit-circle', 'trigonometry');
      expect(fwd).not.toBeNull();
      expect(fwd!.strength).toBe(1.0);
      expect(fwd!.bidirectional).toBe(true);

      const rev = getConnection('trigonometry', 'unit-circle');
      expect(rev).not.toBeNull();
      expect(rev!.strength).toBe(1.0);
      expect(rev!.bidirectional).toBe(true);
    });

    it('pythagorean -> vector-calculus (strength 0.7)', () => {
      const conn = getConnection('pythagorean', 'vector-calculus');
      expect(conn).not.toBeNull();
      expect(conn!.strength).toBe(0.7);
      expect(conn!.bidirectional).toBe(false);
    });

    it('trigonometry -> information-theory (strength 0.6)', () => {
      const conn = getConnection('trigonometry', 'information-theory');
      expect(conn).not.toBeNull();
      expect(conn!.strength).toBe(0.6);
    });

    it('set-theory -> category-theory cross-connection (strength 0.9) exists alongside sequential', () => {
      // These are sequential neighbors so getConnection returns the sequential (1.0) first
      const all = getAllConnections().filter(
        (c) => c.from === 'set-theory' && c.to === 'category-theory',
      );
      expect(all.length).toBeGreaterThanOrEqual(2); // sequential + cross
      const cross = all.find((c) => c.relationship === 'abstraction');
      expect(cross).toBeDefined();
      expect(cross!.strength).toBe(0.9);
    });

    it('category-theory -> information-theory cross-connection (strength 0.5) exists alongside sequential', () => {
      const all = getAllConnections().filter(
        (c) => c.from === 'category-theory' && c.to === 'information-theory',
      );
      expect(all.length).toBeGreaterThanOrEqual(2); // sequential + cross
      const cross = all.find((c) => c.relationship === 'structural');
      expect(cross).toBeDefined();
      expect(cross!.strength).toBe(0.5);
    });

    it('l-systems -> unit-circle (strength 0.8)', () => {
      const conn = getConnection('l-systems', 'unit-circle');
      expect(conn).not.toBeNull();
      expect(conn!.strength).toBe(0.8);
    });

    it('vector-calculus -> l-systems (strength 0.6)', () => {
      const conn = getConnection('vector-calculus', 'l-systems');
      expect(conn).not.toBeNull();
      expect(conn!.strength).toBe(0.6);
    });

    it('information-theory -> set-theory (strength 0.5)', () => {
      const conn = getConnection('information-theory', 'set-theory');
      expect(conn).not.toBeNull();
      expect(conn!.strength).toBe(0.5);
    });
  });

  // ─── getConnection ─────────────────────────────────

  describe('getConnection', () => {
    it('returns null for non-existent connections', () => {
      expect(getConnection('unit-circle', 'l-systems')).toBeNull();
      expect(getConnection('set-theory', 'trigonometry')).toBeNull();
    });
  });

  // ─── getOutgoing / getIncoming ─────────────────────

  describe('getOutgoing', () => {
    it('unit-circle has outgoing to pythagorean (sequential) and trigonometry (cross)', () => {
      const out = getOutgoing('unit-circle');
      const targets = out.map((c) => c.to);
      expect(targets).toContain('pythagorean');
      expect(targets).toContain('trigonometry');
    });

    it('l-systems has outgoing to unit-circle (cross, loop back)', () => {
      const out = getOutgoing('l-systems');
      const targets = out.map((c) => c.to);
      expect(targets).toContain('unit-circle');
    });
  });

  describe('getIncoming', () => {
    it('unit-circle has incoming from l-systems and from trigonometry (bidirectional reverse)', () => {
      const inc = getIncoming('unit-circle');
      const sources = inc.map((c) => c.from);
      expect(sources).toContain('l-systems');
      expect(sources).toContain('trigonometry');
    });

    it('category-theory has incoming from set-theory', () => {
      const inc = getIncoming('category-theory');
      const sources = inc.map((c) => c.from);
      expect(sources).toContain('set-theory');
    });
  });

  // ─── getAllConnections ──────────────────────────────

  describe('getAllConnections', () => {
    it('returns all connections', () => {
      const all = getAllConnections();
      // 7 sequential + 8 cross + 1 reverse (unit-circle<->trig) = 16
      expect(all.length).toBeGreaterThanOrEqual(16);
    });

    it('returns a copy (not the internal array)', () => {
      const a = getAllConnections();
      const b = getAllConnections();
      expect(a).not.toBe(b);
      expect(a).toEqual(b);
    });
  });

  // ─── Shortest path (BFS) ──────────────────────────

  describe('getShortestPath', () => {
    it('returns single-element for same node', () => {
      expect(getShortestPath('unit-circle', 'unit-circle')).toEqual(['unit-circle']);
    });

    it('finds sequential path for adjacent nodes', () => {
      const path = getShortestPath('unit-circle', 'pythagorean');
      expect(path).toEqual(['unit-circle', 'pythagorean']);
    });

    it('finds shorter cross-connection path when available', () => {
      // unit-circle -> trigonometry is a direct cross-connection (1 hop)
      // vs unit-circle -> pythagorean -> trigonometry (2 hops)
      const path = getShortestPath('unit-circle', 'trigonometry');
      expect(path.length).toBeLessThanOrEqual(2);
      expect(path[0]).toBe('unit-circle');
      expect(path[path.length - 1]).toBe('trigonometry');
    });

    it('handles the loop: l-systems -> unit-circle path exists', () => {
      const path = getShortestPath('l-systems', 'unit-circle');
      expect(path.length).toBeGreaterThanOrEqual(2);
      expect(path[0]).toBe('l-systems');
      expect(path[path.length - 1]).toBe('unit-circle');
    });

    it('finds a path from unit-circle to l-systems', () => {
      const path = getShortestPath('unit-circle', 'l-systems');
      expect(path.length).toBeGreaterThanOrEqual(2);
      expect(path[0]).toBe('unit-circle');
      expect(path[path.length - 1]).toBe('l-systems');
    });
  });

  // ─── Related foundations ───────────────────────────

  describe('getRelatedFoundations', () => {
    it('returns related foundations (both outgoing and incoming)', () => {
      const related = getRelatedFoundations('unit-circle');
      expect(related).toContain('pythagorean');   // sequential outgoing
      expect(related).toContain('trigonometry');   // cross outgoing
      expect(related).toContain('l-systems');      // incoming from loop
    });

    it('filters by minimum strength', () => {
      const strong = getRelatedFoundations('unit-circle', 0.9);
      // sequential (1.0), trigonometry cross (1.0) — but l-systems->unit-circle is 0.8
      expect(strong).toContain('pythagorean');
      expect(strong).toContain('trigonometry');
    });

    it('returns empty for very high threshold', () => {
      const ultra = getRelatedFoundations('unit-circle', 1.1);
      expect(ultra).toHaveLength(0);
    });
  });

  // ─── Graph layout ──────────────────────────────────

  describe('getGraphLayout', () => {
    it('returns 8 nodes and multiple edges', () => {
      const layout = getGraphLayout();
      expect(layout.nodes).toHaveLength(8);
      expect(layout.edges.length).toBeGreaterThan(0);
    });

    it('nodes have x, y positions, labels, and colors', () => {
      const { nodes } = getGraphLayout();
      for (const node of nodes) {
        expect(typeof node.x).toBe('number');
        expect(typeof node.y).toBe('number');
        expect(node.label).toBeTruthy();
        expect(node.color).toMatch(/^#[0-9a-f]{6}$/i);
      }
    });

    it('nodes are arranged in a circle (roughly equal distance from center)', () => {
      const { nodes } = getGraphLayout();
      const distances = nodes.map((n) => Math.sqrt(n.x ** 2 + n.y ** 2));
      const radius = distances[0];
      for (const d of distances) {
        expect(d).toBeCloseTo(radius, 0);
      }
    });

    it('edges have strength and bidirectional flag', () => {
      const { edges } = getGraphLayout();
      for (const edge of edges) {
        expect(typeof edge.strength).toBe('number');
        expect(typeof edge.bidirectional).toBe('boolean');
      }
    });

    it('does not duplicate bidirectional edges', () => {
      const { edges } = getGraphLayout();
      const keys = edges.map((e) => {
        const pair = [e.from, e.to].sort().join('|');
        return e.bidirectional ? pair : `${e.from}|${e.to}`;
      });
      const unique = new Set(keys);
      expect(unique.size).toBe(keys.length);
    });
  });

  // ─── Loop closed ───────────────────────────────────

  describe('isLoopClosed', () => {
    it('returns false for a brand new learner', () => {
      const learner = makeCompleteLearner([]);
      expect(isLoopClosed(learner)).toBe(false);
    });

    it('returns false when only unit-circle is complete', () => {
      const learner = makeCompleteLearner(['unit-circle']);
      expect(isLoopClosed(learner)).toBe(false);
    });

    it('returns false when only l-systems is complete', () => {
      const learner = makeCompleteLearner(['l-systems']);
      expect(isLoopClosed(learner)).toBe(false);
    });

    it('returns true when both unit-circle and l-systems are complete', () => {
      const learner = makeCompleteLearner(['unit-circle', 'l-systems']);
      expect(isLoopClosed(learner)).toBe(true);
    });

    it('returns true when all foundations are complete', () => {
      const learner = makeCompleteLearner([...FOUNDATION_ORDER]);
      expect(isLoopClosed(learner)).toBe(true);
    });
  });
});
