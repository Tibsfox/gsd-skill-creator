/**
 * Experience Compression Spectrum — public API.
 *
 * Default-off module shipped by Phase 713 (v1.49.570 Convergent Substrate).
 * Source paper: Shen et al. 2026, arXiv:2604.15877, "Experience Compression
 * Spectrum: Unifying Memory, Skills, and Rules in LLM Agents".
 *
 * Implements the "missing diagonal" Shen et al. identified — adaptive
 * cross-level compression between episodic memory, procedural skills, and
 * declarative rules. All exports are pure functions; nothing runs on import.
 *
 * @module compression-spectrum
 */

export type {
  CompressionLevel,
  CompressedItem,
  TransitionEvent,
  TransitionDecision,
  TransitionInputs,
  SpectrumReport,
} from './types.js';

export { SHEN_RATIO_RANGES, DEFAULT_THRESHOLDS, LEVEL_RANK } from './types.js';

export {
  analyzeTransition,
  estimateRatio,
  buildTransitionEvent,
  analyzeSpectrum,
  getDefaultTransitionThresholds,
  isLevelPromotion,
  isLevelDemotion,
} from './spectrum.js';
