/**
 * Non-destructive citation annotation injector.
 *
 * Places [CITE:id] markers in text after sentences containing citations.
 * Markers are additive only -- original text content is preserved.
 * Also handles YAML frontmatter annotation for skill files.
 */

import type { RawCitation, CitedWork } from '../types/index.js';

// ============================================================================
// Types
// ============================================================================

export interface CitationAnnotation {
  citation: RawCitation;
  work?: CitedWork;
}

interface InsertionPoint {
  position: number;
  marker: string;
}

// ============================================================================
// AnnotationInjector
// ============================================================================

export class AnnotationInjector {

  // --------------------------------------------------------------------------
  // Text annotation
  // --------------------------------------------------------------------------

  /**
   * Annotate text with [CITE:id] markers after citation sentences.
   *
   * For each citation:
   * - If the citation has a resolved work with an ID, use that ID
   * - Otherwise, generate a short ID from the citation text
   * - Find the citation's position in text (by line_number or text match)
   * - Insert [CITE:id] after the sentence containing the citation
   * - For bibliography sections, place marker at end of entry
   *
   * Non-destructive: original text preserved, markers are additive only.
   * Insertions are sorted reverse by position to avoid offset shifts.
   */
  async annotate(
    text: string,
    citations: CitationAnnotation[],
  ): Promise<string> {
    if (citations.length === 0) return text;

    const insertions: InsertionPoint[] = [];
    const lines = text.split('\n');

    for (const { citation, work } of citations) {
      const id = work?.id ?? generateShortId(citation.text);
      const marker = ` [CITE:${id}]`;

      // Find position in text
      const position = findCitationPosition(text, lines, citation);
      if (position === -1) continue;

      // Find end of sentence at this position
      const sentenceEnd = findSentenceEnd(text, position);

      insertions.push({ position: sentenceEnd, marker });
    }

    // Deduplicate insertions at the same position
    const uniqueInsertions = deduplicateInsertions(insertions);

    // Sort by position descending to avoid offset shifts
    uniqueInsertions.sort((a, b) => b.position - a.position);

    // Apply insertions
    let result = text;
    for (const { position, marker } of uniqueInsertions) {
      result = result.slice(0, position) + marker + result.slice(position);
    }

    return result;
  }

  // --------------------------------------------------------------------------
  // Skill frontmatter annotation
  // --------------------------------------------------------------------------

  /**
   * Annotate skill content by adding citation IDs to YAML frontmatter.
   *
   * Parses the YAML frontmatter, adds a `citations:` array with
   * `{ id, sections }` objects, preserves existing frontmatter fields,
   * and returns the updated skill content.
   */
  async annotateSkill(
    skillContent: string,
    citationIds: string[],
  ): Promise<string> {
    if (citationIds.length === 0) return skillContent;

    const frontmatterMatch = skillContent.match(/^---\n([\s\S]*?)\n---/);

    if (!frontmatterMatch) {
      // No frontmatter found -- prepend one with citations
      const citationsYaml = formatCitationsYaml(citationIds);
      return `---\n${citationsYaml}---\n${skillContent}`;
    }

    const frontmatter = frontmatterMatch[1];
    const afterFrontmatter = skillContent.slice(frontmatterMatch[0].length);

    // Check if citations already exist in frontmatter
    if (/^citations:/m.test(frontmatter)) {
      // Replace existing citations block
      const updatedFrontmatter = frontmatter.replace(
        /^citations:[\s\S]*?(?=^\S|\z)/m,
        formatCitationsYaml(citationIds),
      );
      return `---\n${updatedFrontmatter}\n---${afterFrontmatter}`;
    }

    // Append citations to frontmatter
    const citationsYaml = formatCitationsYaml(citationIds);
    return `---\n${frontmatter}\n${citationsYaml}---${afterFrontmatter}`;
  }
}

// ============================================================================
// Internal helpers
// ============================================================================

/**
 * Find the position of a citation in the text.
 * Uses line_number first, falls back to text matching.
 */
function findCitationPosition(
  text: string,
  lines: string[],
  citation: RawCitation,
): number {
  // Try line_number first (1-based)
  if (citation.line_number && citation.line_number > 0 && citation.line_number <= lines.length) {
    const lineIdx = citation.line_number - 1;
    let offset = 0;
    for (let i = 0; i < lineIdx; i++) {
      offset += lines[i].length + 1; // +1 for newline
    }
    // Find the citation text within this line
    const lineText = lines[lineIdx];
    const inlinePos = lineText.indexOf(citation.text.slice(0, 40));
    if (inlinePos !== -1) {
      return offset + inlinePos;
    }
    return offset;
  }

  // Fall back to text matching
  const searchText = citation.text.slice(0, 60);
  const pos = text.indexOf(searchText);
  return pos;
}

/**
 * Find the end of the sentence at the given position.
 * Looks for sentence-ending punctuation (. ! ?) followed by whitespace,
 * or end of line.
 */
function findSentenceEnd(text: string, position: number): number {
  // Search forward from position for sentence end
  const searchRegion = text.slice(position, position + 500);

  // Find the next sentence-ending punctuation
  const sentenceEnd = searchRegion.match(/[.!?](?:\s|$)/);
  if (sentenceEnd && sentenceEnd.index !== undefined) {
    return position + sentenceEnd.index + 1;
  }

  // If no sentence end found, find end of current line
  const lineEnd = searchRegion.indexOf('\n');
  if (lineEnd !== -1) {
    return position + lineEnd;
  }

  // Fall back to end of text
  return text.length;
}

/**
 * Generate a short ID from citation text for unresolved citations.
 * Uses first author initial + year if parseable, otherwise hash prefix.
 */
function generateShortId(text: string): string {
  // Try to extract author + year
  const match = text.match(/([A-Z][a-z]+).*?(\d{4})/);
  if (match) {
    return `${match[1].toLowerCase()}-${match[2]}`;
  }

  // Fall back to simple hash
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
  }
  return `cite-${Math.abs(hash).toString(36).slice(0, 8)}`;
}

/**
 * Deduplicate insertions at the same position.
 * Keeps the first insertion for each position.
 */
function deduplicateInsertions(insertions: InsertionPoint[]): InsertionPoint[] {
  const seen = new Map<number, InsertionPoint>();
  for (const ins of insertions) {
    if (!seen.has(ins.position)) {
      seen.set(ins.position, ins);
    }
  }
  return Array.from(seen.values());
}

/**
 * Format citation IDs as YAML for frontmatter insertion.
 */
function formatCitationsYaml(citationIds: string[]): string {
  const entries = citationIds.map(id => `  - id: "${id}"`);
  return `citations:\n${entries.join('\n')}\n`;
}
