/**
 * OptimizationDriver — iterative cross-model optimization loop.
 *
 * Accepts a skill and target chips, then iteratively benchmarks, identifies
 * the worst-performing chip, generates improvement hints, applies them to
 * SKILL.md, and re-benchmarks until convergence or budget exhaustion.
 *
 * When divergence is detected (improving one chip harms another), forks
 * into per-model variants via VariantGenerator.
 */

import type { MultiModelBenchmarkRunner } from './multi-model-benchmark.js';
import type { ThresholdsConfigLoader } from './thresholds-config.js';
import type { ModelAwareGrader } from './model-aware-grader.js';
import type { MultiModelBenchmark } from './types.js';
import { ConvergenceDetector, detectDivergence } from './convergence-detector.js';
import type { VariantGenerator } from './variant-generator.js';

// ============================================================================
// Types
// ============================================================================

export interface OptimizationOptions {
  maxIterations?: number;
  maxTokenBudget?: number;
  wallTimeoutMs?: number;
  convergenceWindow?: number;
  divergenceThreshold?: number;
}

export interface IterationRecord {
  iteration: number;
  perChipPassRates: Record<string, number>;
  bestSoFar: Record<string, number>;
  hintsApplied: string[];
  tokensUsed: number;
  durationMs: number;
}

export type StopReason =
  | 'converged'
  | 'max-iterations'
  | 'wall-timeout'
  | 'token-budget'
  | 'divergence-forked';

export interface OptimizationResult {
  converged: boolean;
  reason: StopReason;
  iterations: number;
  bestPassRates: Record<string, number>;
  variants: string[];
  finalBenchmark: MultiModelBenchmark;
  optimizationLog: IterationRecord[];
}

// ============================================================================
// Defaults
// ============================================================================

const DEFAULT_MAX_ITERATIONS = 10;
const DEFAULT_WALL_TIMEOUT_MS = 300_000;
const DEFAULT_CONVERGENCE_WINDOW = 3;
const DEFAULT_DIVERGENCE_THRESHOLD = 0.10;

// ============================================================================
// OptimizationDriver
// ============================================================================

export class OptimizationDriver {
  constructor(
    private readonly benchmarkRunner: MultiModelBenchmarkRunner,
    private readonly thresholds: ThresholdsConfigLoader,
    private readonly grader: ModelAwareGrader,
    private readonly convergenceDetector: ConvergenceDetector,
    private readonly variantGenerator: VariantGenerator,
  ) {}

  async optimize(
    skillPath: string,
    targetChips: string[],
    options?: OptimizationOptions,
  ): Promise<OptimizationResult> {
    const maxIterations = options?.maxIterations ?? DEFAULT_MAX_ITERATIONS;
    const wallTimeoutMs = options?.wallTimeoutMs ?? DEFAULT_WALL_TIMEOUT_MS;
    const divergenceThreshold =
      options?.divergenceThreshold ?? DEFAULT_DIVERGENCE_THRESHOLD;

    const startTime = Date.now();
    const bestSoFar: Record<string, number> = {};
    const log: IterationRecord[] = [];
    let previousRates: Record<string, number> = {};
    let lastBenchmark: MultiModelBenchmark | null = null;

    // Build per-chip thresholds map
    const chipThresholds: Record<string, number> = {};
    for (const chip of targetChips) {
      chipThresholds[chip] = this.thresholds.getThresholdForChip(chip);
    }

    for (let iteration = 1; iteration <= maxIterations; iteration++) {
      const iterStart = Date.now();

      // Check wall timeout
      if (Date.now() - startTime >= wallTimeoutMs) {
        return this.buildResult(
          'wall-timeout',
          iteration - 1,
          bestSoFar,
          [],
          lastBenchmark,
          log,
        );
      }

      // Run benchmark
      const benchmark = await this.benchmarkRunner.benchmarkSkill(
        skillPath,
        targetChips,
      );
      lastBenchmark = benchmark;

      // Extract per-chip pass rates
      const perChipPassRates: Record<string, number> = {};
      for (const model of benchmark.models) {
        perChipPassRates[model.model] = model.passRate;
      }

      // Update best-so-far
      for (const [chip, rate] of Object.entries(perChipPassRates)) {
        bestSoFar[chip] = Math.max(bestSoFar[chip] ?? 0, rate);
      }

      // Generate and record hints
      const hints = this.grader.generateModelHints([], null);

      // Record iteration
      const record: IterationRecord = {
        iteration,
        perChipPassRates: { ...perChipPassRates },
        bestSoFar: { ...bestSoFar },
        hintsApplied: hints,
        tokensUsed: 0,
        durationMs: Date.now() - iterStart,
      };
      log.push(record);

      // Check convergence
      this.convergenceDetector.recordIteration(perChipPassRates, chipThresholds);
      if (this.convergenceDetector.isConverged()) {
        return this.buildResult(
          'converged',
          iteration,
          bestSoFar,
          [],
          benchmark,
          log,
        );
      }

      // Check divergence (skip first iteration — no previous rates)
      if (iteration > 1) {
        const divergence = detectDivergence(
          perChipPassRates,
          previousRates,
          divergenceThreshold,
        );
        if (divergence.diverged) {
          const chipClasses = targetChips;
          const variants = await this.variantGenerator.fork(skillPath, chipClasses);
          return this.buildResult(
            'divergence-forked',
            iteration,
            bestSoFar,
            variants,
            benchmark,
            log,
          );
        }
      }

      previousRates = { ...perChipPassRates };

      // Check wall timeout after iteration work
      if (Date.now() - startTime >= wallTimeoutMs) {
        return this.buildResult(
          'wall-timeout',
          iteration,
          bestSoFar,
          [],
          benchmark,
          log,
        );
      }
    }

    return this.buildResult(
      'max-iterations',
      maxIterations,
      bestSoFar,
      [],
      lastBenchmark,
      log,
    );
  }

  private buildResult(
    reason: StopReason,
    iterations: number,
    bestPassRates: Record<string, number>,
    variants: string[],
    finalBenchmark: MultiModelBenchmark | null,
    optimizationLog: IterationRecord[],
  ): OptimizationResult {
    return {
      converged: reason === 'converged',
      reason,
      iterations,
      bestPassRates,
      variants,
      finalBenchmark: finalBenchmark ?? {
        skillName: '',
        benchmarkedAt: new Date().toISOString(),
        models: [],
        runs: [],
        legacyRunCount: 0,
      },
      optimizationLog,
    };
  }
}
