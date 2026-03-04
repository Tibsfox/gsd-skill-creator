/**
 * VariantGenerator — creates per-model variant directories and applies
 * optimization hints to SKILL.md files.
 *
 * Used by OptimizationDriver when divergence is detected: each chip class
 * gets its own SKILL.md variant with chip-specific guidance appended.
 *
 * File operations use node:fs/promises. Hint application is non-destructive:
 * original skill content is never deleted, only Model-Specific Guidance
 * sections are appended/updated.
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';

// ============================================================================
// VariantGenerator
// ============================================================================

export class VariantGenerator {
  /**
   * Fork a skill into per-chip-class variants.
   *
   * Creates `{skillPath}/variants/{chipClass}/SKILL.md` for each chip class,
   * each containing a copy of the base SKILL.md.
   *
   * @returns Array of variant directory paths
   */
  async fork(skillPath: string, chipClasses: string[]): Promise<string[]> {
    const baseSkillPath = path.join(skillPath, 'SKILL.md');
    const baseContent = await fs.readFile(baseSkillPath, 'utf-8');
    const variantPaths: string[] = [];

    for (const chipClass of chipClasses) {
      const variantDir = path.join(skillPath, 'variants', chipClass);
      await fs.mkdir(variantDir, { recursive: true });
      await fs.writeFile(path.join(variantDir, 'SKILL.md'), baseContent);
      variantPaths.push(variantDir);
    }

    return variantPaths;
  }

  /**
   * Apply improvement hints to a variant's SKILL.md.
   *
   * Non-destructive: finds or creates `## Model-Specific Guidance` section,
   * finds or creates `### For {chipClass} models` subsection, and appends
   * hints as bullet points. Deduplicates exact matches.
   */
  async applyHints(
    variantPath: string,
    hints: string[],
    chipClass: string,
  ): Promise<void> {
    const skillFile = path.join(variantPath, 'SKILL.md');
    let content = await fs.readFile(skillFile, 'utf-8');

    const guidanceSectionHeader = '## Model-Specific Guidance';
    const chipSubsectionHeader = `### For ${chipClass} models`;

    // Ensure guidance section exists
    if (!content.includes(guidanceSectionHeader)) {
      content = content.trimEnd() + `\n\n${guidanceSectionHeader}\n`;
    }

    // Ensure chip class subsection exists
    if (!content.includes(chipSubsectionHeader)) {
      content = content.trimEnd() + `\n\n${chipSubsectionHeader}\n`;
    }

    // Append non-duplicate hints under the chip class subsection
    for (const hint of hints) {
      const bulletLine = `- ${hint}`;
      if (!content.includes(bulletLine)) {
        // Find the chip subsection and append after it
        const subsectionIndex = content.indexOf(chipSubsectionHeader);
        const afterHeader = subsectionIndex + chipSubsectionHeader.length;

        // Find the end of the subsection (next heading or end of file)
        const restAfterHeader = content.slice(afterHeader);
        const nextHeadingMatch = restAfterHeader.match(/\n##/);
        const insertPos = nextHeadingMatch
          ? afterHeader + (nextHeadingMatch.index as number)
          : content.length;

        // Insert the hint before the next heading or at end
        const before = content.slice(0, insertPos).trimEnd();
        const after = content.slice(insertPos);
        content = before + `\n${bulletLine}` + after;
      }
    }

    // Ensure trailing newline
    if (!content.endsWith('\n')) {
      content += '\n';
    }

    await fs.writeFile(skillFile, content);
  }
}
