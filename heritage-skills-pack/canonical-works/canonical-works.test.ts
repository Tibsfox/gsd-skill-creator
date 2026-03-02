/**
 * Tests for the Canonical Works Library.
 *
 * Validates catalog completeness, creator-first purchase links,
 * fair use notice templates, and room/tradition lookup functions.
 *
 * @module heritage-skills-pack/canonical-works/canonical-works.test
 */

import { describe, it, expect } from 'vitest';

import {
  loadFoxfireCatalog,
  loadFirstNationsCatalog,
  loadInuitCatalog,
  loadAllCatalogs,
  loadFairUseNotice,
  getWorksByRoom,
  getWorksByTradition,
} from './index.js';

import type {
  FairUseNotice,
  CanonicalWorkWithNationContext,
} from './index.js';

// ─── Foxfire Catalog ──────────────────────────────────────────────────────────

describe('Canonical Works Library', () => {
  describe('Foxfire Catalog', () => {
    it('should have 12 volume references in the series entry', () => {
      const works = loadFoxfireCatalog();
      const series = works.find(w => w.volumeRefs && w.volumeRefs.length > 0);
      expect(series, 'Expected a multi-volume series entry').toBeDefined();
      expect(series!.volumeRefs).toHaveLength(12);
    });

    it('should have foxfire.org as priority 1 creator-direct link', () => {
      const works = loadFoxfireCatalog();
      for (const work of works) {
        const priority1 = work.purchaseLinks.find(l => l.priority === 1);
        expect(priority1, `${work.id} missing priority 1 link`).toBeDefined();
        expect(priority1!.isCreatorDirect, `${work.id} priority 1 link should be creator-direct`).toBe(true);
        expect(priority1!.url, `${work.id} priority 1 link should point to foxfire.org`)
          .toContain('foxfire.org');
      }
    });

    it('should have specialty titles beyond the main series', () => {
      const works = loadFoxfireCatalog();
      // Main series entry + at least 5 specialty titles
      expect(works.length).toBeGreaterThan(5);
      // Some entries should not have volumeRefs (standalone specialty titles)
      const specialtyTitles = works.filter(w => !w.volumeRefs || w.volumeRefs.length === 0);
      expect(specialtyTitles.length, 'Should have specialty titles without volumeRefs').toBeGreaterThan(0);
    });

    it('should have all entries as appalachian tradition', () => {
      const works = loadFoxfireCatalog();
      for (const work of works) {
        expect(work.tradition, `${work.id} should be appalachian`).toBe('appalachian');
      }
    });

    it('should have all entries marked fairUseCompliant', () => {
      const works = loadFoxfireCatalog();
      for (const work of works) {
        expect(work.fairUseCompliant, `${work.id} should be fairUseCompliant`).toBe(true);
      }
    });
  });

  // ─── First Nations Catalog ──────────────────────────────────────────────────

  describe('First Nations Catalog', () => {
    it('should have 8+ published works', () => {
      const works = loadFirstNationsCatalog();
      expect(works.length).toBeGreaterThanOrEqual(8);
    });

    it('should have communityEndorsement for each work', () => {
      const works = loadFirstNationsCatalog();
      for (const work of works) {
        expect(work.communityEndorsement, `${work.id} missing communityEndorsement`)
          .toBeDefined();
        expect(work.communityEndorsement!.length, `${work.id} communityEndorsement should not be empty`)
          .toBeGreaterThan(0);
      }
    });

    it('should have creator-first purchase links', () => {
      const works = loadFirstNationsCatalog();
      for (const work of works) {
        expect(work.purchaseLinks, `${work.id} missing purchaseLinks`).toBeDefined();
        expect(work.purchaseLinks.length, `${work.id} should have at least one purchase link`).toBeGreaterThan(0);
        const hasCreatorFirst = work.purchaseLinks.some(l => l.isCreatorDirect);
        expect(hasCreatorFirst, `${work.id} should have at least one creator-direct link`).toBe(true);
      }
    });

    it('should have all entries as first-nations tradition', () => {
      const works = loadFirstNationsCatalog();
      for (const work of works) {
        expect(work.tradition, `${work.id} should be first-nations`).toBe('first-nations');
      }
    });
  });

  // ─── Inuit Catalog ──────────────────────────────────────────────────────────

  describe('Inuit Catalog', () => {
    it('should have 6+ works', () => {
      const works = loadInuitCatalog();
      expect(works.length).toBeGreaterThanOrEqual(6);
    });

    it('should include ITK and Inhabit Media sources', () => {
      const works = loadInuitCatalog();
      const allLinks = works.flatMap(w => w.purchaseLinks.map(l => l.url));
      const hasITK = allLinks.some(url => url.includes('itk.ca'));
      const hasInhabitMedia = allLinks.some(url => url.includes('inhabitmedia.com'));
      expect(hasITK, 'Should have at least one ITK source').toBe(true);
      expect(hasInhabitMedia, 'Should have at least one Inhabit Media source').toBe(true);
    });

    it('should have communityEndorsement for each work', () => {
      const works = loadInuitCatalog();
      for (const work of works) {
        expect(work.communityEndorsement, `${work.id} missing communityEndorsement`)
          .toBeDefined();
      }
    });

    it('should have all entries as inuit tradition', () => {
      const works = loadInuitCatalog();
      for (const work of works) {
        expect(work.tradition, `${work.id} should be inuit`).toBe('inuit');
      }
    });
  });

  // ─── Fair Use Notices ───────────────────────────────────────────────────────

  describe('Fair Use Notices', () => {
    it('should have notice templates for all 3 traditions', () => {
      const appalachian = loadFairUseNotice('appalachian');
      const firstNations = loadFairUseNotice('first-nations');
      const inuit = loadFairUseNotice('inuit');

      expect(appalachian.noticeTemplate, 'Appalachian notice template required').toBeDefined();
      expect(firstNations.noticeTemplate, 'First Nations notice template required').toBeDefined();
      expect(inuit.noticeTemplate, 'Inuit notice template required').toBeDefined();
    });

    it('should include {work_title} and {creator_link} placeholders in templates', () => {
      const traditions = ['appalachian', 'first-nations', 'inuit'] as const;
      for (const tradition of traditions) {
        const notice = loadFairUseNotice(tradition);
        expect(notice.noticeTemplate, `${tradition} missing {work_title} placeholder`)
          .toContain('{work_title}');
        expect(notice.noticeTemplate, `${tradition} missing {creator_link} placeholder`)
          .toContain('{creator_link}');
      }
    });

    it('should include cultural sovereignty statement for Indigenous notices', () => {
      const firstNations = loadFairUseNotice('first-nations') as FairUseNotice & { culturalSovereigntyStatement?: string };
      const inuit = loadFairUseNotice('inuit') as FairUseNotice & { culturalSovereigntyStatement?: string };

      expect(firstNations.culturalSovereigntyStatement,
        'First Nations notice should have culturalSovereigntyStatement').toBeDefined();
      expect(inuit.culturalSovereigntyStatement,
        'Inuit notice should have culturalSovereigntyStatement').toBeDefined();
    });

    it('should have OCAP compliance note for Indigenous notices', () => {
      const firstNations = loadFairUseNotice('first-nations') as FairUseNotice & { ocapComplianceNote?: string };
      const inuit = loadFairUseNotice('inuit') as FairUseNotice & { ocapComplianceNote?: string };

      expect(firstNations.ocapComplianceNote,
        'First Nations notice should have ocapComplianceNote').toBeDefined();
      expect(inuit.ocapComplianceNote,
        'Inuit notice should have ocapComplianceNote').toBeDefined();
    });

    it('should throw for unknown tradition', () => {
      expect(() => loadFairUseNotice('unknown-tradition' as 'appalachian'))
        .toThrow();
    });
  });

  // ─── getWorksByRoom ─────────────────────────────────────────────────────────

  describe('getWorksByRoom', () => {
    it('should return Foxfire volumes for Room 5 (Food)', () => {
      const works = getWorksByRoom(5);
      // Room 5 (Food) should appear in multiple Foxfire volumes and specialty titles
      expect(works.length, 'Room 5 should have matching works').toBeGreaterThan(0);
      // Should include the main series entry since volumeRefs include room 5
      const hasAppalachian = works.some(w => w.tradition === 'appalachian');
      expect(hasAppalachian, 'Room 5 should have Appalachian works').toBe(true);
    });

    it('should return works for Room 14 (Arctic Living)', () => {
      const works = getWorksByRoom(14);
      expect(works.length, 'Room 14 should have matching works').toBeGreaterThan(0);
      const hasInuit = works.some(w => w.tradition === 'inuit');
      expect(hasInuit, 'Room 14 should have Inuit works').toBe(true);
    });

    it('should return empty array for room with no matching works', () => {
      // Room 7 (Metalwork) only has Appalachian tradition works in our catalog.
      // Test with a room number for which we can be sure no works are assigned.
      // Using room 99 as an out-of-range room that no work covers.
      const works = getWorksByRoom(99 as 5);
      expect(works).toHaveLength(0);
    });

    it('should include works matched through volumeRefs for the main series', () => {
      // Foxfire series volumeRefs[0] has room 1 (Building)
      const works = getWorksByRoom(1);
      const foxfireSeries = works.find(w => w.id === 'foxfire-series');
      expect(foxfireSeries, 'Foxfire series should appear for rooms listed in volumeRefs').toBeDefined();
    });
  });

  // ─── getWorksByTradition ────────────────────────────────────────────────────

  describe('getWorksByTradition', () => {
    it('should return only Appalachian works for appalachian tradition', () => {
      const works = getWorksByTradition('appalachian');
      expect(works.length, 'Appalachian tradition should have works').toBeGreaterThan(0);
      for (const work of works) {
        expect(work.tradition, `${work.id} should be appalachian`).toBe('appalachian');
      }
    });

    it('should return First Nations works for first-nations tradition', () => {
      const works = getWorksByTradition('first-nations');
      expect(works.length, 'first-nations should have works').toBeGreaterThanOrEqual(8);
      for (const work of works) {
        expect(work.tradition, `${work.id} should be first-nations`).toBe('first-nations');
      }
    });

    it('should attach nationContext to First Nations works using Northern Ways nation references', () => {
      const works = getWorksByTradition('first-nations');
      expect(works.length).toBeGreaterThan(0);
      // Every first-nations work should have nationContext array
      for (const work of works) {
        expect(work.nationContext, `${work.id} should have nationContext`).toBeDefined();
        expect(Array.isArray(work.nationContext), `${work.id} nationContext should be an array`).toBe(true);
      }
    });

    it('should attach nationContext to Inuit works using Northern Ways nation references', () => {
      const works = getWorksByTradition('inuit');
      expect(works.length).toBeGreaterThan(0);
      for (const work of works) {
        expect(work.nationContext, `${work.id} should have nationContext`).toBeDefined();
        expect(Array.isArray(work.nationContext), `${work.id} nationContext should be an array`).toBe(true);
      }
    });

    it('should NOT attach nationContext to Appalachian works', () => {
      const works = getWorksByTradition('appalachian');
      for (const work of works) {
        expect(work.nationContext, `${work.id} appalachian work should not have nationContext`).toBeUndefined();
      }
    });

    it('should return all catalogs combined via loadAllCatalogs', () => {
      const all = loadAllCatalogs();
      const foxfire = loadFoxfireCatalog();
      const fn = loadFirstNationsCatalog();
      const inuit = loadInuitCatalog();
      expect(all.length).toBe(foxfire.length + fn.length + inuit.length);
    });

    it('should have nationContext entries with required fields for First Nations', () => {
      const works = getWorksByTradition('first-nations');
      for (const work of works as CanonicalWorkWithNationContext[]) {
        if (work.nationContext && work.nationContext.length > 0) {
          const entry = work.nationContext[0];
          expect(entry.nationId, `nationContext[0].nationId required`).toBeDefined();
          expect(entry.nationName, `nationContext[0].nationName required`).toBeDefined();
          expect(entry.seasonalPattern, `nationContext[0].seasonalPattern required`).toBeDefined();
        }
      }
    });
  });
});
