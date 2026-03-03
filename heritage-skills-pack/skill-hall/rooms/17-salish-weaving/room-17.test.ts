/**
 * Tests for Room 17: Salish Weaving and Design
 *
 * Validates:
 * - room-spec.json: 6 modules, tool-only safety domain (no marine), post-contact Cowichan,
 *   formline culturalLevel 2, basketry 3+ nations, woolly dog mention, no ontologicalBridges
 * - safety-config.json: annotate-only (0 gate, 0 critical, 3 annotate rules)
 * - cultural-config.json: 6 rules, family-owned designs L2 summarize-and-refer,
 *   Cowichan post-contact L1 include, spindle whorl L2, formline distinction, basketry nations
 * - Try Sessions: 3 beginner, formline culturalLevel 2, basketry 3+ nations, loom woolly dog,
 *   formline distinction from northern, no generic pan-Indigenous language
 * - sumo-mappings.json: 9 mappings with kifStatements, HeritageSkill, Artifact, MaterialCulture
 *
 * @module heritage-skills-pack/skill-hall/rooms/17-salish-weaving/room-17.test
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

const loomSession = JSON.parse(
  readFileSync(resolve(roomDir, 'try-sessions/two-bar-loom-intro.json'), 'utf-8'),
);
const basketrySession = JSON.parse(
  readFileSync(resolve(roomDir, 'try-sessions/cedar-root-basketry.json'), 'utf-8'),
);
const formlineSession = JSON.parse(
  readFileSync(resolve(roomDir, 'try-sessions/formline-design-principles.json'), 'utf-8'),
);
const allSessions = [loomSession, basketrySession, formlineSession];

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Collect all string values from all steps of a session */
function allStepText(session: typeof loomSession): string {
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

describe('Room 17: Salish Weaving and Design', () => {
  // ── room-spec.json ────────────────────────────────────────────────────────────

  describe('room-spec.json', () => {
    it('should have room number 17 and correct id', () => {
      expect(roomSpec.room).toBe(17);
      expect(roomSpec.id).toBe('room-17-salish-weaving');
    });

    it('should have first-nations tradition', () => {
      expect(roomSpec.traditions).toContain('first-nations');
    });

    it('should have tool safety domain but NOT marine', () => {
      expect(roomSpec.safetyDomains).toContain('tool');
      expect(roomSpec.safetyDomains).not.toContain('marine');
    });

    it('should have exactly 6 modules', () => {
      expect(roomSpec.modules).toHaveLength(6);
    });

    it('should NOT have ontologicalBridges field', () => {
      expect(roomSpec.ontologicalBridges).toBeUndefined();
    });

    it('cowichan-knitting module description should mention post-contact', () => {
      const module = roomSpec.modules.find(
        (m: { id: string }) => m.id === 'weaving-17-cowichan-knitting',
      );
      expect(module).toBeDefined();
      expect(module.description).toMatch(/post.contact/i);
    });

    it('formline module should have culturalLevel 2', () => {
      const module = roomSpec.modules.find(
        (m: { id: string }) => m.id === 'weaving-17-formline',
      );
      expect(module).toBeDefined();
      expect(module.culturalLevel).toBe(2);
    });

    it('cedar basketry module should mention at least 3 distinct nations', () => {
      const module = roomSpec.modules.find(
        (m: { id: string }) => m.id === 'weaving-17-cedar-basketry',
      );
      expect(module).toBeDefined();
      const text = module.description;
      // Must contain Coast Salish (or Stó:lō), Nuu-chah-nulth, and Nlaka
      const hasCoastSalish = /Coast Salish|Stó:lō|Musqueam/.test(text);
      const hasNuuchahNulth = /Nuu-chah-nulth/.test(text);
      const hasNlakaPamux = /Nlaka|Thompson/.test(text);
      expect(hasCoastSalish).toBe(true);
      expect(hasNuuchahNulth).toBe(true);
      expect(hasNlakaPamux).toBe(true);
    });

    it('mountain-goat-wool module should mention woolly dog and extinct', () => {
      const module = roomSpec.modules.find(
        (m: { id: string }) => m.id === 'weaving-17-mountain-goat-wool',
      );
      expect(module).toBeDefined();
      expect(module.description).toMatch(/woolly dog/i);
      expect(module.description).toMatch(/extinct/i);
    });
  });

  // ── safety-config.json ────────────────────────────────────────────────────────

  describe('safety-config.json', () => {
    it('should have isCritical false', () => {
      expect(safetyConfig.isCritical).toBe(false);
    });

    it('should have empty gateRules array', () => {
      expect(safetyConfig.gateRules).toEqual([]);
    });

    it('should have empty criticalRules array', () => {
      expect(safetyConfig.criticalRules).toEqual([]);
    });

    it('should have exactly 3 annotate rules', () => {
      expect(safetyConfig.annotateRules).toHaveLength(3);
    });

    it('ROOM17-ANN-001 should mention cedar root or splitting', () => {
      const rule = safetyConfig.annotateRules.find(
        (r: { id: string }) => r.id === 'ROOM17-ANN-001',
      );
      expect(rule).toBeDefined();
      expect(rule.action).toMatch(/cedar root|splitting/i);
    });

    it('ROOM17-ANN-002 should mention spindle or wrist', () => {
      const rule = safetyConfig.annotateRules.find(
        (r: { id: string }) => r.id === 'ROOM17-ANN-002',
      );
      expect(rule).toBeDefined();
      expect(rule.action).toMatch(/spindle|wrist/i);
    });
  });

  // ── cultural-config.json ──────────────────────────────────────────────────────

  describe('cultural-config.json', () => {
    it('should have exactly 6 cultural rules', () => {
      expect(culturalConfig.culturalRules).toHaveLength(6);
    });

    it('ROOM17-CULT-002 should be level 2 with action summarize-and-refer', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { id: string }) => r.id === 'ROOM17-CULT-002',
      );
      expect(rule).toBeDefined();
      expect(rule.level).toBe(2);
      expect(rule.action).toBe('summarize-and-refer');
    });

    it('ROOM17-CULT-003 should mention post-contact and Cowichan or Quw\'utsun\'', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { id: string }) => r.id === 'ROOM17-CULT-003',
      );
      expect(rule).toBeDefined();
      expect(rule.note).toMatch(/post.contact/i);
      expect(rule.note + rule.nationAttribution).toMatch(/Cowichan|Quw'utsun'/i);
    });

    it('ROOM17-CULT-003 action should be include (post-contact is Level 1)', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { id: string }) => r.id === 'ROOM17-CULT-003',
      );
      expect(rule).toBeDefined();
      expect(rule.action).toBe('include');
    });

    it('ROOM17-CULT-004 spindle whorl should be level 2', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { id: string }) => r.id === 'ROOM17-CULT-004',
      );
      expect(rule).toBeDefined();
      expect(rule.level).toBe(2);
    });

    it('ROOM17-CULT-005 concept should match formline or design', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { id: string }) => r.id === 'ROOM17-CULT-005',
      );
      expect(rule).toBeDefined();
      expect(rule.concept).toMatch(/formline|design/i);
    });

    it('ROOM17-CULT-006 nationAttribution should include Nuu-chah-nulth and Nlaka or Thompson', () => {
      const rule = culturalConfig.culturalRules.find(
        (r: { id: string }) => r.id === 'ROOM17-CULT-006',
      );
      expect(rule).toBeDefined();
      expect(rule.nationAttribution).toMatch(/Nuu-chah-nulth/);
      expect(rule.nationAttribution).toMatch(/Nlaka|Thompson/);
    });

    it('all Level 2+ rules should have action summarize-and-refer or acknowledge-and-redirect', () => {
      const level2Rules = culturalConfig.culturalRules.filter(
        (r: { level: number }) => r.level >= 2,
      );
      expect(level2Rules.length).toBeGreaterThanOrEqual(3);
      for (const rule of level2Rules) {
        expect(['summarize-and-refer', 'acknowledge-and-redirect']).toContain(rule.action);
      }
    });
  });

  // ── Try Sessions ──────────────────────────────────────────────────────────────

  describe('Try Sessions', () => {
    it('all 3 sessions should have difficulty beginner', () => {
      for (const session of allSessions) {
        expect(session.difficulty).toBe('beginner');
      }
    });

    it('formlineSession should have culturalLevel 2', () => {
      expect(formlineSession.culturalLevel).toBe(2);
    });

    it('basketrySession should have a step mentioning Nuu-chah-nulth', () => {
      const text = allStepText(basketrySession);
      expect(text).toMatch(/Nuu-chah-nulth/);
    });

    it('basketrySession should have a step mentioning Nlaka or Thompson', () => {
      const text = allStepText(basketrySession);
      expect(text).toMatch(/Nlaka|Thompson/);
    });

    it('basketrySession should have a step mentioning Coast Salish', () => {
      const text = allStepText(basketrySession);
      expect(text).toMatch(/Coast Salish/);
    });

    it('formlineSession step text should mention northern or Haida (the distinction)', () => {
      const text = allStepText(formlineSession);
      expect(text).toMatch(/northern|Haida/i);
    });

    it('loomSession should mention woolly dog', () => {
      const text = allStepText(loomSession);
      expect(text).toMatch(/woolly dog/i);
    });

    it('no session text should contain "Native American" without nation name', () => {
      const allText = allSessionText();
      expect(allText).not.toMatch(/\bNative American\b/);
    });

    it('no session text should contain "Indigenous peoples" without nation name', () => {
      const allText = allSessionText();
      expect(allText).not.toMatch(/\bIndigenous peoples\b/);
    });
  });

  // ── sumo-mappings.json ────────────────────────────────────────────────────────

  describe('sumo-mappings.json', () => {
    it('should have 8 or more mappings', () => {
      expect(sumoMappings.length).toBeGreaterThanOrEqual(8);
    });

    it('all mappings should have kifStatement', () => {
      for (const mapping of sumoMappings) {
        expect(mapping.kifStatement).toBeDefined();
        expect(typeof mapping.kifStatement).toBe('string');
        expect(mapping.kifStatement.length).toBeGreaterThan(0);
      }
    });

    it('all mappings should have naturalLanguage', () => {
      for (const mapping of sumoMappings) {
        expect(mapping.naturalLanguage).toBeDefined();
        expect(mapping.naturalLanguage.length).toBeGreaterThan(0);
      }
    });

    it('at least one mapping should have sumoTerm HeritageSkill or kifStatement includes HeritageSkill', () => {
      const heritageSkillMappings = sumoMappings.filter(
        (m: { sumoTerm: string; kifStatement: string }) =>
          m.sumoTerm === 'HeritageSkill' || m.kifStatement.includes('HeritageSkill'),
      );
      expect(heritageSkillMappings.length).toBeGreaterThan(0);
    });

    it('at least one mapping should have sumoTerm Artifact', () => {
      const artifactMappings = sumoMappings.filter(
        (m: { sumoTerm: string }) => m.sumoTerm === 'Artifact',
      );
      expect(artifactMappings.length).toBeGreaterThan(0);
    });

    it('at least one mapping should have sumoTerm MaterialCulture or kifStatement includes MaterialCulture', () => {
      const materialCultureMappings = sumoMappings.filter(
        (m: { sumoTerm: string; kifStatement: string }) =>
          m.sumoTerm === 'MaterialCulture' || m.kifStatement.includes('MaterialCulture'),
      );
      expect(materialCultureMappings.length).toBeGreaterThan(0);
    });
  });
});
