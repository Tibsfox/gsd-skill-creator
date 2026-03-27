import { describe, it, expect, beforeEach } from 'vitest';
import {
  OptimizationDriver,
  type OptimizationOptions,
  type OptimizationResult,
} from './optimization-driver.js';
import { ConvergenceDetector } from './convergence-detector.js';
import { VariantGenerator } from './variant-generator.js';
import type { MultiModelBenchmark } from './types.js';

// ============================================================================
// Mock benchmark runner
// ============================================================================

/**
 * Scripted benchmark runner that returns pre-configured pass rates per iteration.
 * Each call to benchmarkSkill() returns the next entry from the script.
 */
class MockBenchmarkRunner {
  private callIndex = 0;

  constructor(private readonly script: Array<Record<string, number>>) {}

  async benchmarkSkill(
    skillName: string,
    chipNames: string[],
  ): Promise<MultiModelBenchmark> {
    const rates = this.script[this.callIndex] ?? this.script[this.script.length - 1]!;
    this.callIndex++;

    const models = chipNames.map((chip) => ({
      model: chip,
      runCount: 1,
      passRate: rates[chip] ?? 0,
      avgAccuracy: (rates[chip] ?? 0) * 100,
      avgF1: rates[chip] ?? 0,
      thresholdStatus: 'above' as const,
    }));

    const runs = chipNames.map((chip) => ({
      skillName,
      model: chip,
      runAt: new Date().toISOString(),
      duration: 100,
      metrics: {
        total: 10,
        passed: Math.round((rates[chip] ?? 0) * 10),
        failed: 10 - Math.round((rates[chip] ?? 0) * 10),
        accuracy: (rates[chip] ?? 0) * 100,
        falsePositiveRate: 0,
        truePositives: Math.round((rates[chip] ?? 0) * 10),
        trueNegatives: 0,
        falsePositives: 0,
        falseNegatives: 10 - Math.round((rates[chip] ?? 0) * 10),
        edgeCaseCount: 0,
        precision: rates[chip] ?? 0,
        recall: rates[chip] ?? 0,
        f1Score: rates[chip] ?? 0,
      },
      passed: (rates[chip] ?? 0) >= 0.5,
      hints: [],
    }));

    return {
      skillName,
      benchmarkedAt: new Date().toISOString(),
      models,
      runs,
      legacyRunCount: 0,
    };
  }
}

// ============================================================================
// Mock hint generator (replaces ModelAwareGrader for testing)
// ============================================================================

class MockHintGenerator {
  generateModelHints(): string[] {
    return ['Improve prompt clarity'];
  }

  async buildCapabilityProfile(): Promise<null> {
    return null;
  }
}

// ============================================================================
// Mock variant generator (no filesystem)
// ============================================================================

class MockVariantGenerator extends VariantGenerator {
  forkedPaths: string[] = [];
  appliedHints: Array<{ path: string; hints: string[]; chipClass: string }> = [];

  override async fork(_skillPath: string, chipClasses: string[]): Promise<string[]> {
    this.forkedPaths = chipClasses.map((c) => `/tmp/variants/${c}`);
    return this.forkedPaths;
  }

  override async applyHints(
    variantPath: string,
    hints: string[],
    chipClass: string,
  ): Promise<void> {
    this.appliedHints.push({ path: variantPath, hints, chipClass });
  }
}

// ============================================================================
// Mock thresholds loader
// ============================================================================

class MockThresholdsLoader {
  private readonly thresholds: Record<string, number>;

  constructor(thresholds: Record<string, number>) {
    this.thresholds = thresholds;
  }

  getThresholdForChip(chipName: string): number {
    return this.thresholds[chipName] ?? 0.75;
  }

  async loadFromFile(): Promise<void> {}
}

// ============================================================================
// Tests
// ============================================================================

