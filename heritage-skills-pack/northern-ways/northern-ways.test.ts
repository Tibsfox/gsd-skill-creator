/**
 * Tests for the Northern Ways cross-cutting module.
 *
 * Validates data completeness, structural correctness, and the critical
 * requirement that no personal data appears in the knowledge keepers directory.
 *
 * @module heritage-skills-pack/northern-ways/northern-ways.test
 */

import { describe, it, expect } from 'vitest';

import {
  loadIQPrinciples,
  loadOCAPFramework,
  loadCAREPrinciples,
  loadAllNationReferences,
  loadNationReference,
  loadSeasonalRounds,
  loadKnowledgeKeepersDirectory,
} from './index.js';

import type {
  IQPrinciple,
  OCAPFramework,
  CAREFramework,
  NationReference,
  SeasonalRound,
  KnowledgeKeeperResource,
} from './index.js';

// ─── IQ Principles ────────────────────────────────────────────────────────────

describe('Northern Ways Module', () => {
  describe('IQ Principles', () => {
    it('should load exactly 6 IQ principles', () => {
      const principles = loadIQPrinciples();
      expect(principles).toHaveLength(6);
    });

    it('should have heritageSkillExamples for each principle', () => {
      const principles = loadIQPrinciples();
      for (const principle of principles) {
        expect(principle.heritageSkillExamples, `${principle.id} missing heritageSkillExamples`)
          .toBeDefined();
        expect(principle.heritageSkillExamples.length, `${principle.id} heritageSkillExamples should not be empty`)
          .toBeGreaterThan(0);
      }
    });

    it('should have foxfireParallels for each principle', () => {
      const principles = loadIQPrinciples();
      for (const principle of principles) {
        expect(principle.foxfireParallels, `${principle.id} missing foxfireParallels`)
          .toBeDefined();
        expect(principle.foxfireParallels.length, `${principle.id} foxfireParallels should not be empty`)
          .toBeGreaterThan(0);
      }
    });

    it('should include Pilimmaksarniq (skills through practice)', () => {
      const principles = loadIQPrinciples();
      const pilimmaksarniq = principles.find(p => p.name === 'Pilimmaksarniq');
      expect(pilimmaksarniq).toBeDefined();
      expect(pilimmaksarniq!.id).toBe('IQ-05');
      expect(pilimmaksarniq!.englishName).toContain('Skills');
    });

    it('should have required fields on each principle', () => {
      const principles = loadIQPrinciples();
      for (const principle of principles) {
        expect(principle.id).toBeDefined();
        expect(principle.name).toBeDefined();
        expect(principle.englishName).toBeDefined();
        expect(principle.definition).toBeDefined();
        expect(principle.applicationNotes).toBeDefined();
      }
    });

    it('should have IDs in format IQ-01 through IQ-06', () => {
      const principles = loadIQPrinciples();
      const ids = principles.map(p => p.id);
      expect(ids).toContain('IQ-01');
      expect(ids).toContain('IQ-06');
    });
  });

  // ─── OCAP Framework ─────────────────────────────────────────────────────────

  describe('OCAP Framework', () => {
    it('should have all 4 OCAP principles (O, C, A, P)', () => {
      const framework = loadOCAPFramework();
      expect(framework.principles).toHaveLength(4);
      const ids = framework.principles.map(p => p.id);
      expect(ids).toContain('OCAP-O');
      expect(ids).toContain('OCAP-C');
      expect(ids).toContain('OCAP-A');
      expect(ids).toContain('OCAP-P');
    });

    it('should include implementationGuidance for each principle', () => {
      const framework = loadOCAPFramework();
      for (const principle of framework.principles) {
        expect(principle.implementationGuidance, `${principle.id} missing implementationGuidance`)
          .toBeDefined();
        expect(principle.implementationGuidance.length).toBeGreaterThan(50);
      }
    });

    it('should include FNIGC legal note', () => {
      const framework = loadOCAPFramework();
      expect(framework.legalNote).toBeDefined();
      expect(framework.legalNote).toContain('FNIGC');
    });

    it('should have framework metadata', () => {
      const framework = loadOCAPFramework();
      expect(framework.framework).toBe('OCAP');
      expect(framework.fullName).toContain('Ownership');
      expect(framework.origin).toContain('First Nations Information Governance');
    });
  });

  // ─── CARE Principles ────────────────────────────────────────────────────────

  describe('CARE Principles', () => {
    it('should have all 4 CARE principles (C, A, R, E)', () => {
      const framework = loadCAREPrinciples();
      expect(framework.principles).toHaveLength(4);
      const ids = framework.principles.map(p => p.id);
      expect(ids).toContain('CARE-C');
      expect(ids).toContain('CARE-A');
      expect(ids).toContain('CARE-R');
      expect(ids).toContain('CARE-E');
    });

    it('should have heritagePackMapping for each principle', () => {
      const framework = loadCAREPrinciples();
      for (const principle of framework.principles) {
        expect(principle.heritagePackMapping, `${principle.id} missing heritagePackMapping`)
          .toBeDefined();
        expect(principle.heritagePackMapping.length).toBeGreaterThan(50);
      }
    });

    it('should have framework metadata', () => {
      const framework = loadCAREPrinciples();
      expect(framework.framework).toBe('CARE');
      expect(framework.fullName).toContain('Collective Benefit');
      expect(framework.origin).toContain('Global Indigenous Data Alliance');
    });
  });

  // ─── Nations Reference ──────────────────────────────────────────────────────

  describe('Nations Reference', () => {
    it('should load all 9 nations + Inuit regions (10 total)', () => {
      const nations = loadAllNationReferences();
      expect(nations).toHaveLength(10);
    });

    it('should have roomConnections for each nation', () => {
      const nations = loadAllNationReferences();
      for (const nation of nations) {
        expect(nation.roomConnections, `${nation.id} missing roomConnections`)
          .toBeDefined();
        expect(Array.isArray(nation.roomConnections)).toBe(true);
        expect(nation.roomConnections.length, `${nation.id} roomConnections should not be empty`)
          .toBeGreaterThan(0);
      }
    });

    it('should have heritageSkillRelevance for each nation', () => {
      const nations = loadAllNationReferences();
      for (const nation of nations) {
        // inuit-regions uses sharedHeritagePractices, others use heritageSkillRelevance
        const hasSkills = (nation.heritageSkillRelevance && nation.heritageSkillRelevance.length > 0) ||
          (nation as unknown as { sharedHeritagePractices?: string[] }).sharedHeritagePractices !== undefined;
        expect(hasSkills, `${nation.id} missing heritage skill relevance data`).toBe(true);
      }
    });

    it('should load specific nation by ID', () => {
      const anishinaabe = loadNationReference('nation-anishinaabe');
      expect(anishinaabe).toBeDefined();
      expect(anishinaabe.id).toBe('nation-anishinaabe');
      expect(anishinaabe.name).toBe('Anishinaabe');
    });

    it('should throw when loading non-existent nation', () => {
      expect(() => loadNationReference('nation-doesnotexist')).toThrow();
    });

    it('should include Inuit regional reference', () => {
      const inuit = loadNationReference('nation-inuit');
      expect(inuit).toBeDefined();
      expect(inuit.id).toBe('nation-inuit');
    });

    it('should have languageFamily for each nation', () => {
      const nations = loadAllNationReferences();
      for (const nation of nations) {
        expect(nation.languageFamily, `${nation.id} missing languageFamily`).toBeDefined();
      }
    });
  });

  // ─── Seasonal Rounds ────────────────────────────────────────────────────────

  describe('Seasonal Rounds', () => {
    it('should load woodland cycle with 4-6 seasons', () => {
      const round = loadSeasonalRounds('woodland');
      expect(round.seasons.length).toBeGreaterThanOrEqual(4);
      expect(round.seasons.length).toBeLessThanOrEqual(6);
    });

    it('should load subarctic cycle', () => {
      const round = loadSeasonalRounds('subarctic');
      expect(round.id).toBe('seasonal-subarctic');
      expect(round.seasons.length).toBeGreaterThanOrEqual(4);
    });

    it('should load arctic cycle', () => {
      const round = loadSeasonalRounds('arctic');
      expect(round.id).toBe('seasonal-arctic');
      expect(round.seasons.length).toBeGreaterThanOrEqual(4);
    });

    it('should have room connections for each season', () => {
      for (const pattern of ['woodland', 'subarctic', 'arctic'] as const) {
        const round = loadSeasonalRounds(pattern);
        for (const season of round.seasons) {
          expect(
            season.heritageSkillRooms,
            `${round.id} / ${season.name} missing heritageSkillRooms`
          ).toBeDefined();
          expect(season.heritageSkillRooms.length).toBeGreaterThan(0);
        }
      }
    });

    it('should have applicableNations for each seasonal round', () => {
      for (const pattern of ['woodland', 'subarctic', 'arctic'] as const) {
        const round = loadSeasonalRounds(pattern);
        expect(round.applicableNations).toBeDefined();
        expect(round.applicableNations.length).toBeGreaterThan(0);
      }
    });
  });

  // ─── Knowledge Keepers Directory ────────────────────────────────────────────

  describe('Knowledge Keepers Directory', () => {
    it('should contain only institutional resources', () => {
      const directory = loadKnowledgeKeepersDirectory();
      expect(directory.resources).toBeDefined();
      expect(directory.resources.length).toBeGreaterThan(0);
      for (const resource of directory.resources) {
        expect(resource.type).toBeDefined();
        // type should be an institutional type, not 'individual' or 'person'
        expect(['museum', 'cultural-center', 'community-organization', 'educational-program', 'published-resource', 'governance-organization'])
          .toContain(resource.type);
      }
    });

    it('should contain no personal data (names/emails/phones)', () => {
      const directory = loadKnowledgeKeepersDirectory();
      const jsonString = JSON.stringify(directory);

      // Check for email-like patterns
      const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const emailMatches = jsonString.match(emailPattern);
      expect(emailMatches).toBeNull();

      // Check for phone-like patterns (formats: 555-555-5555, (555) 555-5555, +1-555-555-5555)
      const phonePattern = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
      const phoneMatches = jsonString.match(phonePattern);
      expect(phoneMatches).toBeNull();
    });

    it('should have disclaimer about no personal information', () => {
      const directory = loadKnowledgeKeepersDirectory();
      expect(directory.disclaimer).toBeDefined();
      expect(directory.disclaimer.length).toBeGreaterThan(20);
    });

    it('should have valid URL format for each resource', () => {
      const directory = loadKnowledgeKeepersDirectory();
      for (const resource of directory.resources) {
        expect(resource.url, `${resource.id} missing url`).toBeDefined();
        // URL must start with https:// or http://
        expect(
          resource.url.startsWith('https://') || resource.url.startsWith('http://'),
          `${resource.id} url '${resource.url}' is not a valid URL`
        ).toBe(true);
      }
    });

    it('should have at least 10 resources', () => {
      const directory = loadKnowledgeKeepersDirectory();
      expect(directory.resources.length).toBeGreaterThanOrEqual(10);
    });

    it('should have resource IDs in KK-NNN format', () => {
      const directory = loadKnowledgeKeepersDirectory();
      for (const resource of directory.resources) {
        expect(resource.id).toMatch(/^KK-\d{3}$/);
      }
    });
  });
});
