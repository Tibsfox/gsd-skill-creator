/**
 * TDD tests for the GL-1 decision log.
 *
 * Tests cover:
 * - DecisionEntrySchema validation
 * - DecisionLog append and query operations
 * - Append-only guarantee (no mutation methods)
 */

import { describe, it, expect } from 'vitest';
import { DecisionLog, DecisionEntrySchema } from '../decision-log.js';
import type { EvaluationResult } from '../rules-engine.js';

// ============================================================================
// Test fixtures
// ============================================================================

function makeEvaluationResult(overrides?: Partial<EvaluationResult>): EvaluationResult {
  return {
    plan_id: 'plan-001',
    verdict: 'COMPLIANT',
    reasoning: [
      {
        clause_id: 'clause-001',
        clause_title: 'Universal Basic Dividend',
        check: 'UBD inclusion check',
        result: 'pass',
        detail: 'UBD tier allocates 300 to 50 recipients, meeting the inclusion requirement.',
      },
    ],
    cited_clauses: [],
    evaluated_at: '2026-02-18T10:00:00Z',
    charter_version: '1.0.0',
    ...overrides,
  } as EvaluationResult;
}

// ============================================================================
// DecisionEntrySchema
// ============================================================================

describe('DecisionEntrySchema', () => {
  it('accepts a valid decision entry', () => {
    const entry = {
      entry_id: 'decision-1706000000-abc12345',
      logged_at: '2026-02-18T10:00:00Z',
      query_type: 'compliance_check',
      query_subject: 'Evaluate distribution plan',
      evaluation: makeEvaluationResult(),
      requestor: 'CE-1',
    };
    const result = DecisionEntrySchema.safeParse(entry);
    expect(result.success).toBe(true);
  });

  it('rejects entry with missing evaluation', () => {
    const entry = {
      entry_id: 'decision-1706000000-abc12345',
      logged_at: '2026-02-18T10:00:00Z',
      query_type: 'compliance_check',
      query_subject: 'Evaluate distribution plan',
      // evaluation missing
      requestor: 'CE-1',
    };
    const result = DecisionEntrySchema.safeParse(entry);
    expect(result.success).toBe(false);
  });

  it('rejects entry with empty query_subject', () => {
    const entry = {
      entry_id: 'decision-1706000000-abc12345',
      logged_at: '2026-02-18T10:00:00Z',
      query_type: 'compliance_check',
      query_subject: '',
      evaluation: makeEvaluationResult(),
      requestor: 'CE-1',
    };
    const result = DecisionEntrySchema.safeParse(entry);
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// DecisionLog -- append and query
// ============================================================================

describe('DecisionLog -- append and query', () => {
  it('creates an empty log with size 0', () => {
    const log = new DecisionLog();
    expect(log.size).toBe(0);
  });

  it('append adds entry and returns DecisionEntry with auto-generated fields', () => {
    const log = new DecisionLog();
    const evalResult = makeEvaluationResult();
    const entry = log.append(evalResult, 'compliance_check', 'Test plan', 'CE-1');

    expect(entry.entry_id).toBeDefined();
    expect(entry.entry_id.length).toBeGreaterThan(0);
    expect(entry.logged_at).toBeDefined();
    expect(entry.query_type).toBe('compliance_check');
    expect(entry.query_subject).toBe('Test plan');
    expect(entry.requestor).toBe('CE-1');
    expect(entry.evaluation).toBeDefined();
  });

  it('size increases with each append', () => {
    const log = new DecisionLog();
    log.append(makeEvaluationResult(), 'compliance_check', 'Plan 1', 'CE-1');
    log.append(makeEvaluationResult({ plan_id: 'plan-002' }), 'policy_lookup', 'Plan 2', 'human');
    log.append(makeEvaluationResult({ plan_id: 'plan-003' }), 'weight_review', 'Plan 3', 'GL-1');
    expect(log.size).toBe(3);
  });

  it('getByPlanId returns entries for a specific plan', () => {
    const log = new DecisionLog();
    log.append(makeEvaluationResult({ plan_id: 'plan-001' }), 'compliance_check', 'Plan 1', 'CE-1');
    log.append(makeEvaluationResult({ plan_id: 'plan-002' }), 'compliance_check', 'Plan 2', 'CE-1');
    log.append(makeEvaluationResult({ plan_id: 'plan-001' }), 'policy_lookup', 'Plan 1 again', 'human');

    const results = log.getByPlanId('plan-001');
    expect(results.length).toBe(2);
    expect(results.every((e) => e.evaluation.plan_id === 'plan-001')).toBe(true);
  });

  it('getByVerdict returns only entries with matching verdict', () => {
    const log = new DecisionLog();
    log.append(makeEvaluationResult({ verdict: 'COMPLIANT' }), 'compliance_check', 'OK', 'CE-1');
    log.append(makeEvaluationResult({ verdict: 'NON_COMPLIANT' }), 'compliance_check', 'Bad', 'CE-1');
    log.append(makeEvaluationResult({ verdict: 'COMPLIANT' }), 'compliance_check', 'OK 2', 'CE-1');

    const compliant = log.getByVerdict('COMPLIANT');
    expect(compliant.length).toBe(2);

    const nonCompliant = log.getByVerdict('NON_COMPLIANT');
    expect(nonCompliant.length).toBe(1);
  });

  it('getAll returns entries in insertion order', () => {
    const log = new DecisionLog();
    log.append(makeEvaluationResult({ plan_id: 'first' }), 'compliance_check', 'First', 'CE-1');
    log.append(makeEvaluationResult({ plan_id: 'second' }), 'policy_lookup', 'Second', 'human');
    log.append(makeEvaluationResult({ plan_id: 'third' }), 'weight_review', 'Third', 'GL-1');

    const all = log.getAll();
    expect(all[0].evaluation.plan_id).toBe('first');
    expect(all[1].evaluation.plan_id).toBe('second');
    expect(all[2].evaluation.plan_id).toBe('third');
  });
});

// ============================================================================
// DecisionLog -- append-only guarantee
// ============================================================================

describe('DecisionLog -- append-only guarantee', () => {
  it('getAll returns a copy (modifying returned array does not affect log)', () => {
    const log = new DecisionLog();
    log.append(makeEvaluationResult(), 'compliance_check', 'Test', 'CE-1');

    const all = log.getAll();
    all.length = 0; // mutate returned array
    expect(log.size).toBe(1); // log unaffected
  });

  it('no remove, delete, clear, or update methods exist on DecisionLog', () => {
    const log = new DecisionLog();
    expect((log as Record<string, unknown>)['remove']).toBeUndefined();
    expect((log as Record<string, unknown>)['delete']).toBeUndefined();
    expect((log as Record<string, unknown>)['clear']).toBeUndefined();
    expect((log as Record<string, unknown>)['update']).toBeUndefined();
  });

  it('append returns a new object, not a reference to internal state', () => {
    const log = new DecisionLog();
    const entry = log.append(makeEvaluationResult(), 'compliance_check', 'Test', 'CE-1');

    // Mutate the returned entry
    (entry as Record<string, unknown>).query_subject = 'MUTATED';

    // Internal state should be unaffected
    const all = log.getAll();
    expect(all[0].query_subject).toBe('Test');
  });
});
