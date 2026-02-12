import { diffWords } from 'diff';
import { FeedbackStore } from './feedback-store.js';
import { SkillStore } from '../storage/skill-store.js';
import { DriftTracker } from './drift-tracker.js';
import {
  BoundedLearningConfig,
  DEFAULT_BOUNDED_CONFIG,
  FeedbackEvent,
  RefinementSuggestion,
  SuggestedChange,
  EligibilityResult,
  ValidationResult,
  ApplyResult,
  CorrectionPattern,
} from '../types/learning.js';
import { Skill, SkillMetadata, getExtension, type GsdSkillCreatorExtension } from '../types/skill.js';

/**
 * RefinementEngine generates bounded skill refinement suggestions based on accumulated feedback.
 * Critical safety: all refinements must be bounded and require user confirmation.
 */
export class RefinementEngine {
  private feedbackStore: FeedbackStore;
  private skillStore: SkillStore;
  private config: BoundedLearningConfig;
  private driftTracker?: DriftTracker;

  constructor(
    feedbackStore: FeedbackStore,
    skillStore: SkillStore,
    config?: Partial<BoundedLearningConfig>,
    driftTracker?: DriftTracker
  ) {
    this.feedbackStore = feedbackStore;
    this.skillStore = skillStore;
    this.config = { ...DEFAULT_BOUNDED_CONFIG, ...config };
    this.driftTracker = driftTracker;
  }

  /**
   * Check if a skill is eligible for refinement
   */
  async checkEligibility(skillName: string): Promise<EligibilityResult> {
    // Load skill metadata
    const skill = await this.skillStore.read(skillName);
    if (!skill) {
      return { eligible: false, reason: 'insufficient_feedback', correctionsNeeded: this.config.minCorrectionsForRefinement };
    }

    // Check cooldown
    const ext = getExtension(skill.metadata);
    if (ext.learning?.lastRefined) {
      const lastRefined = new Date(ext.learning.lastRefined);
      const now = new Date();
      const daysSince = (now.getTime() - lastRefined.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSince < this.config.cooldownDays) {
        const daysRemaining = Math.ceil(this.config.cooldownDays - daysSince);
        return { eligible: false, reason: 'cooldown', daysRemaining };
      }
    }

    // Check corrections count
    const corrections = await this.feedbackStore.getCorrections(skillName);
    const correctionCount = corrections.length;

    if (correctionCount < this.config.minCorrectionsForRefinement) {
      const correctionsNeeded = this.config.minCorrectionsForRefinement - correctionCount;
      return { eligible: false, reason: 'insufficient_feedback', correctionsNeeded, correctionCount };
    }

    return { eligible: true, correctionCount };
  }

  /**
   * Generate a refinement suggestion for a skill
   */
  async generateSuggestion(skillName: string): Promise<RefinementSuggestion | null> {
    // Check eligibility first
    const eligibility = await this.checkEligibility(skillName);
    if (!eligibility.eligible) {
      return null;
    }

    // Load skill and corrections
    const skill = await this.skillStore.read(skillName);
    if (!skill) {
      return null;
    }

    const corrections = await this.feedbackStore.getCorrections(skillName);
    if (corrections.length === 0) {
      return null;
    }

    // Analyze correction patterns
    const patterns = this.analyzePatterns(corrections);

    // Generate suggested changes
    const suggestedChanges: SuggestedChange[] = [];
    let totalConfidence = 0;

    for (const pattern of patterns) {
      if (pattern.frequency >= 2) {
        // Pattern repeated at least twice - more confident
        suggestedChanges.push({
          section: 'body',
          original: pattern.originalPattern,
          suggested: pattern.correctedPattern,
          reason: `Pattern observed ${pattern.frequency} times in user corrections`,
        });
        totalConfidence += pattern.frequency;
      }
    }

    if (suggestedChanges.length === 0) {
      return null;
    }

    // Calculate overall confidence
    const confidence = Math.min(
      totalConfidence / (corrections.length * 2),
      1.0
    );

    if (confidence < this.config.minConfidence) {
      return null;
    }

    // Generate preview
    const preview = this.generatePreview(skill, suggestedChanges);

    const skillExt = getExtension(skill.metadata);
    return {
      skillName,
      currentVersion: skillExt.version ?? 1,
      suggestedChanges,
      confidence,
      basedOnCorrections: corrections.length,
      preview,
    };
  }

