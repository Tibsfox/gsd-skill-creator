/**
 * Integration tests for GL-1 barrel exports and AMIGA barrel integration.
 *
 * Verifies all GL-1 public API is accessible from the barrel index,
 * the AMIGA barrel includes GL-1, and cross-module schemas work together.
 *
 * Phase 211: Charter, Weighting Docs, Dispute Record
 * Phase 212: Rules Engine, Decision Log, Policy Query Handler
 */

import { describe, it, expect } from 'vitest';

// GL-1 barrel imports
import {
  // Charter module (Phase 211)
  CharterSchema,
  CharterClauseSchema,
  ConstitutionalConstraintSchema,
  CharterVersionSchema,
  CONSTITUTIONAL_CONSTRAINT_IDS,
  COMMONS_CHARTER_YAML,
  parseCharter,
  ratifyCharter,
  isRatified,
  // Weighting module (Phase 211)
  WeightingParameterSchema,
  WeightingSpecSchema,
  WEIGHTING_SPEC_YAML,
  parseWeightingSpec,
  validateParameterRange,
  // Dispute module (Phase 211)
  GovernanceDisputeSchema,
  createDispute,
  resolveDispute,
  rejectDispute,
  // Rules engine (Phase 212)
  RulesEngine,
  DistributionPlanSchema,
  EvaluationResultSchema,
  ReasoningStepSchema,
  VERDICT,
  // Decision log (Phase 212)
  DecisionLog,
  DecisionEntrySchema,
  // Policy query handler (Phase 212)
  PolicyQueryHandler,
  handleGovernanceQuery,
} from '../index.js';

// AMIGA barrel imports
import {
  CharterSchema as AmigaCharterSchema,
  GovernanceDisputeSchema as AmigaGovernanceDisputeSchema,
  WeightingSpecSchema as AmigaWeightingSpecSchema,
  COMMONS_CHARTER_YAML as AmigaCommonsCharterYaml,
  // Phase 212 AMIGA barrel imports
  RulesEngine as AmigaRulesEngine,
  DecisionLog as AmigaDecisionLog,
  PolicyQueryHandler as AmigaPolicyQueryHandler,
  handleGovernanceQuery as AmigaHandleGovernanceQuery,
  VERDICT as AmigaVERDICT,
} from '../../index.js';

// ICD-04 for cross-module compatibility
import { DisputeRecordPayloadSchema } from '../../icd/icd-04.js';

// ============================================================================
// GL-1 barrel exports
// ============================================================================

describe('GL-1 barrel exports', () => {
  it('exports all charter module public API', () => {
    expect(CharterSchema).toBeDefined();
    expect(CharterClauseSchema).toBeDefined();
    expect(ConstitutionalConstraintSchema).toBeDefined();
    expect(CharterVersionSchema).toBeDefined();
    expect(CONSTITUTIONAL_CONSTRAINT_IDS).toBeDefined();
    expect(COMMONS_CHARTER_YAML).toBeDefined();
    expect(parseCharter).toBeDefined();
    expect(ratifyCharter).toBeDefined();
    expect(isRatified).toBeDefined();
  });

  it('exports all weighting module public API', () => {
    expect(WeightingParameterSchema).toBeDefined();
    expect(WeightingSpecSchema).toBeDefined();
    expect(WEIGHTING_SPEC_YAML).toBeDefined();
    expect(parseWeightingSpec).toBeDefined();
    expect(validateParameterRange).toBeDefined();
  });

  it('exports all dispute module public API', () => {
    expect(GovernanceDisputeSchema).toBeDefined();
    expect(createDispute).toBeDefined();
    expect(resolveDispute).toBeDefined();
    expect(rejectDispute).toBeDefined();
  });

  it('exported functions are callable', () => {
    expect(typeof parseCharter).toBe('function');
    expect(typeof ratifyCharter).toBe('function');
    expect(typeof isRatified).toBe('function');
    expect(typeof parseWeightingSpec).toBe('function');
    expect(typeof validateParameterRange).toBe('function');
    expect(typeof createDispute).toBe('function');
    expect(typeof resolveDispute).toBe('function');
    expect(typeof rejectDispute).toBe('function');
  });
});

// ============================================================================
// AMIGA barrel includes GL-1
// ============================================================================