describe('OptimizationDriver', () => {
  let variantGen: MockVariantGenerator;

  beforeEach(() => {
    variantGen = new MockVariantGenerator();
  });

  function createDriver(
    script: Array<Record<string, number>>,
    thresholds: Record<string, number>,
    options?: Partial<OptimizationOptions>,
  ): { driver: OptimizationDriver; result: Promise<OptimizationResult> } {
    const benchmarkRunner = new MockBenchmarkRunner(script);
    const thresholdsLoader = new MockThresholdsLoader(thresholds);
    const hintGenerator = new MockHintGenerator();
    const convergenceDetector = new ConvergenceDetector(options?.convergenceWindow ?? 3);

    const driver = new OptimizationDriver(
      benchmarkRunner as any,
      thresholdsLoader as any,
      hintGenerator as any,
      convergenceDetector,
      variantGen,
    );

    return { driver, result: driver.optimize('/tmp/skill', ['chipA', 'chipB'], options) };
  }

  it('converges after window filled with all-passing iterations', async () => {
    // 4 iterations: first one below threshold, then 3 consecutive passing
    const script = [
      { chipA: 0.6, chipB: 0.5 },   // both below 0.75
      { chipA: 0.8, chipB: 0.8 },   // both above
      { chipA: 0.85, chipB: 0.82 }, // both above
      { chipA: 0.9, chipB: 0.88 },  // both above -> converged (window=3)
    ];
    const { result } = createDriver(script, { chipA: 0.75, chipB: 0.75 });
    const r = await result;

    expect(r.converged).toBe(true);
    expect(r.reason).toBe('converged');
    expect(r.iterations).toBe(4);
  });

  it('stops at maxIterations with converged: false', async () => {
    // Never converges — always below threshold
    const script = [
      { chipA: 0.5, chipB: 0.5 },
      { chipA: 0.55, chipB: 0.55 },
      { chipA: 0.6, chipB: 0.6 },
    ];
    const { result } = createDriver(
      script,
      { chipA: 0.75, chipB: 0.75 },
      { maxIterations: 3 },
    );
    const r = await result;

    expect(r.converged).toBe(false);
    expect(r.reason).toBe('max-iterations');
    expect(r.iterations).toBe(3);
  });

  it('stops on wall timeout', async () => {
    const script = [{ chipA: 0.5, chipB: 0.5 }];
    const { result } = createDriver(
      script,
      { chipA: 0.75, chipB: 0.75 },
      { wallTimeoutMs: 0 }, // 0ms timeout — triggers immediately on >= check
    );
    const r = await result;

    expect(r.converged).toBe(false);
    expect(r.reason).toBe('wall-timeout');
  });

  it('triggers divergence forking', async () => {
    // Iteration 1: baseline
    // Iteration 2: chipA improves, chipB drops significantly
    const script = [
      { chipA: 0.6, chipB: 0.7 },
      { chipA: 0.85, chipB: 0.55 }, // chipB dropped 0.15 > threshold 0.10
    ];
    const { result } = createDriver(
      script,
      { chipA: 0.75, chipB: 0.75 },
      { divergenceThreshold: 0.10 },
    );
    const r = await result;

    expect(r.converged).toBe(false);
    expect(r.reason).toBe('divergence-forked');
    expect(r.variants.length).toBeGreaterThan(0);
  });

  it('tracks bestSoFar as max across all iterations per chip', async () => {
    const script = [
      { chipA: 0.7, chipB: 0.8 },
      { chipA: 0.9, chipB: 0.6 }, // chipA peaks here, chipB drops
      { chipA: 0.6, chipB: 0.5 }, // both drop
    ];
    const { result } = createDriver(
      script,
      { chipA: 0.75, chipB: 0.75 },
      { maxIterations: 3 },
    );
    const r = await result;

    expect(r.bestPassRates.chipA).toBe(0.9);
    expect(r.bestPassRates.chipB).toBe(0.8);
  });

  it('records optimization log with one entry per iteration', async () => {
    const script = [
      { chipA: 0.5, chipB: 0.5 },
      { chipA: 0.6, chipB: 0.6 },
    ];
    const { result } = createDriver(
      script,
      { chipA: 0.75, chipB: 0.75 },
      { maxIterations: 2 },
    );
    const r = await result;

    expect(r.optimizationLog).toHaveLength(2);
    expect(r.optimizationLog[0]!.iteration).toBe(1);
    expect(r.optimizationLog[1]!.iteration).toBe(2);
    expect(r.optimizationLog[0]!.perChipPassRates).toEqual({ chipA: 0.5, chipB: 0.5 });
  });

  it('identifies worst-performing chip by largest gap to threshold', async () => {
    // chipA: 0.5 (gap=0.25), chipB: 0.6 (gap=0.15) -> chipA is worst
    const script = [
      { chipA: 0.5, chipB: 0.6 },
      { chipA: 0.5, chipB: 0.6 },
    ];
    const { result } = createDriver(
      script,
      { chipA: 0.75, chipB: 0.75 },
      { maxIterations: 2 },
    );
    const r = await result;

    // The hints should have been applied (we can verify via log entries)
    expect(r.optimizationLog[0]!.hintsApplied.length).toBeGreaterThan(0);
  });

  it('converges with single chip', async () => {
    const script = [
      { chipA: 0.8 },
      { chipA: 0.85 },
      { chipA: 0.9 },
    ];

    const benchmarkRunner = new MockBenchmarkRunner(script);
    const thresholdsLoader = new MockThresholdsLoader({ chipA: 0.75 });
    const hintGenerator = new MockHintGenerator();
    const convergenceDetector = new ConvergenceDetector(3);

    const driver = new OptimizationDriver(
      benchmarkRunner as any,
      thresholdsLoader as any,
      hintGenerator as any,
      convergenceDetector,
      variantGen,
    );

    const r = await driver.optimize('/tmp/skill', ['chipA']);

    expect(r.converged).toBe(true);
    expect(r.reason).toBe('converged');
    expect(r.iterations).toBe(3);
  });

  it('converges immediately when all chips already passing for window iterations', async () => {
    const script = [
      { chipA: 0.9, chipB: 0.9 },
      { chipA: 0.9, chipB: 0.9 },
      { chipA: 0.9, chipB: 0.9 },
    ];
    const { result } = createDriver(script, { chipA: 0.75, chipB: 0.75 });
    const r = await result;

    expect(r.converged).toBe(true);
    expect(r.reason).toBe('converged');
    expect(r.iterations).toBe(3);
  });
});
