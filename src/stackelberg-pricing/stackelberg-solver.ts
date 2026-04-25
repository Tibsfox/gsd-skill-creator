/**
 * Stackelberg Drainability Pricing Reference — Stackelberg game solver.
 *
 * Implements a bilevel Stackelberg game solver where:
 *   - The LEADER (platform operator) sets prices per resource to maximise revenue.
 *   - The FOLLOWERS (tenants) each respond by choosing consumption levels that
 *     maximise their utility net of cost.
 *
 * The leader's problem is constrained by drainability guardrails:
 *
 *   max_{p}  Revenue(p, d(p))
 *   s.t.     Σₖ dₖᵣ(p) ≤ Cᵣ − δᵣ   for all r  (drainability constraint)
 *
 * Implementation strategy:
 *   1. Grid search over price space (outer loop / leader problem).
 *   2. For each price candidate, compute all tenants' best-response demands
 *      (inner loop / follower problems via `utility-models.ts`).
 *   3. Evaluate guardrail feasibility; skip infeasible candidates.
 *   4. Among feasible candidates, return the one maximising platform revenue.
 *
 * The grid resolution is configurable via `StackelbergGame.gridSteps`
 * (default 20). No external optimisation library is used — plain TypeScript.
 *
 * Reference: arXiv:2604.16802 (Yan et al., CDC 2026)
 *
 * REFERENCE IMPLEMENTATION ONLY. No commercial deployment in this milestone.
 *
 * @module stackelberg-pricing/stackelberg-solver
 */

import {
  checkGuardrailFeasibility,
  computeGuardrailSlack,
} from './drainability-guardrail-checker.js';
import type {
  PricingSolution,
  ResourceId,
  StackelbergGame,
  TenantUsage,
} from './types.js';
import {
  computeBestResponse,
  computeRevenue,
  evaluateUtility,
} from './utility-models.js';

// ============================================================================
// Internal helpers
// ============================================================================

/** Build a price-grid candidate from multi-dimensional index. */
function buildPriceVector(
  resourceIds: ResourceId[],
  indices: number[],
  minPrices: number[],
  maxPrices: number[],
  steps: number,
): Record<ResourceId, number> {
  const prices: Record<ResourceId, number> = {};
  for (let i = 0; i < resourceIds.length; i++) {
    const t = steps === 0 ? 0 : indices[i]! / steps;
    prices[resourceIds[i]!] = minPrices[i]! + t * (maxPrices[i]! - minPrices[i]!);
  }
  return prices;
}

/**
 * Enumerate all price-grid points for `numResources` resources with
 * `steps` steps each, yielding each as an index vector [i₀, i₁, ...].
 * Total points = (steps+1)^numResources.
 */
function* priceGridIterator(
  numResources: number,
  steps: number,
): Generator<number[]> {
  const size = steps + 1;
  const total = Math.pow(size, numResources);
  for (let flat = 0; flat < total; flat++) {
    const indices: number[] = [];
    let rem = flat;
    for (let d = 0; d < numResources; d++) {
      indices.push(rem % size);
      rem = Math.floor(rem / size);
    }
    yield indices;
  }
}

/**
 * Compute all tenants' best-response consumption at a given price vector.
 */
function computeAllBestResponses(
  game: StackelbergGame,
  prices: Readonly<Record<ResourceId, number>>,
  gridSteps: number,
): TenantUsage[] {
  const usages: TenantUsage[] = [];
  for (const tenant of game.tenants) {
    const consumption = computeBestResponse(
      tenant.utility,
      prices,
      tenant.maxConsumption,
      gridSteps,
    );
    const utilityValue = evaluateUtility(tenant.utility, consumption);
    let totalCost = 0;
    for (const [rid, x] of Object.entries(consumption)) {
      totalCost += (prices[rid] ?? 0) * x;
    }
    usages.push({
      tenantId: tenant.id,
      consumption,
      utilityValue,
      totalCost,
    });
  }
  return usages;
}

/**
 * Compute aggregate demand per resource from a list of tenant usages.
 */
