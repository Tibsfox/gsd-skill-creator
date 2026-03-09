/**
 * Trust Graph Intelligence Tests
 *
 * Tests the graph algorithms that understand the SHAPE of trust:
 * asymmetry classification, multi-context bond detection, bridge
 * potential calculation, graph diversity scoring, and Old Growth
 * readiness assessment.
 *
 * All algorithms are ego-local (2-hop max), tested with synthetic
 * topologies: triangle, star, isolated node, all-same-type saturation.
 */

import { describe, it, expect } from 'vitest';
import {
  classifyAsymmetry,
  classifyPair,
  detectBonds,
  computeBridgePotential,
  computeGraphDiversity,
  assessOldGrowthReadiness,
  oldGrowthConnectionFloor,
  describeAsymmetry,
  describeBridge,
} from '../trust-graph.js';
import type { AsymmetryResult, Bond, BridgePath, GraphDiversity } from '../trust-graph.js';
import {
  createRelationship,
  computeVector,
} from '../trust-relationship.js';
import type { TrustRelationship } from '../trust-relationship.js';

// ============================================================================
// Fixtures
// ============================================================================

const NOW = new Date('2026-08-25T18:00:00Z');

/** Create a relationship with specific vector magnitudes for testing. */
function makeRel(
  from: string,
  to: string,
  type: 'permanent' | 'long-term' | 'event-scoped' | 'project-scoped' | 'ephemeral',
  fromTime: number,
  fromDepth: number,
  toTime: number,
  toDepth: number,
  options?: { ttlSeconds?: number | null; now?: Date },
): TrustRelationship {
  return createRelationship(from, to, type, fromTime, fromDepth, toTime, toDepth, {
    now: options?.now ?? NOW,
    ttlSeconds: options?.ttlSeconds,
  });
}

// ============================================================================
// Asymmetry Classifier
// ============================================================================

describe('classifyAsymmetry', () => {
  it('classifies highly mutual relationship as mutual', () => {
    const rel = makeRel('fox-042', 'cedar-011', 'permanent', 0.9, 0.8, 0.85, 0.82);
    const result = classifyAsymmetry(rel);
    expect(result.category).toBe('mutual');
    expect(result.harmony).toBeGreaterThan(0.7);
  });

  it('classifies one-sided relationship when magnitude ratio is low', () => {
    const rel = makeRel('fox-042', 'stranger-001', 'ephemeral', 0.9, 0.8, 0.1, 0.05);
    const result = classifyAsymmetry(rel);
    expect(result.category).toBe('one-sided');
    expect(result.magnitudeRatio).toBeLessThan(0.5);
  });

  it('classifies character mismatch when angles diverge', () => {
    // fox: history-anchored (high time, low depth) — θ ≈ 18°
    // cedar: depth-forged (low time, high depth) — θ ≈ 72°
    const rel = makeRel('fox-042', 'cedar-011', 'long-term', 0.9, 0.3, 0.3, 0.9);
    const result = classifyAsymmetry(rel);
    expect(result.category).toBe('character-mismatch');
    expect(result.angleDelta).toBeGreaterThan(Math.PI / 6);
  });

  it('returns magnitudeRatio between 0 and 1', () => {
    const rel = makeRel('a-001', 'b-001', 'permanent', 0.5, 0.5, 0.8, 0.8);
    const result = classifyAsymmetry(rel);
    expect(result.magnitudeRatio).toBeGreaterThanOrEqual(0);
    expect(result.magnitudeRatio).toBeLessThanOrEqual(1);
  });

  it('returns harmony between 0 and 1', () => {
    const rel = makeRel('a-001', 'b-001', 'ephemeral', 0.1, 0.9, 0.9, 0.1);
    const result = classifyAsymmetry(rel);
    expect(result.harmony).toBeGreaterThanOrEqual(0);
    expect(result.harmony).toBeLessThanOrEqual(1);
  });
});

