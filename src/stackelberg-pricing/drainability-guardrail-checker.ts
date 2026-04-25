/**
 * Stackelberg Drainability Pricing Reference — drainability guardrail checker.
 *
 * Encodes drainability guardrails as defined in Yan et al. arXiv:2604.16802
 * (CDC 2026): for each shared resource r, the aggregate tenant consumption
 * must not reduce available capacity below a safety floor δᵣ > 0.
 *
 * Formally, the guardrail constraint is:
 *
 *   Σₖ dₖᵣ(p) ≤ Cᵣ − δᵣ   for all resources r
 *
 * where dₖᵣ(p) is tenant k's demand for resource r at price vector p,
 * Cᵣ is total capacity, and δᵣ is the safety floor.
 *
 * This module is used both standalone (via `checkDrainability`) and
 * internally by the Stackelberg solver to verify feasibility of price
 * candidates.
 *
 * REFERENCE IMPLEMENTATION ONLY. No commercial deployment in this milestone.
 *
 * @module stackelberg-pricing/drainability-guardrail-checker
 */

import type {
  DrainabilityGuardrail,
  GuardrailDetail,
  GuardrailVerdict,
  ResourceId,
  TenantUsage,
} from './types.js';

/**
 * Check whether tenant usage satisfies all drainability guardrails.
 *
 * For each guardrail (resource), computes:
 *   - Total consumption: Σₖ xₖᵣ
 *   - Remaining capacity: Cᵣ − Σₖ xₖᵣ
 *   - Slack: (Cᵣ − δᵣ) − Σₖ xₖᵣ
 *   - Status: ALLOW if slack ≥ 0; BLOCK otherwise
 *
 * The overall verdict is ALLOW iff ALL resources pass; BLOCK if any fails.
 *
 * @param usages     Tenants' realised resource consumption.
 * @param guardrails Per-resource drainability guardrail specifications.
 */
export function checkDrainability(
  usages: readonly TenantUsage[],
  guardrails: readonly DrainabilityGuardrail[],
): GuardrailVerdict {
  const details: GuardrailDetail[] = [];
  let resourcesFailed = 0;

  for (const guardrail of guardrails) {
    const rid = guardrail.resourceId;
    // Sum consumption across all tenants for this resource.
    let totalConsumption = 0;
    for (const usage of usages) {
      totalConsumption += usage.consumption[rid] ?? 0;
    }

    const remainingCapacity = guardrail.capacity - totalConsumption;
    const slack = guardrail.capacity - guardrail.safetyFloor - totalConsumption;
    const status: 'ALLOW' | 'BLOCK' = slack >= 0 ? 'ALLOW' : 'BLOCK';

    if (status === 'BLOCK') resourcesFailed++;

    details.push({
      resourceId: rid,
      totalConsumption,
      capacity: guardrail.capacity,
      safetyFloor: guardrail.safetyFloor,
      remainingCapacity,
      slack,
      status,
    });
  }

  const verdict: 'ALLOW' | 'BLOCK' = resourcesFailed === 0 ? 'ALLOW' : 'BLOCK';

  return {
    verdict,
    details,
    resourcesChecked: guardrails.length,
    resourcesFailed,
  };
}

/**
 * Check guardrail feasibility using an aggregate-demand map directly
 * (without full TenantUsage objects).  Used internally by the solver.
 *
 * @param aggregateDemand  Σₖ dₖᵣ(p) per resource.
 * @param resources        Resource pool specs (capacity + guardrailFloor).
 */
export function checkGuardrailFeasibility(
  aggregateDemand: Readonly<Record<ResourceId, number>>,
  resources: readonly { id: ResourceId; capacity: number; guardrailFloor: number }[],
): boolean {
  for (const res of resources) {
    const demand = aggregateDemand[res.id] ?? 0;
    const slack = res.capacity - res.guardrailFloor - demand;
    if (slack < 0) return false;
  }
  return true;
}

/**
 * Compute per-resource guardrail slack values.
 *
 * @param aggregateDemand  Σₖ dₖᵣ(p) per resource.
 * @param resources        Resource pool specs.
 */
export function computeGuardrailSlack(
  aggregateDemand: Readonly<Record<ResourceId, number>>,
  resources: readonly { id: ResourceId; capacity: number; guardrailFloor: number }[],
): Record<ResourceId, number> {
  const slack: Record<ResourceId, number> = {};
  for (const res of resources) {
    const demand = aggregateDemand[res.id] ?? 0;
    slack[res.id] = res.capacity - res.guardrailFloor - demand;
  }
  return slack;
}
