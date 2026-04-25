/**
 * v1.49.574 Half B — disabled-when-flag-off byte-identical invariant.
 *
 * Asserts that every public-surface entry point in the megakernel-substrate
 * layer returns a stable, frozen, byte-identical disabled-result sentinel
 * when the substrate flag is off (or the config file is missing entirely).
 *
 * This complements the per-module test files (which check the validator
 * surface) by treating the *barrel-level* disabled-result shape as a
 * first-class invariant the project should not regress without intent.
 *
 * The fixture is the JSON-canonicalized disabled-result for each entry
 * point. If the snapshot rotates, that is a public-surface change that
 * should be reviewed; the test exists to make the change visible.
 */

import { describe, it, expect } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  validateInstructionTensor,
  validateAdapterSelection,
  auditVerificationSpec,
} from '../index.js';
import { record, read } from '../../../traces/megakernel-trace/index.js';
import { computeBudgetGuidance, RTX_4060_TI_ENVELOPE } from '../../../orchestration/sol-budget/index.js';
import { makePlanner } from '../../../orchestration/jepa-planner/index.js';

function withAllSubstrateFlags(value: boolean): { configPath: string; cleanup: () => void } {
  const dir = mkdtempSync(join(tmpdir(), 'mk-byte-identical-'));
  const claudeDir = join(dir, '.claude');
  mkdirSync(claudeDir, { recursive: true });
  const configPath = join(claudeDir, 'gsd-skill-creator.json');
  writeFileSync(configPath, JSON.stringify({
    'gsd-skill-creator': {
      'megakernel-substrate': {
        'instruction-tensor-schema': { enabled: value },
        'adapter-selection-schema': { enabled: value },
        'verification-doctrine': { enabled: value },
        'execution-trace-telemetry': { enabled: value },
        'sol-budget-guidance': { enabled: value },
        'jepa-planner-stub': { enabled: value },
      },
    },
  }));
  return { configPath, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

const ANY_INPUT = { kernelId: 'arbitrary', anything: true };
const ANY_WORKLOAD = { operatorClass: 'matmul' as const, flops: 1, bytes: 1 };
const ANY_GOAL = { vector: [0] };
const ANY_STATE = {
  kernelId: 'k', modelName: 'm', hardwareTarget: 'h',
  fusedOperatorCount: 0, syncCounterCount: 0,
};

describe('Megakernel substrate — byte-identical disabled-result invariant', () => {
  it('all public surfaces produce stable disabled-results when config missing', () => {
    const fixturePath = '/tmp/nonexistent/cfg.json';

    const itensor = validateInstructionTensor(ANY_INPUT, fixturePath);
    expect(itensor).toEqual({
      valid: true, disabled: true, errors: [], warnings: [],
    });

    const adapter = validateAdapterSelection(ANY_INPUT, undefined, fixturePath);
    expect(adapter).toEqual({
      valid: true, disabled: true, errors: [], warnings: [],
      totalVramMb: 0, uniqueBoundAdapters: 0,
    });

    const verify = auditVerificationSpec(ANY_INPUT, fixturePath);
    expect(verify).toEqual({ ok: true, disabled: true, findings: [] });

    const trace = record(ANY_INPUT, '/tmp/never-created', fixturePath);
    expect(trace).toEqual({ recorded: false, disabled: true, errors: [], bytesWritten: 0 });

    const traceRead = read('/tmp/whatever', fixturePath);
    expect(traceRead).toEqual({ events: [], disabled: true, errors: [] });

    const budget = computeBudgetGuidance(ANY_WORKLOAD, 1, RTX_4060_TI_ENVELOPE, {}, fixturePath);
    expect(budget).toEqual({
      sol: { minMicros: 0, computeBound: false, arithmeticIntensity: 0 },
      measuredMicros: 0,
      efficiencyRatio: 0,
      remainingBudget: 0,
      disabled: true,
    });

    const planner = makePlanner({ latentDim: 4 }, fixturePath);
    const plan = planner.plan(ANY_STATE, ANY_GOAL);
    expect(plan).toEqual({
      actions: [],
      predictedCost: Number.POSITIVE_INFINITY,
      executeFirstK: 0,
      disabled: true,
      errors: [],
    });
  });

  it('all public surfaces produce stable disabled-results when every flag is off', () => {
    const env = withAllSubstrateFlags(false);
    try {
      // Same fixture set; result must be byte-identical to the
      // missing-config case above (the disabled-result is the same sentinel).
      expect(validateInstructionTensor(ANY_INPUT, env.configPath)).toEqual({
        valid: true, disabled: true, errors: [], warnings: [],
      });
      expect(validateAdapterSelection(ANY_INPUT, undefined, env.configPath)).toEqual({
        valid: true, disabled: true, errors: [], warnings: [],
        totalVramMb: 0, uniqueBoundAdapters: 0,
      });
      expect(auditVerificationSpec(ANY_INPUT, env.configPath)).toEqual({
        ok: true, disabled: true, findings: [],
      });
      expect(record(ANY_INPUT, '/tmp/never-created', env.configPath)).toEqual({
        recorded: false, disabled: true, errors: [], bytesWritten: 0,
      });
      expect(read('/tmp/whatever', env.configPath)).toEqual({
        events: [], disabled: true, errors: [],
      });
      expect(computeBudgetGuidance(ANY_WORKLOAD, 1, RTX_4060_TI_ENVELOPE, {}, env.configPath)).toEqual({
        sol: { minMicros: 0, computeBound: false, arithmeticIntensity: 0 },
        measuredMicros: 0, efficiencyRatio: 0, remainingBudget: 0, disabled: true,
      });
      const planner = makePlanner({ latentDim: 4 }, env.configPath);
      expect(planner.plan(ANY_STATE, ANY_GOAL)).toEqual({
        actions: [], predictedCost: Number.POSITIVE_INFINITY,
        executeFirstK: 0, disabled: true, errors: [],
      });
    } finally { env.cleanup(); }
  });

  it('disabled-result objects are deterministically equal across calls (no per-call allocation drift)', () => {
    const env = withAllSubstrateFlags(false);
    try {
      const a = validateInstructionTensor(ANY_INPUT, env.configPath);
      const b = validateInstructionTensor(ANY_INPUT, env.configPath);
      expect(a).toEqual(b);
      expect(JSON.stringify(a)).toBe(JSON.stringify(b));

      const c = auditVerificationSpec(ANY_INPUT, env.configPath);
      const d = auditVerificationSpec(ANY_INPUT, env.configPath);
      expect(c).toEqual(d);
      expect(JSON.stringify(c)).toBe(JSON.stringify(d));
    } finally { env.cleanup(); }
  });

  it('JSON-canonicalized disabled-result fingerprints match the v1.49.574 fixture', () => {
    // Public-surface canonical JSON. If any of these strings change, the
    // public surface has changed and the change should be reviewed.
    const env = withAllSubstrateFlags(false);
    try {
      expect(JSON.stringify(validateInstructionTensor(ANY_INPUT, env.configPath)))
        .toBe('{"valid":true,"disabled":true,"errors":[],"warnings":[]}');

      expect(JSON.stringify(validateAdapterSelection(ANY_INPUT, undefined, env.configPath)))
        .toBe('{"valid":true,"disabled":true,"errors":[],"warnings":[],"totalVramMb":0,"uniqueBoundAdapters":0}');

      expect(JSON.stringify(auditVerificationSpec(ANY_INPUT, env.configPath)))
        .toBe('{"ok":true,"disabled":true,"findings":[]}');

      expect(JSON.stringify(record(ANY_INPUT, '/tmp/never-created', env.configPath)))
        .toBe('{"recorded":false,"disabled":true,"errors":[],"bytesWritten":0}');

      expect(JSON.stringify(read('/tmp/whatever', env.configPath)))
        .toBe('{"events":[],"disabled":true,"errors":[]}');

      expect(JSON.stringify(computeBudgetGuidance(ANY_WORKLOAD, 1, RTX_4060_TI_ENVELOPE, {}, env.configPath)))
        .toBe('{"sol":{"minMicros":0,"computeBound":false,"arithmeticIntensity":0},"measuredMicros":0,"efficiencyRatio":0,"remainingBudget":0,"disabled":true}');

      const planner = makePlanner({ latentDim: 4 }, env.configPath);
      expect(JSON.stringify(planner.plan(ANY_STATE, ANY_GOAL)))
        .toBe('{"actions":[],"predictedCost":null,"executeFirstK":0,"disabled":true,"errors":[]}');
      // Note: JSON.stringify maps Number.POSITIVE_INFINITY to null per the
      // spec; the disabled stub returns Infinity, so the canonical form is
      // "null" inside the JSON. The shape is otherwise byte-identical.
    } finally { env.cleanup(); }
  });
});
