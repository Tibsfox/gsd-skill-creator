/**
 * ME-3 Skill A/B Harness — Coordinator.
 *
 * Orchestrates the full A/B lifecycle on top of M4 primitives:
 *
 *   1. fork()    — create variant B branch from parent skill body.
 *   2. explore() — run both A (trunk) and B (branch) for N sessions, collecting
 *                  per-session scores via a caller-supplied scorer.
 *   3. evaluate  — run the significance test (stats.ts) with the
 *                  tractability-weighted noise floor.
 *   4. commit() / abort() — commit B if verdict is 'commit-B'; abort otherwise.
 *
 * The coordinator WRAPS M4 primitives — it never bypasses them.  The branch
 * commit gate is enforced here: commit() is called only when the ABVerdict
 * says 'commit-B', and abort() is called in all other resolved cases.
 *
 * Feature flag (SC-ME3-01): when `isABHarnessEnabled()` returns false the
 * coordinator returns immediately with outcome='disabled'.
 *
 * Tractability-weighted noise floor (CF-ME3-03):
 *   tractable  → floor = baseFloor × 1.0
 *   unknown    → floor = baseFloor × 1.5
 *   coin-flip  → floor = baseFloor × 2.5
 *
 * Classification-audit warning (CF-ME3-04): when a coin-flip-classified skill
 * shows 'commit-B', the verdict carries a warning per the E-5 open question.
 *
 * IID caveat (E-4 open question): sessions are treated as independent; the
 * coordinator records this assumption in the verdict warnings.
 *
 * Phase 671, Wave R8 (ME-3).
 *
 * @module ab-harness/coordinator
 */

import { fork as m4Fork, type ForkOptions } from '../branches/fork.js';
import { explore as m4Explore, type RunSkillFn } from '../branches/explore.js';
import { commit as m4Commit } from '../branches/commit.js';
import { abort as m4Abort } from '../branches/abort.js';
import type { TractabilityClass } from '../tractability/selector-api.js';
import { runSignificanceTest, type ABDecision, type SignificanceResult } from './stats.js';
import { requiredSampleSize } from './sample-size.js';
import { isABHarnessEnabled, type ABHarnessSettings } from './settings.js';
import { observeKAxes, DEFAULT_LOG_PATH as DEFAULT_KAXIS_LOG_PATH } from './k-axis-telemetry.js';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Per-session score emitted by the caller's scorer. */
export interface ABOutcome {
  /** Session identifier (e.g. '1', '2', etc.). */
  session: string;
  /** Which variant this score belongs to. */
  variant: 'A' | 'B';
  /** Numeric score (higher = better). Range is open; noise floor is on the same scale. */
  score: number;
}

/** Four-verdict decision surface (Zhang 2026 §4.3 + CF-ME3-01..05). */
export type ABVerdict = {
  /** Total number of sessions run (A + B). */
  nRuns: number;
  /** mean(B) − mean(A); NaN when insufficient data. */
  meanDelta: number;
  /** Two-sided sign-test p-value; NaN when insufficient or coin-flip. */
  signTest: number;
  /** Tractability-weighted noise floor used for this test. */
  noiseFloor: number;
  /** Final decision. */
  decision: ABDecision;
  /** ME-1 classification of the skill under test. */
  tractability: TractabilityClass;
  /**
   * Advisory warnings.  Always includes the IID caveat (E-4) unless PE
   * certificate is available (future MB-4 integration).  May include the
   * E-5 classification-audit warning when a coin-flip skill commits.
   */
  warnings: string[];
};

/** Result returned by `runAB`. */
export type ABRunOutcome =
  | { status: 'disabled' }
  | { status: 'completed'; verdict: ABVerdict; committed: boolean }
  | { status: 'error'; error: string };

// ─── Noise floor scaling (CF-ME3-03) ────────────────────────────────────────

const TRACTABILITY_SCALE: Record<TractabilityClass, number> = {
  tractable: 1.0,
  unknown: 1.5,
  'coin-flip': 2.5,
};

/** Zhang 2026 §4.3 2pt default. */
const BASE_NOISE_FLOOR = 2.0;

function computeNoiseFloor(tractability: TractabilityClass, base = BASE_NOISE_FLOOR): number {
  return base * TRACTABILITY_SCALE[tractability];
}

// ─── Coordinator options ─────────────────────────────────────────────────────

export interface RunABOptions {
  /** Skill name being A/B tested. */
  skillName: string;

  /** Current (trunk) skill body — variant A. */
  trunkBody: string;

  /** Proposed (variant B) skill body. */
  variantBody: string;

