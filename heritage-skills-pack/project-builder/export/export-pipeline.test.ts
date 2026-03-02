/**
 * Tests for the Export Pipeline module.
 *
 * Validates SyllabicsRenderer Unicode detection, DocxExporter structural
 * validation, ExportManifest generation, format routing, and
 * validateExportReadiness combined checks.
 *
 * @module heritage-skills-pack/project-builder/export/export-pipeline.test
 */

import { describe, it, expect } from 'vitest';

import {
  SyllabicsRenderer,
  DocxExporter,
  PdfExporter,
  exportBook,
  validateExportReadiness,
} from './index.js';

import type { HeritageBook } from '../../shared/types.js';
import { Tradition } from '../../shared/types.js';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeBook(overrides?: Partial<HeritageBook>): HeritageBook {
  return {
    id: 'test-book-01',
    title: 'Appalachian Craft Heritage',
    traditions: [Tradition.APPALACHIAN],
    chapters: [
      {
        order: 1,
        title: 'Basket Weaving',
        tradition: Tradition.APPALACHIAN,
        contentType: 'skill-documentation',
        estimatedPages: 8,
      },
    ],
    frontMatter: {
      titlePage: 'Appalachian Craft Heritage\nBy Test Author',
      tableOfContents: true,
      culturalSovereigntyStatement:
        'Knowledge in this book belongs to its community sources.',
      territorialAcknowledgment:
        'We acknowledge the traditional territory of the Cherokee Nation.',
    },
    backMatter: {
      fairUseNotice: 'Content used under fair use for educational purposes.',
      glossary: { 'corn pone': 'Cornbread without eggs, baked in cast iron.' },
    },
    bibliography: [],
    attributions: [],
    ...overrides,
  };
}

// ─── describe: Export Pipeline ────────────────────────────────────────────────

