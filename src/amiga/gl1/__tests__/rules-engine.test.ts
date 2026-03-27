/**
 * TDD tests for the GL-1 governance rules engine.
 *
 * Tests cover:
 * - DistributionPlanSchema validation
 * - ReasoningStepSchema validation
 * - EvaluationResultSchema validation
 * - RulesEngine COMPLIANT evaluation
 * - RulesEngine NON_COMPLIANT evaluation with clause citation
 * - RulesEngine ADVISORY near-boundary detection
 * - Reasoning chain completeness
 */

import { describe, it, expect } from 'vitest';
import {
  DistributionPlanSchema,
  ReasoningStepSchema,
  EvaluationResultSchema,
  RulesEngine,
  VERDICT,
} from '../rules-engine.js';
import type { DistributionPlan } from '../rules-engine.js';
import { parseCharter, COMMONS_CHARTER_YAML } from '../charter.js';

// ============================================================================
// Test fixtures
// ============================================================================

/** A valid compliant distribution plan. */
function makeCompliantPlan(overrides?: Partial<DistributionPlan>): DistributionPlan {
  return {
    plan_id: 'plan-001',
    mission_id: 'mission-2026-02-18-001',
    created_at: '2026-02-18T10:00:00Z',
    total_amount: 1000,
    tiers: {
      tier1_direct: {
        amount: 500,
        recipients: [
          { contributor_id: 'contrib-alice-001', share: 300 },
          { contributor_id: 'contrib-bob-002', share: 200 },
        ],
      },
      tier2_infrastructure: {
        amount: 200,
        allocation_percent: 20,
      },
      tier3_ubd: {
        amount: 300,
        allocation_percent: 30,
        recipient_count: 50,
      },
    },
    ...overrides,
  } as DistributionPlan;
}

// ============================================================================
// DistributionPlanSchema
// ============================================================================

