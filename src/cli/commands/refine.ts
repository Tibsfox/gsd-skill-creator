import * as p from '@clack/prompts';
import pc from 'picocolors';
import {
  FeedbackStore,
  RefinementEngine,
  DriftTracker,
  VersionManager,
  ContradictionDetector,
} from '../../learning/index.js';
import { createStores } from '../../index.js';

export async function refineCommand(args: string[]): Promise<number> {
  const skillName = args[1];

  if (!skillName) {
    p.log.error('Usage: skill-creator refine <skill-name>');
    return 1;
  }

  const feedbackStore = new FeedbackStore('.planning/patterns');
  const { skillStore } = createStores();
  // Wire the cumulative-drift safety valve (LRN-01/LRN-02): without a DriftTracker
  // the engine's 60% drift halt is inert. VersionManager reads the skill's git history.
  const driftTracker = new DriftTracker(new VersionManager(), skillStore);
  const contradictionDetector = new ContradictionDetector(feedbackStore);
  const engine = new RefinementEngine(feedbackStore, skillStore, undefined, driftTracker);

  p.intro(`Checking refinement eligibility for '${skillName}'...`);

  const eligibility = await engine.checkEligibility(skillName);

  if (!eligibility.eligible) {
    if (eligibility.reason === 'cooldown') {
      p.log.warn(`Skill is in cooldown. ${eligibility.daysRemaining} days remaining.`);
    } else {
      p.log.warn(`Insufficient feedback. Need ${eligibility.correctionsNeeded} more corrections.`);
    }
    return 0;
  }

  p.log.success(`Eligible for refinement (${eligibility.correctionCount} corrections).`);

  const suggestion = await engine.generateSuggestion(skillName);

  if (!suggestion) {
    p.log.info('No consistent patterns found in feedback.');
    return 0;
  }

  p.log.message('');
  p.log.message(pc.bold('Suggested Changes:'));
  for (const change of suggestion.suggestedChanges) {
    p.log.message(`  ${change.section}: ${change.reason}`);
    p.log.message(pc.dim(`    "${change.original.slice(0, 40)}..." → "${change.suggested.slice(0, 40)}..."`));
  }
  p.log.message(`  Confidence: ${(suggestion.confidence * 100).toFixed(0)}%`);

  // Surface contradictory corrections (LRN-03) rather than silently averaging them.
  const contradictions = await contradictionDetector.detect(skillName);
  if (contradictions.contradictions.length > 0) {
    p.log.message('');
    p.log.warn(pc.bold('Contradictory feedback detected:'));
    for (const c of contradictions.contradictions) {
      const tag = c.severity === 'conflict' ? pc.red('conflict') : pc.yellow('warning');
      p.log.message(`  [${tag}] ${c.description}`);
    }
    if (contradictions.hasConflicts) {
      p.log.warn('These corrections reverse each other — review before applying.');
    }
  }

  const confirm = await p.confirm({
    message: contradictions.hasConflicts
      ? 'Apply these refinements despite the conflicting feedback?'
      : 'Apply these refinements?',
    initialValue: !contradictions.hasConflicts,
  });

  if (p.isCancel(confirm) || !confirm) {
    p.log.info('Refinement cancelled.');
    return 0;
  }

  const result = await engine.applyRefinement(skillName, suggestion, true);

  if (result.success) {
    p.log.success(`Skill refined to version ${result.newVersion}.`);
    return 0;
  } else {
    p.log.error(`Refinement failed: ${result.error}`);
    return 1;
  }
}
