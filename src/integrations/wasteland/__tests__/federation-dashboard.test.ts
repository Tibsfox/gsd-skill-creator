import { describe, it, expect } from 'vitest';
import {
  buildFederationTopology,
  computeRigMetrics,
  computeFederationHealth,
} from '../federation-dashboard.js';

// ============================================================================
// R6.1: Federation Topology
// ============================================================================

describe('buildFederationTopology', () => {
  const now = new Date().toISOString();
  const oldDate = '2025-01-01T00:00:00Z';

  it('builds nodes from rigs', () => {
    const topo = buildFederationTopology({
      rigs: [
        { handle: 'fox', trustLevel: 2, rigType: 'human', lastSeen: now },
        { handle: 'cedar', trustLevel: 3, rigType: 'agent', lastSeen: now },
      ],
      stamps: [],
    });

    expect(topo.nodes).toHaveLength(2);
    expect(topo.nodes[0]!.handle).toBe('fox');
    expect(topo.nodes[0]!.active).toBe(true);
    expect(topo.totalCount).toBe(2);
  });

  it('marks old rigs as inactive', () => {
    const topo = buildFederationTopology({
      rigs: [
        { handle: 'fox', trustLevel: 1, rigType: 'human', lastSeen: now },
        { handle: 'ghost', trustLevel: 0, rigType: 'human', lastSeen: oldDate },
      ],
      stamps: [],
    });

    expect(topo.activeCount).toBe(1);
    const ghost = topo.nodes.find(n => n.handle === 'ghost');
    expect(ghost?.active).toBe(false);
  });

  it('builds edges from stamps', () => {
    const topo = buildFederationTopology({
      rigs: [
        { handle: 'cedar', trustLevel: 2, rigType: 'agent', lastSeen: now },
        { handle: 'fox', trustLevel: 1, rigType: 'human', lastSeen: now },
      ],
      stamps: [
        { author: 'cedar', completedBy: 'fox' },
        { author: 'cedar', completedBy: 'fox' },
      ],
    });

    expect(topo.edges).toHaveLength(1);
    expect(topo.edges[0]!.weight).toBe(2);
    expect(topo.edges[0]!.relationship).toBe('stamped');
  });

  it('computes trust distribution', () => {
    const topo = buildFederationTopology({
      rigs: [
        { handle: 'a', trustLevel: 0, rigType: 'human' },
        { handle: 'b', trustLevel: 0, rigType: 'human' },
        { handle: 'c', trustLevel: 1, rigType: 'human' },
        { handle: 'd', trustLevel: 2, rigType: 'agent' },
      ],
      stamps: [],
    });

    expect(topo.trustDistribution[0]).toBe(2);
    expect(topo.trustDistribution[1]).toBe(1);
    expect(topo.trustDistribution[2]).toBe(1);
  });

  it('handles empty input', () => {
    const topo = buildFederationTopology({ rigs: [], stamps: [] });
    expect(topo.nodes).toHaveLength(0);
    expect(topo.edges).toHaveLength(0);
    expect(topo.totalCount).toBe(0);
    expect(topo.activeCount).toBe(0);
  });
});

// ============================================================================
// R6.2: Rig Metrics
// ============================================================================

describe('computeRigMetrics', () => {
  it('computes metrics for active rig', () => {
    const today = new Date().toISOString();
    const metrics = computeRigMetrics({
      handle: 'fox',
      completions: [
        { completedAt: today },
        { completedAt: today },
      ],
      stampsReceived: [
        { valence: { quality: 4, reliability: 5, creativity: 3 } },
      ],
      stampsGiven: 3,
    });

    expect(metrics.handle).toBe('fox');
    expect(metrics.completionsTotal).toBe(2);
    expect(metrics.stampsReceived).toBe(1);
    expect(metrics.stampsGiven).toBe(3);
    expect(metrics.avgValence).toBe(4); // (4+5+3)/3
    expect(metrics.heartbeatStatus).toBe('active');
    expect(metrics.daysSinceLastActivity).toBe(0);
  });

  it('identifies dormant rig', () => {
    const oldDate = '2025-01-01T00:00:00Z';
    const metrics = computeRigMetrics({
      handle: 'ghost',
      completions: [{ completedAt: oldDate }],
      stampsReceived: [],
      stampsGiven: 0,
    });

    expect(metrics.heartbeatStatus).toBe('dormant');
    expect(metrics.daysSinceLastActivity).toBeGreaterThan(30);
  });

  it('handles rig with no activity', () => {
    const metrics = computeRigMetrics({
      handle: 'new',
      completions: [],
      stampsReceived: [],
      stampsGiven: 0,
    });

    expect(metrics.completionsTotal).toBe(0);
    expect(metrics.avgValence).toBe(0);
    expect(metrics.heartbeatStatus).toBe('dormant');
    expect(metrics.activityTimeline).toHaveLength(0);
  });

  it('groups activity timeline by date', () => {
    const metrics = computeRigMetrics({
      handle: 'fox',
      completions: [
        { completedAt: '2026-03-07T10:00:00Z' },
        { completedAt: '2026-03-07T14:00:00Z' },
        { completedAt: '2026-03-06T10:00:00Z' },
      ],
      stampsReceived: [],
      stampsGiven: 0,
    });

    expect(metrics.activityTimeline).toHaveLength(2);
    const march7 = metrics.activityTimeline.find(t => t.date === '2026-03-07');
    expect(march7?.count).toBe(2);
  });
});

// ============================================================================
// Federation Health
// ============================================================================

describe('computeFederationHealth', () => {
  it('computes health for active federation', () => {
    const health = computeFederationHealth({
      rigs: [
        { trustLevel: 2, active: true },
        { trustLevel: 1, active: true },
        { trustLevel: 0, active: false },
      ],
      completionsTotal: 50,
      stampsTotal: 30,
      activeGivers: 1,
    });

    expect(health.totalRigs).toBe(3);
    expect(health.activeRigs).toBe(2);
    expect(health.avgTrustLevel).toBe(1);
    expect(health.emergentRatio).toBe(0.5); // 1 giver / 2 active
    expect(health.healthScore).toBeGreaterThan(0);
    expect(health.healthScore).toBeLessThanOrEqual(1);
  });

  it('handles empty federation', () => {
    const health = computeFederationHealth({
      rigs: [],
      completionsTotal: 0,
      stampsTotal: 0,
      activeGivers: 0,
    });

    expect(health.totalRigs).toBe(0);
    expect(health.healthScore).toBe(0);
    expect(health.emergentRatio).toBe(0);
  });

  it('perfect health with all active givers at max trust', () => {
    const health = computeFederationHealth({
      rigs: [
        { trustLevel: 3, active: true },
        { trustLevel: 3, active: true },
      ],
      completionsTotal: 100,
      stampsTotal: 80,
      activeGivers: 2,
    });

    expect(health.healthScore).toBe(1);
    expect(health.emergentRatio).toBe(1);
  });
});
