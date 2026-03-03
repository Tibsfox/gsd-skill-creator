/**
 * Tests for EvalViewer -- multi-model benchmark display engine.
 *
 * Tests verify: multi-model summary table formatting, single model detail view,
 * empty benchmark handling, legacy run note, JSON output, model filter,
 * color thresholds, and model sorting by pass rate.
 */

import { describe, it, expect } from 'vitest';
import { EvalViewer, VIEWER_PASS_RATE_GREEN_THRESHOLD, VIEWER_PASS_RATE_YELLOW_THRESHOLD } from './eval-viewer.js';
import type { MultiModelBenchmark, ModelSummary, ModelBenchmarkRun } from './types.js';

// ============================================================================
// Test fixture helpers
// ============================================================================

function makeRunMetrics(accuracy: number, f1Score: number) {
  return {
    total: 10,
    passed: Math.round(accuracy / 10),
    failed: 10 - Math.round(accuracy / 10),
    accuracy,
    falsePositiveRate: 5.0,
    truePositives: 4,
    trueNegatives: Math.round(accuracy / 10) - 4,
    falsePositives: 1,
    falseNegatives: 1,
    edgeCaseCount: 0,
    precision: 0.8,
    recall: 0.8,
    f1Score,
  };
}

function makeRun(model: string, accuracy: number, f1Score: number, passed: boolean): ModelBenchmarkRun {
  return {
    skillName: 'test-skill',
    model,
    runAt: '2026-03-03T00:00:00Z',
    duration: 1000,
    metrics: makeRunMetrics(accuracy, f1Score),
    passed,
    hints: ['hint one'],
  };
}

function makeModelSummary(
  model: string,
  passRate: number,
  avgAccuracy: number,
  avgF1: number,
  thresholdStatus: 'above' | 'below' | 'at'
): ModelSummary {
  return { model, runCount: 5, passRate, avgAccuracy, avgF1, thresholdStatus };
}

function makeBenchmark(
  models: ModelSummary[],
  runs: ModelBenchmarkRun[],
  legacyRunCount = 0
): MultiModelBenchmark {
  return {
    skillName: 'test-skill',
    benchmarkedAt: '2026-03-03T10:00:00Z',
    models,
    runs,
    legacyRunCount,
  };
}

// ============================================================================
// Constants
// ============================================================================

describe('EvalViewer constants', () => {
  it('VIEWER_PASS_RATE_GREEN_THRESHOLD is 0.75', () => {
    expect(VIEWER_PASS_RATE_GREEN_THRESHOLD).toBe(0.75);
  });

  it('VIEWER_PASS_RATE_YELLOW_THRESHOLD is 0.50', () => {
    expect(VIEWER_PASS_RATE_YELLOW_THRESHOLD).toBe(0.50);
  });
});

// ============================================================================
// formatMultiModelSummary
// ============================================================================

