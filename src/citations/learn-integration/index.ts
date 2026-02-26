/**
 * Learn integration barrel export.
 *
 * Re-exports all learn pipeline hook types and classes for citation
 * integration into the sc:learn workflow.
 */

export {
  CitationLearnHook,
  type LearnMetadata,
  type PreLearnResult,
  type PostLearnResult,
  type SkillMetadata,
  type ExtractFn,
  extractCiteMarkers,
} from './learn-hook.js';

export {
  AnnotationInjector,
  type CitationAnnotation,
} from './annotation-injector.js';

export {
  KnowledgeTierLinker,
  type KnowledgeTier,
  type TierLinkResult,
} from './knowledge-tier-linker.js';
