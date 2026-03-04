import { describe, it, expect } from 'vitest';
import { HardwareProbe } from './helpers/hardware-probe.js';
import { BenchmarkRegressionChecker } from './helpers/benchmark-regression.js';
import type { MultiModelBenchmark } from '../eval/types.js';

describe('HardwareProbe', () => {
  it('detectRam() returns positive number', () => {
    const ram = HardwareProbe.detectRam();
    expect(ram).toBeGreaterThan(0);
  });

  it('detectCpuCores() returns positive integer', () => {
    const cores = HardwareProbe.detectCpuCores();
    expect(cores).toBeGreaterThan(0);
    expect(Number.isInteger(cores)).toBe(true);
  });

  it('probeSummary() returns valid HardwareProfile', async () => {
    const profile = await HardwareProbe.probeSummary('http://127.0.0.1:1'); // non-existent
    expect(profile.ramGb).toBeGreaterThan(0);
    expect(profile.cpuCores).toBeGreaterThan(0);
    expect(typeof profile.ollamaAvailable).toBe('boolean');
    // gpu may or may not be present depending on system
  });
});

describe('BenchmarkRegressionChecker', () => {
  const checker = new BenchmarkRegressionChecker();

  function makeBenchmark(models: Array<{ model: string; passRate: number }>): MultiModelBenchmark {
    return {
      skillName: 'test-skill',
      benchmarkedAt: new Date().toISOString(),
      models: models.map((m) => ({
        ...m,
        runCount: 1,
        avgAccuracy: m.passRate * 100,
        avgF1: m.passRate,
        thresholdStatus: 'above' as const,
      })),
      runs: [],
      legacyRunCount: 0,
    };
  }

  it('detects regression above threshold', () => {
    const baseline = makeBenchmark([{ model: 'chipA', passRate: 0.90 }]);
    const current = makeBenchmark([{ model: 'chipA', passRate: 0.80 }]);
    const result = checker.check(current, baseline, 5);

    expect(result.passed).toBe(false);
    expect(result.regressions).toHaveLength(1);
    expect(result.regressions[0]!.model).toBe('chipA');
    expect(result.regressions[0]!.dropPercent).toBeCloseTo(11.11, 1);
  });

  it('passes when within threshold', () => {
    const baseline = makeBenchmark([{ model: 'chipA', passRate: 0.90 }]);
    const current = makeBenchmark([{ model: 'chipA', passRate: 0.87 }]);
    const result = checker.check(current, baseline, 5);

    expect(result.passed).toBe(true);
    expect(result.regressions).toHaveLength(0);
  });

  it('handles missing models gracefully', () => {
    const baseline = makeBenchmark([{ model: 'chipA', passRate: 0.90 }]);
    const current = makeBenchmark([{ model: 'chipB', passRate: 0.80 }]);
    const result = checker.check(current, baseline);

    expect(result.passed).toBe(true);
    expect(result.modelsChecked).toBe(0);
  });

  it('checks multiple models', () => {
    const baseline = makeBenchmark([
      { model: 'chipA', passRate: 0.90 },
      { model: 'chipB', passRate: 0.80 },
    ]);
    const current = makeBenchmark([
      { model: 'chipA', passRate: 0.60 },  // 33% drop
      { model: 'chipB', passRate: 0.78 },  // 2.5% drop (ok)
    ]);
    const result = checker.check(current, baseline, 5);

    expect(result.passed).toBe(false);
    expect(result.regressions).toHaveLength(1);
    expect(result.regressions[0]!.model).toBe('chipA');
    expect(result.modelsChecked).toBe(2);
  });
});
