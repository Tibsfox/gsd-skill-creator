/**
 * HB-04 W/E/E roles — flag-off byte-identical invariant.
 *
 * With `cs25-26-sweep.weler-roles.enabled=false` (or block absent, or
 * file absent), every public-surface entry point must:
 *   - return a stable disabled-result sentinel,
 *   - not emit a CAPCOM gate record,
 *   - not invoke any extension,
 *   - leave the existing skill-creator six-step loop untouched.
 *
 * Mirrors HB-03 `flag-off-byte-identical.test.ts`.
 */

import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import {
  workerGenerate,
  emptyWorkerState,
  resetWorkerCounter,
  WORKER_DISABLED_STATE,
} from '../worker.js';
import {
  evaluatorRun,
  emptyEvaluatorState,
  EVALUATOR_DISABLED_STATE,
} from '../evaluator.js';
import {
  evolutionPropose,
  emptyEvolutionState,
  EVOLUTION_DISABLED_STATE,
} from '../evolution.js';
import { emitCapcomGate, CAPCOM_GATE_DISABLED_RESULT } from '../capcom-gate.js';
import type { EvolutionExtensionPoint } from '../types.js';
import { makeEnv, makeMissingConfigEnv, SYNTHETIC_FAILURE_HISTORY } from './test-helpers.js';

describe('W/E/E roles — flag-off byte-identical', () => {
  const cleanups: Array<() => void> = [];
  beforeEach(() => resetWorkerCounter());
  afterEach(() => {
    while (cleanups.length) cleanups.pop()!();
  });

  it('Worker returns disabled sentinel when flag false', () => {
    const env = makeEnv(false);
    cleanups.push(env.cleanup);
    const r = workerGenerate(emptyWorkerState('t'), { taskId: 't', summary: 'x' }, env.configPath);
    expect(r).toBe(WORKER_DISABLED_STATE);
  });

  it('Evaluator returns disabled sentinel when flag false', () => {
    const env = makeEnv(false);
    cleanups.push(env.cleanup);
    const r = evaluatorRun(
      emptyEvaluatorState(),
      emptyWorkerState('t'),
      SYNTHETIC_FAILURE_HISTORY,
      env.configPath,
    );
    expect(r).toBe(EVALUATOR_DISABLED_STATE);
  });

  it('Evolution returns disabled sentinel when flag false', () => {
    const env = makeEnv(false);
    cleanups.push(env.cleanup);
    const r = evolutionPropose(
      emptyEvolutionState(),
      emptyWorkerState('t'),
      emptyEvaluatorState(),
      { settingsPath: env.configPath, capcomMarkerPath: env.capcomMarkerPath },
    );
    expect(r).toBe(EVOLUTION_DISABLED_STATE);
  });

  it('CAPCOM gate returns disabled sentinel when flag false', () => {
    const env = makeEnv(false);
    cleanups.push(env.cleanup);
    const r = emitCapcomGate('role-split-activation', {
      markerPath: env.capcomMarkerPath,
      settingsPath: env.configPath,
    });
    expect(r).toBe(CAPCOM_GATE_DISABLED_RESULT);
  });

  it('missing config file → disabled sentinels (no throw)', () => {
    const env = makeMissingConfigEnv();
    cleanups.push(env.cleanup);
    expect(workerGenerate(emptyWorkerState('t'), { taskId: 't', summary: 'x' }, env.configPath)).toBe(
      WORKER_DISABLED_STATE,
    );
    expect(emitCapcomGate('protocol-update', { settingsPath: env.configPath })).toBe(
      CAPCOM_GATE_DISABLED_RESULT,
    );
  });

  it('JSON disabled-result fingerprints match across calls (deterministic, frozen refs)', () => {
    const env = makeEnv(false);
    cleanups.push(env.cleanup);
    const a = workerGenerate(emptyWorkerState('t'), { taskId: 't', summary: 'x' }, env.configPath);
    const b = workerGenerate(emptyWorkerState('t'), { taskId: 't', summary: 'y' }, env.configPath);
    expect(a).toBe(b); // same frozen reference
    expect(JSON.stringify(emitCapcomGate('protocol-update', { settingsPath: env.configPath }))).toBe(
      '{"emitted":false,"authorized":false,"disabled":true,"record":null}',
    );
  });

  it('extension is NEVER invoked with flag off, even with marker authorized', () => {
    const env = makeEnv(false);
    cleanups.push(env.cleanup);
    let invocations = 0;
    const stub: EvolutionExtensionPoint = {
      id: 'never-call-me',
      proposePolicyUpdate: () => {
        invocations += 1;
        return null;
      },
    };
    evolutionPropose(emptyEvolutionState(), emptyWorkerState('t'), emptyEvaluatorState(), {
      extensions: [stub],
      settingsPath: env.configPath,
      capcomMarkerPath: env.capcomMarkerPath,
    });
    expect(invocations).toBe(0);
  });
});