describe('classifyPair', () => {
  it('classifies multi-context when 2+ active relationships exist', () => {
    const rels = [
      makeRel('fox-042', 'cedar-011', 'permanent', 0.9, 0.95, 0.9, 0.95),
      makeRel('fox-042', 'cedar-011', 'event-scoped', 0.5, 0.7, 0.6, 0.6),
    ];
    const result = classifyPair(rels, NOW);
    expect(result.category).toBe('multi-context');
  });

  it('delegates to single classification when only 1 relationship', () => {
    const rels = [
      makeRel('fox-042', 'cedar-011', 'permanent', 0.9, 0.8, 0.85, 0.82),
    ];
    const result = classifyPair(rels, NOW);
    expect(result.category).toBe('mutual');
  });

  it('returns default for empty relationships array', () => {
    const result = classifyPair([], NOW);
    expect(result.category).toBe('mutual');
    expect(result.harmony).toBe(1);
  });

  it('filters out expired relationships', () => {
    const expired = makeRel('fox-042', 'cedar-011', 'ephemeral', 0.5, 0.5, 0.5, 0.5, {
      ttlSeconds: 60,
      now: new Date('2026-08-25T10:00:00Z'), // 8 hours before NOW
    });
    const active = makeRel('fox-042', 'cedar-011', 'permanent', 0.9, 0.9, 0.9, 0.9);
    const result = classifyPair([expired, active], NOW);
    // Only 1 active → single classification, not multi-context
    expect(result.category).not.toBe('multi-context');
  });
});

// ============================================================================
// Multi-Context Bond Detection
// ============================================================================

describe('detectBonds', () => {
  it('detects bond when 2+ active relationships with same peer', () => {
    const rels = [
      makeRel('fox-042', 'cedar-011', 'permanent', 0.9, 0.95, 0.9, 0.95),
      makeRel('fox-042', 'cedar-011', 'event-scoped', 0.5, 0.7, 0.6, 0.6),
    ];
    const bonds = detectBonds('fox-042', rels, NOW);
    expect(bonds).toHaveLength(1);
    expect(bonds[0].handleA).toBe('fox-042');
    expect(bonds[0].handleB).toBe('cedar-011');
    expect(bonds[0].activeCount).toBe(2);
  });

  it('tracks unique contract types in bond', () => {
    const rels = [
      makeRel('fox-042', 'cedar-011', 'permanent', 0.9, 0.9, 0.9, 0.9),
      makeRel('fox-042', 'cedar-011', 'event-scoped', 0.5, 0.5, 0.5, 0.5),
      makeRel('fox-042', 'cedar-011', 'project-scoped', 0.6, 0.6, 0.6, 0.6),
    ];
    const bonds = detectBonds('fox-042', rels, NOW);
    expect(bonds[0].uniqueTypes).toHaveLength(3);
    expect(bonds[0].uniqueTypes).toContain('permanent');
    expect(bonds[0].uniqueTypes).toContain('event-scoped');
    expect(bonds[0].uniqueTypes).toContain('project-scoped');
  });

  it('returns empty when no peer has 2+ relationships', () => {
    const rels = [
      makeRel('fox-042', 'cedar-011', 'permanent', 0.9, 0.9, 0.9, 0.9),
      makeRel('fox-042', 'owl-007', 'ephemeral', 0.3, 0.3, 0.3, 0.3),
    ];
    const bonds = detectBonds('fox-042', rels, NOW);
    expect(bonds).toHaveLength(0);
  });

  it('filters out expired relationships', () => {
    const expired = makeRel('fox-042', 'cedar-011', 'ephemeral', 0.5, 0.5, 0.5, 0.5, {
      ttlSeconds: 60,
      now: new Date('2026-08-25T10:00:00Z'),
    });
    const active = makeRel('fox-042', 'cedar-011', 'permanent', 0.9, 0.9, 0.9, 0.9);
    const bonds = detectBonds('fox-042', [expired, active], NOW);
    // Only 1 active → no bond
    expect(bonds).toHaveLength(0);
  });

  it('handles relationships where focus is the to handle', () => {
    const rels = [
      makeRel('cedar-011', 'fox-042', 'permanent', 0.9, 0.9, 0.9, 0.9),
      makeRel('cedar-011', 'fox-042', 'event-scoped', 0.5, 0.5, 0.5, 0.5),
    ];
    const bonds = detectBonds('fox-042', rels, NOW);
    expect(bonds).toHaveLength(1);
    expect(bonds[0].handleB).toBe('cedar-011');
  });
});

