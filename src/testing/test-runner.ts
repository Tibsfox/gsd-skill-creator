/**
 * Test runner for skill validation.
 *
 * Orchestrates test execution by:
 * 1. Loading test cases from TestStore
 * 2. Running them through BatchSimulator
 * 3. Evaluating results against expectations
 * 4. Computing metrics (accuracy, FPR)
 * 5. Storing results to ResultStore
 */

import type { TestCase } from '../types/testing.js';
import type {
  TestCaseResult,
  RunMetrics,
  TestRunResult,
} from '../types/test-run.js';
import type { SimulationResult } from '../types/simulation.js';
import type { SkillScope } from '../types/scope.js';
import { TestStore } from './test-store.js';
import { ResultStore } from './result-store.js';
import { SkillStore } from '../storage/skill-store.js';
import { BatchSimulator } from '../simulation/batch-simulator.js';

/**
 * Options for running tests.
 */
export interface RunOptions {
  /** Activation threshold (default 0.75) */
  threshold?: number;
  /** Whether to store results in history (default true) */
  storeResults?: boolean;
  /** Progress callback */
  onProgress?: (progress: { current: number; total: number }) => void;
}

/**
 * TestRunner orchestrates test execution against the activation simulator.
 *
 * Connects test infrastructure (TestStore, ResultStore) with simulation
 * engine (BatchSimulator) to run tests and compute metrics.
 *
 * @example
 * ```typescript
 * const runner = new TestRunner(testStore, skillStore, resultStore, 'user');
 * const result = await runner.runForSkill('git-commit');
 * console.log(`Accuracy: ${result.metrics.accuracy}%`);
 * ```
 */
export class TestRunner {
  constructor(
    private testStore: TestStore,
    private skillStore: SkillStore,
    private resultStore: ResultStore,
    private scope: SkillScope
  ) {}

  /**
   * Run all tests for a skill and return complete results.
   *
   * @param skillName - Name of the skill to test
   * @param options - Run options (threshold, storeResults, onProgress)
   * @returns Complete test run result with metrics and grouped results
   * @throws Error if no test cases exist for the skill
   */
  async runForSkill(skillName: string, options?: RunOptions): Promise<TestRunResult> {
    const startTime = Date.now();
    const threshold = options?.threshold ?? 0.75;

    // a. Load test cases
    const tests = await this.testStore.list(skillName);
    if (tests.length === 0) {
      throw new Error(`No test cases found for skill "${skillName}"`);
    }

    // b. Load skill metadata
    const skill = await this.skillStore.read(skillName);
    const skillInfo = { name: skillName, description: skill.metadata.description };

    // c. Run simulation using BatchSimulator
    const simulator = new BatchSimulator({
      threshold,
      onProgress: options?.onProgress
        ? (p) => options.onProgress!({ current: p.current, total: p.total })
        : undefined,
    });
    const prompts = tests.map((t) => t.prompt);
    // Single skill array - we're testing against ONE skill
    const batchResult = await simulator.runTestSuite(prompts, [skillInfo]);

    // d. Evaluate each test against its expectation
    const results = tests.map((test, i) =>
      this.evaluateTest(test, batchResult.results[i], threshold)
    );

    // e. Group results by expectation type
    const positiveResults = results.filter((r) => r.expected === 'positive');
    const negativeResults = results.filter((r) => r.expected === 'negative');
    const edgeCaseResults = results.filter((r) => r.expected === 'edge-case');

    // f. Compute metrics
    const metrics = this.computeMetrics(results);

    // g. Collect improvement hints from failed tests
    const hints = this.collectHints(results, batchResult.results);

    // h. Build TestRunResult
    const duration = Date.now() - startTime;
    const runResult: TestRunResult = {
      skillName,
      runAt: new Date().toISOString(),
      duration,
      metrics,
      results,
      positiveResults,
      negativeResults,
      edgeCaseResults,
      hints,
    };

    // i. Store to history if storeResults !== false
    if (options?.storeResults !== false) {
      await this.resultStore.append(skillName, runResult, threshold);
    }

    // j. Return result
    return runResult;
  }

