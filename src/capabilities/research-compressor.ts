/**
 * ResearchCompressor service.
 *
 * Converts research markdown files (20-35KB) into distilled skill files (2-5KB)
 * with provenance metadata linking back to the source via content hash.
 *
 * Pipeline: parseSections() -> rankSections() -> distillContent() -> generateSkillBody()
 */

import { computeContentHash } from './types.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Result of compressing a research file into a distilled skill.
 */
export interface CompressedResearch {
  /** Derived skill name (e.g., "research-caching-compressed") */
  skillName: string;

  /** Skill metadata following OfficialSkillMetadata shape */
  metadata: {
    name: string;
    description: string;
    source: 'auto-generated';
    metadata: {
      extensions: {
        'gsd-skill-creator': {
          generatedFrom: {
            file: string;
            contentHash: string;
            compressedAt: string;
          };
        };
      };
    };
  };

  /** Distilled markdown content */
  body: string;

  /** Size of original research content in bytes */
  originalSize: number;

  /** Size of compressed skill output in bytes */
  compressedSize: number;
}

/**
 * Options for controlling compression behavior.
 */
export interface CompressionOptions {
  /** Maximum output body size in bytes (default: 5000) */
  maxOutputBytes?: number;

  /** Ordered list of section headings to prioritize (lower index = higher priority) */
  sectionPriority?: string[];
}

/** Internal parsed section representation */
interface ParsedSection {
  heading: string;
  level: number;
  body: string;
}

/** Section with priority score attached */
interface RankedSection extends ParsedSection {
  score: number;
}

/** Default section priority order */
const DEFAULT_PRIORITY: string[] = [
  'Key Findings',
  'Decisions',
  'Recommendations',
  'Architecture',
  'Patterns',
  'API',
  'Configuration',
];

