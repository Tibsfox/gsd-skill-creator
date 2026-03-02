/**
 * Tests for Room 03: Animals & Wildlife
 *
 * Validates:
 * - room-spec.json: SkillModule structure, 3 traditions, 3 safety domains (animal/tool/food),
 *   7 modules covering Appalachian husbandry/beekeeping, First Nations trapping/tracking/brain-tanning,
 *   Inuit seal/caribou/marine ecology
 * - safety-config.json: ANNOTATE-only (no gate/critical rules), 5 annotate rules covering
 *   animal handling, bee sting allergy, tool safety, game meat food safety, zoonotic disease
 * - cultural-config.json: 6 rules; trapping protocols at Level 2 (Cree/Dene/Anishinaabe),
 *   IQ animal relationship at Level 2 (Inuit), no rules above Level 2
 * - Try Sessions: 3 beginner sessions (appalachian/cross-tradition/first-nations), bee sting
 *   safety in beekeeping, Cree/Anishinaabe attribution in tracking, Cree/Dene attribution
 *   in hide scraping, predator safety note, no pan-Indigenous language
 * - sumo-mappings.json: 8+ mappings with kifStatements and naturalLanguage,
 *   Hunting/Animal/DomesticAnimal/HeritageSkill/BiologicalProcess terms present
 *
 * @module heritage-skills-pack/skill-hall/rooms/03-animals-wildlife/room-03.test
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

const beekeepingSession = JSON.parse(
  readFileSync(resolve(roomDir, 'try-sessions/beekeeping-basics.json'), 'utf-8'),
);
const trackingSession = JSON.parse(
  readFileSync(resolve(roomDir, 'try-sessions/track-identification.json'), 'utf-8'),
);
const hideSession = JSON.parse(
  readFileSync(resolve(roomDir, 'try-sessions/hide-scraping-overview.json'), 'utf-8'),
);

const allSessions = [beekeepingSession, trackingSession, hideSession];

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Collect all string values from all steps of a session */
function allStepText(session: typeof beekeepingSession): string {
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

describe('Room 03: Animals & Wildlife', () => {
  // ── room-spec.json ────────────────────────────────────────────────────────────

  describe('room-spec.json', () => {
    it('should have room number 3', () => {
      expect(roomSpec.room).toBe(3);
      expect(roomSpec.id).toBe('room-03-animals-wildlife');
    });

    it('should have appalachian, first-nations, inuit traditions', () => {
      expect(roomSpec.traditions).toContain('appalachian');
      expect(roomSpec.traditions).toContain('first-nations');
      expect(roomSpec.traditions).toContain('inuit');
    });

    it('should have animal, tool, and food safety domains', () => {
      expect(roomSpec.safetyDomains).toContain('animal');
      expect(roomSpec.safetyDomains).toContain('tool');
      expect(roomSpec.safetyDomains).toContain('food');
      expect(roomSpec.safetyDomains).toHaveLength(3);
    });

    it('should have 6+ content modules', () => {
      expect(roomSpec.modules.length).toBeGreaterThanOrEqual(6);
    });

    it('should have trapping module with Cree/Dene attribution', () => {
      const trappingModule = roomSpec.modules.find(
        (m: { id: string }) => m.id === 'animals-03-fn-trapping-snaring',
      );
      expect(trappingModule).toBeDefined();
      expect(trappingModule.description).toMatch(/Cree|Dene/);
    });

    it('should have brain-tanning module', () => {
      const brainTanningModule = roomSpec.modules.find(
        (m: { id: string }) => m.id === 'animals-03-fn-brain-tanning',
      );
      expect(brainTanningModule).toBeDefined();
      expect(brainTanningModule.tradition).toBe('first-nations');
    });

    it('should have seal/caribou module with Inuit attribution', () => {
      const sealModule = roomSpec.modules.find(
        (m: { id: string }) => m.id === 'animals-03-inuit-seal-caribou',
      );
      expect(sealModule).toBeDefined();
      expect(sealModule.tradition).toBe('inuit');
    });

    it('should have beekeeping module', () => {
      const beekeepingModule = roomSpec.modules.find(
        (m: { id: string }) => m.id === 'animals-03-appalachian-beekeeping',
      );
      expect(beekeepingModule).toBeDefined();
    });

    it('trapping module should be at culturalLevel 2', () => {
      const trappingModule = roomSpec.modules.find(
        (m: { id: string }) => m.id === 'animals-03-fn-trapping-snaring',
      );
      expect(trappingModule).toBeDefined();
      expect(trappingModule.culturalLevel).toBe(2);
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

    it('should have 5 annotate rules', () => {
      expect(safetyConfig.annotateRules).toHaveLength(5);
    });

    it('should have animal handling annotate rule', () => {
      const rule = safetyConfig.annotateRules.find(
        (r: { id: string }) => r.id === 'ROOM03-ANN-001',
      );
      expect(rule).toBeDefined();
      expect(rule.trigger).toMatch(/animal/i);
    });

    it('should have bee sting allergy annotate rule', () => {
      const rule = safetyConfig.annotateRules.find(
        (r: { id: string }) => r.id === 'ROOM03-ANN-002',
      );
      expect(rule).toBeDefined();
      expect(rule.action).toMatch(/allerg|EpiPen/i);
    });

    it('should have tool safety annotate rule for trapping/hide', () => {
      const rule = safetyConfig.annotateRules.find(
        (r: { id: string }) => r.id === 'ROOM03-ANN-003',
      );
      expect(rule).toBeDefined();
      expect(rule.description).toMatch(/[Tt]ool/);
    });

    it('should have game meat food safety annotate rule', () => {
      const rule = safetyConfig.annotateRules.find(
        (r: { id: string }) => r.id === 'ROOM03-ANN-004',
      );
      expect(rule).toBeDefined();
      expect(rule.action).toMatch(/field-dress|CWD|cool/i);
    });

    it('should have zoonotic disease annotate rule', () => {
      const rule = safetyConfig.annotateRules.find(
        (r: { id: string }) => r.id === 'ROOM03-ANN-005',
      );
      expect(rule).toBeDefined();
      expect(rule.action).toMatch(/rabies|zoonot/i);
    });
  });

  // ── cultural-config.json ──────────────────────────────────────────────────────

  describe('cultural-config.json', () => {
    it('should have 6 cultural rules', () => {
      expect(culturalConfig.culturalRules).toHaveLength(6);
    });

    it('should have trapping technique at Level 1 with Cree/Dene attribution', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { id: string }) => r.id === 'ROOM03-CULT-002',
      );
      expect(rule).toBeDefined();
      expect(rule.level).toBe(1);
      expect(rule.nationAttribution).toMatch(/Cree/);
      expect(rule.nationAttribution).toMatch(/Dene/);
    });

    it('should have trapping protocols at Level 2', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { concept: string; level: number }) =>
          /protocol|relationship/i.test(r.concept) && r.level === 2,
      );
      expect(rule).toBeDefined();
      expect(rule.level).toBe(2);
    });

    it('should have IQ animal relationship at Level 2', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { note: string; level: number }) =>
          /IQ|Inuit Qaujimajatuqangit/i.test(r.note) && r.level === 2,
      );
      expect(rule).toBeDefined();
      expect(rule.level).toBe(2);
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

    it('should cover appalachian, cross-tradition, first-nations', () => {
      const traditions = allSessions.map((s) => s.tradition);
      expect(traditions).toContain('appalachian');
      expect(traditions).toContain('cross-tradition');
      expect(traditions).toContain('first-nations');
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

    it('beekeeping session should have bee sting safety annotation', () => {
      const stingStep = beekeepingSession.steps.find(
        (s: { safetyNote?: string }) => s.safetyNote?.match(/sting|allerg|EpiPen/i),
      );
      expect(stingStep).toBeDefined();
      expect(stingStep.safetyNote).toMatch(/sting|allerg|EpiPen/i);
    });

    it('tracking session should have Cree nation attribution', () => {
      const stepsWithCree = trackingSession.steps.filter(
        (s: { nationAttribution?: string }) => s.nationAttribution?.match(/Cree/),
      );
      expect(stepsWithCree.length).toBeGreaterThan(0);
    });

    it('tracking session should have Anishinaabe nation attribution', () => {
      const stepsWithAnishinaabe = trackingSession.steps.filter(
        (s: { nationAttribution?: string }) => s.nationAttribution?.match(/Anishinaabe/),
      );
      expect(stepsWithAnishinaabe.length).toBeGreaterThan(0);
    });

    it('tracking session should have predator safety note', () => {
      const predatorStep = trackingSession.steps.find(
        (s: { safetyNote?: string }) => s.safetyNote?.match(/predator|bear|cougar|run/i),
      );
      expect(predatorStep).toBeDefined();
      expect(predatorStep.safetyNote).toMatch(/predator|bear|cougar|run/i);
    });

    it('hide scraping session should have Cree attribution', () => {
      const stepsWithCree = hideSession.steps.filter(
        (s: { nationAttribution?: string }) => s.nationAttribution?.match(/Cree/),
      );
      expect(stepsWithCree.length).toBeGreaterThan(0);
    });

    it('hide scraping session should have Dene attribution', () => {
      const stepsWithDene = hideSession.steps.filter(
        (s: { nationAttribution?: string }) => s.nationAttribution?.match(/Dene/),
      );
      expect(stepsWithDene.length).toBeGreaterThan(0);
    });

    it('hide scraping session should NOT use generic "First Nations" without nation name', () => {
      const allHideText = allStepText(hideSession);
      // Should not begin with "First Nations brain-tanning" as a generic label
      // Must include specific nation attribution (Cree, Dene, Lakota, Crow)
      const hasSpecificAttribution = /Cree|Dene|Lakota|Crow/.test(allHideText);
      expect(hasSpecificAttribution).toBe(true);
    });

    it('hide scraping session should have tool safety annotation', () => {
      const toolStep = hideSession.steps.find(
        (s: { safetyNote?: string }) => s.safetyNote?.match(/tool|scraping|hand/i),
      );
      expect(toolStep).toBeDefined();
      expect(toolStep.safetyNote).toMatch(/tool|scraping|hand/i);
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

    it('should have Hunting SUMO term in at least one mapping', () => {
      const huntingMappings = sumoMappings.filter(
        (m: { sumoTerm: string; kifStatement: string }) =>
          m.sumoTerm === 'Hunting' || m.kifStatement.includes('Hunting'),
      );
      expect(huntingMappings.length).toBeGreaterThan(0);
    });

    it('should have Animal or DomesticAnimal SUMO term in at least one mapping', () => {
      const animalMappings = sumoMappings.filter(
        (m: { sumoTerm: string }) =>
          m.sumoTerm === 'Animal' || m.sumoTerm === 'DomesticAnimal',
      );
      expect(animalMappings.length).toBeGreaterThan(0);
    });

    it('should have HeritageSkill in at least one mapping', () => {
      const heritageSkillMappings = sumoMappings.filter(
        (m: { sumoTerm: string; kifStatement: string }) =>
          m.sumoTerm === 'HeritageSkill' || m.kifStatement.includes('HeritageSkill'),
      );
      expect(heritageSkillMappings.length).toBeGreaterThan(0);
    });

    it('should have BiologicalProcess in at least one mapping', () => {
      const bioMappings = sumoMappings.filter(
        (m: { sumoTerm: string; kifStatement: string }) =>
          m.sumoTerm === 'BiologicalProcess' || m.kifStatement.includes('BiologicalProcess'),
      );
      expect(bioMappings.length).toBeGreaterThan(0);
    });
  });
});
