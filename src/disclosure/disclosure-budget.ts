/**
 * Disclosure-aware budget calculation.
 * Reports SKILL.md size separately from reference/script sizes.
 * Addresses DISC-03 requirement.
 */

import type { BudgetSeverity } from '../validation/budget-validation.js';

export interface FileSizeInfo {
  filename: string;
  chars: number;
  words: number;
  path: string;
}

export interface SkillSizeBreakdown {
  skillMdChars: number;
  skillMdWords: number;
  references: FileSizeInfo[];
  scripts: FileSizeInfo[];
  totalChars: number;
  alwaysLoadedChars: number;   // SKILL.md only
  conditionalChars: number;    // references/ + scripts/
}

export interface DisclosureBudgetResult {
  breakdown: SkillSizeBreakdown;
  skillMdSeverity: BudgetSeverity;
  totalSeverity: BudgetSeverity;
  skillMdBudgetPercent: number;
  message: string;
}

export class DisclosureBudget {
  async calculateBreakdown(_skillDir: string): Promise<SkillSizeBreakdown> {
    throw new Error('not implemented');
  }

  async checkDisclosureBudget(_skillDir: string): Promise<DisclosureBudgetResult> {
    throw new Error('not implemented');
  }
}