  /** Absolute or relative path to the trunk skill file (for M4 commit). */
  trunkPath: string;

  /**
   * ME-1 tractability class of the skill.
   * Drives noise floor and recommended sample size.
   */
  tractability: TractabilityClass;

  /**
   * Number of sessions to run per variant.  Defaults to
   * `requiredSampleSize(tractability)`.
   */
  samplesPerVariant?: number;

  /**
   * Significance threshold alpha.  Default 0.10 per spec.
   */
  alpha?: number;

  /**
   * Zhang 2026 §4.3 base noise floor.  Default 2.0.
   */
  baseNoiseFloor?: number;

  /**
   * Root directory for M4 branches.  Defaults to `.planning/branches`.
   */
  branchesDir?: string;

  /**
   * Directory for M3 trace files.  Defaults to `.planning/traces/branches`.
   */
  traceDir?: string;

  /**
   * Caller-supplied skill runner.  Receives the skill body and session index;
   * returns a score string.  The coordinator converts the return to a number via
   * `parseFloat`; callers should return numeric strings (e.g. '82.5').
   *
   * The scorer is called for BOTH trunk (A) and branch (B) every session.
   * The `variant` parameter tells the scorer which variant it is running.
   */
  runSkill: (skillBody: string, sessionIndex: number, variant: 'A' | 'B') => Promise<string>;

  /**
   * Feature-flag settings override.  When omitted, `isABHarnessEnabled()`
   * checks the environment variable.
   */
  settings?: ABHarnessSettings;

  /** Override branch ID for deterministic tests. */
  branchId?: string;

  /** Override fork timestamp for tests. */
  ts?: number;

  /**
   * JP-010a — opt-in K-axis telemetry. When supplied, the coordinator records
   * one K-axis observation per completed (or commit-decided) experiment via
   * `observeKAxes`. Telemetry failure is non-fatal: the experiment outcome is
   * unaffected if the JSONL append fails (e.g., read-only filesystem).
   *
   * When omitted, no telemetry is emitted and JP-010b falls back to K=3.
   *
   * Note: telemetry runs only on `status: 'completed'` outcomes. Disabled and
   * error paths do not emit observations.
   */
  kAxes?: {
    /** Domain the skill operates in (e.g. 'typescript', 'data-analysis'). */
    userDomain: string;
    /** Caller-estimated expertise level. */
    expertiseLevel: 'beginner' | 'intermediate' | 'expert' | 'unknown';
    /** Session context. */
    sessionType: 'interactive' | 'batch' | 'ci' | 'unknown';
    /** Optional extra axes preserved verbatim in the JSONL line. */
    extraAxes?: Record<string, string>;
    /** Override JSONL log path (defaults to DEFAULT_LOG_PATH). */
    logPath?: string;
  };
}

// ─── Coordinator ─────────────────────────────────────────────────────────────

/**
 * Run a full A/B skill comparison lifecycle.
 *
 * When the harness is disabled (SC-ME3-01), returns `{ status: 'disabled' }`
 * immediately without touching M4 state.
 *
 * When enabled:
 *   1. Forks variant B via M4 `fork()`.
 *   2. Explores N sessions via M4 `explore()`, collecting per-session scores.
 *   3. Runs significance test.
 *   4. Commits B (via M4 `commit()`) when verdict is 'commit-B'; otherwise
 *      aborts the branch (via M4 `abort()`).
 *   5. Returns the verdict + committed flag.
 */
