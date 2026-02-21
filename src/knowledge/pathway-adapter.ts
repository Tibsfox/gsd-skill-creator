/**
 * Learning Pathway Adaptation Engine
 *
 * Personalizes module and activity ordering based on learner observation history.
 * Detects struggling learners (triggers reinforcement) and excelling learners
 * (triggers acceleration), with all adaptation decisions fully traceable.
 *
 * @module knowledge/pathway-adapter
 */

import type { LearnerObservation } from './observation-types.js';
import type { PackModule, PackActivity } from './types.js';

// ============================================================================
// PathwayAdaptation Interface
// ============================================================================

/**
 * A single adaptation decision applied to a module.
 *
 * - moduleId: the module being adapted
 * - action: what type of adaptation (reinforce, skip, reorder, maintain)
 * - reason: human-readable explanation for the adaptation
 * - evidence: array of observation IDs supporting this decision
 * - confidence: 0.0-1.0 representing confidence in the adaptation
 */
export interface PathwayAdaptation {
  moduleId: string;
  action: 'reinforce' | 'skip' | 'reorder' | 'maintain';
  reason: string;
  evidence: string[];
  confidence: number;
}

// ============================================================================
// AdaptedPathway Interface
// ============================================================================

/**
 * The complete adapted learning pathway for a learner.
 *
 * - packId: the knowledge pack being adapted
 * - learnerId: the learner this pathway is for
 * - originalOrder: module IDs in original order
 * - adaptedOrder: module IDs in adapted order
 * - adaptations: all adaptation decisions made
 * - reinforcementActivities: extra activities for struggling modules
 * - skippedModules: modules marked for acceleration/skipping
 * - generatedAt: ISO timestamp of when pathway was generated
 */
export interface AdaptedPathway {
  packId: string;
  learnerId: string;
  originalOrder: string[];
  adaptedOrder: string[];
  adaptations: PathwayAdaptation[];
  reinforcementActivities: Array<{ moduleId: string; activityIds: string[] }>;
  skippedModules: string[];
  generatedAt: string;
}

// ============================================================================
// AdapterConfig Interface
// ============================================================================

/**
 * Configuration for the PathwayAdapter behavior.
 *
 * - struggleThreshold: assessment score below which triggers reinforcement (0-100, default 50)
 * - excelThreshold: assessment score above which triggers acceleration (0-100, default 90)
 * - minObservationsForAdaptation: minimum observations per module before adapting (default 2)
 * - maxReinforcementActivities: cap on extra activities per struggling module (default 3)
 */
export interface AdapterConfig {
  struggleThreshold?: number;
  excelThreshold?: number;
  minObservationsForAdaptation?: number;
  maxReinforcementActivities?: number;
}

// ============================================================================
// PathwayAdapter Class
// ============================================================================

/**
 * Personalizes module and activity ordering based on learner observation history.
 *
 * Algorithm:
 * 1. Filter observations to this learner + pack
 * 2. Group observations by moduleId
 * 3. For each module, compute performance metrics (avg score, duration, completion rate)
 * 4. Classify modules: 'struggling' (low avg), 'excelling' (high avg), 'normal'
 * 5. Build adaptations:
 *    - Struggling: action='reinforce', add reinforcement activities
 *    - Excelling: action='skip' if all completed, else 'maintain'
 *    - Normal: action='maintain'
 * 6. Reorder modules: struggling first, then normal, then excelling/skipped
 * 7. Return AdaptedPathway with all decisions and evidence
 */
export class PathwayAdapter {
  private config: Required<AdapterConfig>;

  constructor(config?: Partial<AdapterConfig>) {
    this.config = {
      struggleThreshold: config?.struggleThreshold ?? 50,
      excelThreshold: config?.excelThreshold ?? 90,
      minObservationsForAdaptation: config?.minObservationsForAdaptation ?? 2,
      maxReinforcementActivities: config?.maxReinforcementActivities ?? 3,
    };
  }

