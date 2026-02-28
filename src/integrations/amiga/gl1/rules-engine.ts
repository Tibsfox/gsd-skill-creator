/**
 * GL-1 governance rules engine.
 *
 * Evaluates distribution plans against the commons charter,
 * returning COMPLIANT, NON_COMPLIANT (citing specific clause),
 * or ADVISORY (near boundary) verdicts with full reasoning chains.
 *
 * Enforces the 4 constitutional constraints (GOVR-03):
 * 1. UBD inclusion regardless of contribution size
 * 2. No retroactive dividend reduction
 * 3. Commons cannot be privatized or enclosed
 * 4. Governance body dissolvable by supermajority
 */

import { z } from 'zod';
import { TimestampSchema, MissionIDSchema } from '../types.js';
import type { Charter, ConstitutionalConstraint, CharterClause } from './charter.js';
import { CONSTITUTIONAL_CONSTRAINT_IDS } from './charter.js';

// ============================================================================
// VERDICT
// ============================================================================

/** Evaluation verdict constants. */
export const VERDICT = {
  COMPLIANT: 'COMPLIANT',
  NON_COMPLIANT: 'NON_COMPLIANT',
  ADVISORY: 'ADVISORY',
} as const;

// ============================================================================
// ReasoningStepSchema
// ============================================================================

/**
 * Validates individual reasoning steps in an evaluation chain.
 *
 * Each step documents a single check against a charter clause,
 * with a pass/fail/advisory result and substantive detail.
 */
export const ReasoningStepSchema = z.object({
  clause_id: z.string().min(1),
  clause_title: z.string().min(1),
  check: z.string().min(1),
  result: z.enum(['pass', 'fail', 'advisory']),
  detail: z.string().min(10),
}).passthrough();

export type ReasoningStep = z.infer<typeof ReasoningStepSchema>;

// ============================================================================
// DistributionPlanSchema
// ============================================================================

/**
 * Validates distribution plan input for rules engine evaluation.
 *
 * Enforces:
 * - Positive total_amount
 * - All 3 tiers present (UBD is constitutionally required)
 * - Tier amounts sum to total_amount within 0.01 tolerance
 */
export const DistributionPlanSchema = z.object({
  plan_id: z.string().min(1),
  mission_id: MissionIDSchema,
  created_at: TimestampSchema,
  total_amount: z.number().positive(),
  tiers: z.object({
    tier1_direct: z.object({
      amount: z.number().min(0),
      recipients: z.array(z.object({
        contributor_id: z.string(),
        share: z.number().positive(),
      })),
    }),
    tier2_infrastructure: z.object({
      amount: z.number().min(0),
      allocation_percent: z.number().min(0).max(100),
    }),
    tier3_ubd: z.object({
      amount: z.number().min(0),
      allocation_percent: z.number().min(0).max(100),
      recipient_count: z.number().int().min(0),
    }),
  }),
}).passthrough().refine(
  (plan) => {
    const sum =
      plan.tiers.tier1_direct.amount +
      plan.tiers.tier2_infrastructure.amount +
      plan.tiers.tier3_ubd.amount;
    return Math.abs(sum - plan.total_amount) <= 0.01;
  },
  { message: 'Tier amounts must sum to total_amount within 0.01 tolerance' },
);

export type DistributionPlan = z.infer<typeof DistributionPlanSchema>;

// ============================================================================
// EvaluationResultSchema
// ============================================================================

/**
 * Validates the full evaluation result from the rules engine.
 *
 * Includes plan ID, verdict, reasoning chain (min 1 step),
 * cited clauses, evaluation timestamp, and charter version.
 */
export const EvaluationResultSchema = z.object({
  plan_id: z.string(),
  verdict: z.enum(['COMPLIANT', 'NON_COMPLIANT', 'ADVISORY']),
  reasoning: z.array(ReasoningStepSchema).min(1),
  cited_clauses: z.array(z.string()),
  evaluated_at: TimestampSchema,
  charter_version: z.string(),
}).passthrough();

export type EvaluationResult = z.infer<typeof EvaluationResultSchema>;

// ============================================================================
// RulesEngine
// ============================================================================

/**
 * Evaluates distribution plans against the commons charter.
 *
 * For each evaluation, the engine:
 * 1. Validates the plan structure
 * 2. Checks each constitutional constraint
 * 3. Runs additional checks (concentration risk)
 * 4. Determines verdict from reasoning chain
 * 5. Returns full evaluation with reasoning and clause citations
 */
export class RulesEngine {
  private readonly charter: Charter;

