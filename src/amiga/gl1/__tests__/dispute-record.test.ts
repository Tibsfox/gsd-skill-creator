/**
 * TDD tests for governance-layer dispute record schema and lifecycle.
 */

import { describe, it, expect } from 'vitest';
import {
  GovernanceDisputeSchema,
  createDispute,
  resolveDispute,
  rejectDispute,
} from '../dispute-record.js';
import type { EvidenceItem, AlgorithmAdjustment } from '../../icd/icd-04.js';

// ============================================================================
// GovernanceDisputeSchema
// ============================================================================

describe('GovernanceDisputeSchema', () => {
  const makeValidDispute = () => ({
    // ICD-04 DisputeRecordPayload fields
    raiser: 'contrib-alice-001',
    disputed_item: 'Weight calculation for mission-2026-01-15-001',
    evidence: [
      {
        type: 'weight_calculation' as const,
        reference: 'calc-2026-01-15-001',
        description: 'Weight was computed using stale invocation data.',
      },
    ],
    status: 'open' as const,
    // GL-1 governance metadata
    dispute_id: 'dispute-1706000000-abc12345',
    filed_at: '2026-01-15T12:00:00Z',
  });

  it('accepts a dispute with all ICD-04 fields plus GL-1 metadata', () => {
    const result = GovernanceDisputeSchema.safeParse(makeValidDispute());
    expect(result.success).toBe(true);
  });

  it('accepts a dispute with optional reviewed_by, review_notes, and charter_clause_refs', () => {
    const dispute = {
      ...makeValidDispute(),
      reviewed_by: 'GL-1',
      review_notes: 'Reviewed and found valid.',
      charter_clause_refs: ['clause-001', 'clause-007'],
    };
    const result = GovernanceDisputeSchema.safeParse(dispute);
    expect(result.success).toBe(true);
  });

  it('rejects a dispute missing evidence (inherited from ICD-04, min 1)', () => {
    const dispute = makeValidDispute();
    dispute.evidence = [];
    const result = GovernanceDisputeSchema.safeParse(dispute);
    expect(result.success).toBe(false);
  });

  it('validates raiser is valid ContributorID or AgentID', () => {
    // Valid ContributorID
    const withContributor = { ...makeValidDispute(), raiser: 'contrib-bob-002' };
    expect(GovernanceDisputeSchema.safeParse(withContributor).success).toBe(true);

    // Valid AgentID
    const withAgent = { ...makeValidDispute(), raiser: 'GL-2' };
    expect(GovernanceDisputeSchema.safeParse(withAgent).success).toBe(true);
  });
});

// ============================================================================
// createDispute
// ============================================================================

describe('createDispute', () => {
  const evidence: EvidenceItem[] = [
    {
      type: 'ledger_entry',
      reference: 'ledger-entry-001',
      description: 'Missing contribution record.',
    },
  ];

  it('returns a GovernanceDispute with status "open"', () => {
    const dispute = createDispute('contrib-alice-001', 'Missing ledger entry', evidence);
    expect(dispute.status).toBe('open');
  });

  it('auto-generates dispute_id with correct format', () => {
    const dispute = createDispute('contrib-alice-001', 'Missing ledger entry', evidence);
    expect(dispute.dispute_id).toMatch(/^dispute-\d+-[a-f0-9]+$/);
  });

  it('sets filed_at to current ISO timestamp', () => {
    const before = new Date().toISOString();
    const dispute = createDispute('contrib-alice-001', 'Missing ledger entry', evidence);
    const after = new Date().toISOString();
    expect(dispute.filed_at).toBeDefined();
    expect(dispute.filed_at >= before).toBe(true);
    expect(dispute.filed_at <= after).toBe(true);
  });

  it('requires at least one evidence item', () => {
    expect(() => createDispute('contrib-alice-001', 'No evidence', [])).toThrow();
  });
});

// ============================================================================
// resolveDispute
// ============================================================================

describe('resolveDispute', () => {
  const evidence: EvidenceItem[] = [
    {
      type: 'weight_calculation',
      reference: 'calc-001',
      description: 'Stale data used.',
    },
  ];

  it('returns new dispute with status "resolved"', () => {
    const dispute = createDispute('contrib-alice-001', 'Stale weight', evidence);
    const resolved = resolveDispute(dispute, 'Recalculated with fresh data', 'GL-1');
    expect(resolved.status).toBe('resolved');
    expect(resolved.conclusion).toBe('Recalculated with fresh data');
    expect(resolved.reviewed_by).toBe('GL-1');
    expect(resolved.resolved_at).toBeDefined();
  });

  it('sets algorithm_adjustment when provided', () => {
    const dispute = createDispute('contrib-alice-001', 'Stale weight', evidence);
    const adjustment: AlgorithmAdjustment = {
      parameter: 'frequency',
      old_value: '0.40',
      new_value: '0.45',
      rationale: 'Invocation data was stale.',
    };
    const resolved = resolveDispute(dispute, 'Adjusted frequency', 'GL-1', adjustment);
    expect(resolved.algorithm_adjustment).toEqual(adjustment);
  });

  it('throws if dispute is already resolved', () => {
    const dispute = createDispute('contrib-alice-001', 'Stale weight', evidence);
    const resolved = resolveDispute(dispute, 'Done', 'GL-1');
    expect(() => resolveDispute(resolved, 'Again', 'GL-2')).toThrow();
  });

  it('throws if dispute is already rejected', () => {
    const dispute = createDispute('contrib-alice-001', 'Stale weight', evidence);
    const rejected = rejectDispute(dispute, 'Insufficient evidence', 'GL-1');
    expect(() => resolveDispute(rejected, 'Override', 'GL-2')).toThrow();
  });

  it('does NOT mutate the input dispute', () => {
    const dispute = createDispute('contrib-alice-001', 'Stale weight', evidence);
    const originalStatus = dispute.status;
    resolveDispute(dispute, 'Done', 'GL-1');
    expect(dispute.status).toBe(originalStatus);
  });
});

// ============================================================================
// rejectDispute
// ============================================================================

describe('rejectDispute', () => {
  const evidence: EvidenceItem[] = [
    {
      type: 'other',
      reference: 'ref-001',
      description: 'Vague complaint.',
    },
  ];

  it('returns new dispute with status "rejected"', () => {
    const dispute = createDispute('contrib-bob-002', 'Vague complaint', evidence);
    const rejected = rejectDispute(dispute, 'Insufficient evidence', 'GL-1');
    expect(rejected.status).toBe('rejected');
    expect(rejected.conclusion).toBe('Insufficient evidence');
    expect(rejected.reviewed_by).toBe('GL-1');
  });

  it('throws if dispute is already resolved', () => {
    const dispute = createDispute('contrib-bob-002', 'Vague complaint', evidence);
    const resolved = resolveDispute(dispute, 'Done', 'GL-1');
    expect(() => rejectDispute(resolved, 'Too late', 'GL-2')).toThrow();
  });

  it('throws if dispute is already rejected', () => {
    const dispute = createDispute('contrib-bob-002', 'Vague complaint', evidence);
    const rejected = rejectDispute(dispute, 'Bad evidence', 'GL-1');
    expect(() => rejectDispute(rejected, 'Double reject', 'GL-2')).toThrow();
  });
});
