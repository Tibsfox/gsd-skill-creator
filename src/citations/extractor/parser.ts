/**
 * Citation parser orchestrator.
 *
 * Main extraction pipeline: splits text into sections, parses bibliography
 * entries, processes inline patterns, extracts DOIs and URLs, applies
 * cross-reference boosts, deduplicates, and returns ExtractionResult.
 */

import type { RawCitation, ExtractionMethod, ExtractionResult } from '../types/index.js';
import {
  INLINE_APA,
  NARRATIVE_APA,
  NUMBERED_REF,
  ISBN_PATTERN,
  BIBLIOGRAPHY_HEADER,
  INFORMAL_CITATION,
  BASE_CONFIDENCE,
} from './patterns.js';
import { detectDois } from './doi-detector.js';
import { extractUrls } from './url-resolver.js';

// ============================================================================
// Internal types
// ============================================================================

interface TextSection {
  type: 'body' | 'bibliography';
  lines: string[];
  startLine: number;
}

interface AuthorYearKey {
  author: string;
  year: string;
}

// ============================================================================
// Bibliography entry parser
// ============================================================================

/**
 * Parse bibliography entries from lines after a bibliography header.
 * Each line starting with a capital letter or number after a blank line
 * is treated as a new entry.
 */
function parseBibliographyEntries(
  lines: string[],
  startLine: number,
  sourceDocument: string,
): RawCitation[] {
  const results: RawCitation[] = [];
  const now = new Date().toISOString();

  let currentEntry = '';
  let entryStartLine = startLine;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines between entries
    if (!line) {
      if (currentEntry) {
        const citation = parseSingleEntry(currentEntry, entryStartLine, sourceDocument, now);
        if (citation) results.push(citation);
        currentEntry = '';
      }
      continue;
    }

    // New entry starts with capital letter, number, or dash/bullet
    if (!currentEntry || /^[A-Z\d\-*]/.test(line)) {
      if (currentEntry) {
        const citation = parseSingleEntry(currentEntry, entryStartLine, sourceDocument, now);
        if (citation) results.push(citation);
      }
      currentEntry = line;
      entryStartLine = startLine + i;
    } else {
      // Continuation of current entry
      currentEntry += ' ' + line;
    }
  }

  // Process last entry
  if (currentEntry) {
    const citation = parseSingleEntry(currentEntry, entryStartLine, sourceDocument, now);
    if (citation) results.push(citation);
  }

  return results;
}

/**
 * Parse a single bibliography entry line into a RawCitation.
 * Extracts author and year information for cross-referencing.
 */
function parseSingleEntry(
  entry: string,
  lineNumber: number,
  sourceDocument: string,
  timestamp: string,
): RawCitation | null {
  // Must contain a year in parentheses or after punctuation to be a citation
  const yearMatch = entry.match(/\((\d{4}[a-z]?)\)|,\s*(\d{4}[a-z]?)\b|\.\s*(\d{4}[a-z]?)\b/);
  if (!yearMatch) return null;

  return {
    text: entry,
    source_document: sourceDocument,
    extraction_method: 'bibliography',
    confidence: BASE_CONFIDENCE.get('bibliography') ?? 0.90,
    line_number: lineNumber,
    timestamp,
  };
}

// ============================================================================
// Inline pattern processing
// ============================================================================

/**
 * Run all inline citation patterns against body text lines.
 */
function processInlinePatterns(
  lines: string[],
  startLine: number,
  sourceDocument: string,
): RawCitation[] {
  const results: RawCitation[] = [];
  const now = new Date().toISOString();

  const patterns: Array<{ regex: RegExp; method: ExtractionMethod }> = [
    { regex: new RegExp(INLINE_APA.source, INLINE_APA.flags), method: 'inline-apa' },
    { regex: new RegExp(NARRATIVE_APA.source, NARRATIVE_APA.flags), method: 'narrative' },
    { regex: new RegExp(NUMBERED_REF.source, NUMBERED_REF.flags), method: 'inline-numbered' },
    { regex: new RegExp(ISBN_PATTERN.source, ISBN_PATTERN.flags), method: 'isbn' },
    { regex: new RegExp(INFORMAL_CITATION.source, INFORMAL_CITATION.flags), method: 'informal' },
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = startLine + i;

    for (const { regex, method } of patterns) {
      // Reset regex state for each line
      regex.lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = regex.exec(line)) !== null) {
        results.push({
          text: match[0],
          source_document: sourceDocument,
          extraction_method: method,
          confidence: BASE_CONFIDENCE.get(method) ?? 0.50,
          line_number: lineNum,
          timestamp: now,
        });
      }
    }
  }

  return results;
}

