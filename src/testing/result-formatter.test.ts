import { describe, it, expect } from 'vitest';
import { ResultFormatter, formatTestResults, formatJSON } from './result-formatter.js';
import type { TestRunResult, TestCaseResult, RunMetrics } from '../types/test-run.js';

/**
 * Create a mock test case result for testing.
 */
function createMockResult(
  overrides: Partial<TestCaseResult> = {}
): TestCaseResult {
  return {
    testId: 'test-123',
    prompt: 'Can you help me with authentication?',
    expected: 'positive',
    passed: true,
    actualScore: 0.85,
    wouldActivate: true,
    explanation: 'Skill would activate at high confidence',
    ...overrides,
  };
}

/**
 * Create mock run metrics for testing.
 */
function createMockMetrics(overrides: Partial<RunMetrics> = {}): RunMetrics {
  return {
    total: 10,
    passed: 8,
    failed: 2,
    accuracy: 80.0,
    falsePositiveRate: 10.0,
    truePositives: 5,
    trueNegatives: 3,
    falsePositives: 1,
    falseNegatives: 1,
    edgeCaseCount: 2,
    precision: 0.833,
    recall: 0.833,
    f1Score: 0.833,
    ...overrides,
  };
}

/**
 * Create a mock test run result for testing.
 */
function createMockRunResult(
  overrides: Partial<TestRunResult> = {}
): TestRunResult {
  const positivePass = createMockResult({
    testId: 'pos-1',
    prompt: 'Handle user login',
    expected: 'positive',
    passed: true,
    actualScore: 0.88,
  });

  const positiveFail = createMockResult({
    testId: 'pos-2',
    prompt: 'Process auth tokens',
    expected: 'positive',
    passed: false,
    actualScore: 0.45,
    wouldActivate: false,
    explanation: 'Confidence below threshold',
  });

  const negativePass = createMockResult({
    testId: 'neg-1',
    prompt: 'Make a sandwich',
    expected: 'negative',
    passed: true,
    actualScore: 0.25,
    wouldActivate: false,
    explanation: 'Correctly did not activate',
  });

  const negativeFail = createMockResult({
    testId: 'neg-2',
    prompt: 'Log errors to console',
    expected: 'negative',
    passed: false,
    actualScore: 0.78,
    wouldActivate: true,
    explanation: 'Incorrectly activated - belongs to logging-skill',
  });

  const edgeCase = createMockResult({
    testId: 'edge-1',
    prompt: 'Check user permissions maybe',
    expected: 'edge-case',
    passed: true,
    actualScore: 0.72,
    wouldActivate: false,
    borderline: true,
    explanation: 'Borderline case handled correctly',
  });

  return {
    skillName: 'auth-skill',
    runAt: '2026-02-05T14:30:00Z',
    duration: 234,
    metrics: createMockMetrics(),
    results: [positivePass, positiveFail, negativePass, negativeFail, edgeCase],
    positiveResults: [positivePass, positiveFail],
    negativeResults: [negativePass, negativeFail],
    edgeCaseResults: [edgeCase],
    hints: ['Add more authentication-related terms', 'Consider adding "oauth" keyword'],
    ...overrides,
  };
}

