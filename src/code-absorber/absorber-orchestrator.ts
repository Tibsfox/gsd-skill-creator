/**
 * Wires the full absorption pipeline:
 *   CriteriaGate → OracleVerifier → CallSiteReplacer → InternalizationRegistry
 *
 * Blocks at the criteria gate (no registry entry); records oracle failures and
 * call-site failures before returning; only approved+complete absorptions reach
 * status='complete'.
 *
 * ABSB-01, ABSB-02, ABSB-03, ABSB-04, ABSB-05 — full pipeline.
 */

import { randomUUID } from 'node:crypto';
import { checkCriteria } from './absorption-criteria-gate.js';
import { runOracleVerification } from './oracle-verifier.js';
import { executeReplacementCycles } from './call-site-replacer.js';
import { appendRecord } from './internalization-registry.js';
import type { AbsorptionCandidate, AbsorptionRecord, CriteriaVerdict } from './types.js';
import type { OracleTestCase, OracleRunConfig } from './oracle-verifier.js';
import type { ReplacementCycleInput } from './call-site-replacer.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AbsorptionRequest {
  candidate: AbsorptionCandidate;
  algorithmName: string;
  /** Native implementation to verify against oracle. */
  nativeImpl: (...args: unknown[]) => unknown;
  /** Oracle test cases (≥10,000 for deterministic). */
  oracleTestCases: OracleTestCase[];
  oracleConfig: OracleRunConfig;
  /** Call site replacement inputs (verify fn + call sites). */
  callSiteInput: Omit<ReplacementCycleInput, 'packageName'>;
  /** Absolute path to the internalization-registry.jsonl file. */
  registryPath: string;
  /** Days to observe before marking the absorption complete. Default: 30. */
  observationPeriodDays?: number;
}

export type AbsorptionStatus =
  | 'criteria-blocked'
  | 'oracle-failed'
  | 'call-site-failed'
  | 'complete';

export interface AbsorptionOutcome {
  status: AbsorptionStatus;
  criteriaVerdict: CriteriaVerdict;
  /** null when status='criteria-blocked' — no registry entry created. */
  record: AbsorptionRecord | null;
}

// ─── Orchestrator ─────────────────────────────────────────────────────────────

export class AbsorberOrchestrator {
  /**
   * Runs the full absorption pipeline.
   *
   * Order: criteria gate → oracle → call-site replacement → registry.
   * Criteria block returns immediately with null record (ABSB-02 safety).
   * Oracle failure and call-site failure are both recorded (ABSB-05).
   */
  async absorb(request: AbsorptionRequest): Promise<AbsorptionOutcome> {
    // Step 1: Criteria gate (ABSB-01, ABSB-02)
    const verdict = checkCriteria(request.candidate);

    if (verdict.status !== 'approved') {
      // Hard-blocked or rejected — no absorption work, no registry entry
      return {
        status: 'criteria-blocked',
        criteriaVerdict: verdict,
        record: null,
      };
    }

    const now = new Date().toISOString();
    const observationPeriodDays = request.observationPeriodDays ?? 30;

    // Step 2: Oracle verification (ABSB-03)
    const oracleResult = runOracleVerification(
      request.nativeImpl,
      request.oracleTestCases,
      request.oracleConfig,
    );

    if (oracleResult.passedAt === null) {
      const record: AbsorptionRecord = {
        id: randomUUID(),
        packageName: request.candidate.packageName,
        ecosystem: request.candidate.ecosystem,
        algorithmName: request.algorithmName,
        sourcePackage: request.candidate.packageName,
        criteriaVerdict: verdict,
        oracleResult,
        callSiteCycles: [],
        dateAbsorbed: now,
        observationPeriodDays,
        observationPeriodComplete: false,
        status: 'failed',
      };
      await appendRecord(request.registryPath, record);
      return { status: 'oracle-failed', criteriaVerdict: verdict, record };
    }

    // Step 3: Call-site replacement (ABSB-04)
    const callSiteInput: ReplacementCycleInput = {
      packageName: request.candidate.packageName,
      ...request.callSiteInput,
    };
    const cycles = await executeReplacementCycles(callSiteInput);
    const hasCallSiteFailure = cycles.some(c => c.failedInCycle > 0);

    // Step 4: Registry record (ABSB-05)
    const record: AbsorptionRecord = {
      id: randomUUID(),
      packageName: request.candidate.packageName,
      ecosystem: request.candidate.ecosystem,
      algorithmName: request.algorithmName,
      sourcePackage: request.candidate.packageName,
      criteriaVerdict: verdict,
      oracleResult,
      callSiteCycles: cycles,
      dateAbsorbed: now,
      observationPeriodDays,
      observationPeriodComplete: false,
      status: hasCallSiteFailure ? 'failed' : 'complete',
    };

    await appendRecord(request.registryPath, record);

    return {
      status: hasCallSiteFailure ? 'call-site-failed' : 'complete',
      criteriaVerdict: verdict,
      record,
    };
  }
}
