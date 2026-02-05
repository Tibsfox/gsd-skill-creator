/**
 * LLM-based test generator using Claude Haiku API.
 *
 * Provides high-quality test case generation by leveraging Claude to
 * understand skill descriptions and create diverse, realistic test prompts.
 * Returns null when API key is unavailable or on any error (caller should
 * use heuristic fallback).
 */

import type { GeneratedTest, SkillInfo } from '../../types/test-generation.js';

/**
 * Structure expected from LLM for positive test generation.
 */
interface PositiveTestResponse {
  prompt: string;
  description: string;
}

/**
 * Structure expected from LLM for negative test generation.
 */
interface NegativeTestResponse {
  prompt: string;
  reason: string;
}

/**
 * LLM-based test generator using Claude Haiku.
 *
 * When ANTHROPIC_API_KEY is available, uses Claude Haiku to generate
 * diverse, high-quality test prompts from skill descriptions. Returns
 * null on any error to allow graceful fallback to heuristic generation.
 *
 * @example
 * ```typescript
 * const generator = new LLMTestGenerator();
 * if (generator.isAvailable()) {
 *   const tests = await generator.generatePositive(skill, 5);
 *   if (tests) {
 *     // Use LLM-generated tests
 *   }
 * }
 * ```
 */
export class LLMTestGenerator {
  private readonly apiKeyAvailable: boolean;

  constructor() {
    this.apiKeyAvailable = !!process.env.ANTHROPIC_API_KEY;
  }

  /**
   * Check if LLM generation is available.
   *
   * Returns true when ANTHROPIC_API_KEY is set in the environment.
   */
  isAvailable(): boolean {
    return this.apiKeyAvailable;
  }

  /**
   * Generate positive test cases using Claude Haiku.
   *
   * Creates diverse user prompts that SHOULD activate the skill,
   * with varied phrasing, length, and specificity.
   *
   * @param skill - Skill information for generation
   * @param count - Number of tests to generate
   * @returns Array of generated tests, or null if unavailable/error
   */
  async generatePositive(
    skill: SkillInfo,
    count: number
  ): Promise<GeneratedTest[] | null> {
    if (!this.apiKeyAvailable) {
      return null;
    }

    try {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const client = new Anthropic();

      const prompt = `You are generating test prompts for skill activation testing.

Given this skill:
Name: "${skill.name}"
Description: "${skill.description}"
${skill.whenToUse ? `When to use: "${skill.whenToUse}"` : ''}

Generate ${count} diverse user prompts that SHOULD activate this skill.

Requirements:
- Prompts should be realistic user messages (like CLI or chat requests)
- Vary the phrasing, length, and specificity
- Include both direct requests and indirect/contextual references
- Mix formal and informal language
- Range from 3-40 words per prompt

Respond in JSON format only, no markdown:
[
  {
    "prompt": "<user prompt>",
    "description": "<why this tests the skill>"
  }
]`;

      const response = await client.messages.create({
        model: 'claude-haiku-4-20250514',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      });

      // Extract text content
      const textContent = response.content.find((block) => block.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        return null;
      }

      // Parse JSON response
      const parsed = this.parseJsonResponse(textContent.text);
      if (!Array.isArray(parsed)) {
        return null;
      }

      // Map to GeneratedTest array
      return parsed.map((item: PositiveTestResponse) => ({
        prompt: item.prompt,
        expected: 'positive' as const,
        source: 'llm' as const,
        description: item.description,
      }));
    } catch {
      // Return null on any error - caller should use heuristic
      return null;
    }
  }

  /**
   * Generate negative test cases using Claude Haiku.
   *
   * Creates user prompts that should NOT activate the skill,
   * covering different types of unrelated requests.
   *
   * @param skill - Skill information for generation
   * @param count - Number of tests to generate
   * @returns Array of generated tests, or null if unavailable/error
   */
  async generateNegative(
    skill: SkillInfo,
    count: number
  ): Promise<GeneratedTest[] | null> {
    if (!this.apiKeyAvailable) {
      return null;
    }

    try {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const client = new Anthropic();

      const prompt = `You are generating test prompts for skill activation testing.

Given this skill:
Name: "${skill.name}"
Description: "${skill.description}"

Generate ${count} user prompts that should NOT activate this skill.

Requirements:
- Prompts should be realistic user messages
- Prompts must be clearly OUTSIDE this skill's domain
- Cover different types of unrelated requests
- Some should be similar-sounding but about different topics
- Range from 3-40 words per prompt

Respond in JSON format only, no markdown:
[
  {
    "prompt": "<user prompt>",
    "reason": "<why this should NOT activate the skill>"
  }
]`;

      const response = await client.messages.create({
        model: 'claude-haiku-4-20250514',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      });

      // Extract text content
      const textContent = response.content.find((block) => block.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        return null;
      }

      // Parse JSON response
      const parsed = this.parseJsonResponse(textContent.text);
      if (!Array.isArray(parsed)) {
        return null;
      }

      // Map to GeneratedTest array
      return parsed.map((item: NegativeTestResponse) => ({
        prompt: item.prompt,
        expected: 'negative' as const,
        source: 'llm' as const,
        reason: item.reason,
      }));
    } catch {
      // Return null on any error - caller should use heuristic
      return null;
    }
  }

  /**
   * Parse JSON response from LLM, handling potential markdown wrapping.
   *
   * Claude sometimes returns JSON wrapped in markdown code fences,
   * so we strip those before parsing.
   *
   * @param text - Raw text from LLM response
   * @returns Parsed JSON, or null if parsing fails
   */
  private parseJsonResponse(text: string): unknown {
    // Strip markdown code fences if present
    const cleaned = text.replace(/^```(?:json)?\n?|\n?```$/g, '').trim();

    try {
      const parsed = JSON.parse(cleaned);

      // Validate it's an array
      if (!Array.isArray(parsed)) {
        return null;
      }

      return parsed;
    } catch {
      return null;
    }
  }
}
