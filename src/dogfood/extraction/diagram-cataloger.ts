/**
 * TikZ diagram detection and contextual description generation.
 * Identifies diagrams, tables, and MusiXTeX artifacts from pdftotext output.
 */

import type { DiagramRef } from '../types.js';

const CHARS_PER_PAGE = 3000;

const FIGURE_CAPTION_PATTERN = /(?:Figure|Fig\.)\s+(\d+\.?\d*)\s*[:\u2014\u2013\-]\s*(.+)/i;
const TABLE_CAPTION_PATTERN = /Table\s+(\d+\.?\d*)\s*[:\u2014\u2013\-]\s*(.+)/i;

const DIAGRAM_CONTEXT_WORDS = /\b(figure|diagram|illustration|graph|plot|shown|depicted|drawn)\b/i;
const MUSICAL_CONTEXT_WORDS = /\b(staff|note|melody|clef|treble|bass|rhythm|measure|scale|chord|tempo|octave|pitch|harmony)\b/i;
const MUSICTEX_ARTIFACTS = /[\u266D\u266E\u266F\u2669\u266A\u266B\u266C]/;

/**
 * Detect a gap region: 3+ consecutive empty or whitespace-only lines.
 */
function findGaps(lines: string[]): Array<{ startLine: number; endLine: number }> {
  const gaps: Array<{ startLine: number; endLine: number }> = [];
  let i = 0;

  while (i < lines.length) {
    if (lines[i].trim() === '') {
      const start = i;
      while (i < lines.length && lines[i].trim() === '') {
        i++;
      }
      if (i - start >= 3) {
        gaps.push({ startLine: start, endLine: i - 1 });
      }
    } else {
      i++;
    }
  }

  return gaps;
}

/**
 * Check if lines have aligned column patterns (table detection).
 * Looks for consistent spacing patterns across 3+ consecutive non-empty lines.
 */
function detectTableLines(lines: string[]): Array<{ startLine: number; endLine: number }> {
  const tables: Array<{ startLine: number; endLine: number }> = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    // Look for lines with multiple spaces between word groups (column alignment)
    if (/\S+\s{2,}\S+\s{2,}\S+/.test(line)) {
      const start = i;
      while (i < lines.length && (/\S+\s{2,}\S+/.test(lines[i]) || lines[i].trim() === '')) {
        i++;
      }
      const dataLineCount = lines.slice(start, i).filter(l => l.trim().length > 0).length;
      if (dataLineCount >= 3) {
        tables.push({ startLine: start, endLine: i - 1 });
      }
    } else {
      i++;
    }
  }

  return tables;
}

/**
 * Get context around a line range, searching for relevant sentences.
 */
function getContextAround(
  lines: string[],
  startLine: number,
  endLine: number,
  searchRadius: number,
  contextPattern: RegExp
): string {
  const before = lines.slice(Math.max(0, startLine - searchRadius), startLine);
  const after = lines.slice(endLine + 1, Math.min(lines.length, endLine + 1 + searchRadius));
  const combined = [...before, ...after].join(' ');

  const sentences = combined.split(/[.!?]+/);
  const relevant = sentences.find(s => contextPattern.test(s));
  return relevant?.trim().slice(0, 150) || '';
}

/**
 * Calculate approximate page position from character offset.
 */
function approximatePosition(charOffset: number, startPage: number): number {
  return startPage + Math.floor(charOffset / CHARS_PER_PAGE);
}

/**
 * Catalog diagrams, tables, and MusiXTeX artifacts in chapter text.
 *
 * @param chapterText - Full raw text of the chapter
 * @param startPage - Starting page number of this chapter
 * @returns DiagramRef[] sorted by position
 */
