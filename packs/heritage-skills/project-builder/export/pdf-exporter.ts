/**
 * PdfExporter — structural validation and manifest generation for Heritage Book
 * pdf export. Full document generation is stubbed (requires external library).
 *
 * @module heritage-skills-pack/project-builder/export/pdf-exporter
 */

import type { HeritageBook } from '../../shared/types.js';
import { DocxExporter } from './docx-exporter.js';
import type { ExportValidationResult, ExportManifest, ExportResult } from './docx-exporter.js';
import { SyllabicsRenderer } from './syllabics-renderer.js';

export class PdfExporter {
  private docxExporter: DocxExporter;

  constructor(renderer?: SyllabicsRenderer) {
    this.docxExporter = new DocxExporter(renderer);
  }

  /**
   * Validate that the HeritageBook is ready for PDF export.
   * Uses the same structural validation as DocxExporter.
   */
  validateStructure(book: HeritageBook): ExportValidationResult {
    return this.docxExporter.validateStructure(book);
  }

  /**
   * Generate an export manifest describing the Heritage Book's content.
   */
  generateManifest(book: HeritageBook): ExportManifest {
    return this.docxExporter.generateManifest(book);
  }

  /**
   * Export the Heritage Book to pdf format.
   * Currently a structural stub — validates structure and returns manifest.
   * Full pdf generation requires an external library (e.g., pdfkit or puppeteer).
   */
  export(book: HeritageBook): ExportResult {
    const validation = this.validateStructure(book);
    const manifest = this.generateManifest(book);

    return {
      format: 'pdf',
      status: 'stub',
      note: 'Full PDF generation requires external library (e.g., pdfkit or puppeteer). Structural validation and manifest generation are functional. Syllabics encoding validated.',
      manifest,
      errors: validation.errors.length > 0 ? validation.errors : undefined,
    };
  }
}
