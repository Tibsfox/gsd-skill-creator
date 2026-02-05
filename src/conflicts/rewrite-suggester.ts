/**
 * Rewrite suggester for resolving semantic conflicts between skills.
 *
 * Provides actionable guidance on how to differentiate conflicting skills
 * by rewriting their descriptions. Uses LLM-generated suggestions when
 * an Anthropic API key is available, falling back to heuristic templates.
 */

import type { ConflictPair } from '../types/conflicts.js';

/**
 * A suggestion for rewriting a skill description to reduce conflicts.
 */
export interface RewriteSuggestion {
  /** Name of the skill to rewrite */
  skillName: string;

  /** The original description that caused the conflict */
  originalDescription: string;

  /** Suggested rewritten description that reduces similarity */
  suggestedDescription: string;

  /** Explanation of why this rewrite helps differentiate the skill */
  rationale: string;

  /** Source of the suggestion */
  source: 'llm' | 'heuristic';
}

/**
 * JSON structure expected from LLM response.
 */
interface LLMSuggestionResponse {
  suggestions: Array<{
    skillName: string;
    suggestedDescription: string;
    rationale: string;
  }>;
}

/**
 * Generates rewrite suggestions for conflicting skill pairs.
 *
 * When an Anthropic API key is available (ANTHROPIC_API_KEY env var),
 * uses Claude to generate intelligent rewrite suggestions. Otherwise,
 * falls back to template-based heuristic suggestions.
 *
 * @example
 * ```typescript
 * const suggester = new RewriteSuggester();
 * const suggestions = await suggester.suggest(conflictPair);
 * for (const suggestion of suggestions) {
 *   console.log(`${suggestion.skillName}: ${suggestion.suggestedDescription}`);
 * }
 * ```
 */
export class RewriteSuggester {
  private readonly apiKeyAvailable: boolean;

  /**
   * Create a new rewrite suggester.
   * Automatically detects if Anthropic API key is available.
   */
  constructor() {
    this.apiKeyAvailable = !!process.env.ANTHROPIC_API_KEY;
  }

  /**
   * Generate rewrite suggestions for a conflicting skill pair.
   *
   * Returns suggestions for both skills in the pair, explaining how
   * to differentiate their descriptions to reduce semantic overlap.
   *
   * @param conflict - The conflict pair to generate suggestions for
   * @returns Array of suggestions (typically one per skill)
   */
  async suggest(conflict: ConflictPair): Promise<RewriteSuggestion[]> {
    if (this.apiKeyAvailable) {
      return this.suggestWithLLM(conflict);
    }
    return this.suggestWithHeuristics(conflict);
  }

  /**
   * Generate suggestions using Claude via the Anthropic API.
   * Falls back to heuristics on any error.
   */
  private async suggestWithLLM(conflict: ConflictPair): Promise<RewriteSuggestion[]> {
    try {
      // Dynamic import to avoid requiring the SDK when not needed
      const { default: Anthropic } = await import('@anthropic-ai/sdk');

      const client = new Anthropic();

      const similarityPercent = Math.round(conflict.similarity * 100);

      const prompt = `Two skills have conflicting descriptions (${similarityPercent}% similar):

Skill A: "${conflict.skillA}"
Description: "${conflict.descriptionA}"

Skill B: "${conflict.skillB}"
Description: "${conflict.descriptionB}"

Suggest rewritten descriptions that clearly differentiate these skills.
For each skill, explain what makes it unique and provide a new description
that emphasizes its distinct purpose.

Respond in JSON format only, with no markdown or explanation:
{
  "suggestions": [
    {
      "skillName": "...",
      "suggestedDescription": "...",
      "rationale": "..."
    }
  ]
}`;

      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      // Extract text content from response
      const textContent = response.content.find((block) => block.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        return this.suggestWithHeuristics(conflict);
      }

      // Parse JSON response
      const parsed = JSON.parse(textContent.text) as LLMSuggestionResponse;

      if (!parsed.suggestions || !Array.isArray(parsed.suggestions)) {
        return this.suggestWithHeuristics(conflict);
      }

      // Map to RewriteSuggestion format
      return parsed.suggestions.map((s) => ({
        skillName: s.skillName,
        originalDescription:
          s.skillName === conflict.skillA ? conflict.descriptionA : conflict.descriptionB,
        suggestedDescription: s.suggestedDescription,
        rationale: s.rationale,
        source: 'llm' as const,
      }));
    } catch {
      // Fall back to heuristics on any error
      return this.suggestWithHeuristics(conflict);
    }
  }

