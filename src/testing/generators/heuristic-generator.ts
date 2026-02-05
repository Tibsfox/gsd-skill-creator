import natural from 'natural';
import type {
  GeneratedTest,
  GeneratorStrategy,
  SkillInfo,
} from '../../types/test-generation.js';

/**
 * Common words to filter out during phrase extraction.
 * These don't contribute meaningful content for test prompts.
 */
const STOP_WORDS = new Set([
  // Articles
  'a', 'an', 'the',
  // Prepositions
  'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about',
  'into', 'over', 'after', 'through', 'between', 'under', 'above',
  // Pronouns
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'this', 'that', 'these', 'those',
  'your', 'their', 'his', 'her', 'its', 'our', 'my',
  // Common verbs (too generic)
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
  'must', 'shall', 'can',
  // Conjunctions
  'and', 'or', 'but', 'if', 'then', 'because', 'as', 'until', 'while',
  // Other common words
  'when', 'where', 'what', 'which', 'who', 'whom', 'whose', 'how', 'why',
  'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some',
  'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too',
  'very', 'just', 'also', 'now', 'here', 'there', 'use', 'user', 'users',
  'wants', 'want', 'needs', 'need', 'like', 'using', 'used',
]);

/**
 * Action verbs that indicate meaningful task-oriented phrases.
 */
const ACTION_VERBS = new Set([
  'create', 'make', 'build', 'add', 'remove', 'delete', 'update', 'edit',
  'fix', 'run', 'start', 'stop', 'deploy', 'install', 'configure', 'setup',
  'test', 'check', 'validate', 'analyze', 'generate', 'convert', 'transform',
  'import', 'export', 'load', 'save', 'read', 'write', 'send', 'receive',
  'connect', 'disconnect', 'open', 'close', 'list', 'show', 'display', 'find',
  'search', 'filter', 'sort', 'merge', 'split', 'copy', 'move', 'rename',
  'commit', 'push', 'pull', 'clone', 'branch', 'checkout', 'rebase', 'squash',
  'debug', 'trace', 'log', 'monitor', 'profile', 'optimize', 'refactor',
  'document', 'scaffold', 'bootstrap', 'initialize', 'migrate', 'sync',
  'backup', 'restore', 'clean', 'clear', 'reset', 'format', 'lint', 'compile',
  'manage', 'handle', 'process', 'execute', 'perform', 'help', 'assist',
]);

/**
 * Templates for generating test prompts from key phrases.
 * Each template has a placeholder {phrase} that gets replaced.
 */
const PROMPT_TEMPLATES = [
  'Can you {phrase}?',
  'I need to {phrase}',
  'Help me {phrase}',
  '{phrase} please',
  'I want to {phrase}',
  "Let's {phrase}",
  'Could you {phrase} for me?',
  'Time to {phrase}',
];

/**
 * Heuristic-based test generator using NLP phrase extraction.
 *
 * This generator works without LLM API access by extracting key phrases
 * from skill descriptions and wrapping them in realistic prompt templates.
 *
 * Implements GeneratorStrategy for pluggable use with the test generation
 * system.
 */
export class HeuristicTestGenerator implements GeneratorStrategy {
  private tokenizer: natural.WordTokenizer;

  constructor() {
    this.tokenizer = new natural.WordTokenizer();
  }

  /**
   * Generate positive test cases from skill description.
   *
   * Extracts key action phrases from the description and whenToUse
   * text, then wraps them in diverse prompt templates.
   *
   * @param skill - Skill information for generation
   * @param count - Target number of tests to generate
   * @returns Array of generated positive tests
   */
  async generatePositive(
    skill: SkillInfo,
    count: number
  ): Promise<GeneratedTest[]> {
    // Combine description and whenToUse for source text
    const sourceText = [skill.description, skill.whenToUse]
      .filter(Boolean)
      .join(' ');

    // Extract key phrases
    const phrases = this.extractKeyPhrases(sourceText, count * 2);

    // Generate tests using template rotation
    const tests: GeneratedTest[] = [];
    for (let i = 0; i < Math.min(phrases.length, count); i++) {
      const phrase = phrases[i];
      const template = PROMPT_TEMPLATES[i % PROMPT_TEMPLATES.length];
      const prompt = template.replace('{phrase}', phrase);

      tests.push({
        prompt,
        expected: 'positive',
        source: 'heuristic',
        description: `Tests activation on key phrase: '${phrase}'`,
      });
    }

    return tests;
  }

