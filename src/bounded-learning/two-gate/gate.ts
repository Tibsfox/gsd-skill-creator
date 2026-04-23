/**
 * Two-Gate Guardrail — evaluation function.
 *
 * Pure function. Emits no I/O on its own; the log-record shape is returned
 * to the caller, which decides whether to write to disk/stdout/telemetry.
 *
 * Default-off guarantee: nothing runs on import.
 *
 * @module bounded-learning/two-gate/gate
 */

import type {
  TwoGateParams,
  GateInputs,
  TwoGateResult,
  TwoGateLogRecord,
  GSDCapRealization,
} from './types.js';
import { DEFAULT_K0, DEFAULT_TAU } from './types.js';

/** Default capacity cap K[m] = k0 * sqrt(m) (Wang-Dorchen sqrt-scaling). */
export function sqrtScalingCap(k0: number = DEFAULT_K0): (m: number) => number {
  return (m: number) => k0 * Math.sqrt(Math.max(0, m));
}

/** Build Two-Gate parameters with sensible defaults. */
export function buildParams(overrides: Partial<TwoGateParams> = {}): TwoGateParams {
  return {
    tau: overrides.tau ?? DEFAULT_TAU,
    capacityCap: overrides.capacityCap ?? sqrtScalingCap(),
    label: overrides.label ?? 'gsd-skill-creator.default',
  };
}

/**
 * Evaluate the Two-Gate guardrail for a single update proposal.
 *
 * Gate 1 (tau): pass iff (proposedAccuracy - currentAccuracy) >= tau
 * Gate 2 (K[m]): pass iff proposedCapacity <= capacityCap(sampleSize)
 * Overall: pass iff both gates pass.
 */
export function evaluateTwoGate(
  params: TwoGateParams,
  inputs: GateInputs,
): TwoGateResult {
  const gap = inputs.proposedAccuracy - inputs.currentAccuracy;
  const tauPass = gap >= params.tau;
  const cap = params.capacityCap(inputs.sampleSize);
  const capPass = inputs.proposedCapacity <= cap;

  // Wang-Dorchen oracle inequality at VC rates:
  //   bound = O(sqrt((d + log(1/delta)) / m))
  // We use the proxy: bound = sqrt(proposedCapacity / max(1, sampleSize))
  // which preserves the monotonicity; callers log this for audit.
  const oracleInequalityBound = Math.sqrt(
    inputs.proposedCapacity / Math.max(1, inputs.sampleSize),
  );

  const tauReason = tauPass
    ? `validation gap ${gap.toFixed(4)} >= tau ${params.tau}`
    : `validation gap ${gap.toFixed(4)} < tau ${params.tau}`;
  const capReason = capPass
    ? `proposedCapacity ${inputs.proposedCapacity} <= K[m] ${cap.toFixed(4)}`
    : `proposedCapacity ${inputs.proposedCapacity} > K[m] ${cap.toFixed(4)}`;

  const pass = tauPass && capPass;
  const summary = pass
    ? `Two-Gate PASS (${params.label}): both gates hold; oracle bound ${oracleInequalityBound.toFixed(4)}`
    : `Two-Gate FAIL (${params.label}): ${!tauPass ? 'tau' : ''}${!tauPass && !capPass ? ' + ' : ''}${!capPass ? 'K[m]' : ''}`;

  return {
    pass,
    tauGate: {
      pass: tauPass,
      required: params.tau,
      observed: gap,
      reason: tauReason,
    },
    capacityGate: {
      pass: capPass,
      cap,
      observed: inputs.proposedCapacity,
      reason: capReason,
    },
    oracleInequalityBound,
    summary,
  };
}

/** Produce a log-record shape for caller-side persistence. */
export function buildLogRecord(
  params: TwoGateParams,
  inputs: GateInputs,
  result: TwoGateResult,
  timestamp: string = new Date().toISOString(),
): TwoGateLogRecord {
  return {
    type: 'bounded-learning.two-gate.evaluation',
    timestamp,
    phase: inputs.phase,
    params: { tau: params.tau, label: params.label },
    inputs,
    result,
  };
}

/**
 * Documentation helper: the gsd-skill-creator 20% content-change cap,
 * 3-correction minimum, and 7-day cooldown mapped onto Two-Gate K[m].
 */
export function gsdCapRealization(): GSDCapRealization {
  return {
    contentChangeCapPercent: 20,
    correctionMinimum: 3,
    cooldownDays: 7,
    mappedToKm:
      'The 20% content-change cap bounds per-update capacity growth. The ' +
      '3-correction minimum enforces validation of each update against multiple ' +
      'oracle signals before K[m] is reassessed upward. The 7-day cooldown ' +
      'prevents rapid K[m] inflation via usage-trust promotion. Together they ' +
      'are the gsd-skill-creator practical realization of the Wang-Dorchen ' +
      'capacity cap K[m]; CAPCOM boundary validation realizes the tau gate.',
  };
}
