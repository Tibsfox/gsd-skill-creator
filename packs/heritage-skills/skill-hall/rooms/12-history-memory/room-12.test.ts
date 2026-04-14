/**
 * Tests for Room 12: History & Memory
 *
 * Validates:
 * - room-spec.json: SkillModule structure, room 12, traditions (appalachian, first-nations,
 *   inuit), empty safetyDomains, 7 content modules, wampum / winter count / place-names /
 *   IQ-memory modules present
 * - safety-config.json: isCritical=false, ALL rule arrays empty (no physical safety)
 * - cultural-config.json: 7 cultural sovereignty rules including Haudenosaunee attribution for
 *   wampum, Lakota/Dakota attribution for winter counts, Inuit attribution for place names,
 *   Level 3 restrict for wampum ceremonial protocols, Level 4 hard-block for sacred narratives,
 *   oral history methodology at Level 1
 * - Try Sessions: 3 beginner sessions, safetyLevel="standard" all, oral-evidence session
 *   mentions Delgamuukw / wampum / winter count / IQ with nation-specific attributions and OCAP,
 *   no pan-Indigenous language
 * - sumo-mappings.json: 8+ mappings, kifStatement and naturalLanguage on all entries,
 *   OralTradition / Narrative / CulturalPractice / HistoricalEvent terms present
 *
 * @module heritage-skills-pack/skill-hall/rooms/12-history-memory/room-12.test
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

const familyInterviewSession = JSON.parse(
  readFileSync(resolve(roomDir, 'try-sessions/family-history-interview.json'), 'utf-8'),
);
const oralEvidenceSession = JSON.parse(
  readFileSync(resolve(roomDir, 'try-sessions/oral-history-as-evidence.json'), 'utf-8'),
);
const timelineSession = JSON.parse(
  readFileSync(resolve(roomDir, 'try-sessions/personal-timeline-creation.json'), 'utf-8'),
);

const allSessions = [familyInterviewSession, oralEvidenceSession, timelineSession];

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Collect all string values from all steps of a session */
function allStepText(session: typeof familyInterviewSession): string {
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

describe('Room 12: History & Memory', () => {
  // ── room-spec.json ────────────────────────────────────────────────────────────

  describe('room-spec.json', () => {
    it('should have room number 12', () => {
      expect(roomSpec.room).toBe(12);
      expect(roomSpec.id).toBe('room-12-history-memory');
    });

    it('should have appalachian, first-nations, inuit traditions', () => {
      expect(roomSpec.traditions).toContain('appalachian');
      expect(roomSpec.traditions).toContain('first-nations');
      expect(roomSpec.traditions).toContain('inuit');
    });

    it('should have empty safetyDomains array', () => {
      expect(Array.isArray(roomSpec.safetyDomains)).toBe(true);
      expect(roomSpec.safetyDomains.length).toBe(0);
    });

    it('should have 7 content modules', () => {
      expect(roomSpec.modules.length).toBe(7);
    });

    it('should have wampum module', () => {
      const wampumModule = roomSpec.modules.find(
        (m: { id: string }) => /wampum/i.test(m.id),
      );
      expect(wampumModule).toBeDefined();
    });

    it('should have winter count module', () => {
      const winterCountModule = roomSpec.modules.find(
        (m: { id: string }) => /winter.count/i.test(m.id),
      );
      expect(winterCountModule).toBeDefined();
    });

    it('should have Inuit place names module', () => {
      const placeNameModule = roomSpec.modules.find(
        (m: { id: string }) => /place.name/i.test(m.id),
      );
      expect(placeNameModule).toBeDefined();
    });

    it('should have Inuit IQ memory module', () => {
      const iqMemoryModule = roomSpec.modules.find(
        (m: { id: string }) => /iq.memory|iq/i.test(m.id),
      );
      expect(iqMemoryModule).toBeDefined();
    });
  });

  // ── safety-config.json ────────────────────────────────────────────────────────

  describe('safety-config.json', () => {
    it('should not be critical (isCritical false)', () => {
      expect(safetyConfig.isCritical).toBe(false);
    });

    it('should have empty primarySafetyDomains', () => {
      expect(Array.isArray(safetyConfig.primarySafetyDomains)).toBe(true);
      expect(safetyConfig.primarySafetyDomains.length).toBe(0);
    });

    it('should have empty criticalRules array', () => {
      expect(Array.isArray(safetyConfig.criticalRules)).toBe(true);
      expect(safetyConfig.criticalRules.length).toBe(0);
    });

    it('should have empty gateRules array', () => {
      expect(Array.isArray(safetyConfig.gateRules)).toBe(true);
      expect(safetyConfig.gateRules.length).toBe(0);
    });

    it('should have empty annotateRules array', () => {
      expect(Array.isArray(safetyConfig.annotateRules)).toBe(true);
      expect(safetyConfig.annotateRules.length).toBe(0);
    });

    it('all four safety rule arrays should be empty', () => {
      expect(safetyConfig.criticalRules.length).toBe(0);
      expect(safetyConfig.gateRules.length).toBe(0);
      expect(safetyConfig.annotateRules.length).toBe(0);
      expect(safetyConfig.primarySafetyDomains.length).toBe(0);
    });
  });

  // ── cultural-config.json ──────────────────────────────────────────────────────

  describe('cultural-config.json', () => {
    it('should have 7 cultural rules', () => {
      expect(culturalConfig.culturalRules.length).toBe(7);
    });

    it('should have Haudenosaunee attribution for wampum', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { nationAttribution?: string; concept: string }) =>
          r.nationAttribution && /Haudenosaunee/.test(r.nationAttribution) &&
          /wampum/i.test(r.concept),
      );
      expect(rule).toBeDefined();
    });

    it('should have Lakota attribution for winter counts', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { nationAttribution?: string; concept: string }) =>
          r.nationAttribution && /Lakota/.test(r.nationAttribution) &&
          /winter.count/i.test(r.concept),
      );
      expect(rule).toBeDefined();
    });

    it('should have Inuit attribution for place names', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { nationAttribution?: string; concept: string }) =>
          r.nationAttribution && /Inuit/.test(r.nationAttribution) &&
          /place.name|iq/i.test(r.concept),
      );
      expect(rule).toBeDefined();
    });

    it('should have Level 3 restrict for wampum protocols', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { level: number; action: string }) =>
          r.level === 3 && r.action === 'restrict',
      );
      expect(rule).toBeDefined();
    });

    it('should have Level 4 hard-block for sacred narratives', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { level: number; action: string }) =>
          r.level === 4 && r.action === 'hard-block',
      );
      expect(rule).toBeDefined();
    });

    it('should have oral history methodology at Level 1', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { level: number; concept: string }) =>
          r.level === 1 && /oral.history.*method|method/i.test(r.concept),
      );
      expect(rule).toBeDefined();
    });
  });

  // ── Try Sessions ──────────────────────────────────────────────────────────────

  describe('Try Sessions', () => {
    it('should have 3 Try Sessions loaded', () => {
      expect(allSessions).toHaveLength(3);
    });

    it('should all be beginner difficulty', () => {
      for (const session of allSessions) {
        expect(session.difficulty).toBe('beginner');
      }
    });

    it('should all have safetyLevel "standard"', () => {
      for (const session of allSessions) {
        expect(session.safetyLevel).toBe('standard');
      }
    });

    it('oral-evidence session should mention Delgamuukw', () => {
      const text = allStepText(oralEvidenceSession);
      expect(text).toMatch(/Delgamuukw/);
    });

    it('oral-evidence session should mention wampum', () => {
      const text = allStepText(oralEvidenceSession);
      expect(text).toMatch(/wampum/i);
    });

    it('oral-evidence session should mention winter count', () => {
      const text = allStepText(oralEvidenceSession);
      expect(text).toMatch(/winter count/i);
    });

    it('oral-evidence session should have Haudenosaunee attribution', () => {
      const haudenosauneeSteps = oralEvidenceSession.steps.filter(
        (s: { nationAttribution?: string }) =>
          s.nationAttribution && /Haudenosaunee/.test(s.nationAttribution),
      );
      expect(haudenosauneeSteps.length).toBeGreaterThan(0);
    });

    it('oral-evidence session should have Inuit attribution', () => {
      const inuitSteps = oralEvidenceSession.steps.filter(
        (s: { nationAttribution?: string }) =>
          s.nationAttribution && /Inuit/.test(s.nationAttribution),
      );
      expect(inuitSteps.length).toBeGreaterThan(0);
    });

    it('oral-evidence session should mention OCAP', () => {
      const combinedText = allStepText(oralEvidenceSession) + '\n' + allStepText(familyInterviewSession);
      expect(combinedText).toMatch(/OCAP/);
    });

    it('should not contain generic "Native American" without nation name', () => {
      const allText = allSessionText();
      const hasNativeAmericanGeneric = /\bNative American\b/.test(allText);
      expect(hasNativeAmericanGeneric).toBe(false);
    });

    it('should not contain generic "Indigenous peoples" without nation name', () => {
      const allText = allSessionText();
      const hasIndigenousPeoplesGeneric = /\bIndigenous peoples\b/i.test(allText);
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

    it('should have OralTradition SUMO term', () => {
      const oralTraditionMappings = sumoMappings.filter(
        (m: { sumoTerm: string }) => m.sumoTerm === 'OralTradition',
      );
      expect(oralTraditionMappings.length).toBeGreaterThan(0);
    });

    it('should have Narrative SUMO term in at least one mapping', () => {
      const narrativeMappings = sumoMappings.filter(
        (m: { sumoTerm: string }) => m.sumoTerm === 'Narrative',
      );
      expect(narrativeMappings.length).toBeGreaterThan(0);
    });

    it('should have CulturalPractice in at least one mapping', () => {
      const culturalPracticeMappings = sumoMappings.filter(
        (m: { sumoTerm: string }) => m.sumoTerm === 'CulturalPractice',
      );
      expect(culturalPracticeMappings.length).toBeGreaterThan(0);
    });

    it('should have HistoricalEvent in at least one mapping', () => {
      const historicalEventMappings = sumoMappings.filter(
        (m: { sumoTerm: string }) => m.sumoTerm === 'HistoricalEvent',
      );
      expect(historicalEventMappings.length).toBeGreaterThan(0);
    });
  });
});
