// Test infrastructure module exports
//
// This module provides the test storage layer for skill validation.

// TestStore for persisting test cases
export { TestStore } from './test-store.js';

// Re-export types from types/testing.ts for convenience
export type { TestCase, TestResult, TestExpectation } from '../types/testing.js';

// Re-export validation utilities
export { validateTestCaseInput, TestCaseInputSchema } from '../validation/test-validation.js';
export type { TestCaseInput, ValidationWarning } from '../validation/test-validation.js';