// ============================================================================
// Bridge Potential
// ============================================================================

describe('computeBridgePotential', () => {
  it('finds bridge path through intermediate rig', () => {
    // fox → cedar (permanent, high trust)
    // cedar → raven (long-term, moderate trust)
    // fox does NOT know raven directly
    const hop1 = [
      makeRel('fox-042', 'cedar-011', 'permanent', 0.9, 0.9, 0.9, 0.9),
    ];
    const hop2 = new Map([
      ['cedar-011', [
        makeRel('cedar-011', 'raven-003', 'long-term', 0.7, 0.6, 0.7, 0.6),
      ]],
    ]);

    const bridges = computeBridgePotential('fox-042', hop1, hop2);
    expect(bridges).toHaveLength(1);
    expect(bridges[0].from).toBe('fox-042');
    expect(bridges[0].through).toBe('cedar-011');
    expect(bridges[0].to).toBe('raven-003');
    expect(bridges[0].potential).toBeGreaterThan(0);
  });

  it('skips targets already directly connected', () => {
    const hop1 = [
      makeRel('fox-042', 'cedar-011', 'permanent', 0.9, 0.9, 0.9, 0.9),
      makeRel('fox-042', 'raven-003', 'ephemeral', 0.3, 0.3, 0.3, 0.3),
    ];
    const hop2 = new Map([
      ['cedar-011', [
        makeRel('cedar-011', 'raven-003', 'long-term', 0.7, 0.6, 0.7, 0.6),
      ]],
    ]);

    const bridges = computeBridgePotential('fox-042', hop1, hop2);
    // raven-003 is already directly connected → no bridge suggested
    expect(bridges).toHaveLength(0);
  });

  it('skips self-loops', () => {
    const hop1 = [
      makeRel('fox-042', 'cedar-011', 'permanent', 0.9, 0.9, 0.9, 0.9),
    ];
    const hop2 = new Map([
      ['cedar-011', [
        makeRel('cedar-011', 'fox-042', 'permanent', 0.9, 0.9, 0.9, 0.9),
      ]],
    ]);

    const bridges = computeBridgePotential('fox-042', hop1, hop2);
    // fox-042 is the focus → no bridge to self
    expect(bridges).toHaveLength(0);
  });

  it('potential is multiplicative: mag × mag × bondWeight × bondWeight', () => {
    const hop1 = [
      makeRel('fox-042', 'cedar-011', 'permanent', 0.9, 0.9, 0.9, 0.9),
    ];
    const hop2 = new Map([
      ['cedar-011', [
        makeRel('cedar-011', 'owl-007', 'permanent', 0.9, 0.9, 0.9, 0.9),
      ]],
    ]);

    const bridges = computeBridgePotential('fox-042', hop1, hop2);
    expect(bridges).toHaveLength(1);
    // Both permanent (weight 1.0), both high magnitude (~1.0)
    // potential ≈ 1.0 × 1.0 × 1.0 × 1.0 = ~1.0
    expect(bridges[0].potential).toBeGreaterThan(0.8);
  });

  it('ephemeral bonds reduce bridge potential', () => {
    const hop1 = [
      makeRel('fox-042', 'cedar-011', 'ephemeral', 0.9, 0.9, 0.9, 0.9),
    ];
    const hop2 = new Map([
      ['cedar-011', [
        makeRel('cedar-011', 'owl-007', 'ephemeral', 0.9, 0.9, 0.9, 0.9),
      ]],
    ]);

    const bridges = computeBridgePotential('fox-042', hop1, hop2);
    // ephemeral weight = 0.3, so potential ≈ 1.0 × 1.0 × 0.3 × 0.3 = ~0.09
    expect(bridges[0].potential).toBeLessThan(0.15);
  });

  it('sorts bridges by potential descending', () => {
    const hop1 = [
      makeRel('fox-042', 'cedar-011', 'permanent', 0.9, 0.9, 0.9, 0.9),
      makeRel('fox-042', 'owl-007', 'ephemeral', 0.3, 0.3, 0.3, 0.3),
    ];
    const hop2 = new Map([
      ['cedar-011', [
        makeRel('cedar-011', 'raven-003', 'long-term', 0.7, 0.7, 0.7, 0.7),
      ]],
      ['owl-007', [
        makeRel('owl-007', 'hawk-005', 'ephemeral', 0.2, 0.2, 0.2, 0.2),
      ]],
    ]);

    const bridges = computeBridgePotential('fox-042', hop1, hop2);
    expect(bridges.length).toBeGreaterThanOrEqual(2);
    expect(bridges[0].potential).toBeGreaterThanOrEqual(bridges[1].potential);
  });

  it('returns empty for isolated rig (no connections)', () => {
    const bridges = computeBridgePotential('lonely-001', [], new Map());
    expect(bridges).toHaveLength(0);
  });

  it('star topology: hub has many bridge paths', () => {
    // fox is a hub connected to 3 leaves
    const hop1 = [
      makeRel('fox-042', 'a-001', 'permanent', 0.8, 0.8, 0.8, 0.8),
      makeRel('fox-042', 'b-002', 'long-term', 0.7, 0.7, 0.7, 0.7),
      makeRel('fox-042', 'c-003', 'event-scoped', 0.6, 0.6, 0.6, 0.6),
    ];
    // Each leaf knows one other rig that fox doesn't
    const hop2 = new Map([
      ['a-001', [makeRel('a-001', 'x-010', 'permanent', 0.9, 0.9, 0.9, 0.9)]],
      ['b-002', [makeRel('b-002', 'y-020', 'long-term', 0.8, 0.8, 0.8, 0.8)]],
      ['c-003', [makeRel('c-003', 'z-030', 'ephemeral', 0.5, 0.5, 0.5, 0.5)]],
    ]);

    const bridges = computeBridgePotential('fox-042', hop1, hop2);
    expect(bridges).toHaveLength(3);
    expect(bridges.every(b => b.from === 'fox-042')).toBe(true);
  });
});

