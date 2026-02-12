import type { SkillMetadata } from '../types/skill.js';
import {
  ContentAnalyzer,
  WORD_THRESHOLD_DECOMPOSE,
  WORD_THRESHOLD_WARNING,
} from './content-analyzer.js';
import type { Section } from './content-analyzer.js';

export interface ReferenceFile {
  filename: string; // e.g., 'guidelines.md'
  content: string;
  wordCount: number;
}

export interface ScriptFile {
  filename: string; // e.g., 'setup.sh'
  content: string;
  executable: boolean;
}

export interface DecomposedSkill {
  decomposed: boolean;
  skillMd: string; // Compact SKILL.md content
  references: ReferenceFile[];
  scripts: ScriptFile[];
  warnings: string[];
}

export class ContentDecomposer {
  private analyzer: ContentAnalyzer;

  constructor() {
    this.analyzer = new ContentAnalyzer();
  }

  /**
   * Decompose a skill body into compact SKILL.md + reference files + scripts.
   *
   * Rules:
   * - Under 2000 words or single section: return unchanged
   * - Over 2000 words with multiple sections: extract sections as references
   * - Over 5000 words: add warning
   * - Deterministic ops in fenced code blocks: extract as scripts
   */
  decompose(
    name: string,
    metadata: SkillMetadata,
    body: string,
  ): DecomposedSkill {
    const analysis = this.analyzer.analyzeContent(body);
    const warnings: string[] = [];

    // Add warning for very large skills
    if (analysis.exceedsWarning) {
      warnings.push(
        `Skill exceeds ${WORD_THRESHOLD_WARNING} words (${analysis.wordCount} words). Consider further splitting.`,
      );
    }

    // Don't decompose if under threshold or only one section
    if (!analysis.exceedsDecompose || analysis.sections.length <= 1) {
      return {
        decomposed: false,
        skillMd: body,
        references: [],
        scripts: [],
        warnings,
      };
    }

    // Extract scripts from deterministic ops
    const scripts = this.extractScripts(analysis);

    // Extract references from sections (skip first section - keep inline)
    const references = this.extractReferences(analysis.sections);

    // Build compact SKILL.md
    const skillMd = this.generateSkillMd(
      name,
      metadata,
      analysis.sections,
      references,
      scripts,
    );

    return {
      decomposed: true,
      skillMd,
      references,
      scripts,
      warnings,
    };
  }

  /**
   * Generate compact SKILL.md with first section inline and @reference links.
   */
  generateSkillMd(
    _name: string,
    _metadata: SkillMetadata,
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

    // Add references section
    if (references.length > 0) {
      parts.push('');
      parts.push('## References');
      parts.push('');
      for (const ref of references) {
        // Find original heading for description
        const heading = ref.filename.replace(/\.md$/, '').replace(/-/g, ' ');
        parts.push(`- @references/${ref.filename} -- ${heading}`);
      }
    }

    // Add scripts section
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
   * Extract reference files from sections (all sections except the first).
   */
  private extractReferences(sections: Section[]): ReferenceFile[] {
    if (sections.length <= 1) return [];

    return sections.slice(1).map((section) => ({
      filename: this.slugify(section.heading) + '.md',
      content: `## ${section.heading}\n\n${section.content}`,
      wordCount: section.wordCount,
    }));
  }

  /**
   * Extract script files from detected deterministic operations.
   * Uses unique filenames when multiple scripts of same type exist.
   */
  private extractScripts(
    analysis: ReturnType<ContentAnalyzer['analyzeContent']>,
  ): ScriptFile[] {
    const ops = analysis.deterministicOps;
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

      return {
        filename,
        content: op.content,
        executable: true,
      };
    });
  }

  /**
   * Convert a heading string to a filename-safe slug.
   */
  private slugify(heading: string): string {
    return heading
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