describe('EvalViewer.formatMultiModelSummary', () => {
  const viewer = new EvalViewer();

  it('returns "No benchmark data available" when no models', () => {
    const benchmark = makeBenchmark([], []);
    const output = viewer.formatMultiModelSummary(benchmark);
    expect(output).toContain('No benchmark data available');
  });

  it('includes skill name in header', () => {
    const benchmark = makeBenchmark(
      [makeModelSummary('ollama-llama3', 0.80, 85.2, 0.82, 'above')],
      [makeRun('ollama-llama3', 85.2, 0.82, true)]
    );
    const output = viewer.formatMultiModelSummary(benchmark);
    expect(output).toContain('test-skill');
  });

  it('includes benchmarkedAt timestamp', () => {
    const benchmark = makeBenchmark(
      [makeModelSummary('ollama-llama3', 0.80, 85.2, 0.82, 'above')],
      [makeRun('ollama-llama3', 85.2, 0.82, true)]
    );
    const output = viewer.formatMultiModelSummary(benchmark);
    expect(output).toContain('2026-03-03');
  });

  it('includes column headers: Model, Runs, Pass Rate, Accuracy, F1, Status', () => {
    const benchmark = makeBenchmark(
      [makeModelSummary('ollama-llama3', 0.80, 85.2, 0.82, 'above')],
      [makeRun('ollama-llama3', 85.2, 0.82, true)]
    );
    const output = viewer.formatMultiModelSummary(benchmark);
    expect(output).toContain('Model');
    expect(output).toContain('Runs');
    expect(output).toContain('Pass Rate');
    expect(output).toContain('Accuracy');
    expect(output).toContain('F1');
    expect(output).toContain('Status');
  });

  it('includes model names in output', () => {
    const benchmark = makeBenchmark(
      [
        makeModelSummary('ollama-llama3', 0.80, 85.2, 0.82, 'above'),
        makeModelSummary('local-mistral', 0.60, 62.1, 0.58, 'below'),
      ],
      [
        makeRun('ollama-llama3', 85.2, 0.82, true),
        makeRun('local-mistral', 62.1, 0.58, false),
      ]
    );
    const output = viewer.formatMultiModelSummary(benchmark);
    expect(output).toContain('ollama-llama3');
    expect(output).toContain('local-mistral');
  });

  it('includes pass rates formatted as percentages', () => {
    const benchmark = makeBenchmark(
      [makeModelSummary('ollama-llama3', 0.80, 85.2, 0.82, 'above')],
      [makeRun('ollama-llama3', 85.2, 0.82, true)]
    );
    const output = viewer.formatMultiModelSummary(benchmark);
    expect(output).toContain('80.0%');
  });

  it('includes threshold status in output', () => {
    const benchmark = makeBenchmark(
      [makeModelSummary('ollama-llama3', 0.80, 85.2, 0.82, 'above')],
      [makeRun('ollama-llama3', 85.2, 0.82, true)]
    );
    const output = viewer.formatMultiModelSummary(benchmark);
    expect(output).toContain('above');
  });

  it('shows legacy note when legacyRunCount > 0', () => {
    const benchmark = makeBenchmark(
      [makeModelSummary('unknown', 0.50, 55.0, 0.50, 'below')],
      [makeRun('unknown', 55.0, 0.50, false)],
      2
    );
    const output = viewer.formatMultiModelSummary(benchmark);
    expect(output).toContain('legacy run');
    expect(output).toContain('2');
  });

  it('does NOT show legacy note when legacyRunCount is 0', () => {
    const benchmark = makeBenchmark(
      [makeModelSummary('ollama-llama3', 0.80, 85.2, 0.82, 'above')],
      [makeRun('ollama-llama3', 85.2, 0.82, true)],
      0
    );
    const output = viewer.formatMultiModelSummary(benchmark);
    expect(output).not.toContain('legacy run');
  });

  it('sorts models by passRate descending (best model first)', () => {
    const benchmark = makeBenchmark(
      [
        makeModelSummary('local-mistral', 0.60, 62.1, 0.58, 'below'),
        makeModelSummary('ollama-llama3', 0.80, 85.2, 0.82, 'above'),
      ],
      [
        makeRun('local-mistral', 62.1, 0.58, false),
        makeRun('ollama-llama3', 85.2, 0.82, true),
      ]
    );
    const output = viewer.formatMultiModelSummary(benchmark);
    const ollamaPos = output.indexOf('ollama-llama3');
    const mistralPos = output.indexOf('local-mistral');
    // ollama has higher passRate, should appear first
    expect(ollamaPos).toBeLessThan(mistralPos);
  });

  it('includes run count in each model row', () => {
    const benchmark = makeBenchmark(
      [makeModelSummary('ollama-llama3', 0.80, 85.2, 0.82, 'above')],
      [makeRun('ollama-llama3', 85.2, 0.82, true)]
    );
    const output = viewer.formatMultiModelSummary(benchmark);
    // runCount is 5 in our fixture
    expect(output).toContain('5');
  });

  it('includes F1 score in output', () => {
    const benchmark = makeBenchmark(
      [makeModelSummary('ollama-llama3', 0.80, 85.2, 0.82, 'above')],
      [makeRun('ollama-llama3', 85.2, 0.82, true)]
    );
    const output = viewer.formatMultiModelSummary(benchmark);
    expect(output).toContain('0.82');
  });
});

// ============================================================================
// formatModelDetail
// ============================================================================

