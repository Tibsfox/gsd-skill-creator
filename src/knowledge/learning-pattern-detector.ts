/**
 * Learning Pattern Detector
 *
 * Analyzes observation streams to identify successful learning approaches.
 * Detects patterns in activity sequences, timing, scoring progression, and
 * engagement, then surfaces them as potential skill suggestions.
 *
 * Pattern types:
 * - sequence: consistent ordering of module completions across learners
 * - timing: correlation between early-module time investment and later assessment scores
 * - scoring: rubric level progression (beginning -> proficient) within packs
 * - engagement: full activity completion correlated with higher assessment scores
 */

import type { LearnerObservation } from './observation-types.js';

// ============================================================================
// LearningPattern
// ============================================================================

/**
 * A detected learning pattern with confidence and evidence metrics.
 */
export interface LearningPattern {
  /** Deterministic ID derived from pattern type + pack scope */
  id: string;

  /** Pattern category */
  type: 'sequence' | 'timing' | 'scoring' | 'engagement';

  /** Human-readable description of the pattern */
  description: string;

  /** Pack IDs where this pattern was observed */
  packIds: string[];

  /** Number of times the pattern was observed */
  evidenceCount: number;

  /** Confidence score 0.0-1.0 (evidenceCount / totalRelevantObservations) */
  confidence: number;

  /** Pattern-specific metadata */
  details: Record<string, unknown>;
}

// ============================================================================
// LearningPatternSuggestion
// ============================================================================

/**
 * A learning pattern formatted as a potential skill suggestion.
 * Extends LearningPattern with skill-creator conventions.
 */
export interface LearningPatternSuggestion extends LearningPattern {
  /** Suggested skill name (e.g., 'prereq-assessment-first') */
  suggestedSkillName: string;

  /** Description formatted for skill-creator activation */
  suggestedDescription: string;

  /** Packs where this skill pattern could be applied */
  applicablePacks: string[];
}

// ============================================================================
// DetectorConfig
// ============================================================================

/**
 * Configuration for pattern detection thresholds.
 */
export interface DetectorConfig {
  /** Minimum evidence count to qualify as pattern (default: 3) */
  minOccurrences?: number;

  /** Minimum distinct packs for pattern validity (default: 2) */
  minPacks?: number;

  /** Minimum confidence to report pattern (default: 0.3) */
  minConfidence?: number;

  /** Maximum suggestions to return (default: 10) */
  maxSuggestions?: number;
}

// ============================================================================
// LearningPatternDetector
// ============================================================================

export class LearningPatternDetector {
  private config: Required<DetectorConfig>;

  constructor(config?: Partial<DetectorConfig>) {
    this.config = {
      minOccurrences: config?.minOccurrences ?? 3,
      minPacks: config?.minPacks ?? 2,
      minConfidence: config?.minConfidence ?? 0.3,
      maxSuggestions: config?.maxSuggestions ?? 10,
    };
  }

  /**
   * Detect patterns from observation data.
   *
   * Analyzes observation history to find:
   * - Sequence patterns: consistent module ordering
   * - Timing patterns: time investment correlations
   * - Scoring patterns: rubric progression
   * - Engagement patterns: activity completion correlation
   */
  detect(observations: LearnerObservation[]): LearningPattern[] {
    if (observations.length === 0) return [];

    // Group observations by learner, then by pack
    const groupedByLearner = this.groupByLearner(observations);
    const groupedByPackAndLearner = this.groupByPackPerLearner(groupedByLearner);

    const patterns: LearningPattern[] = [];

    // Detect all pattern types
    patterns.push(...this.detectSequencePatterns(groupedByPackAndLearner));
    patterns.push(...this.detectTimingPatterns(groupedByPackAndLearner));
    patterns.push(...this.detectScoringPatterns(groupedByPackAndLearner));
    patterns.push(...this.detectEngagementPatterns(groupedByPackAndLearner));

    return patterns;
  }

