/**
 * Activation likelihood scoring for skill descriptions.
 *
 * Provides fast, local predictions of how reliably a skill description
 * will trigger Claude's auto-activation feature based on heuristic factors.
 */

import type {
  ActivationConfig,
  ActivationLabel,
  ActivationScore,
  ScoringFactors,
  ScoringWeights,
} from '../types/activation.js';

/**
 * Default weights for scoring factors.
 * Based on research analysis of activation patterns.
 */
const DEFAULT_WEIGHTS: ScoringWeights = {
  specificityWeight: 0.35,
  activationPatternWeight: 0.25,
  lengthWeight: 0.2,
  imperativeVerbWeight: 0.1,
  genericPenaltyWeight: 0.1,
};

/**
 * Common stop words to filter when analyzing terms.
 * These words don't contribute to specificity.
 */
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare',
  'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by',
  'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above',
  'below', 'between', 'under', 'again', 'further', 'then', 'once', 'here',
  'there', 'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both',
  'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
  'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'just',
  'don', 'now', 'and', 'but', 'or', 'if', 'because', 'until', 'while',
  'this', 'that', 'these', 'those', 'am', 'it', 'its', 'he', 'she', 'they',
  'them', 'his', 'her', 'their', 'we', 'you', 'your', 'our', 'my', 'what',
  'which', 'who', 'whom', 'any', 'also', 'about', 'over', 'out', 'up',
  'down', 'off', 'yet', 'even', 'like', 'get', 'make', 'use', 'using',
]);

/**
 * Generic terms that reduce specificity.
 * Overused terms that don't help Claude identify when to activate.
 */
const GENERIC_TERMS = new Set([
  'help', 'code', 'stuff', 'things', 'work', 'files', 'data', 'project',
  'app', 'application', 'system', 'tool', 'tools', 'function', 'functions',
  'task', 'tasks', 'something', 'anything', 'everything', 'general',
  'various', 'multiple', 'different', 'many', 'other', 'etc', 'related',
  'based', 'simple', 'basic', 'common', 'standard', 'typical', 'normal',
  'usual', 'default', 'main', 'primary', 'secondary', 'additional', 'extra',
  'new', 'old', 'good', 'bad', 'better', 'best', 'great', 'nice', 'cool',
]);

/**
 * Imperative verbs that signal clear action.
 * Starting with these improves activation likelihood.
 */
const IMPERATIVE_VERBS = new Set([
  'generate', 'create', 'build', 'run', 'execute', 'analyze', 'parse',
  'convert', 'transform', 'validate', 'check', 'test', 'deploy', 'configure',
  'setup', 'install', 'migrate', 'refactor', 'format', 'lint', 'compile',
  'bundle', 'extract', 'fetch', 'update', 'delete', 'remove', 'add',
  'insert', 'modify', 'edit', 'write', 'read', 'load', 'save', 'export',
  'import', 'sync', 'merge', 'split', 'join', 'filter', 'sort', 'search',
  'find', 'replace', 'scan', 'debug', 'trace', 'log', 'monitor', 'track',
]);

/**
 * Regex patterns that indicate explicit activation triggers.
 * Descriptions with these patterns activate more reliably.
 */
const ACTIVATION_PATTERNS = [
  /\buse\s+when\b/i,
  /\bwhen\s+user\s+asks?\b/i,
  /\bwhen\s+working\s+(on|with)\b/i,
  /\binvoke\s+(when|for)\b/i,
  /\bapply\s+(when|for|to)\b/i,
  /\bactivate\s+(when|for)\b/i,
  /\bfor\s+(tasks?|projects?|work)\s+(involving|related|about)\b/i,
];

/**
 * Scores skill descriptions for activation likelihood.
 *
 * Provides fast, local predictions without requiring external services.
 * Scores are based on heuristic analysis of description quality factors.
 *
 * @example
 * ```typescript
 * const scorer = new ActivationScorer();
 * const result = scorer.score({
 *   name: 'prisma-migrations',
 *   description: 'Run database migrations using Prisma.',
 * });
 * console.log(`${result.label}: ${result.score}/100`);
 * ```
 */
export class ActivationScorer {
  private readonly weights: ScoringWeights;

  /**
   * Create a new activation scorer.
   *
   * @param config - Optional configuration with custom weights
   */
  constructor(config?: ActivationConfig) {
    this.weights = {
      ...DEFAULT_WEIGHTS,
      ...config?.weights,
    };
  }

