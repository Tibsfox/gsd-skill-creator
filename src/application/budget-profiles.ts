import type { BudgetProfile, PriorityTier } from '../types/application.js';

/**
 * Default budget profiles for GSD agents.
 *
 * Each profile defines:
 * - budgetPercent: standard budget as fraction of context window
 * - hardCeilingPercent: absolute max including critical overflow
 * - tiers: skill name partitioning (empty by default, populated by users)
 * - thresholds: which budget warnings to fire
 */
export const DEFAULT_PROFILES: Record<string, BudgetProfile> = {
  'gsd-executor': {
    name: 'gsd-executor',
    budgetPercent: 0.06,
    hardCeilingPercent: 0.10,
    tiers: {
      critical: [],
      standard: [],
      optional: [],
    },
    thresholds: { warn50: true, warn80: true, warn100: true },
  },
  'gsd-planner': {
    name: 'gsd-planner',
    budgetPercent: 0.05,
    hardCeilingPercent: 0.08,
    tiers: {
      critical: [],
      standard: [],
      optional: [],
    },
    thresholds: { warn50: true, warn80: true, warn100: true },
  },
  'gsd-verifier': {
    name: 'gsd-verifier',
    budgetPercent: 0.05,
    hardCeilingPercent: 0.08,
    tiers: {
      critical: [],
      standard: [],
      optional: [],
    },
    thresholds: { warn50: true, warn80: true, warn100: true },
  },
  'gsd-debugger': {
    name: 'gsd-debugger',
    budgetPercent: 0.06,
    hardCeilingPercent: 0.10,
    tiers: {
      critical: [],
      standard: [],
      optional: [],
    },
    thresholds: { warn50: true, warn80: true, warn100: true },
  },
  'gsd-researcher': {
    name: 'gsd-researcher',
    budgetPercent: 0.05,
    hardCeilingPercent: 0.08,
    tiers: {
      critical: [],
      standard: [],
      optional: [],
    },
    thresholds: { warn50: true, warn80: true, warn100: true },
  },
};

/**
 * Get the budget profile for a named agent.
 *
 * @returns The profile if found, undefined otherwise.
 */
export function getBudgetProfile(agentName: string): BudgetProfile | undefined {
  return DEFAULT_PROFILES[agentName];
}

/**
 * Determine the priority tier for a skill within a profile.
 *
 * Skills not listed in any tier default to 'standard' (safe default).
 */
export function getTierForSkill(profile: BudgetProfile, skillName: string): PriorityTier {
  if (profile.tiers.critical.includes(skillName)) {
    return 'critical';
  }
  if (profile.tiers.standard.includes(skillName)) {
    return 'standard';
  }
  if (profile.tiers.optional.includes(skillName)) {
    return 'optional';
  }
  return 'standard';
}
