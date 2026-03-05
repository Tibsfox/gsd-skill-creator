/**
 * Wasteland Policy Generator — Layer 3, Wave 3
 *
 * Translates recommendations into Wasteland CLI-compatible configs:
 * town personas, decomposition rules, routing policies, activation gates.
 */

import type {
  TeamScore,
  DecompositionTemplate,
  RoutingRule,
  GateSpec,
  WastelandPolicy,
  TownGraph,
  ClusterResult,
} from './types.js';

// ============================================================================
// Town Persona Generation
// ============================================================================

/**
 * Generate a town persona policy from clustering and topology data.
 * Town personas define what types of work a town specializes in.
 */
export function generateTownPersona(
  townId: string,
  graph: TownGraph,
  clusters: ClusterResult[],
): WastelandPolicy {
  const townNode = graph.nodes.find(n => n.townId === townId);

  // Find which clusters have members in this town
  // (In a real implementation, we'd cross-reference agent locations)
  const townClusters = clusters.map(c => ({
    archetype: c.archetype,
    size: c.size,
  }));

  return {
    id: `policy-persona-${townId}`,
    type: 'town-persona',
    townId,
    config: {
      townId,
      agentCount: townNode?.agentCount ?? 0,
      throughput: townNode?.throughput ?? 0,
      specializations: townClusters.map(c => c.archetype),
      centrality: townNode?.betweennessCentrality ?? 0,
      isBottleneck: (townNode?.betweennessCentrality ?? 0) > 0.5,
    },
    sourceRecommendationId: `auto-persona-${townId}`,
    createdAt: new Date().toISOString(),
    version: '0.1.0',
  };
}

// ============================================================================
// Decomposition Rule Generation
// ============================================================================

/**
 * Generate a decomposition rule policy from a template.
 */
export function generateDecompositionRule(
  template: DecompositionTemplate,
): WastelandPolicy {
  return {
    id: `policy-decomp-${template.id}`,
    type: 'decomposition-rule',
    config: {
      templateId: template.id,
      phases: template.phases.map(p => ({
        name: p.name,
        taskType: p.taskType,
        archetype: p.recommendedArchetype,
        estimatedDurationMs: p.estimatedDurationMs,
        dependencies: p.dependencies,
      })),
      parallelGroups: template.parallelizablePhases,
      totalEstimatedMs: template.estimatedDurationMs,
      confidence: template.confidence,
    },
    sourceRecommendationId: `rec-decomp-${template.id}`,
    createdAt: new Date().toISOString(),
    version: '0.1.0',
  };
}

// ============================================================================
// Routing Policy Generation
// ============================================================================

/**
 * Generate a routing policy from an optimized route.
 */
export function generateRoutingPolicy(
  rule: RoutingRule,
): WastelandPolicy {
  return {
    id: `policy-route-${rule.id}`,
    type: 'routing-policy',
    config: {
      ruleId: rule.id,
      taskType: rule.taskType,
      route: rule.route,
      weight: rule.weight,
      latencyEstimateMs: rule.latencyEstimateMs,
      successRateEstimate: rule.successRateEstimate,
      abTestActive: rule.abTestActive,
    },
    sourceRecommendationId: `rec-route-${rule.id}`,
    createdAt: new Date().toISOString(),
    version: '0.1.0',
  };
}

// ============================================================================
// Activation Gate Generation
// ============================================================================

/**
 * Generate an activation gate policy from a gate spec.
 * Activation gates control when agents can claim tasks.
 */
export function generateActivationGate(
  gate: GateSpec,
): WastelandPolicy {
  return {
    id: `policy-gate-${gate.id}`,
    type: 'activation-gate',
    config: {
      gateId: gate.id,
      name: gate.name,
      type: gate.type,
      automationLevel: gate.automationLevel,
      sourceSignatures: gate.sourceFailureSignatures,
      metrics: {
        tpr: gate.truePositiveRate,
        fpr: gate.falsePositiveRate,
      },
    },
    sourceRecommendationId: `rec-gate-${gate.id}`,
    createdAt: new Date().toISOString(),
    version: '0.1.0',
  };
}

// ============================================================================
// Batch Policy Generation
// ============================================================================

/**
 * Generate all policies from current pipeline state.
 */
export function generateAllPolicies(
  graph: TownGraph,
  clusters: ClusterResult[],
  templates: DecompositionTemplate[],
  routes: RoutingRule[],
  gates: GateSpec[],
): WastelandPolicy[] {
  const policies: WastelandPolicy[] = [];

  // Town personas
  for (const node of graph.nodes) {
    policies.push(generateTownPersona(node.townId, graph, clusters));
  }

  // Decomposition rules
  for (const tmpl of templates) {
    policies.push(generateDecompositionRule(tmpl));
  }

  // Routing policies
  for (const rule of routes) {
    policies.push(generateRoutingPolicy(rule));
  }

  // Activation gates
  for (const gate of gates) {
    policies.push(generateActivationGate(gate));
  }

  return policies;
}

/**
 * Serialize a policy to JSON for Wasteland CLI consumption.
 */
export function serializePolicy(policy: WastelandPolicy): string {
  return JSON.stringify(policy, null, 2);
}
