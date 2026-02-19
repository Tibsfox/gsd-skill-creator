/**
 * Tests for ICD-02, ICD-03, and ICD-04 payload schemas.
 *
 * ICD-02 (ME-1/CE-1): LEDGER_ENTRY with dependency tree and depth decay
 * ICD-03 (MC-1/GL-1): GOVERNANCE_QUERY and GOVERNANCE_RESPONSE
 * ICD-04 (CE-1/GL-1): LEDGER_READ and DISPUTE_RECORD
 *
 * Also validates convenience exports:
 * - ICD_0N_SCHEMAS mapping objects
 * - ICD_0N_META metadata objects
 */

import { describe, it, expect } from 'vitest';
import {
  DependencyNodeSchema,
  LedgerEntryPayloadSchema,
  ICD_02_SCHEMAS,
  ICD_02_META,
} from '../icd/icd-02.js';
import {
  GovernanceQueryPayloadSchema,
  GovernanceResponsePayloadSchema,
  ICD_03_SCHEMAS,
  ICD_03_META,
} from '../icd/icd-03.js';
import {
  LedgerReadPayloadSchema,
  DisputeRecordPayloadSchema,
  ICD_04_SCHEMAS,
  ICD_04_META,
} from '../icd/icd-04.js';

// ============================================================================
// ICD-02 (ME-1/CE-1): LEDGER_ENTRY
// ============================================================================