  constructor(charter: Charter) {
    this.charter = charter;
  }

  /**
   * Evaluates a distribution plan against the charter.
   *
   * @param plan - Distribution plan to evaluate
   * @returns Evaluation result with verdict, reasoning chain, and clause citations
   * @throws If plan fails structural validation
   */
  evaluate(plan: DistributionPlan): EvaluationResult {
    // Validate plan structure
    const validated = DistributionPlanSchema.parse(plan);

    const reasoning: ReasoningStep[] = [];
    const citedClauses: string[] = [];

    // Check each constitutional constraint
    for (const constraint of this.charter.constitutional_constraints) {
      const clause = this.findClause(constraint.clause_ref);
      const step = this.checkConstraint(constraint, clause, validated);
      reasoning.push(step);

      if (step.result !== 'pass') {
        citedClauses.push(constraint.clause_ref);
      }
    }

    // Additional checks: concentration risk
    this.checkConcentrationRisk(validated, reasoning, citedClauses);

    // Determine final verdict
    const hasFailure = reasoning.some((s) => s.result === 'fail');
    const hasAdvisory = reasoning.some((s) => s.result === 'advisory');

    let verdict: 'COMPLIANT' | 'NON_COMPLIANT' | 'ADVISORY';
    if (hasFailure) {
      verdict = VERDICT.NON_COMPLIANT;
    } else if (hasAdvisory) {
      verdict = VERDICT.ADVISORY;
    } else {
      verdict = VERDICT.COMPLIANT;
    }

    // Deduplicate cited clauses
    const uniqueCited = [...new Set(citedClauses)];

    return {
      plan_id: validated.plan_id,
      verdict,
      reasoning,
      cited_clauses: uniqueCited,
      evaluated_at: new Date().toISOString(),
      charter_version: this.charter.version,
    };
  }

  /**
   * Finds a charter clause by ID.
   */
  private findClause(clauseId: string): CharterClause {
    const clause = this.charter.clauses.find(
      (c: CharterClause) => c.id === clauseId,
    );
    if (!clause) {
      throw new Error(`Charter clause not found: ${clauseId}`);
    }
    return clause;
  }

  /**
   * Checks a single constitutional constraint against the plan.
   */
  private checkConstraint(
    constraint: ConstitutionalConstraint,
    clause: CharterClause,
    plan: DistributionPlan,
  ): ReasoningStep {
    switch (constraint.id) {
      case 'ubd-inclusion':
        return this.checkUbdInclusion(clause, plan);
      case 'no-retroactive-reduction':
        return this.checkNoRetroactiveReduction(clause, plan);
      case 'no-privatization':
        return this.checkNoPrivatization(clause, plan);
      case 'supermajority-dissolution':
        return this.checkSupermajorityDissolution(clause);
      default:
        return {
          clause_id: clause.id,
          clause_title: clause.title,
          check: `Unknown constraint: ${constraint.id}`,
          result: 'advisory',
          detail: `Unrecognized constitutional constraint "${constraint.id}" -- cannot evaluate automatically.`,
        };
    }
  }

  /**
   * Checks UBD inclusion constraint (clause-001).
   *
   * - UBD amount > 0 AND recipient_count > 0: PASS
   * - Both zero: FAIL
   * - Amount > 0 but allocation_percent < 5: ADVISORY (near boundary)
   * - recipient_count === 0 but amount > 0: FAIL
   */
  private checkUbdInclusion(clause: CharterClause, plan: DistributionPlan): ReasoningStep {
    const ubd = plan.tiers.tier3_ubd;

    if (ubd.amount === 0 && ubd.allocation_percent === 0) {
      return {
        clause_id: clause.id,
        clause_title: clause.title,
        check: 'UBD tier amount > 0 and allocation_percent > 0',
        result: 'fail',
        detail: `UBD tier has zero amount and zero allocation percent. The Universal Basic Dividend clause requires all contributors to receive a base dividend allocation.`,
      };
    }

    if (ubd.recipient_count === 0) {
      return {
        clause_id: clause.id,
        clause_title: clause.title,
        check: 'UBD tier recipient_count > 0',
        result: 'fail',
        detail: `UBD tier has amount ${ubd.amount} but zero recipients. Funds allocated to UBD must be distributed to at least one recipient.`,
      };
    }

    if (ubd.amount > 0 && ubd.allocation_percent < 5) {
      return {
        clause_id: clause.id,
        clause_title: clause.title,
        check: 'UBD allocation_percent >= 5 (near-boundary check)',
        result: 'advisory',
        detail: `UBD allocation is ${ubd.allocation_percent}% which is below the 5% advisory threshold. While technically compliant, this is near the minimum boundary for meaningful UBD distribution.`,
      };
    }

    return {
      clause_id: clause.id,
      clause_title: clause.title,
      check: 'UBD tier amount > 0, recipient_count > 0, allocation_percent >= 5',
      result: 'pass',
      detail: `UBD tier allocates ${ubd.amount} to ${ubd.recipient_count} recipients (${ubd.allocation_percent}%), satisfying the Universal Basic Dividend inclusion requirement.`,
    };
  }

