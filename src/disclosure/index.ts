/**
 * Progressive disclosure module.
 * Content analysis, decomposition, circular reference detection,
 * disclosure-aware budget calculation, and compact generation.
 */

export {
  ContentAnalyzer,
  WORD_THRESHOLD_DECOMPOSE,
  WORD_THRESHOLD_WARNING,
} from './content-analyzer.js';

export type {
  Section,
  DeterministicOp,
  AnalysisResult,
} from './content-analyzer.js';

export { ContentDecomposer } from './content-decomposer.js';

export type {
  ReferenceFile,
  ScriptFile,
  DecomposedSkill,
} from './content-decomposer.js';

export {
  ReferenceLinker,
  CircularReferenceError,
} from './reference-linker.js';

export type {
  ReferenceLink,
  CycleDetectionResult,
  ValidationResult,
} from './reference-linker.js';

export { DisclosureBudget } from './disclosure-budget.js';

export type {
  FileSizeInfo,
  SkillSizeBreakdown,
  DisclosureBudgetResult,
} from './disclosure-budget.js';

export { CompactGenerator } from './compact-generator.js';

export type {
  CompactSkillOutput,
} from './compact-generator.js';
