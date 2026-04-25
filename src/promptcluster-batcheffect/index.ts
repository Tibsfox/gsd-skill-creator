/**
 * PromptCluster BatchEffect Detector — public API.
 *
 * Default-off module shipped by Phase 771 (v1.49.573 Upstream Intelligence
 * Pack v1.44). UIP-19 T2c.
 *
 * Source paper: Tao et al. (2026). "Batch Effects in Brain Foundation Model
 * Embeddings." arXiv:2604.14441. §2.2 centroid-based batch-divergence
 * measurement adapted to skill embeddings.
 *
 * Detects three batch-effect types that v1.49.571 SSIA cannot catch (SSIA
 * tests isotropy of the marginal; batch effects are systematic inter-group
 * mean shifts — orthogonal failure modes):
 *
 * - `'model-version'`          — same prompt, different model checkpoint
 * - `'training-distribution'`  — different training corpus / fine-tune split
 * - `'prompt-template'`        — different instruction framing / template
 *
 * Composes with SSIA via `composeWithSSIA` (see `ssia-composer.ts`).
 *
 * ## Usage
 *
 * ```ts
 * import {
 *   detectBatchEffects,
 *   composeWithSSIA,
 *   isPromptClusterBatchEffectEnabled,
 * } from 'gsd-skill-creator/promptcluster-batcheffect';
 *
 * if (!isPromptClusterBatchEffectEnabled()) {
 *   // flag off — module is byte-identical to not importing it
 *   return;
 * }
 *
 * const assignment = new Map([
 *   ['skill-a', 'model-v1'],
 *   ['skill-b', 'model-v2'],
 * ]);
 *
 * const report = detectBatchEffects(
 *   embeddings,
 *   { type: 'model-version', value: 'comparison' },
 *   assignment,
 * );
 *
 * // Compose with SSIA report
 * const combined = composeWithSSIA(ssiaReport, report);
 * ```
 *
 * ## Opt-in
 *
 * ```json
 * {
 *   "gsd-skill-creator": {
 *     "upstream-intelligence": {
 *       "promptcluster-batcheffect": { "enabled": true }
 *     }
 *   }
 * }
 * ```
 *
 * When the flag is false/absent, callers should call `disabledReport` to
 * produce a byte-identical empty report that downstream consumers can handle
 * uniformly.
 *
 * ## CAPCOM preservation
 *
 * Read-only audit. No skill-library writes. No orchestration / DACP / CAPCOM
 * surface imports.
 *
 * @module promptcluster-batcheffect
 */

export type {
  Embedding,
  BatchKey,
  BatchEffectType,
  BatchEffectEvidence,
  BatchEffectReport,
  CombinedReport,
} from './types.js';

export {
  DEFAULT_SIGNIFICANCE_LEVEL,
  DEFAULT_NUM_PROJECTION_DIRECTIONS,
  detectBatchEffects,
  disabledReport,
} from './batch-effect-detector.js';

export { composeWithSSIA } from './ssia-composer.js';

export {
  DEFAULT_PROMPTCLUSTER_BATCHEFFECT_CONFIG,
  readPromptClusterBatchEffectConfig,
  isPromptClusterBatchEffectEnabled,
} from './settings.js';

export type { PromptClusterBatchEffectConfig } from './settings.js';

/** Canonical paper reference — cited in documentation and tests. */
export const TAO_2026_BATCHEFFECT_REFERENCE = {
  title: 'Batch Effects in Brain Foundation Model Embeddings',
  authors: 'Tao et al.',
  year: 2026,
  arxiv: '2604.14441',
  section: '§2.2 centroid-based batch-divergence measure',
} as const;

/** Cross-link to the v1.49.571 SSIA module. */
export const SSIA_CROSS_LINK = {
  module: 'src/skill-isotropy/',
  paper: 'Balestriero & LeCun 2025, arXiv:2511.08544v3',
  version: 'v1.49.571',
  phase: 728,
} as const;
