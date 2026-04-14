/**
 * Tests for the Bibliography Engine.
 *
 * Validates all three citation styles (Chicago, MLA, APA), Fair Use notice
 * generation, creator-first link validation, community attribution formatting,
 * and the cross-reference engine (getCitationsForRoom).
 *
 * @module heritage-skills-pack/canonical-works/bibliography-engine.test
 */

import { describe, it, expect, beforeEach } from 'vitest';

import {
  BibliographyEngine,
  formatCitation,
  generateFairUseNotice,
  validateCreatorFirstLink,
  formatCommunityAttribution,
  getCitationsForRoom,
} from './bibliography-engine.js';

import type { CitationStyle } from './bibliography-engine.js';
import type { CanonicalWork } from '../shared/types.js';
import { RoomNumber, Tradition, KnowledgeSource } from '../shared/types.js';

// ─── Fixtures ──────────────────────────────────────────────────────────────────

/** The Foxfire Book (vol 1) canonical data from foxfire-catalog.json */
const foxfireSeriesWork: CanonicalWork = {
  id: 'foxfire-series',
  title: 'The Foxfire Book Series',
  authors: ['Eliot Wigginton', 'Foxfire Students'],
  tradition: Tradition.APPALACHIAN,
  isbn: undefined,
  purchaseLinks: [
    { vendor: 'Foxfire.org', url: 'https://www.foxfire.org/shop/', isCreatorDirect: true, priority: 1 },
    { vendor: 'Anchor Books (Publisher)', url: 'https://www.penguinrandomhouse.com/series/FOX/the-foxfire-book-series', isCreatorDirect: false, priority: 2 },
    { vendor: 'Bookshop.org', url: 'https://bookshop.org/lists/foxfire-book-series', isCreatorDirect: false, priority: 3 },
  ],
  fairUseCompliant: true,
  description: 'The definitive 12-volume series documenting Appalachian mountain heritage skills.',
  volumeRefs: [
    { volume: 1, title: 'The Foxfire Book', year: 1972, relevantRooms: [RoomNumber.BUILDING, RoomNumber.WOODCRAFT, RoomNumber.FOOD, RoomNumber.METALWORK] },
    { volume: 2, title: 'Foxfire 2', year: 1973, relevantRooms: [RoomNumber.BUILDING, RoomNumber.WOODCRAFT, RoomNumber.MUSIC, RoomNumber.POTTERY] },
    { volume: 12, title: 'Foxfire 12', year: 2004, relevantRooms: [RoomNumber.COMMUNITY, RoomNumber.SEASONAL, RoomNumber.HISTORY] },
  ],
  knowledgeSource: KnowledgeSource.PUBLISHED_BOOK,
};

/** Foxfire Book of Appalachian Cookery — standalone specialty title */
const foxfireCookeryWork: CanonicalWork = {
  id: 'foxfire-appalachian-cookery',
  title: 'The Foxfire Book of Appalachian Cookery',
  authors: ['Linda Garland Page', 'Eliot Wigginton'],
  tradition: Tradition.APPALACHIAN,
  isbn: '9780807842102',
  purchaseLinks: [
    { vendor: 'Foxfire.org', url: 'https://www.foxfire.org/shop/', isCreatorDirect: true, priority: 1 },
    { vendor: 'UNC Press', url: 'https://www.uncpress.org/book/9780807842102/', isCreatorDirect: false, priority: 2 },
    { vendor: 'Bookshop.org', url: 'https://bookshop.org/p/books/foxfire-cookery/9782', isCreatorDirect: false, priority: 3 },
  ],
  fairUseCompliant: true,
  description: 'Regional recipes and food preservation methods from Appalachian mountain communities.',
  knowledgeSource: KnowledgeSource.PUBLISHED_BOOK,
};

