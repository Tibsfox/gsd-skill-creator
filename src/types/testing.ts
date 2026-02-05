// Test infrastructure types for skill validation

/**
 * Expected behavior for a test case.
 *
 * - `positive`: Skill SHOULD activate for this prompt
 * - `negative`: Skill should NOT activate for this prompt
 * - `edge-case`: Borderline scenarios (partial matches, typos, ambiguous intent)
 */
export type TestExpectation = 'positive' | 'negative' | 'edge-case';

/**
 * Test case difficulty level for filtering and prioritization.
 */
export type TestDifficulty = 'easy' | 'medium' | 'hard';

/**
 * A test case definition for skill activation testing.
 *
 * Test cases represent realistic user scenarios (full prompts like
 * "I made changes to auth, can you commit them?"), not minimal phrases.
 */
export interface TestCase {
  /**
   * Unique identifier for the test case (UUID).
   * Generated automatically on creation.
   */
  id: string;

  /**
   * The full user prompt to test against.
   * Should be a realistic user scenario, not a minimal phrase.
   */
  prompt: string;

  /**
   * Expected activation behavior.
   */
  expected: TestExpectation;

  /**
   * Human-readable description of what this test verifies.
   */
  description?: string;

  /**
   * Categories for filtering and organization.
   * Examples: ['auth', 'edge-case', 'regression']
   */
  tags?: string[];

  /**
   * How difficult this test case is to pass correctly.
   * Useful for prioritizing test execution and identifying weak spots.
   */
  difficulty?: TestDifficulty;

  /**
   * ISO timestamp when this test was created.
   */
  createdAt: string;

  /**
   * For positive tests: minimum confidence score (0-1) to pass.
   * If the skill activates but with confidence below this threshold, the test fails.
   */
  minConfidence?: number;

  /**
   * For negative tests: maximum confidence score (0-1) to pass.
   * If the skill activates with confidence above this threshold, the test fails.
   */
  maxConfidence?: number;

  /**
   * For negative tests: why the skill shouldn't activate.
   * Examples: "belongs to auth-skill", "too generic", "wrong domain"
   */
  reason?: string;
}

/**
 * Result of executing a single test case against a skill.
 *
 * Stored separately from test definitions to keep test files clean
 * and enable result history tracking.
 */
export interface TestResult {
  /**
   * ID of the test case that was executed.
   */
  testId: string;

  /**
   * Name of the skill being tested.
   */
  skillName: string;

  /**
   * ISO timestamp when this test was executed.
   */
  runAt: string;

  /**
   * Whether the test passed based on expected behavior and thresholds.
   */
  passed: boolean;

  /**
   * The actual confidence score from skill activation (0-1).
   * May be undefined if the skill didn't activate at all.
   */
  actualScore?: number;

  /**
   * The expected behavior from the test case.
   */
  expectedBehavior: TestExpectation;

  /**
   * Error message if the test execution itself failed.
   * Distinct from a test that ran but didn't pass.
   */
  error?: string;
}
