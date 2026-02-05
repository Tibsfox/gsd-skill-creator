/**
 * Tests for BenchmarkReporter.
 */
import { describe, it, expect } from 'vitest';
import { BenchmarkReporter } from './benchmark-reporter.js';
import type { CalibrationEvent } from './calibration-types.js';

function createMockEvent(
  id: string,
  outcome: 'continued' | 'corrected' | 'unknown',
  bestScore: number,
  skillName: string = 'test-skill'
): CalibrationEvent {
  return {
    id,
    timestamp: '2026-02-05T12:00:00.000Z',
    prompt: `test prompt ${id}`,
    skillScores: [
      { skillName, similarity: bestScore, wouldActivate: bestScore >= 0.75 },
    ],
    activatedSkill: bestScore >= 0.75 ? skillName : null,
    outcome,
    threshold: 0.75,
  };
}

describe('BenchmarkReporter', () => {
  describe('computeReport', () => {
    it('computes correct metrics from sample events', () => {
      const reporter = new BenchmarkReporter();

      // Create events that produce known TP, FP, TN, FN
      const events: CalibrationEvent[] = [
        // True Positives: predicted yes, actual yes (continued with activation)
        createMockEvent('tp1', 'continued', 0.8),
        createMockEvent('tp2', 'continued', 0.9),
        createMockEvent('tp3', 'continued', 0.85),

        // False Positives: predicted yes, actual no (corrected the activation)
        createMockEvent('fp1', 'corrected', 0.8),

        // True Negatives: predicted no, actual no (no activation, user corrected or would have)
        createMockEvent('tn1', 'corrected', 0.5),
        createMockEvent('tn2', 'corrected', 0.6),

        // False Negatives: predicted no, actual yes (missed activation user wanted)
        createMockEvent('fn1', 'continued', 0.5),
        createMockEvent('fn2', 'continued', 0.6),
      ];

      const report = reporter.computeReport(events, 0.75);

      expect(report.metrics.truePositives).toBe(3);
      expect(report.metrics.falsePositives).toBe(1);
      expect(report.metrics.trueNegatives).toBe(2);
      expect(report.metrics.falseNegatives).toBe(2);
    });

    it('computes MCC correlation percentage accurately', () => {
      const reporter = new BenchmarkReporter();

      // 45 TP, 92 TN, 5 FP, 8 FN (from plan example)
      const events: CalibrationEvent[] = [];

      // Add True Positives
      for (let i = 0; i < 45; i++) {
        events.push(createMockEvent(`tp${i}`, 'continued', 0.8));
      }

      // Add True Negatives
      for (let i = 0; i < 92; i++) {
        events.push(createMockEvent(`tn${i}`, 'corrected', 0.5));
      }

      // Add False Positives
      for (let i = 0; i < 5; i++) {
        events.push(createMockEvent(`fp${i}`, 'corrected', 0.8));
      }

      // Add False Negatives
      for (let i = 0; i < 8; i++) {
        events.push(createMockEvent(`fn${i}`, 'continued', 0.5));
      }

      const report = reporter.computeReport(events, 0.75);

      // MCC = 0.809, should round to 81%
      expect(report.correlation).toBe(81);
    });

    it('generates recommendations for high FPR', () => {
      const reporter = new BenchmarkReporter();

      // Create scenario with high false positive rate
      const events: CalibrationEvent[] = [];

      // 10 TP
      for (let i = 0; i < 10; i++) {
        events.push(createMockEvent(`tp${i}`, 'continued', 0.8));
      }

      // 20 FP (high FPR)
      for (let i = 0; i < 20; i++) {
        events.push(createMockEvent(`fp${i}`, 'corrected', 0.8));
      }

      // 50 TN
      for (let i = 0; i < 50; i++) {
        events.push(createMockEvent(`tn${i}`, 'corrected', 0.5));
      }

      // 20 FN
      for (let i = 0; i < 20; i++) {
        events.push(createMockEvent(`fn${i}`, 'continued', 0.5));
      }

      const report = reporter.computeReport(events, 0.75);

      // FPR = 20 / (20 + 50) = 28.6% - above 10% threshold
      expect(report.recommendations).toContain(
        'Consider raising threshold to reduce false activations'
      );
    });

    it('generates recommendations for low recall', () => {
      const reporter = new BenchmarkReporter();

      // Create scenario with low recall
      const events: CalibrationEvent[] = [];

      // 20 TP
      for (let i = 0; i < 20; i++) {
        events.push(createMockEvent(`tp${i}`, 'continued', 0.8));
      }

      // 5 FP
      for (let i = 0; i < 5; i++) {
        events.push(createMockEvent(`fp${i}`, 'corrected', 0.8));
      }

      // 30 TN
      for (let i = 0; i < 30; i++) {
        events.push(createMockEvent(`tn${i}`, 'corrected', 0.5));
      }

      // 45 FN (low recall)
      for (let i = 0; i < 45; i++) {
        events.push(createMockEvent(`fn${i}`, 'continued', 0.5));
      }

      const report = reporter.computeReport(events, 0.75);

      // Recall = 20 / (20 + 45) = 30.8% - below 70% threshold
      expect(report.recommendations).toContain(
        'Consider lowering threshold to catch more valid prompts'
      );
    });

    it('generates recommendations for low data points', () => {
      const reporter = new BenchmarkReporter();

      const events: CalibrationEvent[] = [
        createMockEvent('tp1', 'continued', 0.8),
        createMockEvent('tn1', 'corrected', 0.5),
      ];

      const report = reporter.computeReport(events, 0.75);

      expect(report.recommendations.some(r =>
        r.includes('More data needed') && r.includes('have 2')
      )).toBe(true);
    });

    it('generates recommendations for low F1 score', () => {
      const reporter = new BenchmarkReporter();

      // Create scenario with low F1
      const events: CalibrationEvent[] = [];

      // 10 TP
      for (let i = 0; i < 10; i++) {
        events.push(createMockEvent(`tp${i}`, 'continued', 0.8));
      }

      // 30 FP (poor precision)
      for (let i = 0; i < 30; i++) {
        events.push(createMockEvent(`fp${i}`, 'corrected', 0.8));
      }

      // 30 TN
      for (let i = 0; i < 30; i++) {
        events.push(createMockEvent(`tn${i}`, 'corrected', 0.5));
      }

      // 30 FN (poor recall)
      for (let i = 0; i < 30; i++) {
        events.push(createMockEvent(`fn${i}`, 'continued', 0.5));
      }

      const report = reporter.computeReport(events, 0.75);

      // Precision = 10/40 = 25%, Recall = 10/40 = 25%, F1 = 25%
      expect(report.recommendations).toContain(
        'Consider refining skill descriptions for better differentiation'
      );
    });

    it('handles empty events gracefully', () => {
      const reporter = new BenchmarkReporter();
      const report = reporter.computeReport([], 0.75);

      expect(report.correlation).toBe(0);
      expect(report.dataPoints).toBe(0);
      expect(report.recommendations).toContain(
        'No calibration data available. Use skills to collect data.'
      );
    });

    it('filters out unknown outcomes', () => {
      const reporter = new BenchmarkReporter();

      const events: CalibrationEvent[] = [
        createMockEvent('tp1', 'continued', 0.8),
        createMockEvent('unk1', 'unknown', 0.8),  // Should be filtered
        createMockEvent('unk2', 'unknown', 0.5),  // Should be filtered
        createMockEvent('tn1', 'corrected', 0.5),
      ];

      const report = reporter.computeReport(events, 0.75);

      expect(report.dataPoints).toBe(2);  // Only continued and corrected
      expect(report.metrics.truePositives).toBe(1);
      expect(report.metrics.trueNegatives).toBe(1);
    });

    it('computes date range from events', () => {
      const reporter = new BenchmarkReporter();

      const events: CalibrationEvent[] = [
        {
          ...createMockEvent('1', 'continued', 0.8),
          timestamp: '2026-02-01T10:00:00.000Z',
        },
        {
          ...createMockEvent('2', 'continued', 0.8),
          timestamp: '2026-02-05T15:00:00.000Z',
        },
        {
          ...createMockEvent('3', 'corrected', 0.5),
          timestamp: '2026-02-03T12:00:00.000Z',
        },
      ];

      const report = reporter.computeReport(events, 0.75);

      expect(report.dateRange.from).toBe('2026-02-01T10:00:00.000Z');
      expect(report.dateRange.to).toBe('2026-02-05T15:00:00.000Z');
    });

    it('includes skill breakdown in verbose mode', () => {
      const reporter = new BenchmarkReporter();

      const events: CalibrationEvent[] = [
        createMockEvent('1', 'continued', 0.8, 'skill-a'),
        createMockEvent('2', 'continued', 0.9, 'skill-a'),
        createMockEvent('3', 'corrected', 0.8, 'skill-b'),
        createMockEvent('4', 'continued', 0.85, 'skill-b'),
      ];

      const reportNonVerbose = reporter.computeReport(events, 0.75, false);
      const reportVerbose = reporter.computeReport(events, 0.75, true);

      expect(reportNonVerbose.skillBreakdown).toBeUndefined();
      expect(reportVerbose.skillBreakdown).toBeDefined();
      expect(reportVerbose.skillBreakdown!.length).toBe(2);
    });
  });

  describe('formatTerminal', () => {
    it('includes all required sections', () => {
      const reporter = new BenchmarkReporter();

      const events: CalibrationEvent[] = [
        createMockEvent('tp1', 'continued', 0.8),
        createMockEvent('tn1', 'corrected', 0.5),
      ];

      const report = reporter.computeReport(events, 0.75);
      const output = reporter.formatTerminal(report, false);

      // Check required sections
      expect(output).toContain('Simulator Benchmark Report');
      expect(output).toContain('Correlation:');
      expect(output).toContain('Data points:');
      expect(output).toContain('Confusion Matrix:');
      expect(output).toContain('TP:');
      expect(output).toContain('FP:');
      expect(output).toContain('TN:');
      expect(output).toContain('FN:');
      expect(output).toContain('Accuracy:');
      expect(output).toContain('Precision:');
      expect(output).toContain('Recall:');
      expect(output).toContain('F1 Score:');
      expect(output).toContain('False Positive Rate:');
      expect(output).toContain('Recommendations:');
    });

    it('includes skill breakdown in verbose mode', () => {
      const reporter = new BenchmarkReporter();

      const events: CalibrationEvent[] = [
        createMockEvent('1', 'continued', 0.8, 'skill-a'),
        createMockEvent('2', 'corrected', 0.5, 'skill-b'),
      ];

      const report = reporter.computeReport(events, 0.75, true);
      const output = reporter.formatTerminal(report, true);

      expect(output).toContain('Per-Skill Breakdown:');
      expect(output).toContain('skill-a');
    });
  });

  describe('formatJSON', () => {
    it('returns valid JSON', () => {
      const reporter = new BenchmarkReporter();

      const events: CalibrationEvent[] = [
        createMockEvent('tp1', 'continued', 0.8),
        createMockEvent('tn1', 'corrected', 0.5),
      ];

      const report = reporter.computeReport(events, 0.75);
      const json = reporter.formatJSON(report);

      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('includes all report fields', () => {
      const reporter = new BenchmarkReporter();

      const events: CalibrationEvent[] = [
        createMockEvent('tp1', 'continued', 0.8),
      ];

      const report = reporter.computeReport(events, 0.75);
      const json = reporter.formatJSON(report);
      const parsed = JSON.parse(json);

      expect(parsed).toHaveProperty('correlation');
      expect(parsed).toHaveProperty('metrics');
      expect(parsed.metrics).toHaveProperty('truePositives');
      expect(parsed.metrics).toHaveProperty('trueNegatives');
      expect(parsed.metrics).toHaveProperty('falsePositives');
      expect(parsed.metrics).toHaveProperty('falseNegatives');
      expect(parsed.metrics).toHaveProperty('accuracy');
      expect(parsed.metrics).toHaveProperty('precision');
      expect(parsed.metrics).toHaveProperty('recall');
      expect(parsed.metrics).toHaveProperty('f1Score');
      expect(parsed.metrics).toHaveProperty('falsePositiveRate');
      expect(parsed).toHaveProperty('dataPoints');
      expect(parsed).toHaveProperty('dateRange');
      expect(parsed).toHaveProperty('currentThreshold');
      expect(parsed).toHaveProperty('recommendations');
    });
  });

  describe('getJSONPath', () => {
    it('returns path in ~/.gsd-skill/calibration/', () => {
      const reporter = new BenchmarkReporter();
      const path = reporter.getJSONPath();

      expect(path).toContain('.gsd-skill');
      expect(path).toContain('calibration');
      expect(path).toContain('benchmark.json');
    });
  });
});
