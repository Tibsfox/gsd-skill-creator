/**
 * Tests for MultiModelBenchmarkRunner.
 *
 * TDD: These tests were written first (RED phase) before the implementation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MultiModelBenchmarkRunner, BENCHMARK_PASS_ACCURACY_THRESHOLD } from './multi-model-benchmark.js';
import type { ChipTestRunner, ChipTestRunResult } from '../chips/chip-test-runner.js';
import type { ChipRegistry } from '../chips/chip-registry.js';
import type { ThresholdsConfigLoader } from './thresholds-config.js';

// ============================================================================
// Helpers
// ============================================================================

function makeMetrics(accuracy: number) {
  const passed = Math.round(accuracy);
  return {
    total: 100,
    passed,
    failed: 100 - passed,
    accuracy,
    falsePositiveRate: 0,
    truePositives: passed,
    trueNegatives: 0,
    falsePositives: 0,
    falseNegatives: 100 - passed,
    edgeCaseCount: 0,
    precision: passed > 0 ? 1.0 : 0,
    recall: passed / 100,
    f1Score: passed > 0 ? (2 * 1.0 * (passed / 100)) / (1.0 + passed / 100) : 0,
  };
}

function makeChipRunResult(chipName: string, accuracy: number): ChipTestRunResult {
  return {
    skillName: 'test-skill',
    runAt: '2026-03-01T00:00:00.000Z',
    duration: 1000,
    metrics: makeMetrics(accuracy),
    results: [],
    positiveResults: [],
    negativeResults: [],
    edgeCaseResults: [],
    hints: [],
    chipName,
  };
}

function makeLegacyRunResult(): ChipTestRunResult {
  return {
    skillName: 'test-skill',
    runAt: '2026-03-01T00:00:00.000Z',
    duration: 500,
    metrics: makeMetrics(80),
    results: [],
    positiveResults: [],
    negativeResults: [],
    edgeCaseResults: [],
    hints: [],
    // chipName intentionally omitted (legacy run)
  };
}

// ============================================================================
// Mocks
// ============================================================================

function makeThresholdsLoader(statusMap: Record<string, 'above' | 'below' | 'at'> = {}): ThresholdsConfigLoader {
  return {
    loadFromFile: vi.fn().mockResolvedValue({
      version: 1,
      defaultPassRate: 0.75,
      chips: {},
    }),
    getThresholdForChip: vi.fn().mockReturnValue(0.75),
    getStatus: vi.fn().mockImplementation((passRate: number, chipName: string) => {
      return statusMap[chipName] ?? (passRate > 0.75 ? 'above' : passRate < 0.75 ? 'below' : 'at');
    }),
  } as unknown as ThresholdsConfigLoader;
}

function makeChipTestRunner(chipResults: Record<string, ChipTestRunResult | Error>): ChipTestRunner {
  return {
    runForSkill: vi.fn().mockImplementation(
      async (_skillName: string, options?: { chip?: string }) => {
        const chipName = options?.chip ?? 'unknown';
        const result = chipResults[chipName];
        if (result instanceof Error) {
          throw result;
        }
        return result;
      }
    ),
  } as unknown as ChipTestRunner;
}

// ============================================================================
// BENCHMARK_PASS_ACCURACY_THRESHOLD constant
// ============================================================================

describe('BENCHMARK_PASS_ACCURACY_THRESHOLD', () => {
  it('is 50 (accuracy percentage above which a run is considered passed)', () => {
    expect(BENCHMARK_PASS_ACCURACY_THRESHOLD).toBe(50);
  });
});

// ============================================================================
// MultiModelBenchmarkRunner -- benchmarkSkill
// ============================================================================

describe('MultiModelBenchmarkRunner', () => {
  let thresholdsLoader: ThresholdsConfigLoader;
  let registry: ChipRegistry;

  beforeEach(() => {
    registry = {} as ChipRegistry;
    thresholdsLoader = makeThresholdsLoader();
  });

  // --------------------------------------------------------------------------
  // Empty chipNames[]
  // --------------------------------------------------------------------------

  describe('empty chipNames[]', () => {
    it('returns benchmark with 0 models and 0 runs', async () => {
      const chipTestRunner = makeChipTestRunner({});
      const runner = new MultiModelBenchmarkRunner(registry, chipTestRunner, thresholdsLoader);

      const result = await runner.benchmarkSkill('test-skill', []);

      expect(result.skillName).toBe('test-skill');
      expect(result.models).toHaveLength(0);
      expect(result.runs).toHaveLength(0);
      expect(result.legacyRunCount).toBe(0);
      expect(result.benchmarkedAt).toBeTruthy();
    });

    it('calls thresholdsLoader.loadFromFile() even for empty chipNames', async () => {
      const chipTestRunner = makeChipTestRunner({});
      const runner = new MultiModelBenchmarkRunner(registry, chipTestRunner, thresholdsLoader);

      await runner.benchmarkSkill('test-skill', []);

      expect(thresholdsLoader.loadFromFile).toHaveBeenCalledOnce();
    });
  });

  // --------------------------------------------------------------------------
  // Single chip
  // --------------------------------------------------------------------------

  describe('single chip', () => {
    it('produces one ModelSummary entry and one run', async () => {
      const chipTestRunner = makeChipTestRunner({
        'ollama': makeChipRunResult('ollama', 80),
      });
      const runner = new MultiModelBenchmarkRunner(registry, chipTestRunner, thresholdsLoader);

      const result = await runner.benchmarkSkill('test-skill', ['ollama']);

      expect(result.models).toHaveLength(1);
      expect(result.runs).toHaveLength(1);
      expect(result.models[0]!.model).toBe('ollama');
      expect(result.runs[0]!.model).toBe('ollama');
    });

    it('computes correct passRate for a passing run (accuracy >= 50)', async () => {
      const chipTestRunner = makeChipTestRunner({
        'ollama': makeChipRunResult('ollama', 80), // accuracy 80 >= 50 -> passed
      });
      const runner = new MultiModelBenchmarkRunner(registry, chipTestRunner, thresholdsLoader);

      const result = await runner.benchmarkSkill('test-skill', ['ollama']);

      expect(result.runs[0]!.passed).toBe(true);
      expect(result.models[0]!.passRate).toBe(1.0); // 1 of 1 runs passed
    });

    it('computes correct passRate for a failing run (accuracy < 50)', async () => {
      const chipTestRunner = makeChipTestRunner({
        'ollama': makeChipRunResult('ollama', 30), // accuracy 30 < 50 -> failed
      });
      const runner = new MultiModelBenchmarkRunner(registry, chipTestRunner, thresholdsLoader);

      const result = await runner.benchmarkSkill('test-skill', ['ollama']);

      expect(result.runs[0]!.passed).toBe(false);
      expect(result.models[0]!.passRate).toBe(0.0); // 0 of 1 runs passed
    });

    it('computes avgAccuracy from metrics.accuracy', async () => {
      const chipTestRunner = makeChipTestRunner({
        'ollama': makeChipRunResult('ollama', 75),
      });
      const runner = new MultiModelBenchmarkRunner(registry, chipTestRunner, thresholdsLoader);

      const result = await runner.benchmarkSkill('test-skill', ['ollama']);

      expect(result.models[0]!.avgAccuracy).toBe(75);
    });

    it('computes avgF1 from metrics.f1Score', async () => {
      const chipResult = makeChipRunResult('ollama', 75);
      const chipTestRunner = makeChipTestRunner({ 'ollama': chipResult });
      const runner = new MultiModelBenchmarkRunner(registry, chipTestRunner, thresholdsLoader);

      const result = await runner.benchmarkSkill('test-skill', ['ollama']);

      expect(result.models[0]!.avgF1).toBeCloseTo(chipResult.metrics.f1Score, 5);
    });

    it('sets thresholdStatus from ThresholdsConfigLoader.getStatus()', async () => {
      const loader = makeThresholdsLoader({ 'ollama': 'above' });
      const chipTestRunner = makeChipTestRunner({
        'ollama': makeChipRunResult('ollama', 80),
      });
      const runner = new MultiModelBenchmarkRunner(registry, chipTestRunner, loader);

      const result = await runner.benchmarkSkill('test-skill', ['ollama']);

      expect(result.models[0]!.thresholdStatus).toBe('above');
    });

    it('runCount is correct for single run', async () => {
      const chipTestRunner = makeChipTestRunner({
        'ollama': makeChipRunResult('ollama', 80),
      });
      const runner = new MultiModelBenchmarkRunner(registry, chipTestRunner, thresholdsLoader);

      const result = await runner.benchmarkSkill('test-skill', ['ollama']);

      expect(result.models[0]!.runCount).toBe(1);
    });
  });

  // --------------------------------------------------------------------------
  // Multiple chips
  // --------------------------------------------------------------------------

  describe('two chips', () => {
    it('produces 2 ModelSummary entries and 2 runs', async () => {
      const chipTestRunner = makeChipTestRunner({
        'ollama': makeChipRunResult('ollama', 80),
        'anthropic': makeChipRunResult('anthropic', 90),
      });
      const runner = new MultiModelBenchmarkRunner(registry, chipTestRunner, thresholdsLoader);

      const result = await runner.benchmarkSkill('test-skill', ['ollama', 'anthropic']);

      expect(result.models).toHaveLength(2);
      expect(result.runs).toHaveLength(2);
    });

    it('produces correct per-model summaries for each chip', async () => {
      const chipTestRunner = makeChipTestRunner({
        'ollama': makeChipRunResult('ollama', 40),      // failed (< 50)
        'anthropic': makeChipRunResult('anthropic', 90), // passed (>= 50)
      });
      const runner = new MultiModelBenchmarkRunner(registry, chipTestRunner, thresholdsLoader);

      const result = await runner.benchmarkSkill('test-skill', ['ollama', 'anthropic']);

      const ollamaSummary = result.models.find((m) => m.model === 'ollama');
      const anthropicSummary = result.models.find((m) => m.model === 'anthropic');

      expect(ollamaSummary!.passRate).toBe(0.0);
      expect(anthropicSummary!.passRate).toBe(1.0);
      expect(ollamaSummary!.avgAccuracy).toBe(40);
      expect(anthropicSummary!.avgAccuracy).toBe(90);
    });

    it('legacyRunCount is 0 when all chips have names', async () => {
      const chipTestRunner = makeChipTestRunner({
        'ollama': makeChipRunResult('ollama', 80),
        'anthropic': makeChipRunResult('anthropic', 90),
      });
      const runner = new MultiModelBenchmarkRunner(registry, chipTestRunner, thresholdsLoader);

      const result = await runner.benchmarkSkill('test-skill', ['ollama', 'anthropic']);

      expect(result.legacyRunCount).toBe(0);
    });

    it('benchmarkedAt is a valid ISO 8601 timestamp', async () => {
      const chipTestRunner = makeChipTestRunner({
        'ollama': makeChipRunResult('ollama', 80),
      });
      const runner = new MultiModelBenchmarkRunner(registry, chipTestRunner, thresholdsLoader);

      const result = await runner.benchmarkSkill('test-skill', ['ollama']);

      expect(() => new Date(result.benchmarkedAt)).not.toThrow();
      expect(new Date(result.benchmarkedAt).toISOString()).toBe(result.benchmarkedAt);
    });
  });

  // --------------------------------------------------------------------------
  // Legacy runs (chipName undefined)
  // --------------------------------------------------------------------------

  describe('legacy runs', () => {
    it('assigns model="unknown" when chipName is undefined', async () => {
      // Simulate a chip that returns a result without chipName
      const legacyResult = makeLegacyRunResult();
      const chipTestRunner = {
        runForSkill: vi.fn().mockResolvedValue(legacyResult),
      } as unknown as ChipTestRunner;

      const runner = new MultiModelBenchmarkRunner(registry, chipTestRunner, thresholdsLoader);

      const result = await runner.benchmarkSkill('test-skill', ['some-chip']);

      expect(result.runs[0]!.model).toBe('unknown');
    });

    it('increments legacyRunCount for runs with model="unknown"', async () => {
      const legacyResult = makeLegacyRunResult();
      const chipTestRunner = {
        runForSkill: vi.fn().mockResolvedValue(legacyResult),
      } as unknown as ChipTestRunner;

      const runner = new MultiModelBenchmarkRunner(registry, chipTestRunner, thresholdsLoader);

      const result = await runner.benchmarkSkill('test-skill', ['some-chip']);

      expect(result.legacyRunCount).toBe(1);
    });

    it('groups legacy runs under "unknown" model summary', async () => {
      const legacyResult = makeLegacyRunResult();
      const chipTestRunner = {
        runForSkill: vi.fn().mockResolvedValue(legacyResult),
      } as unknown as ChipTestRunner;

      const runner = new MultiModelBenchmarkRunner(registry, chipTestRunner, thresholdsLoader);

      const result = await runner.benchmarkSkill('test-skill', ['some-chip']);

      const unknownSummary = result.models.find((m) => m.model === 'unknown');
      expect(unknownSummary).toBeDefined();
      expect(unknownSummary!.runCount).toBe(1);
    });
  });

  // --------------------------------------------------------------------------
  // Failed chip (throws)
  // --------------------------------------------------------------------------

  describe('failed chip (throws)', () => {
    it('records error entry for the failed chip without blocking other chips', async () => {
      const chipTestRunner = makeChipTestRunner({
        'ollama': new Error('Chip unavailable: connection refused'),
        'anthropic': makeChipRunResult('anthropic', 90),
      });
      const runner = new MultiModelBenchmarkRunner(registry, chipTestRunner, thresholdsLoader);

      const result = await runner.benchmarkSkill('test-skill', ['ollama', 'anthropic']);

      // Both runs present
      expect(result.runs).toHaveLength(2);

      // ollama run has passed=false and error hint
      const ollamaRun = result.runs.find((r) => r.model === 'ollama');
      expect(ollamaRun!.passed).toBe(false);
      expect(ollamaRun!.hints.length).toBeGreaterThan(0);
      expect(ollamaRun!.hints[0]).toContain('Chip unavailable');

      // anthropic run is normal
      const anthropicRun = result.runs.find((r) => r.model === 'anthropic');
      expect(anthropicRun!.passed).toBe(true);
    });

    it('still returns a valid MultiModelBenchmark even if all chips fail', async () => {
      const chipTestRunner = makeChipTestRunner({
        'ollama': new Error('connection refused'),
      });
      const runner = new MultiModelBenchmarkRunner(registry, chipTestRunner, thresholdsLoader);

      const result = await runner.benchmarkSkill('test-skill', ['ollama']);

      expect(result.runs).toHaveLength(1);
      expect(result.runs[0]!.passed).toBe(false);
      expect(result.models).toHaveLength(1);
      expect(result.models[0]!.passRate).toBe(0);
    });
  });

  // --------------------------------------------------------------------------
  // ChipTestRunResult not modified (backward compat)
  // --------------------------------------------------------------------------

  describe('ChipTestRunResult not modified', () => {
    it('does not mutate the original ChipTestRunResult', async () => {
      const originalResult = makeChipRunResult('ollama', 80);
      const originalResultCopy = JSON.parse(JSON.stringify(originalResult)) as ChipTestRunResult;

      const chipTestRunner = {
        runForSkill: vi.fn().mockResolvedValue(originalResult),
      } as unknown as ChipTestRunner;

      const runner = new MultiModelBenchmarkRunner(registry, chipTestRunner, thresholdsLoader);
      await runner.benchmarkSkill('test-skill', ['ollama']);

      // Original result is unchanged
      expect(originalResult).toEqual(originalResultCopy);
    });
  });
});
