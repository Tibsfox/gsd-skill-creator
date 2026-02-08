import type { PipelineStage, PipelineContext } from '../skill-pipeline.js';
import type { TokenCounter } from '../token-counter.js';
import type { SkillStore } from '../../storage/skill-store.js';
import type { BudgetProfile, BudgetWarning, ScoredSkill, PriorityTier } from '../../types/application.js';
import { getTierForSkill } from '../budget-profiles.js';

/**
 * Budget enforcement stage for the skill application pipeline.
 *
 * Partitions resolved skills by priority tier (critical/standard/optional)
 * and enforces tiered budget limits:
 * - Critical skills load up to the hard ceiling (even past standard budget)
 * - Standard and optional skills load within the standard budget
 * - Optional skills are skipped first when budget is tight
 *
 * Preconditions: resolvedSkills populated by ResolveStage.
 * Postconditions: resolvedSkills filtered and reordered by tier priority,
 *   budgetSkipped populated with skipped skill info,
 *   budgetWarnings populated at threshold crossings,
 *   contentCache populated for kept skills.
 */
export class BudgetStage implements PipelineStage {
  readonly name = 'budget';

  constructor(
    private tokenCounter: TokenCounter,
    private profile: BudgetProfile,
    private skillStore: SkillStore,
    private contextWindowSize: number = 200_000
  ) {}

  async process(context: PipelineContext): Promise<PipelineContext> {
    if (context.earlyExit) {
      return context;
    }

    const standardBudget = this.tokenCounter.calculateBudget(
      this.contextWindowSize,
      this.profile.budgetPercent
    );
    const hardCeiling = this.tokenCounter.calculateBudget(
      this.contextWindowSize,
      this.profile.hardCeilingPercent
    );

    // Partition skills by tier
    const criticalSkills: ScoredSkill[] = [];
    const standardSkills: ScoredSkill[] = [];
    const optionalSkills: ScoredSkill[] = [];

    for (const skill of context.resolvedSkills) {
      const tier = getTierForSkill(this.profile, skill.name);
      switch (tier) {
        case 'critical':
          criticalSkills.push(skill);
          break;
        case 'optional':
          optionalSkills.push(skill);
          break;
        default:
          standardSkills.push(skill);
          break;
      }
    }

    // Process tiers in order: critical first, then standard, then optional
    const keptSkills: ScoredSkill[] = [];
    let standardUsed = 0;
    let totalUsed = 0;
    const warned = new Set<50 | 80 | 100>();

    const processTier = async (
      skills: ScoredSkill[],
      tier: PriorityTier
    ): Promise<void> => {
      for (const skill of skills) {
        const skillData = await this.skillStore.read(skill.name);
        const content = skillData.body;
        const tokenResult = await this.tokenCounter.count(content);
        const tokens = tokenResult.count;

        let fits: boolean;
        let skipReason: 'budget_exceeded' | 'hard_ceiling_reached' | 'lower_priority';

        if (tier === 'critical') {
          fits = totalUsed + tokens <= hardCeiling;
          skipReason = 'hard_ceiling_reached';
        } else {
          fits = standardUsed + tokens <= standardBudget;
          skipReason = 'budget_exceeded';
        }

        if (fits) {
          keptSkills.push(skill);
          if (tier !== 'critical') {
            standardUsed += tokens;
          }
          totalUsed += tokens;
          context.contentCache.set(skill.name, content);
        } else {
          context.budgetSkipped.push({
            name: skill.name,
            tier,
            reason: skipReason,
            estimatedTokens: tokens,
          });
        }

        // Check thresholds after each skill against standard budget
        this.checkThresholds(context, standardUsed, standardBudget, warned);
      }
    };

    await processTier(criticalSkills, 'critical');
    await processTier(standardSkills, 'standard');
    await processTier(optionalSkills, 'optional');

    // Replace resolvedSkills with kept skills (already in tier order)
    context.resolvedSkills = keptSkills;

    return context;
  }

  private checkThresholds(
    context: PipelineContext,
    standardUsed: number,
    standardBudget: number,
    warned: Set<50 | 80 | 100>
  ): void {
    const usagePercent = standardBudget > 0 ? (standardUsed / standardBudget) * 100 : 0;

    if (this.profile.thresholds.warn50 && usagePercent >= 50 && !warned.has(50)) {
      warned.add(50);
      context.budgetWarnings.push({
        threshold: 50,
        currentUsagePercent: usagePercent,
        message: `Budget usage at ${usagePercent.toFixed(1)}% (50% threshold)`,
      });
    }

    if (this.profile.thresholds.warn80 && usagePercent >= 80 && !warned.has(80)) {
      warned.add(80);
      context.budgetWarnings.push({
        threshold: 80,
        currentUsagePercent: usagePercent,
        message: `Budget usage at ${usagePercent.toFixed(1)}% (80% threshold)`,
      });
    }

    if (this.profile.thresholds.warn100 && usagePercent >= 100 && !warned.has(100)) {
      warned.add(100);
      context.budgetWarnings.push({
        threshold: 100,
        currentUsagePercent: usagePercent,
        message: `Budget usage at ${usagePercent.toFixed(1)}% (100% threshold)`,
      });
    }
  }
}
