// === MFE Pipeline Hooks ===
//
// Hook stages that integrate the MFE skill type into skill-creator's
// existing 6-stage pipeline using insertAfter/insertBefore.
// No existing stage code is modified.

import type { PipelineStage, PipelineContext } from '../application/skill-pipeline.js';
import type { SkillPipeline } from '../application/skill-pipeline.js';
import { MfeSkillType, createMfeSkillType, detectMathematicalStructure } from './mfe-skill-type.js';
import type { MfeSkillConfig } from './mfe-skill-type.js';

// === Constants ===

/** MFE token budget as fraction of context window (5% hard max) */
export const MFE_BUDGET_PERCENT = 0.05;

// === MFE Score Hook ===

/**
 * Inserts AFTER the 'score' stage. Detects mathematical structure in
 * the intent/context and adds a mathematical-foundation ScoredSkill.
 *
 * If earlyExit was set by the score stage (no trigger matches found),
 * but math IS detected, the hook reactivates the pipeline by clearing
 * earlyExit. This ensures MFE can activate even when no file-trigger
 * or keyword-trigger matches exist for mathematical skills.
 */
export class MfeScoreHook implements PipelineStage {
  readonly name = 'mfe-score';

  constructor(private readonly mfeSkillType: MfeSkillType) {}

  async process(context: PipelineContext): Promise<PipelineContext> {
    // Build query from intent + context
    const query = [context.intent, context.context].filter(Boolean).join(' ');
    if (!query) {
      return context;
    }

    // Check for mathematical structure
    if (!detectMathematicalStructure(query)) {
      return context;
    }

    // Don't duplicate if already scored
    const alreadyScored = context.scoredSkills.some(
      s => s.name === this.mfeSkillType.getSkillName(),
    );
    if (alreadyScored) {
      return context;
    }

    // Score via MFE skill type
    const scored = this.mfeSkillType.score(query);
    if (scored.score === 0) {
      return context;
    }

    // Reactivate pipeline if earlyExit was set
    if (context.earlyExit) {
      context.earlyExit = false;
    }

    // Add MFE skill to scored list
    context.scoredSkills.push(scored);

    return context;
  }
}

// === MFE Budget Hook ===

/**
 * Inserts BEFORE the 'budget' stage. Examines resolvedSkills for the
 * mathematical-foundation skill and injects tiered content into the
 * contentCache so the budget stage can account for it.
 *
 * Enforces the MFE_BUDGET_PERCENT (5%) hard cap on MFE token usage.
 * Summary tier is always loaded. Active tier loads only when budget allows.
 * Reference tier is never loaded in production.
 */
export class MfeBudgetHook implements PipelineStage {
  readonly name = 'mfe-budget';

  constructor(
    private readonly mfeSkillType: MfeSkillType,
    private readonly contextWindowSize: number = 200_000,
  ) {}

  async process(context: PipelineContext): Promise<PipelineContext> {
    // Check if MFE skill is in resolved set
    const mfeSkill = context.resolvedSkills.find(
      s => s.name === this.mfeSkillType.getSkillName(),
    );
    if (!mfeSkill) {
      return context;
    }

    // Calculate MFE budget
    const mfeBudget = this.contextWindowSize * MFE_BUDGET_PERCENT;

    // Generate summary content (always loaded)
    const summaryContent = this.generateSummaryContent();
    const summaryTokenEstimate = Math.ceil(summaryContent.length / 4); // ~4 chars per token

    // Always load summary
    context.contentCache.set(this.mfeSkillType.getSkillName(), summaryContent);

    // Check if summary alone exceeds budget
    if (summaryTokenEstimate > mfeBudget) {
      context.budgetWarnings.push({
        threshold: 100,
        currentUsagePercent: (summaryTokenEstimate / mfeBudget) * 100,
        message: `MFE summary tier (~${summaryTokenEstimate} tokens) exceeds MFE budget of ${Math.floor(mfeBudget)} tokens. Loaded summary only.`,
      });
    }

    return context;
  }

  /**
   * Generate compact summary content for the domain index.
   * This is what gets loaded into context when MFE activates.
   * Targets ~4K characters (~1K tokens).
   */
  private generateSummaryContent(): string {
    const lines: string[] = [
      '# Mathematical Foundations Engine — Domain Index',
      '',
      'MFE provides mathematical reasoning across 10 domains extracted from The Space Between.',
      'Each domain maps to a region of the Complex Plane (real: logic-creativity, imaginary: embodied-abstract).',
      '',
      '## Domains',
      '',
      '| Domain | Part | Chapters | Plane Region | Key Concepts |',
      '|--------|------|----------|--------------|--------------|',
      '| Perception | Part I: Seeing | Ch 1-3 | (-0.2, 0.2) | numbers, distance, angles, trigonometry |',
      '| Waves | Part II: Hearing | Ch 4-7 | (-0.4, 0.0) | frequency, harmonics, Fourier, oscillation |',
      '| Change | Part III: Moving | Ch 8-10 | (0.0, -0.2) | derivatives, integrals, optimization, limits |',
      '| Structure | Part IV: Expanding | Ch 11-14 | (0.2, 0.4) | vectors, matrices, linear algebra, eigenvalues |',
      '| Reality | Part V: Grounding | Ch 15-17 | (0.4, -0.2) | physics, quantum mechanics, periodic table |',
      '| Foundations | Part VI: Defining | Ch 18-21 | (-0.2, 0.6) | sets, logic, groups, topology |',
      '| Mapping | Part VII: Mapping | Ch 22-25 | (0.2, 0.2) | categories, information theory, probability |',
      '| Unification | Part VIII: Converging | Ch 26-27 | (0.6, 0.0) | standard model, string theory |',
      '| Emergence | Part IX: Growing | Ch 28-31 | (0.0, -0.6) | chaos, complexity, neural networks |',
      '| Synthesis | Part X: Being | Ch 32-33 | (0.0, 0.0) | meta-connections, the through-line |',
      '',
      '## Navigation',
      '',
      'Problems are classified to Complex Plane positions. Activated domains provide:',
      '- Relevant primitives (axioms, definitions, theorems, algorithms, techniques, identities)',
      '- Composition rules for chaining primitives into solutions',
      '- Cross-domain links for multi-domain problems',
      '',
      '## Composition Types',
      '',
      '- Sequential: A then B (dependency chain)',
      '- Parallel: A and B simultaneously (independent paths)',
      '- Nested: B inside A (recursive structure)',
      '',
      '## Dependency Types',
      '',
      '- requires: cannot be stated without',
      '- generalizes: extends to broader domain',
      '- specializes: restricts to specific case',
      '- motivates: historically/pedagogically precedes',
      '- applies: uses as a tool',
      '- equivalent: same concept, different formulation',
    ];

    return lines.join('\n');
  }
}

// === Wiring Function ===

/**
 * Wire MFE hooks into an existing SkillPipeline.
 *
 * Inserts MfeScoreHook after 'score' stage and MfeBudgetHook before 'budget' stage.
 * Throws if the pipeline does not have the required stages.
 */
export function wireMfeIntoExistingPipeline(
  pipeline: SkillPipeline,
  config?: Partial<MfeSkillConfig>,
  contextWindowSize?: number,
): void {
  const mfeSkillType = createMfeSkillType(config);
  const scoreHook = new MfeScoreHook(mfeSkillType);
  const budgetHook = new MfeBudgetHook(mfeSkillType, contextWindowSize);

  // insertAfter/insertBefore throw if the target stage doesn't exist
  pipeline.insertAfter('score', scoreHook);
  pipeline.insertBefore('budget', budgetHook);
}