  /**
   * Checks no-retroactive-reduction constraint (clause-002).
   *
   * Structural check: plan must have created_at and total_amount > 0.
   * Full retroactive comparison requires ledger access (Phase 215 scope).
   */
  private checkNoRetroactiveReduction(clause: CharterClause, plan: DistributionPlan): ReasoningStep {
    return {
      clause_id: clause.id,
      clause_title: clause.title,
      check: 'Structural integrity: plan has valid created_at and positive total_amount',
      result: 'pass',
      detail: `Plan created at ${plan.created_at} with total amount ${plan.total_amount}. Structural check passed. Full retroactive reduction comparison requires ledger access (Phase 215 integration scope).`,
    };
  }

  /**
   * Checks no-privatization constraint (clause-003).
   *
   * Infrastructure commons must receive a share (allocation_percent > 0).
   * Advisory if < 10%.
   */
  private checkNoPrivatization(clause: CharterClause, plan: DistributionPlan): ReasoningStep {
    const infra = plan.tiers.tier2_infrastructure;

    if (infra.allocation_percent === 0) {
      return {
        clause_id: clause.id,
        clause_title: clause.title,
        check: 'Infrastructure commons allocation_percent > 0',
        result: 'fail',
        detail: `Infrastructure tier has 0% allocation. The commons cannot be privatized -- infrastructure commons must receive a share of the distribution to maintain shared resources.`,
      };
    }

    if (infra.allocation_percent < 10) {
      return {
        clause_id: clause.id,
        clause_title: clause.title,
        check: 'Infrastructure commons allocation_percent >= 10 (near-boundary check)',
        result: 'advisory',
        detail: `Infrastructure allocation is ${infra.allocation_percent}% which is below the 10% advisory threshold. While technically compliant, very low infrastructure funding may risk commons sustainability.`,
      };
    }

    return {
      clause_id: clause.id,
      clause_title: clause.title,
      check: 'Infrastructure commons allocation_percent > 0 and >= 10',
      result: 'pass',
      detail: `Infrastructure tier allocates ${infra.amount} (${infra.allocation_percent}%), ensuring the commons receives a meaningful share and cannot be privatized or enclosed.`,
    };
  }

  /**
   * Checks supermajority-dissolution constraint (clause-004).
   *
   * Structural check: the charter contains this constraint (it always does
   * since we loaded it). Pass with reasoning noting governance structure intact.
   */
  private checkSupermajorityDissolution(clause: CharterClause): ReasoningStep {
    return {
      clause_id: clause.id,
      clause_title: clause.title,
      check: 'Charter contains supermajority dissolution constraint',
      result: 'pass',
      detail: `The charter includes the supermajority dissolution constraint, ensuring the governance body can be dissolved by a two-thirds vote. Governance structure is intact and accountability mechanisms are in place.`,
    };
  }

  /**
   * Checks for concentration risk in tier1 direct distribution.
   *
   * Advisory if any single recipient has > 80% of tier1 amount.
   */
  private checkConcentrationRisk(
    plan: DistributionPlan,
    reasoning: ReasoningStep[],
    citedClauses: string[],
  ): void {
    const tier1 = plan.tiers.tier1_direct;
    if (tier1.amount === 0 || tier1.recipients.length === 0) return;

    for (const recipient of tier1.recipients) {
      const sharePercent = (recipient.share / tier1.amount) * 100;
      if (sharePercent > 80) {
        reasoning.push({
          clause_id: 'clause-005',
          clause_title: 'Contribution Recognition',
          check: 'No single recipient has > 80% of tier1 direct distribution',
          result: 'advisory',
          detail: `Recipient ${recipient.contributor_id} holds ${sharePercent.toFixed(1)}% of tier1 direct allocation (${recipient.share} of ${tier1.amount}). This concentration may indicate insufficient recognition diversity.`,
        });
        citedClauses.push('clause-005');
        return; // Only flag once
      }
    }
  }
}
