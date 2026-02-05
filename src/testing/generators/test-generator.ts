/**
 * TestGenerator orchestrator for test case generation.
 *
 * Combines LLM, heuristic, and cross-skill generation strategies with
 * automatic fallback. Provides a single interface for the CLI to generate
 * comprehensive test suites for skills.
 */

import { SkillStore } from '../../storage/skill-store.js';
import type { SkillScope } from '../../types/scope.js';
import type { GeneratedTest, SkillInfo } from '../../types/test-generation.js';
import {
  CrossSkillGenerator,
  type CrossSkillGeneratorConfig,
} from './cross-skill-generator.js';
import { HeuristicTestGenerator } from './heuristic-generator.js';
import { LLMTestGenerator } from './llm-generator.js';

/**
 * Configuration for the TestGenerator.
 */
export interface TestGeneratorConfig {
  /**
   * Number of positive tests to generate.
   * Default: 5 (per RESEARCH.md recommendation)
   */
  positiveCount?: number;

  /**
   * Number of negative tests to generate.
   * Default: 5
   */
  negativeCount?: number;

  /**
   * Whether to use LLM generation when available.
   * Default: true (auto-use when ANTHROPIC_API_KEY is set)
   */
  useLLM?: boolean;

  /**
   * Configuration for cross-skill generator.
   * Pass through to CrossSkillGenerator.
   */
  crossSkillConfig?: CrossSkillGeneratorConfig;
}

/**
 * Result of test generation with source tracking.
 */
export interface GenerationResult {
  /**
   * All generated tests.
   */
  tests: GeneratedTest[];

  /**
   * Count of tests by source.
   * Useful for informing users about generation quality.
   */
  sources: {
    llm: number;
    heuristic: number;
    crossSkill: number;
  };

  /**
   * Any non-fatal issues encountered during generation.
   * Examples: "LLM generation failed, falling back to heuristic"
   */
  warnings: string[];
}

/**
 * Orchestrates test generation across multiple strategies.
 *
 * The generator combines:
 * - LLM generation (Claude Haiku) for high-quality diverse tests
 * - Heuristic generation as fallback when LLM unavailable
 * - Cross-skill generation for meaningful negative tests
 *
 * Automatic fallback ensures generation always produces results,
 * even without API access.
 *
 * @example
 * ```typescript
 * const store = new SkillStore(getSkillsBasePath('user'));
 * const generator = new TestGenerator(store, 'user');
 *
 * const result = await generator.generate(
 *   { name: 'git-commit', description: 'Help with git commits' },
 *   { positiveCount: 5, negativeCount: 5 }
 * );
 *
 * console.log(`Generated ${result.tests.length} tests`);
 * console.log(`Sources: ${JSON.stringify(result.sources)}`);
 * if (result.warnings.length > 0) {
 *   console.log('Warnings:', result.warnings.join(', '));
 * }
 * ```
 */
export class TestGenerator {
  private llmGenerator: LLMTestGenerator;
  private heuristicGenerator: HeuristicTestGenerator;
  private crossSkillGenerator: CrossSkillGenerator;

  /**
   * Create a new TestGenerator.
   *
   * @param skillStore - Store for loading competing skills
   * @param scope - Skill scope for cross-skill comparison
   */
  constructor(skillStore: SkillStore, scope: SkillScope) {
    this.llmGenerator = new LLMTestGenerator();
    this.heuristicGenerator = new HeuristicTestGenerator();
    this.crossSkillGenerator = new CrossSkillGenerator(skillStore, scope);
  }

  /**
   * Check if LLM generation is available.
   *
   * Returns true when ANTHROPIC_API_KEY is set. CLI can use this
   * to inform users about expected generation quality.
   */
  getLLMAvailability(): boolean {
    return this.llmGenerator.isAvailable();
  }

  /**
   * Generate tests for a skill.
   *
   * Combines positive and negative test generation with automatic
   * fallback. Positive tests prefer LLM with heuristic fallback.
   * Negative tests combine cross-skill and LLM synthetic approaches.
   *
   * @param skill - Skill information for generation
   * @param config - Optional configuration overrides
   * @returns Generation result with tests, sources, and warnings
   */
  async generate(
    skill: SkillInfo,
    config?: TestGeneratorConfig
  ): Promise<GenerationResult> {
    const tests: GeneratedTest[] = [];
    const sources = { llm: 0, heuristic: 0, crossSkill: 0 };
    const warnings: string[] = [];

    const positiveCount = config?.positiveCount ?? 5;
    const negativeCount = config?.negativeCount ?? 5;
    const useLLM = config?.useLLM !== false;

    // Generate positive tests (LLM with heuristic fallback)
    let positiveTests: GeneratedTest[] = [];

    if (useLLM && this.llmGenerator.isAvailable()) {
      const llmTests = await this.llmGenerator.generatePositive(
        skill,
        positiveCount
      );
      if (llmTests) {
        positiveTests = llmTests;
        sources.llm += llmTests.length;
      } else {
        warnings.push('LLM generation failed, falling back to heuristic');
      }
    }

    // Fallback to heuristic if no LLM tests generated
    if (positiveTests.length === 0) {
      positiveTests = await this.heuristicGenerator.generatePositive(
        skill,
        positiveCount
      );
      sources.heuristic += positiveTests.length;
    }

    tests.push(...positiveTests);

    // Generate negative tests (cross-skill + optional LLM synthetic)
    // Cross-skill negatives get half of requested count
    const crossSkillCount = Math.ceil(negativeCount / 2);
    const crossSkillTests = await this.crossSkillGenerator.generate(
      skill,
      crossSkillCount,
      config?.crossSkillConfig
    );

    tests.push(...crossSkillTests);
    sources.crossSkill += crossSkillTests.length;

    if (crossSkillTests.length === 0) {
      warnings.push('No competing skills found for cross-skill negative tests');
    }

    // LLM synthetic negatives (remaining count, if available)
    if (useLLM && this.llmGenerator.isAvailable()) {
      const llmNegCount = negativeCount - crossSkillTests.length;
      if (llmNegCount > 0) {
        const llmNegs = await this.llmGenerator.generateNegative(
          skill,
          llmNegCount
        );
        if (llmNegs) {
          tests.push(...llmNegs);
          sources.llm += llmNegs.length;
        } else {
          warnings.push('LLM negative generation failed');
        }
      }
    }

    return { tests, sources, warnings };
  }
}
