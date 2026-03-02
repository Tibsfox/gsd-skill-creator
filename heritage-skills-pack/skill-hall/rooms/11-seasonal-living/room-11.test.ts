/**
 * Tests for Room 11: Seasonal Living
 *
 * Validates:
 * - room-spec.json: SkillModule structure, room 11, traditions (appalachian, first-nations, inuit),
 *   safety domains (arctic-survival, food), 6 modules, Inuit six-seasons module, sugar bush module,
 *   Three Sisters / FN seasonal rounds module, Anishinaabe birchbark attribution
 * - safety-config.json: isCritical=false, criticalRules empty, 2 arctic-survival gate rules,
 *   2 food annotate rules
 * - cultural-config.json: Anishinaabe attribution for sugar bush, Haudenosaunee attribution for
 *   Three Sisters, Inuit attribution for six seasons, Level 3 restrict for seasonal ceremonies
 * - Try Sessions: 3 beginner sessions (appalachian, inuit, first-nations), correct timing,
 *   caribou session gated and references Room 14, Anishinaabe/Cree attribution in birchbark,
 *   moon phase content in planting calendar, food storage annotation, no pan-Indigenous language
 * - sumo-mappings.json: 8+ mappings with kifStatement and naturalLanguage on all entries,
 *   Season / Agriculture / HeritageSkill terms present
 *
 * @module heritage-skills-pack/skill-hall/rooms/11-seasonal-living/room-11.test
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

const plantingSession = JSON.parse(
  readFileSync(resolve(roomDir, 'try-sessions/appalachian-planting-calendar.json'), 'utf-8'),
);
const caribouSession = JSON.parse(
  readFileSync(resolve(roomDir, 'try-sessions/caribou-migration-timing.json'), 'utf-8'),
);
const birchbarkSession = JSON.parse(
  readFileSync(resolve(roomDir, 'try-sessions/birchbark-harvest-season.json'), 'utf-8'),
);

const allSessions = [plantingSession, caribouSession, birchbarkSession];

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Collect all string values from all steps of a session */
function allStepText(session: typeof plantingSession): string {
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

describe('Room 11: Seasonal Living', () => {
  // ── room-spec.json ────────────────────────────────────────────────────────────

  describe('room-spec.json', () => {
    it('should have room number 11', () => {
      expect(roomSpec.room).toBe(11);
      expect(roomSpec.id).toBe('room-11-seasonal-living');
    });

    it('should have arctic-survival and food safety domains', () => {
      expect(roomSpec.safetyDomains).toContain('arctic-survival');
      expect(roomSpec.safetyDomains).toContain('food');
    });

    it('should have 6 content modules', () => {
      expect(roomSpec.modules.length).toBe(6);
    });

    it('should have Inuit six-seasons module', () => {
      const sixSeasonsModule = roomSpec.modules.find(
        (m: { id: string }) => /six.season|inuit.six/i.test(m.id),
      );
      expect(sixSeasonsModule).toBeDefined();
    });

    it('should have sugar bush module', () => {
      const sugarBushModule = roomSpec.modules.find(
        (m: { id: string }) => /sugar.bush/i.test(m.id),
      );
      expect(sugarBushModule).toBeDefined();
    });

    it('should have Three Sisters module or Haudenosaunee agricultural content', () => {
      const seasonalRoundsModule = roomSpec.modules.find(
        (m: { id: string }) => /three.sisters|fn.seasonal/i.test(m.id),
      );
      expect(seasonalRoundsModule).toBeDefined();
    });

    it('should have Anishinaabe attribution for birchbark content', () => {
      const allSpecText = JSON.stringify(roomSpec);
      expect(allSpecText).toMatch(/Anishinaabe/);
      expect(allSpecText).toMatch(/birchbark|birch bark/i);
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

    it('should have 2 gate rules', () => {
      expect(safetyConfig.gateRules.length).toBe(2);
    });

    it('should have arctic-survival ice travel gate rule', () => {
      const rule = safetyConfig.gateRules.find(
        (r: { id: string }) => r.id === 'ROOM11-GATE-001',
      );
      expect(rule).toBeDefined();
      expect(rule.action).toMatch(/GATE/);
    });

    it('should have arctic weather gate rule', () => {
      const rule = safetyConfig.gateRules.find(
        (r: { id: string }) => r.id === 'ROOM11-GATE-002',
      );
      expect(rule).toBeDefined();
      expect(rule.action).toMatch(/GATE/);
    });

    it('should have 2 annotate rules', () => {
      expect(safetyConfig.annotateRules.length).toBe(2);
    });

    it('should have food preservation annotate rule', () => {
      const rule = safetyConfig.annotateRules.find(
        (r: { id: string; trigger: string }) =>
          r.id === 'ROOM11-ANN-001' && /canning|preservation/i.test(r.trigger),
      );
      expect(rule).toBeDefined();
    });
  });

  // ── cultural-config.json ──────────────────────────────────────────────────────

  describe('cultural-config.json', () => {
    it('should have Anishinaabe attribution for sugar bush', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { nationAttribution?: string; concept: string }) =>
          r.nationAttribution &&
          /Anishinaabe/.test(r.nationAttribution) &&
          /sugar.bush/i.test(r.concept),
      );
      expect(rule).toBeDefined();
    });

    it('should have Haudenosaunee attribution for Three Sisters', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { nationAttribution?: string }) =>
          r.nationAttribution && /Haudenosaunee/.test(r.nationAttribution),
      );
      expect(rule).toBeDefined();
    });

    it('should have Inuit attribution for six seasons', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { nationAttribution?: string; concept: string }) =>
          r.nationAttribution &&
          /Inuit/.test(r.nationAttribution) &&
          /season/i.test(r.concept),
      );
      expect(rule).toBeDefined();
    });

    it('should have Level 3 restrict for seasonal ceremonies', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { level: number; action: string }) => r.level === 3 && r.action === 'restrict',
      );
      expect(rule).toBeDefined();
    });
  });

  // ── Try Sessions ──────────────────────────────────────────────────────────────

  describe('Try Sessions', () => {
    it('should have 3 Try Sessions loaded', () => {
      expect(allSessions).toHaveLength(3);
    });

    it('should cover appalachian, inuit, first-nations', () => {
      const traditions = allSessions.map((s) => s.tradition);
      expect(traditions).toContain('appalachian');
      expect(traditions).toContain('inuit');
      expect(traditions).toContain('first-nations');
    });

    it('should all be beginner difficulty', () => {
      for (const session of allSessions) {
        expect(session.difficulty).toBe('beginner');
      }
    });

    it('caribou session should be safetyLevel "gated"', () => {
      expect(caribouSession.safetyLevel).toBe('gated');
    });

    it('caribou session should reference Room 14 for ice safety', () => {
      const caribouText = allStepText(caribouSession);
      expect(caribouText).toMatch(/Room 14/);
    });

    it('birchbark session should have Anishinaabe attribution', () => {
      const anishinaabeSteps = birchbarkSession.steps.filter(
        (s: { nationAttribution?: string }) =>
          s.nationAttribution && /Anishinaabe/.test(s.nationAttribution),
      );
      expect(anishinaabeSteps.length).toBeGreaterThan(0);
    });

    it('birchbark session should mention Cree attribution', () => {
      const birchbarkText = allStepText(birchbarkSession);
      expect(birchbarkText).toMatch(/Cree/);
    });

    it('planting session should mention moon phase planting', () => {
      const plantingText = allStepText(plantingSession);
      expect(plantingText).toMatch(/moon phase|moon/i);
    });

    it('planting session should have food storage annotation', () => {
      const storageStep = plantingSession.steps.find(
        (s: { safetyNote?: string }) =>
          s.safetyNote && /root cellar|canning|preservation/i.test(s.safetyNote),
      );
      expect(storageStep).toBeDefined();
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

    it('should have Season SUMO term', () => {
      const seasonMappings = sumoMappings.filter(
        (m: { sumoTerm: string }) => m.sumoTerm === 'Season',
      );
      expect(seasonMappings.length).toBeGreaterThan(0);
    });

    it('should have Agriculture SUMO term in at least one mapping', () => {
      const agricultureMappings = sumoMappings.filter(
        (m: { sumoTerm: string }) => m.sumoTerm === 'Agriculture',
      );
      expect(agricultureMappings.length).toBeGreaterThan(0);
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