  /**
   * Generate a personalized learning pathway.
   *
   * @param params object containing:
   *   - packId: the knowledge pack ID
   *   - learnerId: the learner ID
   *   - modules: array of PackModule objects
   *   - activities: array of PackActivity objects
   *   - observations: array of LearnerObservation objects
   * @returns AdaptedPathway with personalized module ordering and decisions
   */
  adapt(params: {
    packId: string;
    learnerId: string;
    modules: PackModule[];
    activities: PackActivity[];
    observations: LearnerObservation[];
  }): AdaptedPathway {
    const { packId, learnerId, modules, activities, observations } = params;

    // 1. Filter observations to this learner + pack
    const relevantObs = observations.filter(
      (obs) => obs.learnerId === learnerId && obs.packId === packId
    );

    // Store original order
    const originalOrder = modules.map((m) => m.id);

    // 2. Group observations by moduleId
    const obsByModule = new Map<string, LearnerObservation[]>();
    for (const obs of relevantObs) {
      if (
        obs.kind === 'assessment_result' ||
        obs.kind === 'activity_completion'
      ) {
        const moduleId =
          obs.kind === 'assessment_result' ? obs.moduleId : obs.moduleId;
        if (!obsByModule.has(moduleId)) {
          obsByModule.set(moduleId, []);
        }
        obsByModule.get(moduleId)!.push(obs);
      }
    }

    // 3. & 4. Classify modules and build adaptations
    const adaptations: PathwayAdaptation[] = [];
    const reinforcementActivities: Array<{
      moduleId: string;
      activityIds: string[];
    }> = [];
    const skippedModules: string[] = [];
    const moduleClassifications = new Map<
      string,
      { classification: 'struggling' | 'excelling' | 'normal'; avgScore: number; completionRate: number }
    >();

    for (const module of modules) {
      const moduleObservations = obsByModule.get(module.id) ?? [];

      // Check if we have enough observations for adaptation
      if (
        moduleObservations.length <
        this.config.minObservationsForAdaptation
      ) {
        // Not enough data — maintain
        adaptations.push({
          moduleId: module.id,
          action: 'maintain',
          reason: `Insufficient observation data (${moduleObservations.length} < ${this.config.minObservationsForAdaptation}). Maintaining current position.`,
          evidence: moduleObservations.map((o) => o.id),
          confidence: 0.0,
        });
        moduleClassifications.set(module.id, {
          classification: 'normal',
          avgScore: 0,
          completionRate: 0,
        });
        continue;
      }

      const { classification, avgScore, completionRate } =
        this.classifyModule(module.id, moduleObservations);

      moduleClassifications.set(module.id, {
        classification,
        avgScore,
        completionRate,
      });

      if (classification === 'struggling') {
        // Add reinforcement activities
        const reinforcementActivitiesForModule =
          this.findReinforcementActivities(
            module.id,
            activities,
            this.config.maxReinforcementActivities
          );

        reinforcementActivities.push({
          moduleId: module.id,
          activityIds: reinforcementActivitiesForModule,
        });

        const reason = this.buildReason(
          'struggling',
          avgScore,
          completionRate
        );
        adaptations.push({
          moduleId: module.id,
          action: 'reinforce',
          reason,
          evidence: moduleObservations.map((o) => o.id),
          confidence: Math.min(
            1.0,
            moduleObservations.length /
              (this.config.minObservationsForAdaptation * 2)
          ),
        });
      } else if (classification === 'excelling') {
        // Check if all activities completed
        const completedAll = completionRate > 0.95; // 95%+ completion

        if (completedAll) {
          skippedModules.push(module.id);
          adaptations.push({
            moduleId: module.id,
            action: 'skip',
            reason: this.buildReason('excelling', avgScore, completionRate),
            evidence: moduleObservations.map((o) => o.id),
            confidence: Math.min(
              1.0,
              moduleObservations.length /
                (this.config.minObservationsForAdaptation * 2)
            ),
          });
        } else {
          adaptations.push({
            moduleId: module.id,
            action: 'maintain',
            reason: `Excelling learner with incomplete activities (${Math.round(completionRate * 100)}% done). Maintaining current position to finish remaining work.`,
            evidence: moduleObservations.map((o) => o.id),
            confidence: Math.min(
              1.0,
              moduleObservations.length /
                (this.config.minObservationsForAdaptation * 2)
            ),
          });
        }
      } else {
        // Normal
        adaptations.push({
          moduleId: module.id,
          action: 'maintain',
          reason: this.buildReason('normal', avgScore, completionRate),
          evidence: moduleObservations.map((o) => o.id),
          confidence: Math.min(
            1.0,
            moduleObservations.length /
              (this.config.minObservationsForAdaptation * 2)
          ),
        });
      }
    }

    // 5. & 6. Reorder modules
    const adaptedOrder = this.reorderModules(
      originalOrder,
      moduleClassifications,
      skippedModules
    );

    // 7. Return AdaptedPathway
    return {
      packId,
      learnerId,
      originalOrder,
      adaptedOrder,
      adaptations,
      reinforcementActivities,
      skippedModules,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Classify a module as 'struggling', 'excelling', or 'normal'
   * based on learner performance data.
   *
   * Looks for assessment_result observations to compute average score.
   * Returns classification, average score, and completion rate.
   */
  private classifyModule(
    moduleId: string,
    observations: LearnerObservation[]
  ): {
    classification: 'struggling' | 'excelling' | 'normal';
    avgScore: number;
    completionRate: number;
  } {
    // Filter to assessment_result observations
    const assessments = observations.filter(
      (obs) => obs.kind === 'assessment_result'
    );

    // Filter to activity_completion observations
    const completions = observations.filter(
      (obs) => obs.kind === 'activity_completion'
    );

    // Compute average assessment score
    let avgScore = 0;
    if (assessments.length > 0) {
      const total = assessments.reduce(
        (sum, obs) => (obs.kind === 'assessment_result' ? sum + obs.score : sum),
        0
      );
      avgScore = total / assessments.length;
    }

    // Compute completion rate
    let completionRate = 0;
    if (completions.length > 0) {
      const completed = completions.filter(
        (obs) => obs.kind === 'activity_completion' && obs.completed
      ).length;
      completionRate = completed / completions.length;
    }

    // Classify based on average score
    let classification: 'struggling' | 'excelling' | 'normal';
    if (avgScore < this.config.struggleThreshold) {
      classification = 'struggling';
    } else if (avgScore > this.config.excelThreshold) {
      classification = 'excelling';
    } else {
      classification = 'normal';
    }

    return { classification, avgScore, completionRate };
  }

  /**
   * Find reinforcement activities for a struggling module.
   *
   * Returns activity IDs from the module, sorted by shortest duration first,
   * capped at the requested count.
   */
  private findReinforcementActivities(
    moduleId: string,
    activities: PackActivity[],
    count: number
  ): string[] {
    // Filter activities for this module
    const moduleActivities = activities.filter(
      (act) => act.module_id === moduleId
    );

    // Sort by duration (shortest first)
    const sorted = [...moduleActivities].sort(
      (a, b) => a.duration_minutes - b.duration_minutes
    );

    // Take first 'count' activities
    return sorted.slice(0, count).map((act) => act.id);
  }

  /**
   * Build a human-readable reason string for a classification.
   */
  private buildReason(
    classification: string,
    avgScore: number,
    completionRate: number
  ): string {
    const roundedScore = Math.round(avgScore);
    const roundedCompletion = Math.round(completionRate * 100);

    if (classification === 'struggling') {
      return `Learner struggling with this module (avg score: ${roundedScore}%, completion: ${roundedCompletion}%). Adding reinforcement activities to build stronger foundation.`;
    } else if (classification === 'excelling') {
      return `Learner excelling in this module (avg score: ${roundedScore}%, completion: ${roundedCompletion}%). Ready for acceleration or independent exploration.`;
    } else {
      return `Learner making normal progress in this module (avg score: ${roundedScore}%, completion: ${roundedCompletion}%). Maintaining current learning pace.`;
    }
  }

  /**
   * Reorder modules to prioritize struggling modules and defer skipped ones.
   *
   * Order: struggling modules first (more practice before advancing),
   * then normal modules, then excelling/skipped modules.
   */
  private reorderModules(
    originalOrder: string[],
    classifications: Map<
      string,
      { classification: 'struggling' | 'excelling' | 'normal'; avgScore: number; completionRate: number }
    >,
    skipped: string[]
  ): string[] {
    const struggling: string[] = [];
    const normal: string[] = [];
    const excelling: string[] = [];

    for (const moduleId of originalOrder) {
      const info = classifications.get(moduleId);
      if (!info) continue;

      if (info.classification === 'struggling') {
        struggling.push(moduleId);
      } else if (info.classification === 'normal') {
        normal.push(moduleId);
      } else {
        excelling.push(moduleId);
      }
    }

    // Return reordered: struggling + normal + excelling
    return [...struggling, ...normal, ...excelling];
  }
}
