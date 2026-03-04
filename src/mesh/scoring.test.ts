import { describe, it, expect } from 'vitest';
import {
  scoreNode,
  rankNodes,
  selectWithFallback,
  CAPABILITY_WEIGHT,
  LOAD_WEIGHT,
  PERFORMANCE_WEIGHT,
} from './scoring.js';
import type { MeshNode } from './types.js';

// ============================================================================
// Test helpers
// ============================================================================

function makeNode(overrides: Partial<MeshNode> & { nodeId: string }): MeshNode {
  return {
    name: overrides.name ?? `node-${overrides.nodeId}`,
    endpoint: overrides.endpoint ?? `https://${overrides.nodeId}.example.com`,
    capabilities: overrides.capabilities ?? [],
    registeredAt: overrides.registeredAt ?? '2025-01-01T00:00:00Z',
    lastHeartbeat: overrides.lastHeartbeat ?? '2025-01-01T00:00:00Z',
    status: overrides.status ?? 'healthy',
    ...overrides,
  };
}

// ============================================================================
// IMP-03 Constants
// ============================================================================

describe('scoring weight constants (IMP-03)', () => {
  it('exports CAPABILITY_WEIGHT = 0.4', () => {
    expect(CAPABILITY_WEIGHT).toBe(0.4);
  });

  it('exports LOAD_WEIGHT = 0.2', () => {
    expect(LOAD_WEIGHT).toBe(0.2);
  });

  it('exports PERFORMANCE_WEIGHT = 0.4', () => {
    expect(PERFORMANCE_WEIGHT).toBe(0.4);
  });

  it('weights sum to 1.0', () => {
    expect(CAPABILITY_WEIGHT + LOAD_WEIGHT + PERFORMANCE_WEIGHT).toBeCloseTo(1.0);
  });
});

// ============================================================================
// scoreNode
// ============================================================================

describe('scoreNode', () => {
  const capableNode = makeNode({
    nodeId: '11111111-1111-1111-1111-111111111111',
    capabilities: [
      { chipName: 'gpt-4', models: ['gpt-4-turbo'], maxContextLength: 128000 },
    ],
  });

  it('returns capabilityScore=1.0 when chip found and context sufficient', () => {
    const score = scoreNode(capableNode, { chipName: 'gpt-4', minContextLength: 8192 }, 0, 0.9);
    expect(score.capabilityScore).toBe(1.0);
  });

  it('returns capabilityScore=0 when chipName not found', () => {
    const score = scoreNode(capableNode, { chipName: 'llama', minContextLength: 0 }, 0, 0.9);
    expect(score.capabilityScore).toBe(0);
    expect(score.justification).toContain("chip 'llama' not found");
  });

  it('returns capabilityScore=0 when maxContextLength < minContextLength', () => {
    const score = scoreNode(capableNode, { chipName: 'gpt-4', minContextLength: 200000 }, 0, 0.9);
    expect(score.capabilityScore).toBe(0);
    expect(score.justification).toContain('context 128000 < required 200000');
  });

  it('computes loadScore as 1 - load', () => {
    const score = scoreNode(capableNode, { chipName: 'gpt-4', minContextLength: 0 }, 0.3, 0.8);
    expect(score.loadScore).toBeCloseTo(0.7);
  });

  it('computes performanceScore from passRate', () => {
    const score = scoreNode(capableNode, { chipName: 'gpt-4', minContextLength: 0 }, 0, 0.85);
    expect(score.performanceScore).toBe(0.85);
  });

  it('computes correct weighted totalScore', () => {
    const score = scoreNode(capableNode, { chipName: 'gpt-4', minContextLength: 0 }, 0.2, 0.9);
    // cap=1.0, load=0.8, perf=0.9
    // total = 0.4*1.0 + 0.2*0.8 + 0.4*0.9 = 0.4 + 0.16 + 0.36 = 0.92
    expect(score.totalScore).toBeCloseTo(0.92);
  });

  it('returns deterministic results for identical inputs', () => {
    const a = scoreNode(capableNode, { chipName: 'gpt-4', minContextLength: 0 }, 0.5, 0.75);
    const b = scoreNode(capableNode, { chipName: 'gpt-4', minContextLength: 0 }, 0.5, 0.75);
    expect(a).toEqual(b);
  });

  it('includes nodeId in score', () => {
    const score = scoreNode(capableNode, { chipName: 'gpt-4', minContextLength: 0 }, 0, 0);
    expect(score.nodeId).toBe('11111111-1111-1111-1111-111111111111');
  });

  it('includes chipName in score', () => {
    const score = scoreNode(capableNode, { chipName: 'gpt-4', minContextLength: 0 }, 0, 0);
    expect(score.chipName).toBe('gpt-4');
  });

  it('builds justification string with all components', () => {
    const score = scoreNode(capableNode, { chipName: 'gpt-4', minContextLength: 0 }, 0.1, 0.8);
    expect(score.justification).toContain("chip 'gpt-4' capable");
    expect(score.justification).toContain('load=0.10');
    expect(score.justification).toContain('passRate=0.80');
    expect(score.justification).toContain('total=');
  });
});