  /**
   * Validate that a proposed change is within bounds
   */
  validateChange(original: string, suggested: string): ValidationResult {
    if (!original && !suggested) {
      return { valid: true, changePercent: 0 };
    }

    if (!original) {
      return { valid: false, changePercent: 100, reason: 'exceeds_bounds' };
    }

    const changes = diffWords(original, suggested);

    let addedChars = 0;
    let removedChars = 0;
    let totalChars = 0;

    for (const change of changes) {
      if (change.added) {
        addedChars += change.value.length;
      } else if (change.removed) {
        removedChars += change.value.length;
      } else {
        totalChars += change.value.length;
      }
    }

    // Calculate change percent based on original length
    const changedChars = addedChars + removedChars;
    const changePercent = original.length > 0
      ? Math.round((changedChars / original.length) * 100)
      : (suggested.length > 0 ? 100 : 0);

    if (changePercent > this.config.maxContentChangePercent) {
      return { valid: false, changePercent, reason: 'exceeds_bounds' };
    }

    return { valid: true, changePercent };
  }

  /**
   * Apply a refinement suggestion to a skill
   * CRITICAL: Requires user confirmation - throws if not confirmed
   */
  async applyRefinement(
    skillName: string,
    suggestion: RefinementSuggestion,
    userConfirmed: boolean
  ): Promise<ApplyResult> {
    // CRITICAL: User confirmation is mandatory
    if (!userConfirmed) {
      throw new Error('User confirmation required for skill refinement');
    }

    // Load skill
    const skill = await this.skillStore.read(skillName);
    if (!skill) {
      return { success: false, error: 'Skill not found' };
    }

    // Check cumulative drift before applying changes (LRN-01/LRN-02)
    if (this.driftTracker) {
      const driftResult = await this.driftTracker.checkThreshold(skillName);
      if (driftResult.thresholdExceeded) {
        return {
          success: false,
          error: `Cumulative drift (${driftResult.cumulativeDriftPercent}%) exceeds threshold (${driftResult.threshold}%). Automatic refinement halted.`,
        };
      }
    }

    // Validate all changes are within bounds
    for (const change of suggestion.suggestedChanges) {
      const validation = this.validateChange(change.original, change.suggested);
      if (!validation.valid) {
        return {
          success: false,
          error: `Change exceeds bounds (${validation.changePercent}% > ${this.config.maxContentChangePercent}%)`,
        };
      }
    }

    // Apply changes to skill body
    let newBody = skill.body;
    for (const change of suggestion.suggestedChanges) {
      if (change.section === 'body' && change.original) {
        newBody = newBody.replace(change.original, change.suggested);
      }
    }

    // Check projected drift after applying changes (LRN-02)
    if (this.driftTracker) {
      const projectedDrift = await this.driftTracker.computeDriftWithContent(skillName, newBody);
      if (projectedDrift.thresholdExceeded) {
        return {
          success: false,
          error: `Projected drift (${projectedDrift.cumulativeDriftPercent}%) would exceed threshold (${projectedDrift.threshold}%). Refinement rejected.`,
        };
      }
    }

    // Update metadata using accessor pattern
    const currentExt = getExtension(skill.metadata);
    const newVersion = (currentExt.version ?? 1) + 1;

    const updatedExt: GsdSkillCreatorExtension = {
      ...currentExt,
      version: newVersion,
      updatedAt: new Date().toISOString(),
      learning: {
        ...currentExt.learning,
        lastRefined: new Date().toISOString(),
        applicationCount: (currentExt.learning?.applicationCount ?? 0) + 1,
      },
    };

    // Build metadata update with proper nested structure
    const updatedMetadata: Partial<SkillMetadata> = {
      metadata: {
        extensions: {
          'gsd-skill-creator': updatedExt,
        },
      },
    };

    // Save updated skill using update method
    try {
      await this.skillStore.update(skillName, updatedMetadata, newBody);
      return { success: true, newVersion };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }

  /**
   * Analyze patterns in corrections to find common changes
   */
  private analyzePatterns(corrections: FeedbackEvent[]): CorrectionPattern[] {
    const patternMap = new Map<string, CorrectionPattern>();

    for (const correction of corrections) {
      if (!correction.original || !correction.corrected) {
        continue;
      }

      // Create a simple pattern key based on the change
      const key = `${correction.original.slice(0, 50)}:${correction.corrected.slice(0, 50)}`;

      const existing = patternMap.get(key);
      if (existing) {
        existing.frequency++;
      } else {
        patternMap.set(key, {
          section: 'body',
          originalPattern: correction.original,
          correctedPattern: correction.corrected,
          frequency: 1,
        });
      }
    }

    // Convert to array and sort by frequency
    return Array.from(patternMap.values())
      .sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Generate a preview of the refined skill
   */
  private generatePreview(skill: Skill, changes: SuggestedChange[]): string {
    let preview = skill.body;

    for (const change of changes) {
      if (change.section === 'body' && change.original) {
        preview = preview.replace(change.original, `[CHANGED: ${change.suggested}]`);
      }
    }

    return preview.slice(0, 500) + (preview.length > 500 ? '...' : '');
  }
}