describe('ResultFormatter', () => {
  const formatter = new ResultFormatter();

  describe('formatTerminal', () => {
    it('should include skill name in header', () => {
      const result = createMockRunResult();
      const output = formatter.formatTerminal(result);

      expect(output).toContain('Test Results:');
      expect(output).toContain('auth-skill');
    });

    it('should group results by expectation type', () => {
      const result = createMockRunResult();
      const output = formatter.formatTerminal(result);

      // Check section headers appear in order
      const positiveIdx = output.indexOf('Positive Tests');
      const negativeIdx = output.indexOf('Negative Tests');
      const edgeIdx = output.indexOf('Edge Cases');

      expect(positiveIdx).toBeLessThan(negativeIdx);
      expect(negativeIdx).toBeLessThan(edgeIdx);
    });

    it('should show PASS for passing tests', () => {
      const result = createMockRunResult();
      const output = formatter.formatTerminal(result);

      // Should contain PASS (with ANSI color codes)
      expect(output).toContain('PASS');
    });

    it('should show FAIL for failing tests', () => {
      const result = createMockRunResult();
      const output = formatter.formatTerminal(result);

      // Should contain FAIL (with ANSI color codes)
      expect(output).toContain('FAIL');
    });

    it('should show expected, actual, and explanation for failures', () => {
      const result = createMockRunResult();
      const output = formatter.formatTerminal(result);

      // Check failure diagnostic info
      expect(output).toContain('Expected:');
      expect(output).toContain('should activate');
      expect(output).toContain('Actual:');
      expect(output).toContain('did not activate');
      expect(output).toContain('Confidence below threshold');
    });

    it('should show confidence scores when verbose', () => {
      const result = createMockRunResult();
      const output = formatter.formatTerminal(result, { verbose: true });

      // Verbose mode includes percentage scores
      expect(output).toContain('%]');
    });

    it('should not show confidence scores by default', () => {
      const result = createMockRunResult();
      const output = formatter.formatTerminal(result, { verbose: false });

      // Default mode should not have score suffix on passing tests
      // (failures always show score in the Actual line)
      // Look for the pattern of a passing test without score suffix
      expect(output).toContain('PASS  "Handle user login"');
    });

    it('should use borderline language for edge cases', () => {
      const result = createMockRunResult();
      const output = formatter.formatTerminal(result);

      expect(output).toContain('borderline scenarios');
    });

    it('should display summary metrics', () => {
      const result = createMockRunResult();
      const output = formatter.formatTerminal(result);

      expect(output).toContain('Summary');
      expect(output).toContain('Total:');
      expect(output).toContain('Passed:');
      expect(output).toContain('False Positive Rate:');
      expect(output).toContain('Duration:');
    });

    it('should show improvement hints', () => {
      const result = createMockRunResult();
      const output = formatter.formatTerminal(result);

      expect(output).toContain('Improvement Hints');
      expect(output).toContain('authentication-related terms');
    });

    it('should hide hints when showHints is false', () => {
      const result = createMockRunResult();
      const output = formatter.formatTerminal(result, { showHints: false });

      expect(output).not.toContain('Improvement Hints');
    });
  });

  describe('formatTestGroup', () => {
    it('should truncate long prompts', () => {
      const longPrompt =
        'This is a very long prompt that exceeds the sixty character limit for display purposes';
      const result = createMockResult({ prompt: longPrompt });

      const lines = formatter.formatTestGroup([result]);

      // Should be truncated with ellipsis
      expect(lines[0]).toContain('...');
      expect(lines[0].length).toBeLessThan(longPrompt.length + 20);
    });

    it('should indent failure details', () => {
      const result = createMockResult({
        passed: false,
        explanation: 'Test explanation here',
      });

      const lines = formatter.formatTestGroup([result]);

      // Failure details should be indented
      expect(lines[1]).toMatch(/^\s+Expected:/);
      expect(lines[2]).toMatch(/^\s+Actual:/);
    });
  });

  describe('formatEdgeCases', () => {
    it('should use circle marker instead of PASS/FAIL', () => {
      const edgeCase = createMockResult({
        expected: 'edge-case',
        borderline: true,
      });

      const lines = formatter.formatEdgeCases([edgeCase]);

      // Should use circle character, not PASS/FAIL
      expect(lines[0]).not.toContain('PASS');
      expect(lines[0]).not.toContain('FAIL');
      // Circle character (U+25CB)
      expect(lines[0]).toContain('\u25cb');
    });

    it('should show activation status with score', () => {
      const activated = createMockResult({
        expected: 'edge-case',
        wouldActivate: true,
        actualScore: 0.78,
      });

      const notActivated = createMockResult({
        expected: 'edge-case',
        wouldActivate: false,
        actualScore: 0.48,
      });

      const activatedLines = formatter.formatEdgeCases([activated]);
      const notActivatedLines = formatter.formatEdgeCases([notActivated]);

      expect(activatedLines[0]).toContain('activated');
      expect(activatedLines[0]).toContain('78.0%');
      expect(notActivatedLines[0]).toContain('did not activate');
      expect(notActivatedLines[0]).toContain('48.0%');
    });
  });

  describe('formatMetrics', () => {
    it('should display total with breakdown', () => {
      const metrics = createMockMetrics();
      const output = formatter.formatMetrics(metrics);

      expect(output).toContain('Total: 10 tests');
      expect(output).toContain('positive');
      expect(output).toContain('negative');
    });

    it('should color-code accuracy based on threshold', () => {
      // High accuracy (>= 90%)
      const highMetrics = createMockMetrics({ accuracy: 95.0 });
      const highOutput = formatter.formatMetrics(highMetrics);
      // Should contain green ANSI code (hard to test directly)
      expect(highOutput).toContain('95.0%');

      // Medium accuracy (>= 70%)
      const medMetrics = createMockMetrics({ accuracy: 75.0 });
      const medOutput = formatter.formatMetrics(medMetrics);
      expect(medOutput).toContain('75.0%');

      // Low accuracy (< 70%)
      const lowMetrics = createMockMetrics({ accuracy: 50.0 });
      const lowOutput = formatter.formatMetrics(lowMetrics);
      expect(lowOutput).toContain('50.0%');
    });

    it('should display FPR', () => {
      const metrics = createMockMetrics({ falsePositiveRate: 5.0 });
      const output = formatter.formatMetrics(metrics);

      expect(output).toContain('False Positive Rate:');
      expect(output).toContain('5.0%');
    });

    it('should display Precision line', () => {
      const metrics = createMockMetrics({ precision: 0.85, recall: 0.9, f1Score: 0.874 });
      const output = formatter.formatMetrics(metrics);

      expect(output).toContain('Precision:');
    });

    it('should display Recall line', () => {
      const metrics = createMockMetrics({ precision: 0.85, recall: 0.9, f1Score: 0.874 });
      const output = formatter.formatMetrics(metrics);

      expect(output).toContain('Recall:');
    });

    it('should display F1 Score line', () => {
      const metrics = createMockMetrics({ precision: 0.85, recall: 0.9, f1Score: 0.874 });
      const output = formatter.formatMetrics(metrics);

      expect(output).toContain('F1 Score:');
    });

    it('should display duration when provided', () => {
      const metrics = createMockMetrics();
      const output = formatter.formatMetrics(metrics, 234);

      expect(output).toContain('Duration: 234ms');
    });

    it('should not display duration when undefined', () => {
      const metrics = createMockMetrics();
      const output = formatter.formatMetrics(metrics);

      expect(output).not.toContain('Duration:');
    });
  });

  describe('formatHints', () => {
    it('should return empty string for no hints', () => {
      const output = formatter.formatHints([]);
      expect(output).toBe('');
    });

    it('should format hints as bulleted list', () => {
      const output = formatter.formatHints(['Hint 1', 'Hint 2']);

      expect(output).toContain('Improvement Hints');
      expect(output).toContain('\u2022 Hint 1');
      expect(output).toContain('\u2022 Hint 2');
    });

    it('should deduplicate hints', () => {
      const output = formatter.formatHints(['Same hint', 'Same hint', 'Different hint']);

      // Count occurrences of 'Same hint'
      const matches = output.match(/Same hint/g);
      expect(matches?.length).toBe(1);
    });
  });

  describe('formatJSON - compact mode', () => {
    it('should produce one line summary first', () => {
      const result = createMockRunResult();
      const output = formatter.formatJSON(result, 'compact');

      const lines = output.split('\n');
      const summary = JSON.parse(lines[0]);

      expect(summary.skill).toBe('auth-skill');
      expect(summary.accuracy).toBe(80.0);
      expect(summary.fpr).toBe(10.0);
      expect(summary.passed).toBe(8);
      expect(summary.failed).toBe(2);
      expect(summary.duration).toBe(234);
    });

    it('should produce one line per test', () => {
      const result = createMockRunResult();
      const output = formatter.formatJSON(result, 'compact');

      const lines = output.split('\n');
      // First line is summary, rest are tests
      expect(lines.length).toBe(result.results.length + 1);
    });

    it('should be parseable as JSON', () => {
      const result = createMockRunResult();
      const output = formatter.formatJSON(result, 'compact');

      const lines = output.split('\n');
      for (const line of lines) {
        expect(() => JSON.parse(line)).not.toThrow();
      }
    });

    it('should include precision, recall, f1Score in compact summary', () => {
      const result = createMockRunResult({
        metrics: createMockMetrics({ precision: 0.85, recall: 0.9, f1Score: 0.874 }),
      });
      const output = formatter.formatJSON(result, 'compact');

      const lines = output.split('\n');
      const summary = JSON.parse(lines[0]);

      expect(summary).toHaveProperty('precision');
      expect(summary).toHaveProperty('recall');
      expect(summary).toHaveProperty('f1Score');
    });

    it('should include test result fields', () => {
      const result = createMockRunResult();
      const output = formatter.formatJSON(result, 'compact');

      const lines = output.split('\n');
      const testLine = JSON.parse(lines[1]);

      expect(testLine).toHaveProperty('test');
      expect(testLine).toHaveProperty('passed');
      expect(testLine).toHaveProperty('expected');
      expect(testLine).toHaveProperty('actual');
    });
  });

  describe('formatJSON - pretty mode', () => {
    it('should produce valid nested JSON', () => {
      const result = createMockRunResult();
      const output = formatter.formatJSON(result, 'pretty');

      const parsed = JSON.parse(output);
      expect(parsed.skill).toBe('auth-skill');
      expect(parsed.runAt).toBe('2026-02-05T14:30:00Z');
    });

    it('should include metrics with confusion matrix', () => {
      const result = createMockRunResult();
      const output = formatter.formatJSON(result, 'pretty');

      const parsed = JSON.parse(output);
      expect(parsed.metrics.confusion).toBeDefined();
      expect(parsed.metrics.confusion.truePositives).toBe(5);
      expect(parsed.metrics.confusion.falseNegatives).toBe(1);
    });

    it('should group results by type', () => {
      const result = createMockRunResult();
      const output = formatter.formatJSON(result, 'pretty');

      const parsed = JSON.parse(output);
      expect(parsed.results.positive).toHaveLength(2);
      expect(parsed.results.negative).toHaveLength(2);
      expect(parsed.results.edgeCases).toHaveLength(1);
    });

    it('should include precision, recall, f1Score in pretty metrics', () => {
      const result = createMockRunResult({
        metrics: createMockMetrics({ precision: 0.85, recall: 0.9, f1Score: 0.874 }),
      });
      const output = formatter.formatJSON(result, 'pretty');

      const parsed = JSON.parse(output);
      expect(parsed.metrics).toHaveProperty('precision');
      expect(parsed.metrics).toHaveProperty('recall');
      expect(parsed.metrics).toHaveProperty('f1Score');
    });

    it('should include hints array', () => {
      const result = createMockRunResult();
      const output = formatter.formatJSON(result, 'pretty');

      const parsed = JSON.parse(output);
      expect(parsed.hints).toHaveLength(2);
      expect(parsed.hints[0]).toContain('authentication');
    });

    it('should be properly indented', () => {
      const result = createMockRunResult();
      const output = formatter.formatJSON(result, 'pretty');

      // Pretty print should have indentation
      expect(output).toContain('  ');
      expect(output).toContain('\n');
    });
  });

  describe('edge case handling', () => {
    it('should handle empty results array', () => {
      const result = createMockRunResult({
        results: [],
        positiveResults: [],
        negativeResults: [],
        edgeCaseResults: [],
        hints: [],
        metrics: createMockMetrics({
          total: 0,
          passed: 0,
          failed: 0,
          accuracy: 100,
          falsePositiveRate: 0,
          truePositives: 0,
          trueNegatives: 0,
          falsePositives: 0,
          falseNegatives: 0,
          edgeCaseCount: 0,
        }),
      });

      const output = formatter.formatTerminal(result);

      expect(output).toContain('Test Results:');
      expect(output).toContain('Summary');
      expect(output).toContain('Total: 0 tests');
    });

    it('should handle all tests passing', () => {
      const passing = createMockResult({ passed: true });
      const result = createMockRunResult({
        results: [passing],
        positiveResults: [passing],
        negativeResults: [],
        edgeCaseResults: [],
        metrics: createMockMetrics({
          total: 1,
          passed: 1,
          failed: 0,
          accuracy: 100,
        }),
      });

      const output = formatter.formatTerminal(result);

      expect(output).toContain('PASS');
      expect(output).not.toContain('FAIL');
    });

    it('should handle all tests failing', () => {
      const failing = createMockResult({
        passed: false,
        explanation: 'All failed',
      });
      const result = createMockRunResult({
        results: [failing],
        positiveResults: [failing],
        negativeResults: [],
        edgeCaseResults: [],
        metrics: createMockMetrics({
          total: 1,
          passed: 0,
          failed: 1,
          accuracy: 0,
        }),
      });

      const output = formatter.formatTerminal(result);

      expect(output).toContain('FAIL');
      expect(output).toContain('0.0%');
    });

    it('should handle only edge cases', () => {
      const edgeCase = createMockResult({
        expected: 'edge-case',
        borderline: true,
      });
      const result = createMockRunResult({
        results: [edgeCase],
        positiveResults: [],
        negativeResults: [],
        edgeCaseResults: [edgeCase],
        hints: [],
        metrics: createMockMetrics({
          total: 1,
          passed: 1,
          failed: 0,
          accuracy: 100,
          edgeCaseCount: 1,
          truePositives: 0,
          trueNegatives: 0,
        }),
      });

      const output = formatter.formatTerminal(result);

      expect(output).toContain('Edge Cases');
      expect(output).not.toContain('Positive Tests');
      expect(output).not.toContain('Negative Tests');
    });
  });
});

describe('Convenience functions', () => {
  describe('formatTestResults', () => {
    it('should format as terminal output', () => {
      const result = createMockRunResult();
      const output = formatTestResults(result);

      expect(output).toContain('Test Results:');
      expect(output).toContain('Summary');
    });

    it('should accept options', () => {
      const result = createMockRunResult();
      const output = formatTestResults(result, { verbose: true });

      expect(output).toContain('%]');
    });
  });

  describe('formatJSON', () => {
    it('should default to pretty mode', () => {
      const result = createMockRunResult();
      const output = formatJSON(result);

      // Pretty mode has indentation
      expect(output).toContain('  "skill"');
    });

    it('should accept mode parameter', () => {
      const result = createMockRunResult();
      const compactOutput = formatJSON(result, 'compact');
      const prettyOutput = formatJSON(result, 'pretty');

      // Compact is multiple lines but each is a single JSON object
      const compactLines = compactOutput.split('\n');
      expect(compactLines.length).toBeGreaterThan(1);
      expect(() => JSON.parse(compactLines[0])).not.toThrow();

      // Pretty is one JSON object with indentation
      expect(() => JSON.parse(prettyOutput)).not.toThrow();
      expect(prettyOutput).toContain('  ');
    });
  });
});