export async function runAB(opts: RunABOptions): Promise<ABRunOutcome> {
  // ── Feature flag ────────────────────────────────────────────────────────────
  if (!isABHarnessEnabled(opts.settings)) {
    return { status: 'disabled' };
  }

  try {
    const {
      skillName,
      trunkBody,
      variantBody,
      trunkPath,
      tractability,
      samplesPerVariant,
      alpha = 0.10,
      baseNoiseFloor = BASE_NOISE_FLOOR,
      branchesDir = '.planning/branches',
      traceDir = '.planning/traces/branches',
      runSkill,
      branchId,
      ts,
    } = opts;

    const n = samplesPerVariant ?? requiredSampleSize(tractability, 0, alpha);
    const noiseFloor = computeNoiseFloor(tractability, baseNoiseFloor);

    // ── 1. Fork ────────────────────────────────────────────────────────────────
    const forkResult = await m4Fork({
      parentBody: trunkBody,
      proposedBody: variantBody,
      skillName,
      branchesDir,
      branchId,
      ts,
    });
    const bid = forkResult.manifest.id;

    // ── 2. Explore ─────────────────────────────────────────────────────────────
    // Wrap runSkill to match M4's RunSkillFn signature.
    // M4 explore calls runSkill(body, sessionIndex) for BOTH trunk and branch;
    // we need to know which variant is running.
    // We capture outcomes in a separate array and pass a RunSkillFn that tags
    // the variant from context (trunk call is first, branch call is second per session).
    const outcomes: ABOutcome[] = [];
    let sessionCounter = 0;

    const runSkillFn: RunSkillFn = async (skillBody, sessionIndex) => {
      // Determine variant by comparing body to trunk vs branch.
      // M4 explore always calls trunk first, then branch, per session.
      // We track parity within each session pair.
      const isTrunk = skillBody === trunkBody;
      const variant = isTrunk ? 'A' : 'B';
      const output = await runSkill(skillBody, sessionIndex, variant);
      const score = parseFloat(output);
      outcomes.push({
        session: String(sessionIndex),
        variant,
        score: Number.isFinite(score) ? score : 0,
      });
      if (!isTrunk) sessionCounter++;
      return output;
    };

    await m4Explore({
      branchId: bid,
      branchesDir,
      trunkBody,
      sessionCount: n,
      runSkill: runSkillFn,
      traceDir,
    });

    // ── 3. Significance test ───────────────────────────────────────────────────
    const scoresA = outcomes.filter(o => o.variant === 'A').map(o => o.score);
    const scoresB = outcomes.filter(o => o.variant === 'B').map(o => o.score);
    const sigResult: SignificanceResult = runSignificanceTest(
      scoresA,
      scoresB,
      noiseFloor,
      alpha,
    );

    // ── 4. Build verdict ───────────────────────────────────────────────────────
    const warnings: string[] = [];

    // E-4 IID caveat — always present until MB-4 PE certificate lands.
    warnings.push(
      'E-4: sessions are treated as i.i.d.; ANOVA assumptions may not hold ' +
      'on correlated session streams. MB-4 PE certificate required for full validity.',
    );

    // CF-ME3-04: classification-audit warning when coin-flip skill commits.
    if (tractability === 'coin-flip' && sigResult.decision === 'commit-B') {
      warnings.push(
        'E-5: coin-flip-classified skill shows decisive commit-B effect — ' +
        'consider reclassifying as tractable or hybrid (ME-1 audit).',
      );
    }

    // Below-20 sample warning (failure mode #1 mitigation).
    const actualN = Math.min(scoresA.length, scoresB.length);
    if (actualN < 20) {
      warnings.push(
        `Small sample (${actualN} per variant < 20 recommended); ` +
        'false-positive risk is elevated. Increase --samples for reliability.',
      );
    }

    const meanA = scoresA.length > 0 ? scoresA.reduce((s, v) => s + v, 0) / scoresA.length : NaN;
    const meanB = scoresB.length > 0 ? scoresB.reduce((s, v) => s + v, 0) / scoresB.length : NaN;

    const verdict: ABVerdict = {
      nRuns: scoresA.length + scoresB.length,
      meanDelta: meanB - meanA,
      signTest: sigResult.p_value,
      noiseFloor,
      decision: sigResult.decision,
      tractability,
      warnings,
    };

    // ── 5. Commit or abort ─────────────────────────────────────────────────────
    let committed = false;
    if (verdict.decision === 'commit-B') {
      // CF-ME3-05: only commit when verdict explicitly says 'commit-B'.
      await m4Commit({
        branchId: bid,
        branchesDir,
        trunkPath,
        ts,
        emitReinforcement: false, // coordinator manages reinforcement via AB layer
      });
      committed = true;
    } else {
      await m4Abort({
        branchId: bid,
        branchesDir,
        ts,
        emitReinforcement: false,
      });
    }

    // JP-010a — opt-in K-axis observation. Non-fatal on failure: the
    // experiment outcome is what callers care about; telemetry is best-effort.
    if (opts.kAxes) {
      try {
        await observeKAxes({
          logPath: opts.kAxes.logPath ?? DEFAULT_KAXIS_LOG_PATH,
          observation: {
            timestamp: new Date().toISOString(),
            experimentId: bid,
            userDomain: opts.kAxes.userDomain,
            expertiseLevel: opts.kAxes.expertiseLevel,
            sessionType: opts.kAxes.sessionType,
            extraAxes: opts.kAxes.extraAxes,
          },
        });
      } catch {
        // swallowed — telemetry must never affect verdict
      }
    }

    return { status: 'completed', verdict, committed };
  } catch (err) {
    return {
      status: 'error',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ─── Re-exports for API consumers ────────────────────────────────────────────

export type { ABDecision, SignificanceResult } from './stats.js';
export type { TractabilityClass } from '../tractability/selector-api.js';
