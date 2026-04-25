/**
 * Stackelberg Drainability Pricing Reference — utility models.
 *
 * Pure-function implementations of three tenant utility models:
 *   - Quadratic:    U(x) = a·x − (b/2)·x²
 *   - CES:          U(x) = A · (Σ αᵢ xᵢ^ρ)^(1/ρ)
 *   - Cobb-Douglas: U(x) = A · Πᵢ xᵢ^αᵢ
 *
 * Each model exposes:
 *   - `evaluate(params, consumption)` — compute utility value
 *   - `bestResponse(params, prices, maxConsumption)` — compute the
 *     demand vector that maximises U(x) − p·x subject to 0 ≤ xᵢ ≤ maxᵢ
 *
 * No external dependencies.
 *
 * Reference: arXiv:2604.16802 (Yan et al., CDC 2026)
 *
 * @module stackelberg-pricing/utility-models
 */

import type {
  CESUtilityParams,
  CobbDouglasUtilityParams,
  QuadraticUtilityParams,
  ResourceId,
  UtilityFunction,
} from './types.js';

// ============================================================================
// Quadratic utility
// ============================================================================

/**
 * Evaluate quadratic utility U(x) = a·x − (b/2)·x²
 * for a SINGLE resource. Returns 0 if x < 0.
 */
export function evaluateQuadratic(
  params: QuadraticUtilityParams,
  x: number,
): number {
  if (x < 0) return 0;
  return params.a * x - (params.b / 2) * x * x;
}

/**
 * Closed-form best response for quadratic utility (single resource).
 *
 * max U(x) − p·x = a·x − (b/2)·x² − p·x
 * First-order condition: a − b·x − p = 0 → x* = (a − p) / b
 * Clamped to [0, maxX].
 *
 * @param params Quadratic utility parameters.
 * @param price  Price for this resource.
 * @param maxX   Maximum consumption allowed.
 */
export function quadraticBestResponse(
  params: QuadraticUtilityParams,
  price: number,
  maxX: number,
): number {
  if (price >= params.a) return 0; // Not profitable to consume anything.
  const unconstrained = (params.a - price) / params.b;
  return Math.max(0, Math.min(maxX, unconstrained));
}

/**
 * Best-response demand map for a quadratic-utility tenant over multiple
 * resources.  Resources are assumed separable: demand for each resource is
 * independent.
 *
 * @param params     Quadratic utility parameters (applied to each resource).
 * @param prices     Price per resource.
 * @param maxConsumption Maximum consumption per resource.
 */
export function quadraticBestResponseMulti(
  params: QuadraticUtilityParams,
  prices: Readonly<Record<ResourceId, number>>,
  maxConsumption: Readonly<Record<ResourceId, number>>,
): Record<ResourceId, number> {
  const result: Record<ResourceId, number> = {};
  for (const resourceId of Object.keys(prices)) {
    const maxX = maxConsumption[resourceId] ?? 0;
    result[resourceId] = quadraticBestResponse(params, prices[resourceId]!, maxX);
  }
  return result;
}

// ============================================================================
// CES utility
// ============================================================================

/**
 * Evaluate CES utility: U(x) = A · (Σ αᵢ xᵢ^ρ)^(1/ρ)
 *
 * When ρ < 0, U = 0 if any xᵢ = 0 (Leontief-like behaviour).
 * When xᵢ ≤ 0 for any resource, we return 0 to avoid NaN.
 *
 * @param params  CES utility parameters.
 * @param consumption  Per-resource consumption (indexed by resourceId).
 */
export function evaluateCES(
  params: CESUtilityParams,
  consumption: Readonly<Record<ResourceId, number>>,
): number {
  const resourceIds = Object.keys(params.alpha);
  if (resourceIds.length === 0) return 0;

  let innerSum = 0;
  for (const rid of resourceIds) {
    const xi = consumption[rid] ?? 0;
    if (xi <= 0) {
      if (params.rho < 0) return 0; // Leontief regime: any zero → U = 0
      // For rho > 0 we can proceed (zero contribution from this term)
      continue;
    }
    const alphai = params.alpha[rid] ?? 0;
    innerSum += alphai * Math.pow(xi, params.rho);
  }

  if (innerSum <= 0) return 0;
  return params.A * Math.pow(innerSum, 1 / params.rho);
}

/**
 * Best response for CES utility via grid search over the feasible box.
 *
 * The CES demand function does not have a simple closed form for the general
 * multi-resource case, so we use a coordinate-wise grid search.  For the
 * purposes of this reference implementation, 50 steps per resource gives
 * sufficient accuracy.
 *
 * @param params         CES utility parameters.
 * @param prices         Price per resource.
 * @param maxConsumption Maximum consumption per resource.
 * @param steps          Grid steps per resource dimension (default 50).
 */
export function cesBestResponse(
  params: CESUtilityParams,
  prices: Readonly<Record<ResourceId, number>>,
  maxConsumption: Readonly<Record<ResourceId, number>>,
  steps = 50,
): Record<ResourceId, number> {
  const resourceIds = Object.keys(params.alpha);
  // Coordinate-wise maximisation: for each resource, treat others as fixed
  // at their current optimum (Gauss-Seidel / block-coordinate descent).
  // Two passes is sufficient for the reference implementation.
  const current: Record<ResourceId, number> = {};
  for (const rid of resourceIds) {
    current[rid] = 0;
  }

  for (let pass = 0; pass < 3; pass++) {
    for (const rid of resourceIds) {
      const maxX = maxConsumption[rid] ?? 0;
      const price = prices[rid] ?? 0;
      let bestVal = -Infinity;
      let bestX = 0;
      for (let step = 0; step <= steps; step++) {
        const xi = (step / steps) * maxX;
        const trial = { ...current, [rid]: xi };
        const u = evaluateCES(params, trial) - price * xi;
        if (u > bestVal) {
          bestVal = u;
          bestX = xi;
        }
      }
      current[rid] = bestX;
    }
  }
  return current;
}

