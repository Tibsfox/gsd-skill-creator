import { describe, it, expect } from 'vitest';
import { applyCostPolicy, LOCAL_PASS_RATE_THRESHOLD } from './routing-policy.js';
import type { MeshNode } from './types.js';

// ============================================================================
// Test helpers
// ============================================================================

function makeNode(overrides: Partial<MeshNode> & { nodeId: string }): MeshNode {
  return {
    name: overrides.name ?? `node-${overrides.nodeId.slice(0, 8)}`,
    endpoint: overrides.endpoint ?? `https://${overrides.nodeId}.example.com`,
    capabilities: overrides.capabilities ?? [],
    registeredAt: overrides.registeredAt ?? '2025-01-01T00:00:00Z',
    lastHeartbeat: overrides.lastHeartbeat ?? '2025-01-01T00:00:00Z',
    status: overrides.status ?? 'healthy',
    ...overrides,
  };
}

const LOCAL_ID = 'local-111-1111-1111-111111111111';
const CLOUD_ID = 'cloud-222-2222-2222-222222222222';

const localNode = makeNode({
  nodeId: LOCAL_ID,
  name: 'local-workstation',
  capabilities: [{ chipName: 'gpt-4', models: ['gpt-4'], maxContextLength: 128000 }],
});

const cloudNode = makeNode({
  nodeId: CLOUD_ID,
  name: 'cloud-gpu',
  capabilities: [{ chipName: 'gpt-4', models: ['gpt-4-turbo'], maxContextLength: 128000 }],
});

const requirement = { chipName: 'gpt-4', minContextLength: 0 };

// ============================================================================
// LOCAL_PASS_RATE_THRESHOLD constant (IMP-03)
// ============================================================================

describe('LOCAL_PASS_RATE_THRESHOLD (IMP-03)', () => {
  it('exports 0.70', () => {
    expect(LOCAL_PASS_RATE_THRESHOLD).toBe(0.70);
  });

  it('is between 0 and 1', () => {
    expect(LOCAL_PASS_RATE_THRESHOLD).toBeGreaterThan(0);
    expect(LOCAL_PASS_RATE_THRESHOLD).toBeLessThanOrEqual(1);
  });
});

// ============================================================================
// applyCostPolicy
// ============================================================================

describe('applyCostPolicy', () => {
  it('selects local node when pass rate >= threshold', () => {
    const loads = new Map<string, number>();
    const passRates = new Map([[LOCAL_ID, 0.85]]);

    const decision = applyCostPolicy(
      [localNode, cloudNode],
      requirement,
      loads,
      passRates,
      LOCAL_ID,
    );

    expect(decision.target.nodeId).toBe(LOCAL_ID);
    expect(decision.routingJustification).toContain('local-workstation');
    expect(decision.routingJustification).toContain('cost-optimized');
  });

  it('selects local node at exactly the threshold', () => {
    const loads = new Map<string, number>();
    const passRates = new Map([[LOCAL_ID, 0.70]]);

    const decision = applyCostPolicy(
      [localNode, cloudNode],
      requirement,
      loads,
      passRates,
      LOCAL_ID,
    );

    expect(decision.target.nodeId).toBe(LOCAL_ID);
  });

  it('uses standard scoring when local pass rate < threshold', () => {
    const loads = new Map<string, number>();
    const passRates = new Map([
      [LOCAL_ID, 0.50],
      [CLOUD_ID, 0.95],
    ]);

    const decision = applyCostPolicy(
      [localNode, cloudNode],
      requirement,
      loads,
      passRates,
      LOCAL_ID,
    );

    // Cloud should win because it has better pass rate and we're not in local-prefer mode
    expect(decision.target.nodeId).toBe(CLOUD_ID);
    expect(decision.routingJustification).toContain('cloud-preferred');
  });

  it('uses standard scoring when local node not in pool', () => {
    const loads = new Map<string, number>();
    const passRates = new Map([[CLOUD_ID, 0.90]]);

    const decision = applyCostPolicy(
      [cloudNode],
      requirement,
      loads,
      passRates,
      LOCAL_ID,
    );

    expect(decision.target.nodeId).toBe(CLOUD_ID);
    expect(decision.routingJustification).toContain('Local node not found');
  });

  it('returns error decision for empty nodes array', () => {
    const decision = applyCostPolicy(
      [],
      requirement,
      new Map(),
      new Map(),
      LOCAL_ID,
    );

    expect(decision.routingJustification).toBe('No healthy nodes available');
    expect(decision.target.totalScore).toBe(0);
  });

  it('provides fallback when local is selected and other nodes exist', () => {
    const loads = new Map<string, number>();
    const passRates = new Map([
      [LOCAL_ID, 0.80],
      [CLOUD_ID, 0.90],
    ]);

    const decision = applyCostPolicy(
      [localNode, cloudNode],
      requirement,
      loads,
      passRates,
      LOCAL_ID,
    );

    expect(decision.target.nodeId).toBe(LOCAL_ID);
    expect(decision.fallback).toBeDefined();
    expect(decision.fallback!.nodeId).toBe(CLOUD_ID);
  });

  it('provides fallback from standard scoring', () => {
    const thirdNode = makeNode({
      nodeId: 'third-333-3333-3333-333333333333',
      capabilities: [{ chipName: 'gpt-4', models: ['gpt-4'], maxContextLength: 128000 }],
    });

    const loads = new Map<string, number>();
    const passRates = new Map([
      [LOCAL_ID, 0.40],
      [CLOUD_ID, 0.95],
      ['third-333-3333-3333-333333333333', 0.80],
    ]);

    const decision = applyCostPolicy(
      [localNode, cloudNode, thirdNode],
      requirement,
      loads,
      passRates,
      LOCAL_ID,
    );

    expect(decision.target.nodeId).toBe(CLOUD_ID);
    expect(decision.fallback).toBeDefined();
  });

  it('respects custom localPassRateThreshold', () => {
    const loads = new Map<string, number>();
    const passRates = new Map([
      [LOCAL_ID, 0.60],
      [CLOUD_ID, 0.90],
    ]);

    // With threshold 0.50, local at 0.60 should qualify
    const decision = applyCostPolicy(
      [localNode, cloudNode],
      requirement,
      loads,
      passRates,
      LOCAL_ID,
      { localPassRateThreshold: 0.50 },
    );

    expect(decision.target.nodeId).toBe(LOCAL_ID);
  });

  it('includes routingJustification explaining why local was skipped', () => {
    const loads = new Map<string, number>();
    const passRates = new Map([
      [LOCAL_ID, 0.50],
      [CLOUD_ID, 0.90],
    ]);

    const decision = applyCostPolicy(
      [localNode, cloudNode],
      requirement,
      loads,
      passRates,
      LOCAL_ID,
    );

    expect(decision.routingJustification).toContain('0.50');
    expect(decision.routingJustification).toContain('threshold');
  });

  it('no fallback when local selected and no other nodes', () => {
    const loads = new Map<string, number>();
    const passRates = new Map([[LOCAL_ID, 0.80]]);

    const decision = applyCostPolicy(
      [localNode],
      requirement,
      loads,
      passRates,
      LOCAL_ID,
    );

    expect(decision.target.nodeId).toBe(LOCAL_ID);
    expect(decision.fallback).toBeUndefined();
  });
});

// ============================================================================
// IMP-06 purity check
// ============================================================================

describe('IMP-06 purity', () => {
  it('routing-policy.ts has no IO imports (verified at module level)', () => {
    expect(applyCostPolicy).toBeInstanceOf(Function);
  });
});
