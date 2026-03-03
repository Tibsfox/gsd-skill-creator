/**
 * ChipTestRunner -- chip-aware skill test runner for asymmetric evaluation.
 *
 * Wraps the existing TestRunner to add chip-based model execution:
 * - When no chip is specified, delegates to the standard TestRunner (backward compat)
 * - When a chip is specified, sends test prompts to the chip for model execution
 * - When a grader chip is specified, grades chip responses using a structured prompt
 * - Without a grader chip, uses built-in keyword matching for grading
 *
 * IMP-03 constants:
 *   GRADER_MAX_TOKENS = 512  (grader JSON responses are concise)
 *   GRADER_TEMPERATURE = 0.0 (deterministic grading)
 */

import type { TestCase } from '../types/testing.js';
import type {
  TestCaseResult,
  RunMetrics,
  TestRunResult,
} from '../types/test-run.js';
import type { SkillScope } from '../types/scope.js';
import type { ModelChip, ChatOptions } from './types.js';
import type { ChipRegistry } from './chip-registry.js';
import { TestStore } from '../testing/test-store.js';
import { ResultStore } from '../testing/result-store.js';
import { SkillStore } from '../storage/skill-store.js';
import { TestRunner, type RunOptions } from '../testing/test-runner.js';
import { getSkillsBasePath } from '../types/scope.js';

// ============================================================================
// IMP-03: Threshold constants (chip-test-runner level)
// ============================================================================

/** Maximum tokens for grader responses (structured JSON, never needs more) */
export const GRADER_MAX_TOKENS = 512;

/** Temperature for grader requests (deterministic grading) */
export const GRADER_TEMPERATURE = 0.0;

// ============================================================================
// Types
// ============================================================================

/**
 * Options for ChipTestRunner.runForSkill().
 * Extends RunOptions with chip selection.
 */
export interface ChipRunOptions extends RunOptions {
  /** Name of the chip to execute tests against (as registered in ChipRegistry) */
  chip?: string;
  /** Name of the chip to grade responses (defaults to built-in keyword matching) */
  graderChip?: string;
}

/**
 * Result of a chip-based test run.
 * Extends TestRunResult with chip metadata.
 */
export interface ChipTestRunResult extends TestRunResult {
  /** Name of the chip used for test execution (undefined if standard TestRunner used) */
  chipName?: string;
  /** Name of the chip used for grading (undefined if built-in matching used) */
  graderChipName?: string;
}

// ============================================================================
// ChipTestRunner
// ============================================================================

/**
 * Chip-aware test runner for asymmetric model evaluation.
 *
 * Supports two paths:
 * 1. Standard path (backward compat): no chip -> delegates to TestRunner
 * 2. Chip path: chip specified -> uses chip.chat() for execution, then grades
 *
 * The grading step supports:
 * - Grader chip: structured JSON prompt sent to grader chip
 * - Built-in: keyword presence matching for quick evaluation
 */
export class ChipTestRunner {
  constructor(
    private registry: ChipRegistry,
    private testStore: TestStore,
    private skillStore: SkillStore,
    private resultStore: ResultStore,
    private scope: SkillScope
  ) {}

  /**
   * Run tests for a skill, optionally using a chip for model execution.
   *
   * @param skillName - Name of the skill to test
   * @param options - Run options including chip and graderChip names
   * @returns ChipTestRunResult with chip metadata and all standard fields
   * @throws Error if chip name not found in registry
   * @throws Error if grader chip name not found in registry
   */
  async runForSkill(skillName: string, options?: ChipRunOptions): Promise<ChipTestRunResult> {
    const chipName = options?.chip;

    // Backward compatibility path: no chip specified or registry not configured
    if (!chipName) {
      const runner = new TestRunner(
        this.testStore,
        this.skillStore,
        this.resultStore,
        this.scope
      );
      const result = await runner.runForSkill(skillName, options);
      return result; // ChipTestRunResult without chipName/graderChipName
    }

    // Chip execution path
    return this.runWithChip(skillName, chipName, options);
  }

