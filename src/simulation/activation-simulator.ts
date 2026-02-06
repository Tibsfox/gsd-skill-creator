/**
 * Activation simulator for predicting skill activation.
 *
 * Uses semantic similarity from embeddings to predict which skill
 * would activate for a given user prompt. Provides confidence scores,
 * challenger detection, and natural language explanations.
 */

import { getEmbeddingService, cosineSimilarity } from '../embeddings/index.js';
import { categorizeConfidence } from './confidence-categorizer.js';
import { detectChallengers } from './challenger-detector.js';
import { generateDifferentiationHints } from './hint-generator.js';
import { generateExplanation } from './explanation-generator.js';
import type {
  SimulationConfig,
  SimulationResult,
  SimulationTrace,
  SkillPrediction,
} from '../types/simulation.js';

/**
 * Default configuration values.
 * Conservative defaults before Phase 18 calibration.
 */
const DEFAULT_CONFIG: Required<SimulationConfig> = {
  threshold: 0.75,         // 75% similarity required for activation
  challengerMargin: 0.1,   // Within 10% of winner to be challenger
  challengerFloor: 0.5,    // Must be at least 50% confident
  includeTrace: false,
};

/**
 * Skill input for simulation.
 */
export interface SkillInput {
  /** Unique skill identifier */
  name: string;
  /** Skill description text for semantic matching */
  description: string;
}

/**
 * Simulates skill activation for user prompts using semantic similarity.
 *
 * @example
 * const simulator = new ActivationSimulator();
 * const result = await simulator.simulate('commit my changes', [
 *   { name: 'git-commit', description: 'Commit changes to git repository' },
 *   { name: 'prisma-migrate', description: 'Run database migrations' },
 * ]);
 * // result.winner?.skillName === 'git-commit'
 */
export class ActivationSimulator {
  private config: Required<SimulationConfig>;

  /**
   * Create a new activation simulator.
   *
   * @param config - Optional configuration overrides
   */
  constructor(config?: SimulationConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Simulate activation for a prompt against a set of skills.
   *
   * @param prompt - User prompt to test
   * @param skills - Array of skills to match against
   * @returns Simulation result with winner, challengers, and explanation
   */
  async simulate(prompt: string, skills: SkillInput[]): Promise<SimulationResult> {
    const startTime = Date.now();

    // Handle empty skills array
    if (skills.length === 0) {
      return {
        prompt,
        winner: null,
        challengers: [],
        allPredictions: [],
        explanation: 'No skill would activate. No skills provided for comparison.',
        method: 'heuristic',
        trace: this.config.includeTrace
          ? {
              embeddingTime: 0,
              comparisonCount: 0,
              threshold: this.config.threshold,
              challengerMargin: this.config.challengerMargin,
              challengerFloor: this.config.challengerFloor,
            }
          : undefined,
      };
    }

    // Get embedding service
    const embeddingService = await getEmbeddingService();

    // Embed the prompt
    const promptResult = await embeddingService.embed(prompt);
    const promptEmbedding = promptResult.embedding;

    // Embed all skill descriptions in batch for efficiency
    const descriptions = skills.map((s) => s.description);
    const skillNames = skills.map((s) => s.name);
    const skillResults = await embeddingService.embedBatch(descriptions, skillNames);

    // Compute similarities and create predictions
    const predictions: SkillPrediction[] = skills.map((skill, i) => {
      const similarity = cosineSimilarity(promptEmbedding, skillResults[i].embedding);
      return {
        skillName: skill.name,
        similarity,
        confidence: similarity * 100,
        confidenceLevel: categorizeConfidence(similarity),
        wouldActivate: similarity >= this.config.threshold,
      };
    });

    // Sort by similarity (highest first)
    predictions.sort((a, b) => b.similarity - a.similarity);

    // Determine winner (highest above threshold)
    const winner = predictions.find((p) => p.wouldActivate) ?? null;

    // Detect challengers using the extracted module
    const challengerResult = detectChallengers(winner, predictions, {
      margin: this.config.challengerMargin,
      floor: this.config.challengerFloor,
    });

    // Build skill description map for hints
    const skillDescMap = new Map(skills.map((s) => [s.name, s.description]));
    const winnerDesc = winner ? skillDescMap.get(winner.skillName) ?? '' : '';

    // Generate differentiation hints if there are challengers
    const hints = winner
      ? generateDifferentiationHints(
          winner,
          winnerDesc,
          challengerResult.challengers,
          skillDescMap
        )
      : [];

    // Generate natural language explanation using the extracted module
    const explanation = generateExplanation(
      winner,
      challengerResult,
      predictions,
      hints,
      { verbose: false, includeHints: challengerResult.tooCloseToCall }
    );

    // Build trace if requested
    const embeddingTime = Date.now() - startTime;
    const trace: SimulationTrace | undefined = this.config.includeTrace
      ? {
          embeddingTime,
          comparisonCount: skills.length,
          threshold: this.config.threshold,
          challengerMargin: this.config.challengerMargin,
          challengerFloor: this.config.challengerFloor,
        }
      : undefined;

    return {
      prompt,
      winner,
      challengers: challengerResult.challengers,
      allPredictions: predictions,
      explanation,
      method: promptResult.method,
      trace,
    };
  }

  /**
   * Get the current configuration (for debugging/testing).
   */
  getConfig(): Required<SimulationConfig> {
    return { ...this.config };
  }
}