// ============================================================================
// Graph Diversity
// ============================================================================

describe('computeGraphDiversity', () => {
  it('scores 0 for rig with no relationships', () => {
    const diversity = computeGraphDiversity('lonely-001', [], NOW);
    expect(diversity.score).toBe(0);
    expect(diversity.uniqueTypeCount).toBe(0);
    expect(diversity.activeConnectionCount).toBe(0);
  });

  it('scores 0.2 for single contract type', () => {
    const rels = [
      makeRel('fox-042', 'a-001', 'ephemeral', 0.3, 0.3, 0.3, 0.3),
      makeRel('fox-042', 'b-002', 'ephemeral', 0.3, 0.3, 0.3, 0.3),
    ];
    const diversity = computeGraphDiversity('fox-042', rels, NOW);
    expect(diversity.score).toBe(0.2); // 1/5
    expect(diversity.uniqueTypeCount).toBe(1);
  });

  it('scores 0.6 for three contract types', () => {
    const rels = [
      makeRel('fox-042', 'a-001', 'permanent', 0.9, 0.9, 0.9, 0.9),
      makeRel('fox-042', 'b-002', 'event-scoped', 0.5, 0.5, 0.5, 0.5),
      makeRel('fox-042', 'c-003', 'project-scoped', 0.6, 0.6, 0.6, 0.6),
    ];
    const diversity = computeGraphDiversity('fox-042', rels, NOW);
    expect(diversity.score).toBe(0.6); // 3/5
  });

  it('scores 1.0 for all five contract types', () => {
    const rels = [
      makeRel('fox-042', 'a-001', 'permanent', 0.9, 0.9, 0.9, 0.9),
      makeRel('fox-042', 'b-002', 'long-term', 0.8, 0.8, 0.8, 0.8),
      makeRel('fox-042', 'c-003', 'event-scoped', 0.6, 0.6, 0.6, 0.6),
      makeRel('fox-042', 'd-004', 'project-scoped', 0.5, 0.5, 0.5, 0.5),
      makeRel('fox-042', 'e-005', 'ephemeral', 0.3, 0.3, 0.3, 0.3),
    ];
    const diversity = computeGraphDiversity('fox-042', rels, NOW);
    expect(diversity.score).toBe(1.0); // 5/5
    expect(diversity.uniqueTypeCount).toBe(5);
  });

  it('never exceeds 1.0 (Sam fix: denominator is 5)', () => {
    // Even with duplicate types, max is 5/5 = 1.0
    const rels = [
      makeRel('fox-042', 'a-001', 'permanent', 0.9, 0.9, 0.9, 0.9),
      makeRel('fox-042', 'b-002', 'permanent', 0.8, 0.8, 0.8, 0.8),
      makeRel('fox-042', 'c-003', 'permanent', 0.7, 0.7, 0.7, 0.7),
      makeRel('fox-042', 'd-004', 'long-term', 0.6, 0.6, 0.6, 0.6),
      makeRel('fox-042', 'e-005', 'event-scoped', 0.5, 0.5, 0.5, 0.5),
      makeRel('fox-042', 'f-006', 'project-scoped', 0.4, 0.4, 0.4, 0.4),
      makeRel('fox-042', 'g-007', 'ephemeral', 0.3, 0.3, 0.3, 0.3),
    ];
    const diversity = computeGraphDiversity('fox-042', rels, NOW);
    expect(diversity.score).toBeLessThanOrEqual(1.0);
  });

  it('counts unique peers, not relationships', () => {
    const rels = [
      makeRel('fox-042', 'cedar-011', 'permanent', 0.9, 0.9, 0.9, 0.9),
      makeRel('fox-042', 'cedar-011', 'event-scoped', 0.5, 0.5, 0.5, 0.5),
    ];
    const diversity = computeGraphDiversity('fox-042', rels, NOW);
    expect(diversity.activeConnectionCount).toBe(1); // same peer, counts once
    expect(diversity.uniqueTypeCount).toBe(2);
  });

  it('filters expired relationships', () => {
    const expired = makeRel('fox-042', 'a-001', 'ephemeral', 0.3, 0.3, 0.3, 0.3, {
      ttlSeconds: 60,
      now: new Date('2026-08-25T10:00:00Z'),
    });
    const active = makeRel('fox-042', 'b-002', 'permanent', 0.9, 0.9, 0.9, 0.9);
    const diversity = computeGraphDiversity('fox-042', [expired, active], NOW);
    expect(diversity.uniqueTypeCount).toBe(1); // only permanent
    expect(diversity.activeConnectionCount).toBe(1);
  });
});

