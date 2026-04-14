/**
 * runCritiqueLoop — iterative critique orchestrator.
 *
 * Drives: draft → critique stages → revise → repeat
 * Termination: ConvergenceDetector (from src/eval/convergence-detector.ts) reports
 * convergence, stall detection (identical consecutive findings), or maxIterations cap.
 *
 * Dependency rule: imports ONLY ConvergenceDetector from ../eval/convergence-detector.js.
 * The other eval modules (driver, benchmark runner, grader) are NOT used here.
 */

import { ConvergenceDetector } from '../eval/convergence-detector.js';
import type {
  CritiqueFinding,
  CritiqueStage,
  CritiqueConfig,
  CritiqueIterationLog,
  CritiqueResult,
  SkillDraft,
} from './types.js';

// ============================================================================
// Injectable dependencies (allows deterministic testing without IO)
// ============================================================================

export interface CritiqueLoopDeps {
  /** Revise the draft based on findings; returns the updated draft. */
  revise(draft: SkillDraft, findings: CritiqueFinding[]): Promise<SkillDraft>;
  /** Hash the skill body to produce the sidecar skillHash. */
  hashBody(body: string): string;
  /** Optional clock for logging (defaults to Date.now). */
  now?: () => number;
}

// ============================================================================
// Stall detection helpers
// ============================================================================

/**
 * Produce a normalized key from a findings array for stall comparison.
 * Order-insensitive: sorts by (stage, severity, message, location.file, location.line).
 */
function findingsKey(findings: CritiqueFinding[]): string {
  const tuples = findings.map((f) =>
    [
      f.stage,
      f.severity,
      f.message,
      f.location?.file ?? '',
      String(f.location?.line ?? ''),
    ].join('\x00'),
  );
  return tuples.sort().join('\x01');
}

// ============================================================================
// runCritiqueLoop
// ============================================================================

/**
 * Run the iterative critique loop on an initial draft.
 *
 * @param initialDraft - The starting SkillDraft
 * @param stages - Ordered list of critique stages to run each iteration
 * @param config - Loop configuration
 * @param deps - Injectable IO dependencies
 * @returns CritiqueResult with termination status, logs, final draft, and skill hash
 */
export async function runCritiqueLoop(
  initialDraft: SkillDraft,
  stages: CritiqueStage[],
  config: CritiqueConfig,
  deps: CritiqueLoopDeps,
): Promise<CritiqueResult> {
  const now = deps.now ?? (() => Date.now());
  const windowSize = config.convergenceWindow ?? 2;
  const maxIterations = config.maxIterations ?? 5;

  const detector = new ConvergenceDetector(windowSize);
  const log: CritiqueIterationLog[] = [];

  let currentDraft = initialDraft;
  let previousFindingsKey: string | null = null;
  let finalFindings: CritiqueFinding[] = [];

  for (let i = 1; i <= maxIterations; i++) {
    const iterStart = now();

    // --- Run all stages in registration order ---
    const allFindings: CritiqueFinding[] = [];
    const perStageRates: Record<string, number> = {};
    const thresholds: Record<string, number> = {};

    for (const stage of stages) {
      const findings = await stage.run(currentDraft);
      // Stamp stage name on each finding if not already set
      for (const f of findings) {
        if (!f.stage) {
          (f as CritiqueFinding & { stage: string }).stage = stage.name;
        }
      }
      allFindings.push(...findings);

      // Pass rate for this stage: 1 if zero findings returned, else 0.
      // Track at collection time (not by re-filtering) so stage name vs
      // finding.stage mismatches don't cause false positives.
      perStageRates[stage.name] = findings.length === 0 ? 1 : 0;
      thresholds[stage.name] = 1;
    }

    const durationMs = now() - iterStart;

    log.push({ iteration: i, findings: allFindings, durationMs });
    finalFindings = allFindings;

    // --- Feed into ConvergenceDetector ---
    detector.recordIteration(perStageRates, thresholds);

    // --- Check convergence ---
    if (detector.isConverged()) {
      return {
        status: 'converged',
        iterations: i,
        finalFindings: [],
        log,
        draft: currentDraft,
        skillHash: deps.hashBody(currentDraft.body),
      };
    }

    // --- Stall detection ---
    if (config.stallDetection) {
      const currentKey = findingsKey(allFindings);
      if (previousFindingsKey !== null && currentKey === previousFindingsKey) {
        return {
          status: 'stalled',
          iterations: i,
          finalFindings,
          log,
          draft: currentDraft,
          skillHash: deps.hashBody(currentDraft.body),
        };
      }
      previousFindingsKey = currentKey;
    }

    // --- Revise draft for next iteration (only if not the last iteration) ---
    if (i < maxIterations) {
      currentDraft = await deps.revise(currentDraft, allFindings);
    }
  }

  // --- Max iterations reached ---
  return {
    status: 'max-iterations',
    iterations: maxIterations,
    finalFindings,
    log,
    draft: currentDraft,
    skillHash: deps.hashBody(currentDraft.body),
  };
}
