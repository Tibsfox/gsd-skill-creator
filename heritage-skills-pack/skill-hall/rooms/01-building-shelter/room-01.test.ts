/**
 * Tests for Room 01: Building & Shelter
 *
 * Validates:
 * - room-spec.json: SkillModule structure, room 1, traditions (appalachian, first-nations, inuit),
 *   safety domains (structural, fire), 5+ modules, log cabin / wigwam / longhouse / igloo-crossref
 *   modules, Room 14 cross-reference present
 * - safety-config.json: isCritical=false, criticalRules empty, 2 structural gate rules,
 *   2 fire/CO annotate rules
 * - cultural-config.json: Anishinaabe wigwam attribution, Haudenosaunee longhouse at Level 2,
 *   Inuit tupiq attribution, no rule above Level 2
 * - Try Sessions: 3 beginner sessions (appalachian, first-nations, cross-tradition), correct
 *   timing, structural safety notes, Anishinaabe attribution, CO annotation, Room 14 cross-ref,
 *   no pan-Indigenous language
 * - sumo-mappings.json: 8+ mappings with kifStatement and naturalLanguage on all entries,
 *   Building / ConstructionProcess / HeritageSkill terms present
 *
 * @module heritage-skills-pack/skill-hall/rooms/01-building-shelter/room-01.test
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// ─── File Loading ──────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const roomDir = __dirname;

const roomSpec = JSON.parse(readFileSync(resolve(roomDir, 'room-spec.json'), 'utf-8'));
const safetyConfig = JSON.parse(readFileSync(resolve(roomDir, 'safety-config.json'), 'utf-8'));
const culturalConfig = JSON.parse(readFileSync(resolve(roomDir, 'cultural-config.json'), 'utf-8'));
const sumoMappings = JSON.parse(readFileSync(resolve(roomDir, 'sumo-mappings.json'), 'utf-8'));

const notchCuttingSession = JSON.parse(
  readFileSync(resolve(roomDir, 'try-sessions/log-cabin-notch-cutting.json'), 'utf-8'),
);
const wigwamSession = JSON.parse(
  readFileSync(resolve(roomDir, 'try-sessions/wigwam-frame-planning.json'), 'utf-8'),
);
const domeSession = JSON.parse(
  readFileSync(resolve(roomDir, 'try-sessions/dome-geometry-basics.json'), 'utf-8'),
);

const allSessions = [notchCuttingSession, wigwamSession, domeSession];

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Collect all string values from all steps of a session */
function allStepText(session: typeof notchCuttingSession): string {
  return session.steps
    .flatMap((s: Record<string, string | undefined>) =>
      [s.instruction, s.safetyNote, s.culturalContext, s.nationAttribution].filter(Boolean),
    )
    .join('\n');
}

