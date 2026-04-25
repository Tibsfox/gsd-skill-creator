/**
 * Rumor Delay Model — SENTINEL/ANALYST upstream-intelligence hook.
 *
 * Read-only integration hook that takes rumor observations from the SENTINEL
 * ingestion stream and outputs signal-vs-hype classification to ANALYST.
 *
 * ## Design constraints (CAPCOM composition gate G14)
 *
 * This module MUST NOT:
 *   - mutate any existing pipeline behavior when the flag is off
 *   - import from or modify src/orchestration/, src/capcom/, src/dacp/, or
 *     any existing production code path
 *   - alter CAPCOM-gate authority surfaces
 *
 * When `upstream-intelligence.rumor-delay-model.enabled` is false (or
 * unreadable), every call to `classifyClaimStream` returns the byte-identical
 * passthrough result:
 *
 *   { disabled: true, classification: 'unknown' }
 *
 * This is the flag-off guarantee required by m7-capcom-revision.tex §4:
 * "with flag off, SENTINEL uses the existing manual threshold byte-identically."
 *
 * ## Claim Age Gate (τ)
 * Claims older than τ time units (default 24h) at evaluation time are
 * quarantined pending explicit fact-check before ANALYST admission.
 * (m7-capcom-revision.tex §4 Claim Age Gate)
 *
 * ## Influence Threshold Gate (ρ*)
 * Claims with influence score ρ > ρ* (default 1.0) enter an expedited
 * verification queue.
 * (m7-capcom-revision.tex §4 Influence Threshold Gate)
 *
 * ## Reference
 *
 * Alyami, Hamadouche, Hussain. "Stochastic Delayed Dynamics of Rumor
 * Propagation with Awareness and Fact-Checking." arXiv:2604.17368, 2026.
 * CAPCOM revision spec: m7-capcom-revision.tex §4 (SENTINEL/ANALYST Misinfo
 * Handling). Module analysis: module_7.tex §7.2 (Rumor Propagation Flagship).
 *
 * @module rumor-delay-model/sentinel-analyst-hook
 */

import type { Rumor, SignalObservation, SignalClassification } from './types.js';
import { isRumorDelayModelEnabled, readRumorDelayModelConfig } from './settings.js';

// ---------------------------------------------------------------------------
// Claim assessment types
// ---------------------------------------------------------------------------

/**
 * Assessment outcome for a single claim entering the SENTINEL pipeline.
 *
 * When the flag is off, `verdict` is always 'pass-through' and no gates fire.
 */
export interface ClaimAssessment {
  /** The claim that was assessed. */
  readonly rumor: Rumor;

  /**
   * Gate verdict:
   *   'pass-through' — flag off; existing pipeline behavior preserved.
   *   'admitted'     — claim passes both Age Gate and Influence Gate; ANALYST may proceed.
   *   'quarantined'  — claim older than τ; pending explicit fact-check.
   *   'expedited'    — claim influence ρ > ρ*; enters expedited verification queue.
   */
  readonly verdict: 'pass-through' | 'admitted' | 'quarantined' | 'expedited';

  /**
   * Human-readable reason for the verdict.
   */
  readonly reason: string;

  /**
   * Claim age in milliseconds at evaluation time.
   * Present when submittedAtMs was supplied on the Rumor.
   */
  readonly claimAgeMs?: number;

  /**
   * Whether the flag was off at call time.
   */
  readonly disabled?: true;
}

/**
 * Result of a stream classification pass (multiple claims → one result per claim).
 */
export interface StreamClassificationResult {
  /** Per-claim assessments. */
  readonly assessments: ReadonlyArray<ClaimAssessment>;

  /** Aggregate signal-vs-hype classification for the stream. */
  readonly aggregate: SignalClassification;

