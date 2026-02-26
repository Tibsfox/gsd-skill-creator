import * as fs from 'fs';
import type { IngestionMetrics, ChapterMetrics } from './types.js';

/**
 * Collects per-chapter performance metrics for the v1.40 ingestion
 * pipeline and computes aggregate totals including Pearson correlation
 * of math density vs processing time.
 *
 * Satisfies: HARNESS-03 (per-chapter metrics with expected schema).
 */
export class MetricsCollector {
  private chapters: ChapterMetrics[] = [];
  private wallClockStartMs: number;

  constructor() {
    this.wallClockStartMs = Date.now();
  }

  /**
   * Record metrics for a single chapter.
   */
  recordChapter(metrics: ChapterMetrics): void {
    this.chapters.push({ ...metrics });
  }

  /**
   * Compute and return the full metrics object with aggregates.
   */
  getMetrics(): IngestionMetrics {
    const count = this.chapters.length;

    const totalTokens = this.sum((c) => c.tokensUsed);
    const totalConcepts = this.sum((c) => c.conceptsDetected);
    const totalGaps = this.sum((c) => c.gapsFound);
    const totalProcessingMs = this.sum((c) => c.processingTimeMs);

    return {
      chapters: this.chapters.map((c) => ({ ...c })),
      totals: {
        tokensUsed: totalTokens,
        tokensPerChapter: count > 0 ? totalTokens / count : 0,
        tokensPerConcept: totalConcepts > 0 ? totalTokens / totalConcepts : 0,
        conceptsPerChapter: count > 0 ? totalConcepts / count : 0,
        gapsPerChapter: count > 0 ? totalGaps / count : 0,
        processingTimeMs: totalProcessingMs,
        wallClockTimeMs: Date.now() - this.wallClockStartMs,
      },
      performance: {
        extractionTokensPerPage: 0, // populated later by extraction phase
        learningTokensPerChunk: 0, // populated later
        verificationTokensPerConcept: 0, // populated later
        checkpointOverheadMs: 0, // populated later
        mathDensityCorrelation: this.computePearsonCorrelation(),
      },
    };
  }

  /**
   * Serialize the current metrics to JSON.
   */
  toJSON(): string {
    return JSON.stringify(this.getMetrics(), null, 2);
  }

  /**
   * Save metrics to disk using atomic write (temp + rename).
   */
  save(filePath: string): void {
    const json = this.toJSON();
    const tmpPath = filePath + '.tmp';
    fs.writeFileSync(tmpPath, json, 'utf-8');
    fs.renameSync(tmpPath, filePath);
  }

  /**
   * Load a MetricsCollector from a file on disk, restoring
   * chapter data for continued aggregation.
   */
  static load(filePath: string): MetricsCollector {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data: IngestionMetrics = JSON.parse(raw);

    const collector = new MetricsCollector();
    // Back-compute wallClockStartMs from stored wallClockTimeMs
    collector.wallClockStartMs =
      Date.now() - data.totals.wallClockTimeMs;

    for (const chapter of data.chapters) {
      collector.chapters.push(chapter);
    }

    return collector;
  }

  /**
   * Compute Pearson correlation coefficient between mathDensity
   * and processingTimeMs. Returns 0 if fewer than 2 data points.
   */
  private computePearsonCorrelation(): number {
    const n = this.chapters.length;
    if (n < 2) return 0;

    const xs = this.chapters.map((c) => c.mathDensity);
    const ys = this.chapters.map((c) => c.processingTimeMs);

    const sumX = xs.reduce((a, b) => a + b, 0);
    const sumY = ys.reduce((a, b) => a + b, 0);
    const sumXY = xs.reduce((acc, x, i) => acc + x * ys[i], 0);
    const sumX2 = xs.reduce((acc, x) => acc + x * x, 0);
    const sumY2 = ys.reduce((acc, y) => acc + y * y, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt(
      (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY),
    );

    if (denominator === 0) return 0;

    const r = numerator / denominator;
    // Clamp to [-1, 1] for floating point edge cases
    return Math.max(-1, Math.min(1, r));
  }

  /**
   * Sum a numeric field across all chapters.
   */
  private sum(fn: (c: ChapterMetrics) => number): number {
    return this.chapters.reduce((acc, c) => acc + fn(c), 0);
  }
}
