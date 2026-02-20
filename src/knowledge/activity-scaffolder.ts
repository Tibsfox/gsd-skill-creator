/**
 * Activity Scaffolder
 *
 * Generates new learning activities from detected learning patterns.
 * Converts patterns (sequence, timing, scoring, engagement) into concrete
 * PackActivity objects that can be inserted into existing activity chains
 * to reinforce successful approaches.
 *
 * Provides:
 * - Pattern-to-activity conversion with module_id reference resolution
 * - Activity insertion logic that maintains chain integrity
 * - Configurable ID generation and duration defaults
 */

import type { LearningPattern } from './learning-pattern-detector.js';
import type { PackActivity } from './types.js';
import { PackActivitySchema } from './types.js';

// ============================================================================
// ScaffoldedActivity
// ============================================================================

/**
 * An activity generated from a learning pattern.
 * Includes insertion guidance for integrating into existing activity chains.
 */
export interface ScaffoldedActivity {
  /** The generated activity conforming to PackActivitySchema */
  activity: PackActivity;

  /** Which learning pattern inspired this activity */
  sourcePatternId: string;

  /** Activity ID after which to insert this one; null to append */
  insertAfter: string | null;

  /** Human-readable rationale for why this activity was generated */
  rationale: string;
}

// ============================================================================
// ScaffolderConfig
// ============================================================================

/**
 * Configuration for activity generation behavior.
 */
export interface ScaffolderConfig {
  /** Prefix for generated activity IDs (default: 'scaff') */
  idPrefix?: string;

  /** Maximum activities to generate per pattern (default: 2) */
  maxGeneratedPerPattern?: number;

  /** Default duration in minutes for generated activities (default: 20) */
  defaultDurationMinutes?: number;
}

// ============================================================================
// ActivityScaffolder
// ============================================================================

export class ActivityScaffolder {
  private config: Required<ScaffolderConfig>;
  private counter: number = 0;

  constructor(config?: Partial<ScaffolderConfig>) {
    this.config = {
      idPrefix: config?.idPrefix ?? 'scaff',
      maxGeneratedPerPattern: config?.maxGeneratedPerPattern ?? 2,
      defaultDurationMinutes: config?.defaultDurationMinutes ?? 20,
    };
  }

  /**
   * Generate activities from a single learning pattern.
   *
   * Based on pattern type, creates reinforcement activities:
   * - sequence: bridging activities reinforcing successful module ordering
   * - timing: pacing activities for time investment patterns
   * - scoring: assessment-prep activities targeting progression gaps
   * - engagement: completionist activities encouraging full module engagement
   *
   * Each generated activity conforms to PackActivitySchema and can be
   * inserted into an activity chain at the appropriate position.
   */
  scaffold(params: {
    pattern: LearningPattern;
    existingActivities: PackActivity[];
    packId: string;
  }): ScaffoldedActivity[] {
    const { pattern, existingActivities, packId } = params;
    const generated: ScaffoldedActivity[] = [];

    const primaryModuleId = this.extractPrimaryModule(pattern);
    const gradeRange = this.extractGradeRange(existingActivities, primaryModuleId);
    const maxActivities = this.config.maxGeneratedPerPattern;

    // Generate activities based on pattern type
    switch (pattern.type) {
      case 'sequence': {
        if (generated.length < maxActivities) {
          const moduleSequence = pattern.details.moduleSequence as string[] | undefined;
          const sequenceStr = moduleSequence?.join(' → ') ?? 'modules';
          generated.push(this.createSequenceActivity({
            pattern,
            packId,
            primaryModuleId,
            gradeRange,
            sequenceStr,
          }));
        }
        break;
      }

      case 'timing': {
        if (generated.length < maxActivities) {
          const minTime = (pattern.details.minEarlyModuleMinutes as number) ?? 30;
          generated.push(this.createTimingActivity({
            pattern,
            packId,
            primaryModuleId,
            gradeRange,
            minTime,
          }));
        }
        break;
      }

      case 'scoring': {
        if (generated.length < maxActivities) {
          generated.push(this.createScoringActivity({
            pattern,
            packId,
            primaryModuleId,
            gradeRange,
          }));
        }
        break;
      }

      case 'engagement': {
        if (generated.length < maxActivities) {
          generated.push(this.createEngagementActivity({
            pattern,
            packId,
            primaryModuleId,
            gradeRange,
          }));
        }
        break;
      }
    }

    // Determine insertion point for each generated activity
    for (const scaffolded of generated) {
      scaffolded.insertAfter = this.findInsertionPoint(
        existingActivities,
        scaffolded.activity.module_id,
      );
    }

    // Validate all generated activities against schema
    for (const scaffolded of generated) {
      const result = PackActivitySchema.safeParse(scaffolded.activity);
      if (!result.success) {
        throw new Error(`Generated activity failed validation: ${result.error.message}`);
      }
    }

    return generated;
  }