// ============================================================================
// Cobb-Douglas utility
// ============================================================================

/**
 * Evaluate Cobb-Douglas utility: U(x) = A · Πᵢ xᵢ^αᵢ
 *
 * Returns 0 if any xᵢ ≤ 0 (log is undefined; convention: U = 0).
 *
 * @param params     Cobb-Douglas utility parameters.
 * @param consumption Per-resource consumption (indexed by resourceId).
 */
export function evaluateCobbDouglas(
  params: CobbDouglasUtilityParams,
  consumption: Readonly<Record<ResourceId, number>>,
): number {
  const resourceIds = Object.keys(params.alpha);
  if (resourceIds.length === 0) return 0;

  let product = params.A;
  for (const rid of resourceIds) {
    const xi = consumption[rid] ?? 0;
    if (xi <= 0) return 0;
    const alphai = params.alpha[rid] ?? 0;
    product *= Math.pow(xi, alphai);
  }
  return product;
}

/**
 * Best response for Cobb-Douglas utility.
 *
 * For a single resource, the demand function can be derived analytically
 * only under specific normalisation.  For the multi-resource reference
 * implementation we use a grid search approach — same as CES.
 *
 * @param params         Cobb-Douglas parameters.
 * @param prices         Price per resource.
 * @param maxConsumption Maximum consumption per resource.
 * @param steps          Grid steps per resource dimension (default 50).
 */
export function cobbDouglasBestResponse(
  params: CobbDouglasUtilityParams,
  prices: Readonly<Record<ResourceId, number>>,
  maxConsumption: Readonly<Record<ResourceId, number>>,
  steps = 50,
): Record<ResourceId, number> {
  const resourceIds = Object.keys(params.alpha);
  const current: Record<ResourceId, number> = {};
  // Initialise at midpoint to help Cobb-Douglas avoid the zero corner.
  for (const rid of resourceIds) {
    current[rid] = (maxConsumption[rid] ?? 0) / 2;
  }

  for (let pass = 0; pass < 3; pass++) {
    for (const rid of resourceIds) {
      const maxX = maxConsumption[rid] ?? 0;
      const price = prices[rid] ?? 0;
      let bestVal = -Infinity;
      let bestX = current[rid]!;
      for (let step = 0; step <= steps; step++) {
        const xi = (step / steps) * maxX;
        const trial = { ...current, [rid]: xi };
        const u = evaluateCobbDouglas(params, trial) - price * xi;
        if (u > bestVal) {
          bestVal = u;
          bestX = xi;
        }
      }
      current[rid] = bestX;
    }
  }
  return current;
}

// ============================================================================
// Unified dispatcher
// ============================================================================

/**
 * Evaluate utility for any supported utility function.
 *
 * @param utility     Utility function parameters.
 * @param consumption Per-resource consumption (indexed by resourceId).
 */
export function evaluateUtility(
  utility: UtilityFunction,
  consumption: Readonly<Record<ResourceId, number>>,
): number {
  switch (utility.kind) {
    case 'quadratic': {
      // For multi-resource quadratic, sum utilities across resources
      // (separable assumption).
      let total = 0;
      for (const [rid, x] of Object.entries(consumption)) {
        void rid;
        total += evaluateQuadratic(utility, x);
      }
      return total;
    }
    case 'ces':
      return evaluateCES(utility, consumption);
    case 'cobb-douglas':
      return evaluateCobbDouglas(utility, consumption);
  }
}

/**
 * Compute a tenant's best-response demand for any supported utility function.
 *
 * @param utility        Utility function parameters.
 * @param prices         Price per resource.
 * @param maxConsumption Maximum consumption per resource.
 * @param gridSteps      Grid steps used by grid-search solvers (default 50).
 */
export function computeBestResponse(
  utility: UtilityFunction,
  prices: Readonly<Record<ResourceId, number>>,
  maxConsumption: Readonly<Record<ResourceId, number>>,
  gridSteps = 50,
): Record<ResourceId, number> {
  switch (utility.kind) {
    case 'quadratic':
      return quadraticBestResponseMulti(utility, prices, maxConsumption);
    case 'ces':
      return cesBestResponse(utility, prices, maxConsumption, gridSteps);
    case 'cobb-douglas':
      return cobbDouglasBestResponse(utility, prices, maxConsumption, gridSteps);
  }
}

// ============================================================================
// Platform revenue model
// ============================================================================

/**
 * Compute platform revenue at a given price vector and aggregate demand.
 *
 * @param prices          Price per resource (indexed by resourceId).
 * @param aggregateDemand Aggregate tenant demand per resource.
 * @param revenueModel    "linear" (default) or "quadratic" (margin-based).
 * @param platformCost    Per-resource cost to platform (used for "quadratic").
 */
export function computeRevenue(
  prices: Readonly<Record<ResourceId, number>>,
  aggregateDemand: Readonly<Record<ResourceId, number>>,
  revenueModel: 'linear' | 'quadratic' = 'linear',
  platformCost: Readonly<Record<ResourceId, number>> = {},
): number {
  let revenue = 0;
  for (const rid of Object.keys(prices)) {
    const p = prices[rid] ?? 0;
    const d = aggregateDemand[rid] ?? 0;
    if (revenueModel === 'quadratic') {
      const c = platformCost[rid] ?? 0;
      revenue += (p - c) * d;
    } else {
      revenue += p * d;
    }
  }
  return revenue;
}
