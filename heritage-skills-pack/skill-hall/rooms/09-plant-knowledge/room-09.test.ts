/**
 * Tests for Room 09: Plant Knowledge
 *
 * Validates:
 * - room-spec.json: SkillModule structure, traditions, safety domains, modules, sacred plant levels
 * - safety-config.json: isCritical flag, critical rules including refuse-ID-from-description,
 *   toxic look-alike gates, lethal plant framing, medicinal redirect, mushroom gate
 * - cultural-config.json: sacred plant Level 1/3-4 split, nation attributions, tundra Level 2
 * - Try Sessions: 3 beginner sessions, CRITICAL safetyNote, look-alike warnings,
 *   Anishinaabe attribution, no medicinal claims, no generic pan-Indigenous language
 * - sumo-mappings.json: 6+ mappings, Plant/HeritageSkill SUMO classes, kifStatements
 *
 * @module heritage-skills-pack/skill-hall/rooms/09-plant-knowledge/room-09.test
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

const safeIdSession = JSON.parse(
  readFileSync(resolve(roomDir, 'try-sessions/safe-plant-id-methodology.json'), 'utf-8'),
);
const birchSession = JSON.parse(
  readFileSync(resolve(roomDir, 'try-sessions/birch-in-anishinaabe-life.json'), 'utf-8'),
);
const dyeSession = JSON.parse(
  readFileSync(resolve(roomDir, 'try-sessions/appalachian-dye-plant-basics.json'), 'utf-8'),
);

const allSessions = [safeIdSession, birchSession, dyeSession];

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Collect all string values from all steps of a session */
function allStepText(session: typeof safeIdSession): string {
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

describe('Room 09: Plant Knowledge', () => {
  // ── room-spec.json ────────────────────────────────────────────────────────────

  describe('room-spec.json', () => {
    it('should have room number 9', () => {
      expect(roomSpec.room).toBe(9);
      expect(roomSpec.id).toBe('room-09-plant-knowledge');
    });

    it('should have all three traditions', () => {
      expect(roomSpec.traditions).toContain('appalachian');
      expect(roomSpec.traditions).toContain('first-nations');
      expect(roomSpec.traditions).toContain('inuit');
    });

    it('should have plant and medical safety domains', () => {
      expect(roomSpec.safetyDomains).toContain('plant');
      expect(roomSpec.safetyDomains).toContain('medical');
    });

    it('should have 6+ content modules', () => {
      expect(roomSpec.modules.length).toBeGreaterThanOrEqual(6);
    });

    it('should have sacred plants module at Level 3 or higher', () => {
      const sacredModule = roomSpec.modules.find(
        (m: { id: string }) => m.id === 'plant-09-fn-sacred-plants',
      );
      expect(sacredModule).toBeDefined();
      expect(sacredModule.culturalLevel).toBeGreaterThanOrEqual(3);
    });

    it('should have 3 try session references', () => {
      expect(roomSpec.trySessions).toHaveLength(3);
    });
  });

  // ── safety-config.json ────────────────────────────────────────────────────────

  describe('safety-config.json', () => {
    it('should be marked as isCritical', () => {
      expect(safetyConfig.isCritical).toBe(true);
      expect(safetyConfig.roomId).toBe('room-09-plant-knowledge');
    });

    it('should have CRITICAL rule for refusing plant ID from description alone', () => {
      const rule = safetyConfig.criticalRules.find(
        (r: { id: string }) => r.id === 'ROOM09-CRIT-001',
      );
      expect(rule).toBeDefined();
      expect(rule.description).toMatch(/NEVER identify a plant from/i);
      expect(rule.action).toMatch(/HARD STOP|refuse identification/i);
    });

    it('should have CRITICAL rule for toxic look-alike warnings', () => {
      const rule = safetyConfig.criticalRules.find(
        (r: { id: string }) => r.id === 'ROOM09-CRIT-002',
      );
      expect(rule).toBeDefined();
      expect(rule.description).toMatch(/look.?alike/i);
      expect(rule.action).toMatch(/GATE/i);
    });

    it('should have CRITICAL rule for lethal plant danger framing', () => {
      const rule = safetyConfig.criticalRules.find(
        (r: { id: string }) => r.id === 'ROOM09-CRIT-003',
      );
      expect(rule).toBeDefined();
      expect(rule.description).toMatch(/[Hh]emlock|[Ff]oxglove|death.?camas|lethal/);
      expect(rule.action).toMatch(/REDIRECT/i);
    });

    it('should have 3 CRITICAL rules total', () => {
      expect(safetyConfig.criticalRules.length).toBeGreaterThanOrEqual(3);
    });

    it('should have REDIRECT rule for medicinal claims', () => {
      const allRules = [...safetyConfig.gateRules, ...safetyConfig.annotateRules];
      const medRule = allRules.find(
        (r: { id: string; action: string }) =>
          r.id === 'ROOM09-GATE-001' || r.action?.match(/REDIRECT.*medicinal|medicinal.*redirect/i),
      );
      expect(medRule).toBeDefined();
      expect(medRule.action).toMatch(/REDIRECT/i);
    });

    it('should have gate rule for mushroom foraging', () => {
      const mushRule = safetyConfig.gateRules.find(
        (r: { id: string }) => r.id === 'ROOM09-GATE-002',
      );
      expect(mushRule).toBeDefined();
      expect(mushRule.description).toMatch(/[Mm]ushroom/);
      expect(mushRule.action).toMatch(/GATE/i);
    });
  });

  // ── cultural-config.json ──────────────────────────────────────────────────────

  describe('cultural-config.json', () => {
    it('should have sacred plant rule with Level 1 identification and Level 3-4 ceremonial', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { id: string }) => r.id === 'ROOM09-CULT-001',
      );
      expect(rule).toBeDefined();
      expect(rule.identificationLevel).toBe(1);
      expect(rule.ceremonialLevel).toBeGreaterThanOrEqual(3);
    });

    it('should have birch/wiigwaas with Anishinaabe attribution', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { id: string }) => r.id === 'ROOM09-CULT-002',
      );
      expect(rule).toBeDefined();
      expect(rule.nationAttribution).toBe('Anishinaabe');
      expect(rule.concept).toMatch(/birch|wiigwaas/i);
    });

    it('should have three sisters with Haudenosaunee attribution', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { id: string }) => r.id === 'ROOM09-CULT-003',
      );
      expect(rule).toBeDefined();
      expect(rule.nationAttribution).toBe('Haudenosaunee');
      expect(rule.concept).toMatch(/three sisters/i);
    });

    it('should have manoomin with Anishinaabe attribution', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { id: string }) => r.id === 'ROOM09-CULT-004',
      );
      expect(rule).toBeDefined();
      expect(rule.nationAttribution).toBe('Anishinaabe');
      expect(rule.concept).toMatch(/manoomin/i);
    });

    it('should have tundra medicinal plants at Level 2 with summarize-and-refer', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { id: string }) => r.id === 'ROOM09-CULT-005',
      );
      expect(rule).toBeDefined();
      expect(rule.level).toBe(2);
      expect(rule.action).toBe('summarize-and-refer');
    });

    it('should have 4+ cultural sovereignty rules', () => {
      expect(culturalConfig.culturalRules.length).toBeGreaterThanOrEqual(4);
    });
  });

  // ── Try Sessions ──────────────────────────────────────────────────────────────

  describe('Try Sessions', () => {
    it('should have 3 beginner Try Sessions', () => {
      expect(allSessions).toHaveLength(3);
      for (const session of allSessions) {
        expect(session.difficulty).toBe('beginner');
      }
    });

    it('should cover cross-tradition, first-nations, and appalachian', () => {
      const traditions = allSessions.map((s) => s.tradition);
      expect(traditions).toContain('cross-tradition');
      expect(traditions).toContain('first-nations');
      expect(traditions).toContain('appalachian');
    });

    it('should have CRITICAL safetyNote about never ID from description alone', () => {
      // The safe-id session step 1 must have the CRITICAL note
      const criticalStep = safeIdSession.steps.find(
        (s: { safetyNote?: string }) =>
          s.safetyNote?.match(/CRITICAL.*NEVER|NEVER.*identify.*single|never.*description/i),
      );
      expect(criticalStep).toBeDefined();
      expect(criticalStep.safetyNote).toMatch(/NEVER/);
    });

    it('should have toxic look-alike warnings in Safe Plant ID session', () => {
      const lookalikesStep = safeIdSession.steps.find(
        (s: { instruction: string }) => s.instruction.match(/look.?alike/i),
      );
      expect(lookalikesStep).toBeDefined();
      expect(lookalikesStep.instruction).toMatch(/look.?alike/i);
    });

    it('should have Anishinaabe nationAttribution in birch session', () => {
      const stepsWithAttribution = birchSession.steps.filter(
        (s: { nationAttribution?: string }) => s.nationAttribution === 'Anishinaabe',
      );
      expect(stepsWithAttribution.length).toBeGreaterThan(0);
    });

    it('should not contain any medicinal claims (only cultural practice framing)', () => {
      // Check that no step contains direct medicinal claims without disclaimer
      // We allow "cultural practice", "cultural knowledge", "not medical advice", etc.
      // We reject standalone claims like "treats X disease" or "cures Y"
      const allText = allSessionText();

      // Check for patterns that would constitute uncaveated medical claims
      // These patterns indicate active medical instruction, not cultural framing
      const forbiddenPatterns = [
        /treats?\s+(?:the\s+)?(?:disease|condition|illness|infection|fever|pain)\b(?![^.]*cultural|[^.]*heritage|[^.]*traditional)/i,
        /cures?\s+(?:the\s+)?(?:disease|condition|illness|infection)\b(?![^.]*cultural|[^.]*heritage|[^.]*traditional)/i,
        /use\s+(?:it|this)\s+(?:for|to\s+treat)\s+(?:disease|condition|illness)\b(?![^.]*cultural)/i,
      ];

      for (const pattern of forbiddenPatterns) {
        expect(allText).not.toMatch(pattern);
      }
    });

    it('should not contain generic "Native American" or "Indigenous peoples" without nation name', () => {
      const allText = allSessionText();
      // Check for standalone generic terms without adjacent nation name
      // The plan requires no generic pan-Indigenous language without attribution
      const hasNativeAmericanGeneric = /\bNative American\b/.test(allText);
      const hasIndigenousPeoplesGeneric = /\bIndigenous peoples\b/.test(allText);
      expect(hasNativeAmericanGeneric).toBe(false);
      expect(hasIndigenousPeoplesGeneric).toBe(false);
    });

    it('safe-plant-id session steps should all have sumoMapping', () => {
      for (const step of safeIdSession.steps) {
        expect(step.sumoMapping).toBeDefined();
        expect(step.sumoMapping).toBeTruthy();
      }
    });

    it('birch session should have wiigwaas in description', () => {
      expect(birchSession.description).toMatch(/wiigwaas/i);
    });

    it('dye session should not contain medicinal use framing', () => {
      // Dye session covers a non-medicinal topic — no medicinal redirects needed
      // but verify no medicinal claims slipped in
      const allDyeText = allStepText(dyeSession);
      expect(allDyeText).not.toMatch(/treats?\s+(?:the\s+)?(?:cancer|disease|illness)\b/i);
    });
  });

  // ── sumo-mappings.json ────────────────────────────────────────────────────────

  describe('sumo-mappings.json', () => {
    it('should have 6+ SUMO mappings', () => {
      expect(sumoMappings.length).toBeGreaterThanOrEqual(6);
    });

    it('should reference Plant SUMO class', () => {
      const plantMappings = sumoMappings.filter(
        (m: { sumoTerm: string; kifStatement: string }) =>
          m.sumoTerm === 'Plant' || m.kifStatement.includes('Plant'),
      );
      expect(plantMappings.length).toBeGreaterThan(0);
    });

    it('should reference HeritageSkill SUMO class', () => {
      const heritageSkillMappings = sumoMappings.filter(
        (m: { sumoTerm: string; kifStatement: string }) =>
          m.sumoTerm === 'HeritageSkill' || m.kifStatement.includes('HeritageSkill'),
      );
      expect(heritageSkillMappings.length).toBeGreaterThan(0);
    });

    it('should have kifStatement for every mapping', () => {
      for (const mapping of sumoMappings) {
        expect(mapping.kifStatement).toBeDefined();
        expect(mapping.kifStatement.length).toBeGreaterThan(0);
        expect(typeof mapping.kifStatement).toBe('string');
      }
    });

    it('should have naturalLanguage for every mapping', () => {
      for (const mapping of sumoMappings) {
        expect(mapping.naturalLanguage).toBeDefined();
        expect(mapping.naturalLanguage.length).toBeGreaterThan(0);
      }
    });

    it('should have valid mappingType for every mapping', () => {
      const validTypes = ['instance', 'subclass', 'equivalent', 'related'];
      for (const mapping of sumoMappings) {
        expect(validTypes).toContain(mapping.mappingType);
      }
    });

    it('should have heritageConceptId starting with room09- for room-level mappings', () => {
      for (const mapping of sumoMappings) {
        expect(mapping.heritageConceptId).toMatch(/^room09-/);
      }
    });
  });
});