  /**
   * Generate activities for multiple patterns in a single batch.
   *
   * Convenience method that calls scaffold() for each pattern and
   * returns a flat array of all generated activities.
   */
  scaffoldBatch(params: {
    patterns: LearningPattern[];
    existingActivities: PackActivity[];
    packId: string;
  }): ScaffoldedActivity[] {
    const { patterns, existingActivities, packId } = params;
    const all: ScaffoldedActivity[] = [];

    for (const pattern of patterns) {
      const generated = this.scaffold({ pattern, existingActivities, packId });
      all.push(...generated);
    }

    return all;
  }

  /**
   * Insert scaffolded activities into an activity chain at correct positions.
   *
   * Returns a new array with scaffolded activities inserted after their
   * specified insertion points. Does NOT mutate the input chain.
   */
  insertIntoChain(chain: PackActivity[], scaffolded: ScaffoldedActivity[]): PackActivity[] {
    // Start with a copy of the chain
    let result = [...chain];

    // Sort scaffolded activities by insertion point to maintain order
    const sorted = [...scaffolded].sort((a, b) => {
      const aIndex = a.insertAfter
        ? result.findIndex(act => act.id === a.insertAfter)
        : result.length;
      const bIndex = b.insertAfter
        ? result.findIndex(act => act.id === b.insertAfter)
        : result.length;
      return aIndex - bIndex;
    });

    // Insert each activity after its insertion point
    for (const scaff of sorted) {
      const insertIndex = scaff.insertAfter
        ? result.findIndex(act => act.id === scaff.insertAfter) + 1
        : result.length;

      if (insertIndex >= 0 && insertIndex <= result.length) {
        result = [...result.slice(0, insertIndex), scaff.activity, ...result.slice(insertIndex)];
      } else {
        // Fallback: append to end
        result = [...result, scaff.activity];
      }
    }

    return result;
  }

  // ========================================================================
  // Private helpers
  // ========================================================================

  private createSequenceActivity(params: {
    pattern: LearningPattern;
    packId: string;
    primaryModuleId: string;
    gradeRange: string[];
    sequenceStr: string;
  }): ScaffoldedActivity {
    const { pattern, packId, primaryModuleId, gradeRange, sequenceStr } = params;

    const activity: PackActivity = {
      id: this.generateActivityId(packId),
      name: `Sequence Review: ${sequenceStr}`,
      module_id: primaryModuleId,
      grade_range: gradeRange,
      duration_minutes: this.config.defaultDurationMinutes,
      description: `Review the successful module sequence ${sequenceStr} to reinforce ordering and connections.`,
      materials: ['No additional materials required'],
      learning_objectives: [
        'Understand the optimal ordering of modules',
        'Connect concepts across modules in sequence',
        'Prepare for transitions between modules',
      ],
    };

    return {
      activity,
      sourcePatternId: pattern.id,
      insertAfter: null,
      rationale: `Generated to reinforce sequence pattern: ${pattern.description}`,
    };
  }

  private createTimingActivity(params: {
    pattern: LearningPattern;
    packId: string;
    primaryModuleId: string;
    gradeRange: string[];
    minTime: number;
  }): ScaffoldedActivity {
    const { pattern, packId, primaryModuleId, gradeRange, minTime } = params;

    const activity: PackActivity = {
      id: this.generateActivityId(packId),
      name: `Extended Exploration: Deep Module Engagement`,
      module_id: primaryModuleId,
      grade_range: gradeRange,
      duration_minutes: Math.max(minTime, 40),
      description: `Extended exploration activity encouraging the ${minTime}+ minute time investment pattern shown to correlate with higher assessment scores.`,
      materials: ['No additional materials required'],
      learning_objectives: [
        `Spend at least ${minTime} minutes in focused exploration`,
        'Develop deeper understanding through extended engagement',
        'Prepare for assessments with sufficient foundation time',
      ],
    };

    return {
      activity,
      sourcePatternId: pattern.id,
      insertAfter: null,
      rationale: `Generated to support timing pattern: ${pattern.description}`,
    };
  }