describe('EvalViewer.formatModelDetail', () => {
  const viewer = new EvalViewer();

  it('returns "No results for model: xyz" for unknown model', () => {
    const benchmark = makeBenchmark(
      [makeModelSummary('ollama-llama3', 0.80, 85.2, 0.82, 'above')],
      [makeRun('ollama-llama3', 85.2, 0.82, true)]
    );
    const output = viewer.formatModelDetail(benchmark, 'xyz');
    expect(output).toBe('No results for model: xyz');
  });

  it('shows model name in header', () => {
    const benchmark = makeBenchmark(
      [makeModelSummary('ollama-llama3', 0.80, 85.2, 0.82, 'above')],
      [makeRun('ollama-llama3', 85.2, 0.82, true)]
    );
    const output = viewer.formatModelDetail(benchmark, 'ollama-llama3');
    expect(output).toContain('ollama-llama3');
  });

  it('shows pass rate, accuracy, F1, threshold status for the model', () => {
    const benchmark = makeBenchmark(
      [makeModelSummary('ollama-llama3', 0.80, 85.2, 0.82, 'above')],
      [makeRun('ollama-llama3', 85.2, 0.82, true)]
    );
    const output = viewer.formatModelDetail(benchmark, 'ollama-llama3');
    expect(output).toContain('80.0%');
    expect(output).toContain('85.2');
    expect(output).toContain('0.82');
    expect(output).toContain('above');
  });

  it('shows individual run details (runAt, duration, passed, accuracy)', () => {
    const run = makeRun('ollama-llama3', 85.2, 0.82, true);
    const benchmark = makeBenchmark(
      [makeModelSummary('ollama-llama3', 0.80, 85.2, 0.82, 'above')],
      [run]
    );
    const output = viewer.formatModelDetail(benchmark, 'ollama-llama3');
    expect(output).toContain('2026-03-03');
    expect(output).toContain('1000');
  });

  it('shows hints for the model runs', () => {
    const run = makeRun('ollama-llama3', 85.2, 0.82, true);
    const benchmark = makeBenchmark(
      [makeModelSummary('ollama-llama3', 0.80, 85.2, 0.82, 'above')],
      [run]
    );
    const output = viewer.formatModelDetail(benchmark, 'ollama-llama3');
    expect(output).toContain('hint one');
  });

  it('only shows runs for the specified model', () => {
    const benchmark = makeBenchmark(
      [
        makeModelSummary('ollama-llama3', 0.80, 85.2, 0.82, 'above'),
        makeModelSummary('local-mistral', 0.60, 62.1, 0.58, 'below'),
      ],
      [
        makeRun('ollama-llama3', 85.2, 0.82, true),
        makeRun('local-mistral', 62.1, 0.58, false),
      ]
    );
    const output = viewer.formatModelDetail(benchmark, 'ollama-llama3');
    // Should not reference other model's unique accuracy
    expect(output).toContain('85.2');
    // local-mistral specific data should not appear in model detail for ollama-llama3
    expect(output).not.toContain('local-mistral');
  });
});

// ============================================================================
// formatLegacyFallback
// ============================================================================

describe('EvalViewer.formatLegacyFallback', () => {
  const viewer = new EvalViewer();

  it('returns empty string when legacyRunCount is 0', () => {
    const benchmark = makeBenchmark([], [], 0);
    expect(viewer.formatLegacyFallback(benchmark)).toBe('');
  });

  it('returns note string when legacyRunCount > 0', () => {
    const benchmark = makeBenchmark([], [], 3);
    const output = viewer.formatLegacyFallback(benchmark);
    expect(output).toContain('3');
    expect(output).toContain('legacy');
  });

  it('mentions unknown model in note', () => {
    const benchmark = makeBenchmark([], [], 5);
    const output = viewer.formatLegacyFallback(benchmark);
    expect(output).toContain('unknown');
  });
});

// ============================================================================
// formatJSON
// ============================================================================

