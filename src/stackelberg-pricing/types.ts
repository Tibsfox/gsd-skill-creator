/**
 * Stackelberg Drainability Pricing Reference — types.
 *
 * Multi-tenant shared-infrastructure pricing reference per the Stackelberg
 * Game with Drainability Guardrails framework (arXiv:2604.16802, Yan et al.,
 * CDC 2026).
 *
 * REFERENCE IMPLEMENTATION ONLY. No commercial deployment in this milestone.
 * Public surfaces use generic "multi-tenant pricing" / "shared infrastructure
 * pricing" language throughout.
 *
 * @module stackelberg-pricing/types
 */

// ============================================================================
// Resource identifiers
// ============================================================================

/** Identifier for a shared resource pool (e.g. "compute", "bandwidth", "storage"). */
export type ResourceId = string;

/** Identifier for a tenant. */
export type TenantId = string;

// ============================================================================
// Utility function kinds
// ============================================================================

/**
 * Discriminated union of supported tenant utility-function models.
 *
 * - **quadratic**   — U(x) = a·x − (b/2)·x²   (concave, closed-form best-response)
 * - **ces**         — CES (constant-elasticity-of-substitution): U(x) = A · (Σ αᵢ xᵢ^ρ)^(1/ρ)
 * - **cobb-douglas**— U(x) = A · Πᵢ xᵢ^αᵢ
 */
export type UtilityKind = 'quadratic' | 'ces' | 'cobb-douglas';

/** Quadratic utility parameters for a single-resource model. */
export interface QuadraticUtilityParams {
  readonly kind: 'quadratic';
  /**
   * Linear coefficient — marginal benefit at zero consumption.
   * Must be > 0.
   */
  readonly a: number;
  /**
   * Quadratic cost coefficient — controls diminishing returns.
   * Must be > 0.
   */
  readonly b: number;
}

/** CES (Constant Elasticity of Substitution) utility parameters. */
export interface CESUtilityParams {
  readonly kind: 'ces';
  /** Scale factor A > 0. */
  readonly A: number;
  /**
   * Per-resource share weights αᵢ > 0 (indexed by resourceId).
   * Need not sum to 1 — the model normalises internally if desired.
   */
  readonly alpha: Readonly<Record<ResourceId, number>>;
  /**
   * Substitution parameter ρ ≠ 0; ρ → 0 gives Cobb-Douglas,
   * ρ = 1 gives linear, ρ → −∞ gives Leontief.
   * Must satisfy ρ < 1 for concavity.
   */
  readonly rho: number;
}

/** Cobb-Douglas utility parameters. */
export interface CobbDouglasUtilityParams {
  readonly kind: 'cobb-douglas';
  /** Scale factor A > 0. */
  readonly A: number;
  /** Per-resource exponents αᵢ > 0 (indexed by resourceId). Sum should be ≤ 1 for concavity. */
  readonly alpha: Readonly<Record<ResourceId, number>>;
}

/** Union of all utility parameter shapes. */
export type UtilityFunction =
  | QuadraticUtilityParams
  | CESUtilityParams
  | CobbDouglasUtilityParams;

// ============================================================================
// Tenant specification
// ============================================================================

/**
 * A tenant in the multi-tenant infrastructure model.
 *
 * Each tenant has a utility function over resource consumption and a per-
 * resource budget / valuation that the solver uses to compute the best-
 * response demand function.
 */
export interface Tenant {
  readonly id: TenantId;
  /** Utility model for this tenant. */
  readonly utility: UtilityFunction;
  /**
   * Maximum resource consumption this tenant is willing to pay for
   * (per-resource, indexed by resourceId). Acts as a capacity cap in the
   * best-response optimisation.
   */
  readonly maxConsumption: Readonly<Record<ResourceId, number>>;
}

// ============================================================================
// Platform / resource specification
// ============================================================================

/**
 * Specification for a single shared resource pool.
 */
export interface ResourcePool {
  readonly id: ResourceId;
  /** Total available capacity C > 0. */
  readonly capacity: number;
  /**
   * Guardrail floor δ ∈ (0, C).
   * The drainability constraint requires Σₖ dₖ(p) ≤ C − δ.
   * Set to 0 to disable the guardrail for this resource (unconstrained).
   */
  readonly guardrailFloor: number;
  /** Minimum price the leader will quote for this resource. Defaults to 0. */
  readonly minPrice?: number;
  /** Maximum price the leader will quote for this resource. Defaults to Infinity. */
  readonly maxPrice?: number;
}

// ============================================================================
// Stackelberg game specification
// ============================================================================

