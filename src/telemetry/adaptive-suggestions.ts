/**
 * AdaptiveSuggestions — produces human-readable prune and promote suggestion text.
 *
 * IMPORTANT: This class is READ-ONLY. It formats suggestion strings from a PatternReport.
 * It does NOT modify any skill files. User confirmation is required before any action.
 *
 * Privacy: operates only on skill names and numeric statistics — no user content.
 */

import type { PatternReport, SkillPatternEntry } from './types.js';

export class AdaptiveSuggestions {
  /**
   * Build a human-readable prune suggestion from a pattern report.
   *
   * Lists each dead-skill candidate with supporting evidence.
   * Returns a no-candidates message if report.deadSkills is empty.
   * MAKES NO CHANGES to any files.
   */
  buildPruneSuggestion(report: PatternReport): string {
    if (report.deadSkills.length === 0) {
      return `No dead skill candidates found in ${report.totalSessions} sessions.`;
    }

    const entryMap = new Map<string, SkillPatternEntry>(
      report.analyzedSkills.map(e => [e.skillName, e])
    );

    const n = report.deadSkills.length;
    const header = `Prune Suggestions (${n} dead skill candidate${n === 1 ? '' : 's'})`;
    const separator = '='.repeat(header.length);

    const lines: string[] = [
      header,
      separator,
      `The following skills have had no scored matches across ${report.totalSessions} sessions.`,
      'No changes will be made until you confirm.',
      '',
    ];

    report.deadSkills.forEach((skillName, idx) => {
      const entry = entryMap.get(skillName);
      lines.push(`${idx + 1}. ${skillName}`);
      lines.push(`   Evidence: 0 scored matches across ${report.totalSessions} sessions`);
      if (entry) {
        lines.push(
          `   Loaded ${entry.loadCount} time${entry.loadCount === 1 ? '' : 's'}, budget-skipped ${entry.budgetSkipCount} time${entry.budgetSkipCount === 1 ? '' : 's'}`
        );
      }
      lines.push('');
    });

    lines.push('To prune, confirm each skill individually.');

    return lines.join('\n');
  }

  /**
   * Build a human-readable promote suggestion from a pattern report.
   *
   * Lists each high-value skill candidate with supporting evidence.
   * Returns a no-candidates message if report.highValueSkills is empty.
   * MAKES NO CHANGES to any files.
   */
  buildPromoteSuggestion(report: PatternReport): string {
    if (report.highValueSkills.length === 0) {
      return `No high-value skill candidates found in ${report.totalSessions} sessions.`;
    }

    const entryMap = new Map<string, SkillPatternEntry>(
      report.analyzedSkills.map(e => [e.skillName, e])
    );

    const n = report.highValueSkills.length;
    const header = `Promote Suggestions (${n} high-value skill candidate${n === 1 ? '' : 's'})`;
    const separator = '='.repeat(header.length);

    const lines: string[] = [
      header,
      separator,
      `The following skills are in the top 10% by load rate × score across ${report.totalSessions} sessions.`,
      'No changes will be made until you confirm.',
      '',
    ];

    report.highValueSkills.forEach((skillName, idx) => {
      const entry = entryMap.get(skillName);
      lines.push(`${idx + 1}. ${skillName}`);
      if (entry) {
        const loadRatePct = (entry.loadRate * 100).toFixed(1);
        lines.push(`   Evidence: load rate ${loadRatePct}%, average score ${entry.avgScore.toFixed(2)}`);
        lines.push(`   Loaded in ${entry.loadCount} of ${report.totalSessions} sessions`);
      } else {
        lines.push(`   Evidence: top 10% by load rate × score`);
      }
      lines.push('');
    });

    lines.push('To promote to static cache, confirm each skill individually.');

    return lines.join('\n');
  }
}
