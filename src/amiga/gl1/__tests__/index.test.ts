/**
 * Integration tests for GL-1 barrel exports and AMIGA barrel integration.
 *
 * Verifies all GL-1 public API is accessible from the barrel index,
 * the AMIGA barrel includes GL-1, and cross-module schemas work together.
 */

import { describe, it, expect } from 'vitest';

// GL-1 barrel imports
import {
  // Charter module
  CharterSchema,
  CharterClauseSchema,
  ConstitutionalConstraintSchema,
  CharterVersionSchema,
  CONSTITUTIONAL_CONSTRAINT_IDS,
  COMMONS_CHARTER_YAML,
  parseCharter,
  ratifyCharter,
  isRatified,
  // Weighting module
  WeightingParameterSchema,
  WeightingSpecSchema,
  WEIGHTING_SPEC_YAML,
  parseWeightingSpec,
  validateParameterRange,
  // Dispute module
  GovernanceDisputeSchema,
  createDispute,
  resolveDispute,
  rejectDispute,
} from '../index.js';

// AMIGA barrel imports
import {
  CharterSchema as AmigaCharterSchema,
  GovernanceDisputeSchema as AmigaGovernanceDisputeSchema,
  WeightingSpecSchema as AmigaWeightingSpecSchema,
  COMMONS_CHARTER_YAML as AmigaCommonsCharterYaml,
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