describe('Export Pipeline', () => {
  // ─── SyllabicsRenderer ──────────────────────────────────────────────────────

  describe('SyllabicsRenderer', () => {
    const renderer = new SyllabicsRenderer();

    it('should detect Inuktitut syllabics (ᐃᓄᒃᑎᑐᑦ) with containsSyllabics', () => {
      expect(renderer.containsSyllabics('ᐃᓄᒃᑎᑐᑦ')).toBe(true);
    });

    it('should return false for Latin text with containsSyllabics', () => {
      expect(renderer.containsSyllabics('Basket Weaving Appalachian')).toBe(false);
    });

    it('should return false for empty string with containsSyllabics', () => {
      expect(renderer.containsSyllabics('')).toBe(false);
    });

    it('should extract syllabic ranges from mixed text', () => {
      const text = 'Pilimmaksarniq (ᐱᓕᒻᒪᒃᓴᕐᓂᖅ) is IQ-05';
      const ranges = renderer.extractSyllabicRanges(text);
      expect(ranges).toHaveLength(1);
      expect(ranges[0].text).toBe('ᐱᓕᒻᒪᒃᓴᕐᓂᖅ');
    });

    it('should return empty ranges for Latin-only text', () => {
      const ranges = renderer.extractSyllabicRanges('No syllabics here');
      expect(ranges).toHaveLength(0);
    });

    it('should return range with correct start and end indices', () => {
      const text = 'Hello ᐃᓄᒃ World';
      const ranges = renderer.extractSyllabicRanges(text);
      expect(ranges).toHaveLength(1);
      expect(ranges[0].start).toBe(6);
      expect(text.slice(ranges[0].start, ranges[0].end)).toBe(ranges[0].text);
    });

    it('should wrap syllabics in <span lang="iu"> with renderSyllabicsAnnotation', () => {
      const result = renderer.renderSyllabicsAnnotation('ᐃᓄᒃᑎᑐᑦ');
      expect(result).toContain('<span lang="iu" dir="ltr" class="inuktitut-syllabics">');
      expect(result).toContain('</span>');
      expect(result).toContain('ᐃᓄᒃᑎᑐᑦ');
    });

    it('should preserve surrounding Latin text in rendered output', () => {
      const result = renderer.renderSyllabicsAnnotation('Pilimmaksarniq (ᐱᓕᒻᒪᒃᓴᕐᓂᖅ) is IQ-05');
      expect(result).toContain('Pilimmaksarniq (');
      expect(result).toContain(') is IQ-05');
      expect(result).toContain('<span lang="iu" dir="ltr" class="inuktitut-syllabics">ᐱᓕᒻᒪᒃᓴᕐᓂᖅ</span>');
    });

    it('should return original text unchanged when no syllabics present', () => {
      const text = 'No syllabics in this text';
      expect(renderer.renderSyllabicsAnnotation(text)).toBe(text);
    });

    it('should return isValid=true for properly encoded syllabics', () => {
      const result = renderer.validateSyllabicEncoding('ᐃᓄᒃᑎᑐᑦ is Inuktitut');
      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should return isValid=false with issue for replacement character U+FFFD', () => {
      const result = renderer.validateSyllabicEncoding('ᐃᓄ\uFFFDᑎᑐᑦ');
      expect(result.isValid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues[0]).toContain('U+FFFD');
    });

    it('should return both Unicode block definitions from getSyllabicsUnicodeBlocks', () => {
      const blocks = renderer.getSyllabicsUnicodeBlocks();
      expect(blocks).toHaveLength(2);
      expect(blocks[0].name).toBe('Unified Canadian Aboriginal Syllabics');
      expect(blocks[0].start).toBe(0x1400);
      expect(blocks[0].end).toBe(0x167f);
      expect(blocks[1].name).toBe('Unified Canadian Aboriginal Syllabics Extended');
      expect(blocks[1].start).toBe(0x18b0);
      expect(blocks[1].end).toBe(0x18ff);
    });
  });

  // ─── DocxExporter structural validation ────────────────────────────────────

  describe('DocxExporter structural validation', () => {
    const exporter = new DocxExporter();

    it('should return isValid=true for a well-formed book', () => {
      const result = exporter.validateStructure(makeBook());
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return isValid=false when title is empty', () => {
      const book = makeBook({ title: '' });
      const result = exporter.validateStructure(book);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.toLowerCase().includes('title'))).toBe(true);
    });

    it('should return isValid=false when title is whitespace only', () => {
      const book = makeBook({ title: '   ' });
      const result = exporter.validateStructure(book);
      expect(result.isValid).toBe(false);
    });

    it('should return isValid=false when culturalSovereigntyStatement is empty', () => {
      const book = makeBook({
        frontMatter: {
          ...makeBook().frontMatter,
          culturalSovereigntyStatement: '',
        },
      });
      const result = exporter.validateStructure(book);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.toLowerCase().includes('sovereignty'))).toBe(true);
    });

    it('should return isValid=false when chapters array is empty', () => {
      const book = makeBook({ chapters: [] });
      const result = exporter.validateStructure(book);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.toLowerCase().includes('chapter'))).toBe(true);
    });

    it('should include warning for missing bibliography on Inuit tradition book', () => {
      const book = makeBook({ traditions: [Tradition.INUIT], bibliography: [] });
      const result = exporter.validateStructure(book);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some((w) => w.toLowerCase().includes('bibliography'))).toBe(true);
    });

    it('should include warning for missing territorial acknowledgment on First Nations book', () => {
      const book = makeBook({
        traditions: [Tradition.FIRST_NATIONS],
        frontMatter: {
          ...makeBook().frontMatter,
          territorialAcknowledgment: undefined,
        },
      });
      const result = exporter.validateStructure(book);
      expect(result.warnings.some((w) => w.toLowerCase().includes('territorial'))).toBe(true);
    });

    it('should not require bibliography warning for Appalachian-only book', () => {
      const book = makeBook({ traditions: [Tradition.APPALACHIAN], bibliography: [] });
      const result = exporter.validateStructure(book);
      expect(result.warnings.some((w) => w.toLowerCase().includes('bibliography'))).toBe(false);
    });

    it('should return syllabics encoding error when replacement character present in book text', () => {
      const book = makeBook({
        frontMatter: {
          ...makeBook().frontMatter,
          culturalSovereigntyStatement: 'ᐃᓄ\uFFFDᑎᑐᑦ sovereignty statement',
        },
      });
      const result = exporter.validateStructure(book);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.toLowerCase().includes('syllabics'))).toBe(true);
    });
  });

  // ─── ExportManifest generation ──────────────────────────────────────────────

  describe('ExportManifest generation', () => {
    const exporter = new DocxExporter();

    it('should report chapterCount=1 for single-chapter book', () => {
      const manifest = exporter.generateManifest(makeBook());
      expect(manifest.chapterCount).toBe(1);
    });

    it('should report hasSyllabics=false for Latin-only book', () => {
      const manifest = exporter.generateManifest(makeBook());
      expect(manifest.hasSyllabics).toBe(false);
    });

    it('should report hasSyllabics=true when glossary contains ᐃᓄᒃᑎᑐᑦ', () => {
      const book = makeBook({
        backMatter: {
          fairUseNotice: 'Fair use.',
          glossary: { 'ᐃᓄᒃᑎᑐᑦ': 'Inuktitut — the Inuit language.' },
        },
      });
      const manifest = exporter.generateManifest(book);
      expect(manifest.hasSyllabics).toBe(true);
    });

    it('should report hasTerritorialAcknowledgment=true when frontMatter includes one', () => {
      const manifest = exporter.generateManifest(makeBook());
      expect(manifest.hasTerritorialAcknowledgment).toBe(true);
    });

    it('should report hasTerritorialAcknowledgment=false when frontMatter does not include one', () => {
      const book = makeBook({
        frontMatter: {
          ...makeBook().frontMatter,
          territorialAcknowledgment: undefined,
        },
      });
      const manifest = exporter.generateManifest(book);
      expect(manifest.hasTerritorialAcknowledgment).toBe(false);
    });

    it('should report culturalSovereigntyStatementPresent=true for valid book', () => {
      const manifest = exporter.generateManifest(makeBook());
      expect(manifest.culturalSovereigntyStatementPresent).toBe(true);
    });

    it('should report bibliographyEntryCount matching bibliography length', () => {
      const book = makeBook({
        bibliography: [
          {
            id: 'bib-01',
            citation: 'Test Author (2025). Test Book.',
            fairUseNotice: 'Used for educational purposes.',
            creatorFirstLink: 'https://example.com',
            isIndigenousSource: false,
          },
          {
            id: 'bib-02',
            citation: 'Another Author (2024). Another Book.',
            fairUseNotice: 'Used for educational purposes.',
            creatorFirstLink: 'https://example2.com',
            isIndigenousSource: false,
          },
        ],
      });
      const manifest = exporter.generateManifest(book);
      expect(manifest.bibliographyEntryCount).toBe(2);
    });

    it('should compute positive estimatedPages value', () => {
      const manifest = exporter.generateManifest(makeBook());
      expect(manifest.estimatedPages).toBeGreaterThan(0);
    });

    it('should report traditionsRepresented containing the book traditions', () => {
      const manifest = exporter.generateManifest(makeBook());
      expect(manifest.traditionsRepresented).toContain(Tradition.APPALACHIAN);
    });
  });

  // ─── exportBook format routing ──────────────────────────────────────────────

  describe('exportBook format routing', () => {
    it('should return format=docx for exportBook(book, "docx")', () => {
      const result = exportBook(makeBook(), 'docx');
      expect(result.format).toBe('docx');
    });

    it('should return format=pdf for exportBook(book, "pdf")', () => {
      const result = exportBook(makeBook(), 'pdf');
      expect(result.format).toBe('pdf');
    });

    it('should return status=stub for docx format', () => {
      const result = exportBook(makeBook(), 'docx');
      expect(result.status).toBe('stub');
    });

    it('should return status=stub for pdf format', () => {
      const result = exportBook(makeBook(), 'pdf');
      expect(result.status).toBe('stub');
    });

    it('should include manifest in ExportResult for docx format', () => {
      const result = exportBook(makeBook(), 'docx');
      expect(result.manifest).toBeDefined();
      expect(result.manifest.title).toBe('Appalachian Craft Heritage');
    });

    it('should include manifest in ExportResult for pdf format', () => {
      const result = exportBook(makeBook(), 'pdf');
      expect(result.manifest).toBeDefined();
      expect(result.manifest.chapterCount).toBe(1);
    });

    it('should include a note string for both formats', () => {
      const docxResult = exportBook(makeBook(), 'docx');
      const pdfResult = exportBook(makeBook(), 'pdf');
      expect(typeof docxResult.note).toBe('string');
      expect(docxResult.note.length).toBeGreaterThan(0);
      expect(typeof pdfResult.note).toBe('string');
      expect(pdfResult.note.length).toBeGreaterThan(0);
    });

    it('should not include errors field for a valid book', () => {
      const result = exportBook(makeBook(), 'docx');
      expect(result.errors).toBeUndefined();
    });

    it('should include errors field for an invalid book in docx export', () => {
      const result = exportBook(makeBook({ title: '' }), 'docx');
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });
  });

  // ─── validateExportReadiness ────────────────────────────────────────────────

  describe('validateExportReadiness', () => {
    it('should return isReady=true for a well-formed Appalachian book', () => {
      const result = validateExportReadiness(makeBook());
      expect(result.isReady).toBe(true);
    });

    it('should return isReady=false when book has no chapters', () => {
      const result = validateExportReadiness(makeBook({ chapters: [] }));
      expect(result.isReady).toBe(false);
      expect(result.structuralErrors.some((e) => e.toLowerCase().includes('chapter'))).toBe(true);
    });

    it('should return isReady=false when book has empty culturalSovereigntyStatement', () => {
      const book = makeBook({
        frontMatter: {
          ...makeBook().frontMatter,
          culturalSovereigntyStatement: '',
        },
      });
      const result = validateExportReadiness(book);
      expect(result.isReady).toBe(false);
    });

    it('should return syllabicsValid=true when no syllabics in book', () => {
      const result = validateExportReadiness(makeBook());
      expect(result.syllabicsValid).toBe(true);
      expect(result.syllabicsIssues).toHaveLength(0);
    });

    it('should return syllabicsIssues with content when syllabics contains replacement character', () => {
      const book = makeBook({
        frontMatter: {
          ...makeBook().frontMatter,
          culturalSovereigntyStatement: 'ᐃᓄ\uFFFDᑎᑐᑦ',
        },
      });
      // The docxExporter.collectAllText includes culturalSovereigntyStatement
      // but validateExportReadiness only scans specific fields for syllabics
      // We use the glossary to inject corrupted syllabics into the scanned text
      const bookWithCorruptGlossary = makeBook({
        backMatter: {
          fairUseNotice: 'Fair use.',
          glossary: { 'ᐃᓄ\uFFFDᑎᑐᑦ': 'Corrupted syllabics entry' },
        },
      });
      const result = validateExportReadiness(bookWithCorruptGlossary);
      expect(result.syllabicsValid).toBe(false);
      expect(result.syllabicsIssues.length).toBeGreaterThan(0);
    });

    it('should return manifest in readiness result', () => {
      const result = validateExportReadiness(makeBook());
      expect(result.manifest).toBeDefined();
      expect(result.manifest.title).toBe('Appalachian Craft Heritage');
    });

    it('should populate structuralWarnings for Inuit book without bibliography', () => {
      const book = makeBook({ traditions: [Tradition.INUIT], bibliography: [] });
      const result = validateExportReadiness(book);
      expect(result.structuralWarnings.length).toBeGreaterThan(0);
    });

    it('should return empty structuralErrors for valid book', () => {
      const result = validateExportReadiness(makeBook());
      expect(result.structuralErrors).toHaveLength(0);
    });
  });

  // ─── PdfExporter direct ────────────────────────────────────────────────────

  describe('PdfExporter direct', () => {
    const pdfExporter = new PdfExporter();

    it('should return format=pdf from PdfExporter.export()', () => {
      const result = pdfExporter.export(makeBook());
      expect(result.format).toBe('pdf');
    });

    it('should return isValid=true from PdfExporter.validateStructure for valid book', () => {
      const result = pdfExporter.validateStructure(makeBook());
      expect(result.isValid).toBe(true);
    });

    it('should return manifest from PdfExporter.generateManifest', () => {
      const manifest = pdfExporter.generateManifest(makeBook());
      expect(manifest.chapterCount).toBe(1);
      expect(manifest.title).toBe('Appalachian Craft Heritage');
    });
  });
});
