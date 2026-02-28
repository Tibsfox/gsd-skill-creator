/**
 * Model assignment classifier with data-driven signal registry and weighted scoring.
 *
 * Replaces the simple heuristic model assignment in mission-assembly.ts
 * (safety=opus, 1 concept=haiku, else=sonnet) with a proper weighted signal
 * scoring system that analyzes task text and file patterns to produce confident
 * model tier classifications.
 *
 * Exports:
 * - SIGNAL_REGISTRY: frozen default signal registry with per-tier keyword/weight mappings
 * - createSignalRegistry(): deep copy factory with optional tier overrides
 * - scoreTask(): weighted keyword scoring with file pattern analysis
 * - assignModel(): model tier classification with confidence and override support
 *
 * @module vtm/model-assignment
 */

import type { ModelAssignment } from './types.js';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Individual signal entry in the registry. */
export interface Signal {
  pattern: string;   // keyword or phrase to match (case-insensitive)
  weight: number;    // positive weight for scoring
}

/** Signal registry mapping each model tier to its signals. */
export interface SignalRegistry {
  opus: Signal[];
  sonnet: Signal[];
  haiku: Signal[];
}

/** Scores per model tier from signal matching. */
export interface TierScores {
  opus: number;
  sonnet: number;
  haiku: number;
}

/** Input to the model assignment classifier. */
export interface AssignmentInput {
  objective: string;
  produces: string[];
  context: string;
  filesModified?: string[];
  pinnedModel?: ModelAssignment;
}

/** Result of model assignment classification. */
export interface AssignmentResult {
  model: ModelAssignment;
  confidence: number;
  scores: TierScores;
  lowConfidence: boolean;
  pinnedOverride?: boolean;
  classifierRecommendation?: ModelAssignment;
}

// ---------------------------------------------------------------------------
// SIGNAL_REGISTRY constant
// ---------------------------------------------------------------------------

/**
 * Baseline signal registry with per-tier keyword/weight mappings.
 *
 * Opus signals (MODL-02): judgment, creativity, safety-critical decisions.
 * Sonnet signals (MODL-03): structural implementation, schemas, pipelines.
 * Haiku signals (MODL-04): scaffold, boilerplate, config generation.
 *
 * Multi-word phrases have higher weights than single keywords to reward
 * specificity. The registry is deeply frozen to prevent accidental mutation.
 */
export const SIGNAL_REGISTRY: SignalRegistry = deepFreeze({
  opus: [
    { pattern: 'safety warden', weight: 5 },
    { pattern: 'personality', weight: 3 },
    { pattern: 'persona', weight: 3 },
    { pattern: 'character', weight: 3 },
    { pattern: 'architectural decision', weight: 5 },
    { pattern: 'factory', weight: 2 },
    { pattern: 'meta', weight: 2 },
    { pattern: 'calibration', weight: 3 },
    { pattern: 'cultural sensitivity', weight: 4 },
    { pattern: 'judgment', weight: 2 },
    { pattern: 'creativity', weight: 2 },
    { pattern: 'safety', weight: 3 },
  ],
  sonnet: [
    { pattern: 'schema', weight: 2 },
    { pattern: 'type system', weight: 3 },
    { pattern: 'interface', weight: 2 },
    { pattern: 'pipeline', weight: 3 },
    { pattern: 'registry', weight: 2 },
    { pattern: 'test suite', weight: 3 },
    { pattern: 'API surface', weight: 3 },
    { pattern: 'documentation', weight: 2 },
    { pattern: 'content generation', weight: 3 },
    { pattern: 'validator', weight: 2 },
    { pattern: 'parser', weight: 2 },
    { pattern: 'compiler', weight: 2 },
  ],
  haiku: [
    { pattern: 'directory structure', weight: 4 },
    { pattern: 'configuration file', weight: 4 },
    { pattern: 'type stub', weight: 4 },
    { pattern: 'file template', weight: 4 },
    { pattern: 'simple transformation', weight: 3 },
    { pattern: 'config', weight: 1 },
    { pattern: 'scaffold', weight: 2 },
    { pattern: 'boilerplate', weight: 2 },
    { pattern: 'stub', weight: 2 },
  ],
});

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Deep-freeze an object and all nested arrays/objects.
 */
function deepFreeze<T extends Record<string, unknown>>(obj: T): T {
  Object.freeze(obj);
  for (const value of Object.values(obj)) {
    if (Array.isArray(value)) {
      Object.freeze(value);
      for (const item of value) {
        if (typeof item === 'object' && item !== null) {
          Object.freeze(item);
        }
      }
    } else if (typeof value === 'object' && value !== null) {
      deepFreeze(value as Record<string, unknown>);
    }
  }
  return obj;
}

/**
 * Deep-clone a SignalRegistry by copying all signal arrays and their entries.
 */
function cloneRegistry(registry: SignalRegistry): SignalRegistry {
  return {
    opus: registry.opus.map(s => ({ ...s })),
    sonnet: registry.sonnet.map(s => ({ ...s })),
    haiku: registry.haiku.map(s => ({ ...s })),
  };
}

/** Tier priority ordering: opus > sonnet > haiku (higher tier wins ties). */
const TIER_PRIORITY: ModelAssignment[] = ['opus', 'sonnet', 'haiku'];

/** Confidence threshold below which assignments are flagged as low-confidence. */
const LOW_CONFIDENCE_THRESHOLD = 0.4;

/** Score added per matching file pattern. */
const FILE_PATTERN_BOOST = 2;

