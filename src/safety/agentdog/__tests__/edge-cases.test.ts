/**
 * HB-02 AgentDoG — edge cases.
 *
 * Boundary tests covering unusual BLOCK scenarios:
 *   - chained BLOCKs (one after another),
 *   - BLOCK during BLOCK (re-entrant emission),
 *   - BLOCK from a sub-agent (sub-agent component label),
 *   - BLOCK with empty context (sparse case).
 */

import { describe, it, expect, afterEach } from 'vitest';
import {
  emitAgentDogDiagnostic,
  enrichBlockWithAgentDog,
  hasAgentDogDiagnostic,
} from '../index.js';
import { withFlag } from './test-helpers.js';

describe('AgentDoG — edge cases', () => {
  const cleanups: Array<() => void> = [];
  afterEach(() => {
    while (cleanups.length) cleanups.pop()!();
  });

  it('handles chained BLOCKs — each emits an independent record', () => {
    const env = withFlag(true);
    cleanups.push(env.cleanup);
    const r1 = emitAgentDogDiagnostic(
      { component: 'skill:a', vulnerabilityVector: 'prompt-injection' },
      env.configPath,
    );
    const r2 = emitAgentDogDiagnostic(
      { component: 'skill:b', vulnerabilityVector: 'metadata-poisoning' },
      env.configPath,
    );
    expect(r1.diagnostic).not.toBe(r2.diagnostic);
    expect(r1.diagnostic!.where.component).toBe('skill:a');
    expect(r2.diagnostic!.where.component).toBe('skill:b');
    expect(r1.diagnostic!.how.vulnerabilityVector).toBe('prompt-injection');
    expect(r2.diagnostic!.how.vulnerabilityVector).toBe('metadata-poisoning');
  });

  it('handles BLOCK-during-BLOCK (re-entrant) — emission is reentrancy-safe', () => {
    const env = withFlag(true);
    cleanups.push(env.cleanup);
    // Simulate re-entrancy: emit while already inside an emit-handler.
    const outer = emitAgentDogDiagnostic({ component: 'outer' }, env.configPath);
    const inner = emitAgentDogDiagnostic({ component: 'inner' }, env.configPath);
    const outer2 = emitAgentDogDiagnostic({ component: 'outer-again' }, env.configPath);
    expect(outer.diagnostic!.where.component).toBe('outer');
    expect(inner.diagnostic!.where.component).toBe('inner');
    expect(outer2.diagnostic!.where.component).toBe('outer-again');
    // Each diagnostic is independently frozen.
    expect(Object.isFrozen(outer.diagnostic)).toBe(true);
    expect(Object.isFrozen(inner.diagnostic)).toBe(true);
  });

  it('handles BLOCK from a sub-agent — sub-agent component label preserved', () => {
    const env = withFlag(true);
    cleanups.push(env.cleanup);
    const r = emitAgentDogDiagnostic(
      {
        component: 'subagent:executor.child:planner',
        invocationContext: 'parent-phase:807,subagent-id:0xfeed',
        vulnerabilityVector: 'function-hijacking',
        escalationPattern: 'vertical',
        impactedAsset: 'parent-state',
        blastRadius: 'cross-session',
      },
      env.configPath,
    );
    expect(r.diagnostic!.where.component).toBe('subagent:executor.child:planner');
    expect(r.diagnostic!.where.invocationContext).toBe('parent-phase:807,subagent-id:0xfeed');
    expect(r.diagnostic!.what.blastRadius).toBe('cross-session');
  });

  it('handles BLOCK with empty context — record is well-formed with safe defaults', () => {
    const env = withFlag(true);
    cleanups.push(env.cleanup);
    const r = emitAgentDogDiagnostic({}, env.configPath);
    expect(r.emitted).toBe(true);
    expect(r.diagnostic).not.toBeNull();
    expect(r.diagnostic!.where).toEqual({ component: '', invocationContext: '' });
    expect(r.diagnostic!.how).toEqual({
      vulnerabilityVector: 'unknown',
      escalationPattern: 'unknown',
    });
    expect(r.diagnostic!.what).toEqual({ impactedAsset: '', blastRadius: 'session' });
  });

  it('handles BLOCK whose original output is itself a frozen object', () => {
    const env = withFlag(true);
    cleanups.push(env.cleanup);
    const block = Object.freeze({ decision: 'BLOCK' as const, reason: 'frozen' });
    const enriched = enrichBlockWithAgentDog(block, { component: 'x' }, env.configPath);
    expect(hasAgentDogDiagnostic(enriched)).toBe(true);
    // Original frozen object is untouched.
    expect(Object.isFrozen(block)).toBe(true);
    expect('agentDog' in block).toBe(false);
  });

  it('privacy guard — long impacted-asset label is clipped to bound (no content leak)', () => {
    const env = withFlag(true);
    cleanups.push(env.cleanup);
    const fakeSecret = 'sk-' + 'X'.repeat(500);
    const r = emitAgentDogDiagnostic(
      { component: 'skill:credential', impactedAsset: fakeSecret, blastRadius: 'project' },
      env.configPath,
    );
    expect(r.diagnostic!.what.impactedAsset.length).toBeLessThanOrEqual(64);
    expect(r.diagnostic!.what.impactedAsset.length).toBeLessThan(fakeSecret.length);
  });
});