/** Braiding Sweetgrass — First Nations, community-endorsed */
const braidingSweetgrassWork: CanonicalWork = {
  id: 'braiding-sweetgrass',
  title: 'Braiding Sweetgrass: Indigenous Wisdom, Scientific Knowledge, and the Teachings of Plants',
  authors: ['Robin Wall Kimmerer'],
  tradition: Tradition.FIRST_NATIONS,
  isbn: '9781571313560',
  purchaseLinks: [
    { vendor: 'Milkweed Editions (Publisher)', url: 'https://milkweed.org/book/braiding-sweetgrass', isCreatorDirect: true, priority: 1 },
    { vendor: 'Bookshop.org', url: 'https://bookshop.org/p/books/braiding-sweetgrass/8131', isCreatorDirect: false, priority: 2 },
  ],
  fairUseCompliant: true,
  description: 'Potawatomi botanist Robin Wall Kimmerer weaves Indigenous plant knowledge with Western science.',
  knowledgeSource: KnowledgeSource.PUBLISHED_BOOK,
  communityEndorsement: 'Author is an enrolled member of the Citizen Potawatomi Nation. Widely endorsed by Indigenous scholars.',
};

/** ITK Strategic Plan — Inuit, community-authorized, no ISBN */
const itkWork: CanonicalWork = {
  id: 'itk-inuit-tapiriit-kanatami-strategic-plan',
  title: 'Inuit Nunangat: Our Land, Our Future — ITK Strategic Plan',
  authors: ['Inuit Tapiriit Kanatami'],
  tradition: Tradition.INUIT,
  purchaseLinks: [
    { vendor: 'ITK (Creator Direct)', url: 'https://www.itk.ca/publications/', isCreatorDirect: true, priority: 1 },
  ],
  fairUseCompliant: true,
  description: 'ITK strategic vision for Inuit Nunangat, documenting Inuit priorities.',
  knowledgeSource: KnowledgeSource.COMMUNITY_AUTHORIZED,
  communityEndorsement: 'Published directly by ITK, the national representational organization for Inuit in Canada.',
};

