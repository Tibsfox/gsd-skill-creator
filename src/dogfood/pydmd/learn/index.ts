/**
 * Learn engine: structure analysis, concept extraction, pattern synthesis.
 * Phase 405: structure-analyzer, api-mapper, concept-extractor, tutorial-parser, pattern-synthesizer
 */
export { analyzeStructure } from './structure-analyzer.js';
export type {
  AnalyzedClassNode,
  AnalyzedModuleNode,
  MethodInfo,
  ParameterInfo,
  ImportInfo,
  AnalyzeResult,
} from './structure-analyzer.js';

export { mapAPISurface } from './api-mapper.js';
export type {
  APISurface,
  AnalyzedAPIMethod,
  APIProperty,
  APIParameter,
} from './api-mapper.js';
