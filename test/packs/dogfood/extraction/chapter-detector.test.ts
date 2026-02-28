import { describe, it, expect } from 'vitest';
import { detectParts, detectChapters } from '../../../../src/packs/dogfood/extraction/chapter-detector.js';
import type { RawPage, PartMap } from '../../../../src/packs/dogfood/extraction/types.js';

// --- Factories ---

const PART_TITLES = [
  'Seeing', 'Hearing', 'Touching', 'Moving', 'Thinking',
  'Collecting', 'Connecting', 'Transforming', 'Creating', 'Being',
];

const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

const CHAPTER_TITLES = [
  'Counting', 'Measuring', 'Seeing', 'Vibration', 'Waves',
  'Sound', 'Harmony', 'Light', 'Colour', 'Perspective',
  'Calculus', 'Derivatives', 'Integration', 'Sequences', 'Series',
  'Vectors', 'Matrices', 'Probability', 'Statistics', 'Entropy',
  'Sets', 'Functions', 'Relations', 'Categories', 'Functors',
  'Information', 'Compression', 'Fractals', 'Chaos', 'Emergence',
  'Quantum', 'Relativity', 'Being',
];

function createPartPages(): RawPage[] {
  const pages: RawPage[] = [];
  const pagesPerPart = 90;

  for (let i = 0; i < 10; i++) {
    const startPage = i * pagesPerPart + 1;
    // Part title page
    pages.push({
      pageNumber: startPage,
      text: `\n\nPart ${ROMAN_NUMERALS[i]}: ${PART_TITLES[i]}\n\nSome introductory text for this part.\n`,
    });
    // Fill in remaining pages for this part
    for (let p = startPage + 1; p < startPage + pagesPerPart; p++) {
      pages.push({
        pageNumber: p,
        text: `Page ${p} content. This is prose about ${PART_TITLES[i].toLowerCase()}.`,
      });
    }
  }

  return pages.sort((a, b) => a.pageNumber - b.pageNumber);
}

function createChapterPages(): RawPage[] {
  const pages: RawPage[] = [];
  const pagesPerChapter = 27; // ~900 pages / 33 chapters

  // Create part title pages first
  const partStartPages = [1, 91, 181, 271, 361, 451, 541, 631, 721, 811];
  for (let i = 0; i < 10; i++) {
    pages.push({
      pageNumber: partStartPages[i],
      text: `\n\nPart ${ROMAN_NUMERALS[i]}: ${PART_TITLES[i]}\n\n`,
    });
  }

  // Chapter distribution across parts: roughly 3-4 chapters per part
  const chapterParts = [
    1, 1, 1, 2, 2, 2, 2, 3, 3, 3,
    4, 4, 4, 4, 5, 5, 5, 6, 6, 6,
    7, 7, 7, 8, 8, 8, 9, 9, 9, 9,
    10, 10, 10,
  ];

  for (let ch = 0; ch < 33; ch++) {
    const partIdx = chapterParts[ch] - 1;
    const chaptersInPartBefore = chapterParts.slice(0, ch).filter(p => p === chapterParts[ch]).length;
    const startPage = partStartPages[partIdx] + 1 + chaptersInPartBefore * pagesPerChapter;

    // Chapter title page
    pages.push({
      pageNumber: startPage,
      text: `\n\nChapter ${ch + 1}: ${CHAPTER_TITLES[ch]}\n\nIntroductory text for chapter ${ch + 1}.\n`,
    });

    // Fill pages for this chapter
    for (let p = startPage + 1; p < startPage + pagesPerChapter; p++) {
      pages.push({
        pageNumber: p,
        text: `Page ${p}. Content about ${CHAPTER_TITLES[ch].toLowerCase()}. More text here.\n`,
      });
    }
  }

  return pages.sort((a, b) => a.pageNumber - b.pageNumber);
}

