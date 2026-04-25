/**
 * HB-02 AgentDoG — emitter tests.
 */

import { describe, it, expect, afterEach } from 'vitest';
import {
  AGENTDOG_DISABLED_RESULT,
  AGENTDOG_SCHEMA_VERSION,
  emitAgentDogDiagnostic,
} from '../index.js';
import { withFlag, withMissingFile } from './test-helpers.js';

describe('AgentDoG — emitter', () => {
  const cleanups: Array<() => void> = [];
  afterEach(() => {
    while (cleanups.length) cleanups.pop()!();
  });

  it('returns disabled sentinel when config file is missing', () => {
    const env = withMissingFile();
    cleanups.push(env.cleanup);
    const r = emitAgentDogDiagnostic(
      { component: 'x', vulnerabilityVector: 'prompt-injection' },
      env.configPath,
    );
    expect(r).toEqual(AGENTDOG_DISABLED_RESULT);
    expect(r.diagnostic).toBeNull();
    expect(r.disabled).toBe(true);
    expect(r.emitted).toBe(false);
  });

  it('returns disabled sentinel when flag is explicitly false', () => {
    const env = withFlag(false);
    cleanups.push(env.cleanup);
    const r = emitAgentDogDiagnostic({ component: 'x' }, env.configPath);
    expect(r.disabled).toBe(true);
    expect(r.emitted).toBe(false);
    expect(r.diagnostic).toBeNull();
  });

  it('returns disabled sentinel when block is missing the enabled key', () => {
    const env = withFlag(undefined);
    cleanups.push(env.cleanup);
    const r = emitAgentDogDiagnostic({ component: 'x' }, env.configPath);
    expect(r.disabled).toBe(true);
  });

  it('emits a frozen complete diagnostic record when flag is on', () => {
    const env = withFlag(true);
    cleanups.push(env.cleanup);
    const r = emitAgentDogDiagnostic(
      {
        component: 'skill:foo',
        invocationContext: 'phase:807',
        vulnerabilityVector: 'prompt-injection',
        escalationPattern: 'lateral',
        impactedAsset: 'secret',
        blastRadius: 'project',
      },
      env.configPath,
    );
    expect(r.disabled).toBe(false);
    expect(r.emitted).toBe(true);
    expect(r.diagnostic).not.toBeNull();
    expect(r.diagnostic!.schemaVersion).toBe(AGENTDOG_SCHEMA_VERSION);
    expect(r.diagnostic!.where).toEqual({
      component: 'skill:foo',
      invocationContext: 'phase:807',
    });
    expect(r.diagnostic!.how).toEqual({
      vulnerabilityVector: 'prompt-injection',
      escalationPattern: 'lateral',
    });
    expect(r.diagnostic!.what).toEqual({
      impactedAsset: 'secret',
      blastRadius: 'project',
    });
    expect(Object.isFrozen(r.diagnostic)).toBe(true);
  });

  it('emits diagnostic with sparse context (missing fields → safe defaults, not throw)', () => {
    const env = withFlag(true);
    cleanups.push(env.cleanup);
    const r = emitAgentDogDiagnostic({}, env.configPath);
    // Per the spec the schema *captures what was available*; it does not
    // throw on sparse inputs (BLOCK is never lost). Drift is detected by
    // the schema-shape validator downstream, not by emission.
    expect(r.emitted).toBe(true);
    expect(r.diagnostic!.where.component).toBe('');
    expect(r.diagnostic!.how.vulnerabilityVector).toBe('unknown');
    expect(r.diagnostic!.what.blastRadius).toBe('session');
  });

  it('disabled sentinel is referentially stable across calls', () => {
    const env = withFlag(false);
    cleanups.push(env.cleanup);
    const a = emitAgentDogDiagnostic({}, env.configPath);
    const b = emitAgentDogDiagnostic({ component: 'x' }, env.configPath);
    expect(a).toBe(b);
    expect(a).toBe(AGENTDOG_DISABLED_RESULT);
  });
});
