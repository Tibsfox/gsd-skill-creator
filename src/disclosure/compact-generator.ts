/**
 * Compact mode skill generation with @references/ links.
 * Produces minimal SKILL.md with separate reference files.
 * Addresses DISC-06 requirement.
 */

import { ContentAnalyzer } from './content-analyzer.js';
import type { ReferenceFile, ScriptFile } from './content-decomposer.js';
import type { Section, DeterministicOp } from './content-analyzer.js';

export interface CompactSkillOutput {
  compacted: boolean;
  skillMd: string;
  references: ReferenceFile[];
  scripts: ScriptFile[];
}

/**
 * Convert a heading string to a filename-safe slug.
 * Lowercase, replace non-alphanumeric with hyphens, trim hyphens.
 */
function slugify(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export class CompactGenerator {
  private analyzer: ContentAnalyzer;

  constructor() {
    this.analyzer = new ContentAnalyzer();
  }

  /**
   * Generate a compact version of a skill.
   *
   * For short bodies (<2000 words) or single-section bodies: returns unchanged.
   * For longer multi-section bodies: keeps first section inline, extracts
   * remaining sections as reference files, and extracts deterministic ops
   * as script files with hashbangs.
   */
  generateCompact(
    _name: string,
    _metadata: Record<string, unknown>,
    body: string,
  ): CompactSkillOutput {
    const analysis = this.analyzer.analyzeContent(body);

    // Don't compact short bodies or single-section bodies
    if (!analysis.exceedsDecompose || analysis.sections.length <= 1) {
      return {
        compacted: false,
        skillMd: body,
        references: [],
        scripts: [],
      };
    }

    // Extract scripts from deterministic ops
    const scripts = this.extractScripts(analysis.deterministicOps);

    // Extract references from all sections after the first
    const references = this.extractReferences(analysis.sections);

    // Build compact SKILL.md
    const skillMd = this.buildCompactSkillMd(
      analysis.sections,
      references,
      scripts,
    );

    return {
      compacted: true,
      skillMd,
      references,
      scripts,
    };
  }

  /**
   * Build a compact SKILL.md with first section inline and reference links.
   */
  private buildCompactSkillMd(
    sections: Section[],
    references: ReferenceFile[],
    scripts: ScriptFile[],
  ): string {
    const parts: string[] = [];

    // Keep first section inline (always loaded)
    if (sections.length > 0) {
      const first = sections[0];
      if (first.heading !== 'intro') {
        parts.push(`## ${first.heading}`);
        parts.push('');
      }
      parts.push(first.content);
    }

    // Add Additional References section with links
    if (references.length > 0) {
      parts.push('');
      parts.push('## Additional References');
      parts.push('');
      for (const ref of references) {
        // Find original heading from the section
        const heading = this.headingFromFilename(ref.filename, sections);
        parts.push(`- @references/${ref.filename} -- ${heading}`);
      }
    }

    // Add Scripts section with links (if any)
    if (scripts.length > 0) {
      parts.push('');
      parts.push('## Scripts');
      parts.push('');
      for (const script of scripts) {
        const desc = script.filename.replace(/\.sh$/, '').replace(/-/g, ' ');
        parts.push(`- @scripts/${script.filename} -- ${desc}`);
      }
    }

    return parts.join('\n');
  }

  /**
   * Recover original heading from a slugified filename by matching
   * against the original sections list.
   */
  private headingFromFilename(filename: string, sections: Section[]): string {
    const slug = filename.replace(/\.md$/, '');
    for (const section of sections) {
      if (slugify(section.heading) === slug) {
        return section.heading;
      }
    }
    // Fallback: convert slug back to title case
    return slug.replace(/-/g, ' ');
  }

  /**
   * Extract reference files from sections (all sections except the first).
   */
  private extractReferences(sections: Section[]): ReferenceFile[] {
    if (sections.length <= 1) return [];

    return sections.slice(1).map((section) => ({
      filename: slugify(section.heading) + '.md',
      content: `## ${section.heading}\n\n${section.content}`,
      wordCount: section.wordCount,
    }));
  }

  /**
   * Extract script files from detected deterministic operations.
   * Adds appropriate hashbangs to script content.
   */
  private extractScripts(ops: DeterministicOp[]): ScriptFile[] {
    if (ops.length === 0) return [];

    const filenameCounts = new Map<string, number>();

    return ops.map((op) => {
      let filename = op.suggestedFilename;

      // Handle duplicate filenames
      const count = filenameCounts.get(filename) ?? 0;
      filenameCounts.set(filename, count + 1);
      if (count > 0) {
        const base = filename.replace(/\.sh$/, '');
        filename = `${base}-${count + 1}.sh`;
      }

      // Add hashbang if not present
      let content = op.content;
      if (!content.startsWith('#!')) {
        content = '#!/bin/bash\n' + content;
      }

      return {
        filename,
        content,
        executable: true,
      };
    });
  }
}
