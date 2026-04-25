/**
 * HB-02 AgentDoG — flag-off byte-identical invariant.
 *
 * With `cs25-26-sweep.agentdog-schema.enabled=false` (or block absent, or
 * file absent), the emitter must:
 *   - return a stable disabled sentinel,
 *   - not produce a diagnostic record,
 *   - not mutate caller-supplied BLOCK output objects when piped through
 *     `enrichBlockWithAgentDog()` (referential equality, no extra field).
 *
 * This mirrors the v1.49.574 `disabled-byte-identical` pattern.
 */

import { describe, it, expect, afterEach } from 'vitest';
import {
  AGENTDOG_DISABLED_RESULT,
  emitAgentDogDiagnostic,
  enrichBlockWithAgentDog,
  hasAgentDogDiagnostic,
} from '../index.js';
import { withFlag, withMissingFile } from './test-helpers.js';

describe('AgentDoG — flag-off byte-identical', () => {
  const cleanups: Array<() => void> = [];
  afterEach(() => {
    while (cleanups.length) cleanups.pop()!();
  });

  it('emitter result is the frozen disabled sentinel (config missing)', () => {
    const env = withMissingFile();
    cleanups.push(env.cleanup);
    const r = emitAgentDogDiagnostic({ component: 'x' }, env.configPath);
    expect(r).toBe(AGENTDOG_DISABLED_RESULT);
    expect(JSON.stringify(r)).toBe('{"emitted":false,"disabled":true,"diagnostic":null}');
  });

  it('emitter result is the frozen disabled sentinel (flag false)', () => {
    const env = withFlag(false);
    cleanups.push(env.cleanup);
    const r = emitAgentDogDiagnostic({ component: 'x' }, env.configPath);
    expect(r).toBe(AGENTDOG_DISABLED_RESULT);
  });

  it('enrichBlockWithAgentDog returns the input object referentially equal when flag off', () => {
    const env = withFlag(false);
    cleanups.push(env.cleanup);
    const block = { decision: 'BLOCK' as const, reason: 'test', meta: { phase: 807 } };
    const enriched = enrichBlockWithAgentDog(block, { component: 'x' }, env.configPath);
    // Referential equality — caller's object is unchanged.
    expect(enriched).toBe(block);
    expect(hasAgentDogDiagnostic(enriched)).toBe(false);
    expect('agentDog' in enriched).toBe(false);
  });

  it('JSON serialization of a BLOCK object is byte-identical with flag off vs no enrichment', () => {
    const env = withFlag(false);
    cleanups.push(env.cleanup);
    const block = {
      decision: 'BLOCK' as const,
      reason: 'untrusted-skill-attempted-network-call',
      timestamp: 1234567890,
      meta: { phase: 807, wave: 'HB-02' },
    };
    const baseline = JSON.stringify(block);
    const piped = JSON.stringify(
      enrichBlockWithAgentDog(block, { component: 'skill:x' }, env.configPath),
    );
    expect(piped).toBe(baseline);
  });

  it('JSON serialization differs (in a controlled way) when flag is ON — proves the off case is meaningful', () => {
    const env = withFlag(true);
    cleanups.push(env.cleanup);
    const block = { decision: 'BLOCK' as const, reason: 'r' };
    const baseline = JSON.stringify(block);
    const enriched = enrichBlockWithAgentDog(block, { component: 'x' }, env.configPath);
    const piped = JSON.stringify(enriched);
    expect(piped).not.toBe(baseline);
    expect(hasAgentDogDiagnostic(enriched)).toBe(true);
  });
});
