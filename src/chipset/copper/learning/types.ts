/**
 * Shared types for the Pipeline Learning subsystem.
 *
 * Defines interfaces used by the learning compiler (plan 01),
 * feedback engine (plan 02), and library (plan 03). These types
 * bridge the observation pipeline (sessions.jsonl, PatternAnalyzer)
 * to the Pipeline execution system.
 */

import type { SessionObservation } from '../../../types/observation.js';
import type { SkillCandidate } from '../../../types/detection.js';
import type { Pipeline, GsdLifecycleEvent } from '../types.js';

// ============================================================================
// Compiler Input
// ============================================================================

/**
 * Wrapper for feeding observation data to the learning compiler.
 */
export interface ObservationInput {
  /** Session observations to compile from. */
  sessions: SessionObservation[];
  /** Optional pre-analyzed skill candidates (from PatternAnalyzer). */
  candidates?: SkillCandidate[];
}

// ============================================================================
// Workflow Pattern
// ============================================================================

/**
 * An extracted workflow pattern before compilation into a Pipeline.
 *
 * Represents a recurring sequence of tools, commands, and file accesses
 * detected across multiple sessions. The compiler groups sessions by
 * workflow fingerprint and builds one WorkflowPattern per group.
 */
export interface WorkflowPattern {
  /** Unique pattern ID (e.g., "wf-tdd-vitest-cycle"). */
  id: string;
  /** Workflow type name (e.g., "tdd-vitest-cycle", "api-change-with-tests"). */
  workflowType: string;
  /** Human-readable description of the detected workflow. */
  description: string;
  /** Tools involved in the workflow, in observed order. */
  tools: string[];
  /** Commands involved. */
  commands: string[];
  /** Files typically touched. */
  files: string[];
  /** Active skills during these sessions. */
  activeSkills: string[];
  /** Number of sessions where this pattern was observed. */
  occurrences: number;
  /** Confidence score (0-1) derived from frequency and recency. */
  confidence: number;
  /** Inferred lifecycle events this workflow aligns with. */
  lifecycleEvents: GsdLifecycleEvent[];
  /** Session IDs that contributed to this pattern. */
  sessionIds: string[];
}

// ============================================================================
// Compilation Result
// ============================================================================

/**
 * Output of the learning compiler.
 */
export interface CompilationResult {
  /** Compiled candidate Pipelines. */
  lists: Pipeline[];
  /** The workflow patterns that were detected and compiled. */
  patterns: WorkflowPattern[];
  /** Number of sessions analyzed. */
  sessionsAnalyzed: number;
  /** Number of patterns that were below threshold and filtered out. */
  filteredCount: number;
}

// ============================================================================
// Compiler Configuration
// ============================================================================

/**
 * Configuration for the learning compiler.
 */
export interface CompilerConfig {
  /** Minimum occurrences to compile a pattern (default 3). */
  minOccurrences: number;
  /** Recency window in days (default 14). */
  recencyDays: number;
  /** Maximum patterns to compile (default 20). */
  maxPatterns: number;
  /** Base confidence threshold to include (default 0.3). */
  minConfidence: number;
}

/** Default compiler configuration. */
export const DEFAULT_COMPILER_CONFIG: CompilerConfig = {
  minOccurrences: 3,
  recencyDays: 14,
  maxPatterns: 20,
  minConfidence: 0.3,
};

// ============================================================================
// Feedback Record (for plan 02 -- feedback engine)
// ============================================================================

/**
 * Record of feedback from executing a learned Pipeline.
 *
 * Tracks predicted vs actual skill activations to measure accuracy
 * and drive refinement decisions.
 */
export interface FeedbackRecord {
  /** Pipeline name that was executed. */
  listName: string;
  /** Workflow type of the list. */
  workflowType: string;
  /** Timestamp of execution. */
  timestamp: number;
  /** MOVE instructions that were predicted (in the list). */
  predicted: string[];
  /** Skills that were actually activated during execution. */
  actual: string[];
  /** Accuracy score (0-1): intersection / union of predicted vs actual. */
  accuracy: number;
  /** Whether the list was refined as a result. */
  refined: boolean;
}

// ============================================================================
// Library Entry (for plan 03 -- library)
// ============================================================================

/**
 * Entry in the learned Pipeline library.
 *
 * Wraps a Pipeline with versioning, accuracy tracking,
 * and feedback history for continuous refinement.
 */
export interface LibraryEntry {
  /** The Pipeline. */
  list: Pipeline;
  /** Workflow type this list represents. */
  workflowType: string;
  /** Version number (starts at 1, increments on refinement). */
  version: number;
  /** When this entry was created. */
  createdAt: number;
  /** When this entry was last updated. */
  updatedAt: number;
  /** Accuracy score from feedback (0-1, starts at confidence from compilation). */
  accuracy: number;
  /** Number of times this list has been executed. */
  executionCount: number;
  /** Feedback records for this list. */
  feedbackHistory: FeedbackRecord[];
}
