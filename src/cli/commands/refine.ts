import * as p from '@clack/prompts';
import pc from 'picocolors';
import { FeedbackStore, RefinementEngine } from '../../learning/index.js';
import { createStores } from '../../index.js';

export async function refineCommand(args: string[]): Promise<number> {
  const skillName = args[1];

  if (!skillName) {
    p.log.error('Usage: skill-creator refine <skill-name>');
    return 1;
  }

  const feedbackStore = new FeedbackStore('.planning/patterns');
  const { skillStore } = createStores();
  const engine = new RefinementEngine(feedbackStore, skillStore);

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

  const confirm = await p.confirm({
    message: 'Apply these refinements?',
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
