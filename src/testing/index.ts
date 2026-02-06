// Test infrastructure module exports
//
// This module provides the test storage layer for skill validation.

// TestStore for persisting test cases
export { TestStore } from './test-store.js';

// ResultStore for persisting test run results
export { ResultStore } from './result-store.js';

// TestRunner for orchestrating test execution
export { TestRunner, type RunOptions } from './test-runner.js';

// Re-export types from types/testing.ts for convenience
export type { TestCase, TestResult, TestExpectation } from '../types/testing.js';

// Re-export types from types/test-run.ts for test execution results
export type {
  TestCaseResult,
  RunMetrics,
  TestRunResult,
  TestRunSnapshot,
} from '../types/test-run.js';

// Re-export validation utilities
export { validateTestCaseInput, TestCaseInputSchema } from '../validation/test-validation.js';
export type { TestCaseInput, ValidationWarning } from '../validation/test-validation.js';

// Result formatting for terminal display and JSON export
export {
  ResultFormatter,
  formatTestResults,
  formatJSON,
  type FormatOptions,
} from './result-formatter.js';

// Test generators for automated test case creation
export * from './generators/index.js';

// Review workflow for interactive test case review
export { ReviewWorkflow, type ReviewResult } from './review-workflow.js';
