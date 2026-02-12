/**
 * Team cost estimation engine.
 *
 * Produces per-member and total token/cost estimates for any team topology
 * using static pricing tables and per-topology token heuristics.
 *
 * Estimates include min/expected/max ranges to communicate uncertainty.
 * Leader, router, and orchestrator roles get a 1.5x token multiplier
 * since they handle delegation and synthesis in addition to their own work.
 */

import type { TeamMemberModel, TeamConfig } from '../types/team.js';

// ============================================================================
// Static Pricing (per million tokens, USD)
// ============================================================================

/**
 * Model pricing per million tokens.
 * Based on published Anthropic pricing as of PRICING_LAST_UPDATED.
 */
export const MODEL_PRICING: Record<TeamMemberModel, { input: number; output: number }> = {
  haiku:  { input: 0.25,  output: 1.25 },
  sonnet: { input: 3.00,  output: 15.00 },
  opus:   { input: 15.00, output: 75.00 },
};

/**
 * Per-topology base token estimates per member (input/output per invocation).
 * These are rough heuristics based on typical usage patterns.
 */
export const TOPOLOGY_TOKEN_ESTIMATES: Record<string, { perMemberInput: number; perMemberOutput: number }> = {
  'leader-worker': { perMemberInput: 8000,  perMemberOutput: 4000 },
  'pipeline':      { perMemberInput: 6000,  perMemberOutput: 3000 },
  'swarm':         { perMemberInput: 10000, perMemberOutput: 5000 },
  'router':        { perMemberInput: 5000,  perMemberOutput: 2500 },
  'map-reduce':    { perMemberInput: 8000,  perMemberOutput: 4000 },
  'custom':        { perMemberInput: 8000,  perMemberOutput: 4000 },
};

/** ISO date when pricing was last verified. */
export const PRICING_LAST_UPDATED = '2025-05-01';

// ============================================================================
// Result Types
// ============================================================================

/** Cost estimate for a single team member. */
export interface MemberEstimate {
  agentId: string;
  model: TeamMemberModel;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  estimatedCost: number; // Expected cost in USD
  minCost: number;       // 0.5x multiplier (best case)
  maxCost: number;       // 2.0x multiplier (worst case)
}

/** Aggregate cost estimate for an entire team. */
export interface CostEstimate {
  teamName: string;
  topology: string;
  members: MemberEstimate[];
  totalEstimatedCost: number;
  totalMinCost: number;
  totalMaxCost: number;
  totalEstimatedTokens: number;
  pricingDate: string;
}

// ============================================================================
// Roles that get a coordination multiplier
// ============================================================================

/** Roles that do extra coordination work (delegation + synthesis). */
const COORDINATION_ROLES = new Set(['leader', 'router', 'orchestrator']);

/** Multiplier for coordination roles (1.5x more tokens). */
const COORDINATION_MULTIPLIER = 1.5;

// ============================================================================
// CostEstimator
// ============================================================================

/**
 * Estimates token usage and cost for a team configuration.
 *
 * Uses static pricing tables and topology-based heuristics to produce
 * per-member and total estimates with min/expected/max ranges.
 */
export class CostEstimator {
  /**
   * Produce a cost estimate for the given team config.
   *
   * @param config - Team configuration with members and optional topology
   * @returns Aggregate cost estimate with per-member breakdown
   */
  estimate(config: TeamConfig): CostEstimate {
    // Read topology from config (uses index signature for forward compat)
    const topology = ((config as Record<string, unknown>).topology as string | undefined) ?? 'custom';

    // Look up topology token estimates, fall back to custom for unknown topologies
    const topoEstimates = TOPOLOGY_TOKEN_ESTIMATES[topology] ?? TOPOLOGY_TOKEN_ESTIMATES['custom'];

    const memberEstimates: MemberEstimate[] = [];

    for (const member of config.members) {
      // Default to sonnet when model is not specified
      const model: TeamMemberModel = (member.model as TeamMemberModel) ?? 'sonnet';
      const pricing = MODEL_PRICING[model];

      // Coordination roles get a multiplier on token estimates
      const role = (member.agentType ?? '').toLowerCase();
      const multiplier = COORDINATION_ROLES.has(role) ? COORDINATION_MULTIPLIER : 1.0;

      const estimatedInputTokens = topoEstimates.perMemberInput * multiplier;
      const estimatedOutputTokens = topoEstimates.perMemberOutput * multiplier;

      // Cost = (input_tokens * input_price + output_tokens * output_price) / 1M
      const estimatedCost = (estimatedInputTokens * pricing.input + estimatedOutputTokens * pricing.output) / 1_000_000;
      const minCost = estimatedCost * 0.5;
      const maxCost = estimatedCost * 2.0;

      memberEstimates.push({
        agentId: member.agentId,
        model,
        estimatedInputTokens,
        estimatedOutputTokens,
        estimatedCost,
        minCost,
        maxCost,
      });
    }

    // Aggregate totals
    const totalEstimatedCost = memberEstimates.reduce((sum, m) => sum + m.estimatedCost, 0);
    const totalMinCost = memberEstimates.reduce((sum, m) => sum + m.minCost, 0);
    const totalMaxCost = memberEstimates.reduce((sum, m) => sum + m.maxCost, 0);
    const totalEstimatedTokens = memberEstimates.reduce(
      (sum, m) => sum + m.estimatedInputTokens + m.estimatedOutputTokens,
      0,
    );

    return {
      teamName: config.name,
      topology,
      members: memberEstimates,
      totalEstimatedCost,
      totalMinCost,
      totalMaxCost,
      totalEstimatedTokens,
      pricingDate: PRICING_LAST_UPDATED,
    };
  }
}