// ============================================================================
// Old Growth Readiness
// ============================================================================

describe('oldGrowthConnectionFloor', () => {
  it('returns 3 for small communities', () => {
    expect(oldGrowthConnectionFloor(5)).toBe(3);
    expect(oldGrowthConnectionFloor(7)).toBe(3);
  });

  it('returns 3 when activeRigs is undefined', () => {
    expect(oldGrowthConnectionFloor()).toBe(3);
  });

  it('returns log2 floor for larger communities', () => {
    expect(oldGrowthConnectionFloor(256)).toBe(8);
    expect(oldGrowthConnectionFloor(1024)).toBe(10);
  });

  it('never drops below 3', () => {
    expect(oldGrowthConnectionFloor(1)).toBe(3);
    expect(oldGrowthConnectionFloor(0)).toBe(3);
  });
});

describe('assessOldGrowthReadiness', () => {
  it('ready when diversity and connections are sufficient', () => {
    const diversity: GraphDiversity = {
      uniqueTypeCount: 3,
      typesPresent: ['permanent', 'event-scoped', 'project-scoped'],
      score: 0.6,
      activeConnectionCount: 5,
    };
    const result = assessOldGrowthReadiness(diversity, 0.5, 1);
    expect(result.ready).toBe(true);
    expect(result.diversityMet).toBe(true);
    expect(result.connectionsMet).toBe(true);
  });

  it('not ready when diversity is too low', () => {
    const diversity: GraphDiversity = {
      uniqueTypeCount: 1,
      typesPresent: ['ephemeral'],
      score: 0.2,
      activeConnectionCount: 10,
    };
    const result = assessOldGrowthReadiness(diversity, 0.5, 0);
    expect(result.ready).toBe(false);
    expect(result.diversityMet).toBe(false);
    expect(result.connectionsMet).toBe(true);
  });

  it('not ready when connections are too few', () => {
    const diversity: GraphDiversity = {
      uniqueTypeCount: 3,
      typesPresent: ['permanent', 'long-term', 'event-scoped'],
      score: 0.6,
      activeConnectionCount: 1,
    };
    const result = assessOldGrowthReadiness(diversity, 0.5, 0);
    expect(result.ready).toBe(false);
    expect(result.diversityMet).toBe(true);
    expect(result.connectionsMet).toBe(false);
  });

  it('includes escalation bonus in result', () => {
    const diversity: GraphDiversity = {
      uniqueTypeCount: 2,
      typesPresent: ['permanent', 'ephemeral'],
      score: 0.4,
      activeConnectionCount: 3,
    };
    const result = assessOldGrowthReadiness(diversity, 0.75, 1);
    expect(result.escalationBonus).toBe(0.75);
    expect(result.bondCount).toBe(1);
  });

  it('adjusts connection floor for large communities', () => {
    const diversity: GraphDiversity = {
      uniqueTypeCount: 3,
      typesPresent: ['permanent', 'long-term', 'event-scoped'],
      score: 0.6,
      activeConnectionCount: 5,
    };
    // With 1024 active rigs, floor = 10 → 5 connections is not enough
    const result = assessOldGrowthReadiness(diversity, 0.5, 0, 1024);
    expect(result.connectionsMet).toBe(false);
  });
});