  /**
   * Evaluate a single test case against its simulation result.
   *
   * @param test - The test case definition
   * @param simResult - The simulation result for the test's prompt
   * @param threshold - The activation threshold used
   * @returns Evaluated test case result
   */
  private evaluateTest(
    test: TestCase,
    simResult: SimulationResult,
    threshold: number
  ): TestCaseResult {
    const winner = simResult.winner;
    const actualScore = winner?.similarity ?? 0;
    const wouldActivate = winner !== null;

    let passed: boolean;
    let explanation: string;

    switch (test.expected) {
      case 'positive':
        // Should activate, optionally with min confidence
        if (!wouldActivate) {
          passed = false;
          explanation = `Expected activation but skill did not activate (score: ${(actualScore * 100).toFixed(1)}%, below threshold ${(threshold * 100).toFixed(1)}%)`;
        } else if (test.minConfidence !== undefined && actualScore < test.minConfidence) {
          passed = false;
          explanation = `Activated but confidence ${(actualScore * 100).toFixed(1)}% below required ${(test.minConfidence * 100).toFixed(1)}%`;
        } else {
          passed = true;
          explanation = `Correctly activated at ${(actualScore * 100).toFixed(1)}%`;
        }
        break;

      case 'negative':
        // Should NOT activate, or be below max confidence
        if (!wouldActivate) {
          passed = true;
          explanation = `Correctly did not activate (score: ${(actualScore * 100).toFixed(1)}%)`;
        } else if (test.maxConfidence !== undefined && actualScore <= test.maxConfidence) {
          passed = true;
          explanation = `Activated but within acceptable threshold at ${(actualScore * 100).toFixed(1)}%`;
        } else {
          passed = false;
          explanation = `Should not activate but did at ${(actualScore * 100).toFixed(1)}%${test.reason ? ` (${test.reason})` : ''}`;
        }
        break;

      case 'edge-case':
        // Edge cases always "pass" but report their state
        passed = true;
        explanation = wouldActivate
          ? `Borderline: activated at ${(actualScore * 100).toFixed(1)}%`
          : `Borderline: did not activate (${(actualScore * 100).toFixed(1)}%)`;
        break;

      default:
        // Exhaustiveness check
        const _exhaustive: never = test.expected;
        throw new Error(`Unknown expectation: ${_exhaustive}`);
    }

    return {
      testId: test.id,
      prompt: test.prompt,
      expected: test.expected,
      passed,
      actualScore,
      wouldActivate,
      explanation,
      borderline: test.expected === 'edge-case',
    };
  }

  /**
   * Compute metrics from test results.
   *
   * Edge cases are excluded from accuracy calculations per CONTEXT.md.
   *
   * @param results - Array of test case results
   * @returns Computed run metrics
   */
  private computeMetrics(results: TestCaseResult[]): RunMetrics {
    // Separate edge cases - they don't count toward accuracy
    const scoredResults = results.filter((r) => r.expected !== 'edge-case');
    const edgeCaseCount = results.filter((r) => r.expected === 'edge-case').length;

    const positiveTests = scoredResults.filter((r) => r.expected === 'positive');
    const negativeTests = scoredResults.filter((r) => r.expected === 'negative');

    // True/False positives/negatives
    const truePositives = positiveTests.filter((r) => r.passed).length;
    const falseNegatives = positiveTests.filter((r) => !r.passed).length;
    const trueNegatives = negativeTests.filter((r) => r.passed).length;
    const falsePositives = negativeTests.filter((r) => !r.passed).length;

    const total = scoredResults.length;
    const passed = truePositives + trueNegatives;
    const failed = falsePositives + falseNegatives;

    // Accuracy = correct / total (excluding edge cases)
    const accuracy = total > 0 ? (passed / total) * 100 : 0;

    // FPR = FP / (FP + TN) - only considers negative tests
    // If no negative tests, FPR is 0 (no opportunity for false positives)
    const falsePositiveRate =
      falsePositives + trueNegatives > 0
        ? (falsePositives / (falsePositives + trueNegatives)) * 100
        : 0;

    // Precision: TP / (TP + FP) - how many activations were correct
    const precision = (truePositives + falsePositives) > 0
      ? truePositives / (truePositives + falsePositives)
      : 0;

    // Recall: TP / (TP + FN) - how many expected activations were caught
    const recall = (truePositives + falseNegatives) > 0
      ? truePositives / (truePositives + falseNegatives)
      : 0;

    // F1: harmonic mean of precision and recall
    const f1Score = (precision + recall) > 0
      ? 2 * (precision * recall) / (precision + recall)
      : 0;

    return {
      total,
      passed,
      failed,
      accuracy,
      falsePositiveRate,
      truePositives,
      trueNegatives,
      falsePositives,
      falseNegatives,
      edgeCaseCount,
      precision,
      recall,
      f1Score,
    };
  }

  /**
   * Collect improvement hints from failed tests.
   *
   * Extracts hints from simulation explanations and deduplicates.
   *
   * @param results - Test case results
   * @param simResults - Original simulation results (for explanations)
   * @returns Array of unique improvement hints
   */
  private collectHints(
    results: TestCaseResult[],
    simResults: SimulationResult[]
  ): string[] {
    const hints: Set<string> = new Set();

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const simResult = simResults[i];

      // Only collect hints from failed non-edge-case tests
      if (!result.passed && result.expected !== 'edge-case') {
        // For false negatives (should have activated but didn't)
        if (result.expected === 'positive' && !result.wouldActivate) {
          hints.add(
            `Consider adding keywords from: "${result.prompt.slice(0, 50)}${result.prompt.length > 50 ? '...' : ''}"`
          );
        }

        // For false positives (shouldn't have activated but did)
        if (result.expected === 'negative' && result.wouldActivate) {
          hints.add(
            `Skill description may be too broad - activated incorrectly for: "${result.prompt.slice(0, 50)}${result.prompt.length > 50 ? '...' : ''}"`
          );
        }

        // If simulation has challengers, note the competition
        if (simResult.challengers.length > 0) {
          const challengerNames = simResult.challengers
            .slice(0, 2)
            .map((c) => c.skillName)
            .join(', ');
          hints.add(`Close competition with: ${challengerNames}`);
        }
      }
    }

    return Array.from(hints);
  }
}
