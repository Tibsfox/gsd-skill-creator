/**
 * Tests for token counting utility.
 *
 * Uses the same 4 chars/token heuristic as ExpressionRenderer
 * to produce consistent estimates for content sizing.
 */

import { describe, it, expect } from 'vitest';
import { countTokens, truncateToTokenBudget } from './token-counter.js';

describe('countTokens', () => {
  it('returns approximately 2-3 tokens for "hello world"', () => {
    const result = countTokens('hello world');
    // 'hello world' is 11 chars -> 11/4 = 2.75 -> ceil = 3
    expect(result).toBeGreaterThanOrEqual(2);
    expect(result).toBeLessThanOrEqual(3);
  });

  it('returns 0 for empty string', () => {
    expect(countTokens('')).toBe(0);
  });

  it('returns ~250 tokens for a 1000-char string', () => {
    const content = 'x'.repeat(1000);
    const result = countTokens(content);
    // 1000 / 4 = 250
    expect(result).toBe(250);
  });
});

describe('truncateToTokenBudget', () => {
  it('truncates content exceeding the budget with a suffix', () => {
    // Create content that is clearly over 10 tokens (10 * 4 = 40 chars)
    const longContent = 'a'.repeat(200); // 50 tokens
    const result = truncateToTokenBudget(longContent, 10);
    expect(result.truncated).toBe(true);
    expect(result.content).toContain('...');
    expect(result.tokenCost).toBeLessThanOrEqual(10);
  });

  it('returns full content when under budget', () => {
    const shortContent = 'hello'; // 2 tokens
    const result = truncateToTokenBudget(shortContent, 100);
    expect(result.truncated).toBe(false);
    expect(result.content).toBe(shortContent);
    expect(result.tokenCost).toBe(countTokens(shortContent));
  });
});