function computeAggregateDemand(
  usages: readonly TenantUsage[],
  resourceIds: ResourceId[],
): Record<ResourceId, number> {
  const agg: Record<ResourceId, number> = {};
  for (const rid of resourceIds) agg[rid] = 0;
  for (const usage of usages) {
    for (const [rid, x] of Object.entries(usage.consumption)) {
      agg[rid] = (agg[rid] ?? 0) + x;
    }
  }
  return agg;
}

// ============================================================================
// Public solver
// ============================================================================

/**
 * Solve a Stackelberg game with drainability guardrails.
 *
 * The leader (platform operator) chooses a price vector that maximises
 * platform revenue while ensuring all followers' (tenants') best-response
 * demands do not drain any shared resource below its guardrail floor.
 *
 * The bilevel problem is solved by grid search over the price space.
 * If no guardrail-feasible price vector exists, the solver returns the
 * least-infeasible solution (with `guardrailFeasible: false`).
 *
 * @param game Stackelberg game specification.
 * @returns    Pricing solution at the Stackelberg equilibrium.
 */
export function solveStackelberg(game: StackelbergGame): PricingSolution {
  if (game.resources.length === 0) {
    throw new Error('solveStackelberg: game must have at least one resource');
  }
  if (game.tenants.length === 0) {
    throw new Error('solveStackelberg: game must have at least one tenant');
  }

  const steps = game.gridSteps ?? 20;
  const innerGridSteps = 50; // Best-response grid resolution for CES/CD.

  const resourceIds = game.resources.map((r) => r.id);
  const minPrices = game.resources.map((r) => r.minPrice ?? 0);
  const maxPrices = game.resources.map((r) => {
    if (r.maxPrice !== undefined && r.maxPrice !== Infinity) return r.maxPrice;
    // Heuristic upper bound: 2× the maximum marginal value across tenants.
    // For quadratic utilities, a is the marginal benefit at zero consumption.
    let upperBound = 10; // fallback
    for (const tenant of game.tenants) {
      if (tenant.utility.kind === 'quadratic') {
        upperBound = Math.max(upperBound, tenant.utility.a * 1.2);
      }
    }
    return upperBound;
  });

  let bestRevenue = -Infinity;
  let bestSolution: PricingSolution | null = null;
  // Track best infeasible solution as fallback.
  let bestInfeasibleRevenue = -Infinity;
  let bestInfeasibleSolution: PricingSolution | null = null;
  let iterations = 0;

  for (const indices of priceGridIterator(resourceIds.length, steps)) {
    iterations++;
    const prices = buildPriceVector(
      resourceIds,
      indices,
      minPrices,
      maxPrices,
      steps,
    );

    const usages = computeAllBestResponses(game, prices, innerGridSteps);
    const aggregateDemand = computeAggregateDemand(usages, resourceIds);

    const feasible = checkGuardrailFeasibility(aggregateDemand, game.resources);
    const slack = computeGuardrailSlack(aggregateDemand, game.resources);

    const revenue = computeRevenue(
      prices,
      aggregateDemand,
      game.revenueModel ?? 'linear',
      game.platformCost ?? {},
    );

    const candidate: PricingSolution = {
      prices: { ...prices },
      tenantUsages: usages,
      aggregateDemand: { ...aggregateDemand },
      revenue,
      guardrailFeasible: feasible,
      guardrailSlack: { ...slack },
      solverIterations: iterations,
    };

    if (feasible) {
      if (revenue > bestRevenue) {
        bestRevenue = revenue;
        bestSolution = candidate;
      }
    } else {
      if (revenue > bestInfeasibleRevenue) {
        bestInfeasibleRevenue = revenue;
        bestInfeasibleSolution = candidate;
      }
    }
  }

  // Return best feasible solution; fall back to best infeasible if none found.
  const result = bestSolution ?? bestInfeasibleSolution;
  if (!result) {
    // Should be unreachable — the loop always produces at least one candidate.
    throw new Error('solveStackelberg: solver produced no candidates');
  }
  // Stamp final iteration count.
  return { ...result, solverIterations: iterations };
}
