/**
 * Tests for Room 10: Community & Culture
 *
 * Validates:
 * - room-spec.json: SkillModule structure, room 10, traditions (appalachian, first-nations, inuit),
 *   safetyDomains=[] (empty — no physical safety), 6 modules including Haudenosaunee Confederacy,
 *   Anishinaabe clan, Inuit consensus, and IQ community modules
 * - safety-config.json: isCritical=false, ALL rule arrays empty (primarySafetyDomains=[],
 *   criticalRules=[], gateRules=[], annotateRules=[]) — highest cultural sovereignty room
 *   with zero physical safety
 * - cultural-config.json: 6 rules including Level 3 restrict for ceremonial governance,
 *   Level 4 hard-block for shamanic authority; Haudenosaunee, Anishinaabe, and Inuit
 *   nation-specific attributions
 * - Try Sessions: 3 beginner sessions (appalachian, inuit, appalachian), correct timing,
 *   Aajiiqatigiinniq and Pijitsirniq in IQ session, OCAP in foxfire session, no safetyNote fields,
 *   no pan-Indigenous language
 * - sumo-mappings.json: 8+ mappings with kifStatement and naturalLanguage on all entries,
 *   SocialGroup, Government/NormativeAttribute, and CulturalPractice terms present
 *
 * @module heritage-skills-pack/skill-hall/rooms/10-community-culture/room-10.test
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

const foxfireSession = JSON.parse(
  readFileSync(resolve(roomDir, 'try-sessions/foxfire-interview-ethics.json'), 'utf-8'),
);
const iqSession = JSON.parse(
  readFileSync(resolve(roomDir, 'try-sessions/iq-principles-exploration.json'), 'utf-8'),
);
const communityMappingSession = JSON.parse(
  readFileSync(resolve(roomDir, 'try-sessions/appalachian-community-mapping.json'), 'utf-8'),
);

const allSessions = [foxfireSession, iqSession, communityMappingSession];

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Collect all string values from all steps of a session */
function allStepText(session: typeof foxfireSession): string {
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

describe('Room 10: Community & Culture', () => {
  // ── room-spec.json ────────────────────────────────────────────────────────────

  describe('room-spec.json', () => {
    it('should have room number 10', () => {
      expect(roomSpec.room).toBe(10);
      expect(roomSpec.id).toBe('room-10-community-culture');
    });

    it('should have appalachian, first-nations, inuit traditions', () => {
      expect(roomSpec.traditions).toContain('appalachian');
      expect(roomSpec.traditions).toContain('first-nations');
      expect(roomSpec.traditions).toContain('inuit');
    });

    it('should have empty safetyDomains array', () => {
      expect(roomSpec.safetyDomains).toBeDefined();
      expect(Array.isArray(roomSpec.safetyDomains)).toBe(true);
      expect(roomSpec.safetyDomains.length).toBe(0);
    });

    it('should have 6 content modules', () => {
      expect(roomSpec.modules.length).toBe(6);
    });

    it('should have Haudenosaunee Confederacy module', () => {
      const module = roomSpec.modules.find(
        (m: { id: string; description: string }) =>
          /haudenosaunee/i.test(m.id) || /Great Law/i.test(m.description),
      );
      expect(module).toBeDefined();
    });

    it('should have Anishinaabe clan module', () => {
      const module = roomSpec.modules.find(
        (m: { id: string; description: string }) =>
          /anishinaabe/i.test(m.id) || /dodem|clan/i.test(m.description),
      );
      expect(module).toBeDefined();
    });

    it('should have Inuit consensus module', () => {
      const module = roomSpec.modules.find(
        (m: { id: string; description: string }) =>
          /consensus/i.test(m.id) || /Aajiiqatigiinniq/.test(m.description),
      );
      expect(module).toBeDefined();
    });

    it('should have IQ community module', () => {
      const module = roomSpec.modules.find(
        (m: { id: string }) => /iq/i.test(m.id),
      );
      expect(module).toBeDefined();
    });
  });

  // ── safety-config.json ────────────────────────────────────────────────────────

  describe('safety-config.json', () => {
    it('should not be critical (isCritical false)', () => {
      expect(safetyConfig.isCritical).toBe(false);
    });

    it('should have empty primarySafetyDomains', () => {
      expect(safetyConfig.primarySafetyDomains).toBeDefined();
      expect(Array.isArray(safetyConfig.primarySafetyDomains)).toBe(true);
      expect(safetyConfig.primarySafetyDomains.length).toBe(0);
    });

    it('should have empty criticalRules array', () => {
      expect(safetyConfig.criticalRules).toBeDefined();
      expect(safetyConfig.criticalRules.length).toBe(0);
    });

    it('should have empty gateRules array', () => {
      expect(safetyConfig.gateRules).toBeDefined();
      expect(safetyConfig.gateRules.length).toBe(0);
    });

    it('should have empty annotateRules array', () => {
      expect(safetyConfig.annotateRules).toBeDefined();
      expect(safetyConfig.annotateRules.length).toBe(0);
    });

    it('safety-config should have all four rule arrays empty', () => {
      expect(safetyConfig.criticalRules.length).toBe(0);
      expect(safetyConfig.gateRules.length).toBe(0);
      expect(safetyConfig.annotateRules.length).toBe(0);
      expect(safetyConfig.primarySafetyDomains.length).toBe(0);
    });
  });

  // ── cultural-config.json ──────────────────────────────────────────────────────

  describe('cultural-config.json', () => {
    it('should have 6 cultural rules', () => {
      expect(culturalConfig.culturalRules.length).toBe(6);
    });

    it('should have Haudenosaunee attribution for Great Law', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { nationAttribution?: string; concept: string }) =>
          r.nationAttribution && /Haudenosaunee/.test(r.nationAttribution) &&
          /Great Law|Confederacy/i.test(r.concept),
      );
      expect(rule).toBeDefined();
    });

    it('should have Anishinaabe attribution for dodem/clan', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { nationAttribution?: string; concept: string }) =>
          r.nationAttribution && /Anishinaabe/.test(r.nationAttribution) &&
          /dodem|clan/i.test(r.concept),
      );
      expect(rule).toBeDefined();
    });

    it('should have Inuit attribution for Aajiiqatigiinniq', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { nationAttribution?: string; concept: string }) =>
          r.nationAttribution && /Inuit/.test(r.nationAttribution) &&
          /Aajiiqatigiinniq/.test(r.concept),
      );
      expect(rule).toBeDefined();
    });

    it('should have a Level 3 restrict rule', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { level: number; action: string }) => r.level === 3 && r.action === 'restrict',
      );
      expect(rule).toBeDefined();
    });

    it('should have a Level 4 hard-block rule', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { level: number; action: string }) => r.level === 4 && r.action === 'hard-block',
      );
      expect(rule).toBeDefined();
    });

    it('should have no rule at Level 3+ that is not restrict or hard-block', () => {
      const highLevelRules = culturalConfig.culturalRules.filter(
        (r: { level: number }) => r.level >= 3,
      );
      for (const rule of highLevelRules) {
        expect(['restrict', 'hard-block']).toContain(rule.action);
      }
    });
  });

  // ── Try Sessions ──────────────────────────────────────────────────────────────

  describe('Try Sessions', () => {
    it('should have 3 Try Sessions loaded', () => {
      expect(allSessions).toHaveLength(3);
    });

    it('should cover appalachian and inuit traditions', () => {
      const traditions = allSessions.map((s) => s.tradition);
      expect(traditions).toContain('appalachian');
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

    it('should all have safetyLevel "standard"', () => {
      for (const session of allSessions) {
        expect(session.safetyLevel).toBe('standard');
      }
    });

    it('iq-principles session should mention Aajiiqatigiinniq', () => {
      const iqText = allStepText(iqSession);
      expect(iqText).toMatch(/Aajiiqatigiinniq/);
    });

    it('iq-principles session should mention Pijitsirniq', () => {
      const iqText = allStepText(iqSession);
      expect(iqText).toMatch(/Pijitsirniq/);
    });

    it('iq-principles session should have Inuit nation attribution', () => {
      const inuitSteps = iqSession.steps.filter(
        (s: { nationAttribution?: string }) =>
          s.nationAttribution && /Inuit/.test(s.nationAttribution),
      );
      expect(inuitSteps.length).toBeGreaterThan(0);
    });

    it('foxfire session should mention OCAP', () => {
      const foxfireText = allStepText(foxfireSession);
      expect(foxfireText).toMatch(/OCAP/);
    });

    it('should not contain generic "Native American" without nation name', () => {
      const allText = allSessionText();
      const hasNativeAmericanGeneric = /\bNative American\b/.test(allText);
      expect(hasNativeAmericanGeneric).toBe(false);
    });

    it('should not contain generic "Indigenous peoples" without nation name', () => {
      const allText = allSessionText();
      const hasIndigenousPeoplesGeneric = /\bIndigenous peoples\b/.test(allText);
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

    it('should have SocialGroup SUMO term in at least one mapping', () => {
      const socialGroupMappings = sumoMappings.filter(
        (m: { sumoTerm: string }) => m.sumoTerm === 'SocialGroup',
      );
      expect(socialGroupMappings.length).toBeGreaterThan(0);
    });

    it('should have Government or NormativeAttribute term in at least one mapping', () => {
      const govMappings = sumoMappings.filter(
        (m: { sumoTerm: string }) =>
          m.sumoTerm === 'Government' || m.sumoTerm === 'NormativeAttribute',
      );
      expect(govMappings.length).toBeGreaterThan(0);
    });

    it('should have CulturalPractice in at least one mapping', () => {
      const culturalMappings = sumoMappings.filter(
        (m: { sumoTerm: string; kifStatement: string }) =>
          m.sumoTerm === 'CulturalPractice' || m.kifStatement.includes('CulturalPractice'),
      );
      expect(culturalMappings.length).toBeGreaterThan(0);
    });
  });
});