  /**
   * Score a single skill description.
   *
   * @param skill - Skill with name and description
   * @returns Activation score with factors breakdown
   */
  score(skill: { name: string; description: string }): ActivationScore {
    const factors = this.analyzeFactors(skill.description);

    // Compute weighted sum
    const rawScore =
      factors.specificityScore * this.weights.specificityWeight +
      factors.activationPatternScore * this.weights.activationPatternWeight +
      factors.lengthScore * this.weights.lengthWeight +
      factors.imperativeVerbScore * this.weights.imperativeVerbWeight +
      factors.genericPenalty * this.weights.genericPenaltyWeight;

    // Scale to 0-100 and clamp
    const score = Math.round(Math.min(100, Math.max(0, rawScore * 100)));

    return {
      skillName: skill.name,
      score,
      label: this.getLabel(score),
      factors,
      description: skill.description,
    };
  }

  /**
   * Score multiple skills.
   *
   * @param skills - Array of skills with name and description
   * @returns Array of activation scores
   */
  scoreBatch(skills: Array<{ name: string; description: string }>): ActivationScore[] {
    return skills.map((skill) => this.score(skill));
  }

  /**
   * Analyze individual scoring factors for a description.
   *
   * @param description - Skill description text
   * @returns Individual factor scores (0-1 each)
   */
  private analyzeFactors(description: string): ScoringFactors {
    return {
      lengthScore: this.computeLengthScore(description),
      specificityScore: this.computeSpecificityScore(description),
      activationPatternScore: this.computeActivationPatternScore(description),
      imperativeVerbScore: this.computeImperativeVerbScore(description),
      genericPenalty: this.computeGenericPenalty(description),
    };
  }

  /**
   * Compute length score using bell curve.
   * Optimal length is 50-150 characters.
   */
  private computeLengthScore(description: string): number {
    const len = description.length;

    if (len < 20) {
      return 0.2;
    }
    if (len < 50) {
      // Linear ramp from 0.5 to 1.0
      return 0.5 + ((len - 20) / 30) * 0.5;
    }
    if (len <= 150) {
      // Optimal range
      return 1.0;
    }
    if (len <= 300) {
      // Linear decline from 1.0 to 0.5
      return 1.0 - ((len - 150) / 150) * 0.5;
    }
    // Too long
    return 0.5;
  }

  /**
   * Compute specificity score based on unique terms.
   * Higher score for domain-specific terminology.
   */
  private computeSpecificityScore(description: string): number {
    const terms = this.extractTerms(description);
    if (terms.length === 0) {
      return 0.5;
    }

    const genericCount = terms.filter((term) => GENERIC_TERMS.has(term)).length;
    return 1 - genericCount / terms.length;
  }

  /**
   * Compute score for explicit activation patterns.
   * Patterns like "use when", "when user asks" boost score.
   */
  private computeActivationPatternScore(description: string): number {
    let matchCount = 0;
    for (const pattern of ACTIVATION_PATTERNS) {
      if (pattern.test(description)) {
        matchCount++;
      }
    }
    return Math.min(1.0, matchCount * 0.4);
  }

  /**
   * Compute imperative verb score.
   * Starting with action verbs improves activation.
   */
  private computeImperativeVerbScore(description: string): number {
    // Check if description starts with imperative verb
    const firstWord = description.trim().split(/\s+/)[0]?.toLowerCase() ?? '';
    if (IMPERATIVE_VERBS.has(firstWord)) {
      return 1.0;
    }

    // Check for imperative verb at start of any sentence
    const sentences = description.split(/[.!?]+/);
    for (const sentence of sentences) {
      const sentenceFirstWord = sentence.trim().split(/\s+/)[0]?.toLowerCase() ?? '';
      if (IMPERATIVE_VERBS.has(sentenceFirstWord)) {
        return 0.8;
      }
    }

    return 0.5;
  }

  /**
   * Compute generic penalty score.
   * Lower score for descriptions with many generic terms.
   */
  private computeGenericPenalty(description: string): number {
    const terms = this.extractTerms(description);
    if (terms.length === 0) {
      return 0.5;
    }

    const genericCount = terms.filter((term) => GENERIC_TERMS.has(term)).length;
    // Score = 1 - (genericRatio * 0.5), minimum 0.5
    const penalty = (genericCount / terms.length) * 0.5;
    return Math.max(0.5, 1 - penalty);
  }

  /**
   * Extract meaningful terms from description.
   * Filters stop words and short terms.
   */
  private extractTerms(description: string): string[] {
    return description
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
  }

  /**
   * Get activation label from score.
   */
  private getLabel(score: number): ActivationLabel {
    if (score >= 90) return 'Reliable';
    if (score >= 70) return 'Likely';
    if (score >= 50) return 'Uncertain';
    return 'Unlikely';
  }
}