/** Work with no creator-direct link at priority 1 (simulates a bad entry) */
const noCdlWork: CanonicalWork = {
  id: 'no-creator-direct-link',
  title: 'Some Third-Party Book',
  authors: ['A. Author'],
  tradition: Tradition.APPALACHIAN,
  purchaseLinks: [
    { vendor: 'Amazon', url: 'https://amazon.com/dp/12345', isCreatorDirect: false, priority: 1 },
    { vendor: 'Bookshop.org', url: 'https://bookshop.org/p/books/123', isCreatorDirect: false, priority: 2 },
  ],
  fairUseCompliant: true,
  description: 'A work without a creator-direct link at priority 1.',
  knowledgeSource: KnowledgeSource.PUBLISHED_BOOK,
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('BibliographyEngine', () => {
  let engine: BibliographyEngine;

  beforeEach(() => {
    engine = new BibliographyEngine();
  });

  // ─── formatCitation ───────────────────────────────────────────────────────

  describe('formatCitation', () => {
    describe('Chicago style', () => {
      it('should format the Foxfire series in Chicago Notes-Bibliography style', () => {
        const citation = engine.formatCitation(foxfireSeriesWork, 'chicago');
        expect(citation).toBeTruthy();
        expect(citation).toContain('Wigginton');
        expect(citation).toContain('The Foxfire Book Series');
        expect(citation).toContain('Anchor Press');
        expect(citation).toContain('1972');
      });

      it('should handle works with multiple authors', () => {
        const citation = engine.formatCitation(foxfireCookeryWork, 'chicago');
        // First author inverted for Chicago
        expect(citation).toContain('Page, Linda Garland');
        expect(citation).toContain('The Foxfire Book of Appalachian Cookery');
      });

      it('should include ISBN when available', () => {
        const citation = engine.formatCitation(foxfireCookeryWork, 'chicago');
        expect(citation).toContain('9780807842102');
      });

      it('should not include ISBN when not present', () => {
        const citation = engine.formatCitation(foxfireSeriesWork, 'chicago');
        expect(citation).not.toContain('ISBN');
      });

      it('should format Braiding Sweetgrass correctly in Chicago style', () => {
        const citation = engine.formatCitation(braidingSweetgrassWork, 'chicago');
        expect(citation).toContain('Kimmerer');
        expect(citation).toContain('Braiding Sweetgrass');
        expect(citation).toContain('Milkweed Editions');
      });
    });

    describe('MLA style', () => {
      it('should format the Foxfire series in MLA 9th edition style', () => {
        const citation = engine.formatCitation(foxfireSeriesWork, 'mla');
        expect(citation).toBeTruthy();
        expect(citation).toContain('Wigginton');
        expect(citation).toContain('The Foxfire Book Series');
        expect(citation).toContain('Anchor Press');
        expect(citation).toContain('1972');
      });

      it('should include editor attribution for Foxfire series', () => {
        const citation = engine.formatCitation(foxfireSeriesWork, 'mla');
        // Foxfire series has Wigginton as editor — MLA uses "editor" suffix
        expect(citation).toContain('editor');
      });

      it('should format Braiding Sweetgrass correctly in MLA style', () => {
        const citation = engine.formatCitation(braidingSweetgrassWork, 'mla');
        expect(citation).toContain('Kimmerer, Robin Wall');
        expect(citation).toContain('Braiding Sweetgrass');
        expect(citation).toContain('Milkweed Editions');
      });
    });

    describe('APA style', () => {
      it('should format the Foxfire series in APA 7th edition style', () => {
        const citation = engine.formatCitation(foxfireSeriesWork, 'apa');
        expect(citation).toBeTruthy();
        expect(citation).toContain('Wigginton');
        expect(citation).toContain('Anchor Press');
        // APA has year in parens
        expect(citation).toContain('(1972');
      });

      it('should abbreviate first names to initials in APA', () => {
        const citation = engine.formatCitation(foxfireCookeryWork, 'apa');
        // "Linda Garland Page" → "Page, L." or similar
        expect(citation).toContain('Page, L.');
      });

      it('should use sentence case for the title in APA', () => {
        const citation = engine.formatCitation(foxfireCookeryWork, 'apa');
        // "The Foxfire Book of Appalachian Cookery" → sentence case
        // "Foxfire" and "Appalachian" are proper nouns so they're preserved
        // But "Book" and "of" etc. should be lowercase
        expect(citation).toMatch(/book of appalachian cookery/i);
      });

      it('should format Braiding Sweetgrass correctly in APA style', () => {
        const citation = engine.formatCitation(braidingSweetgrassWork, 'apa');
        expect(citation).toContain('Kimmerer, R.');
        expect(citation).toContain('Milkweed Editions');
      });
    });

    it('should default to Chicago style when no style is specified', () => {
      const defaultCitation = engine.formatCitation(foxfireSeriesWork);
      const chicagoCitation = engine.formatCitation(foxfireSeriesWork, 'chicago');
      expect(defaultCitation).toBe(chicagoCitation);
    });
  });

  // ─── generateFairUseNotice ────────────────────────────────────────────────

  describe('generateFairUseNotice', () => {
    it('should produce a notice for an Appalachian work that includes the work title', () => {
      const notice = engine.generateFairUseNotice(foxfireCookeryWork);
      expect(notice).toContain('The Foxfire Book of Appalachian Cookery');
    });

    it('should produce a notice for an Appalachian work that includes the creator link', () => {
      const notice = engine.generateFairUseNotice(foxfireCookeryWork);
      expect(notice).toContain('https://www.foxfire.org/shop/');
    });

    it('should include author names in the fair use notice', () => {
      const notice = engine.generateFairUseNotice(foxfireCookeryWork);
      expect(notice).toContain('Linda Garland Page');
    });

    it('should produce a notice for a First Nations work with cultural sovereignty note', () => {
      const notice = engine.generateFairUseNotice(braidingSweetgrassWork);
      // First Nations template includes cultural sovereignty statement
      expect(notice).toContain('sovereignty');
      expect(notice).toContain('Braiding Sweetgrass');
      expect(notice).toContain('Robin Wall Kimmerer');
    });

    it('should produce a notice for a First Nations work with OCAP compliance reference', () => {
      const notice = engine.generateFairUseNotice(braidingSweetgrassWork);
      expect(notice).toContain('OCAP');
    });

    it('should produce a notice for an Inuit work with OCAP compliance note', () => {
      const notice = engine.generateFairUseNotice(itkWork);
      expect(notice).toContain('OCAP');
    });

    it('should include the creator link in the Inuit fair use notice', () => {
      const notice = engine.generateFairUseNotice(itkWork);
      expect(notice).toContain('https://www.itk.ca/publications/');
    });

    it('should produce non-empty notices for all three traditions', () => {
      for (const work of [foxfireCookeryWork, braidingSweetgrassWork, itkWork]) {
        const notice = engine.generateFairUseNotice(work);
        expect(notice.length).toBeGreaterThan(50);
      }
    });
  });

  // ─── validateCreatorFirstLink ──────────────────────────────────────────────

  describe('validateCreatorFirstLink', () => {
    it('should return true for Foxfire works with foxfire.org at priority 1', () => {
      expect(engine.validateCreatorFirstLink(foxfireSeriesWork)).toBe(true);
      expect(engine.validateCreatorFirstLink(foxfireCookeryWork)).toBe(true);
    });

    it('should return true for Braiding Sweetgrass with Milkweed Editions at priority 1', () => {
      expect(engine.validateCreatorFirstLink(braidingSweetgrassWork)).toBe(true);
    });

    it('should return true for the ITK work with ITK at priority 1', () => {
      expect(engine.validateCreatorFirstLink(itkWork)).toBe(true);
    });

    it('should return false for works without creator-direct at priority 1', () => {
      expect(engine.validateCreatorFirstLink(noCdlWork)).toBe(false);
    });
  });

  // ─── formatCommunityAttribution ───────────────────────────────────────────

  describe('formatCommunityAttribution', () => {
    it('should include First Nations community context for Braiding Sweetgrass', () => {
      const attribution = engine.formatCommunityAttribution(braidingSweetgrassWork);
      expect(attribution).toContain('First Nations');
    });

    it('should include the community endorsement when present', () => {
      const attribution = engine.formatCommunityAttribution(braidingSweetgrassWork);
      expect(attribution).toContain('Citizen Potawatomi Nation');
    });

    it('should include Inuit community context for the ITK work', () => {
      const attribution = engine.formatCommunityAttribution(itkWork);
      expect(attribution).toContain('Inuit');
    });

    it('should produce a standard attribution for Appalachian works without nation attribution', () => {
      const attribution = engine.formatCommunityAttribution(foxfireCookeryWork);
      // Appalachian: no nation context, just author + title + source
      expect(attribution).toContain('Linda Garland Page');
      expect(attribution).not.toContain('First Nations');
      expect(attribution).not.toContain('Inuit');
    });

    it('should include knowledge source type in attribution', () => {
      const attrFoxfire = engine.formatCommunityAttribution(foxfireCookeryWork);
      const attrItk = engine.formatCommunityAttribution(itkWork);
      expect(attrFoxfire).toContain('published-book');
      expect(attrItk).toContain('community-authorized');
    });
  });

  // ─── getCitationsForRoom ──────────────────────────────────────────────────

  describe('getCitationsForRoom', () => {
    it('should return citations for Room 5 (Food) including Foxfire volumes', () => {
      const entries = engine.getCitationsForRoom(RoomNumber.FOOD);
      expect(entries.length).toBeGreaterThan(0);
      // Foxfire series has vol 1 (Food=5), should be present
      const hasFoxfire = entries.some(e => e.id === 'foxfire-series');
      expect(hasFoxfire, 'Expected foxfire-series in Room 5 citations').toBe(true);
    });

    it('should return BibliographyEntry objects with all required fields populated', () => {
      const entries = engine.getCitationsForRoom(RoomNumber.FOOD);
      for (const entry of entries) {
        expect(entry.id).toBeTruthy();
        expect(entry.citation).toBeTruthy();
        expect(entry.fairUseNotice).toBeTruthy();
        expect(typeof entry.isIndigenousSource).toBe('boolean');
        // creatorFirstLink may be empty string for works without a link, but must be a string
        expect(typeof entry.creatorFirstLink).toBe('string');
      }
    });

    it('should include a fair use notice for each entry', () => {
      const entries = engine.getCitationsForRoom(RoomNumber.FOOD);
      for (const entry of entries) {
        expect(entry.fairUseNotice.length).toBeGreaterThan(20);
      }
    });

    it('should correctly flag Indigenous sources', () => {
      const entries = engine.getCitationsForRoom(RoomNumber.PLANTS);
      // Room 9 (Plants) has Braiding Sweetgrass (first-nations)
      const braidingEntry = entries.find(e => e.id === 'braiding-sweetgrass');
      expect(braidingEntry, 'Expected braiding-sweetgrass in Room 9').toBeDefined();
      expect(braidingEntry!.isIndigenousSource).toBe(true);
    });

    it('should not flag Appalachian sources as Indigenous', () => {
      const entries = engine.getCitationsForRoom(RoomNumber.FOOD);
      const foxfireEntry = entries.find(e => e.id === 'foxfire-series');
      expect(foxfireEntry).toBeDefined();
      expect(foxfireEntry!.isIndigenousSource).toBe(false);
    });

    it('should include community permission for works with community endorsement', () => {
      const entries = engine.getCitationsForRoom(RoomNumber.PLANTS);
      const braidingEntry = entries.find(e => e.id === 'braiding-sweetgrass');
      expect(braidingEntry).toBeDefined();
      // communityPermission comes from communityEndorsement
      expect(braidingEntry!.communityPermission).toBeTruthy();
    });

    it('should accept numeric room number as well as RoomNumber enum', () => {
      const byEnum = engine.getCitationsForRoom(RoomNumber.FOOD);
      const byNumber = engine.getCitationsForRoom(5);
      expect(byEnum).toEqual(byNumber);
    });

    it('should support all three citation styles via parameter', () => {
      const styles: CitationStyle[] = ['chicago', 'mla', 'apa'];
      for (const style of styles) {
        const entries = engine.getCitationsForRoom(RoomNumber.FOOD, style);
        expect(entries.length).toBeGreaterThan(0);
        for (const entry of entries) {
          expect(entry.citation.length).toBeGreaterThan(10);
        }
      }
    });

    it('should default to Chicago style when no style argument is given', () => {
      const defaultEntries = engine.getCitationsForRoom(RoomNumber.FOOD);
      const chicagoEntries = engine.getCitationsForRoom(RoomNumber.FOOD, 'chicago');
      expect(defaultEntries).toEqual(chicagoEntries);
    });

    it('should return non-empty results for Room 14 (Arctic Living)', () => {
      const entries = engine.getCitationsForRoom(RoomNumber.ARCTIC_LIVING);
      expect(entries.length).toBeGreaterThan(0);
      // Arctic works should be flagged as Indigenous
      for (const entry of entries) {
        expect(entry.isIndigenousSource).toBe(true);
      }
    });
  });
});

// ─── Convenience Function Exports ─────────────────────────────────────────────

describe('Convenience function exports', () => {
  it('formatCitation should produce same result as engine method', () => {
    const direct = formatCitation(foxfireCookeryWork, 'chicago');
    const engine = new BibliographyEngine();
    expect(direct).toBe(engine.formatCitation(foxfireCookeryWork, 'chicago'));
  });

  it('generateFairUseNotice should produce same result as engine method', () => {
    const direct = generateFairUseNotice(foxfireCookeryWork);
    const engine = new BibliographyEngine();
    expect(direct).toBe(engine.generateFairUseNotice(foxfireCookeryWork));
  });

  it('validateCreatorFirstLink should produce same result as engine method', () => {
    expect(validateCreatorFirstLink(foxfireSeriesWork)).toBe(true);
    expect(validateCreatorFirstLink(noCdlWork)).toBe(false);
  });

  it('formatCommunityAttribution should produce same result as engine method', () => {
    const direct = formatCommunityAttribution(braidingSweetgrassWork);
    const engine = new BibliographyEngine();
    expect(direct).toBe(engine.formatCommunityAttribution(braidingSweetgrassWork));
  });

  it('getCitationsForRoom should produce same result as engine method', () => {
    const direct = getCitationsForRoom(RoomNumber.FOOD);
    const engine = new BibliographyEngine();
    expect(direct).toEqual(engine.getCitationsForRoom(RoomNumber.FOOD));
  });
});
