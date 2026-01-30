// Types
export type {
  Pattern,
  PatternCategory,
  CommandPattern,
  DecisionPattern,
} from './types/pattern.js';

export type {
  Skill,
  SkillMetadata,
  SkillTrigger,
  SkillLearning,
  SkillCorrection,
} from './types/skill.js';

export {
  SKILL_NAME_PATTERN,
  MAX_DESCRIPTION_LENGTH,
  validateSkillName,
  validateSkillMetadata,
} from './types/skill.js';

// Storage - Import first so we can use in functions
import { PatternStore } from './storage/pattern-store.js';
import { SkillStore } from './storage/skill-store.js';
import { SkillIndex } from './storage/skill-index.js';

// Re-export storage classes
export { PatternStore, SkillStore, SkillIndex };
export type { SkillIndexEntry, SkillIndexData } from './storage/skill-index.js';

// Convenience factory for creating all stores with consistent paths
export function createStores(options?: {
  patternsDir?: string;
  skillsDir?: string;
}) {
  const patternsDir = options?.patternsDir ?? '.planning/patterns';
  const skillsDir = options?.skillsDir ?? '.claude/skills';

  const patternStore = new PatternStore(patternsDir);
  const skillStore = new SkillStore(skillsDir);
  const skillIndex = new SkillIndex(skillStore, skillsDir);

  return {
    patternStore,
    skillStore,
    skillIndex,
  };
}

// Validation
export {
  SkillInputSchema,
  TriggerPatternsSchema,
  SkillNameSchema,
  validateSkillInput,
  SkillUpdateSchema,
  validateSkillUpdate,
} from './validation/skill-validation.js';
export type { SkillInput, SkillUpdate } from './validation/skill-validation.js';

// Workflows
export { createSkillWorkflow } from './workflows/create-skill-workflow.js';
export { listSkillsWorkflow } from './workflows/list-skills-workflow.js';
export { searchSkillsWorkflow } from './workflows/search-skills-workflow.js';

// Application types
export type {
  TokenCountResult,
  ScoredSkill,
  ActiveSkill,
  SessionState,
  ConflictResult,
  TokenTracking,
  ApplicationConfig,
} from './types/application.js';

// Learning module
export * from './learning/index.js';

export { DEFAULT_CONFIG } from './types/application.js';

// Application components
export { TokenCounter } from './application/token-counter.js';
export { RelevanceScorer } from './application/relevance-scorer.js';
export { ConflictResolver } from './application/conflict-resolver.js';
export { SkillSession } from './application/skill-session.js';
export type { SkillLoadResult, SessionReport } from './application/skill-session.js';
export { SkillApplicator } from './application/skill-applicator.js';
export type { ApplyResult, InvokeResult } from './application/skill-applicator.js';

// Import applicator for factory
import { SkillApplicator } from './application/skill-applicator.js';
import type { ApplicationConfig } from './types/application.js';

// Enhanced factory that includes applicator
export function createApplicationContext(options?: {
  patternsDir?: string;
  skillsDir?: string;
  config?: Partial<ApplicationConfig>;
}) {
  const stores = createStores({
    patternsDir: options?.patternsDir,
    skillsDir: options?.skillsDir,
  });

  const applicator = new SkillApplicator(
    stores.skillIndex,
    stores.skillStore,
    options?.config
  );

  return {
    ...stores,
    applicator,
  };
}
