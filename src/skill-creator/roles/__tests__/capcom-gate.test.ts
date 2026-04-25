/**
 * HB-04 — CAPCOM HARD GATE tests.
 *
 * The gate fires in two production scenarios:
 *   1. Role-split activation — transitioning from single-role to W/E/E.
 *   2. Protocol-update — Evolution-proposed loop-protocol change.
 *
 * Without the `.planning/skill-creator/weler-roles.capcom` marker, neither
 * scenario activates the role split or the proposed protocol change.
 *
 * Mirrors HB-03's `capcom-gate.test.ts` precedent.
 */

import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { writeFileSync } from 'node:fs';
import {
  emitCapcomGate,
  isCapcomAuthorized,
  isActivationTriggered,
  CAPCOM_GATE_DISABLED_RESULT,
} from '../capcom-gate.js';
import {
  evolutionPropose,
  emptyEvolutionState,
} from '../evolution.js';
import { workerGenerate, emptyWorkerState, resetWorkerCounter } from '../worker.js';
import { evaluatorRun, emptyEvaluatorState } from '../evaluator.js';
import { makeEnv, authorizeCapcom, recordTrigger, SYNTHETIC_FAILURE_HISTORY } from './test-helpers.js';

describe('HB-04 CAPCOM HARD GATE', () => {
  const cleanups: Array<() => void> = [];
  beforeEach(() => resetWorkerCounter());
  afterEach(() => {
    while (cleanups.length) cleanups.pop()!();
  });

  it('fires on role-split-activation; without auth, authorized=false', () => {
    const env = makeEnv(true);
    cleanups.push(env.cleanup);
    const result = emitCapcomGate('role-split-activation', {
      note: 'transitioning from single-role to W/E/E',
      markerPath: env.capcomMarkerPath,
      settingsPath: env.configPath,
    });
    expect(result.emitted).toBe(true);
    expect(result.authorized).toBe(false);
    expect(result.disabled).toBe(false);
    expect(result.record?.kind).toBe('role-split-activation');
    expect(result.record?.note).toContain('single-role');
  });

  it('fires on protocol-update; without auth, proposal is staged-only (dropped)', () => {
    const env = makeEnv(true);
    cleanups.push(env.cleanup);
    let ws = emptyWorkerState('t');
    for (const summary of ['truncate A', 'truncate B', 'truncate C']) {
      ws = workerGenerate(ws, { taskId: 't', summary }, env.configPath);
    }
    const es = evaluatorRun(emptyEvaluatorState(), ws, SYNTHETIC_FAILURE_HISTORY, env.configPath);
    // Without authorizeCapcom: protocol-update gate fires authorized=false
    // → proposal is dropped, never appears in EvolutionState.
    const ev = evolutionPropose(emptyEvolutionState(), ws, es, {
      settingsPath: env.configPath,
      capcomMarkerPath: env.capcomMarkerPath,
    });
    expect(ev.proposals).toHaveLength(0);
  });

  it('with auth recorded → authorized=true on both reasons', () => {
    const env = makeEnv(true);
    cleanups.push(env.cleanup);
    authorizeCapcom(env);
    const a = emitCapcomGate('role-split-activation', {
      note: 'authorized split',
      markerPath: env.capcomMarkerPath,
      settingsPath: env.configPath,
    });
    expect(a.authorized).toBe(true);
    const b = emitCapcomGate('protocol-update', {
      proposal: null,
      markerPath: env.capcomMarkerPath,
      settingsPath: env.configPath,
    });
    expect(b.authorized).toBe(true);
  });

  it('flag off → disabled sentinel; even with marker present', () => {
    const env = makeEnv(false);
    cleanups.push(env.cleanup);
    authorizeCapcom(env);
    const r = emitCapcomGate('role-split-activation', {
      markerPath: env.capcomMarkerPath,
      settingsPath: env.configPath,
    });
    expect(r).toBe(CAPCOM_GATE_DISABLED_RESULT);
    expect(r.disabled).toBe(true);
    expect(r.emitted).toBe(false);
    expect(r.record).toBeNull();
  });

  it('isCapcomAuthorized rejects empty marker file', () => {
    const env = makeEnv(true);
    cleanups.push(env.cleanup);
    writeFileSync(env.capcomMarkerPath, '   \n  ', 'utf8');
    expect(isCapcomAuthorized(env.capcomMarkerPath)).toBe(false);
  });

  it('trigger marker is independent of CAPCOM auth (HB-03 separation pattern)', () => {
    const env = makeEnv(true);
    cleanups.push(env.cleanup);
    recordTrigger(env);
    expect(isActivationTriggered(env.triggerMarkerPath)).toBe(true);
    // Trigger present but no CAPCOM marker → still unauthorized.
    expect(isCapcomAuthorized(env.capcomMarkerPath)).toBe(false);
    const r = emitCapcomGate('role-split-activation', {
      markerPath: env.capcomMarkerPath,
      settingsPath: env.configPath,
    });
    expect(r.authorized).toBe(false);
  });

  it('signedAttestation field is preserved on the record (forward-compat)', () => {
    const env = makeEnv(true);
    cleanups.push(env.cleanup);
    authorizeCapcom(env);
    const r = emitCapcomGate('protocol-update', {
      proposal: null,
      markerPath: env.capcomMarkerPath,
      settingsPath: env.configPath,
      signedAttestation: 'fake-signature-token-v1',
    });
    expect(r.record?.signedAttestation).toBe('fake-signature-token-v1');
  });
});
