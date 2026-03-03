/**
 * Tests for multi-model evaluation Zod schemas and types.
 *
 * Covers: valid schema parsing, invalid data rejection, EVAL-06 backward
 * compatibility (legacy runs without model field default to 'unknown'),
 * explicit model field preservation, and ThresholdsConfig validation.
 */

import { describe, it, expect } from 'vitest';
import {
  RunMetricsSchema,
  ModelBenchmarkRunSchema,
  ModelSummarySchema,
  MultiModelBenchmarkSchema,
  ThresholdsConfigSchema,
  DEFAULT_PASS_RATE_THRESHOLD,
} from './types.js';

// ============================================================================
// Fixtures
// ============================================================================

const validMetrics = {
  total: 10,
  passed: 8,
  failed: 2,
  accuracy: 80,
  falsePositiveRate: 10,
  truePositives: 5,
  trueNegatives: 3,
  falsePositives: 1,
  falseNegatives: 1,
  edgeCaseCount: 2,
  precision: 0.833,
  recall: 0.833,
  f1Score: 0.833,
};

const validRun = {
  skillName: 'gsd-workflow',
  model: 'ollama-llama3',
  runAt: '2026-03-03T12:00:00Z',
  duration: 1500,
  metrics: validMetrics,
  passed: true,
  hints: ['consider adding edge cases'],
};

const validSummary = {
  model: 'ollama-llama3',
  runCount: 5,
  passRate: 0.8,
  avgAccuracy: 75.5,
  avgF1: 0.78,
  thresholdStatus: 'above' as const,
};

const validBenchmark = {
  skillName: 'gsd-workflow',
  benchmarkedAt: '2026-03-03T12:00:00Z',
  models: [validSummary],
  runs: [validRun],
  legacyRunCount: 0,
};

const validThresholdsConfig = {
  version: 1 as const,
  defaultPassRate: 0.75,
  chips: {
    ollama: { passRate: 0.7 },
    anthropic: { passRate: 0.85 },
  },
};

// ============================================================================
// RunMetricsSchema
// ============================================================================

