// Retrieval module barrel exports
export { AdaptiveRouter } from './adaptive-router.js';
export { CorrectionStage } from './corrective-rag.js';
export { CrossProjectIndex } from './cross-project-index.js';
export type { CrossProjectSearchOptions, CrossProjectSearchOutput } from './cross-project-index.js';

// Re-export types
export {
  DEFAULT_CORRECTION_CONFIG,
} from './types.js';
export type {
  CorrectionConfig,
  CorrectionResult,
  RouteDecision,
  RetrievalStrategy,
  ScopedSearchResult,
} from './types.js';