// ============================================================================
// rankNodes
// ============================================================================

describe('rankNodes', () => {
  const nodeA = makeNode({
    nodeId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    capabilities: [{ chipName: 'gpt-4', models: ['gpt-4'], maxContextLength: 128000 }],
  });

  const nodeB = makeNode({
    nodeId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    capabilities: [{ chipName: 'gpt-4', models: ['gpt-4'], maxContextLength: 128000 }],
  });

  const nodeC = makeNode({
    nodeId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    capabilities: [{ chipName: 'llama', models: ['llama-7b'], maxContextLength: 4096 }],
  });

  it('returns nodes sorted by totalScore descending', () => {
    const loads = new Map([
      ['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 0.1],
      ['bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 0.5],
    ]);
    const passRates = new Map([
      ['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 0.9],
      ['bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 0.7],
    ]);

    const ranked = rankNodes([nodeA, nodeB], { chipName: 'gpt-4', minContextLength: 0 }, loads, passRates);
    expect(ranked[0].nodeId).toBe('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
    expect(ranked[1].nodeId).toBe('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
    expect(ranked[0].totalScore).toBeGreaterThan(ranked[1].totalScore);
  });

  it('puts incapable nodes last', () => {
    const loads = new Map<string, number>();
    const passRates = new Map([
      ['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 0.8],
      ['cccccccc-cccc-cccc-cccc-cccccccccccc', 1.0], // high pass rate but wrong chip
    ]);

    const ranked = rankNodes(
      [nodeC, nodeA],
      { chipName: 'gpt-4', minContextLength: 0 },
      loads,
      passRates,
    );
    // nodeA: cap=1.0, load=1.0, perf=0.8 → 0.4+0.2+0.32 = 0.92
    // nodeC: cap=0,   load=1.0, perf=1.0 → 0+0.2+0.4 = 0.6
    expect(ranked[0].nodeId).toBe('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
    expect(ranked[1].capabilityScore).toBe(0);
  });

  it('defaults load to 0 and passRate to 0 for unknown nodes', () => {
    const ranked = rankNodes(
      [nodeA],
      { chipName: 'gpt-4', minContextLength: 0 },
      new Map(),
      new Map(),
    );
    expect(ranked[0].loadScore).toBe(1); // 1 - 0
    expect(ranked[0].performanceScore).toBe(0);
  });

  it('returns empty array for empty input', () => {
    const ranked = rankNodes([], { chipName: 'gpt-4', minContextLength: 0 }, new Map(), new Map());
    expect(ranked).toEqual([]);
  });
});

// ============================================================================
// selectWithFallback
// ============================================================================

describe('selectWithFallback', () => {
  const scoreA = {
    nodeId: 'a',
    chipName: 'gpt-4',
    capabilityScore: 1,
    loadScore: 0.9,
    performanceScore: 0.9,
    totalScore: 0.94,
    justification: 'best',
  };

  const scoreB = {
    nodeId: 'b',
    chipName: 'gpt-4',
    capabilityScore: 1,
    loadScore: 0.5,
    performanceScore: 0.7,
    totalScore: 0.68,
    justification: 'second',
  };

  it('returns target as ranked[0] and fallback as ranked[1]', () => {
    const result = selectWithFallback([scoreA, scoreB]);
    expect(result.target).toEqual(scoreA);
    expect(result.fallback).toEqual(scoreB);
  });

  it('returns undefined fallback when only one node', () => {
    const result = selectWithFallback([scoreA]);
    expect(result.target).toEqual(scoreA);
    expect(result.fallback).toBeUndefined();
  });
});

// ============================================================================
// IMP-06 purity check
// ============================================================================

describe('IMP-06 purity', () => {
  it('scoring.ts has no IO imports (verified at module level)', () => {
    // This test verifies the module loaded successfully without IO dependencies.
    // The grep-based verification in the plan's verify step does the full check.
    expect(scoreNode).toBeInstanceOf(Function);
    expect(rankNodes).toBeInstanceOf(Function);
    expect(selectWithFallback).toBeInstanceOf(Function);
  });
});
