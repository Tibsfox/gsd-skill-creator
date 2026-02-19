/**
 * TDD tests for the GL-1 policy query handler.
 *
 * Tests cover:
 * - PolicyQueryHandler construction
 * - compliance_check query type (GOVR-05)
 * - policy_lookup query type (GOVR-05)
 * - weight_review query type (GOVR-05)
 * - dispute_initiate query type (GOVR-05)
 * - handleGovernanceQuery convenience function
 * - Decision logging integration (GOVR-04)
 */

import { describe, it, expect } from 'vitest';
import { PolicyQueryHandler, handleGovernanceQuery } from '../policy-query.js';
import type { GovernanceQueryPayload } from '../../icd/icd-03.js';
import { GovernanceResponsePayloadSchema } from '../../icd/icd-03.js';
import { parseCharter, COMMONS_CHARTER_YAML } from '../charter.js';
import { DecisionLog } from '../decision-log.js';

// ============================================================================
// Test fixtures
// ============================================================================

function makeCompliantDistributionPlan() {
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
  };
}

function makeZeroUbdPlan() {
  return {
    plan_id: 'plan-bad-001',
    mission_id: 'mission-2026-02-18-002',
    created_at: '2026-02-18T10:00:00Z',
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
  };
}

// ============================================================================
// PolicyQueryHandler construction
// ============================================================================

describe('PolicyQueryHandler construction', () => {
  it('accepts a parsed Charter and a DecisionLog', () => {
    const charter = parseCharter(COMMONS_CHARTER_YAML);
    const log = new DecisionLog();
    const handler = new PolicyQueryHandler(charter, log);
    expect(handler).toBeDefined();
  });

  it('provides access to the decision log', () => {
    const charter = parseCharter(COMMONS_CHARTER_YAML);
    const log = new DecisionLog();
    const handler = new PolicyQueryHandler(charter, log);
    expect(handler.decisionLog).toBe(log);
  });
});

// ============================================================================
// compliance_check query type
// ============================================================================

describe('compliance_check query type', () => {
  const charter = parseCharter(COMMONS_CHARTER_YAML);

  it('returns a valid GovernanceResponsePayload for a compliant plan', () => {
    const log = new DecisionLog();
    const handler = new PolicyQueryHandler(charter, log);

    const query: GovernanceQueryPayload = {
      query_type: 'compliance_check',
      subject: 'Evaluate distribution plan',
      requestor: 'CE-1',
      distribution_plan_id: 'plan-001',
      context: { distribution_plan: makeCompliantDistributionPlan() },
    };

    const response = handler.handle(query);
    expect(response.verdict).toBe('COMPLIANT');
    expect(response.respondent).toBe('GL-1');
    expect(response.reasoning.length).toBeGreaterThan(0);
  });

  it('after handling, the decision log contains 1 entry', () => {
    const log = new DecisionLog();
    const handler = new PolicyQueryHandler(charter, log);

    const query: GovernanceQueryPayload = {
      query_type: 'compliance_check',
      subject: 'Evaluate compliant plan',
      requestor: 'CE-1',
      context: { distribution_plan: makeCompliantDistributionPlan() },
    };

    handler.handle(query);
    expect(log.size).toBe(1);
  });

  it('returns NON_COMPLIANT with cited_clauses for zero UBD plan', () => {
    const log = new DecisionLog();
    const handler = new PolicyQueryHandler(charter, log);

    const query: GovernanceQueryPayload = {
      query_type: 'compliance_check',
      subject: 'Check non-compliant plan',
      requestor: 'CE-1',
      context: { distribution_plan: makeZeroUbdPlan() },
    };

    const response = handler.handle(query);
    expect(response.verdict).toBe('NON_COMPLIANT');
    expect(response.cited_clauses).toBeDefined();
    expect(response.cited_clauses!.length).toBeGreaterThan(0);
    expect(response.cited_clauses).toContain('clause-001');
  });

  it('response conforms to GovernanceResponsePayloadSchema', () => {
    const log = new DecisionLog();
    const handler = new PolicyQueryHandler(charter, log);

    const query: GovernanceQueryPayload = {
      query_type: 'compliance_check',
      subject: 'Schema conformance test',
      requestor: 'CE-1',
      context: { distribution_plan: makeCompliantDistributionPlan() },
    };

    const response = handler.handle(query);
    const parsed = GovernanceResponsePayloadSchema.safeParse(response);
    expect(parsed.success).toBe(true);
  });
});

// ============================================================================
// policy_lookup query type
// ============================================================================

describe('policy_lookup query type', () => {
  const charter = parseCharter(COMMONS_CHARTER_YAML);

  it('returns ADVISORY verdict with reasoning about UBD policy', () => {
    const log = new DecisionLog();
    const handler = new PolicyQueryHandler(charter, log);

    const query: GovernanceQueryPayload = {
      query_type: 'policy_lookup',
      subject: 'What is the UBD policy?',
      requestor: 'human',
    };

    const response = handler.handle(query);
    expect(response.verdict).toBe('ADVISORY');
    expect(response.respondent).toBe('GL-1');
    expect(response.reasoning.length).toBeGreaterThan(0);
    // Should contain something about UBD
    expect(response.reasoning.toLowerCase()).toContain('ubd');
  });

  it('logs the policy lookup in the decision log', () => {
    const log = new DecisionLog();
    const handler = new PolicyQueryHandler(charter, log);

    const query: GovernanceQueryPayload = {
      query_type: 'policy_lookup',
      subject: 'What is the UBD policy?',
      requestor: 'human',
    };

    handler.handle(query);
    expect(log.size).toBe(1);
  });
});

