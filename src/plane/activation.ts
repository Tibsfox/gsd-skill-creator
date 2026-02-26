/**
 * Tangent Activation Engine -- TaskVector analysis and enhanced scoring.
 *
 * Pure functions that compute geometric skill relevance by analyzing
 * task context into a 2D vector (concrete vs abstract) and blending
 * tangent-line proximity scores with existing semantic scores.
 *
 * Imports from Phase 359's types and arithmetic modules.
 * No side effects, no I/O, fully deterministic given inputs.
 */

import type { SkillPosition, TangentContext, TangentMatch } from './types.js';
import { computeTangent, pointToTangentDistance } from './arithmetic.js';

// ============================================================================
// Types
// ============================================================================

/** Task position vector in the complex plane application space. */
export interface TaskVector {
  readonly x: number;  // Concrete component (real axis), normalized [0, 1]
  readonly y: number;  // Abstract component (imaginary axis), normalized [0, 1]
  readonly raw: {
    readonly concreteSignals: readonly string[];
    readonly abstractSignals: readonly string[];
  };
}

/** Enhanced score blending geometric and semantic relevance. */
export interface GeometricScore {
  readonly tangentScore: number;
  readonly semanticScore: number;
  readonly combinedScore: number;
  readonly geometric: TangentMatch | null;
}

/** Configuration for plane-aware activation scoring. */
export interface PlaneActivationConfig {
  readonly geometricWeight: number;     // 0-1, blend ratio
  readonly enabled: boolean;            // Master switch
  readonly fallbackToSemantic: boolean; // Fallback if geometric fails
  readonly logGeometricDetail: boolean; // Debug logging
}

// ============================================================================
// Constants
// ============================================================================

/** Default configuration for plane activation scoring. */
export const DEFAULT_PLANE_ACTIVATION_CONFIG: PlaneActivationConfig = {
  geometricWeight: 0.6,
  enabled: true,
  fallbackToSemantic: true,
  logGeometricDetail: false,
};

// ============================================================================
// File-path detection patterns
// ============================================================================

/** Tokens matching any of these patterns are considered file paths. */
const FILE_EXTENSIONS = /\.(ts|js|tsx|jsx|json|md)$/i;
const PATH_SEPARATORS = /[/\\]/;

function isFilePath(token: string): boolean {
  return FILE_EXTENSIONS.test(token) || PATH_SEPARATORS.test(token);
}

// ============================================================================
// Signal patterns
// ============================================================================

/** Concrete tool/command words in intent text. */
const CONCRETE_INTENT_WORDS = /\b(run|execute|build|compile|deploy|test|lint|format)\b/i;

/** Phase-like context words that signal concrete work. */
const CONCRETE_CONTEXT_WORDS = /^(execute|build|deploy|test|lint)$/i;

/** Phase-like context words that signal abstract work. */
const ABSTRACT_CONTEXT_WORDS = /^(research|plan|explore|investigate|design)$/i;

/** Abstract question/design markers in intent text. */
const ABSTRACT_INTENT_WORDS = /\b(how|why|what|should|design|architecture|pattern)\b/i;

// ============================================================================
// analyzeTask
// ============================================================================

/**
 * Analyze a pipeline context into a TaskVector.
 *
 * Extracts concrete and abstract signals from intent, file, and context
 * strings, then normalizes to a unit-magnitude vector in [0,1] x [0,1].
 *
 * - Concrete signals: file paths, tool/command names, execution phases
 * - Abstract signals: semantic intent length, research/planning phases, question markers
 * - Empty context returns balanced default (sqrt(2)/2, sqrt(2)/2)
 */
