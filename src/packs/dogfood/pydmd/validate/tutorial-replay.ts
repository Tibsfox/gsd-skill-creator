/**
 * Tutorial replay engine: scores skill guidance against tutorial reproduction.
 * Phase 406 Plan 03 -- tests whether the skill provides sufficient guidance
 * to reproduce each tutorial's analysis workflow.
 */

import type { KnowledgeGraph, TutorialSummary } from '../types.js';
import type { GeneratedSkill } from '../generate/types.js';
import type { ReplayReport, ReplayResult } from './types.js';
import { computeReplayScore } from './scoring.js';

/**
 * Replay all tutorials against the generated skill and produce a report.
 *
 * For each tutorial in the knowledge graph, evaluates whether the skill
 * provides enough guidance to reproduce the tutorial's analysis workflow.
 * Scores 5 criteria per tutorial and computes aggregate metrics.
 */
export function replayTutorials(
  skill: GeneratedSkill,
  graph: KnowledgeGraph,
): ReplayReport {
  const results: ReplayResult[] = [];
  const allGaps: string[] = [];

  for (const tutorial of graph.tutorials) {
    const result = replaySingleTutorial(skill, tutorial, graph);
    results.push(result);
    allGaps.push(...result.gaps);
  }

  const totalScore = results.reduce((sum, r) => sum + r.score, 0);
  const maxScore = results.length * 5;
  const passing = results.filter(r => r.score >= 3).length;
  const passRate = results.length > 0
    ? Math.round((passing / results.length) * 100)
    : 0;

  // Deduplicate gaps
  const identifiedGaps = Array.from(new Set(allGaps));

  return { results, totalScore, maxScore, passRate, identifiedGaps };
}

/**
 * Replay a single tutorial against the skill content.
 *
 * Evaluates 5 criteria:
 * 1. correctVariant: does the skill mention/recommend the tutorial's variant?
 * 2. correctWorkflow: does the skill show the create/fit/analyze workflow?
 * 3. correctParameters: are key parameters for this variant mentioned?
 * 4. producesResults: would following the skill produce runnable code?
 * 5. qualitativeMatch: does the skill's guidance align with the tutorial's approach?
 */
function replaySingleTutorial(
  skill: GeneratedSkill,
  tutorial: TutorialSummary,
  graph: KnowledgeGraph,
): ReplayResult {
  const md = skill.skillMd;
  const gaps: string[] = [];

  // 1. Does the skill recommend/mention the correct variant?
  const correctVariant = md.includes(tutorial.variant);
  if (!correctVariant) {
    gaps.push(`Missing variant ${tutorial.variant} for tutorial ${tutorial.index}`);
  }

  // 2. Does the skill describe the workflow (import, create, fit, analyze)?
  const workflowKeywords = ['import', 'fit', 'instantiate', 'create', 'analyze', 'results', 'reconstruct'];
  const workflowMatches = workflowKeywords.filter(kw =>
    md.toLowerCase().includes(kw),
  ).length;
  const correctWorkflow = workflowMatches >= 3;
  if (!correctWorkflow) {
    gaps.push(`Incomplete workflow guidance for tutorial ${tutorial.index}`);
  }

  // 3. Are key parameters mentioned for this variant?
  const variant = graph.concepts.algorithmic.find(v => v.class === tutorial.variant);
  let correctParameters = false;
  if (variant) {
    const paramsMentioned = variant.parameters.filter(p =>
      md.includes(p.name),
    ).length;
    correctParameters = paramsMentioned > 0 || variant.parameters.length === 0;
  }
  if (!correctParameters) {
    gaps.push(`Missing parameters for variant ${tutorial.variant} in tutorial ${tutorial.index}`);
  }

  // 4. Would following the skill produce runnable code?
  // Check for code blocks containing the variant class or general DMD usage
  const codeBlockRegex = /```python\n([\s\S]*?)```/g;
  let hasRunnableCode = false;
  let codeMatch: RegExpExecArray | null;
  while ((codeMatch = codeBlockRegex.exec(md)) !== null) {
    const code = codeMatch[1];
    if (code.includes('import') && (code.includes('.fit') || code.includes('fit('))) {
      hasRunnableCode = true;
      break;
    }
  }
  const producesResults = hasRunnableCode;
  if (!producesResults) {
    gaps.push(`No runnable code example for tutorial ${tutorial.index}`);
  }

  // 5. Does the skill's guidance qualitatively match the tutorial's approach?
  // Check if the tutorial's key insight, code patterns, or title are referenced
  const titleMentioned = md.includes(tutorial.title) || md.includes(`Tutorial ${tutorial.index}`);
  const variantMentioned = md.includes(tutorial.variant);
  const codePatternOverlap = tutorial.codePatterns.filter(pattern =>
    md.toLowerCase().includes(pattern.toLowerCase()),
  ).length;
  const qualitativeMatch = (titleMentioned || variantMentioned) && codePatternOverlap >= 2;
  if (!qualitativeMatch) {
    gaps.push(`Guidance does not align with tutorial ${tutorial.index} approach`);
  }

  const partial: Omit<ReplayResult, 'score'> = {
    tutorialNumber: tutorial.index,
    objective: tutorial.keyInsight,
    correctVariant,
    correctWorkflow,
    correctParameters,
    producesResults,
    qualitativeMatch,
    gaps,
  };

  return {
    ...partial,
    score: computeReplayScore(partial),
  };
}
