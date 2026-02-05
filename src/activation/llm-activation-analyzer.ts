/**
 * LLM-based activation analysis using Claude API.
 *
 * Provides deep analysis of skill activation likelihood by asking Claude
 * to simulate its own skill activation reasoning. Returns null when API
 * key is unavailable (caller should use heuristic fallback).
 */

import type { LLMAnalysisResult } from '../types/activation.js';

/**
 * JSON structure expected from LLM response.
 */
interface LLMActivationResponse {
  score: number;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

/**
 * Analyzes skill activation likelihood using Claude.
 *
 * When ANTHROPIC_API_KEY is available, asks Claude to reason about
 * how reliably a skill description would trigger activation.
 * Returns null when API key is missing or on any error.
 *
 * @example
 * ```typescript
 * const analyzer = new LLMActivationAnalyzer();
 * const result = await analyzer.analyze({
 *   name: 'prisma-migrations',
 *   description: 'Run database migrations using Prisma.',
 * });
 * if (result) {
 *   console.log(`LLM Score: ${result.score}/100`);
 * }
 * ```
 */
export class LLMActivationAnalyzer {
  private readonly apiKeyAvailable: boolean;

  constructor() {
    this.apiKeyAvailable = !!process.env.ANTHROPIC_API_KEY;
  }

  /**
   * Check if LLM analysis is available.
   */
  isAvailable(): boolean {
    return this.apiKeyAvailable;
  }

  /**
   * Analyze a skill description using Claude.
   *
   * @param skill - Skill with name and description
   * @returns Analysis result, or null if unavailable/error
   */
  async analyze(skill: { name: string; description: string }): Promise<LLMAnalysisResult | null> {
    if (!this.apiKeyAvailable) {
      return null;
    }

    try {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const client = new Anthropic();

      const prompt = `You are simulating Claude Code's skill activation system.

Given this skill:
Name: "${skill.name}"
Description: "${skill.description}"

Analyze how reliably this skill will auto-activate when relevant. Consider:
1. How specific and unique is the description?
2. Does it contain clear trigger phrases ("use when...", "when user asks...")?
3. Would Claude confidently recognize when to use this vs other skills?
4. What user prompts would trigger this skill? What prompts might NOT trigger it when they should?

Respond in JSON format only, no markdown:
{
  "score": <0-100 integer>,
  "confidence": "<high|medium|low>",
  "reasoning": "<1-2 sentence explanation>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>"],
  "suggestions": ["<improvement 1>", "<improvement 2>"]
}`;

      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      });

      // Extract text content
      const textContent = response.content.find((block) => block.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        return null;
      }

      // Parse JSON response
      const parsed = JSON.parse(textContent.text) as LLMActivationResponse;

      // Validate required fields
      if (
        typeof parsed.score !== 'number' ||
        !['high', 'medium', 'low'].includes(parsed.confidence) ||
        typeof parsed.reasoning !== 'string'
      ) {
        return null;
      }

      return {
        score: Math.min(100, Math.max(0, Math.round(parsed.score))),
        confidence: parsed.confidence,
        reasoning: parsed.reasoning,
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
        source: 'llm',
      };
    } catch {
      // Return null on any error - caller should use heuristic
      return null;
    }
  }
}