// ============================================================================
// Section splitter
// ============================================================================

/**
 * Split text into body and bibliography sections based on bibliography headers.
 */
function splitSections(text: string): TextSection[] {
  const lines = text.split('\n');
  const sections: TextSection[] = [];
  const headerPattern = new RegExp(BIBLIOGRAPHY_HEADER.source, BIBLIOGRAPHY_HEADER.flags);

  let currentType: 'body' | 'bibliography' = 'body';
  let currentLines: string[] = [];
  let currentStart = 1;

  for (let i = 0; i < lines.length; i++) {
    headerPattern.lastIndex = 0;
    if (headerPattern.test(lines[i])) {
      // Save previous section
      if (currentLines.length > 0) {
        sections.push({ type: currentType, lines: currentLines, startLine: currentStart });
      }
      // Start new bibliography section (skip the header line itself)
      currentType = 'bibliography';
      currentLines = [];
      currentStart = i + 2; // 1-based, after header
    } else {
      currentLines.push(lines[i]);
    }
  }

  // Save last section
  if (currentLines.length > 0) {
    sections.push({ type: currentType, lines: currentLines, startLine: currentStart });
  }

  return sections;
}

// ============================================================================
// Cross-reference and dedup
// ============================================================================

/**
 * Normalize an author string to a canonical family-name key for matching.
 * Extracts only the primary family name(s), stripping initials and punctuation.
 * "Jacobson" -> "jacobson", "Horowitz & Hill" -> "horowitz & hill",
 * "Jacobson, E." -> "jacobson", "Bernstein, D. A., & Borkovec, T. D." -> "bernstein & borkovec"
 */
