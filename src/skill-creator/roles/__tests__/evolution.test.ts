/**
 * HB-04 — Evolution role tests.
 */

import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { workerGenerate, emptyWorkerState, resetWorkerCounter } from '../worker.js';
import { evaluatorRun, emptyEvaluatorState } from '../evaluator.js';
import {
  evolutionPropose,
  emptyEvolutionState,
  aggregatePatterns,
  EVOLUTION_DISABLED_STATE,
} from '../evolution.js';
import { makeEnv, authorizeCapcom, SYNTHETIC_FAILURE_HISTORY } from './test-helpers.js';

describe('Evolution role', () => {
  const cleanups: Array<() => void> = [];
  beforeEach(() => resetWorkerCounter());
  afterEach(() => {
    while (cleanups.length) cleanups.pop()!();
  });

  it('aggregatePatterns groups diagnostics by failureClass deterministically', () => {
    const diags = [
      { role: 'evaluator' as const, candidateId: 'a', failureClass: 'silent-truncation', severity: 'medium' as const, rootCause: '', block: true, cited: [], producedAt: '' },
      { role: 'evaluator' as const, candidateId: 'b', failureClass: 'silent-truncation', severity: 'medium' as const, rootCause: '', block: true, cited: [], producedAt: '' },
      { role: 'evaluator' as const, candidateId: 'a', failureClass: 'unbounded-recursion', severity: 'high' as const, rootCause: '', block: true, cited: [], producedAt: '' },
    ];
    const patterns = aggregatePatterns(diags);
    expect(patterns).toHaveLength(2);
    expect(patterns[0]?.failureClass).toBe('silent-truncation');
    expect(patterns[0]?.occurrences).toBe(2);
    expect(patterns[0]?.affectedCandidates).toEqual(['a', 'b']);
  });

  it('proposes evaluator-threshold tightening when ≥3 occurrences across ≥2 candidates (with auth)', () => {
    const env = makeEnv(true);
    cleanups.push(env.cleanup);
    authorizeCapcom(env);
    let ws = emptyWorkerState('t');
    // Build 3 candidates that all hit silent-truncation.
    for (const summary of [
      'writer A produces truncated output',
      'writer B produces truncated output',
      'writer C produces truncated output',
    ]) {
      ws = workerGenerate(ws, { taskId: 't', summary }, env.configPath);
    }
    const es = evaluatorRun(emptyEvaluatorState(), ws, SYNTHETIC_FAILURE_HISTORY, env.configPath);
    const ev = evolutionPropose(emptyEvolutionState(), ws, es, {
      settingsPath: env.configPath,
      capcomMarkerPath: env.capcomMarkerPath,
    });
    expect(ev.proposals).toHaveLength(1);
    expect(ev.proposals[0]?.protocol).toBe('evaluator-threshold');
    expect(ev.proposals[0]?.trigger.failureClass).toBe('silent-truncation');
    expect(ev.proposals[0]?.source).toBe('evolution');
  });

  it('without CAPCOM auth, in-house proposal is dropped (staged-only)', () => {
    const env = makeEnv(true);
    cleanups.push(env.cleanup);
    let ws = emptyWorkerState('t');
    for (const summary of ['writer A may truncate', 'writer B may truncate', 'writer C may truncate']) {
      ws = workerGenerate(ws, { taskId: 't', summary }, env.configPath);
    }
    const es = evaluatorRun(emptyEvaluatorState(), ws, SYNTHETIC_FAILURE_HISTORY, env.configPath);
    const ev = evolutionPropose(emptyEvolutionState(), ws, es, {
      settingsPath: env.configPath,
      capcomMarkerPath: env.capcomMarkerPath,
    });
    expect(ev.proposals).toHaveLength(0);
  });

  it('flag off → returns disabled sentinel', () => {
    const env = makeEnv(false);
    cleanups.push(env.cleanup);
    const ev = evolutionPropose(
      emptyEvolutionState(),
      emptyWorkerState('t'),
      emptyEvaluatorState(),
      { settingsPath: env.configPath, capcomMarkerPath: env.capcomMarkerPath },
    );
    expect(ev).toBe(EVOLUTION_DISABLED_STATE);
  });
});
