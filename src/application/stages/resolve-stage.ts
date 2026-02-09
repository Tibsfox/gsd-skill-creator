import type { PipelineStage, PipelineContext } from '../skill-pipeline.js';
import type { ConflictResolver } from '../conflict-resolver.js';

/**
 * Detects conflicts and resolves by priority.
 *
 * Preconditions: matches, scoredSkills populated.
 * Postconditions: conflicts, resolvedSkills populated.
 */
export class ResolveStage implements PipelineStage {
  readonly name = 'resolve';

  constructor(private resolver: ConflictResolver) {}

  async process(context: PipelineContext): Promise<PipelineContext> {
    if (context.earlyExit) {
      return context;
    }

    context.conflicts = this.resolver.detectConflicts(context.matches);
    context.resolvedSkills = this.resolver.resolveByPriority(context.scoredSkills);

    return context;
  }
}
