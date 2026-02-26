/**
 * Chapter and part boundary detection from raw PDF text.
 * Detects Part I-X and Chapter 1-33 boundaries from pdftotext output.
 */

import type { RawPage, PartMap, ChapterMap } from './types.js';

const ROMAN_TO_ARABIC: Record<string, number> = {
  'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5,
  'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10,
};

/**
 * Convert a Roman numeral string (I-X) to Arabic number.
 * Also accepts Arabic numeral strings directly.
 */
function parsePartNumber(str: string): number {
  const upper = str.toUpperCase();
  if (ROMAN_TO_ARABIC[upper] !== undefined) {
    return ROMAN_TO_ARABIC[upper];
  }
  const n = parseInt(str, 10);
  if (!isNaN(n)) return n;
  return -1;
}

/**
 * Detect TOC pages: pages with dense chapter listings (3+ "Chapter N" matches).
 */
function isTocPage(page: RawPage): boolean {
  const matches = page.text.match(/Chapter\s+\d{1,2}\s*[:\u2014\u2013\-.].*\d/gi);
  return matches !== null && matches.length >= 3;
}

/**
 * Detect part boundaries from raw pages.
 * Handles: "Part I: Title", "Part 1: Title", "PART I: Title"
 */
export function detectParts(pages: RawPage[]): PartMap[] {
  const partPattern = /^Part\s+(I{1,3}|IV|V|VI{0,3}|IX|X|\d{1,2})\s*[:\u2014\u2013\-]\s*(.+)$/im;

  const parts: PartMap[] = [];

  for (const page of pages) {
    const match = page.text.match(partPattern);
    if (match) {
      const partNumber = parsePartNumber(match[1]);
      const title = match[2].trim();

      if (partNumber > 0 && !parts.some(p => p.partNumber === partNumber)) {
        parts.push({
          partNumber,
          title,
          startPage: page.pageNumber,
          endPage: -1, // calculated below
          chapters: [],
        });
      }
    }
  }

  // Sort by partNumber
  parts.sort((a, b) => a.partNumber - b.partNumber);

  // Calculate endPage
  const maxPage = Math.max(...pages.map(p => p.pageNumber));
  for (let i = 0; i < parts.length; i++) {
    if (i < parts.length - 1) {
      parts[i].endPage = parts[i + 1].startPage - 1;
    } else {
      parts[i].endPage = maxPage;
    }
  }

  return parts;
}

/**
 * Detect chapter boundaries from raw pages, mapping each to a parent part.
 * Filters out TOC references and lowercase "chapter" in prose.
 */
export function detectChapters(pages: RawPage[], parts: PartMap[]): ChapterMap[] {
  const chapterPattern = /^Chapter\s+(\d{1,2})\s*[:\u2014\u2013\-]\s*(.+)$/im;

  // Identify TOC pages to skip
  const tocPageNumbers = new Set<number>();
  for (const page of pages) {
    if (isTocPage(page)) {
      tocPageNumbers.add(page.pageNumber);
    }
  }

  const chapters: ChapterMap[] = [];

  for (const page of pages) {
    // Skip TOC pages
    if (tocPageNumbers.has(page.pageNumber)) continue;

    const match = page.text.match(chapterPattern);
    if (match) {
      const chapterNumber = parseInt(match[1], 10);
      const title = match[2].trim();

      if (!isNaN(chapterNumber) && !chapters.some(c => c.chapterNumber === chapterNumber)) {
        // Find parent part by page range
        const parentPart = parts.find(
          p => page.pageNumber >= p.startPage && page.pageNumber <= p.endPage
        );

        chapters.push({
          chapterNumber,
          title,
          partNumber: parentPart?.partNumber ?? 0,
          startPage: page.pageNumber,
          endPage: -1, // calculated below
          rawText: '',  // populated below
        });
      }
    }
  }

  // Sort by chapterNumber
  chapters.sort((a, b) => a.chapterNumber - b.chapterNumber);

  // Calculate endPage: next chapter's startPage - 1, bounded by parent part's endPage
  for (let i = 0; i < chapters.length; i++) {
    if (i < chapters.length - 1) {
      chapters[i].endPage = chapters[i + 1].startPage - 1;
    } else {
      // Last chapter: ends at its part's endPage or last page overall
      const parentPart = parts.find(p => p.partNumber === chapters[i].partNumber);
      const maxPage = Math.max(...pages.map(p => p.pageNumber));
      chapters[i].endPage = parentPart?.endPage ?? maxPage;
    }
  }

  // Populate rawText by concatenating pages within each chapter's range
  const pagesByNumber = new Map<number, RawPage>();
  for (const page of pages) {
    pagesByNumber.set(page.pageNumber, page);
  }

  for (const chapter of chapters) {
    const chapterPages: string[] = [];
    for (let p = chapter.startPage; p <= chapter.endPage; p++) {
      const page = pagesByNumber.get(p);
      if (page) {
        chapterPages.push(page.text);
      }
    }
    chapter.rawText = chapterPages.join('\n');
  }

  // Assign chapters to parts
  for (const part of parts) {
    part.chapters = chapters
      .filter(ch => ch.partNumber === part.partNumber)
      .map(ch => ch.chapterNumber);
  }

  return chapters;
}
