/**
 * Token counting utility for progressive disclosure enforcement.
 *
 * Uses the same 4 chars/token heuristic as ExpressionRenderer
 * (CHARS_PER_TOKEN = 4) for consistent estimates across the system.
 *
 * @module college/token-counter
 */

const CHARS_PER_TOKEN = 4;

/**
 * Estimate the number of tokens in a content string.
 *
 * @param content - The text to count tokens for
 * @returns Estimated token count (rounded up)
 */
export function countTokens(content: string): number {
  if (!content) return 0;
  return Math.ceil(content.length / CHARS_PER_TOKEN);
}

/**
 * Truncate content to fit within a token budget.
 *
 * If the content exceeds the budget, it is truncated with a
 * '... [load more with loadDeep()]' suffix indicating more is available.
 *
 * @param content - The text to potentially truncate
 * @param tokenBudget - Maximum number of tokens allowed
 * @returns Object with the (possibly truncated) content, truncation flag, and token cost
 */
export function truncateToTokenBudget(
  content: string,
  tokenBudget: number,
): { content: string; truncated: boolean; tokenCost: number } {
  const totalTokens = countTokens(content);
  if (totalTokens <= tokenBudget) {
    return { content, truncated: false, tokenCost: totalTokens };
  }

  const suffix = '\n\n... [load more with loadDeep()]';
  const suffixTokens = countTokens(suffix);
  const availableChars = (tokenBudget - suffixTokens) * CHARS_PER_TOKEN;
  const truncated = content.slice(0, Math.max(0, availableChars)) + suffix;
  return { content: truncated, truncated: true, tokenCost: countTokens(truncated) };
}