/** Collect all step text across all three sessions */
function allSessionText(): string {
  return allSessions.map(allStepText).join('\n');
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('Room 01: Building & Shelter', () => {
  // ── room-spec.json ────────────────────────────────────────────────────────────

  describe('room-spec.json', () => {
    it('should have room number 1', () => {
      expect(roomSpec.room).toBe(1);
      expect(roomSpec.id).toBe('room-01-building-shelter');
    });

    it('should have appalachian, first-nations, inuit traditions', () => {
      expect(roomSpec.traditions).toContain('appalachian');
      expect(roomSpec.traditions).toContain('first-nations');
      expect(roomSpec.traditions).toContain('inuit');
    });

    it('should have structural and fire safety domains', () => {
      expect(roomSpec.safetyDomains).toContain('structural');
      expect(roomSpec.safetyDomains).toContain('fire');
    });

    it('should have 5+ content modules', () => {
      expect(roomSpec.modules.length).toBeGreaterThanOrEqual(5);
    });

    it('should have a log cabin module', () => {
      const logCabinModule = roomSpec.modules.find(
        (m: { id: string }) => m.id === 'building-01-appalachian-log-cabin',
      );
      expect(logCabinModule).toBeDefined();
    });

    it('should have a wigwam module', () => {
      const wigwamModule = roomSpec.modules.find(
        (m: { id: string }) => m.id === 'building-01-fn-wigwam',
      );
      expect(wigwamModule).toBeDefined();
      expect(wigwamModule.tradition).toBe('first-nations');
    });

    it('should have a longhouse module', () => {
      const longhouseModule = roomSpec.modules.find(
        (m: { id: string }) => m.id === 'building-01-fn-longhouse',
      );
      expect(longhouseModule).toBeDefined();
      expect(longhouseModule.tradition).toBe('first-nations');
    });

    it('should have an igloo cross-reference module', () => {
      const iglooModule = roomSpec.modules.find(
        (m: { id: string }) => m.id === 'building-01-igloo-crossref',
      );
      expect(iglooModule).toBeDefined();
    });

    it('should reference Room 14 for igloo content', () => {
      const fullSpec = JSON.stringify(roomSpec);
      expect(fullSpec).toMatch(/Room 14/);
    });
  });

  // ── safety-config.json ────────────────────────────────────────────────────────

  describe('safety-config.json', () => {
    it('should not be critical (isCritical false)', () => {
      expect(safetyConfig.isCritical).toBe(false);
    });

    it('should have empty criticalRules array', () => {
      expect(safetyConfig.criticalRules).toBeDefined();
      expect(safetyConfig.criticalRules.length).toBe(0);
    });

    it('should have structural load gate rule', () => {
      const rule = safetyConfig.gateRules.find(
        (r: { id: string }) => r.id === 'ROOM01-GATE-001',
      );
      expect(rule).toBeDefined();
      expect(rule.action).toMatch(/GATE/);
    });

    it('should have structural frame gate rule', () => {
      const rule = safetyConfig.gateRules.find(
        (r: { id: string }) => r.id === 'ROOM01-GATE-002',
      );
      expect(rule).toBeDefined();
      expect(rule.action).toMatch(/GATE/);
    });

    it('should have fire safety annotate rule', () => {
      const rule = safetyConfig.annotateRules.find(
        (r: { id: string }) => r.id === 'ROOM01-ANN-001',
      );
      expect(rule).toBeDefined();
      expect(rule.action).toMatch(/ANNOTATE/);
    });

    it('should have CO awareness annotate rule', () => {
      const rule = safetyConfig.annotateRules.find(
        (r: { id: string }) => r.id === 'ROOM01-ANN-002',
      );
      expect(rule).toBeDefined();
      expect(rule.action).toMatch(/ANNOTATE/);
    });
  });

  // ── cultural-config.json ──────────────────────────────────────────────────────

  describe('cultural-config.json', () => {
    it('should have Anishinaabe attribution for wigwam', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { nationAttribution?: string; concept: string }) =>
          r.nationAttribution && /Anishinaabe/.test(r.nationAttribution) &&
          /wigwam/i.test(r.concept),
      );
      expect(rule).toBeDefined();
    });

    it('should have Haudenosaunee attribution for longhouse', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { nationAttribution?: string; concept: string }) =>
          r.nationAttribution && /Haudenosaunee/.test(r.nationAttribution) &&
          /longhouse/i.test(r.concept),
      );
      expect(rule).toBeDefined();
    });

    it('should have longhouse at Level 2 (community dimensions)', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { concept: string; level: number }) => /longhouse/i.test(r.concept),
      );
      expect(rule).toBeDefined();
      expect(rule.level).toBe(2);
    });

    it('should have Inuit attribution for tupiq', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { note?: string; concept: string; nationAttribution?: string }) =>
          /tupiq/i.test(r.concept) ||
          (r.nationAttribution && /Inuit/.test(r.nationAttribution)),
      );
      expect(rule).toBeDefined();
    });

    it('should have no rule above Level 2', () => {
      for (const rule of culturalConfig.culturalRules) {
        expect(rule.level).toBeLessThanOrEqual(2);
      }
    });
  });

  // ── Try Sessions ──────────────────────────────────────────────────────────────

  describe('Try Sessions', () => {
    it('should have 3 Try Sessions loaded', () => {
      expect(allSessions).toHaveLength(3);
    });

    it('should cover appalachian, first-nations, and cross-tradition', () => {
      const traditions = allSessions.map((s) => s.tradition);
      expect(traditions).toContain('appalachian');
      expect(traditions).toContain('first-nations');
      expect(traditions).toContain('cross-tradition');
    });

    it('should all be beginner difficulty', () => {
      for (const session of allSessions) {
        expect(session.difficulty).toBe('beginner');
      }
    });

    it('should all have estimatedMinutes between 15 and 25', () => {
      for (const session of allSessions) {
        expect(session.estimatedMinutes).toBeGreaterThanOrEqual(15);
        expect(session.estimatedMinutes).toBeLessThanOrEqual(25);
      }
    });

    it('log cabin session should have structural safety safetyNote', () => {
      const structuralStep = notchCuttingSession.steps.find(
        (s: { safetyNote?: string }) =>
          s.safetyNote && /structural|GATE|notch|load/i.test(s.safetyNote),
      );
      expect(structuralStep).toBeDefined();
    });

    it('wigwam session should have Anishinaabe nation attribution', () => {
      const anishinaabeSteps = wigwamSession.steps.filter(
        (s: { nationAttribution?: string }) =>
          s.nationAttribution && /Anishinaabe/.test(s.nationAttribution),
      );
      expect(anishinaabeSteps.length).toBeGreaterThan(0);
    });

    it('wigwam session should have CO or fire annotation', () => {
      const coStep = wigwamSession.steps.find(
        (s: { safetyNote?: string }) =>
          s.safetyNote && /CO|smoke|fire/i.test(s.safetyNote),
      );
      expect(coStep).toBeDefined();
    });

    it('dome session should reference Room 14 for igloo', () => {
      const allDomeText = allStepText(domeSession);
      expect(allDomeText).toMatch(/Room 14/);
    });

    it('dome session should have structural safety note', () => {
      const structuralStep = domeSession.steps.find(
        (s: { safetyNote?: string }) =>
          s.safetyNote && /structural|frame|stable/i.test(s.safetyNote),
      );
      expect(structuralStep).toBeDefined();
    });

    it('should not contain generic "Native American" without nation name', () => {
      const allText = allSessionText();
      const hasNativeAmericanGeneric = /\bNative American\b/.test(allText);
      const hasIndigenousPeoplesGeneric = /\bIndigenous peoples\b/.test(allText);
      expect(hasNativeAmericanGeneric).toBe(false);
      expect(hasIndigenousPeoplesGeneric).toBe(false);
    });
  });

  // ── sumo-mappings.json ────────────────────────────────────────────────────────

  describe('sumo-mappings.json', () => {
    it('should have 8+ SUMO mappings', () => {
      expect(sumoMappings.length).toBeGreaterThanOrEqual(8);
    });

    it('should have kifStatement for every mapping', () => {
      for (const mapping of sumoMappings) {
        expect(mapping.kifStatement).toBeDefined();
        expect(typeof mapping.kifStatement).toBe('string');
        expect(mapping.kifStatement.length).toBeGreaterThan(0);
      }
    });

    it('should have naturalLanguage for every mapping', () => {
      for (const mapping of sumoMappings) {
        expect(mapping.naturalLanguage).toBeDefined();
        expect(mapping.naturalLanguage.length).toBeGreaterThan(0);
      }
    });

    it('should have Building SUMO term in at least one mapping', () => {
      const buildingMappings = sumoMappings.filter(
        (m: { sumoTerm: string }) => m.sumoTerm === 'Building',
      );
      expect(buildingMappings.length).toBeGreaterThan(0);
    });

    it('should have ConstructionProcess SUMO term in at least one mapping', () => {
      const constructionMappings = sumoMappings.filter(
        (m: { sumoTerm: string }) => m.sumoTerm === 'ConstructionProcess',
      );
      expect(constructionMappings.length).toBeGreaterThan(0);
    });

    it('should have HeritageSkill in at least one mapping', () => {
      const heritageSkillMappings = sumoMappings.filter(
        (m: { sumoTerm: string; kifStatement: string }) =>
          m.sumoTerm === 'HeritageSkill' || m.kifStatement.includes('HeritageSkill'),
      );
      expect(heritageSkillMappings.length).toBeGreaterThan(0);
    });
  });
});
