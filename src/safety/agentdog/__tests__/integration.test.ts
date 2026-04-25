/**
 * HB-02 AgentDoG — integration shim tests.
 *
 * Verifies that AgentDoG enrichment is *additive*, never replacing the
 * existing Safety Warden BLOCK semantics.
 */

import { describe, it, expect, afterEach } from 'vitest';
import {
  enrichBlockWithAgentDog,
  hasAgentDogDiagnostic,
  AGENTDOG_SCHEMA_VERSION,
} from '../index.js';
import { withFlag } from './test-helpers.js';

describe('AgentDoG — integration with existing BLOCK semantics', () => {
  const cleanups: Array<() => void> = [];
  afterEach(() => {
    while (cleanups.length) cleanups.pop()!();
  });

  it('enrichment preserves every field of the existing BLOCK record', () => {
    const env = withFlag(true);
    cleanups.push(env.cleanup);
    const block = {
      decision: 'BLOCK' as const,
      reason: 'cooldown-violation',
      timestamp: 999,
      operationId: 'op-42',
      severity: 'critical',
      meta: { skillId: 'skill:x', phase: 807 },
    };
    const enriched = enrichBlockWithAgentDog(
      block,
      {
        component: 'skill:x',
        invocationContext: 'phase:807',
        vulnerabilityVector: 'capability-overreach',
        escalationPattern: 'lateral',
        impactedAsset: 'op-cooldown',
        blastRadius: 'session',
      },
      env.configPath,
    );
    // Original fields are unchanged.
    expect(enriched.decision).toBe('BLOCK');
    expect(enriched.reason).toBe('cooldown-violation');
    expect(enriched.timestamp).toBe(999);
    expect(enriched.operationId).toBe('op-42');
    expect(enriched.severity).toBe('critical');
    expect(enriched.meta).toEqual({ skillId: 'skill:x', phase: 807 });
    // Enrichment is additive.
    expect(hasAgentDogDiagnostic(enriched)).toBe(true);
    if (hasAgentDogDiagnostic(enriched)) {
      expect(enriched.agentDog.schemaVersion).toBe(AGENTDOG_SCHEMA_VERSION);
      expect(enriched.agentDog.where.component).toBe('skill:x');
      expect(enriched.agentDog.how.vulnerabilityVector).toBe('capability-overreach');
      expect(enriched.agentDog.what.blastRadius).toBe('session');
    }
  });

  it('does not mutate the caller-supplied BLOCK object (immutability)', () => {
    const env = withFlag(true);
    cleanups.push(env.cleanup);
    const block = { decision: 'BLOCK' as const, reason: 'r', meta: { foo: 1 } };
    const blockSnapshot = JSON.stringify(block);
    enrichBlockWithAgentDog(block, { component: 'x' }, env.configPath);
    expect(JSON.stringify(block)).toBe(blockSnapshot);
    expect('agentDog' in block).toBe(false);
  });

  it('hasAgentDogDiagnostic narrows correctly on enriched + non-enriched objects', () => {
    const env = withFlag(true);
    cleanups.push(env.cleanup);
    const block = { decision: 'BLOCK' };
    expect(hasAgentDogDiagnostic(block)).toBe(false);
    const enriched = enrichBlockWithAgentDog(block, { component: 'x' }, env.configPath);
    expect(hasAgentDogDiagnostic(enriched)).toBe(true);
  });

  it('AgentDoG diagnostic is NEVER consulted by the BLOCK decision itself (decision is upstream)', () => {
    // Conceptual invariant: the enrichment shim takes BLOCK output as input.
    // It cannot change the decision because the decision has already been
    // made by the time enrichBlockWithAgentDog is called. This test pins
    // that contract: the function does not even read `blockOutput.decision`
    // to compute the diagnostic — the diagnostic comes from `context`.
    const env = withFlag(true);
    cleanups.push(env.cleanup);
    const block = { decision: 'ALLOW', other: 'fields' }; // intentionally wrong decision
    const enriched = enrichBlockWithAgentDog(
      block,
      { component: 'sw', vulnerabilityVector: 'prompt-injection', blastRadius: 'session' },
      env.configPath,
    );
    expect(enriched.decision).toBe('ALLOW'); // unchanged
    if (hasAgentDogDiagnostic(enriched)) {
      // Diagnostic shape derived from context, not from block.decision.
      expect(enriched.agentDog.how.vulnerabilityVector).toBe('prompt-injection');
    }
  });
});