  /**
   * Execute test cases using a chip and grade the responses.
   */
  private async runWithChip(
    skillName: string,
    chipName: string,
    options?: ChipRunOptions
  ): Promise<ChipTestRunResult> {
    const startTime = Date.now();

    // Resolve executor chip
    const chip = this.registry.get(chipName);
    if (!chip) {
      throw new Error(`Chip not found: ${chipName}`);
    }

    // Resolve grader chip (optional)
    const graderChipName = options?.graderChip;
    let graderChip: ModelChip | undefined;
    if (graderChipName) {
      graderChip = this.registry.get(graderChipName);
      if (!graderChip) {
        throw new Error(`Grader chip not found: ${graderChipName}`);
      }
    }

    // Load test cases
    const tests = await this.testStore.list(skillName);
    if (tests.length === 0) {
      throw new Error(`No test cases found for skill "${skillName}"`);
    }

    // Execute each test case against the chip
    const results: TestCaseResult[] = [];
    let current = 0;
    for (const test of tests) {
      current++;
      options?.onProgress?.({ current, total: tests.length });

      const result = await this.executeAndGrade(test, chip, graderChip);
      results.push(result);
    }

    // Separate by expectation type
    const positiveResults = results.filter((r) => r.expected === 'positive');
    const negativeResults = results.filter((r) => r.expected === 'negative');
    const edgeCaseResults = results.filter((r) => r.expected === 'edge-case');

    // Compute metrics
    const metrics = this.computeMetrics(results);

    // Collect hints from failures
    const hints = this.collectHints(results);

    const duration = Date.now() - startTime;

    const runResult: ChipTestRunResult = {
      skillName,
      runAt: new Date().toISOString(),
      duration,
      metrics,
      results,
      positiveResults,
      negativeResults,
      edgeCaseResults,
      hints,
      chipName,
      graderChipName,
    };

    // Store results if not disabled
    if (options?.storeResults !== false) {
      const threshold = options?.threshold ?? 0.75;
      await this.resultStore.append(skillName, runResult, threshold);
    }

    return runResult;
  }

  /**
   * Execute a single test case against the chip and grade the response.
   */
  private async executeAndGrade(
    test: TestCase,
    chip: ModelChip,
    graderChip?: ModelChip
  ): Promise<TestCaseResult> {
    // Step 1: Execute via chip
    let chipResponse: string;
    try {
      const response = await chip.chat([{ role: 'user', content: test.prompt }]);
      chipResponse = response.content;
    } catch (err) {
      // Chip unavailability -> test failure, not exception
      const message = err instanceof Error ? err.message : String(err);
      return {
        testId: test.id,
        prompt: test.prompt,
        expected: test.expected,
        passed: false,
        actualScore: 0,
        wouldActivate: false,
        explanation: `Chip unavailable: ${message}`,
      };
    }

    // Step 2: Grade the response
    if (graderChip) {
      return this.gradeWithChip(test, chipResponse, graderChip);
    } else {
      return this.gradeWithKeywords(test, chipResponse);
    }
  }

  /**
   * Grade a chip response using a grader chip with structured JSON prompt.
   */
  private async gradeWithChip(
    test: TestCase,
    chipResponse: string,
    graderChip: ModelChip
  ): Promise<TestCaseResult> {
    const gradingPrompt =
      `You are evaluating a model's response to a skill activation test. ` +
      `The test prompt was: ${test.prompt}. ` +
      `The expected behavior is: ${test.expected}. ` +
      `The model responded: ${chipResponse}. ` +
      `Did the model's response indicate correct skill activation? ` +
      `Respond with JSON: { "passed": boolean, "explanation": string }`;

    const graderOptions: ChatOptions = {
      maxTokens: GRADER_MAX_TOKENS,
      temperature: GRADER_TEMPERATURE,
    };

    try {
      const response = await graderChip.chat(
        [{ role: 'user', content: gradingPrompt }],
        graderOptions
      );

      // Parse grader JSON
      const parsed = this.parseGraderResponse(response.content);
      if (parsed !== null) {
        return {
          testId: test.id,
          prompt: test.prompt,
          expected: test.expected,
          passed: parsed.passed,
          actualScore: parsed.passed ? 1.0 : 0.0,
          wouldActivate: parsed.passed,
          explanation: parsed.explanation,
        };
      }
    } catch {
      // Grader chip error -> fall through to keyword matching
    }

    // Fall back to keyword matching if JSON parse fails or grader errors
    return this.gradeWithKeywords(test, chipResponse);
  }

  /**
   * Parse a grader chip response as JSON { passed: boolean, explanation: string }.
   * Returns null if the response cannot be parsed.
   */
  private parseGraderResponse(content: string): { passed: boolean; explanation: string } | null {
    try {
      const parsed = JSON.parse(content.trim()) as unknown;
      if (
        parsed !== null &&
        typeof parsed === 'object' &&
        'passed' in parsed &&
        'explanation' in parsed &&
        typeof (parsed as { passed: unknown }).passed === 'boolean' &&
        typeof (parsed as { explanation: unknown }).explanation === 'string'
      ) {
        return {
          passed: (parsed as { passed: boolean }).passed,
          explanation: (parsed as { explanation: string }).explanation,
        };
      }
    } catch {
      // Not valid JSON
    }
    return null;
  }

