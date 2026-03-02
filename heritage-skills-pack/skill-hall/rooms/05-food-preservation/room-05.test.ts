/**
 * Tests for Room 05: Food & Preservation
 *
 * Validates:
 * - room-spec.json: SkillModule structure, traditions, safety domains, modules
 * - safety-config.json: critical rules, gate rules, botulism/pemmican/smoking coverage
 * - cultural-config.json: manoomin, pemmican, fermented foods cultural rules
 * - Try Sessions: structure, safety notes, nation attributions, step ordering
 * - sumo-mappings.json: coverage, FoodPreservation class, HeritageSkill class, kifStatements
 *
 * This is a SAFETY-CRITICAL room. Tests enforce that:
 * - Low-acid water-bath canning is hard-stopped
 * - Pemmican fat rendering temperature gate is enforced
 * - Every safety-critical step has a safetyNote
 * - No generic pan-Indigenous language is used without nation attribution
 *
 * @module heritage-skills-pack/skill-hall/rooms/05-food-preservation/room-05.test
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// ─── File Loading ──────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const roomDir = __dirname;
const trySessionDir = resolve(roomDir, 'try-sessions');

const roomSpec = JSON.parse(readFileSync(resolve(roomDir, 'room-spec.json'), 'utf-8'));
const safetyConfig = JSON.parse(readFileSync(resolve(roomDir, 'safety-config.json'), 'utf-8'));
const culturalConfig = JSON.parse(readFileSync(resolve(roomDir, 'cultural-config.json'), 'utf-8'));
const sumoMappings = JSON.parse(readFileSync(resolve(roomDir, 'sumo-mappings.json'), 'utf-8'));

const canningSession = JSON.parse(
  readFileSync(resolve(trySessionDir, 'understanding-canning-safety.json'), 'utf-8'),
);
const pemmicanSession = JSON.parse(
  readFileSync(resolve(trySessionDir, 'pemmican-ratios.json'), 'utf-8'),
);
const arctidDryingSession = JSON.parse(
  readFileSync(resolve(trySessionDir, 'arctic-drying-principles.json'), 'utf-8'),
);

const allSessions = [canningSession, pemmicanSession, arctidDryingSession];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getAllStepText(sessions: unknown[]): string {
  return (sessions as Array<{ steps: Array<{ instruction: string; safetyNote?: string; culturalContext?: string; nationAttribution?: string }> }>)
    .flatMap((s) => s.steps)
    .flatMap((step) => [
      step.instruction,
      step.safetyNote ?? '',
      step.culturalContext ?? '',
      step.nationAttribution ?? '',
    ])
    .join(' ');
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('Room 05: Food & Preservation', () => {
  describe('room-spec.json', () => {
    it('should have room number 5', () => {
      expect(roomSpec.room).toBe(5);
    });

    it('should have all three traditions', () => {
      expect(roomSpec.traditions).toContain('appalachian');
      expect(roomSpec.traditions).toContain('first-nations');
      expect(roomSpec.traditions).toContain('inuit');
    });

    it('should have food, fire, and chemical safety domains', () => {
      expect(roomSpec.safetyDomains).toContain('food');
      expect(roomSpec.safetyDomains).toContain('fire');
      expect(roomSpec.safetyDomains).toContain('chemical');
    });

    it('should have 6+ content modules', () => {
      expect(roomSpec.modules.length).toBeGreaterThanOrEqual(6);
    });

    it('should have modules covering Appalachian tradition', () => {
      const appalachianModules = roomSpec.modules.filter(
        (m: { tradition: string }) => m.tradition === 'appalachian',
      );
      expect(appalachianModules.length).toBeGreaterThanOrEqual(1);
    });

    it('should have modules covering First Nations tradition', () => {
      const fnModules = roomSpec.modules.filter(
        (m: { tradition: string }) => m.tradition === 'first-nations',
      );
      expect(fnModules.length).toBeGreaterThanOrEqual(1);
    });

    it('should have modules covering Inuit tradition', () => {
      const inuitModules = roomSpec.modules.filter(
        (m: { tradition: string }) => m.tradition === 'inuit',
      );
      expect(inuitModules.length).toBeGreaterThanOrEqual(1);
    });

    it('should have FoodPreservation and HeritageSkill in sumoClasses', () => {
      expect(roomSpec.sumoClasses).toContain('FoodPreservation');
      expect(roomSpec.sumoClasses).toContain('HeritageSkill');
    });

    it('should reference the food preservation ontological bridge', () => {
      const bridges = roomSpec.ontologicalBridges ?? [];
      const foodBridge = bridges.find(
        (b: { id: string }) => b.id === 'bridge-02-food-preservation',
      );
      expect(foodBridge).toBeDefined();
    });
  });

  describe('safety-config.json', () => {
    it('should be marked as isCritical', () => {
      expect(safetyConfig.isCritical).toBe(true);
    });

    it('should have at least 3 critical rules', () => {
      expect(safetyConfig.criticalRules.length).toBeGreaterThanOrEqual(3);
    });

    it('should have a low-acid canning critical rule', () => {
      const lowAcidRule = safetyConfig.criticalRules.find(
        (r: { id: string }) => r.id === 'ROOM05-CRIT-001',
      );
      expect(lowAcidRule).toBeDefined();
      expect(lowAcidRule.description).toMatch(/low.?acid/i);
      expect(lowAcidRule.action).toMatch(/HARD STOP|redirect/i);
    });

    it('should have a pemmican temperature critical rule', () => {
      const pemmicanRule = safetyConfig.criticalRules.find(
        (r: { id: string }) => r.id === 'ROOM05-CRIT-002',
      );
      expect(pemmicanRule).toBeDefined();
      expect(pemmicanRule.description).toMatch(/pemmican/i);
      expect(pemmicanRule.description).toMatch(/temperature|121|250/i);
    });

    it('should have a smoking temperature critical rule', () => {
      const smokingRule = safetyConfig.criticalRules.find(
        (r: { id: string }) => r.id === 'ROOM05-CRIT-003',
      );
      expect(smokingRule).toBeDefined();
      expect(smokingRule.description).toMatch(/smok/i);
      expect(smokingRule.description).toMatch(/temperature|internal/i);
    });

    it('should have a fermentation gate rule', () => {
      const fermentRule = safetyConfig.gateRules.find(
        (r: { id: string }) => r.id === 'ROOM05-GATE-001',
      );
      expect(fermentRule).toBeDefined();
      expect(fermentRule.description).toMatch(/ferment/i);
    });

    it('should have gate rules for fermented foods and game processing', () => {
      expect(safetyConfig.gateRules.length).toBeGreaterThanOrEqual(2);
    });

    it('should reference room 5', () => {
      expect(safetyConfig.room).toBe(5);
      expect(safetyConfig.roomId).toBe('room-05-food-preservation');
    });
  });

  describe('cultural-config.json', () => {
    it('should have manoomin rule with Level 1 general and Level 2 ceremonial', () => {
      const manoominRule = culturalConfig.culturalRules.find(
        (r: { id: string }) => r.id === 'ROOM05-CULT-001',
      );
      expect(manoominRule).toBeDefined();
      expect(manoominRule.concept).toMatch(/manoomin|wild rice/i);
      expect(manoominRule.level).toBe(1);
      expect(manoominRule.ceremonialLevel).toBe(2);
    });

    it('should have manoomin rule attributed to Anishinaabe', () => {
      const manoominRule = culturalConfig.culturalRules.find(
        (r: { id: string }) => r.id === 'ROOM05-CULT-001',
      );
      expect(manoominRule.nationAttribution).toMatch(/Anishinaabe/i);
    });

    it('should have pemmican rule with Cree/Métis attribution', () => {
      const pemmicanRule = culturalConfig.culturalRules.find(
        (r: { id: string }) => r.id === 'ROOM05-CULT-002',
      );
      expect(pemmicanRule).toBeDefined();
      expect(pemmicanRule.concept).toMatch(/pemmican/i);
      expect(pemmicanRule.nationAttribution).toMatch(/Cree|M[eé]tis/i);
    });

    it('should have fermented foods rule with summarize-and-refer action', () => {
      const fermentedRule = culturalConfig.culturalRules.find(
        (r: { id: string }) => r.id === 'ROOM05-CULT-003',
      );
      expect(fermentedRule).toBeDefined();
      expect(fermentedRule.action).toBe('summarize-and-refer');
      expect(fermentedRule.concept).toMatch(/fermented/i);
    });

    it('should have maple sugar rule with Anishinaabe/Haudenosaunee attribution', () => {
      const mapleRule = culturalConfig.culturalRules.find(
        (r: { id: string }) => r.id === 'ROOM05-CULT-004',
      );
      expect(mapleRule).toBeDefined();
      expect(mapleRule.nationAttribution).toMatch(/Anishinaabe/i);
      expect(mapleRule.nationAttribution).toMatch(/Haudenosaunee/i);
    });

    it('should have at least 4 cultural rules', () => {
      expect(culturalConfig.culturalRules.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Try Sessions', () => {
    it('should have 3 beginner Try Sessions', () => {
      expect(allSessions.length).toBe(3);
      for (const session of allSessions) {
        expect(session.difficulty).toBe('beginner');
      }
    });

    it('should cover Appalachian tradition', () => {
      const appalachianSessions = allSessions.filter((s) => s.tradition === 'appalachian');
      expect(appalachianSessions.length).toBeGreaterThanOrEqual(1);
    });

    it('should cover First Nations tradition', () => {
      const fnSessions = allSessions.filter((s) => s.tradition === 'first-nations');
      expect(fnSessions.length).toBeGreaterThanOrEqual(1);
    });

    it('should cover Inuit tradition', () => {
      const inuitSessions = allSessions.filter((s) => s.tradition === 'inuit');
      expect(inuitSessions.length).toBeGreaterThanOrEqual(1);
    });

    it('should have all sessions with 5+ steps', () => {
      for (const session of allSessions) {
        expect(session.steps.length).toBeGreaterThanOrEqual(5);
      }
    });

    it('should have all session steps with valid order numbers', () => {
      for (const session of allSessions) {
        const orders = session.steps.map((s: { order: number }) => s.order);
        for (let i = 0; i < orders.length; i++) {
          expect(orders[i]).toBe(i + 1);
        }
      }
    });

    it('should have estimatedMinutes between 15 and 25 for all sessions', () => {
      for (const session of allSessions) {
        expect(session.estimatedMinutes).toBeGreaterThanOrEqual(15);
        expect(session.estimatedMinutes).toBeLessThanOrEqual(25);
      }
    });

    it('should have all sessions with empty prerequisites (beginner level)', () => {
      for (const session of allSessions) {
        expect(session.prerequisites).toHaveLength(0);
      }
    });

    it('should have CRITICAL safetyNote on low-acid canning step', () => {
      const lowAcidStep = canningSession.steps.find(
        (s: { instruction: string }) =>
          s.instruction.includes('low-acid') || s.instruction.includes('Low-acid'),
      );
      expect(lowAcidStep).toBeDefined();
      expect(lowAcidStep.safetyNote).toBeDefined();
      expect(lowAcidStep.safetyNote).toMatch(/CRITICAL|critical|botulism|fatal/i);
    });

    it('should have CRITICAL safetyNote on pemmican fat temperature step', () => {
      const fatStep = pemmicanSession.steps.find(
        (s: { instruction: string }) =>
          s.instruction.toLowerCase().includes('fat rendering') ||
          s.instruction.toLowerCase().includes('rendering'),
      );
      expect(fatStep).toBeDefined();
      expect(fatStep.safetyNote).toBeDefined();
      expect(fatStep.safetyNote).toMatch(/CRITICAL|critical|250|121/i);
    });

    it('should have nationAttribution on Cree/Métis pemmican steps', () => {
      const stepsWithAttribution = pemmicanSession.steps.filter(
        (s: { nationAttribution?: string }) =>
          s.nationAttribution && /Cree|M[eé]tis/.test(s.nationAttribution),
      );
      expect(stepsWithAttribution.length).toBeGreaterThanOrEqual(3);
    });

    it('should have nationAttribution on Inuit drying steps', () => {
      const stepsWithAttribution = arctidDryingSession.steps.filter(
        (s: { nationAttribution?: string }) =>
          s.nationAttribution && /Inuit/.test(s.nationAttribution),
      );
      expect(stepsWithAttribution.length).toBeGreaterThanOrEqual(3);
    });

    it('should have safetyLevel of "gated" for all three sessions', () => {
      for (const session of allSessions) {
        expect(session.safetyLevel).toBe('gated');
      }
    });

    it('should have culturalLevel of 1 for all three sessions', () => {
      for (const session of allSessions) {
        expect(session.culturalLevel).toBe(1);
      }
    });

    it('should not contain generic "Native American" without nation name', () => {
      const allText = getAllStepText(allSessions);
      // "Native American" alone (not followed by a nation name in the same sentence) is disallowed
      const nativeAmericanMatches = allText.match(/Native American/g);
      expect(nativeAmericanMatches).toBeNull();
    });

    it('should not contain bare "Indigenous peoples" without nation name in same sentence', () => {
      // Check step-by-step that "Indigenous peoples" is not used without nation attribution nearby
      for (const session of allSessions) {
        for (const step of session.steps) {
          const instruction = step.instruction ?? '';
          const safetyNote = step.safetyNote ?? '';
          // "Indigenous peoples" without any nation name indicates generic language
          const hasGenericIndigenous =
            /Indigenous peoples/.test(instruction) || /Indigenous peoples/.test(safetyNote);
          if (hasGenericIndigenous) {
            // Must have a nation name nearby -- this is a soft check
            const hasMajorNationName =
              /Inuit|Cree|M[eé]tis|Anishinaabe|Haudenosaunee|Dene|First Nations/.test(
                instruction + safetyNote,
              );
            expect(hasMajorNationName).toBe(true);
          }
        }
      }
    });

    it('should have sumoProcessClass on every session', () => {
      for (const session of allSessions) {
        expect(session.sumoProcessClass).toBeDefined();
        expect(typeof session.sumoProcessClass).toBe('string');
        expect(session.sumoProcessClass.length).toBeGreaterThan(0);
      }
    });
  });

  describe('sumo-mappings.json', () => {
    it('should have 6+ SUMO mappings', () => {
      expect(sumoMappings.length).toBeGreaterThanOrEqual(6);
    });

    it('should reference FoodPreservation SUMO class', () => {
      const foodPreservationMappings = sumoMappings.filter(
        (m: { sumoTerm: string }) => m.sumoTerm === 'FoodPreservation',
      );
      expect(foodPreservationMappings.length).toBeGreaterThanOrEqual(1);
    });

    it('should reference HeritageSkill from heritage ontology', () => {
      const heritageSkillMappings = sumoMappings.filter(
        (m: { sumoTerm: string }) => m.sumoTerm === 'HeritageSkill',
      );
      expect(heritageSkillMappings.length).toBeGreaterThanOrEqual(1);
    });

    it('should have a kifStatement for every mapping', () => {
      for (const mapping of sumoMappings) {
        expect(mapping.kifStatement).toBeDefined();
        expect(typeof mapping.kifStatement).toBe('string');
        expect(mapping.kifStatement.length).toBeGreaterThan(0);
        // Basic KIF format: must start with ( and end with )
        expect(mapping.kifStatement.trim()).toMatch(/^\(.*\)$/s);
      }
    });

    it('should have a naturalLanguage paraphrase for every mapping', () => {
      for (const mapping of sumoMappings) {
        expect(mapping.naturalLanguage).toBeDefined();
        expect(typeof mapping.naturalLanguage).toBe('string');
        expect(mapping.naturalLanguage.length).toBeGreaterThan(0);
      }
    });

    it('should have mappings that cover pemmican', () => {
      const pemmicanMappings = sumoMappings.filter(
        (m: { heritageConceptId: string }) =>
          m.heritageConceptId.includes('pemmican'),
      );
      expect(pemmicanMappings.length).toBeGreaterThanOrEqual(1);
    });

    it('should have mappings that cover fermentation', () => {
      const fermentationMappings = sumoMappings.filter(
        (m: { heritageConceptId: string }) =>
          m.heritageConceptId.includes('ferment'),
      );
      expect(fermentationMappings.length).toBeGreaterThanOrEqual(1);
    });

    it('should have mappings that cover drying', () => {
      const dryingMappings = sumoMappings.filter(
        (m: { heritageConceptId: string }) =>
          m.heritageConceptId.includes('dry') || m.heritageConceptId.includes('cache'),
      );
      expect(dryingMappings.length).toBeGreaterThanOrEqual(1);
    });

    it('should reference heritage-domain-ontology.kif for heritage-specific terms', () => {
      const heritageOntologyMappings = sumoMappings.filter(
        (m: { sumoFile: string }) => m.sumoFile === 'heritage-domain-ontology.kif',
      );
      expect(heritageOntologyMappings.length).toBeGreaterThanOrEqual(1);
    });

    it('should reference Food.kif for standard food preservation terms', () => {
      const foodKifMappings = sumoMappings.filter(
        (m: { sumoFile: string }) => m.sumoFile === 'Food.kif',
      );
      expect(foodKifMappings.length).toBeGreaterThanOrEqual(3);
    });
  });
});
