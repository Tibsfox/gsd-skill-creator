/**
 * Test run result types for skill validation execution.
 *
 * These types capture the results of running test cases against skills,
 * including metrics for accuracy tracking and historical storage.
 */

import type { TestExpectation } from './testing.js';

/**
 * Result of executing a single test case against a skill.
 *
 * Captures both the outcome and the data needed to understand
 * why the test passed or failed.
 */
export interface TestCaseResult {
  /** ID of the test case that was executed (from TestCase.id) */
  testId: string;

  /** The prompt that was tested (copy for display without re-lookup) */
  prompt: string;

  /** What the test expected (positive, negative, or edge-case) */
  expected: TestExpectation;

  /** Whether the test passed based on expected behavior and thresholds */
  passed: boolean;

  /** The actual similarity score from activation (0-1) */
  actualScore: number;

  /** Whether the skill would have activated for this prompt */
  wouldActivate: boolean;

  /** Human-readable explanation of why the test passed or failed */
  explanation: string;

  /** Whether this is an edge-case/borderline test (reported separately) */
  borderline?: boolean;
}

/**
 * Computed metrics for a test run.
 *
 * Provides accuracy statistics and false positive/negative counts
 * for evaluating skill quality.
 */
export interface RunMetrics {
  /** Total number of tests executed */
  total: number;

  /** Number of tests that passed */
  passed: number;

  /** Number of tests that failed */
  failed: number;

  /** Accuracy as percentage (0-100): passed / total */
  accuracy: number;

  /**
   * False positive rate as percentage (0-100): FP / (FP + TN)
   * Measures how often the skill activates when it shouldn't.
   */
  falsePositiveRate: number;

  /** True positives: positive tests that passed (skill correctly activated) */
  truePositives: number;

  /** True negatives: negative tests that passed (skill correctly didn't activate) */
  trueNegatives: number;

  /** False positives: negative tests that failed (skill activated when it shouldn't) */
  falsePositives: number;

  /** False negatives: positive tests that failed (skill didn't activate when it should) */
  falseNegatives: number;

  /** Number of edge-case tests (reported separately, not included in accuracy) */
  edgeCaseCount: number;

  /**
   * Precision: TP / (TP + FP)
   * Measures how many activations were correct. 0 when no positive predictions.
   */
  precision: number;

  /**
   * Recall: TP / (TP + FN)
   * Measures how many expected activations were caught. 0 when no actual positives.
   */
  recall: number;

  /**
   * F1 Score: harmonic mean of precision and recall.
   * 0 when both precision and recall are 0.
   */
  f1Score: number;
}

/**
 * Complete result of running tests for a skill.
 *
 * Groups results by expectation type for clear presentation
 * and includes all data needed for reporting.
 */
export interface TestRunResult {
  /** Name of the skill being tested */
  skillName: string;

  /** ISO timestamp when this test run started */
  runAt: string;

  /** Duration of the test run in milliseconds */
  duration: number;

  /** Computed metrics for this run */
  metrics: RunMetrics;

  /** All test results in execution order */
  results: TestCaseResult[];

  /** Positive test results (tests where skill should activate) */
  positiveResults: TestCaseResult[];

  /** Negative test results (tests where skill should not activate) */
  negativeResults: TestCaseResult[];

  /** Edge-case test results (borderline scenarios) */
  edgeCaseResults: TestCaseResult[];

  /** Improvement hints collected during the run */
  hints: string[];
}

/**
 * Snapshot of a test run for historical storage.
 *
 * Extends TestRunResult with additional metadata needed
 * for persistence and regression tracking.
 */
export interface TestRunSnapshot extends TestRunResult {
  /** Unique identifier for this snapshot (UUID) */
  id: string;

  /** Activation threshold used for this run */
  threshold: number;
}
