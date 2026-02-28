import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { MetricsCollector } from '../../../../src/dogfood/harness/metrics-collector.js';
import type { ChapterMetrics } from '../../../../src/dogfood/harness/types.js';

function createChapterMetrics(
  overrides: Partial<ChapterMetrics> = {},
): ChapterMetrics {
  return {
    chapter: 1,
    part: 1,
    chunksGenerated: 5,
    conceptsDetected: 3,
    mathDensity: 0.4,
    tokensUsed: 1500,
    processingTimeMs: 2000,
    errorsEncountered: 0,
    gapsFound: 1,
    ...overrides,
  };
}

describe('MetricsCollector', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'metrics-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('records per-chapter metrics', () => {
    const collector = new MetricsCollector();

    collector.recordChapter(createChapterMetrics({ chapter: 1 }));
    collector.recordChapter(createChapterMetrics({ chapter: 2 }));
    collector.recordChapter(createChapterMetrics({ chapter: 3 }));

    const metrics = collector.getMetrics();
    expect(metrics.chapters).toHaveLength(3);
    expect(metrics.chapters[0].chapter).toBe(1);
    expect(metrics.chapters[1].chapter).toBe(2);
    expect(metrics.chapters[2].chapter).toBe(3);
  });

  it('computes aggregate totals', () => {
    const collector = new MetricsCollector();

    collector.recordChapter(
      createChapterMetrics({
        chapter: 1,
        tokensUsed: 1000,
        conceptsDetected: 4,
        gapsFound: 2,
        processingTimeMs: 500,
      }),
    );
    collector.recordChapter(
      createChapterMetrics({
        chapter: 2,
        tokensUsed: 2000,
        conceptsDetected: 6,
        gapsFound: 1,
        processingTimeMs: 700,
      }),
    );
    collector.recordChapter(
      createChapterMetrics({
        chapter: 3,
        tokensUsed: 3000,
        conceptsDetected: 2,
        gapsFound: 3,
        processingTimeMs: 800,
      }),
    );

    const metrics = collector.getMetrics();
    expect(metrics.totals.tokensUsed).toBe(6000);
    expect(metrics.totals.tokensPerChapter).toBe(2000); // 6000 / 3
    expect(metrics.totals.conceptsPerChapter).toBe(4); // 12 / 3
    expect(metrics.totals.gapsPerChapter).toBe(2); // 6 / 3
    expect(metrics.totals.processingTimeMs).toBe(2000); // 500 + 700 + 800
    expect(metrics.totals.tokensPerConcept).toBe(500); // 6000 / 12
  });

  it('handles zero chapters gracefully', () => {
    const collector = new MetricsCollector();
    const metrics = collector.getMetrics();

    expect(metrics.chapters).toHaveLength(0);
    expect(metrics.totals.tokensUsed).toBe(0);
    expect(metrics.totals.tokensPerChapter).toBe(0);
    expect(metrics.totals.tokensPerConcept).toBe(0);
    expect(metrics.totals.conceptsPerChapter).toBe(0);
    expect(metrics.totals.gapsPerChapter).toBe(0);
    expect(metrics.totals.processingTimeMs).toBe(0);
    // No NaN values
    expect(Number.isNaN(metrics.totals.tokensPerChapter)).toBe(false);
    expect(Number.isNaN(metrics.totals.tokensPerConcept)).toBe(false);
  });

  it('computes performance characteristics', () => {
    const collector = new MetricsCollector();

    // Higher math density correlates with higher processing time
    collector.recordChapter(
      createChapterMetrics({
        chapter: 1,
        mathDensity: 0.1,
        processingTimeMs: 100,
      }),
    );
    collector.recordChapter(
      createChapterMetrics({
        chapter: 2,
        mathDensity: 0.5,
        processingTimeMs: 500,
      }),
    );
    collector.recordChapter(
      createChapterMetrics({
        chapter: 3,
        mathDensity: 0.9,
        processingTimeMs: 900,
      }),
    );

    const metrics = collector.getMetrics();
    // With perfectly correlated data, correlation should be close to 1
    expect(metrics.performance.mathDensityCorrelation).toBeGreaterThan(0.9);
    expect(metrics.performance.mathDensityCorrelation).toBeLessThanOrEqual(1);
  });

  it('serializes metrics to JSON', () => {
    const collector = new MetricsCollector();
    collector.recordChapter(createChapterMetrics());

    const json = collector.toJSON();
    const parsed = JSON.parse(json);

    expect(parsed.chapters).toHaveLength(1);
    expect(parsed.totals).toBeDefined();
    expect(parsed.totals.tokensUsed).toBeTypeOf('number');
    expect(parsed.performance).toBeDefined();
    expect(parsed.performance.mathDensityCorrelation).toBeTypeOf('number');
  });

  it('saves and loads metrics from disk', () => {
    const collector = new MetricsCollector();
    collector.recordChapter(createChapterMetrics({ chapter: 5, tokensUsed: 7777 }));
    collector.recordChapter(createChapterMetrics({ chapter: 6, tokensUsed: 8888 }));

    const filePath = path.join(tempDir, 'metrics.json');
    collector.save(filePath);

    expect(fs.existsSync(filePath)).toBe(true);
    // No temp file should remain
    expect(fs.existsSync(filePath + '.tmp')).toBe(false);

    const loaded = MetricsCollector.load(filePath);
    const metrics = loaded.getMetrics();

    expect(metrics.chapters).toHaveLength(2);
    expect(metrics.chapters[0].chapter).toBe(5);
    expect(metrics.totals.tokensUsed).toBe(7777 + 8888);
  });
});