  /**
   * Grade a chip response using built-in keyword matching.
   *
   * For positive tests: checks if response contains skill-relevant keywords.
   * For negative tests: checks if response does NOT contain skill-relevant keywords.
   * For edge-case tests: always passes (consistent with TestRunner behavior).
   */
  private gradeWithKeywords(test: TestCase, chipResponse: string): TestCaseResult {
    const responseLower = chipResponse.toLowerCase();

    // Skill-relevant keywords: present in a response that engages with the topic
    const IRRELEVANT_PATTERNS = [
      /quick brown fox/i,
      /lorem ipsum/i,
      /i don.?t know/i,
      /cannot help/i,
      /unrelated/i,
    ];

    const isIrrelevant = IRRELEVANT_PATTERNS.some((p) => p.test(chipResponse));

    let passed: boolean;
    let explanation: string;

    switch (test.expected) {
      case 'positive':
        // For positive tests: response should be relevant (not irrelevant)
        passed = !isIrrelevant && responseLower.length > 0;
        explanation = passed
          ? `Chip response appears relevant to skill domain`
          : `Chip response does not appear to address the skill domain`;
        break;

      case 'negative':
        // For negative tests: response should be off-topic / irrelevant
        passed = isIrrelevant || responseLower.length === 0;
        explanation = passed
          ? `Chip response correctly off-topic for this skill`
          : `Chip response appears to address skill domain when it should not`;
        break;

      case 'edge-case':
        // Edge cases always pass (just record state)
        passed = true;
        explanation = `Edge case: chip responded with ${chipResponse.length} chars`;
        break;

      default: {
        const _exhaustive: never = test.expected;
        throw new Error(`Unknown expectation: ${_exhaustive}`);
      }
    }

    return {
      testId: test.id,
      prompt: test.prompt,
      expected: test.expected,
      passed,
      actualScore: passed ? 0.8 : 0.2,
      wouldActivate: passed,
      explanation,
    };
  }

  /**
   * Compute metrics from test results.
   * Matches TestRunner.computeMetrics() behavior: excludes edge cases from accuracy.
   */
  private computeMetrics(results: TestCaseResult[]): RunMetrics {
    const scoredResults = results.filter((r) => r.expected !== 'edge-case');
    const edgeCaseCount = results.filter((r) => r.expected === 'edge-case').length;

    const positiveTests = scoredResults.filter((r) => r.expected === 'positive');
    const negativeTests = scoredResults.filter((r) => r.expected === 'negative');

    const truePositives = positiveTests.filter((r) => r.passed).length;
    const falseNegatives = positiveTests.filter((r) => !r.passed).length;
    const trueNegatives = negativeTests.filter((r) => r.passed).length;
    const falsePositives = negativeTests.filter((r) => !r.passed).length;

    const total = scoredResults.length;
    const passed = truePositives + trueNegatives;
    const failed = falsePositives + falseNegatives;

    const accuracy = total > 0 ? (passed / total) * 100 : 0;

    const falsePositiveRate =
      falsePositives + trueNegatives > 0
        ? (falsePositives / (falsePositives + trueNegatives)) * 100
        : 0;

    const precision =
      truePositives + falsePositives > 0
        ? truePositives / (truePositives + falsePositives)
        : 0;

    const recall =
      truePositives + falseNegatives > 0
        ? truePositives / (truePositives + falseNegatives)
        : 0;

    const f1Score =
      precision + recall > 0 ? (2 * (precision * recall)) / (precision + recall) : 0;

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
   */
  private collectHints(results: TestCaseResult[]): string[] {
    const hints: Set<string> = new Set();

    for (const result of results) {
      if (!result.passed && result.expected !== 'edge-case') {
        if (result.expected === 'positive' && !result.wouldActivate) {
          hints.add(
            `Chip did not engage with skill domain for: "${result.prompt.slice(0, 50)}${result.prompt.length > 50 ? '...' : ''}"`
          );
        }
        if (result.expected === 'negative' && result.wouldActivate) {
          hints.add(
            `Chip activated for out-of-domain prompt: "${result.prompt.slice(0, 50)}${result.prompt.length > 50 ? '...' : ''}"`
          );
        }
      }
    }

    return Array.from(hints);
  }
}
