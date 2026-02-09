import * as p from '@clack/prompts';
import pc from 'picocolors';
import { TokenCounter } from '../../application/token-counter.js';
import { DEFAULT_PROFILES, getBudgetProfile, getTierForSkill } from '../../application/budget-profiles.js';
import { formatProgressBar } from '../../validation/budget-validation.js';
import { SkillStore } from '../../storage/skill-store.js';
import type { BudgetProfile, PriorityTier } from '../../types/application.js';

interface SkillEstimate {
  name: string;
  tokens: number;
  tier: PriorityTier;
}

/**
 * Budget estimate command - shows projected token cost per agent profile.
 *
 * Displays:
 * - Agent profile header with budget/ceiling percentages
 * - Overall progress bar with colored percentage
 * - Per-tier breakdown (critical/standard/optional) with subtotals
 * - Threshold warnings at 50/80/100%
 * - Available profiles list
 *
 * @param options - Optional configuration
 * @returns Exit code (0 success, 1 error)
 */
export async function budgetEstimateCommand(options?: {
  agent?: string;
  skillsDir?: string;
  contextWindowSize?: number;
}): Promise<number> {
  const skillsDir = options?.skillsDir ?? '.claude/skills';
  const contextWindowSize = options?.contextWindowSize ?? 200_000;
  const agentName = options?.agent ?? 'gsd-executor';

  p.intro(pc.bgCyan(pc.black(' Token Budget Estimate ')));

  // Resolve profile
  const profile = getBudgetProfile(agentName);
  if (!profile) {
    p.log.error(`Unknown agent profile: "${agentName}"`);
    p.log.message('');
    p.log.message(pc.bold('Available profiles:'));
    for (const name of Object.keys(DEFAULT_PROFILES)) {
      p.log.message(`  - ${name}`);
    }
    return 1;
  }

  // Scan skills
  const skillStore = new SkillStore(skillsDir);
  const tokenCounter = new TokenCounter();

  let skillNames: string[];
  try {
    skillNames = await skillStore.list();
  } catch {
    skillNames = [];
  }

  if (skillNames.length === 0) {
    p.log.info(`No skills found in ${skillsDir}`);
    p.outro('Done.');
    return 0;
  }

  // Estimate tokens for each skill
  const estimates: SkillEstimate[] = [];
  for (const name of skillNames) {
    try {
      const skill = await skillStore.read(name);
      const fullContent = `${skill.metadata.description ?? ''}\n${skill.body}`;
      const result = await tokenCounter.count(fullContent);
      const tier = getTierForSkill(profile, name);
      estimates.push({ name, tokens: result.count, tier });
    } catch {
      // Skip skills that fail to read
    }
  }

  // Group by tier
  const critical = estimates.filter(e => e.tier === 'critical');
  const standard = estimates.filter(e => e.tier === 'standard');
  const optional = estimates.filter(e => e.tier === 'optional');

  const criticalTokens = critical.reduce((sum, e) => sum + e.tokens, 0);
  const standardTokens = standard.reduce((sum, e) => sum + e.tokens, 0);
  const optionalTokens = optional.reduce((sum, e) => sum + e.tokens, 0);
  const totalTokens = criticalTokens + standardTokens + optionalTokens;

  // Calculate budgets
  const standardBudget = Math.floor(contextWindowSize * profile.budgetPercent);
  const hardCeiling = Math.floor(contextWindowSize * profile.hardCeilingPercent);

  // Agent profile header
  p.log.message('');
  p.log.message(
    pc.bold(`Agent: ${profile.name}`) +
    ` | Budget: ${(profile.budgetPercent * 100).toFixed(0)}% (${standardBudget.toLocaleString()} tokens)` +
    ` | Ceiling: ${(profile.hardCeilingPercent * 100).toFixed(0)}% (${hardCeiling.toLocaleString()} tokens)`
  );

  // Overall progress bar
  const usagePercent = (totalTokens / hardCeiling) * 100;
  const bar = formatProgressBar(totalTokens, hardCeiling);
  let pctColored: string;
  if (usagePercent > 80) {
    pctColored = pc.red(`${usagePercent.toFixed(0)}%`);
  } else if (usagePercent > 50) {
    pctColored = pc.yellow(`${usagePercent.toFixed(0)}%`);
  } else {
    pctColored = pc.green(`${usagePercent.toFixed(0)}%`);
  }
  p.log.message(`${bar} ${pctColored} (${totalTokens.toLocaleString()} / ${hardCeiling.toLocaleString()} tokens)`);
  p.log.message('');

  // Per-tier sections
  if (critical.length > 0) {
    p.log.message(pc.bold('Critical (always load, up to ceiling):'));
    for (const e of critical) {
      p.log.message(`  - ${e.name}: ${e.tokens.toLocaleString()} tokens`);
    }
    p.log.message(pc.dim(`  Subtotal: ${criticalTokens.toLocaleString()} / ${hardCeiling.toLocaleString()} tokens`));
    p.log.message('');
  }

  if (standard.length > 0) {
    p.log.message(pc.bold('Standard (within budget):'));
    for (const e of standard) {
      p.log.message(`  - ${e.name}: ${e.tokens.toLocaleString()} tokens`);
    }
    p.log.message(pc.dim(`  Subtotal: ${standardTokens.toLocaleString()} / ${standardBudget.toLocaleString()} tokens`));
    p.log.message('');
  }

  if (optional.length > 0) {
    const remaining = Math.max(0, standardBudget - criticalTokens - standardTokens);
    p.log.message(pc.bold('Optional (remaining budget):'));
    for (const e of optional) {
      p.log.message(`  - ${e.name}: ${e.tokens.toLocaleString()} tokens`);
    }
    p.log.message(pc.dim(`  Subtotal: ${optionalTokens.toLocaleString()} / ${remaining.toLocaleString()} remaining tokens`));
    p.log.message('');
  }

  // Threshold warnings -- measured against standard budget
  const budgetUsagePercent = (totalTokens / standardBudget) * 100;
  const warnings: string[] = [];

  if (profile.thresholds.warn100 && budgetUsagePercent >= 100) {
    warnings.push(pc.red(`Budget exceeded: ${budgetUsagePercent.toFixed(0)}% of standard budget used`));
  } else if (profile.thresholds.warn80 && budgetUsagePercent >= 80) {
    warnings.push(pc.yellow(`Approaching limit: ${budgetUsagePercent.toFixed(0)}% of standard budget used`));
  } else if (profile.thresholds.warn50 && budgetUsagePercent >= 50) {
    warnings.push(pc.cyan(`Half budget used: ${budgetUsagePercent.toFixed(0)}% of standard budget`));
  }

  if (warnings.length > 0) {
    p.log.message(pc.bold('Threshold Warnings:'));
    for (const w of warnings) {
      p.log.message(`  ${w}`);
    }
    p.log.message('');
  }

  // Available profiles
  p.log.message(pc.dim('Available profiles: ' + Object.keys(DEFAULT_PROFILES).join(', ')));

  p.outro('Done.');
  return 0;
}
