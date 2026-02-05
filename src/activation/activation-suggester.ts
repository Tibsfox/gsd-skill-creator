/**
 * Suggester for improving activation likelihood.
 *
 * Generates actionable suggestions based on factor analysis.
 * More suggestions for lower scores, includes before/after examples.
 */

import type { ActivationScore } from '../types/activation.js';

/**
 * A suggestion for improving a skill description.
 */
export interface ActivationSuggestion {
  /** Type of improvement */
  type: 'addActivationPhrase' | 'addSpecificity' | 'addImperative' | 'adjustLength' | 'reduceGeneric';
  /** Human-readable suggestion */
  text: string;
  /** Example transformation */
  example?: {
    before: string;
    after: string;
  };
}

export class ActivationSuggester {
  /**
   * Generate suggestions for improving a skill's activation score.
   *
   * Number of suggestions scales with score severity:
   * - Reliable (90+): 0 suggestions
   * - Likely (70-89): 1 suggestion
   * - Uncertain (50-69): 2-3 suggestions
   * - Unlikely (<50): 4-5 suggestions
   */
  suggest(result: ActivationScore): ActivationSuggestion[] {
    const maxSuggestions = this.getMaxSuggestions(result.score);
    if (maxSuggestions === 0) return [];

    const candidates: ActivationSuggestion[] = [];
    const factors = result.factors;

    // Check each factor and generate suggestions for weak areas
    if (factors.activationPatternScore < 0.5) {
      candidates.push(this.suggestActivationPhrase());
    }

    if (factors.specificityScore < 0.6) {
      candidates.push(this.suggestSpecificity());
    }

    if (factors.imperativeVerbScore < 0.7) {
      candidates.push(this.suggestImperativeVerb());
    }

    if (factors.lengthScore < 0.7) {
      candidates.push(this.suggestLengthAdjustment(result.description.length));
    }

    if (factors.genericPenalty < 0.8) {
      candidates.push(this.suggestReduceGeneric());
    }

    // Sort by priority (activation patterns most impactful, then specificity)
    const priorityOrder = ['addActivationPhrase', 'addSpecificity', 'addImperative', 'adjustLength', 'reduceGeneric'];
    candidates.sort((a, b) => priorityOrder.indexOf(a.type) - priorityOrder.indexOf(b.type));

    // Return top N suggestions
    return candidates.slice(0, maxSuggestions);
  }

  private getMaxSuggestions(score: number): number {
    if (score >= 90) return 0;  // Reliable - no suggestions needed
    if (score >= 70) return 1;  // Likely - minor improvement
    if (score >= 50) return 3;  // Uncertain - several suggestions
    return 5;                    // Unlikely - comprehensive feedback
  }

  private suggestActivationPhrase(): ActivationSuggestion {
    return {
      type: 'addActivationPhrase',
      text: 'Add an explicit activation phrase like "Use when..." or "Invoke for..."',
      example: {
        before: 'Handles TypeScript compilation',
        after: 'Handles TypeScript compilation. Use when building or bundling TypeScript projects.',
      },
    };
  }

  private suggestSpecificity(): ActivationSuggestion {
    return {
      type: 'addSpecificity',
      text: 'Add specific technology names, file types, or domain terms',
      example: {
        before: 'Helps with code quality',
        after: 'Run ESLint and Prettier on TypeScript/JavaScript files',
      },
    };
  }

  private suggestImperativeVerb(): ActivationSuggestion {
    return {
      type: 'addImperative',
      text: 'Start with an action verb like Generate, Create, Run, or Build',
      example: {
        before: 'For database migrations',
        after: 'Run database migrations using Prisma or Drizzle ORM',
      },
    };
  }

  private suggestLengthAdjustment(currentLength: number): ActivationSuggestion {
    if (currentLength < 50) {
      return {
        type: 'adjustLength',
        text: 'Add more context - what specifically does this skill do and when?',
        example: {
          before: 'Git helper',
          after: 'Git workflow helper. Use when committing, branching, or resolving merge conflicts.',
        },
      };
    } else {
      return {
        type: 'adjustLength',
        text: 'Shorten the description - focus on the primary use case',
        example: {
          before: 'This skill helps with various tasks including but not limited to code formatting, linting, and general cleanup operations that improve code quality...',
          after: 'Format and lint code before commits. Use when cleaning up TypeScript/JavaScript files.',
        },
      };
    }
  }

  private suggestReduceGeneric(): ActivationSuggestion {
    return {
      type: 'reduceGeneric',
      text: 'Replace generic terms (help, stuff, things, code) with specific ones',
      example: {
        before: 'Helps with code stuff',
        after: 'Generate unit tests for React components using Jest and Testing Library',
      },
    };
  }
}
