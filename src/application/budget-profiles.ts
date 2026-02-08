import type { BudgetProfile, PriorityTier } from '../types/application.js';

export const DEFAULT_PROFILES: Record<string, BudgetProfile> = {};

export function getBudgetProfile(agentName: string): BudgetProfile | undefined {
  return undefined;
}

export function getTierForSkill(profile: BudgetProfile, skillName: string): PriorityTier {
  return 'standard';
}
