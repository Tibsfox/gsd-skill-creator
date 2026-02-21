/**
 * Approach Promoter
 *
 * Converts high-confidence learning patterns into reusable skill definitions.
 * Takes pattern suggestions detected by LearningPatternDetector and promotes
 * them to the skill library for reuse across learners and packs.
 *
 * Provides:
 * - Pattern-to-skill conversion with skill-creator conventions
 * - SKILL.md format output for integration into skill library
 * - Confidence filtering and prioritization
 */

import type { LearningPatternSuggestion } from './learning-pattern-detector.js';

// ============================================================================
// PromotedApproach
// ============================================================================

/**
 * A learning pattern promoted to a reusable skill in the skill library.
 * Includes trigger conditions, action steps, and markdown output.
 */
export interface PromotedApproach {
  /** Unique promotion ID (e.g., 'promo-lp-fast-completion') */
  id: string;

  /** Name for the skill file */
  skillName: string;

  /** Activation-friendly description per skill-creator format */
  skillDescription: string;

  /** When this skill should activate (e.g., 'learner starts new module') */
  triggerConditions: string[];

  /** What the skill does when activated */
  actionSteps: string[];

  /** Traceability: originating pattern ID */
  sourcePatternId: string;

  /** Confidence from source pattern [0, 1] */
  confidence: number;

  /** Packs where this skill can be applied */
  applicablePacks: string[];

  /** ISO timestamp when promoted */
  promotedAt: string;
}

// ============================================================================
// PromoterConfig
// ============================================================================

/**
 * Configuration for promotion thresholds and limits.
 */
export interface PromoterConfig {
  /** Minimum pattern confidence to promote (default: 0.5) */
  minConfidence?: number;

  /** Maximum simultaneous promotions (default: 5) */
  maxPromotions?: number;
}

// ============================================================================
// ApproachPromoter
// ============================================================================

export class ApproachPromoter {
  private config: Required<PromoterConfig>;

  constructor(config?: Partial<PromoterConfig>) {
    this.config = {
      minConfidence: config?.minConfidence ?? 0.5,
      maxPromotions: config?.maxPromotions ?? 5,
    };
  }

  /**
   * Promote pattern suggestions to skill definitions.
   *
   * Filters suggestions by minConfidence, sorts by confidence descending,
   * caps at maxPromotions, and constructs PromotedApproach objects with
   * trigger conditions and action steps derived from pattern type.
   */
  promote(suggestions: LearningPatternSuggestion[]): PromotedApproach[] {
    // Filter by confidence threshold
    const qualified = suggestions.filter(s => s.confidence >= this.config.minConfidence);

    // Sort by confidence descending
    const sorted = [...qualified].sort((a, b) => b.confidence - a.confidence);

    // Cap at max promotions
    const capped = sorted.slice(0, this.config.maxPromotions);

    // Construct promoted approaches
    const promoted: PromotedApproach[] = capped.map(suggestion => {
      const triggerConditions = this.deriveTriggerConditions(suggestion);
      const actionSteps = this.deriveActionSteps(suggestion);

      return {
        id: `promo-${suggestion.id}`,
        skillName: suggestion.suggestedSkillName,
        skillDescription: `${suggestion.suggestedDescription}. Use when ${triggerConditions[0] || 'needed'}.`,
        triggerConditions,
        actionSteps,
        sourcePatternId: suggestion.id,
        confidence: suggestion.confidence,
        applicablePacks: suggestion.applicablePacks,
        promotedAt: new Date().toISOString(),
      };
    });

    return promoted;
  }

  /**
   * Generate SKILL.md format markdown for a promoted approach.
   *
   * Produces a markdown document with skill name, description, triggers,
   * action steps, applicable packs, and metadata.
   */
  toSkillMarkdown(approach: PromotedApproach): string {
    const lines: string[] = [];

    lines.push(`# ${approach.skillName}`);
    lines.push('');
    lines.push(approach.skillDescription);
    lines.push('');

    // Triggers section
    lines.push('## Triggers');
    for (const trigger of approach.triggerConditions) {
      lines.push(`- ${trigger}`);
    }
    lines.push('');

    // Steps section
    lines.push('## Steps');
    approach.actionSteps.forEach((step, index) => {
      lines.push(`${index + 1}. ${step}`);
    });
    lines.push('');

    // Applicable Packs section
    if (approach.applicablePacks.length > 0) {
      lines.push('## Applicable Packs');
      for (const pack of approach.applicablePacks) {
        lines.push(`- ${pack}`);
      }
      lines.push('');
    }

    // Metadata footer
    lines.push('---');
    lines.push(`Confidence: ${(approach.confidence * 100).toFixed(0)}%`);
    lines.push(`Source Pattern: ${approach.sourcePatternId}`);
    lines.push(`Promoted: ${approach.promotedAt}`);

    return lines.join('\n');
  }

  // ========================================================================
  // Private helpers
  // ========================================================================

  private deriveTriggerConditions(suggestion: LearningPatternSuggestion): string[] {
    const triggers: Record<string, string[]> = {
      sequence: ['learner starts a new module in applicable pack'],
      timing: ['learner spends less than average time on early module activities'],
      scoring: ['learner assessment score drops between modules'],
      engagement: ['learner skips activities in a module'],
    };

    return triggers[suggestion.type] || ['pattern detected during learning'];
  }

  private deriveActionSteps(suggestion: LearningPatternSuggestion): string[] {
    const steps: Record<string, string[]> = {
      sequence: [
        'Recommend completing modules in the identified successful sequence',
        'Highlight prerequisite modules in the module browser',
        'Suggest bridging activities between modules',
      ],
      timing: [
        'Notify learner of optimal early-module time investment pattern',
        'Suggest pacing activities to build strong foundations',
        'Encourage focused exploration in early modules before moving forward',
      ],
      scoring: [
        'Identify rubric level gaps in current assessments',
        'Generate targeted practice activities for weaker levels',
        'Provide rubric-aligned feedback and next steps',
      ],
      engagement: [
        'Highlight skipped activities in the module view',
        'Explain value of full engagement for assessment readiness',
        'Create optional catch-up activities for skipped items',
      ],
    };

    return steps[suggestion.type] || ['Apply the detected pattern to guide learning'];
  }
}