// ============================================================================
// weight_review query type
// ============================================================================

describe('weight_review query type', () => {
  const charter = parseCharter(COMMONS_CHARTER_YAML);

  it('returns response with weighting parameter information', () => {
    const log = new DecisionLog();
    const handler = new PolicyQueryHandler(charter, log);

    const query: GovernanceQueryPayload = {
      query_type: 'weight_review',
      subject: 'Review frequency parameter range',
      requestor: 'CE-1',
    };

    const response = handler.handle(query);
    expect(response.respondent).toBe('GL-1');
    expect(response.reasoning.length).toBeGreaterThan(0);
    // Should contain something about frequency
    expect(response.reasoning.toLowerCase()).toContain('frequency');
  });
});

// ============================================================================
// dispute_initiate query type
// ============================================================================

describe('dispute_initiate query type', () => {
  const charter = parseCharter(COMMONS_CHARTER_YAML);

  it('returns response with dispute guidance', () => {
    const log = new DecisionLog();
    const handler = new PolicyQueryHandler(charter, log);

    const query: GovernanceQueryPayload = {
      query_type: 'dispute_initiate',
      subject: 'Contest weight calculation for contrib-abc',
      requestor: 'human',
    };

    const response = handler.handle(query);
    expect(response.respondent).toBe('GL-1');
    expect(response.reasoning.length).toBeGreaterThan(0);
    // Should mention dispute record creation
    expect(response.reasoning.toLowerCase()).toContain('dispute');
  });
});

// ============================================================================
// handleGovernanceQuery convenience function
// ============================================================================

describe('handleGovernanceQuery convenience function', () => {
  it('creates a handler with default charter and handles the query', () => {
    const query: GovernanceQueryPayload = {
      query_type: 'compliance_check',
      subject: 'Convenience function test',
      requestor: 'CE-1',
      context: { distribution_plan: makeCompliantDistributionPlan() },
    };

    const response = handleGovernanceQuery(query);
    expect(response).toBeDefined();
    expect(response.verdict).toBe('COMPLIANT');
    expect(response.respondent).toBe('GL-1');
  });

  it('returns a valid GovernanceResponsePayload', () => {
    const query: GovernanceQueryPayload = {
      query_type: 'policy_lookup',
      subject: 'Convenience test lookup',
      requestor: 'human',
    };

    const response = handleGovernanceQuery(query);
    const parsed = GovernanceResponsePayloadSchema.safeParse(response);
    expect(parsed.success).toBe(true);
  });

  it('is stateless -- each call creates fresh state', () => {
    const query: GovernanceQueryPayload = {
      query_type: 'compliance_check',
      subject: 'Stateless test',
      requestor: 'CE-1',
      context: { distribution_plan: makeCompliantDistributionPlan() },
    };

    // Call twice -- should not accumulate state
    const response1 = handleGovernanceQuery(query);
    const response2 = handleGovernanceQuery(query);
    expect(response1.verdict).toBe(response2.verdict);
  });
});

// ============================================================================
// Decision logging integration
// ============================================================================

describe('Decision logging integration', () => {
  it('logs all 3 query types with correct metadata', () => {
    const charter = parseCharter(COMMONS_CHARTER_YAML);
    const log = new DecisionLog();
    const handler = new PolicyQueryHandler(charter, log);

    // compliance_check
    handler.handle({
      query_type: 'compliance_check',
      subject: 'Check plan',
      requestor: 'CE-1',
      context: { distribution_plan: makeCompliantDistributionPlan() },
    });

    // policy_lookup
    handler.handle({
      query_type: 'policy_lookup',
      subject: 'UBD info',
      requestor: 'human',
    });

    // weight_review
    handler.handle({
      query_type: 'weight_review',
      subject: 'Frequency range',
      requestor: 'CE-1',
    });

    expect(log.size).toBe(3);
  });

  it('each log entry has the correct query_type and query_subject', () => {
    const charter = parseCharter(COMMONS_CHARTER_YAML);
    const log = new DecisionLog();
    const handler = new PolicyQueryHandler(charter, log);

    handler.handle({
      query_type: 'compliance_check',
      subject: 'Alpha check',
      requestor: 'CE-1',
      context: { distribution_plan: makeCompliantDistributionPlan() },
    });

    handler.handle({
      query_type: 'policy_lookup',
      subject: 'Beta lookup',
      requestor: 'human',
    });

    const all = log.getAll();
    expect(all[0].query_type).toBe('compliance_check');
    expect(all[0].query_subject).toBe('Alpha check');
    expect(all[1].query_type).toBe('policy_lookup');
    expect(all[1].query_subject).toBe('Beta lookup');
  });

  it('log entries are retrievable by verdict', () => {
    const charter = parseCharter(COMMONS_CHARTER_YAML);
    const log = new DecisionLog();
    const handler = new PolicyQueryHandler(charter, log);

    handler.handle({
      query_type: 'compliance_check',
      subject: 'Compliant plan',
      requestor: 'CE-1',
      context: { distribution_plan: makeCompliantDistributionPlan() },
    });

    handler.handle({
      query_type: 'compliance_check',
      subject: 'Non-compliant plan',
      requestor: 'CE-1',
      context: { distribution_plan: makeZeroUbdPlan() },
    });

    const compliant = log.getByVerdict('COMPLIANT');
    expect(compliant.length).toBe(1);

    const nonCompliant = log.getByVerdict('NON_COMPLIANT');
    expect(nonCompliant.length).toBe(1);
  });
});
