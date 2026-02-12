/**
 * Tests for CostEstimator and pricing constants.
 *
 * Verifies per-member and total cost estimation with static pricing,
 * topology-based token estimates, leader/router/orchestrator multipliers,
 * min/max ranges, and fallback behavior.
 */

import { describe, it, expect } from 'vitest';
import {
  CostEstimator,
  MODEL_PRICING,
  TOPOLOGY_TOKEN_ESTIMATES,
  PRICING_LAST_UPDATED,
} from './cost-estimator.js';
import type { TeamConfig } from '../types/team.js';

// ============================================================================
// Helper: create minimal TeamConfig
// ============================================================================

function makeConfig(overrides: Partial<TeamConfig> & { topology?: string } = {}): TeamConfig {
  const base: TeamConfig = {
    name: 'test-team',
    leadAgentId: 'leader',
    createdAt: '2025-01-01T00:00:00Z',
    members: [],
    ...overrides,
  };
  return base;
}

// ============================================================================
// MODEL_PRICING and TOPOLOGY_TOKEN_ESTIMATES exports
// ============================================================================

describe('MODEL_PRICING', () => {
  it('has entries for haiku, sonnet, opus', () => {
    expect(MODEL_PRICING).toHaveProperty('haiku');
    expect(MODEL_PRICING).toHaveProperty('sonnet');
    expect(MODEL_PRICING).toHaveProperty('opus');
  });

  it('all pricing values are positive numbers', () => {
    for (const [, pricing] of Object.entries(MODEL_PRICING)) {
      expect(pricing.input).toBeGreaterThan(0);
      expect(pricing.output).toBeGreaterThan(0);
    }
  });
});

describe('TOPOLOGY_TOKEN_ESTIMATES', () => {
  it('has entries for all 6 topologies', () => {
    const expected = ['leader-worker', 'pipeline', 'swarm', 'router', 'map-reduce', 'custom'];
    for (const topology of expected) {
      expect(TOPOLOGY_TOKEN_ESTIMATES).toHaveProperty(topology);
    }
  });

  it('all token estimates are positive numbers', () => {
    for (const [, est] of Object.entries(TOPOLOGY_TOKEN_ESTIMATES)) {
      expect(est.perMemberInput).toBeGreaterThan(0);
      expect(est.perMemberOutput).toBeGreaterThan(0);
    }
  });
});