describe('AMIGA barrel includes GL-1', () => {
  it('CharterSchema importable from AMIGA barrel', () => {
    expect(AmigaCharterSchema).toBeDefined();
    expect(AmigaCharterSchema).toBe(CharterSchema);
  });

  it('GovernanceDisputeSchema importable from AMIGA barrel', () => {
    expect(AmigaGovernanceDisputeSchema).toBeDefined();
    expect(AmigaGovernanceDisputeSchema).toBe(GovernanceDisputeSchema);
  });

  it('WeightingSpecSchema importable from AMIGA barrel', () => {
    expect(AmigaWeightingSpecSchema).toBeDefined();
    expect(AmigaWeightingSpecSchema).toBe(WeightingSpecSchema);
  });

  it('COMMONS_CHARTER_YAML importable from AMIGA barrel', () => {
    expect(AmigaCommonsCharterYaml).toBeDefined();
    expect(AmigaCommonsCharterYaml).toBe(COMMONS_CHARTER_YAML);
  });
});

// ============================================================================
// Cross-module consistency
// ============================================================================

describe('Cross-module consistency', () => {
  it('createDispute produces objects with valid ICD-04 evidence items', () => {
    const evidence = [
      {
        type: 'ledger_entry' as const,
        reference: 'entry-001',
        description: 'Missing contribution record.',
      },
    ];
    const dispute = createDispute('contrib-alice-001', 'Missing entry', evidence);
    // The dispute should contain valid ICD-04 fields
    expect(dispute.raiser).toBe('contrib-alice-001');
    expect(dispute.evidence).toHaveLength(1);
    expect(dispute.status).toBe('open');
    // And the ICD-04 base schema should accept the core fields
    const icd04Result = DisputeRecordPayloadSchema.safeParse({
      raiser: dispute.raiser,
      disputed_item: dispute.disputed_item,
      evidence: dispute.evidence,
      status: dispute.status,
    });
    expect(icd04Result.success).toBe(true);
  });

  it('COMMONS_CHARTER_YAML clauses reference the same constraint IDs', () => {
    const charter = parseCharter(COMMONS_CHARTER_YAML);
    const constraintIds = charter.constitutional_constraints.map((c: { id: string }) => c.id);
    expect(constraintIds.sort()).toEqual([...CONSTITUTIONAL_CONSTRAINT_IDS].sort());
  });

  it('WEIGHTING_SPEC_YAML contains all 3 required parameter types', () => {
    const spec = parseWeightingSpec(WEIGHTING_SPEC_YAML);
    const types = spec.parameters.map((p: { type: string }) => p.type);
    expect(types).toContain('frequency');
    expect(types).toContain('critical_path');
    expect(types).toContain('depth_decay');
  });

  it('GovernanceDisputeSchema accepts objects compatible with ICD-04', () => {
    const dispute = {
      // ICD-04 base fields
      raiser: 'GL-2',
      disputed_item: 'Weight vector mismatch',
      evidence: [
        { type: 'weight_calculation' as const, reference: 'calc-001', description: 'Stale data.' },
      ],
      status: 'open' as const,
      // GL-1 extended fields
      dispute_id: 'dispute-1706000000-abc12345',
      filed_at: '2026-01-15T12:00:00Z',
    };
    const gl1Result = GovernanceDisputeSchema.safeParse(dispute);
    expect(gl1Result.success).toBe(true);

    const icd04Result = DisputeRecordPayloadSchema.safeParse(dispute);
    expect(icd04Result.success).toBe(true);
  });
});

// ============================================================================
// GL-1 barrel -- Phase 212 exports
// ============================================================================

describe('GL-1 barrel -- Phase 212 exports', () => {
  it('exports rules engine public API', () => {
    expect(RulesEngine).toBeDefined();
    expect(DistributionPlanSchema).toBeDefined();
    expect(EvaluationResultSchema).toBeDefined();
    expect(ReasoningStepSchema).toBeDefined();
    expect(VERDICT).toBeDefined();
  });

  it('exports decision log public API', () => {
    expect(DecisionLog).toBeDefined();
    expect(DecisionEntrySchema).toBeDefined();
  });

  it('exports policy query handler public API', () => {
    expect(PolicyQueryHandler).toBeDefined();
    expect(handleGovernanceQuery).toBeDefined();
  });

  it('RulesEngine is constructable', () => {
    expect(typeof RulesEngine).toBe('function');
  });

  it('DecisionLog is constructable', () => {
    expect(typeof DecisionLog).toBe('function');
  });

  it('PolicyQueryHandler is constructable', () => {
    expect(typeof PolicyQueryHandler).toBe('function');
  });

  it('handleGovernanceQuery is callable', () => {
    expect(typeof handleGovernanceQuery).toBe('function');
  });

  it('VERDICT has expected values', () => {
    expect(VERDICT.COMPLIANT).toBe('COMPLIANT');
    expect(VERDICT.NON_COMPLIANT).toBe('NON_COMPLIANT');
    expect(VERDICT.ADVISORY).toBe('ADVISORY');
  });
});

