/**
 * Cross-skill negative test generator.
 *
 * Generates negative test cases by finding competing skills (those with
 * similar descriptions) and deriving prompts from their domains. This
 * creates high-quality negative tests that specifically challenge the
 * skill activation system's ability to distinguish between similar skills.
 */

import { getEmbeddingService, cosineSimilarity } from '../../embeddings/index.js';
import { SkillStore } from '../../storage/skill-store.js';
import type { SkillScope } from '../../types/scope.js';
import type { GeneratedTest, SkillInfo } from '../../types/test-generation.js';

/**
 * Configuration options for cross-skill generator.
 */
export interface CrossSkillGeneratorConfig {
  /**
   * Minimum similarity score to consider a skill a competitor.
   * Only skills with similarity >= this threshold are used.
   * Default: 0.5 (50% similarity)
   */
  minSimilarity?: number;

  /**
   * Maximum number of competitor skills to use for generation.
   * Default: 5
   */
  maxCompetitors?: number;
}

/**
 * Default configuration values.
 */
const DEFAULT_CONFIG: Required<CrossSkillGeneratorConfig> = {
  minSimilarity: 0.5,
  maxCompetitors: 5,
};

/**
 * Cross-skill test generator for negative test cases.
 *
 * Unlike the general GeneratorStrategy interface, this generator
 * requires access to other skills in the store to find competitors.
 * It generates negative tests by using prompts that SHOULD activate
 * other skills, not the target skill.
 *
 * @example
 * ```typescript
 * const generator = new CrossSkillGenerator(skillStore, 'user');
 * const negativeTests = await generator.generate(
 *   { name: 'git-commit', description: 'Help with git commits' },
 *   5
 * );
 * ```
 */
export class CrossSkillGenerator {
  constructor(
    private skillStore: SkillStore,
    private scope: SkillScope
  ) {}

  /**
   * Generate negative tests from competing skills.
   *
   * Finds skills with similar descriptions (competitors) and creates
   * negative test cases from their domains. Each test is a prompt
   * that should activate the competitor skill, NOT the target skill.
   *
   * @param targetSkill - The skill we're generating tests for
   * @param count - Maximum number of negative tests to generate
   * @param config - Optional configuration overrides
   * @returns Array of generated negative tests (may be fewer than count)
   */
  async generate(
    targetSkill: SkillInfo,
    count: number,
    config?: CrossSkillGeneratorConfig
  ): Promise<GeneratedTest[]> {
    const cfg = { ...DEFAULT_CONFIG, ...config };

    // Load all skill names
    const allSkillNames = await this.skillStore.list();
    const otherSkillNames = allSkillNames.filter(
      (name) => name !== targetSkill.name
    );

    if (otherSkillNames.length === 0) {
      // No other skills to compare against
      return [];
    }

    // Load skill descriptions
    const otherSkills = await Promise.all(
      otherSkillNames.map(async (name) => {
        try {
          const skill = await this.skillStore.read(name);
          return {
            name,
            description: skill.metadata.description,
          };
        } catch {
          // Skill couldn't be loaded (corrupted, etc.) - skip it
          return null;
        }
      })
    );

    // Filter out failed loads
    const validSkills = otherSkills.filter(
      (s): s is { name: string; description: string } => s !== null
    );

    if (validSkills.length === 0) {
      return [];
    }

    // Get embedding service and compute similarities
    const embeddingService = await getEmbeddingService();

    const targetEmbedding = await embeddingService.embed(
      targetSkill.description
    );
    const otherEmbeddings = await embeddingService.embedBatch(
      validSkills.map((s) => s.description)
    );

    // Score and filter by similarity threshold
    const scored = validSkills.map((skill, i) => ({
      skill,
      similarity: cosineSimilarity(
        targetEmbedding.embedding,
        otherEmbeddings[i].embedding
      ),
    }));

    // Filter to competitors (similarity >= threshold) and sort by similarity
    const competitors = scored
      .filter((s) => s.similarity >= cfg.minSimilarity)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, cfg.maxCompetitors);

    if (competitors.length === 0) {
      // No skills similar enough to be competitors
      return [];
    }

    // Generate negative tests from competitor descriptions
    // Distribute tests evenly across competitors
    const testsPerCompetitor = Math.ceil(count / competitors.length);
    const tests: GeneratedTest[] = [];

    for (const { skill: competitor } of competitors) {
      if (tests.length >= count) {
        break;
      }

      // Generate prompts from competitor description
      const prompts = this.descriptionToPrompts(competitor.description);

      for (const prompt of prompts.slice(0, testsPerCompetitor)) {
        if (tests.length >= count) {
          break;
        }

        tests.push({
          prompt,
          expected: 'negative',
          source: 'cross-skill',
          description: `Should activate ${competitor.name}, not ${targetSkill.name}`,
          reason: `belongs to ${competitor.name}`,
          competitorSkill: competitor.name,
        });
      }
    }

    return tests;
  }

  /**
   * Convert a skill description to prompt-like phrases.
   *
   * Extracts the core action/topic from the description and
   * converts it to user request formats.
   *
   * @param description - The skill's description text
   * @returns Array of prompt strings derived from the description
   */
  private descriptionToPrompts(description: string): string[] {
    const prompts: string[] = [];

    // Common patterns to strip from the beginning of descriptions
    const stripPrefixes = [
      /^use\s+when\s+/i,
      /^used?\s+for\s+/i,
      /^helps?\s+(?:with\s+)?/i,
      /^assists?\s+(?:with\s+)?/i,
      /^enables?\s+/i,
      /^allows?\s+/i,
      /^provides?\s+/i,
      /^handles?\s+/i,
      /^manages?\s+/i,
    ];

    // Clean up the description
    let cleaned = description.trim();

    // Strip common prefixes
    for (const prefix of stripPrefixes) {
      cleaned = cleaned.replace(prefix, '');
    }

    // Split into sentences
    const sentences = cleaned
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 3 && s.length < 100);

    if (sentences.length === 0) {
      // Use the whole cleaned description if no sentences
      sentences.push(cleaned.slice(0, 100));
    }

    // Generate prompts from sentences
    const templates = [
      'I need to {action}',
      'Help me with {action}',
      'Can you {action}?',
    ];

    for (const sentence of sentences.slice(0, 3)) {
      // Convert to lowercase action phrase
      const action = sentence.toLowerCase();

      // Use different templates for variety
      const template = templates[prompts.length % templates.length];
      prompts.push(template.replace('{action}', action));
    }

    // Also add a direct version of the first sentence
    if (sentences.length > 0) {
      prompts.push(sentences[0].toLowerCase());
    }

    return prompts;
  }
}
