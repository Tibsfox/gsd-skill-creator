/**
 * Export Pipeline — Heritage Book export to docx and pdf formats.
 *
 * Provides structural validation, syllabics encoding validation,
 * territorial acknowledgment injection checking, and bibliography
 * with Fair Use notices.
 *
 * Export generation is stubbed pending external library integration.
 *
 * @module heritage-skills-pack/project-builder/export
 */

import type { HeritageBook } from '../../shared/types.js';
import { DocxExporter } from './docx-exporter.js';
import { PdfExporter } from './pdf-exporter.js';
import { SyllabicsRenderer } from './syllabics-renderer.js';

export { DocxExporter } from './docx-exporter.js';
export { PdfExporter } from './pdf-exporter.js';
export { SyllabicsRenderer } from './syllabics-renderer.js';
export type {
  ExportResult,
  ExportValidationResult,
  ExportManifest,
} from './docx-exporter.js';
export type {
  SyllabicsValidationResult,
  SyllabicRange,
  SyllabicsUnicodeBlock,
} from './syllabics-renderer.js';

export type ExportFormat = 'docx' | 'pdf';

export interface ExportReadinessResult {
  isReady: boolean;
  structuralErrors: string[];
  structuralWarnings: string[];
  syllabicsValid: boolean;
  syllabicsIssues: string[];
  manifest: import('./docx-exporter.js').ExportManifest;
}

/**
 * Validate that a Heritage Book is ready for export.
 * Runs structural validation and syllabics encoding checks.
 */
export function validateExportReadiness(book: HeritageBook): ExportReadinessResult {
  const docxExporter = new DocxExporter();
  const renderer = new SyllabicsRenderer();

  const structural = docxExporter.validateStructure(book);
  const manifest = docxExporter.generateManifest(book);

  // Collect all text for syllabics validation
  const allText = [
    book.title,
    book.frontMatter.culturalSovereigntyStatement,
    book.frontMatter.territorialAcknowledgment ?? '',
    ...Object.keys(book.backMatter.glossary ?? {}),
    ...Object.values(book.backMatter.glossary ?? {}),
    ...book.chapters.map((c) => c.title),
  ].join(' ');

  const syllabicsResult = renderer.containsSyllabics(allText)
    ? renderer.validateSyllabicEncoding(allText)
    : { isValid: true, issues: [] };

  return {
    isReady: structural.isValid && syllabicsResult.isValid,
    structuralErrors: structural.errors,
    structuralWarnings: structural.warnings,
    syllabicsValid: syllabicsResult.isValid,
    syllabicsIssues: syllabicsResult.issues,
    manifest,
  };
}

/**
 * Export a Heritage Book to the specified format.
 *
 * @param book - The HeritageBook to export.
 * @param format - 'docx' or 'pdf'.
 * @returns ExportResult with manifest and stub status.
 */
export function exportBook(book: HeritageBook, format: ExportFormat): import('./docx-exporter.js').ExportResult {
  switch (format) {
    case 'docx':
      return new DocxExporter().export(book);
    case 'pdf':
      return new PdfExporter().export(book);
  }
}
