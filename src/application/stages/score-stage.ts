import type { PipelineStage, PipelineContext } from '../skill-pipeline.js';
import type { SkillIndex } from '../../storage/skill-index.js';
import type { RelevanceScorer } from '../relevance-scorer.js';
import type { ScoredSkill } from '../../types/application.js';

/**
 * Finds trigger matches and scores them via TF-IDF.
 *
 * Preconditions: none (first stage in pipeline).
 * Postconditions: matches, scoredSkills populated (or earlyExit set).
 */
export class ScoreStage implements PipelineStage {
  readonly name = 'score';

  constructor(
    private skillIndex: SkillIndex,
    private scorer: RelevanceScorer
  ) {}

  async process(context: PipelineContext): Promise<PipelineContext> {
    if (context.earlyExit) {
      return context;
    }

    const matches = await this.skillIndex.findByTrigger(
      context.intent,
      context.file,
      context.context
    );
    context.matches = matches;

    if (matches.length === 0) {
      context.earlyExit = true;
      context.loaded = [];
      context.skipped = [];
      context.conflicts = {
        hasConflict: false,
        conflictingSkills: [],
        resolution: 'priority',
      };
      return context;
    }

    const query = [context.intent, context.context].filter(Boolean).join(' ');

    if (query) {
      const allScored = this.scorer.scoreAgainstQuery(query);
      const matchNames = new Set(matches.map(m => m.name));
      context.scoredSkills = allScored.filter(s => matchNames.has(s.name));
    } else {
      context.scoredSkills = matches.map<ScoredSkill>(m => ({
        name: m.name,
        score: 1,
        matchType: 'file' as const,
      }));
    }

    return context;
  }
}