describe('PRICING_LAST_UPDATED', () => {
  it('is a date string', () => {
    expect(typeof PRICING_LAST_UPDATED).toBe('string');
    expect(PRICING_LAST_UPDATED).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

// ============================================================================
// CostEstimator.estimate()
// ============================================================================

describe('CostEstimator', () => {
  const estimator = new CostEstimator();

  describe('basic leader-worker team', () => {
    it('computes per-member and total estimates for 1 leader + 2 workers all sonnet', () => {
      const config = makeConfig({
        topology: 'leader-worker',
        members: [
          { agentId: 'leader', name: 'Leader', agentType: 'leader', model: 'sonnet' },
          { agentId: 'worker-1', name: 'Worker 1', agentType: 'worker', model: 'sonnet' },
          { agentId: 'worker-2', name: 'Worker 2', agentType: 'worker', model: 'sonnet' },
        ],
      });

      const result = estimator.estimate(config);

      expect(result.teamName).toBe('test-team');
      expect(result.topology).toBe('leader-worker');
      expect(result.members).toHaveLength(3);

      // Leader gets 1.5x multiplier
      const leaderEst = result.members.find(m => m.agentId === 'leader')!;
      expect(leaderEst.estimatedInputTokens).toBe(8000 * 1.5);
      expect(leaderEst.estimatedOutputTokens).toBe(4000 * 1.5);

      // Workers get 1x
      const worker1 = result.members.find(m => m.agentId === 'worker-1')!;
      expect(worker1.estimatedInputTokens).toBe(8000);
      expect(worker1.estimatedOutputTokens).toBe(4000);

      // Verify cost calculation for a worker: (8000*3 + 4000*15) / 1_000_000
      const expectedWorkerCost = (8000 * 3.0 + 4000 * 15.0) / 1_000_000;
      expect(worker1.estimatedCost).toBeCloseTo(expectedWorkerCost, 6);

      // Total is sum of all members
      const totalCost = result.members.reduce((sum, m) => sum + m.estimatedCost, 0);
      expect(result.totalEstimatedCost).toBeCloseTo(totalCost, 6);
    });
  });

  describe('router team', () => {
    it('router member gets 1.5x multiplier on tokens', () => {
      const config = makeConfig({
        topology: 'router',
        members: [
          { agentId: 'my-router', name: 'Router', agentType: 'router', model: 'sonnet' },
          { agentId: 'spec-1', name: 'Specialist 1', agentType: 'specialist', model: 'sonnet' },
        ],
      });

      const result = estimator.estimate(config);
      const routerEst = result.members.find(m => m.agentId === 'my-router')!;

      // Router topology: perMemberInput=5000, perMemberOutput=2500
      expect(routerEst.estimatedInputTokens).toBe(5000 * 1.5);
      expect(routerEst.estimatedOutputTokens).toBe(2500 * 1.5);

      const specEst = result.members.find(m => m.agentId === 'spec-1')!;
      expect(specEst.estimatedInputTokens).toBe(5000);
      expect(specEst.estimatedOutputTokens).toBe(2500);
    });
  });

  describe('map-reduce team', () => {
    it('orchestrator gets 1.5x multiplier', () => {
      const config = makeConfig({
        topology: 'map-reduce',
        members: [
          { agentId: 'orch', name: 'Orchestrator', agentType: 'orchestrator', model: 'sonnet' },
          { agentId: 'w1', name: 'Worker', agentType: 'worker', model: 'sonnet' },
        ],
      });

      const result = estimator.estimate(config);
      const orchEst = result.members.find(m => m.agentId === 'orch')!;

      // Map-reduce: perMemberInput=8000, perMemberOutput=4000
      expect(orchEst.estimatedInputTokens).toBe(8000 * 1.5);
      expect(orchEst.estimatedOutputTokens).toBe(4000 * 1.5);
    });
  });

  describe('mixed models', () => {
    it('haiku workers and opus leader produce different costs per member', () => {
      const config = makeConfig({
        topology: 'leader-worker',
        members: [
          { agentId: 'leader', name: 'Leader', agentType: 'leader', model: 'opus' },
          { agentId: 'worker-1', name: 'Worker 1', agentType: 'worker', model: 'haiku' },
        ],
      });

      const result = estimator.estimate(config);
      const leaderEst = result.members.find(m => m.agentId === 'leader')!;
      const workerEst = result.members.find(m => m.agentId === 'worker-1')!;

      expect(leaderEst.model).toBe('opus');
      expect(workerEst.model).toBe('haiku');

      // Opus costs much more than haiku
      expect(leaderEst.estimatedCost).toBeGreaterThan(workerEst.estimatedCost);
    });
  });

  describe('default model', () => {
    it('defaults to sonnet when member.model is undefined', () => {
      const config = makeConfig({
        topology: 'pipeline',
        members: [
          { agentId: 'stage-1', name: 'Stage 1' },
        ],
      });

      const result = estimator.estimate(config);
      expect(result.members[0].model).toBe('sonnet');

      // Should use sonnet pricing
      const expectedCost = (6000 * 3.0 + 3000 * 15.0) / 1_000_000;
      expect(result.members[0].estimatedCost).toBeCloseTo(expectedCost, 6);
    });
  });

  describe('unknown topology', () => {
    it('falls back to custom estimates for unknown topology', () => {
      const config = makeConfig({
        topology: 'some-future-topology',
        members: [
          { agentId: 'agent-1', name: 'Agent', model: 'sonnet' },
        ],
      });

      const result = estimator.estimate(config);
      expect(result.topology).toBe('some-future-topology');

      // Custom defaults: 8000 input, 4000 output
      expect(result.members[0].estimatedInputTokens).toBe(8000);
      expect(result.members[0].estimatedOutputTokens).toBe(4000);
    });
  });

  describe('no topology field', () => {
    it('uses custom defaults when topology is not set', () => {
      const config = makeConfig({
        members: [
          { agentId: 'agent-1', name: 'Agent', model: 'sonnet' },
        ],
      });

      const result = estimator.estimate(config);
      expect(result.topology).toBe('custom');

      // Custom defaults: 8000 input, 4000 output
      expect(result.members[0].estimatedInputTokens).toBe(8000);
    });
  });

  describe('min/max ranges', () => {
    it('min = 0.5x expected, max = 2.0x expected', () => {
      const config = makeConfig({
        topology: 'pipeline',
        members: [
          { agentId: 'stage-1', name: 'Stage 1', model: 'sonnet' },
        ],
      });

      const result = estimator.estimate(config);
      const member = result.members[0];

      expect(member.minCost).toBeCloseTo(member.estimatedCost * 0.5, 6);
      expect(member.maxCost).toBeCloseTo(member.estimatedCost * 2.0, 6);

      // Totals follow same pattern
      expect(result.totalMinCost).toBeCloseTo(result.totalEstimatedCost * 0.5, 6);
      expect(result.totalMaxCost).toBeCloseTo(result.totalEstimatedCost * 2.0, 6);
    });
  });

  describe('single-member team', () => {
    it('works without error', () => {
      const config = makeConfig({
        topology: 'custom',
        members: [
          { agentId: 'solo', name: 'Solo Agent', model: 'haiku' },
        ],
      });

      const result = estimator.estimate(config);
      expect(result.members).toHaveLength(1);
      expect(result.totalEstimatedCost).toBeGreaterThan(0);
      expect(result.totalEstimatedTokens).toBeGreaterThan(0);
      expect(result.pricingDate).toBe(PRICING_LAST_UPDATED);
    });
  });
});