describe('RunMetricsSchema', () => {
  it('parses valid metrics', () => {
    const result = RunMetricsSchema.safeParse(validMetrics);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.total).toBe(10);
      expect(result.data.f1Score).toBe(0.833);
    }
  });

  it('rejects missing required fields', () => {
    const result = RunMetricsSchema.safeParse({ total: 10 });
    expect(result.success).toBe(false);
  });

  it('rejects non-numeric fields', () => {
    const result = RunMetricsSchema.safeParse({ ...validMetrics, total: 'ten' });
    expect(result.success).toBe(false);
  });

  it('accepts zero values', () => {
    const zeroMetrics = {
      ...validMetrics,
      total: 0,
      passed: 0,
      failed: 0,
      accuracy: 0,
      falsePositiveRate: 0,
      truePositives: 0,
      trueNegatives: 0,
      falsePositives: 0,
      falseNegatives: 0,
      edgeCaseCount: 0,
      precision: 0,
      recall: 0,
      f1Score: 0,
    };
    const result = RunMetricsSchema.safeParse(zeroMetrics);
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// ModelBenchmarkRunSchema
// ============================================================================

describe('ModelBenchmarkRunSchema', () => {
  it('parses a valid run with explicit model', () => {
    const result = ModelBenchmarkRunSchema.safeParse(validRun);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.model).toBe('ollama-llama3');
    }
  });

  it('EVAL-06: legacy run without model field defaults to "unknown"', () => {
    const legacyRun = { ...validRun };
    delete (legacyRun as Partial<typeof legacyRun>).model;

    const result = ModelBenchmarkRunSchema.safeParse(legacyRun);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.model).toBe('unknown');
    }
  });

  it('EVAL-06: run with model=undefined defaults to "unknown"', () => {
    const result = ModelBenchmarkRunSchema.safeParse({ ...validRun, model: undefined });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.model).toBe('unknown');
    }
  });

  it('preserves explicit model value', () => {
    const result = ModelBenchmarkRunSchema.safeParse({ ...validRun, model: 'anthropic-claude-3' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.model).toBe('anthropic-claude-3');
    }
  });

  it('rejects missing skillName', () => {
    const { skillName: _, ...noSkillName } = validRun;
    const result = ModelBenchmarkRunSchema.safeParse(noSkillName);
    expect(result.success).toBe(false);
  });

  it('rejects negative duration', () => {
    const result = ModelBenchmarkRunSchema.safeParse({ ...validRun, duration: -1 });
    expect(result.success).toBe(false);
  });

  it('allows zero duration', () => {
    const result = ModelBenchmarkRunSchema.safeParse({ ...validRun, duration: 0 });
    expect(result.success).toBe(true);
  });

  it('parses hints as empty array', () => {
    const result = ModelBenchmarkRunSchema.safeParse({ ...validRun, hints: [] });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.hints).toEqual([]);
    }
  });

  it('rejects missing metrics', () => {
    const { metrics: _, ...noMetrics } = validRun;
    const result = ModelBenchmarkRunSchema.safeParse(noMetrics);
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// ModelSummarySchema
// ============================================================================

describe('ModelSummarySchema', () => {
  it('parses a valid summary', () => {
    const result = ModelSummarySchema.safeParse(validSummary);
    expect(result.success).toBe(true);
  });

  it('accepts all thresholdStatus values', () => {
    for (const status of ['above', 'below', 'at'] as const) {
      const result = ModelSummarySchema.safeParse({ ...validSummary, thresholdStatus: status });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid thresholdStatus', () => {
    const result = ModelSummarySchema.safeParse({ ...validSummary, thresholdStatus: 'unknown' });
    expect(result.success).toBe(false);
  });

  it('rejects passRate above 1', () => {
    const result = ModelSummarySchema.safeParse({ ...validSummary, passRate: 1.1 });
    expect(result.success).toBe(false);
  });

  it('rejects passRate below 0', () => {
    const result = ModelSummarySchema.safeParse({ ...validSummary, passRate: -0.1 });
    expect(result.success).toBe(false);
  });

  it('rejects avgAccuracy above 100', () => {
    const result = ModelSummarySchema.safeParse({ ...validSummary, avgAccuracy: 101 });
    expect(result.success).toBe(false);
  });

  it('rejects avgF1 above 1', () => {
    const result = ModelSummarySchema.safeParse({ ...validSummary, avgF1: 1.1 });
    expect(result.success).toBe(false);
  });

  it('accepts runCount of 0', () => {
    const result = ModelSummarySchema.safeParse({ ...validSummary, runCount: 0 });
    expect(result.success).toBe(true);
  });

  it('rejects negative runCount', () => {
    const result = ModelSummarySchema.safeParse({ ...validSummary, runCount: -1 });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer runCount', () => {
    const result = ModelSummarySchema.safeParse({ ...validSummary, runCount: 2.5 });
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// MultiModelBenchmarkSchema
// ============================================================================

describe('MultiModelBenchmarkSchema', () => {
  it('parses a valid benchmark', () => {
    const result = MultiModelBenchmarkSchema.safeParse(validBenchmark);
    expect(result.success).toBe(true);
  });

  it('accepts empty models and runs arrays', () => {
    const result = MultiModelBenchmarkSchema.safeParse({
      ...validBenchmark,
      models: [],
      runs: [],
    });
    expect(result.success).toBe(true);
  });

  it('EVAL-06: mixed legacy and model-tagged runs have correct legacyRunCount', () => {
    const legacyRun = { ...validRun };
    delete (legacyRun as Partial<typeof legacyRun>).model;
    const parsed = ModelBenchmarkRunSchema.parse(legacyRun);

    const benchmark = {
      ...validBenchmark,
      runs: [validRun, parsed],
      legacyRunCount: 1,
    };

    const result = MultiModelBenchmarkSchema.safeParse(benchmark);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.legacyRunCount).toBe(1);
    }
  });

  it('rejects negative legacyRunCount', () => {
    const result = MultiModelBenchmarkSchema.safeParse({ ...validBenchmark, legacyRunCount: -1 });
    expect(result.success).toBe(false);
  });

  it('rejects missing skillName', () => {
    const { skillName: _, ...noBenchmarkName } = validBenchmark;
    const result = MultiModelBenchmarkSchema.safeParse(noBenchmarkName);
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// ThresholdsConfigSchema
// ============================================================================

describe('ThresholdsConfigSchema', () => {
  it('parses a valid thresholds config', () => {
    const result = ThresholdsConfigSchema.safeParse(validThresholdsConfig);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.version).toBe(1);
      expect(result.data.defaultPassRate).toBe(0.75);
      expect(result.data.chips['ollama'].passRate).toBe(0.7);
    }
  });

  it('accepts empty chips object', () => {
    const result = ThresholdsConfigSchema.safeParse({ ...validThresholdsConfig, chips: {} });
    expect(result.success).toBe(true);
  });

  it('rejects version != 1', () => {
    const result = ThresholdsConfigSchema.safeParse({ ...validThresholdsConfig, version: 2 });
    expect(result.success).toBe(false);
  });

  it('rejects defaultPassRate above 1', () => {
    const result = ThresholdsConfigSchema.safeParse({ ...validThresholdsConfig, defaultPassRate: 1.1 });
    expect(result.success).toBe(false);
  });

  it('rejects defaultPassRate below 0', () => {
    const result = ThresholdsConfigSchema.safeParse({ ...validThresholdsConfig, defaultPassRate: -0.1 });
    expect(result.success).toBe(false);
  });

  it('rejects chip passRate above 1', () => {
    const result = ThresholdsConfigSchema.safeParse({
      ...validThresholdsConfig,
      chips: { ollama: { passRate: 1.5 } },
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing defaultPassRate', () => {
    const { defaultPassRate: _, ...noDefault } = validThresholdsConfig;
    const result = ThresholdsConfigSchema.safeParse(noDefault);
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// DEFAULT_PASS_RATE_THRESHOLD constant
// ============================================================================

describe('DEFAULT_PASS_RATE_THRESHOLD', () => {
  it('is 0.75 per IMP-03', () => {
    expect(DEFAULT_PASS_RATE_THRESHOLD).toBe(0.75);
  });

  it('is a valid pass rate (0-1 range)', () => {
    expect(DEFAULT_PASS_RATE_THRESHOLD).toBeGreaterThanOrEqual(0);
    expect(DEFAULT_PASS_RATE_THRESHOLD).toBeLessThanOrEqual(1);
  });
});
