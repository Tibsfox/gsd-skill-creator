/**
 * Tests for Wasteland Policy Generator — Layer 3 policy output.
 *
 * Covers:
 * - generateTownPersona: topology → persona policy
 * - generateDecompositionRule: template → decomp policy
 * - generateRoutingPolicy: route → routing policy
 * - generateActivationGate: gate spec → gate policy
 * - generateAllPolicies: batch generation
 * - serializePolicy: JSON output
 */

import { describe, it, expect } from 'vitest';
import {
  generateTownPersona,
  generateDecompositionRule,
  generateRoutingPolicy,
  generateActivationGate,
  generateAllPolicies,
  serializePolicy,
} from '../wasteland-policy-generator.js';
import type { TownGraph, ClusterResult, DecompositionTemplate, RoutingRule, GateSpec } from '../types.js';

// ============================================================================
// Fixtures
// ============================================================================

const GRAPH: TownGraph = {
  nodes: [
    { townId: 'hub', agentCount: 5, throughput: 100, betweennessCentrality: 0.8 },
    { townId: 'leaf', agentCount: 2, throughput: 20, betweennessCentrality: 0.1 },
  ],
  edges: [{ source: 'hub', target: 'leaf', handoffCount: 10, avgLatencyMs: 150 }],
};

const CLUSTERS: ClusterResult[] = [
  { id: 'c1', archetype: 'builder', size: 3, members: ['a1', 'a2', 'a3'], centroid: { build: 0.9 } },
];

const TEMPLATE: DecompositionTemplate = {
  id: 'tmpl-1',
  phases: [
    { name: 'plan', taskType: 'planning', recommendedArchetype: 'planner', estimatedDurationMs: 5000, dependencies: [] },
    { name: 'build', taskType: 'building', recommendedArchetype: 'builder', estimatedDurationMs: 10000, dependencies: ['plan'] },
  ],
  parallelizablePhases: [['plan', 'build']],
  estimatedDurationMs: 15000,
  confidence: 0.85,
};

const ROUTE: RoutingRule = {
  id: 'route-1',
  taskType: 'build',
  route: ['hub', 'leaf'],
  weight: 0.9,
  latencyEstimateMs: 300,
  successRateEstimate: 0.85,
  abTestActive: false,
};

const GATE: GateSpec = {
  id: 'gate-1',
  name: 'capability-check',
  type: 'pre-claim',
  automationLevel: 'advisory',
  sourceFailureSignatures: ['sig-1'],
  truePositiveRate: 0.9,
  falsePositiveRate: 0.05,
};

// ============================================================================
// generateTownPersona
// ============================================================================

describe('generateTownPersona', () => {
  it('generates persona with correct type and ID', () => {
    const policy = generateTownPersona('hub', GRAPH, CLUSTERS);
    expect(policy.type).toBe('town-persona');
    expect(policy.id).toBe('policy-persona-hub');
  });

  it('includes town metrics', () => {
    const policy = generateTownPersona('hub', GRAPH, CLUSTERS);
    expect(policy.config.agentCount).toBe(5);
    expect(policy.config.throughput).toBe(100);
    expect(policy.config.centrality).toBe(0.8);
  });

  it('marks high-centrality towns as bottlenecks', () => {
    const policy = generateTownPersona('hub', GRAPH, CLUSTERS);
    expect(policy.config.isBottleneck).toBe(true);
  });

  it('marks low-centrality towns as not bottlenecks', () => {
    const policy = generateTownPersona('leaf', GRAPH, CLUSTERS);
    expect(policy.config.isBottleneck).toBe(false);
  });

  it('handles unknown town gracefully', () => {
    const policy = generateTownPersona('unknown', GRAPH, CLUSTERS);
    expect(policy.config.agentCount).toBe(0);
    expect(policy.config.throughput).toBe(0);
  });
});

// ============================================================================
// generateDecompositionRule
// ============================================================================

describe('generateDecompositionRule', () => {
  it('generates decomp policy from template', () => {
    const policy = generateDecompositionRule(TEMPLATE);
    expect(policy.type).toBe('decomposition-rule');
    expect(policy.config.phases).toHaveLength(2);
    expect(policy.config.confidence).toBe(0.85);
  });
});

// ============================================================================
// generateRoutingPolicy
// ============================================================================

describe('generateRoutingPolicy', () => {
  it('generates routing policy from rule', () => {
    const policy = generateRoutingPolicy(ROUTE);
    expect(policy.type).toBe('routing-policy');
    expect(policy.config.route).toEqual(['hub', 'leaf']);
    expect(policy.config.successRateEstimate).toBe(0.85);
  });
});

// ============================================================================
// generateActivationGate
// ============================================================================

describe('generateActivationGate', () => {
  it('generates gate policy from spec', () => {
    const policy = generateActivationGate(GATE);
    expect(policy.type).toBe('activation-gate');
    expect(policy.config.metrics.tpr).toBe(0.9);
    expect(policy.config.metrics.fpr).toBe(0.05);
  });
});

// ============================================================================
// generateAllPolicies
// ============================================================================

describe('generateAllPolicies', () => {
  it('generates policies for all inputs', () => {
    const policies = generateAllPolicies(GRAPH, CLUSTERS, [TEMPLATE], [ROUTE], [GATE]);
    // 2 town personas + 1 decomp + 1 route + 1 gate = 5
    expect(policies).toHaveLength(5);
    expect(policies.filter(p => p.type === 'town-persona')).toHaveLength(2);
    expect(policies.filter(p => p.type === 'decomposition-rule')).toHaveLength(1);
    expect(policies.filter(p => p.type === 'routing-policy')).toHaveLength(1);
    expect(policies.filter(p => p.type === 'activation-gate')).toHaveLength(1);
  });

  it('handles empty inputs', () => {
    const policies = generateAllPolicies({ nodes: [], edges: [] }, [], [], [], []);
    expect(policies).toHaveLength(0);
  });
});

// ============================================================================
// serializePolicy
// ============================================================================

describe('serializePolicy', () => {
  it('produces valid JSON', () => {
    const policy = generateTownPersona('hub', GRAPH, CLUSTERS);
    const json = serializePolicy(policy);
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it('includes all policy fields', () => {
    const policy = generateRoutingPolicy(ROUTE);
    const parsed = JSON.parse(serializePolicy(policy));
    expect(parsed.id).toBe('policy-route-route-1');
    expect(parsed.type).toBe('routing-policy');
    expect(parsed.version).toBe('0.1.0');
  });
});
