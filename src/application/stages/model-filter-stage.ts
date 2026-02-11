import type { PipelineStage, PipelineContext } from '../skill-pipeline.js';
import type { SkillStore } from '../../storage/skill-store.js';
import type { ModelTier, ModelGuidance } from '../../types/application.js';

/** Map model profile names to model tiers. */
const PROFILE_TO_TIER: Record<string, ModelTier> = {
  quality: 'opus',
  balanced: 'sonnet',
  budget: 'haiku',
};

/** Default tier for unknown profiles (safe middle ground). */
const DEFAULT_TIER: ModelTier = 'sonnet';

/** Capability level per model tier. */
const CAPABILITY_LEVELS: Record<ModelTier, number> = {
  opus: 3,
  sonnet: 2,
  haiku: 1,
};

/**
 * Pipeline stage that filters skills by model-aware guidance.
 *
 * Skills declare modelGuidance metadata specifying which model tiers
 * they target and/or a minimum capability level. When the active model
 * profile does not match, the skill is gracefully skipped with reason
 * 'model_mismatch'.
 *
 * Preconditions: resolvedSkills populated by upstream stages.
 * Postconditions: resolvedSkills filtered to model-compatible skills,
 *   budgetSkipped extended with model_mismatch entries.
 */
export class ModelFilterStage implements PipelineStage {
  readonly name = 'model-filter';

  constructor(private skillStore: SkillStore) {}

  async process(context: PipelineContext): Promise<PipelineContext> {
    if (context.earlyExit) {
      return context;
    }

    // No modelProfile means no filtering (backward compatible)
    if (!context.modelProfile) {
      return context;
    }

    const activeTier = PROFILE_TO_TIER[context.modelProfile] ?? DEFAULT_TIER;
    const activeCapability = CAPABILITY_LEVELS[activeTier];

    const kept = [];

    for (const skill of context.resolvedSkills) {
      const skillData = await this.skillStore.read(skill.name);
      const guidance = (skillData.metadata as unknown as Record<string, unknown>)
        .modelGuidance as ModelGuidance | undefined;

      // No modelGuidance means skill is compatible with all models
      if (!guidance) {
        kept.push(skill);
        continue;
      }

      // Check preferred tier list
      if (guidance.preferred && guidance.preferred.length > 0) {
        if (!guidance.preferred.includes(activeTier)) {
          context.budgetSkipped.push({
            name: skill.name,
            tier: 'standard',
            reason: 'model_mismatch',
            estimatedTokens: 0,
          });
          continue;
        }
      }

      // Check minimum capability level
      if (
        guidance.minimumCapability !== undefined &&
        activeCapability < guidance.minimumCapability
      ) {
        context.budgetSkipped.push({
          name: skill.name,
          tier: 'standard',
          reason: 'model_mismatch',
          estimatedTokens: 0,
        });
        continue;
      }

      kept.push(skill);
    }

    context.resolvedSkills = kept;
    return context;
  }
}
