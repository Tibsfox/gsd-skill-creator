/**
 * Tests for the Heritage Book Template module.
 *
 * Validates chapter templates, front matter, back matter, book creation,
 * chapter ordering, attribution templates, and cultural sovereignty compliance.
 *
 * @module heritage-skills-pack/project-builder/heritage-book-template/heritage-book-template.test
 */

import { describe, it, expect } from 'vitest';

import {
  getChapterTemplates,
  getChapterTemplate,
  getAttributionTemplates,
  getAttributionTemplate,
  getFrontMatterTemplate,
  getBackMatterTemplate,
  createFrontMatter,
  createBackMatter,
  createAttribution,
  createHeritageBook,
  addChapter,
} from './index.js';

import type { HeritageChapter } from '../../shared/types.js';
import { Tradition } from '../../shared/types.js';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeChapter(overrides: Partial<HeritageChapter> = {}): HeritageChapter {
  return {
    order: 1,
    title: 'Test Chapter',
    tradition: Tradition.APPALACHIAN,
    contentType: 'skill-documentation',
    estimatedPages: 8,
    ...overrides,
  };
}

// ─── describe: getChapterTemplates ───────────────────────────────────────────

describe('Heritage Book Template', () => {
  describe('getChapterTemplates', () => {
    it('should return exactly 6 chapter templates', () => {
      const templates = getChapterTemplates();
      expect(templates).toHaveLength(6);
    });

    it('should include skill-documentation contentType', () => {
      const templates = getChapterTemplates();
      expect(templates.some(t => t.contentType === 'skill-documentation')).toBe(true);
    });

    it('should include interview-transcript contentType', () => {
      const templates = getChapterTemplates();
      expect(templates.some(t => t.contentType === 'interview-transcript')).toBe(true);
    });

    it('should include photo-essay contentType', () => {
      const templates = getChapterTemplates();
      expect(templates.some(t => t.contentType === 'photo-essay')).toBe(true);
    });

    it('should include cultural-context contentType', () => {
      const templates = getChapterTemplates();
      expect(templates.some(t => t.contentType === 'cultural-context')).toBe(true);
    });

    it('should include how-to-guide contentType', () => {
      const templates = getChapterTemplates();
      expect(templates.some(t => t.contentType === 'how-to-guide')).toBe(true);
    });

    it('should include ontological-bridge contentType', () => {
      const templates = getChapterTemplates();
      expect(templates.some(t => t.contentType === 'ontological-bridge')).toBe(true);
    });

    it('should flag interview-transcript with ocapReviewRequired=true', () => {
      const templates = getChapterTemplates();
      const interviewTemplate = templates.find(t => t.contentType === 'interview-transcript');
      expect(interviewTemplate).toBeDefined();
      expect(interviewTemplate!.ocapReviewRequired).toBe(true);
    });

    it('should have culturalAttributionRequired=true on all 6 templates', () => {
      const templates = getChapterTemplates();
      const allRequireAttribution = templates.every(t => t.culturalAttributionRequired === true);
      expect(allRequireAttribution).toBe(true);
    });

    it('should throw for unknown contentType via getChapterTemplate', () => {
      expect(() =>
        getChapterTemplate('not-a-valid-type' as HeritageChapter['contentType'])
      ).toThrow(/unknown contentType/i);
    });

    it('should return correct template for ontological-bridge via getChapterTemplate', () => {
      const template = getChapterTemplate('ontological-bridge');
      expect(template.contentType).toBe('ontological-bridge');
      expect(template.guidanceNotes).toContain('epistemological tension');
    });
  });

  // ─── describe: getFrontMatterTemplate and createFrontMatter ───────────────

  describe('getFrontMatterTemplate and createFrontMatter', () => {
    it('should return non-empty culturalSovereigntyStatement', () => {
      const fm = getFrontMatterTemplate();
      expect(typeof fm.culturalSovereigntyStatement).toBe('string');
      expect(fm.culturalSovereigntyStatement.length).toBeGreaterThan(50);
    });

    it('should reference OCAP in culturalSovereigntyStatement', () => {
      const fm = getFrontMatterTemplate();
      expect(fm.culturalSovereigntyStatement).toContain('OCAP');
    });

    it('should reference NISR in culturalSovereigntyStatement', () => {
      const fm = getFrontMatterTemplate();
      expect(fm.culturalSovereigntyStatement).toContain('NISR');
    });

    it('should include [NATION_NAME] placeholder in territorialAcknowledgment', () => {
      const fm = getFrontMatterTemplate();
      expect(fm.territorialAcknowledgment).toContain('[NATION_NAME]');
    });

    it('should include [TERRITORY_NAME] placeholder in territorialAcknowledgment', () => {
      const fm = getFrontMatterTemplate();
      expect(fm.territorialAcknowledgment).toContain('[TERRITORY_NAME]');
    });

    it('should substitute book title and author name in createFrontMatter', () => {
      const fm = createFrontMatter('Appalachian Basketry Heritage Book', 'Margaret Caldwell');
      expect(fm.titlePage).toContain('Appalachian Basketry Heritage Book');
      expect(fm.titlePage).toContain('Margaret Caldwell');
    });

    it('should set tableOfContents=true in template', () => {
      const fm = getFrontMatterTemplate();
      expect(fm.tableOfContents).toBe(true);
    });

    it('should preserve territorialAcknowledgment in createFrontMatter output', () => {
      const fm = createFrontMatter('Test Book', 'Test Author');
      expect(fm.territorialAcknowledgment).toContain('[NATION_NAME]');
    });
  });

  // ─── describe: getBackMatterTemplate and createBackMatter ─────────────────

  describe('getBackMatterTemplate and createBackMatter', () => {
    it('should include Inuktitut syllabics (ᐃᓄᒃᑎᑐᑦ) as a glossary key', () => {
      const bm = getBackMatterTemplate();
      const glossaryJson = JSON.stringify(bm.glossary);
      expect(glossaryJson).toContain('ᐃᓄᒃᑎᑐᑦ');
    });

    it('should include Anishinaabemowin in the glossary', () => {
      const bm = getBackMatterTemplate();
      const glossaryKeys = Object.keys(bm.glossary ?? {});
      expect(glossaryKeys.some(k => k.includes('Anishinaabemowin'))).toBe(true);
    });

    it('should include at least one Appalachian dialect term in the glossary', () => {
      const bm = getBackMatterTemplate();
      const glossaryKeys = Object.keys(bm.glossary ?? {});
      // 'corn pone' is the Appalachian dialect term
      expect(glossaryKeys.some(k => k.toLowerCase().includes('corn pone'))).toBe(true);
    });

    it('should have non-empty fairUseNotice', () => {
      const bm = getBackMatterTemplate();
      expect(typeof bm.fairUseNotice).toBe('string');
      expect(bm.fairUseNotice.length).toBeGreaterThan(50);
    });

    it('should have resourceDirectory with at least 5 entries', () => {
      const bm = getBackMatterTemplate();
      expect(Array.isArray(bm.resourceDirectory)).toBe(true);
      expect((bm.resourceDirectory ?? []).length).toBeGreaterThanOrEqual(5);
    });

    it('should include fnigc.ca in resourceDirectory', () => {
      const bm = getBackMatterTemplate();
      const dirJson = JSON.stringify(bm.resourceDirectory ?? []);
      expect(dirJson).toContain('fnigc.ca');
    });

    it('should include foxfire.org in resourceDirectory', () => {
      const bm = getBackMatterTemplate();
      const dirJson = JSON.stringify(bm.resourceDirectory ?? []);
      expect(dirJson).toContain('foxfire.org');
    });

    it('should have index=true in back matter template', () => {
      const bm = getBackMatterTemplate();
      expect(bm.index).toBe(true);
    });

    it('should return back matter from createBackMatter with same glossary as template', () => {
      const template = getBackMatterTemplate();
      const created = createBackMatter();
      expect(JSON.stringify(created.glossary)).toBe(JSON.stringify(template.glossary));
    });
  });

  // ─── describe: createHeritageBook and addChapter ──────────────────────────

  describe('createHeritageBook and addChapter', () => {
    it('should create a HeritageBook with the correct id and title', () => {
      const book = createHeritageBook({
        id: 'test-heritage-book-001',
        title: 'Appalachian Weaving Heritage',
        authorName: 'Clara Hensley',
        traditions: [Tradition.APPALACHIAN],
      });
      expect(book.id).toBe('test-heritage-book-001');
      expect(book.title).toBe('Appalachian Weaving Heritage');
    });

    it('should start with empty chapters array', () => {
      const book = createHeritageBook({
        id: 'test-book',
        title: 'Test Book',
        authorName: 'Test Author',
        traditions: [Tradition.APPALACHIAN],
      });
      expect(book.chapters).toHaveLength(0);
    });

    it('should start with empty attributions array', () => {
      const book = createHeritageBook({
        id: 'test-book',
        title: 'Test Book',
        authorName: 'Test Author',
        traditions: [Tradition.APPALACHIAN],
      });
      expect(book.attributions).toHaveLength(0);
    });

    it('should have frontMatter.culturalSovereigntyStatement populated', () => {
      const book = createHeritageBook({
        id: 'test-book',
        title: 'Test Book',
        authorName: 'Test Author',
        traditions: [Tradition.APPALACHIAN],
      });
      expect(book.frontMatter.culturalSovereigntyStatement.length).toBeGreaterThan(50);
    });

    it('should have correct traditions in the book', () => {
      const book = createHeritageBook({
        id: 'test-book',
        title: 'Test Book',
        authorName: 'Test Author',
        traditions: [Tradition.FIRST_NATIONS, Tradition.INUIT],
      });
      expect(book.traditions).toContain(Tradition.FIRST_NATIONS);
      expect(book.traditions).toContain(Tradition.INUIT);
    });

    it('should add chapter with order=1 when first chapter added', () => {
      const book = createHeritageBook({
        id: 'test-book',
        title: 'Test Book',
        authorName: 'Test Author',
        traditions: [Tradition.APPALACHIAN],
      });
      const updated = addChapter(book, makeChapter({ contentType: 'skill-documentation' }));
      expect(updated.chapters).toHaveLength(1);
      expect(updated.chapters[0]!.order).toBe(1);
    });

    it('should add chapter with order=2 when second chapter added', () => {
      let book = createHeritageBook({
        id: 'test-book',
        title: 'Test Book',
        authorName: 'Test Author',
        traditions: [Tradition.APPALACHIAN],
      });
      book = addChapter(book, makeChapter({ contentType: 'skill-documentation' }));
      book = addChapter(book, makeChapter({ contentType: 'interview-transcript' }));
      expect(book.chapters).toHaveLength(2);
      expect(book.chapters[1]!.order).toBe(2);
    });

    it('should not mutate original book when adding chapter', () => {
      const book = createHeritageBook({
        id: 'test-book',
        title: 'Test Book',
        authorName: 'Test Author',
        traditions: [Tradition.APPALACHIAN],
      });
      const updated = addChapter(book, makeChapter());
      expect(book.chapters).toHaveLength(0);
      expect(updated.chapters).toHaveLength(1);
    });

    it('should substitute title in frontMatter.titlePage', () => {
      const book = createHeritageBook({
        id: 'test-book',
        title: 'Inuit Qajaq Heritage',
        authorName: 'James Iqaluk',
        traditions: [Tradition.INUIT],
      });
      expect(book.frontMatter.titlePage).toContain('Inuit Qajaq Heritage');
      expect(book.frontMatter.titlePage).toContain('James Iqaluk');
    });

    it('should have empty bibliography when no rooms provided', () => {
      const book = createHeritageBook({
        id: 'test-book',
        title: 'Test Book',
        authorName: 'Test Author',
        traditions: [Tradition.APPALACHIAN],
      });
      expect(book.bibliography).toHaveLength(0);
    });
  });

  // ─── describe: getAttributionTemplates ───────────────────────────────────

  describe('getAttributionTemplates', () => {
    it('should return exactly 5 attribution type templates', () => {
      const templates = getAttributionTemplates();
      expect(templates).toHaveLength(5);
    });

    it('should include elder template with requiredFields containing nation', () => {
      const elderTemplate = getAttributionTemplates().find(t => t.type === 'elder');
      expect(elderTemplate).toBeDefined();
      expect(elderTemplate!.requiredFields).toContain('nation');
    });

    it('should include community template with OCAP in consentRequirements', () => {
      const communityTemplate = getAttributionTemplates().find(t => t.type === 'community');
      expect(communityTemplate).toBeDefined();
      expect(communityTemplate!.consentRequirements).toContain('OCAP');
    });

    it('should include institution template', () => {
      const templates = getAttributionTemplates();
      expect(templates.some(t => t.type === 'institution')).toBe(true);
    });

    it('should include author template', () => {
      const templates = getAttributionTemplates();
      expect(templates.some(t => t.type === 'author')).toBe(true);
    });

    it('should include tradition-bearer template', () => {
      const templates = getAttributionTemplates();
      expect(templates.some(t => t.type === 'tradition-bearer')).toBe(true);
    });

    it('should have nation in elder exampleAttribution', () => {
      const elderTemplate = getAttributionTemplates().find(t => t.type === 'elder');
      expect(elderTemplate!.exampleAttribution.nation).toBeDefined();
      // Must be nation-specific, not generic
      const nation = elderTemplate!.exampleAttribution.nation ?? '';
      expect(nation).not.toBe('Indigenous elder');
      expect(nation.length).toBeGreaterThan(0);
    });

    it('should not use generic "Indigenous" without nation-specific modifier in example attributions', () => {
      const templates = getAttributionTemplates();
      const allExamples = JSON.stringify(templates.map(t => t.exampleAttribution));
      // Check that no example uses bare "Indigenous" as a name value
      expect(allExamples).not.toMatch(/"name":\s*"Indigenous"/);
    });

    it('should throw for unknown attribution type via getAttributionTemplate', () => {
      expect(() =>
        getAttributionTemplate('not-a-valid-type' as Attribution['type'])
      ).toThrow(/unknown attribution type/i);
    });

    it('should create a valid attribution via createAttribution', () => {
      const attr = createAttribution('elder', {
        name: 'Pitseolak Iqaluk',
        nation: 'Inuit (Nunavut, Kivalliq region)',
        role: 'Knowledge keeper',
        consent: 'documented',
      });
      expect(attr.type).toBe('elder');
      expect(attr.name).toBe('Pitseolak Iqaluk');
      expect(attr.nation).toBe('Inuit (Nunavut, Kivalliq region)');
      expect(attr.consent).toBe('documented');
    });
  });
});

// ─── Import type for test ─────────────────────────────────────────────────────
import type { Attribution } from '../../shared/types.js';