  /**
   * Generate negative test cases for a skill.
   *
   * The heuristic generator cannot reliably generate negative tests
   * without context of other skills, so it returns an empty array.
   * Use cross-skill or LLM generators for negative tests.
   *
   * @returns Empty array - use other generators for negatives
   */
  async generateNegative(
    _skill: SkillInfo,
    _count: number
  ): Promise<GeneratedTest[]> {
    // Heuristic generator cannot generate good negatives without
    // knowledge of other skills. Return empty array.
    return [];
  }

  /**
   * Extract key action-oriented phrases from text.
   *
   * Strategy:
   * 1. Tokenize text into words
   * 2. Find action verbs with their following objects
   * 3. Build clean bigrams from meaningful tokens
   * 4. Deduplicate and limit count
   */
  private extractKeyPhrases(text: string, maxCount: number): string[] {
    // Tokenize and normalize
    const allTokens = this.tokenizer
      .tokenize(text.toLowerCase())
      ?.filter((token) => token.length > 2) ?? [];

    if (allTokens.length === 0) {
      return [];
    }

    const phrases: string[] = [];
    const seenPhrases = new Set<string>();

    // Strategy 1: Find action verbs with their following non-stop object
    // e.g., "commit changes", "manage repository", "help with"
    for (let i = 0; i < allTokens.length; i++) {
      const token = allTokens[i];
      if (ACTION_VERBS.has(token)) {
        // Look for next meaningful word (skip stop words)
        for (let j = i + 1; j < Math.min(i + 3, allTokens.length); j++) {
          const nextToken = allTokens[j];
          if (!STOP_WORDS.has(nextToken)) {
            const phrase = `${token} ${nextToken}`;
            if (!seenPhrases.has(phrase)) {
              phrases.push(phrase);
              seenPhrases.add(phrase);
            }
            break;
          }
        }
      }
    }

    // Strategy 2: Find noun clusters (consecutive non-stop, non-action words)
    // e.g., "version control", "git commits"
    const meaningfulTokens = allTokens.filter(
      (t) => !STOP_WORDS.has(t) && !ACTION_VERBS.has(t)
    );
    for (let i = 0; i < meaningfulTokens.length - 1; i++) {
      const bigram = `${meaningfulTokens[i]} ${meaningfulTokens[i + 1]}`;
      if (!seenPhrases.has(bigram)) {
        phrases.push(bigram);
        seenPhrases.add(bigram);
      }
    }

    // Strategy 3: Single meaningful nouns as fallback
    // e.g., "commits", "repository"
    for (const token of meaningfulTokens) {
      if (!seenPhrases.has(token) && token.length > 4) {
        phrases.push(token);
        seenPhrases.add(token);
      }
    }

    // Sort by quality (action verb phrases first, then by length)
    phrases.sort((a, b) => {
      const aHasAction = this.hasActionVerb(a);
      const bHasAction = this.hasActionVerb(b);
      if (aHasAction && !bHasAction) return -1;
      if (!aHasAction && bHasAction) return 1;
      // For same category, prefer 2-word phrases
      const aWords = a.split(' ').length;
      const bWords = b.split(' ').length;
      if (aWords === 2 && bWords !== 2) return -1;
      if (bWords === 2 && aWords !== 2) return 1;
      return 0;
    });

    return phrases.slice(0, maxCount);
  }

  /**
   * Check if a phrase is good for test generation.
   *
   * A good phrase:
   * - Contains at least one non-stop word
   * - Ideally contains an action verb
   * - Doesn't have all stop words
   */
  private isGoodPhrase(tokens: string[]): boolean {
    // At least one non-stop word required
    const nonStopWords = tokens.filter((t) => !STOP_WORDS.has(t));
    if (nonStopWords.length === 0) {
      return false;
    }

    // Prefer phrases with action verbs but accept others too
    // if they have enough meaningful content
    const hasAction = tokens.some((t) => ACTION_VERBS.has(t));
    const meaningfulRatio = nonStopWords.length / tokens.length;

    return hasAction || meaningfulRatio >= 0.5;
  }

  /**
   * Check if a phrase contains an action verb.
   */
  private hasActionVerb(phrase: string): boolean {
    const tokens = phrase.toLowerCase().split(' ');
    return tokens.some((t) => ACTION_VERBS.has(t));
  }
}