export function catalogDiagrams(chapterText: string, startPage: number): DiagramRef[] {
  if (!chapterText || chapterText.trim().length === 0) {
    return [];
  }

  const diagrams: DiagramRef[] = [];
  const lines = chapterText.split('\n');

  // 1. Detect TikZ diagrams via figure captions and gaps
  const gaps = findGaps(lines);

  for (const gap of gaps) {
    // Look for figure caption near this gap (5 lines before/after)
    const nearbyLines = [
      ...lines.slice(Math.max(0, gap.startLine - 5), gap.startLine),
      ...lines.slice(gap.endLine + 1, Math.min(lines.length, gap.endLine + 6)),
    ];

    let caption: string | undefined;
    let figureNumber: string | undefined;

    for (const nearLine of nearbyLines) {
      const captionMatch = nearLine.match(FIGURE_CAPTION_PATTERN);
      if (captionMatch) {
        figureNumber = captionMatch[1];
        caption = captionMatch[2].trim();
        break;
      }
    }

    // Check if there's diagram-related context nearby
    const description = getContextAround(lines, gap.startLine, gap.endLine, 5, DIAGRAM_CONTEXT_WORDS);

    // Only add if we have a caption or diagram context
    if (caption || description) {
      const charOffset = lines.slice(0, gap.startLine).join('\n').length;
      diagrams.push({
        position: approximatePosition(charOffset, startPage),
        description: description || `Figure ${figureNumber || 'unknown'}`,
        type: 'tikz',
        caption,
      });
    }
  }

  // 2. Detect figure references without gaps (inline figures)
  for (let i = 0; i < lines.length; i++) {
    const captionMatch = lines[i].match(FIGURE_CAPTION_PATTERN);
    if (captionMatch) {
      // Check if we already cataloged this via gap detection
      const charOffset = lines.slice(0, i).join('\n').length;
      const position = approximatePosition(charOffset, startPage);
      const alreadyCataloged = diagrams.some(
        d => Math.abs(d.position - position) <= 1 && d.type === 'tikz'
      );

      if (!alreadyCataloged) {
        // Check if this is near a gap (within 5 lines)
        const nearGap = gaps.some(g =>
          Math.abs(g.startLine - i) <= 5 || Math.abs(g.endLine - i) <= 5
        );

        if (nearGap) {
          const description = getContextAround(lines, i, i, 5, DIAGRAM_CONTEXT_WORDS);
          diagrams.push({
            position,
            description: description || `Figure ${captionMatch[1]}`,
            type: 'tikz',
            caption: captionMatch[2].trim(),
          });
        }
      }
    }
  }

  // 3. Detect MusiXTeX artifacts
  for (let i = 0; i < lines.length; i++) {
    if (MUSICTEX_ARTIFACTS.test(lines[i])) {
      // Check for musical context within 10 lines
      const contextLines = lines.slice(Math.max(0, i - 10), Math.min(lines.length, i + 10));
      const hasMusicalContext = contextLines.some(l => MUSICAL_CONTEXT_WORDS.test(l));

      if (hasMusicalContext) {
        const description = getContextAround(lines, i, i, 5, MUSICAL_CONTEXT_WORDS);
        const charOffset = lines.slice(0, i).join('\n').length;

        // Don't duplicate
        const alreadyCataloged = diagrams.some(
          d => d.type === 'musictex' && Math.abs(d.position - approximatePosition(charOffset, startPage)) <= 1
        );

        if (!alreadyCataloged) {
          diagrams.push({
            position: approximatePosition(charOffset, startPage),
            description: description || 'musical notation',
            type: 'musictex',
          });
        }
      }
    }
  }

  // 4. Detect tables
  const tableLinesRegions = detectTableLines(lines);

  for (const region of tableLinesRegions) {
    // Look for table caption near this region
    const nearbyLines = lines.slice(
      Math.max(0, region.startLine - 3),
      Math.min(lines.length, region.endLine + 3)
    );

    let caption: string | undefined;

    for (const nearLine of nearbyLines) {
      const captionMatch = nearLine.match(TABLE_CAPTION_PATTERN);
      if (captionMatch) {
        caption = captionMatch[2].trim();
        break;
      }
    }

    const charOffset = lines.slice(0, region.startLine).join('\n').length;
    diagrams.push({
      position: approximatePosition(charOffset, startPage),
      description: caption ? `Table: ${caption}` : 'data table',
      type: 'table',
      caption,
    });
  }

  // Sort by position
  diagrams.sort((a, b) => a.position - b.position);

  return diagrams;
}