describe('DependencyNodeSchema', () => {
  it('accepts a valid dependency node', () => {
    const result = DependencyNodeSchema.safeParse({
      contributor_id: 'contrib-author-1',
      depth: 0,
      decay_factor: 1.0,
    });
    expect(result.success).toBe(true);
  });

  it('accepts transitive dependency with decay', () => {
    const result = DependencyNodeSchema.safeParse({
      contributor_id: 'contrib-transitive-dep',
      depth: 2,
      decay_factor: 0.25,
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing contributor_id', () => {
    expect(
      DependencyNodeSchema.safeParse({ depth: 0, decay_factor: 1.0 }).success,
    ).toBe(false);
  });

  it('rejects negative depth', () => {
    expect(
      DependencyNodeSchema.safeParse({
        contributor_id: 'contrib-a',
        depth: -1,
        decay_factor: 1.0,
      }).success,
    ).toBe(false);
  });

  it('rejects decay_factor > 1', () => {
    expect(
      DependencyNodeSchema.safeParse({
        contributor_id: 'contrib-a',
        depth: 0,
        decay_factor: 1.5,
      }).success,
    ).toBe(false);
  });

  it('rejects decay_factor < 0', () => {
    expect(
      DependencyNodeSchema.safeParse({
        contributor_id: 'contrib-a',
        depth: 0,
        decay_factor: -0.1,
      }).success,
    ).toBe(false);
  });
});

describe('LedgerEntryPayloadSchema', () => {
  const validPayload = {
    mission_id: 'mission-2026-02-17-001',
    contributor_id: 'contrib-skill-author-abc',
    agent_id: 'ME-2',
    skill_name: 'code-review',
    phase: 'EXECUTION',
    timestamp: '2026-02-17T14:30:00Z',
    context_weight: 0.85,
    dependency_tree: [
      { contributor_id: 'contrib-dep-1', depth: 1, decay_factor: 0.5 },
      { contributor_id: 'contrib-dep-2', depth: 2, decay_factor: 0.25 },
    ],
  };

  it('accepts a valid ledger entry payload', () => {
    expect(LedgerEntryPayloadSchema.safeParse(validPayload).success).toBe(true);
  });

  it('accepts entry with empty dependency tree', () => {
    expect(
      LedgerEntryPayloadSchema.safeParse({
        ...validPayload,
        dependency_tree: [],
      }).success,
    ).toBe(true);
  });

  it('accepts optional invocation_id and notes', () => {
    expect(
      LedgerEntryPayloadSchema.safeParse({
        ...validPayload,
        invocation_id: 'inv-abc-123',
        notes: 'First contribution in phase',
      }).success,
    ).toBe(true);
  });

  it('accepts payload with additional passthrough fields', () => {
    expect(
      LedgerEntryPayloadSchema.safeParse({
        ...validPayload,
        extra_field: 'should-pass',
      }).success,
    ).toBe(true);
  });

  it('rejects missing mission_id', () => {
    const { mission_id: _, ...without } = validPayload;
    expect(LedgerEntryPayloadSchema.safeParse(without).success).toBe(false);
  });

  it('rejects context_weight > 1', () => {
    expect(
      LedgerEntryPayloadSchema.safeParse({ ...validPayload, context_weight: 1.5 }).success,
    ).toBe(false);
  });

  it('rejects context_weight < 0', () => {
    expect(
      LedgerEntryPayloadSchema.safeParse({ ...validPayload, context_weight: -0.1 }).success,
    ).toBe(false);
  });

  it('rejects missing contributor_id', () => {
    const { contributor_id: _, ...without } = validPayload;
    expect(LedgerEntryPayloadSchema.safeParse(without).success).toBe(false);
  });

  it('rejects empty skill_name', () => {
    expect(
      LedgerEntryPayloadSchema.safeParse({ ...validPayload, skill_name: '' }).success,
    ).toBe(false);
  });
});

// ============================================================================
// ICD-02 Convenience Exports
// ============================================================================

describe('ICD_02_SCHEMAS', () => {
  it('maps LEDGER_ENTRY to its schema', () => {
    expect(Object.keys(ICD_02_SCHEMAS)).toHaveLength(1);
    expect(ICD_02_SCHEMAS).toHaveProperty('LEDGER_ENTRY');
    expect(typeof ICD_02_SCHEMAS.LEDGER_ENTRY.safeParse).toBe('function');
  });
});

describe('ICD_02_META', () => {
  it('has correct ICD metadata', () => {
    expect(ICD_02_META.id).toBe('ICD-02');
    expect(ICD_02_META.name).toBe('ME-1/CE-1 Interface');
    expect(ICD_02_META.parties).toEqual(['ME-1', 'CE-1']);
    expect(ICD_02_META.event_types).toEqual(['LEDGER_ENTRY']);
  });
});

// ============================================================================
// ICD-03 (MC-1/GL-1): GOVERNANCE_QUERY, GOVERNANCE_RESPONSE
// ============================================================================

describe('GovernanceQueryPayloadSchema', () => {
  const validPayload = {
    query_type: 'compliance_check',
    subject: 'Distribution plan for mission-2026-02-17-001',
    requestor: 'CS-1',
  };

  it('accepts a valid governance query payload', () => {
    expect(GovernanceQueryPayloadSchema.safeParse(validPayload).success).toBe(true);
  });

  it('accepts human requestor', () => {
    expect(
      GovernanceQueryPayloadSchema.safeParse({
        ...validPayload,
        requestor: 'human',
      }).success,
    ).toBe(true);
  });

  it('accepts optional distribution_plan_id', () => {
    expect(
      GovernanceQueryPayloadSchema.safeParse({
        ...validPayload,
        distribution_plan_id: 'plan-abc-123',
      }).success,
    ).toBe(true);
  });

  it('accepts optional context record', () => {
    expect(
      GovernanceQueryPayloadSchema.safeParse({
        ...validPayload,
        context: { urgency: 'high', phase: 'REVIEW_GATE' },
      }).success,
    ).toBe(true);
  });

  it('accepts payload with additional passthrough fields', () => {
    expect(
      GovernanceQueryPayloadSchema.safeParse({
        ...validPayload,
        extra: 'field',
      }).success,
    ).toBe(true);
  });

  it('rejects missing query_type', () => {
    const { query_type: _, ...without } = validPayload;
    expect(GovernanceQueryPayloadSchema.safeParse(without).success).toBe(false);
  });

  it('rejects invalid query_type', () => {
    expect(
      GovernanceQueryPayloadSchema.safeParse({ ...validPayload, query_type: 'invalid' }).success,
    ).toBe(false);
  });

  it('rejects empty subject', () => {
    expect(
      GovernanceQueryPayloadSchema.safeParse({ ...validPayload, subject: '' }).success,
    ).toBe(false);
  });

  it('accepts all 4 query types', () => {
    const types = ['compliance_check', 'policy_lookup', 'dispute_initiate', 'weight_review'];
    for (const qt of types) {
      expect(
        GovernanceQueryPayloadSchema.safeParse({ ...validPayload, query_type: qt }).success,
      ).toBe(true);
    }
  });
});

describe('GovernanceResponsePayloadSchema', () => {
  const validPayload = {
    query_id: 'evt-governance-query-001',
    verdict: 'COMPLIANT',
    reasoning: 'Distribution plan follows charter Article 3.2 weighting rules',
    respondent: 'GL-1',
  };

  it('accepts a valid governance response payload', () => {
    expect(GovernanceResponsePayloadSchema.safeParse(validPayload).success).toBe(true);
  });

  it('accepts NON_COMPLIANT with cited clauses', () => {
    expect(
      GovernanceResponsePayloadSchema.safeParse({
        ...validPayload,
        verdict: 'NON_COMPLIANT',
        reasoning: 'Violates minimum contributor threshold',
        cited_clauses: ['charter-3.2.1', 'charter-3.2.4'],
      }).success,
    ).toBe(true);
  });

  it('accepts ADVISORY with recommendations', () => {
    expect(
      GovernanceResponsePayloadSchema.safeParse({
        ...validPayload,
        verdict: 'ADVISORY',
        recommendations: ['Consider increasing weight for transitive deps', 'Review decay formula'],
      }).success,
    ).toBe(true);
  });

  it('accepts payload with additional passthrough fields', () => {
    expect(
      GovernanceResponsePayloadSchema.safeParse({
        ...validPayload,
        timestamp: '2026-02-17T15:00:00Z',
      }).success,
    ).toBe(true);
  });

  it('rejects missing verdict', () => {
    const { verdict: _, ...without } = validPayload;
    expect(GovernanceResponsePayloadSchema.safeParse(without).success).toBe(false);
  });

  it('rejects empty reasoning (mandatory)', () => {
    expect(
      GovernanceResponsePayloadSchema.safeParse({ ...validPayload, reasoning: '' }).success,
    ).toBe(false);
  });

  it('rejects missing query_id', () => {
    const { query_id: _, ...without } = validPayload;
    expect(GovernanceResponsePayloadSchema.safeParse(without).success).toBe(false);
  });

  it('rejects invalid verdict value', () => {
    expect(
      GovernanceResponsePayloadSchema.safeParse({ ...validPayload, verdict: 'MAYBE' }).success,
    ).toBe(false);
  });
});

// ============================================================================
// ICD-03 Convenience Exports
// ============================================================================

describe('ICD_03_SCHEMAS', () => {
  it('maps both event types to their schemas', () => {
    expect(Object.keys(ICD_03_SCHEMAS)).toHaveLength(2);
    expect(ICD_03_SCHEMAS).toHaveProperty('GOVERNANCE_QUERY');
    expect(ICD_03_SCHEMAS).toHaveProperty('GOVERNANCE_RESPONSE');
  });

  it('each entry has safeParse method', () => {
    for (const schema of Object.values(ICD_03_SCHEMAS)) {
      expect(typeof schema.safeParse).toBe('function');
    }
  });
});

describe('ICD_03_META', () => {
  it('has correct ICD metadata', () => {
    expect(ICD_03_META.id).toBe('ICD-03');
    expect(ICD_03_META.name).toBe('MC-1/GL-1 Interface');
    expect(ICD_03_META.parties).toEqual(['MC-1', 'GL-1']);
    expect(ICD_03_META.event_types).toEqual(['GOVERNANCE_QUERY', 'GOVERNANCE_RESPONSE']);
  });
});

// ============================================================================
// ICD-04 (CE-1/GL-1): LEDGER_READ, DISPUTE_RECORD
// ============================================================================

describe('LedgerReadPayloadSchema', () => {
  const validPayload = {
    query: 'by_mission',
    requestor: 'GL-1',
    mission_id: 'mission-2026-02-17-001',
  };

  it('accepts a valid ledger read payload', () => {
    expect(LedgerReadPayloadSchema.safeParse(validPayload).success).toBe(true);
  });

  it('accepts summary query with no filters', () => {
    expect(
      LedgerReadPayloadSchema.safeParse({
        query: 'summary',
        requestor: 'GL-2',
      }).success,
    ).toBe(true);
  });

  it('accepts by_contributor with contributor filter', () => {
    expect(
      LedgerReadPayloadSchema.safeParse({
        query: 'by_contributor',
        requestor: 'GL-1',
        contributor_id: 'contrib-skill-author-abc',
      }).success,
    ).toBe(true);
  });

  it('accepts by_phase with phase and timestamp filters', () => {
    expect(
      LedgerReadPayloadSchema.safeParse({
        query: 'by_phase',
        requestor: 'GL-1',
        phase: 'EXECUTION',
        from_timestamp: '2026-02-17T00:00:00Z',
        to_timestamp: '2026-02-17T23:59:59Z',
      }).success,
    ).toBe(true);
  });

  it('accepts payload with additional passthrough fields', () => {
    expect(
      LedgerReadPayloadSchema.safeParse({
        ...validPayload,
        page: 1,
      }).success,
    ).toBe(true);
  });

  it('rejects missing query', () => {
    const { query: _, ...without } = validPayload;
    expect(LedgerReadPayloadSchema.safeParse(without).success).toBe(false);
  });

  it('rejects invalid query type', () => {
    expect(
      LedgerReadPayloadSchema.safeParse({ ...validPayload, query: 'invalid' }).success,
    ).toBe(false);
  });

  it('rejects missing requestor', () => {
    const { requestor: _, ...without } = validPayload;
    expect(LedgerReadPayloadSchema.safeParse(without).success).toBe(false);
  });
});

describe('DisputeRecordPayloadSchema', () => {
  const validPayload = {
    raiser: 'contrib-skill-author-abc',
    disputed_item: 'Ledger entry LE-2026-001 weight calculation',
    evidence: [
      {
        type: 'ledger_entry' as const,
        reference: 'LE-2026-001',
        description: 'Context weight 0.9 seems inflated for transitive contribution',
      },
      {
        type: 'weight_calculation' as const,
        reference: 'WC-2026-001',
        description: 'Decay factor not applied at depth 2',
      },
    ],
    status: 'open',
  };

  it('accepts a valid open dispute record', () => {
    expect(DisputeRecordPayloadSchema.safeParse(validPayload).success).toBe(true);
  });

  it('accepts agent as raiser', () => {
    expect(
      DisputeRecordPayloadSchema.safeParse({
        ...validPayload,
        raiser: 'GL-1',
      }).success,
    ).toBe(true);
  });

  it('accepts resolved dispute with conclusion and adjustment', () => {
    expect(
      DisputeRecordPayloadSchema.safeParse({
        ...validPayload,
        status: 'resolved',
        conclusion: 'Decay factor was indeed missing; recalculated',
        algorithm_adjustment: {
          parameter: 'depth_decay_base',
          old_value: '0.5',
          new_value: '0.4',
          rationale: 'Better reflects transitive contribution diminishment',
        },
        resolved_at: '2026-02-18T10:00:00Z',
      }).success,
    ).toBe(true);
  });

  it('accepts null algorithm_adjustment', () => {
    expect(
      DisputeRecordPayloadSchema.safeParse({
        ...validPayload,
        status: 'resolved',
        conclusion: 'Weight was correctly calculated',
        algorithm_adjustment: null,
      }).success,
    ).toBe(true);
  });

  it('accepts payload with additional passthrough fields', () => {
    expect(
      DisputeRecordPayloadSchema.safeParse({
        ...validPayload,
        priority: 'high',
      }).success,
    ).toBe(true);
  });

  it('rejects missing raiser', () => {
    const { raiser: _, ...without } = validPayload;
    expect(DisputeRecordPayloadSchema.safeParse(without).success).toBe(false);
  });

  it('rejects empty evidence array', () => {
    expect(
      DisputeRecordPayloadSchema.safeParse({ ...validPayload, evidence: [] }).success,
    ).toBe(false);
  });

  it('rejects invalid status', () => {
    expect(
      DisputeRecordPayloadSchema.safeParse({ ...validPayload, status: 'invalid' }).success,
    ).toBe(false);
  });

  it('rejects missing disputed_item', () => {
    const { disputed_item: _, ...without } = validPayload;
    expect(DisputeRecordPayloadSchema.safeParse(without).success).toBe(false);
  });

  it('accepts all 4 status values', () => {
    const statuses = ['open', 'under_review', 'resolved', 'rejected'];
    for (const status of statuses) {
      expect(
        DisputeRecordPayloadSchema.safeParse({ ...validPayload, status }).success,
      ).toBe(true);
    }
  });

  it('accepts all 4 evidence types', () => {
    const types = ['ledger_entry', 'invocation_log', 'weight_calculation', 'other'];
    for (const type of types) {
      expect(
        DisputeRecordPayloadSchema.safeParse({
          ...validPayload,
          evidence: [{ type, reference: 'ref-1', description: 'desc' }],
        }).success,
      ).toBe(true);
    }
  });
});

// ============================================================================
// ICD-04 Convenience Exports
// ============================================================================

describe('ICD_04_SCHEMAS', () => {
  it('maps both event types to their schemas', () => {
    expect(Object.keys(ICD_04_SCHEMAS)).toHaveLength(2);
    expect(ICD_04_SCHEMAS).toHaveProperty('LEDGER_READ');
    expect(ICD_04_SCHEMAS).toHaveProperty('DISPUTE_RECORD');
  });

  it('each entry has safeParse method', () => {
    for (const schema of Object.values(ICD_04_SCHEMAS)) {
      expect(typeof schema.safeParse).toBe('function');
    }
  });
});

describe('ICD_04_META', () => {
  it('has correct ICD metadata', () => {
    expect(ICD_04_META.id).toBe('ICD-04');
    expect(ICD_04_META.name).toBe('CE-1/GL-1 Interface');
    expect(ICD_04_META.parties).toEqual(['CE-1', 'GL-1']);
    expect(ICD_04_META.event_types).toEqual(['LEDGER_READ', 'DISPUTE_RECORD']);
  });
});
