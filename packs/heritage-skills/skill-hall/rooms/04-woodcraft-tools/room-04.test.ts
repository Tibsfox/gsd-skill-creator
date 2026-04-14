/**
 * Tests for Room 04: Woodcraft & Tools
 *
 * Validates:
 * - room-spec.json: SkillModule structure, 3 traditions, single tool safety domain,
 *   6+ modules with Appalachian whittling, First Nations snowshoe (Dene/Cree), and
 *   Inuit ulu/snow-tools modules
 * - safety-config.json: isCritical=false, criticalRules=[], gateRules=[] (ANNOTATE-only room),
 *   4 annotate rules for blade safety, pull-cut tools, steam bending, and ulu handling
 * - cultural-config.json: Dene/Cree/Anishinaabe attribution for snowshoe, Inuit for ulu,
 *   no rule above Level 2
 * - Try Sessions: 3 beginner sessions (appalachian, first-nations, inuit), tool safety
 *   annotations, 4 basic cuts in whittling session, Dene/Cree attribution and babiche in
 *   snowshoe session, Inuit regional variants in ulu session
 * - sumo-mappings.json: 8+ mappings with kifStatements, CuttingDevice and Tool SUMO terms,
 *   HeritageSkill in at least one mapping
 *
 * @module heritage-skills-pack/skill-hall/rooms/04-woodcraft-tools/room-04.test
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

const whittlingSession = JSON.parse(
  readFileSync(resolve(roomDir, 'try-sessions/basic-whittling-safety.json'), 'utf-8'),
);
const snowshoeSession = JSON.parse(
  readFileSync(resolve(roomDir, 'try-sessions/snowshoe-frame-geometry.json'), 'utf-8'),
);
const uluSession = JSON.parse(
  readFileSync(resolve(roomDir, 'try-sessions/ulu-handle-fitting.json'), 'utf-8'),
);

const allSessions = [whittlingSession, snowshoeSession, uluSession];

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Collect all string values from all steps of a session */
function allStepText(session: typeof whittlingSession): string {
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

describe('Room 04: Woodcraft & Tools', () => {
  // ── room-spec.json ────────────────────────────────────────────────────────────

  describe('room-spec.json', () => {
    it('should have room number 4', () => {
      expect(roomSpec.room).toBe(4);
      expect(roomSpec.id).toBe('room-04-woodcraft-tools');
    });

    it('should have appalachian, first-nations, inuit traditions', () => {
      expect(roomSpec.traditions).toContain('appalachian');
      expect(roomSpec.traditions).toContain('first-nations');
      expect(roomSpec.traditions).toContain('inuit');
    });

    it('should have tool safety domain only', () => {
      expect(roomSpec.safetyDomains).toContain('tool');
      expect(roomSpec.safetyDomains).toHaveLength(1);
    });

    it('should have 6+ content modules', () => {
      expect(roomSpec.modules.length).toBeGreaterThanOrEqual(6);
    });

    it('should have whittling module', () => {
      const whittlingModule = roomSpec.modules.find(
        (m: { id: string }) => m.id === 'woodcraft-04-appalachian-whittling',
      );
      expect(whittlingModule).toBeDefined();
      expect(whittlingModule.tradition).toBe('appalachian');
    });

    it('should have snowshoe module with Dene/Cree attribution', () => {
      const snowshoeModule = roomSpec.modules.find(
        (m: { id: string }) => m.id === 'woodcraft-04-fn-snowshoe-carving',
      );
      expect(snowshoeModule).toBeDefined();
      expect(snowshoeModule.description).toMatch(/Dene|Cree/);
    });

    it('should have ulu module with Inuit attribution', () => {
      const uluModule = roomSpec.modules.find(
        (m: { id: string }) => m.id === 'woodcraft-04-inuit-ulu',
      );
      expect(uluModule).toBeDefined();
      expect(uluModule.tradition).toBe('inuit');
    });

    it('should have snow tools module', () => {
      const snowToolsModule = roomSpec.modules.find(
        (m: { id: string }) => m.id === 'woodcraft-04-inuit-snow-tools',
      );
      expect(snowToolsModule).toBeDefined();
    });
  });

  // ── safety-config.json ────────────────────────────────────────────────────────

  describe('safety-config.json', () => {
    it('should not be critical (isCritical false)', () => {
      expect(safetyConfig.isCritical).toBe(false);
    });

    it('should have empty criticalRules array', () => {
      expect(safetyConfig.criticalRules).toHaveLength(0);
    });

    it('should have empty gateRules array', () => {
      expect(safetyConfig.gateRules).toHaveLength(0);
    });

    it('should have 4+ annotate rules', () => {
      expect(safetyConfig.annotateRules.length).toBeGreaterThanOrEqual(4);
    });

    it('sharp blade annotate rule should be present', () => {
      const rule = safetyConfig.annotateRules.find(
        (r: { id: string }) => r.id === 'ROOM04-ANN-001',
      );
      expect(rule).toBeDefined();
      expect(rule.action).toMatch(/ANNOTATE/);
    });

    it('crooked knife and pull-cut annotate rule present', () => {
      const rule = safetyConfig.annotateRules.find(
        (r: { id: string }) => r.id === 'ROOM04-ANN-002',
      );
      expect(rule).toBeDefined();
      expect(rule.description).toMatch(/[Cc]rooked knife|pull.cut/i);
    });

    it('steam bending annotate rule present', () => {
      const rule = safetyConfig.annotateRules.find(
        (r: { id: string }) => r.id === 'ROOM04-ANN-003',
      );
      expect(rule).toBeDefined();
      expect(rule.trigger).toMatch(/steam/i);
    });

    it('ulu and traditional blade annotate rule present', () => {
      const rule = safetyConfig.annotateRules.find(
        (r: { id: string }) => r.id === 'ROOM04-ANN-004',
      );
      expect(rule).toBeDefined();
      expect(rule.description).toMatch(/ulu|traditional blade/i);
    });
  });

  // ── cultural-config.json ──────────────────────────────────────────────────────

  describe('cultural-config.json', () => {
    it('should have Dene/Cree attribution for snowshoe', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { nationAttribution?: string; concept: string }) =>
          r.nationAttribution && /Dene/.test(r.nationAttribution) && /snowshoe/i.test(r.concept),
      );
      expect(rule).toBeDefined();
    });

    it('should have Inuit attribution for ulu', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { nationAttribution?: string; concept: string }) =>
          r.nationAttribution && /Inuit/.test(r.nationAttribution) && /ulu/i.test(r.concept),
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

    it('should cover appalachian, first-nations, inuit', () => {
      const traditions = allSessions.map((s) => s.tradition);
      expect(traditions).toContain('appalachian');
      expect(traditions).toContain('first-nations');
      expect(traditions).toContain('inuit');
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

    it('whittling session should have tool safety annotation', () => {
      const stepWithSafety = whittlingSession.steps.find(
        (s: { safetyNote?: string }) => s.safetyNote && /tool|blade|cut/i.test(s.safetyNote),
      );
      expect(stepWithSafety).toBeDefined();
    });

    it('whittling session should describe 4 basic cuts', () => {
      const allText = allStepText(whittlingSession);
      expect(allText).toMatch(/push cut/i);
      expect(allText).toMatch(/pull cut/i);
      expect(allText).toMatch(/stop cut/i);
      expect(allText).toMatch(/pare cut/i);
    });

    it('snowshoe session should have Dene nation attribution', () => {
      const stepWithDene = snowshoeSession.steps.find(
        (s: { nationAttribution?: string }) =>
          s.nationAttribution && /Dene/.test(s.nationAttribution),
      );
      expect(stepWithDene).toBeDefined();
    });

    it('snowshoe session should have Cree nation attribution', () => {
      const stepWithCree = snowshoeSession.steps.find(
        (s: { nationAttribution?: string }) =>
          s.nationAttribution && /Cree/.test(s.nationAttribution),
      );
      expect(stepWithCree).toBeDefined();
    });

    it('snowshoe session should mention babiche', () => {
      const allText = allStepText(snowshoeSession);
      expect(allText).toMatch(/babiche/i);
    });

    it('ulu session should have Inuit attribution', () => {
      const stepWithInuit = uluSession.steps.find(
        (s: { nationAttribution?: string }) =>
          s.nationAttribution && /Inuit/.test(s.nationAttribution),
      );
      expect(stepWithInuit).toBeDefined();
    });

    it('ulu session should have tool safety annotation on handle fit', () => {
      const stepWithSafety = uluSession.steps.find(
        (s: { safetyNote?: string }) =>
          s.safetyNote && /handle|loose|wobble/i.test(s.safetyNote),
      );
      expect(stepWithSafety).toBeDefined();
    });

    it('ulu session should mention regional variations', () => {
      const allText = allStepText(uluSession);
      expect(allText).toMatch(/Yup.ik|Inupiat|Greenland/i);
    });

    it('should not contain generic "Native American" without nation name', () => {
      const allText = allSessionText();
      const hasNativeAmericanGeneric = /\bNative American\b/.test(allText);
      expect(hasNativeAmericanGeneric).toBe(false);
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

    it('should have CuttingDevice SUMO term in at least one mapping', () => {
      const cuttingDeviceMappings = sumoMappings.filter(
        (m: { sumoTerm: string }) => m.sumoTerm === 'CuttingDevice',
      );
      expect(cuttingDeviceMappings.length).toBeGreaterThan(0);
    });

    it('should have Tool SUMO term in at least one mapping', () => {
      const toolMappings = sumoMappings.filter(
        (m: { sumoTerm: string }) => m.sumoTerm === 'Tool',
      );
      expect(toolMappings.length).toBeGreaterThan(0);
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
