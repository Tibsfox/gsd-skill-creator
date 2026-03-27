/**
 * Tests for Room 07: Metalwork & Smithing
 *
 * Validates:
 * - room-spec.json: SkillModule structure, room 7, traditions (appalachian, first-nations, inuit),
 *   safety domains (fire, tool, chemical, structural), 6 modules, forge fundamentals /
 *   knife-making / Inuinnait copper / FN copper-silver modules
 * - safety-config.json: isCritical=false, criticalRules empty, 4 gate rules (fire×2, structural×1,
 *   quench×1), 3 annotate rules (tool, chemical/flux, CO/ventilation)
 * - cultural-config.json: Inuinnait attribution at Level 1, Level 3 restrict for potlatch copper,
 *   no rule at Level 4
 * - Try Sessions: 3 beginner sessions (all appalachian), safetyLevel="gated" for all,
 *   heat colors / tong-work / nail-making content, fire gate safetyNotes, no pan-Indigenous language
 * - sumo-mappings.json: 8+ mappings, MetalworkingProcess / MetallicArtifact / HeritageSkill terms
 *
 * @module heritage-skills-pack/skill-hall/rooms/07-metalwork-smithing/room-07.test
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

const heatColorsSession = JSON.parse(
  readFileSync(resolve(roomDir, 'try-sessions/forge-heat-colors.json'), 'utf-8'),
);
const tongWorkSession = JSON.parse(
  readFileSync(resolve(roomDir, 'try-sessions/basic-tong-work.json'), 'utf-8'),
);
const nailMakingSession = JSON.parse(
  readFileSync(resolve(roomDir, 'try-sessions/nail-making-exercise.json'), 'utf-8'),
);

const allSessions = [heatColorsSession, tongWorkSession, nailMakingSession];

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Collect all string values from all steps of a session */
function allStepText(session: typeof heatColorsSession): string {
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

describe('Room 07: Metalwork & Smithing', () => {
  // ── room-spec.json ────────────────────────────────────────────────────────────

  describe('room-spec.json', () => {
    it('should have room number 7', () => {
      expect(roomSpec.room).toBe(7);
      expect(roomSpec.id).toBe('room-07-metalwork-smithing');
    });

    it('should have appalachian, first-nations, and inuit traditions', () => {
      expect(roomSpec.traditions).toContain('appalachian');
      expect(roomSpec.traditions).toContain('first-nations');
      expect(roomSpec.traditions).toContain('inuit');
    });

    it('should have fire, tool, chemical, structural safety domains', () => {
      expect(roomSpec.safetyDomains).toContain('fire');
      expect(roomSpec.safetyDomains).toContain('tool');
      expect(roomSpec.safetyDomains).toContain('chemical');
      expect(roomSpec.safetyDomains).toContain('structural');
    });

    it('should have 6 content modules', () => {
      expect(roomSpec.modules.length).toBe(6);
    });

    it('should have forge fundamentals module', () => {
      const forgeModule = roomSpec.modules.find(
        (m: { id: string }) => /forge.fund/i.test(m.id),
      );
      expect(forgeModule).toBeDefined();
    });

    it('should have knife making module', () => {
      const knifeModule = roomSpec.modules.find(
        (m: { id: string }) => /knife/i.test(m.id),
      );
      expect(knifeModule).toBeDefined();
    });

    it('should have Inuinnait copper module', () => {
      const copperInuitModule = roomSpec.modules.find(
        (m: { id: string }) => /copper.inuit|inuinnait/i.test(m.id),
      );
      expect(copperInuitModule).toBeDefined();
    });

    it('should have First Nations copper/silver module', () => {
      const fnCopperModule = roomSpec.modules.find(
        (m: { id: string }) => /fn.copper|copper.silver/i.test(m.id),
      );
      expect(fnCopperModule).toBeDefined();
    });

    it('should have Inuinnait module at culturalLevel 1', () => {
      const inuinnaitModule = roomSpec.modules.find(
        (m: { id: string }) => /copper.inuit|inuinnait/i.test(m.id),
      );
      expect(inuinnaitModule).toBeDefined();
      expect(inuinnaitModule.culturalLevel).toBe(1);
    });

    it('should have FN copper/silver module at culturalLevel 2', () => {
      const fnCopperModule = roomSpec.modules.find(
        (m: { id: string }) => /fn.copper|copper.silver/i.test(m.id),
      );
      expect(fnCopperModule).toBeDefined();
      expect(fnCopperModule.culturalLevel).toBe(2);
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

    it('should have 4 gate rules', () => {
      expect(safetyConfig.gateRules.length).toBe(4);
    });

    it('should have fire forge operation gate rule', () => {
      const rule = safetyConfig.gateRules.find(
        (r: { id: string }) => r.id === 'ROOM07-GATE-001',
      );
      expect(rule).toBeDefined();
      expect(rule.action).toMatch(/GATE/);
    });

    it('should have high heat forging gate rule', () => {
      const rule = safetyConfig.gateRules.find(
        (r: { id: string }) => r.id === 'ROOM07-GATE-002',
      );
      expect(rule).toBeDefined();
      expect(rule.action).toMatch(/GATE/);
    });

    it('should have structural forge construction gate rule', () => {
      const rule = safetyConfig.gateRules.find(
        (r: { id: string }) => r.id === 'ROOM07-GATE-003',
      );
      expect(rule).toBeDefined();
      expect(rule.action).toMatch(/GATE/);
    });

    it('should have quench safety gate rule', () => {
      const rule = safetyConfig.gateRules.find(
        (r: { id: string }) => r.id === 'ROOM07-GATE-004',
      );
      expect(rule).toBeDefined();
      expect(rule.action).toMatch(/GATE/);
    });

    it('should have 3 annotate rules', () => {
      expect(safetyConfig.annotateRules.length).toBe(3);
    });

    it('should have tool safety annotate rule', () => {
      const rule = safetyConfig.annotateRules.find(
        (r: { id: string }) => r.id === 'ROOM07-ANN-001',
      );
      expect(rule).toBeDefined();
      expect(rule.action).toMatch(/ANNOTATE/);
    });

    it('should have chemical (flux) annotate rule', () => {
      const rule = safetyConfig.annotateRules.find(
        (r: { id: string }) => r.id === 'ROOM07-ANN-002',
      );
      expect(rule).toBeDefined();
      expect(rule.trigger).toMatch(/flux/i);
    });

    it('should have CO/ventilation annotate rule', () => {
      const rule = safetyConfig.annotateRules.find(
        (r: { id: string }) => r.id === 'ROOM07-ANN-003',
      );
      expect(rule).toBeDefined();
      expect(rule.action).toMatch(/CO/i);
    });
  });

  // ── cultural-config.json ──────────────────────────────────────────────────────

  describe('cultural-config.json', () => {
    it('should have Inuinnait attribution for copper working at Level 1', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { nationAttribution?: string; level: number }) =>
          r.nationAttribution && /Inuinnait/.test(r.nationAttribution) && r.level === 1,
      );
      expect(rule).toBeDefined();
    });

    it('should have Level 3 restrict for potlatch copper', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { level: number; action: string }) => r.level === 3 && r.action === 'restrict',
      );
      expect(rule).toBeDefined();
    });

    it('should have no rule at Level 4', () => {
      for (const rule of culturalConfig.culturalRules) {
        expect(rule.level).toBeLessThan(4);
      }
    });
  });

  // ── Try Sessions ──────────────────────────────────────────────────────────────

  describe('Try Sessions', () => {
    it('should have 3 Try Sessions loaded', () => {
      expect(allSessions).toHaveLength(3);
    });

    it('should all be appalachian tradition', () => {
      for (const session of allSessions) {
        expect(session.tradition).toBe('appalachian');
      }
    });

    it('should all be beginner difficulty', () => {
      for (const session of allSessions) {
        expect(session.difficulty).toBe('beginner');
      }
    });

    it('should all have safetyLevel "gated"', () => {
      for (const session of allSessions) {
        expect(session.safetyLevel).toBe('gated');
      }
    });

    it('heat colors session should mention cherry red heat', () => {
      const allText = allStepText(heatColorsSession);
      expect(allText).toMatch(/cherry red/i);
    });

    it('heat colors session should mention forge gate safety', () => {
      const gateStep = heatColorsSession.steps.find(
        (s: { safetyNote?: string }) => s.safetyNote && /gate|GATE/i.test(s.safetyNote),
      );
      expect(gateStep).toBeDefined();
    });

    it('tong work session should cover tong selection and jaw', () => {
      const allText = allStepText(tongWorkSession);
      expect(allText).toMatch(/tong|jaw/i);
    });

    it('tong work session should have forge-to-anvil path safety note', () => {
      const pathStep = tongWorkSession.steps.find(
        (s: { safetyNote?: string }) =>
          s.safetyNote && /forge to anvil|path|obstacles/i.test(s.safetyNote),
      );
      expect(pathStep).toBeDefined();
    });

    it('nail making session should cover drawing and heading', () => {
      const allText = allStepText(nailMakingSession);
      expect(allText).toMatch(/draw|heading/i);
    });

    it('should not contain generic "Native American" without nation name', () => {
      const allText = allSessionText();
      expect(/\bNative American\b/.test(allText)).toBe(false);
    });

    it('should not contain generic "Indigenous peoples"', () => {
      const allText = allSessionText();
      expect(/\bIndigenous peoples\b/i.test(allText)).toBe(false);
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

    it('should have MetalworkingProcess SUMO term in at least one mapping', () => {
      const metalworkingMappings = sumoMappings.filter(
        (m: { sumoTerm: string }) => m.sumoTerm === 'MetalworkingProcess',
      );
      expect(metalworkingMappings.length).toBeGreaterThan(0);
    });

    it('should have MetallicArtifact SUMO term in at least one mapping', () => {
      const metallicMappings = sumoMappings.filter(
        (m: { sumoTerm: string }) => m.sumoTerm === 'MetallicArtifact',
      );
      expect(metallicMappings.length).toBeGreaterThan(0);
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