/**
 * A Stackelberg game instance for multi-tenant shared-infrastructure pricing.
 *
 * The leader (platform operator) sets a price vector p over resources.
 * Each follower (tenant) responds by choosing consumption levels that
 * maximise their utility net of cost.
 *
 * The leader's objective is to maximise total revenue subject to
 * drainability-guardrail feasibility across all resources.
 */
export interface StackelbergGame {
  /** Shared resource pools in this game instance. */
  readonly resources: readonly ResourcePool[];
  /** Tenants (followers) in this game instance. */
  readonly tenants: readonly Tenant[];
  /**
   * Leader revenue model.
   * - "linear"    — revenue = Σᵣ pᵣ · Σₖ dₖᵣ(p)   (default)
   * - "quadratic" — revenue = Σᵣ (pᵣ − cᵣ) · Σₖ dₖᵣ(p)  (margin-based)
   */
  readonly revenueModel?: 'linear' | 'quadratic';
  /**
   * Per-resource cost to the platform (used only when revenueModel="quadratic").
   * Indexed by resourceId.
   */
  readonly platformCost?: Readonly<Record<ResourceId, number>>;
  /**
   * Grid-search resolution for the bilevel solver.
   * Higher values give finer price grids but cost more compute.
   * Defaults to 20 steps per resource.
   */
  readonly gridSteps?: number;
}

// ============================================================================
// Tenant usage / demand
// ============================================================================

/**
 * A tenant's realised resource consumption at a given price vector.
 * Returned by the best-response solver.
 */
export interface TenantUsage {
  readonly tenantId: TenantId;
  /** Per-resource consumption (indexed by resourceId). */
  readonly consumption: Readonly<Record<ResourceId, number>>;
  /** Utility value achieved at this consumption. */
  readonly utilityValue: number;
  /** Total cost paid: Σᵣ pᵣ · xᵣ. */
  readonly totalCost: number;
}

// ============================================================================
// Pricing solution
// ============================================================================

/**
 * The solution to a Stackelberg game instance.
 *
 * Contains the equilibrium price vector, all tenants' best-response
 * consumption, aggregated resource demand, and drainability status per
 * resource.
 */
export interface PricingSolution {
  /** Equilibrium price vector (indexed by resourceId). */
  readonly prices: Readonly<Record<ResourceId, number>>;
  /** Per-tenant consumption at equilibrium. */
  readonly tenantUsages: readonly TenantUsage[];
  /** Aggregate demand per resource at equilibrium: Σₖ dₖᵣ(p). */
  readonly aggregateDemand: Readonly<Record<ResourceId, number>>;
  /** Platform revenue at equilibrium. */
  readonly revenue: number;
  /**
   * True iff the drainability-guardrail constraint is satisfied for every
   * resource: Σₖ dₖᵣ(p) ≤ Cᵣ − δᵣ for all r.
   */
  readonly guardrailFeasible: boolean;
  /**
   * Per-resource drainability slack: (Cᵣ − δᵣ) − Σₖ dₖᵣ(p).
   * Positive means capacity remains above floor; negative means violated.
   */
  readonly guardrailSlack: Readonly<Record<ResourceId, number>>;
  /**
   * Number of price-grid iterations explored by the bilevel solver.
   * Informational only.
   */
  readonly solverIterations: number;
}

// ============================================================================
// Drainability guardrail types
// ============================================================================

/**
 * A drainability guardrail specification for a resource pool.
 * Used by `checkDrainability` independently of the full Stackelberg solver.
 */
export interface DrainabilityGuardrail {
  readonly resourceId: ResourceId;
  /** Total capacity C of the resource pool. */
  readonly capacity: number;
  /**
   * Safety floor δ — the minimum allowable free capacity after all tenants
   * have responded.
   */
  readonly safetyFloor: number;
}

/**
 * Verdict returned by `checkDrainability`.
 */
export interface GuardrailVerdict {
  /** ALLOW if all guardrails pass; BLOCK if any is violated. */
  readonly verdict: 'ALLOW' | 'BLOCK';
  /** Per-resource details. */
  readonly details: readonly GuardrailDetail[];
  /** Total number of resources checked. */
  readonly resourcesChecked: number;
  /** Number of resources that failed their guardrail. */
  readonly resourcesFailed: number;
}

/**
 * Per-resource guardrail check detail.
 */
export interface GuardrailDetail {
  readonly resourceId: ResourceId;
  readonly totalConsumption: number;
  readonly capacity: number;
  readonly safetyFloor: number;
  /** Capacity remaining after consumption: C − Σₖ xₖᵣ. */
  readonly remainingCapacity: number;
  /** Slack relative to floor: (C − δ) − Σₖ xₖᵣ.  Positive = OK. */
  readonly slack: number;
  /** ALLOW if slack ≥ 0; BLOCK otherwise. */
  readonly status: 'ALLOW' | 'BLOCK';
}
