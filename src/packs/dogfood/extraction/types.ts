/**
 * Internal extraction types for the PDF extraction pipeline.
 * These types are used within the extraction module and not exposed publicly.
 */

export interface PartMap {
  partNumber: number;           // 1-10
  title: string;                // "Seeing", "Hearing", etc.
  startPage: number;
  endPage: number;
  chapters: number[];           // chapter numbers in this part
}

export interface ChapterMap {
  chapterNumber: number;        // 1-33
  title: string;
  partNumber: number;
  startPage: number;
  endPage: number;
  rawText: string;              // full extracted text for this chapter
}

export interface SectionInfo {
  heading: string;
  level: number;                // 1=section, 2=subsection
  startOffset: number;          // character offset within chapter text
  endOffset: number;
}

export interface RawPage {
  pageNumber: number;
  text: string;
}

export interface ExtractionResult {
  parts: PartMap[];
  chapters: ChapterMap[];
  rawPages: RawPage[];
  warnings: string[];
}
