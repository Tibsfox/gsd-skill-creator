/**
 * DocxExporter — structural validation and manifest generation for Heritage Book
 * docx export. Full document generation is stubbed (requires external library).
 *
 * Validates: title, cultural sovereignty statement, chapters, bibliography
 * completeness, and syllabics encoding.
 *
 * @module heritage-skills-pack/project-builder/export/docx-exporter
 */

import type { HeritageBook, Tradition } from '../../shared/types.js';
import { SyllabicsRenderer } from './syllabics-renderer.js';

export interface ExportValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ExportManifest {
  title: string;
  chapterCount: number;
  traditionsRepresented: string[];
  hasSyllabics: boolean;
  hasTerritorialAcknowledgment: boolean;
  bibliographyEntryCount: number;
  estimatedPages: number;
  culturalSovereigntyStatementPresent: boolean;
}

export interface ExportResult {
  format: 'docx' | 'pdf';
  status: 'success' | 'stub' | 'error';
  manifestPath?: string;
  note: string;
  manifest: ExportManifest;
  errors?: string[];
}

export class DocxExporter {
  private renderer: SyllabicsRenderer;

  constructor(renderer?: SyllabicsRenderer) {
    this.renderer = renderer ?? new SyllabicsRenderer();
  }

  /**
   * Validate that the HeritageBook is ready for export.
   * Checks structural requirements for a valid Heritage Book document.
   */
  validateStructure(book: HeritageBook): ExportValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!book.title || book.title.trim().length === 0) {
      errors.push('Book title is required');
    }

    if (
      !book.frontMatter.culturalSovereigntyStatement ||
      book.frontMatter.culturalSovereigntyStatement.trim().length === 0
    ) {
      errors.push('Cultural sovereignty statement is required in front matter');
    }

    if (!book.chapters || book.chapters.length === 0) {
      errors.push('At least one chapter is required');
    }

    // Check bibliography for non-Appalachian traditions
    const hasNonAppalachianTradition = book.traditions.some(
      (t: Tradition | string) => t !== 'appalachian',
    );
    if (hasNonAppalachianTradition && (!book.bibliography || book.bibliography.length === 0)) {
      warnings.push(
        'Bibliography is empty — content from non-Appalachian traditions should include citations with Fair Use notices',
      );
    }

    // Check territorial acknowledgment for non-Appalachian traditions
    if (hasNonAppalachianTradition && !book.frontMatter.territorialAcknowledgment) {
      warnings.push(
        'Territorial acknowledgment is recommended for content from non-Appalachian traditions',
      );
    }

    // Validate syllabics encoding if any text contains syllabics
    const allText = this.collectAllText(book);
    if (this.renderer.containsSyllabics(allText)) {
      const syllabicsValidation = this.renderer.validateSyllabicEncoding(allText);
      if (!syllabicsValidation.isValid) {
        errors.push(
          ...syllabicsValidation.issues.map((issue) => `Syllabics encoding: ${issue}`),
        );
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Generate an export manifest describing the Heritage Book's content.
   */
  generateManifest(book: HeritageBook): ExportManifest {
    const allText = this.collectAllText(book);
    const estimatedPages = this.estimatePageCount(book);

    return {
      title: book.title,
      chapterCount: book.chapters.length,
      traditionsRepresented: [...new Set(book.traditions as string[])],
      hasSyllabics: this.renderer.containsSyllabics(allText),
      hasTerritorialAcknowledgment: !!book.frontMatter.territorialAcknowledgment,
      bibliographyEntryCount: book.bibliography.length,
      estimatedPages,
      culturalSovereigntyStatementPresent: !!book.frontMatter.culturalSovereigntyStatement,
    };
  }

  /**
   * Export the Heritage Book to docx format.
   * Currently a structural stub — validates structure and returns manifest.
   * Full docx generation requires an external library (e.g., the `docx` npm package).
   */
  export(book: HeritageBook): ExportResult {
    const validation = this.validateStructure(book);
    const manifest = this.generateManifest(book);

    return {
      format: 'docx',
      status: 'stub',
      note: 'Full docx generation requires external library (e.g., docx npm package). Structural validation and manifest generation are functional. Syllabics encoding validated.',
      manifest,
      errors: validation.errors.length > 0 ? validation.errors : undefined,
    };
  }

  collectAllText(book: HeritageBook): string {
    const parts: string[] = [
      book.title,
      book.frontMatter.titlePage,
      book.frontMatter.culturalSovereigntyStatement,
      book.frontMatter.territorialAcknowledgment ?? '',
      book.frontMatter.acknowledgments ?? '',
      book.backMatter.fairUseNotice,
      ...Object.values(book.backMatter.glossary ?? {}),
      ...(book.backMatter.resourceDirectory ?? []),
      ...book.chapters.map((c) => c.title),
      ...book.bibliography.map((b) => b.citation + ' ' + b.fairUseNotice),
      ...book.attributions.map((a) => a.name + ' ' + (a.nation ?? '')),
    ];
    return parts.join(' ');
  }

  private estimatePageCount(book: HeritageBook): number {
    const chapterPages = book.chapters.reduce((sum, c) => sum + (c.estimatedPages ?? 5), 0);
    const frontPages = 4; // title, dedication, acknowledgments, ToC
    const backPages = Math.ceil(book.bibliography.length / 10) + 3; // glossary, resources, index
    return frontPages + chapterPages + backPages;
  }
}