describe('EvalViewer.formatJSON', () => {
  const viewer = new EvalViewer();

  it('returns valid JSON for full benchmark', () => {
    const benchmark = makeBenchmark(
      [makeModelSummary('ollama-llama3', 0.80, 85.2, 0.82, 'above')],
      [makeRun('ollama-llama3', 85.2, 0.82, true)]
    );
    const output = viewer.formatJSON(benchmark);
    const parsed = JSON.parse(output) as unknown;
    expect(parsed).toBeTruthy();
  });

  it('includes skillName in JSON output', () => {
    const benchmark = makeBenchmark(
      [makeModelSummary('ollama-llama3', 0.80, 85.2, 0.82, 'above')],
      [makeRun('ollama-llama3', 85.2, 0.82, true)]
    );
    const output = viewer.formatJSON(benchmark);
    const parsed = JSON.parse(output) as { skillName: string };
    expect(parsed.skillName).toBe('test-skill');
  });

  it('includes all models when no modelFilter provided', () => {
    const benchmark = makeBenchmark(
      [
        makeModelSummary('ollama-llama3', 0.80, 85.2, 0.82, 'above'),
        makeModelSummary('local-mistral', 0.60, 62.1, 0.58, 'below'),
      ],
      [
        makeRun('ollama-llama3', 85.2, 0.82, true),
        makeRun('local-mistral', 62.1, 0.58, false),
      ]
    );
    const output = viewer.formatJSON(benchmark);
    const parsed = JSON.parse(output) as { models: Array<{ model: string }> };
    expect(parsed.models).toHaveLength(2);
  });

  it('filters models and runs when modelFilter provided', () => {
    const benchmark = makeBenchmark(
      [
        makeModelSummary('ollama-llama3', 0.80, 85.2, 0.82, 'above'),
        makeModelSummary('local-mistral', 0.60, 62.1, 0.58, 'below'),
      ],
      [
        makeRun('ollama-llama3', 85.2, 0.82, true),
        makeRun('local-mistral', 62.1, 0.58, false),
      ]
    );
    const output = viewer.formatJSON(benchmark, 'ollama-llama3');
    const parsed = JSON.parse(output) as {
      models: Array<{ model: string }>;
      runs: Array<{ model: string }>;
    };
    expect(parsed.models).toHaveLength(1);
    expect(parsed.models[0].model).toBe('ollama-llama3');
    expect(parsed.runs).toHaveLength(1);
    expect(parsed.runs[0].model).toBe('ollama-llama3');
  });

  it('returns JSON with 2-space indentation', () => {
    const benchmark = makeBenchmark(
      [makeModelSummary('ollama-llama3', 0.80, 85.2, 0.82, 'above')],
      [makeRun('ollama-llama3', 85.2, 0.82, true)]
    );
    const output = viewer.formatJSON(benchmark);
    // Check 2-space indent by verifying the JSON is pretty-printed
    expect(output).toContain('\n  ');
  });
});

// ============================================================================
// Color threshold coverage (structural, not visual)
// ============================================================================

describe('EvalViewer color thresholds (structural)', () => {
  const viewer = new EvalViewer();

  it('formatMultiModelSummary handles above-green passRate (>= 0.75)', () => {
    const benchmark = makeBenchmark(
      [makeModelSummary('good-model', 0.80, 85.0, 0.85, 'above')],
      [makeRun('good-model', 85.0, 0.85, true)]
    );
    // Should not throw -- just verify it renders
    const output = viewer.formatMultiModelSummary(benchmark);
    expect(output).toContain('good-model');
  });

  it('formatMultiModelSummary handles yellow passRate (>= 0.50, < 0.75)', () => {
    const benchmark = makeBenchmark(
      [makeModelSummary('mid-model', 0.60, 60.0, 0.60, 'below')],
      [makeRun('mid-model', 60.0, 0.60, false)]
    );
    const output = viewer.formatMultiModelSummary(benchmark);
    expect(output).toContain('mid-model');
  });

  it('formatMultiModelSummary handles red passRate (< 0.50)', () => {
    const benchmark = makeBenchmark(
      [makeModelSummary('bad-model', 0.30, 30.0, 0.25, 'below')],
      [makeRun('bad-model', 30.0, 0.25, false)]
    );
    const output = viewer.formatMultiModelSummary(benchmark);
    expect(output).toContain('bad-model');
  });

  it('formatMultiModelSummary handles "at" threshold status (yellow)', () => {
    const benchmark = makeBenchmark(
      [makeModelSummary('at-model', 0.75, 75.0, 0.75, 'at')],
      [makeRun('at-model', 75.0, 0.75, true)]
    );
    const output = viewer.formatMultiModelSummary(benchmark);
    expect(output).toContain('at');
  });
});