  /**
   * Generate template-based suggestions when LLM is not available.
   * Uses overlapping terms to provide specific guidance.
   */
  private suggestWithHeuristics(conflict: ConflictPair): RewriteSuggestion[] {
    const suggestions: RewriteSuggestion[] = [];

    // Find terms unique to each skill
    const termsA = this.extractTerms(conflict.descriptionA);
    const termsB = this.extractTerms(conflict.descriptionB);
    const uniqueToA = termsA.filter((t) => !termsB.includes(t));
    const uniqueToB = termsB.filter((t) => !termsA.includes(t));

    // Generate suggestion for skill A
    suggestions.push(
      this.generateHeuristicSuggestion(
        conflict.skillA,
        conflict.descriptionA,
        conflict.skillB,
        conflict.overlappingTerms,
        uniqueToA
      )
    );

    // Generate suggestion for skill B
    suggestions.push(
      this.generateHeuristicSuggestion(
        conflict.skillB,
        conflict.descriptionB,
        conflict.skillA,
        conflict.overlappingTerms,
        uniqueToB
      )
    );

    return suggestions;
  }

  /**
   * Generate a single heuristic-based suggestion.
   */
  private generateHeuristicSuggestion(
    skillName: string,
    description: string,
    otherSkillName: string,
    overlappingTerms: string[],
    uniqueTerms: string[]
  ): RewriteSuggestion {
    let suggestedDescription: string;
    let rationale: string;

    if (uniqueTerms.length > 0) {
      // Focus on unique terms
      const uniqueTermsList = uniqueTerms.slice(0, 3).join(', ');
      suggestedDescription = `${description} Specifically focuses on ${uniqueTermsList}.`;
      rationale = `Focus on "${uniqueTermsList}" which appears only in this skill to differentiate from ${otherSkillName}.`;
    } else if (overlappingTerms.length > 0) {
      // Suggest adding context
      const overlappingList = overlappingTerms.slice(0, 3).join(', ');
      suggestedDescription = `${description} Use this skill when you need ${overlappingList} in a specific context.`;
      rationale = `Add context about when to use this skill vs ${otherSkillName} since both involve ${overlappingList}.`;
    } else {
      // Generic suggestion
      suggestedDescription = `${description} Use this for its primary purpose.`;
      rationale = `Consider adding specific use cases to differentiate from ${otherSkillName}.`;
    }

    return {
      skillName,
      originalDescription: description,
      suggestedDescription,
      rationale,
      source: 'heuristic',
    };
  }

  /**
   * Extract meaningful terms from a description.
   * Similar to ConflictDetector's term extraction.
   */
  private extractTerms(text: string): string[] {
    const stopWords = new Set([
      'the',
      'a',
      'an',
      'is',
      'are',
      'was',
      'were',
      'be',
      'been',
      'being',
      'have',
      'has',
      'had',
      'do',
      'does',
      'did',
      'will',
      'would',
      'could',
      'should',
      'may',
      'might',
      'must',
      'shall',
      'can',
      'need',
      'to',
      'of',
      'in',
      'for',
      'on',
      'with',
      'at',
      'by',
      'from',
      'as',
      'into',
      'through',
      'and',
      'but',
      'or',
      'if',
      'this',
      'that',
      'it',
      'its',
      'use',
      'using',
    ]);

    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 2 && !stopWords.has(word));
  }
}
