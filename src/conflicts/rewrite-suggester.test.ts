/**
 * Unit tests for RewriteSuggester.
 *
 * Tests cover heuristic fallback, LLM integration (mocked),
 * and error handling scenarios.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RewriteSuggester } from './rewrite-suggester.js';
import type { ConflictPair } from '../types/conflicts.js';

// Store original env
const originalEnv = { ...process.env };

/**
 * Create a mock conflict pair for testing.
 */
function createConflictPair(overrides: Partial<ConflictPair> = {}): ConflictPair {
  return {
    skillA: 'parse-json',
    skillB: 'extract-json',
    similarity: 0.92,
    severity: 'high',
    overlappingTerms: ['json', 'data', 'api'],
    descriptionA: 'Parse JSON data from the API response',
    descriptionB: 'Extract JSON data from the API endpoint',
    ...overrides,
  };
}

describe('RewriteSuggester', () => {
  beforeEach(() => {
    vi.resetModules();
    // Default: no API key
    delete process.env.ANTHROPIC_API_KEY;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  describe('heuristic mode (no API key)', () => {
    it('returns suggestions with source heuristic', async () => {
      const suggester = new RewriteSuggester();
      const conflict = createConflictPair();

      const suggestions = await suggester.suggest(conflict);

      expect(suggestions.length).toBe(2);
      expect(suggestions[0].source).toBe('heuristic');
      expect(suggestions[1].source).toBe('heuristic');
    });

    it('returns suggestions for both skills', async () => {
      const suggester = new RewriteSuggester();
      const conflict = createConflictPair();

      const suggestions = await suggester.suggest(conflict);

      const skillNames = suggestions.map((s) => s.skillName);
      expect(skillNames).toContain('parse-json');
      expect(skillNames).toContain('extract-json');
    });

    it('suggestions reference the other skill name in rationale', async () => {
      const suggester = new RewriteSuggester();
      const conflict = createConflictPair();

      const suggestions = await suggester.suggest(conflict);

      const suggestionForA = suggestions.find((s) => s.skillName === 'parse-json');
      const suggestionForB = suggestions.find((s) => s.skillName === 'extract-json');

      expect(suggestionForA?.rationale).toContain('extract-json');
      expect(suggestionForB?.rationale).toContain('parse-json');
    });

    it('includes original description in suggestions', async () => {
      const suggester = new RewriteSuggester();
      const conflict = createConflictPair();

      const suggestions = await suggester.suggest(conflict);

      const suggestionForA = suggestions.find((s) => s.skillName === 'parse-json');
      expect(suggestionForA?.originalDescription).toBe('Parse JSON data from the API response');
    });

    it('focuses on unique terms when available', async () => {
      const suggester = new RewriteSuggester();
      const conflict = createConflictPair({
        descriptionA: 'Parse JSON response from server with validation',
        descriptionB: 'Extract JSON data from endpoint',
        overlappingTerms: ['json'],
      });

      const suggestions = await suggester.suggest(conflict);

      const suggestionForA = suggestions.find((s) => s.skillName === 'parse-json');
      // Should mention unique terms like 'validation' or 'server'
      expect(suggestionForA?.suggestedDescription).toMatch(/validation|server|response/i);
    });

    it('mentions overlapping terms in rationale when no unique terms', async () => {
      const suggester = new RewriteSuggester();
      const conflict = createConflictPair({
        descriptionA: 'json data api',
        descriptionB: 'json data api',
        overlappingTerms: ['json', 'data', 'api'],
      });

      const suggestions = await suggester.suggest(conflict);

      const suggestionForA = suggestions.find((s) => s.skillName === 'parse-json');
      expect(suggestionForA?.rationale).toMatch(/json|data|api/i);
    });
  });

  describe('edge cases', () => {
    it('handles empty overlapping terms gracefully', async () => {
      const suggester = new RewriteSuggester();
      const conflict = createConflictPair({
        overlappingTerms: [],
        descriptionA: 'do something',
        descriptionB: 'run something else',
      });

      const suggestions = await suggester.suggest(conflict);

      expect(suggestions.length).toBe(2);
      expect(suggestions[0].source).toBe('heuristic');
      // Should still provide generic advice
      expect(suggestions[0].rationale.length).toBeGreaterThan(0);
    });

    it('handles very long descriptions without breaking', async () => {
      const suggester = new RewriteSuggester();
      const longDescription = 'word '.repeat(1000).trim();
      const conflict = createConflictPair({
        descriptionA: longDescription,
        descriptionB: longDescription,
      });

      const suggestions = await suggester.suggest(conflict);

      expect(suggestions.length).toBe(2);
      expect(suggestions[0].source).toBe('heuristic');
    });

    it('handles descriptions with special characters', async () => {
      const suggester = new RewriteSuggester();
      const conflict = createConflictPair({
        descriptionA: 'Parse JSON-like "data" from <API> response & validate',
        descriptionB: 'Extract {JSON} [data] from /api/ endpoint',
      });

      const suggestions = await suggester.suggest(conflict);

      expect(suggestions.length).toBe(2);
      expect(suggestions[0].source).toBe('heuristic');
    });
  });

  describe('LLM mode (with API key)', () => {
    it('uses LLM when API key is available and returns llm source', async () => {
      process.env.ANTHROPIC_API_KEY = 'test-api-key';

      // Mock the Anthropic SDK
      vi.doMock('@anthropic-ai/sdk', () => ({
        default: vi.fn().mockImplementation(() => ({
          messages: {
            create: vi.fn().mockResolvedValue({
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    suggestions: [
                      {
                        skillName: 'parse-json',
                        suggestedDescription: 'Parse and validate JSON from HTTP responses',
                        rationale: 'Focus on parsing and validation aspects',
                      },
                      {
                        skillName: 'extract-json',
                        suggestedDescription: 'Extract specific JSON fields from endpoints',
                        rationale: 'Focus on field extraction aspect',
                      },
                    ],
                  }),
                },
              ],
            }),
          },
        })),
      }));

      // Re-import to get fresh module with mocked API key
      const { RewriteSuggester: FreshSuggester } = await import('./rewrite-suggester.js');
      const suggester = new FreshSuggester();
      const conflict = createConflictPair();

      const suggestions = await suggester.suggest(conflict);

      expect(suggestions.length).toBe(2);
      expect(suggestions[0].source).toBe('llm');
      expect(suggestions[0].suggestedDescription).toBe(
        'Parse and validate JSON from HTTP responses'
      );
    });

    it('falls back to heuristic on API error', async () => {
      process.env.ANTHROPIC_API_KEY = 'test-api-key';

      // Mock the Anthropic SDK to throw an error
      vi.doMock('@anthropic-ai/sdk', () => ({
        default: vi.fn().mockImplementation(() => ({
          messages: {
            create: vi.fn().mockRejectedValue(new Error('API rate limit exceeded')),
          },
        })),
      }));

      const { RewriteSuggester: FreshSuggester } = await import('./rewrite-suggester.js');
      const suggester = new FreshSuggester();
      const conflict = createConflictPair();

      const suggestions = await suggester.suggest(conflict);

      expect(suggestions.length).toBe(2);
      expect(suggestions[0].source).toBe('heuristic');
    });

    it('falls back to heuristic on invalid JSON response', async () => {
      process.env.ANTHROPIC_API_KEY = 'test-api-key';

      // Mock the Anthropic SDK to return invalid JSON
      vi.doMock('@anthropic-ai/sdk', () => ({
        default: vi.fn().mockImplementation(() => ({
          messages: {
            create: vi.fn().mockResolvedValue({
              content: [
                {
                  type: 'text',
                  text: 'This is not valid JSON',
                },
              ],
            }),
          },
        })),
      }));

      const { RewriteSuggester: FreshSuggester } = await import('./rewrite-suggester.js');
      const suggester = new FreshSuggester();
      const conflict = createConflictPair();

      const suggestions = await suggester.suggest(conflict);

      expect(suggestions.length).toBe(2);
      expect(suggestions[0].source).toBe('heuristic');
    });

    it('falls back to heuristic when suggestions array is missing', async () => {
      process.env.ANTHROPIC_API_KEY = 'test-api-key';

      // Mock the Anthropic SDK to return JSON without suggestions array
      vi.doMock('@anthropic-ai/sdk', () => ({
        default: vi.fn().mockImplementation(() => ({
          messages: {
            create: vi.fn().mockResolvedValue({
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({ wrong: 'structure' }),
                },
              ],
            }),
          },
        })),
      }));

      const { RewriteSuggester: FreshSuggester } = await import('./rewrite-suggester.js');
      const suggester = new FreshSuggester();
      const conflict = createConflictPair();

      const suggestions = await suggester.suggest(conflict);

      expect(suggestions.length).toBe(2);
      expect(suggestions[0].source).toBe('heuristic');
    });

    it('falls back to heuristic when response has no text content', async () => {
      process.env.ANTHROPIC_API_KEY = 'test-api-key';

      // Mock the Anthropic SDK to return non-text content
      vi.doMock('@anthropic-ai/sdk', () => ({
        default: vi.fn().mockImplementation(() => ({
          messages: {
            create: vi.fn().mockResolvedValue({
              content: [
                {
                  type: 'tool_use',
                  name: 'some_tool',
                },
              ],
            }),
          },
        })),
      }));

      const { RewriteSuggester: FreshSuggester } = await import('./rewrite-suggester.js');
      const suggester = new FreshSuggester();
      const conflict = createConflictPair();

      const suggestions = await suggester.suggest(conflict);

      expect(suggestions.length).toBe(2);
      expect(suggestions[0].source).toBe('heuristic');
    });
  });

  describe('suggestion content quality', () => {
    it('suggested description is different from original', async () => {
      const suggester = new RewriteSuggester();
      const conflict = createConflictPair();

      const suggestions = await suggester.suggest(conflict);

      for (const suggestion of suggestions) {
        expect(suggestion.suggestedDescription).not.toBe(suggestion.originalDescription);
      }
    });

    it('rationale provides actionable guidance', async () => {
      const suggester = new RewriteSuggester();
      const conflict = createConflictPair();

      const suggestions = await suggester.suggest(conflict);

      for (const suggestion of suggestions) {
        // Rationale should be substantive (not empty)
        expect(suggestion.rationale.length).toBeGreaterThan(20);
      }
    });
  });
});
