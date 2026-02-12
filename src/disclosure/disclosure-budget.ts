/**
 * Disclosure-aware budget calculation.
 * Reports SKILL.md size separately from reference/script sizes.
 * Addresses DISC-03 requirement.
 */

import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { BudgetValidator } from '../validation/budget-validation.js';
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

/**
 * Count words in text using split/filter pattern.
 * Same algorithm as ContentAnalyzer.countWords.
 */
function countWords(text: string): number {
  if (!text) return 0;
  return text.split(/\s+/).filter((w) => w.length > 0).length;
}

/**
 * Read all files in a subdirectory of a skill directory.
 * Returns FileSizeInfo[] for each file found.
 */
async function readSubdirFiles(
  skillDir: string,
  subdir: string,
): Promise<FileSizeInfo[]> {
  const dirPath = join(skillDir, subdir);
  const files: FileSizeInfo[] = [];

  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile()) {
        const filePath = join(dirPath, entry.name);
        const content = await readFile(filePath, 'utf-8');
        files.push({
          filename: entry.name,
          chars: content.length,
          words: countWords(content),
          path: `${subdir}/${entry.name}`,
        });
      }
    }
  } catch {
    // Directory doesn't exist — return empty array
  }

  return files;
}

export class DisclosureBudget {
  /**
   * Calculate size breakdown for a skill directory.
   * Reads SKILL.md and all files in references/ and scripts/ subdirectories.
   */
  async calculateBreakdown(skillDir: string): Promise<SkillSizeBreakdown> {
    // Read SKILL.md (must exist)
    const skillMdPath = join(skillDir, 'SKILL.md');
    const skillMdContent = await readFile(skillMdPath, 'utf-8');
    const skillMdChars = skillMdContent.length;
    const skillMdWords = countWords(skillMdContent);

    // Read reference and script files
    const references = await readSubdirFiles(skillDir, 'references');
    const scripts = await readSubdirFiles(skillDir, 'scripts');

    // Compute sizes
    const refChars = references.reduce((sum, f) => sum + f.chars, 0);
    const scriptChars = scripts.reduce((sum, f) => sum + f.chars, 0);
    const conditionalChars = refChars + scriptChars;
    const alwaysLoadedChars = skillMdChars;
    const totalChars = alwaysLoadedChars + conditionalChars;

    return {
      skillMdChars,
      skillMdWords,
      references,
      scripts,
      totalChars,
      alwaysLoadedChars,
      conditionalChars,
    };
  }

  /**
   * Check disclosure budget for a skill directory.
   * Reports severity based on SKILL.md size only (always-loaded content).
   * Total size is informational only.
   */
  async checkDisclosureBudget(skillDir: string): Promise<DisclosureBudgetResult> {
    const breakdown = await this.calculateBreakdown(skillDir);
    const validator = BudgetValidator.load();

    // Severity based on SKILL.md size only (always-loaded content)
    const skillMdCheck = validator.checkSingleSkill(breakdown.alwaysLoadedChars);
    const skillMdSeverity = skillMdCheck.severity;

    // Total severity is informational (for reference reporting)
    const totalCheck = validator.checkSingleSkill(breakdown.totalChars);
    const totalSeverity = totalCheck.severity;

    // Budget percent for SKILL.md
    const skillMdBudgetPercent = skillMdCheck.usagePercent;

    // Build informational message
    const refCount = breakdown.references.length;
    const refChars = breakdown.references.reduce((sum, f) => sum + f.chars, 0);
    const scriptCount = breakdown.scripts.length;
    const message =
      `SKILL.md: ${breakdown.skillMdChars} chars (${skillMdBudgetPercent.toFixed(0)}% of budget)` +
      ` | References: ${refCount} files, ${refChars} chars` +
      ` | Scripts: ${scriptCount} files`;

    return {
      breakdown,
      skillMdSeverity,
      totalSeverity,
      skillMdBudgetPercent,
      message,
    };
  }
}
