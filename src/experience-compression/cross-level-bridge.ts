/**
 * Experience Compression — cross-level bridge (the "missing diagonal").
 *
 * Zhang et al. (arXiv:2604.15877, §4) identify the "missing diagonal" as the
 * failure of existing systems to perform adaptive cross-level migration of
 * experience. Systems that treat episodic / procedural / declarative tiers as
 * completely separate subsystems systematically over-accumulate in the episodic
 * tier until retrieval latency degrades.
 *
 * This module implements the missing diagonal: given content classified at
 * level L, it produces compressed records at adjacent levels (L-1, L+1) where
 * the content admits an alternative framing.
 *
 * Admission criteria for adjacent-level framing:
 *   episodic → procedural (L+1):
 *     The content has structural regularity ≥ 0.35 (i.e. it could be a
 *     recurring pattern), OR its variability is not extreme (< 0.85).
 *   procedural → declarative (L+1):
 *     The content's abstraction depth is ≥ 2 OR structural regularity ≥ 0.5.
 *   declarative → procedural (L-1):
 *     Always admissible (declarative rules can always be instantiated as
 *     procedural patterns).
 *   procedural → episodic (L-1):
 *     Always admissible (any procedure can be stored as a concrete event).
 *
 * The bridge never touches src/orchestration/, src/capcom/, or src/dacp/.
 * It is an advisory compression utility only.
 *
 * @module experience-compression/cross-level-bridge
 */

import type {
  CompressionLevel,
  CrossLevelResult,
  ExperienceContent,
} from './types.js';
import { classifyLevel } from './level-classifier.js';
import { compress } from './compressor.js';

// ---------------------------------------------------------------------------
// Adjacency map
// ---------------------------------------------------------------------------

const LEVEL_ORDER: ReadonlyArray<CompressionLevel> = ['episodic', 'procedural', 'declarative'];

function adjacentLevels(level: CompressionLevel): ReadonlyArray<CompressionLevel> {
  const idx = LEVEL_ORDER.indexOf(level);
  const adj: CompressionLevel[] = [];
  if (idx > 0) adj.push(LEVEL_ORDER[idx - 1]!);
  if (idx < LEVEL_ORDER.length - 1) adj.push(LEVEL_ORDER[idx + 1]!);
  return adj;
}

// ---------------------------------------------------------------------------
// Admission tests
// ---------------------------------------------------------------------------

/**
 * Determine whether content classified at `fromLevel` admits compression at
 * `toLevel` (the "diagonal" framing).
 */
function admitsLevel(
  content: ExperienceContent,
  fromLevel: CompressionLevel,
  toLevel: CompressionLevel,
  structuralRegularity: number,
  abstractionDepth: number,
  variability: number,
): boolean {
  // Canonical level is always admitted
  if (fromLevel === toLevel) return true;

  // episodic → procedural: must have enough regularity to be a pattern
  if (fromLevel === 'episodic' && toLevel === 'procedural') {
    return structuralRegularity >= 0.35 || variability < 0.85;
  }

  // procedural → declarative: must have enough abstraction
  if (fromLevel === 'procedural' && toLevel === 'declarative') {
    return abstractionDepth >= 2 || structuralRegularity >= 0.5;
  }

  // procedural → episodic: always admissible (concrete instance)
  if (fromLevel === 'procedural' && toLevel === 'episodic') {
    return true;
  }

  // declarative → procedural: always admissible (instantiate the rule)
  if (fromLevel === 'declarative' && toLevel === 'procedural') {
    return true;
  }

  // Non-adjacent hops (episodic → declarative, declarative → episodic)
  // are not admitted; callers should use two-step bridging.
  void content; // unused in non-adjacent case
  return false;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Perform cross-level adaptive compression, implementing the "missing diagonal"
 * identified by Zhang et al. (arXiv:2604.15877, §4).
 *
 * Given content, this function:
 *   1. Classifies it at its canonical level.
 *   2. Compresses it at the canonical level.
 *   3. For each adjacent level that the content admits, also compresses it.
 *   4. Returns all admitted records and the list of diagonal levels.
 *
 * @param content    The experience to bridge.
 * @param isEnabled  When false, returns a passthrough result (disabled path).
 * @returns          CrossLevelResult with canonical + diagonal records.
 */
export function bridgeLevels(
  content: ExperienceContent,
  isEnabled: boolean,
): CrossLevelResult {
  const classification = classifyLevel(content);
  const canonicalLevel = classification.level;

  if (!isEnabled) {
    return {
      canonicalLevel,
      records: {
        [canonicalLevel]: compress(content, canonicalLevel, false),
      },
      diagonalLevels: [],
    };
  }

  const { structuralRegularity, abstractionDepth, variability } = classification.signals;

  const allAdmitted: CompressionLevel[] = [canonicalLevel];
  const diagonal: CompressionLevel[] = [];

  for (const adj of adjacentLevels(canonicalLevel)) {
    if (
      admitsLevel(content, canonicalLevel, adj, structuralRegularity, abstractionDepth, variability)
    ) {
      allAdmitted.push(adj);
      diagonal.push(adj);
    }
  }

  const records: Partial<Record<CompressionLevel, ReturnType<typeof compress>>> = {};
  for (const lvl of allAdmitted) {
    records[lvl] = compress(content, lvl, true);
  }

  return {
    canonicalLevel,
    records,
    diagonalLevels: diagonal,
  };
}

/**
 * Convenience helper: force bridging to a specific target level regardless of
 * canonical classification.
 *
 * Used when a caller knows it needs the declarative form of a procedural
 * record, for example, without re-classifying.
 *
 * @param content      The experience to compress at targetLevel.
 * @param targetLevel  The forced target compression level.
 * @param isEnabled    Feature flag.
 */
export function forceLevel(
  content: ExperienceContent,
  targetLevel: CompressionLevel,
  isEnabled: boolean,
) {
  return compress(content, targetLevel, isEnabled);
}