function createPartsForChapterDetection(): PartMap[] {
  const partStartPages = [1, 91, 181, 271, 361, 451, 541, 631, 721, 811];
  return PART_TITLES.map((title, i) => ({
    partNumber: i + 1,
    title,
    startPage: partStartPages[i],
    endPage: i < 9 ? partStartPages[i + 1] - 1 : 923,
    chapters: [],
  }));
}

describe('detectParts', () => {
  it('detects exactly 10 parts from raw text with Roman numeral formatting', () => {
    const pages = createPartPages();
    const parts = detectParts(pages);

    expect(parts).toHaveLength(10);
  });

  it('extracts correct part numbers (1-10)', () => {
    const pages = createPartPages();
    const parts = detectParts(pages);

    for (let i = 0; i < 10; i++) {
      expect(parts[i].partNumber).toBe(i + 1);
    }
  });

  it('extracts correct part titles', () => {
    const pages = createPartPages();
    const parts = detectParts(pages);

    for (let i = 0; i < 10; i++) {
      expect(parts[i].title).toBe(PART_TITLES[i]);
    }
  });

  it('assigns correct start pages', () => {
    const pages = createPartPages();
    const parts = detectParts(pages);

    expect(parts[0].startPage).toBe(1);
    expect(parts[1].startPage).toBe(91);
  });

  it('returns parts ordered by partNumber', () => {
    const pages = createPartPages();
    const parts = detectParts(pages);

    for (let i = 1; i < parts.length; i++) {
      expect(parts[i].partNumber).toBeGreaterThan(parts[i - 1].partNumber);
    }
  });

  it('handles "Part 1:" Arabic numeral formatting', () => {
    const pages: RawPage[] = [
      { pageNumber: 1, text: '\n\nPart 1: Seeing\n\n' },
      { pageNumber: 50, text: '\n\nPart 2: Hearing\n\n' },
    ];

    const parts = detectParts(pages);
    expect(parts).toHaveLength(2);
    expect(parts[0].title).toBe('Seeing');
    expect(parts[1].title).toBe('Hearing');
  });

  it('handles "PART I:" uppercase formatting', () => {
    const pages: RawPage[] = [
      { pageNumber: 1, text: '\n\nPART I: Seeing\n\n' },
      { pageNumber: 50, text: '\n\nPART II: Hearing\n\n' },
    ];

    const parts = detectParts(pages);
    expect(parts).toHaveLength(2);
    expect(parts[0].partNumber).toBe(1);
    expect(parts[1].partNumber).toBe(2);
  });

  it('calculates endPage correctly (next part startPage - 1)', () => {
    const pages = createPartPages();
    const parts = detectParts(pages);

    for (let i = 0; i < parts.length - 1; i++) {
      expect(parts[i].endPage).toBe(parts[i + 1].startPage - 1);
    }
  });

  it('last part endPage is the last page number', () => {
    const pages = createPartPages();
    const parts = detectParts(pages);
    const maxPage = Math.max(...pages.map(p => p.pageNumber));

    expect(parts[parts.length - 1].endPage).toBe(maxPage);
  });
});

