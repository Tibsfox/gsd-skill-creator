/**
 * Pipeline Learning feedback engine.
 *
 * Tracks execution accuracy by comparing predicted MOVE activations
 * (from a Pipeline) against actual skill activations. Accumulates
 * feedback records per LibraryEntry and refines lists by adjusting
 * confidence, adding missing MOVEs, and removing unused MOVEs.
 *
 * Accuracy uses Jaccard similarity: |intersection| / |union| of
 * predicted vs actual skill sets.
 */

import type {
  Pipeline,
  PipelineInstruction,
  MoveInstruction,
} from '../types.js';
import { PipelineSchema } from '../schema.js';
import type { FeedbackRecord, LibraryEntry } from './types.js';

// ============================================================================
// Configuration
// ============================================================================

/**
 * Configuration for the FeedbackEngine.
 */
export interface FeedbackEngineConfig {
  /** Minimum feedback records before refinement is allowed (default 3). */
  minFeedbackForRefinement: number;
  /** Maximum feedback records to retain per entry (default 20). */
  maxHistory: number;
  /** Threshold for skill addition: fraction of feedbacks where skill appeared in actual but not predicted (default 0.7). */
  addThreshold: number;
  /** Threshold for skill removal: fraction of feedbacks where skill was predicted but not in actual (default 0.8). */
  removeThreshold: number;
  /** Maximum confidence boost per refinement (default 0.1). */
  maxConfidenceBoost: number;
  /** Maximum confidence degradation per refinement (default 0.15). */
  maxConfidenceDegradation: number;
}

export const DEFAULT_FEEDBACK_CONFIG: FeedbackEngineConfig = {
  minFeedbackForRefinement: 3,
  maxHistory: 20,
  addThreshold: 0.7,
  removeThreshold: 0.8,
  maxConfidenceBoost: 0.1,
  maxConfidenceDegradation: 0.15,
};

// ============================================================================
// Refinement Result
// ============================================================================

/**
 * Result of a refinement operation on a LibraryEntry.
 */
export interface RefinementResult {
  /** Whether any changes were made. */
  refined: boolean;
  /** Change in confidence (-0.15 to +0.1). */
  confidenceDelta: number;
  /** Skills added as MOVE instructions. */
  addedSkills: string[];
  /** Skills removed from MOVE instructions. */
  removedSkills: string[];
  /** New version number after refinement. */
  newVersion: number;
}

// ============================================================================
// FeedbackEngine
// ============================================================================

/**
 * Engine that records execution feedback and refines Pipelines.
 *
 * After a learned Pipeline executes, the engine compares predicted
 * MOVE instructions against actual skill activations. Over time, it
 * adjusts confidence scores and modifies lists by adding missed skills
 * or removing unused ones.
 */
export class FeedbackEngine {
  private readonly config: FeedbackEngineConfig;

  constructor(config: Partial<FeedbackEngineConfig> = {}) {
    this.config = { ...DEFAULT_FEEDBACK_CONFIG, ...config };
  }

  // --------------------------------------------------------------------------
  // recordFeedback
  // --------------------------------------------------------------------------

  /**
   * Record an execution outcome for a LibraryEntry.
   *
   * Extracts predicted skills from the list's MOVE instructions,
   * calculates Jaccard accuracy against actual activations, and
   * appends a FeedbackRecord to the entry's history.
   *
   * @param entry - The library entry whose list was executed.
   * @param actual - Names of skills that were actually activated.
   * @returns The created FeedbackRecord.
   */
  recordFeedback(entry: LibraryEntry, actual: string[]): FeedbackRecord {
    const predicted = this.extractPredictedSkills(entry.list);
    const accuracy = this.calculateJaccardAccuracy(predicted, actual);

    const record: FeedbackRecord = {
      listName: entry.list.metadata.name,
      workflowType: entry.workflowType,
      timestamp: Date.now(),
      predicted,
      actual,
      accuracy,
      refined: false,
    };

    // Append to history, trim to maxHistory (remove oldest)
    entry.feedbackHistory.push(record);
    if (entry.feedbackHistory.length > this.config.maxHistory) {
      entry.feedbackHistory.splice(
        0,
        entry.feedbackHistory.length - this.config.maxHistory,
      );
    }

    // Increment execution count
    entry.executionCount += 1;

    // Update rolling average accuracy
    const totalAccuracy = entry.feedbackHistory.reduce(
      (sum, r) => sum + r.accuracy,
      0,
    );
    entry.accuracy = totalAccuracy / entry.feedbackHistory.length;

    // Update timestamp
    entry.updatedAt = Date.now();

    return record;
  }

  // --------------------------------------------------------------------------
  // refine
  // --------------------------------------------------------------------------