// ============================================================================
// AMIGA barrel includes Phase 212 GL-1 exports
// ============================================================================

describe('AMIGA barrel includes Phase 212 GL-1 exports', () => {
  it('RulesEngine importable from AMIGA barrel', () => {
    expect(AmigaRulesEngine).toBeDefined();
    expect(AmigaRulesEngine).toBe(RulesEngine);
  });

  it('DecisionLog importable from AMIGA barrel', () => {
    expect(AmigaDecisionLog).toBeDefined();
    expect(AmigaDecisionLog).toBe(DecisionLog);
  });

  it('PolicyQueryHandler importable from AMIGA barrel', () => {
    expect(AmigaPolicyQueryHandler).toBeDefined();
    expect(AmigaPolicyQueryHandler).toBe(PolicyQueryHandler);
  });

  it('handleGovernanceQuery importable from AMIGA barrel', () => {
    expect(AmigaHandleGovernanceQuery).toBeDefined();
    expect(AmigaHandleGovernanceQuery).toBe(handleGovernanceQuery);
  });

  it('VERDICT importable from AMIGA barrel', () => {
    expect(AmigaVERDICT).toBeDefined();
    expect(AmigaVERDICT).toBe(VERDICT);
  });
});

// ============================================================================
// End-to-end governance flow via barrel imports
// ============================================================================

describe('End-to-end governance flow via barrel imports', () => {
  it('full governance flow: parse charter, evaluate plan, log decision, query policy', () => {
    // Parse default charter via barrel
    const charter = parseCharter(COMMONS_CHARTER_YAML);
    expect(charter).toBeDefined();

    // Create engine, log, and handler via barrel
    const engine = new RulesEngine(charter);
    const log = new DecisionLog();
    const handler = new PolicyQueryHandler(charter, log);

    // compliance_check with a compliant plan
    const response = handler.handle({
      query_type: 'compliance_check',
      subject: 'E2E test plan evaluation',
      requestor: 'CE-1',
      context: {
        distribution_plan: {
          plan_id: 'plan-e2e-001',
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
        },
      },
    });

    expect(response.verdict).toBe('COMPLIANT');
    expect(response.respondent).toBe('GL-1');
    expect(log.size).toBe(1);
  });

  it('policy_lookup after compliance_check accumulates in shared log', () => {
    const charter = parseCharter(COMMONS_CHARTER_YAML);
    const log = new DecisionLog();
    const handler = new PolicyQueryHandler(charter, log);

    // First: compliance_check
    handler.handle({
      query_type: 'compliance_check',
      subject: 'Check plan',
      requestor: 'CE-1',
      context: {
        distribution_plan: {
          plan_id: 'plan-e2e-002',
          mission_id: 'mission-2026-02-18-001',
          created_at: '2026-02-18T10:00:00Z',
          total_amount: 1000,
          tiers: {
            tier1_direct: { amount: 500, recipients: [{ contributor_id: 'contrib-a-1', share: 500 }] },
            tier2_infrastructure: { amount: 200, allocation_percent: 20 },
            tier3_ubd: { amount: 300, allocation_percent: 30, recipient_count: 50 },
          },
        },
      },
    });
    expect(log.size).toBe(1);

    // Second: policy_lookup
    handler.handle({
      query_type: 'policy_lookup',
      subject: 'UBD policy',
      requestor: 'human',
    });
    expect(log.size).toBe(2);
  });

  it('all evaluations have non-empty reasoning', () => {
    const charter = parseCharter(COMMONS_CHARTER_YAML);
    const log = new DecisionLog();
    const handler = new PolicyQueryHandler(charter, log);

    const response = handler.handle({
      query_type: 'compliance_check',
      subject: 'Reasoning test',
      requestor: 'CE-1',
      context: {
        distribution_plan: {
          plan_id: 'plan-e2e-003',
          mission_id: 'mission-2026-02-18-001',
          created_at: '2026-02-18T10:00:00Z',
          total_amount: 1000,
          tiers: {
            tier1_direct: { amount: 500, recipients: [{ contributor_id: 'contrib-a-1', share: 500 }] },
            tier2_infrastructure: { amount: 200, allocation_percent: 20 },
            tier3_ubd: { amount: 300, allocation_percent: 30, recipient_count: 50 },
          },
        },
      },
    });
    expect(response.reasoning.length).toBeGreaterThan(0);
  });
});
