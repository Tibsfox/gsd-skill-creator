/**
 * Experience Compression Layer — public API (UIP-17, Phase 769, T2a).
 *
 * Cross-level adaptive compression spanning the memory/skills/rules axis per
 * the Experience Compression Spectrum (Zhang et al., arXiv:2604.15877, §2).
 *
 * The paper establishes that memory, skills, and rules are not qualitatively
 * distinct artifact types but points on a single quantitative compression axis
 * relative to raw interaction trace:
 *
 *   episodic    : 5–20×    compression (near-raw event records)
 *   procedural  : 50–500×  compression (skill / pattern representations)
 *   declarative : 1000×+   compression (rule-form distillations)
 *
 * The key finding (§4 ablation study) is the **missing diagonal**: existing
 * systems treat each level as a separate subsystem with separate storage and
 * retrieval APIs, causing systematic over-accumulation in the episodic tier.
 * Cross-level adaptive compression — migrating experience across the
 * episodic/procedural/declarative boundary as context density grows — is the
 * correct abstraction. This module implements that missing diagonal.
 *
 * ## Opt-in mechanism
 *
 * This module is **default-OFF**. Opt in via `.claude/gsd-skill-creator.json`:
 *
 * ```json
 * {
 *   "gsd-skill-creator": {
 *     "upstream-intelligence": {
 *       "experience-compression": { "enabled": true }
 *     }
 *   }
 * }
 * ```
 *
 * With the flag absent or false, `compress` returns a byte-identical passthrough
 * record (`{ disabled: true }`), `classifyLevel` returns the classification
 * result unchanged (classification is always safe), and `bridgeLevels` returns
 * only the canonical-level disabled record.
 *
 * ## Explicit non-goals
 *
 * This module DOES NOT:
 *   - touch src/orchestration/, src/capcom/, src/dacp/, or any existing module;
 *   - modify the skill-graph DAG topology;
 *   - alter CAPCOM-gate authority surfaces;
 *   - perform any I/O beyond reading the settings file.
 *
 * @module experience-compression
 */

// --- Types ---
export type {
  ClassificationResult,
  CompressedRecord,
  CompressionLevel,
  CompressionRatio,
  CrossLevelResult,
  ExperienceContent,
} from './types.js';

// --- Settings ---
export type { ExperienceCompressionConfig } from './settings.js';
export {
  DEFAULT_EXPERIENCE_COMPRESSION_CONFIG,
  isExperienceCompressionEnabled,
  readExperienceCompressionConfig,
} from './settings.js';

// --- Level classifier ---
export { classifyLevel } from './level-classifier.js';

// --- Compressor (internal compression + decompress) ---
export { compress as compressAtLevel, decompress } from './compressor.js';

// --- Cross-level bridge (the "missing diagonal") ---
export { bridgeLevels, forceLevel } from './cross-level-bridge.js';

// ---------------------------------------------------------------------------
// Top-level API functions (thin wrappers that thread the feature flag)
// ---------------------------------------------------------------------------

import type { CompressedRecord, CompressionLevel, ExperienceContent } from './types.js';
import { isExperienceCompressionEnabled } from './settings.js';
import { classifyLevel as _classifyLevel } from './level-classifier.js';
import { compress as _compress } from './compressor.js';

/**
 * Compress `content` at the specified `level`.
 *
 * When the feature flag is off, returns a byte-identical passthrough record
 * (`{ disabled: true }`). The `settingsPath` argument allows tests and callers
 * to override the default config location.
 *
 * @param content       The experience to compress.
 * @param level         Target compression level.
 * @param settingsPath  Optional path override for the settings file.
 */
export function compress(
  content: ExperienceContent,
  level: CompressionLevel,
  settingsPath?: string,
): CompressedRecord {
  const enabled = isExperienceCompressionEnabled(settingsPath);
  return _compress(content, level, enabled);
}

/**
 * Classify `content` into the appropriate CompressionLevel.
 *
 * Classification is always performed regardless of the feature flag (it is
 * purely advisory and has no side effects).
 *
 * The named export is provided at the top of this file via
 * `export { classifyLevel } from './level-classifier.js'`.
 */
// classifyLevel is already exported above — no duplicate needed.