export function analyzeTask(context: {
  intent?: string;
  file?: string;
  context?: string;
}): TaskVector {
  const concreteSignals: string[] = [];
  const abstractSignals: string[] = [];
  let concrete = 0;
  let abstract_ = 0;

  // --- Concrete signal sources ---

  // File paths from context.file
  if (context.file) {
    const fileTokens = context.file.trim().split(/\s+/);
    for (const token of fileTokens) {
      if (isFilePath(token)) {
        concreteSignals.push(token);
        concrete += 1;
      }
    }
  }

  // File paths from context.context (split on whitespace)
  if (context.context) {
    const contextTokens = context.context.trim().split(/\s+/);
    for (const token of contextTokens) {
      if (isFilePath(token)) {
        concreteSignals.push(token);
        concrete += 1;
      }
    }

    // Check for concrete phase-like context words
    if (CONCRETE_CONTEXT_WORDS.test(context.context.trim())) {
      concrete += 2;
      concreteSignals.push(context.context.trim());
    }
  }

  // Tool-like words in intent
  if (context.intent) {
    const intentMatch = context.intent.match(CONCRETE_INTENT_WORDS);
    if (intentMatch) {
      concrete += 1;
      concreteSignals.push(intentMatch[0]);
    }
  }

  // --- Abstract signal sources ---

  // Semantic intent description length
  if (context.intent && context.intent.length > 0) {
    abstract_ += Math.floor(context.intent.length / 20);
    abstractSignals.push(context.intent);
  }

  // Abstract phase-like context words
  if (context.context && ABSTRACT_CONTEXT_WORDS.test(context.context.trim())) {
    abstract_ += 2;
    abstractSignals.push(context.context.trim());
  }

  // Question/design markers in intent
  if (context.intent) {
    const abstractMatch = context.intent.match(ABSTRACT_INTENT_WORDS);
    if (abstractMatch) {
      abstract_ += 1;
      abstractSignals.push(abstractMatch[0]);
    }
  }

  // --- Normalization ---

  const magnitude = Math.sqrt(concrete * concrete + abstract_ * abstract_);

  if (magnitude < 1e-10) {
    return {
      x: Math.SQRT1_2,
      y: Math.SQRT1_2,
      raw: { concreteSignals: [], abstractSignals: [] },
    };
  }

  return {
    x: concrete / magnitude,
    y: abstract_ / magnitude,
    raw: { concreteSignals, abstractSignals },
  };
}

// ============================================================================
// computeEnhancedScore
// ============================================================================

/**
 * Compute an enhanced score blending geometric and semantic relevance.
 *
 * For skills with a plane position, computes tangent-line proximity to the
 * task vector and blends it with the existing semantic score. For skills
 * without positions (null/undefined), returns the semantic score unchanged
 * to maintain backward compatibility.
 *
 * @param skillId - Identifier for the skill being scored
 * @param position - Skill's position on the complex plane (null = no position data)
 * @param taskVector - The task's position vector from analyzeTask
 * @param semanticScore - The existing semantic (TF-IDF or embedding) score
 * @param config - Plane activation configuration (defaults to DEFAULT_PLANE_ACTIVATION_CONFIG)
 */
export function computeEnhancedScore(
  skillId: string,
  position: SkillPosition | null | undefined,
  taskVector: TaskVector,
  semanticScore: number,
  config: PlaneActivationConfig = DEFAULT_PLANE_ACTIVATION_CONFIG,
): GeometricScore {
  // Backward compatibility: no position data -> semantic-only
  if (position == null) {
    return {
      tangentScore: semanticScore,
      semanticScore,
      combinedScore: semanticScore,
      geometric: null,
    };
  }

  // Compute tangent context for the skill position
  const tangent: TangentContext = computeTangent(position);

  // Compute perpendicular distance from task point to skill's tangent line
  const tangentDistance = pointToTangentDistance(
    { x: taskVector.x, y: taskVector.y },
    position,
  );

  // Tangent score: high radius + close tangent -> high score
  const tangentScore = position.radius / (1 + tangentDistance);

  // Blend geometric and semantic scores
  const combinedScore =
    config.geometricWeight * tangentScore +
    (1 - config.geometricWeight) * semanticScore;

  // Build full TangentMatch for detailed reporting
  const geometric: TangentMatch = {
    skillId,
    position,
    tangent,
    tangentDistance,
    score: tangentScore,
  };

  return {
    tangentScore,
    semanticScore,
    combinedScore,
    geometric,
  };
}
