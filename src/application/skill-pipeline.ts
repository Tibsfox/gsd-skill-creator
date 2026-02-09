import type { ScoredSkill, ConflictResult, SkippedSkill, BudgetWarning } from '../types/application.js';
import type { SkillIndexEntry } from '../storage/skill-index.js';
import type { SessionReport } from './skill-session.js';

/**
 * Data flowing between pipeline stages.
 *
 * Context carries DATA between stages. Stages hold SERVICES (injected via constructors).
 * No generic types -- PipelineContext has a fixed shape for the skill application pipeline.
 */
export interface PipelineContext {
  // Inputs (set by caller, read-only to stages)
  readonly intent?: string;
  readonly file?: string;
  readonly context?: string;

  // Intermediate results (stages read/write these)
  matches: SkillIndexEntry[];
  scoredSkills: ScoredSkill[];
  resolvedSkills: ScoredSkill[];
  conflicts: ConflictResult;

  // Outputs (final results)
  loaded: string[];
  skipped: string[];

  // Budget tier results (written by BudgetStage, read by callers)
  budgetSkipped: SkippedSkill[];
  budgetWarnings: BudgetWarning[];

  // Content cache (written by BudgetStage to avoid double reads in LoadStage)
  contentCache: Map<string, string>;

  // Model profile for model-aware filtering (set by caller, read-only to stages)
  readonly modelProfile?: string;   // Active model profile name: 'quality' | 'balanced' | 'budget'

  // Control flag -- stages check this, runner ignores it
  earlyExit: boolean;

  // Report accessor -- caller provides session-bound implementation
  getReport: () => SessionReport;
}

/**
 * A single processing stage in the skill application pipeline.
 *
 * Preconditions/postconditions should be documented per stage:
 * - ScoreStage reads: intent, file, context. Writes: matches, scoredSkills, earlyExit.
 * - ResolveStage reads: scoredSkills. Writes: resolvedSkills, conflicts.
 * - LoadStage reads: resolvedSkills, earlyExit. Writes: loaded, skipped.
 */
export interface PipelineStage {
  readonly name: string;
  process(context: PipelineContext): Promise<PipelineContext>;
}

/**
 * Sequential pipeline runner for skill application stages.
 *
 * Stages are processed in order. The runner does NOT check earlyExit --
 * stages are responsible for checking the flag and skipping their own logic.
 * This keeps the runner simple and gives stages control over skip behavior.
 *
 * Supports insertBefore/insertAfter for future stages (e.g., budget tiers,
 * cache ordering, model-aware activation) to plug in without modifying
 * existing stage code.
 */
export class SkillPipeline {
  private stages: PipelineStage[] = [];

  addStage(stage: PipelineStage): void {
    this.stages.push(stage);
  }

  insertBefore(targetName: string, stage: PipelineStage): void {
    const idx = this.stages.findIndex(s => s.name === targetName);
    if (idx === -1) {
      throw new Error(`Stage '${targetName}' not found in pipeline`);
    }
    this.stages.splice(idx, 0, stage);
  }

  insertAfter(targetName: string, stage: PipelineStage): void {
    const idx = this.stages.findIndex(s => s.name === targetName);
    if (idx === -1) {
      throw new Error(`Stage '${targetName}' not found in pipeline`);
    }
    this.stages.splice(idx + 1, 0, stage);
  }

  async process(context: PipelineContext): Promise<PipelineContext> {
    let ctx = context;
    for (const stage of this.stages) {
      ctx = await stage.process(ctx);
    }
    return ctx;
  }

  getStageNames(): string[] {
    return this.stages.map(s => s.name);
  }
}

/**
 * Create a PipelineContext with sensible defaults, optionally overridden.
 *
 * Default conflicts match the original apply() early-return behavior:
 * { hasConflict: false, conflictingSkills: [], resolution: 'priority' }
 *
 * This Partial<PipelineContext> signature is the CONTRACT that Plan 52-02
 * depends on for wiring SkillApplicator.apply().
 */
export function createEmptyContext(
  overrides?: Partial<PipelineContext>
): PipelineContext {
  const defaults: PipelineContext = {
    intent: undefined,
    file: undefined,
    context: undefined,
    matches: [],
    scoredSkills: [],
    resolvedSkills: [],
    conflicts: {
      hasConflict: false,
      conflictingSkills: [],
      resolution: 'priority',
    },
    loaded: [],
    skipped: [],
    budgetSkipped: [],
    budgetWarnings: [],
    contentCache: new Map(),
    modelProfile: undefined,
    earlyExit: false,
    getReport: () => ({
      activeSkills: [],
      totalTokens: 0,
      budgetLimit: 0,
      budgetUsedPercent: 0,
      remainingBudget: 0,
      tokenTracking: [],
      flaggedSkills: [],
    }),
  };

  if (!overrides) {
    return defaults;
  }

  return { ...defaults, ...overrides };
}
