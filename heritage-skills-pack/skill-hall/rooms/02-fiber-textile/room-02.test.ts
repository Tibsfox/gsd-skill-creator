/**
 * Tests for Room 02: Fiber & Textile
 *
 * Validates:
 * - room-spec.json: SkillModule structure, traditions, safety domains, 7+ modules,
 *   quillwork module at culturalLevel 2, Room 14 cross-reference present
 * - safety-config.json: ANNOTATE-only room (no gate/critical rules), 3 annotate rules
 *   covering needle/awl, spinning equipment, and dye plant toxicity
 * - cultural-config.json: 5 rules; quillwork technique Level 1, design patterns Level 2,
 *   Anishinaabe/Mi'kmaq attribution in quillwork rules, sinew/Inuit at Level 1
 * - Try Sessions: 3 beginner sessions (appalachian, inuit, first-nations), all 20 min,
 *   quillwork at culturalLevel 2, Anishinaabe attribution, awl safety, Room 14 cross-ref,
 *   drafting technique in spinning session, no generic pan-Indigenous language
 * - sumo-mappings.json: 8+ mappings with kifStatements, Weaving and Sewing SUMO terms
 *
 * @module heritage-skills-pack/skill-hall/rooms/02-fiber-textile/room-02.test
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

const spinningSession = JSON.parse(
  readFileSync(resolve(roomDir, 'try-sessions/basic-spinning-intro.json'), 'utf-8'),
);
const sinewSession = JSON.parse(
  readFileSync(resolve(roomDir, 'try-sessions/sinew-thread-splitting.json'), 'utf-8'),
);
const quillworkSession = JSON.parse(
  readFileSync(resolve(roomDir, 'try-sessions/quillwork-sampler-prep.json'), 'utf-8'),
);

const allSessions = [spinningSession, sinewSession, quillworkSession];

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Collect all string values from all steps of a session */
function allStepText(session: typeof spinningSession): string {
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

describe('Room 02: Fiber & Textile', () => {
  // ── room-spec.json ────────────────────────────────────────────────────────────

  describe('room-spec.json', () => {
    it('should have room number 2', () => {
      expect(roomSpec.room).toBe(2);
      expect(roomSpec.id).toBe('room-02-fiber-textile');
    });

    it('should have appalachian, first-nations, and inuit traditions', () => {
      expect(roomSpec.traditions).toContain('appalachian');
      expect(roomSpec.traditions).toContain('first-nations');
      expect(roomSpec.traditions).toContain('inuit');
    });

    it('should have tool safety domain only', () => {
      expect(roomSpec.safetyDomains).toContain('tool');
      expect(roomSpec.safetyDomains).toHaveLength(1);
    });

    it('should have 7+ content modules', () => {
      expect(roomSpec.modules.length).toBeGreaterThanOrEqual(7);
    });

    it('should have quillwork module at culturalLevel 2', () => {
      const quillworkModule = roomSpec.modules.find(
        (m: { id: string }) => m.id === 'fiber-02-fn-quillwork',
      );
      expect(quillworkModule).toBeDefined();
      expect(quillworkModule.culturalLevel).toBe(2);
    });

    it('should have sinew sewing module', () => {
      const sinewModule = roomSpec.modules.find(
        (m: { id: string }) => m.id === 'fiber-02-inuit-sinew-sewing',
      );
      expect(sinewModule).toBeDefined();
      expect(sinewModule.tradition).toBe('inuit');
    });

    it('should have waterproof seam cross-reference module or description', () => {
      const crossrefModule = roomSpec.modules.find(
        (m: { id: string; description?: string }) =>
          m.id === 'fiber-02-waterproof-crossref' ||
          (m.description && /Room 14/.test(m.description)),
      );
      expect(crossrefModule).toBeDefined();
    });

    it('should have birchbark biting module', () => {
      const birchbarkModule = roomSpec.modules.find(
        (m: { id: string }) => m.id === 'fiber-02-fn-birchbark-biting',
      );
      expect(birchbarkModule).toBeDefined();
    });

    it('should reference Room 14 for waterproof seams', () => {
      const specString = JSON.stringify(roomSpec);
      expect(specString).toMatch(/Room 14/);
    });

    it('should have MILO in sumoFile array', () => {
      expect(roomSpec.sumoFile).toContain('MILO');
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

    it('should have 3+ annotate rules', () => {
      expect(safetyConfig.annotateRules.length).toBeGreaterThanOrEqual(3);
    });

    it('should have needle/awl annotate rule', () => {
      const rule = safetyConfig.annotateRules.find(
        (r: { id: string }) => r.id === 'ROOM02-ANN-001',
      );
      expect(rule).toBeDefined();
      expect(rule.action).toMatch(/ANNOTATE/);
    });

    it('should have spinning equipment annotate rule', () => {
      const rule = safetyConfig.annotateRules.find(
        (r: { id: string }) => r.id === 'ROOM02-ANN-002',
      );
      expect(rule).toBeDefined();
      expect(rule.trigger).toMatch(/spindle|wheel/i);
    });

    it('should have natural dye toxicity annotate rule', () => {
      const rule = safetyConfig.annotateRules.find(
        (r: { id: string }) => r.id === 'ROOM02-ANN-003',
      );
      expect(rule).toBeDefined();
      expect(rule.action).toMatch(/gloves|toxic/i);
    });
  });

  // ── cultural-config.json ──────────────────────────────────────────────────────

  describe('cultural-config.json', () => {
    it('should have 5 cultural rules', () => {
      expect(culturalConfig.culturalRules).toHaveLength(5);
    });

    it('should have quillwork technique at Level 1', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { concept: string; level: number }) =>
          /quillwork technique/i.test(r.concept) && r.level === 1,
      );
      expect(rule).toBeDefined();
    });

    it('should have quillwork design patterns at Level 2', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { concept: string; level: number }) =>
          /design pattern|symbolism/i.test(r.concept) && r.level === 2,
      );
      expect(rule).toBeDefined();
    });

    it('should have Anishinaabe attribution in quillwork rules', () => {
      const hasAnishinaabe = culturalConfig.culturalRules.some(
        (r: { nationAttribution?: string }) => r.nationAttribution && /Anishinaabe/.test(r.nationAttribution),
      );
      expect(hasAnishinaabe).toBe(true);
    });

    it("should have Mi'kmaq attribution in quillwork rules", () => {
      const hasMikmaq = culturalConfig.culturalRules.some(
        (r: { nationAttribution?: string }) =>
          r.nationAttribution && /Mi.kmaq/.test(r.nationAttribution),
      );
      expect(hasMikmaq).toBe(true);
    });

    it('should have sinew/Inuit rule at Level 1', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { concept: string; tradition: string; level: number }) =>
          /sinew/i.test(r.concept) && r.tradition === 'inuit' && r.level === 1,
      );
      expect(rule).toBeDefined();
    });
  });

  // ── Try Sessions ──────────────────────────────────────────────────────────────

  describe('Try Sessions', () => {
    it('should have 3 Try Sessions loaded', () => {
      expect(allSessions).toHaveLength(3);
    });

    it('should cover appalachian, inuit, and first-nations traditions', () => {
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

    it('should all have estimatedMinutes between 15 and 25', () => {
      for (const session of allSessions) {
        expect(session.estimatedMinutes).toBeGreaterThanOrEqual(15);
        expect(session.estimatedMinutes).toBeLessThanOrEqual(25);
      }
    });

    it('quillwork session should be culturalLevel 2', () => {
      expect(quillworkSession.culturalLevel).toBe(2);
    });

    it('quillwork session should have Anishinaabe nation attribution', () => {
      const hasAnishinaabe = quillworkSession.steps.some(
        (s: { nationAttribution?: string }) =>
          s.nationAttribution && /Anishinaabe/.test(s.nationAttribution),
      );
      expect(hasAnishinaabe).toBe(true);
    });

    it("quillwork session should have Mi'kmaq attribution", () => {
      const allQuillText = allStepText(quillworkSession);
      expect(allQuillText).toMatch(/Mi.kmaq/);
    });

    it('quillwork session should have awl safety annotation', () => {
      const awlStep = quillworkSession.steps.find(
        (s: { safetyNote?: string }) => s.safetyNote && /awl|sharp|pointed/i.test(s.safetyNote),
      );
      expect(awlStep).toBeDefined();
    });

    it('quillwork session should note design patterns have cultural meaning', () => {
      const allQuillText = allStepText(quillworkSession);
      expect(allQuillText).toMatch(/cultural.*meaning|meaning.*cultural/i);
    });

    it('sinew session should have Inuit attribution', () => {
      const hasInuit = sinewSession.steps.some(
        (s: { nationAttribution?: string }) => s.nationAttribution === 'Inuit',
      );
      expect(hasInuit).toBe(true);
    });

    it('sinew session should reference Room 14 for waterproof seams', () => {
      const allSinewText = allStepText(sinewSession);
      expect(allSinewText).toMatch(/Room 14/);
    });

    it('sinew session should have needle safety annotation', () => {
      const needleStep = sinewSession.steps.find(
        (s: { safetyNote?: string }) =>
          s.safetyNote && /needle|bone|thimble/i.test(s.safetyNote),
      );
      expect(needleStep).toBeDefined();
    });

    it('spinning session should describe drafting technique', () => {
      const allSpinningText = allStepText(spinningSession);
      expect(allSpinningText).toMatch(/draft/i);
    });

    it('spinning session should have spindle safety annotation', () => {
      const spindleStep = spinningSession.steps.find(
        (s: { safetyNote?: string }) =>
          s.safetyNote && /spindle|whorl/i.test(s.safetyNote),
      );
      expect(spindleStep).toBeDefined();
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

    it('should have Weaving SUMO term in at least one mapping', () => {
      const weavingMappings = sumoMappings.filter(
        (m: { sumoTerm: string }) => m.sumoTerm === 'Weaving',
      );
      expect(weavingMappings.length).toBeGreaterThan(0);
    });

    it('should have Sewing SUMO term in at least one mapping', () => {
      const sewingMappings = sumoMappings.filter(
        (m: { sumoTerm: string }) => m.sumoTerm === 'Sewing',
      );
      expect(sewingMappings.length).toBeGreaterThan(0);
    });

    it('should have HeritageSkill in at least one mapping', () => {
      const heritageSkillMappings = sumoMappings.filter(
        (m: { sumoTerm: string; kifStatement: string }) =>
          m.sumoTerm === 'HeritageSkill' || m.kifStatement.includes('HeritageSkill'),
      );
      expect(heritageSkillMappings.length).toBeGreaterThan(0);
    });

    it('should have Fabric SUMO term in at least one mapping', () => {
      const fabricMappings = sumoMappings.filter(
        (m: { sumoTerm: string }) => m.sumoTerm === 'Fabric',
      );
      expect(fabricMappings.length).toBeGreaterThan(0);
    });
  });
});
