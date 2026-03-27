// Detection module exports

// Types
export * from '../types/detection.js';

// Classes
export { PatternAnalyzer } from './pattern-analyzer.js';
export { SuggestionStore } from './suggestion-store.js';
export { SkillGenerator } from './skill-generator.js';
export type { GeneratedSkill } from './skill-generator.js';
export { SuggestionManager } from './suggestion-manager.js';
export type { DetectionResult, AcceptResult } from './suggestion-manager.js';
export {
  injectGsdReferences,
  checkGsdInstalled,
  GSD_COMMAND_MAP,
} from './gsd-reference-injector.js';

// Phase 74: Generation Safety
export {
  DANGEROUS_COMMANDS,
  scanForDangerousCommands,
  inferAllowedTools,
  wrapAsScript,
  sanitizeGeneratedContent,
  type DangerousFinding,
  type DangerousCommandPattern,
  type ToolInferenceCandidate,
  type WrappedScript,
  type SanitizeResult,
} from '../validation/generation-safety.js';