  /**
   * Refine a LibraryEntry based on accumulated feedback.
   *
   * Adjusts confidence based on average accuracy, adds MOVE instructions
   * for consistently missed skills, removes MOVE instructions for
   * consistently unused skills, and validates the result.
   *
   * @param entry - The library entry to refine.
   * @returns A RefinementResult describing what changed.
   */
  refine(entry: LibraryEntry): RefinementResult {
    const noChange: RefinementResult = {
      refined: false,
      confidenceDelta: 0,
      addedSkills: [],
      removedSkills: [],
      newVersion: entry.version,
    };

    // Check minimum feedback threshold
    if (entry.feedbackHistory.length < this.config.minFeedbackForRefinement) {
      return noChange;
    }

    // Save original state for rollback
    const originalInstructions = entry.list.instructions.map((i) => ({ ...i }));
    const originalConfidence = entry.list.metadata.confidence ?? 1.0;

    // --- Step 1: Adjust confidence based on average accuracy ---
    const avgAccuracy = entry.accuracy;
    let confidenceDelta = 0;

    if (avgAccuracy >= 0.7) {
      confidenceDelta = Math.min(
        (avgAccuracy - 0.7) * 0.33,
        this.config.maxConfidenceBoost,
      );
    } else if (avgAccuracy <= 0.3) {
      confidenceDelta = -Math.min(
        (0.3 - avgAccuracy) * 0.5,
        this.config.maxConfidenceDegradation,
      );
    }

    let newConfidence = Math.max(0, Math.min(1, originalConfidence + confidenceDelta));

    // --- Step 2: Identify skills to add ---
    const currentMoveNames = new Set(this.extractPredictedSkills(entry.list));
    const addedSkills: string[] = [];

    // Collect all skills from actual that are not in current MOVEs
    const missedSkillCounts = new Map<string, number>();
    for (const record of entry.feedbackHistory) {
      for (const skill of record.actual) {
        if (!currentMoveNames.has(skill)) {
          missedSkillCounts.set(skill, (missedSkillCounts.get(skill) ?? 0) + 1);
        }
      }
    }

    for (const [skill, count] of missedSkillCounts) {
      if (count / entry.feedbackHistory.length >= this.config.addThreshold) {
        // Create MOVE instruction for missed skill
        const moveInstruction: MoveInstruction = {
          type: 'move',
          target: 'skill',
          name: skill,
          mode: 'lite',
          description: 'Added by learning feedback',
        };

        // Insert before the last instruction (often a trailing WAIT), or append
        const lastIdx = entry.list.instructions.length - 1;
        const lastInstruction = entry.list.instructions[lastIdx];
        if (lastInstruction && lastInstruction.type === 'wait') {
          entry.list.instructions.splice(lastIdx, 0, moveInstruction);
        } else {
          entry.list.instructions.push(moveInstruction);
        }

        addedSkills.push(skill);
      }
    }

    // --- Step 3: Identify skills to remove ---
    const removedSkills: string[] = [];
    const unusedSkillCounts = new Map<string, number>();

    // For each predicted MOVE skill, count how many feedbacks do NOT have it in actual
    for (const record of entry.feedbackHistory) {
      const actualSet = new Set(record.actual);
      for (const skill of record.predicted) {
        if (!actualSet.has(skill)) {
          unusedSkillCounts.set(skill, (unusedSkillCounts.get(skill) ?? 0) + 1);
        }
      }
    }

    for (const [skill, count] of unusedSkillCounts) {
      if (count / entry.feedbackHistory.length >= this.config.removeThreshold) {
        removedSkills.push(skill);
      }
    }

    // Remove marked MOVE instructions (never remove WAIT instructions)
    if (removedSkills.length > 0) {
      const removeSet = new Set(removedSkills);
      entry.list.instructions = entry.list.instructions.filter((instr) => {
        if (instr.type === 'move' && instr.target === 'skill' && removeSet.has(instr.name)) {
          return false;
        }
        return true;
      });
    }

    // --- Step 4: Ensure validity ---
    // Must retain at least one WAIT instruction
    const hasWait = entry.list.instructions.some((i) => i.type === 'wait');
    if (!hasWait) {
      // Revert to original instructions
      entry.list.instructions = originalInstructions as PipelineInstruction[];
      entry.list.metadata.confidence = originalConfidence;
      return noChange;
    }

    // Apply confidence
    entry.list.metadata.confidence = newConfidence;

    // Validate against schema
    const parseResult = PipelineSchema.safeParse(entry.list);
    if (!parseResult.success) {
      // Revert on validation failure
      entry.list.instructions = originalInstructions as PipelineInstruction[];
      entry.list.metadata.confidence = originalConfidence;
      return noChange;
    }

    // --- Step 5: Determine if anything changed ---
    const wasRefined =
      addedSkills.length > 0 || removedSkills.length > 0 || confidenceDelta !== 0;

    if (wasRefined) {
      // Update version
      entry.version += 1;
      entry.list.metadata.version = entry.version;
      entry.updatedAt = Date.now();

      // Mark latest feedback records as refined
      for (const record of entry.feedbackHistory) {
        record.refined = true;
      }
    }

    return {
      refined: wasRefined,
      confidenceDelta,
      addedSkills,
      removedSkills,
      newVersion: entry.version,
    };
  }

  // --------------------------------------------------------------------------
  // Private helpers
  // --------------------------------------------------------------------------

  /**
   * Extract predicted skill names from MOVE instructions in a Pipeline.
   */
  private extractPredictedSkills(list: Pipeline): string[] {
    return list.instructions
      .filter(
        (instr): instr is MoveInstruction =>
          instr.type === 'move' && instr.target === 'skill',
      )
      .map((instr) => instr.name);
  }

  /**
   * Calculate Jaccard similarity between predicted and actual skill sets.
   *
   * Jaccard = |intersection| / |union|
   * Returns 1.0 if both sets are empty (vacuous truth).
   */
  private calculateJaccardAccuracy(
    predicted: string[],
    actual: string[],
  ): number {
    if (predicted.length === 0 && actual.length === 0) {
      return 1.0;
    }

    const actualSet = new Set(actual);
    const intersection = predicted.filter((s) => actualSet.has(s));
    const union = new Set([...predicted, ...actual]);

    return intersection.length / union.size;
  }
}