  /**
   * Suggest skills based on detected patterns.
   *
   * Calls detect(), filters by minConfidence, maps to skill suggestions.
   */
  suggest(observations: LearnerObservation[]): LearningPatternSuggestion[] {
    const patterns = this.detect(observations);

    // Filter by confidence
    const qualified = patterns.filter(p => p.confidence >= this.config.minConfidence);

    // Map to suggestions
    const suggestions: LearningPatternSuggestion[] = qualified.map(pattern => {
      const skillName = this.generateSkillName(pattern.type, pattern.description);
      const skillDesc = this.generateSkillDescription(pattern.type, pattern.description, pattern.evidenceCount);

      return {
        ...pattern,
        suggestedSkillName: skillName,
        suggestedDescription: skillDesc,
        applicablePacks: pattern.packIds, // Could be expanded to related packs
      };
    });

    // Sort by confidence descending, limit to maxSuggestions
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, this.config.maxSuggestions);
  }

  /**
   * Group observations by learner ID.
   */
  private groupByLearner(observations: LearnerObservation[]): Map<string, LearnerObservation[]> {
    const grouped = new Map<string, LearnerObservation[]>();
    for (const obs of observations) {
      if (!grouped.has(obs.learnerId)) {
        grouped.set(obs.learnerId, []);
      }
      grouped.get(obs.learnerId)!.push(obs);
    }
    return grouped;
  }

  /**
   * Group observations by pack per learner.
   * Returns Map<learnerId, Map<packId, observations>>
   */
  private groupByPackPerLearner(
    byLearner: Map<string, LearnerObservation[]>
  ): Map<string, Map<string, LearnerObservation[]>> {
    const result = new Map<string, Map<string, LearnerObservation[]>>();

    for (const [learnerId, learnerObs] of byLearner) {
      const byPack = new Map<string, LearnerObservation[]>();
      for (const obs of learnerObs) {
        if (!byPack.has(obs.packId)) {
          byPack.set(obs.packId, []);
        }
        byPack.get(obs.packId)!.push(obs);
      }
      result.set(learnerId, byPack);
    }

    return result;
  }

  /**
   * Detect sequence patterns: consistent module ordering across learners in multiple packs.
   */
  private detectSequencePatterns(
    grouped: Map<string, Map<string, LearnerObservation[]>>
  ): LearningPattern[] {
    const patterns: LearningPattern[] = [];
    const sequenceTracking = new Map<string, { count: number; packs: Set<string> }>();

    for (const [, packMap] of grouped) {
      for (const [packId, packObs] of packMap) {
        // Extract module IDs in order of activity completion
        const moduleSequence: string[] = [];
        for (const obs of packObs) {
          if (obs.kind === 'activity_completion' && obs.moduleId) {
            if (!moduleSequence.includes(obs.moduleId)) {
              moduleSequence.push(obs.moduleId);
            }
          }
        }

        if (moduleSequence.length > 1) {
          const key = moduleSequence.join('->');
          if (!sequenceTracking.has(key)) {
            sequenceTracking.set(key, { count: 0, packs: new Set() });
          }
          const entry = sequenceTracking.get(key)!;
          entry.count++;
          entry.packs.add(packId);
        }
      }
    }

    // Qualify sequences that meet thresholds
    for (const [sequence, { count, packs }] of sequenceTracking) {
      if (count >= this.config.minOccurrences && packs.size >= this.config.minPacks) {
        const confidence = count / grouped.size; // Ratio of learners following this sequence
        patterns.push({
          id: `lp-sequence-${this.slugify(sequence)}`,
          type: 'sequence',
          description: `Learners follow module sequence: ${sequence}`,
          packIds: Array.from(packs),
          evidenceCount: count,
          confidence: Math.min(confidence, 1.0),
          details: { moduleSequence: sequence.split('->') },
        });
      }
    }

    return patterns;
  }

  /**
   * Detect timing patterns: early module time investment correlates with later assessment scores.
   */
  private detectTimingPatterns(
    grouped: Map<string, Map<string, LearnerObservation[]>>
  ): LearningPattern[] {
    const patterns: LearningPattern[] = [];
    const timingCorrelations = new Map<string, { occurrences: number; packs: Set<string>; avgCorr: number }>();

    for (const [, packMap] of grouped) {
      for (const [packId, packObs] of packMap) {
        // Find activity completions and assessment results
        const activities = packObs.filter(o => o.kind === 'activity_completion');
        const assessments = packObs.filter(o => o.kind === 'assessment_result');

        if (activities.length > 0 && assessments.length > 0) {
          // Get module IDs from activities, sort chronologically
          const firstModuleActivities = activities
            .filter(o => o.kind === 'activity_completion' && o.moduleId === activities[0].moduleId)
            .filter(o => o.kind === 'activity_completion');

          const totalActivityTime = firstModuleActivities.reduce((sum, a) => {
            return a.kind === 'activity_completion' ? sum + a.durationMinutes : sum;
          }, 0);

          const avgAssessmentScore = assessments.reduce((sum, a) => {
            return a.kind === 'assessment_result' ? sum + a.score : sum;
          }, 0) / assessments.length;

          // Correlation: higher time investment in early modules -> higher scores
          if (totalActivityTime >= 30 && avgAssessmentScore >= 70) {
            const pattern = 'early-module-investment-correlates-with-scores';
            if (!timingCorrelations.has(pattern)) {
              timingCorrelations.set(pattern, { occurrences: 0, packs: new Set(), avgCorr: 0 });
            }
            const entry = timingCorrelations.get(pattern)!;
            entry.occurrences++;
            entry.packs.add(packId);
            entry.avgCorr = (entry.avgCorr + avgAssessmentScore / 100) / 2;
          }
        }
      }
    }

    // Qualify timing patterns
    for (const [pattern, { occurrences, packs, avgCorr }] of timingCorrelations) {
      if (occurrences >= this.config.minOccurrences && packs.size >= this.config.minPacks) {
        patterns.push({
          id: `lp-timing-${this.slugify(pattern)}`,
          type: 'timing',
          description: `Learners who spend 30+ minutes on early modules score higher on assessments`,
          packIds: Array.from(packs),
          evidenceCount: occurrences,
          confidence: avgCorr,
          details: { minEarlyModuleMinutes: 30, correlationStrength: avgCorr },
        });
      }
    }

    return patterns;
  }

  /**
   * Detect scoring patterns: rubric level progression (beginning -> proficient) within packs.
   */
  private detectScoringPatterns(
    grouped: Map<string, Map<string, LearnerObservation[]>>
  ): LearningPattern[] {
    const patterns: LearningPattern[] = [];
    const progressionTracking = new Map<
      string,
      { occurrences: number; packs: Set<string>; avgConfidence: number }
    >();

    const rubricLevels: Record<string, number> = {
      beginning: 0,
      developing: 1,
      proficient: 2,
      advanced: 3,
    };

    for (const [, packMap] of grouped) {
      for (const [packId, packObs] of packMap) {
        // Extract assessment results, sorted by timestamp
        const assessments = packObs
          .filter(o => o.kind === 'assessment_result')
          .sort((a, b) => {
            const timeA = a.kind === 'assessment_result' ? a.timestamp : '';
            const timeB = b.kind === 'assessment_result' ? b.timestamp : '';
            return timeA.localeCompare(timeB);
          });

        // Check if rubric levels progress
        if (assessments.length >= 2) {
          let isProgressing = true;
          let progressionScore = 0;

          for (let i = 1; i < assessments.length; i++) {
            const prevAss = assessments[i - 1];
            const currAss = assessments[i];

            if (prevAss.kind === 'assessment_result' && currAss.kind === 'assessment_result') {
              const prevLevel = rubricLevels[prevAss.rubricLevel] ?? 0;
              const currLevel = rubricLevels[currAss.rubricLevel] ?? 0;

              if (currLevel >= prevLevel) {
                progressionScore += currLevel - prevLevel;
              } else {
                isProgressing = false;
              }
            }
          }

          if (isProgressing && progressionScore > 0) {
            const pattern = 'rubric-progression-through-modules';
            if (!progressionTracking.has(pattern)) {
              progressionTracking.set(pattern, { occurrences: 0, packs: new Set(), avgConfidence: 0 });
            }
            const entry = progressionTracking.get(pattern)!;
            entry.occurrences++;
            entry.packs.add(packId);
            entry.avgConfidence = (entry.avgConfidence + progressionScore / (assessments.length - 1)) / 2;
          }
        }
      }
    }

    // Qualify scoring patterns
    for (const [pattern, { occurrences, packs, avgConfidence }] of progressionTracking) {
      if (occurrences >= this.config.minOccurrences && packs.size >= this.config.minPacks) {
        patterns.push({
          id: `lp-scoring-${this.slugify(pattern)}`,
          type: 'scoring',
          description: `Learners show consistent rubric level progression through pack modules`,
          packIds: Array.from(packs),
          evidenceCount: occurrences,
          confidence: Math.min(avgConfidence, 1.0),
          details: { progressionType: 'beginning-to-proficient' },
        });
      }
    }

    return patterns;
  }

  /**
   * Detect engagement patterns: full activity completion correlates with higher assessment scores.
   */
  private detectEngagementPatterns(
    grouped: Map<string, Map<string, LearnerObservation[]>>
  ): LearningPattern[] {
    const patterns: LearningPattern[] = [];
    const engagementTracking = new Map<string, { occurrences: number; packs: Set<string> }>();

    for (const [, packMap] of grouped) {
      for (const [packId, packObs] of packMap) {
        // Count total activities and completed activities per module
        const moduleStats = new Map<string, { total: number; completed: number }>();

        for (const obs of packObs) {
          if (obs.kind === 'activity_completion') {
            const moduleId = obs.moduleId;
            if (!moduleStats.has(moduleId)) {
              moduleStats.set(moduleId, { total: 0, completed: 0 });
            }
            const stats = moduleStats.get(moduleId)!;
            stats.total++;
            if (obs.completed) {
              stats.completed++;
            }
          }
        }

        // Check if full engagement (all activities completed) correlates with high scores
        const assessments = packObs.filter(o => o.kind === 'assessment_result');
        if (assessments.length > 0) {
          let fullyEngagedModules = 0;
          for (const [, stats] of moduleStats) {
            if (stats.completed === stats.total && stats.total > 0) {
              fullyEngagedModules++;
            }
          }

          const avgAssessmentScore = assessments.reduce((sum, a) => {
            return a.kind === 'assessment_result' ? sum + a.score : sum;
          }, 0) / assessments.length;

          // Pattern: full engagement + high scores
          if (fullyEngagedModules > 0 && avgAssessmentScore >= 75) {
            const pattern = 'full-activity-completion-high-scores';
            if (!engagementTracking.has(pattern)) {
              engagementTracking.set(pattern, { occurrences: 0, packs: new Set() });
            }
            const entry = engagementTracking.get(pattern)!;
            entry.occurrences++;
            entry.packs.add(packId);
          }
        }
      }
    }

    // Qualify engagement patterns
    for (const [pattern, { occurrences, packs }] of engagementTracking) {
      if (occurrences >= this.config.minOccurrences && packs.size >= this.config.minPacks) {
        const confidence = occurrences / grouped.size;
        patterns.push({
          id: `lp-engagement-${this.slugify(pattern)}`,
          type: 'engagement',
          description: `Learners who complete all activities in a module achieve higher assessment scores`,
          packIds: Array.from(packs),
          evidenceCount: occurrences,
          confidence: Math.min(confidence, 1.0),
          details: { engagementThreshold: 'all-activities', scoreThreshold: 75 },
        });
      }
    }

    return patterns;
  }

  /**
   * Generate a skill name from pattern type and description.
   */
  private generateSkillName(type: string, description: string): string {
    const slug = this.slugify(description);
    return `${type}-pattern-${slug}`;
  }

  /**
   * Generate a skill description suitable for skill-creator activation.
   */
  private generateSkillDescription(type: string, description: string, evidenceCount: number): string {
    const typeDescriptions: Record<string, string> = {
      sequence: 'Skill to maintain consistent module ordering',
      timing: 'Skill to balance early module depth with overall pace',
      scoring: 'Skill to support progressive skill development',
      engagement: 'Skill to encourage full activity completion',
    };

    const capability = typeDescriptions[type] || 'Pattern-based learning skill';
    const trigger = `when learners ${description.toLowerCase()}`;

    return `${capability}. Use ${trigger}. Based on ${evidenceCount} observations.`;
  }

  /**
   * Convert text to URL-safe slug.
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 30);
  }
}
