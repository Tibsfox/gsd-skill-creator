import type { PipelineStage, PipelineContext } from '../skill-pipeline.js';
import type { SkillStore } from '../../storage/skill-store.js';
import type { SkillSession } from '../skill-session.js';

/**
 * Loads resolved skills into session, producing loaded/skipped lists.
 *
 * Preconditions: resolvedSkills populated.
 * Postconditions: loaded, skipped populated.
 */
export class LoadStage implements PipelineStage {
  readonly name = 'load';

  constructor(
    private skillStore: SkillStore,
    private session: SkillSession
  ) {}

  async process(context: PipelineContext): Promise<PipelineContext> {
    if (context.earlyExit) {
      return context;
    }

    for (const skill of context.resolvedSkills) {
      if (this.session.isActive(skill.name)) {
        continue;
      }

      try {
        const skillData = await this.skillStore.read(skill.name);
        const estimatedSavings = skillData.body.length * 2;

        const result = await this.session.load(
          skill.name,
          skillData.body,
          skill.score,
          estimatedSavings
        );

        if (result.success) {
          context.loaded.push(skill.name);
        } else {
          context.skipped.push(skill.name);
        }
      } catch {
        context.skipped.push(skill.name);
      }
    }

    return context;
  }
}