// ============================================================================
// Human-Readable Descriptions
// ============================================================================

describe('describeAsymmetry', () => {
  it('plain language for Seedling (level 1)', () => {
    const result: AsymmetryResult = {
      category: 'mutual',
      magnitudeRatio: 0.95,
      angleDelta: 0.1,
      harmony: 0.9,
    };
    const desc = describeAsymmetry(result, 1);
    expect(desc).toBe('This connection runs both ways equally.');
    expect(desc).not.toContain('harmony=');
  });

  it('full detail for Old Growth (level 3)', () => {
    const result: AsymmetryResult = {
      category: 'one-sided',
      magnitudeRatio: 0.3,
      angleDelta: 0.5,
      harmony: 0.25,
    };
    const desc = describeAsymmetry(result, 3);
    expect(desc).toContain('one-sided');
    expect(desc).toContain('harmony=');
    expect(desc).toContain('mag-ratio=');
  });

  it('all 5 categories have Seedling descriptions', () => {
    const categories: Array<AsymmetryResult['category']> = [
      'mutual', 'one-sided', 'character-mismatch', 'bridge-potential', 'multi-context',
    ];
    for (const cat of categories) {
      const result: AsymmetryResult = { category: cat, magnitudeRatio: 0.5, angleDelta: 0.3, harmony: 0.5 };
      const desc = describeAsymmetry(result, 1);
      expect(desc.length).toBeGreaterThan(0);
      expect(desc).not.toContain('harmony=');
    }
  });
});

describe('describeBridge', () => {
  it('formats bridge path with potential and types', () => {
    const path: BridgePath = {
      from: 'fox-042',
      through: 'cedar-011',
      to: 'raven-003',
      potential: 0.756,
      fromBondType: 'permanent',
      toBondType: 'long-term',
    };
    const desc = describeBridge(path);
    expect(desc).toContain('fox-042');
    expect(desc).toContain('cedar-011');
    expect(desc).toContain('raven-003');
    expect(desc).toContain('0.756');
    expect(desc).toContain('permanent');
    expect(desc).toContain('long-term');
  });
});