function normalizeAuthorKey(raw: string): string {
  // Split on & or "and" to handle multi-author entries
  const parts = raw.split(/\s*(?:&|and)\s*/i);
  const familyNames = parts.map(part => {
    // Take the first word (family name), stripping trailing comma/period/initials
    const familyMatch = part.trim().match(/^([A-Za-z'-]+)/);
    return familyMatch ? familyMatch[1].toLowerCase() : part.trim().toLowerCase();
  });
  return familyNames.join(' & ');
}

/**
 * Extract author+year key from a citation text for cross-reference matching.
 * Returns a normalized author key (family names only) and year string.
 */
function extractAuthorYearKey(citation: RawCitation): AuthorYearKey | null {
  // Try (Author, Year) pattern
  const apaMatch = citation.text.match(/\(([A-Z][a-zA-Z'-]+(?:\s+(?:&|and)\s+[A-Z][a-zA-Z'-]+)?(?:\s+et\s+al\.)?),\s*(\d{4}[a-z]?)\)/);
  if (apaMatch) return { author: normalizeAuthorKey(apaMatch[1]), year: apaMatch[2] };

  // Try Author (Year) pattern
  const narrativeMatch = citation.text.match(/([A-Z][a-zA-Z'-]+(?:\s+(?:and|&)\s+[A-Z][a-zA-Z'-]+)?(?:\s+et\s+al\.)?)\s+\((\d{4}[a-z]?)\)/);
  if (narrativeMatch) return { author: normalizeAuthorKey(narrativeMatch[1]), year: narrativeMatch[2] };

  // Try bibliography entry: Author... (Year) or Author... Year
  const bibMatch = citation.text.match(/^([A-Z][a-zA-Z'-]+(?:,?\s+[A-Z]\.?\s*)*(?:\s*(?:&|and)\s+[A-Z][a-zA-Z'-]+(?:,?\s+[A-Z]\.?\s*)*)?)[^(]*\(?(\d{4}[a-z]?)\)?/);
  if (bibMatch) return { author: normalizeAuthorKey(bibMatch[1]), year: bibMatch[2] };

  return null;
}

/**
 * Apply cross-reference boost: inline citations matching bibliography entries
 * get +0.05 confidence boost.
 */
function applyCrossReferenceBoost(citations: RawCitation[]): RawCitation[] {
  // Build bibliography author+year set
  const bibKeys = new Set<string>();
  for (const c of citations) {
    if (c.extraction_method === 'bibliography') {
      const key = extractAuthorYearKey(c);
      if (key) bibKeys.add(`${key.author}|${key.year}`);
    }
  }

  if (bibKeys.size === 0) return citations;

  return citations.map(c => {
    if (c.extraction_method === 'bibliography') return c;

    const key = extractAuthorYearKey(c);
    if (key && bibKeys.has(`${key.author}|${key.year}`)) {
      return { ...c, confidence: Math.min(1.0, c.confidence + 0.05) };
    }
    return c;
  });
}

/**
 * Deduplicate citations: same author+year from different patterns
 * are merged, keeping the highest confidence.
 */
function deduplicateCitations(citations: RawCitation[]): RawCitation[] {
  const groups = new Map<string, RawCitation[]>();
  const noKey: RawCitation[] = [];

  for (const c of citations) {
    const key = extractAuthorYearKey(c);
    if (key) {
      const groupKey = `${key.author}|${key.year}`;
      const existing = groups.get(groupKey) ?? [];
      existing.push(c);
      groups.set(groupKey, existing);
    } else {
      // Citations without author+year key (DOIs, URLs, numbered refs) are not deduped here
      noKey.push(c);
    }
  }

  const deduped: RawCitation[] = [];

  for (const group of groups.values()) {
    if (group.length === 1) {
      deduped.push(group[0]);
    } else {
      // Keep the one with highest confidence
      group.sort((a, b) => b.confidence - a.confidence);
      const best = group[0];
      // If there's a bibliography entry, prefer its text (most complete)
      const bibEntry = group.find(c => c.extraction_method === 'bibliography');
      if (bibEntry && bibEntry !== best) {
        deduped.push({ ...bibEntry, confidence: best.confidence });
      } else {
        deduped.push(best);
      }
    }
  }

  return [...deduped, ...noKey];
}

// ============================================================================
// Main extraction orchestrator
// ============================================================================

/**
 * Extract all citations from a text document.
 *
 * Pipeline: split sections -> parse bibliography -> process inline patterns
 * -> extract DOIs -> extract URLs -> cross-reference boost -> dedup -> filter -> stats.
 *
 * @param text - Full text of the source document
 * @param sourceDocument - Path/name of the source document
 * @param options - Optional configuration
 * @returns ExtractionResult with citations array and stats
 */
export async function extractCitations(
  text: string,
  sourceDocument: string,
  options?: { includeLowConfidence?: boolean },
): Promise<ExtractionResult> {
  const allCitations: RawCitation[] = [];

  // 1. Split text into sections
  const sections = splitSections(text);

  // 2. Process bibliography sections
  for (const section of sections) {
    if (section.type === 'bibliography') {
      const entries = parseBibliographyEntries(
        section.lines,
        section.startLine,
        sourceDocument,
      );
      allCitations.push(...entries);
    }
  }

  // 3. Process body text with inline patterns
  for (const section of sections) {
    if (section.type === 'body') {
      const inline = processInlinePatterns(
        section.lines,
        section.startLine,
        sourceDocument,
      );
      allCitations.push(...inline);
    }
  }

  // 4. Extract DOIs globally (covers both body and bibliography)
  const dois = detectDois(text, sourceDocument);
  allCitations.push(...dois);

  // 5. Extract and classify URLs globally
  const urls = extractUrls(text, sourceDocument);
  allCitations.push(...urls);

  // 6. Cross-reference boost
  const boosted = applyCrossReferenceBoost(allCitations);

  // 7. Deduplicate
  const deduped = deduplicateCitations(boosted);

  // 8. Filter low confidence if not included
  const minConfidence = options?.includeLowConfidence ? 0 : 0.30;
  const filtered = deduped.filter(c => c.confidence >= minConfidence);

  // 9. Calculate stats
  const stats = {
    total_candidates: filtered.length,
    high_confidence: filtered.filter(c => c.confidence >= 0.80).length,
    medium_confidence: filtered.filter(c => c.confidence >= 0.50 && c.confidence < 0.80).length,
    low_confidence: filtered.filter(c => c.confidence < 0.50).length,
    dois_found: filtered.filter(c => c.extraction_method === 'doi').length,
    isbns_found: filtered.filter(c => c.extraction_method === 'isbn').length,
  };

  return { citations: filtered, stats };
}