describe('DistributionPlanSchema', () => {
  it('accepts a valid distribution plan', () => {
    const plan = makeCompliantPlan();
    const result = DistributionPlanSchema.safeParse(plan);
    expect(result.success).toBe(true);
  });

  it('rejects plan with negative total_amount', () => {
    const plan = makeCompliantPlan({ total_amount: -100 });
    // Fix tier amounts to match negative total -- still should fail on positive check
    const result = DistributionPlanSchema.safeParse(plan);
    expect(result.success).toBe(false);
  });

  it('rejects plan with missing tier3_ubd', () => {
    const plan = makeCompliantPlan();
    const badPlan = {
      ...plan,
      tiers: {
        tier1_direct: plan.tiers.tier1_direct,
        tier2_infrastructure: plan.tiers.tier2_infrastructure,
        // tier3_ubd missing
      },
    };
    const result = DistributionPlanSchema.safeParse(badPlan);
    expect(result.success).toBe(false);
  });

  it('rejects plan where tier amounts do not sum to total_amount', () => {
    const plan = makeCompliantPlan();
    const badPlan = {
      ...plan,
      total_amount: 9999, // does not match tier sum of 1000
    };
    const result = DistributionPlanSchema.safeParse(badPlan);
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// ReasoningStepSchema
// ============================================================================

describe('ReasoningStepSchema', () => {
  it('accepts a valid reasoning step', () => {
    const step = {
      clause_id: 'clause-001',
      clause_title: 'Universal Basic Dividend',
      check: 'UBD tier amount > 0',
      result: 'pass' as const,
      detail: 'UBD tier allocates 300 to 50 recipients, satisfying the UBD inclusion requirement.',
    };
    const result = ReasoningStepSchema.safeParse(step);
    expect(result.success).toBe(true);
  });

  it('rejects step with empty check', () => {
    const step = {
      clause_id: 'clause-001',
      clause_title: 'Universal Basic Dividend',
      check: '',
      result: 'pass' as const,
      detail: 'UBD tier allocates 300 to 50 recipients.',
    };
    const result = ReasoningStepSchema.safeParse(step);
    expect(result.success).toBe(false);
  });

  it('rejects step with empty detail', () => {
    const step = {
      clause_id: 'clause-001',
      clause_title: 'Universal Basic Dividend',
      check: 'Check UBD',
      result: 'pass' as const,
      detail: 'Too sh',  // < 10 chars
    };
    const result = ReasoningStepSchema.safeParse(step);
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// EvaluationResultSchema
// ============================================================================

describe('EvaluationResultSchema', () => {
  it('accepts a valid evaluation result', () => {
    const evalResult = {
      plan_id: 'plan-001',
      verdict: 'COMPLIANT',
      reasoning: [
        {
          clause_id: 'clause-001',
          clause_title: 'Universal Basic Dividend',
          check: 'UBD inclusion check',
          result: 'pass',
          detail: 'UBD tier allocates 300 to 50 recipients.',
        },
      ],
      cited_clauses: [],
      evaluated_at: '2026-02-18T10:00:00Z',
      charter_version: '1.0.0',
    };
    const result = EvaluationResultSchema.safeParse(evalResult);
    expect(result.success).toBe(true);
  });

  it('rejects result with empty reasoning array', () => {
    const evalResult = {
      plan_id: 'plan-001',
      verdict: 'COMPLIANT',
      reasoning: [],
      cited_clauses: [],
      evaluated_at: '2026-02-18T10:00:00Z',
      charter_version: '1.0.0',
    };
    const result = EvaluationResultSchema.safeParse(evalResult);
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// RulesEngine -- COMPLIANT plans
// ============================================================================

describe('RulesEngine -- COMPLIANT plans', () => {
  const charter = parseCharter(COMMONS_CHARTER_YAML);
  const engine = new RulesEngine(charter);

  it('returns COMPLIANT verdict for a valid plan', () => {
    const plan = makeCompliantPlan();
    const result = engine.evaluate(plan);
    expect(result.verdict).toBe(VERDICT.COMPLIANT);
  });

  it('includes reasoning steps for each constitutional constraint', () => {
    const plan = makeCompliantPlan();
    const result = engine.evaluate(plan);
    expect(result.reasoning.length).toBeGreaterThanOrEqual(4);
  });

  it('all reasoning steps pass for a compliant plan', () => {
    const plan = makeCompliantPlan();
    const result = engine.evaluate(plan);
    const constitutional = result.reasoning.filter(
      (step) => step.result === 'pass',
    );
    expect(constitutional.length).toBeGreaterThanOrEqual(4);
  });

  it('cited_clauses is empty for a compliant plan', () => {
    const plan = makeCompliantPlan();
    const result = engine.evaluate(plan);
    expect(result.cited_clauses).toEqual([]);
  });
});

// ============================================================================
// RulesEngine -- NON_COMPLIANT plans
// ============================================================================

describe('RulesEngine -- NON_COMPLIANT plans', () => {
  const charter = parseCharter(COMMONS_CHARTER_YAML);
  const engine = new RulesEngine(charter);

  it('returns NON_COMPLIANT when UBD amount and percent are zero', () => {
    const plan = makeCompliantPlan({
      total_amount: 1000,
      tiers: {
        tier1_direct: {
          amount: 800,
          recipients: [
            { contributor_id: 'contrib-alice-001', share: 800 },
          ],
        },
        tier2_infrastructure: {
          amount: 200,
          allocation_percent: 20,
        },
        tier3_ubd: {
          amount: 0,
          allocation_percent: 0,
          recipient_count: 0,
        },
      },
    });
    const result = engine.evaluate(plan);
    expect(result.verdict).toBe(VERDICT.NON_COMPLIANT);
  });

  it('cites the UBD inclusion clause when UBD is zero', () => {
    const plan = makeCompliantPlan({
      total_amount: 1000,
      tiers: {
        tier1_direct: {
          amount: 800,
          recipients: [
            { contributor_id: 'contrib-alice-001', share: 800 },
          ],
        },
        tier2_infrastructure: {
          amount: 200,
          allocation_percent: 20,
        },
        tier3_ubd: {
          amount: 0,
          allocation_percent: 0,
          recipient_count: 0,
        },
      },
    });
    const result = engine.evaluate(plan);
    expect(result.cited_clauses.length).toBeGreaterThan(0);
    // The cited clause should reference clause-001 (UBD clause)
    expect(result.cited_clauses).toContain('clause-001');
  });

  it('returns NON_COMPLIANT when UBD recipient count is zero', () => {
    const plan = makeCompliantPlan({
      total_amount: 1000,
      tiers: {
        tier1_direct: {
          amount: 500,
          recipients: [
            { contributor_id: 'contrib-alice-001', share: 500 },
          ],
        },
        tier2_infrastructure: {
          amount: 200,
          allocation_percent: 20,
        },
        tier3_ubd: {
          amount: 300,
          allocation_percent: 30,
          recipient_count: 0,
        },
      },
    });
    const result = engine.evaluate(plan);
    expect(result.verdict).toBe(VERDICT.NON_COMPLIANT);
  });

  it('reasoning chain includes a fail step with detail', () => {
    const plan = makeCompliantPlan({
      total_amount: 1000,
      tiers: {
        tier1_direct: {
          amount: 800,
          recipients: [
            { contributor_id: 'contrib-alice-001', share: 800 },
          ],
        },
        tier2_infrastructure: {
          amount: 200,
          allocation_percent: 20,
        },
        tier3_ubd: {
          amount: 0,
          allocation_percent: 0,
          recipient_count: 0,
        },
      },
    });
    const result = engine.evaluate(plan);
    const failSteps = result.reasoning.filter((s) => s.result === 'fail');
    expect(failSteps.length).toBeGreaterThan(0);
    expect(failSteps[0].detail.length).toBeGreaterThanOrEqual(10);
  });
});

// ============================================================================
// RulesEngine -- ADVISORY plans
// ============================================================================

describe('RulesEngine -- ADVISORY plans', () => {
  const charter = parseCharter(COMMONS_CHARTER_YAML);
  const engine = new RulesEngine(charter);

  it('returns ADVISORY when UBD allocation is very small but nonzero', () => {
    const plan = makeCompliantPlan({
      total_amount: 1000,
      tiers: {
        tier1_direct: {
          amount: 780,
          recipients: [
            { contributor_id: 'contrib-alice-001', share: 400 },
            { contributor_id: 'contrib-bob-002', share: 380 },
          ],
        },
        tier2_infrastructure: {
          amount: 200,
          allocation_percent: 20,
        },
        tier3_ubd: {
          amount: 20,
          allocation_percent: 2,
          recipient_count: 5,
        },
      },
    });
    const result = engine.evaluate(plan);
    expect(result.verdict).toBe(VERDICT.ADVISORY);
  });

  it('returns ADVISORY when single recipient has > 80% of tier1', () => {
    const plan = makeCompliantPlan({
      total_amount: 1000,
      tiers: {
        tier1_direct: {
          amount: 500,
          recipients: [
            { contributor_id: 'contrib-alice-001', share: 450 },  // 90% of tier1
            { contributor_id: 'contrib-bob-002', share: 50 },
          ],
        },
        tier2_infrastructure: {
          amount: 200,
          allocation_percent: 20,
        },
        tier3_ubd: {
          amount: 300,
          allocation_percent: 30,
          recipient_count: 50,
        },
      },
    });
    const result = engine.evaluate(plan);
    expect(result.verdict).toBe(VERDICT.ADVISORY);
  });

  it('advisory results have cited_clauses referencing relevant clauses', () => {
    const plan = makeCompliantPlan({
      total_amount: 1000,
      tiers: {
        tier1_direct: {
          amount: 780,
          recipients: [
            { contributor_id: 'contrib-alice-001', share: 400 },
            { contributor_id: 'contrib-bob-002', share: 380 },
          ],
        },
        tier2_infrastructure: {
          amount: 200,
          allocation_percent: 20,
        },
        tier3_ubd: {
          amount: 20,
          allocation_percent: 2,
          recipient_count: 5,
        },
      },
    });
    const result = engine.evaluate(plan);
    expect(result.cited_clauses.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// RulesEngine -- reasoning chain completeness
// ============================================================================

describe('RulesEngine -- reasoning chain completeness', () => {
  const charter = parseCharter(COMMONS_CHARTER_YAML);
  const engine = new RulesEngine(charter);

  it('every constitutional constraint produces at least one reasoning step', () => {
    const plan = makeCompliantPlan();
    const result = engine.evaluate(plan);
    // 4 constitutional constraints each produce a step
    const clauseIdsInReasoning = result.reasoning.map((s) => s.clause_id);
    expect(clauseIdsInReasoning).toContain('clause-001');
    expect(clauseIdsInReasoning).toContain('clause-002');
    expect(clauseIdsInReasoning).toContain('clause-003');
    expect(clauseIdsInReasoning).toContain('clause-004');
  });

  it('each reasoning step references a real clause_id from the charter', () => {
    const plan = makeCompliantPlan();
    const result = engine.evaluate(plan);
    const charterClauseIds = charter.clauses.map((c: { id: string }) => c.id);
    for (const step of result.reasoning) {
      expect(charterClauseIds).toContain(step.clause_id);
    }
  });

  it('detail field in each step is substantive (min 10 chars)', () => {
    const plan = makeCompliantPlan();
    const result = engine.evaluate(plan);
    for (const step of result.reasoning) {
      expect(step.detail.length).toBeGreaterThanOrEqual(10);
    }
  });
});