/** Patterns for lines to keep during distillation */
const KEEP_PATTERNS = [
  /^\s*[-*]\s/,                       // bullet points
  /^\s*\d+\.\s/,                      // numbered lists
  /^```/,                             // code block markers
  /decision:/i,                       // decision lines
  /recommendation:/i,                 // recommendation lines
  /\buse\b/i,                         // lines mentioning "use"
  /\bavoid\b/i,                       // lines mentioning "avoid"
];

/** Patterns for lines to remove during distillation */
const REMOVE_PATTERNS = [
  /^see also:/i,                      // cross-references
  /^attribution:/i,                   // attribution lines
  /^\s*\[.*\]\(https?:\/\/[^)]+\)/,   // markdown links with URLs (reference-style)
  /^https?:\/\//,                     // bare URLs
];

// ============================================================================
// Service
// ============================================================================

/**
 * Compresses research markdown into distilled skill files with metadata tracking.
 */
export class ResearchCompressor {
  /**
   * Compress a research file into a distilled skill.
   *
   * @param filePath - Original file path (for metadata tracking)
   * @param content - Raw markdown content of the research file
   * @param options - Compression options
   * @returns CompressedResearch with distilled content and provenance metadata
   */
  compress(
    filePath: string,
    content: string,
    options?: CompressionOptions
  ): CompressedResearch {
    const maxOutputBytes = options?.maxOutputBytes ?? 5000;
    const priority = options?.sectionPriority ?? DEFAULT_PRIORITY;

    // Compute content hash from raw content
    const contentHash = computeContentHash(content);

    // Pipeline: parse -> rank -> distill -> generate body
    const sections = this.parseSections(content);
    const ranked = this.rankSections(sections, priority);
    const distilled = ranked.map((s) => ({
      ...s,
      body: this.distillSection(s),
    }));
    const body = this.generateSkillBody(distilled, maxOutputBytes);

    // Derive skill name from file path
    const skillName = this.deriveSkillName(filePath);

    // Extract description from first section or first heading
    const description = this.deriveDescription(sections);

    const originalSize = Buffer.byteLength(content, 'utf-8');
    const compressedSize = Buffer.byteLength(body, 'utf-8');

    return {
      skillName,
      metadata: {
        name: skillName,
        description,
        source: 'auto-generated',
        metadata: {
          extensions: {
            'gsd-skill-creator': {
              generatedFrom: {
                file: filePath,
                contentHash,
                compressedAt: new Date().toISOString(),
              },
            },
          },
        },
      },
      body,
      originalSize,
      compressedSize,
    };
  }

  /**
   * Parse markdown content into sections by heading.
   * Skips YAML frontmatter between --- delimiters.
   */
  private parseSections(content: string): ParsedSection[] {
    // Strip frontmatter
    let stripped = content;
    const fmMatch = content.match(/^---\n[\s\S]*?\n---\n?/);
    if (fmMatch) {
      stripped = content.slice(fmMatch[0].length);
    }

    const lines = stripped.split('\n');
    const sections: ParsedSection[] = [];
    let currentHeading = '';
    let currentLevel = 0;
    let currentBody: string[] = [];

    for (const line of lines) {
      const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
      if (headingMatch) {
        // Save previous section
        if (currentHeading || currentBody.length > 0) {
          sections.push({
            heading: currentHeading,
            level: currentLevel,
            body: currentBody.join('\n').trim(),
          });
        }
        currentLevel = headingMatch[1].length;
        currentHeading = headingMatch[2].trim();
        currentBody = [];
      } else {
        currentBody.push(line);
      }
    }

    // Save last section
    if (currentHeading || currentBody.length > 0) {
      sections.push({
        heading: currentHeading,
        level: currentLevel,
        body: currentBody.join('\n').trim(),
      });
    }

    return sections;
  }

  /**
   * Rank sections by matching heading against priority list.
   * Lower index in priority = higher score. Unmatched sections get lowest priority.
   */
  private rankSections(
    sections: ParsedSection[],
    priority: string[]
  ): RankedSection[] {
    const scored = sections.map((section) => {
      const idx = priority.findIndex(
        (p) => section.heading.toLowerCase().includes(p.toLowerCase())
      );
      // Higher score = higher priority (invert index so idx 0 gets highest score)
      const score = idx >= 0 ? priority.length - idx : -1;
      return { ...section, score };
    });

    // Sort descending by score (highest priority first)
    return scored.sort((a, b) => b.score - a.score);
  }

  /**
   * Distill a section by keeping actionable content and removing noise.
   *
   * Keep: bullet points, numbered lists, code blocks, decision/recommendation lines
   * Truncate: long prose paragraphs to first 2 lines + "..."
   * Remove: "See also", cross-references, bare URLs, attribution lines
   */
  private distillSection(section: ParsedSection): string {
    const lines = section.body.split('\n');
    const result: string[] = [];
    let inCodeBlock = false;
    let proseBuffer: string[] = [];

    const flushProse = (): void => {
      if (proseBuffer.length > 0) {
        if (proseBuffer.length > 3) {
          result.push(...proseBuffer.slice(0, 2));
          result.push('...');
        } else {
          result.push(...proseBuffer);
        }
        proseBuffer = [];
      }
    };

    for (const line of lines) {
      // Handle code blocks (keep entirely)
      if (line.startsWith('```')) {
        flushProse();
        inCodeBlock = !inCodeBlock;
        result.push(line);
        continue;
      }
      if (inCodeBlock) {
        result.push(line);
        continue;
      }

      // Check for remove patterns
      if (REMOVE_PATTERNS.some((p) => p.test(line))) {
        continue;
      }

      // Check for keep patterns
      if (KEEP_PATTERNS.some((p) => p.test(line))) {
        flushProse();
        result.push(line);
        continue;
      }

      // Empty lines flush prose
      if (line.trim() === '') {
        flushProse();
        result.push('');
        continue;
      }

      // Prose line - buffer for truncation
      proseBuffer.push(line);
    }

    flushProse();

    return result.join('\n').trim();
  }

  /**
   * Generate the final skill body from distilled sections.
   * Concatenates with heading separators, drops lowest-priority sections if over budget.
   */
  private generateSkillBody(
    sections: RankedSection[],
    maxBytes: number
  ): string {
    // Filter out sections with no content after distillation
    const nonEmpty = sections.filter((s) => s.body.trim().length > 0);

    // Build body starting from highest-priority sections
    let parts = nonEmpty.map((s) => {
      const prefix = '#'.repeat(Math.max(s.level, 2));
      return `${prefix} ${s.heading}\n\n${s.body}`;
    });

    let body = parts.join('\n\n');

    // If over budget, drop lowest-priority sections one at a time
    while (
      Buffer.byteLength(body, 'utf-8') > maxBytes &&
      parts.length > 1
    ) {
      parts.pop(); // Remove lowest-priority (already sorted high to low)
      body = parts.join('\n\n');
    }

    // Final truncation if still over budget
    if (Buffer.byteLength(body, 'utf-8') > maxBytes) {
      // Truncate by characters (approximate byte equivalence for ASCII)
      while (Buffer.byteLength(body, 'utf-8') > maxBytes - 3) {
        body = body.slice(0, -100);
      }
      body = body.trimEnd() + '...';
    }

    return body;
  }

  /**
   * Derive skill name from file path.
   * Extracts topic from path, formats as research-{topic}-compressed.
   */
  private deriveSkillName(filePath: string): string {
    // Extract filename or directory name for topic
    const parts = filePath.replace(/\\/g, '/').split('/');

    // Try to find a phase directory name like "57-cache-ordering"
    const phaseDir = parts.find((p) => /^\d+-/.test(p));
    if (phaseDir) {
      // Extract topic from "57-cache-ordering" -> "cache-ordering"
      const topic = phaseDir.replace(/^\d+-/, '');
      return `research-${topic}-compressed`;
    }

    // Fall back to filename without extension
    const filename = parts[parts.length - 1].replace(/\.md$/i, '');
    return `research-${filename}-compressed`;
  }

  /**
   * Derive a short description from the first section or title heading.
   */
  private deriveDescription(sections: ParsedSection[]): string {
    // Use the first h1 heading as description source
    const h1 = sections.find((s) => s.level === 1);
    if (h1) {
      return `Compressed research: ${h1.heading}`;
    }

    // Fall back to first section heading
    if (sections.length > 0 && sections[0].heading) {
      return `Compressed research: ${sections[0].heading}`;
    }

    return 'Compressed research artifact';
  }
}