// ---------------------------------------------------------------------------
// createSignalRegistry
// ---------------------------------------------------------------------------

/**
 * Create a deep copy of the default signal registry with optional tier overrides.
 *
 * If overrides are provided, the signal arrays for specified tiers are replaced
 * (not merged) with the override arrays. Unspecified tiers retain the default
 * signals.
 *
 * @param overrides - Optional partial registry to replace specific tier signals
 * @returns A new mutable SignalRegistry
 */
export function createSignalRegistry(overrides?: Partial<SignalRegistry>): SignalRegistry {
  const copy = cloneRegistry(SIGNAL_REGISTRY);

  if (overrides) {
    if (overrides.opus) copy.opus = overrides.opus.map(s => ({ ...s }));
    if (overrides.sonnet) copy.sonnet = overrides.sonnet.map(s => ({ ...s }));
    if (overrides.haiku) copy.haiku = overrides.haiku.map(s => ({ ...s }));
  }

  return copy;
}

// ---------------------------------------------------------------------------
// scoreTask
// ---------------------------------------------------------------------------

/**
 * Score a task's text and file patterns against the signal registry.
 *
 * Algorithm:
 * 1. Normalize text to lowercase.
 * 2. For each tier, iterate signals; if text.includes(signal.pattern.toLowerCase()),
 *    add signal.weight to that tier's score.
 * 3. Apply file pattern boosts:
 *    - *.test.ts, *.spec.ts, *.test.js, *.spec.js -> +2 sonnet per file
 *    - *.config.*, *.json, *.yaml, *.yml -> +2 haiku per file
 *    - "safety" in path -> +2 opus per file
 * 4. Return { opus, sonnet, haiku } scores.
 *
 * @param text - Combined task text to scan for signals
 * @param filesModified - File paths to analyze for pattern boosts
 * @param registry - Signal registry to score against
 * @returns TierScores with numeric scores per model tier
 */
export function scoreTask(
  text: string,
  filesModified: string[],
  registry: SignalRegistry,
): TierScores {
  const normalizedText = text.toLowerCase();
  const scores: TierScores = { opus: 0, sonnet: 0, haiku: 0 };

  // --- Keyword signal scoring ---
  for (const tier of TIER_PRIORITY) {
    for (const signal of registry[tier]) {
      if (normalizedText.includes(signal.pattern.toLowerCase())) {
        scores[tier] += signal.weight;
      }
    }
  }

  // --- File pattern boosts ---
  for (const file of filesModified) {
    const lower = file.toLowerCase();

    if (/\.test\.[tj]s$/.test(lower) || /\.spec\.[tj]s$/.test(lower)) {
      scores.sonnet += FILE_PATTERN_BOOST;
    } else if (/\.config\.[^.]+$/.test(lower) || /\.json$/.test(lower) || /\.ya?ml$/.test(lower)) {
      scores.haiku += FILE_PATTERN_BOOST;
    } else if (lower.includes('safety')) {
      scores.opus += FILE_PATTERN_BOOST;
    }
  }

  return scores;
}

// ---------------------------------------------------------------------------
// assignModel
// ---------------------------------------------------------------------------

/**
 * Classify a task into a model tier based on weighted signal scoring.
 *
 * Algorithm:
 * 1. If pinnedModel is set: still run classifier, return pinned model with
 *    pinnedOverride: true and classifierRecommendation showing what the
 *    classifier would have chosen.
 * 2. Build search text from objective + produces + context.
 * 3. Score via scoreTask.
 * 4. Determine winning tier (highest score, ties break to higher tier).
 * 5. Compute confidence = winnerScore / totalScore (0 if no signals).
 * 6. Flag lowConfidence if confidence < threshold or all scores are 0.
 *
 * @param input - Task input with objective, produces, context, optional filesModified and pinnedModel
 * @param registry - Optional custom signal registry (defaults to SIGNAL_REGISTRY)
 * @returns AssignmentResult with model, confidence, scores, and flags
 */
export function assignModel(
  input: AssignmentInput,
  registry?: SignalRegistry,
): AssignmentResult {
  const activeRegistry = registry ?? SIGNAL_REGISTRY;

  // Build combined search text
  const searchText = [input.objective, input.produces.join(' '), input.context].join(' ');

  // Score the task
  const scores = scoreTask(searchText, input.filesModified ?? [], activeRegistry);

  // Determine winning tier (highest score, ties break to higher tier via priority order)
  const totalScore = scores.opus + scores.sonnet + scores.haiku;
  let classifiedModel: ModelAssignment = 'sonnet'; // default when no signals match

  if (totalScore > 0) {
    let bestScore = -1;
    for (const tier of TIER_PRIORITY) {
      if (scores[tier] > bestScore) {
        bestScore = scores[tier];
        classifiedModel = tier;
      }
    }
  }

  // Compute confidence
  let confidence: number;
  if (totalScore === 0) {
    confidence = 0;
  } else {
    const winnerScore = scores[classifiedModel];
    confidence = Math.min(Math.max(winnerScore / totalScore, 0), 1);
  }

  // Determine low-confidence flag
  const lowConfidence = confidence < LOW_CONFIDENCE_THRESHOLD || totalScore === 0;

  // Handle pinned model override
  if (input.pinnedModel) {
    return {
      model: input.pinnedModel,
      confidence: 1,
      scores,
      lowConfidence: false,
      pinnedOverride: true,
      classifierRecommendation: classifiedModel,
    };
  }

  return {
    model: classifiedModel,
    confidence,
    scores,
    lowConfidence,
  };
}