  /** Whether the module was disabled at call time. */
  readonly disabled?: true;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Default τ in milliseconds: 24 hours.
 * Maps to the claim-age threshold in m7-capcom-revision.tex §4 Claim Age Gate.
 */
const DEFAULT_TAU_MS = 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Public hook API
// ---------------------------------------------------------------------------

/**
 * Classify a stream of rumor observations from SENTINEL.
 *
 * Read-only — does not alter any pipeline state. Returns per-claim assessments
 * and an aggregate signal-vs-hype classification for ANALYST.
 *
 * **Flag-off guarantee**: when `enabled` is false (default), returns
 * `{ disabled: true, classification: 'unknown' }` for every claim and for the
 * aggregate. The existing pipeline sees no change in behavior.
 *
 * @param rumors         Claims from the SENTINEL ingestion stream.
 * @param observations   Optional stream of rumorist-fraction observations for
 *                       signal-vs-hype trajectory analysis. When empty or absent,
 *                       the trajectory-based classification is 'unknown'.
 * @param evaluationMs   Evaluation timestamp (Unix ms). Defaults to Date.now().
 * @param tauMs          Claim-age threshold in ms. Defaults to 24h.
 * @param settingsPath   Optional override for the settings file path.
 */
export function classifyClaimStream(
  rumors: ReadonlyArray<Rumor>,
  observations: ReadonlyArray<SignalObservation> = [],
  evaluationMs = Date.now(),
  tauMs = DEFAULT_TAU_MS,
  settingsPath?: string,
): StreamClassificationResult {
  const enabled = isRumorDelayModelEnabled(settingsPath);

  if (!enabled) {
    // Flag-off: byte-identical passthrough — no gates fire
    const disabledAssessments: ClaimAssessment[] = rumors.map((rumor) => ({
      rumor,
      verdict: 'pass-through',
      reason: 'rumor-delay-model flag is off; existing pipeline behavior preserved.',
      disabled: true,
    }));
    return {
      assessments: disabledAssessments,
      aggregate: { classification: 'unknown', disabled: true },
      disabled: true,
    };
  }

  const config = readRumorDelayModelConfig(settingsPath);
  const { influenceThreshold, noiseToleranceSigma } = config;
  // Effective ρ* band: [threshold - noiseToleranceSigma, threshold + noiseToleranceSigma]
  const rhoStarLow = influenceThreshold - noiseToleranceSigma * 0.1; // small noise band
  const rhoStarHigh = influenceThreshold + noiseToleranceSigma * 0.1;

  // Per-claim assessment
  const assessments: ClaimAssessment[] = rumors.map((rumor) => {
    // Claim Age Gate
    if (rumor.submittedAtMs !== undefined) {
      const ageMs = evaluationMs - rumor.submittedAtMs;
      if (ageMs > tauMs) {
        return {
          rumor,
          verdict: 'quarantined',
          reason: `Claim age ${ageMs}ms exceeds τ=${tauMs}ms; quarantined pending fact-check (arXiv:2604.17368 §2 delay term).`,
          claimAgeMs: ageMs,
        };
      }
    }

    // Influence Threshold Gate
    const rho = rumor.influenceScore;
    // The noise-tolerance band widens the threshold: if ρ > ρ* + band it is
    // unambiguously above; if ρ > ρ* - band it enters expedited queue to be safe.
    if (rho > rhoStarLow) {
      const verdict: ClaimAssessment['verdict'] = rho > rhoStarHigh ? 'expedited' : 'expedited';
      return {
        rumor,
        verdict,
        reason: `Influence score ρ=${rho.toFixed(3)} exceeds threshold ρ*=${influenceThreshold} (±${noiseToleranceSigma}σ band); entering expedited fact-check queue (arXiv:2604.17368 §4 Influence Gate).`,
        claimAgeMs: rumor.submittedAtMs !== undefined ? evaluationMs - rumor.submittedAtMs : undefined,
      };
    }

    return {
      rumor,
      verdict: 'admitted',
      reason: `Claim passes Age Gate and Influence Gate; admitted to ANALYST (arXiv:2604.17368 §3 stable equilibrium).`,
      claimAgeMs: rumor.submittedAtMs !== undefined ? evaluationMs - rumor.submittedAtMs : undefined,
    };
  });

  // Aggregate signal-vs-hype from observation stream
  const aggregate = classifyObservationStream(observations);

  return { assessments, aggregate };
}

/**
 * Classify a stream of SignalObservations into signal-vs-hype.
 *
 * Heuristic: if the rumorist fraction is still above 50% of peak at the last
 * observation, the trajectory is 'hype' (sustained spread, R₀ > 1 consistent).
 * Otherwise it is 'signal' (peak-then-decay, R₀ < 1 consistent).
 *
 * Minimum 3 observations required; fewer → 'unknown'.
 */
function classifyObservationStream(
  observations: ReadonlyArray<SignalObservation>,
): SignalClassification {
  if (observations.length < 3) {
    return { classification: 'unknown' };
  }

  // Find peak rumorist fraction
  let peak = 0;
  let peakIdx = 0;
  for (let i = 0; i < observations.length; i++) {
    if (observations[i].rumoristFraction > peak) {
      peak = observations[i].rumoristFraction;
      peakIdx = i;
    }
  }

  if (peak === 0) {
    return { classification: 'signal', estimatedR0: 0, peakRumoristFraction: 0 };
  }

  // Last observation rumorist fraction
  const last = observations[observations.length - 1];
  const finalFraction = last.rumoristFraction / peak;

  // Estimate R₀: if final/peak > 0.5 → sustained → R₀ > 1 territory
  // This is a qualitative heuristic, not the exact SDDE formula
  const estimatedR0 = finalFraction > 0.5 ? 1.2 : 0.7;
  const classification: 'signal' | 'hype' = finalFraction > 0.5 ? 'hype' : 'signal';

  // Suppress unused variable warning
  void peakIdx;

  return {
    classification,
    estimatedR0,
    peakRumoristFraction: peak,
  };
}

// Re-export for convenience
export { isRumorDelayModelEnabled, readRumorDelayModelConfig };