  private createScoringActivity(params: {
    pattern: LearningPattern;
    packId: string;
    primaryModuleId: string;
    gradeRange: string[];
  }): ScaffoldedActivity {
    const { pattern, packId, primaryModuleId, gradeRange } = params;

    const activity: PackActivity = {
      id: this.generateActivityId(packId),
      name: `Assessment Preparation & Reflection`,
      module_id: primaryModuleId,
      grade_range: gradeRange,
      duration_minutes: this.config.defaultDurationMinutes,
      description: `Targeted preparation activity addressing the rubric progression gap. Practice self-assessment at each level (beginning, developing, proficient, advanced).`,
      materials: ['Rubric checklist', 'Self-assessment worksheet'],
      learning_objectives: [
        'Understand progression through rubric levels',
        'Identify gaps in current understanding',
        'Practice self-assessment and reflection',
        'Plan next steps toward proficiency',
      ],
    };

    return {
      activity,
      sourcePatternId: pattern.id,
      insertAfter: null,
      rationale: `Generated to support scoring pattern: ${pattern.description}`,
    };
  }

  private createEngagementActivity(params: {
    pattern: LearningPattern;
    packId: string;
    primaryModuleId: string;
    gradeRange: string[];
  }): ScaffoldedActivity {
    const { pattern, packId, primaryModuleId, gradeRange } = params;

    const activity: PackActivity = {
      id: this.generateActivityId(packId),
      name: `Completionist Challenge: Module Mastery`,
      module_id: primaryModuleId,
      grade_range: gradeRange,
      duration_minutes: this.config.defaultDurationMinutes,
      description: `Capstone activity encouraging full module engagement. Completing all activities correlates with higher assessment scores.`,
      materials: ['Activity completion checklist', 'Module overview guide'],
      learning_objectives: [
        'Complete all activities in this module',
        'Build comprehensive understanding',
        'Develop habits of thorough engagement',
        'Prepare for summative assessment',
      ],
    };

    return {
      activity,
      sourcePatternId: pattern.id,
      insertAfter: null,
      rationale: `Generated to support engagement pattern: ${pattern.description}`,
    };
  }

  private generateActivityId(packId: string): string {
    return `${this.config.idPrefix}-${packId}-${this.counter++}`;
  }

  private extractPrimaryModule(pattern: LearningPattern): string {
    // Use first pack ID + M1 as the primary module ID (format: PACK-M1)
    const packId = pattern.packIds[0] || 'pack';
    return `${packId}-M1`;
  }

  private extractGradeRange(activities: PackActivity[], moduleId: string): string[] {
    // Find existing activities in the same module and use their grade range
    const moduleActivities = activities.filter(a => a.module_id === moduleId);
    if (moduleActivities.length > 0) {
      return moduleActivities[0].grade_range || ['6-12'];
    }

    // Also try matching by pack (if moduleId is PACK-M1, look for any activity in PACK-*)
    const packPrefix = moduleId.split('-')[0];
    if (packPrefix) {
      const packActivities = activities.filter(a => a.module_id.startsWith(packPrefix));
      if (packActivities.length > 0) {
        return packActivities[0].grade_range || ['6-12'];
      }
    }

    // Fallback to reasonable default
    return ['6-12'];
  }

  private findInsertionPoint(activities: PackActivity[], moduleId: string): string | null {
    // Find the last activity in the same module
    const moduleActivities = activities.filter(a => a.module_id === moduleId);
    if (moduleActivities.length > 0) {
      return moduleActivities[moduleActivities.length - 1].id;
    }

    // If no activities in module, insert after any activity from the first pack
    if (activities.length > 0) {
      return activities[activities.length - 1].id;
    }

    // No existing activities; append (insertAfter = null)
    return null;
  }
}