describe('detectChapters', () => {
  it('detects exactly 33 chapters from raw text', () => {
    const pages = createChapterPages();
    const parts = createPartsForChapterDetection();
    const chapters = detectChapters(pages, parts);

    expect(chapters).toHaveLength(33);
  });

  it('assigns correct chapter numbers (1-33)', () => {
    const pages = createChapterPages();
    const parts = createPartsForChapterDetection();
    const chapters = detectChapters(pages, parts);

    for (let i = 0; i < 33; i++) {
      expect(chapters[i].chapterNumber).toBe(i + 1);
    }
  });

  it('maps each chapter to the correct parent part', () => {
    const pages = createChapterPages();
    const parts = createPartsForChapterDetection();
    const chapters = detectChapters(pages, parts);

    // First chapter should be in part 1
    expect(chapters[0].partNumber).toBe(1);
    // Last chapter should be in part 10
    expect(chapters[32].partNumber).toBe(10);
  });

  it('chapter boundaries do not overlap', () => {
    const pages = createChapterPages();
    const parts = createPartsForChapterDetection();
    const chapters = detectChapters(pages, parts);

    for (let i = 0; i < chapters.length - 1; i++) {
      expect(chapters[i].endPage).toBeLessThan(chapters[i + 1].startPage);
    }
  });

  it('extracts chapter titles correctly (strips numbering prefix)', () => {
    const pages = createChapterPages();
    const parts = createPartsForChapterDetection();
    const chapters = detectChapters(pages, parts);

    expect(chapters[0].title).toBe('Counting');
    expect(chapters[32].title).toBe('Being');
  });

  it('returns chapters sorted by chapterNumber', () => {
    const pages = createChapterPages();
    const parts = createPartsForChapterDetection();
    const chapters = detectChapters(pages, parts);

    for (let i = 1; i < chapters.length; i++) {
      expect(chapters[i].chapterNumber).toBeGreaterThan(chapters[i - 1].chapterNumber);
    }
  });

  it('populates rawText by concatenating pages for each chapter', () => {
    const pages = createChapterPages();
    const parts = createPartsForChapterDetection();
    const chapters = detectChapters(pages, parts);

    // rawText should be non-empty for every chapter
    for (const ch of chapters) {
      expect(ch.rawText.length).toBeGreaterThan(0);
    }
  });

  it('does not treat lowercase "chapter" in prose as a boundary', () => {
    const pages: RawPage[] = [
      { pageNumber: 1, text: '\n\nPart I: Seeing\n\n' },
      { pageNumber: 2, text: '\n\nChapter 1: Counting\n\nThis is chapter content.\n' },
      { pageNumber: 3, text: 'In the next chapter we will see more. Also this chapter is great.\n' },
      { pageNumber: 4, text: '\n\nChapter 2: Measuring\n\nMore content.\n' },
    ];
    const parts: PartMap[] = [{
      partNumber: 1, title: 'Seeing', startPage: 1, endPage: 4, chapters: [],
    }];

    const chapters = detectChapters(pages, parts);
    expect(chapters).toHaveLength(2);
  });

  it('does not count TOC references as chapter starts', () => {
    const pages: RawPage[] = [
      { pageNumber: 1, text: 'Table of Contents\nChapter 1: Counting . . . . 5\nChapter 2: Measuring . . . . 30\nChapter 3: Seeing . . . . 55\n' },
      { pageNumber: 2, text: '\n\nPart I: Seeing\n\n' },
      { pageNumber: 5, text: '\n\nChapter 1: Counting\n\nActual chapter content begins here.\n' },
      { pageNumber: 30, text: '\n\nChapter 2: Measuring\n\nActual chapter 2 content.\n' },
      { pageNumber: 55, text: '\n\nChapter 3: Seeing\n\nActual chapter 3 content.\n' },
    ];
    const parts: PartMap[] = [{
      partNumber: 1, title: 'Seeing', startPage: 1, endPage: 80, chapters: [],
    }];

    const chapters = detectChapters(pages, parts);
    expect(chapters).toHaveLength(3);
  });

  it('handles appendix content after Chapter 33 gracefully', () => {
    const pages: RawPage[] = [
      { pageNumber: 1, text: '\n\nPart I: Seeing\n\n' },
      { pageNumber: 2, text: '\n\nChapter 1: Counting\n\nContent.\n' },
      { pageNumber: 50, text: '\n\nChapter 2: Measuring\n\nContent.\n' },
      { pageNumber: 100, text: '\n\nAppendix A: Proof Techniques\n\nAppendix content.\n' },
    ];
    const parts: PartMap[] = [{
      partNumber: 1, title: 'Seeing', startPage: 1, endPage: 120, chapters: [],
    }];

    const chapters = detectChapters(pages, parts);
    // Only actual chapters detected, not appendices
    expect(chapters).toHaveLength(2);
    expect(chapters.every(ch => ch.title !== 'Proof Techniques')).toBe(true);
  });
});
