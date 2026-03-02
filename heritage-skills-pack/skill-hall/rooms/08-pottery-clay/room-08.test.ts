/**
 * Tests for Room 08: Pottery & Clay
 *
 * Validates:
 * - room-spec.json: SkillModule structure, room 8, traditions (appalachian, first-nations, inuit),
 *   safety domains (fire, chemical, structural), 6 modules, soapstone / Haudenosaunee / face-jug
 *   modules, Room 14 cross-reference present
 * - safety-config.json: isCritical=false, criticalRules empty, 3 gate rules (kiln fire, structural
 *   kiln, thermal shock), 3 annotate rules (glaze chemical, silica dust, soapstone dust)
 * - cultural-config.json: Haudenosaunee attribution at Level 2, Inuit soapstone at Level 1,
 *   Level 3 restrict rule for ceremonial pottery contexts
 * - Try Sessions: 3 beginner sessions (appalachian, first-nations, inuit), correct timing,
 *   coil session culturalLevel 2, Haudenosaunee attribution, soapstone Room 14 cross-ref,
 *   soapstone dust/asbestos safety annotation, no pan-Indigenous language
 * - sumo-mappings.json: 8+ mappings with kifStatement and naturalLanguage on all entries,
 *   PotteryMaking / Kiln / HeritageSkill terms present
 *
 * @module heritage-skills-pack/skill-hall/rooms/08-pottery-clay/room-08.test
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

const pinchPotSession = JSON.parse(
  readFileSync(resolve(roomDir, 'try-sessions/pinch-pot-basics.json'), 'utf-8'),
);
const coilBuildingSession = JSON.parse(
  readFileSync(resolve(roomDir, 'try-sessions/coil-building-technique.json'), 'utf-8'),
);
const soapstoneSession = JSON.parse(
  readFileSync(resolve(roomDir, 'try-sessions/soapstone-properties.json'), 'utf-8'),
);

const allSessions = [pinchPotSession, coilBuildingSession, soapstoneSession];

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Collect all string values from all steps of a session */
function allStepText(session: typeof pinchPotSession): string {
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

describe('Room 08: Pottery & Clay', () => {
  // ── room-spec.json ────────────────────────────────────────────────────────────

  describe('room-spec.json', () => {
    it('should have room number 8', () => {
      expect(roomSpec.room).toBe(8);
      expect(roomSpec.id).toBe('room-08-pottery-clay');
    });

    it('should have fire, chemical, structural safety domains', () => {
      expect(roomSpec.safetyDomains).toContain('fire');
      expect(roomSpec.safetyDomains).toContain('chemical');
      expect(roomSpec.safetyDomains).toContain('structural');
    });

    it('should have appalachian, first-nations, inuit traditions', () => {
      expect(roomSpec.traditions).toContain('appalachian');
      expect(roomSpec.traditions).toContain('first-nations');
      expect(roomSpec.traditions).toContain('inuit');
    });

    it('should have 6 content modules', () => {
      expect(roomSpec.modules.length).toBe(6);
    });

    it('should have soapstone carving module', () => {
      const soapstoneModule = roomSpec.modules.find(
        (m: { id: string }) => /soapstone/i.test(m.id),
      );
      expect(soapstoneModule).toBeDefined();
      expect(soapstoneModule.tradition).toBe('inuit');
    });

    it('should have Haudenosaunee pottery module', () => {
      const haudenosauneeModule = roomSpec.modules.find(
        (m: { id: string }) => /haudenosaunee/i.test(m.id),
      );
      expect(haudenosauneeModule).toBeDefined();
      expect(haudenosauneeModule.tradition).toBe('first-nations');
    });

    it('should have face jug module', () => {
      const faceJugModule = roomSpec.modules.find(
        (m: { id: string }) => /face.jug/i.test(m.id),
      );
      expect(faceJugModule).toBeDefined();
    });

    it('should reference Room 14 for qulliq operation', () => {
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

    it('should have 3 gate rules', () => {
      expect(safetyConfig.gateRules.length).toBe(3);
    });

    it('should have kiln fire gate rule', () => {
      const rule = safetyConfig.gateRules.find(
        (r: { id: string }) => r.id === 'ROOM08-GATE-001',
      );
      expect(rule).toBeDefined();
      expect(rule.action).toMatch(/GATE/);
    });

    it('should have structural kiln construction gate rule', () => {
      const rule = safetyConfig.gateRules.find(
        (r: { id: string }) => r.id === 'ROOM08-GATE-002',
      );
      expect(rule).toBeDefined();
      expect(rule.action).toMatch(/GATE/);
    });

    it('should have thermal shock gate rule', () => {
      const rule = safetyConfig.gateRules.find(
        (r: { id: string }) => r.id === 'ROOM08-GATE-003',
      );
      expect(rule).toBeDefined();
      expect(rule.action).toMatch(/GATE/);
    });

    it('should have 3 annotate rules', () => {
      expect(safetyConfig.annotateRules.length).toBe(3);
    });

    it('should have glaze chemical annotate rule', () => {
      const rule = safetyConfig.annotateRules.find(
        (r: { id: string; trigger: string }) =>
          r.id === 'ROOM08-ANN-001' && /glaze|chemical/i.test(r.trigger),
      );
      expect(rule).toBeDefined();
      expect(rule.action).toMatch(/ANNOTATE/);
    });

    it('should have silica dust annotate rule', () => {
      const rule = safetyConfig.annotateRules.find(
        (r: { id: string; action: string }) =>
          r.id === 'ROOM08-ANN-002' && /silica/i.test(r.action),
      );
      expect(rule).toBeDefined();
      expect(rule.action).toMatch(/ANNOTATE/);
    });

    it('should have soapstone dust annotate rule', () => {
      const rule = safetyConfig.annotateRules.find(
        (r: { id: string; trigger: string }) =>
          r.id === 'ROOM08-ANN-003' && /soapstone/i.test(r.trigger),
      );
      expect(rule).toBeDefined();
      expect(rule.action).toMatch(/ANNOTATE/);
    });
  });

  // ── cultural-config.json ──────────────────────────────────────────────────────

  describe('cultural-config.json', () => {
    it('should have Haudenosaunee attribution for pottery design at Level 2', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { nationAttribution?: string; level: number }) =>
          r.nationAttribution && /Haudenosaunee/.test(r.nationAttribution) && r.level === 2,
      );
      expect(rule).toBeDefined();
    });

    it('should have Inuit attribution for soapstone at Level 1', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { nationAttribution?: string; level: number; concept: string }) =>
          r.nationAttribution &&
          /Inuit/.test(r.nationAttribution) &&
          r.level === 1 &&
          /soapstone/i.test(r.concept),
      );
      expect(rule).toBeDefined();
    });

    it('should have Level 3 restrict rule for ceremonial pottery contexts', () => {
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

    it('should cover appalachian, first-nations, and inuit', () => {
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

    it('coil building session should be culturalLevel 2', () => {
      expect(coilBuildingSession.culturalLevel).toBe(2);
    });

    it('soapstone session should mention Room 14 cross-reference', () => {
      const soapstoneText = allStepText(soapstoneSession);
      expect(soapstoneText).toMatch(/Room 14/);
    });

    it('soapstone session should have dust safety annotation', () => {
      const dustStep = soapstoneSession.steps.find(
        (s: { safetyNote?: string }) =>
          s.safetyNote && /dust|asbestos|N95/i.test(s.safetyNote),
      );
      expect(dustStep).toBeDefined();
    });

    it('coil session should have Haudenosaunee attribution', () => {
      const haudenosauneeSteps = coilBuildingSession.steps.filter(
        (s: { nationAttribution?: string }) =>
          s.nationAttribution && /Haudenosaunee/.test(s.nationAttribution),
      );
      expect(haudenosauneeSteps.length).toBeGreaterThan(0);
    });

    it('should not contain generic "Native American" without nation name', () => {
      const allText = allSessionText();
      expect(/\bNative American\b/.test(allText)).toBe(false);
      expect(/\bindigenous peoples\b/i.test(allText)).toBe(false);
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

    it('should have PotteryMaking SUMO term in at least one mapping', () => {
      const potteryMappings = sumoMappings.filter(
        (m: { sumoTerm: string }) => m.sumoTerm === 'PotteryMaking',
      );
      expect(potteryMappings.length).toBeGreaterThan(0);
    });

    it('should have Kiln SUMO term in at least one mapping', () => {
      const kilnMappings = sumoMappings.filter(
        (m: { sumoTerm: string }) => m.sumoTerm === 'Kiln',
      );
      expect(kilnMappings.length).toBeGreaterThan(0);
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
