import { describe, it, expect } from 'vitest';
import {
  RoutingRequestSchema,
  NodeScoreSchema,
  RoutingDecisionSchema,
} from './routing-types.js';
import type { RoutingRequest, NodeScore, RoutingDecision } from './routing-types.js';

// ============================================================================
// RoutingRequestSchema
// ============================================================================

describe('RoutingRequestSchema', () => {
  it('parses a valid routing request', () => {
    const input = {
      taskId: 'task-1',
      requiredCapability: { chipName: 'gpt-4', minContextLength: 8192 },
      preferLocal: false,
    };
    const result = RoutingRequestSchema.parse(input);
    expect(result.taskId).toBe('task-1');
    expect(result.requiredCapability.chipName).toBe('gpt-4');
    expect(result.requiredCapability.minContextLength).toBe(8192);
    expect(result.preferLocal).toBe(false);
  });

  it('defaults preferLocal to true', () => {
    const input = {
      taskId: 'task-2',
      requiredCapability: { chipName: 'claude', minContextLength: 0 },
    };
    const result = RoutingRequestSchema.parse(input);
    expect(result.preferLocal).toBe(true);
  });

  it('rejects negative minContextLength', () => {
    const input = {
      taskId: 'task-3',
      requiredCapability: { chipName: 'gpt-4', minContextLength: -1 },
    };
    expect(() => RoutingRequestSchema.parse(input)).toThrow();
  });

  it('rejects missing taskId', () => {
    const input = {
      requiredCapability: { chipName: 'gpt-4', minContextLength: 0 },
    };
    expect(() => RoutingRequestSchema.parse(input)).toThrow();
  });

  it('accepts zero minContextLength', () => {
    const input = {
      taskId: 'task-4',
      requiredCapability: { chipName: 'local', minContextLength: 0 },
    };
    const result = RoutingRequestSchema.parse(input);
    expect(result.requiredCapability.minContextLength).toBe(0);
  });
});

// ============================================================================
// NodeScoreSchema
// ============================================================================

describe('NodeScoreSchema', () => {
  it('parses a valid node score', () => {
    const input: NodeScore = {
      nodeId: 'node-1',
      chipName: 'gpt-4',
      capabilityScore: 1.0,
      loadScore: 0.8,
      performanceScore: 0.9,
      totalScore: 0.88,
      justification: "chip 'gpt-4' capable, load=0.20, passRate=0.90, total=0.880",
    };
    const result = NodeScoreSchema.parse(input);
    expect(result.nodeId).toBe('node-1');
    expect(result.totalScore).toBe(0.88);
  });

  it('rejects missing justification', () => {
    const input = {
      nodeId: 'node-1',
      chipName: 'gpt-4',
      capabilityScore: 1,
      loadScore: 0.8,
      performanceScore: 0.9,
      totalScore: 0.88,
    };
    expect(() => NodeScoreSchema.parse(input)).toThrow();
  });
});

// ============================================================================
// RoutingDecisionSchema
// ============================================================================

describe('RoutingDecisionSchema', () => {
  const targetScore: NodeScore = {
    nodeId: 'node-1',
    chipName: 'gpt-4',
    capabilityScore: 1.0,
    loadScore: 0.8,
    performanceScore: 0.9,
    totalScore: 0.88,
    justification: 'target justification',
  };

  const fallbackScore: NodeScore = {
    nodeId: 'node-2',
    chipName: 'gpt-4',
    capabilityScore: 1.0,
    loadScore: 0.5,
    performanceScore: 0.7,
    totalScore: 0.68,
    justification: 'fallback justification',
  };

  it('parses a decision with target and fallback', () => {
    const input: RoutingDecision = {
      taskId: 'task-1',
      target: targetScore,
      fallback: fallbackScore,
      routingJustification: 'Best node selected by score',
    };
    const result = RoutingDecisionSchema.parse(input);
    expect(result.target.nodeId).toBe('node-1');
    expect(result.fallback?.nodeId).toBe('node-2');
  });

  it('parses a decision without fallback', () => {
    const input: RoutingDecision = {
      taskId: 'task-2',
      target: targetScore,
      routingJustification: 'Only one node available',
    };
    const result = RoutingDecisionSchema.parse(input);
    expect(result.fallback).toBeUndefined();
  });

  it('rejects missing routingJustification', () => {
    const input = {
      taskId: 'task-3',
      target: targetScore,
    };
    expect(() => RoutingDecisionSchema.parse(input)).toThrow();
  });
});

// ============================================================================
// Type inference check (compile-time only)
// ============================================================================

describe('type inference', () => {
  it('RoutingRequest type is correctly inferred', () => {
    const req: RoutingRequest = {
      taskId: 'test',
      requiredCapability: { chipName: 'test', minContextLength: 0 },
      preferLocal: true,
    };
    expect(req.taskId).toBe('test');
  });
});
